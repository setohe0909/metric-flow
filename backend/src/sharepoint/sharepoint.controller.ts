import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SharePointResourcesService } from './application/sharepoint-resources.service';
import { SharePointSyncService } from './application/sharepoint-sync.service';
import {
  ApproveSharePointResourceDto,
  DiscoverSharePointResourcesQueryDto,
} from './dto/sharepoint.dto';

@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('sharepoint')
export class SharePointController {
  constructor(
    private readonly resourcesService: SharePointResourcesService,
    private readonly syncService: SharePointSyncService,
  ) {}

  @Get('datasources/:datasourceId/resources/discover')
  @Roles('ADMIN')
  discoverResources(
    @Request() req,
    @Param('datasourceId') datasourceId: string,
    @Query() query: DiscoverSharePointResourcesQueryDto,
  ) {
    return this.resourcesService.discoverResources(
      req.orgId,
      datasourceId,
      query.siteId,
    );
  }

  @Post('datasources/:datasourceId/resources')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  approveResource(
    @Request() req,
    @Param('datasourceId') datasourceId: string,
    @Body() dto: ApproveSharePointResourceDto,
  ) {
    return this.resourcesService.approveResource(
      req.orgId,
      datasourceId,
      req.userRole,
      dto,
    );
  }

  @Get('datasources/:datasourceId/resources')
  @Roles('ADMIN', 'EDITOR')
  listApprovedResources(
    @Request() req,
    @Param('datasourceId') datasourceId: string,
  ) {
    return this.resourcesService.listApprovedResources(req.orgId, datasourceId);
  }

  @Post('resources/:resourceId/refresh')
  @Roles('ADMIN', 'EDITOR')
  @HttpCode(HttpStatus.OK)
  refreshResource(@Request() req, @Param('resourceId') resourceId: string) {
    return this.syncService.refreshResource(req.orgId, resourceId);
  }

  @Get('resources/:resourceId/cache')
  @Roles('ADMIN', 'EDITOR', 'READER')
  getCachedContent(@Request() req, @Param('resourceId') resourceId: string) {
    return this.resourcesService.getCachedContent(req.orgId, resourceId);
  }
}
