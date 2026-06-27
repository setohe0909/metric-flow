import { BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

describe('DashboardService publication', () => {
  const prisma = {
    dashboard: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    dashboardPage: {
      findMany: jest.fn(),
    },
    widget: {
      findFirst: jest.fn(),
    },
  };
  const queriesService = {
    runRaw: jest.fn(),
  };
  const auditService = {
    log: jest.fn(),
  };

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(
      prisma as never,
      queriesService as never,
      auditService as never,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('lists only published dashboards for a READER', async () => {
    prisma.dashboard.findMany.mockResolvedValue([]);

    await service.findAll('org-1', 'READER');

    expect(prisma.dashboard.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        publishedAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        description: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('does not include saved query details in a READER dashboard', async () => {
    prisma.dashboard.findFirst.mockResolvedValue({
      id: 'dashboard-1',
      widgets: [],
    });

    await service.findOne('org-1', 'dashboard-1', 'READER');

    expect(prisma.dashboard.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'dashboard-1',
        organizationId: 'org-1',
        publishedAt: { not: null },
      },
      select: expect.objectContaining({
        widgets: {
          select: expect.not.objectContaining({
            query: expect.anything(),
          }),
          orderBy: { createdAt: 'asc' },
        },
      }),
    });
  });

  it('returns dashboard pages with safe widget details for a READER dashboard', async () => {
    prisma.dashboard.findFirst.mockResolvedValue({
      id: 'dashboard-1',
      pages: [
        {
          id: 'page-1',
          title: 'Resumen',
          slug: 'resumen',
          order: 0,
          widgets: [
            {
              id: 'widget-1',
              title: 'Revenue',
              type: 'bar',
              chartConfig: {},
            },
          ],
        },
      ],
      widgets: [],
    });

    const dashboard = await service.findOne('org-1', 'dashboard-1', 'READER');

    expect(dashboard.pages).toHaveLength(1);
    expect(prisma.dashboard.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'dashboard-1',
        organizationId: 'org-1',
        publishedAt: { not: null },
      },
      select: expect.objectContaining({
        pages: {
          select: expect.objectContaining({
            id: true,
            title: true,
            slug: true,
            icon: true,
            order: true,
            config: true,
            widgets: expect.any(Object),
          }),
          orderBy: { order: 'asc' },
        },
      }),
    });
  });

  it('scopes publication updates by organization', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-25T00:00:00Z'));
    prisma.dashboard.updateMany.mockResolvedValue({ count: 1 });
    prisma.dashboard.findUnique.mockResolvedValue({
      id: 'dashboard-1',
      publishedAt: new Date(),
    });

    await service.setPublished('org-1', 'user-1', 'dashboard-1', true);

    expect(prisma.dashboard.updateMany).toHaveBeenCalledWith({
      where: { id: 'dashboard-1', organizationId: 'org-1' },
      data: { publishedAt: new Date('2026-06-25T00:00:00Z') },
    });
    expect(auditService.log).toHaveBeenCalledWith({
      organizationId: 'org-1',
      userId: 'user-1',
      action: 'DASHBOARD_PUBLISHED',
      resourceType: 'dashboard',
      resourceId: 'dashboard-1',
      metadata: {},
    });
  });

  it('rejects publication when the dashboard is outside the organization', async () => {
    prisma.dashboard.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.setPublished('org-1', 'user-1', 'dashboard-2', true),
    ).rejects.toThrow(new BadRequestException('Dashboard no encontrado'));
  });

  it('executes widget data through QueriesService with tenant and role context', async () => {
    prisma.dashboard.findFirst.mockResolvedValue({
      id: 'dashboard-1',
      widgets: [],
    });
    prisma.widget.findFirst.mockResolvedValue({
      query: {
        datasourceId: 'datasource-1',
        querySql: 'SELECT * FROM matches',
      },
    });
    queriesService.runRaw.mockResolvedValue({ rows: [] });

    await service.getWidgetData(
      'org-1',
      'dashboard-1',
      'widget-1',
      'user-1',
      'READER',
    );

    expect(prisma.widget.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'widget-1',
        dashboardId: 'dashboard-1',
        dashboard: { organizationId: 'org-1' },
      },
      include: { query: true },
    });
    expect(queriesService.runRaw).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      'READER',
      {
        datasourceId: 'datasource-1',
        querySql: 'SELECT * FROM matches',
      },
    );
  });

  it('executes public widget data with READER policies and anonymous audit context', async () => {
    prisma.dashboard.findFirst.mockResolvedValue({
      id: 'dashboard-1',
      organizationId: 'org-1',
    });
    prisma.widget.findFirst.mockResolvedValue({
      query: {
        datasourceId: 'datasource-1',
        querySql: 'SELECT * FROM matches',
      },
    });
    queriesService.runRaw.mockResolvedValue({ rows: [] });

    await service.getPublicWidgetData('share-token', 'widget-1');

    expect(queriesService.runRaw).toHaveBeenCalledWith(
      'org-1',
      null,
      'READER',
      {
        datasourceId: 'datasource-1',
        querySql: 'SELECT * FROM matches',
      },
    );
  });

  it('logs public dashboard views for auditing', async () => {
    prisma.dashboard.findFirst.mockResolvedValue({
      id: 'dashboard-1',
      organizationId: 'org-1',
      name: 'Revenue',
      widgets: [],
    });

    await service.getPublicDashboard('share-token');

    expect(auditService.log).toHaveBeenCalledWith({
      organizationId: 'org-1',
      userId: null,
      action: 'DASHBOARD_PUBLIC_VIEWED',
      resourceType: 'dashboard-share',
      resourceId: 'share-token',
      metadata: {
        dashboardId: 'dashboard-1',
      },
    });
  });
});
