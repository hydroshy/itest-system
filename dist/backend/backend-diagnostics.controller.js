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
exports.BackendDiagnosticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const subsystem_types_1 = require("./common/subsystem.types");
const database_diagnostic_service_1 = require("./database/database-diagnostic.service");
const identity_diagnostic_service_1 = require("./identity/identity-diagnostic.service");
const realtime_diagnostic_service_1 = require("./realtime/realtime-diagnostic.service");
const plugin_manager_service_1 = require("./plugins/plugin-manager.service");
let BackendDiagnosticsController = class BackendDiagnosticsController {
    constructor(dbDiagnostic, identityDiagnostic, realtimeDiagnostic, pluginManager) {
        this.dbDiagnostic = dbDiagnostic;
        this.identityDiagnostic = identityDiagnostic;
        this.realtimeDiagnostic = realtimeDiagnostic;
        this.pluginManager = pluginManager;
    }
    async getDiagnostics() {
        const [db, identity, realtime] = await Promise.all([
            this.dbDiagnostic.checkHealth(),
            this.identityDiagnostic.checkHealth(),
            this.realtimeDiagnostic.checkHealth(),
        ]);
        let pluginsStatus;
        try {
            const plugins = await this.pluginManager.listPlugins();
            pluginsStatus = {
                subsystem: subsystem_types_1.BackendSubsystem.PLUGINS,
                status: 'UP',
                timestamp: new Date().toISOString(),
                details: { totalPlugins: plugins.length },
            };
        }
        catch (err) {
            pluginsStatus = {
                subsystem: subsystem_types_1.BackendSubsystem.PLUGINS,
                status: 'DEGRADED',
                timestamp: new Date().toISOString(),
                error: err.message,
            };
        }
        const subsystems = {
            [subsystem_types_1.BackendSubsystem.DATABASE]: db,
            [subsystem_types_1.BackendSubsystem.IDENTITY]: identity,
            [subsystem_types_1.BackendSubsystem.REALTIME]: realtime,
            [subsystem_types_1.BackendSubsystem.PLUGINS]: pluginsStatus,
        };
        const hasDown = Object.values(subsystems).some((s) => s.status === 'DOWN');
        const hasDegraded = Object.values(subsystems).some((s) => s.status === 'DEGRADED');
        return {
            timestamp: new Date().toISOString(),
            overallStatus: hasDown ? 'DOWN' : hasDegraded ? 'DEGRADED' : 'UP',
            subsystems,
            debugGuidance: [
                'Check X-Daviteq-Subsystem in HTTP response headers to identify which domain handled the request.',
                'If DATABASE is DEGRADED: verify db-routing.config.json and connection string credentials.',
                'If IDENTITY errors: verify database user table and JWT secret configuration.',
                'If REALTIME errors: verify WebSocket gateway listening port and client connection limits.',
                'If PLUGINS errors: check core_plugins database table and plugin storage directory.',
            ],
        };
    }
    getSubsystemDirectory() {
        return {
            architecture: 'Platform Core Backbone & Dynamic Plugin Architecture',
            version: '3.0.0',
            subsystems: [
                {
                    id: subsystem_types_1.BackendSubsystem.DATABASE,
                    name: 'Dynamic Database Subsystem',
                    routes: ['/api/database/health', '/api/database/status', '/api/database/reload'],
                    description: 'Multi-tenant database connection pool, dynamic routing & health.',
                },
                {
                    id: subsystem_types_1.BackendSubsystem.IDENTITY,
                    name: 'Identity & Access Control Subsystem',
                    routes: ['/auth/*', '/api/users/*', '/api/roles/*'],
                    description: 'JWT authentication, RBAC authorization, and user administration.',
                },
                {
                    id: subsystem_types_1.BackendSubsystem.REALTIME,
                    name: 'Realtime Streaming Subsystem',
                    routes: ['/realtime/*', 'ws://*'],
                    description: 'WebSocket telemetry and test packet streaming.',
                },
                {
                    id: subsystem_types_1.BackendSubsystem.PLUGINS,
                    name: 'Plugin Management Engine',
                    routes: ['/api/plugins/*'],
                    description: 'Plugin lifecycle, storage, audit logs, and dynamic extension loading.',
                },
            ],
        };
    }
};
exports.BackendDiagnosticsController = BackendDiagnosticsController;
__decorate([
    (0, common_1.Get)('diagnostics'),
    (0, swagger_1.ApiOperation)({ summary: 'Comprehensive health check and debug report for platform core subsystems' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackendDiagnosticsController.prototype, "getDiagnostics", null);
__decorate([
    (0, common_1.Get)('subsystems'),
    (0, swagger_1.ApiOperation)({ summary: 'List all registered backend subsystems and their route namespaces' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BackendDiagnosticsController.prototype, "getSubsystemDirectory", null);
exports.BackendDiagnosticsController = BackendDiagnosticsController = __decorate([
    (0, swagger_1.ApiTags)('Backend Architecture & Diagnostics'),
    (0, common_1.Controller)('backend'),
    __metadata("design:paramtypes", [database_diagnostic_service_1.DatabaseDiagnosticService,
        identity_diagnostic_service_1.IdentityDiagnosticService,
        realtime_diagnostic_service_1.RealtimeDiagnosticService,
        plugin_manager_service_1.PluginManagerService])
], BackendDiagnosticsController);
//# sourceMappingURL=backend-diagnostics.controller.js.map