"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAutomationSubsystemModule = void 0;
const common_1 = require("@nestjs/common");
const d_modules_module_1 = require("../../modules/d-modules/d-modules.module");
const test_automation_module_1 = require("../../modules/d-modules/test-automation/test-automation.module");
const test_builder_module_1 = require("../../modules/c-modules/test-builder/test-builder.module");
const decoder_module_1 = require("../../modules/c-modules/decoder-admin/decoder.module");
const memmap_upload_module_1 = require("../../modules/c-modules/memmap-upload/memmap-upload.module");
const device_tested_module_1 = require("../../modules/c-modules/device-tested/device-tested.module");
const test_automation_diagnostic_service_1 = require("./test-automation-diagnostic.service");
let TestAutomationSubsystemModule = class TestAutomationSubsystemModule {
};
exports.TestAutomationSubsystemModule = TestAutomationSubsystemModule;
exports.TestAutomationSubsystemModule = TestAutomationSubsystemModule = __decorate([
    (0, common_1.Module)({
        imports: [
            d_modules_module_1.DModulesModule,
            test_automation_module_1.TestAutomationModule,
            test_builder_module_1.TestBuilderModule,
            decoder_module_1.DecoderModule,
            memmap_upload_module_1.MemmapUploadModule,
            device_tested_module_1.DeviceTestedModule,
        ],
        providers: [test_automation_diagnostic_service_1.TestAutomationDiagnosticService],
        exports: [
            d_modules_module_1.DModulesModule,
            test_automation_module_1.TestAutomationModule,
            test_builder_module_1.TestBuilderModule,
            decoder_module_1.DecoderModule,
            memmap_upload_module_1.MemmapUploadModule,
            device_tested_module_1.DeviceTestedModule,
            test_automation_diagnostic_service_1.TestAutomationDiagnosticService,
        ],
    })
], TestAutomationSubsystemModule);
//# sourceMappingURL=test-automation-subsystem.module.js.map