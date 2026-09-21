/**
 * Pure Utility Helpers for Item Codes & Sales Order Standardization
 * Implements Specification Section 4:
 * - SKU_FW format: <SKU>_<FW> (Strictly no 'v' prefix, e.g. WSLRW-ATH_6)
 * - SO Code format: SO/<YYYY>/<xxxxx> with legacy normalizer
 */

export const SO_CODE_REGEX = /^SO\/\d{4}\/[A-Za-z0-9_-]+$/;
export const STRICT_SO_CODE_REGEX = /^SO\/\d{4}\/\d{5}$/;

/**
 * Strips any leading 'v' or 'V' and trailing '.0' segments repeatedly.
 * Defaults to '1' if empty or invalid.
 * Examples: 'v6' -> '6', 'V1.4' -> '1.4', '1.0' -> '1', '2.0.0' -> '2', '1.4.0' -> '1.4', '' -> '1'
 */
export function sanitizeFirmwareVersion(rawFw?: string | null): string {
  if (!rawFw || typeof rawFw !== 'string' || rawFw.trim() === '') {
    return '1';
  }
  let clean = rawFw.trim().replace(/^[vV]+/, '');
  clean = clean.replace(/(?:\.0)+$/, '');
  return clean.length > 0 ? clean : '1';
}

/**
 * Builds the canonical SKU_FW string.
 * Example: formatSkuFw('WSLRW-ATH', '6')   -> 'WSLRW-ATH_6'
 * Example: formatSkuFw('WSLRW-CO2', '2.0') -> 'WSLRW-CO2_2'
 * Example: formatSkuFw('WSLRW-STC', '1.0') -> 'WSLRW-STC_1'
 * Example: formatSkuFw('WSLRW-CLW', '1.4') -> 'WSLRW-CLW_1.4'
 */
export function formatSkuFw(sku: string, rawFw?: string | null): string {
  const cleanSku = (sku || '').trim().toUpperCase();
  const cleanFw = sanitizeFirmwareVersion(rawFw);
  return `${cleanSku}_${cleanFw}`;
}

/**
 * Validates whether firmwareVersion is clean (no 'v' prefix, no trailing '.0').
 * Valid: '6', '1.4', '2.1'
 * Invalid: 'v6', 'V1.4', '1.0', '2.0.0', 'abc', ''
 */
export function isValidFirmwareVersion(fw?: string | null): boolean {
  if (!fw || typeof fw !== 'string') return false;
  const trimmed = fw.trim();
  if (!/^[0-9]+(\.[0-9]+)*$/.test(trimmed)) return false;
  return !/(?:\.0)+$/.test(trimmed);
}

/**
 * Validates canonical SKU_FW string: <SKU>_<cleanFw>
 * Valid: 'WSLRW-ATH_6', 'WSLRW-CO2_2', 'WSLRW-CLW_1.4'
 * Invalid: 'WSLRW-ATH_6.0', 'WSLRW-CO2_v2', 'WSLRW-STC_1.0', 'wslrw-ath_6'
 */
export function isValidSkuFw(skuFw?: string | null): boolean {
  if (!skuFw || typeof skuFw !== 'string') return false;
  const trimmed = skuFw.trim();
  if (!/^[A-Z0-9_-]+_[0-9]+(\.[0-9]+)*$/.test(trimmed)) return false;
  return !/(?:\.0)+$/.test(trimmed);
}

/**
 * Validates whether soCode adheres to the canonical standard format: SO/<YYYY>/<xxxxx>
 */
export function isValidSoCode(soCode?: string | null): boolean {
  if (!soCode || typeof soCode !== 'string') return false;
  return SO_CODE_REGEX.test(soCode.trim());
}

/**
 * Normalizes input SO code to standard format SO/YYYY/xxxxx
 * - "SO/2026/00001" -> "SO/2026/00001" (unchanged)
 * - "SO-2026-001"   -> "SO/2026/00001" (normalized)
 * - "SO-2026-42"    -> "SO/2026/00042" (normalized)
 * - "SO0042"        -> "SO/2026/00042" (normalized assuming current year)
 */
export function normalizeSoCode(rawSoCode: string, defaultYear = 2026): string {
  const trimmed = (rawSoCode || '').trim();

  // Handle lowercase prefix or canonical format: SO/2026/00001 or SO/2026/xxxxx
  const standardMatch = trimmed.match(/^SO\/(\d{4})\/([A-Za-z0-9_-]+)$/i);
  if (standardMatch) {
    return `SO/${standardMatch[1]}/${standardMatch[2]}`;
  }

  // Legacy hyphenated: SO-2026-001 or SO-2026-42 or SO-2026-1
  const hyphenMatch = trimmed.match(/^SO-(\d{4})-(\d+)$/i);
  if (hyphenMatch) {
    const year = hyphenMatch[1];
    const seq = hyphenMatch[2].padStart(5, '0');
    return `SO/${year}/${seq}`;
  }

  // Odoo raw format: SO0042 or SO-42 or SO00001
  const odooMatch = trimmed.match(/^SO-?0*(\d+)$/i);
  if (odooMatch) {
    const seq = odooMatch[1].padStart(5, '0');
    return `SO/${defaultYear}/${seq}`;
  }

  return trimmed;
}
