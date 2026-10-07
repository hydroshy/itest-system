"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensorTypesModule = void 0;
const common_1 = require("@nestjs/common");
const sensor_types_controller_1 = require("./sensor-types.controller");
const sensor_types_service_1 = require("./sensor-types.service");
const sensor_types_repository_1 = require("./sensor-types.repository");
let SensorTypesModule = class SensorTypesModule {
};
exports.SensorTypesModule = SensorTypesModule;
exports.SensorTypesModule = SensorTypesModule = __decorate([
    (0, common_1.Module)({
        controllers: [sensor_types_controller_1.SensorTypesController],
        providers: [sensor_types_repository_1.SensorTypesRepository, sensor_types_service_1.SensorTypesService],
        exports: [sensor_types_service_1.SensorTypesService, sensor_types_repository_1.SensorTypesRepository],
    })
], SensorTypesModule);
//# sourceMappingURL=sensor-types.module.js.map