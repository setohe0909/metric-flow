import { Injectable } from '@nestjs/common';
import { QueryResultExporter } from '../query-result-exporter.port';
import { QueryExportFile, QueryExportPayload } from '../query-export.types';

@Injectable()
export class CsvQueryResultExporterService implements QueryResultExporter {
  readonly format = 'csv' as const;

  export(payload: QueryExportPayload): QueryExportFile {
    const csvContent = this.formatCsv(payload.columns, payload.rows);
    return {
      body: Buffer.from(csvContent, 'utf8'),
      contentType: 'text/csv; charset=utf-8',
      filename: this.buildFilename(payload, 'csv'),
    };
  }

  private buildFilename(payload: QueryExportPayload, extension: string) {
    const baseName = (payload.queryName || 'query-result')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const date = payload.executedAt.toISOString().slice(0, 10);
    return `${baseName || 'query-result'}-${date}.${extension}`;
  }

  private formatCsv(
    columns: string[],
    rows: Record<string, unknown>[],
  ): string {
    const headerLine = columns
      .map((col) => `"${col.replace(/"/g, '""')}"`)
      .join(',');

    const dataLines = rows.map((row) =>
      columns
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) {
            return '';
          }

          const stringValue = this.stringifyValue(val);
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(','),
    );

    return [headerLine, ...dataLines].join('\n');
  }

  private stringifyValue(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value);
  }
}
