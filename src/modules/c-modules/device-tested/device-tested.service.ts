import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DeviceTestedRepository } from './device-tested.repository';
import { CreateDeviceTestedDto, QueryDeviceTestedDto, VerifyDeviceTestedDto } from './dto/device-tested.dto';

@Injectable()
export class DeviceTestedService {
  private readonly logger = new Logger(DeviceTestedService.name);

  constructor(private readonly repository: DeviceTestedRepository) {}

  public async verify(query: VerifyDeviceTestedDto) {
    const { serial_number, item_code, so } = query;
    if (!serial_number || !serial_number.trim()) {
      throw new BadRequestException('serial_number query parameter is required');
    }

    const sn = serial_number.trim();
    const record = await this.repository.findBySerialNumber(sn, item_code);

    if (!record) {
      return {
        success: false,
        verified: false,
        message: `Device SN [${sn}] not found in device_tested table`,
        data: null,
      };
    }

    const normStatus = String(record.status || '').toUpperCase();
    if (normStatus !== 'PASS' && normStatus !== 'PASSED') {
      return {
        success: false,
        verified: false,
        message: `Device SN [${sn}] QA testing status is '${record.status}' (Must be 'PASS' or 'PASSED' to proceed with Final Config)`,
        data: record,
      };
    }

    if (so && so.trim()) {
      const selectedSo = so.trim().toUpperCase();
      const testedSo = String(record.so || '').trim().toUpperCase();
      if (testedSo !== selectedSo) {
        return {
          success: false,
          verified: false,
          message: `Sales Order mismatch: device tested under SO [${record.so}], but selected SO is [${so.trim()}]`,
          data: record,
        };
      }
    }

    return {
      success: true,
      verified: true,
      message: 'Device verified in device_tested with PASS status and matching SO',
      data: record,
    };
  }

  public async findBySerialNumber(serialNumber: string, itemCode?: string) {
    if (!serialNumber || !serialNumber.trim()) {
      throw new BadRequestException('serialNumber parameter is required');
    }
    const record = await this.repository.findBySerialNumber(serialNumber.trim(), itemCode);
    if (!record) {
      return {
        success: false,
        message: `Device SN [${serialNumber}] not found in device_tested`,
        data: null,
      };
    }
    return {
      success: true,
      data: record,
    };
  }

  public async findAll(query?: QueryDeviceTestedDto) {
    const { data, total } = await this.repository.findAll(query);
    return {
      success: true,
      data,
      total,
    };
  }

  public async create(dto: CreateDeviceTestedDto) {
    if (!dto.serial_number || !dto.serial_number.trim()) {
      throw new BadRequestException('serial_number is required');
    }
    if (!dto.item_code || !dto.item_code.trim()) {
      throw new BadRequestException('item_code is required');
    }
    if (!dto.so || !dto.so.trim()) {
      throw new BadRequestException('so is required');
    }
    const saved = await this.repository.saveOrUpdate(dto);
    return {
      success: true,
      message: `Device test record saved for SN [${dto.serial_number}]`,
      data: saved,
    };
  }
}
