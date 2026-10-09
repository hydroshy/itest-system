"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MemmapUploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemmapUploadService = exports.extractShortFwFromLongFw = void 0;
const common_1 = require("@nestjs/common");
const memmap_upload_repository_1 = require("./memmap-upload.repository");
var fw_utils_1 = require("./fw-utils");
Object.defineProperty(exports, "extractShortFwFromLongFw", { enumerable: true, get: function () { return fw_utils_1.extractShortFwFromLongFw; } });
let MemmapUploadService = MemmapUploadService_1 = class MemmapUploadService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new common_1.Logger(MemmapUploadService_1.name);
    }
    validateContinuity(registers) {
        const decErrors = [];
        const hexErrors = [];
        if (!registers || registers.length === 0) {
            return { decValid: true, hexValid: true, decErrors, hexErrors };
        }
        const sorted = [...registers].sort((a, b) => (Number(a.no) || 0) - (Number(b.no) || 0));
        for (let i = 0; i < sorted.length; i++) {
            const cur = sorted[i];
            const curDec = Number(cur.modbus_reg_dec);
            const curHexStr = String(cur.modbus_reg_hex ?? '').trim();
            const curHexParsed = parseInt(curHexStr, 16);
            if (i === 0) {
                if (isNaN(curDec) || curDec < 0) {
                    decErrors.push(`Row 1 (No. ${cur.no}): Decimal register must be >= 0 (found ${cur.modbus_reg_dec})`);
                }
                if (isNaN(curHexParsed) || curHexParsed < 0) {
                    hexErrors.push(`Row 1 (No. ${cur.no}): Hex register is invalid (found ${cur.modbus_reg_hex})`);
                }
            }
            else {
                const prev = sorted[i - 1];
                const prevDec = Number(prev.modbus_reg_dec);
                const prevNumRegs = Number(prev.num_regs) > 0 ? Number(prev.num_regs) : 1;
                const expectedDec = prevDec + prevNumRegs;
                if (curDec !== expectedDec) {
                    decErrors.push(`Row ${i + 1} (No. ${cur.no}): Expected Dec ${expectedDec}, found ${curDec}`);
                }
                const prevHexStr = String(prev.modbus_reg_hex ?? '').trim();
                const prevHexParsed = parseInt(prevHexStr, 16);
                if (!isNaN(prevHexParsed) && !isNaN(curHexParsed)) {
                    const expectedHexVal = prevHexParsed + prevNumRegs;
                    if (curHexParsed !== expectedHexVal) {
                        const expectedHexStr = expectedHexVal.toString(16).toUpperCase();
                        hexErrors.push(`Row ${i + 1} (No. ${cur.no}): Expected Hex 0x${expectedHexStr}, found 0x${curHexStr.toUpperCase()}`);
                    }
                }
                else {
                    hexErrors.push(`Row ${i + 1} (No. ${cur.no}): Invalid hex value`);
                }
            }
        }
        return {
            decValid: decErrors.length === 0,
            hexValid: hexErrors.length === 0,
            decErrors,
            hexErrors,
        };
    }
    async uploadMemmap(dto, author = 'admin') {
        const rawSku = (dto.sku || '').trim().toUpperCase();
        if (!rawSku) {
            throw new common_1.BadRequestException('SKU is required');
        }
        if (!/^[A-Z0-9_\-]+$/.test(rawSku)) {
            throw new common_1.BadRequestException("SKU chỉ được chứa ký tự chữ in hoa, số, dấu gạch nối hoặc gạch dưới (vd: 'WSLRW-ATH')");
        }
        const rawFw = dto.short_fw;
        if (typeof rawFw === 'string') {
            if (/^[vV]/.test(rawFw) || rawFw.includes('.')) {
                throw new common_1.BadRequestException('Short FW Version chỉ được chứa ký số nguyên, không có tiền tố v hoặc phần thập phân');
            }
            const parsed = Number(rawFw);
            if (!Number.isInteger(parsed) || parsed < 0) {
                throw new common_1.BadRequestException('Short FW Version chỉ được chứa ký số nguyên, không có tiền tố v hoặc phần thập phân');
            }
        }
        else if (typeof rawFw !== 'number' || !Number.isInteger(rawFw) || rawFw < 0) {
            throw new common_1.BadRequestException('Short FW Version chỉ được chứa ký số nguyên, không có tiền tố v hoặc phần thập phân');
        }
        const shortFw = Number(rawFw);
        if (!dto.registers || !Array.isArray(dto.registers) || dto.registers.length === 0) {
            throw new common_1.BadRequestException('Memory map phải có ít nhất 1 dòng thanh ghi');
        }
        const continuity = this.validateContinuity(dto.registers);
        const longFw = (dto.long_fw || '').trim() || String(shortFw);
        const { payload } = await this.repository.saveOrUpdate({
            sku: rawSku,
            short_fw: shortFw,
            long_fw: longFw,
            file_name: dto.file_name?.trim() || `${rawSku}-${shortFw}.csv`,
            total_regs: dto.registers.length,
            dec_valid: continuity.decValid,
            hex_valid: continuity.hexValid,
            created_by: author,
        }, dto.registers);
        this.logger.log(`Saved Memory Map for SKU [${rawSku}] Long FW [${longFw}] Short FW [${shortFw}]: ${dto.registers.length} regs (Dec: ${continuity.decValid ? 'PASS' : 'FAIL'}, Hex: ${continuity.hexValid ? 'PASS' : 'FAIL'})`);
        return {
            success: true,
            message: 'Memory map saved successfully',
            data: {
                payloadId: payload.id,
                sku: payload.sku,
                longFw: payload.long_fw || longFw,
                shortFw: payload.short_fw,
                totalRegs: payload.total_regs,
                decValid: payload.dec_valid,
                hexValid: payload.hex_valid,
                decErrors: continuity.decErrors.length > 0 ? continuity.decErrors : undefined,
                hexErrors: continuity.hexErrors.length > 0 ? continuity.hexErrors : undefined,
            },
        };
    }
    async getBySkuAndShortFw(sku, shortFw) {
        const cleanSku = (sku || '').trim().toUpperCase();
        const cleanFw = Number(shortFw);
        if (isNaN(cleanFw)) {
            throw new common_1.BadRequestException(`Invalid short FW version: '${shortFw}'`);
        }
        const result = await this.repository.findBySkuAndShortFw(cleanSku, cleanFw);
        if (!result) {
            throw new common_1.NotFoundException(`Memory map for SKU '${cleanSku}' with short FW '${cleanFw}' not found`);
        }
        return {
            success: true,
            data: {
                ...result.payload,
                registers: result.registers,
            },
        };
    }
    async findAll() {
        return await this.repository.findAllPayloads();
    }
};
exports.MemmapUploadService = MemmapUploadService;
exports.MemmapUploadService = MemmapUploadService = MemmapUploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [memmap_upload_repository_1.MemmapUploadRepository])
], MemmapUploadService);
//# sourceMappingURL=memmap-upload.service.js.map