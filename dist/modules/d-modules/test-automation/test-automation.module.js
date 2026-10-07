"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAutomationModule = void 0;
const common_1 = require("@nestjs/common");
const test_automation_controller_1 = require("./test-automation.controller");
const test_automation_service_1 = require("./test-automation.service");
const test_automation_repository_1 = require("./test-automation.repository");
const sandbox_assertion_service_1 = require("./sandbox-assertion.service");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
const memmap_upload_module_1 = require("../../c-modules/memmap-upload/memmap-upload.module");
let TestAutomationModule = class TestAutomationModule {
};
exports.TestAutomationModule = TestAutomationModule;
exports.TestAutomationModule = TestAutomationModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule, memmap_upload_module_1.MemmapUploadModule],
        controllers: [test_automation_controller_1.TestAutomationController],
        providers: [test_automation_service_1.TestAutomationService, test_automation_repository_1.TestAutomationRepository, sandbox_assertion_service_1.SandboxAssertionService],
        exports: [test_automation_service_1.TestAutomationService, test_automation_repository_1.TestAutomationRepository, sandbox_assertion_service_1.SandboxAssertionService],
    })
], TestAutomationModule);
//# sourceMappingURL=test-automation.module.js.map