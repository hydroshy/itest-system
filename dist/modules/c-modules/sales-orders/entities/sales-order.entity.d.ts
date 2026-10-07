import { SalesOrderItemEntity } from './sales-order-item.entity';
export declare enum SalesOrderStatus {
    DRAFT = "DRAFT",
    CONFIRMED = "CONFIRMED",
    IN_PRODUCTION = "IN_PRODUCTION",
    TESTING = "TESTING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum SalesOrderSource {
    MANUAL = "MANUAL",
    ODOO = "ODOO",
    CSV = "CSV",
    EXCEL = "EXCEL",
    API = "API"
}
export declare class SalesOrderEntity {
    id: string;
    soCode: string;
    customer?: string;
    orderDate: Date;
    status: SalesOrderStatus;
    source: SalesOrderSource;
    odooId?: number;
    notes?: string;
    metadata: Record<string, any>;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
    items: SalesOrderItemEntity[];
}
