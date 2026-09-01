import { Module, Global } from '@nestjs/common';
import { DynamicDatabaseService } from './dynamic-database.service';

@Global()
@Module({
  providers: [DynamicDatabaseService],
  exports: [DynamicDatabaseService],
})
export class DynamicDatabaseModule {}
