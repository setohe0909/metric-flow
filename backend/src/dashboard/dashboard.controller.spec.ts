import { ForbiddenException } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';

describe('DashboardController publication', () => {
  const dashboardService = {
    setPublished: jest.fn(),
  };
  const controller = new DashboardController(dashboardService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows ADMIN and EDITOR to publish a dashboard', async () => {
    dashboardService.setPublished.mockResolvedValue({ id: 'dashboard-1' });

    await controller.setPublished(
      { orgId: 'org-1', userRole: 'EDITOR', user: { id: 'user-1' } },
      'dashboard-1',
      { published: true },
    );

    expect(dashboardService.setPublished).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      'dashboard-1',
      true,
    );
  });

  it('rejects a READER publishing a dashboard', () => {
    expect(() =>
      controller.setPublished(
        { orgId: 'org-1', userRole: 'READER', user: { id: 'user-1' } },
        'dashboard-1',
        { published: true },
      ),
    ).toThrow(
      new ForbiddenException('Los lectores no pueden publicar dashboards.'),
    );
  });
});
