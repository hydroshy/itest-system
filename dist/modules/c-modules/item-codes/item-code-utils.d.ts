export declare const SO_CODE_REGEX: RegExp;
export declare const STRICT_SO_CODE_REGEX: RegExp;
export declare function sanitizeFirmwareVersion(rawFw?: string | null): string;
export declare function formatSkuFw(sku: string, rawFw?: string | null): string;
export declare function isValidFirmwareVersion(fw?: string | null): boolean;
export declare function isValidSkuFw(skuFw?: string | null): boolean;
export declare function isValidSoCode(soCode?: string | null): boolean;
export declare function normalizeSoCode(rawSoCode: string, defaultYear?: number): string;
