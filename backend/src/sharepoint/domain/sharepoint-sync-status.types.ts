export type SharePointSyncStatus = 'idle' | 'syncing' | 'success' | 'failed';

export interface SharePointRefreshResult {
  status: SharePointSyncStatus;
  rowCount: number;
  lastError: string | null;
}
