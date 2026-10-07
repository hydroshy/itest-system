import { SensorTypesService } from './sensor-types.service';
import { CreateSensorTypeDto, UpdateSensorTypeDto, QuerySensorTypeDto } from './dto/sensor-type.dto';
export declare class SensorTypesController {
    private readonly service;
    constructor(service: SensorTypesService);
    findAll(query: QuerySensorTypeDto): Promise<{
        data: import(".").SensorTypeEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    resolveSku(code: number): Promise<{
        found: boolean;
        sensorTypeCode: number;
        sku?: string;
        name?: string;
        defaultRegion?: string;
        defaultClass?: string;
    }>;
    findOne(id: string): Promise<import(".").SensorTypeEntity>;
    create(dto: CreateSensorTypeDto): Promise<import(".").SensorTypeEntity>;
    update(id: string, dto: UpdateSensorTypeDto): Promise<import(".").SensorTypeEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
        id: string;
    }>;
}
