import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MemmapUploadRepository } from './memmap-upload.repository';
import { UploadMemmapDto, MemmapRegItemDto } from './dto/upload-memmap.dto';
import { MemmapPayloadEntity } from './entities/memmap-payload.entity';
import { MemmapRegEntity } from './entities/memmap-reg.entity';

export interface ContinuityCheckResult {
  decValid: boolean;
  hexValid: boolean;
  decErrors: string[];
  hexErrors: string[];
}

@Injectable()
export class MemmapUploadService {
  private readonly logger = new Logger(MemmapUploadService.name);

  constructor(private readonly repository: MemmapUploadRepository) {}

  /**
   * Independent Decimal and Hexadecimal Modbus register continuity validation.
   * ponytail: single pass over sorted items, no extraneous allocations.
   */
  public validateContinuity(registers: MemmapRegItemDto[]): ContinuityCheckResult {
    const decErrors: string[] = [];
    const hexErrors: string[] = [];

    if (!registers || registers.length === 0) {
      return { decValid: true, hexValid: true, decErrors, hexErrors };
    }

    // Sort registers strictly by row sequence (no)
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
      } else {
        const prev = sorted[i - 1];
        const prevDec = Number(prev.modbus_reg_dec);
        const prevNumRegs = Number(prev.num_regs) > 0 ? Number(prev.num_regs) : 1;
        const expectedDec = prevDec + prevNumRegs;

        if (curDec !== expectedDec) {
          decErrors.push(
            `Row ${i + 1} (No. ${cur.no}): Expected Dec ${expectedDec}, found ${curDec}`,
          );
        }

        const prevHexStr = String(prev.modbus_reg_hex ?? '').trim();
        const prevHexParsed = parseInt(prevHexStr, 16);

        if (!isNaN(prevHexParsed) && !isNaN(curHexParsed)) {
          const expectedHexVal = prevHexParsed + prevNumRegs;
          if (curHexParsed !== expectedHexVal) {
            const expectedHexStr = expectedHexVal.toString(16).toUpperCase();
            hexErrors.push(
              `Row ${i + 1} (No. ${cur.no}): Expected Hex 0x${expectedHexStr}, found 0x${curHexStr.toUpperCase()}`,
            );
          }
        } else {
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

  /**
   * Save or update Modbus Memory Map with strict validation
   */
  public async uploadMemmap(
    dto: UploadMemmapDto,
    author: string = 'admin',
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      payloadId: string;
      sku: string;
      shortFw: number;
      totalRegs: number;
      decValid: boolean;
      hexValid: boolean;
      decErrors?: string[];
      hexErrors?: string[];
    };
  }> {
    // 1. Strict SKU validation
    const rawSku = (dto.sku || '').trim().toUpperCase();
    if (!rawSku) {
      throw new BadRequestException('SKU is required');
    }
    if (!/^[A-Z0-9_\-]+$/.test(rawSku)) {
      throw new BadRequestException(
        "SKU chỉ được chứa ký tự chữ in hoa, số, dấu gạch nối hoặc gạch dưới (vd: 'WSLRW-ATH')",
      );
    }

    // 2. Strict Short FW validation (integers only, no 'v', no decimals)
    const rawFw: any = dto.short_fw;
    if (typeof rawFw === 'string') {
      if (/^[vV]/.test(rawFw) || rawFw.includes('.')) {
        throw new BadRequestException(
          'Short FW Version chỉ được chứa ký số nguyên, không có tiền tố v hoặc phần thập phân',
        );
      }
      const parsed = Number(rawFw);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new BadRequestException(
          'Short FW Version chỉ được chứa ký số nguyên, không có tiền tố v hoặc phần thập phân',
        );
      }
    } else if (typeof rawFw !== 'number' || !Number.isInteger(rawFw) || rawFw < 0) {
      throw new BadRequestException(
        'Short FW Version chỉ được chứa ký số nguyên, không có tiền tố v hoặc phần thập phân',
      );
    }
    const shortFw = Number(rawFw);

    // 3. Registers validation
    if (!dto.registers || !Array.isArray(dto.registers) || dto.registers.length === 0) {
      throw new BadRequestException('Memory map phải có ít nhất 1 dòng thanh ghi');
    }

    // 4. Run continuity check
    const continuity = this.validateContinuity(dto.registers);

    // 5. Save / Upsert in DB
    const { payload } = await this.repository.saveOrUpdate(
      {
        sku: rawSku,
        short_fw: shortFw,
        file_name: dto.file_name?.trim() || `${rawSku}-${shortFw}.csv`,
        total_regs: dto.registers.length,
        dec_valid: continuity.decValid,
        hex_valid: continuity.hexValid,
        created_by: author,
      },
      dto.registers,
    );

    this.logger.log(
      `Saved Memory Map for SKU [${rawSku}] Short FW [${shortFw}]: ${dto.registers.length} regs (Dec: ${continuity.decValid ? 'PASS' : 'FAIL'}, Hex: ${continuity.hexValid ? 'PASS' : 'FAIL'})`,
    );

    return {
      success: true,
      message: 'Memory map saved successfully',
      data: {
        payloadId: payload.id,
        sku: payload.sku,
        shortFw: payload.short_fw,
        totalRegs: payload.total_regs,
        decValid: payload.dec_valid,
        hexValid: payload.hex_valid,
        decErrors: continuity.decErrors.length > 0 ? continuity.decErrors : undefined,
        hexErrors: continuity.hexErrors.length > 0 ? continuity.hexErrors : undefined,
      },
    };
  }

  /**
   * Lookup Memory Map by SKU and Short FW
   */
  public async getBySkuAndShortFw(
    sku: string,
    shortFw: number | string,
  ): Promise<{
    success: boolean;
    data: MemmapPayloadEntity & { registers: MemmapRegEntity[] };
  }> {
    const cleanSku = (sku || '').trim().toUpperCase();
    const cleanFw = Number(shortFw);

    if (isNaN(cleanFw)) {
      throw new BadRequestException(`Invalid short FW version: '${shortFw}'`);
    }

    const result = await this.repository.findBySkuAndShortFw(cleanSku, cleanFw);
    if (!result) {
      throw new NotFoundException(
        `Memory map for SKU '${cleanSku}' with short FW '${cleanFw}' not found`,
      );
    }

    return {
      success: true,
      data: {
        ...result.payload,
        registers: result.registers,
      },
    };
  }

  /**
   * List all stored memory map headers
   */
  public async findAll(): Promise<MemmapPayloadEntity[]> {
    return await this.repository.findAllPayloads();
  }
}
