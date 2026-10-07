import { OnModuleInit } from '@nestjs/common';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { FlowGraphEngineService, FlowConfig, FlowExecutionSummary } from './flow-graph-engine.service';
import { TestTemplateEntity } from './entities/test-template.entity';
import { CreateTestTemplateDto, UpdateTestTemplateDto, DryRunTestDto } from './dto/test-builder.dto';
import { DiscoveredField, formatFieldLabel, inferUnit, extractDecoderFields, extractFieldsWithVm, extractFieldsWithAst } from './decoder-field-extractor';
export { DiscoveredField, formatFieldLabel, inferUnit, extractDecoderFields, extractFieldsWithVm, extractFieldsWithAst, };
export interface AvailableFieldsResponse {
    fields: DiscoveredField[];
    decoderFound: boolean;
    decoderId?: string;
    decoderName?: string;
    count: number;
    totalCount?: number;
}
export interface AssertionEvaluationResult {
    fieldName: string;
    operator: string;
    expectedValue: any;
    actualValue: any;
    pass: boolean;
    severity: 'ERROR' | 'WARNING';
    message: string;
    nodeId?: string;
    nodeType?: string;
}
export interface DryRunResponse {
    pass: boolean;
    executionMode: string;
    executionTimeMs: number;
    assertionResults: AssertionEvaluationResult[];
    scriptResult?: {
        pass: boolean;
        reason?: string;
        metrics?: Record<string, any>;
        logs?: string[];
    };
    flowResult?: FlowExecutionSummary;
    summary: string;
}
export declare const VI_TO_EN_FIELD_LABELS: Record<string, string>;
export declare function sanitizeFieldLabel(label?: string, fieldName?: string): string;
export declare function sanitizeNodeLabel(label: string): string;
export declare function sanitizeScript(script: string): string;
export declare class TestBuilderService implements OnModuleInit {
    private readonly dbService?;
    private flowGraphEngine?;
    private readonly logger;
    constructor(dbService?: DynamicDatabaseService, flowGraphEngine?: FlowGraphEngineService);
    private getTemplateRepo;
    private getAssertionRepo;
    private getDecoderRepo;
    onModuleInit(): Promise<void>;
    private ensureTables;
    private seedDefaultTemplates;
    findAll(): Promise<TestTemplateEntity[]>;
    findOne(id: string): Promise<TestTemplateEntity>;
    create(dto: CreateTestTemplateDto, author: string): Promise<TestTemplateEntity>;
    update(id: string, dto: UpdateTestTemplateDto, author: string): Promise<TestTemplateEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAvailableFields(sku?: string, firmwareVersion?: string): Promise<AvailableFieldsResponse>;
    parseFieldsFromDecoderCode(code: string): DiscoveredField[];
    extractFieldsFromRawCode(decoderCode: string): {
        success: boolean;
        fields: DiscoveredField[];
        count: number;
        error?: string;
    };
    dryRun(dto: DryRunTestDto): Promise<DryRunResponse>;
    validateFlowConfig(flowConfig: FlowConfig): Promise<import("./flow-graph-engine.service").FlowValidationResult>;
    executeFlowGraph(flowConfig: FlowConfig, mockPacket?: any, context?: any): Promise<FlowExecutionSummary>;
    private extractFieldValue;
    private evaluateSingleAssertion;
    private executeSandboxScript;
    sanitizeExistingTemplates(): Promise<{
        templatesUpdated: number;
        assertionsUpdated: number;
    }>;
}
