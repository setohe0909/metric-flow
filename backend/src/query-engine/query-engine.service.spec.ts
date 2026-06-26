import { QueryEngineService } from './query-engine.service';
import { SqlReadOnlyPolicy } from './sql-read-only-policy';

const mockPgClient = {
  query: jest.fn(),
  release: jest.fn(),
};
const mockPgPool = {
  connect: jest.fn(),
  end: jest.fn(),
};

const mockMysqlConnection = {
  query: jest.fn(),
  release: jest.fn(),
};
const mockMysqlPool = {
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
};
const mockMssqlRequest = {
  query: jest.fn(),
  cancel: jest.fn(),
};
const mockMssqlTransaction = {
  begin: jest.fn(),
  rollback: jest.fn(),
};
const mockMssqlPool = {
  connect: jest.fn(),
  close: jest.fn(),
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPgPool),
}));

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => mockMysqlPool),
}));

jest.mock('mssql', () => ({
  ConnectionPool: jest.fn(() => mockMssqlPool),
  Transaction: jest.fn(() => mockMssqlTransaction),
  Request: jest.fn(() => mockMssqlRequest),
  ISOLATION_LEVEL: {
    READ_COMMITTED: 'READ_COMMITTED',
  },
}));

describe('QueryEngineService read-only transactions', () => {
  const sqlPolicy = {
    prepare: jest.fn((_type: string, sql: string) => sql),
  } as unknown as SqlReadOnlyPolicy;

  let service: QueryEngineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QueryEngineService(sqlPolicy);

    mockPgPool.connect.mockResolvedValue(mockPgClient);
    mockPgPool.end.mockResolvedValue(undefined);
    mockPgClient.release.mockReturnValue(undefined);

    mockMysqlPool.getConnection.mockResolvedValue(mockMysqlConnection);
    mockMysqlPool.end.mockResolvedValue(undefined);
    mockMysqlConnection.release.mockReturnValue(undefined);

    mockMssqlPool.connect.mockResolvedValue(mockMssqlPool);
    mockMssqlPool.close.mockResolvedValue(undefined);
    mockMssqlTransaction.begin.mockResolvedValue(undefined);
    mockMssqlTransaction.rollback.mockResolvedValue(undefined);
    mockMssqlRequest.cancel.mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('executes PostgreSQL queries inside a read-only transaction', async () => {
    mockPgClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        fields: [{ name: 'id' }],
        rows: [[1]],
      })
      .mockResolvedValueOnce({});

    await expect(
      service.executeQuery(
        'postgres',
        {
          host: 'localhost',
          username: 'reader',
          password: 'secret',
          database: 'analytics',
        },
        'SELECT id FROM users',
      ),
    ).resolves.toMatchObject({
      columns: ['id'],
      rows: [{ id: 1 }],
      rowCount: 1,
    });

    expect(mockPgClient.query).toHaveBeenNthCalledWith(1, 'BEGIN READ ONLY');
    expect(mockPgClient.query).toHaveBeenNthCalledWith(2, {
      text: 'SELECT id FROM users',
      rowMode: 'array',
    });
    expect(mockPgClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
  });

  it('executes MySQL queries inside a read-only transaction', async () => {
    mockMysqlConnection.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[{ id: 1 }], [{ name: 'id' }]])
      .mockResolvedValueOnce([[], []]);

    await expect(
      service.executeQuery(
        'mysql',
        {
          host: 'localhost',
          username: 'reader',
          password: 'secret',
          database: 'analytics',
        },
        'SELECT id FROM users',
      ),
    ).resolves.toMatchObject({
      columns: ['id'],
      rows: [{ id: 1 }],
      rowCount: 1,
    });

    expect(mockMysqlConnection.query).toHaveBeenNthCalledWith(
      1,
      'START TRANSACTION READ ONLY',
    );
    expect(mockMysqlConnection.query).toHaveBeenNthCalledWith(
      2,
      'SELECT id FROM users',
    );
    expect(mockMysqlConnection.query).toHaveBeenNthCalledWith(3, 'COMMIT');
  });

  it('executes SQL Server queries inside a transaction that is rolled back', async () => {
    mockMssqlRequest.query.mockResolvedValue({
      recordset: [{ id: 1 }],
    });

    await expect(
      service.executeQuery(
        'sqlserver',
        {
          host: 'localhost',
          port: 1433,
          username: 'reader',
          password: 'secret',
          database: 'analytics',
          ssl: true,
        },
        'SELECT id FROM users',
      ),
    ).resolves.toMatchObject({
      columns: ['id'],
      rows: [{ id: 1 }],
      rowCount: 1,
    });

    expect(sqlPolicy.prepare).toHaveBeenCalledWith(
      'sqlserver',
      'SELECT id FROM users',
    );
    expect(mockMssqlPool.connect).toHaveBeenCalledTimes(1);
    expect(mockMssqlTransaction.begin).toHaveBeenCalledWith('READ_COMMITTED');
    expect(mockMssqlRequest.query).toHaveBeenCalledWith('SELECT id FROM users');
    expect(mockMssqlTransaction.rollback).toHaveBeenCalledTimes(1);
    expect(mockMssqlPool.close).toHaveBeenCalledTimes(1);
  });

  it('keeps SQL Server column metadata when the resultset is empty', async () => {
    mockMssqlRequest.query.mockResolvedValue({
      recordset: Object.assign([], {
        columns: {
          id: { name: 'id' },
          email: { name: 'email' },
        },
      }),
    });

    await expect(
      service.executeQuery(
        'sqlserver',
        {
          host: 'localhost',
          port: 1433,
          username: 'reader',
          password: 'secret',
          database: 'analytics',
          ssl: true,
        },
        'SELECT id, email FROM users WHERE 1 = 0',
      ),
    ).resolves.toMatchObject({
      columns: ['id', 'email'],
      rows: [],
      rowCount: 0,
    });
  });

  it('filters SQL Server schema discovery by the configured schema when present', async () => {
    const runRawQuerySpy = jest
      .spyOn(service as never, 'runRawQuery' as never)
      .mockResolvedValue({
        columns: ['tableName', 'columnName'],
        rows: [{ tableName: 'users', columnName: 'id' }],
        rowCount: 1,
      });

    await expect(
      service.getDbSchema(
        'sqlserver',
        {
          host: 'localhost',
          port: 1433,
          username: 'reader',
          password: 'secret',
          database: 'analytics',
          schema: 'reporting',
        },
        'org-1',
      ),
    ).resolves.toEqual([{ table: 'users', columns: ['id'] }]);

    expect(runRawQuerySpy).toHaveBeenCalledWith(
      'sqlserver',
      expect.objectContaining({ schema: 'reporting' }),
      expect.stringContaining("TABLE_SCHEMA = 'reporting'"),
    );
  });

  it('preserves the timeout error when automatic cancellation is triggered', async () => {
    jest.useFakeTimers();
    const cancel = jest.fn();
    jest
      .spyOn(service as never, 'runRawQuery' as never)
      .mockImplementation(
        async (
          _type: string,
          _settings: unknown,
          _sql: string,
          _datasourceId?: string,
          orgId?: string,
          executionId?: string,
        ) => {
          (service as any).activeExecutions.set(executionId, {
            organizationId: orgId,
            cancelRequested: false,
            cancel,
          });
          return await new Promise(() => {});
        },
      );

    const execution = service.executeQuery(
      'postgres',
      {
        host: 'localhost',
        username: 'reader',
        password: 'secret',
        database: 'analytics',
      },
      'SELECT 1',
      undefined,
      'org-1',
      'execution-1',
    );
    const assertion = expect(execution).rejects.toThrow(
      'Query Timeout: La consulta superó el límite de 30 segundos.',
    );

    await jest.advanceTimersByTimeAsync(30000);

    await assertion;
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
