import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DeviceTestedRepository } from './device-tested.repository';
import {
  CreateDeviceTestedDto,
  QueryDeviceTestedDto,
  VerifyDeviceTestedDto,
  ImportCsvDto,
} from './dto/device-tested.dto';

@Injectable()
export class DeviceTestedService {
  private readonly logger = new Logger(DeviceTestedService.name);

  constructor(private readonly repository: DeviceTestedRepository) {}

  public async verify(query: VerifyDeviceTestedDto) {
    const { serial_number, device_key, item_code, fw_ver, hw_ver, so } = query;
    if (!serial_number || !serial_number.trim()) {
      throw new BadRequestException('serial_number query parameter is required');
    }

    const sn = serial_number.trim();
    const record = await this.repository.findBySerialNumber(sn, item_code);

    if (!record) {
      return {
        success: false,
        verified: false,
        message: `Device SN [${sn}] not found in QA device_tested table`,
        data: null,
      };
    }

    // 1. Đối soát device_key (DevEUI)
    const queryDevKey = (device_key || '').trim().toUpperCase();
    const recDevKey = String(record.device_key || record.dev_eui || '').trim().toUpperCase();
    if (queryDevKey && recDevKey) {
      if (recDevKey !== queryDevKey) {
        return {
          success: false,
          verified: false,
          message: `Device Key mismatch: HW DevEUI [${device_key}] vs QA [${record.device_key || record.dev_eui}]`,
          data: record,
        };
      }
    }

    // 2. Đối soát item_code
    if (item_code && record.item_code) {
      if (record.item_code.trim().toUpperCase() !== item_code.trim().toUpperCase()) {
        return {
          success: false,
          verified: false,
          message: `Item Code mismatch: HW [${item_code}] vs QA [${record.item_code}]`,
          data: record,
        };
      }
    }

    // 3. Đối soát fw_ver
    const queryFw = (fw_ver || '').trim();
    const recFw = String(record.fw_ver || record.firmware_version || '').trim();
    if (queryFw && recFw) {
      if (recFw !== queryFw) {
        return {
          success: false,
          verified: false,
          message: `Firmware version mismatch: HW [${fw_ver}] vs QA [${record.fw_ver || record.firmware_version}]`,
          data: record,
        };
      }
    }

    // 4. Đối soát bắt buộc auto_check === 'PASS'
    const autoCheck = String(record.auto_check || '').trim().toUpperCase();
    if (autoCheck !== 'PASS') {
      return {
        success: false,
        verified: false,
        message: `QA auto_check status is '${record.auto_check}' (Required 'PASS')`,
        data: record,
      };
    }

    // 5. Đối soát bắt buộc result === 'PASS' hoặc 'PASSED'
    const resultStatus = String(record.result || record.status || '').trim().toUpperCase();
    if (resultStatus !== 'PASS' && resultStatus !== 'PASSED') {
      return {
        success: false,
        verified: false,
        message: `QA test result status is '${record.result || record.status}' (Required 'PASS')`,
        data: record,
      };
    }

    // 6. Đối soát SO nếu có chỉ định
    if (so && (record.so_number || record.so)) {
      const recSo = String(record.so_number || record.so).trim().toUpperCase();
      if (recSo !== so.trim().toUpperCase()) {
        return {
          success: false,
          verified: false,
          message: `Sales Order mismatch: device tested under SO [${record.so_number || record.so}], but selected SO is [${so.trim()}]`,
          data: record,
        };
      }
    }

    return {
      success: true,
      verified: true,
      message: 'Device verified in device_tested: 6-field validation passed (SN, DevEUI, FW, Item Code, auto_check=PASS, result=PASS)',
      data: record,
    };
  }

  public async getTree() {
    const data = await this.repository.getTree();
    return {
      success: true,
      data,
    };
  }

  public async importCsv(dto: ImportCsvDto | string | Record<string, any>) {
    let records: Array<Record<string, any>> = [];

    if (typeof dto === 'string') {
      records = this.repository.parseCsvString(dto);
    } else if (dto?.csv_content) {
      records = this.repository.parseCsvString(dto.csv_content);
    } else if (Array.isArray(dto?.records)) {
      records = dto.records;
    } else if (Array.isArray(dto)) {
      records = dto;
    }

    if (!records.length) {
      throw new BadRequestException('No CSV content or parsed records provided');
    }

    const result = await this.repository.bulkImportCsv(records);
    return {
      success: true,
      message: `CSV import completed: ${result.imported} created, ${result.updated} updated (${result.total} total rows processed)`,
      data: result,
    };
  }

  public async updateAppKey(serialNumber: string, appKey: string) {
    if (!serialNumber || !serialNumber.trim()) {
      throw new BadRequestException('serialNumber is required');
    }
    if (!appKey || !appKey.trim()) {
      throw new BadRequestException('app_key is required');
    }

    const updated = await this.repository.updateAppKey(serialNumber, appKey);
    if (!updated) {
      return {
        success: false,
        message: `Device SN [${serialNumber}] not found to update AppKey`,
        data: null,
      };
    }
    return {
      success: true,
      message: `AppKey updated for Device SN [${serialNumber}]`,
      data: updated,
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
    const soVal = dto.so_number || dto.so;
    if (!soVal || !soVal.trim()) {
      throw new BadRequestException('so or so_number is required');
    }
    const saved = await this.repository.saveOrUpdate(dto);
    return {
      success: true,
      message: `Device test record saved for SN [${dto.serial_number}]`,
      data: saved,
    };
  }
}
