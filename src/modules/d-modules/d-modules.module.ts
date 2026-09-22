import { Module } from '@nestjs/common';
import { DModulesController } from './d-modules.controller';
import { DModulesService } from './d-modules.service';
import { TestAutomationModule } from './test-automation/test-automation.module';

@Module({
  imports: [TestAutomationModule],
  controllers: [DModulesController],
  providers: [DModulesService],
  exports: [DModulesService, TestAutomationModule],
})
export class DModulesModule {}
