import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatasourceService } from '../datasource/datasource.service';
import { QueryEngineService } from '../query-engine/query-engine.service';
import { RunQueryDto, SaveQueryDto } from './dto/queries.dto';

@Injectable()
export class QueriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datasourceService: DatasourceService,
    private readonly queryEngine: QueryEngineService
  ) {}

  async runRaw(orgId: string, userId: string, dto: RunQueryDto) {
    // 1. Obtener conector desencriptado
    const datasource = await this.datasourceService.findOne(orgId, dto.datasourceId);

    const startTime = Date.now();
    try {
      // 2. Ejecutar consulta
      const result = await this.queryEngine.executeQuery(
        datasource.type,
        datasource.connectionSettings,
        dto.querySql,
        datasource.id,
        orgId
      );

      const durationMs = Date.now() - startTime;

      // 3. Registrar auditoría (éxito) en la tabla `executions`
      await this.prisma.execution.create({
        data: {
          organizationId: orgId,
          userId,
          sqlExecuted: dto.querySql,
          durationMs,
          rowCount: result.rowCount,
          status: 'success',
        },
      }).catch((e) => console.error('Fallo al guardar log de auditoría:', e));

      return {
        ...result,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      
      // Registrar auditoría (error) en la tabla `executions`
      await this.prisma.execution.create({
        data: {
          organizationId: orgId,
          userId,
          sqlExecuted: dto.querySql,
          durationMs,
          rowCount: 0,
          status: 'error',
          errorMessage: error.message,
        },
      }).catch((e) => console.error('Fallo al guardar log de auditoría:', e));

      throw error;
    }
  }

  // --- SPRINT 3 PREPARATION: CRUD de queries guardadas ---
  async create(orgId: string, userId: string, dto: SaveQueryDto) {
    // Validar existencia del datasource
    await this.datasourceService.findOne(orgId, dto.datasourceId);

    return this.prisma.query.create({
      data: {
        organizationId: orgId,
        datasourceId: dto.datasourceId,
        name: dto.name,
        description: dto.description,
        querySql: dto.querySql,
        createdByUserId: userId,
      },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.query.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const query = await this.prisma.query.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!query) {
      throw new BadRequestException('Consulta no encontrada');
    }
    return query;
  }

  async remove(orgId: string, id: string) {
    const query = await this.findOne(orgId, id);
    await this.prisma.query.delete({ where: { id: query.id } });
    return { success: true };
  }
}
