"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkServersModule = void 0;
const common_1 = require("@nestjs/common");
const network_servers_service_1 = require("./network-servers.service");
const network_servers_controller_1 = require("./network-servers.controller");
const dynamic_database_module_1 = require("../database/dynamic-database.module");
const realtime_module_1 = require("../realtime/realtime.module");
let NetworkServersModule = class NetworkServersModule {
};
exports.NetworkServersModule = NetworkServersModule;
exports.NetworkServersModule = NetworkServersModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule, realtime_module_1.RealtimeModule],
        controllers: [network_servers_controller_1.NetworkServersController],
        providers: [network_servers_service_1.NetworkServersService],
        exports: [network_servers_service_1.NetworkServersService],
    })
], NetworkServersModule);
//# sourceMappingURL=network-servers.module.js.map