import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import * as vm from 'vm';
import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { TestTemplateEntity } from './entities/test-template.entity';
import { TestAssertionEntity } from './entities/test-assertion.entity';
import { DecoderEntity } from '../decoder-admin/entities/decoder.entity';
import {
  CreateTestTemplateDto,
  UpdateTestTemplateDto,
  DryRunTestDto,
  CreateAssertionDto,
} from './dto/test-builder.dto';
import { cleanSku, resolveDecoderId } from '../../lorawan/common/lorawan-utils';

export interface DiscoveredField {
  name: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  unit?: string;
  sampleValue?: any;
}

export interface AssertionEvaluationResult {
  fieldName: string;
  operator: string;
  expectedValue: any;
  actualValue: any;
  pass: boolean;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface DryRunResponse {
  pass: boolean;
  executionMode: string;
  executionTimeMs: number;
  assertionResults: AssertionEvaluationResult[];
  scriptResult?: {
    pass: boolean;
    reason?: string;
    metrics?: Record<string, any>;
    logs?: string[];
  };
  summary: string;
}

@Injectable()
export class TestBuilderService implements OnModuleInit {
  private readonly logger = new Logger(TestBuilderService.name);

  constructor(@Optional() private readonly dbService?: DynamicDatabaseService) {}

  private getTemplateRepo(): Repository<TestTemplateEntity> {
    if (!this.dbService) {
      throw new BadRequestException('DynamicDatabaseService is not initialized');
    }
    return this.dbService.getRepositoryForTable('test_templates', TestTemplateEntity);
  }

  private getAssertionRepo(): Repository<TestAssertionEntity> {
    if (!this.dbService) {
      throw new BadRequestException('DynamicDatabaseService is not initialized');
    }
    return this.dbService.getRepositoryForTable('test_assertions', TestAssertionEntity);
  }

  private getDecoderRepo(): Repository<DecoderEntity> {
    if (!this.dbService) {
      throw new BadRequestException('DynamicDatabaseService is not initialized');
    }
    return this.dbService.getRepositoryForTable('decoder', DecoderEntity);
  }

  async onModuleInit() {
    await this.ensureTables();
    await this.seedDefaultTemplates();
  }

  private async ensureTables(): Promise<void> {
    if (!this.dbService) return;
    try {
      const ds = this.dbService.getDataSourceForTable('test_templates');
      await ds.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        CREATE TABLE IF NOT EXISTS "test_templates" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" VARCHAR(255) NOT NULL,
          "code" VARCHAR(100) NOT NULL,
          "description" TEXT,
          "sku" VARCHAR(255) NOT NULL,
          "firmwareVersion" VARCHAR(100) NOT NULL,
          "decoderId" VARCHAR(255),
          "executionMode" VARCHAR(50) NOT NULL DEFAULT 'FLOW',
          "flowConfig" JSONB NOT NULL DEFAULT '{}'::jsonb,
          "customScript" TEXT,
          "timeoutSeconds" INT NOT NULL DEFAULT 60,
          "minPacketsRequired" INT NOT NULL DEFAULT 1,
          "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
          "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
          "createdBy" VARCHAR(255),
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT "UQ_test_templates_code" UNIQUE ("code")
        );

        CREATE TABLE IF NOT EXISTS "test_assertions" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "templateId" UUID NOT NULL REFERENCES "test_templates"("id") ON DELETE CASCADE,
          "fieldName" VARCHAR(255) NOT NULL,
          "fieldLabel" VARCHAR(255),
          "operator" VARCHAR(50) NOT NULL,
          "expectedValue" JSONB,
          "tolerance" DOUBLE PRECISION DEFAULT 0,
          "unit" VARCHAR(50),
          "severity" VARCHAR(50) NOT NULL DEFAULT 'ERROR',
          "orderIndex" INT NOT NULL DEFAULT 0,
          "description" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      this.logger.log('Test Automation tables ensured in database');
    } catch (err: any) {
      this.logger.warn(`Could not ensure test automation tables: ${err.message}`);
    }
  }

