import { User } from '../../users/entities/user.entity';
import { CreateFinalConfigService } from './create-final-config.service';
import { SaveFinalConfigDto } from './dto/create-final-config.dto';
export declare class CreateFinalConfigController {
    private readonly finalConfigService;
    constructor(finalConfigService: CreateFinalConfigService);
    saveFinalConfig(dto: SaveFinalConfigDto, user?: User): Promise<{
        success: boolean;
        message: string;
        data: {
            preset: import(".").FinalConfigPresetEntity;
            registers: import(".").FinalConfigRegEntity[];
        };
    }>;
    listFinalConfigs(): Promise<{
        success: boolean;
        data: import(".").FinalConfigPresetEntity[];
    }>;
    getFinalConfig(so: string, itemCode: string): Promise<{
        success: boolean;
        data: {
            preset: import(".").FinalConfigPresetEntity;
            registers: import(".").FinalConfigRegEntity[];
        };
    }>;
}
