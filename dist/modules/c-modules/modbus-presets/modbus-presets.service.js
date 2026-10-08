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
var ModbusPresetsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModbusPresetsService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const modbus_preset_entity_1 = require("./entities/modbus-preset.entity");
const create_final_config_service_1 = require("../create-final-config/create-final-config.service");
let ModbusPresetsService = ModbusPresetsService_1 = class ModbusPresetsService {
    constructor(dbService, finalConfigService) {
        this.dbService = dbService;
        this.finalConfigService = finalConfigService;
        this.logger = new common_1.Logger(ModbusPresetsService_1.name);
        this.presets = [];
    }
    getConfigPath() {
        if (process.env.MODBUS_PRESETS_CONFIG_PATH)
            return process.env.MODBUS_PRESETS_CONFIG_PATH;
        const candidates = [
            path.join(process.cwd(), 'config', 'modbus-presets.json'),
            path.join(process.cwd(), 'dvt', 'config', 'modbus-presets.json'),
            path.join(__dirname, '../../../../config', 'modbus-presets.json'),
        ];
        for (const c of candidates) {
            if (fs.existsSync(c))
                return c;
        }
        for (const c of candidates) {
            if (fs.existsSync(path.dirname(c)))
                return c;
        }
        return candidates[0];
    }
    async onModuleInit() {
        this.loadPresetsFromFile();
        await this.initDatabaseTable();
        if (this.presets.length === 0) {
            await this.seedDefaultPresets();
        }
    }
    loadPresetsFromFile() {
        try {
            const configPath = this.getConfigPath();
            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            if (fs.existsSync(configPath)) {
                const raw = fs.readFileSync(configPath, 'utf8');
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.presets = parsed.map((p) => ({
                        ...p,
                        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
                    }));
                    this.logger.log(`Loaded ${this.presets.length} modbus presets from ${configPath}`);
                }
            }
        }
        catch (err) {
            this.logger.warn(`Could not load modbus presets from file: ${err.message}`);
        }
    }
    savePresetsToFile() {
        try {
            const configPath = this.getConfigPath();
            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(configPath, JSON.stringify(this.presets, null, 2), 'utf8');
        }
        catch (err) {
            this.logger.error(`Failed to write modbus presets: ${err.message}`);
        }
    }
    async initDatabaseTable() {
        if (!this.dbService)
            return;
        try {
            const ds = this.dbService.getDataSourceForTable('modbus_presets');
            if (ds && ds.isInitialized) {
                await ds.query(`
          CREATE TABLE IF NOT EXISTS public.modbus_presets (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            "profileType" VARCHAR(100) NOT NULL DEFAULT 'Custom',
            "createdBy" VARCHAR(255) DEFAULT 'admin',
            registers JSONB NOT NULL DEFAULT '[]',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
          );
        `);
                const repo = ds.getRepository(modbus_preset_entity_1.ModbusPresetEntity);
                const dbCount = await repo.count();
                if (dbCount > 0) {
                    const dbRows = await repo.find({ order: { updatedAt: 'DESC' } });
                    this.presets = dbRows;
                    this.savePresetsToFile();
                }
                else if (this.presets.length > 0) {
                    for (const item of this.presets) {
                        await repo.save(item);
                    }
                }
            }
        }
        catch (e) {
            this.logger.warn(`Modbus presets database table initialization skipped/failed: ${e.message}`);
        }
    }
    async syncToDatabase(preset, action = 'save') {
        if (!this.dbService)
            return;
        try {
            const ds = this.dbService.getDataSourceForTable('modbus_presets');
            if (ds && ds.isInitialized) {
                const repo = ds.getRepository(modbus_preset_entity_1.ModbusPresetEntity);
                if (action === 'save') {
                    await repo.save(preset);
                }
                else if (action === 'delete') {
                    await repo.delete(preset.id);
                }
            }
        }
        catch (e) {
            this.logger.warn(`Database sync for preset ${preset.id} failed: ${e.message}`);
        }
    }
    async findAll() {
        return [...this.presets].sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt).getTime();
            return timeB - timeA;
        });
    }
    async findOne(id) {
        const preset = this.presets.find((p) => p.id === id);
        if (!preset) {
            throw new common_1.NotFoundException(`Modbus preset with ID '${id}' not found`);
        }
        return preset;
    }
    async create(dto, username = 'admin') {
        const rawName = dto.name ? dto.name.trim() : '';
        if (!rawName) {
            throw new common_1.BadRequestException('Template name is required');
        }
        const cleanSlug = rawName
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 30);
        const uniqueId = 'tpl_' + (cleanSlug || 'template') + '_' + Date.now().toString(36);
        const newPreset = {
            id: uniqueId,
            name: rawName,
            description: dto.description?.trim() || '',
            profileType: dto.profileType?.trim() || 'Custom',
            createdBy: dto.createdBy?.trim() || username || 'admin',
            registers: Array.isArray(dto.registers) ? dto.registers : [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.presets.unshift(newPreset);
        this.savePresetsToFile();
        await this.syncToDatabase(newPreset, 'save');
        this.logger.log(`Created new Modbus preset: [${newPreset.id}] "${newPreset.name}" by ${newPreset.createdBy}`);
        if ((dto.profileType === 'FinalConfig' || (dto.so && dto.itemCode)) &&
            this.finalConfigService) {
            try {
                const regsForFinalConfig = (dto.registers || [])
                    .filter((r) => Number(r.reg ?? r.address) >= 303)
                    .map((r, idx) => ({
                    address: Number(r.reg ?? r.address),
                    modbus_reg_hex: r.modbus_reg_hex ||
                        `0x${Number(r.reg ?? r.address).toString(16).padStart(4, '0').toUpperCase()}`,
                    slave: r.slave !== undefined ? Number(r.slave) : 1,
                    reg_num: r.numreg !== undefined
                        ? Number(r.numreg)
                        : r.reg_num !== undefined
                            ? Number(r.reg_num)
                            : 1,
                    format: r.format || 'uint',
                    parameter_name: r.parameter || r.parameter_name || '',
                    value_to_write: String(r.valuetowrite ?? r.value_to_write ?? ''),
                    value_on_memmap: r.value_on_memmap || r.end_user_default || undefined,
                    endianness: r.endianness || 'big-endian',
                    fn_read: String(r.fc ?? r.fn_read ?? '3'),
                    fn_write: String(r.fn_write ?? '16'),
                    order_no: r.order !== undefined
                        ? Number(r.order)
                        : r.order_no !== undefined
                            ? Number(r.order_no)
                            : idx,
                    checked: r.checked !== undefined ? !!r.checked : true,
                }));
                await this.finalConfigService.saveFinalConfig({
                    so: dto.so || 'SO-UNKNOWN',
                    item_code: dto.itemCode || 'ITEM-UNKNOWN',
                    sku: dto.sku || 'SKU-UNKNOWN',
                    firmware_version: dto.firmwareVersion || `${dto.shortFw || 1}.0`,
                    short_fw: Number(dto.shortFw || 1),
                    name: rawName,
                    description: dto.description || undefined,
                    created_by: dto.createdBy || username || 'admin',
                    registers: regsForFinalConfig,
                }, dto.createdBy || username || 'admin');
            }
            catch (err) {
                this.logger.warn(`Failed to persist to final_config_presets & regs: ${err.message}`);
            }
        }
        return newPreset;
    }
    async update(id, dto, username = 'admin') {
        const index = this.presets.findIndex((p) => p.id === id);
        if (index === -1) {
            throw new common_1.NotFoundException(`Modbus preset with ID '${id}' not found`);
        }
        const current = this.presets[index];
        const updated = {
            ...current,
            name: dto.name !== undefined ? dto.name.trim() : current.name,
            description: dto.description !== undefined ? dto.description.trim() : current.description,
            profileType: dto.profileType !== undefined ? dto.profileType.trim() : current.profileType,
            registers: Array.isArray(dto.registers) ? dto.registers : current.registers,
            updatedAt: new Date(),
        };
        this.presets[index] = updated;
        this.savePresetsToFile();
        await this.syncToDatabase(updated, 'save');
        this.logger.log(`Updated Modbus preset: [${updated.id}] "${updated.name}"`);
        return updated;
    }
    async delete(id) {
        const index = this.presets.findIndex((p) => p.id === id);
        if (index === -1) {
            throw new common_1.NotFoundException(`Modbus preset with ID '${id}' not found`);
        }
        const removed = this.presets.splice(index, 1)[0];
        this.savePresetsToFile();
        await this.syncToDatabase(removed, 'delete');
        this.logger.log(`Deleted Modbus preset: [${id}] "${removed.name}"`);
        return { success: true, id };
    }
    async seedDefaultPresets() {
        this.logger.log('Seeding default Modbus presets...');
        const defaults = [
            {
                id: 'WSL-AMBIENT',
                name: 'Daviteq WSL Ambient T&H Sensor',
                description: 'Ambient Temperature, Humidity, Barometer, Light, Battery',
                profileType: 'Full',
                createdBy: 'system',
                registers: [
                    { id: '1', order: 1, checked: true, slave: 1, fc: 4, reg: 0, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Ambient Temperature', valuetowrite: '' },
                    { id: '2', order: 2, checked: true, slave: 1, fc: 4, reg: 2, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Relative Humidity', valuetowrite: '' },
                    { id: '3', order: 3, checked: true, slave: 1, fc: 4, reg: 4, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Barometric Pressure', valuetowrite: '' },
                    { id: '4', order: 4, checked: true, slave: 1, fc: 4, reg: 6, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Illuminance / Light', valuetowrite: '' },
                    { id: '5', order: 5, checked: true, slave: 1, fc: 4, reg: 8, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Battery Voltage', valuetowrite: '' },
                    { id: '6', order: 6, checked: true, slave: 1, fc: 3, reg: 100, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Transmission Interval', valuetowrite: '60' },
                    { id: '7', order: 7, checked: true, slave: 1, fc: 3, reg: 101, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Modbus Slave Address', valuetowrite: '1' },
                ],
            },
            {
                id: 'WSL-LEVEL',
                name: 'Daviteq WSL Hydrostatic Level Sensor',
                description: 'Liquid Level, Water Temperature, Sensor Status, Battery',
                profileType: 'Full',
                createdBy: 'system',
                registers: [
                    { id: '1', order: 1, checked: true, slave: 1, fc: 4, reg: 0, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Liquid Level / Depth', valuetowrite: '' },
                    { id: '2', order: 2, checked: true, slave: 1, fc: 4, reg: 2, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Water Temperature', valuetowrite: '' },
                    { id: '3', order: 3, checked: true, slave: 1, fc: 4, reg: 4, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Sensor Status Code', valuetowrite: '' },
                    { id: '4', order: 4, checked: true, slave: 1, fc: 4, reg: 5, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Battery Voltage', valuetowrite: '' },
                    { id: '5', order: 5, checked: true, slave: 1, fc: 3, reg: 50, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Zero Calibration', valuetowrite: '0.0' },
                    { id: '6', order: 6, checked: true, slave: 1, fc: 3, reg: 52, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'High Alarm Threshold', valuetowrite: '8.5' },
                ],
            },
            {
                id: 'ENERGY-METER-3P',
                name: '3-Phase Industrial Energy Meter',
                description: 'Voltage L1-L3, Current L1-L3, Active Power, Power Factor, Frequency',
                profileType: 'Full',
                createdBy: 'system',
                registers: [
                    { id: '1', order: 1, checked: true, slave: 1, fc: 3, reg: 0, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase A Voltage', valuetowrite: '' },
                    { id: '2', order: 2, checked: true, slave: 1, fc: 3, reg: 2, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase B Voltage', valuetowrite: '' },
                    { id: '3', order: 3, checked: true, slave: 1, fc: 3, reg: 4, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase C Voltage', valuetowrite: '' },
                    { id: '4', order: 4, checked: true, slave: 1, fc: 3, reg: 6, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase A Current', valuetowrite: '' },
                    { id: '5', order: 5, checked: true, slave: 1, fc: 3, reg: 8, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase B Current', valuetowrite: '' },
                    { id: '6', order: 6, checked: true, slave: 1, fc: 3, reg: 10, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase C Current', valuetowrite: '' },
                    { id: '7', order: 7, checked: true, slave: 1, fc: 3, reg: 12, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Total Active Power', valuetowrite: '' },
                    { id: '8', order: 8, checked: true, slave: 1, fc: 3, reg: 14, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Power Factor', valuetowrite: '' },
                    { id: '9', order: 9, checked: true, slave: 1, fc: 3, reg: 16, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Grid Frequency', valuetowrite: '' },
                ],
            },
            {
                id: 'MODBUS-IO-MODULE',
                name: 'Daviteq Modbus IO Module',
                description: 'Digital Inputs, Relay Outputs, 4-20mA / 0-10V Analog Inputs',
                profileType: 'Full',
                createdBy: 'system',
                registers: [
                    { id: '1', order: 1, checked: true, slave: 1, fc: 1, reg: 0, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'DO 1 (Relay Output 1)', valuetowrite: '1' },
                    { id: '2', order: 2, checked: true, slave: 1, fc: 1, reg: 1, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'DO 2 (Relay Output 2)', valuetowrite: '0' },
                    { id: '3', order: 3, checked: true, slave: 1, fc: 2, reg: 0, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'DI 1 (Digital Input 1)', valuetowrite: '' },
                    { id: '4', order: 4, checked: true, slave: 1, fc: 2, reg: 1, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'DI 2 (Digital Input 2)', valuetowrite: '' },
                    { id: '5', order: 5, checked: true, slave: 1, fc: 4, reg: 0, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'AI 1 (4-20mA Raw ADC)', valuetowrite: '' },
                    { id: '6', order: 6, checked: true, slave: 1, fc: 4, reg: 1, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'AI 2 (0-10V Raw ADC)', valuetowrite: '' },
                    { id: '7', order: 7, checked: true, slave: 1, fc: 4, reg: 2, numreg: 2, format: 'uint', endianness: 'Big-Endian', parameter: 'Pulse Counter 1', valuetowrite: '' },
                ],
            },
        ];
        for (const d of defaults) {
            const preset = {
                id: d.id,
                name: d.name,
                description: d.description || '',
                profileType: d.profileType || 'Custom',
                createdBy: d.createdBy || 'system',
                registers: d.registers || [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.presets.push(preset);
            await this.syncToDatabase(preset, 'save');
        }
        this.savePresetsToFile();
    }
};
exports.ModbusPresetsService = ModbusPresetsService;
exports.ModbusPresetsService = ModbusPresetsService = ModbusPresetsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService,
        create_final_config_service_1.CreateFinalConfigService])
], ModbusPresetsService);
//# sourceMappingURL=modbus-presets.service.js.map