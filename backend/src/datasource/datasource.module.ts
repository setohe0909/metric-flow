import { Module } from '@nestjs/common';
import { DatasourceService } from './datasource.service';
import { DatasourceController } from './datasource.controller';
import { CsvImporterService } from './csv-importer.service';
import { FilteringService } from './filtering.service';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  controllers: [DatasourceController],
  providers: [
    DatasourceService,
    CsvImporterService,
    FilteringService,
    RolesGuard,
  ],
  exports: [DatasourceService, CsvImporterService, FilteringService],
})
export class DatasourceModule {}
