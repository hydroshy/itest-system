import { MemmapManagerRepository } from './memmap-manager.repository';
import { MemmapPayloadEntity } from '../memmap-upload/entities/memmap-payload.entity';
import { MemmapRegEntity } from '../memmap-upload/entities/memmap-reg.entity';
export declare class MemmapManagerService {
    private readonly repository;
    private readonly logger;
    constructor(repository: MemmapManagerRepository);
    findAll(): Promise<MemmapPayloadEntity[]>;
    getRegistersByPayloadId(id: string): Promise<{
        payload: MemmapPayloadEntity;
        registers: MemmapRegEntity[];
    }>;
    deletePayload(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            sku: string;
            longFw: string;
            shortFw: number;
        };
    }>;
}
