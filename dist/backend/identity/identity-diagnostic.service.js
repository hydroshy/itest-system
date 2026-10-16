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
exports.IdentityDiagnosticService = void 0;
const common_1 = require("@nestjs/common");
const subsystem_types_1 = require("../common/subsystem.types");
const users_service_1 = require("./modules/users/users.service");
const roles_service_1 = require("./modules/roles-permissions/roles.service");
let IdentityDiagnosticService = class IdentityDiagnosticService {
    constructor(usersService, rolesService) {
        this.usersService = usersService;
        this.rolesService = rolesService;
        this.logger = new common_1.Logger('IdentitySubsystem');
    }
    async checkHealth() {
        try {
            const users = await this.usersService.findAllUsers();
            const roles = await this.rolesService.findAllRoles();
            const permissions = await this.rolesService.findAllPermissions();
            return {
                subsystem: subsystem_types_1.BackendSubsystem.IDENTITY,
                status: 'UP',
                timestamp: new Date().toISOString(),
                details: {
                    totalUsers: users.length,
                    totalRoles: roles.length,
                    totalPermissions: permissions.length,
                    subsystemScope: [
                        'JWT authentication & session validation',
                        'RBAC permission evaluation',
                        'User profile & credentials',
                    ],
                },
                error: null,
            };
        }
        catch (err) {
            this.logger.error(`Identity diagnostic failed: ${err.message}`, err.stack);
            return {
                subsystem: subsystem_types_1.BackendSubsystem.IDENTITY,
                status: 'DEGRADED',
                timestamp: new Date().toISOString(),
                error: err.message,
            };
        }
    }
};
exports.IdentityDiagnosticService = IdentityDiagnosticService;
exports.IdentityDiagnosticService = IdentityDiagnosticService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        roles_service_1.RolesService])
], IdentityDiagnosticService);
//# sourceMappingURL=identity-diagnostic.service.js.map