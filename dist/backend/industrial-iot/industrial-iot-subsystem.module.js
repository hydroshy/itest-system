"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndustrialIotSubsystemModule = void 0;
const common_1 = require("@nestjs/common");
const modbus_presets_module_1 = require("../../modules/c-modules/modbus-presets/modbus-presets.module");
const hmi_studio_module_1 = require("../../modules/c-modules/hmi-studio/hmi-studio.module");
const overview_hub_module_1 = require("../../modules/c-modules/overview-hub/overview-hub.module");
const industrial_iot_diagnostic_service_1 = require("./industrial-iot-diagnostic.service");
let IndustrialIotSubsystemModule = class IndustrialIotSubsystemModule {
};
exports.IndustrialIotSubsystemModule = IndustrialIotSubsystemModule;
exports.IndustrialIotSubsystemModule = IndustrialIotSubsystemModule = __decorate([
    (0, common_1.Module)({
        imports: [modbus_presets_module_1.ModbusPresetsModule, hmi_studio_module_1.HmiStudioModule, overview_hub_module_1.OverviewHubModule],
        providers: [industrial_iot_diagnostic_service_1.IndustrialIotDiagnosticService],
        exports: [
            modbus_presets_module_1.ModbusPresetsModule,
            hmi_studio_module_1.HmiStudioModule,
            overview_hub_module_1.OverviewHubModule,
            industrial_iot_diagnostic_service_1.IndustrialIotDiagnosticService,
        ],
    })
], IndustrialIotSubsystemModule);
//# sourceMappingURL=industrial-iot-subsystem.module.js.map