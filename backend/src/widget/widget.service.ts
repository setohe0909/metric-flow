import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWidgetDto, UpdateWidgetDto } from './dto/widget.dto';

@Injectable()
export class WidgetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, dto: CreateWidgetDto) {
    // 1. Validar dashboard pertenece a la org activa
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { id: dto.dashboardId, organizationId: orgId },
    });
    if (!dashboard) {
      throw new BadRequestException(
        'El dashboard especificado no pertenece a esta organización.',
      );
    }

    if (dto.pageId) {
      const page = await this.prisma.dashboardPage.findFirst({
        where: {
          id: dto.pageId,
          dashboardId: dto.dashboardId,
          dashboard: { organizationId: orgId },
        },
      });
      if (!page) {
        throw new BadRequestException(
          'La página especificada no pertenece a este dashboard.',
        );
      }
    }

    // 2. Validar query pertenece a la org activa (si se provee)
    if (dto.queryId) {
      const query = await this.prisma.query.findFirst({
        where: { id: dto.queryId, organizationId: orgId },
      });
      if (!query) {
        throw new BadRequestException(
          'La consulta especificada no pertenece a esta organización.',
        );
      }
    }

    return this.prisma.widget.create({
      data: {
        dashboardId: dto.dashboardId,
        pageId: dto.pageId,
        queryId: dto.queryId,
        title: dto.title,
        type: dto.type,
        chartConfig: dto.chartConfig,
        configVersion: dto.configVersion ?? 1,
        dataConfig: dto.dataConfig,
        visualConfig: dto.visualConfig,
        interactionConfig: dto.interactionConfig,
        layoutX: dto.layoutX ?? 0,
        layoutY: dto.layoutY ?? 0,
        layoutW: dto.layoutW ?? 6, // por defecto 6 columnas
        layoutH: dto.layoutH ?? 4, // por defecto 4 filas
      },
    });
  }

  async update(orgId: string, id: string, dto: UpdateWidgetDto) {
    // Validar existencia y ownership
    const widget = await this.prisma.widget.findFirst({
      where: {
        id,
        dashboard: { organizationId: orgId },
      },
    });

    if (!widget) {
      throw new BadRequestException('Widget no encontrado.');
    }

    if (dto.pageId) {
      const page = await this.prisma.dashboardPage.findFirst({
        where: {
          id: dto.pageId,
          dashboardId: widget.dashboardId,
          dashboard: { organizationId: orgId },
        },
      });
      if (!page) {
        throw new BadRequestException(
          'La página especificada no pertenece a este dashboard.',
        );
      }
    }

    return this.prisma.widget.update({
      where: { id },
      data: {
        title: dto.title,
        type: dto.type,
        pageId: dto.pageId,
        chartConfig: dto.chartConfig,
        configVersion: dto.configVersion,
        dataConfig: dto.dataConfig,
        visualConfig: dto.visualConfig,
        interactionConfig: dto.interactionConfig,
        layoutX: dto.layoutX,
        layoutY: dto.layoutY,
        layoutW: dto.layoutW,
        layoutH: dto.layoutH,
      },
    });
  }

  async remove(orgId: string, id: string) {
    const widget = await this.prisma.widget.findFirst({
      where: {
        id,
        dashboard: { organizationId: orgId },
      },
    });

    if (!widget) {
      throw new BadRequestException('Widget no encontrado.');
    }

    await this.prisma.widget.delete({
      where: { id },
    });

    return { success: true };
  }
}
