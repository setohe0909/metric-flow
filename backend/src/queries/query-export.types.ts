export type QueryExportFormat = 'csv' | 'excel';

export interface QueryExportFile {
  body: Buffer;
  contentType: string;
  filename: string;
}

export interface QueryExportPayload {
  columns: string[];
  rows: Record<string, unknown>[];
  queryName?: string | null;
  executedAt: Date;
}
