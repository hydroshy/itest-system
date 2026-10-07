import { ItemCodesRepository } from './item-codes.repository';
import { ItemCodeEntity } from './entities/item-code.entity';
import { CreateItemCodeDto, UpdateItemCodeDto, QueryItemCodeDto, ItemCodePickerItemDto } from './dto/item-code.dto';
export declare class ItemCodesService {
    private readonly repository;
    private readonly logger;
    constructor(repository: ItemCodesRepository);
    findAll(query: QueryItemCodeDto): Promise<{
        data: ItemCodeEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findPicker(search?: string): Promise<ItemCodePickerItemDto[]>;
    findOne(id: string): Promise<ItemCodeEntity>;
    create(dto: CreateItemCodeDto): Promise<ItemCodeEntity>;
    update(id: string, dto: UpdateItemCodeDto): Promise<ItemCodeEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    }>;
}
