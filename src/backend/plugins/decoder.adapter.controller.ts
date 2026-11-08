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
  sku?: string;
  longFw?: string;
  itemCode?: string;
  fwCode?: string;
  fwVersion?: string;
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
  itemCode?: string;
  fwCode?: string;
  fwVersion?: string;
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
  itemCode?: string;
  fwCode?: string;
  fwVersion?: string;
  payload: string | number[];
  fPort?: number;
  inputFormat?: 'hex' | 'base64' | 'bytes';
  variables?: Record<string, any>;
}

export interface DecodeByProductDto {
  sku?: string;
  longFw?: string;
  itemCode?: string;
  fwCode?: string;
  fwVersion?: string;
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
   * Return available memmaps (ITEM_CODE, FW_VERSION, SKU & LONG_FW) along with whether they have a decoder script configured
   */
  @Get(['api/plugins/decoder/memmaps', 'api/v1/plugins/decoder/memmaps', 'api/plugins/decode/memmaps', 'api/v1/plugins/decode/memmaps'])
  async getMemmapsWithDecoderStatus(
    @Query('sku') skuQuery?: string,
    @Query('itemCode') itemCodeQuery?: string,
    @Query('fwVersion') fwVersionQuery?: string,
    @Query('configured') configuredQuery?: string,
  ) {
    try {
      const memmapRepo = this.getMemmapRepo();
      const decoderRepo = this.getDecoderRepo();

      const qb = memmapRepo.createQueryBuilder('m');
      if (itemCodeQuery) {
        qb.andWhere('LOWER(m.itemCode) LIKE LOWER(:itemCode)', { itemCode: `%${itemCodeQuery}%` });
      }
      if (fwVersionQuery) {
        qb.andWhere('LOWER(m.fwVersion) LIKE LOWER(:fwVersion)', { fwVersion: `%${fwVersionQuery}%` });
      }
      if (skuQuery) {
        qb.andWhere('(LOWER(m.sku) LIKE LOWER(:sku) OR LOWER(m.itemCode) LIKE LOWER(:sku))', { sku: `%${skuQuery}%` });
      }
      qb.orderBy('m.itemCode', 'ASC').addOrderBy('m.sku', 'ASC');

      const memmaps = await qb.getMany();
      const decoders = await decoderRepo.find();

      const decoderMapByItemFw = new Map<string, DecoderScriptEntity>();
      const decoderMapBySku = new Map<string, DecoderScriptEntity>();

      for (const d of decoders) {
        const item = (d.item_code || '').trim().toLowerCase();
        const fw = (d.fw_version || d.fw_code || '').trim().toLowerCase();
        if (item && fw) {
          decoderMapByItemFw.set(`${item}:::${fw}`, d);
        }
        const sku = (d.sku || '').trim().toLowerCase();
        const longFw = (d.long_fw || '').trim().toLowerCase();
        if (sku && longFw) {
          decoderMapBySku.set(`${sku}:::${longFw}`, d);
        }
      }

      let results = memmaps.map((m) => {
        const itemKey = `${(m.itemCode || '').trim().toLowerCase()}:::${(m.fwVersion || '').trim().toLowerCase()}`;
        const skuKey = `${(m.sku || '').trim().toLowerCase()}:::${(m.longFw || '').trim().toLowerCase()}`;
        const matchedDecoder = decoderMapByItemFw.get(itemKey) || decoderMapBySku.get(skuKey);

        return {
          id: m.id,
          name: m.name,
          itemCode: m.itemCode || m.sku,
          fwVersion: m.fwVersion || m.longFw,
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
   * Returns distinct list of ITEM_CODEs / SKUs and available FW_VERSIONs / LONG_FWs from memmap and decoders
   */
  @Get(['api/plugins/decoder/skus', 'api/v1/plugins/decoder/skus', 'api/plugins/decode/skus', 'api/v1/plugins/decode/skus'])
  async getAvailableSkus() {
    try {
      const memmapRepo = this.getMemmapRepo();
      const decoderRepo = this.getDecoderRepo();

      const memmaps = await memmapRepo.find({ select: ['id', 'name', 'itemCode', 'fwVersion', 'sku', 'longFw', 'shortFw'] });
      const decoders = await decoderRepo.find({ select: ['id', 'name', 'item_code', 'fw_version', 'fw_code', 'sku', 'long_fw', 'is_active'] });

      const itemMap = new Map<string, { itemCode: string; sku?: string; fwVersions: Set<string>; longFws: Set<string>; configuredCount: number; totalCount: number }>();

      for (const m of memmaps) {
        const primaryCode = (m.itemCode || m.sku || '').trim();
        if (!primaryCode) continue;
        if (!itemMap.has(primaryCode)) {
          itemMap.set(primaryCode, { itemCode: primaryCode, sku: m.sku || primaryCode, fwVersions: new Set(), longFws: new Set(), configuredCount: 0, totalCount: 0 });
        }
        const item = itemMap.get(primaryCode)!;
        item.totalCount++;
        if (m.fwVersion) item.fwVersions.add(m.fwVersion.trim());
        if (m.longFw) item.longFws.add(m.longFw.trim());
      }

      for (const d of decoders) {
        const primaryCode = (d.item_code || d.sku || '').trim();
        if (!primaryCode) continue;
        if (!itemMap.has(primaryCode)) {
          itemMap.set(primaryCode, { itemCode: primaryCode, sku: d.sku || primaryCode, fwVersions: new Set(), longFws: new Set(), configuredCount: 0, totalCount: 0 });
        }
        const item = itemMap.get(primaryCode)!;
        if (d.fw_version) item.fwVersions.add(d.fw_version.trim());
        if (d.fw_code) item.fwVersions.add(d.fw_code.trim());
        if (d.long_fw) item.longFws.add(d.long_fw.trim());
        item.configuredCount++;
      }

      const list = Array.from(itemMap.values()).map((v) => ({
        itemCode: v.itemCode,
        sku: v.sku || v.itemCode,
        fwVersions: Array.from(v.fwVersions),
        longFws: Array.from(v.longFws),
        configuredCount: v.configuredCount,
        totalCount: v.totalCount,
      }));

      return {
        success: true,
        data: list,
      };
    } catch (err: any) {
      this.logger.error(`Failed to get available SKUs/items: ${err.message}`, err.stack);
      throw new HttpException(
        { success: false, error: 'Failed to retrieve SKUs/items', message: err.message },
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
    @Query('itemCode') itemCode?: string,
    @Query('fwCode') fwCode?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    try {
      const repo = this.getDecoderRepo();
      let scripts: DecoderScriptEntity[] = [];
      try {
        const qb = repo.createQueryBuilder('d');

      if (sku) {
        qb.andWhere('LOWER(d.sku) = LOWER(:sku)', { sku: sku.trim() });
      }
      if (longFw) {
        qb.andWhere('(LOWER(d.long_fw) = LOWER(:longFw) OR LOWER(COALESCE(d.fw_version, d.fw_code)) = LOWER(:longFw))', { longFw: longFw.trim() });
      }
      if (itemCode) {
        qb.andWhere('(LOWER(d.item_code) = LOWER(:itemCode) OR LOWER(d.sku) = LOWER(:itemCode))', { itemCode: itemCode.trim() });
      }
      if (fwCode) {
        qb.andWhere('(LOWER(d.fw_code) = LOWER(:fwCode) OR LOWER(d.fw_version) = LOWER(:fwCode) OR LOWER(d.long_fw) = LOWER(:fwCode))', { fwCode: fwCode.trim() });
      }
      if (isActive !== undefined && isActive !== '') {
        const activeBool = isActive === 'true' || isActive === '1';
        qb.andWhere('d.is_active = :isActive', { isActive: activeBool });
      }
      if (search) {
        qb.andWhere(
          '(LOWER(d.name) LIKE LOWER(:search) OR LOWER(d.sku) LIKE LOWER(:search) OR LOWER(d.long_fw) LIKE LOWER(:search) OR LOWER(COALESCE(d.item_code, \'\')) LIKE LOWER(:search) OR LOWER(COALESCE(d.fw_code, \'\')) LIKE LOWER(:search) OR LOWER(COALESCE(d.fw_version, \'\')) LIKE LOWER(:search) OR LOWER(COALESCE(d.description, \'\')) LIKE LOWER(:search))',
          { search: `%${search.trim()}%` },
        );
      }

      qb.orderBy('d.updated_at', 'DESC');
      scripts = await qb.getMany();
    } catch (queryErr: any) {
      if (queryErr?.message?.includes('fw_version does not exist')) {
        // Fallback query for pre-migration 004 schema
        const ds = this.databaseService.getDataSourceForTable('decoder_scripts');
        const rows = await ds.query(`
          SELECT
            id, name, sku, long_fw, item_code, fw_code,
            fw_code AS fw_version,
            protocol, script, description, input_format,
            sample_payload, sample_fport, sample_decoded,
            is_active, metadata, created_at, updated_at, created_by
          FROM decoder.decoder_scripts
          ORDER BY updated_at DESC
        `).catch(() => []);
        scripts = rows.map((r: any) => ({
          ...r,
          fw_version: r.fw_version || r.fw_code || r.long_fw,
        })) as any;
      } else {
        throw queryErr;
      }
    }

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
      const cleanItemCode = (dto.itemCode || dto.sku || '').trim();
      const cleanFwVersion = (dto.fwVersion || dto.fwCode || dto.longFw || '').trim();

      if (!dto.name || !dto.script || (!cleanItemCode && !dto.sku)) {
        throw new BadRequestException('name, script, and (itemCode or sku) are required');
      }

      const cleanSku = (dto.sku || cleanItemCode).trim();
      const cleanLongFw = (dto.longFw || cleanFwVersion).trim();
      const repo = this.getDecoderRepo();

      // Check duplicate by item_code + fw_version or sku + long_fw
      const qb = repo.createQueryBuilder('d');
      if (cleanItemCode && cleanFwVersion) {
        qb.where(
          '(LOWER(COALESCE(d.item_code, d.sku)) = LOWER(:itemCode) AND LOWER(COALESCE(d.fw_version, d.fw_code, d.long_fw)) = LOWER(:fwVersion))',
          { itemCode: cleanItemCode, fwVersion: cleanFwVersion },
        );
      } else {
        qb.where('LOWER(d.sku) = LOWER(:sku) AND LOWER(d.long_fw) = LOWER(:longFw)', {
          sku: cleanSku,
          longFw: cleanLongFw,
        });
      }

      const existing = await qb.getOne();
      if (existing) {
        throw new BadRequestException(
          `Decoder script for ITEM_CODE '${cleanItemCode}' and FW_VERSION '${cleanFwVersion}' already exists (ID: ${existing.id})`,
        );
      }

      const entity = repo.create({
        name: dto.name.trim(),
        sku: cleanSku,
        long_fw: cleanLongFw,
        item_code: cleanItemCode || null,
        fw_code: cleanFwVersion || null,
        fw_version: cleanFwVersion || null,
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
          name: saved.name,
          sku: saved.sku,
          longFw: saved.long_fw,
          itemCode: saved.item_code,
          fwVersion: saved.fw_version,
        });
      }

      return {
        success: true,
        data: saved,
        message: `Decoder script created successfully for ITEM_CODE '${saved.item_code || saved.sku}' and FW_VERSION '${saved.fw_version || saved.long_fw}'`,
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

      const targetItemCode = dto.itemCode !== undefined ? dto.itemCode.trim() : (existing.item_code || existing.sku);
      const targetFwVersion = dto.fwVersion !== undefined ? dto.fwVersion.trim() : (existing.fw_version || existing.fw_code || existing.long_fw);
      const targetSku = dto.sku ? dto.sku.trim() : (existing.sku || targetItemCode);
      const targetLongFw = dto.longFw ? dto.longFw.trim() : (existing.long_fw || targetFwVersion);

      // Check conflict if identifiers changed
      if (targetItemCode && targetFwVersion) {
        const conflict = await repo
          .createQueryBuilder('d')
          .where(
            'd.id != :id AND LOWER(COALESCE(d.item_code, d.sku)) = LOWER(:itemCode) AND LOWER(COALESCE(d.fw_version, d.fw_code, d.long_fw)) = LOWER(:fwVersion)',
            { id, itemCode: targetItemCode, fwVersion: targetFwVersion },
          )
          .getOne();

        if (conflict) {
          throw new BadRequestException(
            `Another decoder script for ITEM_CODE '${targetItemCode}' and FW_VERSION '${targetFwVersion}' already exists (ID: ${conflict.id})`,
          );
        }
      }

      if (dto.name !== undefined) existing.name = dto.name.trim();
      if (dto.sku !== undefined) existing.sku = targetSku;
      if (dto.longFw !== undefined) existing.long_fw = targetLongFw;
      if (dto.itemCode !== undefined) existing.item_code = targetItemCode || null;
      if (dto.fwCode !== undefined) existing.fw_code = dto.fwCode.trim() || null;
      if (dto.fwVersion !== undefined) {
        existing.fw_version = targetFwVersion || null;
        if (!existing.fw_code) existing.fw_code = targetFwVersion || null;
      }
      if (dto.script !== undefined) existing.script = dto.script;
      if (dto.protocol !== undefined) existing.protocol = dto.protocol;
      if (dto.description !== undefined) existing.description = dto.description;
      if (dto.inputFormat !== undefined) existing.input_format = dto.inputFormat;
      if (dto.samplePayload !== undefined) existing.sample_payload = dto.samplePayload;
      if (dto.sampleFport !== undefined) existing.sample_fport = Number(dto.sampleFport);
      if (dto.sampleDecoded !== undefined) existing.sample_decoded = dto.sampleDecoded;
      if (dto.isActive !== undefined) existing.is_active = Boolean(dto.isActive);
      if (dto.metadata !== undefined) existing.metadata = dto.metadata;

      const updated = await repo.save(existing);

      if (this.realtimeService) {
        this.realtimeService.publishPluginLifecycle('decoder:updated', {
          id: updated.id,
          name: updated.name,
          sku: updated.sku,
          longFw: updated.long_fw,
          itemCode: updated.item_code,
          fwVersion: updated.fw_version,
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

    const templateDaviteqWSLRW_DI = `// JavaScript Decoder for SKU WSLRW-DI firmware 3 on Things Stack (TTN)/Chirpstack Network Server
function decodeUplink(input) {
  var byte = input.bytes;
  var data = {};
  if (byte.length == 10 || byte.length == 11 || byte.length == 8) {
    data = {
      EVENT_ID: (byte[0] >> 4) === 0 ? UINT8((byte[0]) >> 4) : (byte[0] >> 4) === 1 ? UINT8((byte[0]) >> 4) : (byte[0] >> 4) === 2 ? UINT8((byte[0]) >> 4) : (byte[0] >> 4) === 3 ? UINT8((byte[0]) >> 4) : (byte[0] >> 4) === 4 ? UINT8((byte[0]) >> 4) : (byte[0] >> 4) === 5 ? UINT8((byte[0]) >> 4) : (byte[0] >> 4) === 15 ? UINT8((byte[0]) >> 4) : (byte[0] >> 4) === 13 ? UINT8((byte[0]) >> 4) : "NULL",
      HW_VERSION: (byte[0] >> 4) === 0 ? UINT8((byte[0] & 0x0F)) : (byte[0] >> 4) === 1 ? UINT8((byte[0] & 0x0F)) : (byte[0] >> 4) === 5 ? UINT8((byte[0] & 0x0F)) : (byte[0] >> 4) === 15 ? UINT8((byte[0] & 0x0F)) : (byte[0] >> 4) === 13 ? UINT8((byte[0] & 0x0F)) : (byte[0] >> 4) === 2 ? UINT8((byte[0] & 0x0F)) : (byte[0] >> 4) === 3 ? UINT8((byte[0] & 0x0F)) : (byte[0] >> 4) === 4 ? UINT8((byte[0] & 0x0F)) : "NULL",
      FW_VERSION: (byte[0] >> 4) === 0 ? UINT8(byte[1]) : (byte[0] >> 4) === 1 ? UINT8(byte[1]) : (byte[0] >> 4) === 5 ? UINT8(byte[1]) : (byte[0] >> 4) === 15 ? UINT8(byte[1]) : (byte[0] >> 4) === 13 ? UINT8(byte[1]) : (byte[0] >> 4) === 2 ? UINT8(byte[1]) : (byte[0] >> 4) === 3 ? UINT8(byte[1]) : (byte[0] >> 4) === 4 ? UINT8(byte[1]) : "NULL",
      VOLTAGE_VALUE: (byte[0] >> 4) === 0 ? UINT8(byte[2]) / 10 : (byte[0] >> 4) === 1 ? UINT8(byte[2]) / 10 : (byte[0] >> 4) === 5 ? UINT8(byte[2]) / 10 : (byte[0] >> 4) === 15 ? UINT8(byte[2]) / 10 : (byte[0] >> 4) === 13 ? UINT8(byte[2]) / 10 : (byte[0] >> 4) === 2 ? UINT8(byte[2]) / 10 : (byte[0] >> 4) === 3 ? UINT8(byte[2]) / 10 : (byte[0] >> 4) === 4 ? UINT8(byte[2]) / 10 : "NULL",
      INPUT_VALUE: (byte[0] >> 4) === 0 ? UINT8((byte[3] >> 7) & 0x01) : (byte[0] >> 4) === 1 ? UINT8((byte[3] >> 7) & 0x01) : (byte[0] >> 4) === 5 ? UINT8((byte[3] >> 7) & 0x01) : (byte[0] >> 4) === 15 ? UINT8((byte[3] >> 7) & 0x01) : (byte[0] >> 4) === 13 ? UINT8((byte[3] >> 7) & 0x01) : (byte[0] >> 4) === 2 ? UINT8((byte[3] >> 7) & 0x01) : (byte[0] >> 4) === 3 ? UINT8((byte[3] >> 7) & 0x01) : (byte[0] >> 4) === 4 ? UINT8((byte[3] >> 7) & 0x01) : "NULL",
      PULSE_LEAK_DETECTOR_VALUE: (byte[0] >> 4) === 0 ? UINT8((byte[3] >> 6) & 0x01) : (byte[0] >> 4) === 1 ? UINT8((byte[3] >> 6) & 0x01) : (byte[0] >> 4) === 5 ? UINT8((byte[3] >> 6) & 0x01) : (byte[0] >> 4) === 15 ? UINT8((byte[3] >> 6) & 0x01) : (byte[0] >> 4) === 13 ? UINT8((byte[3] >> 6) & 0x01) : (byte[0] >> 4) === 2 ? UINT8((byte[3] >> 6) & 0x01) : (byte[0] >> 4) === 3 ? UINT8((byte[3] >> 6) & 0x01) : (byte[0] >> 4) === 4 ? UINT8((byte[3] >> 6) & 0x01) : "NULL",
      PULSE_FORWARD_COUNTER_VALUE: (byte[0] >> 4) === 0 ? UINT32((byte[4] << 24) | (byte[5] << 16) | (byte[6] << 8) | byte[7]) : (byte[0] >> 4) === 1 ? UINT32((byte[4] << 24) | (byte[5] << 16) | (byte[6] << 8) | byte[7]) : (byte[0] >> 4) === 5 ? UINT32((byte[4] << 24) | (byte[5] << 16) | (byte[6] << 8) | byte[7]) : (byte[0] >> 4) === 15 ? UINT32((byte[4] << 24) | (byte[5] << 16) | (byte[6] << 8) | byte[7]) : (byte[0] >> 4) === 13 ? UINT32((byte[4] << 24) | (byte[5] << 16) | (byte[6] << 8) | byte[7]) : (byte[0] >> 4) === 2 ? UINT32((byte[4] << 24) | (byte[5] << 16) | (byte[6] << 8) | byte[7]) : (byte[0] >> 4) === 3 ? UINT32((byte[4] << 24) | (byte[5] << 16) | (byte[6] << 8) | byte[7]) : (byte[0] >> 4) === 4 ? UINT32((byte[4] << 24) | (byte[5] << 16) | (byte[6] << 8) | byte[7]) : "NULL",
      TAMPER_DETECT_EVENT: (byte[0] >> 4) === 1 ? UINT8((byte[8] >> 7) & 0x01) : "NULL",
      SWITCH_STATE: (byte[0] >> 4) === 1 ? UINT8((byte[8] >> 6) & 0x01) : "NULL",
      INTERNAL_LOG_ID: (byte[0] >> 4) === 5 ? UINT16((byte[8] << 8) | byte[9]) : "NULL",
      LAST_FORWARD_PULSE_TIME: (byte[0] >> 4) === 13 ? UINT16((byte[8] << 8) | byte[9]) : "NULL",
      FIRST_FORWARD_PULSE_TIME: (byte[0] >> 4) === 15 ? UINT16((byte[8] << 8) | byte[9]) : "NULL",
      LEAK_DURATION_TOTAL: (byte[0] >> 4) === 15 ? UINT8(byte[10]) : "NULL",
      CONFIGURATION_CHECK_SUM: (byte[0] >> 4) === 0 ? HEX(UINT16((byte[8] << 8) | byte[9])) : (byte[0] >> 4) === 2 ? HEX(UINT16((byte[8] << 8) | byte[9])) : (byte[0] >> 4) === 3 ? HEX(UINT16((byte[8] << 8) | byte[9])) : (byte[0] >> 4) === 4 ? HEX(UINT16((byte[8] << 8) | byte[9])) : "NULL"
    };
  }
  return {
    data: data
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
      template: templateDaviteqWSLRW_DI,
      defaultTemplate: templateDaviteqWSLRW_DI,
      templates: {
        daviteqWSLRW_DI: templateDaviteqWSLRW_DI,
        chirpstackV4: templateChirpstackV4,
      },
      standards: [
        'Daviteq WSLRW-DI (decodeUplink)',
        'ChirpStack v4 (decodeUplink)',
        'TTN v3 / ChirpStack v3 (Decode)',
        'TTN v2 (Decoder)',
      ],
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
      } else if (!scriptContent && (dto.itemCode || dto.sku) && (dto.fwVersion || dto.fwCode || dto.longFw)) {
        const repo = this.getDecoderRepo();
        const code = (dto.itemCode || dto.sku)!.trim();
        const fw = (dto.fwVersion || dto.fwCode || dto.longFw)!.trim();
        const found = await repo
          .createQueryBuilder('d')
          .where('((LOWER(d.item_code) = LOWER(:code) OR LOWER(d.sku) = LOWER(:code)) AND (LOWER(COALESCE(d.fw_version, d.fw_code)) = LOWER(:fw) OR LOWER(d.long_fw) = LOWER(:fw)))', {
            code,
            fw,
          })
          .getOne();
        if (!found) {
          throw new NotFoundException(
            `No decoder script found for identifier '${code}' and version '${fw}'`,
          );
        }
        scriptContent = found.script;
      }

      if (!scriptContent) {
        throw new BadRequestException('Either script, scriptId, or (itemCode + fwVersion) is required to run test');
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
   * 4-tier resolution algorithm for device testing & products:
   * Tier 0: (item_code, fw_version) direct match
   * Tier 1: (item_code, fw_code, long_fw)
   * Tier 2: (fw_code, long_fw)
   * Tier 3: (item_code, long_fw)
   * Tier 4: (sku, long_fw)
   */
  async resolveDecoderScript(params: {
    itemCode?: string;
    fwCode?: string;
    fwVersion?: string;
    sku?: string;
    longFw?: string;
  }): Promise<{ matched: DecoderScriptEntity | null; matchTier: string | null }> {
    const repo = this.getDecoderRepo();
    const itemCode = (params.itemCode || '').trim();
    const fwVersion = (params.fwVersion || params.fwCode || '').trim();
    const fwCode = (params.fwCode || params.fwVersion || '').trim();
    const sku = (params.sku || '').trim();
    const longFw = (params.longFw || '').trim();

    // Tier 0: Direct (item_code, fw_version)
    if (itemCode && fwVersion) {
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('(LOWER(d.item_code) = LOWER(:itemCode) OR LOWER(d.sku) = LOWER(:itemCode)) AND (LOWER(COALESCE(d.fw_version, d.fw_code)) = LOWER(:fwVersion) OR LOWER(d.long_fw) = LOWER(:fwVersion))', {
          itemCode,
          fwVersion,
        })
        .getOne();
      if (match) return { matched: match, matchTier: 'tier0_item_fw_version' };
    }

    // Tier 1: (item_code, fw_code, long_fw)
    if (itemCode && fwCode && longFw) {
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('LOWER(d.item_code) = LOWER(:itemCode) AND LOWER(d.fw_code) = LOWER(:fwCode) AND LOWER(d.long_fw) = LOWER(:longFw)', {
          itemCode,
          fwCode,
          longFw,
        })
        .getOne();
      if (match) return { matched: match, matchTier: 'tier1_item_fw_longfw' };
    }

    // Tier 2: (fw_code, long_fw)
    if (fwCode && longFw) {
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('LOWER(d.fw_code) = LOWER(:fwCode) AND LOWER(d.long_fw) = LOWER(:longFw)', {
          fwCode,
          longFw,
        })
        .getOne();
      if (match) return { matched: match, matchTier: 'tier2_fw_longfw' };
    }

    // Tier 3: (item_code, long_fw)
    if (itemCode && longFw) {
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('LOWER(d.item_code) = LOWER(:itemCode) AND LOWER(d.long_fw) = LOWER(:longFw)', {
          itemCode,
          longFw,
        })
        .getOne();
      if (match) return { matched: match, matchTier: 'tier3_item_longfw' };
    }

    // Tier 4: (sku, long_fw)
    if (sku && longFw) {
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('LOWER(d.sku) = LOWER(:sku) AND LOWER(d.long_fw) = LOWER(:longFw)', {
          sku,
          longFw,
        })
        .getOne();
      if (match) return { matched: match, matchTier: 'tier4_sku_longfw' };
    }

    // Tier 4b: (item_code, fw_code)
    if (itemCode && fwCode) {
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('LOWER(d.item_code) = LOWER(:itemCode) AND LOWER(d.fw_code) = LOWER(:fwCode)', {
          itemCode,
          fwCode,
        })
        .getOne();
      if (match) return { matched: match, matchTier: 'tier4b_item_fwcode' };
    }

    // Tier 4c: (sku, fw_code)
    if (sku && fwCode) {
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('LOWER(d.sku) = LOWER(:sku) AND LOWER(d.fw_code) = LOWER(:fwCode)', {
          sku,
          fwCode,
        })
        .getOne();
      if (match) return { matched: match, matchTier: 'tier4c_sku_fwcode' };
    }

    // Tier 4d: Cross-combination (item_code or sku) with (long_fw or fw_code)
    const codeIdent = itemCode || sku;
    const fwIdent = fwCode || longFw;
    if (codeIdent && fwIdent) {
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('(LOWER(d.item_code) = LOWER(:code) OR LOWER(d.sku) = LOWER(:code)) AND (LOWER(d.long_fw) = LOWER(:fw) OR LOWER(d.fw_code) = LOWER(:fw))', {
          code: codeIdent,
          fw: fwIdent,
        })
        .getOne();
      if (match) return { matched: match, matchTier: 'tier4d_code_fw_cross' };
    }

    // Tier 4e: Fuzzy / prefix match between code and fw
    if (codeIdent && fwIdent) {
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('(LOWER(d.item_code) LIKE LOWER(:likeCode) OR LOWER(d.sku) LIKE LOWER(:likeCode) OR LOWER(:code) LIKE CONCAT(\'%\', LOWER(d.item_code), \'%\') OR LOWER(:code) LIKE CONCAT(\'%\', LOWER(d.sku), \'%\')) AND (LOWER(d.long_fw) LIKE LOWER(:likeFw) OR LOWER(d.fw_code) LIKE LOWER(:likeFw) OR LOWER(:fw) LIKE CONCAT(\'%\', LOWER(d.long_fw), \'%\') OR LOWER(:fw) LIKE CONCAT(\'%\', LOWER(d.fw_code), \'%\'))', {
          code: codeIdent,
          likeCode: `%${codeIdent}%`,
          fw: fwIdent,
          likeFw: `%${fwIdent}%`,
        })
        .getOne();
      if (match) return { matched: match, matchTier: 'tier4e_code_fw_fuzzy' };
    }

    // Tier 5: fallback by item_code alone (or sku)
    if (itemCode || sku) {
      const targetCode = itemCode || sku;
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('(LOWER(d.item_code) = LOWER(:code) OR LOWER(d.sku) = LOWER(:code) OR LOWER(d.name) LIKE LOWER(:likeCode))', {
          code: targetCode,
          likeCode: `%${targetCode}%`,
        })
        .orderBy('d.created_at', 'DESC')
        .getOne();
      if (match) return { matched: match, matchTier: 'tier5_item_or_sku' };
    }

    // Tier 6: fallback by fw_code or long_fw alone
    if (fwCode || longFw) {
      const targetFw = fwCode || longFw;
      const match = await repo
        .createQueryBuilder('d')
        .where('d.is_active = true')
        .andWhere('(LOWER(d.fw_code) = LOWER(:fw) OR LOWER(d.long_fw) = LOWER(:fw) OR LOWER(d.name) LIKE LOWER(:likeFw))', {
          fw: targetFw,
          likeFw: `%${targetFw}%`,
        })
        .orderBy('d.created_at', 'DESC')
        .getOne();
      if (match) return { matched: match, matchTier: 'tier6_fw_code' };
    }

    // Tier 7: In case is_active is null, false, or inactive, match regardless of is_active
    if (codeIdent && fwIdent) {
      const match = await repo
        .createQueryBuilder('d')
        .where('1=1')
        .andWhere('(LOWER(d.item_code) = LOWER(:code) OR LOWER(d.sku) = LOWER(:code) OR LOWER(d.name) LIKE LOWER(:likeCode)) AND (LOWER(d.long_fw) = LOWER(:fw) OR LOWER(d.fw_code) = LOWER(:fw) OR LOWER(d.long_fw) LIKE LOWER(:likeFw) OR LOWER(d.fw_code) LIKE LOWER(:likeFw))', {
          code: codeIdent,
          likeCode: `%${codeIdent}%`,
          fw: fwIdent,
          likeFw: `%${fwIdent}%`,
        })
        .orderBy('d.created_at', 'DESC')
        .getOne();
      if (match) return { matched: match, matchTier: 'tier7_code_fw_any' };
    }

    if (codeIdent) {
      const match = await repo
        .createQueryBuilder('d')
        .where('1=1')
        .andWhere('(LOWER(d.item_code) = LOWER(:code) OR LOWER(d.sku) = LOWER(:code) OR LOWER(d.name) LIKE LOWER(:likeCode))', {
          code: codeIdent,
          likeCode: `%${codeIdent}%`,
        })
        .orderBy('d.created_at', 'DESC')
        .getOne();
      if (match) return { matched: match, matchTier: 'tier7_code_any' };
    }

    return { matched: null, matchTier: null };
  }

  /**
   * POST /api/plugins/decoder/resolve
   * Resolve matching decoder script given testing device identifiers (item_code, fw_code, sku, long_fw)
   */
  @Post(['api/plugins/decoder/resolve', 'api/v1/plugins/decoder/resolve', 'api/plugins/decode/resolve', 'api/v1/plugins/decode/resolve'])
  async resolveDecoderEndpoint(@Body() body: any) {
    const { matched, matchTier } = await this.resolveDecoderScript({
      itemCode: body.itemCode || body.item_code,
      fwCode: body.fwCode || body.fw_code,
      sku: body.sku,
      longFw: body.longFw || body.long_fw || body.fwVersion || body.fw_version,
    });

    if (!matched) {
      return {
        success: false,
        message: 'No active decoder matched for provided identifiers',
        matched: null,
      };
    }

    return {
      success: true,
      matchTier,
      data: matched,
    };
  }

  /**
   * POST /api/plugins/decoder/decode
   * Core capability: Identify decoder script automatically from SKU, ITEM_CODE, FW_CODE, and LONG_FW and decode payload
   */
  @Post(['api/plugins/decoder/decode', 'api/v1/plugins/decoder/decode', 'api/plugins/decode/payload', 'api/v1/plugins/decode/payload', 'api/v1/plugins/decode/decode'])
  async decodeBySkuAndLongFw(@Body() dto: DecodeByProductDto) {
    try {
      if (!dto.itemCode && !dto.fwCode && (!dto.sku || !dto.longFw)) {
        throw new BadRequestException('itemCode, fwCode, or (sku and longFw) are required to identify product decoder');
      }

      if (dto.payload === undefined || dto.payload === null) {
        throw new BadRequestException('payload is required');
      }

      const { matched, matchTier } = await this.resolveDecoderScript({
        itemCode: dto.itemCode,
        fwCode: dto.fwCode,
        sku: dto.sku,
        longFw: dto.longFw,
      });

      if (!matched) {
        throw new NotFoundException(
          `No registered decoder script found for itemCode='${dto.itemCode || ''}', fwCode='${dto.fwCode || ''}', sku='${dto.sku || ''}' and LONG_FW='${dto.longFw || ''}'`,
        );
      }

      if (!matched.is_active) {
        throw new BadRequestException(
          `Decoder script '${matched.name}' for SKU '${matched.sku}' is currently disabled (inactive)`,
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
          itemCode: matched.item_code,
          fwCode: matched.fw_code,
          protocol: matched.protocol,
          matchTier,
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

    const uint8Fn = (byte: any) => ((Number(byte) || 0) & 0xFF);
    const uint16Fn = (byte1: any, byte2?: any) => {
      if (byte2 === undefined) return ((Number(byte1) || 0) & 0xFFFF);
      return (((Number(byte1) || 0) & 0xFF) << 8) | ((Number(byte2) || 0) & 0xFF);
    };
    const uint32Fn = (byte1: any, byte2?: any, byte3?: any, byte4?: any) => {
      if (byte2 === undefined) return (Number(byte1) || 0) >>> 0;
      return (
        (((Number(byte1) || 0) & 0xFF) * Math.pow(2, 24)) +
        (((Number(byte2) || 0) & 0xFF) * Math.pow(2, 16)) +
        (((Number(byte3) || 0) & 0xFF) * Math.pow(2, 8)) +
        ((Number(byte4) || 0) & 0xFF)
      );
    };
    const hexFn = (...bytes: any[]) => {
      if (bytes.length === 1 && typeof bytes[0] === 'number') {
        return Number(bytes[0]).toString(16).toUpperCase();
      }
      let hex = '';
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === undefined || bytes[i] === null || isNaN(bytes[i]) || bytes[i] === 'na') continue;
        let hexByte = (Number(bytes[i]) & 0xFF).toString(16);
        if (hexByte.length < 2) hexByte = '0' + hexByte;
        hex += hexByte;
      }
      return hex.toUpperCase();
    };

    const sandbox: Record<string, any> = {
      console: sandboxConsole,
      bytes: parsed.bytes,
      fPort,
      variables,
      UINT8: uint8Fn,
      UINT16: uint16Fn,
      UINT32: uint32Fn,
      HEX: hexFn,
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
      var UINT8 = typeof UINT8 === 'function' ? UINT8 : function(b) { return ((Number(b) || 0) & 0xFF); };
      var UINT16 = typeof UINT16 === 'function' ? UINT16 : function(b1, b2) {
        if (b2 === undefined) return ((Number(b1) || 0) & 0xFFFF);
        return (((Number(b1) || 0) & 0xFF) << 8) | ((Number(b2) || 0) & 0xFF);
      };
      var UINT32 = typeof UINT32 === 'function' ? UINT32 : function(b1, b2, b3, b4) {
        if (b2 === undefined) return (Number(b1) || 0) >>> 0;
        return (((Number(b1) || 0) & 0xFF) * Math.pow(2, 24)) + (((Number(b2) || 0) & 0xFF) * Math.pow(2, 16)) + (((Number(b3) || 0) & 0xFF) * Math.pow(2, 8)) + ((Number(b4) || 0) & 0xFF);
      };
      var HEX = typeof HEX === 'function' ? HEX : function() {
        if (arguments.length === 1 && typeof arguments[0] === 'number') return Number(arguments[0]).toString(16).toUpperCase();
        var h = '';
        for (var i = 0; i < arguments.length; i++) {
          if (arguments[i] === undefined || arguments[i] === null || isNaN(arguments[i])) continue;
          var hb = (Number(arguments[i]) & 0xFF).toString(16);
          if (hb.length < 2) hb = '0' + hb;
          h += hb;
        }
        return h.toUpperCase();
      };

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
