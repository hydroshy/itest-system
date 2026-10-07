import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { MemmapPayloadEntity } from './entities/memmap-payload.entity';
import { MemmapRegEntity } from './entities/memmap-reg.entity';
export declare class MemmapUploadRepository {
    private readonly dbService?;
    private readonly logger;
    private memoryPayloads;
    private memoryRegs;
    constructor(dbService?: DynamicDatabaseService);
    getPayloadRepo(): Repository<MemmapPayloadEntity> | null;
    getRegRepo(): Repository<MemmapRegEntity> | null;
    private getCompositeKey;
    saveOrUpdate(payloadData: Partial<MemmapPayloadEntity>, registersData: Partial<MemmapRegEntity>[]): Promise<{
        payload: MemmapPayloadEntity;
        registers: MemmapRegEntity[];
    }>;
    findBySkuAndShortFw(sku: string, shortFw: number): Promise<{
        payload: MemmapPayloadEntity;
        registers: MemmapRegEntity[];
    } | null>;
    findAllPayloads(): Promise<MemmapPayloadEntity[]>;
}
