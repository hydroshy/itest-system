import { ModbusRegisterItem } from '../entities/modbus-preset.entity';
export declare class CreateModbusPresetDto {
    name: string;
    description?: string;
    profileType?: string;
    createdBy?: string;
    so?: string;
    itemCode?: string;
    sku?: string;
    firmwareVersion?: string;
    shortFw?: number;
    registers: ModbusRegisterItem[];
}
export declare class UpdateModbusPresetDto {
    name?: string;
    description?: string;
    profileType?: string;
    registers?: ModbusRegisterItem[];
}
