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
} from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { FinalConfigProfileEntity } from '../core-models/finalconfig-profile.entity';
import { FinalConfigRegisterEntity } from '../core-models/finalconfig-register.entity';

export interface FinalConfigRegisterDto {
  rowNumber?: number;
  modbusRegisterDec: number;
  modbusRegisterHex: string;
  registerCount: number;
  description: string;
  format?: string;
  comment?: string;
  endUserDefault?: string;
  inputConfig?: string;
  configCheck?: string;
  selected?: boolean;
}

export interface CreateFinalConfigProfileDto {
  soNumber: string;
  itemCode: string;
  connectivity: string;
  sku: string;
  longFw: string;
  shortFw: string;
  createdBy?: string;
  notes?: string;
  status?: string;
  registers: FinalConfigRegisterDto[];
}

@Controller()
export class FinalConfigAdapterController {
  private readonly logger = new Logger(FinalConfigAdapterController.name);

  constructor(private readonly databaseService: DynamicDatabaseService) {}

  @Get(['api/plugins/final-config/status', 'api/v1/plugins/final-config/status'])
  getStatus() {
    return {
      status: 'online',
      plugin: 'final-config',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(['api/plugins/final-config/profiles', 'api/v1/plugins/final-config/profiles'])
  async getProfiles() {
    try {
      const profileRepo = this.databaseService.getRepositoryForTable(
        'finalconfig_profile',
        FinalConfigProfileEntity,
      );
      const profiles = await profileRepo.find({
        order: { createdAt: 'DESC' },
      });

      return profiles.map((p) => ({
        id: p.id,
        soNumber: p.soNumber,
        itemCode: p.itemCode,
        connectivity: p.connectivity,
        sku: p.sku,
        longFw: p.longFw,
        shortFw: p.shortFw,
        registersCount: p.registersCount,
        createdBy: p.createdBy || undefined,
        notes: p.notes || undefined,
        status: p.status,
        createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: p.updatedAt ? p.updatedAt.toISOString() : undefined,
      }));
    } catch (err: any) {
      this.logger.error(`Failed to get final config profiles: ${err.message}`, err.stack);
      throw new HttpException(
        `Failed to retrieve final config profiles: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/final-config/profiles/:id', 'api/v1/plugins/final-config/profiles/:id'])
  async getProfileById(@Param('id') id: string) {
    const profileRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_profile',
      FinalConfigProfileEntity,
    );
    const profile = await profileRepo.findOne({
      where: { id },
      relations: ['registers'],
    });

    if (!profile) {
      throw new NotFoundException(`Final config profile with ID "${id}" not found`);
    }

    const sortedRegs = (profile.registers || []).sort(
      (a, b) => (a.modbusRegisterDec ?? 0) - (b.modbusRegisterDec ?? 0),
    );

    return {
      id: profile.id,
      soNumber: profile.soNumber,
      itemCode: profile.itemCode,
      connectivity: profile.connectivity,
      sku: profile.sku,
      longFw: profile.longFw,
      shortFw: profile.shortFw,
      registersCount: profile.registersCount,
      createdBy: profile.createdBy || undefined,
      notes: profile.notes || undefined,
      status: profile.status,
      createdAt: profile.createdAt ? profile.createdAt.toISOString() : undefined,
      updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : undefined,
      registers: sortedRegs.map((r) => ({
        id: r.id,
        rowNumber: r.rowNumber,
        modbusRegisterDec: r.modbusRegisterDec,
        modbusRegisterHex: r.modbusRegisterHex,
        registerCount: r.registerCount,
        description: r.description,
        format: r.format,
        comment: r.comment,
        endUserDefault: r.endUserDefault,
        inputConfig: r.inputConfig,
        configCheck: r.configCheck,
        selected: r.selected,
      })),
    };
  }

  @Post(['api/plugins/final-config/profiles', 'api/v1/plugins/final-config/profiles'])
  async createProfile(@Body() body: CreateFinalConfigProfileDto) {
    if (!body) {
      throw new BadRequestException('Request body is required');
    }

    const {
      soNumber,
      itemCode,
      connectivity,
      sku,
      longFw,
      shortFw,
      createdBy,
      notes,
      status,
      registers,
    } = body;

    if (!soNumber || typeof soNumber !== 'string') {
      throw new BadRequestException('soNumber is required');
    }
    const soRegex = /^SO\/\d{4}\/\d{5}$/;
    if (!soRegex.test(soNumber.trim())) {
      throw new BadRequestException('Invalid SO_NUMBER format (expected format: SO/YYYY/XXXXX, e.g. SO/2026/01850)');
    }

    if (!itemCode || typeof itemCode !== 'string') {
      throw new BadRequestException('itemCode is required');
    }

    if (!connectivity || (connectivity !== 'LoRaWAN' && connectivity !== 'Sigfox')) {
      throw new BadRequestException('connectivity must be either "LoRaWAN" or "Sigfox"');
    }

    if (!sku || typeof sku !== 'string') {
      throw new BadRequestException('sku is required');
    }

    if (!longFw || typeof longFw !== 'string') {
      throw new BadRequestException('longFw is required');
    }

    if (!Array.isArray(registers) || registers.length === 0) {
      throw new BadRequestException('registers array is required and must not be empty');
    }

    // Fail if any selected register has FAIL configCheck
    const invalidSelected = registers.filter(
      (r) => r.selected !== false && r.configCheck && r.configCheck.toUpperCase() === 'FAIL',
    );
    if (invalidSelected.length > 0) {
      throw new BadRequestException(
        `Cannot create final config: ${invalidSelected.length} selected register(s) failed validation`,
      );
    }

    const ds = this.databaseService.getDataSourceForTable('finalconfig_profile');
    if (!ds) {
      throw new HttpException(
        'Database connection for finalconfig_profile not available',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const profileRepo = queryRunner.manager.getRepository(FinalConfigProfileEntity);
      const regRepo = queryRunner.manager.getRepository(FinalConfigRegisterEntity);

      const resolvedShortFw = shortFw || longFw.charAt(0);

      const profile = profileRepo.create({
        soNumber: soNumber.trim(),
        itemCode: itemCode.trim(),
        connectivity,
        sku: sku.trim(),
        longFw: longFw.trim(),
        shortFw: resolvedShortFw,
        registersCount: registers.length,
        createdBy: createdBy || null,
        notes: notes || null,
        status: status || 'active',
      });

      const savedProfile = await profileRepo.save(profile);

      const regEntities = registers.map((r, idx) =>
        regRepo.create({
          profileId: savedProfile.id,
          rowNumber: r.rowNumber ?? idx + 1,
          modbusRegisterDec: r.modbusRegisterDec,
          modbusRegisterHex: r.modbusRegisterHex,
          registerCount: r.registerCount ?? 1,
          description: r.description,
          format: r.format || null,
          comment: r.comment || null,
          endUserDefault: r.endUserDefault || null,
          inputConfig: r.inputConfig || null,
          configCheck: r.configCheck || 'PASS',
          selected: r.selected !== false,
        }),
      );

      await regRepo.save(regEntities);
      await queryRunner.commitTransaction();

      return {
        id: savedProfile.id,
        soNumber: savedProfile.soNumber,
        itemCode: savedProfile.itemCode,
        connectivity: savedProfile.connectivity,
        sku: savedProfile.sku,
        longFw: savedProfile.longFw,
        shortFw: savedProfile.shortFw,
        registersCount: savedProfile.registersCount,
        createdBy: savedProfile.createdBy,
        createdAt: savedProfile.createdAt,
        message: 'Final config profile created successfully',
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transaction failed creating final config profile: ${err.message}`, err.stack);
      throw new HttpException(
        `Failed to create final config profile: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  @Delete(['api/plugins/final-config/profiles/:id', 'api/v1/plugins/final-config/profiles/:id'])
  async deleteProfile(@Param('id') id: string) {
    const profileRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_profile',
      FinalConfigProfileEntity,
    );

    const profile = await profileRepo.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Final config profile with ID "${id}" not found`);
    }

    await profileRepo.remove(profile);
    return {
      id,
      deleted: true,
      message: `Final config profile "${profile.soNumber}" removed successfully`,
    };
  }
}
