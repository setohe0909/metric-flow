import { QueriesController } from './queries.controller';

describe('QueriesController', () => {
  it('allows a READER to execute read-only SQL through datasource policies', async () => {
    const queriesService = {
      runRaw: jest.fn().mockResolvedValue({ rows: [] }),
    };
    const controller = new QueriesController(queriesService as never);
    const request = {
      orgId: 'org-1',
      user: { id: 'user-1' },
      userRole: 'READER',
    };
    const dto = {
      datasourceId: 'd3426a80-1f5b-4f29-9914-3a4dba5bef20',
      querySql: 'SELECT * FROM matches',
    };

    await expect(controller.runRawQuery(request, dto)).resolves.toEqual({
      rows: [],
    });
    expect(queriesService.runRaw).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      'READER',
      dto,
    );
  });

  it('forwards cancellation requests for active executions', async () => {
    const queriesService = {
      runRaw: jest.fn(),
      cancelActiveExecution: jest.fn().mockResolvedValue({
        executionId: 'execution-1',
        status: 'cancel-requested',
      }),
    };
    const controller = new QueriesController(queriesService as never);
    const request = {
      orgId: 'org-1',
      user: { id: 'user-1' },
    };

    await expect(
      controller.cancelExecution(request, 'execution-1'),
    ).resolves.toEqual({
      executionId: 'execution-1',
      status: 'cancel-requested',
    });

    expect(queriesService.cancelActiveExecution).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      'execution-1',
    );
  });
});
