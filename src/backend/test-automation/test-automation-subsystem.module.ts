import { Module } from '@nestjs/common';
import { DModulesModule } from '../../modules/d-modules/d-modules.module';
import { TestAutomationModule } from '../../modules/d-modules/test-automation/test-automation.module';
import { TestBuilderModule } from '../../modules/c-modules/test-builder/test-builder.module';
import { DecoderModule } from '../../modules/c-modules/decoder-admin/decoder.module';
import { MemmapUploadModule } from '../../modules/c-modules/memmap-upload/memmap-upload.module';
import { DeviceTestedModule } from '../../modules/c-modules/device-tested/device-tested.module';
import { TestAutomationDiagnosticService } from './test-automation-diagnostic.service';

/**
 * Test Automation Domain Subsystem
 * Unifies D-Modules registry, Test Automation workbench, C-Module Test Builder flow engine, Memory Map Upload, Payload Decoders, and Device Tested QA Verification.
 */
@Module({
  imports: [
    DModulesModule,
    TestAutomationModule,
    TestBuilderModule,
    DecoderModule,
    MemmapUploadModule,
    DeviceTestedModule,
  ],
  providers: [TestAutomationDiagnosticService],
  exports: [
    DModulesModule,
    TestAutomationModule,
    TestBuilderModule,
    DecoderModule,
    MemmapUploadModule,
    DeviceTestedModule,
    TestAutomationDiagnosticService,
  ],
})
export class TestAutomationSubsystemModule {}
