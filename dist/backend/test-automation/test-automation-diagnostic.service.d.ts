import { SubsystemHealthStatus } from '../common/subsystem.types';
import { TestAutomationService } from '../../modules/d-modules/test-automation/test-automation.service';
import { TestBuilderService } from '../../modules/c-modules/test-builder/test-builder.service';
import { DecoderService } from '../../modules/c-modules/decoder-admin/decoder.service';
export declare class TestAutomationDiagnosticService {
    private readonly testAutomationService;
    private readonly testBuilderService;
    private readonly decoderService;
    private readonly logger;
    constructor(testAutomationService: TestAutomationService, testBuilderService: TestBuilderService, decoderService: DecoderService);
    checkHealth(): Promise<SubsystemHealthStatus>;
}
