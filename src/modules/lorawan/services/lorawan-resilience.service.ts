import { Injectable, Logger } from '@nestjs/common';
import * as vm from 'vm';
import { LorawanConfig, getLorawanConfig } from '../lorawan.config';
import { cleanHexPayload, isValidHex } from '../common/lorawan-utils';

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

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

@Injectable()
export class LorawanResilienceService {
  private readonly logger = new Logger(LorawanResilienceService.name);
  private readonly circuitBreakers = new Map<string, CircuitBreakerState>();

  private get config(): LorawanConfig {
    return getLorawanConfig();
  }

  // ==========================================
  // 1. CIRCUIT BREAKER CORE
  // ==========================================

  private getCircuitBreakerKey(urlOrKey: string): string {
    try {
      if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
        const u = new URL(urlOrKey);
        return `${u.protocol}//${u.host}`;
      }
    } catch (_) {}
    return urlOrKey || 'default';
  }

  isCircuitOpen(key: string): boolean {
    const cbKey = this.getCircuitBreakerKey(key);
    const cb = this.circuitBreakers.get(cbKey);
    if (!cb || cb.state === 'CLOSED') return false;

    const now = Date.now();
    if (now - cb.lastFailureTime > this.config.circuitBreakerResetMs) {
      cb.state = 'HALF_OPEN';
      this.logger.log(`Circuit breaker for [${cbKey}] transitioned to HALF_OPEN (probing...)`);
      return false;
    }

    return cb.state === 'OPEN';
  }

  recordSuccess(key: string): void {
    const cbKey = this.getCircuitBreakerKey(key);
    const cb = this.circuitBreakers.get(cbKey);
    if (cb) {
      if (cb.state !== 'CLOSED') {
        this.logger.log(`Circuit breaker for [${cbKey}] restored to CLOSED`);
      }
      cb.failures = 0;
      cb.state = 'CLOSED';
    }
  }

  recordFailure(key: string): void {
    const cbKey = this.getCircuitBreakerKey(key);
    let cb = this.circuitBreakers.get(cbKey);
    if (!cb) {
      cb = { failures: 0, lastFailureTime: 0, state: 'CLOSED' };
      this.circuitBreakers.set(cbKey, cb);
    }

    cb.failures += 1;
    cb.lastFailureTime = Date.now();

    if (cb.failures >= this.config.circuitBreakerThreshold) {
      cb.state = 'OPEN';
      this.logger.error(
        `🚨 Circuit breaker TRIPPED to OPEN for [${cbKey}] after ${cb.failures} consecutive failures. Cool down: ${this.config.circuitBreakerResetMs}ms`,
      );
    }
  }

  getCircuitBreakerStatus(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, state] of this.circuitBreakers.entries()) {
      result[key] = { ...state };
    }
    return result;
  }

  // ==========================================
  // 2. RETRY WITH EXPONENTIAL BACKOFF
  // ==========================================

  async executeWithRetry<T>(
    operationName: string,
    fn: (attempt: number) => Promise<T>,
    options?: RetryOptions,
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.config.httpMaxRetries;
    const retryDelay = options?.retryDelayMs ?? this.config.httpRetryDelayMs;
    const backoff = options?.backoffFactor ?? this.config.httpBackoffFactor;
    const cbKey = options?.circuitBreakerKey ? this.getCircuitBreakerKey(options.circuitBreakerKey) : undefined;

    if (cbKey && this.isCircuitOpen(cbKey)) {
      throw new Error(`Circuit breaker OPEN for [${cbKey}], operation '${operationName}' rejected to prevent thread lock`);
    }

    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn(attempt);
        if (cbKey) this.recordSuccess(cbKey);
        return result;
      } catch (err: any) {
        lastError = err;
        const isRetryable = options?.isRetryable ? options.isRetryable(err) : true;

        if (attempt < maxRetries && isRetryable) {
          const delay = Math.round(retryDelay * Math.pow(backoff, attempt - 1));
          this.logger.warn(
            `[${operationName}] Attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    if (cbKey) this.recordFailure(cbKey);
    throw lastError;
  }

  // ==========================================
  // 3. SAFE HTTP FETCHER (TIMEOUT + RETRY + CB)
  // ==========================================

  async safeFetch<T = any>(
    url: string,
    init: RequestInit = {},
    options?: SafeFetchOptions,
  ): Promise<SafeFetchResult<T>> {
    const timeoutMs = options?.timeoutMs ?? this.config.httpTimeoutMs;
    const maxRetries = options?.maxRetries ?? this.config.httpMaxRetries;
    const retryDelay = options?.retryDelayMs ?? this.config.httpRetryDelayMs;
    const backoff = options?.backoffFactor ?? this.config.httpBackoffFactor;
    const cbKey = options?.circuitBreakerKey || this.getCircuitBreakerKey(url);

    if (this.isCircuitOpen(cbKey)) {
      return {
        ok: false,
        status: 503,
        error: `Circuit breaker OPEN for [${cbKey}]: Upstream is unresponsive. Aborting to protect resources.`,
        attempts: 0,
      };
    }

    let lastStatus = 0;
    let lastError = '';
    let lastHeaders: Record<string, string> = {};

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort(`Request timed out after ${timeoutMs}ms`);
      }, timeoutMs);

      try {
        const fetchInit: RequestInit = {
          ...init,
          signal: controller.signal,
        };

        const res = await fetch(url, fetchInit);
        clearTimeout(timer);

        lastStatus = res.status;
        res.headers.forEach((val, key) => {
          lastHeaders[key] = val;
        });

        // Parse response body
        let parsedData: any;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          parsedData = await res.json().catch(() => null);
        } else {
          parsedData = await res.text().catch(() => '');
        }

        if (res.ok) {
          this.recordSuccess(cbKey);
          return {
            ok: true,
            status: res.status,
            data: parsedData,
            headers: lastHeaders,
            attempts: attempt,
          };
        }

        // Handle HTTP error responses
        lastError = typeof parsedData === 'string' ? parsedData : (parsedData?.error || parsedData?.message || `HTTP ${res.status}`);

        // Client errors (400, 401, 403, 404, 409) are typically not retryable
        const isClientError = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;
        if (isClientError) {
          return {
            ok: false,
            status: res.status,
            data: parsedData,
            error: lastError,
            headers: lastHeaders,
            attempts: attempt,
          };
        }

        // Server errors (500, 502, 503, 504) or rate limits (429) -> retry
        if (attempt < maxRetries) {
          const delay = Math.round(retryDelay * Math.pow(backoff, attempt - 1));
          this.logger.warn(`safeFetch [${url}] HTTP ${res.status}: ${lastError}. Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } catch (err: any) {
        clearTimeout(timer);
        lastStatus = 0;
        lastError = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || 'Network fetch failed');

        if (attempt < maxRetries) {
          const delay = Math.round(retryDelay * Math.pow(backoff, attempt - 1));
          this.logger.warn(`safeFetch [${url}] Network error: ${lastError}. Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    this.recordFailure(cbKey);
    return {
      ok: false,
      status: lastStatus || 500,
      error: lastError || 'Request failed after maximum retries',
      headers: lastHeaders,
      attempts: maxRetries,
    };
  }

  // ==========================================
  // 4. SAFE PAYLOAD DECODER (ISOLATED VM + TIMEOUT + RETRY)
  // ==========================================

  safeDecodePayload<T = any>(
    script: string,
    hexBytes: string,
    fPort: number = 1,
    options?: { timeoutMs?: number; maxRetries?: number },
  ): DecodeResult<T> {
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs ?? this.config.decodeTimeoutMs;
    const maxRetries = options?.maxRetries ?? this.config.decodeMaxRetries;

    const cleanHex = cleanHexPayload(hexBytes);
    if (!cleanHex || !isValidHex(cleanHex)) {
      return {
        success: false,
        error: `Invalid Hex payload: must be non-empty and even length (got: '${hexBytes}')`,
        executionTimeMs: Date.now() - startTime,
        attempts: 1,
      };
    }

    const bytes = Array.from(Buffer.from(cleanHex, 'hex'));
    const input = Object.freeze({
      bytes,
      fPort: Number(fPort) || 1,
    });

    const fullScript = `
      ${script}
      if (typeof decodeUplink === 'function') {
        result = decodeUplink(input);
      } else if (typeof Decoder === 'function') {
        result = Decoder(input.bytes, input.fPort);
      } else {
        throw new Error('No valid decode function found. Define decodeUplink(input) or Decoder(bytes, fPort)');
      }
    `;

    let lastError = '';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const sandbox = {
          input,
          bytes,
          fPort: Number(fPort) || 1,
          console: {
            log: () => {},
            warn: () => {},
            error: () => {},
          },
          result: null as any,
        };

        const context = vm.createContext(sandbox);
        const vmScript = new vm.Script(fullScript);
        vmScript.runInContext(context, { timeout: timeoutMs });

        return {
          success: true,
          data: sandbox.result as T,
          executionTimeMs: Date.now() - startTime,
          attempts: attempt,
        };
      } catch (err: any) {
        lastError = err?.message || 'VM execution failed';
        // Timeout errors or syntax errors in user script are not transient; no need to loop all 3 times
        const isTransient = lastError.includes('out of memory') || lastError.includes('allocation');
        if (!isTransient) {
          break;
        }
      }
    }

    return {
      success: false,
      error: `Decoder execution failed: ${lastError}`,
      executionTimeMs: Date.now() - startTime,
      attempts: 1,
    };
  }

  // ==========================================
  // 5. JAVASCRIPT SYNTAX VALIDATOR
  // ==========================================

  validateJavaScript(code: string): { valid: boolean; error?: string } {
    if (!code || !code.trim()) {
      return { valid: false, error: 'JavaScript code must not be empty' };
    }
    try {
      new vm.Script(code);
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: `JavaScript syntax error: ${err.message}` };
    }
  }
}
