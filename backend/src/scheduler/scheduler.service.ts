import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DatasourceService } from '../datasource/datasource.service';
import { QueryEngineService } from '../query-engine/query-engine.service';
import { EmailService } from './email.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/scheduler.dto';
import parseExpression from 'cron-parser';
import { ScheduledQuery, Query, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly datasourceService: DatasourceService,
    private readonly queryEngine: QueryEngineService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  calculateNextRun(cronExpression: string, fromDate = new Date()): Date {
    try {
      const interval = parseExpression.parse(cronExpression, {
        currentDate: fromDate,
      });
      return interval.next().toDate();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Expresión cron inválida: ${message}`);
    }
  }

  async create(orgId: string, dto: CreateScheduleDto) {
    // Verificar que la consulta existe y pertenece a la organización
    const query = await this.prisma.query.findFirst({
      where: { id: dto.queryId, organizationId: orgId },
    });

    if (!query) {
      throw new NotFoundException('Consulta no encontrada');
    }

    const nextRunAt = this.calculateNextRun(dto.cronExpression);

    const schedule = await this.prisma.scheduledQuery.create({
      data: {
        organizationId: orgId,
        queryId: dto.queryId,
        name: dto.name,
        cronExpression: dto.cronExpression,
        recipients: dto.recipients,
        subject: dto.subject || null,
        format: dto.format || 'csv',
        enabled: dto.enabled !== undefined ? dto.enabled : true,
        nextRunAt,
      },
      include: {
        query: true,
      },
    });

    await this.auditService.log({
      organizationId: orgId,
      userId: null,
      action: 'SCHEDULE_CREATED',
      resourceType: 'schedule',
      resourceId: schedule.id,
      metadata: {
        queryId: dto.queryId,
        cronExpression: dto.cronExpression,
      },
    });

    return schedule;
  }

  async findAll(orgId: string) {
    return this.prisma.scheduledQuery.findMany({
      where: { organizationId: orgId },
      include: {
        query: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByQuery(orgId: string, queryId: string) {
    return this.prisma.scheduledQuery.findMany({
      where: { organizationId: orgId, queryId },
      include: {
        query: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const schedule = await this.prisma.scheduledQuery.findFirst({
      where: { id, organizationId: orgId },
      include: {
        query: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Programación no encontrada');
    }

    return schedule;
  }

  async update(orgId: string, id: string, dto: UpdateScheduleDto) {
    const schedule = await this.findOne(orgId, id);

    const updateData: Prisma.ScheduledQueryUpdateInput = { ...dto };

    if (dto.cronExpression) {
      updateData.nextRunAt = this.calculateNextRun(dto.cronExpression);
    } else if (dto.enabled === true && !schedule.nextRunAt) {
      // Si se re-habilita, volver a calcular nextRunAt
      updateData.nextRunAt = this.calculateNextRun(schedule.cronExpression);
    } else if (dto.enabled === false) {
      updateData.nextRunAt = null;
    }

    const updated = await this.prisma.scheduledQuery.update({
      where: { id },
      data: updateData,
      include: {
        query: true,
      },
    });

    await this.auditService.log({
      organizationId: orgId,
      userId: null,
      action: 'SCHEDULE_UPDATED',
      resourceType: 'schedule',
      resourceId: id,
      metadata: {
        enabled: dto.enabled,
        cronExpression: dto.cronExpression ?? schedule.cronExpression,
      },
    });

    return updated;
  }

  async remove(orgId: string, id: string) {
    const schedule = await this.findOne(orgId, id);

    const deleted = await this.prisma.scheduledQuery.delete({
      where: { id },
    });

    await this.auditService.log({
      organizationId: orgId,
      userId: null,
      action: 'SCHEDULE_DELETED',
      resourceType: 'schedule',
      resourceId: id,
      metadata: {
        queryId: schedule.queryId,
      },
    });

    return deleted;
  }

  async getHistory(orgId: string, scheduleId: string) {
    await this.findOne(orgId, scheduleId);

    return this.prisma.scheduleHistory.findMany({
      where: { scheduledQueryId: scheduleId },
      orderBy: { executedAt: 'desc' },
      take: 50, // Límite de historial visible
    });
  }

  // --- BACKGROUND CRON PROCESSOR ---

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const now = new Date();

    const dueSchedules = await this.prisma.scheduledQuery.findMany({
      where: {
        enabled: true,
        OR: [{ nextRunAt: { lte: now } }, { nextRunAt: null }],
      },
      include: {
        query: true,
      },
    });

    if (dueSchedules.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${dueSchedules.length} due scheduled queries to process.`,
    );

    for (const schedule of dueSchedules) {
      try {
        await this.processSchedule(schedule);
      } catch (error: unknown) {
        const stack = error instanceof Error ? error.stack : '';
        this.logger.error(`Failed to process schedule ${schedule.id}:`, stack);
      }
    }
  }

  private async processSchedule(schedule: ScheduledQuery & { query: Query }) {
    this.logger.log(
      `Processing schedule: ${schedule.name} (${schedule.id}) for query: ${schedule.query.name}`,
    );
    const executedAt = new Date();
    let errorMessage: string | null = null;

    try {
      if (!schedule.query.datasourceId) {
        throw new Error(
          'La consulta asociada no tiene un conector de base de datos asignado.',
        );
      }

      // 1. Obtener conector desencriptado
      const datasource = await this.datasourceService.findOne(
        schedule.organizationId,
        schedule.query.datasourceId,
      );

      // 2. Ejecutar SQL (usando permisos admin/owner para reportes completos)
      const startTime = Date.now();
      const rawResult = await this.queryEngine.executeQuery(
        datasource.type,
        datasource.connectionSettings,
        schedule.query.querySql,
        datasource.id,
        schedule.organizationId,
      );
      const durationMs = Date.now() - startTime;

      // 3. Registrar auditoría de ejecución
      await this.prisma.execution
        .create({
          data: {
            organizationId: schedule.organizationId,
            userId: null, // Ejecución automática del sistema
            sqlExecuted: schedule.query.querySql,
            durationMs,
            rowCount: rawResult.rowCount,
            status: 'success',
          },
        })
        .catch((e) =>
          this.logger.error('Fallo al guardar log de auditoría:', e),
        );

      // 4. Formatear email y adjuntos
      let emailBody = `
        <html>
          <body style="font-family: Arial, sans-serif; color: #23251d; line-height: 1.5; background-color: #eeefe9; padding: 20px;">
            <div style="background-color: white; border: 2px solid #23251d; border-radius: 12px; padding: 24px; box-shadow: 4px 4px 0px 0px #23251d;">
              <h2 style="color: #23251d; border-bottom: 2px solid #23251d; padding-bottom: 10px; font-family: monospace; margin-top: 0;">
                Reporte MetricFlow: ${schedule.name}
              </h2>
              <p>Este es un reporte automático programado para la consulta guardada: <strong>${schedule.query.name}</strong>.</p>
              
              <div style="background-color: #eeefe9; border: 2px solid #23251d; border-radius: 8px; padding: 12px 16px; margin: 20px 0; font-family: monospace; font-size: 13px;">
                <div style="margin-bottom: 4px;"><strong>Fecha de Ejecución:</strong> ${executedAt.toLocaleString()}</div>
                <div style="margin-bottom: 4px;"><strong>Registros Devueltos:</strong> ${rawResult.rowCount}</div>
                <div><strong>Duración de Consulta:</strong> ${durationMs} ms</div>
              </div>
      `;

      const attachments: Array<{ filename: string; content: string | Buffer }> =
        [];

      if (schedule.format === 'html') {
        emailBody += `<h3 style="font-family: monospace; color: #23251d; margin-top: 24px; border-bottom: 1px solid #23251d;">Resultados de la consulta:</h3>`;
        emailBody += this.formatHtmlTable(rawResult.columns, rawResult.rows);
      } else if (schedule.format === 'csv') {
        const csvContent = this.formatCsv(rawResult.columns, rawResult.rows);
        attachments.push({
          filename: `${schedule.name.replace(/\s+/g, '_')}_${executedAt.toISOString().split('T')[0]}.csv`,
          content: csvContent,
        });
        emailBody += `<p style="font-size: 13px;">Los resultados completos de la consulta se encuentran adjuntos en este correo en formato <strong>CSV</strong>.</p>`;
      } else if (schedule.format === 'json') {
        const jsonContent = JSON.stringify(rawResult.rows, null, 2);
        attachments.push({
          filename: `${schedule.name.replace(/\s+/g, '_')}_${executedAt.toISOString().split('T')[0]}.json`,
          content: jsonContent,
        });
        emailBody += `<p style="font-size: 13px;">Los resultados completos de la consulta se encuentran adjuntos en este correo en formato <strong>JSON</strong>.</p>`;
      }

      emailBody += `
              <hr style="border: 0; border-top: 2px solid #23251d; margin-top: 30px;"/>
              <p style="font-size: 11px; color: #4d4f46; font-family: monospace; margin-bottom: 0;">
                Enviado automáticamente por MetricFlow. Para modificar esta programación, ingresa al SQL Editor de tu cuenta.
              </p>
            </div>
          </body>
        </html>
      `;

      // 5. Enviar correo
      const subject =
        schedule.subject || `Reporte Programado: ${schedule.name}`;
      await this.emailService.sendEmailReport(
        schedule.recipients,
        subject,
        emailBody,
        attachments,
      );

      // 6. Calcular siguiente ejecución
      const nextRunAt = this.calculateNextRun(
        schedule.cronExpression,
        executedAt,
      );

      // 7. Guardar resultados exitosos y actualizar tiempos de ejecución
      await this.prisma.scheduledQuery.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: executedAt,
          nextRunAt,
        },
      });

      await this.prisma.scheduleHistory.create({
        data: {
          scheduledQueryId: schedule.id,
          executedAt,
          status: 'success',
          recipientsSent: schedule.recipients,
        },
      });

      await this.auditService.log({
        organizationId: schedule.organizationId,
        userId: null,
        action: 'SCHEDULE_RUN_SUCCEEDED',
        resourceType: 'schedule',
        resourceId: schedule.id,
        metadata: {
          queryId: schedule.query.id,
          rowCount: rawResult.rowCount,
          durationMs,
        },
      });
    } catch (err: unknown) {
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      errorMessage =
        errorInstance.message || 'Error desconocido durante la ejecución';
      this.logger.error(
        `Failed to run scheduled query ${schedule.id}:`,
        errorInstance.stack || '',
      );

      // Actualizar el cron para evitar que se quede trabado
      const nextRunAt = this.calculateNextRun(
        schedule.cronExpression,
        executedAt,
      );

      await this.prisma.scheduledQuery
        .update({
          where: { id: schedule.id },
          data: {
            lastRunAt: executedAt,
            nextRunAt,
          },
        })
        .catch((e) =>
          this.logger.error('Failed to update run times on failure:', e),
        );

      await this.prisma.scheduleHistory
        .create({
          data: {
            scheduledQueryId: schedule.id,
            executedAt,
            status: 'error',
            errorMessage,
            recipientsSent: schedule.recipients,
          },
        })
        .catch((e) =>
          this.logger.error('Failed to save history log on failure:', e),
        );

      await this.auditService.log({
        organizationId: schedule.organizationId,
        userId: null,
        action: 'SCHEDULE_RUN_FAILED',
        resourceType: 'schedule',
        resourceId: schedule.id,
        metadata: {
          queryId: schedule.query.id,
          errorMessage,
        },
      });
    }
  }

  private formatHtmlTable(columns: string[], rows: any[]): string {
    if (rows.length === 0) {
      return '<p style="font-style: italic; color: #4d4f46; font-size: 13px;">No se devolvieron filas.</p>';
    }

    let html = `
      <table style="border-collapse: collapse; width: 100%; border: 2px solid #23251d; font-family: monospace; font-size: 12px; margin-top: 10px;">
        <thead>
          <tr style="background-color: #eeefe9; border-bottom: 2px solid #23251d;">
    `;

    columns.forEach((col) => {
      html += `
        <th style="border: 1px solid #23251d; padding: 8px; text-align: left; font-weight: bold; color: #23251d;">
          ${col}
        </th>
      `;
    });

    html += `
          </tr>
        </thead>
        <tbody>
    `;

    // Limitar filas mostradas inline a 100 para evitar que el correo sea excesivamente pesado
    const displayRows = rows.slice(0, 100);
    displayRows.forEach((row) => {
      html += `<tr style="border-bottom: 1px solid rgba(35,37,29,0.15);">`;
      columns.forEach((col) => {
        const val = (row as Record<string, unknown>)[col];
        const formattedVal =
          val === null || val === undefined
            ? 'NULL'
            : val instanceof Date
              ? val.toISOString()
              : typeof val === 'string'
                ? val
                : typeof val === 'number' || typeof val === 'boolean'
                  ? String(val)
                  : JSON.stringify(val);
        html += `<td style="border: 1px solid #23251d; padding: 6px 8px; text-align: left;">${formattedVal}</td>`;
      });
      html += `</tr>`;
    });

    html += `
        </tbody>
      </table>
    `;

    if (rows.length > 100) {
      html += `<p style="font-size: 11px; color: #4d4f46; font-style: italic; margin-top: 8px;">* Mostrando las primeras 100 filas de un total de ${rows.length}.</p>`;
    }

    return html;
  }

  private formatCsv(columns: string[], rows: any[]): string {
    const headerLine = columns
      .map((col) => `"${col.replace(/"/g, '""')}"`)
      .join(',');
    const dataLines = rows.map((row) => {
      return columns
        .map((col) => {
          const val = (row as Record<string, unknown>)[col];
          if (val === null || val === undefined) {
            return '';
          }
          const strVal =
            val instanceof Date
              ? val.toISOString()
              : typeof val === 'string'
                ? val
                : typeof val === 'number' || typeof val === 'boolean'
                  ? String(val)
                  : JSON.stringify(val);
          return `"${strVal.replace(/"/g, '""')}"`;
        })
        .join(',');
    });
    return [headerLine, ...dataLines].join('\n');
  }
}
