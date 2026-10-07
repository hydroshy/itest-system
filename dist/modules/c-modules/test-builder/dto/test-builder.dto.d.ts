export declare class CreateAssertionDto {
    fieldName: string;
    fieldLabel?: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN_RANGE' | 'BETWEEN' | 'REGEX' | 'IS_NOT_NULL' | 'CONTAINS';
    expectedValue?: any;
    tolerance?: number;
    unit?: string;
    severity?: 'ERROR' | 'WARNING';
    orderIndex?: number;
    description?: string;
}
export declare class CreateTestTemplateDto {
    name: string;
    code: string;
    description?: string;
    sku: string;
    firmwareVersion: string;
    executionMode?: 'FLOW' | 'SCRIPT' | 'HYBRID';
    flowConfig?: Record<string, any>;
    customScript?: string;
    timeoutSeconds?: number;
    minPacketsRequired?: number;
    isActive?: boolean;
    metadata?: Record<string, any>;
    assertions?: CreateAssertionDto[];
}
export declare class UpdateTestTemplateDto {
    name?: string;
    description?: string;
    sku?: string;
    firmwareVersion?: string;
    executionMode?: 'FLOW' | 'SCRIPT' | 'HYBRID';
    flowConfig?: Record<string, any>;
    customScript?: string;
    timeoutSeconds?: number;
    minPacketsRequired?: number;
    isActive?: boolean;
    metadata?: Record<string, any>;
    assertions?: CreateAssertionDto[];
}
export declare class DryRunTestDto {
    templateId?: string;
    executionMode?: 'FLOW' | 'SCRIPT' | 'HYBRID';
    assertions?: CreateAssertionDto[];
    customScript?: string;
    mockPacket: {
        RSSI?: number;
        SNR?: number;
        FPORT?: number;
        FCNT?: number;
        fPort?: number;
        fport?: number;
        fCnt?: number;
        fcnt?: number;
        rssi?: number;
        snr?: number;
        payloadHex?: string;
        decoded?: Record<string, any>;
        decodedData?: Record<string, any>;
        [key: string]: any;
    };
    flowConfig?: Record<string, any>;
    context?: {
        packetCount?: number;
        minPackets?: number;
        durationSeconds?: number;
        buffer?: Record<string, number[]>;
        referenceDevices?: Record<string, any>;
        goldenUnit?: Record<string, any>;
        [key: string]: any;
    };
}
export declare class ValidateFlowDto {
    flowConfig: Record<string, any>;
}
export declare class ExecuteFlowDto {
    flowConfig: Record<string, any>;
    mockPacket?: Record<string, any>;
    context?: Record<string, any>;
}
export declare class ExtractDecoderFieldsDto {
    decoderCode: string;
}
