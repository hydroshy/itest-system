export declare class CreateItemCodeDto {
    itemCode: string;
    sku: string;
    firmwareVersion?: string;
    defaultTemplateId?: string | null;
    description?: string;
    isActive?: boolean;
    metadata?: Record<string, any>;
}
export declare class UpdateItemCodeDto {
    itemCode?: string;
    sku?: string;
    firmwareVersion?: string;
    defaultTemplateId?: string | null;
    description?: string;
    isActive?: boolean;
    metadata?: Record<string, any>;
}
export declare class QueryItemCodeDto {
    page?: number;
    limit?: number;
    search?: string;
    sku?: string;
    isActive?: any;
}
export declare class ItemCodePickerItemDto {
    id: string;
    itemCode: string;
    sku: string;
    firmwareVersion: string;
    skuFw: string;
    defaultTemplateId?: string;
    defaultTemplateName?: string;
    description?: string;
}
