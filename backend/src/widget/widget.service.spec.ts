import { BadRequestException } from '@nestjs/common';
import { WidgetService } from './widget.service';

describe('WidgetService dashboard pages', () => {
  const prisma = {
    dashboard: {
      findFirst: jest.fn(),
    },
    dashboardPage: {
      findFirst: jest.fn(),
    },
    query: {
      findFirst: jest.fn(),
    },
    widget: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: WidgetService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WidgetService(prisma as never);
  });

  it('assigns a new widget to a page owned by the same dashboard and organization', async () => {
    prisma.dashboard.findFirst.mockResolvedValue({ id: 'dashboard-1' });
    prisma.dashboardPage.findFirst.mockResolvedValue({
      id: 'page-1',
      dashboardId: 'dashboard-1',
    });
    prisma.widget.create.mockResolvedValue({ id: 'widget-1' });

    await service.create('org-1', {
      dashboardId: 'dashboard-1',
      pageId: 'page-1',
      title: 'Revenue',
      type: 'bar',
      chartConfig: {},
    });

    expect(prisma.dashboardPage.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'page-1',
        dashboardId: 'dashboard-1',
        dashboard: { organizationId: 'org-1' },
      },
    });
    expect(prisma.widget.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dashboardId: 'dashboard-1',
        pageId: 'page-1',
      }),
    });
  });

  it('rejects page assignment outside the dashboard organization', async () => {
    prisma.dashboard.findFirst.mockResolvedValue({ id: 'dashboard-1' });
    prisma.dashboardPage.findFirst.mockResolvedValue(null);

    await expect(
      service.create('org-1', {
        dashboardId: 'dashboard-1',
        pageId: 'page-2',
        title: 'Revenue',
        type: 'bar',
        chartConfig: {},
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'La página especificada no pertenece a este dashboard.',
      ),
    );
  });
});
