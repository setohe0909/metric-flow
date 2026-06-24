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

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPgPool),
}));

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => mockMysqlPool),
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
});
