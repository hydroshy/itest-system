/**
 * ==============================================================================
 * DAVITEQ LoRaWAN PLATFORM - FIRMWARE UTILITIES (LONG_FW & SHORT_FW)
 * ==============================================================================
 * Extraction algorithm conforming to Section 3 of SPEC-MEMMAP-MANAGER-AND-FW-UPGRADE
 * ==============================================================================
 */

/**
 * Extract SHORT_FW integer from LONG_FW string.
 * Rule: SHORT_FW is the integer strictly preceding the letter 'F' (e.g. 3F0825 -> 3, 6Fmmdd -> 6, 12F0101 -> 12).
 * Fallback: If no 'F' is present but input is a plain integer, returns that integer.
 * Case-insensitive match ('F' or 'f').
 */
export function extractShortFwFromLongFw(longFw: string | null | undefined): number | null {
  if (!longFw || typeof longFw !== 'string') return null;
  const trimmed = longFw.trim();
  if (!trimmed) return null;

  // Rule 1: Match integer strictly before letter 'F' / 'f'
  const match = trimmed.match(/^(\d+)[fF]/i);
  if (match) {
    const val = parseInt(match[1], 10);
    return isNaN(val) ? null : val;
  }

  // Rule 2: Fallback for pure integer
  if (/^\d+$/.test(trimmed)) {
    const val = parseInt(trimmed, 10);
    return isNaN(val) ? null : val;
  }

  return null;
}
