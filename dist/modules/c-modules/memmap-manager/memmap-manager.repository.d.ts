import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { MemmapPayloadEntity } from '../memmap-upload/entities/memmap-payload.entity';
import { MemmapRegEntity } from '../memmap-upload/entities/memmap-reg.entity';
export declare class MemmapManagerRepository {
    private readonly dbService?;
    private readonly logger;
    constructor(dbService?: DynamicDatabaseService);
    getPayloadRepo(): Repository<MemmapPayloadEntity> | null;
    getRegRepo(): Repository<MemmapRegEntity> | null;
    private get memoryPayloads();
    private get memoryRegs();
    findAllPayloads(): Promise<MemmapPayloadEntity[]>;
    findPayloadWithRegs(id: string): Promise<{
        payload: MemmapPayloadEntity;
        registers: MemmapRegEntity[];
    } | null>;
    deletePayload(id: string): Promise<MemmapPayloadEntity | null>;
}
