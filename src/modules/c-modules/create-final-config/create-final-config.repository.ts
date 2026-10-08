import { Injectable, Logger, Optional } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { FinalConfigPresetEntity } from './entities/final-config-preset.entity';
import { FinalConfigRegEntity } from './entities/final-config-reg.entity';
import { SaveFinalConfigDto } from './dto/create-final-config.dto';

@Injectable()
export class CreateFinalConfigRepository {
  private readonly logger = new Logger(CreateFinalConfigRepository.name);

  // In-memory fallback cache when PostgreSQL is offline or running tests
  private memoryPresets = new Map<string, FinalConfigPresetEntity>();
  private memoryRegs = new Map<string, FinalConfigRegEntity[]>();

  constructor(@Optional() private readonly dbService?: DynamicDatabaseService) {}

  public getPresetRepo(): Repository<FinalConfigPresetEntity> | null {
    if (!this.dbService) return null;
    try {
      return this.dbService.getRepositoryForTable('final_config_presets', FinalConfigPresetEntity);
    } catch {
      return null;
    }
  }

  public getRegRepo(): Repository<FinalConfigRegEntity> | null {
    if (!this.dbService) return null;
    try {
      return this.dbService.getRepositoryForTable('final_config_regs', FinalConfigRegEntity);
    } catch {
      return null;
    }
  }

  private getCompositeKey(so: string, itemCode: string): string {
    return `${so.trim().toUpperCase()}_${itemCode.trim().toUpperCase()}`;
  }

  public async saveOrUpdate(
    dto: SaveFinalConfigDto,
  ): Promise<{ preset: FinalConfigPresetEntity; registers: FinalConfigRegEntity[] }> {
    const so = dto.so.trim();
    const itemCode = dto.item_code.trim();
    const compositeKey = this.getCompositeKey(so, itemCode);

    // Filter strictly Dec Reg >= 303
    const validRegDtos = (dto.registers || []).filter((r) => Number(r.address) >= 303);

    const presetRepo = this.getPresetRepo();
    const regRepo = this.getRegRepo();

    if (presetRepo && regRepo) {
      try {
        const dataSource = presetRepo.manager.connection;
        return await dataSource.transaction(async (manager) => {
          let existing = await manager.findOne(FinalConfigPresetEntity, {
            where: { so, item_code: itemCode },
          });

          let presetId: string;
          if (existing) {
            presetId = existing.id;
            await manager.update(FinalConfigPresetEntity, presetId, {
              sku: dto.sku.trim(),
              firmware_version: dto.firmware_version.trim(),
              short_fw: Number(dto.short_fw),
              name: dto.name.trim(),
              description: dto.description || undefined,
              total_regs: validRegDtos.length,
              created_by: dto.created_by || 'admin',
              updated_at: new Date(),
            });
            // Remove previous registers
            await manager.delete(FinalConfigRegEntity, { preset_id: presetId });
          } else {
            const newPreset = manager.create(FinalConfigPresetEntity, {
              so,
              item_code: itemCode,
              sku: dto.sku.trim(),
              firmware_version: dto.firmware_version.trim(),
              short_fw: Number(dto.short_fw),
              name: dto.name.trim(),
              description: dto.description || undefined,
              total_regs: validRegDtos.length,
              created_by: dto.created_by || 'admin',
            });
            const savedPreset = await manager.save(FinalConfigPresetEntity, newPreset);
            presetId = savedPreset.id;
          }

          const entitiesToInsert = validRegDtos.map((r, idx) => {
            return manager.create(FinalConfigRegEntity, {
              preset_id: presetId,
              address: Number(r.address),
              modbus_reg_hex: r.modbus_reg_hex,
              slave: r.slave !== undefined ? Number(r.slave) : 1,
              reg_num: r.reg_num !== undefined ? Number(r.reg_num) : 1,
              format: r.format || 'uint',
              parameter_name: r.parameter_name || '',
              value_to_write: String(r.value_to_write ?? ''),
              value_on_memmap: r.value_on_memmap || undefined,
              endianness: r.endianness || 'big-endian',
              fn_read: r.fn_read || '3',
              fn_write: r.fn_write || '16',
              order_no: r.order_no !== undefined ? Number(r.order_no) : idx,
              checked: r.checked !== undefined ? !!r.checked : true,
            });
          });

          let savedRegs: FinalConfigRegEntity[] = [];
          if (entitiesToInsert.length > 0) {
            savedRegs = await manager.save(FinalConfigRegEntity, entitiesToInsert);
          }

          const finalPreset = await manager.findOneOrFail(FinalConfigPresetEntity, {
            where: { id: presetId },
          });

          // Sync in-memory cache
          this.memoryPresets.set(compositeKey, finalPreset);
          this.memoryRegs.set(presetId, savedRegs);

          return { preset: finalPreset, registers: savedRegs };
        });
      } catch (err: any) {
        this.logger.warn(
          `Database transaction failed for Final Config (${so}, ${itemCode}): ${err.message}. Fallback to memory.`,
        );
      }
    }

    // In-memory fallback
    let existingPreset = this.memoryPresets.get(compositeKey);
    let presetId = existingPreset?.id || 'fc_preset_' + Date.now().toString(36);

    const presetEntity: FinalConfigPresetEntity = {
      id: presetId,
      so,
      item_code: itemCode,
      sku: dto.sku.trim(),
      firmware_version: dto.firmware_version.trim(),
      short_fw: Number(dto.short_fw),
      name: dto.name.trim(),
      description: dto.description,
      total_regs: validRegDtos.length,
      created_by: dto.created_by || 'admin',
      created_at: existingPreset?.created_at || new Date(),
      updated_at: new Date(),
    };

    const regs: FinalConfigRegEntity[] = validRegDtos.map((r, idx) => ({
      id: 'fc_reg_' + Date.now().toString(36) + '_' + idx,
      preset_id: presetId,
      address: Number(r.address),
      modbus_reg_hex: r.modbus_reg_hex,
      slave: r.slave !== undefined ? Number(r.slave) : 1,
      reg_num: r.reg_num !== undefined ? Number(r.reg_num) : 1,
      format: r.format || 'uint',
      parameter_name: r.parameter_name || '',
      value_to_write: String(r.value_to_write ?? ''),
      value_on_memmap: r.value_on_memmap,
      endianness: r.endianness || 'big-endian',
      fn_read: r.fn_read || '3',
      fn_write: r.fn_write || '16',
      order_no: r.order_no !== undefined ? Number(r.order_no) : idx,
      checked: r.checked !== undefined ? !!r.checked : true,
      created_at: new Date(),
    }));

    this.memoryPresets.set(compositeKey, presetEntity);
    this.memoryRegs.set(presetId, regs);

    return { preset: presetEntity, registers: regs };
  }

