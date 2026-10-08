import { FinalConfigManagerRepository } from './final-config-manager.repository';
import { QueryPresetsDto, QueryDevicesDto, SaveDeviceFinalConfigDto, SyncFromPresetDto, UpdateDeviceStatusDto } from './dto/final-config-manager.dto';
export declare class FinalConfigManagerService {
    private readonly repository;
    private readonly logger;
    constructor(repository: FinalConfigManagerRepository);
    getPresets(query?: QueryPresetsDto): Promise<{
        success: boolean;
        data: import("../create-final-config").FinalConfigPresetEntity[];
        total: number;
    }>;
    getPresetBySoItem(so: string, itemCode: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    } | {
        success: boolean;
        data: {
            preset: import("../create-final-config").FinalConfigPresetEntity;
            registers: import("../create-final-config").FinalConfigRegEntity[];
        };
        message?: undefined;
    }>;
    getPresetById(id: string): Promise<{
        success: boolean;
        data: {
            preset: import("../create-final-config").FinalConfigPresetEntity;
            registers: import("../create-final-config").FinalConfigRegEntity[];
        };
    }>;
    getDevices(query?: QueryDevicesDto): Promise<{
        success: boolean;
        data: import(".").FinalConfigSnEntity[];
        total: number;
        kpis: {
            total: number;
            pass: number;
            fail: number;
            none: number;
        };
    }>;
    getDeviceBySerialNumber(serialNumber: string, itemCode?: string): Promise<{
        success: boolean;
        data: {
            device: import(".").FinalConfigSnEntity;
            registers: import(".").FinalConfigRegsSnEntity[];
        };
    }>;
    getDeviceById(id: string): Promise<{
        success: boolean;
        data: {
            device: import(".").FinalConfigSnEntity;
            registers: import(".").FinalConfigRegsSnEntity[];
        };
    }>;
    saveDevice(dto: SaveDeviceFinalConfigDto, operator?: string): Promise<{
        success: boolean;
        message: string;
        data: import(".").FinalConfigSnEntity;
        registers: import(".").FinalConfigRegsSnEntity[];
    }>;
    syncFromPreset(dto: SyncFromPresetDto, operator?: string): Promise<{
        success: boolean;
        createdCount: number;
        updatedCount: number;
        totalProcessed: number;
    }>;
    updateDeviceStatus(id: string, dto: UpdateDeviceStatusDto, operator?: string): Promise<{
        success: boolean;
        message: string;
        data: import(".").FinalConfigSnEntity;
        registers: import(".").FinalConfigRegsSnEntity[];
    }>;
    getStats(): Promise<{
        success: boolean;
        data: {
            presetsCount: number;
            devicesCount: number;
            passCount: number;
            failCount: number;
            noneCount: number;
        };
    }>;
}
