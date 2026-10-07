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
var SensorTypesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensorTypesService = void 0;
const common_1 = require("@nestjs/common");
const sensor_types_repository_1 = require("./sensor-types.repository");
let SensorTypesService = SensorTypesService_1 = class SensorTypesService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new common_1.Logger(SensorTypesService_1.name);
    }
    async onModuleInit() {
        await this.initDatabaseTable();
    }
    async initDatabaseTable() {
        try {
            const repo = this.repository.getRepo();
            const ds = repo.manager.connection;
            if (ds && ds.isInitialized) {
                await ds.query(`
          CREATE TABLE IF NOT EXISTS "sensor_types" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "sensorTypeCode" INT NOT NULL UNIQUE,
            "sku" VARCHAR(100) NOT NULL,
            "name" VARCHAR(255) NOT NULL,
            "description" TEXT,
            "defaultRegion" VARCHAR(50) DEFAULT 'EU868',
            "defaultClass" VARCHAR(10) DEFAULT 'A',
            "isActive" BOOLEAN DEFAULT true,
            "metadata" JSONB DEFAULT '{}',
            "createdAt" TIMESTAMPTZ DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE UNIQUE INDEX IF NOT EXISTS "idx_sensor_types_sensor_type_code" ON "sensor_types" ("sensorTypeCode");
          CREATE INDEX IF NOT EXISTS "idx_sensor_types_sku" ON "sensor_types" ("sku");
          CREATE INDEX IF NOT EXISTS "idx_sensor_types_is_active" ON "sensor_types" ("isActive");
        `);
                const count = await repo.count();
                if (count === 0) {
                    this.logger.log('Seeding initial LoRaWAN sensor types...');
                    const initialSeeds = [
                        { sensorTypeCode: 71, sku: 'WSLRW-LKS', name: 'Wireless LoRaWAN Leak Sensor', description: 'Daviteq Wireless LoRaWAN Leakage Sensor with Modbus UART', defaultRegion: 'EU868', defaultClass: 'A' },
                        { sensorTypeCode: 1, sku: 'WS433-CL', name: 'Wireless Current Loop Sensor', description: 'Daviteq 4-20mA Current Loop LoRaWAN Transmitter', defaultRegion: 'EU868', defaultClass: 'A' },
                        { sensorTypeCode: 2, sku: 'WS433-DI', name: 'Wireless Digital Input Sensor', description: 'Daviteq Digital Input Dry Contact LoRaWAN Sensor', defaultRegion: 'EU868', defaultClass: 'A' },
                        { sensorTypeCode: 3, sku: 'WS433-DO', name: 'Wireless Relay Output Actuator', description: 'Daviteq Relay Output Control LoRaWAN Module', defaultRegion: 'EU868', defaultClass: 'C' },
                        { sensorTypeCode: 4, sku: 'WS433-TH', name: 'Wireless Temperature & Humidity Sensor', description: 'Daviteq Industrial Ambient Temp/RH LoRaWAN Sensor', defaultRegion: 'EU868', defaultClass: 'A' },
                    ];
                    for (const seed of initialSeeds) {
                        await repo.save(repo.create(seed));
                    }
                    this.logger.log(`Seeded ${initialSeeds.length} sensor types successfully.`);
                }
            }
        }
        catch (err) {
            this.logger.debug(`initDatabaseTable note: ${err.message}`);
        }
    }
    async findAll(query) {
        return await this.repository.findWithPagination(query);
    }
    async findOne(id) {
        const item = await this.repository.findById(id);
        if (!item) {
            throw new common_1.NotFoundException(`Sensor Type [${id}] not found`);
        }
        return item;
    }
    async resolveSku(code) {
        const item = await this.repository.findBySensorTypeCode(code);
        if (!item) {
            if (code === 71) {
                return {
                    found: true,
                    sensorTypeCode: 71,
                    sku: 'WSLRW-LKS',
                    name: 'Wireless LoRaWAN Leak Sensor',
                    defaultRegion: 'EU868',
                    defaultClass: 'A',
                };
            }
            return { found: false, sensorTypeCode: code };
        }
        return {
            found: true,
            sensorTypeCode: item.sensorTypeCode,
            sku: item.sku,
            name: item.name,
            defaultRegion: item.defaultRegion,
            defaultClass: item.defaultClass,
        };
    }
    async create(dto) {
        const code = Number(dto.sensorTypeCode);
        if (isNaN(code) || code < 1 || code > 255) {
            throw new common_1.BadRequestException('sensorTypeCode must be a valid integer between 1 and 255');
        }
        const existingCode = await this.repository.findBySensorTypeCode(code);
        if (existingCode) {
            throw new common_1.ConflictException(`Sensor Type code ${code} is already registered (${existingCode.sku})`);
        }
        const sku = (dto.sku || '').trim().toUpperCase();
        if (!sku) {
            throw new common_1.BadRequestException('Hardware SKU is required');
        }
        return await this.repository.create({
            sensorTypeCode: code,
            sku,
            name: dto.name?.trim() || sku,
            description: dto.description?.trim(),
            defaultRegion: dto.defaultRegion?.trim() || 'EU868',
            defaultClass: dto.defaultClass?.trim() || 'A',
            isActive: dto.isActive !== undefined ? dto.isActive : true,
            metadata: dto.metadata || {},
        });
    }
    async update(id, dto) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Sensor Type [${id}] not found`);
        }
        if (dto.sensorTypeCode !== undefined && Number(dto.sensorTypeCode) !== existing.sensorTypeCode) {
            const conflict = await this.repository.findBySensorTypeCode(Number(dto.sensorTypeCode));
            if (conflict && conflict.id !== existing.id) {
                throw new common_1.ConflictException(`Sensor Type code ${dto.sensorTypeCode} is already taken`);
            }
        }
        return await this.repository.update(existing.id, {
            sensorTypeCode: dto.sensorTypeCode !== undefined ? Number(dto.sensorTypeCode) : existing.sensorTypeCode,
            sku: dto.sku ? dto.sku.trim().toUpperCase() : existing.sku,
            name: dto.name !== undefined ? dto.name.trim() : existing.name,
            description: dto.description !== undefined ? dto.description?.trim() : existing.description,
            defaultRegion: dto.defaultRegion !== undefined ? dto.defaultRegion.trim() : existing.defaultRegion,
            defaultClass: dto.defaultClass !== undefined ? dto.defaultClass.trim() : existing.defaultClass,
            isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
            metadata: dto.metadata || existing.metadata,
        });
    }
    async remove(id) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Sensor Type [${id}] not found`);
        }
        await this.repository.delete(existing.id);
        return {
            success: true,
            message: `Sensor Type ${existing.sensorTypeCode} (${existing.sku}) deleted successfully`,
            id: existing.id,
        };
    }
};
exports.SensorTypesService = SensorTypesService;
exports.SensorTypesService = SensorTypesService = SensorTypesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sensor_types_repository_1.SensorTypesRepository])
], SensorTypesService);
//# sourceMappingURL=sensor-types.service.js.map