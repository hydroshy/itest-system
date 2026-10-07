export interface ModbusRegisterItem {
    id: string;
    order?: number;
    checked?: boolean;
    slave?: number;
    fc?: number;
    reg?: number;
    numreg?: number;
    format?: string;
    endianness?: string;
    parameter?: string;
    valuetowrite?: string;
    comment?: string;
    range?: string;
}
export declare class ModbusPresetEntity {
    id: string;
    name: string;
    description?: string;
    profileType: string;
    createdBy?: string;
    registers: ModbusRegisterItem[];
    createdAt: Date;
    updatedAt: Date;
}
