import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { FinalConfigManagerService } from './final-config-manager.service';
import { QueryPresetsDto, QueryDevicesDto, SaveDeviceFinalConfigDto, SyncFromPresetDto, UpdateDeviceStatusDto } from './dto/final-config-manager.dto';
export declare class FinalConfigAuthGuard extends JwtAuthGuard {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | import("rxjs").Observable<boolean>;
}
export declare class FinalConfigManagerController {
    private readonly service;
    constructor(service: FinalConfigManagerService);
    getPresets(query: QueryPresetsDto): Promise<{
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
    deletePreset(id: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    }>;
    getDevices(query: QueryDevicesDto): Promise<{
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
    saveDevice(dto: SaveDeviceFinalConfigDto, user?: User): Promise<{
        success: boolean;
        message: string;
        data: import(".").FinalConfigSnEntity;
        registers: import(".").FinalConfigRegsSnEntity[];
    }>;
    syncFromPreset(dto: SyncFromPresetDto, user?: User): Promise<{
        success: boolean;
        createdCount: number;
        updatedCount: number;
        totalProcessed: number;
    }>;
    updateDeviceStatus(id: string, dto: UpdateDeviceStatusDto, user?: User): Promise<{
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
