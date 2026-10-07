import { Module } from '@nestjs/common';
import { DModulesModule } from '../../modules/d-modules/d-modules.module';
import { TestAutomationModule } from '../../modules/d-modules/test-automation/test-automation.module';
import { TestBuilderModule } from '../../modules/c-modules/test-builder/test-builder.module';
import { DecoderModule } from '../../modules/c-modules/decoder-admin/decoder.module';
import { MemmapUploadModule } from '../../modules/c-modules/memmap-upload/memmap-upload.module';
import { TestAutomationDiagnosticService } from './test-automation-diagnostic.service';

/**
 * Test Automation Domain Subsystem
 * Unifies D-Modules registry, Test Automation workbench, C-Module Test Builder flow engine, Memory Map Upload, and Payload Decoders.
 */
@Module({
  imports: [
    DModulesModule,
    TestAutomationModule,
    TestBuilderModule,
    DecoderModule,
    MemmapUploadModule,
  ],
  providers: [TestAutomationDiagnosticService],
  exports: [
    DModulesModule,
    TestAutomationModule,
    TestBuilderModule,
    DecoderModule,
    MemmapUploadModule,
    TestAutomationDiagnosticService,
  ],
})
export class TestAutomationSubsystemModule {}
