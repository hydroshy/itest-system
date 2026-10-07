import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { ItemCodeEntity } from './entities/item-code.entity';
import { TestTemplateEntity } from '../test-builder/entities/test-template.entity';
import { SalesOrderItemEntity } from '../sales-orders/entities/sales-order-item.entity';
import { QueryItemCodeDto, ItemCodePickerItemDto } from './dto/item-code.dto';
export declare class ItemCodesRepository {
    private readonly dbService;
    private readonly logger;
    constructor(dbService: DynamicDatabaseService);
    getRepo(): Repository<ItemCodeEntity>;
    getTemplateRepo(): Repository<TestTemplateEntity>;
    getSoItemRepo(): Repository<SalesOrderItemEntity>;
    findWithPagination(query: QueryItemCodeDto): Promise<{
        data: ItemCodeEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findPickerItems(search?: string): Promise<ItemCodePickerItemDto[]>;
    findById(id: string): Promise<ItemCodeEntity | null>;
    findByItemCode(itemCode: string): Promise<ItemCodeEntity | null>;
    createItemCode(data: Partial<ItemCodeEntity>): Promise<ItemCodeEntity>;
    updateItemCode(id: string, data: Partial<ItemCodeEntity>): Promise<ItemCodeEntity>;
    deleteItemCode(id: string): Promise<boolean>;
    countSalesOrderItems(itemCodeId: string): Promise<number>;
    findMatchingTemplate(sku: string, firmwareVersion: string): Promise<TestTemplateEntity | null>;
}
