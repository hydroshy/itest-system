import { Module } from '@nestjs/common';
import { ModbusPresetsModule } from '../../modules/c-modules/modbus-presets/modbus-presets.module';
import { HmiStudioModule } from '../../modules/c-modules/hmi-studio/hmi-studio.module';
import { OverviewHubModule } from '../../modules/c-modules/overview-hub/overview-hub.module';
import { IndustrialIotDiagnosticService } from './industrial-iot-diagnostic.service';

/**
 * Industrial IoT Domain Subsystem
 * Unifies Modbus Presets, HMI Studio canvas, and Overview Hub metrics.
 */
@Module({
  imports: [ModbusPresetsModule, HmiStudioModule, OverviewHubModule],
  providers: [IndustrialIotDiagnosticService],
  exports: [
    ModbusPresetsModule,
    HmiStudioModule,
    OverviewHubModule,
    IndustrialIotDiagnosticService,
  ],
})
export class IndustrialIotSubsystemModule {}
