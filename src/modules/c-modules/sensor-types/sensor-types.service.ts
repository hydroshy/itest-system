import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { SensorTypesRepository } from './sensor-types.repository';
import { SensorTypeEntity } from './entities/sensor-type.entity';
import {
  CreateSensorTypeDto,
  UpdateSensorTypeDto,
  QuerySensorTypeDto,
} from './dto/sensor-type.dto';

@Injectable()
export class SensorTypesService implements OnModuleInit {
  private readonly logger = new Logger(SensorTypesService.name);

  constructor(private readonly repository: SensorTypesRepository) {}

  async onModuleInit() {
    await this.initDatabaseTable();
  }

  private async initDatabaseTable() {
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

        // Check if seed data exists
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
    } catch (err: any) {
      this.logger.debug(`initDatabaseTable note: ${err.message}`);
    }
  }

  public async findAll(query: QuerySensorTypeDto) {
    return await this.repository.findWithPagination(query);
  }

  public async findOne(id: string): Promise<SensorTypeEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException(`Sensor Type [${id}] not found`);
    }
    return item;
  }

  public async resolveSku(code: number): Promise<{
    found: boolean;
    sensorTypeCode: number;
    sku?: string;
    name?: string;
    defaultRegion?: string;
    defaultClass?: string;
  }> {
    const item = await this.repository.findBySensorTypeCode(code);
    if (!item) {
      // Fallback for well-known defaults
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

  public async create(dto: CreateSensorTypeDto): Promise<SensorTypeEntity> {
    const code = Number(dto.sensorTypeCode);
    if (isNaN(code) || code < 1 || code > 255) {
      throw new BadRequestException('sensorTypeCode must be a valid integer between 1 and 255');
    }

    const existingCode = await this.repository.findBySensorTypeCode(code);
    if (existingCode) {
      throw new ConflictException(`Sensor Type code ${code} is already registered (${existingCode.sku})`);
    }

    const sku = (dto.sku || '').trim().toUpperCase();
    if (!sku) {
      throw new BadRequestException('Hardware SKU is required');
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

  public async update(id: string, dto: UpdateSensorTypeDto): Promise<SensorTypeEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sensor Type [${id}] not found`);
    }

    if (dto.sensorTypeCode !== undefined && Number(dto.sensorTypeCode) !== existing.sensorTypeCode) {
      const conflict = await this.repository.findBySensorTypeCode(Number(dto.sensorTypeCode));
      if (conflict && conflict.id !== existing.id) {
        throw new ConflictException(`Sensor Type code ${dto.sensorTypeCode} is already taken`);
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

  public async remove(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sensor Type [${id}] not found`);
    }

    await this.repository.delete(existing.id);
    return {
      success: true,
      message: `Sensor Type ${existing.sensorTypeCode} (${existing.sku}) deleted successfully`,
      id: existing.id,
    };
  }
}
