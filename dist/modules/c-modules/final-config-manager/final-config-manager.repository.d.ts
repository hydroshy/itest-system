import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { FinalConfigSnEntity } from './entities/final-config-sn.entity';
import { FinalConfigRegsSnEntity } from './entities/final-config-regs-sn.entity';
import { FinalConfigPresetEntity } from '../create-final-config/entities/final-config-preset.entity';
import { FinalConfigRegEntity } from '../create-final-config/entities/final-config-reg.entity';
import { CreateFinalConfigRepository } from '../create-final-config/create-final-config.repository';
import { QueryPresetsDto, QueryDevicesDto, SaveDeviceFinalConfigDto, SyncFromPresetDto, UpdateDeviceStatusDto } from './dto/final-config-manager.dto';
export declare class FinalConfigManagerRepository {
    private readonly dbService?;
    private readonly createPresetRepo?;
    private readonly logger;
    private memoryPresets;
    private memoryRegs;
    private memoryDevices;
    private memoryDeviceKeys;
    private memoryDeviceRegs;
    constructor(dbService?: DynamicDatabaseService, createPresetRepo?: CreateFinalConfigRepository);
    getSnRepo(): Repository<FinalConfigSnEntity> | null;
    getSnRegRepo(): Repository<FinalConfigRegsSnEntity> | null;
    getPresetRepo(): Repository<FinalConfigPresetEntity> | null;
    getRegRepo(): Repository<FinalConfigRegEntity> | null;
    private getCompositeDeviceKey;
    findAllPresets(filter?: QueryPresetsDto): Promise<{
        data: FinalConfigPresetEntity[];
        total: number;
    }>;
    findPresetBySoAndItemCode(so: string, itemCode: string): Promise<{
        preset: FinalConfigPresetEntity;
        registers: FinalConfigRegEntity[];
    } | null>;
    findPresetById(id: string): Promise<{
        preset: FinalConfigPresetEntity;
        registers: FinalConfigRegEntity[];
    } | null>;
    deletePreset(id: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    }>;
    findDevices(filter?: QueryDevicesDto): Promise<{
        data: FinalConfigSnEntity[];
        total: number;
        kpis: {
            total: number;
            pass: number;
            fail: number;
            none: number;
        };
    }>;
    findDeviceBySerialNumber(serialNumber: string, itemCode?: string): Promise<{
        device: FinalConfigSnEntity;
        registers: FinalConfigRegsSnEntity[];
    } | null>;
    findDeviceById(id: string): Promise<{
        device: FinalConfigSnEntity;
        registers: FinalConfigRegsSnEntity[];
    } | null>;
    saveOrUpdateDevice(dto: SaveDeviceFinalConfigDto): Promise<{
        device: FinalConfigSnEntity;
        registers: FinalConfigRegsSnEntity[];
    }>;
    syncFromPreset(dto: SyncFromPresetDto): Promise<{
        success: boolean;
        createdCount: number;
        updatedCount: number;
        message?: string;
    }>;
    updateDeviceStatus(id: string, dto: UpdateDeviceStatusDto): Promise<{
        device: FinalConfigSnEntity;
        registers: FinalConfigRegsSnEntity[];
    } | null>;
    getStats(): Promise<{
        presetsCount: number;
        devicesCount: number;
        passCount: number;
        failCount: number;
        noneCount: number;
    }>;
}
