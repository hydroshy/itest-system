import { Injectable, Logger } from '@nestjs/common';
import { SubsystemHealthStatus, BackendSubsystem } from '../common/subsystem.types';
import { ModbusPresetsService } from '../../modules/c-modules/modbus-presets/modbus-presets.service';
import { HmiStudioService } from '../../modules/c-modules/hmi-studio/hmi-studio.service';

@Injectable()
export class IndustrialIotDiagnosticService {
  private readonly logger = new Logger('IndustrialIotSubsystem');

  constructor(
    private readonly modbusPresetsService: ModbusPresetsService,
    private readonly hmiStudioService: HmiStudioService,
  ) {}

  async checkHealth(): Promise<SubsystemHealthStatus> {
    try {
      const presets = await this.modbusPresetsService.findAll();
      const screens = await this.hmiStudioService.findAll();

      return {
        subsystem: BackendSubsystem.INDUSTRIAL_IOT,
        status: 'UP',
        timestamp: new Date().toISOString(),
        details: {
          totalModbusPresets: presets.length,
          totalHmiScreens: screens.length,
          subsystemScope: [
            'Modbus RTU / TCP presets & register mappings',
            'HMI SCADA canvas screens & widgets',
            'Industrial Overview Hub metrics',
          ],
        },
        error: null,
      };
    } catch (err: any) {
      this.logger.error(`Industrial IoT diagnostic failed: ${err.message}`, err.stack);
      return {
        subsystem: BackendSubsystem.INDUSTRIAL_IOT,
        status: 'DEGRADED',
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }
  }
}
