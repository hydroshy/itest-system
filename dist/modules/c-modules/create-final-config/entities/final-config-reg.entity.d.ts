import { FinalConfigPresetEntity } from './final-config-preset.entity';
export declare class FinalConfigRegEntity {
    id: string;
    preset_id: string;
    preset?: FinalConfigPresetEntity;
    address: number;
    modbus_reg_hex: string;
    slave: number;
    reg_num: number;
    format: string;
    parameter_name: string;
    value_to_write?: string;
    value_on_memmap?: string;
    endianness: string;
    fn_read?: string;
    fn_write?: string;
    order_no: number;
    checked: boolean;
    created_at: Date;
}
