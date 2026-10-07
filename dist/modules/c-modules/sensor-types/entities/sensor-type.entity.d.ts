export declare class SensorTypeEntity {
    id: string;
    sensorTypeCode: number;
    sku: string;
    name: string;
    description?: string;
    defaultRegion: string;
    defaultClass: string;
    isActive: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
