import { Module } from '@nestjs/common';
import { SystemOpsService } from './system-ops.service';
import { SystemOpsController } from './system-ops.controller';

@Module({
  controllers: [SystemOpsController],
  providers: [SystemOpsService],
  exports: [SystemOpsService],
})
export class OverviewHubModule {}
