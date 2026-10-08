import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { FinalConfigPresetEntity } from './entities/final-config-preset.entity';
import { FinalConfigRegEntity } from './entities/final-config-reg.entity';
import { SaveFinalConfigDto } from './dto/create-final-config.dto';
export declare class CreateFinalConfigRepository {
    private readonly dbService?;
    private readonly logger;
    private memoryPresets;
    private memoryRegs;
    constructor(dbService?: DynamicDatabaseService);
    getPresetRepo(): Repository<FinalConfigPresetEntity> | null;
    getRegRepo(): Repository<FinalConfigRegEntity> | null;
    private getCompositeKey;
    saveOrUpdate(dto: SaveFinalConfigDto): Promise<{
        preset: FinalConfigPresetEntity;
        registers: FinalConfigRegEntity[];
    }>;
    findBySoAndItemCode(so: string, itemCode: string): Promise<{
        preset: FinalConfigPresetEntity;
        registers: FinalConfigRegEntity[];
    } | null>;
    findAllPresets(): Promise<FinalConfigPresetEntity[]>;
    deletePreset(id: string): Promise<boolean>;
}
