import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { SensorTypeEntity } from './entities/sensor-type.entity';
import { QuerySensorTypeDto } from './dto/sensor-type.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class SensorTypesRepository {
  private readonly logger = new Logger(SensorTypesRepository.name);

  constructor(private readonly dbService: DynamicDatabaseService) {}

  public getRepo(): Repository<SensorTypeEntity> {
    return this.dbService.getRepositoryForTable('sensor_types', SensorTypeEntity);
  }

  public async findWithPagination(query: QuerySensorTypeDto): Promise<{
    data: SensorTypeEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const qb = this.getRepo()
      .createQueryBuilder('st')
      .orderBy('st.sensorTypeCode', 'ASC')
      .skip(skip)
      .take(limit);

    if (query.search && query.search.trim() !== '') {
      const searchPattern = `%${query.search.trim()}%`;
      const isNum = !isNaN(Number(query.search.trim()));
      if (isNum) {
        qb.andWhere(
          '(st.sensorTypeCode = :numSearch OR st.sku ILIKE :search OR st.name ILIKE :search)',
          { numSearch: Number(query.search.trim()), search: searchPattern },
        );
      } else {
        qb.andWhere(
          '(st.sku ILIKE :search OR st.name ILIKE :search OR st.description ILIKE :search)',
          { search: searchPattern },
        );
      }
    }

    if (query.isActive !== undefined && query.isActive !== '') {
      const activeBool = query.isActive === true || query.isActive === 'true';
      qb.andWhere('st.isActive = :isActive', { isActive: activeBool });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async findById(id: string): Promise<SensorTypeEntity | null> {
    if (!id) return null;
    return await this.getRepo().findOne({ where: { id } });
  }

  public async findBySensorTypeCode(code: number): Promise<SensorTypeEntity | null> {
    if (code === undefined || code === null) return null;
    return await this.getRepo().findOne({ where: { sensorTypeCode: code } });
  }

  public async findBySku(sku: string): Promise<SensorTypeEntity | null> {
    if (!sku) return null;
    return await this.getRepo().findOne({ where: { sku: sku.trim().toUpperCase() } });
  }

  public async create(data: Partial<SensorTypeEntity>): Promise<SensorTypeEntity> {
    const entity = this.getRepo().create(data);
    return await this.getRepo().save(entity);
  }

  public async update(id: string, data: Partial<SensorTypeEntity>): Promise<SensorTypeEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sensor Type [${id}] not found`);
    }
    Object.assign(existing, {
      ...data,
      updatedAt: new Date(),
    });
    return await this.getRepo().save(existing);
  }

  public async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sensor Type [${id}] not found`);
    }
    await this.getRepo().remove(existing);
    return true;
  }
}
