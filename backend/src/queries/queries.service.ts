import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatasourceService } from '../datasource/datasource.service';
import { QueryEngineService } from '../query-engine/query-engine.service';
import { FilteringService } from '../datasource/filtering.service';
import { RunQueryDto, SaveQueryDto } from './dto/queries.dto';

@Injectable()
export class QueriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datasourceService: DatasourceService,
    private readonly queryEngine: QueryEngineService,
    private readonly filteringService: FilteringService,
  ) {}

  async runRaw(orgId: string, userId: string, userRole: string, dto: RunQueryDto) {
    // 1. Obtener conector desencriptado (ahora incluye accessPolicies)
    const datasource = await this.datasourceService.findOne(orgId, dto.datasourceId);

    // 2. Resolver política y pre-procesar el SQL con row filter si aplica
    const { wrappedSql, policy, isFiltered } = this.filteringService.resolveForRole(
      dto.querySql,
      datasource.accessPolicies,
      userRole,
    );

    const startTime = Date.now();
    try {
      // 3. Ejecutar el SQL (posiblemente envuelto con WHERE de row filter)
      const rawResult = await this.queryEngine.executeQuery(
        datasource.type,
        datasource.connectionSettings,
        wrappedSql,
        datasource.id,
        orgId,
      );

      // 4. Post-procesado: filtrar columnas no permitidas
      const result = this.filteringService.filterColumns(rawResult, policy.allowedColumns);

      const durationMs = Date.now() - startTime;

      // 5. Registrar auditoría (éxito)
      await this.prisma.execution
        .create({
          data: {
            organizationId: orgId,
            userId,
            sqlExecuted: dto.querySql, // Guardamos el SQL original, no el envuelto
            durationMs,
            rowCount: result.rowCount,
            status: 'success',
          },
        })
        .catch((e) => console.error('Fallo al guardar log de auditoría:', e));

      return {
        ...result,
        durationMs,
        // Metadata de filtrado para que el frontend pueda mostrar el aviso
        filtered: isFiltered,
        appliedPolicy: isFiltered
          ? {
              rowFilter: policy.rowFilter,
              allowedColumns: policy.allowedColumns,
            }
          : null,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Registrar auditoría (error)
      await this.prisma.execution
        .create({
          data: {
            organizationId: orgId,
            userId,
            sqlExecuted: dto.querySql,
            durationMs,
            rowCount: 0,
            status: 'error',
            errorMessage: error.message,
          },
        })
        .catch((e) => console.error('Fallo al guardar log de auditoría:', e));

      throw error;
    }
  }

  // --- CRUD de queries guardadas ---
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
