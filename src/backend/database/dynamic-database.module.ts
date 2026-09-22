import { Module, Global } from '@nestjs/common';
import { DynamicDatabaseService } from './dynamic-database.service';
import { DatabaseController } from './database.controller';

import { DatabaseDiagnosticService } from './database-diagnostic.service';

@Global()
@Module({
  controllers: [DatabaseController],
  providers: [DynamicDatabaseService, DatabaseDiagnosticService],
  exports: [DynamicDatabaseService, DatabaseDiagnosticService],
})
export class DynamicDatabaseModule {}
export { DynamicDatabaseModule as DatabaseSubsystemModule };

