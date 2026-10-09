import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { MemmapPayloadEntity } from './entities/memmap-payload.entity';
import { MemmapRegEntity } from './entities/memmap-reg.entity';
export declare class MemmapUploadRepository {
    private readonly dbService?;
    private readonly logger;
    static readonly sharedMemoryPayloads: Map<string, MemmapPayloadEntity>;
    static readonly sharedMemoryRegs: Map<string, MemmapRegEntity[]>;
    private get memoryPayloads();
    private get memoryRegs();
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
    findPayloadByIdWithRegs(id: string): Promise<{
        payload: MemmapPayloadEntity;
        registers: MemmapRegEntity[];
    } | null>;
    deletePayloadById(id: string): Promise<MemmapPayloadEntity | null>;
}
