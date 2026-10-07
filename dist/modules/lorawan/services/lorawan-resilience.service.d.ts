export interface RetryOptions {
    maxRetries?: number;
    retryDelayMs?: number;
    backoffFactor?: number;
    circuitBreakerKey?: string;
    isRetryable?: (error: any) => boolean;
}
export interface SafeFetchOptions extends RetryOptions {
    timeoutMs?: number;
}
export interface SafeFetchResult<T = any> {
    ok: boolean;
    status: number;
    data?: T;
    error?: string;
    headers?: Record<string, string>;
    attempts: number;
}
export interface DecodeResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    executionTimeMs: number;
    attempts: number;
}
export declare class LorawanResilienceService {
    private readonly logger;
    private readonly circuitBreakers;
    private get config();
    private getCircuitBreakerKey;
    isCircuitOpen(key: string): boolean;
    recordSuccess(key: string): void;
    recordFailure(key: string): void;
    getCircuitBreakerStatus(): Record<string, any>;
    executeWithRetry<T>(operationName: string, fn: (attempt: number) => Promise<T>, options?: RetryOptions): Promise<T>;
    safeFetch<T = any>(url: string, init?: RequestInit, options?: SafeFetchOptions): Promise<SafeFetchResult<T>>;
    safeDecodePayload<T = any>(script: string, hexBytes: string, fPort?: number, options?: {
        timeoutMs?: number;
        maxRetries?: number;
    }): DecodeResult<T>;
    validateJavaScript(code: string): {
        valid: boolean;
        error?: string;
    };
}
