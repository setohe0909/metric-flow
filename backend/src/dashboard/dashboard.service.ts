import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDashboardDto, UpdateDashboardDto } from './dto/dashboard.dto';
import { DatasourceService } from '../datasource/datasource.service';
import { QueryEngineService } from '../query-engine/query-engine.service';
import * as crypto from 'crypto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datasourceService: DatasourceService,
    private readonly queryEngine: QueryEngineService,
  ) {}

  async create(orgId: string, userId: string, dto: CreateDashboardDto) {
    return this.prisma.dashboard.create({
      data: {
        organizationId: orgId,
        createdByUserId: userId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.dashboard.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { id, organizationId: orgId },
      include: {
        widgets: {
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dashboard) {
      throw new BadRequestException('Dashboard no encontrado');
    }

    return dashboard;
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

  async updateLayout(orgId: string, id: string, layouts: { id: string; x: number; y: number; w: number; h: number }[]) {
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
        })
      )
    );
  }

  async togglePublic(orgId: string, id: string, isPublic: boolean) {
    const dashboard = await this.findOne(orgId, id);
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
      include: {
        widgets: {
          include: {
            query: {
              select: {
                id: true,
                name: true,
                datasourceId: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dashboard) {
      throw new BadRequestException('Dashboard compartido no encontrado o privado.');
    }

    return dashboard;
  }

  async getPublicWidgetData(token: string, widgetId: string): Promise<any> {
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { shareToken: token, isPublic: true },
    });
    if (!dashboard) {
      throw new BadRequestException('Dashboard compartido no encontrado o privado.');
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
      throw new BadRequestException('Consulta no vinculada a un origen de datos.');
    }

    const datasource = await this.datasourceService.findOne(
      dashboard.organizationId,
      widget.query.datasourceId,
    );

    const result = await this.queryEngine.executeQuery(
      datasource.type,
      datasource.connectionSettings,
      widget.query.querySql,
      datasource.id,
      dashboard.organizationId,
    );

    return result;
  }
}
