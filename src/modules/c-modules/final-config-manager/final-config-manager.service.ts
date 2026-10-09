import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { FinalConfigManagerRepository } from './final-config-manager.repository';
import {
  QueryPresetsDto,
  QueryDevicesDto,
  SaveDeviceFinalConfigDto,
  SyncFromPresetDto,
  UpdateDeviceStatusDto,
} from './dto/final-config-manager.dto';

@Injectable()
export class FinalConfigManagerService {
  private readonly logger = new Logger(FinalConfigManagerService.name);

  constructor(private readonly repository: FinalConfigManagerRepository) {}

  public async getPresets(query?: QueryPresetsDto) {
    const { data, total } = await this.repository.findAllPresets(query);
    return {
      success: true,
      data,
      total,
    };
  }

  public async getPresetBySoItem(so: string, itemCode: string) {
    if (!so || !so.trim() || !itemCode || !itemCode.trim()) {
      throw new BadRequestException('so and item_code query parameters are required');
    }

    const result = await this.repository.findPresetBySoAndItemCode(so.trim(), itemCode.trim());
    if (!result) {
      return {
        success: false,
        message: `Preset not found for Sales Order [${so}] and Item Code [${itemCode}]`,
        data: null,
      };
    }

    return {
      success: true,
      data: result,
    };
  }

  public async getPresetById(id: string) {
    if (!id || !id.trim()) {
      throw new BadRequestException('Preset id is required');
    }

    const result = await this.repository.findPresetById(id.trim());
    if (!result) {
      throw new NotFoundException(`Final config preset not found for ID [${id}]`);
    }

    return {
      success: true,
      data: result,
    };
  }

  public async deletePreset(id: string): Promise<{ success: boolean; message: string; id: string }> {
    if (!id || !id.trim()) {
      throw new BadRequestException('Preset id is required');
    }
    return await this.repository.deletePreset(id.trim());
  }

  public async getDevices(query?: QueryDevicesDto) {
    const { data, total, kpis } = await this.repository.findDevices(query);
    return {
      success: true,
      data,
      total,
      kpis,
    };
  }

  public async getDeviceBySerialNumber(serialNumber: string, itemCode?: string) {
    if (!serialNumber || !serialNumber.trim()) {
      throw new BadRequestException('serialNumber parameter is required');
    }

    const result = await this.repository.findDeviceBySerialNumber(
      serialNumber.trim(),
      itemCode ? itemCode.trim() : undefined,
    );

    if (!result) {
      throw new NotFoundException(
        `Device Final Config record not found for Serial Number [${serialNumber}]${
          itemCode ? ` and Item Code [${itemCode}]` : ''
        }`,
      );
    }

    return {
      success: true,
      data: result,
    };
  }

  public async checkDevicePassed(serialNumber?: string, devEui?: string) {
    const sn = serialNumber ? serialNumber.trim() : undefined;
    const eui = devEui ? devEui.trim() : undefined;

    if (!sn && !eui) {
      return {
        success: true,
        passed: false,
        data: null,
        message: 'Missing device identifiers',
      };
    }

    const record = await this.repository.findPassedRecord(sn, eui);
    if (record && record.status === 'PASS') {
      return {
        success: true,
        passed: true,
        data: {
          id: record.id,
          serial_number: record.serial_number,
          dev_eui: record.dev_eui,
          item_code: record.item_code,
          so: record.so,
          status: record.status,
          tested_at: record.tested_at,
        },
        message: 'Device has already passed Final Configuration!',
      };
    }

    return {
      success: true,
      passed: false,
      data: null,
      message: 'Device has not passed Final Configuration',
    };
  }

  public async getDeviceById(id: string) {
    if (!id || !id.trim()) {
      throw new BadRequestException('Device id is required');
    }

    const result = await this.repository.findDeviceById(id.trim());
    if (!result) {
      throw new NotFoundException(`Device Final Config record not found for ID [${id}]`);
    }

    return {
      success: true,
      data: result,
    };
  }

  public async saveDevice(dto: SaveDeviceFinalConfigDto, operator: string = 'admin') {
    if (!dto.serial_number || !dto.serial_number.trim()) {
      throw new BadRequestException('Serial Number (serial_number) is required');
    }
    if (!dto.item_code || !dto.item_code.trim()) {
      throw new BadRequestException('Item Code (item_code) is required');
    }
    if (!dto.sku || !dto.sku.trim()) {
      throw new BadRequestException('Hardware SKU (sku) is required');
    }

    const payload: SaveDeviceFinalConfigDto = {
      ...dto,
      serial_number: dto.serial_number.trim(),
      item_code: dto.item_code.trim(),
      sku: dto.sku.trim().toUpperCase(),
      operator: dto.operator || operator || 'admin',
    };

    const result = await this.repository.saveOrUpdateDevice(payload);

    this.logger.log(
      `Saved Device Final Config: SN [${result.device.serial_number}] Item [${result.device.item_code}] Status [${result.device.status}] Regs [${result.registers.length}]`,
    );

    return {
      success: true,
      message: 'Device Final Config record saved successfully',
      data: result.device,
      registers: result.registers,
    };
  }

  public async syncFromPreset(dto: SyncFromPresetDto, operator: string = 'admin') {
    if (!dto.so || !dto.so.trim()) {
      throw new BadRequestException('Sales Order (so) is required');
    }
    if (!dto.item_code || !dto.item_code.trim()) {
      throw new BadRequestException('Item Code (item_code) is required');
    }
    if (!dto.serial_numbers || !Array.isArray(dto.serial_numbers) || dto.serial_numbers.length === 0) {
      throw new BadRequestException('serial_numbers list must be a non-empty array of strings');
    }

    const cleanSns = dto.serial_numbers
      .map((s) => (s ? String(s).trim() : ''))
      .filter((s) => s.length > 0);

    if (cleanSns.length === 0) {
      throw new BadRequestException('No valid non-empty serial numbers provided');
    }

    const result = await this.repository.syncFromPreset({
      ...dto,
      so: dto.so.trim(),
      item_code: dto.item_code.trim(),
      serial_numbers: cleanSns,
      operator: dto.operator || operator || 'admin',
    });

    if (!result.success) {
      throw new BadRequestException(result.message || 'Failed to sync devices from preset');
    }

    this.logger.log(
      `Synced ${result.createdCount} new and ${result.updatedCount} existing devices for SO [${dto.so}] Item [${dto.item_code}]`,
    );

    return {
      success: true,
      createdCount: result.createdCount,
      updatedCount: result.updatedCount,
      totalProcessed: cleanSns.length,
    };
  }

  public async updateDeviceStatus(id: string, dto: UpdateDeviceStatusDto, operator: string = 'admin') {
    if (!id || !id.trim()) {
      throw new BadRequestException('Device id is required');
    }
    if (!dto.status) {
      throw new BadRequestException('status (PASS, FAIL, NONE) is required');
    }

    const result = await this.repository.updateDeviceStatus(id.trim(), {
      ...dto,
      operator: dto.operator || operator || 'admin',
    });

    if (!result) {
      throw new NotFoundException(`Device Final Config record not found for ID [${id}]`);
    }

    return {
      success: true,
      message: 'Device status updated successfully',
      data: result.device,
      registers: result.registers,
    };
  }

  public async getStats() {
    const stats = await this.repository.getStats();
    return {
      success: true,
      data: stats,
    };
  }
}
