import { TestTemplateEntity } from './test-template.entity';
export declare class TestAssertionEntity {
    id: string;
    templateId: string;
    template: TestTemplateEntity;
    fieldName: string;
    fieldLabel?: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN_RANGE' | 'BETWEEN' | 'REGEX' | 'IS_NOT_NULL' | 'CONTAINS';
    expectedValue: any;
    tolerance: number;
    unit?: string;
    severity: 'ERROR' | 'WARNING';
    orderIndex: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
