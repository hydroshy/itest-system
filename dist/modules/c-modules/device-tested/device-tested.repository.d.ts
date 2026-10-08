import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { DeviceTestedEntity } from './entities/device-tested.entity';
import { CreateDeviceTestedDto, QueryDeviceTestedDto } from './dto/device-tested.dto';
export declare class DeviceTestedRepository {
    private readonly dbService?;
    private readonly logger;
    private memoryRecords;
    constructor(dbService?: DynamicDatabaseService);
    getRepo(): Repository<DeviceTestedEntity> | null;
    findBySerialNumber(serialNumber: string, itemCode?: string): Promise<DeviceTestedEntity | null>;
    findAll(query?: QueryDeviceTestedDto): Promise<{
        data: DeviceTestedEntity[];
        total: number;
    }>;
    saveOrUpdate(dto: CreateDeviceTestedDto): Promise<DeviceTestedEntity>;
}