  public async findBySoAndItemCode(
    so: string,
    itemCode: string,
  ): Promise<{ preset: FinalConfigPresetEntity; registers: FinalConfigRegEntity[] } | null> {
    const cleanSo = so.trim();
    const cleanItemCode = itemCode.trim();
    const presetRepo = this.getPresetRepo();
    const regRepo = this.getRegRepo();

    if (presetRepo && regRepo) {
      try {
        const preset = await presetRepo.findOne({
          where: { so: cleanSo, item_code: cleanItemCode },
        });
        if (preset) {
          const registers = await regRepo.find({
            where: { preset_id: preset.id },
            order: { order_no: 'ASC', address: 'ASC' },
          });
          return { preset, registers };
        }
      } catch (err: any) {
        this.logger.warn(`Database lookup failed for Final Config (${so}, ${itemCode}): ${err.message}`);
      }
    }

    const compositeKey = this.getCompositeKey(cleanSo, cleanItemCode);
    const memPreset = this.memoryPresets.get(compositeKey);
    if (memPreset) {
      const regs = this.memoryRegs.get(memPreset.id) || [];
      return { preset: memPreset, registers: regs };
    }

    return null;
  }

  public async findAllPresets(): Promise<FinalConfigPresetEntity[]> {
    const presetRepo = this.getPresetRepo();
    if (presetRepo) {
      try {
        return await presetRepo.find({ order: { updated_at: 'DESC' } });
      } catch (err: any) {
        this.logger.warn(`Database lookup all Final Config presets failed: ${err.message}`);
      }
    }
    return Array.from(this.memoryPresets.values()).sort(
      (a, b) => b.updated_at.getTime() - a.updated_at.getTime(),
    );
  }
}
