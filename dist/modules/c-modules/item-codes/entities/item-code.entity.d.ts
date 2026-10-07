import { TestTemplateEntity } from '../../test-builder/entities/test-template.entity';
export declare class ItemCodeEntity {
    id: string;
    itemCode: string;
    sku: string;
    firmwareVersion: string;
    skuFw: string;
    defaultTemplateId?: string | null;
    defaultTemplate?: TestTemplateEntity;
    description?: string;
    isActive: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
