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
exports.AdminPanelService = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../database/dynamic-database.service");
let AdminPanelService = class AdminPanelService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async getDashboardStats() {
        const dbStatus = this.dbService.getConnectionStatus();
        return {
            systemStatus: 'ONLINE',
            uptime: process.uptime(),
            dbConnections: dbStatus,
            timestamp: new Date().toISOString(),
        };
    }
    async reloadDbConfig() {
        await this.dbService.loadConfigAndInitializeDataSources();
        return {
            message: 'Dynamic database configuration reloaded successfully',
            dbStatus: this.dbService.getConnectionStatus(),
        };
    }
};
exports.AdminPanelService = AdminPanelService;
exports.AdminPanelService = AdminPanelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], AdminPanelService);
//# sourceMappingURL=admin-panel.service.js.map