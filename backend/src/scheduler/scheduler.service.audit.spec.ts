import { SchedulerService } from './scheduler.service';

describe('SchedulerService audit logging', () => {
  const prisma = {
    query: {
      findFirst: jest.fn(),
    },
    scheduledQuery: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scheduleHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    execution: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const datasourceService = {
    findOne: jest.fn(),
  };
  const queryEngine = {
    executeQuery: jest.fn(),
  };
  const emailService = {
    sendEmailReport: jest.fn().mockResolvedValue(true),
  };
  const auditService = {
    log: jest.fn(),
  };

  let service: SchedulerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SchedulerService(
      prisma as never,
      datasourceService as never,
      queryEngine as never,
      emailService as never,
      auditService as never,
    );
  });

  it('logs schedule creation with the owning query context', async () => {
    prisma.query.findFirst.mockResolvedValue({
      id: 'query-1',
      organizationId: 'org-1',
      name: 'Revenue',
    });
    jest
      .spyOn(service, 'calculateNextRun')
      .mockReturnValue(new Date('2026-06-25T20:00:00Z'));
    prisma.scheduledQuery.create.mockResolvedValue({
      id: 'schedule-1',
      queryId: 'query-1',
      name: 'Nightly Revenue',
    });

    await service.create('org-1', {
      queryId: 'query-1',
      name: 'Nightly Revenue',
      cronExpression: '0 20 * * *',
      recipients: ['ops@example.com'],
    });

    expect(auditService.log).toHaveBeenCalledWith({
      organizationId: 'org-1',
      userId: null,
      action: 'SCHEDULE_CREATED',
      resourceType: 'schedule',
      resourceId: 'schedule-1',
      metadata: {
        queryId: 'query-1',
        cronExpression: '0 20 * * *',
      },
    });
  });

  it('logs successful scheduled executions', async () => {
    datasourceService.findOne.mockResolvedValue({
      id: 'datasource-1',
      type: 'postgres',
      connectionSettings: { host: 'localhost' },
    });
    queryEngine.executeQuery.mockResolvedValue({
      columns: ['id'],
      rows: [{ id: 1 }],
      rowCount: 1,
    });

    await (service as any).processSchedule({
      id: 'schedule-1',
      name: 'Nightly Revenue',
      cronExpression: '0 20 * * *',
      recipients: ['ops@example.com'],
      format: 'csv',
      organizationId: 'org-1',
      query: {
        id: 'query-1',
        name: 'Revenue',
        datasourceId: 'datasource-1',
        querySql: 'SELECT 1',
      },
    });

    expect(auditService.log).toHaveBeenCalledWith({
      organizationId: 'org-1',
      userId: null,
      action: 'SCHEDULE_RUN_SUCCEEDED',
      resourceType: 'schedule',
      resourceId: 'schedule-1',
      metadata: expect.objectContaining({
        queryId: 'query-1',
        rowCount: 1,
      }),
    });
  });
});
