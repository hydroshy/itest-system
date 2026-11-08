import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { MemmapProfileEntity } from '../core-models/memmap-profile.entity';
import { MemmapRegisterEntity } from '../core-models/memmap-register.entity';
import {
  MemmapManagerService,
  MemmapPreviewResult,
  MemmapProfileInput,
} from './memmap-manager-core';

@Controller()
export class MemmapManagerAdapterController implements OnModuleInit {
  private readonly logger = new Logger(MemmapManagerAdapterController.name);
  private service: MemmapManagerService;
  private schemaCompatibilityChecked = false;
  private hasItemCodeColumn = false;

  constructor(private readonly databaseService: DynamicDatabaseService) {
    this.initService();
  }

  async onModuleInit() {
    await this.ensureSchemaCompatibility();
  }

  private async ensureSchemaCompatibility(): Promise<void> {
    try {
      const ds = this.databaseService.getDataSourceForTable('memmap_profiles');
      if (ds && ds.isInitialized) {
        const check = await ds.query(`
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'memmap_manager' AND table_name = 'memmap_profiles' AND column_name = 'item_code'
          LIMIT 1;
        `).catch(() => []);
        this.hasItemCodeColumn = check && check.length > 0;
        this.schemaCompatibilityChecked = true;
      }
    } catch (e: any) {
      this.hasItemCodeColumn = false;
    }
  }

