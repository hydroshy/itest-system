import { OnModuleInit } from '@nestjs/common';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { ModbusPresetEntity } from './entities/modbus-preset.entity';
import { CreateModbusPresetDto, UpdateModbusPresetDto } from './dto/modbus-preset.dto';
export declare class ModbusPresetsService implements OnModuleInit {
    private readonly dbService?;
    private readonly logger;
    private presets;
    constructor(dbService?: DynamicDatabaseService);
    private getConfigPath;
    onModuleInit(): Promise<void>;
    private loadPresetsFromFile;
    private savePresetsToFile;
    private initDatabaseTable;
    private syncToDatabase;
    findAll(): Promise<ModbusPresetEntity[]>;
    findOne(id: string): Promise<ModbusPresetEntity>;
    create(dto: CreateModbusPresetDto, username?: string): Promise<ModbusPresetEntity>;
    update(id: string, dto: UpdateModbusPresetDto, username?: string): Promise<ModbusPresetEntity>;
    delete(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
    private seedDefaultPresets;
}
