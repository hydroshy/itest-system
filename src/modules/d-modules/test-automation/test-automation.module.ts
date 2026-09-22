import { Module } from '@nestjs/common';
import { TestAutomationController } from './test-automation.controller';
import { TestAutomationService } from './test-automation.service';
import { TestAutomationRepository } from './test-automation.repository';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [TestAutomationController],
  providers: [TestAutomationService, TestAutomationRepository],
  exports: [TestAutomationService, TestAutomationRepository],
})
export class TestAutomationModule {}
