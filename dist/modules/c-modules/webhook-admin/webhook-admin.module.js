"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookAdminModule = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
const webhook_admin_service_1 = require("./webhook-admin.service");
const webhook_admin_controller_1 = require("./webhook-admin.controller");
const lorawan_module_1 = require("../../lorawan/lorawan.module");
let WebhookAdminModule = class WebhookAdminModule {
};
exports.WebhookAdminModule = WebhookAdminModule;
exports.WebhookAdminModule = WebhookAdminModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule, (0, common_1.forwardRef)(() => lorawan_module_1.LorawanModule)],
        controllers: [webhook_admin_controller_1.WebhookAdminController],
        providers: [webhook_admin_service_1.WebhookAdminService],
        exports: [webhook_admin_service_1.WebhookAdminService],
    })
], WebhookAdminModule);
//# sourceMappingURL=webhook-admin.module.js.map