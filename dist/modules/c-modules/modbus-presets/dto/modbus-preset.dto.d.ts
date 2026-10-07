import { ModbusRegisterItem } from '../entities/modbus-preset.entity';
export declare class CreateModbusPresetDto {
    name: string;
    description?: string;
    profileType?: string;
    createdBy?: string;
    registers: ModbusRegisterItem[];
}
export declare class UpdateModbusPresetDto {
    name?: string;
    description?: string;
    profileType?: string;
    registers?: ModbusRegisterItem[];
}
