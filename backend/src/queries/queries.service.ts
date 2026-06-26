import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DatasourceService } from '../datasource/datasource.service';
import { QueryEngineService } from '../query-engine/query-engine.service';
import { FilteringService } from '../datasource/filtering.service';
import { RunQueryDto, SaveQueryDto } from './dto/queries.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class QueriesService {
  private readonly logger = new Logger(QueriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly datasourceService: DatasourceService,
    private readonly queryEngine: QueryEngineService,
    private readonly filteringService: FilteringService,
    private readonly auditService: AuditService,
  ) {}

  async runRaw(
    orgId: string,
    userId: string | null,
    userRole: string,
    dto: RunQueryDto,
  ) {
    const executionId = dto.executionId ?? randomUUID();

    // 1. Obtener conector desencriptado (ahora incluye accessPolicies)
    const datasource = await this.datasourceService.findOne(
      orgId,
      dto.datasourceId,
    );

    // 2. Resolver política y pre-procesar el SQL con row filter si aplica
    const { wrappedSql, policy, isFiltered } =
      this.filteringService.resolveForRole(
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
        executionId,
      );

      // 4. Post-procesado: filtrar columnas no permitidas
      const result = this.filteringService.filterColumns(
        rawResult,
        policy.allowedColumns,
      );

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
        .catch((e) =>
          this.logger.error(`Fallo al guardar ejecución: ${String(e)}`),
        );

      await this.auditService.log({
        organizationId: orgId,
        userId,
        action: 'QUERY_RUN_SUCCEEDED',
        resourceType: 'query-execution',
        resourceId: executionId,
        metadata: {
          datasourceId: datasource.id,
          durationMs,
          rowCount: result.rowCount,
          filtered: isFiltered,
        },
      });

      return {
        ...result,
        executionId,
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
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

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
            errorMessage,
          },
        })
        .catch((e) =>
          this.logger.error(`Fallo al guardar ejecución: ${String(e)}`),
        );

      await this.auditService.log({
        organizationId: orgId,
        userId,
        action:
          errorMessage === 'La consulta fue cancelada.'
            ? 'QUERY_RUN_CANCELLED'
            : 'QUERY_RUN_FAILED',
        resourceType: 'query-execution',
        resourceId: executionId,
        metadata: {
          datasourceId: dto.datasourceId,
          durationMs,
          errorMessage,
        },
      });

      throw error;
    }
  }

  // --- CRUD de queries guardadas ---
  async create(orgId: string, userId: string, dto: SaveQueryDto) {
    // Validar existencia del datasource
    await this.datasourceService.findOne(orgId, dto.datasourceId);

    const query = await this.prisma.query.create({
      data: {
        organizationId: orgId,
        datasourceId: dto.datasourceId,
        name: dto.name,
        description: dto.description,
        querySql: dto.querySql,
        createdByUserId: userId,
      },
    });

    await this.auditService.log({
      organizationId: orgId,
      userId,
      action: 'QUERY_CREATED',
      resourceType: 'query',
      resourceId: query.id,
      metadata: {
        datasourceId: dto.datasourceId,
        name: dto.name,
      },
    });

    return query;
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

  async remove(orgId: string, userId: string, id: string) {
    const query = await this.findOne(orgId, id);
    await this.prisma.query.delete({ where: { id: query.id } });

    await this.auditService.log({
      organizationId: orgId,
      userId,
      action: 'QUERY_DELETED',
      resourceType: 'query',
      resourceId: query.id,
      metadata: {
        name: query.name,
      },
    });

    return { success: true };
  }

  async cancelActiveExecution(
    orgId: string,
    userId: string,
    executionId: string,
  ) {
    const result = await this.queryEngine.cancelExecution(orgId, executionId);

    await this.auditService.log({
      organizationId: orgId,
      userId,
      action: 'QUERY_CANCEL_REQUESTED',
      resourceType: 'query-execution',
      resourceId: executionId,
      metadata: {},
    });

    return result;
  }
}
