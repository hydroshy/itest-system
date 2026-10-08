import { DeviceTestedStatus } from '../entities/device-tested.entity';
export declare class VerifyDeviceTestedDto {
    serial_number: string;
    item_code?: string;
    so?: string;
}
export declare class CreateDeviceTestedDto {
    so: string;
    item_code: string;
    serial_number: string;
    dev_eui: string;
    sku: string;
    firmware_version: string;
    short_fw?: number;
    sensor_type?: number;
    status?: DeviceTestedStatus;
    station_id?: string;
    operator?: string;
    app_key?: string;
    tested_at?: Date | string;
    notes?: string;
    metadata?: Record<string, any>;
}
export declare class QueryDeviceTestedDto {
    so?: string;
    item_code?: string;
    serial_number?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}
