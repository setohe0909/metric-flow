import { QueriesService } from './queries.service';

describe('QueriesService execution audit and cancellation', () => {
  const prisma = {
    execution: {
      create: jest.fn(),
    },
    query: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };
  const datasourceService = {
    findOne: jest.fn(),
  };
  const queryEngine = {
    executeQuery: jest.fn(),
    cancelExecution: jest.fn(),
  };
  const filteringService = {
    resolveForRole: jest.fn(),
    filterColumns: jest.fn(),
  };
  const auditService = {
    log: jest.fn(),
  };

  let service: QueriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    filteringService.resolveForRole.mockReturnValue({
      wrappedSql: 'SELECT * FROM matches',
      policy: { allowedColumns: null, rowFilter: null },
      isFiltered: false,
    });
    filteringService.filterColumns.mockImplementation((result) => result);
    datasourceService.findOne.mockResolvedValue({
      id: 'datasource-1',
      type: 'postgres',
      connectionSettings: { host: 'localhost' },
      accessPolicies: null,
    });
    prisma.execution.create.mockResolvedValue({});
    service = new QueriesService(
      prisma as never,
      datasourceService as never,
      queryEngine as never,
      filteringService as never,
      auditService as never,
    );
  });

  it('passes the execution id into the query engine and logs a successful run', async () => {
    queryEngine.executeQuery.mockResolvedValue({
      columns: ['id'],
      rows: [{ id: 1 }],
      rowCount: 1,
    });

    const result = await service.runRaw('org-1', 'user-1', 'EDITOR', {
      datasourceId: 'datasource-1',
      querySql: 'SELECT * FROM matches',
      executionId: 'execution-1',
    });

    expect(queryEngine.executeQuery).toHaveBeenCalledWith(
      'postgres',
      { host: 'localhost' },
      'SELECT * FROM matches',
      'datasource-1',
      'org-1',
      'execution-1',
    );
    expect(auditService.log).toHaveBeenCalledWith({
      organizationId: 'org-1',
      userId: 'user-1',
      action: 'QUERY_RUN_SUCCEEDED',
      resourceType: 'query-execution',
      resourceId: 'execution-1',
      metadata: expect.objectContaining({
        datasourceId: 'datasource-1',
        rowCount: 1,
      }),
    });
    expect(result.executionId).toBe('execution-1');
  });

  it('cancels an active execution and logs the request', async () => {
    queryEngine.cancelExecution.mockResolvedValue({
      executionId: 'execution-1',
      status: 'cancel-requested',
    });

    await expect(
      service.cancelActiveExecution('org-1', 'user-1', 'execution-1'),
    ).resolves.toEqual({
      executionId: 'execution-1',
      status: 'cancel-requested',
    });

    expect(queryEngine.cancelExecution).toHaveBeenCalledWith(
      'org-1',
      'execution-1',
    );
    expect(auditService.log).toHaveBeenCalledWith({
      organizationId: 'org-1',
      userId: 'user-1',
      action: 'QUERY_CANCEL_REQUESTED',
      resourceType: 'query-execution',
      resourceId: 'execution-1',
      metadata: {},
    });
  });
});
