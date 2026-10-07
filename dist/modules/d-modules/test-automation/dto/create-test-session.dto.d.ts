export declare class CreateTestSessionDto {
    sessionCode?: string;
    soCode: string;
    itemCode: string;
    templateId?: string;
    devEUIs: string[] | string;
    notes?: string;
    autoStart?: boolean;
    metadata?: Record<string, any>;
    sku?: string;
    firmwareVersion?: string;
}