  private async seedDefaultTemplates(): Promise<void> {
    try {
      const repo = this.getTemplateRepo();
      const count = await repo.count();
      if (count > 0) return;

      const sampleFlowConfig = {
        nodes: [
          { id: 'node-in-1', type: 'lora-in', label: 'LoRaWAN Ingestion', x: 80, y: 160, params: { sku: 'WSLRW-CO2', fw: '1' } },
          { id: 'node-ext-1', type: 'extractor', label: 'Field Extractor', x: 300, y: 160, params: { field: 'co2', label: 'Nồng độ CO2', unit: 'ppm' } },
          { id: 'node-comp-1', type: 'comparator', label: 'CO2 Standard Range', x: 540, y: 120, params: { operator: 'BETWEEN', min: 400, max: 2000, severity: 'ERROR' } },
          { id: 'node-rf-1', type: 'comparator', label: 'RSSI Minimum Check', x: 540, y: 240, params: { operator: 'GREATER_THAN', value: -120, severity: 'WARNING' } },
          { id: 'node-out-1', type: 'verdict', label: 'QA Verdict Pass/Fail', x: 800, y: 180, params: { autoStopOnPass: true } },
        ],
        connections: [
          { from: 'node-in-1', to: 'node-ext-1' },
          { from: 'node-ext-1', to: 'node-comp-1' },
          { from: 'node-in-1', to: 'node-rf-1' },
          { from: 'node-comp-1', to: 'node-out-1' },
          { from: 'node-rf-1', to: 'node-out-1' },
        ],
      };

      const defaultScript = `/**
 * Hàm kiểm định chất lượng cảm biến LoRaWAN
 * @param {Object} packet - Gói tin: { rssi, snr, fPort, decoded: { co2, temperature, humidity } }
 * @param {Object} context - Ngữ cảnh: { packetCount, minPackets, durationSeconds }
 */
function evaluate(packet, context) {
  if (context.packetCount < context.minPackets) {
    return { pass: false, reason: 'Chưa đủ số lượng ' + context.minPackets + ' gói tin' };
  }
  if (packet.rssi < -120) {
    return { pass: false, reason: 'Tín hiệu RSSI quá yếu: ' + packet.rssi + ' dBm' };
  }
  const decoded = packet.decoded || {};
  if (decoded.co2 !== undefined && (decoded.co2 < 400 || decoded.co2 > 2000)) {
    return { pass: false, reason: 'Nồng độ CO2 (' + decoded.co2 + ' ppm) ngoài dải chuẩn 400 - 2000 ppm' };
  }
  return { pass: true, metrics: { packetCount: context.packetCount, co2: decoded.co2, rssi: packet.rssi } };
}`;

      const sampleDecoder = await this.getDecoderRepo().findOne({
        where: [{ id: 'WSLRW-CO2_1' }, { sku: 'WSLRW-CO2' }],
      });
      const resolvedDecoderId = sampleDecoder ? sampleDecoder.id : null;

      const t1 = repo.create({
        name: 'Factory QA Verification - WSLRW-CO2',
        code: 'TEMPLATE_WSLRW_CO2',
        description: 'Automated LoRaWAN telemetry and RF verification for Daviteq sensors',
        sku: 'WSLRW-CO2',
        firmwareVersion: '1',
        decoderId: resolvedDecoderId,
        executionMode: 'FLOW',
        flowConfig: sampleFlowConfig,
        customScript: defaultScript,
        timeoutSeconds: 180,
        minPacketsRequired: 3,
        isActive: true,
        createdBy: 'system',
      });
      const savedT1 = await repo.save(t1);

      const assertRepo = this.getAssertionRepo();
      await assertRepo.save([
        assertRepo.create({
          templateId: savedT1.id,
          fieldName: 'co2',
          fieldLabel: 'CO2 Concentration',
          operator: 'BETWEEN',
          expectedValue: { min: 400, max: 2000 },
          unit: 'ppm',
          severity: 'ERROR',
          orderIndex: 0,
        }),
        assertRepo.create({
          templateId: savedT1.id,
          fieldName: 'rssi',
          fieldLabel: 'RSSI Signal Strength',
          operator: 'GREATER_THAN',
          expectedValue: -120,
          unit: 'dBm',
          severity: 'WARNING',
          orderIndex: 1,
        }),
      ]);

      this.logger.log('Seeded default LoRaWAN Test Automation template: TEMPLATE_WSLRW_CO2');
    } catch (e: any) {
      this.logger.warn(`Failed seeding templates: ${e.message}`);
    }
  }

