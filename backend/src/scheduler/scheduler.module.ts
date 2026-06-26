import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { EmailService } from './email.service';
import { DatasourceModule } from '../datasource/datasource.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatasourceModule, AuditModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, EmailService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
