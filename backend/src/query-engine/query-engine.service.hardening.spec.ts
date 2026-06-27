import { BadRequestException } from '@nestjs/common';
import { QueryEngineService } from './query-engine.service';
import { SqlReadOnlyPolicy } from './sql-read-only-policy';

describe('QueryEngineService hardening', () => {
  const sqlPolicy = {
    prepare: jest.fn((_type: string, sql: string) => sql),
  } as unknown as SqlReadOnlyPolicy;

  let service: QueryEngineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QueryEngineService(sqlPolicy);
  });

  it('rejects sqlite paths that escape the organization storage directory', async () => {
    await expect(
      service.executeQuery(
        'sqlite',
        { filePath: '../other-org/secret.sqlite' },
        'SELECT 1',
        undefined,
        'org-1',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'La ruta del archivo SQLite/CSV es inválida para esta organización.',
      ),
    );
  });
});
