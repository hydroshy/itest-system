import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CreateFinalConfigRepository } from './create-final-config.repository';
import { SaveFinalConfigDto } from './dto/create-final-config.dto';
import { FinalConfigPresetEntity } from './entities/final-config-preset.entity';
import { FinalConfigRegEntity } from './entities/final-config-reg.entity';
import { sanitizeFw } from '../final-config-manager/final-config-utils';

@Injectable()
export class CreateFinalConfigService {
  private readonly logger = new Logger(CreateFinalConfigService.name);

  constructor(private readonly repository: CreateFinalConfigRepository) {}

  public async saveFinalConfig(
    dto: SaveFinalConfigDto,
    author: string = 'admin',
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      preset: FinalConfigPresetEntity;
      registers: FinalConfigRegEntity[];
    };
  }> {
    if (!dto.so || !dto.so.trim()) {
      throw new BadRequestException('Sales Order (SO) is required');
    }
    if (!dto.item_code || !dto.item_code.trim()) {
      throw new BadRequestException('Item Code is required');
    }
    if (!dto.sku || !dto.sku.trim()) {
      throw new BadRequestException('Hardware SKU is required');
    }
    if (dto.short_fw === undefined || dto.short_fw === null || isNaN(Number(dto.short_fw))) {
      throw new BadRequestException('Short FW Version must be an integer');
    }

    const validRegs = (dto.registers || []).filter((r) => Number(r.address) >= 303);
    if (validRegs.length === 0) {
      throw new BadRequestException('Final Config requires at least one register with Dec Reg >= 303');
    }

    const cleanFw = sanitizeFw(dto.firmware_version || String(dto.short_fw));
    const payloadToSave: SaveFinalConfigDto = {
      ...dto,
      so: dto.so.trim(),
      item_code: dto.item_code.trim(),
      sku: dto.sku.trim().toUpperCase(),
      firmware_version: cleanFw,
      short_fw: Number(cleanFw),
      name: dto.name ? dto.name.trim() : `[Final Config] ${dto.so} - ${dto.item_code}`,
      created_by: author || dto.created_by || 'admin',
      registers: validRegs,
    };

    const result = await this.repository.saveOrUpdate(payloadToSave);

    this.logger.log(
      `Saved Final Config Preset for SO [${dto.so}] Item [${dto.item_code}] SKU [${dto.sku}] Short FW [${dto.short_fw}]: ${result.registers.length} regs`,
    );

    return {
      success: true,
      message: 'Final Config saved successfully',
      data: result,
    };
  }

  public async getFinalConfig(
    so: string,
    itemCode: string,
  ): Promise<{ preset: FinalConfigPresetEntity; registers: FinalConfigRegEntity[] } | null> {
    return await this.repository.findBySoAndItemCode(so, itemCode);
  }

  public async listFinalConfigs(): Promise<FinalConfigPresetEntity[]> {
    return await this.repository.findAllPresets();
  }
}
