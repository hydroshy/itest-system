import { SalesOrdersRepository } from './sales-orders.repository';
import { SalesOrderEntity, SalesOrderStatus, SalesOrderSource } from './entities/sales-order.entity';
import { SalesOrderItemEntity, SalesOrderItemStatus } from './entities/sales-order-item.entity';
import { CreateSalesOrderDto, UpdateSalesOrderDto, QuerySalesOrderDto, AttachItemCodesDto } from './dto/sales-order.dto';
import { CsvImportDto } from './dto/csv-import.dto';
import { OdooApiSyncDto } from './dto/odoo-api-sync.dto';
import { TestTemplateEntity } from '../test-builder/entities/test-template.entity';
export declare class SalesOrdersService {
    private readonly repository;
    private readonly logger;
    constructor(repository: SalesOrdersRepository);
    findAll(query: QuerySalesOrderDto): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
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
        status: SalesOrderStatus;
        source: SalesOrderSource;
        odooId?: number;
        notes?: string;
        metadata: Record<string, any>;
        createdBy?: string;
        createdAt: Date;
        updatedAt: Date;
        items: SalesOrderItemEntity[];
    }>;
    resolveItemFields(item: {
        itemCodeId?: string;
        itemCode: string;
        sku?: string;
        firmwareVersion?: string;
        templateId?: string;
        quantity?: number;
        notes?: string;
        metadata?: any;
        status?: SalesOrderItemStatus;
    }): Promise<Partial<SalesOrderItemEntity>>;
    create(dto: CreateSalesOrderDto, createdBy?: string): Promise<SalesOrderEntity>;
    attachItems(salesOrderId: string, dto: AttachItemCodesDto): Promise<SalesOrderEntity>;
    update(id: string, dto: UpdateSalesOrderDto): Promise<SalesOrderEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    }>;
    importOdooJson(payload: any, createdBy?: string): Promise<{
        success: boolean;
        count: number;
        orders: SalesOrderEntity[];
    }>;
    importCsv(dto: CsvImportDto, createdBy?: string): Promise<{
        success: boolean;
        totalOrders: number;
        totalItems: number;
        orders: SalesOrderEntity[];
    }>;
    syncOdooApi(dto: OdooApiSyncDto, createdBy?: string): Promise<{
        success: boolean;
        syncMode: string;
        soCode: string;
        imported: SalesOrderEntity;
        message: string;
    }>;
    resolveTestTemplate(sku: string, firmwareVersion?: string): Promise<{
        matched: boolean;
        matchType: "EXACT" | "SKU_FALLBACK" | "NONE";
        template: TestTemplateEntity | null;
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
        itemStatus: SalesOrderItemStatus;
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
    private mapOdooState;
    private extractSku;
    private parseCsv;
}
