import { MemmapPayloadEntity } from './memmap-payload.entity';
export declare class MemmapRegEntity {
    id: string;
    payload_id: string;
    payload?: MemmapPayloadEntity;
    sku: string;
    short_fw: number;
    no: number;
    modbus_reg_dec: number;
    modbus_reg_hex: string;
    fn_read?: string;
    fn_write?: string;
    num_regs: number;
    description?: string;
    range_val?: string;
    end_user_default?: string;
    format?: string;
    downlink_type_5?: string;
    in_rd1_template: boolean;
    comment?: string;
    in_engineering_template: boolean;
    in_end_user_template: boolean;
    in_full_template: boolean;
    created_at: Date;
}
