import { User } from '../../users/entities/user.entity';
import { ModbusPresetsService } from './modbus-presets.service';
import { CreateModbusPresetDto, UpdateModbusPresetDto } from './dto/modbus-preset.dto';
export declare class ModbusPresetsController {
    private readonly presetsService;
    constructor(presetsService: ModbusPresetsService);
    findAll(): Promise<import(".").ModbusPresetEntity[]>;
    findOne(id: string): Promise<import(".").ModbusPresetEntity>;
    create(dto: CreateModbusPresetDto, user: User): Promise<import(".").ModbusPresetEntity>;
    update(id: string, dto: UpdateModbusPresetDto, user: User): Promise<import(".").ModbusPresetEntity>;
    delete(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
}
