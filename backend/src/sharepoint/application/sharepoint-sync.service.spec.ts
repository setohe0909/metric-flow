import { SharePointSyncService } from './sharepoint-sync.service';

describe('SharePointSyncService', () => {
  const prisma = {
    datasource: {
      findFirst: jest.fn(),
    },
    sharePointApprovedResource: {
      findFirst: jest.fn(),
    },
    sharePointSyncState: {
      upsert: jest.fn(),
    },
    sharePointCachedContent: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  const encryption = {
    decrypt: jest.fn((value: string) =>
      value.startsWith('enc:') ? value.slice(4) : value,
    ),
  };

  const contentSource = {
    readListItems: jest.fn(),
    readDriveItems: jest.fn(),
  };

  let service: SharePointSyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SharePointSyncService(
      prisma as any,
      encryption as any,
      contentSource as any,
    );
  });

  it('syncs an approved SharePoint list into cached tabular rows', async () => {
    prisma.sharePointApprovedResource.findFirst.mockResolvedValue({
      id: 'resource-1',
      organizationId: 'org-1',
      datasourceId: 'ds-1',
      resourceType: 'list',
      resourceId: 'list-1',
      resourceName: 'Projects',
      siteId: 'site-1',
      siteName: 'Intranet',
      webUrl: 'https://contoso.sharepoint.com/sites/intranet/lists/projects',
      enabled: true,
    });
    prisma.datasource.findFirst.mockResolvedValue({
      id: 'ds-1',
      organizationId: 'org-1',
      type: 'sharepoint',
      connectionSettings: JSON.stringify({
        tenantId: 'tenant-1',
        clientId: 'client-1',
        clientSecret: 'enc:secret',
      }),
    });
    contentSource.readListItems.mockResolvedValue({
      columns: ['Title', 'Status'],
      rows: [{ Title: 'Migration', Status: 'Green' }],
    });

    await expect(
      service.refreshResource('org-1', 'resource-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'success',
        rowCount: 1,
      }),
    );

    expect(contentSource.readListItems).toHaveBeenCalledWith(
      expect.objectContaining({ clientSecret: 'secret' }),
      expect.objectContaining({ id: 'resource-1' }),
    );
    expect(prisma.sharePointCachedContent.deleteMany).toHaveBeenCalledWith({
      where: { approvedResourceId: 'resource-1' },
    });
    expect(prisma.sharePointCachedContent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          organizationId: 'org-1',
          approvedResourceId: 'resource-1',
          contentType: 'tabularRow',
          rowData: { Title: 'Migration', Status: 'Green' },
        }),
      ],
    });
    expect(prisma.sharePointSyncState.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { approvedResourceId: 'resource-1' },
        update: expect.objectContaining({
          status: 'success',
          rowCount: 1,
          lastError: null,
        }),
      }),
    );
  });
});
