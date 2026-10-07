import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { SensorTypeEntity } from './entities/sensor-type.entity';
import { QuerySensorTypeDto } from './dto/sensor-type.dto';
export declare class SensorTypesRepository {
    private readonly dbService;
    private readonly logger;
    constructor(dbService: DynamicDatabaseService);
    getRepo(): Repository<SensorTypeEntity>;
    findWithPagination(query: QuerySensorTypeDto): Promise<{
        data: SensorTypeEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<SensorTypeEntity | null>;
    findBySensorTypeCode(code: number): Promise<SensorTypeEntity | null>;
    findBySku(sku: string): Promise<SensorTypeEntity | null>;
    create(data: Partial<SensorTypeEntity>): Promise<SensorTypeEntity>;
    update(id: string, data: Partial<SensorTypeEntity>): Promise<SensorTypeEntity>;
    delete(id: string): Promise<boolean>;
}
