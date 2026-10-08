"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalConfigManagerModule = void 0;
const common_1 = require("@nestjs/common");
const create_final_config_module_1 = require("../create-final-config/create-final-config.module");
const final_config_manager_repository_1 = require("./final-config-manager.repository");
const final_config_manager_service_1 = require("./final-config-manager.service");
const final_config_manager_controller_1 = require("./final-config-manager.controller");
let FinalConfigManagerModule = class FinalConfigManagerModule {
};
exports.FinalConfigManagerModule = FinalConfigManagerModule;
exports.FinalConfigManagerModule = FinalConfigManagerModule = __decorate([
    (0, common_1.Module)({
        imports: [create_final_config_module_1.CreateFinalConfigModule],
        controllers: [final_config_manager_controller_1.FinalConfigManagerController],
        providers: [final_config_manager_repository_1.FinalConfigManagerRepository, final_config_manager_service_1.FinalConfigManagerService],
        exports: [final_config_manager_repository_1.FinalConfigManagerRepository, final_config_manager_service_1.FinalConfigManagerService],
    })
], FinalConfigManagerModule);
//# sourceMappingURL=final-config-manager.module.js.map