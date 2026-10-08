import { DeviceTestedStatus } from '../entities/device-tested.entity';
export declare class VerifyDeviceTestedDto {
    serial_number: string;
    device_key?: string;
    item_code?: string;
    fw_ver?: string;
    hw_ver?: string;
    so?: string;
}
export declare class CreateDeviceTestedDto {
    so?: string;
    so_number?: string;
    item_code: string;
    serial_number: string;
    dev_eui?: string;
    device_key?: string;
    sku?: string;
    firmware_version?: string;
    fw_ver?: string;
    hw_ver?: string;
    short_fw?: number;
    sensor_type?: number;
    status?: DeviceTestedStatus;
    result?: string;
    auto_check?: string;
    test_id?: string;
    label_check_code?: string;
    start_time?: string;
    duration_time?: string;
    time_finish?: number | string;
    station_id?: string;
    test_station?: string;
    operator?: string;
    test_person?: string;
    test_result_id?: string;
    app_key?: string;
    tested_at?: Date | string;
    notes?: string;
    test_note?: string;
    metadata?: Record<string, any>;
    csv_raw_data?: Record<string, any>;
}
export declare class UpdateAppKeyDto {
    app_key: string;
}
export declare class ImportCsvDto {
    csv_content?: string;
    records?: Array<Record<string, any>>;
}
export declare class QueryDeviceTestedDto {
    so?: string;
    so_number?: string;
    item_code?: string;
    serial_number?: string;
    device_key?: string;
    status?: string;
    auto_check?: string;
    search?: string;
    page?: number;
    limit?: number;
}
