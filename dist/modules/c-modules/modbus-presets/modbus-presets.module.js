"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModbusPresetsModule = void 0;
const common_1 = require("@nestjs/common");
const modbus_presets_controller_1 = require("./modbus-presets.controller");
const modbus_presets_service_1 = require("./modbus-presets.service");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
const create_final_config_module_1 = require("../create-final-config/create-final-config.module");
let ModbusPresetsModule = class ModbusPresetsModule {
};
exports.ModbusPresetsModule = ModbusPresetsModule;
exports.ModbusPresetsModule = ModbusPresetsModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule, create_final_config_module_1.CreateFinalConfigModule],
        controllers: [modbus_presets_controller_1.ModbusPresetsController],
        providers: [modbus_presets_service_1.ModbusPresetsService],
        exports: [modbus_presets_service_1.ModbusPresetsService],
    })
], ModbusPresetsModule);
//# sourceMappingURL=modbus-presets.module.js.map