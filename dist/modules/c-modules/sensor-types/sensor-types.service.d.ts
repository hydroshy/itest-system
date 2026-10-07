import { OnModuleInit } from '@nestjs/common';
import { SensorTypesRepository } from './sensor-types.repository';
import { SensorTypeEntity } from './entities/sensor-type.entity';
import { CreateSensorTypeDto, UpdateSensorTypeDto, QuerySensorTypeDto } from './dto/sensor-type.dto';
export declare class SensorTypesService implements OnModuleInit {
    private readonly repository;
    private readonly logger;
    constructor(repository: SensorTypesRepository);
    onModuleInit(): Promise<void>;
    private initDatabaseTable;
    findAll(query: QuerySensorTypeDto): Promise<{
        data: SensorTypeEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<SensorTypeEntity>;
    resolveSku(code: number): Promise<{
        found: boolean;
        sensorTypeCode: number;
        sku?: string;
        name?: string;
        defaultRegion?: string;
        defaultClass?: string;
    }>;
    create(dto: CreateSensorTypeDto): Promise<SensorTypeEntity>;
    update(id: string, dto: UpdateSensorTypeDto): Promise<SensorTypeEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    }>;
}
