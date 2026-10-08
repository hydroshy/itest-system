import { DeviceTestedRepository } from './device-tested.repository';
import { CreateDeviceTestedDto, QueryDeviceTestedDto, VerifyDeviceTestedDto } from './dto/device-tested.dto';
export declare class DeviceTestedService {
    private readonly repository;
    private readonly logger;
    constructor(repository: DeviceTestedRepository);
    verify(query: VerifyDeviceTestedDto): Promise<{
        success: boolean;
        verified: boolean;
        message: string;
        data: import(".").DeviceTestedEntity;
    }>;
    findBySerialNumber(serialNumber: string, itemCode?: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    } | {
        success: boolean;
        data: import(".").DeviceTestedEntity;
        message?: undefined;
    }>;
    findAll(query?: QueryDeviceTestedDto): Promise<{
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
