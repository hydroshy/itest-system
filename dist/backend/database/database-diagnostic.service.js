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
exports.DatabaseDiagnosticService = void 0;
const common_1 = require("@nestjs/common");
const subsystem_types_1 = require("../common/subsystem.types");
const dynamic_database_service_1 = require("./dynamic-database.service");
let DatabaseDiagnosticService = class DatabaseDiagnosticService {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger('DatabaseSubsystem');
    }
    async checkHealth() {
        try {
            const health = await this.dbService.getDatabaseHealth();
            const status = this.dbService.getConnectionStatus();
            return {
                subsystem: subsystem_types_1.BackendSubsystem.DATABASE,
                status: health.status === 'HEALTHY' ? 'UP' : health.status === 'DEGRADED' ? 'DEGRADED' : 'DOWN',
                timestamp: new Date().toISOString(),
                details: {
                    totalConnections: health.totalConnections,
                    tableStatsCount: Object.keys(health.tableStats || {}).length,
                    activeRoutesCount: Object.keys(status.table_routes || {}).length,
                    subsystemScope: [
                        'Dynamic multi-tenant database routing',
                        'Connection pool lifecycle',
                        'Schema migration & entity registry',
                    ],
                },
                error: null,
            };
        }
        catch (err) {
            this.logger.error(`Database diagnostic failed: ${err.message}`, err.stack);
            return {
                subsystem: subsystem_types_1.BackendSubsystem.DATABASE,
                status: 'DOWN',
                timestamp: new Date().toISOString(),
                error: err.message,
            };
        }
    }
};
exports.DatabaseDiagnosticService = DatabaseDiagnosticService;
exports.DatabaseDiagnosticService = DatabaseDiagnosticService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], DatabaseDiagnosticService);
//# sourceMappingURL=database-diagnostic.service.js.map