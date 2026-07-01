import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { SHAREPOINT_CONTENT_SOURCE } from '../ports/sharepoint-content-source.port';
import type { SharePointContentSourcePort } from '../ports/sharepoint-content-source.port';
import {
  SharePointConnectionSettings,
  SharePointResource,
} from '../domain/sharepoint-content.types';
import { ApproveSharePointResourceDto } from '../dto/sharepoint.dto';

@Injectable()
export class SharePointResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    @Inject(SHAREPOINT_CONTENT_SOURCE)
    private readonly contentSource: SharePointContentSourcePort,
  ) {}

  async discoverResources(
    organizationId: string,
    datasourceId: string,
    siteId: string,
  ): Promise<SharePointResource[]> {
    const settings = await this.loadSettings(organizationId, datasourceId);
    return this.contentSource.listSiteResources(settings, siteId);
  }

  async approveResource(
    organizationId: string,
    datasourceId: string,
    userRole: string,
    dto: ApproveSharePointResourceDto,
  ) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Solo un administrador puede aprobar contenido de SharePoint',
      );
    }

    await this.loadSettings(organizationId, datasourceId);

    return this.prisma.sharePointApprovedResource.upsert({
      where: {
        unique_sharepoint_resource: {
          organizationId,
          datasourceId,
          siteId: dto.siteId,
          resourceType: dto.resourceType,
          resourceId: dto.resourceId,
        },
      },
      create: {
        organizationId,
        datasourceId,
        siteId: dto.siteId,
        siteName: dto.siteName,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        resourceName: dto.resourceName,
        webUrl: dto.webUrl,
        enabled: true,
      },
      update: {
        siteName: dto.siteName,
        resourceName: dto.resourceName,
        webUrl: dto.webUrl,
        enabled: true,
      },
    });
  }

  async listApprovedResources(organizationId: string, datasourceId: string) {
    await this.loadSettings(organizationId, datasourceId);

    return this.prisma.sharePointApprovedResource.findMany({
      where: { organizationId, datasourceId, enabled: true },
      orderBy: [{ siteName: 'asc' }, { resourceName: 'asc' }],
      include: { syncState: true },
    });
  }

  async getCachedContent(organizationId: string, approvedResourceId: string) {
    const resource = await this.prisma.sharePointApprovedResource.findFirst({
      where: { id: approvedResourceId, organizationId, enabled: true },
    });

    if (!resource) {
      throw new NotFoundException('Recurso de SharePoint no encontrado');
    }

    const rows = await this.prisma.sharePointCachedContent.findMany({
      where: { organizationId, approvedResourceId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      resource,
      rows: rows.map((row) => row.rowData),
    };
  }

  private async loadSettings(
    organizationId: string,
    datasourceId: string,
  ): Promise<SharePointConnectionSettings> {
    const datasource = await this.prisma.datasource.findFirst({
      where: { id: datasourceId, organizationId, type: 'sharepoint' },
    });

    if (!datasource) {
      throw new NotFoundException('Conector SharePoint no encontrado');
    }

    const settings = JSON.parse(
      datasource.connectionSettings,
    ) as SharePointConnectionSettings;

    if (!settings.tenantId || !settings.clientId || !settings.clientSecret) {
      throw new BadRequestException(
        'SharePoint requiere tenantId, clientId y clientSecret.',
      );
    }

    return {
      ...settings,
      clientSecret: this.encryption.decrypt(settings.clientSecret),
    };
  }
}
