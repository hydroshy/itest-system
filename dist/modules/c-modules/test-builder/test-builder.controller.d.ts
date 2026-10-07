import { User } from '../../users/entities/user.entity';
import { TestBuilderService } from './test-builder.service';
import { CreateTestTemplateDto, UpdateTestTemplateDto, DryRunTestDto, ValidateFlowDto, ExecuteFlowDto, ExtractDecoderFieldsDto } from './dto/test-builder.dto';
export declare class TestBuilderController {
    private readonly testBuilderService;
    constructor(testBuilderService: TestBuilderService);
    findAll(): Promise<import(".").TestTemplateEntity[]>;
    findOne(id: string): Promise<import(".").TestTemplateEntity>;
    create(dto: CreateTestTemplateDto, user: User): Promise<import(".").TestTemplateEntity>;
    sanitizeTemplates(): Promise<{
        templatesUpdated: number;
        assertionsUpdated: number;
    }>;
    update(id: string, dto: UpdateTestTemplateDto, user: User): Promise<import(".").TestTemplateEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAvailableFields(sku?: string, firmwareVersion?: string): Promise<import("./test-builder.service").AvailableFieldsResponse>;
    extractDecoderFields(dto: ExtractDecoderFieldsDto): Promise<{
        success: boolean;
        fields: import("./decoder-field-extractor").DiscoveredField[];
        count: number;
        error?: string;
    }>;
    dryRun(dto: DryRunTestDto): Promise<import("./test-builder.service").DryRunResponse>;
    validateFlow(dto: ValidateFlowDto): Promise<import("./flow-graph-engine.service").FlowValidationResult>;
    executeFlow(dto: ExecuteFlowDto): Promise<import("./flow-graph-engine.service").FlowExecutionSummary>;
}
