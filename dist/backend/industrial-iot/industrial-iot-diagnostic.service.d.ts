import { SubsystemHealthStatus } from '../common/subsystem.types';
import { ModbusPresetsService } from '../../modules/c-modules/modbus-presets/modbus-presets.service';
import { HmiStudioService } from '../../modules/c-modules/hmi-studio/hmi-studio.service';
export declare class IndustrialIotDiagnosticService {
    private readonly modbusPresetsService;
    private readonly hmiStudioService;
    private readonly logger;
    constructor(modbusPresetsService: ModbusPresetsService, hmiStudioService: HmiStudioService);
    checkHealth(): Promise<SubsystemHealthStatus>;
}
