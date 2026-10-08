export declare enum FinalConfigStatus {
    PASS = "PASS",
    FAIL = "FAIL",
    NONE = "NONE"
}
export declare class QueryPresetsDto {
    so?: string;
    item_code?: string;
    search?: string;
    limit?: number;
    offset?: number;
}
export declare class QueryPresetBySoItemDto {
    so: string;
    item_code: string;
}
export declare class QueryDevicesDto {
    status?: FinalConfigStatus;
    so?: string;
    item_code?: string;
    serial_number?: string;
    search?: string;
    limit?: number;
    offset?: number;
}
export declare class DeviceRegisterDto {
    id?: string;
    address: number;
    modbus_reg_hex?: string;
    slave?: number;
    reg_num?: number;
    format?: string;
    parameter_name?: string;
    value_to_write?: string;
    value_read_back?: string;
    status?: FinalConfigStatus;
    endianness?: string;
    fn_read?: string;
    fn_write?: string;
    order_no?: number;
}
export declare class SaveDeviceFinalConfigDto {
    serial_number: string;
    item_code: string;
    so?: string;
    preset_id?: string;
    sku: string;
    firmware_version?: string;
    short_fw?: number;
    status?: FinalConfigStatus;
    dev_eui?: string;
    app_key?: string;
    operator?: string;
    notes?: string;
    metadata?: Record<string, any>;
    registers?: DeviceRegisterDto[];
}
export declare class SyncFromPresetDto {
    so: string;
    item_code: string;
    serial_numbers: string[];
    operator?: string;
}
export declare class UpdateDeviceStatusDto {
    status: FinalConfigStatus;
    notes?: string;
    operator?: string;
    registers?: Partial<DeviceRegisterDto>[];
}
