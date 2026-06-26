import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { QueriesModule } from '../queries/queries.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [QueriesModule, AuditModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
