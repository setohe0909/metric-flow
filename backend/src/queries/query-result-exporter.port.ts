import {
  QueryExportFile,
  QueryExportFormat,
  QueryExportPayload,
} from './query-export.types';

export interface QueryResultExporter {
  readonly format: QueryExportFormat;
  export(payload: QueryExportPayload): QueryExportFile;
}
