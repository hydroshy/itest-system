"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceTestedModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const device_tested_repository_1 = require("./device-tested.repository");
const device_tested_service_1 = require("./device-tested.service");
const device_tested_controller_1 = require("./device-tested.controller");
let DeviceTestedModule = class DeviceTestedModule {
};
exports.DeviceTestedModule = DeviceTestedModule;
exports.DeviceTestedModule = DeviceTestedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.register({
                limits: {
                    fileSize: 50 * 1024 * 1024,
                    fieldSize: 50 * 1024 * 1024,
                },
            }),
        ],
        controllers: [device_tested_controller_1.DeviceTestedController],
        providers: [device_tested_repository_1.DeviceTestedRepository, device_tested_service_1.DeviceTestedService],
        exports: [device_tested_repository_1.DeviceTestedRepository, device_tested_service_1.DeviceTestedService],
    })
], DeviceTestedModule);
//# sourceMappingURL=device-tested.module.js.map