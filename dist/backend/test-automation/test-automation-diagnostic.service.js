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
exports.TestAutomationDiagnosticService = void 0;
const common_1 = require("@nestjs/common");
const subsystem_types_1 = require("../common/subsystem.types");
const test_automation_service_1 = require("../../modules/d-modules/test-automation/test-automation.service");
const test_builder_service_1 = require("../../modules/c-modules/test-builder/test-builder.service");
const decoder_service_1 = require("../../modules/c-modules/decoder-admin/decoder.service");
let TestAutomationDiagnosticService = class TestAutomationDiagnosticService {
    constructor(testAutomationService, testBuilderService, decoderService) {
        this.testAutomationService = testAutomationService;
        this.testBuilderService = testBuilderService;
        this.decoderService = decoderService;
        this.logger = new common_1.Logger('TestAutomationSubsystem');
    }
    async checkHealth() {
        try {
            const sessionsResult = await this.testAutomationService.getSessions({ limit: 1 });
            const templates = await this.testBuilderService.findAll();
            const decoders = await this.decoderService.findAll();
            return {
                subsystem: subsystem_types_1.BackendSubsystem.TEST_AUTOMATION,
                status: 'UP',
                timestamp: new Date().toISOString(),
                details: {
                    totalTestSessions: sessionsResult.total ?? sessionsResult.items?.length ?? 0,
                    totalTestTemplates: templates.length,
                    totalDecoders: decoders.length,
                    subsystemScope: [
                        'D-Module test automation workbench',
                        'C-Module test builder flow-graph engine',
                        'Real-time packet log capture & verdict evaluation',
                        'Decoder field extraction & payload validation',
                    ],
                },
                error: null,
            };
        }
        catch (err) {
            this.logger.error(`Test Automation diagnostic failed: ${err.message}`, err.stack);
            return {
                subsystem: subsystem_types_1.BackendSubsystem.TEST_AUTOMATION,
                status: 'DEGRADED',
                timestamp: new Date().toISOString(),
                error: err.message,
            };
        }
    }
};
exports.TestAutomationDiagnosticService = TestAutomationDiagnosticService;
exports.TestAutomationDiagnosticService = TestAutomationDiagnosticService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [test_automation_service_1.TestAutomationService,
        test_builder_service_1.TestBuilderService,
        decoder_service_1.DecoderService])
], TestAutomationDiagnosticService);
//# sourceMappingURL=test-automation-diagnostic.service.js.map