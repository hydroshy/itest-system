"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFinalConfigModule = void 0;
const common_1 = require("@nestjs/common");
const create_final_config_repository_1 = require("./create-final-config.repository");
const create_final_config_service_1 = require("./create-final-config.service");
let CreateFinalConfigModule = class CreateFinalConfigModule {
};
exports.CreateFinalConfigModule = CreateFinalConfigModule;
exports.CreateFinalConfigModule = CreateFinalConfigModule = __decorate([
    (0, common_1.Module)({
        providers: [create_final_config_repository_1.CreateFinalConfigRepository, create_final_config_service_1.CreateFinalConfigService],
        exports: [create_final_config_repository_1.CreateFinalConfigRepository, create_final_config_service_1.CreateFinalConfigService],
    })
], CreateFinalConfigModule);
//# sourceMappingURL=create-final-config.module.js.map