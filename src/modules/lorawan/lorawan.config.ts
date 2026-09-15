/**
 * LoRaWAN Platform Central Resilience & Timeout Configuration
 * Single source of truth for retry limits, timeouts, and circuit breaker parameters.
 * Can be overridden via environment variables or runtime update.
 */

export interface LorawanConfig {
  /** HTTP request timeout in milliseconds for Network Server calls (default: 8000ms) */
  httpTimeoutMs: number;
  /** Maximum retry attempts for transient upstream network calls (default: 3) */
  httpMaxRetries: number;
  /** Initial delay before first retry in milliseconds (default: 1000ms) */
  httpRetryDelayMs: number;
  /** Backoff multiplier for consecutive retries (default: 1.5) */
  httpBackoffFactor: number;
  /** VM payload script execution timeout in milliseconds (default: 2000ms) */
  decodeTimeoutMs: number;
  /** Maximum retry attempts for transient VM execution errors (default: 3) */
  decodeMaxRetries: number;
  /** Number of consecutive failures to trip circuit breaker for an upstream host (default: 5) */
  circuitBreakerThreshold: number;
  /** Duration in milliseconds that circuit breaker stays OPEN before probing (default: 30000ms) */
  circuitBreakerResetMs: number;
}

export const defaultLorawanConfig: LorawanConfig = {
  httpTimeoutMs: Number(process.env.LORAWAN_HTTP_TIMEOUT_MS) || 8000,
  httpMaxRetries: Number(process.env.LORAWAN_HTTP_MAX_RETRIES) || 3,
  httpRetryDelayMs: Number(process.env.LORAWAN_HTTP_RETRY_DELAY_MS) || 1000,
  httpBackoffFactor: Number(process.env.LORAWAN_HTTP_BACKOFF_FACTOR) || 1.5,
  decodeTimeoutMs: Number(process.env.LORAWAN_DECODE_TIMEOUT_MS) || 2000,
  decodeMaxRetries: Number(process.env.LORAWAN_DECODE_MAX_RETRIES) || 3,
  circuitBreakerThreshold: Number(process.env.LORAWAN_CB_THRESHOLD) || 5,
  circuitBreakerResetMs: Number(process.env.LORAWAN_CB_RESET_MS) || 30000,
};

let currentLorawanConfig: LorawanConfig = { ...defaultLorawanConfig };

export function getLorawanConfig(): LorawanConfig {
  return currentLorawanConfig;
}

export function updateLorawanConfig(partial: Partial<LorawanConfig>): LorawanConfig {
  currentLorawanConfig = { ...currentLorawanConfig, ...partial };
  return currentLorawanConfig;
}

export function resetLorawanConfig(): LorawanConfig {
  currentLorawanConfig = { ...defaultLorawanConfig };
  return currentLorawanConfig;
}
