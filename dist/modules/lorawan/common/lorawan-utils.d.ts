export declare function cleanDevEUI(raw?: string | null): string;
export declare function isValidDevEUI(eui?: string | null): boolean;
export declare function cleanFirmwareVersion(val?: string | number | null): string;
export declare function cleanSku(val?: string | null): string;
export declare function resolveDecoderId(sku?: string | null, firmwareVersion?: string | number | null): string | null;
export declare function cleanHexPayload(hex?: string | null): string;
export declare function isValidHex(hex?: string | null): boolean;
export declare function calculateHexBytes(hex?: string | null): number;
export declare function formatDevEUI(eui?: string | null, separator?: string): string;
