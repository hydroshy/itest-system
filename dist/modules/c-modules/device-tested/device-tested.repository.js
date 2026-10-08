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
var DeviceTestedRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceTestedRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const device_tested_entity_1 = require("./entities/device-tested.entity");
let DeviceTestedRepository = DeviceTestedRepository_1 = class DeviceTestedRepository {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(DeviceTestedRepository_1.name);
        this.memoryRecords = new Map();
    }
    getRepo() {
        if (!this.dbService)
            return null;
        try {
            return this.dbService.getRepositoryForTable('device_tested', device_tested_entity_1.DeviceTestedEntity);
        }
        catch {
            return null;
        }
    }
    async findBySerialNumber(serialNumber, itemCode) {
        const sn = serialNumber.trim();
        const repo = this.getRepo();
        if (repo) {
            try {
                const query = repo.createQueryBuilder('dt')
                    .where('LOWER(dt.serial_number) = LOWER(:sn)', { sn });
                if (itemCode && itemCode.trim()) {
                    query.andWhere('LOWER(dt.item_code) = LOWER(:itemCode)', { itemCode: itemCode.trim() });
                }
                query.orderBy('dt.tested_at', 'DESC');
                const entity = await query.getOne();
                if (entity)
                    return entity;
            }
            catch (err) {
                this.logger.warn(`DB error finding device_tested by SN [${sn}]: ${err.message}. Falling back to memory.`);
            }
        }
        for (const record of this.memoryRecords.values()) {
            if (record.serial_number.toLowerCase() === sn.toLowerCase()) {
                if (!itemCode || record.item_code.toLowerCase() === itemCode.trim().toLowerCase()) {
                    return record;
                }
            }
        }
        return null;
    }
    async findAll(query) {
        const repo = this.getRepo();
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.min(200, Math.max(1, Number(query?.limit) || 50));
        const skip = (page - 1) * limit;
        if (repo) {
            try {
                const qb = repo.createQueryBuilder('dt');
                if (query?.so) {
                    qb.andWhere('LOWER(dt.so) = LOWER(:so)', { so: query.so.trim() });
                }
                if (query?.item_code) {
                    qb.andWhere('LOWER(dt.item_code) = LOWER(:itemCode)', { itemCode: query.item_code.trim() });
                }
                if (query?.serial_number) {
                    qb.andWhere('LOWER(dt.serial_number) LIKE LOWER(:sn)', { sn: `%${query.serial_number.trim()}%` });
                }
                if (query?.status) {
                    qb.andWhere('LOWER(dt.status) = LOWER(:status)', { status: query.status.trim() });
                }
                if (query?.search) {
                    const s = `%${query.search.trim().toLowerCase()}%`;
                    qb.andWhere('(LOWER(dt.serial_number) LIKE :s OR LOWER(dt.so) LIKE :s OR LOWER(dt.item_code) LIKE :s OR LOWER(dt.sku) LIKE :s)', { s });
                }
                qb.orderBy('dt.tested_at', 'DESC');
                qb.skip(skip).take(limit);
                const [data, total] = await qb.getManyAndCount();
                return { data, total };
            }
            catch (err) {
                this.logger.warn(`DB error in findAll device_tested: ${err.message}. Falling back to memory.`);
            }
        }
        let records = Array.from(this.memoryRecords.values());
        if (query?.so) {
            records = records.filter(r => r.so.toLowerCase() === query.so.trim().toLowerCase());
        }
        if (query?.item_code) {
            records = records.filter(r => r.item_code.toLowerCase() === query.item_code.trim().toLowerCase());
        }
        if (query?.serial_number) {
            records = records.filter(r => r.serial_number.toLowerCase().includes(query.serial_number.trim().toLowerCase()));
        }
        if (query?.status) {
            records = records.filter(r => r.status.toLowerCase() === query.status.trim().toLowerCase());
        }
        if (query?.search) {
            const s = query.search.trim().toLowerCase();
            records = records.filter(r => r.serial_number.toLowerCase().includes(s) ||
                r.so.toLowerCase().includes(s) ||
                r.item_code.toLowerCase().includes(s) ||
                r.sku.toLowerCase().includes(s));
        }
        const total = records.length;
        const data = records.slice(skip, skip + limit);
        return { data, total };
    }
    async saveOrUpdate(dto) {
        const sn = dto.serial_number.trim();
        const itemCode = dto.item_code.trim();
        const repo = this.getRepo();
        if (repo) {
            try {
                let existing = await repo.findOne({
                    where: { serial_number: sn, item_code: itemCode },
                });
                if (!existing) {
                    existing = repo.create({
                        id: (0, crypto_1.randomUUID)(),
                        so: dto.so.trim(),
                        item_code: itemCode,
                        serial_number: sn,
                        dev_eui: dto.dev_eui.trim().toUpperCase(),
                        sku: dto.sku.trim().toUpperCase(),
                        firmware_version: dto.firmware_version.trim(),
                        short_fw: dto.short_fw ?? 1,
                        sensor_type: dto.sensor_type ?? 0,
                        status: dto.status ?? 'PASS',
                        station_id: dto.station_id || 'STATION-01',
                        operator: dto.operator || 'admin',
                        app_key: dto.app_key?.trim()?.toUpperCase(),
                        tested_at: dto.tested_at ? new Date(dto.tested_at) : new Date(),
                        notes: dto.notes,
                        metadata: dto.metadata || {},
                    });
                }
                else {
                    existing.so = dto.so.trim();
                    existing.dev_eui = dto.dev_eui.trim().toUpperCase();
                    existing.sku = dto.sku.trim().toUpperCase();
                    existing.firmware_version = dto.firmware_version.trim();
                    existing.short_fw = dto.short_fw ?? existing.short_fw;
                    existing.sensor_type = dto.sensor_type ?? existing.sensor_type;
                    existing.status = dto.status ?? existing.status;
                    existing.station_id = dto.station_id || existing.station_id;
                    existing.operator = dto.operator || existing.operator;
                    if (dto.app_key)
                        existing.app_key = dto.app_key.trim().toUpperCase();
                    if (dto.tested_at)
                        existing.tested_at = new Date(dto.tested_at);
                    if (dto.notes !== undefined)
                        existing.notes = dto.notes;
                    if (dto.metadata)
                        existing.metadata = { ...existing.metadata, ...dto.metadata };
                }
                const saved = await repo.save(existing);
                const memKey = `${sn.toLowerCase()}_${itemCode.toLowerCase()}`;
                this.memoryRecords.set(memKey, saved);
                return saved;
            }
            catch (err) {
                this.logger.warn(`DB error saving device_tested: ${err.message}. Saving to memory.`);
            }
        }
        const memKey = `${sn.toLowerCase()}_${itemCode.toLowerCase()}`;
        const existingMem = this.memoryRecords.get(memKey);
        const entity = existingMem || new device_tested_entity_1.DeviceTestedEntity();
        if (!existingMem)
            entity.id = (0, crypto_1.randomUUID)();
        entity.so = dto.so.trim();
        entity.item_code = itemCode;
        entity.serial_number = sn;
        entity.dev_eui = dto.dev_eui.trim().toUpperCase();
        entity.sku = dto.sku.trim().toUpperCase();
        entity.firmware_version = dto.firmware_version.trim();
        entity.short_fw = dto.short_fw ?? 1;
        entity.sensor_type = dto.sensor_type ?? 0;
        entity.status = dto.status ?? 'PASS';
        entity.station_id = dto.station_id || 'STATION-01';
        entity.operator = dto.operator || 'admin';
        entity.app_key = dto.app_key?.trim()?.toUpperCase();
        entity.tested_at = dto.tested_at ? new Date(dto.tested_at) : new Date();
        entity.notes = dto.notes;
        entity.metadata = dto.metadata || {};
        entity.created_at = entity.created_at || new Date();
        entity.updated_at = new Date();
        this.memoryRecords.set(memKey, entity);
        return entity;
    }
};
exports.DeviceTestedRepository = DeviceTestedRepository;
exports.DeviceTestedRepository = DeviceTestedRepository = DeviceTestedRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], DeviceTestedRepository);
//# sourceMappingURL=device-tested.repository.js.map