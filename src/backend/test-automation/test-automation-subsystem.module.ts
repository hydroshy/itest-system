import { Module } from '@nestjs/common';
import { DModulesModule } from '../../modules/d-modules/d-modules.module';
import { TestAutomationModule } from '../../modules/d-modules/test-automation/test-automation.module';
import { TestBuilderModule } from '../../modules/c-modules/test-builder/test-builder.module';
import { DecoderModule } from '../../modules/c-modules/decoder-admin/decoder.module';
import { TestAutomationDiagnosticService } from './test-automation-diagnostic.service';

/**
 * Test Automation Domain Subsystem
 * Unifies D-Modules registry, Test Automation workbench, C-Module Test Builder flow engine, and Payload Decoders.
 */
@Module({
  imports: [DModulesModule, TestAutomationModule, TestBuilderModule, DecoderModule],
  providers: [TestAutomationDiagnosticService],
  exports: [
    DModulesModule,
    TestAutomationModule,
    TestBuilderModule,
    DecoderModule,
    TestAutomationDiagnosticService,
  ],
})
export class TestAutomationSubsystemModule {}
