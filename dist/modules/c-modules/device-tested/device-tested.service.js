"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DeviceTestedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceTestedService = void 0;
const common_1 = require("@nestjs/common");
const device_tested_repository_1 = require("./device-tested.repository");
let DeviceTestedService = DeviceTestedService_1 = class DeviceTestedService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new common_1.Logger(DeviceTestedService_1.name);
    }
    async verify(query) {
        const { serial_number, device_key, item_code, fw_ver, hw_ver, so } = query;
        if (!serial_number || !serial_number.trim()) {
            throw new common_1.BadRequestException('serial_number query parameter is required');
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
        const autoCheck = String(record.auto_check || '').trim().toUpperCase();
        if (autoCheck !== 'PASS') {
            return {
                success: false,
                verified: false,
                message: `QA auto_check status is '${record.auto_check}' (Required 'PASS')`,
                data: record,
            };
        }
        const resultStatus = String(record.result || record.status || '').trim().toUpperCase();
        if (resultStatus !== 'PASS' && resultStatus !== 'PASSED') {
            return {
                success: false,
                verified: false,
                message: `QA test result status is '${record.result || record.status}' (Required 'PASS')`,
                data: record,
            };
        }
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
    async getTree() {
        const data = await this.repository.getTree();
        return {
            success: true,
            data,
        };
    }
    async importCsv(dto) {
        let records = [];
        if (typeof dto === 'string') {
            records = this.repository.parseCsvString(dto);
        }
        else if (dto?.csv_content) {
            records = this.repository.parseCsvString(dto.csv_content);
        }
        else if (Array.isArray(dto?.records)) {
            records = dto.records;
        }
        else if (Array.isArray(dto)) {
            records = dto;
        }
        if (!records.length) {
            throw new common_1.BadRequestException('No CSV content or parsed records provided');
        }
        const result = await this.repository.bulkImportCsv(records);
        return {
            success: true,
            message: `CSV import completed: ${result.imported} created, ${result.updated} updated (${result.total} total rows processed)`,
            data: result,
        };
    }
    async updateAppKey(serialNumber, appKey) {
        if (!serialNumber || !serialNumber.trim()) {
            throw new common_1.BadRequestException('serialNumber is required');
        }
        if (!appKey || !appKey.trim()) {
            throw new common_1.BadRequestException('app_key is required');
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
    async findBySerialNumber(serialNumber, itemCode) {
        if (!serialNumber || !serialNumber.trim()) {
            throw new common_1.BadRequestException('serialNumber parameter is required');
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
    async findAll(query) {
        const { data, total } = await this.repository.findAll(query);
        return {
            success: true,
            data,
            total,
        };
    }
    async create(dto) {
        if (!dto.serial_number || !dto.serial_number.trim()) {
            throw new common_1.BadRequestException('serial_number is required');
        }
        if (!dto.item_code || !dto.item_code.trim()) {
            throw new common_1.BadRequestException('item_code is required');
        }
        const soVal = dto.so_number || dto.so;
        if (!soVal || !soVal.trim()) {
            throw new common_1.BadRequestException('so or so_number is required');
        }
        const saved = await this.repository.saveOrUpdate(dto);
        return {
            success: true,
            message: `Device test record saved for SN [${dto.serial_number}]`,
            data: saved,
        };
    }
};
exports.DeviceTestedService = DeviceTestedService;
exports.DeviceTestedService = DeviceTestedService = DeviceTestedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [device_tested_repository_1.DeviceTestedRepository])
], DeviceTestedService);
//# sourceMappingURL=device-tested.service.js.map