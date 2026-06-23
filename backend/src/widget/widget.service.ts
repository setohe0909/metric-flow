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
        queryId: dto.queryId,
        title: dto.title,
        type: dto.type,
        chartConfig: dto.chartConfig,
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

    return this.prisma.widget.update({
      where: { id },
      data: {
        title: dto.title,
        type: dto.type,
        chartConfig: dto.chartConfig,
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
