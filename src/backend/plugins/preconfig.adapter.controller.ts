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
  Query,
} from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { PreconfigProfileEntity } from '../core-models/preconfig-profile.entity';
import { PreconfigRegisterEntity } from '../core-models/preconfig-register.entity';
import { TraceabilitySoEntity } from '../core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../core-models/traceability-wa.entity';
import { TraceabilityDeviceEntity } from '../core-models/traceability-device.entity';
import { MemmapProfileEntity } from '../core-models/memmap-profile.entity';
import { MemmapRegisterEntity } from '../core-models/memmap-register.entity';

export interface PreconfigRegisterDto {
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

export interface CreatePreconfigProfileDto {
  soNumber: string;
  waNumber: string;
  itemCode: string;
  connectivity?: string;
  sku?: string;
  longFw?: string;
  shortFw?: string;
  createdBy?: string;
  notes?: string;
  status?: string;
  registers: PreconfigRegisterDto[];
}

@Controller()
export class PreconfigAdapterController {
  private readonly logger = new Logger(PreconfigAdapterController.name);

  constructor(private readonly databaseService: DynamicDatabaseService) {}

  @Get(['api/plugins/preconfig/status', 'api/v1/plugins/preconfig/status'])
  getStatus() {
    return {
      status: 'online',
      plugin: 'preconfig',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(['api/plugins/preconfig/profiles', 'api/v1/plugins/preconfig/profiles'])
  async getProfiles() {
    try {
      const profileRepo = this.databaseService.getRepositoryForTable(
        'preconfig_profile',
        PreconfigProfileEntity,
      );
      const profiles = await profileRepo.find({
        order: { createdAt: 'DESC' },
      });

      return profiles.map((p) => ({
        id: p.id,
        soNumber: p.soNumber,
        waNumber: p.waNumber || undefined,
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
      this.logger.error(`Failed to get preconfig profiles: ${err.message}`, err.stack);
      throw new HttpException(
        `Failed to retrieve preconfig profiles: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/preconfig/profiles/:id', 'api/v1/plugins/preconfig/profiles/:id'])
  async getProfileById(@Param('id') id: string) {
    const profileRepo = this.databaseService.getRepositoryForTable(
      'preconfig_profile',
      PreconfigProfileEntity,
    );
    const profile = await profileRepo.findOne({
      where: { id },
      relations: ['registers'],
    });

    if (!profile) {
      throw new NotFoundException(`Preconfig profile with ID "${id}" not found`);
    }

    const sortedRegs = (profile.registers || []).sort(
      (a, b) => (a.modbusRegisterDec ?? 0) - (b.modbusRegisterDec ?? 0),
    );

    return {
      id: profile.id,
      soNumber: profile.soNumber,
      waNumber: profile.waNumber || undefined,
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

  @Get(['api/plugins/preconfig/options', 'api/v1/plugins/preconfig/options'])
  async getCreateOptions(
    @Query('soNumber') soNumber?: string,
    @Query('waNumber') waNumber?: string,
  ) {
    const soRepo = this.databaseService.getRepositoryForTable('traceability_so', TraceabilitySoEntity);
    const waRepo = this.databaseService.getRepositoryForTable('traceability_wa', TraceabilityWaEntity);
    const deviceRepo = this.databaseService.getRepositoryForTable('traceability_device', TraceabilityDeviceEntity);
    const sos = await soRepo.find();
    const selectedSo = sos.find((so) => so.so_number === soNumber?.trim());
    const was = await waRepo.find();
    const scopedWas = soNumber?.trim() ? was.filter((wa) => wa.so_id === selectedSo?.id) : was;
    const matchedWas = waNumber?.trim() ? scopedWas.filter((wa) => wa.wa_number === waNumber?.trim()) : scopedWas;
    const matchedWaIds = new Set(matchedWas.map((wa) => wa.id));
    const devices = await deviceRepo.find();
    const scopedDevices = devices.filter((device) =>
      waNumber?.trim() ? (device.wa_id && matchedWaIds.has(device.wa_id)) : soNumber?.trim() ? device.so_id === selectedSo?.id : true,
    );
    return {
      soNumbers: [...new Set(sos.map((so) => so.so_number))],
      waNumbers: [...new Set(scopedWas.map((wa) => wa.wa_number))],
      itemCodes: [...new Set([
        ...scopedDevices.map((device) => device.item_code),
        ...matchedWas.map((wa) => wa.item_code),
      ].filter((code): code is string => !!code))],
    };
  }

  @Get(['api/plugins/preconfig/resolve', 'api/v1/plugins/preconfig/resolve'])
  async resolveCreate(
    @Query('soNumber') soNumber: string,
    @Query('waNumber') waNumber: string,
    @Query('itemCode') itemCode: string,
  ) {
    if (!soNumber?.trim() || !waNumber?.trim() || !itemCode?.trim()) {
      throw new BadRequestException('soNumber, waNumber and itemCode are required');
    }
    const soRepo = this.databaseService.getRepositoryForTable('traceability_so', TraceabilitySoEntity);
    const waRepo = this.databaseService.getRepositoryForTable('traceability_wa', TraceabilityWaEntity);
    const deviceRepo = this.databaseService.getRepositoryForTable('traceability_device', TraceabilityDeviceEntity);
    const memmapRepo = this.databaseService.getRepositoryForTable('memmap_profiles', MemmapProfileEntity);
    const so = await soRepo.findOne({ where: { so_number: soNumber.trim() } });
    const matchingWas = await waRepo.find({ where: { wa_number: waNumber.trim() } });
    const scopedMatchingWas = matchingWas.filter((wa) => so && wa.so_id === so.id);
    if (!so || !scopedMatchingWas.length) throw new BadRequestException('SO_NUMBER/WA_NUMBER không hợp lệ');
    const matchedWaIds = new Set(scopedMatchingWas.map((wa) => wa.id));
    const devices = await deviceRepo.find({ where: { so_id: so.id, item_code: itemCode.trim() } });
    const scoped = devices.filter((device) => device.wa_id && matchedWaIds.has(device.wa_id));
    const waHasItemCode = scopedMatchingWas.some((wa) => wa.item_code === itemCode.trim());
    if (!scoped.length && !waHasItemCode) {
      throw new BadRequestException('ITEM_CODE không thuộc SO_NUMBER/WA_NUMBER đã chọn');
    }
    let versions = [...new Set(scoped.map((device) => device.fw_version?.trim()).filter((fw): fw is string => !!fw))];
    let candidate: MemmapProfileEntity | null = null;
    if (scoped.length > 0 && scoped.every((device) => !!device.fw_version?.trim()) && versions.length === 1) {
      candidate = await memmapRepo.findOne({ where: { itemCode: itemCode.trim(), fwVersion: versions[0] }, relations: ['registers'] });
    } else if (!scoped.length) {
      // WA has no devices yet: check if exactly 1 unique memmap profile exists for this item_code
      const memmaps = await memmapRepo.find({ where: { itemCode: itemCode.trim() }, relations: ['registers'] });
      if (memmaps.length === 1 && memmaps[0].fwVersion) {
        candidate = memmaps[0];
      }
    }
    if (!candidate) throw new BadRequestException('Vui lòng liên hệ ENGINEERING');
    return {
      memmapId: candidate.id,
      fwVersion: candidate.fwVersion,
      sku: candidate.sku || itemCode.trim(),
      longFw: candidate.longFw || candidate.fwVersion,
      connectivity: candidate.sku?.toUpperCase().startsWith('WSSFC-') ? 'Sigfox' : 'LoRaWAN',
      registers: (candidate.registers || []).map((reg: MemmapRegisterEntity, index: number) => ({
        rowNumber: reg.no ?? index + 1,
        modbusRegisterDec: reg.modbusRegisterDec ?? reg.address,
        modbusRegisterHex: reg.modbusRegisterHex || '',
        registerCount: reg.numRegisters ?? 1,
        description: reg.name || reg.description || '',
        format: reg.format || reg.dataType,
        comment: reg.comment || '',
        endUserDefault: reg.endUserDefault || reg.defaultValue || '',
      })),
    };
  }

  @Post(['api/plugins/preconfig/profiles', 'api/v1/plugins/preconfig/profiles'])
  async createProfile(@Body() body: CreatePreconfigProfileDto) {
    if (!body) {
      throw new BadRequestException('Request body is required');
    }

    const {
      soNumber,
      waNumber,
      itemCode,
      connectivity: requestedConnectivity,
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

    if (!waNumber || typeof waNumber !== 'string') {
      throw new BadRequestException('waNumber is required');
    }
    if (!itemCode || typeof itemCode !== 'string') {
      throw new BadRequestException('itemCode is required');
    }

    const resolved = await this.resolveCreate(soNumber, waNumber, itemCode);
    const { sku, longFw } = resolved;
    if (requestedConnectivity && requestedConnectivity !== 'LoRaWAN' && requestedConnectivity !== 'Sigfox') {
      throw new BadRequestException('connectivity must be either "LoRaWAN" or "Sigfox"');
    }
    const connectivity = requestedConnectivity || resolved.connectivity;
    const shortFw = longFw?.charAt(0) || '';
    if (!longFw || !sku) throw new BadRequestException('Vui lòng liên hệ ENGINEERING');

    if (!Array.isArray(registers) || registers.length === 0) {
      throw new BadRequestException('registers array is required and must not be empty');
    }

    const invalidSelected = registers.filter(
      (r) => r.selected !== false && r.configCheck && r.configCheck.toUpperCase() === 'FAIL',
    );
    if (invalidSelected.length > 0) {
      throw new BadRequestException(
        `Cannot create preconfig: ${invalidSelected.length} selected register(s) failed validation`,
      );
    }

    // Only persist registers that were selected by the user
    const selectedRegisters = registers.filter((r) => r.selected === true);
    if (selectedRegisters.length === 0) {
      throw new BadRequestException('Vui lòng tích chọn ít nhất 1 thanh ghi để lưu cấu hình preconfig');
    }

    const ds = this.databaseService.getDataSourceForTable('preconfig_profile');
    if (!ds) {
      throw new HttpException(
        'Database connection for preconfig_profile not available',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const profileRepo = queryRunner.manager.getRepository(PreconfigProfileEntity);
      const registerRepo = queryRunner.manager.getRepository(PreconfigRegisterEntity);

      const profile = profileRepo.create({
        soNumber: soNumber.trim(),
        waNumber: waNumber.trim(),
        itemCode: itemCode.trim(),
        connectivity,
        sku,
        longFw,
        shortFw,
        registersCount: selectedRegisters.length,
        createdBy: createdBy?.trim() || null,
        notes: notes?.trim() || null,
        status: status?.trim() || 'active',
      });

      const savedProfile = await profileRepo.save(profile);

      const registerEntities = selectedRegisters.map((r, idx) =>
        registerRepo.create({
          profileId: savedProfile.id,
          rowNumber: r.rowNumber ?? idx + 1,
          modbusRegisterDec: r.modbusRegisterDec,
          modbusRegisterHex: r.modbusRegisterHex || '',
          registerCount: r.registerCount ?? 1,
          description: r.description || '',
          format: r.format || null,
          comment: r.comment || null,
          endUserDefault: r.endUserDefault || null,
          inputConfig: r.inputConfig || null,
          configCheck: r.configCheck || 'PASS',
          selected: true,
        }),
      );

      await registerRepo.save(registerEntities);

      await queryRunner.commitTransaction();

      return {
        id: savedProfile.id,
        soNumber: savedProfile.soNumber,
        waNumber: savedProfile.waNumber || undefined,
        itemCode: savedProfile.itemCode,
        connectivity: savedProfile.connectivity,
        sku: savedProfile.sku,
        longFw: savedProfile.longFw,
        shortFw: savedProfile.shortFw,
        registersCount: savedProfile.registersCount,
        createdBy: savedProfile.createdBy || undefined,
        notes: savedProfile.notes || undefined,
        status: savedProfile.status,
        createdAt: savedProfile.createdAt ? savedProfile.createdAt.toISOString() : new Date().toISOString(),
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create preconfig profile: ${err.message}`, err.stack);
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new HttpException(
        `Failed to create preconfig profile: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  @Delete(['api/plugins/preconfig/profiles/:id', 'api/v1/plugins/preconfig/profiles/:id'])
  async deleteProfile(@Param('id') id: string) {
    const profileRepo = this.databaseService.getRepositoryForTable(
      'preconfig_profile',
      PreconfigProfileEntity,
    );
    const profile = await profileRepo.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Preconfig profile with ID "${id}" not found`);
    }

    await profileRepo.delete(id);
    return { success: true, message: `Preconfig profile "${id}" deleted successfully` };
  }

  @Get(['api/plugins/preconfig/profile-by-device', 'api/v1/plugins/preconfig/profile-by-device'])
  async getProfileByDevice(
    @Query('soNumber') soNumber: string,
    @Query('waNumber') waNumber: string,
    @Query('itemCode') itemCode: string,
    @Query('fwVersion') fwVersion?: string,
  ) {
    if (!soNumber?.trim() || !itemCode?.trim()) {
      throw new BadRequestException('soNumber and itemCode are required');
    }

    const profileRepo = this.databaseService.getRepositoryForTable(
      'preconfig_profile',
      PreconfigProfileEntity,
    );

    const queryBuilder = profileRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.registers', 'r')
      .where('p.so_number = :soNumber', { soNumber: soNumber.trim() })
      .andWhere('p.item_code = :itemCode', { itemCode: itemCode.trim() });

    if (waNumber?.trim()) {
      queryBuilder.andWhere('(p.wa_number = :waNumber OR p.wa_number IS NULL)', { waNumber: waNumber.trim() });
    }

    if (fwVersion?.trim()) {
      queryBuilder.andWhere('(p.long_fw = :fwVersion OR p.short_fw = :fwVersion OR p.long_fw LIKE :fwPrefix)', {
        fwVersion: fwVersion.trim(),
        fwPrefix: `${fwVersion.trim()}%`,
      });
    }

    queryBuilder.orderBy('p.created_at', 'DESC');

    const profile = await queryBuilder.getOne();

    if (!profile) {
      return null;
    }

    const sortedRegs = (profile.registers || [])
      .filter((r) => r.selected !== false)
      .sort((a, b) => (a.modbusRegisterDec ?? 0) - (b.modbusRegisterDec ?? 0));

    return {
      id: profile.id,
      soNumber: profile.soNumber,
      waNumber: profile.waNumber || undefined,
      itemCode: profile.itemCode,
      connectivity: profile.connectivity,
      sku: profile.sku,
      longFw: profile.longFw,
      shortFw: profile.shortFw,
      registersCount: sortedRegs.length,
      status: profile.status,
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
}
