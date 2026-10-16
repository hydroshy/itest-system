"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentitySubsystemModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles-permissions/roles.module");
const admin_panel_module_1 = require("./modules/admin-panel/admin-panel.module");
const user_panel_module_1 = require("./modules/user-panel/user-panel.module");
const identity_diagnostic_service_1 = require("./identity-diagnostic.service");
let IdentitySubsystemModule = class IdentitySubsystemModule {
};
exports.IdentitySubsystemModule = IdentitySubsystemModule;
exports.IdentitySubsystemModule = IdentitySubsystemModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            admin_panel_module_1.AdminPanelModule,
            user_panel_module_1.UserPanelModule,
        ],
        providers: [identity_diagnostic_service_1.IdentityDiagnosticService],
        exports: [
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            admin_panel_module_1.AdminPanelModule,
            user_panel_module_1.UserPanelModule,
            identity_diagnostic_service_1.IdentityDiagnosticService,
        ],
    })
], IdentitySubsystemModule);
//# sourceMappingURL=identity-subsystem.module.js.map