"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndustrialIotDiagnosticService = void 0;
const common_1 = require("@nestjs/common");
const subsystem_types_1 = require("../common/subsystem.types");
const modbus_presets_service_1 = require("../../modules/c-modules/modbus-presets/modbus-presets.service");
const hmi_studio_service_1 = require("../../modules/c-modules/hmi-studio/hmi-studio.service");
let IndustrialIotDiagnosticService = class IndustrialIotDiagnosticService {
    constructor(modbusPresetsService, hmiStudioService) {
        this.modbusPresetsService = modbusPresetsService;
        this.hmiStudioService = hmiStudioService;
        this.logger = new common_1.Logger('IndustrialIotSubsystem');
    }
    async checkHealth() {
        try {
            const presets = await this.modbusPresetsService.findAll();
            const screens = await this.hmiStudioService.findAll();
            return {
                subsystem: subsystem_types_1.BackendSubsystem.INDUSTRIAL_IOT,
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
        }
        catch (err) {
            this.logger.error(`Industrial IoT diagnostic failed: ${err.message}`, err.stack);
            return {
                subsystem: subsystem_types_1.BackendSubsystem.INDUSTRIAL_IOT,
                status: 'DEGRADED',
                timestamp: new Date().toISOString(),
                error: err.message,
            };
        }
    }
};
exports.IndustrialIotDiagnosticService = IndustrialIotDiagnosticService;
exports.IndustrialIotDiagnosticService = IndustrialIotDiagnosticService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [modbus_presets_service_1.ModbusPresetsService,
        hmi_studio_service_1.HmiStudioService])
], IndustrialIotDiagnosticService);
//# sourceMappingURL=industrial-iot-diagnostic.service.js.map