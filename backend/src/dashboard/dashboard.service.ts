import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDashboardDto, UpdateDashboardDto } from './dto/dashboard.dto';
import * as crypto from 'crypto';
import { QueriesService } from '../queries/queries.service';
import { AuditService } from '../audit/audit.service';

const DASHBOARD_LIST_VIEW = {
  id: true,
  name: true,
  description: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const SAFE_WIDGET_VIEW = {
  id: true,
  pageId: true,
  title: true,
  type: true,
  chartConfig: true,
  configVersion: true,
  dataConfig: true,
  visualConfig: true,
  interactionConfig: true,
  layoutX: true,
  layoutY: true,
  layoutW: true,
  layoutH: true,
  createdAt: true,
  updatedAt: true,
} as const;

const DASHBOARD_DETAIL_VIEW = {
  ...DASHBOARD_LIST_VIEW,
  config: true,
  pages: {
    select: {
      id: true,
      title: true,
      slug: true,
      icon: true,
      order: true,
      config: true,
      createdAt: true,
      updatedAt: true,
      widgets: {
        select: SAFE_WIDGET_VIEW,
        orderBy: { createdAt: 'asc' as const },
      },
    },
    orderBy: { order: 'asc' as const },
  },
  widgets: {
    select: SAFE_WIDGET_VIEW,
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queriesService: QueriesService,
    private readonly auditService: AuditService,
  ) {}

  async create(orgId: string, userId: string, dto: CreateDashboardDto) {
    return this.prisma.dashboard.create({
      data: {
        organizationId: orgId,
        createdByUserId: userId,
        name: dto.name,
        description: dto.description,
        pages: {
          create: {
            title: 'Resumen',
            slug: 'resumen',
            icon: 'layout-dashboard',
            order: 0,
          },
        },
      },
    });
  }

  async findAll(orgId: string, role: string) {
    if (role === 'READER') {
      return this.prisma.dashboard.findMany({
        where: {
          organizationId: orgId,
          publishedAt: { not: null },
        },
        select: DASHBOARD_LIST_VIEW,
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.dashboard.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string, role = 'ADMIN') {
    if (role === 'READER') {
      const dashboard = await this.prisma.dashboard.findFirst({
        where: {
          id,
          organizationId: orgId,
          publishedAt: { not: null },
        },
        select: DASHBOARD_DETAIL_VIEW,
      });
      if (!dashboard) {
        throw new BadRequestException('Dashboard no encontrado');
      }
      return dashboard;
    }

    const where = {
      id,
      organizationId: orgId,
    };
    const widgets = {
      include: {
        query: {
          select: {
            id: true,
            name: true,
            querySql: true,
            datasourceId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' as const },
    };
    const pages = {
      include: {
        widgets,
      },
      orderBy: { order: 'asc' as const },
    };
    const dashboard = await this.prisma.dashboard.findFirst({
      where,
      include: { pages, widgets },
    });

    if (!dashboard) {
      throw new BadRequestException('Dashboard no encontrado');
    }

    return dashboard;
  }

  async setPublished(
    orgId: string,
    userId: string | null,
    id: string,
    published: boolean,
  ) {
    const result = await this.prisma.dashboard.updateMany({
      where: { id, organizationId: orgId },
      data: { publishedAt: published ? new Date() : null },
    });
    if (result.count === 0) {
      throw new BadRequestException('Dashboard no encontrado');
    }
    await this.auditService.log({
      organizationId: orgId,
      userId,
      action: published ? 'DASHBOARD_PUBLISHED' : 'DASHBOARD_UNPUBLISHED',
      resourceType: 'dashboard',
      resourceId: id,
      metadata: {},
    });
    return this.prisma.dashboard.findUnique({ where: { id } });
  }

  async getWidgetData(
    orgId: string,
    dashboardId: string,
    widgetId: string,
    userId: string,
    role: string,
  ) {
    await this.findOne(orgId, dashboardId, role);
    const widget = await this.prisma.widget.findFirst({
      where: {
        id: widgetId,
        dashboardId,
        dashboard: { organizationId: orgId },
      },
      include: { query: true },
    });
    if (!widget?.query?.datasourceId) {
      throw new BadRequestException('Widget o consulta no encontrada.');
    }

    return this.queriesService.runRaw(orgId, userId, role, {
      datasourceId: widget.query.datasourceId,
      querySql: widget.query.querySql,
    });
  }

  async update(orgId: string, id: string, dto: UpdateDashboardDto) {
    // Verificar existencia primero
    await this.findOne(orgId, id);

    return this.prisma.dashboard.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async remove(orgId: string, id: string) {
    const dashboard = await this.findOne(orgId, id);
    await this.prisma.dashboard.delete({
      where: { id: dashboard.id },
    });
    return { success: true };
  }

  async updateLayout(
    orgId: string,
    id: string,
    layouts: { id: string; x: number; y: number; w: number; h: number }[],
  ) {
    await this.findOne(orgId, id);

    return this.prisma.$transaction(
      layouts.map((l) =>
        this.prisma.widget.updateMany({
          where: {
            id: l.id,
            dashboardId: id,
          },
          data: {
            layoutX: l.x,
            layoutY: l.y,
            layoutW: l.w,
            layoutH: l.h,
          },
        }),
      ),
    );
  }

  async togglePublic(orgId: string, id: string, isPublic: boolean) {
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true, shareToken: true },
    });
    if (!dashboard) {
      throw new BadRequestException('Dashboard no encontrado');
    }
    let shareToken = dashboard.shareToken;

    if (isPublic && !shareToken) {
      shareToken = crypto.randomBytes(24).toString('hex');
    } else if (!isPublic) {
      shareToken = null;
    }

    return this.prisma.dashboard.update({
      where: { id },
      data: {
        isPublic,
        shareToken,
      },
    });
  }

  async getPublicDashboard(token: string) {
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { shareToken: token, isPublic: true },
      select: {
        organizationId: true,
        ...DASHBOARD_DETAIL_VIEW,
      },
    });

    if (!dashboard) {
      throw new BadRequestException(
        'Dashboard compartido no encontrado o privado.',
      );
    }

    const { organizationId, ...publicDashboard } = dashboard;

    await this.auditService.log({
      organizationId,
      userId: null,
      action: 'DASHBOARD_PUBLIC_VIEWED',
      resourceType: 'dashboard-share',
      resourceId: token,
      metadata: {
        dashboardId: dashboard.id,
      },
    });

    return publicDashboard;
  }

  async getPublicWidgetData(token: string, widgetId: string): Promise<any> {
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { shareToken: token, isPublic: true },
    });
    if (!dashboard) {
      throw new BadRequestException(
        'Dashboard compartido no encontrado o privado.',
      );
    }

    const widget = await this.prisma.widget.findFirst({
      where: { id: widgetId, dashboardId: dashboard.id },
      include: {
        query: true,
      },
    });

    if (!widget || !widget.query) {
      throw new BadRequestException('Widget o consulta no encontrada.');
    }

    if (!widget.query.datasourceId) {
      throw new BadRequestException(
        'Consulta no vinculada a un origen de datos.',
      );
    }

    return this.queriesService.runRaw(
      dashboard.organizationId,
      null,
      'READER',
      {
        datasourceId: widget.query.datasourceId,
        querySql: widget.query.querySql,
      },
    );
  }
}
