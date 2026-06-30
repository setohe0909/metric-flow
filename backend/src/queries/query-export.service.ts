import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RunQueryDto } from './dto/queries.dto';
import { QueriesService } from './queries.service';
import { CsvQueryResultExporterService } from './exporters/csv-query-result-exporter.service';
import { ExcelQueryResultExporterService } from './exporters/excel-query-result-exporter.service';
import { QueryResultExporter } from './query-result-exporter.port';
import { QueryExportFile, QueryExportFormat } from './query-export.types';

@Injectable()
export class QueryExportService {
  private readonly exporters: Record<QueryExportFormat, QueryResultExporter>;

  constructor(
    private readonly queriesService: QueriesService,
    private readonly auditService: AuditService,
    csvExporter: CsvQueryResultExporterService,
    excelExporter: ExcelQueryResultExporterService,
  ) {
    this.exporters = {
      csv: csvExporter,
      excel: excelExporter,
    };
  }

  async export(
    orgId: string,
    userId: string | null,
    userRole: string,
    dto: RunQueryDto,
    format: QueryExportFormat,
  ): Promise<QueryExportFile> {
    const exporter = this.exporters[format];
    if (!exporter) {
      throw new BadRequestException('Formato de exportación no soportado.');
    }

    const result = await this.queriesService.runRaw(
      orgId,
      userId,
      userRole,
      dto,
    );
    const file = exporter.export({
      columns: result.columns,
      rows: result.rows,
      executedAt: new Date(),
    });

    await this.auditService.log({
      organizationId: orgId,
      userId,
      action: 'QUERY_EXPORTED',
      resourceType: 'query-export',
      resourceId: result.executionId,
      metadata: {
        datasourceId: dto.datasourceId,
        rowCount: result.rowCount,
        format,
      },
    });

    return file;
  }
}
