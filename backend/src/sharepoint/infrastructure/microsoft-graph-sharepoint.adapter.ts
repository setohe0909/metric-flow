import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ApprovedSharePointResource,
  SharePointConnectionSettings,
  SharePointContentSnapshot,
  SharePointResource,
  SharePointTabularSnapshot,
} from '../domain/sharepoint-content.types';
import { SharePointContentSourcePort } from '../ports/sharepoint-content-source.port';

interface GraphListResponse<T> {
  value?: T[];
}

@Injectable()
export class MicrosoftGraphSharePointAdapter implements SharePointContentSourcePort {
  async testConnection(settings: SharePointConnectionSettings): Promise<void> {
    await this.graphRequest<unknown>(settings, '/sites/root?$select=id,name');
  }

  async listSiteResources(
    settings: SharePointConnectionSettings,
    siteId: string,
  ): Promise<SharePointResource[]> {
    const [lists, drives] = await Promise.all([
      this.graphRequest<
        GraphListResponse<{ id: string; name: string; webUrl: string }>
      >(
        settings,
        `/sites/${encodeURIComponent(siteId)}/lists?$select=id,name,webUrl`,
      ),
      this.graphRequest<
        GraphListResponse<{ id: string; name: string; webUrl: string }>
      >(
        settings,
        `/sites/${encodeURIComponent(siteId)}/drives?$select=id,name,webUrl`,
      ),
    ]);

    return [
      ...(lists.value ?? []).map((list) => ({
        siteId,
        siteName: siteId,
        resourceType: 'list' as const,
        resourceId: list.id,
        resourceName: list.name,
        webUrl: list.webUrl,
      })),
      ...(drives.value ?? []).map((drive) => ({
        siteId,
        siteName: siteId,
        resourceType: 'documentLibrary' as const,
        resourceId: drive.id,
        resourceName: drive.name,
        webUrl: drive.webUrl,
      })),
    ];
  }

  async readListItems(
    settings: SharePointConnectionSettings,
    resource: ApprovedSharePointResource,
  ): Promise<SharePointTabularSnapshot> {
    const response = await this.graphRequest<
      GraphListResponse<{ fields?: Record<string, unknown> }>
    >(
      settings,
      `/sites/${encodeURIComponent(resource.siteId)}/lists/${encodeURIComponent(
        resource.resourceId,
      )}/items?expand=fields`,
    );

    const rows = (response.value ?? []).map((item) => item.fields ?? {});
    const columns = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row))),
    );

    return { columns, rows };
  }

  async readDriveItems(
    settings: SharePointConnectionSettings,
    resource: ApprovedSharePointResource,
  ): Promise<SharePointContentSnapshot> {
    const response = await this.graphRequest<
      GraphListResponse<{
        id: string;
        name: string;
        webUrl: string;
        size?: number;
        createdDateTime?: string;
        lastModifiedDateTime?: string;
        file?: { mimeType?: string };
        folder?: unknown;
      }>
    >(
      settings,
      `/drives/${encodeURIComponent(
        resource.resourceId,
      )}/root/children?$select=id,name,webUrl,size,createdDateTime,lastModifiedDateTime,file,folder`,
    );

    return {
      rows: (response.value ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        webUrl: item.webUrl,
        size: item.size ?? null,
        mimeType: item.file?.mimeType ?? null,
        isFolder: Boolean(item.folder),
        createdDateTime: item.createdDateTime ?? null,
        lastModifiedDateTime: item.lastModifiedDateTime ?? null,
      })),
    };
  }

  private async graphRequest<T>(
    settings: SharePointConnectionSettings,
    path: string,
  ): Promise<T> {
    const token = await this.getAccessToken(settings);
    const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new BadRequestException(
        `Microsoft Graph Error: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as T;
  }

  private async getAccessToken(
    settings: SharePointConnectionSettings,
  ): Promise<string> {
    const authorityHost =
      settings.authorityHost ?? 'https://login.microsoftonline.com';
    const body = new URLSearchParams({
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(
      `${authorityHost}/${settings.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );

    if (!response.ok) {
      throw new BadRequestException(
        `Microsoft Entra Error: ${response.status} ${response.statusText}`,
      );
    }

    const payload = (await response.json()) as { access_token?: string };
    if (!payload.access_token) {
      throw new BadRequestException(
        'Microsoft Entra no retornó un access token.',
      );
    }

    return payload.access_token;
  }
}
