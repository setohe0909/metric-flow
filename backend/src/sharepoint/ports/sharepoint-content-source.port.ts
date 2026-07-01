import {
  ApprovedSharePointResource,
  SharePointConnectionSettings,
  SharePointContentSnapshot,
  SharePointResource,
  SharePointTabularSnapshot,
} from '../domain/sharepoint-content.types';

export const SHAREPOINT_CONTENT_SOURCE = Symbol('SHAREPOINT_CONTENT_SOURCE');

export interface SharePointContentSourcePort {
  testConnection(settings: SharePointConnectionSettings): Promise<void>;
  listSiteResources(
    settings: SharePointConnectionSettings,
    siteId: string,
  ): Promise<SharePointResource[]>;
  readListItems(
    settings: SharePointConnectionSettings,
    resource: ApprovedSharePointResource,
  ): Promise<SharePointTabularSnapshot>;
  readDriveItems(
    settings: SharePointConnectionSettings,
    resource: ApprovedSharePointResource,
  ): Promise<SharePointContentSnapshot>;
}
