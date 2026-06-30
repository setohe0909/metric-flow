import { Injectable } from '@nestjs/common';
import { QueryResultExporter } from '../query-result-exporter.port';
import { QueryExportFile, QueryExportPayload } from '../query-export.types';

@Injectable()
export class ExcelQueryResultExporterService implements QueryResultExporter {
  readonly format = 'excel' as const;

  export(payload: QueryExportPayload): QueryExportFile {
    const document = this.buildSpreadsheetMl(payload);

    return {
      body: Buffer.from(document, 'utf8'),
      contentType: 'application/vnd.ms-excel; charset=utf-8',
      filename: this.buildFilename(payload, 'xls'),
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

  private buildSpreadsheetMl(payload: QueryExportPayload): string {
    const rows = [
      this.renderRow(payload.columns, true),
      ...payload.rows.map((row) =>
        this.renderRow(
          payload.columns.map((column) => this.stringifyValue(row[column])),
          false,
        ),
      ),
    ].join('');

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Results">
  <Table>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  private renderRow(values: string[], isHeader: boolean): string {
    const cells = values
      .map(
        (value) =>
          `<Cell${isHeader ? ' ss:StyleID="Header"' : ''}><Data ss:Type="String">${this.escapeXml(
            value,
          )}</Data></Cell>`,
      )
      .join('');

    return `<Row>${cells}</Row>`;
  }

  private stringifyValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
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

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
