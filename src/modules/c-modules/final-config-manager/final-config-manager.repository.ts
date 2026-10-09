import { Injectable, Logger, Optional, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { FinalConfigSnEntity } from './entities/final-config-sn.entity';
import { FinalConfigRegsSnEntity } from './entities/final-config-regs-sn.entity';
import { FinalConfigPresetEntity } from '../create-final-config/entities/final-config-preset.entity';
import { FinalConfigRegEntity } from '../create-final-config/entities/final-config-reg.entity';
import { CreateFinalConfigRepository } from '../create-final-config/create-final-config.repository';
import {
  QueryPresetsDto,
  QueryDevicesDto,
  SaveDeviceFinalConfigDto,
  SyncFromPresetDto,
  UpdateDeviceStatusDto,
  FinalConfigStatus,
} from './dto/final-config-manager.dto';
import { sanitizeFw } from './final-config-utils';

@Injectable()
export class FinalConfigManagerRepository {
  private readonly logger = new Logger(FinalConfigManagerRepository.name);

  // In-memory fallback cache for test environments without live DB
  private memoryPresets = new Map<string, FinalConfigPresetEntity>();
  private memoryRegs = new Map<string, FinalConfigRegEntity[]>();
  private memoryDevices = new Map<string, FinalConfigSnEntity>();
  private memoryDeviceKeys = new Map<string, string>();
  private memoryDeviceRegs = new Map<string, FinalConfigRegsSnEntity[]>();

  constructor(
    @Optional() private readonly dbService?: DynamicDatabaseService,
    @Optional() private readonly createPresetRepo?: CreateFinalConfigRepository,
  ) {}

  public getSnRepo(): Repository<FinalConfigSnEntity> | null {
    if (!this.dbService) return null;
    try {
      return this.dbService.getRepositoryForTable('final_config_sn', FinalConfigSnEntity);
    } catch {
      return null;
    }
  }

  public getSnRegRepo(): Repository<FinalConfigRegsSnEntity> | null {
    if (!this.dbService) return null;
    try {
      return this.dbService.getRepositoryForTable('final_config_regs_sn', FinalConfigRegsSnEntity);
    } catch {
      return null;
    }
  }

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

  private getCompositeDeviceKey(serialNumber: string, itemCode: string): string {
    return `${serialNumber.trim().toUpperCase()}__${itemCode.trim().toUpperCase()}`;
  }

  // =========================================================================
  // PRESETS LOOKUP & INSPECTION (TAB 1)
  // =========================================================================

  public async findAllPresets(
    filter?: QueryPresetsDto,
  ): Promise<{ data: FinalConfigPresetEntity[]; total: number }> {
    const presetRepo = this.getPresetRepo();
    if (presetRepo) {
      try {
        const qb = presetRepo.createQueryBuilder('p');
        if (filter?.so) {
          qb.andWhere('p.so ILIKE :so', { so: `%${filter.so.trim()}%` });
        }
        if (filter?.item_code) {
          qb.andWhere('p.item_code ILIKE :itemCode', { itemCode: `%${filter.item_code.trim()}%` });
        }
        if (filter?.search) {
          const s = `%${filter.search.trim()}%`;
          qb.andWhere(
            '(p.so ILIKE :s OR p.item_code ILIKE :s OR p.sku ILIKE :s OR p.name ILIKE :s)',
            { s },
          );
        }
        qb.orderBy('p.created_at', 'DESC');
        if (filter?.limit) qb.take(filter.limit);
        if (filter?.offset) qb.skip(filter.offset);

        const [data, total] = await qb.getManyAndCount();
        return { data, total };
      } catch (err: any) {
        this.logger.warn(`Database query failed for presets, falling back to memory: ${err.message}`);
      }
    }

    // In-memory fallback
    let items: FinalConfigPresetEntity[] = [];
    if (this.createPresetRepo) {
      items = await this.createPresetRepo.findAllPresets();
    }
    if (items.length === 0) {
      items = Array.from(this.memoryPresets.values());
    }

    let filtered = [...items];
    if (filter?.so) {
      const q = filter.so.trim().toLowerCase();
      filtered = filtered.filter((p) => (p.so || '').toLowerCase().includes(q));
    }
    if (filter?.item_code) {
      const q = filter.item_code.trim().toLowerCase();
      filtered = filtered.filter((p) => (p.item_code || '').toLowerCase().includes(q));
    }
    if (filter?.search) {
      const q = filter.search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.so || '').toLowerCase().includes(q) ||
          (p.item_code || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.name || '').toLowerCase().includes(q),
      );
    }
    const total = filtered.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 100;
    const data = filtered.slice(offset, offset + limit);
    return { data, total };
  }

  public async findPresetBySoAndItemCode(
    so: string,
    itemCode: string,
  ): Promise<{ preset: FinalConfigPresetEntity; registers: FinalConfigRegEntity[] } | null> {
    const s = so.trim();
    const it = itemCode.trim();

    const presetRepo = this.getPresetRepo();
    const regRepo = this.getRegRepo();

    if (presetRepo && regRepo) {
      try {
        const preset = await presetRepo.findOne({
          where: { so: s, item_code: it },
        });
        if (preset) {
          const rawRegs = await regRepo.find({
            where: { preset_id: preset.id },
            order: { order_no: 'ASC', address: 'ASC' },
          });
          const registers = rawRegs.filter((r) => Number(r.address) >= 303);
          return { preset, registers };
        }
      } catch (err: any) {
        this.logger.warn(`DB findPresetBySoAndItemCode failed, trying fallback: ${err.message}`);
      }
    }

    if (this.createPresetRepo) {
      const fromCreate = await this.createPresetRepo.findBySoAndItemCode(s, it);
      if (fromCreate) return fromCreate;
    }

    for (const p of this.memoryPresets.values()) {
      if (p.so === s && p.item_code === it) {
        const regs = (this.memoryRegs.get(p.id) || []).filter((r) => Number(r.address) >= 303);
        return { preset: p, registers: regs };
      }
    }
    return null;
  }

  public async findPresetById(
    id: string,
  ): Promise<{ preset: FinalConfigPresetEntity; registers: FinalConfigRegEntity[] } | null> {
    const presetRepo = this.getPresetRepo();
    const regRepo = this.getRegRepo();

    if (presetRepo && regRepo) {
      try {
        const preset = await presetRepo.findOne({ where: { id } });
        if (preset) {
          const rawRegs = await regRepo.find({
            where: { preset_id: preset.id },
            order: { order_no: 'ASC', address: 'ASC' },
          });
          const registers = rawRegs.filter((r) => Number(r.address) >= 303);
          return { preset, registers };
        }
      } catch (err: any) {
        this.logger.warn(`DB findPresetById failed: ${err.message}`);
      }
    }

    const preset = this.memoryPresets.get(id);
    if (preset) {
      const regs = (this.memoryRegs.get(id) || []).filter((r) => Number(r.address) >= 303);
      return { preset, registers: regs };
    }

    if (this.createPresetRepo) {
      const allPresets = await this.createPresetRepo.findAllPresets();
      const p = allPresets.find((x) => x.id === id);
      if (p) {
        const found = await this.createPresetRepo.findBySoAndItemCode(p.so, p.item_code);
        if (found) {
          const regs = found.registers.filter((r) => Number(r.address) >= 303);
          return { preset: found.preset, registers: regs };
        }
      }
    }

    return null;
  }

  public async deletePreset(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const presetRepo = this.getPresetRepo();
    const regRepo = this.getRegRepo();

    if (presetRepo) {
      const existing = await presetRepo.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Preset with ID ${id} not found`);
      }
      if (regRepo) {
        await regRepo.delete({ preset_id: id });
      }
      await presetRepo.delete(id);

      this.memoryPresets.delete(id);
      this.memoryRegs.delete(id);
      if (this.createPresetRepo) {
        await this.createPresetRepo.deletePreset(id);
      }

      this.logger.log(`Deleted Final Config Preset [${id}] - SO [${existing.so}] Item [${existing.item_code}]`);
      return { success: true, message: 'Preset deleted successfully', id };
    }

    // In-memory fallback
    let found = false;
    if (this.memoryPresets.has(id)) {
      this.memoryPresets.delete(id);
      this.memoryRegs.delete(id);
      found = true;
    }

    if (this.createPresetRepo) {
      const deletedFromCreateRepo = await this.createPresetRepo.deletePreset(id);
      if (deletedFromCreateRepo) found = true;
    }

    if (found) {
      this.logger.log(`Deleted Final Config Preset [${id}] from memory cache`);
      return { success: true, message: 'Preset deleted successfully', id };
    }

    throw new NotFoundException(`Preset with ID ${id} not found`);
  }

  // =========================================================================
  // DEVICE FINAL CONFIG RECORDS (TAB 2)
  // =========================================================================

  public async findDevices(filter?: QueryDevicesDto): Promise<{
    data: FinalConfigSnEntity[];
    total: number;
    kpis: { total: number; pass: number; fail: number; none: number };
  }> {
    const snRepo = this.getSnRepo();
    if (snRepo) {
      try {
        // Query KPIs
        const kpiRaw = await snRepo
          .createQueryBuilder('d')
          .select('COUNT(*)', 'total')
          .addSelect("COUNT(CASE WHEN d.status = 'PASS' THEN 1 END)", 'pass')
          .addSelect("COUNT(CASE WHEN d.status = 'FAIL' THEN 1 END)", 'fail')
          .addSelect("COUNT(CASE WHEN d.status = 'NONE' THEN 1 END)", 'none')
          .getRawOne();

        const kpis = {
          total: parseInt(kpiRaw?.total || '0', 10),
          pass: parseInt(kpiRaw?.pass || '0', 10),
          fail: parseInt(kpiRaw?.fail || '0', 10),
          none: parseInt(kpiRaw?.none || '0', 10),
        };

        const qb = snRepo.createQueryBuilder('d');
        if (filter?.status) {
          qb.andWhere('d.status = :status', { status: filter.status });
        }
        if (filter?.so) {
          qb.andWhere('d.so ILIKE :so', { so: `%${filter.so.trim()}%` });
        }
        if (filter?.item_code) {
          qb.andWhere('d.item_code ILIKE :itemCode', { itemCode: `%${filter.item_code.trim()}%` });
        }
        if (filter?.serial_number) {
          qb.andWhere('d.serial_number ILIKE :sn', { sn: `%${filter.serial_number.trim()}%` });
        }
        if (filter?.search) {
          const s = `%${filter.search.trim()}%`;
          qb.andWhere(
            '(d.serial_number ILIKE :s OR d.item_code ILIKE :s OR d.so ILIKE :s OR d.sku ILIKE :s OR d.dev_eui ILIKE :s)',
            { s },
          );
        }

        qb.orderBy('d.created_at', 'DESC');
        if (filter?.limit) qb.take(filter.limit);
        if (filter?.offset) qb.skip(filter.offset);

        const [data, total] = await qb.getManyAndCount();
        return { data, total, kpis };
      } catch (err: any) {
        this.logger.warn(`DB findDevices failed, falling back to memory: ${err.message}`);
      }
    }

    // In-memory fallback
    const all = Array.from(this.memoryDevices.values());
    const kpis = {
      total: all.length,
      pass: all.filter((d) => d.status === 'PASS').length,
      fail: all.filter((d) => d.status === 'FAIL').length,
      none: all.filter((d) => d.status === 'NONE').length,
    };

    let filtered = [...all];
    if (filter?.status) {
      filtered = filtered.filter((d) => d.status === filter.status);
    }
    if (filter?.so) {
      const q = filter.so.trim().toLowerCase();
      filtered = filtered.filter((d) => (d.so || '').toLowerCase().includes(q));
    }
    if (filter?.item_code) {
      const q = filter.item_code.trim().toLowerCase();
      filtered = filtered.filter((d) => (d.item_code || '').toLowerCase().includes(q));
    }
    if (filter?.serial_number) {
      const q = filter.serial_number.trim().toLowerCase();
      filtered = filtered.filter((d) => (d.serial_number || '').toLowerCase().includes(q));
    }
    if (filter?.search) {
      const q = filter.search.trim().toLowerCase();
      filtered = filtered.filter(
        (d) =>
          (d.serial_number || '').toLowerCase().includes(q) ||
          (d.item_code || '').toLowerCase().includes(q) ||
          (d.so || '').toLowerCase().includes(q) ||
          (d.sku || '').toLowerCase().includes(q) ||
          (d.dev_eui || '').toLowerCase().includes(q),
      );
    }

    filtered.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

    const total = filtered.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 100;
    const data = filtered.slice(offset, offset + limit);

    return { data, total, kpis };
  }

  public async findDeviceBySerialNumber(
    serialNumber: string,
    itemCode?: string,
  ): Promise<{ device: FinalConfigSnEntity; registers: FinalConfigRegsSnEntity[] } | null> {
    const sn = serialNumber.trim();
    const snRepo = this.getSnRepo();
    const regRepo = this.getSnRegRepo();

    if (snRepo && regRepo) {
      try {
        const whereClause: any = { serial_number: sn };
        if (itemCode) whereClause.item_code = itemCode.trim();

        const device = await snRepo.findOne({ where: whereClause });
        if (device) {
          const registers = await regRepo.find({
            where: { config_sn_id: device.id },
            order: { order_no: 'ASC', address: 'ASC' },
          });
          return { device, registers };
        }
      } catch (err: any) {
        this.logger.warn(`DB findDeviceBySerialNumber failed: ${err.message}`);
      }
    }

    for (const d of this.memoryDevices.values()) {
      if (d.serial_number.toUpperCase() === sn.toUpperCase()) {
        if (!itemCode || d.item_code.toUpperCase() === itemCode.trim().toUpperCase()) {
          const registers = this.memoryDeviceRegs.get(d.id) || [];
          return { device: d, registers };
        }
      }
    }
    return null;
  }

  public async findPassedRecord(
    serialNumber?: string,
    devEui?: string,
  ): Promise<FinalConfigSnEntity | null> {
    const sn = serialNumber ? serialNumber.trim() : undefined;
    const eui = devEui ? devEui.trim() : undefined;
    if (!sn && !eui) return null;

    const snRepo = this.getSnRepo();
    if (snRepo) {
      try {
        const qb = snRepo.createQueryBuilder('d').where("d.status = 'PASS'");

        if (sn && eui) {
          qb.andWhere('(d.serial_number = :sn OR d.dev_eui = :eui)', { sn, eui });
        } else if (sn) {
          qb.andWhere('d.serial_number = :sn', { sn });
        } else if (eui) {
          qb.andWhere('d.dev_eui = :eui', { eui });
        }
        qb.orderBy('d.tested_at', 'DESC');
        const found = await qb.getOne();
        if (found) return found;
      } catch (err: any) {
        this.logger.warn(`DB findPassedRecord failed: ${err.message}`);
      }
    }

    // In-memory fallback
    const items = Array.from(this.memoryDevices.values()).filter((d) => d.status === 'PASS');
    const matched = items.filter((d) => {
      const matchSn = sn && d.serial_number && d.serial_number.toUpperCase() === sn.toUpperCase();
      const matchEui = eui && d.dev_eui && d.dev_eui.toUpperCase() === eui.toUpperCase();
      if (sn && eui) return matchSn || matchEui;
      if (sn) return matchSn;
      if (eui) return matchEui;
      return false;
    });

    if (matched.length === 0) return null;
    matched.sort((a, b) => {
      const timeA = a.tested_at ? new Date(a.tested_at).getTime() : 0;
      const timeB = b.tested_at ? new Date(b.tested_at).getTime() : 0;
      return timeB - timeA;
    });
    return matched[0];
  }

  public async findDeviceById(
    id: string,
  ): Promise<{ device: FinalConfigSnEntity; registers: FinalConfigRegsSnEntity[] } | null> {
    const snRepo = this.getSnRepo();
    const regRepo = this.getSnRegRepo();

    if (snRepo && regRepo) {
      try {
        const device = await snRepo.findOne({ where: { id } });
        if (device) {
          const registers = await regRepo.find({
            where: { config_sn_id: device.id },
            order: { order_no: 'ASC', address: 'ASC' },
          });
          return { device, registers };
        }
      } catch (err: any) {
        this.logger.warn(`DB findDeviceById failed: ${err.message}`);
      }
    }

    const device = this.memoryDevices.get(id);
    if (device) {
      const registers = this.memoryDeviceRegs.get(id) || [];
      return { device, registers };
    }
    return null;
  }

  public async saveOrUpdateDevice(
    dto: SaveDeviceFinalConfigDto,
  ): Promise<{ device: FinalConfigSnEntity; registers: FinalConfigRegsSnEntity[] }> {
    const sn = dto.serial_number.trim();
    const itemCode = dto.item_code.trim();
    const so = dto.so ? dto.so.trim() : undefined;
    const sku = dto.sku.trim();
    const validRegDtos = (dto.registers || []).filter(
      (r) => r.address !== undefined && r.address !== null && !isNaN(Number(r.address)) && Number(r.address) >= 0,
    );

    const snRepo = this.getSnRepo();
    const regRepo = this.getSnRegRepo();

    // Auto-calculate PASS/FAIL/NONE if status not explicitly provided
    let computedStatus: 'PASS' | 'FAIL' | 'NONE' = dto.status || 'NONE';
    if (!dto.status && validRegDtos.length > 0) {
      const hasFail = validRegDtos.some((r) => r.status === FinalConfigStatus.FAIL);
      const allPass = validRegDtos.every((r) => r.status === FinalConfigStatus.PASS);
      if (hasFail) {
        computedStatus = 'FAIL';
      } else if (allPass) {
        computedStatus = 'PASS';
      } else {
        computedStatus = 'NONE';
      }
    }

    const configuredCount = validRegDtos.filter(
      (r) => (r.value_read_back && r.value_read_back.trim() !== '') || r.status === FinalConfigStatus.PASS || r.status === FinalConfigStatus.FAIL,
    ).length;

    if (snRepo && regRepo) {
      try {
        const dataSource = snRepo.manager.connection;
        return await dataSource.transaction(async (manager) => {
          let existing = await manager.findOne(FinalConfigSnEntity, {
            where: { serial_number: sn, item_code: itemCode },
          });

          let deviceId: string;
          if (existing) {
            deviceId = existing.id;
            await manager.update(FinalConfigSnEntity, deviceId, {
              so: so !== undefined ? so : existing.so,
              preset_id: dto.preset_id !== undefined ? dto.preset_id : existing.preset_id,
              sku,
              firmware_version: dto.firmware_version !== undefined ? sanitizeFw(dto.firmware_version) : existing.firmware_version,
              short_fw: dto.short_fw !== undefined ? Number(sanitizeFw(dto.short_fw)) : (dto.firmware_version !== undefined ? Number(sanitizeFw(dto.firmware_version)) : existing.short_fw),
              status: computedStatus,
              dev_eui: dto.dev_eui !== undefined ? dto.dev_eui : existing.dev_eui,
              app_key: dto.app_key !== undefined ? dto.app_key : existing.app_key,
              configured_regs_count: configuredCount,
              total_regs_count: validRegDtos.length > 0 ? validRegDtos.length : existing.total_regs_count,
              tested_at: computedStatus !== 'NONE' ? new Date() : existing.tested_at,
              operator: dto.operator || existing.operator || 'admin',
              notes: dto.notes !== undefined ? dto.notes : existing.notes,
              metadata: dto.metadata || existing.metadata || {},
              updated_at: new Date(),
            });
            if (validRegDtos.length > 0) {
              await manager.delete(FinalConfigRegsSnEntity, { config_sn_id: deviceId });
            }
          } else {
            const newDevice = manager.create(FinalConfigSnEntity, {
              serial_number: sn,
              item_code: itemCode,
              so,
              preset_id: dto.preset_id,
              sku,
              firmware_version: dto.firmware_version !== undefined ? sanitizeFw(dto.firmware_version) : (dto.short_fw !== undefined ? sanitizeFw(dto.short_fw) : undefined),
              short_fw: dto.short_fw !== undefined ? Number(sanitizeFw(dto.short_fw)) : (dto.firmware_version !== undefined ? Number(sanitizeFw(dto.firmware_version)) : undefined),
              status: computedStatus,
              dev_eui: dto.dev_eui,
              app_key: dto.app_key,
              configured_regs_count: configuredCount,
              total_regs_count: validRegDtos.length,
              tested_at: computedStatus !== 'NONE' ? new Date() : undefined,
              operator: dto.operator || 'admin',
              notes: dto.notes,
              metadata: dto.metadata || {},
            });
            const savedDevice = await manager.save(FinalConfigSnEntity, newDevice);
            deviceId = savedDevice.id;
          }

          let savedRegisters: FinalConfigRegsSnEntity[] = [];
          if (validRegDtos.length > 0) {
            const entitiesToInsert = validRegDtos.map((r, idx) => {
              return manager.create(FinalConfigRegsSnEntity, {
                config_sn_id: deviceId,
                serial_number: sn,
                item_code: itemCode,
                address: Number(r.address),
                modbus_reg_hex: r.modbus_reg_hex || `0x${Number(r.address).toString(16).toUpperCase().padStart(4, '0')}`,
                slave: r.slave !== undefined ? Number(r.slave) : 1,
                reg_num: r.reg_num !== undefined ? Number(r.reg_num) : 1,
                format: r.format || 'uint',
                parameter_name: r.parameter_name || '',
                value_to_write: r.value_to_write !== undefined ? String(r.value_to_write) : '',
                default_value: r.default_value !== undefined ? String(r.default_value) : '',
                value_read_back: r.value_read_back !== undefined ? String(r.value_read_back) : '',
                status: r.status || 'NONE',
                endianness: r.endianness || 'big-endian',
                fn_read: r.fn_read || '3',
                fn_write: r.fn_write || '16',
                order_no: r.order_no !== undefined ? Number(r.order_no) : idx,
              });
            });
            savedRegisters = await manager.save(FinalConfigRegsSnEntity, entitiesToInsert);
          } else {
            savedRegisters = await manager.find(FinalConfigRegsSnEntity, {
              where: { config_sn_id: deviceId },
              order: { order_no: 'ASC', address: 'ASC' },
            });
          }

          const finalDevice = (await manager.findOne(FinalConfigSnEntity, {
            where: { id: deviceId },
          }))!;
          return { device: finalDevice, registers: savedRegisters };
        });
      } catch (err: any) {
        this.logger.warn(`DB saveOrUpdateDevice failed, falling back to memory: ${err.message}`);
      }
    }

    // In-memory fallback
    const key = this.getCompositeDeviceKey(sn, itemCode);
    const existingId = this.memoryDeviceKeys.get(key);
    let device = existingId ? this.memoryDevices.get(existingId) : undefined;
    const now = new Date();

    if (!device) {
      device = new FinalConfigSnEntity();
      device.id = randomUUID();
      device.created_at = now;
      this.memoryDeviceKeys.set(key, device.id);
    }

    device.serial_number = sn;
    device.item_code = itemCode;
    device.so = so;
    device.preset_id = dto.preset_id;
    device.sku = sku;
    device.firmware_version = dto.firmware_version !== undefined ? sanitizeFw(dto.firmware_version) : (dto.short_fw !== undefined ? sanitizeFw(dto.short_fw) : undefined);
    device.short_fw = dto.short_fw !== undefined ? Number(sanitizeFw(dto.short_fw)) : (dto.firmware_version !== undefined ? Number(sanitizeFw(dto.firmware_version)) : undefined);
    device.status = computedStatus;
    device.dev_eui = dto.dev_eui;
    if (dto.app_key !== undefined) device.app_key = dto.app_key;
    device.configured_regs_count = configuredCount;
    device.total_regs_count = validRegDtos.length > 0 ? validRegDtos.length : device.total_regs_count || 0;
    device.tested_at = computedStatus !== 'NONE' ? now : device.tested_at;
    device.operator = dto.operator || device.operator || 'admin';
    device.notes = dto.notes;
    device.metadata = dto.metadata || {};
    device.updated_at = now;

    this.memoryDevices.set(device.id, device);

    let regs: FinalConfigRegsSnEntity[] = [];
    if (validRegDtos.length > 0) {
      regs = validRegDtos.map((r, idx) => {
        const item = new FinalConfigRegsSnEntity();
        item.id = randomUUID();
        item.config_sn_id = device!.id;
        item.serial_number = sn;
        item.item_code = itemCode;
        item.address = Number(r.address);
        item.modbus_reg_hex = r.modbus_reg_hex || `0x${Number(r.address).toString(16).toUpperCase().padStart(4, '0')}`;
        item.slave = r.slave !== undefined ? Number(r.slave) : 1;
        item.reg_num = r.reg_num !== undefined ? Number(r.reg_num) : 1;
        item.format = r.format || 'uint';
        item.parameter_name = r.parameter_name || '';
        item.value_to_write = r.value_to_write !== undefined ? String(r.value_to_write) : '';
        item.default_value = r.default_value !== undefined ? String(r.default_value) : '';
        item.value_read_back = r.value_read_back !== undefined ? String(r.value_read_back) : '';
        item.status = r.status || 'NONE';
        item.endianness = r.endianness || 'big-endian';
        item.fn_read = r.fn_read || '3';
        item.fn_write = r.fn_write || '16';
        item.order_no = r.order_no !== undefined ? Number(r.order_no) : idx;
        item.created_at = now;
        item.updated_at = now;
        return item;
      });
      this.memoryDeviceRegs.set(device.id, regs);
    } else {
      regs = this.memoryDeviceRegs.get(device.id) || [];
    }

    return { device, registers: regs };
  }

  public async syncFromPreset(dto: SyncFromPresetDto): Promise<{
    success: boolean;
    createdCount: number;
    updatedCount: number;
    message?: string;
  }> {
    const so = dto.so.trim();
    const itemCode = dto.item_code.trim();

    const presetData = await this.findPresetBySoAndItemCode(so, itemCode);
    if (!presetData) {
      return {
        success: false,
        createdCount: 0,
        updatedCount: 0,
        message: `Final config preset not found for SO [${so}] and Item Code [${itemCode}]`,
      };
    }

    const { preset, registers } = presetData;
    const validRegs = (registers || []).filter(
      (r) => r.address !== undefined && r.address !== null && !isNaN(Number(r.address)) && Number(r.address) >= 0,
    );

    let createdCount = 0;
    let updatedCount = 0;

    for (const rawSn of dto.serial_numbers) {
      const sn = rawSn.trim();
      if (!sn) continue;

      const existingRecord = await this.findDeviceBySerialNumber(sn, itemCode);
      const regPayload = validRegs.map((vr) => ({
        address: Number(vr.address),
        modbus_reg_hex: vr.modbus_reg_hex,
        slave: Number(vr.slave || 1),
        reg_num: Number(vr.reg_num || 1),
        format: vr.format || 'uint',
        parameter_name: vr.parameter_name || '',
        value_to_write: vr.value_to_write || '',
        default_value: (vr as any).default_value || vr.value_on_memmap || '',
        value_read_back: '',
        status: FinalConfigStatus.NONE,
        endianness: vr.endianness || 'big-endian',
        fn_read: vr.fn_read || '3',
        fn_write: vr.fn_write || '16',
        order_no: vr.order_no || 0,
      }));

      await this.saveOrUpdateDevice({
        serial_number: sn,
        item_code: itemCode,
        so: preset.so,
        preset_id: preset.id,
        sku: preset.sku,
        firmware_version: sanitizeFw(preset.firmware_version || String(preset.short_fw || 1)),
        short_fw: preset.short_fw ? Number(sanitizeFw(preset.short_fw)) : Number(sanitizeFw(preset.firmware_version || '1')),
        status: FinalConfigStatus.NONE,
        operator: dto.operator || 'admin',
        registers: regPayload,
      });

      if (existingRecord) {
        updatedCount++;
      } else {
        createdCount++;
      }
    }

    return { success: true, createdCount, updatedCount };
  }

  public async updateDeviceStatus(
    id: string,
    dto: UpdateDeviceStatusDto,
  ): Promise<{ device: FinalConfigSnEntity; registers: FinalConfigRegsSnEntity[] } | null> {
    const snRepo = this.getSnRepo();
    const regRepo = this.getSnRegRepo();

    if (snRepo && regRepo) {
      try {
        const device = await snRepo.findOne({ where: { id } });
        if (!device) return null;

        device.status = dto.status;
        if (dto.notes !== undefined) device.notes = dto.notes;
        if (dto.operator) device.operator = dto.operator;
        device.tested_at = new Date();
        device.updated_at = new Date();

        if (dto.registers && dto.registers.length > 0) {
          for (const regUpdate of dto.registers) {
            if (
              regUpdate.address !== undefined &&
              regUpdate.address !== null &&
              !isNaN(Number(regUpdate.address)) &&
              Number(regUpdate.address) >= 0
            ) {
              const targetAddress = Number(regUpdate.address);
              const reg = await regRepo.findOne({
                where: { config_sn_id: id, address: targetAddress },
              });
              if (reg) {
                if (regUpdate.status) reg.status = regUpdate.status;
                if (regUpdate.value_read_back !== undefined) reg.value_read_back = regUpdate.value_read_back;
                reg.updated_at = new Date();
                await regRepo.save(reg);
              }
            }
          }

          const allRegs = await regRepo.find({ where: { config_sn_id: id } });
          device.configured_regs_count = allRegs.filter(
            (r) => (r.value_read_back && r.value_read_back.trim() !== '') || r.status !== 'NONE',
          ).length;
        }

        const savedDevice = await snRepo.save(device);
        const registers = await regRepo.find({
          where: { config_sn_id: id },
          order: { order_no: 'ASC', address: 'ASC' },
        });
        return { device: savedDevice, registers };
      } catch (err: any) {
        this.logger.warn(`DB updateDeviceStatus failed, trying memory: ${err.message}`);
      }
    }

    const device = this.memoryDevices.get(id);
    if (!device) return null;

    device.status = dto.status;
    if (dto.notes !== undefined) device.notes = dto.notes;
    if (dto.operator) device.operator = dto.operator;
    device.tested_at = new Date();
    device.updated_at = new Date();

    const regs = this.memoryDeviceRegs.get(id) || [];
    if (dto.registers && dto.registers.length > 0) {
      for (const regUpdate of dto.registers) {
        if (
          regUpdate.address !== undefined &&
          regUpdate.address !== null &&
          !isNaN(Number(regUpdate.address)) &&
          Number(regUpdate.address) >= 0
        ) {
          const targetAddress = Number(regUpdate.address);
          const r = regs.find((reg) => reg.address === targetAddress);
          if (r) {
            if (regUpdate.status) r.status = regUpdate.status;
            if (regUpdate.value_read_back !== undefined) r.value_read_back = regUpdate.value_read_back;
            r.updated_at = new Date();
          }
        }
      }
      device.configured_regs_count = regs.filter(
        (r) => (r.value_read_back && r.value_read_back.trim() !== '') || r.status !== 'NONE',
      ).length;
    }

    return { device, registers: regs };
  }

  public async getStats(): Promise<{
    presetsCount: number;
    devicesCount: number;
    passCount: number;
    failCount: number;
    noneCount: number;
  }> {
    const presetRepo = this.getPresetRepo();
    const snRepo = this.getSnRepo();

    let presetsCount = 0;
    let devicesCount = 0;
    let passCount = 0;
    let failCount = 0;
    let noneCount = 0;

    if (presetRepo) {
      try {
        presetsCount = await presetRepo.count();
      } catch {
        presetsCount = this.memoryPresets.size;
      }
    } else {
      presetsCount = this.memoryPresets.size;
    }

    if (snRepo) {
      try {
        const kpiRaw = await snRepo
          .createQueryBuilder('d')
          .select('COUNT(*)', 'total')
          .addSelect("COUNT(CASE WHEN d.status = 'PASS' THEN 1 END)", 'pass')
          .addSelect("COUNT(CASE WHEN d.status = 'FAIL' THEN 1 END)", 'fail')
          .addSelect("COUNT(CASE WHEN d.status = 'NONE' THEN 1 END)", 'none')
          .getRawOne();

        devicesCount = parseInt(kpiRaw?.total || '0', 10);
        passCount = parseInt(kpiRaw?.pass || '0', 10);
        failCount = parseInt(kpiRaw?.fail || '0', 10);
        noneCount = parseInt(kpiRaw?.none || '0', 10);
      } catch {
        const all = Array.from(this.memoryDevices.values());
        devicesCount = all.length;
        passCount = all.filter((d) => d.status === 'PASS').length;
        failCount = all.filter((d) => d.status === 'FAIL').length;
        noneCount = all.filter((d) => d.status === 'NONE').length;
      }
    } else {
      const all = Array.from(this.memoryDevices.values());
      devicesCount = all.length;
      passCount = all.filter((d) => d.status === 'PASS').length;
      failCount = all.filter((d) => d.status === 'FAIL').length;
      noneCount = all.filter((d) => d.status === 'NONE').length;
    }

    return { presetsCount, devicesCount, passCount, failCount, noneCount };
  }
}
