import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Optional,
} from '@nestjs/common';
import * as vm from 'node:vm';
import * as fs from 'fs';
import * as path from 'path';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { RealtimeService } from '../realtime/modules/realtime/realtime.service';
import { DecoderScriptEntity } from '../core-models/decoder-script.entity';
import { MemmapProfileEntity } from '../core-models/memmap-profile.entity';

export interface CreateDecoderScriptDto {
  name: string;
  sku: string;
  longFw: string;
  script: string;
  protocol?: string;
  description?: string;
  inputFormat?: 'hex' | 'base64' | 'bytes';
  samplePayload?: string;
  sampleFport?: number;
  sampleDecoded?: Record<string, any>;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateDecoderScriptDto {
  name?: string;
  sku?: string;
  longFw?: string;
  script?: string;
  protocol?: string;
  description?: string;
  inputFormat?: 'hex' | 'base64' | 'bytes';
  samplePayload?: string;
  sampleFport?: number;
  sampleDecoded?: Record<string, any>;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface TestDecoderPayloadDto {
  script?: string;
  scriptId?: string;
  sku?: string;
  longFw?: string;
  payload: string | number[];
  fPort?: number;
  inputFormat?: 'hex' | 'base64' | 'bytes';
  variables?: Record<string, any>;
}

export interface DecodeByProductDto {
  sku: string;
  longFw: string;
  payload: string | number[];
  fPort?: number;
  inputFormat?: 'hex' | 'base64' | 'bytes';
  variables?: Record<string, any>;
}

@Controller()
export class DecoderAdapterController {
  private readonly logger = new Logger(DecoderAdapterController.name);

  constructor(
    private readonly databaseService: DynamicDatabaseService,
    @Optional() private readonly realtimeService?: RealtimeService,
  ) {}

  private getDecoderRepo() {
    return this.databaseService.getRepositoryForTable('decoder_scripts', DecoderScriptEntity);
  }

  private getMemmapRepo() {
    return this.databaseService.getRepositoryForTable('memmap_profiles', MemmapProfileEntity);
  }

  // =========================================================================
  // MEMMAP / SKU / LONG_FW DISCOVERY ENDPOINTS
  // =========================================================================

  /**
   * GET /api/plugins/decoder/memmaps
   * Return available memmaps (SKU & LONG_FW) along with whether they have a decoder script configured
   */
  @Get(['api/plugins/decoder/memmaps', 'api/v1/plugins/decoder/memmaps', 'api/plugins/decode/memmaps', 'api/v1/plugins/decode/memmaps'])
  async getMemmapsWithDecoderStatus(
    @Query('sku') skuQuery?: string,
    @Query('configured') configuredQuery?: string,
  ) {
    try {
      const memmapRepo = this.getMemmapRepo();
      const decoderRepo = this.getDecoderRepo();

      const qb = memmapRepo.createQueryBuilder('m');
      if (skuQuery) {
        qb.where('LOWER(m.sku) LIKE LOWER(:sku)', { sku: `%${skuQuery}%` });
      }
      qb.orderBy('m.sku', 'ASC').addOrderBy('m.longFw', 'ASC');

      const memmaps = await qb.getMany();
      const decoders = await decoderRepo.find();

      const decoderMap = new Map<string, DecoderScriptEntity>();
      for (const d of decoders) {
        const key = `${d.sku.trim().toLowerCase()}:::${d.long_fw.trim().toLowerCase()}`;
        decoderMap.set(key, d);
      }

      let results = memmaps.map((m) => {
        const key = `${(m.sku || '').trim().toLowerCase()}:::${(m.longFw || '').trim().toLowerCase()}`;
        const matchedDecoder = decoderMap.get(key);

        return {
          id: m.id,
          name: m.name,
          sku: m.sku,
          longFw: m.longFw,
          shortFw: m.shortFw,
          isConfigured: !!matchedDecoder,
          decoderId: matchedDecoder ? matchedDecoder.id : null,
          decoderName: matchedDecoder ? matchedDecoder.name : null,
          isActive: matchedDecoder ? matchedDecoder.is_active : false,
          protocol: matchedDecoder ? matchedDecoder.protocol : 'lorawan',
          updatedAt: matchedDecoder ? matchedDecoder.updated_at : m.updatedAt,
        };
      });

      if (configuredQuery !== undefined && configuredQuery !== '') {
        const isConf = configuredQuery === 'true' || configuredQuery === '1';
        results = results.filter((r) => r.isConfigured === isConf);
      }

      return {
        success: true,
        data: results,
        total: results.length,
      };
    } catch (err: any) {
      this.logger.error(`Failed to get memmaps with decoder status: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Failed to retrieve memmaps', message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/plugins/decoder/skus
   * Returns distinct list of SKUs and available LONG_FWs from memmap and decoders
   */
  @Get(['api/plugins/decoder/skus', 'api/v1/plugins/decoder/skus', 'api/plugins/decode/skus', 'api/v1/plugins/decode/skus'])
  async getAvailableSkus() {
    try {
      const memmapRepo = this.getMemmapRepo();
      const decoderRepo = this.getDecoderRepo();

      const memmaps = await memmapRepo.find({ select: ['id', 'name', 'sku', 'longFw', 'shortFw'] });
      const decoders = await decoderRepo.find({ select: ['id', 'name', 'sku', 'long_fw', 'is_active'] });

      const skuMap = new Map<string, { sku: string; longFws: Set<string>; configuredCount: number; totalCount: number }>();

      for (const m of memmaps) {
        if (!m.sku) continue;
        const skuKey = m.sku.trim();
        if (!skuMap.has(skuKey)) {
          skuMap.set(skuKey, { sku: skuKey, longFws: new Set(), configuredCount: 0, totalCount: 0 });
        }
        const item = skuMap.get(skuKey)!;
        item.totalCount++;
        if (m.longFw) {
          item.longFws.add(m.longFw.trim());
        }
      }

      for (const d of decoders) {
        if (!d.sku) continue;
        const skuKey = d.sku.trim();
        if (!skuMap.has(skuKey)) {
          skuMap.set(skuKey, { sku: skuKey, longFws: new Set(), configuredCount: 0, totalCount: 0 });
        }
        const item = skuMap.get(skuKey)!;
        if (d.long_fw) {
          item.longFws.add(d.long_fw.trim());
        }
        item.configuredCount++;
      }

      const list = Array.from(skuMap.values()).map((v) => ({
        sku: v.sku,
        longFws: Array.from(v.longFws),
        configuredCount: v.configuredCount,
        totalCount: v.totalCount,
      }));

      return {
        success: true,
        data: list,
      };
    } catch (err: any) {
      this.logger.error(`Failed to get available SKUs: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Failed to retrieve SKUs', message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =========================================================================
  // DECODER SCRIPT MANAGEMENT (CRUD)
  // =========================================================================

  /**
   * GET /api/plugins/decoder/scripts
   */
  @Get(['api/plugins/decoder/scripts', 'api/v1/plugins/decoder/scripts', 'api/plugins/decode/scripts', 'api/v1/plugins/decode/scripts'])
  async listDecoderScripts(
    @Query('sku') sku?: string,
    @Query('longFw') longFw?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    try {
      const repo = this.getDecoderRepo();
      const qb = repo.createQueryBuilder('d');

      if (sku) {
        qb.andWhere('LOWER(d.sku) = LOWER(:sku)', { sku: sku.trim() });
      }
      if (longFw) {
        qb.andWhere('LOWER(d.long_fw) = LOWER(:longFw)', { longFw: longFw.trim() });
      }
      if (isActive !== undefined && isActive !== '') {
        const activeBool = isActive === 'true' || isActive === '1';
        qb.andWhere('d.is_active = :isActive', { isActive: activeBool });
      }
      if (search) {
        qb.andWhere(
          '(LOWER(d.name) LIKE LOWER(:search) OR LOWER(d.sku) LIKE LOWER(:search) OR LOWER(d.long_fw) LIKE LOWER(:search) OR LOWER(d.description) LIKE LOWER(:search))',
          { search: `%${search.trim()}%` },
        );
      }

      qb.orderBy('d.updated_at', 'DESC');
      const scripts = await qb.getMany();

      return {
        success: true,
        data: scripts,
        total: scripts.length,
      };
    } catch (err: any) {
      this.logger.error(`Failed to list decoder scripts: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Failed to list decoder scripts', message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/plugins/decoder/scripts/:id
   */
  @Get(['api/plugins/decoder/scripts/:id', 'api/v1/plugins/decoder/scripts/:id', 'api/plugins/decode/scripts/:id', 'api/v1/plugins/decode/scripts/:id'])
  async getDecoderScriptById(@Param('id') id: string) {
    try {
      const repo = this.getDecoderRepo();
      const script = await repo.findOne({ where: { id } });

      if (!script) {
        throw new NotFoundException(`Decoder script with ID '${id}' not found`);
      }

      return {
        success: true,
        data: script,
      };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Failed to get decoder script by id: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Failed to get decoder script', message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/plugins/decoder/scripts
   */
  @Post(['api/plugins/decoder/scripts', 'api/v1/plugins/decoder/scripts', 'api/plugins/decode/scripts', 'api/v1/plugins/decode/scripts'])
  async createDecoderScript(@Body() dto: CreateDecoderScriptDto) {
    try {
      if (!dto.name || !dto.sku || !dto.longFw || !dto.script) {
        throw new BadRequestException('name, sku, longFw, and script are required');
      }

      const cleanSku = dto.sku.trim();
      const cleanLongFw = dto.longFw.trim();
      const repo = this.getDecoderRepo();

      // Check if duplicate SKU + LONG_FW
      const existing = await repo
        .createQueryBuilder('d')
        .where('LOWER(d.sku) = LOWER(:sku) AND LOWER(d.long_fw) = LOWER(:longFw)', {
          sku: cleanSku,
          longFw: cleanLongFw,
        })
        .getOne();

      if (existing) {
        throw new BadRequestException(
          `Decoder script for SKU '${cleanSku}' and LONG_FW '${cleanLongFw}' already exists (ID: ${existing.id})`,
        );
      }

      const entity = repo.create({
        name: dto.name.trim(),
        sku: cleanSku,
        long_fw: cleanLongFw,
        script: dto.script,
        protocol: dto.protocol || 'lorawan',
        description: dto.description || null,
        input_format: dto.inputFormat || 'hex',
        sample_payload: dto.samplePayload || null,
        sample_fport: dto.sampleFport !== undefined ? Number(dto.sampleFport) : 1,
        sample_decoded: dto.sampleDecoded || null,
        is_active: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
        metadata: dto.metadata || {},
      });

      const saved = await repo.save(entity);

      if (this.realtimeService) {
        this.realtimeService.publishPluginLifecycle('decoder:created', {
          id: saved.id,
          sku: saved.sku,
          longFw: saved.long_fw,
        });
      }

      return {
        success: true,
        data: saved,
        message: `Decoder script created successfully for SKU '${saved.sku}' and LONG_FW '${saved.long_fw}'`,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Failed to create decoder script: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Failed to create decoder script', message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PUT /api/plugins/decoder/scripts/:id
   */
  @Put(['api/plugins/decoder/scripts/:id', 'api/v1/plugins/decoder/scripts/:id', 'api/plugins/decode/scripts/:id', 'api/v1/plugins/decode/scripts/:id'])
  async updateDecoderScript(@Param('id') id: string, @Body() dto: UpdateDecoderScriptDto) {
    try {
      const repo = this.getDecoderRepo();
      const existing = await repo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Decoder script with ID '${id}' not found`);
      }

      // Check unique conflict if sku/longFw changed
      const targetSku = dto.sku ? dto.sku.trim() : existing.sku;
      const targetLongFw = dto.longFw ? dto.longFw.trim() : existing.long_fw;

      if (
        (dto.sku && dto.sku.trim().toLowerCase() !== existing.sku.toLowerCase()) ||
        (dto.longFw && dto.longFw.trim().toLowerCase() !== existing.long_fw.toLowerCase())
      ) {
        const conflict = await repo
          .createQueryBuilder('d')
          .where('LOWER(d.sku) = LOWER(:sku) AND LOWER(d.long_fw) = LOWER(:longFw) AND d.id != :id', {
            sku: targetSku,
            longFw: targetLongFw,
            id,
          })
          .getOne();

        if (conflict) {
          throw new BadRequestException(
            `Another decoder script for SKU '${targetSku}' and LONG_FW '${targetLongFw}' already exists (ID: ${conflict.id})`,
          );
        }
      }

      if (dto.name !== undefined) existing.name = dto.name.trim();
      if (dto.sku !== undefined) existing.sku = targetSku;
      if (dto.longFw !== undefined) existing.long_fw = targetLongFw;
      if (dto.script !== undefined) existing.script = dto.script;
      if (dto.protocol !== undefined) existing.protocol = dto.protocol;
      if (dto.description !== undefined) existing.description = dto.description;
      if (dto.inputFormat !== undefined) existing.input_format = dto.inputFormat;
      if (dto.samplePayload !== undefined) existing.sample_payload = dto.samplePayload;
      if (dto.sampleFport !== undefined) existing.sample_fport = Number(dto.sampleFport);
      if (dto.sampleDecoded !== undefined) existing.sample_decoded = dto.sampleDecoded;
      if (dto.isActive !== undefined) existing.is_active = Boolean(dto.isActive);
      if (dto.metadata !== undefined) existing.metadata = { ...existing.metadata, ...dto.metadata };

      const updated = await repo.save(existing);

      if (this.realtimeService) {
        this.realtimeService.publishPluginLifecycle('decoder:updated', {
          id: updated.id,
          sku: updated.sku,
          longFw: updated.long_fw,
        });
      }

      return {
        success: true,
        data: updated,
        message: 'Decoder script updated successfully',
      };
    } catch (err: any) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      this.logger.error(`Failed to update decoder script: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Failed to update decoder script', message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * DELETE /api/plugins/decoder/scripts/:id
   */
  @Delete(['api/plugins/decoder/scripts/:id', 'api/v1/plugins/decoder/scripts/:id', 'api/plugins/decode/scripts/:id', 'api/v1/plugins/decode/scripts/:id'])
  async deleteDecoderScript(@Param('id') id: string) {
    try {
      const repo = this.getDecoderRepo();
      const existing = await repo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Decoder script with ID '${id}' not found`);
      }

      await repo.remove(existing);

      if (this.realtimeService) {
        this.realtimeService.publishPluginLifecycle('decoder:deleted', {
          id,
          sku: existing.sku,
          longFw: existing.long_fw,
        });
      }

      return {
        success: true,
        message: `Decoder script '${existing.name}' for SKU '${existing.sku}' deleted successfully`,
      };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Failed to delete decoder script: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Failed to delete decoder script', message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =========================================================================
  // TEMPLATE & UTILITIES
  // =========================================================================

  /**
   * GET /api/plugins/decoder/template
   * Returns standard LoRaWAN decoder templates for frontend editor initialization
   */
  @Get(['api/plugins/decoder/template', 'api/v1/plugins/decoder/template', 'api/plugins/decode/template', 'api/v1/plugins/decode/template'])
  getStandardTemplate() {
    const templateChirpstackV4 = `/**
 * LoRaWAN Uplink Decoder Script (ChirpStack v4 / LoRaWAN Standard)
 *
 * @param {Object} input - Input object
 * @param {number[]} input.bytes - Array of byte values (0-255)
 * @param {number} input.fPort - LoRaWAN fPort (1-223)
 * @param {Object} [input.variables] - Optional user variables
 * @returns {Object} result - Result with decoded data, warnings, and errors
 */
function decodeUplink(input) {
  var bytes = input.bytes || [];
  var fPort = input.fPort || 1;
  var data = {};
  var warnings = [];
  var errors = [];

  // Example: Decode 2-byte big-endian signed temperature (scale: 0.01 C)
  if (bytes.length >= 2) {
    var rawTemp = (bytes[0] << 8) | bytes[1];
    if (rawTemp > 32767) rawTemp -= 65536;
    data.temperature = parseFloat((rawTemp / 100.0).toFixed(2));
  }

  // Example: Decode 2-byte humidity (scale: 0.01 %)
  if (bytes.length >= 4) {
    var rawHum = (bytes[2] << 8) | bytes[3];
    data.humidity = parseFloat((rawHum / 100.0).toFixed(2));
  }

  // Example: Decode 2-byte battery millivolts
  if (bytes.length >= 6) {
    var rawBatt = (bytes[4] << 8) | bytes[5];
    data.battery_mv = rawBatt;
  }

  return {
    data: data,
    warnings: warnings,
    errors: errors
  };
}

// Backward compatibility with TTN v3 / ChirpStack v3
function Decode(fPort, bytes) {
  var res = decodeUplink({ bytes: bytes, fPort: fPort });
  return res.data;
}
`;

    return {
      success: true,
      template: templateChirpstackV4,
      standards: ['ChirpStack v4 (decodeUplink)', 'TTN v3 / ChirpStack v3 (Decode)', 'TTN v2 (Decoder)'],
      samplePayloadHex: '0A2813880D1A',
      sampleFport: 1,
      expectedDecoded: {
        temperature: 26.0,
        humidity: 50.0,
        battery_mv: 3354,
      },
    };
  }

  // =========================================================================
  // DECODER EXECUTION ENGINE (TESTING & RUNTIME IDENTIFICATION)
  // =========================================================================

  /**
   * POST /api/plugins/decoder/test
   * Safely execute a script with payload in isolate sandbox (supports ad-hoc script or scriptId)
   */
  @Post(['api/plugins/decoder/test', 'api/v1/plugins/decoder/test', 'api/plugins/decode/test', 'api/v1/plugins/decode/test'])
  async testDecoder(@Body() dto: TestDecoderPayloadDto) {
    try {
      let scriptContent = dto.script;

      if (!scriptContent && dto.scriptId) {
        const repo = this.getDecoderRepo();
        const found = await repo.findOne({ where: { id: dto.scriptId } });
        if (!found) {
          throw new NotFoundException(`Decoder script ID '${dto.scriptId}' not found`);
        }
        scriptContent = found.script;
      } else if (!scriptContent && dto.sku && dto.longFw) {
        const repo = this.getDecoderRepo();
        const found = await repo
          .createQueryBuilder('d')
          .where('LOWER(d.sku) = LOWER(:sku) AND LOWER(d.long_fw) = LOWER(:longFw)', {
            sku: dto.sku.trim(),
            longFw: dto.longFw.trim(),
          })
          .getOne();
        if (!found) {
          throw new NotFoundException(
            `No decoder script found for SKU '${dto.sku}' and LONG_FW '${dto.longFw}'`,
          );
        }
        scriptContent = found.script;
      }

      if (!scriptContent) {
        throw new BadRequestException('Either script, scriptId, or (sku + longFw) is required to run test');
      }

      if (dto.payload === undefined || dto.payload === null) {
        throw new BadRequestException('payload is required');
      }

      const result = this.executeSandboxScript(scriptContent, {
        payload: dto.payload,
        fPort: dto.fPort !== undefined ? Number(dto.fPort) : 1,
        inputFormat: dto.inputFormat,
        variables: dto.variables,
      });

      return {
        success: result.success,
        data: result.data,
        warnings: result.warnings,
        errors: result.errors,
        logs: result.logs,
        bytes: result.bytes,
        fPort: result.fPort,
        executionTimeMs: result.executionTimeMs,
      };
    } catch (err: any) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      this.logger.error(`Decoder test failed: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Decoder test failed', message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/plugins/decoder/decode
   * Core capability: Identify decoder script automatically from SKU and LONG_FW and decode payload
   */
  @Post(['api/plugins/decoder/decode', 'api/v1/plugins/decoder/decode', 'api/plugins/decode/payload', 'api/v1/plugins/decode/payload', 'api/v1/plugins/decode/decode'])
  async decodeBySkuAndLongFw(@Body() dto: DecodeByProductDto) {
    try {
      if (!dto.sku || !dto.longFw) {
        throw new BadRequestException('sku and longFw are required to identify product decoder');
      }

      if (dto.payload === undefined || dto.payload === null) {
        throw new BadRequestException('payload is required');
      }

      const repo = this.getDecoderRepo();
      const matched = await repo
        .createQueryBuilder('d')
        .where('LOWER(d.sku) = LOWER(:sku) AND LOWER(d.long_fw) = LOWER(:longFw)', {
          sku: dto.sku.trim(),
          longFw: dto.longFw.trim(),
        })
        .getOne();

      if (!matched) {
        throw new NotFoundException(
          `No registered decoder script found for SKU '${dto.sku}' and LONG_FW '${dto.longFw}'`,
        );
      }

      if (!matched.is_active) {
        throw new BadRequestException(
          `Decoder script '${matched.name}' for SKU '${dto.sku}' is currently disabled (inactive)`,
        );
      }

      const result = this.executeSandboxScript(matched.script, {
        payload: dto.payload,
        fPort: dto.fPort !== undefined ? Number(dto.fPort) : matched.sample_fport || 1,
        inputFormat: dto.inputFormat || (matched.input_format as any),
        variables: dto.variables,
      });

      return {
        success: result.success,
        decoder: {
          id: matched.id,
          name: matched.name,
          sku: matched.sku,
          longFw: matched.long_fw,
          protocol: matched.protocol,
        },
        data: result.data,
        warnings: result.warnings,
        errors: result.errors,
        executionTimeMs: result.executionTimeMs,
        bytes: result.bytes,
      };
    } catch (err: any) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      this.logger.error(`Decode by product failed: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Failed to decode payload', message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =========================================================================
  // INTERNAL SAFE EXECUTION ENGINE
  // =========================================================================

  private parsePayloadToBytes(
    payload: string | number[] | Buffer,
    formatHint?: 'hex' | 'base64' | 'bytes',
  ): { buffer: Buffer; bytes: number[] } {
    if (Buffer.isBuffer(payload)) {
      return { buffer: payload, bytes: Array.from(payload) };
    }

    if (Array.isArray(payload)) {
      const buf = Buffer.from(payload);
      return { buffer: buf, bytes: payload };
    }

    if (typeof payload === 'string') {
      const trimmed = payload.trim();

      if (formatHint === 'base64') {
        const buf = Buffer.from(trimmed, 'base64');
        return { buffer: buf, bytes: Array.from(buf) };
      }

      const cleanHex = trimmed.replace(/^(0x)/i, '').replace(/[\s\-_:]/g, '');
      const isHex = /^[0-9a-fA-F]+$/.test(cleanHex) && cleanHex.length % 2 === 0;

      if (isHex) {
        const buf = Buffer.from(cleanHex, 'hex');
        return { buffer: buf, bytes: Array.from(buf) };
      }

      try {
        const buf = Buffer.from(trimmed, 'base64');
        return { buffer: buf, bytes: Array.from(buf) };
      } catch {
        const buf = Buffer.from(trimmed, 'utf8');
        return { buffer: buf, bytes: Array.from(buf) };
      }
    }

    return { buffer: Buffer.alloc(0), bytes: [] };
  }

  private executeSandboxScript(
    scriptContent: string,
    options: {
      payload: string | number[];
      fPort?: number;
      inputFormat?: 'hex' | 'base64' | 'bytes';
      variables?: Record<string, any>;
      timeoutMs?: number;
    },
  ): {
    success: boolean;
    data: any;
    warnings: string[];
    errors: string[];
    logs: string[];
    bytes: number[];
    fPort: number;
    executionTimeMs: number;
  } {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 1500;
    const fPort = options.fPort !== undefined ? options.fPort : 1;
    const variables = options.variables || {};

    const parsed = this.parsePayloadToBytes(options.payload, options.inputFormat);
    const logs: string[] = [];

    const sandboxConsole = {
      log: (...args: any[]) =>
        logs.push('[LOG] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      warn: (...args: any[]) =>
        logs.push('[WARN] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      error: (...args: any[]) =>
        logs.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      info: (...args: any[]) =>
        logs.push('[INFO] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
    };

    const sandbox: Record<string, any> = {
      console: sandboxConsole,
      bytes: parsed.bytes,
      fPort,
      variables,
      Math,
      Number,
      String,
      Boolean,
      Array,
      Object,
      JSON,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      Date,
      Buffer: {
        from: (data: any, encoding?: any) => Buffer.from(data, encoding),
      },
    };

    const context = vm.createContext(sandbox);

    const runnerScript = `
      ${scriptContent}

      (function() {
        var inputBytes = bytes;
        var inputPort = fPort;
        var inputVars = variables;

        // 1. ChirpStack v4 / LoRa Alliance standard: decodeUplink({ bytes, fPort, variables })
        if (typeof decodeUplink === 'function') {
          return decodeUplink({ bytes: inputBytes, fPort: inputPort, variables: inputVars });
        }

        // 2. ChirpStack v3 / TTN v3 standard: Decode(fPort, bytes, variables)
        if (typeof Decode === 'function') {
          var res = Decode(inputPort, inputBytes, inputVars);
          return { data: res, warnings: [], errors: [] };
        }

        // 3. TTN v2 standard: Decoder(bytes, fPort)
        if (typeof Decoder === 'function') {
          var res = Decoder(inputBytes, inputPort);
          return { data: res, warnings: [], errors: [] };
        }

        // 4. Default / Raw fallback
        return {
          data: { rawHex: Buffer.from(inputBytes).toString('hex') },
          warnings: ['No standard decode function (decodeUplink, Decode, or Decoder) found in script.'],
          errors: []
        };
      })()
    `;

    try {
      const script = new vm.Script(runnerScript);
      const output = script.runInContext(context, {
        timeout: timeoutMs,
        displayErrors: true,
      });

      const execTime = Date.now() - startTime;

      let extractedData: any = {};
      const warnings: string[] = [];
      const errors: string[] = [];

      if (output && typeof output === 'object') {
        if ('data' in output) {
          extractedData = output.data;
        } else {
          extractedData = output;
        }

        if (Array.isArray(output.warnings)) {
          warnings.push(...output.warnings);
        }
        if (Array.isArray(output.errors)) {
          errors.push(...output.errors);
        }
      } else {
        extractedData = output;
      }

      return {
        success: errors.length === 0,
        data: extractedData,
        warnings,
        errors,
        logs,
        bytes: parsed.bytes,
        fPort,
        executionTimeMs: execTime,
      };
    } catch (err: any) {
      const execTime = Date.now() - startTime;
      return {
        success: false,
        data: null,
        warnings: [],
        errors: [`Execution error: ${err.message}`],
        logs,
        bytes: parsed.bytes,
        fPort,
        executionTimeMs: execTime,
      };
    }
  }
}
