import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDatasourceDto } from './datasource.dto';

describe('CreateDatasourceDto', () => {
  it('accepts sqlserver as a supported datasource type', async () => {
    const dto = plainToInstance(CreateDatasourceDto, {
      name: 'SQL Server Analytics',
      type: 'sqlserver',
      connectionSettings: {
        host: 'sqlserver.local',
        port: 1433,
        username: 'reader',
        password: 'secret',
        database: 'analytics',
        ssl: true,
      },
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts sharepoint as a supported datasource type with tenant credentials', async () => {
    const dto = plainToInstance(CreateDatasourceDto, {
      name: 'Corporate SharePoint',
      type: 'sharepoint',
      connectionSettings: {
        tenantId: 'tenant-123',
        clientId: 'client-123',
        clientSecret: 'secret-value',
      },
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
