/**
 * Shared LoRaWAN Core Utility Functions
 * Reusable across device fleet, downlink, decoder admin, provisioning, and webhooks.
 */

/**
 * Normalize DevEUI to 16 hex characters uppercase.
 * Removes spaces, colons, dashes, and non-hex characters.
 */
export function cleanDevEUI(raw?: string | null): string {
  if (!raw) return '';
  return String(raw).trim().replace(/[^0-9a-fA-F]/g, '').toUpperCase();
}

/**
 * Validate DevEUI format (must be exactly 16 hex characters).
 */
export function isValidDevEUI(eui?: string | null): boolean {
  if (!eui) return false;
  return /^[0-9A-F]{16}$/.test(cleanDevEUI(eui));
}

/**
 * Normalize firmware version string (digits only, strips leading 'v' or 'V').
 */
export function cleanFirmwareVersion(val?: string | number | null): string {
  if (val === undefined || val === null) return '';
  return String(val).trim().replace(/^[vV]/, '').trim();
}

/**
 * Clean and normalize SKU code (trimmed, uppercase).
 */
export function cleanSku(val?: string | null): string {
  if (!val) return '';
  return String(val).trim().toUpperCase();
}

/**
 * Resolve standardized composite decoder ID: `${SKU}_${FIRMWARE_VERSION}`.
 */
export function resolveDecoderId(sku?: string | null, firmwareVersion?: string | number | null): string | null {
  const cSku = cleanSku(sku);
  const cFw = cleanFirmwareVersion(firmwareVersion);
  if (!cSku || !cFw) return null;
  return `${cSku}_${cFw}`;
}

/**
 * Normalize Hex payload: strips whitespace, non-hex characters, uppercase.
 */
export function cleanHexPayload(hex?: string | null): string {
  if (!hex) return '';
  return String(hex).trim().replace(/[^0-9a-fA-F]/g, '').toUpperCase();
}

/**
 * Validate Hex string: must be even length and valid hex chars.
 */
export function isValidHex(hex?: string | null): boolean {
  if (!hex) return false;
  const clean = cleanHexPayload(hex);
  return clean.length > 0 && clean.length % 2 === 0;
}

/**
 * Calculate byte count from hex string.
 */
export function calculateHexBytes(hex?: string | null): number {
  const clean = cleanHexPayload(hex);
  return Math.ceil(clean.length / 2);
}

/**
 * Format DevEUI with separator (e.g. "00-11-22-33-44-55-66-77").
 */
export function formatDevEUI(eui?: string | null, separator: string = '-'): string {
  const clean = cleanDevEUI(eui);
  if (clean.length !== 16) return clean;
  return clean.match(/.{1,2}/g)?.join(separator) || clean;
}
