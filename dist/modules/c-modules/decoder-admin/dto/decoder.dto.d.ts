export declare class CreateDecoderDto {
    sku: string;
    firmwareVersion: number;
    decoderCode: string;
    description?: string;
}
export declare class UpdateDecoderDto {
    decoderCode?: string;
    description?: string;
}
export declare class TestDecoderDto {
    code: string;
    hex: string;
    fPort?: number;
}
