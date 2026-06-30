import { BadRequestException } from '@nestjs/common';
import { QueryExportService } from './query-export.service';
import { CsvQueryResultExporterService } from './exporters/csv-query-result-exporter.service';
import { ExcelQueryResultExporterService } from './exporters/excel-query-result-exporter.service';

describe('QueryExportService', () => {
  const queriesService = {
    runRaw: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  let service: QueryExportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QueryExportService(
      queriesService as any,
      auditService as any,
      new CsvQueryResultExporterService(),
      new ExcelQueryResultExporterService(),
    );
  });

  it('exports csv results and audits the export', async () => {
    queriesService.runRaw.mockResolvedValue({
      columns: ['id', 'name'],
      rows: [{ id: 1, name: 'Alice' }],
      rowCount: 1,
      executionId: 'exec-1',
      durationMs: 20,
    });

    const file = await service.export(
      'org-1',
      'user-1',
      'ADMIN',
      { datasourceId: 'ds-1', querySql: 'SELECT * FROM users' },
      'csv',
    );

    expect(file.filename).toMatch(/query-result-\d{4}-\d{2}-\d{2}\.csv/);
    expect(file.contentType).toContain('text/csv');
    expect(file.body.toString('utf8')).toContain('"id","name"');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'QUERY_EXPORTED',
        metadata: expect.objectContaining({ format: 'csv', rowCount: 1 }),
      }),
    );
  });

  it('exports excel results as an xls-compatible document', async () => {
    queriesService.runRaw.mockResolvedValue({
      columns: ['id'],
      rows: [{ id: 7 }],
      rowCount: 1,
      executionId: 'exec-2',
      durationMs: 20,
    });

    const file = await service.export(
      'org-1',
      'user-1',
      'ADMIN',
      { datasourceId: 'ds-1', querySql: 'SELECT id FROM users' },
      'excel',
    );

    expect(file.filename).toMatch(/query-result-\d{4}-\d{2}-\d{2}\.xls/);
    expect(file.contentType).toContain('application/vnd.ms-excel');
    expect(file.body.toString('utf8')).toContain('<Workbook');
  });

  it('rejects unsupported formats', async () => {
    await expect(
      service.export(
        'org-1',
        'user-1',
        'ADMIN',
        { datasourceId: 'ds-1', querySql: 'SELECT 1' },
        'json' as never,
      ),
    ).rejects.toThrow(
      new BadRequestException('Formato de exportación no soportado.'),
    );
  });
});
