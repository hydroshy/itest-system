"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanDevEUI = cleanDevEUI;
exports.isValidDevEUI = isValidDevEUI;
exports.cleanFirmwareVersion = cleanFirmwareVersion;
exports.cleanSku = cleanSku;
exports.resolveDecoderId = resolveDecoderId;
exports.cleanHexPayload = cleanHexPayload;
exports.isValidHex = isValidHex;
exports.calculateHexBytes = calculateHexBytes;
exports.formatDevEUI = formatDevEUI;
function cleanDevEUI(raw) {
    if (!raw)
        return '';
    return String(raw).trim().replace(/[^0-9a-fA-F]/g, '').toUpperCase();
}
function isValidDevEUI(eui) {
    if (!eui)
        return false;
    return /^[0-9A-F]{16}$/.test(cleanDevEUI(eui));
}
function cleanFirmwareVersion(val) {
    if (val === undefined || val === null)
        return '';
    return String(val).trim().replace(/^[vV]/, '').trim();
}
function cleanSku(val) {
    if (!val)
        return '';
    return String(val).trim().toUpperCase();
}
function resolveDecoderId(sku, firmwareVersion) {
    const cSku = cleanSku(sku);
    const cFw = cleanFirmwareVersion(firmwareVersion);
    if (!cSku || !cFw)
        return null;
    return `${cSku}_${cFw}`;
}
function cleanHexPayload(hex) {
    if (!hex)
        return '';
    return String(hex).trim().replace(/[^0-9a-fA-F]/g, '').toUpperCase();
}
function isValidHex(hex) {
    if (!hex)
        return false;
    const clean = cleanHexPayload(hex);
    return clean.length > 0 && clean.length % 2 === 0;
}
function calculateHexBytes(hex) {
    const clean = cleanHexPayload(hex);
    return Math.ceil(clean.length / 2);
}
function formatDevEUI(eui, separator = '-') {
    const clean = cleanDevEUI(eui);
    if (clean.length !== 16)
        return clean;
    return clean.match(/.{1,2}/g)?.join(separator) || clean;
}
//# sourceMappingURL=lorawan-utils.js.map