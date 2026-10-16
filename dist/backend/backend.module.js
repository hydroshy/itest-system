"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const dynamic_database_module_1 = require("./database/dynamic-database.module");
const identity_subsystem_module_1 = require("./identity/identity-subsystem.module");
const realtime_subsystem_module_1 = require("./realtime/realtime-subsystem.module");
const plugin_management_module_1 = require("./plugins/plugin-management.module");
const backend_diagnostics_controller_1 = require("./backend-diagnostics.controller");
const subsystem_debug_interceptor_1 = require("./common/subsystem-debug.interceptor");
let BackendModule = class BackendModule {
};
exports.BackendModule = BackendModule;
exports.BackendModule = BackendModule = __decorate([
    (0, common_1.Module)({
        imports: [
            dynamic_database_module_1.DatabaseSubsystemModule,
            identity_subsystem_module_1.IdentitySubsystemModule,
            realtime_subsystem_module_1.RealtimeSubsystemModule,
            plugin_management_module_1.PluginManagementModule,
        ],
        controllers: [backend_diagnostics_controller_1.BackendDiagnosticsController],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: subsystem_debug_interceptor_1.SubsystemDebugInterceptor,
            },
        ],
        exports: [
            dynamic_database_module_1.DatabaseSubsystemModule,
            identity_subsystem_module_1.IdentitySubsystemModule,
            realtime_subsystem_module_1.RealtimeSubsystemModule,
            plugin_management_module_1.PluginManagementModule,
        ],
    })
], BackendModule);
//# sourceMappingURL=backend.module.js.map