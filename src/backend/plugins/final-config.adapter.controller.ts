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
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { FinalConfigProfileEntity } from '../core-models/finalconfig-profile.entity';
import { FinalConfigRegisterEntity } from '../core-models/finalconfig-register.entity';
import {
  FinalConfigExecutionSessionEntity,
  FinalConfigSessionStatus,
} from '../core-models/finalconfig-execution-session.entity';
import {
  FinalConfigExecutionLogEntity,
  FinalConfigExecutionAction,
  FinalConfigExecutionStatus,
} from '../core-models/finalconfig-execution-log.entity';
import {
  TraceabilityDeviceEntity,
  TraceabilityTestResult,
  TraceabilityConfigStatus,
} from '../core-models/traceability-device.entity';

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

export interface CreateExecutionSessionDto {
  deviceId?: string;
  serialNumber?: string;
  metadata?: Record<string, any>;
}

export interface StepExecutionLogDto {
  modbusRegisterDec: number;
  modbusRegisterHex?: string;
  action: 'READ' | 'WRITE' | 'VERIFY';
  expectedValue?: string;
  writeValue?: string;
  readValue?: string;
  rawHex?: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  errorMessage?: string;
  durationMs?: number;
}

export interface FinalizeExecutionSessionDto {
  status: 'COMPLETED' | 'FAILED' | 'ABORTED' | 'PAUSED';
  errorMessage?: string;
  metadata?: Record<string, any>;
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

  // =========================================================================
  // EXECUTION SESSIONS & STEP CHECKPOINTS
  // =========================================================================

