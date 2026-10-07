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
const lorawan_diagnostic_service_1 = require("./lorawan/lorawan-diagnostic.service");
const order_management_diagnostic_service_1 = require("./order-management/order-management-diagnostic.service");
const test_automation_diagnostic_service_1 = require("./test-automation/test-automation-diagnostic.service");
const identity_diagnostic_service_1 = require("./identity/identity-diagnostic.service");
const industrial_iot_diagnostic_service_1 = require("./industrial-iot/industrial-iot-diagnostic.service");
const realtime_diagnostic_service_1 = require("./realtime/realtime-diagnostic.service");
let BackendDiagnosticsController = class BackendDiagnosticsController {
    constructor(dbDiagnostic, lorawanDiagnostic, orderManagementDiagnostic, testAutomationDiagnostic, identityDiagnostic, industrialIotDiagnostic, realtimeDiagnostic) {
        this.dbDiagnostic = dbDiagnostic;
        this.lorawanDiagnostic = lorawanDiagnostic;
        this.orderManagementDiagnostic = orderManagementDiagnostic;
        this.testAutomationDiagnostic = testAutomationDiagnostic;
        this.identityDiagnostic = identityDiagnostic;
        this.industrialIotDiagnostic = industrialIotDiagnostic;
        this.realtimeDiagnostic = realtimeDiagnostic;
    }
    async getDiagnostics() {
        const [db, lora, order, testAuto, identity, iot, realtime] = await Promise.all([
            this.dbDiagnostic.checkHealth(),
            this.lorawanDiagnostic.checkHealth(),
            this.orderManagementDiagnostic.checkHealth(),
            this.testAutomationDiagnostic.checkHealth(),
            this.identityDiagnostic.checkHealth(),
            this.industrialIotDiagnostic.checkHealth(),
            this.realtimeDiagnostic.checkHealth(),
        ]);
        const subsystems = {
            [subsystem_types_1.BackendSubsystem.DATABASE]: db,
            [subsystem_types_1.BackendSubsystem.LORAWAN]: lora,
            [subsystem_types_1.BackendSubsystem.ORDER_MANAGEMENT]: order,
            [subsystem_types_1.BackendSubsystem.TEST_AUTOMATION]: testAuto,
            [subsystem_types_1.BackendSubsystem.IDENTITY]: identity,
            [subsystem_types_1.BackendSubsystem.INDUSTRIAL_IOT]: iot,
            [subsystem_types_1.BackendSubsystem.REALTIME]: realtime,
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
                'If LORAWAN_NETWORK_SERVER errors: check ChirpStack/TTN API key and gRPC/REST gateway connection.',
                'If ORDER_MANAGEMENT errors: check SO item mapping and SKU regex rule in item-code-utils.',
                'If TEST_AUTOMATION errors: inspect TestSession packet log and flow-graph assertion definitions.',
            ],
        };
    }
    getSubsystemDirectory() {
        return {
            architecture: 'Daviteq Domain-Subsystem Modular Architecture',
            version: '2.0.0',
            subsystems: [
                {
                    id: subsystem_types_1.BackendSubsystem.DATABASE,
                    name: 'Dynamic Database Subsystem',
                    routes: ['/api/database/health', '/api/database/status', '/api/database/reload'],
                    description: 'Multi-tenant database connection pool, dynamic routing & health.',
                },
                {
                    id: subsystem_types_1.BackendSubsystem.LORAWAN,
                    name: 'LoRaWAN Network Server Subsystem',
                    routes: ['/api/lorawan/*', '/api/network-servers/*', '/api/webhook/*'],
                    description: 'ChirpStack/TTN connectivity, device keys, downlinks, webhooks.',
                },
                {
                    id: subsystem_types_1.BackendSubsystem.ORDER_MANAGEMENT,
                    name: 'Order Management Subsystem (SO / Item / SKU)',
                    routes: ['/api/sales-orders/*', '/api/item-codes/*', '/api/sensor-types/*'],
                    description: 'Sales Orders, Item Codes/SKU catalog, and sensor type mapping.',
                },
                {
                    id: subsystem_types_1.BackendSubsystem.TEST_AUTOMATION,
                    name: 'Test Automation Subsystem',
                    routes: ['/api/d-modules/test-run/*', '/api/test-builder/*', '/api/decoder/*'],
                    description: 'D-Module test workbench, C-Module test builder flow engine, decoders.',
                },
                {
                    id: subsystem_types_1.BackendSubsystem.IDENTITY,
                    name: 'Identity & Access Control Subsystem',
                    routes: ['/auth/*', '/api/users/*', '/api/roles/*'],
                    description: 'JWT authentication, RBAC authorization, and user administration.',
                },
                {
                    id: subsystem_types_1.BackendSubsystem.INDUSTRIAL_IOT,
                    name: 'Industrial IoT Subsystem',
                    routes: ['/api/c-modules/modbus-presets/*', '/api/c-modules/hmi-studio/*', '/api/c-modules/overview-hub/*'],
                    description: 'Modbus registers, HMI SCADA studio, and system overview.',
                },
                {
                    id: subsystem_types_1.BackendSubsystem.REALTIME,
                    name: 'Realtime Streaming Subsystem',
                    routes: ['/realtime/*', 'ws://*'],
                    description: 'WebSocket telemetry and test packet streaming.',
                },
            ],
        };
    }
};
exports.BackendDiagnosticsController = BackendDiagnosticsController;
__decorate([
    (0, common_1.Get)('diagnostics'),
    (0, swagger_1.ApiOperation)({ summary: 'Comprehensive health check and debug report for all 7 backend subsystems' }),
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
        lorawan_diagnostic_service_1.LorawanDiagnosticService,
        order_management_diagnostic_service_1.OrderManagementDiagnosticService,
        test_automation_diagnostic_service_1.TestAutomationDiagnosticService,
        identity_diagnostic_service_1.IdentityDiagnosticService,
        industrial_iot_diagnostic_service_1.IndustrialIotDiagnosticService,
        realtime_diagnostic_service_1.RealtimeDiagnosticService])
], BackendDiagnosticsController);
//# sourceMappingURL=backend-diagnostics.controller.js.map