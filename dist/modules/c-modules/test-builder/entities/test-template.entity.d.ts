import { TestAssertionEntity } from './test-assertion.entity';
export declare class TestTemplateEntity {
    id: string;
    name: string;
    code: string;
    description?: string;
    sku: string;
    firmwareVersion: string;
    decoderId?: string;
    executionMode: 'FLOW' | 'SCRIPT' | 'HYBRID';
    flowConfig: Record<string, any>;
    customScript?: string;
    timeoutSeconds: number;
    minPacketsRequired: number;
    isActive: boolean;
    metadata: Record<string, any>;
    createdBy?: string;
    assertions: TestAssertionEntity[];
    createdAt: Date;
    updatedAt: Date;
}
