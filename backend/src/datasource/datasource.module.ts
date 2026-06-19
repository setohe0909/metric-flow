import { Module } from '@nestjs/common';
import { DatasourceService } from './datasource.service';
import { DatasourceController } from './datasource.controller';
import { CsvImporterService } from './csv-importer.service';

@Module({
  controllers: [DatasourceController],
  providers: [DatasourceService, CsvImporterService],
  exports: [DatasourceService, CsvImporterService],
})
export class DatasourceModule {}
