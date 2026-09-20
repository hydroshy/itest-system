import { Module } from '@nestjs/common';
import { TestBuilderController } from './test-builder.controller';
import { TestBuilderService } from './test-builder.service';
import { FlowGraphEngineService } from './flow-graph-engine.service';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [TestBuilderController],
  providers: [TestBuilderService, FlowGraphEngineService],
  exports: [TestBuilderService, FlowGraphEngineService],
})
export class TestBuilderModule {}

