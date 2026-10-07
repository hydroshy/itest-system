export declare class CreateSensorTypeDto {
    sensorTypeCode: number;
    sku: string;
    name: string;
    description?: string;
    defaultRegion?: string;
    defaultClass?: string;
    isActive?: boolean;
    metadata?: Record<string, any>;
}
export declare class UpdateSensorTypeDto {
    sensorTypeCode?: number;
    sku?: string;
    name?: string;
    description?: string;
    defaultRegion?: string;
    defaultClass?: string;
    isActive?: boolean;
    metadata?: Record<string, any>;
}
export declare class QuerySensorTypeDto {
    search?: string;
    isActive?: boolean | string;
    page?: number;
    limit?: number;
}
