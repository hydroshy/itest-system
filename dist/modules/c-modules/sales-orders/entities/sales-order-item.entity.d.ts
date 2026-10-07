import { SalesOrderEntity } from './sales-order.entity';
import { TestTemplateEntity } from '../../test-builder/entities/test-template.entity';
import { ItemCodeEntity } from '../../item-codes/entities/item-code.entity';
export declare enum SalesOrderItemStatus {
    PENDING = "PENDING",
    TESTING = "TESTING",
    PASSED = "PASSED",
    FAILED = "FAILED"
}
export declare class SalesOrderItemEntity {
    id: string;
    salesOrderId: string;
    salesOrder: SalesOrderEntity;
    itemCode: string;
    itemCodeId?: string;
    itemCodeRef?: ItemCodeEntity;
    sku: string;
    quantity: number;
    firmwareVersion: string;
    templateId?: string;
    template?: TestTemplateEntity;
    testedQuantity: number;
    passedQuantity: number;
    failedQuantity: number;
    status: SalesOrderItemStatus;
    notes?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
