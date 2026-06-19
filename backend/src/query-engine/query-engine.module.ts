import { Global, Module } from '@nestjs/common';
import { QueryEngineService } from './query-engine.service';

@Global()
@Module({
  providers: [QueryEngineService],
  exports: [QueryEngineService],
})
export class QueryEngineModule {}
