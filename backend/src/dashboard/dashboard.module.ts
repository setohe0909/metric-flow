import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DatasourceModule } from '../datasource/datasource.module';
import { QueriesModule } from '../queries/queries.module';

@Module({
  imports: [DatasourceModule, QueriesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
