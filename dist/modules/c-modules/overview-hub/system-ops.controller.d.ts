import { SystemOpsService } from './system-ops.service';
export declare class SystemOpsController {
    private readonly opsService;
    constructor(opsService: SystemOpsService);
    getVersion(): Promise<import("./system-ops.service").SystemVersionResponse>;
    restartServer(req: any): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }>;
    getLogs(tail?: string): Promise<{
        success: boolean;
        logs: string;
    }>;
}
