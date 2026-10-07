"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLorawanConfig = void 0;
exports.getLorawanConfig = getLorawanConfig;
exports.updateLorawanConfig = updateLorawanConfig;
exports.resetLorawanConfig = resetLorawanConfig;
exports.defaultLorawanConfig = {
    httpTimeoutMs: Number(process.env.LORAWAN_HTTP_TIMEOUT_MS) || 8000,
    httpMaxRetries: Number(process.env.LORAWAN_HTTP_MAX_RETRIES) || 3,
    httpRetryDelayMs: Number(process.env.LORAWAN_HTTP_RETRY_DELAY_MS) || 1000,
    httpBackoffFactor: Number(process.env.LORAWAN_HTTP_BACKOFF_FACTOR) || 1.5,
    decodeTimeoutMs: Number(process.env.LORAWAN_DECODE_TIMEOUT_MS) || 2000,
    decodeMaxRetries: Number(process.env.LORAWAN_DECODE_MAX_RETRIES) || 3,
    circuitBreakerThreshold: Number(process.env.LORAWAN_CB_THRESHOLD) || 5,
    circuitBreakerResetMs: Number(process.env.LORAWAN_CB_RESET_MS) || 30000,
};
let currentLorawanConfig = { ...exports.defaultLorawanConfig };
function getLorawanConfig() {
    return currentLorawanConfig;
}
function updateLorawanConfig(partial) {
    currentLorawanConfig = { ...currentLorawanConfig, ...partial };
    return currentLorawanConfig;
}
function resetLorawanConfig() {
    currentLorawanConfig = { ...exports.defaultLorawanConfig };
    return currentLorawanConfig;
}
//# sourceMappingURL=lorawan.config.js.map