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
var MemmapUploadRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemmapUploadRepository = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const memmap_payload_entity_1 = require("./entities/memmap-payload.entity");
const memmap_reg_entity_1 = require("./entities/memmap-reg.entity");
let MemmapUploadRepository = MemmapUploadRepository_1 = class MemmapUploadRepository {
    get memoryPayloads() {
        return MemmapUploadRepository_1.sharedMemoryPayloads;
    }
    get memoryRegs() {
        return MemmapUploadRepository_1.sharedMemoryRegs;
    }
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(MemmapUploadRepository_1.name);
    }
    getPayloadRepo() {
        if (!this.dbService)
            return null;
        try {
            return this.dbService.getRepositoryForTable('memmap_payload', memmap_payload_entity_1.MemmapPayloadEntity);
        }
        catch {
            return null;
        }
    }
    getRegRepo() {
        if (!this.dbService)
            return null;
        try {
            return this.dbService.getRepositoryForTable('memmap_regs', memmap_reg_entity_1.MemmapRegEntity);
        }
        catch {
            return null;
        }
    }
    getCompositeKey(sku, shortFw) {
        return `${sku.trim().toUpperCase()}_${Number(shortFw)}`;
    }
    async saveOrUpdate(payloadData, registersData) {
        const sku = (payloadData.sku || '').trim().toUpperCase();
        const shortFw = Number(payloadData.short_fw);
        const longFw = payloadData.long_fw !== undefined && payloadData.long_fw !== null && String(payloadData.long_fw).trim() !== ''
            ? String(payloadData.long_fw).trim()
            : String(shortFw);
        const payloadRepo = this.getPayloadRepo();
        const regRepo = this.getRegRepo();
        if (payloadRepo && regRepo) {
            try {
                const dataSource = payloadRepo.manager.connection;
                return await dataSource.transaction(async (manager) => {
                    let existing = await manager.findOne(memmap_payload_entity_1.MemmapPayloadEntity, {
                        where: { sku, short_fw: shortFw },
                    });
                    let payloadId;
                    if (existing) {
                        payloadId = existing.id;
                        await manager.update(memmap_payload_entity_1.MemmapPayloadEntity, payloadId, {
                            long_fw: longFw || existing.long_fw || String(shortFw),
                            file_name: payloadData.file_name,
                            total_regs: payloadData.total_regs,
                            dec_valid: payloadData.dec_valid,
                            hex_valid: payloadData.hex_valid,
                            created_by: payloadData.created_by || existing.created_by,
                            updated_at: new Date(),
                        });
                        await manager.delete(memmap_reg_entity_1.MemmapRegEntity, { payload_id: payloadId });
                    }
                    else {
                        const newPayload = manager.create(memmap_payload_entity_1.MemmapPayloadEntity, {
                            ...payloadData,
                            sku,
                            short_fw: shortFw,
                            long_fw: longFw,
                            created_at: new Date(),
                            updated_at: new Date(),
                        });
                        const saved = await manager.save(memmap_payload_entity_1.MemmapPayloadEntity, newPayload);
                        payloadId = saved.id;
                        existing = saved;
                    }
                    const regsToInsert = registersData.map((r, idx) => {
                        const { id: _ignoreId, ...rest } = r;
                        return manager.create(memmap_reg_entity_1.MemmapRegEntity, {
                            ...rest,
                            payload_id: payloadId,
                            sku,
                            short_fw: shortFw,
                            no: rest.no !== undefined ? rest.no : idx + 1,
                            in_rd1_template: Boolean(rest.in_rd1_template),
                            in_engineering_template: Boolean(rest.in_engineering_template),
                            in_end_user_template: Boolean(rest.in_end_user_template),
                            in_full_template: Boolean(rest.in_full_template),
                            created_at: new Date(),
                        });
                    });
                    const savedRegs = await manager.save(memmap_reg_entity_1.MemmapRegEntity, regsToInsert);
                    const reloaded = await manager.findOne(memmap_payload_entity_1.MemmapPayloadEntity, {
                        where: { id: payloadId },
                    });
                    return { payload: reloaded || existing, registers: savedRegs };
                });
            }
            catch (err) {
                this.logger.warn(`Database transaction failed, falling back to memory: ${err.message}`);
            }
        }
        const key = this.getCompositeKey(sku, shortFw);
        let payload = this.memoryPayloads.get(key);
        const payloadId = payload?.id || `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        payload = {
            id: payloadId,
            sku,
            short_fw: shortFw,
            long_fw: longFw || payload?.long_fw || String(shortFw),
            file_name: payloadData.file_name,
            total_regs: payloadData.total_regs || registersData.length,
            dec_valid: payloadData.dec_valid ?? true,
            hex_valid: payloadData.hex_valid ?? true,
            created_by: payloadData.created_by || 'admin',
            created_at: payload?.created_at || new Date(),
            updated_at: new Date(),
        };
        const savedRegs = registersData.map((r, idx) => ({
            id: `reg-${Date.now()}-${idx}`,
            payload_id: payloadId,
            sku,
            short_fw: shortFw,
            no: r.no !== undefined ? r.no : idx + 1,
            modbus_reg_dec: Number(r.modbus_reg_dec) || 0,
            modbus_reg_hex: String(r.modbus_reg_hex || '0'),
            fn_read: r.fn_read || '3',
            fn_write: r.fn_write || 'None',
            num_regs: Number(r.num_regs) || 1,
            description: r.description,
            range_val: r.range_val,
            end_user_default: r.end_user_default,
            format: r.format,
            downlink_type_5: r.downlink_type_5,
            in_rd1_template: Boolean(r.in_rd1_template),
            comment: r.comment,
            in_engineering_template: Boolean(r.in_engineering_template),
            in_end_user_template: Boolean(r.in_end_user_template),
            in_full_template: Boolean(r.in_full_template),
            created_at: new Date(),
        }));
        this.memoryPayloads.set(key, payload);
        this.memoryRegs.set(key, savedRegs);
        return { payload, registers: savedRegs };
    }
    async findBySkuAndShortFw(sku, shortFw) {
        const cleanSku = (sku || '').trim().toUpperCase();
        const cleanFw = Number(shortFw);
        const payloadRepo = this.getPayloadRepo();
        const regRepo = this.getRegRepo();
        if (payloadRepo && regRepo) {
            try {
                const payload = await payloadRepo.findOne({
                    where: { sku: cleanSku, short_fw: cleanFw },
                });
                if (payload) {
                    const registers = await regRepo.find({
                        where: { payload_id: payload.id },
                        order: { no: 'ASC' },
                    });
                    return { payload, registers };
                }
            }
            catch (err) {
                this.logger.debug(`Database find failed, checking memory fallback: ${err.message}`);
            }
        }
        const key = this.getCompositeKey(cleanSku, cleanFw);
        const payload = this.memoryPayloads.get(key);
        if (payload) {
            const registers = this.memoryRegs.get(key) || [];
            return { payload, registers: [...registers].sort((a, b) => a.no - b.no) };
        }
        return null;
    }
    async findAllPayloads() {
        const payloadRepo = this.getPayloadRepo();
        if (payloadRepo) {
            try {
                return await payloadRepo.find({ order: { created_at: 'DESC' } });
            }
            catch (err) {
                this.logger.debug(`Database findAll failed: ${err.message}`);
            }
        }
        return Array.from(this.memoryPayloads.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    async findPayloadByIdWithRegs(id) {
        const payloadRepo = this.getPayloadRepo();
        const regRepo = this.getRegRepo();
        if (payloadRepo) {
            try {
                const payload = await payloadRepo.findOne({ where: { id } });
                if (payload) {
                    const registers = regRepo
                        ? await regRepo.find({ where: { payload_id: id }, order: { no: 'ASC' } })
                        : [];
                    return { payload, registers };
                }
            }
            catch (err) {
                this.logger.debug(`Database findPayloadByIdWithRegs failed: ${err.message}`);
            }
        }
        for (const [key, p] of this.memoryPayloads.entries()) {
            if (p.id === id) {
                const registers = this.memoryRegs.get(key) || [];
                return { payload: p, registers: [...registers].sort((a, b) => a.no - b.no) };
            }
        }
        return null;
    }
    async deletePayloadById(id) {
        const payloadRepo = this.getPayloadRepo();
        const regRepo = this.getRegRepo();
        if (payloadRepo) {
            try {
                const payload = await payloadRepo.findOne({ where: { id } });
                if (payload) {
                    if (regRepo) {
                        await regRepo.delete({ payload_id: id });
                    }
                    await payloadRepo.delete({ id });
                    const key = this.getCompositeKey(payload.sku, payload.short_fw);
                    this.memoryPayloads.delete(key);
                    this.memoryRegs.delete(key);
                    return payload;
                }
            }
            catch (err) {
                this.logger.debug(`Database deletePayloadById failed: ${err.message}`);
            }
        }
        for (const [key, p] of this.memoryPayloads.entries()) {
            if (p.id === id) {
                this.memoryPayloads.delete(key);
                this.memoryRegs.delete(key);
                return p;
            }
        }
        return null;
    }
};
exports.MemmapUploadRepository = MemmapUploadRepository;
MemmapUploadRepository.sharedMemoryPayloads = new Map();
MemmapUploadRepository.sharedMemoryRegs = new Map();
exports.MemmapUploadRepository = MemmapUploadRepository = MemmapUploadRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], MemmapUploadRepository);
//# sourceMappingURL=memmap-upload.repository.js.map