  private initService(): void {
    try {
      const candidatePaths = [
        path.resolve(process.cwd(), '../itest-plugins/plugins/memmap-manager/dist/index.js'),
        path.resolve(process.cwd(), 'plugins/memmap-manager/dist/index.js'),
        path.resolve(process.cwd(), '../plugins/memmap-manager/dist/index.js'),
      ];

      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          const mod = require(p);
          const ServiceClass = mod.MemmapManagerService || (mod.default && mod.default.MemmapManagerService);
          if (ServiceClass) {
            this.service = new ServiceClass();
            this.logger.log(`Initialized MemmapManagerService from external plugin at: ${p}`);
            return;
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not load external MemmapManagerService, falling back to embedded core: ${err.message}`);
    }

    this.service = new MemmapManagerService();
    this.logger.log('Initialized MemmapManagerService from embedded core.');
  }

  @Get([
    'api/plugins/memmap-manager/status',
    'api/v1/plugins/memmap-manager/status',
    'api/plugins/memmap-payload/status',
    'api/v1/plugins/memmap-payload/status',
    'plugins/memmap-manager/status',
    'plugins/memmap-payload/status',
  ])
  getStatus() {
    return this.service.getStatus();
  }

  @Get([
    'api/plugins/memmap-manager/profiles',
    'api/v1/plugins/memmap-manager/profiles',
    'api/plugins/memmap-payload/profiles',
    'api/v1/plugins/memmap-payload/profiles',
    'plugins/memmap-manager/profiles',
    'plugins/memmap-payload/profiles',
  ])
  async getProfiles() {
    try {
      const ds = this.databaseService.getDataSourceForTable('memmap_profiles');
      // 1. Try querying the optimized view v_memmap_profiles first
      try {
        const rows = await ds.query(`
          SELECT
            id,
            name,
            description,
            source_format AS "sourceFormat",
            item_code AS "itemCode",
            fw_version AS "fwVersion",
            sku,
            long_fw AS "longFw",
            short_fw AS "shortFw",
            dec_check AS "decimalCheck",
            hex_check AS "hexCheck",
            created_by AS "createdBy",
            date_create AS "dateCreate",
            COALESCE(registers_count, 0) AS "registersCount",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM memmap_manager.v_memmap_profiles
          ORDER BY created_at DESC
        `);
        if (rows && Array.isArray(rows) && rows.length > 0) {
          return rows.map((p) => ({
            ...p,
            createdAt: p.createdAt ? (p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt)) : new Date().toISOString(),
            updatedAt: p.updatedAt ? (p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt)) : undefined,
          }));
        }
      } catch (viewErr: any) {
        this.logger.debug(`v_memmap_profiles view not used, falling back to repository: ${viewErr.message}`);
      }

      // 2. Query memmap_profiles directly or via repository
      await this.ensureSchemaCompatibility();
      if (this.hasItemCodeColumn) {
        const profileRepo = this.databaseService.getRepositoryForTable('memmap_profiles', MemmapProfileEntity);
        const profiles = await profileRepo.find({
          relations: ['registers'],
          order: { createdAt: 'DESC' },
        });

        return profiles.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          sourceFormat: p.sourceFormat,
          itemCode: p.itemCode || undefined,
          fwVersion: p.fwVersion || undefined,
          sku: p.sku || undefined,
          longFw: p.longFw || undefined,
          shortFw: p.shortFw || undefined,
          decimalCheck: p.decCheck,
          hexCheck: p.hexCheck,
          createdBy: p.createdBy || undefined,
          dateCreate: p.dateCreate ? p.dateCreate.toISOString() : undefined,
          registersCount: p.registers ? p.registers.length : 0,
          createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: p.updatedAt ? p.updatedAt.toISOString() : undefined,
        }));
      } else {
        // Fallback for pre-migration 005 database
        const rows = await ds.query(`
          SELECT
            p.id,
            p.name,
            p.description,
            p.source_format AS "sourceFormat",
            p.sku,
            p.long_fw AS "longFw",
            p.short_fw AS "shortFw",
            p.dec_check AS "decimalCheck",
            p.hex_check AS "hexCheck",
            p.created_by AS "createdBy",
            p.date_create AS "dateCreate",
            p.created_at AS "createdAt",
            p.updated_at AS "updatedAt",
            COUNT(r.id)::int AS "registersCount"
          FROM memmap_manager.memmap_profiles p
          LEFT JOIN memmap_manager.memmap_registers r ON p.id = r.profile_id
          GROUP BY p.id
          ORDER BY p.created_at DESC
        `).catch(() => []);
        return rows || [];
      }
    } catch (err: any) {
      this.logger.error(`Error loading memmap profiles: ${err.message}`, err.stack);
      return [];
    }
  }

  @Get([
    'api/plugins/memmap-manager/profiles/:id',
    'api/v1/plugins/memmap-manager/profiles/:id',
    'api/plugins/memmap-payload/profiles/:id',
    'api/v1/plugins/memmap-payload/profiles/:id',
    'plugins/memmap-manager/profiles/:id',
    'plugins/memmap-payload/profiles/:id',
  ])
  async getProfileById(@Param('id') id: string) {
    const profileRepo = this.databaseService.getRepositoryForTable('memmap_profiles', MemmapProfileEntity);
    let profile: MemmapProfileEntity | null = null;
    try {
      profile = await profileRepo.findOne({
        where: { id },
        relations: ['registers'],
      });
    } catch (findErr: any) {
      if (findErr?.message?.includes('item_code does not exist')) {
        const ds = this.databaseService.getDataSourceForTable('memmap_profiles');
        const rows = await ds.query(
          `SELECT id, name, description, source_format AS "sourceFormat", sku, long_fw AS "longFw", short_fw AS "shortFw", dec_check AS "decCheck", hex_check AS "hexCheck", created_by AS "createdBy", date_create AS "dateCreate", created_at AS "createdAt", updated_at AS "updatedAt" FROM memmap_manager.memmap_profiles WHERE id = $1 LIMIT 1`,
          [id],
        ).catch(() => []);
        if (!rows || rows.length === 0) {
          throw new NotFoundException(`Profile [${id}] not found`);
        }
        const raw = rows[0];
        const regs = await ds.query(
          `SELECT * FROM memmap_manager.memmap_registers WHERE profile_id = $1 ORDER BY address ASC`,
          [id],
        ).catch(() => []);
        return {
          id: raw.id,
          name: raw.name,
          description: raw.description,
          sourceFormat: raw.sourceFormat,
          sku: raw.sku || undefined,
          longFw: raw.longFw || undefined,
          shortFw: raw.shortFw || undefined,
          registersCount: regs.length,
          registers: regs.map((r: any) => ({
            id: r.id,
            name: r.name,
            address: r.address,
            dataType: r.data_type,
            scale: r.scale !== null ? Number(r.scale) : 1,
            unit: r.unit || undefined,
            accessMode: r.access_mode || 'read',
            description: r.description || undefined,
          })),
        };
      } else {
        throw findErr;
      }
    }

    if (!profile) {
      throw new NotFoundException(`Profile [${id}] not found`);
    }

    const sortedRegisters = (profile.registers || []).sort((a, b) => a.address - b.address);

    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      sourceFormat: profile.sourceFormat,
      itemCode: profile.itemCode || undefined,
      fwVersion: profile.fwVersion || undefined,
      sku: profile.sku || undefined,
      longFw: profile.longFw || undefined,
      shortFw: profile.shortFw || undefined,
      decimalCheck: profile.decCheck,
      hexCheck: profile.hexCheck,
      dateCreate: profile.dateCreate?.toISOString(),
      createdBy: profile.createdBy || undefined,
      registersCount: sortedRegisters.length,
      registers: sortedRegisters.map((r) => ({
        id: r.id,
        name: r.name,
        rowNumber: r.no ?? undefined,
        modbusRegisterDecimal: r.modbusRegisterDec ?? r.address,
        modbusRegisterHex: r.modbusRegisterHex || undefined,
        functionCodeRead: r.fcRead || undefined,
        functionCodeWrite: r.fcWrite || undefined,
        registerCount: r.numRegisters ?? 1,
        description: r.description || undefined,
        range: r.range || undefined,
        endUserDefault: r.endUserDefault || r.defaultValue || undefined,
        format: r.format || r.dataType,
        downlink5: r.downlink5 || undefined,
        inRd1Template: r.inRd1Template || undefined,
        comment: r.comment || undefined,
        inEngineeringTemplate: r.inEngineeringTemplate || undefined,
        inEndUserTemplate: r.inEndUserTemplate || undefined,
        inFullTemplate: r.inFullTemplate || undefined,
        decimalValid: r.valDecOk,
        hexValid: r.valHexOk,
        address: r.address,
        dataType: r.dataType,
        scale: r.scale !== null && r.scale !== undefined ? Number(r.scale) : 1,
        offset: r.offset !== null && r.offset !== undefined ? Number(r.offset) : 0,
        defaultValue: r.defaultValue || undefined,
        unit: r.unit || undefined,
        accessMode: r.accessMode,
        rawRegister: r.rawRegister || undefined,
      })),
      createdAt: profile.createdAt ? profile.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : undefined,
    };
  }

  @Delete([
    'api/plugins/memmap-manager/profiles/:id',
    'api/v1/plugins/memmap-manager/profiles/:id',
    'api/plugins/memmap-payload/profiles/:id',
    'api/v1/plugins/memmap-payload/profiles/:id',
    'plugins/memmap-manager/profiles/:id',
    'plugins/memmap-payload/profiles/:id',
  ])
  async deleteProfile(@Param('id') id: string) {
    const ds = this.databaseService.getDataSourceForTable('memmap_profiles');
    const profileRepo = this.databaseService.getRepositoryForTable('memmap_profiles', MemmapProfileEntity);
    let profile: any = null;
    try {
      profile = await profileRepo.findOne({ where: { id } });
    } catch {
      // Ignored if column mismatch
    }

    if (!profile) {
      const checkRows = await ds.query(
        `SELECT id FROM memmap_manager.memmap_profiles WHERE id = $1 LIMIT 1`,
        [id],
      ).catch(() => []);
      if (!checkRows || checkRows.length === 0) {
        throw new NotFoundException(`Profile [${id}] not found`);
      }
    }

    await ds.query(
      `DELETE FROM memmap_manager.memmap_registers WHERE profile_id = $1`,
      [id],
    ).catch(() => {});

    await ds.query(
      `DELETE FROM memmap_manager.memmap_profiles WHERE id = $1`,
      [id],
    ).catch(() => {});

    if (profile) {
      await profileRepo.remove(profile).catch(() => {});
    }

    return {
      success: true,
      message: `Profile [${id}] deleted successfully`,
    };
  }

  @Post([
    'api/plugins/memmap-manager/import/preview',
    'api/v1/plugins/memmap-manager/import/preview',
    'api/plugins/memmap-payload/import/preview',
    'api/v1/plugins/memmap-payload/import/preview',
    'plugins/memmap-manager/import/preview',
    'plugins/memmap-payload/import/preview',
  ])
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @UploadedFile() file?: any,
    @Body() body?: any,
  ): Promise<MemmapPreviewResult> {
    if (file) {
      this.assertSupportedFileType(file);
      const content = file.buffer.toString('utf-8');
      const format = this.detectFormatFromFilename(file.originalname) || body?.format;
      const preview = this.service.previewImport(content, format);
      if (preview.profile) {
        if (body?.name) {
          preview.profile.name = body.name;
        } else if (file.originalname && (!preview.profile.name || preview.profile.name === 'Imported MemMap')) {
          preview.profile.name = path.parse(file.originalname).name;
        }
        if (body?.description) {
          preview.profile.description = body.description;
        }
        if (body?.itemCode ?? body?.item_code) preview.profile.itemCode = body.itemCode ?? body.item_code;
        if (body?.fwVersion ?? body?.fw_version) preview.profile.fwVersion = body.fwVersion ?? body.fw_version;
        if (body?.sku) preview.profile.sku = body.sku;
        if (body?.longFw) preview.profile.longFw = body.longFw;
        if (body?.shortFw) preview.profile.shortFw = body.shortFw;
        if (body?.createdBy) preview.profile.createdBy = body.createdBy;
      }
      return preview;
    }

    if (body) {
      if (body.format && this.isExcelFormat(body.format)) {
        throw new HttpException(
          'Unsupported Media Type: Excel format (.xlsx, .xls) is not supported. Only JSON and CSV are supported.',
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }

      if (typeof body.content === 'string') {
        const preview = this.service.previewImport(body.content, body.format);
        if (preview.profile) {
          if (body.name) preview.profile.name = body.name;
          if (body.description) preview.profile.description = body.description;
          if (body.itemCode ?? body.item_code ?? body.ITEM_CODE) preview.profile.itemCode = body.itemCode ?? body.item_code ?? body.ITEM_CODE;
          if (body.fwVersion ?? body.fw_version ?? body.FW_VERSION) preview.profile.fwVersion = body.fwVersion ?? body.fw_version ?? body.FW_VERSION;
          if (body.sku) preview.profile.sku = body.sku;
          if (body.longFw) preview.profile.longFw = body.longFw;
          if (body.shortFw) preview.profile.shortFw = body.shortFw;
          if (body.createdBy) preview.profile.createdBy = body.createdBy;
        }
        return preview;
      }

      if (body.registers || body.profile) {
        const candidate = body.profile || body;
        return this.service.validateProfile(candidate, candidate.sourceFormat || 'json');
      }
    }

    throw new BadRequestException('Import preview requires a file or payload body.');
  }

  private validateFwVersion(fwVersion: string | null | undefined): void {
    if (!fwVersion) return;
    const trimmed = fwVersion.trim();
    // Validate format XFXXXX where X is a digit (^[0-9]F[0-9]{4}$)
    if (!/^[0-9]F[0-9]{4}$/.test(trimmed)) {
      throw new BadRequestException(
        `FW_VERSION không đúng định dạng. Yêu cầu định dạng XFXXXX với X là chữ số (ví dụ: 1F0001, 0F0000).`,
      );
    }
  }

  private profileMetadata(body?: any, candidate?: any): Partial<MemmapProfileEntity> {
    const b = body || {};
    const bp = body?.profile || {};
    const c = candidate || {};

    const rawFwVersion = this.optionalText(
      b.fwVersion ?? b.fw_version ?? b.FW_VERSION ?? bp.fwVersion ?? bp.fw_version ?? bp.FW_VERSION ?? c.fwVersion ?? c.fw_version ?? c.FW_VERSION,
    );
    this.validateFwVersion(rawFwVersion);

    return {
      itemCode: this.optionalText(
        b.itemCode ?? b.item_code ?? b.ITEM_CODE ?? bp.itemCode ?? bp.item_code ?? bp.ITEM_CODE ?? c.itemCode ?? c.item_code ?? c.ITEM_CODE,
      ),
      fwVersion: rawFwVersion,
      sku: this.optionalText(b.sku ?? b.SKU ?? bp.sku ?? bp.SKU ?? c.sku ?? c.SKU),
      longFw: this.optionalText(b.longFw ?? b.long_fw ?? b.LONG_FW ?? bp.longFw ?? bp.long_fw ?? bp.LONG_FW ?? c.longFw ?? c.long_fw ?? c.LONG_FW ?? rawFwVersion),
      shortFw: this.optionalText(b.shortFw ?? b.short_fw ?? b.SHORT_FW ?? bp.shortFw ?? bp.short_fw ?? bp.SHORT_FW ?? c.shortFw ?? c.short_fw ?? c.SHORT_FW ?? (rawFwVersion ? rawFwVersion.charAt(0) : null)),
      decCheck: this.booleanOrDefault(b.decimalCheck ?? b.decCheck ?? b.dec_check ?? bp.decimalCheck ?? bp.decCheck ?? bp.dec_check ?? c.decimalCheck ?? c.decCheck ?? c.dec_check, true),
      hexCheck: this.booleanOrDefault(b.hexCheck ?? b.hex_check ?? bp.hexCheck ?? bp.hex_check ?? c.hexCheck ?? c.hex_check, true),
      createdBy: this.optionalText(b.createdBy ?? b.created_by ?? bp.createdBy ?? bp.created_by ?? c.createdBy ?? c.created_by),
    };
  }

  private optionalText(value: unknown): string | null {
    return value === undefined || value === null || value === '' ? null : String(value);
  }

  private registerValue(register: any, property: string, csvColumn: string): string | number | boolean | undefined {
    return register[property] ?? register.rawRegister?.[csvColumn];
  }

  @Post([
    'api/plugins/memmap-manager/import',
    'api/v1/plugins/memmap-manager/import',
    'api/plugins/memmap-payload/import',
    'api/v1/plugins/memmap-payload/import',
    'plugins/memmap-manager/import',
    'plugins/memmap-payload/import',
  ])
  @UseInterceptors(FileInterceptor('file'))
  async importProfile(
    @UploadedFile() file?: any,
    @Body() body?: any,
  ) {
    let previewResult: MemmapPreviewResult;

    if (file) {
      this.assertSupportedFileType(file);
      const content = file.buffer.toString('utf-8');
      const format = this.detectFormatFromFilename(file.originalname) || body?.format;
      previewResult = this.service.previewImport(content, format);
      if (previewResult.profile) {
        if (body?.name) {
          previewResult.profile.name = body.name;
        } else if (file.originalname && (!previewResult.profile.name || previewResult.profile.name === 'Imported MemMap')) {
          previewResult.profile.name = path.parse(file.originalname).name;
        }
        if (body?.description) {
          previewResult.profile.description = body.description;
        }
      }
    } else if (body) {
      if (body.format && this.isExcelFormat(body.format)) {
        throw new HttpException(
          'Unsupported Media Type: Excel format (.xlsx, .xls) is not supported. Only JSON and CSV are supported.',
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }

      if (typeof body.content === 'string') {
        previewResult = this.service.previewImport(body.content, body.format);
        if (previewResult.profile) {
          if (body.name) previewResult.profile.name = body.name;
          if (body.description) previewResult.profile.description = body.description;
        }
      } else if (body.registers || body.profile) {
        const candidate = body.profile || body;
        previewResult = this.service.validateProfile(candidate, candidate.sourceFormat || 'json');
      } else {
        throw new BadRequestException('Import requires a file or profile data.');
      }
    } else {
      throw new BadRequestException('Import requires a file or payload body.');
    }

    if (!previewResult.valid || !previewResult.profile) {
      throw new BadRequestException({
        success: false,
        message: 'MemMap validation failed',
        errors: previewResult.errors,
      });
    }

    const candidateProfile: MemmapProfileInput = previewResult.profile;

    // Atomically persist to database
    const ds = this.databaseService.getDataSourceForTable('memmap_profiles');
    const saved = await ds.transaction(async (manager) => {
      const profileRepo = manager.getRepository(MemmapProfileEntity);
      const registerRepo = manager.getRepository(MemmapRegisterEntity);

      const profileEntity = profileRepo.create({
        name: candidateProfile.name,
        description: candidateProfile.description || null,
        sourceFormat: candidateProfile.sourceFormat || 'json',
        ...this.profileMetadata(body, candidateProfile),
      });
      const savedProfile = await profileRepo.save(profileEntity);

      const registerEntities = candidateProfile.registers.map((r) =>
        registerRepo.create({
          profileId: savedProfile.id,
          name: r.name,
          description: r.description || null,
          address: Number(r.address),
          dataType: r.dataType,
          scale: r.scale !== undefined && r.scale !== null ? Number(r.scale) : 1,
          offset: r.offset !== undefined && r.offset !== null ? Number(r.offset) : 0,
          unit: r.unit || null,
          defaultValue: r.defaultValue !== undefined && r.defaultValue !== null ? String(r.defaultValue) : null,
          accessMode: r.accessMode || 'read',
          rawRegister: r.rawRegister || {},
          no: this.numberOrNull(this.registerValue(r, 'rowNumber', 'No.')),
          modbusRegisterDec: this.numberOrNull(this.registerValue(r, 'modbusRegisterDecimal', 'Modbus Register (Decimal)')) ?? Number(r.address),
          modbusRegisterHex: this.textOrNull(this.registerValue(r, 'modbusRegisterHex', 'Modbus Register (Hex)')),
          fcRead: this.textOrNull(this.registerValue(r, 'functionCodeRead', 'Function Code (Read)')),
          fcWrite: this.textOrNull(this.registerValue(r, 'functionCodeWrite', 'Function Code (Write)')),
          numRegisters: this.numberOrNull(this.registerValue(r, 'registerCount', '# of Registers')) ?? 1,
          range: this.textOrNull(this.registerValue(r, 'range', 'Range')),
          endUserDefault: this.textOrNull(this.registerValue(r, 'endUserDefault', 'End-user Default')) ?? (r.defaultValue !== undefined ? String(r.defaultValue) : null),
          format: this.textOrNull(this.registerValue(r, 'format', 'Format')) ?? r.dataType,
          downlink5: this.textOrNull(this.registerValue(r, 'downlink5', 'Downlink 5')),
          inRd1Template: this.textOrNull(this.registerValue(r, 'inRd1Template', 'In RD1 Template')),
          comment: this.textOrNull(this.registerValue(r, 'comment', 'Comment')),
          inEngineeringTemplate: this.textOrNull(this.registerValue(r, 'inEngineeringTemplate', 'In Engineering Template')),
          inEndUserTemplate: this.textOrNull(this.registerValue(r, 'inEndUserTemplate', 'In End-user Template')),
          inFullTemplate: this.textOrNull(this.registerValue(r, 'inFullTemplate', 'In Full Template')),
          valDecOk: this.booleanOrDefault(this.registerValue(r, 'decimalValid', 'decimalValid'), true),
          valHexOk: this.booleanOrDefault(this.registerValue(r, 'hexValid', 'hexValid'), true),
        }),
      );

      const savedRegisters = await registerRepo.save(registerEntities);
      savedProfile.registers = savedRegisters;
      savedProfile.registersCount = savedRegisters.length;
      return savedProfile;
    });

    return {
      success: true,
      message: 'MemMap Profile imported successfully',
      data: {
        id: saved.id,
        name: saved.name,
        description: saved.description,
        sourceFormat: saved.sourceFormat,
        registersCount: saved.registersCount,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    };
  }

  private textOrNull(value: unknown): string | null {
    return value === undefined || value === null || value === '' ? null : String(value);
  }

  private numberOrNull(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private booleanOrDefault(value: unknown, fallback: boolean): boolean {
    if (value === undefined || value === null || value === '') return fallback;
    return value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes';
  }

  private isExcelFormat(format: string): boolean {
    const f = format.toLowerCase().replace(/^\./, '');
    return f === 'xlsx' || f === 'xls' || f === 'excel';
  }

  private assertSupportedFileType(file: any): void {
    const name = (file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    if (
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      mime.includes('excel') ||
      mime.includes('spreadsheet') ||
      mime.includes('officedocument')
    ) {
      throw new HttpException(
        'Unsupported Media Type: Excel format (.xlsx, .xls) is not supported. Only JSON and CSV are supported.',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    if (!name.endsWith('.json') && !name.endsWith('.csv') && !mime.includes('json') && !mime.includes('csv') && !mime.includes('text')) {
      throw new HttpException(
        `Unsupported Media Type: File type is not supported. Only JSON and CSV are supported.`,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }
  }

  private detectFormatFromFilename(filename?: string): 'json' | 'csv' | undefined {
    if (!filename) return undefined;
    const lower = filename.toLowerCase();
    if (lower.endsWith('.json')) return 'json';
    if (lower.endsWith('.csv')) return 'csv';
    return undefined;
  }
}
