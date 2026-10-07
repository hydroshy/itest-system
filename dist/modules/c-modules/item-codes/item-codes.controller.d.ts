import { ItemCodesService } from './item-codes.service';
import { CreateItemCodeDto, UpdateItemCodeDto, QueryItemCodeDto } from './dto/item-code.dto';
export declare class ItemCodesController {
    private readonly service;
    constructor(service: ItemCodesService);
    findAll(query: QueryItemCodeDto): Promise<{
        data: import(".").ItemCodeEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findPicker(search?: string): Promise<import("./dto/item-code.dto").ItemCodePickerItemDto[]>;
    findOne(id: string): Promise<import(".").ItemCodeEntity>;
    create(dto: CreateItemCodeDto): Promise<import(".").ItemCodeEntity>;
    update(id: string, dto: UpdateItemCodeDto): Promise<import(".").ItemCodeEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    }>;
}
