"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatShortFw = void 0;
exports.sanitizeFw = sanitizeFw;
function sanitizeFw(rawFw) {
    if (rawFw === null || rawFw === undefined || rawFw === '')
        return '1';
    let clean = String(rawFw).trim().replace(/^[vV]+/, '');
    clean = clean.replace(/(\.0+)+$/, '');
    const match = clean.match(/^(\d+)/);
    if (match)
        return match[1];
    return clean.length > 0 ? clean : '1';
}
exports.formatShortFw = sanitizeFw;
//# sourceMappingURL=final-config-utils.js.map