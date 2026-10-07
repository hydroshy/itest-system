"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRICT_SO_CODE_REGEX = exports.SO_CODE_REGEX = void 0;
exports.sanitizeFirmwareVersion = sanitizeFirmwareVersion;
exports.formatSkuFw = formatSkuFw;
exports.isValidFirmwareVersion = isValidFirmwareVersion;
exports.isValidSkuFw = isValidSkuFw;
exports.isValidSoCode = isValidSoCode;
exports.normalizeSoCode = normalizeSoCode;
exports.SO_CODE_REGEX = /^SO\/\d{4}\/[A-Za-z0-9_-]+$/;
exports.STRICT_SO_CODE_REGEX = /^SO\/\d{4}\/\d{5}$/;
function sanitizeFirmwareVersion(rawFw) {
    if (!rawFw || typeof rawFw !== 'string' || rawFw.trim() === '') {
        return '1';
    }
    let clean = rawFw.trim().replace(/^[vV]+/, '');
    clean = clean.replace(/(?:\.0)+$/, '');
    return clean.length > 0 ? clean : '1';
}
function formatSkuFw(sku, rawFw) {
    const cleanSku = (sku || '').trim().toUpperCase();
    const cleanFw = sanitizeFirmwareVersion(rawFw);
    return `${cleanSku}_${cleanFw}`;
}
function isValidFirmwareVersion(fw) {
    if (!fw || typeof fw !== 'string')
        return false;
    const trimmed = fw.trim();
    if (!/^[0-9]+(\.[0-9]+)*$/.test(trimmed))
        return false;
    return !/(?:\.0)+$/.test(trimmed);
}
function isValidSkuFw(skuFw) {
    if (!skuFw || typeof skuFw !== 'string')
        return false;
    const trimmed = skuFw.trim();
    if (!/^[A-Z0-9_-]+_[0-9]+(\.[0-9]+)*$/.test(trimmed))
        return false;
    return !/(?:\.0)+$/.test(trimmed);
}
function isValidSoCode(soCode) {
    if (!soCode || typeof soCode !== 'string')
        return false;
    return exports.SO_CODE_REGEX.test(soCode.trim());
}
function normalizeSoCode(rawSoCode, defaultYear = 2026) {
    const trimmed = (rawSoCode || '').trim();
    const standardMatch = trimmed.match(/^SO\/(\d{4})\/([A-Za-z0-9_-]+)$/i);
    if (standardMatch) {
        return `SO/${standardMatch[1]}/${standardMatch[2]}`;
    }
    const hyphenMatch = trimmed.match(/^SO-(\d{4})-(\d+)$/i);
    if (hyphenMatch) {
        const year = hyphenMatch[1];
        const seq = hyphenMatch[2].padStart(5, '0');
        return `SO/${year}/${seq}`;
    }
    const odooMatch = trimmed.match(/^SO-?0*(\d+)$/i);
    if (odooMatch) {
        const seq = odooMatch[1].padStart(5, '0');
        return `SO/${defaultYear}/${seq}`;
    }
    return trimmed;
}
//# sourceMappingURL=item-code-utils.js.map