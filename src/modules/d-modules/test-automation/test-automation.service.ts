import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { TestAutomationRepository } from './test-automation.repository';
import { TestSessionEntity, TestSessionStatus } from './entities/test-session.entity';
import { TestDeviceRunEntity, TestDeviceStatus } from './entities/test-device-run.entity';
import { TestPacketLogEntity } from './entities/test-packet-log.entity';
import { CreateTestSessionDto } from './dto/create-test-session.dto';
import { SimulatePacketDto } from './dto/simulate-packet.dto';
import { QueryTestSessionDto } from './dto/query-test-session.dto';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import {
  cleanDevEUI,
  cleanHexPayload,
  isValidHex,
} from '../../lorawan/common/lorawan-utils';

export interface AssertionEvalResult {
  fieldName: string;
  operator: string;
  expectedValue?: any;
  actualValue?: any;
  pass: boolean;
  severity?: string;
  message?: string;
}

@Injectable()
export class TestAutomationService {
  private readonly logger = new Logger(TestAutomationService.name);

  constructor(
    private readonly repository: TestAutomationRepository,
    @Optional() private readonly realtimeGateway?: RealtimeGateway,
  ) {}

  /**
   * Helper to parse and sanitize a list of DevEUIs from an array or multiline text
   */
  public parseAndValidateDevEUIs(input: string[] | string): string[] {
    let rawList: string[] = [];
    if (Array.isArray(input)) {
      rawList = input;
    } else if (typeof input === 'string') {
      rawList = input.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean);
    }

    const cleanedSet = new Set<string>();
    for (const raw of rawList) {
      const cleaned = cleanDevEUI(raw);
      if (cleaned && /^[0-9A-F]{16}$/i.test(cleaned)) {
        cleanedSet.add(cleaned.toUpperCase());
      }
    }

