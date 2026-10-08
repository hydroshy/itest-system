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
const fs = require("fs");
const path = require("path");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const device_tested_entity_1 = require("./entities/device-tested.entity");
let DeviceTestedRepository = DeviceTestedRepository_1 = class DeviceTestedRepository {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(DeviceTestedRepository_1.name);
        this.memoryRecords = new Map();
        this.initializedSeed = false;
        this.seedFromDefaultCsvIfAvailable();
    }
    seedFromDefaultCsvIfAvailable() {
        if (this.initializedSeed)
            return;
        try {
            const candidatePaths = [
                path.resolve(process.cwd(), 'docs/device_tested.csv'),
                path.resolve(process.cwd(), '../docs/device_tested.csv'),
                path.resolve(__dirname, '../../../../../docs/device_tested.csv'),
            ];
            for (const p of candidatePaths) {
                if (fs.existsSync(p)) {
                    const raw = fs.readFileSync(p, 'utf8');
                    const parsed = this.parseCsvString(raw);
                    for (const row of parsed) {
                        this.saveToMemoryRecord(row);
                    }
                    this.logger.log(`Preloaded ${parsed.length} device_tested records from ${p} into memory cache`);
                    break;
                }
            }
        }
        catch (e) {
            this.logger.warn(`Could not preload docs/device_tested.csv: ${e.message}`);
        }
        finally {
            this.initializedSeed = true;
        }
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
    parseCsvString(csvText) {
        if (!csvText || !csvText.trim())
            return [];
        const lines = [];
        let currentRow = [];
        let currentCell = '';
        let inQuotes = false;
        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];
            if (inQuotes) {
                if (char === '"' && nextChar === '"') {
                    currentCell += '"';
                    i++;
                }
                else if (char === '"') {
                    inQuotes = false;
                }
                else {
                    currentCell += char;
                }
            }
            else {
                if (char === '"') {
                    inQuotes = true;
                }
                else if (char === ',') {
                    currentRow.push(currentCell.trim());
                    currentCell = '';
                }
                else if (char === '\r' && nextChar === '\n') {
                    currentRow.push(currentCell.trim());
                    lines.push(currentRow);
                    currentRow = [];
                    currentCell = '';
                    i++;
                }
                else if (char === '\n' || char === '\r') {
                    currentRow.push(currentCell.trim());
                    lines.push(currentRow);
                    currentRow = [];
                    currentCell = '';
                }
                else {
                    currentCell += char;
                }
            }
        }
        if (currentCell.length > 0 || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            lines.push(currentRow);
        }
        if (lines.length < 2)
            return [];
        const headers = lines[0].map(h => h.trim().replace(/^"|"$/g, ''));
        const records = [];
        for (let r = 1; r < lines.length; r++) {
            const row = lines[r];
            if (!row || row.length === 0 || (row.length === 1 && !row[0]))
                continue;
            const record = {};
            for (let c = 0; c < headers.length; c++) {
                record[headers[c]] = row[c] !== undefined ? row[c] : '';
            }
            records.push(record);
        }
        return records;
    }
    saveToMemoryRecord(dto) {
        const sn = String(dto.serial_number || '').trim();
        const itemCode = String(dto.item_code || '').trim();
        const memKey = `${sn.toLowerCase()}_${itemCode.toLowerCase()}`;
        let entity = this.memoryRecords.get(memKey);
        if (!entity) {
            entity = new device_tested_entity_1.DeviceTestedEntity();
            entity.id = (0, crypto_1.randomUUID)();
            entity.created_at = new Date();
        }
        const soVal = dto.so_number || dto.so || '';
        const devKeyVal = (dto.device_key || dto.dev_eui || '').toUpperCase();
        const fwVal = dto.fw_ver || dto.firmware_version || '';
        const resultVal = (dto.result || dto.status || 'PASS').toUpperCase();
        const autoCheckVal = (dto.auto_check || 'PASS').toUpperCase();
        entity.serial_number = sn;
        entity.item_code = itemCode;
        entity.so = soVal;
        entity.so_number = soVal;
        entity.device_key = devKeyVal;
        entity.dev_eui = devKeyVal;
        entity.sku = (dto.sku || '').toUpperCase();
        entity.fw_ver = fwVal;
        entity.firmware_version = fwVal;
        entity.hw_ver = dto.hw_ver || '';
        entity.result = resultVal;
        entity.status = resultVal;
        entity.auto_check = autoCheckVal;
        entity.test_id = dto.test_id || '';
        entity.label_check_code = dto.label_check_code || '';
        entity.start_time = dto.start_time || '';
        entity.duration_time = dto.duration_time || '';
        entity.time_finish = dto.time_finish ? Number(dto.time_finish) : null;
        entity.test_station = dto.test_station || dto.station_id || 'STATION-01';
        entity.station_id = entity.test_station;
        entity.test_person = dto.test_person || dto.operator || 'admin';
        entity.operator = entity.test_person;
        entity.test_note = dto.test_note || dto.notes || '';
        entity.notes = entity.test_note;
        entity.test_result_id = dto.test_result_id || '';
        if (dto.app_key)
            entity.app_key = String(dto.app_key).trim().toUpperCase();
        entity.tested_at = dto.tested_at ? new Date(dto.tested_at) : new Date();
        entity.metadata = dto.metadata || {};
        entity.csv_raw_data = dto.csv_raw_data || dto;
        entity.updated_at = new Date();
        this.memoryRecords.set(memKey, entity);
        return entity;
    }
    async findBySerialNumber(serialNumber, itemCode) {
        this.seedFromDefaultCsvIfAvailable();
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
                let entity = await query.getOne();
                if (!entity && itemCode && itemCode.trim()) {
                    entity = await repo.createQueryBuilder('dt')
                        .where('LOWER(dt.serial_number) = LOWER(:sn)', { sn })
                        .orderBy('dt.tested_at', 'DESC')
                        .getOne();
                }
                if (entity) {
                    entity.so_number = entity.so_number || entity.so;
                    entity.so = entity.so || entity.so_number;
                    entity.device_key = entity.device_key || entity.dev_eui;
                    entity.dev_eui = entity.dev_eui || entity.device_key;
                    entity.fw_ver = entity.fw_ver || entity.firmware_version;
                    entity.firmware_version = entity.firmware_version || entity.fw_ver;
                    entity.result = entity.result || entity.status || 'PASS';
                    entity.status = (entity.status || entity.result || 'PASS');
                    entity.auto_check = entity.auto_check || 'PASS';
                    return entity;
                }
            }
            catch (err) {
                this.logger.warn(`DB error finding device_tested by SN [${sn}]: ${err.message}. Falling back to memory.`);
            }
        }
        let snMatch = null;
        for (const record of this.memoryRecords.values()) {
            if (record.serial_number.toLowerCase() === sn.toLowerCase()) {
                if (itemCode && record.item_code.toLowerCase() === itemCode.trim().toLowerCase()) {
                    return record;
                }
                if (!snMatch) {
                    snMatch = record;
                }
            }
        }
        return snMatch;
    }
    async findAll(query) {
        this.seedFromDefaultCsvIfAvailable();
        const repo = this.getRepo();
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.min(500, Math.max(1, Number(query?.limit) || 50));
        const skip = (page - 1) * limit;
        if (repo) {
            try {
                const qb = repo.createQueryBuilder('dt');
                if (query?.so || query?.so_number) {
                    const soVal = (query.so_number || query.so).trim();
                    qb.andWhere('(LOWER(dt.so) = LOWER(:soVal) OR LOWER(dt.so_number) = LOWER(:soVal))', { soVal });
                }
                if (query?.item_code) {
                    qb.andWhere('LOWER(dt.item_code) = LOWER(:itemCode)', { itemCode: query.item_code.trim() });
                }
                if (query?.serial_number) {
                    qb.andWhere('LOWER(dt.serial_number) LIKE LOWER(:sn)', { sn: `%${query.serial_number.trim()}%` });
                }
                if (query?.device_key) {
                    qb.andWhere('(LOWER(dt.device_key) LIKE LOWER(:dk) OR LOWER(dt.dev_eui) LIKE LOWER(:dk))', { dk: `%${query.device_key.trim()}%` });
                }
                if (query?.status) {
                    qb.andWhere('(LOWER(dt.status) = LOWER(:status) OR LOWER(dt.result) = LOWER(:status))', { status: query.status.trim() });
                }
                if (query?.auto_check) {
                    qb.andWhere('LOWER(dt.auto_check) = LOWER(:ac)', { ac: query.auto_check.trim() });
                }
                if (query?.search) {
                    const s = `%${query.search.trim().toLowerCase()}%`;
                    qb.andWhere('(LOWER(dt.serial_number) LIKE :s OR LOWER(dt.so) LIKE :s OR LOWER(dt.so_number) LIKE :s OR LOWER(dt.item_code) LIKE :s OR LOWER(dt.sku) LIKE :s OR LOWER(dt.device_key) LIKE :s)', { s });
                }
                qb.orderBy('dt.tested_at', 'DESC');
                qb.skip(skip).take(limit);
                const [data, total] = await qb.getManyAndCount();
                for (const item of data) {
                    item.so_number = item.so_number || item.so;
                    item.so = item.so || item.so_number;
                    item.device_key = item.device_key || item.dev_eui;
                    item.dev_eui = item.dev_eui || item.device_key;
                    item.fw_ver = item.fw_ver || item.firmware_version;
                    item.result = item.result || item.status || 'PASS';
                    item.auto_check = item.auto_check || 'PASS';
                }
                return { data, total };
            }
            catch (err) {
                this.logger.warn(`DB error in findAll device_tested: ${err.message}. Falling back to memory.`);
            }
        }
        let records = Array.from(this.memoryRecords.values());
        if (query?.so || query?.so_number) {
            const qSo = (query.so_number || query.so).trim().toLowerCase();
            records = records.filter(r => (r.so_number || r.so || '').toLowerCase() === qSo);
        }
        if (query?.item_code) {
            records = records.filter(r => r.item_code.toLowerCase() === query.item_code.trim().toLowerCase());
        }
        if (query?.serial_number) {
            records = records.filter(r => r.serial_number.toLowerCase().includes(query.serial_number.trim().toLowerCase()));
        }
        if (query?.device_key) {
            records = records.filter(r => (r.device_key || r.dev_eui || '').toLowerCase().includes(query.device_key.trim().toLowerCase()));
        }
        if (query?.status) {
            const st = query.status.trim().toLowerCase();
            records = records.filter(r => (r.status || '').toLowerCase() === st || (r.result || '').toLowerCase() === st);
        }
        if (query?.auto_check) {
            const ac = query.auto_check.trim().toLowerCase();
            records = records.filter(r => (r.auto_check || '').toLowerCase() === ac);
        }
        if (query?.search) {
            const s = query.search.trim().toLowerCase();
            records = records.filter(r => r.serial_number.toLowerCase().includes(s) ||
                (r.so_number || r.so || '').toLowerCase().includes(s) ||
                r.item_code.toLowerCase().includes(s) ||
                (r.sku || '').toLowerCase().includes(s) ||
                (r.device_key || r.dev_eui || '').toLowerCase().includes(s));
        }
        const total = records.length;
        const data = records.slice(skip, skip + limit);
        return { data, total };
    }
    async saveOrUpdate(dto) {
        const sn = dto.serial_number.trim();
        const itemCode = dto.item_code.trim();
        const soVal = dto.so_number ? dto.so_number.trim() : (dto.so ? dto.so.trim() : '');
        const devKeyVal = (dto.device_key || dto.dev_eui || '').trim().toUpperCase();
        const fwVal = (dto.fw_ver || dto.firmware_version || '').trim();
        const resultVal = (dto.result || dto.status || 'PASS').trim().toUpperCase();
        const autoCheckVal = (dto.auto_check || 'PASS').trim().toUpperCase();
        const repo = this.getRepo();
        if (repo) {
            try {
                let existing = await repo.findOne({
                    where: { serial_number: sn, item_code: itemCode },
                });
                if (!existing) {
                    existing = repo.create({
                        id: (0, crypto_1.randomUUID)(),
                        so: soVal,
                        so_number: soVal,
                        item_code: itemCode,
                        serial_number: sn,
                        dev_eui: devKeyVal,
                        device_key: devKeyVal,
                        sku: (dto.sku || '').trim().toUpperCase(),
                        firmware_version: fwVal,
                        fw_ver: fwVal,
                        hw_ver: dto.hw_ver || '',
                        short_fw: dto.short_fw ?? 1,
                        sensor_type: dto.sensor_type ?? 0,
                        status: resultVal,
                        result: resultVal,
                        auto_check: autoCheckVal,
                        test_id: dto.test_id || '',
                        label_check_code: dto.label_check_code || '',
                        start_time: dto.start_time || '',
                        duration_time: dto.duration_time || '',
                        time_finish: dto.time_finish ? Number(dto.time_finish) : null,
                        test_station: dto.test_station || dto.station_id || 'STATION-01',
                        station_id: dto.station_id || dto.test_station || 'STATION-01',
                        test_person: dto.test_person || dto.operator || 'admin',
                        operator: dto.operator || dto.test_person || 'admin',
                        test_note: dto.test_note || dto.notes || '',
                        notes: dto.notes || dto.test_note || '',
                        test_result_id: dto.test_result_id || '',
                        app_key: dto.app_key?.trim()?.toUpperCase(),
                        tested_at: dto.tested_at ? new Date(dto.tested_at) : new Date(),
                        metadata: dto.metadata || {},
                        csv_raw_data: dto.csv_raw_data || {},
                    });
                }
                else {
                    existing.so = soVal || existing.so;
                    existing.so_number = soVal || existing.so_number;
                    existing.dev_eui = devKeyVal || existing.dev_eui;
                    existing.device_key = devKeyVal || existing.device_key;
                    if (dto.sku)
                        existing.sku = dto.sku.trim().toUpperCase();
                    existing.firmware_version = fwVal || existing.firmware_version;
                    existing.fw_ver = fwVal || existing.fw_ver;
                    if (dto.hw_ver)
                        existing.hw_ver = dto.hw_ver;
                    existing.short_fw = dto.short_fw ?? existing.short_fw;
                    existing.sensor_type = dto.sensor_type ?? existing.sensor_type;
                    existing.status = resultVal || existing.status;
                    existing.result = resultVal || existing.result;
                    existing.auto_check = autoCheckVal || existing.auto_check;
                    if (dto.test_id)
                        existing.test_id = dto.test_id;
                    if (dto.label_check_code)
                        existing.label_check_code = dto.label_check_code;
                    if (dto.start_time)
                        existing.start_time = dto.start_time;
                    if (dto.duration_time)
                        existing.duration_time = dto.duration_time;
                    if (dto.time_finish)
                        existing.time_finish = Number(dto.time_finish);
                    if (dto.test_station || dto.station_id)
                        existing.station_id = dto.station_id || dto.test_station;
                    if (dto.test_station)
                        existing.test_station = dto.test_station;
                    if (dto.test_person || dto.operator)
                        existing.operator = dto.operator || dto.test_person;
                    if (dto.test_person)
                        existing.test_person = dto.test_person;
                    if (dto.app_key)
                        existing.app_key = dto.app_key.trim().toUpperCase();
                    if (dto.tested_at)
                        existing.tested_at = new Date(dto.tested_at);
                    if (dto.test_note || dto.notes)
                        existing.notes = dto.notes || dto.test_note;
                    if (dto.metadata)
                        existing.metadata = { ...existing.metadata, ...dto.metadata };
                    if (dto.csv_raw_data)
                        existing.csv_raw_data = { ...existing.csv_raw_data, ...dto.csv_raw_data };
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
        return this.saveToMemoryRecord(dto);
    }
    async updateAppKey(serialNumber, appKey) {
        const sn = serialNumber.trim();
        const cleanAppKey = appKey.trim().toUpperCase();
        const repo = this.getRepo();
        if (repo) {
            try {
                const entity = await repo.findOne({ where: { serial_number: sn } });
                if (entity) {
                    entity.app_key = cleanAppKey;
                    entity.updated_at = new Date();
                    const saved = await repo.save(entity);
                    const memKey = `${sn.toLowerCase()}_${entity.item_code.toLowerCase()}`;
                    this.memoryRecords.set(memKey, saved);
                    return saved;
                }
            }
            catch (err) {
                this.logger.warn(`DB error updating app_key for SN [${sn}]: ${err.message}`);
            }
        }
        for (const record of this.memoryRecords.values()) {
            if (record.serial_number.toLowerCase() === sn.toLowerCase()) {
                record.app_key = cleanAppKey;
                record.updated_at = new Date();
                return record;
            }
        }
        return null;
    }
    async getTree() {
        this.seedFromDefaultCsvIfAvailable();
        const { data } = await this.findAll({ limit: 10000 });
        const groupsMap = new Map();
        for (const item of data) {
            const soKey = item.so_number || item.so || 'UNASSIGNED_SO';
            let group = groupsMap.get(soKey);
            if (!group) {
                group = {
                    so_number: soKey,
                    total_devices: 0,
                    pass_count: 0,
                    fail_count: 0,
                    devices: [],
                };
                groupsMap.set(soKey, group);
            }
            const isAutoPass = String(item.auto_check || '').trim().toUpperCase() === 'PASS';
            const isResultPass = String(item.result || item.status || '').trim().toUpperCase() === 'PASS' ||
                String(item.result || item.status || '').trim().toUpperCase() === 'PASSED';
            const isPass = isAutoPass && isResultPass;
            group.total_devices++;
            if (isPass) {
                group.pass_count++;
            }
            else {
                group.fail_count++;
            }
            group.devices.push({
                id: item.id,
                serial_number: item.serial_number,
                device_key: item.device_key || item.dev_eui || '',
                item_code: item.item_code,
                sku: item.sku || '',
                hw_ver: item.hw_ver || '',
                fw_ver: item.fw_ver || item.firmware_version || '',
                auto_check: item.auto_check || 'PASS',
                result: item.result || item.status || 'PASS',
                app_key: item.app_key,
                so_number: soKey,
                test_id: item.test_id,
                csv_raw_data: item.csv_raw_data,
            });
        }
        return Array.from(groupsMap.values()).sort((a, b) => a.so_number.localeCompare(b.so_number));
    }
    async bulkImportCsv(csvRecords) {
        let imported = 0;
        let updated = 0;
        for (const row of csvRecords) {
            const sn = String(row.serial_number || '').trim();
            const itemCode = String(row.item_code || '').trim();
            if (!sn || !itemCode)
                continue;
            const existing = await this.findBySerialNumber(sn, itemCode);
            if (existing) {
                updated++;
            }
            else {
                imported++;
            }
            await this.saveOrUpdate({
                ...row,
                serial_number: sn,
                item_code: itemCode,
                csv_raw_data: row,
            });
        }
        return { imported, updated, total: imported + updated };
    }
};
exports.DeviceTestedRepository = DeviceTestedRepository;
exports.DeviceTestedRepository = DeviceTestedRepository = DeviceTestedRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], DeviceTestedRepository);
//# sourceMappingURL=device-tested.repository.js.map