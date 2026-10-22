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
export class MemmapManagerAdapterController {
  private readonly logger = new Logger(MemmapManagerAdapterController.name);
  private service: MemmapManagerService;

  constructor(private readonly databaseService: DynamicDatabaseService) {
    this.initService();
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

  @Get(['api/plugins/memmap-manager/status', 'api/v1/plugins/memmap-manager/status'])
  getStatus() {
    return this.service.getStatus();
  }

  @Get(['api/plugins/memmap-manager/profiles', 'api/v1/plugins/memmap-manager/profiles'])
  async getProfiles() {
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
      registersCount: p.registers ? p.registers.length : 0,
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : undefined,
    }));
  }

  @Get(['api/plugins/memmap-manager/profiles/:id', 'api/v1/plugins/memmap-manager/profiles/:id'])
  async getProfileById(@Param('id') id: string) {
    const profileRepo = this.databaseService.getRepositoryForTable('memmap_profiles', MemmapProfileEntity);
    const profile = await profileRepo.findOne({
      where: { id },
      relations: ['registers'],
    });

    if (!profile) {
      throw new NotFoundException(`Profile [${id}] not found`);
    }

    const sortedRegisters = (profile.registers || []).sort((a, b) => a.address - b.address);

    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      sourceFormat: profile.sourceFormat,
      registersCount: sortedRegisters.length,
      registers: sortedRegisters.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || undefined,
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

  @Delete(['api/plugins/memmap-manager/profiles/:id', 'api/v1/plugins/memmap-manager/profiles/:id'])
  async deleteProfile(@Param('id') id: string) {
    const profileRepo = this.databaseService.getRepositoryForTable('memmap_profiles', MemmapProfileEntity);
    const profile = await profileRepo.findOne({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`Profile [${id}] not found`);
    }

    await profileRepo.remove(profile);
    return {
      success: true,
      message: `Profile [${id}] deleted successfully`,
    };
  }

  @Post(['api/plugins/memmap-manager/import/preview', 'api/v1/plugins/memmap-manager/import/preview'])
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
        return this.service.previewImport(body.content, body.format);
      }

      if (body.registers || body.profile) {
        const candidate = body.profile || body;
        return this.service.validateProfile(candidate, candidate.sourceFormat || 'json');
      }
    }

    throw new BadRequestException('Import preview requires a file or payload body.');
  }

  @Post(['api/plugins/memmap-manager/import', 'api/v1/plugins/memmap-manager/import'])
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
