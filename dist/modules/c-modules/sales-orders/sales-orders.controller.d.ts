import { User } from '../../users/entities/user.entity';
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto, UpdateSalesOrderDto, QuerySalesOrderDto, AttachItemCodesDto } from './dto/sales-order.dto';
import { CsvImportDto } from './dto/csv-import.dto';
import { OdooApiSyncDto } from './dto/odoo-api-sync.dto';
export declare class SalesOrdersController {
    private readonly service;
    constructor(service: SalesOrdersService);
    findAll(query: QuerySalesOrderDto): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    resolveTemplate(sku: string, firmwareVersion?: string): Promise<{
        matched: boolean;
        matchType: "EXACT" | "SKU_FALLBACK" | "NONE";
        template: import("../test-builder").TestTemplateEntity | null;
        message: string;
    }>;
    getItemTestStatus(soCode: string, itemCode: string): Promise<{
        soCode: string;
        itemCode: string;
        sku: string;
        firmwareVersion: string;
        targetQuantity: number;
        testedQuantity: any;
        passedQuantity: any;
        failedQuantity: any;
        itemStatus: import(".").SalesOrderItemStatus;
        progressPercentage: number;
        testTemplate: {
            id: string;
            name: string;
            code: string;
            executionMode: "FLOW" | "SCRIPT" | "HYBRID";
        };
        testSession: {
            id: any;
            sessionCode: any;
            status: any;
            totalDevices: any;
            passedDevices: any;
            failedDevices: any;
            startTime: any;
            endTime: any;
        };
    }>;
    findOne(id: string): Promise<{
        itemsCount: number;
        totalQuantity: number;
        testedQuantity: number;
        passedQuantity: number;
        failedQuantity: number;
        testProgress: number;
        id: string;
        soCode: string;
        customer?: string;
        orderDate: Date;
        status: import(".").SalesOrderStatus;
        source: import(".").SalesOrderSource;
        odooId?: number;
        notes?: string;
        metadata: Record<string, any>;
        createdBy?: string;
        createdAt: Date;
        updatedAt: Date;
        items: import(".").SalesOrderItemEntity[];
    }>;
    create(dto: CreateSalesOrderDto, user: User): Promise<import(".").SalesOrderEntity>;
    update(id: string, dto: UpdateSalesOrderDto): Promise<import(".").SalesOrderEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    }>;
    attachItems(id: string, dto: AttachItemCodesDto): Promise<import(".").SalesOrderEntity>;
    importOdooJson(payload: any, user: User): Promise<{
        success: boolean;
        count: number;
        orders: import(".").SalesOrderEntity[];
    }>;
    importCsv(dto: CsvImportDto, user: User): Promise<{
        success: boolean;
        totalOrders: number;
        totalItems: number;
        orders: import(".").SalesOrderEntity[];
    }>;
    syncOdooApi(dto: OdooApiSyncDto, user: User): Promise<{
        success: boolean;
        syncMode: string;
        soCode: string;
        imported: import(".").SalesOrderEntity;
        message: string;
    }>;
}
