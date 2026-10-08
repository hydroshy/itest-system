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
var FinalConfigManagerRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalConfigManagerRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const final_config_sn_entity_1 = require("./entities/final-config-sn.entity");
const final_config_regs_sn_entity_1 = require("./entities/final-config-regs-sn.entity");
const final_config_preset_entity_1 = require("../create-final-config/entities/final-config-preset.entity");
const final_config_reg_entity_1 = require("../create-final-config/entities/final-config-reg.entity");
const create_final_config_repository_1 = require("../create-final-config/create-final-config.repository");
const final_config_manager_dto_1 = require("./dto/final-config-manager.dto");
let FinalConfigManagerRepository = FinalConfigManagerRepository_1 = class FinalConfigManagerRepository {
    constructor(dbService, createPresetRepo) {
        this.dbService = dbService;
        this.createPresetRepo = createPresetRepo;
        this.logger = new common_1.Logger(FinalConfigManagerRepository_1.name);
        this.memoryPresets = new Map();
        this.memoryRegs = new Map();
        this.memoryDevices = new Map();
        this.memoryDeviceKeys = new Map();
        this.memoryDeviceRegs = new Map();
    }
    getSnRepo() {
        if (!this.dbService)
            return null;
        try {
            return this.dbService.getRepositoryForTable('final_config_sn', final_config_sn_entity_1.FinalConfigSnEntity);
        }
        catch {
            return null;
        }
    }
    getSnRegRepo() {
        if (!this.dbService)
            return null;
        try {
            return this.dbService.getRepositoryForTable('final_config_regs_sn', final_config_regs_sn_entity_1.FinalConfigRegsSnEntity);
        }
        catch {
            return null;
        }
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
    getCompositeDeviceKey(serialNumber, itemCode) {
        return `${serialNumber.trim().toUpperCase()}__${itemCode.trim().toUpperCase()}`;
    }
    async findAllPresets(filter) {
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
                    qb.andWhere('(p.so ILIKE :s OR p.item_code ILIKE :s OR p.sku ILIKE :s OR p.name ILIKE :s)', { s });
                }
                qb.orderBy('p.created_at', 'DESC');
                if (filter?.limit)
                    qb.take(filter.limit);
                if (filter?.offset)
                    qb.skip(filter.offset);
                const [data, total] = await qb.getManyAndCount();
                return { data, total };
            }
            catch (err) {
                this.logger.warn(`Database query failed for presets, falling back to memory: ${err.message}`);
            }
        }
        let items = [];
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
            filtered = filtered.filter((p) => (p.so || '').toLowerCase().includes(q) ||
                (p.item_code || '').toLowerCase().includes(q) ||
                (p.sku || '').toLowerCase().includes(q) ||
                (p.name || '').toLowerCase().includes(q));
        }
        const total = filtered.length;
        const offset = filter?.offset || 0;
        const limit = filter?.limit || 100;
        const data = filtered.slice(offset, offset + limit);
        return { data, total };
    }
    async findPresetBySoAndItemCode(so, itemCode) {
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
            }
            catch (err) {
                this.logger.warn(`DB findPresetBySoAndItemCode failed, trying fallback: ${err.message}`);
            }
        }
        if (this.createPresetRepo) {
            const fromCreate = await this.createPresetRepo.findBySoAndItemCode(s, it);
            if (fromCreate)
                return fromCreate;
        }
        for (const p of this.memoryPresets.values()) {
            if (p.so === s && p.item_code === it) {
                const regs = (this.memoryRegs.get(p.id) || []).filter((r) => Number(r.address) >= 303);
                return { preset: p, registers: regs };
            }
        }
        return null;
    }
    async findPresetById(id) {
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
            }
            catch (err) {
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
    async deletePreset(id) {
        const presetRepo = this.getPresetRepo();
        const regRepo = this.getRegRepo();
        if (presetRepo) {
            const existing = await presetRepo.findOne({ where: { id } });
            if (!existing) {
                throw new common_1.NotFoundException(`Preset with ID ${id} not found`);
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
        let found = false;
        if (this.memoryPresets.has(id)) {
            this.memoryPresets.delete(id);
            this.memoryRegs.delete(id);
            found = true;
        }
        if (this.createPresetRepo) {
            const deletedFromCreateRepo = await this.createPresetRepo.deletePreset(id);
            if (deletedFromCreateRepo)
                found = true;
        }
        if (found) {
            this.logger.log(`Deleted Final Config Preset [${id}] from memory cache`);
            return { success: true, message: 'Preset deleted successfully', id };
        }
        throw new common_1.NotFoundException(`Preset with ID ${id} not found`);
    }
    async findDevices(filter) {
        const snRepo = this.getSnRepo();
        if (snRepo) {
            try {
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
                    qb.andWhere('(d.serial_number ILIKE :s OR d.item_code ILIKE :s OR d.so ILIKE :s OR d.sku ILIKE :s OR d.dev_eui ILIKE :s)', { s });
                }
                qb.orderBy('d.created_at', 'DESC');
                if (filter?.limit)
                    qb.take(filter.limit);
                if (filter?.offset)
                    qb.skip(filter.offset);
                const [data, total] = await qb.getManyAndCount();
                return { data, total, kpis };
            }
            catch (err) {
                this.logger.warn(`DB findDevices failed, falling back to memory: ${err.message}`);
            }
        }
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
            filtered = filtered.filter((d) => (d.serial_number || '').toLowerCase().includes(q) ||
                (d.item_code || '').toLowerCase().includes(q) ||
                (d.so || '').toLowerCase().includes(q) ||
                (d.sku || '').toLowerCase().includes(q) ||
                (d.dev_eui || '').toLowerCase().includes(q));
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
    async findDeviceBySerialNumber(serialNumber, itemCode) {
        const sn = serialNumber.trim();
        const snRepo = this.getSnRepo();
        const regRepo = this.getSnRegRepo();
        if (snRepo && regRepo) {
            try {
                const whereClause = { serial_number: sn };
                if (itemCode)
                    whereClause.item_code = itemCode.trim();
                const device = await snRepo.findOne({ where: whereClause });
                if (device) {
                    const registers = await regRepo.find({
                        where: { config_sn_id: device.id },
                        order: { order_no: 'ASC', address: 'ASC' },
                    });
                    return { device, registers };
                }
            }
            catch (err) {
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
    async findDeviceById(id) {
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
            }
            catch (err) {
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
    async saveOrUpdateDevice(dto) {
        const sn = dto.serial_number.trim();
        const itemCode = dto.item_code.trim();
        const so = dto.so ? dto.so.trim() : undefined;
        const sku = dto.sku.trim();
        const validRegDtos = (dto.registers || []).filter((r) => r.address !== undefined && r.address !== null && !isNaN(Number(r.address)) && Number(r.address) >= 0);
        const snRepo = this.getSnRepo();
        const regRepo = this.getSnRegRepo();
        let computedStatus = dto.status || 'NONE';
        if (!dto.status && validRegDtos.length > 0) {
            const hasFail = validRegDtos.some((r) => r.status === final_config_manager_dto_1.FinalConfigStatus.FAIL);
            const allPass = validRegDtos.every((r) => r.status === final_config_manager_dto_1.FinalConfigStatus.PASS);
            if (hasFail) {
                computedStatus = 'FAIL';
            }
            else if (allPass) {
                computedStatus = 'PASS';
            }
            else {
                computedStatus = 'NONE';
            }
        }
        const configuredCount = validRegDtos.filter((r) => (r.value_read_back && r.value_read_back.trim() !== '') || r.status === final_config_manager_dto_1.FinalConfigStatus.PASS || r.status === final_config_manager_dto_1.FinalConfigStatus.FAIL).length;
        if (snRepo && regRepo) {
            try {
                const dataSource = snRepo.manager.connection;
                return await dataSource.transaction(async (manager) => {
                    let existing = await manager.findOne(final_config_sn_entity_1.FinalConfigSnEntity, {
                        where: { serial_number: sn, item_code: itemCode },
                    });
                    let deviceId;
                    if (existing) {
                        deviceId = existing.id;
                        await manager.update(final_config_sn_entity_1.FinalConfigSnEntity, deviceId, {
                            so: so !== undefined ? so : existing.so,
                            preset_id: dto.preset_id !== undefined ? dto.preset_id : existing.preset_id,
                            sku,
                            firmware_version: dto.firmware_version !== undefined ? dto.firmware_version : existing.firmware_version,
                            short_fw: dto.short_fw !== undefined ? Number(dto.short_fw) : existing.short_fw,
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
                            await manager.delete(final_config_regs_sn_entity_1.FinalConfigRegsSnEntity, { config_sn_id: deviceId });
                        }
                    }
                    else {
                        const newDevice = manager.create(final_config_sn_entity_1.FinalConfigSnEntity, {
                            serial_number: sn,
                            item_code: itemCode,
                            so,
                            preset_id: dto.preset_id,
                            sku,
                            firmware_version: dto.firmware_version,
                            short_fw: dto.short_fw ? Number(dto.short_fw) : undefined,
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
                        const savedDevice = await manager.save(final_config_sn_entity_1.FinalConfigSnEntity, newDevice);
                        deviceId = savedDevice.id;
                    }
                    let savedRegisters = [];
                    if (validRegDtos.length > 0) {
                        const entitiesToInsert = validRegDtos.map((r, idx) => {
                            return manager.create(final_config_regs_sn_entity_1.FinalConfigRegsSnEntity, {
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
                        savedRegisters = await manager.save(final_config_regs_sn_entity_1.FinalConfigRegsSnEntity, entitiesToInsert);
                    }
                    else {
                        savedRegisters = await manager.find(final_config_regs_sn_entity_1.FinalConfigRegsSnEntity, {
                            where: { config_sn_id: deviceId },
                            order: { order_no: 'ASC', address: 'ASC' },
                        });
                    }
                    const finalDevice = (await manager.findOne(final_config_sn_entity_1.FinalConfigSnEntity, {
                        where: { id: deviceId },
                    }));
                    return { device: finalDevice, registers: savedRegisters };
                });
            }
            catch (err) {
                this.logger.warn(`DB saveOrUpdateDevice failed, falling back to memory: ${err.message}`);
            }
        }
        const key = this.getCompositeDeviceKey(sn, itemCode);
        const existingId = this.memoryDeviceKeys.get(key);
        let device = existingId ? this.memoryDevices.get(existingId) : undefined;
        const now = new Date();
        if (!device) {
            device = new final_config_sn_entity_1.FinalConfigSnEntity();
            device.id = (0, crypto_1.randomUUID)();
            device.created_at = now;
            this.memoryDeviceKeys.set(key, device.id);
        }
        device.serial_number = sn;
        device.item_code = itemCode;
        device.so = so;
        device.preset_id = dto.preset_id;
        device.sku = sku;
        device.firmware_version = dto.firmware_version;
        device.short_fw = dto.short_fw ? Number(dto.short_fw) : undefined;
        device.status = computedStatus;
        device.dev_eui = dto.dev_eui;
        if (dto.app_key !== undefined)
            device.app_key = dto.app_key;
        device.configured_regs_count = configuredCount;
        device.total_regs_count = validRegDtos.length > 0 ? validRegDtos.length : device.total_regs_count || 0;
        device.tested_at = computedStatus !== 'NONE' ? now : device.tested_at;
        device.operator = dto.operator || device.operator || 'admin';
        device.notes = dto.notes;
        device.metadata = dto.metadata || {};
        device.updated_at = now;
        this.memoryDevices.set(device.id, device);
        let regs = [];
        if (validRegDtos.length > 0) {
            regs = validRegDtos.map((r, idx) => {
                const item = new final_config_regs_sn_entity_1.FinalConfigRegsSnEntity();
                item.id = (0, crypto_1.randomUUID)();
                item.config_sn_id = device.id;
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
        }
        else {
            regs = this.memoryDeviceRegs.get(device.id) || [];
        }
        return { device, registers: regs };
    }
    async syncFromPreset(dto) {
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
        const validRegs = (registers || []).filter((r) => r.address !== undefined && r.address !== null && !isNaN(Number(r.address)) && Number(r.address) >= 0);
        let createdCount = 0;
        let updatedCount = 0;
        for (const rawSn of dto.serial_numbers) {
            const sn = rawSn.trim();
            if (!sn)
                continue;
            const existingRecord = await this.findDeviceBySerialNumber(sn, itemCode);
            const regPayload = validRegs.map((vr) => ({
                address: Number(vr.address),
                modbus_reg_hex: vr.modbus_reg_hex,
                slave: Number(vr.slave || 1),
                reg_num: Number(vr.reg_num || 1),
                format: vr.format || 'uint',
                parameter_name: vr.parameter_name || '',
                value_to_write: vr.value_to_write || '',
                default_value: vr.default_value || vr.value_on_memmap || '',
                value_read_back: '',
                status: final_config_manager_dto_1.FinalConfigStatus.NONE,
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
                firmware_version: preset.firmware_version,
                short_fw: preset.short_fw,
                status: final_config_manager_dto_1.FinalConfigStatus.NONE,
                operator: dto.operator || 'admin',
                registers: regPayload,
            });
            if (existingRecord) {
                updatedCount++;
            }
            else {
                createdCount++;
            }
        }
        return { success: true, createdCount, updatedCount };
    }
    async updateDeviceStatus(id, dto) {
        const snRepo = this.getSnRepo();
        const regRepo = this.getSnRegRepo();
        if (snRepo && regRepo) {
            try {
                const device = await snRepo.findOne({ where: { id } });
                if (!device)
                    return null;
                device.status = dto.status;
                if (dto.notes !== undefined)
                    device.notes = dto.notes;
                if (dto.operator)
                    device.operator = dto.operator;
                device.tested_at = new Date();
                device.updated_at = new Date();
                if (dto.registers && dto.registers.length > 0) {
                    for (const regUpdate of dto.registers) {
                        if (regUpdate.address !== undefined &&
                            regUpdate.address !== null &&
                            !isNaN(Number(regUpdate.address)) &&
                            Number(regUpdate.address) >= 0) {
                            const targetAddress = Number(regUpdate.address);
                            const reg = await regRepo.findOne({
                                where: { config_sn_id: id, address: targetAddress },
                            });
                            if (reg) {
                                if (regUpdate.status)
                                    reg.status = regUpdate.status;
                                if (regUpdate.value_read_back !== undefined)
                                    reg.value_read_back = regUpdate.value_read_back;
                                reg.updated_at = new Date();
                                await regRepo.save(reg);
                            }
                        }
                    }
                    const allRegs = await regRepo.find({ where: { config_sn_id: id } });
                    device.configured_regs_count = allRegs.filter((r) => (r.value_read_back && r.value_read_back.trim() !== '') || r.status !== 'NONE').length;
                }
                const savedDevice = await snRepo.save(device);
                const registers = await regRepo.find({
                    where: { config_sn_id: id },
                    order: { order_no: 'ASC', address: 'ASC' },
                });
                return { device: savedDevice, registers };
            }
            catch (err) {
                this.logger.warn(`DB updateDeviceStatus failed, trying memory: ${err.message}`);
            }
        }
        const device = this.memoryDevices.get(id);
        if (!device)
            return null;
        device.status = dto.status;
        if (dto.notes !== undefined)
            device.notes = dto.notes;
        if (dto.operator)
            device.operator = dto.operator;
        device.tested_at = new Date();
        device.updated_at = new Date();
        const regs = this.memoryDeviceRegs.get(id) || [];
        if (dto.registers && dto.registers.length > 0) {
            for (const regUpdate of dto.registers) {
                if (regUpdate.address !== undefined &&
                    regUpdate.address !== null &&
                    !isNaN(Number(regUpdate.address)) &&
                    Number(regUpdate.address) >= 0) {
                    const targetAddress = Number(regUpdate.address);
                    const r = regs.find((reg) => reg.address === targetAddress);
                    if (r) {
                        if (regUpdate.status)
                            r.status = regUpdate.status;
                        if (regUpdate.value_read_back !== undefined)
                            r.value_read_back = regUpdate.value_read_back;
                        r.updated_at = new Date();
                    }
                }
            }
            device.configured_regs_count = regs.filter((r) => (r.value_read_back && r.value_read_back.trim() !== '') || r.status !== 'NONE').length;
        }
        return { device, registers: regs };
    }
    async getStats() {
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
            }
            catch {
                presetsCount = this.memoryPresets.size;
            }
        }
        else {
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
            }
            catch {
                const all = Array.from(this.memoryDevices.values());
                devicesCount = all.length;
                passCount = all.filter((d) => d.status === 'PASS').length;
                failCount = all.filter((d) => d.status === 'FAIL').length;
                noneCount = all.filter((d) => d.status === 'NONE').length;
            }
        }
        else {
            const all = Array.from(this.memoryDevices.values());
            devicesCount = all.length;
            passCount = all.filter((d) => d.status === 'PASS').length;
            failCount = all.filter((d) => d.status === 'FAIL').length;
            noneCount = all.filter((d) => d.status === 'NONE').length;
        }
        return { presetsCount, devicesCount, passCount, failCount, noneCount };
    }
};
exports.FinalConfigManagerRepository = FinalConfigManagerRepository;
exports.FinalConfigManagerRepository = FinalConfigManagerRepository = FinalConfigManagerRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService,
        create_final_config_repository_1.CreateFinalConfigRepository])
], FinalConfigManagerRepository);
//# sourceMappingURL=final-config-manager.repository.js.map