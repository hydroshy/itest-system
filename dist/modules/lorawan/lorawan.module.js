"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LorawanModule = void 0;
const common_1 = require("@nestjs/common");
const lorawan_service_1 = require("./lorawan.service");
const lorawan_controller_1 = require("./lorawan.controller");
const payload_formatter_service_1 = require("./payload-formatters/payload-formatter.service");
const device_provisioning_service_1 = require("./services/device-provisioning.service");
const lorawan_resilience_service_1 = require("./services/lorawan-resilience.service");
let LorawanModule = class LorawanModule {
};
exports.LorawanModule = LorawanModule;
exports.LorawanModule = LorawanModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            lorawan_resilience_service_1.LorawanResilienceService,
            payload_formatter_service_1.PayloadFormatterService,
            device_provisioning_service_1.DeviceProvisioningService,
            lorawan_service_1.LorawanService,
        ],
        controllers: [lorawan_controller_1.LorawanController],
        exports: [
            lorawan_resilience_service_1.LorawanResilienceService,
            payload_formatter_service_1.PayloadFormatterService,
            device_provisioning_service_1.DeviceProvisioningService,
            lorawan_service_1.LorawanService,
        ],
    })
], LorawanModule);
//# sourceMappingURL=lorawan.module.js.map