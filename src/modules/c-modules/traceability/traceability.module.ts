import { Module } from '@nestjs/common';
import { TraceabilityController } from './traceability.controller';
import { TraceabilityService } from './traceability.service';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [TraceabilityController],
  providers: [TraceabilityService],
  exports: [TraceabilityService],
})
export class TraceabilityModule {}
