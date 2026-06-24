import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { QueryEngineModule } from './query-engine/query-engine.module';
import { DatasourceModule } from './datasource/datasource.module';
import { QueriesModule } from './queries/queries.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WidgetModule } from './widget/widget.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    EncryptionModule,
    QueryEngineModule,
    DatasourceModule,
    QueriesModule,
    OrganizationsModule,
    DashboardModule,
    WidgetModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
