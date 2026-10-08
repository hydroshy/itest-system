import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { DeviceTestedService } from './device-tested.service';
import { CreateDeviceTestedDto, QueryDeviceTestedDto, VerifyDeviceTestedDto } from './dto/device-tested.dto';
export declare class DeviceTestedAuthGuard extends JwtAuthGuard {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | import("rxjs").Observable<boolean>;
}
export declare class DeviceTestedController {
    private readonly service;
    constructor(service: DeviceTestedService);
    verify(query: VerifyDeviceTestedDto): Promise<{
        success: boolean;
        verified: boolean;
        message: string;
        data: import(".").DeviceTestedEntity;
    }>;
    getBySerialNumber(serialNumber: string, itemCode?: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    } | {
        success: boolean;
        data: import(".").DeviceTestedEntity;
        message?: undefined;
    }>;
    findAll(query: QueryDeviceTestedDto): Promise<{
        success: boolean;
        data: import(".").DeviceTestedEntity[];
        total: number;
    }>;
    create(dto: CreateDeviceTestedDto): Promise<{
        success: boolean;
        message: string;
        data: import(".").DeviceTestedEntity;
    }>;
}
