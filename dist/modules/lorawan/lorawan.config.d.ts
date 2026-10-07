export interface LorawanConfig {
    httpTimeoutMs: number;
    httpMaxRetries: number;
    httpRetryDelayMs: number;
    httpBackoffFactor: number;
    decodeTimeoutMs: number;
    decodeMaxRetries: number;
    circuitBreakerThreshold: number;
    circuitBreakerResetMs: number;
}
export declare const defaultLorawanConfig: LorawanConfig;
export declare function getLorawanConfig(): LorawanConfig;
export declare function updateLorawanConfig(partial: Partial<LorawanConfig>): LorawanConfig;
export declare function resetLorawanConfig(): LorawanConfig;
