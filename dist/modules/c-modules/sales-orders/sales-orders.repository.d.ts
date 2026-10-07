import { Repository, DataSource } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { SalesOrderEntity } from './entities/sales-order.entity';
import { SalesOrderItemEntity } from './entities/sales-order-item.entity';
import { TestTemplateEntity } from '../test-builder/entities/test-template.entity';
import { ItemCodeEntity } from '../item-codes/entities/item-code.entity';
import { QuerySalesOrderDto } from './dto/sales-order.dto';
export declare class SalesOrdersRepository {
    private readonly dbService;
    private readonly logger;
    constructor(dbService: DynamicDatabaseService);
    getSoRepo(): Repository<SalesOrderEntity>;
    getItemRepo(): Repository<SalesOrderItemEntity>;
    getTemplateRepo(): Repository<TestTemplateEntity>;
    getItemCodeRepo(): Repository<ItemCodeEntity>;
    getDataSource(): DataSource;
    findWithPagination(query: QuerySalesOrderDto): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<SalesOrderEntity | null>;
    findBySoCode(soCode: string): Promise<SalesOrderEntity | null>;
    createSalesOrder(soData: Partial<SalesOrderEntity>, itemsData?: Partial<SalesOrderItemEntity>[]): Promise<SalesOrderEntity>;
    updateSalesOrder(id: string, soData: Partial<SalesOrderEntity>, itemsData?: Partial<SalesOrderItemEntity>[]): Promise<SalesOrderEntity>;
    deleteSalesOrder(id: string): Promise<boolean>;
    findItem(salesOrderId: string, itemCode: string): Promise<SalesOrderItemEntity | null>;
    findItemCodeById(id: string): Promise<ItemCodeEntity | null>;
    findItemCodeByCode(itemCode: string): Promise<ItemCodeEntity | null>;
    attachItemsToSalesOrder(salesOrderId: string, itemsData: Partial<SalesOrderItemEntity>[]): Promise<SalesOrderEntity>;
    findTemplateForSku(sku: string, firmwareVersion?: string): Promise<{
        matched: boolean;
        matchType: 'EXACT' | 'SKU_FALLBACK' | 'NONE';
        template: TestTemplateEntity | null;
        message: string;
    }>;
    findTestSessionForItem(soCode: string, itemCode: string): Promise<any | null>;
}
