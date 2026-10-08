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
        const { serial_number, item_code, so } = query;
        if (!serial_number || !serial_number.trim()) {
            throw new common_1.BadRequestException('serial_number query parameter is required');
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
        if (!dto.so || !dto.so.trim()) {
            throw new common_1.BadRequestException('so is required');
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