import { Module } from '@nestjs/common';
import { DatasourceService } from './datasource.service';
import { DatasourceController } from './datasource.controller';
import { CsvImporterService } from './csv-importer.service';
import { FilteringService } from './filtering.service';

@Module({
  controllers: [DatasourceController],
  providers: [DatasourceService, CsvImporterService, FilteringService],
  exports: [DatasourceService, CsvImporterService, FilteringService],
})
export class DatasourceModule {}
