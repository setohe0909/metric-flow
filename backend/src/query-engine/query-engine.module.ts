import { Global, Module } from '@nestjs/common';
import { QueryEngineService } from './query-engine.service';
import { SqlReadOnlyPolicy } from './sql-read-only-policy';

@Global()
@Module({
  providers: [QueryEngineService, SqlReadOnlyPolicy],
  exports: [QueryEngineService],
})
export class QueryEngineModule {}
