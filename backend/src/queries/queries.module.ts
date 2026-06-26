import { Module } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { QueriesController } from './queries.controller';
import { DatasourceModule } from '../datasource/datasource.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatasourceModule, AuditModule],
  controllers: [QueriesController],
  providers: [QueriesService],
  exports: [QueriesService],
})
export class QueriesModule {}
