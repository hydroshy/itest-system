/**
 * ==============================================================================
 * DAVITEQ LoRaWAN PLATFORM - FINAL CONFIG UTILITIES
 * ==============================================================================
 * Firmware standardization and short FW helper functions.
 * Adheres to SPEC-FINAL-CONFIG-FIRST-REG-RETRY-AND-SHORT-FW contract.
 * ==============================================================================
 */

/**
 * Standardize and clean raw firmware version into an integer short FW string representation.
 * Eliminates leading 'v'/'V', trailing '.0', '.0.0', etc.
 * Normalizes to pure integer short FW (e.g. '6', '1').
 * Defaults to '1' when input is null, undefined, empty, or non-numeric.
 *
 * @param rawFw Raw firmware value (string, number, null, undefined)
 * @returns Standardized integer short FW string
 */
export function sanitizeFw(rawFw: any): string {
  if (rawFw === null || rawFw === undefined || rawFw === '') return '1';
  let clean = String(rawFw).trim().replace(/^[vV]+/, '');
  // Loại bỏ các hậu tố .0, .0.0, .00
  clean = clean.replace(/(\.0+)+$/, '');
  // Nếu vẫn còn định dạng thập phân hoặc chuỗi phức tạp, lấy phần nguyên đầu tiên
  const match = clean.match(/^(\d+)/);
  if (match) return match[1];
  return clean.length > 0 ? clean : '1';
}

/**
 * Alias helper for sanitizeFw to provide explicit naming in C-Module UI & Services.
 */
export const formatShortFw = sanitizeFw;