  @Post([
    'api/plugins/final-config/profiles/:id/execution-sessions',
    'api/v1/plugins/final-config/profiles/:id/execution-sessions',
  ])
  async createExecutionSession(
    @Param('id') profileId: string,
    @Body() body: CreateExecutionSessionDto,
  ) {
    const profileRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_profile',
      FinalConfigProfileEntity,
    );
    const regRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_regs',
      FinalConfigRegisterEntity,
    );
    const sessionRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_execution_session',
      FinalConfigExecutionSessionEntity,
    );

    const profile = await profileRepo.findOne({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Final config profile with ID "${profileId}" not found`);
    }

    // Only count selected registers as steps
    const selectedCount = await regRepo.count({
      where: { profileId, selected: true },
    });

    const session = sessionRepo.create({
      profileId,
      deviceId: body?.deviceId || null,
      serialNumber: body?.serialNumber || null,
      status: FinalConfigSessionStatus.IN_PROGRESS,
      currentStep: 0,
      totalSteps: selectedCount,
      passedSteps: 0,
      failedSteps: 0,
      startedAt: new Date(),
      metadata: body?.metadata || null,
    });

    const saved = await sessionRepo.save(session);
    return {
      session: saved,
      message: 'Execution session initialized successfully',
    };
  }

  @Get([
    'api/plugins/final-config/execution-sessions/:sessionId',
    'api/v1/plugins/final-config/execution-sessions/:sessionId',
  ])
  async getExecutionSession(@Param('sessionId') sessionId: string) {
    const sessionRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_execution_session',
      FinalConfigExecutionSessionEntity,
    );
    const logRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_execution_log',
      FinalConfigExecutionLogEntity,
    );

    const session = await sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Execution session with ID "${sessionId}" not found`);
    }

    const logs = await logRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });

    return {
      session,
      logs,
    };
  }

  @Post([
    'api/plugins/final-config/execution-sessions/:sessionId/step',
    'api/v1/plugins/final-config/execution-sessions/:sessionId/step',
  ])
  async logExecutionStep(
    @Param('sessionId') sessionId: string,
    @Body() body: StepExecutionLogDto,
  ) {
    if (!body || body.modbusRegisterDec === undefined || !body.status) {
      throw new BadRequestException('modbusRegisterDec and status are required');
    }

    const sessionRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_execution_session',
      FinalConfigExecutionSessionEntity,
    );
    const logRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_execution_log',
      FinalConfigExecutionLogEntity,
    );

    const session = await sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Execution session with ID "${sessionId}" not found`);
    }

    const log = logRepo.create({
      sessionId,
      modbusRegisterDec: body.modbusRegisterDec,
      modbusRegisterHex: body.modbusRegisterHex || null,
      action: (body.action as FinalConfigExecutionAction) || FinalConfigExecutionAction.WRITE,
      expectedValue: body.expectedValue !== undefined ? String(body.expectedValue) : null,
      writtenValue: body.writeValue !== undefined ? String(body.writeValue) : null,
      readValue: body.readValue !== undefined ? String(body.readValue) : null,
      rawHex: body.rawHex || null,
      status: (body.status as FinalConfigExecutionStatus) || FinalConfigExecutionStatus.PASS,
      errorMessage: body.errorMessage || null,
      durationMs: body.durationMs || 0,
    });

    const savedLog = await logRepo.save(log);

    // Update session step counts
    session.currentStep = (session.currentStep || 0) + 1;
    if (log.status === FinalConfigExecutionStatus.PASS) {
      session.passedSteps = (session.passedSteps || 0) + 1;
    } else if (log.status === FinalConfigExecutionStatus.FAIL) {
      session.failedSteps = (session.failedSteps || 0) + 1;
    }

    const updatedSession = await sessionRepo.save(session);

    return {
      log: savedLog,
      session: updatedSession,
      message: 'Step checkpoint recorded successfully',
    };
  }

  @Post([
    'api/plugins/final-config/execution-sessions/:sessionId/finalize',
    'api/v1/plugins/final-config/execution-sessions/:sessionId/finalize',
  ])
  async finalizeExecutionSession(
    @Param('sessionId') sessionId: string,
    @Body() body: FinalizeExecutionSessionDto,
  ) {
    const sessionRepo = this.databaseService.getRepositoryForTable(
      'finalconfig_execution_session',
      FinalConfigExecutionSessionEntity,
    );

    const session = await sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Execution session with ID "${sessionId}" not found`);
    }

    if (body?.status) {
      session.status = body.status as FinalConfigSessionStatus;
    }
    if (body?.errorMessage) {
      session.errorMessage = body.errorMessage;
    }
    if (body?.metadata) {
      session.metadata = {
        ...(session.metadata || {}),
        ...body.metadata,
      };
    }
    session.completedAt = new Date();

    const saved = await sessionRepo.save(session);
    return {
      session: saved,
      message: `Execution session finalized with status ${saved.status}`,
    };
  }

  // ==========================================
  // FINAL CONFIG 4-STAGE ADAPTER & DEVICE QA
  // ==========================================

  @Get([
    'api/plugins/final-config/lookup-device-info',
    'api/v1/plugins/final-config/lookup-device-info',
    'api/device-tested/verify',
    'api/v1/device-tested/verify',
  ])
  async lookupDeviceInfo(
    @Query('sn') snQuery?: string,
    @Query('serial_number') serialNumberQuery?: string,
    @Query('devEui') devEuiQuery?: string,
    @Query('dev_eui') devEuiAltQuery?: string,
    @Query('device_key') deviceKeyQuery?: string,
    @Query('itemCode') itemCodeQuery?: string,
    @Query('item_code') itemCodeAltQuery?: string,
    @Query('so') soQuery?: string,
  ) {
    const sn = (snQuery || serialNumberQuery || '').trim();
    const devEui = (devEuiQuery || devEuiAltQuery || deviceKeyQuery || '').trim();

    if (!sn && !devEui) {
      throw new BadRequestException('At least "serial_number" (or "sn") or "dev_eui" query param is required');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = deviceRepo
        .createQueryBuilder('device')
        .leftJoinAndSelect('device.so', 'so')
        .leftJoinAndSelect('device.wa', 'wa');

      if (sn) {
        qb.andWhere('device.serial_number = :sn', { sn });
      } else if (devEui) {
        qb.andWhere('device.dev_eui ILIKE :devEui', { devEui });
      }

      const device = await qb.getOne();
      if (!device) {
        return {
          verified: false,
          tested: false,
          pass: false,
          success: false,
          message: 'Device not found in system',
        };
      }

      const isPass = device.test_result === TraceabilityTestResult.PASS;

      return {
        verified: isPass,
        tested: true,
        pass: isPass,
        success: isPass,
        message: isPass
          ? 'Device test verified successfully'
          : `Device test status is ${device.test_result || 'UNKNOWN'}, required PASS`,
        record: {
          id: device.id,
          serial_number: device.serial_number,
          dev_eui: device.dev_eui,
          so: device.so?.so_number || '',
          so_id: device.so_id,
          item_code: device.item_code,
          sku: device.sku,
          hw_version: device.hw_version,
          fw_version: device.fw_version,
          test_result: device.test_result,
          test_station: device.test_station,
          tested_at: device.tested_at,
          app_key: (device.test_raw_data as any)?.app_key || null,
        },
      };
    } catch (error: any) {
      this.logger.error(`lookupDeviceInfo error: ${error.message}`);
      throw new HttpException(
        `Failed to lookup device info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get([
    'api/plugins/final-config/check-pass',
    'api/v1/plugins/final-config/check-pass',
    'api/c-modules/final-config-manager/check-pass',
    'api/v1/c-modules/final-config-manager/check-pass',
  ])
  async checkFinalConfigPass(
    @Query('serial_number') snQuery?: string,
    @Query('sn') snAltQuery?: string,
    @Query('dev_eui') devEuiQuery?: string,
    @Query('devEui') devEuiAltQuery?: string,
  ) {
    const sn = (snQuery || snAltQuery || '').trim();
    const devEui = (devEuiQuery || devEuiAltQuery || '').trim();

    if (!sn && !devEui) {
      throw new BadRequestException('serial_number or dev_eui is required');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = deviceRepo.createQueryBuilder('device');
      if (sn) {
        qb.andWhere('device.serial_number = :sn', { sn });
      } else if (devEui) {
        qb.andWhere('device.dev_eui ILIKE :devEui', { devEui });
      }

      const device = await qb.getOne();
      if (!device) {
        return { passed: false, data: null };
      }

      const isConfigPass =
        device.config_status === TraceabilityConfigStatus.CONFIGURED_PASS;

      return {
        passed: isConfigPass,
        data: isConfigPass
          ? {
              id: device.id,
              serial_number: device.serial_number,
              dev_eui: device.dev_eui,
              config_status: device.config_status,
              final_config_session_id: device.final_config_session_id,
            }
          : null,
      };
    } catch (error: any) {
      this.logger.error(`checkFinalConfigPass error: ${error.message}`);
      throw new HttpException(
        `Failed to check final config status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post([
    'api/plugins/final-config/devices',
    'api/v1/plugins/final-config/devices',
    'api/c-modules/final-config-manager/devices',
    'api/v1/c-modules/final-config-manager/devices',
  ])
  async saveFinalConfigResult(@Body() body: any) {
    const sn = (body.serial_number || body.serialNumber || '').trim();
    if (!sn) {
      throw new BadRequestException('serial_number is required');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const device = await deviceRepo.findOne({
        where: { serial_number: sn },
      });

      if (!device) {
        throw new NotFoundException(`Device with serial_number "${sn}" not found`);
      }

      const isPass =
        body.status === 'PASS' ||
        body.verdict === 'PASS' ||
        body.final_verdict === 'PASS';

      device.config_status = isPass
        ? TraceabilityConfigStatus.CONFIGURED_PASS
        : TraceabilityConfigStatus.CONFIGURED_FAIL;

      const rawData: Record<string, any> = {
        ...(device.test_raw_data || {}),
        final_config_audit: {
          saved_at: new Date().toISOString(),
          status: isPass ? 'PASS' : 'FAIL',
          app_key: body.app_key || body.appKey || null,
          registers: body.registers || body.audit_registers || [],
          sku: body.sku || device.sku,
          item_code: body.item_code || device.item_code,
          metadata: body.metadata || {},
        },
      };

      if (body.app_key || body.appKey) {
        rawData.app_key = (body.app_key || body.appKey).toUpperCase();
      }

      device.test_raw_data = rawData;
      await deviceRepo.save(device);

      return {
        success: true,
        message: 'Final config audit result saved successfully',
        data: {
          id: device.id,
          serial_number: device.serial_number,
          config_status: device.config_status,
        },
      };
    } catch (error: any) {
      this.logger.error(`saveFinalConfigResult error: ${error.message}`);
      throw new HttpException(
        `Failed to save final config device result: ${error.message}`,
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch([
    'api/device-tested/:sn/app-key',
    'api/v1/device-tested/:sn/app-key',
  ])
  async patchDeviceAppKey(
    @Param('sn') sn: string,
    @Body() body: { app_key?: string; appKey?: string },
  ) {
    const cleanSn = (sn || '').trim();
    const appKey = (body.app_key || body.appKey || '').trim().toUpperCase();

    if (!cleanSn) {
      throw new BadRequestException('Serial number parameter is required');
    }
    if (!appKey) {
      throw new BadRequestException('app_key is required');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const device = await deviceRepo.findOne({
        where: { serial_number: cleanSn },
      });

      if (!device) {
        throw new NotFoundException(`Device with serial_number "${cleanSn}" not found`);
      }

      const rawData = {
        ...(device.test_raw_data || {}),
        app_key: appKey,
      };

      device.test_raw_data = rawData;
      await deviceRepo.save(device);

      return {
        success: true,
        serial_number: cleanSn,
        app_key: appKey,
        message: 'Device app_key updated successfully',
      };
    } catch (error: any) {
      this.logger.error(`patchDeviceAppKey error: ${error.message}`);
      throw new HttpException(
        `Failed to update device app_key: ${error.message}`,
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
