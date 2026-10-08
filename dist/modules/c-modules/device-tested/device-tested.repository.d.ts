import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { DeviceTestedEntity } from './entities/device-tested.entity';
import { CreateDeviceTestedDto, QueryDeviceTestedDto } from './dto/device-tested.dto';
export interface DeviceTestedTreeGroup {
    so_number: string;
    total_devices: number;
    pass_count: number;
    fail_count: number;
    devices: Array<{
        id: string;
        serial_number: string;
        device_key: string;
        item_code: string;
        sku: string;
        hw_ver: string;
        fw_ver: string;
        auto_check: string;
        result: string;
        app_key?: string;
        so_number?: string;
        test_id?: string;
        csv_raw_data?: Record<string, any>;
    }>;
}
export declare class DeviceTestedRepository {
    private readonly dbService?;
    private readonly logger;
    private memoryRecords;
    private initializedSeed;
    constructor(dbService?: DynamicDatabaseService);
    private seedFromDefaultCsvIfAvailable;
    getRepo(): Repository<DeviceTestedEntity> | null;
    parseCsvString(csvText: string): Array<Record<string, any>>;
    private saveToMemoryRecord;
    findBySerialNumber(serialNumber: string, itemCode?: string): Promise<DeviceTestedEntity | null>;
    findAll(query?: QueryDeviceTestedDto): Promise<{
        data: DeviceTestedEntity[];
        total: number;
    }>;
    saveOrUpdate(dto: CreateDeviceTestedDto): Promise<DeviceTestedEntity>;
    updateAppKey(serialNumber: string, appKey: string): Promise<DeviceTestedEntity | null>;
    getTree(): Promise<DeviceTestedTreeGroup[]>;
    bulkImportCsv(csvRecords: Array<Record<string, any>>): Promise<{
        imported: number;
        updated: number;
        total: number;
    }>;
}
