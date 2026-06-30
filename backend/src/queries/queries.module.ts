import { Module } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { QueriesController } from './queries.controller';
import { DatasourceModule } from '../datasource/datasource.module';
import { AuditModule } from '../audit/audit.module';
import { QueryExportService } from './query-export.service';
import { CsvQueryResultExporterService } from './exporters/csv-query-result-exporter.service';
import { ExcelQueryResultExporterService } from './exporters/excel-query-result-exporter.service';

@Module({
  imports: [DatasourceModule, AuditModule],
  controllers: [QueriesController],
  providers: [
    QueriesService,
    QueryExportService,
    CsvQueryResultExporterService,
    ExcelQueryResultExporterService,
  ],
  exports: [QueriesService],
})
export class QueriesModule {}
