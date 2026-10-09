import { MemmapUploadRepository } from './memmap-upload.repository';
import { UploadMemmapDto, MemmapRegItemDto } from './dto/upload-memmap.dto';
import { MemmapPayloadEntity } from './entities/memmap-payload.entity';
import { MemmapRegEntity } from './entities/memmap-reg.entity';
export { extractShortFwFromLongFw } from './fw-utils';
export interface ContinuityCheckResult {
    decValid: boolean;
    hexValid: boolean;
    decErrors: string[];
    hexErrors: string[];
}
export declare class MemmapUploadService {
    private readonly repository;
    private readonly logger;
    constructor(repository: MemmapUploadRepository);
    validateContinuity(registers: MemmapRegItemDto[]): ContinuityCheckResult;
    uploadMemmap(dto: UploadMemmapDto, author?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            payloadId: string;
            sku: string;
            longFw?: string;
            shortFw: number;
            totalRegs: number;
            decValid: boolean;
            hexValid: boolean;
            decErrors?: string[];
            hexErrors?: string[];
        };
    }>;
    getBySkuAndShortFw(sku: string, shortFw: number | string): Promise<{
        success: boolean;
        data: MemmapPayloadEntity & {
            registers: MemmapRegEntity[];
        };
    }>;
    findAll(): Promise<MemmapPayloadEntity[]>;
}
