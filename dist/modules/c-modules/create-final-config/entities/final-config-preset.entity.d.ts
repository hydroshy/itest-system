import { FinalConfigRegEntity } from './final-config-reg.entity';
export declare class FinalConfigPresetEntity {
    id: string;
    so: string;
    item_code: string;
    sku: string;
    firmware_version: string;
    short_fw: number;
    name: string;
    description?: string;
    total_regs: number;
    write_timeout_ms?: number;
    settling_delay_ms?: number;
    enable_probe_verification?: boolean;
    probe_interval_ms?: number;
    max_probe_timeout_ms?: number;
    safe_probe_register?: number;
    created_by?: string;
    registers?: FinalConfigRegEntity[];
    created_at: Date;
    updated_at: Date;
}
