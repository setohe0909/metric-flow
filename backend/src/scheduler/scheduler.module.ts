import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { EmailService } from './email.service';
import { DatasourceModule } from '../datasource/datasource.module';

@Module({
  imports: [DatasourceModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, EmailService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
