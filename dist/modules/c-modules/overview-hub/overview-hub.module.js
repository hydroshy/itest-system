"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewHubModule = void 0;
const common_1 = require("@nestjs/common");
const system_ops_service_1 = require("./system-ops.service");
const system_ops_controller_1 = require("./system-ops.controller");
let OverviewHubModule = class OverviewHubModule {
};
exports.OverviewHubModule = OverviewHubModule;
exports.OverviewHubModule = OverviewHubModule = __decorate([
    (0, common_1.Module)({
        controllers: [system_ops_controller_1.SystemOpsController],
        providers: [system_ops_service_1.SystemOpsService],
        exports: [system_ops_service_1.SystemOpsService],
    })
], OverviewHubModule);
//# sourceMappingURL=overview-hub.module.js.map