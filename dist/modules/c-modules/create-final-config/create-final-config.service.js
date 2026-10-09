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
var CreateFinalConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFinalConfigService = void 0;
const common_1 = require("@nestjs/common");
const create_final_config_repository_1 = require("./create-final-config.repository");
const final_config_utils_1 = require("../final-config-manager/final-config-utils");
let CreateFinalConfigService = CreateFinalConfigService_1 = class CreateFinalConfigService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new common_1.Logger(CreateFinalConfigService_1.name);
    }
    async saveFinalConfig(dto, author = 'admin') {
        if (!dto.so || !dto.so.trim()) {
            throw new common_1.BadRequestException('Sales Order (SO) is required');
        }
        if (!dto.item_code || !dto.item_code.trim()) {
            throw new common_1.BadRequestException('Item Code is required');
        }
        if (!dto.sku || !dto.sku.trim()) {
            throw new common_1.BadRequestException('Hardware SKU is required');
        }
        if (dto.short_fw === undefined || dto.short_fw === null || isNaN(Number(dto.short_fw))) {
            throw new common_1.BadRequestException('Short FW Version must be an integer');
        }
        const validRegs = (dto.registers || []).filter((r) => Number(r.address) >= 303);
        if (validRegs.length === 0) {
            throw new common_1.BadRequestException('Final Config requires at least one register with Dec Reg >= 303');
        }
        const rawLongFw = (dto.firmware_version || '').trim();
        const shortFwNum = Number(dto.short_fw);
        const longFwToSave = /[fF]/.test(rawLongFw)
            ? rawLongFw
            : (0, final_config_utils_1.sanitizeFw)(rawLongFw || String(shortFwNum));
        const payloadToSave = {
            ...dto,
            so: dto.so.trim(),
            item_code: dto.item_code.trim(),
            sku: dto.sku.trim().toUpperCase(),
            firmware_version: longFwToSave,
            short_fw: shortFwNum,
            name: dto.name ? dto.name.trim() : `[Final Config] ${dto.so.trim()} - ${dto.item_code.trim()}`,
            created_by: author || dto.created_by || 'admin',
            registers: validRegs,
        };
        const result = await this.repository.saveOrUpdate(payloadToSave);
        this.logger.log(`Saved Final Config Preset for SO [${dto.so}] Item [${dto.item_code}] SKU [${dto.sku}] Long FW [${longFwToSave}] Short FW [${shortFwNum}]: ${result.registers.length} regs`);
        return {
            success: true,
            message: 'Final Config saved successfully',
            data: result,
        };
    }
    async getFinalConfig(so, itemCode) {
        return await this.repository.findBySoAndItemCode(so, itemCode);
    }
    async listFinalConfigs() {
        return await this.repository.findAllPresets();
    }
};
exports.CreateFinalConfigService = CreateFinalConfigService;
exports.CreateFinalConfigService = CreateFinalConfigService = CreateFinalConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [create_final_config_repository_1.CreateFinalConfigRepository])
], CreateFinalConfigService);
//# sourceMappingURL=create-final-config.service.js.map