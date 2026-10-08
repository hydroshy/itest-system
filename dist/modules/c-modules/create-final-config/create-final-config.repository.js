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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CreateFinalConfigRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFinalConfigRepository = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const final_config_preset_entity_1 = require("./entities/final-config-preset.entity");
const final_config_reg_entity_1 = require("./entities/final-config-reg.entity");
let CreateFinalConfigRepository = CreateFinalConfigRepository_1 = class CreateFinalConfigRepository {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(CreateFinalConfigRepository_1.name);
        this.memoryPresets = new Map();
        this.memoryRegs = new Map();
    }
    getPresetRepo() {
        if (!this.dbService)
            return null;
        try {
            return this.dbService.getRepositoryForTable('final_config_presets', final_config_preset_entity_1.FinalConfigPresetEntity);
        }
        catch {
            return null;
        }
    }
    getRegRepo() {
        if (!this.dbService)
            return null;
        try {
            return this.dbService.getRepositoryForTable('final_config_regs', final_config_reg_entity_1.FinalConfigRegEntity);
        }
        catch {
            return null;
        }
    }
    getCompositeKey(so, itemCode) {
        return `${so.trim().toUpperCase()}_${itemCode.trim().toUpperCase()}`;
    }
    async saveOrUpdate(dto) {
        const so = dto.so.trim();
        const itemCode = dto.item_code.trim();
        const compositeKey = this.getCompositeKey(so, itemCode);
        const validRegDtos = (dto.registers || []).filter((r) => Number(r.address) >= 303);
        const presetRepo = this.getPresetRepo();
        const regRepo = this.getRegRepo();
        if (presetRepo && regRepo) {
            try {
                const dataSource = presetRepo.manager.connection;
                return await dataSource.transaction(async (manager) => {
                    let existing = await manager.findOne(final_config_preset_entity_1.FinalConfigPresetEntity, {
                        where: { so, item_code: itemCode },
                    });
                    let presetId;
                    if (existing) {
                        presetId = existing.id;
                        await manager.update(final_config_preset_entity_1.FinalConfigPresetEntity, presetId, {
                            sku: dto.sku.trim(),
                            firmware_version: dto.firmware_version.trim(),
                            short_fw: Number(dto.short_fw),
                            name: dto.name.trim(),
                            description: dto.description || undefined,
                            total_regs: validRegDtos.length,
                            created_by: dto.created_by || 'admin',
                            updated_at: new Date(),
                        });
                        await manager.delete(final_config_reg_entity_1.FinalConfigRegEntity, { preset_id: presetId });
                    }
                    else {
                        const newPreset = manager.create(final_config_preset_entity_1.FinalConfigPresetEntity, {
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
                        const savedPreset = await manager.save(final_config_preset_entity_1.FinalConfigPresetEntity, newPreset);
                        presetId = savedPreset.id;
                    }
                    const entitiesToInsert = validRegDtos.map((r, idx) => {
                        return manager.create(final_config_reg_entity_1.FinalConfigRegEntity, {
                            preset_id: presetId,
                            address: Number(r.address),
                            modbus_reg_hex: r.modbus_reg_hex,
                            slave: r.slave !== undefined ? Number(r.slave) : 1,
                            reg_num: r.reg_num !== undefined ? Number(r.reg_num) : 1,
                            format: r.format || 'uint',
                            parameter_name: r.parameter_name || '',
                            value_to_write: String(r.value_to_write ?? ''),
                            value_on_memmap: r.value_on_memmap || undefined,
                            default_value: r.default_value !== undefined ? String(r.default_value) : (r.value_on_memmap || ''),
                            endianness: r.endianness || 'big-endian',
                            fn_read: r.fn_read || '3',
                            fn_write: r.fn_write || '16',
                            order_no: r.order_no !== undefined ? Number(r.order_no) : idx,
                            checked: r.checked !== undefined ? !!r.checked : true,
                        });
                    });
                    let savedRegs = [];
                    if (entitiesToInsert.length > 0) {
                        savedRegs = await manager.save(final_config_reg_entity_1.FinalConfigRegEntity, entitiesToInsert);
                    }
                    const finalPreset = await manager.findOneOrFail(final_config_preset_entity_1.FinalConfigPresetEntity, {
                        where: { id: presetId },
                    });
                    this.memoryPresets.set(compositeKey, finalPreset);
                    this.memoryRegs.set(presetId, savedRegs);
                    return { preset: finalPreset, registers: savedRegs };
                });
            }
            catch (err) {
                this.logger.warn(`Database transaction failed for Final Config (${so}, ${itemCode}): ${err.message}. Fallback to memory.`);
            }
        }
        let existingPreset = this.memoryPresets.get(compositeKey);
        let presetId = existingPreset?.id || 'fc_preset_' + Date.now().toString(36);
        const presetEntity = {
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
        const regs = validRegDtos.map((r, idx) => ({
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
            default_value: r.default_value !== undefined ? String(r.default_value) : (r.value_on_memmap || ''),
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
    async findBySoAndItemCode(so, itemCode) {
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
            }
            catch (err) {
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
    async findAllPresets() {
        const presetRepo = this.getPresetRepo();
        if (presetRepo) {
            try {
                return await presetRepo.find({ order: { updated_at: 'DESC' } });
            }
            catch (err) {
                this.logger.warn(`Database lookup all Final Config presets failed: ${err.message}`);
            }
        }
        return Array.from(this.memoryPresets.values()).sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
    }
    async deletePreset(id) {
        const presetRepo = this.getPresetRepo();
        const regRepo = this.getRegRepo();
        if (presetRepo) {
            try {
                const existing = await presetRepo.findOne({ where: { id } });
                if (!existing)
                    return false;
                if (regRepo) {
                    await regRepo.delete({ preset_id: id });
                }
                await presetRepo.delete(id);
                return true;
            }
            catch (err) {
                this.logger.warn(`Database delete preset failed: ${err.message}`);
            }
        }
        for (const [key, preset] of this.memoryPresets.entries()) {
            if (preset.id === id) {
                this.memoryPresets.delete(key);
                this.memoryRegs.delete(id);
                return true;
            }
        }
        return false;
    }
};
exports.CreateFinalConfigRepository = CreateFinalConfigRepository;
exports.CreateFinalConfigRepository = CreateFinalConfigRepository = CreateFinalConfigRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], CreateFinalConfigRepository);
//# sourceMappingURL=create-final-config.repository.js.map