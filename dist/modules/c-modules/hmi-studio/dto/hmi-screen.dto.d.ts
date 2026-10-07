import { CanvasConfig, HmiWidget } from '../entities/hmi-screen.entity';
export declare class CreateHmiScreenDto {
    id?: string;
    name: string;
    description?: string;
    canvasConfig?: CanvasConfig;
    widgets?: HmiWidget[];
    isPublished?: boolean;
    allowedRoles?: string[];
}
export declare class UpdateHmiScreenDto {
    name?: string;
    description?: string;
    canvasConfig?: CanvasConfig;
    widgets?: HmiWidget[];
    isPublished?: boolean;
    allowedRoles?: string[];
}
export declare class CloneHmiScreenDto {
    name?: string;
}
export declare class PublishHmiScreenDto {
    isPublished: boolean;
}
