import { ForbiddenException } from '@nestjs/common';
import { AuditController } from './audit.controller';

describe('AuditController', () => {
  it('allows non-readers to fetch recent audit entries with a bounded limit', async () => {
    const auditService = {
      listRecent: jest.fn().mockResolvedValue([]),
    };
    const controller = new AuditController(auditService as never);

    await expect(
      controller.findRecent({ orgId: 'org-1', userRole: 'EDITOR' }, '25'),
    ).resolves.toEqual([]);

    expect(auditService.listRecent).toHaveBeenCalledWith('org-1', 25);
  });

  it('rejects readers from fetching audit entries', () => {
    const controller = new AuditController({ listRecent: jest.fn() } as never);

    return expect(
      controller.findRecent({ orgId: 'org-1', userRole: 'READER' }, undefined),
    ).rejects.toThrow(
      new ForbiddenException(
        'Los visualizadores no pueden consultar la auditoría.',
      ),
    );
  });
});
