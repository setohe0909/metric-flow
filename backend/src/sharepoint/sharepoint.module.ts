import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SharePointResourcesService } from './application/sharepoint-resources.service';
import { SharePointSyncService } from './application/sharepoint-sync.service';
import { MicrosoftGraphSharePointAdapter } from './infrastructure/microsoft-graph-sharepoint.adapter';
import { SHAREPOINT_CONTENT_SOURCE } from './ports/sharepoint-content-source.port';
import { SharePointController } from './sharepoint.controller';

@Module({
  controllers: [SharePointController],
  providers: [
    SharePointResourcesService,
    SharePointSyncService,
    MicrosoftGraphSharePointAdapter,
    RolesGuard,
    {
      provide: SHAREPOINT_CONTENT_SOURCE,
      useExisting: MicrosoftGraphSharePointAdapter,
    },
  ],
  exports: [SharePointResourcesService, SharePointSyncService],
})
export class SharePointModule {}
