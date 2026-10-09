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
var FinalConfigManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalConfigManagerService = void 0;
const common_1 = require("@nestjs/common");
const final_config_manager_repository_1 = require("./final-config-manager.repository");
const final_config_utils_1 = require("./final-config-utils");
let FinalConfigManagerService = FinalConfigManagerService_1 = class FinalConfigManagerService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new common_1.Logger(FinalConfigManagerService_1.name);
    }
    async getPresets(query) {
        const { data, total } = await this.repository.findAllPresets(query);
        return {
            success: true,
            data,
            total,
        };
    }
    async getPresetBySoItem(so, itemCode) {
        if (!so || !so.trim() || !itemCode || !itemCode.trim()) {
            throw new common_1.BadRequestException('so and item_code query parameters are required');
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
    async getPresetById(id) {
        if (!id || !id.trim()) {
            throw new common_1.BadRequestException('Preset id is required');
        }
        const result = await this.repository.findPresetById(id.trim());
        if (!result) {
            throw new common_1.NotFoundException(`Final config preset not found for ID [${id}]`);
        }
        return {
            success: true,
            data: result,
        };
    }
    async deletePreset(id) {
        if (!id || !id.trim()) {
            throw new common_1.BadRequestException('Preset id is required');
        }
        return await this.repository.deletePreset(id.trim());
    }
    async getDevices(query) {
        const { data, total, kpis } = await this.repository.findDevices(query);
        return {
            success: true,
            data,
            total,
            kpis,
        };
    }
    async getDeviceBySerialNumber(serialNumber, itemCode) {
        if (!serialNumber || !serialNumber.trim()) {
            throw new common_1.BadRequestException('serialNumber parameter is required');
        }
        const result = await this.repository.findDeviceBySerialNumber(serialNumber.trim(), itemCode ? itemCode.trim() : undefined);
        if (!result) {
            throw new common_1.NotFoundException(`Device Final Config record not found for Serial Number [${serialNumber}]${itemCode ? ` and Item Code [${itemCode}]` : ''}`);
        }
        return {
            success: true,
            data: result,
        };
    }
    async checkDevicePassed(serialNumber, devEui) {
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
    async getDeviceById(id) {
        if (!id || !id.trim()) {
            throw new common_1.BadRequestException('Device id is required');
        }
        const result = await this.repository.findDeviceById(id.trim());
        if (!result) {
            throw new common_1.NotFoundException(`Device Final Config record not found for ID [${id}]`);
        }
        return {
            success: true,
            data: result,
        };
    }
    async saveDevice(dto, operator = 'admin') {
        if (!dto.serial_number || !dto.serial_number.trim()) {
            throw new common_1.BadRequestException('Serial Number (serial_number) is required');
        }
        if (!dto.item_code || !dto.item_code.trim()) {
            throw new common_1.BadRequestException('Item Code (item_code) is required');
        }
        if (!dto.sku || !dto.sku.trim()) {
            throw new common_1.BadRequestException('Hardware SKU (sku) is required');
        }
        const cleanFw = dto.firmware_version !== undefined
            ? (0, final_config_utils_1.sanitizeFw)(dto.firmware_version)
            : (dto.short_fw !== undefined ? (0, final_config_utils_1.sanitizeFw)(dto.short_fw) : undefined);
        const cleanShortFw = dto.short_fw !== undefined
            ? Number((0, final_config_utils_1.sanitizeFw)(dto.short_fw))
            : (dto.firmware_version !== undefined ? Number((0, final_config_utils_1.sanitizeFw)(dto.firmware_version)) : undefined);
        const payload = {
            ...dto,
            serial_number: dto.serial_number.trim(),
            item_code: dto.item_code.trim(),
            sku: dto.sku.trim().toUpperCase(),
            firmware_version: cleanFw,
            short_fw: cleanShortFw,
            operator: dto.operator || operator || 'admin',
        };
        const result = await this.repository.saveOrUpdateDevice(payload);
        this.logger.log(`Saved Device Final Config: SN [${result.device.serial_number}] Item [${result.device.item_code}] Status [${result.device.status}] Regs [${result.registers.length}]`);
        return {
            success: true,
            message: 'Device Final Config record saved successfully',
            data: result.device,
            registers: result.registers,
        };
    }
    async syncFromPreset(dto, operator = 'admin') {
        if (!dto.so || !dto.so.trim()) {
            throw new common_1.BadRequestException('Sales Order (so) is required');
        }
        if (!dto.item_code || !dto.item_code.trim()) {
            throw new common_1.BadRequestException('Item Code (item_code) is required');
        }
        if (!dto.serial_numbers || !Array.isArray(dto.serial_numbers) || dto.serial_numbers.length === 0) {
            throw new common_1.BadRequestException('serial_numbers list must be a non-empty array of strings');
        }
        const cleanSns = dto.serial_numbers
            .map((s) => (s ? String(s).trim() : ''))
            .filter((s) => s.length > 0);
        if (cleanSns.length === 0) {
            throw new common_1.BadRequestException('No valid non-empty serial numbers provided');
        }
        const result = await this.repository.syncFromPreset({
            ...dto,
            so: dto.so.trim(),
            item_code: dto.item_code.trim(),
            serial_numbers: cleanSns,
            operator: dto.operator || operator || 'admin',
        });
        if (!result.success) {
            throw new common_1.BadRequestException(result.message || 'Failed to sync devices from preset');
        }
        this.logger.log(`Synced ${result.createdCount} new and ${result.updatedCount} existing devices for SO [${dto.so}] Item [${dto.item_code}]`);
        return {
            success: true,
            createdCount: result.createdCount,
            updatedCount: result.updatedCount,
            totalProcessed: cleanSns.length,
        };
    }
    async updateDeviceStatus(id, dto, operator = 'admin') {
        if (!id || !id.trim()) {
            throw new common_1.BadRequestException('Device id is required');
        }
        if (!dto.status) {
            throw new common_1.BadRequestException('status (PASS, FAIL, NONE) is required');
        }
        const result = await this.repository.updateDeviceStatus(id.trim(), {
            ...dto,
            operator: dto.operator || operator || 'admin',
        });
        if (!result) {
            throw new common_1.NotFoundException(`Device Final Config record not found for ID [${id}]`);
        }
        return {
            success: true,
            message: 'Device status updated successfully',
            data: result.device,
            registers: result.registers,
        };
    }
    async getStats() {
        const stats = await this.repository.getStats();
        return {
            success: true,
            data: stats,
        };
    }
};
exports.FinalConfigManagerService = FinalConfigManagerService;
exports.FinalConfigManagerService = FinalConfigManagerService = FinalConfigManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [final_config_manager_repository_1.FinalConfigManagerRepository])
], FinalConfigManagerService);
//# sourceMappingURL=final-config-manager.service.js.map