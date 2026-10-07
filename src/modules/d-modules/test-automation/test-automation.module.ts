import { Module } from '@nestjs/common';
import { TestAutomationController } from './test-automation.controller';
import { TestAutomationService } from './test-automation.service';
import { TestAutomationRepository } from './test-automation.repository';
import { SandboxAssertionService } from './sandbox-assertion.service';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';
import { MemmapUploadModule } from '../../c-modules/memmap-upload/memmap-upload.module';

@Module({
  imports: [DynamicDatabaseModule, MemmapUploadModule],
  controllers: [TestAutomationController],
  providers: [TestAutomationService, TestAutomationRepository, SandboxAssertionService],
  exports: [TestAutomationService, TestAutomationRepository, SandboxAssertionService],
})
export class TestAutomationModule {}
