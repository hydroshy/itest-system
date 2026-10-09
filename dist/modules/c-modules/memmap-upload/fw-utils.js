"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractShortFwFromLongFw = extractShortFwFromLongFw;
function extractShortFwFromLongFw(longFw) {
    if (!longFw || typeof longFw !== 'string')
        return null;
    const trimmed = longFw.trim();
    if (!trimmed)
        return null;
    const match = trimmed.match(/^(\d+)[fF]/i);
    if (match) {
        const val = parseInt(match[1], 10);
        return isNaN(val) ? null : val;
    }
    if (/^\d+$/.test(trimmed)) {
        const val = parseInt(trimmed, 10);
        return isNaN(val) ? null : val;
    }
    return null;
}
//# sourceMappingURL=fw-utils.js.map