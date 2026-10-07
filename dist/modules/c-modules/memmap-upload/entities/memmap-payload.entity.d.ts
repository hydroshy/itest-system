import { MemmapRegEntity } from './memmap-reg.entity';
export declare class MemmapPayloadEntity {
    id: string;
    sku: string;
    short_fw: number;
    file_name?: string;
    total_regs: number;
    dec_valid: boolean;
    hex_valid: boolean;
    created_by?: string;
    registers?: MemmapRegEntity[];
    created_at: Date;
    updated_at: Date;
}
