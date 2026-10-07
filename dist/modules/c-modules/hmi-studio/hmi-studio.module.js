"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HmiStudioModule = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
const network_servers_module_1 = require("../../network-servers/network-servers.module");
const hmi_studio_service_1 = require("./hmi-studio.service");
const hmi_studio_controller_1 = require("./hmi-studio.controller");
let HmiStudioModule = class HmiStudioModule {
};
exports.HmiStudioModule = HmiStudioModule;
exports.HmiStudioModule = HmiStudioModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule, network_servers_module_1.NetworkServersModule],
        controllers: [hmi_studio_controller_1.HmiStudioController],
        providers: [hmi_studio_service_1.HmiStudioService],
        exports: [hmi_studio_service_1.HmiStudioService],
    })
], HmiStudioModule);
//# sourceMappingURL=hmi-studio.module.js.map