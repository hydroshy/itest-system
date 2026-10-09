import { MemmapManagerService } from './memmap-manager.service';
export declare class MemmapManagerController {
    private readonly memmapManagerService;
    constructor(memmapManagerService: MemmapManagerService);
    findAll(): Promise<{
        success: boolean;
        data: import("../memmap-upload").MemmapPayloadEntity[];
    }>;
    getRegistersByPayloadId(id: string): Promise<{
        success: boolean;
        data: {
            payload: import("../memmap-upload").MemmapPayloadEntity;
            registers: import("../memmap-upload").MemmapRegEntity[];
        };
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