    return Array.from(cleanedSet);
  }

  /**
   * Create a new test session linked to a Sales Order & Item Code
   */
  public async createSession(
    dto: CreateTestSessionDto,
    operatorId: string = 'qa-operator',
  ): Promise<TestSessionEntity> {
    const devEUIs = this.parseAndValidateDevEUIs(dto.devEUIs);
    if (devEUIs.length === 0) {
      throw new BadRequestException('At least one valid 16-hex-character DevEUI is required');
    }

    const soCode = dto.soCode.trim();
    const itemCode = dto.itemCode.trim();

    // Auto-generate session code if omitted
    const dateStr = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const sessionCode = dto.sessionCode?.trim() || `TS-${dateStr}-${randStr}`;

    // Resolve template and device SKU/Firmware
    let templateId = dto.templateId;
    let resolvedSku = 'GENERIC-LORA';
    let resolvedFw = '1.0';

    // Lookup Item Code catalog to resolve template and SKU if not provided
    const itemMaster = await this.repository.findItemCode(itemCode);
    if (itemMaster) {
      resolvedSku = itemMaster.sku || resolvedSku;
      resolvedFw = itemMaster.firmwareVersion || resolvedFw;
      if (!templateId && itemMaster.defaultTemplateId) {
        templateId = itemMaster.defaultTemplateId;
      }
    }

    // Auto-detect template by SKU/FW if still unassigned
    if (!templateId) {
      const matchedTemplate = await this.repository.findTemplateForSku(resolvedSku, resolvedFw);
      if (matchedTemplate) {
        templateId = matchedTemplate.id;
      }
    }

    const isAutoStart = !!dto.autoStart;
    const initialSessionStatus: TestSessionStatus = isAutoStart ? 'IN_PROGRESS' : 'PENDING';
    const initialDeviceStatus: TestDeviceStatus = isAutoStart ? 'RUNNING' : 'WAITING';

    const session = new TestSessionEntity();
    session.sessionCode = sessionCode;
    session.soCode = soCode;
    session.itemCode = itemCode;
    session.templateId = templateId;
    session.totalDevices = devEUIs.length;
    session.passedDevices = 0;
    session.failedDevices = 0;
    session.status = initialSessionStatus;
    session.startTime = isAutoStart ? new Date() : undefined;
    session.operatorId = operatorId;
    session.notes = dto.notes?.trim();
    session.metadata = {
      sku: resolvedSku,
      firmwareVersion: resolvedFw,
      ...(dto.metadata || {}),
    };

    const savedSession = await this.repository.saveSession(session);

    // Create device runs
    const runs: TestDeviceRunEntity[] = [];
    for (const eui of devEUIs) {
      const run = new TestDeviceRunEntity();
      run.sessionId = savedSession.id;
      run.devEUI = eui;
      run.sku = resolvedSku;
      run.firmwareVersion = resolvedFw;
      run.status = initialDeviceStatus;
      run.totalPackets = 0;
      run.passedAssertions = 0;
      run.failedAssertions = 0;
      run.startedAt = isAutoStart ? new Date() : undefined;
      const savedRun = await this.repository.saveDeviceRun(run);
      runs.push(savedRun);
    }

    savedSession.deviceRuns = runs;

    this.logger.log(
      `Created Test Session [${savedSession.sessionCode}] with ${runs.length} devices (Status: ${savedSession.status})`,
    );

    this.broadcastEvent('test_session:created', {
      session: this.serializeSession(savedSession),
    });

    return savedSession;
  }

  /**
   * List sessions with pagination and filters
   */
  public async getSessions(query: QueryTestSessionDto) {
    return await this.repository.findSessions(query);
  }

  /**
   * Get single session by ID or sessionCode
   */
  public async getSessionById(id: string): Promise<TestSessionEntity> {
    const session = await this.repository.findSessionById(id);
    if (!session) {
      throw new NotFoundException(`Test Session [${id}] not found`);
    }
    return session;
  }

  /**
   * Start or resume a test session
   */
  public async startSession(id: string): Promise<TestSessionEntity> {
    const session = await this.getSessionById(id);
    if (session.status === 'COMPLETED') {
      throw new BadRequestException(`Test Session [${session.sessionCode}] is already COMPLETED`);
    }

    session.status = 'IN_PROGRESS';
    if (!session.startTime) {
      session.startTime = new Date();
    }
    await this.repository.saveSession(session);

    // Update waiting device runs to RUNNING
    if (session.deviceRuns) {
      for (const run of session.deviceRuns) {
        if (run.status === 'WAITING') {
          run.status = 'RUNNING';
          run.startedAt = new Date();
          await this.repository.saveDeviceRun(run);
        }
      }
    }

    this.logger.log(`Started Test Session [${session.sessionCode}]`);

    this.broadcastEvent('test_session:status_changed', {
      sessionId: session.id,
      sessionCode: session.sessionCode,
      status: session.status,
      startTime: session.startTime,
    });

    return session;
  }

  /**
   * Abort a test session
   */
  public async abortSession(id: string, reason?: string): Promise<TestSessionEntity> {
    const session = await this.getSessionById(id);
    session.status = 'ABORTED';
    session.endTime = new Date();
    session.notes = session.notes ? `${session.notes} | Aborted: ${reason || 'Operator request'}` : `Aborted: ${reason || 'Operator request'}`;
    await this.repository.saveSession(session);

    if (session.deviceRuns) {
      for (const run of session.deviceRuns) {
        if (run.status === 'RUNNING' || run.status === 'WAITING') {
          run.status = 'SKIPPED';
          run.failureReason = reason || 'Session aborted by operator';
          await this.repository.saveDeviceRun(run);
        }
      }
    }

    this.logger.log(`Aborted Test Session [${session.sessionCode}]`);

    this.broadcastEvent('test_session:status_changed', {
      sessionId: session.id,
      sessionCode: session.sessionCode,
      status: session.status,
      endTime: session.endTime,
    });

    return session;
  }

  /**
   * Retry a single device run within a session
   */
  public async retryDeviceRun(deviceRunId: string): Promise<TestDeviceRunEntity> {
    const run = await this.repository.findDeviceRunById(deviceRunId);
    if (!run) {
      throw new NotFoundException(`Device Run [${deviceRunId}] not found`);
    }

    run.status = 'RUNNING';
    run.totalPackets = 0;
    run.passedAssertions = 0;
    run.failedAssertions = 0;
    run.failureReason = undefined;
    run.completedAt = undefined;
    run.startedAt = new Date();
    run.summaryReport = {};
    const savedRun = await this.repository.saveDeviceRun(run);

    // Recalculate parent session metrics
    await this.recalculateSessionMetrics(run.sessionId);

    this.broadcastEvent('test_device:status_changed', {
      deviceRunId: run.id,
      sessionId: run.sessionId,
      devEUI: run.devEUI,
      status: run.status,
    });

    return savedRun;
  }

  /**
   * Get packet logs for a specific device run
   */
  public async getDeviceRunLogs(deviceRunId: string): Promise<TestPacketLogEntity[]> {
    return await this.repository.findPacketLogs(deviceRunId);
  }

  /**
   * Process an incoming LoRaWAN uplink packet (from simulator or live physical device)
   */
  public async processPacket(dto: SimulatePacketDto): Promise<{
    success: boolean;
    isPass: boolean;
    run: TestDeviceRunEntity;
    session: TestSessionEntity;
    assertionResults: AssertionEvalResult[];
    decodedData: Record<string, any>;
  }> {
    const cleanEUI = cleanDevEUI(dto.devEUI);
    const cleanHex = cleanHexPayload(dto.payloadHex);

    if (!isValidHex(cleanHex)) {
      throw new BadRequestException(`Invalid Hex payload: '${dto.payloadHex}'`);
    }

    const activeMatch = await this.repository.findActiveDeviceRunForDevEUI(cleanEUI);
    if (!activeMatch) {
      throw new BadRequestException(
        `Device [${cleanEUI}] is not registered in an active in-progress Test Session`,
      );
    }

    const { run, session } = activeMatch;

    // 1. Decode Payload (using built-in decoders or common heuristics)
    const decodedData = this.decodePayload(cleanHex, dto.fPort || 1, run.sku);

    // 2. Evaluate Assertions
    const assertionResults: AssertionEvalResult[] = [];
    let assertionsPass = true;
    let firstErrorMessage = '';

    const assertions = session.template?.assertions || [];
    if (assertions.length > 0) {
      for (const rule of assertions) {
        const actualValue = this.extractFieldValue(decodedData, rule.fieldName);
        const evalResult = this.evaluateSingleAssertion(rule, actualValue);
        assertionResults.push(evalResult);

        if (!evalResult.pass) {
          if (rule.severity === 'ERROR') {
            assertionsPass = false;
            if (!firstErrorMessage) {
              firstErrorMessage = evalResult.message || `Rule '${rule.fieldLabel || rule.fieldName}' failed`;
            }
          }
        }
      }
    } else {
      // Default heuristic assertions if no template rules assigned
      const defaultRules: any[] = [
        { fieldName: 'battery', operator: 'GREATER_THAN', expectedValue: 2.8, severity: 'WARNING' },
      ];
      for (const rule of defaultRules) {
        const val = this.extractFieldValue(decodedData, rule.fieldName);
        if (val !== undefined) {
          assertionResults.push(this.evaluateSingleAssertion(rule, val));
        }
      }
    }

    // 3. Save Packet Log
    const packetLog = new TestPacketLogEntity();
    packetLog.deviceRunId = run.id;
    packetLog.devEUI = cleanEUI;
    packetLog.fPort = dto.fPort || 1;
    packetLog.fCnt = dto.fCnt || (run.totalPackets + 1);
    packetLog.payloadHex = cleanHex;
    packetLog.decodedData = decodedData;
    packetLog.assertionResults = assertionResults;
    packetLog.isPass = assertionsPass;
    packetLog.rssi = dto.rssi ?? -75;
    packetLog.snr = dto.snr ?? 9.5;
    packetLog.gatewayId = dto.gatewayId || 'GW-AUTO-01';
    packetLog.receivedAt = new Date();
    await this.repository.savePacketLog(packetLog);

    // 4. Update Device Run State
    run.totalPackets = (run.totalPackets || 0) + 1;
    const passedCount = assertionResults.filter((r) => r.pass).length;
    const failedCount = assertionResults.filter((r) => !r.pass).length;
    run.passedAssertions = (run.passedAssertions || 0) + passedCount;
    run.failedAssertions = (run.failedAssertions || 0) + failedCount;

    // Moving average for RSSI & SNR
    if (dto.rssi !== undefined) {
      run.rssiAvg = run.rssiAvg !== undefined ? Math.round(((run.rssiAvg + dto.rssi) / 2) * 10) / 10 : dto.rssi;
    }
    if (dto.snr !== undefined) {
      run.snrAvg = run.snrAvg !== undefined ? Math.round(((run.snrAvg + dto.snr) / 2) * 10) / 10 : dto.snr;
    }

    // Extract battery voltage if present
    const batteryVal = decodedData.battery ?? decodedData.battery_voltage ?? decodedData.voltage;
    if (typeof batteryVal === 'number') {
      run.batteryVoltage = batteryVal;
    }

    const minPackets = session.template?.minPacketsRequired || 1;

    if (!assertionsPass) {
      run.status = 'FAILED';
      run.failureReason = firstErrorMessage || 'One or more error assertions violated';
      run.completedAt = new Date();
    } else if (run.totalPackets >= minPackets) {
      run.status = 'PASSED';
      run.failureReason = undefined;
      run.completedAt = new Date();
    } else {
      run.status = 'RUNNING';
    }

    run.summaryReport = {
      lastPacket: {
        fPort: packetLog.fPort,
        fCnt: packetLog.fCnt,
        receivedAt: packetLog.receivedAt,
        decoded: decodedData,
      },
      assertions: assertionResults,
    };

    const savedRun = await this.repository.saveDeviceRun(run);

    // 5. Recalculate Session Summary & State
    const updatedSession = await this.recalculateSessionMetrics(session.id);

    // 6. Broadcast Realtime WebSocket Events
    this.broadcastEvent('test_device:packet_received', {
      sessionId: session.id,
      deviceRunId: run.id,
      devEUI: cleanEUI,
      packet: {
        fPort: packetLog.fPort,
        fCnt: packetLog.fCnt,
        payloadHex: packetLog.payloadHex,
        decodedData,
        isPass: assertionsPass,
        receivedAt: packetLog.receivedAt,
      },
    });

    this.broadcastEvent('test_device:status_changed', {
      sessionId: session.id,
      deviceRunId: run.id,
      devEUI: cleanEUI,
      status: run.status,
      totalPackets: run.totalPackets,
      batteryVoltage: run.batteryVoltage,
      failureReason: run.failureReason,
    });

    this.broadcastEvent('test_session:progress', {
      sessionId: session.id,
      totalDevices: updatedSession.totalDevices,
      passedDevices: updatedSession.passedDevices,
      failedDevices: updatedSession.failedDevices,
      status: updatedSession.status,
    });

    if (updatedSession.status === 'COMPLETED') {
      this.broadcastEvent('test_session:completed', {
        sessionId: session.id,
        sessionCode: session.sessionCode,
        totalDevices: updatedSession.totalDevices,
        passedDevices: updatedSession.passedDevices,
        failedDevices: updatedSession.failedDevices,
        endTime: updatedSession.endTime,
      });
    }

    return {
      success: true,
      isPass: assertionsPass,
      run: savedRun,
      session: updatedSession,
      assertionResults,
      decodedData,
    };
  }

  /**
   * Recalculate passed/failed counts and determine if session is completed
   */
  private async recalculateSessionMetrics(sessionId: string): Promise<TestSessionEntity> {
    const session = await this.repository.findSessionById(sessionId);
    if (!session) return null as any;

    const runs = session.deviceRuns || [];
    let passed = 0;
    let failed = 0;
    let inProgress = 0;

    for (const r of runs) {
      if (r.status === 'PASSED') passed++;
      else if (r.status === 'FAILED' || r.status === 'TIMEOUT') failed++;
      else inProgress++;
    }

    session.passedDevices = passed;
    session.failedDevices = failed;
    session.totalDevices = runs.length;

    // Check if 100% of devices have finished
    if (runs.length > 0 && inProgress === 0 && session.status === 'IN_PROGRESS') {
      session.status = 'COMPLETED';
      session.endTime = new Date();
    }

    return await this.repository.saveSession(session);
  }

  /**
   * Get high-level summary metrics for a session
   */
  public async getSessionSummary(id: string) {
    const session = await this.getSessionById(id);
    const runs = session.deviceRuns || [];

    const total = runs.length;
    let passed = 0;
    let failed = 0;
    let running = 0;
    let waiting = 0;

    for (const r of runs) {
      if (r.status === 'PASSED') passed++;
      else if (r.status === 'FAILED' || r.status === 'TIMEOUT') failed++;
      else if (r.status === 'RUNNING') running++;
      else waiting++;
    }

    const completedUnits = passed + failed;
    const progressPercentage = total > 0 ? Math.round((completedUnits / total) * 100) : 0;
    const passRatePercentage = completedUnits > 0 ? Math.round((passed / completedUnits) * 100) : 0;

    let durationSeconds = 0;
    if (session.startTime) {
      const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
      durationSeconds = Math.max(0, Math.round((end - new Date(session.startTime).getTime()) / 1000));
    }

    return {
      id: session.id,
      sessionCode: session.sessionCode,
      soCode: session.soCode,
      itemCode: session.itemCode,
      status: session.status,
      totalDevices: total,
      passedDevices: passed,
      failedDevices: failed,
      runningDevices: running,
      waitingDevices: waiting,
      progressPercentage,
      passRatePercentage,
      startTime: session.startTime,
      endTime: session.endTime,
      durationSeconds,
      template: session.template ? {
        id: session.template.id,
        code: session.template.code,
        name: session.template.name,
      } : null,
    };
  }

  /**
   * Export factory inspection report
   */
  public async exportSessionReport(id: string, format: 'csv' | 'json' = 'csv') {
    const session = await this.getSessionById(id);
    const summary = await this.getSessionSummary(id);

    if (format === 'json') {
      return {
        session,
        summary,
        exportedAt: new Date().toISOString(),
      };
    }

    // CSV format
    const rows = [
      ['DAVITEQ FACTORY PRODUCT INSPECTION REPORT'],
      ['Session Code', session.sessionCode],
      ['Sales Order', session.soCode],
      ['Item Code', session.itemCode],
      ['Template', session.template?.name || 'Standard'],
      ['Status', session.status],
      ['Total Units', String(summary.totalDevices)],
      ['Passed Units', String(summary.passedDevices)],
      ['Failed Units', String(summary.failedDevices)],
      ['Pass Rate', `${summary.passRatePercentage}%`],
      ['Start Time', session.startTime ? new Date(session.startTime).toISOString() : 'N/A'],
      ['End Time', session.endTime ? new Date(session.endTime).toISOString() : 'N/A'],
      ['Operator', session.operatorId || 'QA'],
      [],
      ['Index', 'DevEUI', 'SKU', 'Firmware', 'Status', 'Packets', 'RSSI (dBm)', 'SNR (dB)', 'Battery (V)', 'Failure Reason'],
    ];

    (session.deviceRuns || []).forEach((run, idx) => {
      rows.push([
        String(idx + 1),
        run.devEUI,
        run.sku || '',
        run.firmwareVersion || '',
        run.status,
        String(run.totalPackets || 0),
        run.rssiAvg !== undefined && run.rssiAvg !== null ? String(run.rssiAvg) : '',
        run.snrAvg !== undefined && run.snrAvg !== null ? String(run.snrAvg) : '',
        run.batteryVoltage !== undefined && run.batteryVoltage !== null ? String(run.batteryVoltage) : '',
        run.failureReason ? `"${run.failureReason.replace(/"/g, '""')}"` : '',
      ]);
    });

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    return {
      fileName: `QC-REPORT-${session.sessionCode}.csv`,
      contentType: 'text/csv',
      content: csvContent,
    };
  }

  /**
   * Evaluate a single assertion against an actual value
   */
  private evaluateSingleAssertion(assertRule: any, actual: any): AssertionEvalResult {
    const op = assertRule.operator;
    const expected = assertRule.expectedValue;
    const tolerance = assertRule.tolerance || 0;
    const severity = assertRule.severity || 'ERROR';

    let pass = false;
    let message = '';

    if (actual === undefined || actual === null) {
      return {
        fieldName: assertRule.fieldName,
        operator: op,
        expectedValue: expected,
        actualValue: null,
        pass: op === 'IS_NULL',
        severity,
        message: op === 'IS_NULL' ? 'Field is null as expected' : `Field '${assertRule.fieldName}' missing from decoded payload`,
      };
    }

    switch (op) {
      case 'EQUALS':
        if (typeof expected === 'number' && typeof actual === 'number' && tolerance > 0) {
          pass = Math.abs(actual - expected) <= tolerance;
          message = pass
            ? `${actual} == ${expected} (tolerance ±${tolerance})`
            : `${actual} deviated from ${expected} beyond ±${tolerance}`;
        } else {
          pass = String(actual).trim() === String(expected).trim();
          message = pass ? `${actual} == ${expected}` : `${actual} != ${expected}`;
        }
        break;

      case 'NOT_EQUALS':
        pass = String(actual).trim() !== String(expected).trim();
        message = pass ? `${actual} != ${expected}` : `${actual} == ${expected}`;
        break;

      case 'GREATER_THAN':
        pass = Number(actual) > Number(expected);
        message = pass ? `${actual} > ${expected}` : `${actual} <= ${expected}`;
        break;

      case 'LESS_THAN':
        pass = Number(actual) < Number(expected);
        message = pass ? `${actual} < ${expected}` : `${actual} >= ${expected}`;
        break;

      case 'BETWEEN':
      case 'IN_RANGE':
        let min = -Infinity;
        let max = Infinity;
        if (expected && typeof expected === 'object') {
          min = expected.min !== undefined ? Number(expected.min) : -Infinity;
          max = expected.max !== undefined ? Number(expected.max) : Infinity;
        } else if (Array.isArray(expected) && expected.length >= 2) {
          min = Number(expected[0]);
          max = Number(expected[1]);
        }
        pass = Number(actual) >= min && Number(actual) <= max;
        message = pass
          ? `${actual} is within range [${min}, ${max}]`
          : `${actual} is outside range [${min}, ${max}]`;
        break;

      case 'IS_NOT_NULL':
        pass = actual !== null && actual !== undefined && actual !== '';
        message = pass ? `Field '${assertRule.fieldName}' is populated` : `Field is empty`;
        break;

      case 'CONTAINS':
        pass = String(actual).includes(String(expected));
        message = pass ? `${actual} contains '${expected}'` : `${actual} missing '${expected}'`;
        break;

      case 'REGEX':
        try {
          const reg = new RegExp(String(expected));
          pass = reg.test(String(actual));
          message = pass ? `${actual} matches pattern` : `${actual} does not match regex`;
        } catch (e: any) {
          pass = false;
          message = `Invalid regex pattern: ${e.message}`;
        }
        break;

      default:
        pass = false;
        message = `Unknown assertion operator '${op}'`;
    }

    return {
      fieldName: assertRule.fieldName,
      operator: op,
      expectedValue: expected,
      actualValue: actual,
      pass,
      severity,
      message,
    };
  }

  /**
   * Helper to extract nested JSON values like 'sensors.temperature'
   */
  private extractFieldValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    if (obj[path] !== undefined) return obj[path];
    const parts = path.split('.');
    let cur = obj;
    for (const part of parts) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[part];
    }
    return cur;
  }

  /**
   * Built-in lightweight decoder supporting Daviteq WSLRW sensor packets
   */
  private decodePayload(hex: string, fPort: number, sku?: string): Record<string, any> {
    const clean = hex.trim().toLowerCase();
    const result: Record<string, any> = {
      fPort,
      rawHex: clean,
    };

    try {
      const bytes = Buffer.from(clean, 'hex');
      // If WSLRW-TH (Temperature & Humidity standard Daviteq payload):
      // Format: [Channel, Type, ValueHi, ValueLo...]
      // Common heuristic:
      let i = 0;
      while (i < bytes.length) {
        const channel = bytes[i];
        if (i + 1 >= bytes.length) break;
        const type = bytes[i + 1];

        // 1. Battery voltage (channel 0x03, channel 0x0b, or type 0x03)
        if ((channel === 0x03 || channel === 0x0b || type === 0x03) && i + 3 < bytes.length && result.battery === undefined) {
          const rawMv = bytes.readUInt16BE(i + 2);
          result.battery = Math.round((rawMv / 1000) * 100) / 100;
          result.batteryVoltage = result.battery;
          i += 4;
          continue;
        }

        // 2. Humidity (channel 0x02, or type 0x02 / 0x68)
        if ((channel === 0x02 || type === 0x02 || type === 0x68) && i + 3 < bytes.length && result.humidity === undefined) {
          const rawHum = bytes.readUInt16BE(i + 2);
          result.humidity = Math.round((rawHum / 10) * 10) / 10;
          i += 4;
          continue;
        }

        // 3. Temperature (channel 0x01, or type 0x01 / 0x67)
        if ((channel === 0x01 || type === 0x01 || type === 0x67) && i + 3 < bytes.length && result.temperature === undefined) {
          const rawTemp = bytes.readInt16BE(i + 2);
          result.temperature = Math.round((rawTemp / 10) * 10) / 10;
          i += 4;
          continue;
        }

        // 4. Counter / Pulse (channel 0x04 or type 0x04)
        if ((channel === 0x04 || type === 0x04) && i + 5 < bytes.length && result.pulseCount === undefined) {
          result.pulseCount = bytes.readUInt32BE(i + 2);
          i += 6;
          continue;
        }

        i++;
      }

      // Fallback heuristics if specific tags were not matched
      if (result.temperature === undefined && bytes.length >= 2) {
        result.temperature = Math.round((bytes.readInt16BE(0) / 10) * 10) / 10;
      }
      if (result.humidity === undefined && bytes.length >= 4) {
        result.humidity = Math.round((bytes.readUInt16BE(2) / 10) * 10) / 10;
      }
      if (result.battery === undefined && bytes.length >= 6) {
        const rawMv = bytes.readUInt16BE(bytes.length - 2);
        if (rawMv >= 1000 && rawMv <= 5000) {
          result.battery = Math.round((rawMv / 1000) * 100) / 100;
          result.batteryVoltage = result.battery;
        }
      }
    } catch (e: any) {
      this.logger.debug(`Decode error: ${e.message}`);
    }

    return result;
  }

  private broadcastEvent(event: string, payload: any) {
    if (!this.realtimeGateway) return;
    try {
      if (this.realtimeGateway.server) {
        this.realtimeGateway.server.emit(event, payload);
        this.realtimeGateway.server.emit('test_automation:stream', { event, payload });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to broadcast event '${event}': ${err.message}`);
    }
  }

  private serializeSession(s: TestSessionEntity) {
    return {
      id: s.id,
      sessionCode: s.sessionCode,
      soCode: s.soCode,
      itemCode: s.itemCode,
      templateId: s.templateId,
      totalDevices: s.totalDevices,
      passedDevices: s.passedDevices,
      failedDevices: s.failedDevices,
      status: s.status,
      startTime: s.startTime,
      endTime: s.endTime,
      notes: s.notes,
      createdAt: s.createdAt,
    };
  }
}