  async findAll(): Promise<TestTemplateEntity[]> {
    const repo = this.getTemplateRepo();
    return await repo.find({
      relations: ['assertions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TestTemplateEntity> {
    const repo = this.getTemplateRepo();
    const item = await repo.findOne({
      where: { id },
      relations: ['assertions'],
    });
    if (!item) {
      throw new NotFoundException(`Test template with ID '${id}' not found`);
    }
    return item;
  }

  async create(dto: CreateTestTemplateDto, author: string): Promise<TestTemplateEntity> {
    const repo = this.getTemplateRepo();
    const existing = await repo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Template with code '${dto.code}' already exists`);
    }

    const skuClean = cleanSku(dto.sku);
    const fwClean = dto.firmwareVersion ? String(dto.firmwareVersion).trim() : '1';
    const decoderId = resolveDecoderId(skuClean, parseInt(fwClean, 10) || 1);

    const template = repo.create({
      name: dto.name,
      code: dto.code.trim().toUpperCase(),
      description: dto.description,
      sku: skuClean,
      firmwareVersion: fwClean,
      decoderId: decoderId || undefined,
      executionMode: dto.executionMode || 'FLOW',
      flowConfig: dto.flowConfig || {},
      customScript: dto.customScript || '',
      timeoutSeconds: dto.timeoutSeconds ?? 60,
      minPacketsRequired: dto.minPacketsRequired ?? 1,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      metadata: dto.metadata || {},
      createdBy: author,
    });

    const saved = await repo.save(template);

    if (dto.assertions && dto.assertions.length > 0) {
      const assertRepo = this.getAssertionRepo();
      const assertionsToSave = dto.assertions.map((a, idx) =>
        assertRepo.create({
          templateId: saved.id,
          fieldName: a.fieldName,
          fieldLabel: a.fieldLabel || a.fieldName,
          operator: a.operator,
          expectedValue: a.expectedValue,
          tolerance: a.tolerance || 0,
          unit: a.unit,
          severity: a.severity || 'ERROR',
          orderIndex: a.orderIndex !== undefined ? a.orderIndex : idx,
          description: a.description,
        }),
      );
      saved.assertions = await assertRepo.save(assertionsToSave);
    } else {
      saved.assertions = [];
    }

    return saved;
  }

  async update(id: string, dto: UpdateTestTemplateDto, author: string): Promise<TestTemplateEntity> {
    const repo = this.getTemplateRepo();
    const template = await this.findOne(id);

    if (dto.name !== undefined) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description;
    if (dto.sku !== undefined) {
      template.sku = cleanSku(dto.sku);
      if (dto.firmwareVersion !== undefined) {
        template.firmwareVersion = String(dto.firmwareVersion);
      }
      template.decoderId = resolveDecoderId(template.sku, parseInt(template.firmwareVersion, 10) || 1) || undefined;
    }
    if (dto.executionMode !== undefined) template.executionMode = dto.executionMode;
    if (dto.flowConfig !== undefined) template.flowConfig = dto.flowConfig;
    if (dto.customScript !== undefined) template.customScript = dto.customScript;
    if (dto.timeoutSeconds !== undefined) template.timeoutSeconds = dto.timeoutSeconds;
    if (dto.minPacketsRequired !== undefined) template.minPacketsRequired = dto.minPacketsRequired;
    if (dto.isActive !== undefined) template.isActive = dto.isActive;
    if (dto.metadata !== undefined) template.metadata = dto.metadata;

    const saved = await repo.save(template);

    if (dto.assertions !== undefined) {
      const assertRepo = this.getAssertionRepo();
      await assertRepo.delete({ templateId: id });
      if (dto.assertions.length > 0) {
        const toSave = dto.assertions.map((a, idx) =>
          assertRepo.create({
            templateId: id,
            fieldName: a.fieldName,
            fieldLabel: a.fieldLabel || a.fieldName,
            operator: a.operator,
            expectedValue: a.expectedValue,
            tolerance: a.tolerance || 0,
            unit: a.unit,
            severity: a.severity || 'ERROR',
            orderIndex: a.orderIndex !== undefined ? a.orderIndex : idx,
            description: a.description,
          }),
        );
        saved.assertions = await assertRepo.save(toSave);
      } else {
        saved.assertions = [];
      }
    }

    return saved;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const repo = this.getTemplateRepo();
    const template = await this.findOne(id);
    await repo.remove(template);
    return { success: true, message: `Template ${template.name} (${template.code}) deleted` };
  }

  async getAvailableFields(sku?: string, firmwareVersion?: string): Promise<DiscoveredField[]> {
    const commonFields: DiscoveredField[] = [
      { name: 'rssi', label: 'Cường độ tín hiệu (RSSI)', type: 'number', unit: 'dBm', sampleValue: -85 },
      { name: 'snr', label: 'Tỉ số tín hiệu / nhiễu (SNR)', type: 'number', unit: 'dB', sampleValue: 7.5 },
      { name: 'fPort', label: 'LoRaWAN FPort', type: 'number', sampleValue: 1 },
      { name: 'fCnt', label: 'Bộ đếm gói (FCnt)', type: 'number', sampleValue: 12 },
    ];

    if (!sku) return commonFields;

    const skuClean = cleanSku(sku);
    const fwNum = parseInt(firmwareVersion || '1', 10) || 1;
    const decoderId = resolveDecoderId(skuClean, fwNum);

    let extractedSensorFields: DiscoveredField[] = [];

    try {
      const decoderRepo = this.getDecoderRepo();
      const decoder = await decoderRepo.findOne({ where: { id: decoderId } });
      if (decoder && decoder.decoderCode) {
        extractedSensorFields = this.parseFieldsFromDecoderCode(decoder.decoderCode);
      }
    } catch (e: any) {
      this.logger.debug(`Could not query decoder for fields: ${e.message}`);
    }

    if (extractedSensorFields.length === 0) {
      if (skuClean.includes('CO2')) {
        extractedSensorFields = [
          { name: 'co2', label: 'Nồng độ CO2', type: 'number', unit: 'ppm', sampleValue: 650 },
          { name: 'temperature', label: 'Nhiệt độ', type: 'number', unit: '°C', sampleValue: 28.5 },
          { name: 'humidity', label: 'Độ ẩm', type: 'number', unit: '%RH', sampleValue: 65.2 },
          { name: 'battery', label: 'Dung lượng pin', type: 'number', unit: 'V', sampleValue: 3.6 },
        ];
      } else if (skuClean.includes('TH') || skuClean.includes('TEMP')) {
        extractedSensorFields = [
          { name: 'temperature', label: 'Nhiệt độ môi trường', type: 'number', unit: '°C', sampleValue: 25.4 },
          { name: 'humidity', label: 'Độ ẩm không khí', type: 'number', unit: '%RH', sampleValue: 60.0 },
          { name: 'battery', label: 'Điện áp pin', type: 'number', unit: 'V', sampleValue: 3.6 },
        ];
      } else if (skuClean.includes('LVL') || skuClean.includes('LEVEL')) {
        extractedSensorFields = [
          { name: 'levelMm', label: 'Mức chất lỏng', type: 'number', unit: 'mm', sampleValue: 1250 },
          { name: 'percentage', label: 'Tỉ lệ thể tích', type: 'number', unit: '%', sampleValue: 82.5 },
          { name: 'alarmStatus', label: 'Trạng thái cảnh báo', type: 'string', sampleValue: 'NORMAL' },
        ];
      } else if (skuClean.includes('MB485') || skuClean.includes('MODBUS')) {
        extractedSensorFields = [
          { name: 'voltage', label: 'Điện áp pha', type: 'number', unit: 'V', sampleValue: 220.5 },
          { name: 'current', label: 'Dòng điện', type: 'number', unit: 'A', sampleValue: 4.8 },
          { name: 'power', label: 'Công suất tiêu thụ', type: 'number', unit: 'kW', sampleValue: 1.05 },
        ];
      } else {
        extractedSensorFields = [
          { name: 'value', label: 'Giá trị cảm biến', type: 'number', sampleValue: 100 },
          { name: 'battery', label: 'Điện áp pin', type: 'number', unit: 'V', sampleValue: 3.6 },
          { name: 'status', label: 'Trạng thái', type: 'string', sampleValue: 'OK' },
        ];
      }
    }

    const map = new Map<string, DiscoveredField>();
    for (const f of [...extractedSensorFields, ...commonFields]) {
      map.set(f.name, f);
    }
    return Array.from(map.values());
  }

  private parseFieldsFromDecoderCode(code: string): DiscoveredField[] {
    const fields: DiscoveredField[] = [];
    const seen = new Set<string>();

    const regex = /(?:data|decoded|result|output)\.([a-zA-Z0-9_]+)\s*=/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      const fieldName = match[1];
      if (!seen.has(fieldName) && !['length', 'push', 'constructor'].includes(fieldName)) {
        seen.add(fieldName);
        fields.push({
          name: fieldName,
          label: this.formatFieldLabel(fieldName),
          type: 'number',
          sampleValue: 25,
        });
      }
    }

    return fields;
  }

  private formatFieldLabel(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  async dryRun(dto: DryRunTestDto): Promise<DryRunResponse> {
    const startTime = Date.now();
    const packet = dto.mockPacket || {};
    const context = dto.context || { packetCount: 1, minPackets: 1, durationSeconds: 10 };
    const mode = dto.executionMode || 'FLOW';

    const decodedData = packet.decoded || packet.decodedData || {};
    const flatPacketData = {
      ...decodedData,
      rssi: packet.rssi !== undefined ? packet.rssi : -80,
      snr: packet.snr !== undefined ? packet.snr : 8.0,
      fPort: packet.fPort !== undefined ? packet.fPort : 1,
      fCnt: packet.fCnt !== undefined ? packet.fCnt : 1,
    };

    const assertionResults: AssertionEvaluationResult[] = [];
    let assertionsPassed = true;

    if (dto.assertions && dto.assertions.length > 0) {
      for (const assert of dto.assertions) {
        const actualValue = this.extractFieldValue(flatPacketData, assert.fieldName);
        const evalResult = this.evaluateSingleAssertion(assert, actualValue);
        assertionResults.push(evalResult);
        if (!evalResult.pass && evalResult.severity === 'ERROR') {
          assertionsPassed = false;
        }
      }
    }

    let scriptResult: any = undefined;
    let scriptPassed = true;

    if ((mode === 'SCRIPT' || mode === 'HYBRID') && dto.customScript && dto.customScript.trim()) {
      scriptResult = this.executeSandboxScript(dto.customScript, packet, context);
      scriptPassed = !!scriptResult.pass;
    }

    const overallPass = mode === 'SCRIPT' ? scriptPassed : mode === 'FLOW' ? assertionsPassed : assertionsPassed && scriptPassed;
    const executionTimeMs = Date.now() - startTime;

    return {
      pass: overallPass,
      executionMode: mode,
      executionTimeMs,
      assertionResults,
      scriptResult,
      summary: overallPass
        ? `Tất cả điều kiện kiểm thử đã ĐẠT chuẩn (${assertionResults.length} rules, ${executionTimeMs}ms)`
        : `Kiểm thử KHÔNG ĐẠT chuẩn: Có lỗi vi phạm điều kiện (${executionTimeMs}ms)`,
    };
  }

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

  private evaluateSingleAssertion(assert: CreateAssertionDto, actual: any): AssertionEvaluationResult {
    const operator = assert.operator;
    const expected = assert.expectedValue;
    const tolerance = assert.tolerance || 0;
    const severity = assert.severity || 'ERROR';

    let pass = false;
    let message = '';

    if (actual === undefined || actual === null) {
      return {
        fieldName: assert.fieldName,
        operator,
        expectedValue: expected,
        actualValue: null,
        pass: false,
        severity,
        message: `Trường '${assert.fieldName}' không tồn tại trong dữ liệu gói tin`,
      };
    }

    switch (operator) {
      case 'EQUALS':
        if (typeof expected === 'number' && typeof actual === 'number' && tolerance > 0) {
          pass = Math.abs(actual - expected) <= tolerance;
          message = pass
            ? `${actual} == ${expected} (±${tolerance})`
            : `${actual} lệch khỏi ${expected} quá dung sai ±${tolerance}`;
        } else {
          pass = String(actual) === String(expected);
          message = pass ? `${actual} == ${expected}` : `${actual} != ${expected}`;
        }
        break;

      case 'NOT_EQUALS':
        pass = String(actual) !== String(expected);
        message = pass ? `${actual} != ${expected}` : `${actual} trùng với ${expected}`;
        break;

      case 'GREATER_THAN':
        pass = Number(actual) > Number(expected);
        message = pass ? `${actual} > ${expected}` : `${actual} không lớn hơn ${expected}`;
        break;

      case 'LESS_THAN':
        pass = Number(actual) < Number(expected);
        message = pass ? `${actual} < ${expected}` : `${actual} không nhỏ hơn ${expected}`;
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
          ? `${actual} nằm trong dải [${min}, ${max}]`
          : `${actual} nằm ngoài dải [${min}, ${max}]`;
        break;

      case 'IS_NOT_NULL':
        pass = actual !== null && actual !== undefined && actual !== '';
        message = pass ? `Trường ${assert.fieldName} tồn tại giá trị` : `Trường rỗng`;
        break;

      case 'CONTAINS':
        pass = String(actual).includes(String(expected));
        message = pass ? `${actual} chứa '${expected}'` : `${actual} không chứa '${expected}'`;
        break;

      case 'REGEX':
        try {
          const reg = new RegExp(String(expected));
          pass = reg.test(String(actual));
          message = pass ? `${actual} khớp biểu thức chính quy` : `${actual} không khớp regex ${expected}`;
        } catch (e: any) {
          pass = false;
          message = `Regex không hợp lệ: ${e.message}`;
        }
        break;

      default:
        pass = false;
        message = `Toán tử '${operator}' không được hỗ trợ`;
    }

    return {
      fieldName: assert.fieldName,
      operator,
      expectedValue: expected,
      actualValue: actual,
      pass,
      severity,
      message,
    };
  }

  private executeSandboxScript(
    scriptCode: string,
    packet: any,
    context: any,
  ): { pass: boolean; reason?: string; metrics?: any; logs?: string[] } {
    const logs: string[] = [];

    const sandbox = {
      packet: {
        fPort: packet.fPort || 1,
        fCnt: packet.fCnt || 0,
        rssi: packet.rssi || -80,
        snr: packet.snr || 8,
        payloadHex: packet.payloadHex || '',
        decoded: packet.decoded || packet.decodedData || {},
      },
      context: {
        packetCount: context.packetCount || 1,
        minPackets: context.minPackets || 1,
        durationSeconds: context.durationSeconds || 10,
      },
      console: {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
        error: (...args: any[]) => logs.push('[ERR] ' + args.map(String).join(' ')),
      },
      Math,
      JSON,
      Date,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
    };

    const vmContext = vm.createContext(sandbox);

    const wrappedCode = `
      (function() {
        ${scriptCode}
        if (typeof evaluate === 'function') {
          return evaluate(packet, context);
        }
        throw new Error("Không tìm thấy hàm 'evaluate(packet, context)' trong script");
      })()
    `;

    try {
      const output = vm.runInContext(wrappedCode, vmContext, { timeout: 500 });
      if (typeof output === 'boolean') {
        return { pass: output, logs };
      }
      if (output && typeof output === 'object') {
        return {
          pass: !!output.pass,
          reason: output.reason || (output.pass ? undefined : 'Script trả về pass: false'),
          metrics: output.metrics || {},
          logs,
        };
      }
      return { pass: false, reason: 'Script trả về kết quả không hợp lệ', logs };
    } catch (err: any) {
      return { pass: false, reason: `Lỗi thực thi script Sandbox: ${err.message}`, logs };
    }
  }
}
