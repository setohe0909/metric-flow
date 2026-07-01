import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { SHAREPOINT_CONTENT_SOURCE } from '../ports/sharepoint-content-source.port';
import type { SharePointContentSourcePort } from '../ports/sharepoint-content-source.port';
import {
  ApprovedSharePointResource,
  SharePointConnectionSettings,
} from '../domain/sharepoint-content.types';
import { SharePointRefreshResult } from '../domain/sharepoint-sync-status.types';

@Injectable()
export class SharePointSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    @Inject(SHAREPOINT_CONTENT_SOURCE)
    private readonly contentSource: SharePointContentSourcePort,
  ) {}

  async refreshResource(
    organizationId: string,
    approvedResourceId: string,
  ): Promise<SharePointRefreshResult> {
    const resource = await this.prisma.sharePointApprovedResource.findFirst({
      where: {
        id: approvedResourceId,
        organizationId,
        enabled: true,
      },
    });

    if (!resource) {
      throw new NotFoundException('Recurso de SharePoint no encontrado');
    }

    const datasource = await this.prisma.datasource.findFirst({
      where: {
        id: resource.datasourceId,
        organizationId,
        type: 'sharepoint',
      },
    });

    if (!datasource) {
      throw new NotFoundException('Conector SharePoint no encontrado');
    }

    const settings = this.decryptSettings(
      JSON.parse(datasource.connectionSettings) as SharePointConnectionSettings,
    );

    await this.markSyncing(approvedResourceId);

    try {
      const rows =
        resource.resourceType === 'list'
          ? (
              await this.contentSource.readListItems(
                settings,
                resource as ApprovedSharePointResource,
              )
            ).rows
          : (
              await this.contentSource.readDriveItems(
                settings,
                resource as ApprovedSharePointResource,
              )
            ).rows;

      await this.prisma.sharePointCachedContent.deleteMany({
        where: { approvedResourceId },
      });

      if (rows.length > 0) {
        await this.prisma.sharePointCachedContent.createMany({
          data: rows.map((row) => ({
            organizationId,
            approvedResourceId,
            contentType:
              resource.resourceType === 'list' ? 'tabularRow' : 'documentMeta',
            rowData: row as Prisma.InputJsonValue,
          })),
        });
      }

      await this.prisma.sharePointSyncState.upsert({
        where: { approvedResourceId },
        create: {
          approvedResourceId,
          status: 'success',
          lastStartedAt: new Date(),
          lastCompletedAt: new Date(),
          lastError: null,
          rowCount: rows.length,
        },
        update: {
          status: 'success',
          lastCompletedAt: new Date(),
          lastError: null,
          rowCount: rows.length,
        },
      });

      return {
        status: 'success',
        rowCount: rows.length,
        lastError: null,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error sincronizando SharePoint';

      await this.prisma.sharePointSyncState.upsert({
        where: { approvedResourceId },
        create: {
          approvedResourceId,
          status: 'failed',
          lastStartedAt: new Date(),
          lastCompletedAt: new Date(),
          lastError: message,
          rowCount: 0,
        },
        update: {
          status: 'failed',
          lastCompletedAt: new Date(),
          lastError: message,
        },
      });

      throw new BadRequestException(`SharePoint Sync Error: ${message}`);
    }
  }

  private async markSyncing(approvedResourceId: string) {
    await this.prisma.sharePointSyncState.upsert({
      where: { approvedResourceId },
      create: {
        approvedResourceId,
        status: 'syncing',
        lastStartedAt: new Date(),
        lastCompletedAt: null,
        lastError: null,
        rowCount: 0,
      },
      update: {
        status: 'syncing',
        lastStartedAt: new Date(),
        lastError: null,
      },
    });
  }

  private decryptSettings(
    settings: SharePointConnectionSettings,
  ): SharePointConnectionSettings {
    return {
      ...settings,
      clientSecret: this.encryption.decrypt(settings.clientSecret),
    };
  }
}
