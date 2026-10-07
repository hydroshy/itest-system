import { SalesOrderStatus, SalesOrderSource } from '../entities/sales-order.entity';
import { SalesOrderItemStatus } from '../entities/sales-order-item.entity';
export declare class CreateSalesOrderItemDto {
    itemCodeId?: string;
    itemCode: string;
    sku?: string;
    quantity?: number;
    firmwareVersion?: string;
    templateId?: string;
    notes?: string;
    metadata?: Record<string, any>;
}
export declare class CreateSalesOrderDto {
    soCode: string;
    customer?: string;
    orderDate?: string;
    status?: SalesOrderStatus;
    source?: SalesOrderSource;
    odooId?: number;
    notes?: string;
    metadata?: Record<string, any>;
    items: CreateSalesOrderItemDto[];
}
export declare class UpdateSalesOrderItemDto {
    id?: string;
    itemCodeId?: string;
    itemCode?: string;
    sku?: string;
    quantity?: number;
    firmwareVersion?: string;
    templateId?: string;
    testedQuantity?: number;
    passedQuantity?: number;
    failedQuantity?: number;
    status?: SalesOrderItemStatus;
    notes?: string;
    metadata?: Record<string, any>;
}
export declare class UpdateSalesOrderDto {
    soCode?: string;
    customer?: string;
    orderDate?: string;
    status?: SalesOrderStatus;
    source?: SalesOrderSource;
    odooId?: number;
    notes?: string;
    metadata?: Record<string, any>;
    items?: UpdateSalesOrderItemDto[];
}
export declare class QuerySalesOrderDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    source?: string;
}
export declare class AttachItemCodeLineDto {
    itemCodeId?: string;
    itemCode: string;
    sku?: string;
    firmwareVersion?: string;
    quantity?: number;
    templateId?: string;
    notes?: string;
    metadata?: Record<string, any>;
}
export declare class AttachItemCodesDto {
    items: AttachItemCodeLineDto[];
}
