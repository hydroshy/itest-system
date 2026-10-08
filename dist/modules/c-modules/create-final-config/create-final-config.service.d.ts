import { CreateFinalConfigRepository } from './create-final-config.repository';
import { SaveFinalConfigDto } from './dto/create-final-config.dto';
import { FinalConfigPresetEntity } from './entities/final-config-preset.entity';
import { FinalConfigRegEntity } from './entities/final-config-reg.entity';
export declare class CreateFinalConfigService {
    private readonly repository;
    private readonly logger;
    constructor(repository: CreateFinalConfigRepository);
    saveFinalConfig(dto: SaveFinalConfigDto, author?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            preset: FinalConfigPresetEntity;
            registers: FinalConfigRegEntity[];
        };
    }>;
    getFinalConfig(so: string, itemCode: string): Promise<{
        preset: FinalConfigPresetEntity;
        registers: FinalConfigRegEntity[];
    } | null>;
    listFinalConfigs(): Promise<FinalConfigPresetEntity[]>;
}
