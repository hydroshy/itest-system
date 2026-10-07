"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DModulesModule = void 0;
const common_1 = require("@nestjs/common");
const d_modules_controller_1 = require("./d-modules.controller");
const d_modules_service_1 = require("./d-modules.service");
const test_automation_module_1 = require("./test-automation/test-automation.module");
let DModulesModule = class DModulesModule {
};
exports.DModulesModule = DModulesModule;
exports.DModulesModule = DModulesModule = __decorate([
    (0, common_1.Module)({
        imports: [test_automation_module_1.TestAutomationModule],
        controllers: [d_modules_controller_1.DModulesController],
        providers: [d_modules_service_1.DModulesService],
        exports: [d_modules_service_1.DModulesService, test_automation_module_1.TestAutomationModule],
    })
], DModulesModule);
//# sourceMappingURL=d-modules.module.js.map