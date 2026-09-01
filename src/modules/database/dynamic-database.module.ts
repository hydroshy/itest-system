import { Module, Global } from '@nestjs/common';
import { DynamicDatabaseService } from './dynamic-database.service';
import { DatabaseController } from './database.controller';

@Global()
@Module({
  controllers: [DatabaseController],
  providers: [DynamicDatabaseService],
  exports: [DynamicDatabaseService],
})
export class DynamicDatabaseModule {}
