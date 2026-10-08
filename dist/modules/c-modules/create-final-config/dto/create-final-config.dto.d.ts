export interface FinalConfigRegisterDto {
    address: number;
    modbus_reg_hex: string;
    slave?: number;
    reg_num?: number;
    format: string;
    parameter_name: string;
    value_to_write: string;
    value_on_memmap?: string;
    endianness?: string;
    fn_read?: string;
    fn_write?: string;
    order_no?: number;
    checked?: boolean;
}
export interface SaveFinalConfigDto {
    so: string;
    item_code: string;
    sku: string;
    firmware_version: string;
    short_fw: number;
    name: string;
    description?: string;
    created_by?: string;
    registers: FinalConfigRegisterDto[];
}
