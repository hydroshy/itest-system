import { TestAssertionEntity } from '../../c-modules/test-builder/entities/test-assertion.entity';
import { TestTemplateEntity } from '../../c-modules/test-builder/entities/test-template.entity';
import { MemmapRegEntity } from '../../c-modules/memmap-upload/entities/memmap-reg.entity';
export interface AssertionEvalResult {
    fieldName: string;
    operator: string;
    expectedValue?: any;
    actualValue?: any;
    pass: boolean;
    severity?: string;
    message?: string;
}
export interface SandboxExecutionContext {
    sessionId?: string;
    sessionCode?: string;
    soCode?: string;
    itemCode?: string;
    sku?: string;
    shortFw?: number;
    devEUI?: string;
    packetCount?: number;
    minPackets?: number;
    durationSeconds?: number;
}
export declare class SandboxAssertionService {
    private readonly logger;
    extractFieldValue(obj: any, path: string): any;
    evaluateSingleAssertion(assertRule: Partial<TestAssertionEntity> & {
        fieldName: string;
        operator: string;
    }, actual: any): AssertionEvalResult;
    executeSandboxScript(scriptCode: string, packet: any, context: SandboxExecutionContext, memmapRegs?: MemmapRegEntity[]): {
        pass: boolean;
        message?: string;
        logs?: string[];
    };
    validateAgainstMemmap(decodedData: Record<string, any>, memmapRegs?: MemmapRegEntity[]): AssertionEvalResult[];
    evaluateAll(template: TestTemplateEntity | undefined, decodedData: Record<string, any>, packetPayload: any, context: SandboxExecutionContext, memmapRegs?: MemmapRegEntity[]): Promise<{
        pass: boolean;
        assertionResults: AssertionEvalResult[];
        firstErrorMessage?: string;
    }>;
}
