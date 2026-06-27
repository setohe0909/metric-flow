import { BadRequestException } from '@nestjs/common';
import { DatasourceService } from './datasource.service';

describe('DatasourceService hardening', () => {
  const prisma = {
    datasource: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const encryption = {
    encrypt: jest.fn((value: string) => `enc:${value}`),
    decrypt: jest.fn((value: string) =>
      value.startsWith('enc:') ? value.slice(4) : value,
    ),
  };

  const queryEngine = {
    testConnection: jest.fn(),
    getDbSchema: jest.fn(),
  };

  const csvImporter = {
    importCsvToSqlite: jest.fn(),
  };

  let service: DatasourceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DatasourceService(
      prisma as any,
      encryption as any,
      queryEngine as any,
      csvImporter,
    );
  });

  it('encrypts serviceAccountJson before persisting a BigQuery datasource', async () => {
    prisma.datasource.create.mockResolvedValue({
      id: 'ds-1',
      name: 'Warehouse',
      type: 'bigquery',
    });

    await service.create('org-1', {
      name: 'Warehouse',
      type: 'bigquery',
      connectionSettings: {
        projectId: 'analytics-project',
        database: 'dataset',
        serviceAccountJson: '{"client_email":"svc@example.com"}',
      },
    });

    expect(encryption.encrypt).toHaveBeenCalledWith(
      '{"client_email":"svc@example.com"}',
    );
    expect(prisma.datasource.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        type: 'bigquery',
        connectionSettings: JSON.stringify({
          projectId: 'analytics-project',
          database: 'dataset',
          serviceAccountJson: 'enc:{"client_email":"svc@example.com"}',
        }),
      }),
    });
  });

  it('masks stored datasource secrets when listing datasources', async () => {
    prisma.datasource.findMany.mockResolvedValue([
      {
        id: 'ds-1',
        name: 'Warehouse',
        type: 'bigquery',
        connectionSettings: JSON.stringify({
          projectId: 'analytics-project',
          database: 'dataset',
          serviceAccountJson: 'enc:{"client_email":"svc@example.com"}',
        }),
        accessPolicies: null,
        createdAt: new Date('2026-06-27T00:00:00.000Z'),
      },
      {
        id: 'ds-2',
        name: 'Postgres',
        type: 'postgres',
        connectionSettings: JSON.stringify({
          host: 'localhost',
          database: 'analytics',
          password: 'enc:secret',
        }),
        accessPolicies: null,
        createdAt: new Date('2026-06-27T00:00:00.000Z'),
      },
    ]);

    await expect(service.findAll('org-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'ds-1',
        connectionSettings: expect.objectContaining({
          projectId: 'analytics-project',
          database: 'dataset',
          serviceAccountJson: '••••••••',
        }),
      }),
      expect.objectContaining({
        id: 'ds-2',
        connectionSettings: expect.objectContaining({
          host: 'localhost',
          database: 'analytics',
          password: '••••••••',
        }),
      }),
    ]);
  });

  it('rejects manual sqlite connector creation outside the upload flow', async () => {
    await expect(
      service.create('org-1', {
        name: 'Manual SQLite',
        type: 'sqlite',
        connectionSettings: {
          filePath: '../../private.db',
        },
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Los conectores SQLite y CSV deben crearse mediante la carga segura de archivos.',
      ),
    );
  });
});
