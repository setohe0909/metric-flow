import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { RunQueryDto } from './queries.dto';

describe('RunQueryDto validation', () => {
  it('accepts executionId when the global whitelist pipe is enabled', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    await expect(
      pipe.transform(
        {
          datasourceId: 'd3426a80-1f5b-4f29-9914-3a4dba5bef20',
          querySql: 'SELECT 1',
          executionId: '123e4567-e89b-42d3-a456-426614174000',
        },
        {
          type: 'body',
          metatype: RunQueryDto,
        },
      ),
    ).resolves.toMatchObject({
      datasourceId: 'd3426a80-1f5b-4f29-9914-3a4dba5bef20',
      querySql: 'SELECT 1',
      executionId: '123e4567-e89b-42d3-a456-426614174000',
    });
  });
});
