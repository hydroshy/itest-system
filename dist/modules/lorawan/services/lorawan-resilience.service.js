"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LorawanResilienceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LorawanResilienceService = void 0;
const common_1 = require("@nestjs/common");
const vm = require("vm");
const lorawan_config_1 = require("../lorawan.config");
const lorawan_utils_1 = require("../common/lorawan-utils");
let LorawanResilienceService = LorawanResilienceService_1 = class LorawanResilienceService {
    constructor() {
        this.logger = new common_1.Logger(LorawanResilienceService_1.name);
        this.circuitBreakers = new Map();
    }
    get config() {
        return (0, lorawan_config_1.getLorawanConfig)();
    }
    getCircuitBreakerKey(urlOrKey) {
        try {
            if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
                const u = new URL(urlOrKey);
                return `${u.protocol}//${u.host}`;
            }
        }
        catch (_) { }
        return urlOrKey || 'default';
    }
    isCircuitOpen(key) {
        const cbKey = this.getCircuitBreakerKey(key);
        const cb = this.circuitBreakers.get(cbKey);
        if (!cb || cb.state === 'CLOSED')
            return false;
        const now = Date.now();
        if (now - cb.lastFailureTime > this.config.circuitBreakerResetMs) {
            cb.state = 'HALF_OPEN';
            this.logger.log(`Circuit breaker for [${cbKey}] transitioned to HALF_OPEN (probing...)`);
            return false;
        }
        return cb.state === 'OPEN';
    }
    recordSuccess(key) {
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
    recordFailure(key) {
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
            this.logger.error(`🚨 Circuit breaker TRIPPED to OPEN for [${cbKey}] after ${cb.failures} consecutive failures. Cool down: ${this.config.circuitBreakerResetMs}ms`);
        }
    }
    getCircuitBreakerStatus() {
        const result = {};
        for (const [key, state] of this.circuitBreakers.entries()) {
            result[key] = { ...state };
        }
        return result;
    }
    async executeWithRetry(operationName, fn, options) {
        const maxRetries = options?.maxRetries ?? this.config.httpMaxRetries;
        const retryDelay = options?.retryDelayMs ?? this.config.httpRetryDelayMs;
        const backoff = options?.backoffFactor ?? this.config.httpBackoffFactor;
        const cbKey = options?.circuitBreakerKey ? this.getCircuitBreakerKey(options.circuitBreakerKey) : undefined;
        if (cbKey && this.isCircuitOpen(cbKey)) {
            throw new Error(`Circuit breaker OPEN for [${cbKey}], operation '${operationName}' rejected to prevent thread lock`);
        }
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await fn(attempt);
                if (cbKey)
                    this.recordSuccess(cbKey);
                return result;
            }
            catch (err) {
                lastError = err;
                const isRetryable = options?.isRetryable ? options.isRetryable(err) : true;
                if (attempt < maxRetries && isRetryable) {
                    const delay = Math.round(retryDelay * Math.pow(backoff, attempt - 1));
                    this.logger.warn(`[${operationName}] Attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    break;
                }
            }
        }
        if (cbKey)
            this.recordFailure(cbKey);
        throw lastError;
    }
    async safeFetch(url, init = {}, options) {
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
        let lastHeaders = {};
        let lastData = undefined;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => {
                controller.abort(`Request timed out after ${timeoutMs}ms`);
            }, timeoutMs);
            try {
                const fetchInit = {
                    ...init,
                    signal: controller.signal,
                };
                const res = await fetch(url, fetchInit);
                clearTimeout(timer);
                lastStatus = res.status;
                res.headers.forEach((val, key) => {
                    lastHeaders[key] = val;
                });
                let parsedData;
                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    parsedData = await res.json().catch(() => null);
                }
                else {
                    parsedData = await res.text().catch(() => '');
                }
                lastData = parsedData;
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
                lastError = typeof parsedData === 'string' ? parsedData : (parsedData?.error || parsedData?.message || `HTTP ${res.status}`);
                const isClientError = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;
                const errLower = (String(lastError) + ' ' + JSON.stringify(parsedData || '')).toLowerCase();
                const isDuplicateKeyError = errLower.includes('duplicate key') ||
                    errLower.includes('device_pkey') ||
                    errLower.includes('unique constraint') ||
                    errLower.includes('already exists');
                if (isClientError || isDuplicateKeyError) {
                    return {
                        ok: false,
                        status: isDuplicateKeyError ? 409 : res.status,
                        data: parsedData,
                        error: lastError,
                        headers: lastHeaders,
                        attempts: attempt,
                    };
                }
                if (attempt < maxRetries) {
                    const delay = Math.round(retryDelay * Math.pow(backoff, attempt - 1));
                    this.logger.warn(`safeFetch [${url}] HTTP ${res.status}: ${lastError}. Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }
            catch (err) {
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
            data: lastData,
            error: lastError || 'Request failed after maximum retries',
            headers: lastHeaders,
            attempts: maxRetries,
        };
    }
    safeDecodePayload(script, hexBytes, fPort = 1, options) {
        const startTime = Date.now();
        const timeoutMs = options?.timeoutMs ?? this.config.decodeTimeoutMs;
        const maxRetries = options?.maxRetries ?? this.config.decodeMaxRetries;
        const cleanHex = (0, lorawan_utils_1.cleanHexPayload)(hexBytes);
        if (!cleanHex || !(0, lorawan_utils_1.isValidHex)(cleanHex)) {
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
                        log: () => { },
                        warn: () => { },
                        error: () => { },
                    },
                    result: null,
                };
                const context = vm.createContext(sandbox);
                const vmScript = new vm.Script(fullScript);
                vmScript.runInContext(context, { timeout: timeoutMs });
                return {
                    success: true,
                    data: sandbox.result,
                    executionTimeMs: Date.now() - startTime,
                    attempts: attempt,
                };
            }
            catch (err) {
                lastError = err?.message || 'VM execution failed';
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
    validateJavaScript(code) {
        if (!code || !code.trim()) {
            return { valid: false, error: 'JavaScript code must not be empty' };
        }
        try {
            new vm.Script(code);
            return { valid: true };
        }
        catch (err) {
            return { valid: false, error: `JavaScript syntax error: ${err.message}` };
        }
    }
};
exports.LorawanResilienceService = LorawanResilienceService;
exports.LorawanResilienceService = LorawanResilienceService = LorawanResilienceService_1 = __decorate([
    (0, common_1.Injectable)()
], LorawanResilienceService);
//# sourceMappingURL=lorawan-resilience.service.js.map