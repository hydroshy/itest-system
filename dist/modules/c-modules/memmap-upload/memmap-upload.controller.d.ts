import { User } from '../../users/entities/user.entity';
import { MemmapUploadService } from './memmap-upload.service';
import { UploadMemmapDto } from './dto/upload-memmap.dto';
export declare class MemmapUploadController {
    private readonly memmapUploadService;
    constructor(memmapUploadService: MemmapUploadService);
    uploadMemmap(dto: UploadMemmapDto, user?: User): Promise<{
        success: boolean;
        message: string;
        data: {
            payloadId: string;
            sku: string;
            shortFw: number;
            totalRegs: number;
            decValid: boolean;
            hexValid: boolean;
            decErrors?: string[];
            hexErrors?: string[];
        };
    }>;
    getBySkuAndShortFw(sku: string, shortFw: string): Promise<{
        success: boolean;
        data: import(".").MemmapPayloadEntity & {
            registers: import(".").MemmapRegEntity[];
        };
    }>;
    findAll(): Promise<{
        success: boolean;
        data: import(".").MemmapPayloadEntity[];
    }>;
}
