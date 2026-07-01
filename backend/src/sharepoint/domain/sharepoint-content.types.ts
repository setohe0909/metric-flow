export type SharePointResourceType = 'list' | 'documentLibrary';

export interface SharePointConnectionSettings {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  authorityHost?: string;
}

export interface ApprovedSharePointResource {
  id: string;
  organizationId: string;
  datasourceId: string;
  siteId: string;
  siteName: string;
  resourceType: SharePointResourceType;
  resourceId: string;
  resourceName: string;
  webUrl: string;
  enabled: boolean;
}

export interface SharePointResource {
  siteId: string;
  siteName: string;
  resourceType: SharePointResourceType;
  resourceId: string;
  resourceName: string;
  webUrl: string;
}

export interface SharePointTabularSnapshot {
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

export interface SharePointContentSnapshot {
  rows: Array<Record<string, unknown>>;
}
