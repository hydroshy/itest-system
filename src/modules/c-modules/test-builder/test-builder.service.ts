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
import { FlowGraphEngineService, FlowConfig, FlowExecutionSummary } from './flow-graph-engine.service';
import { TestTemplateEntity } from './entities/test-template.entity';
import { TestAssertionEntity } from './entities/test-assertion.entity';
import { DecoderEntity } from '../decoder-admin/entities/decoder.entity';
import {
  CreateTestTemplateDto,
  UpdateTestTemplateDto,
  DryRunTestDto,
  CreateAssertionDto,
} from './dto/test-builder.dto';
import { cleanSku, resolveDecoderId, cleanFirmwareVersion } from '../../lorawan/common/lorawan-utils';
import {
  DiscoveredField,
  formatFieldLabel,
  inferUnit,
  extractDecoderFields,
  extractFieldsWithVm,
  extractFieldsWithAst,
} from './decoder-field-extractor';

export {
  DiscoveredField,
  formatFieldLabel,
  inferUnit,
  extractDecoderFields,
  extractFieldsWithVm,
  extractFieldsWithAst,
};

export interface AvailableFieldsResponse {
  fields: DiscoveredField[];
  decoderFound: boolean;
  decoderId?: string;
  decoderName?: string;
  count: number;
  totalCount?: number;
}


export interface AssertionEvaluationResult {
  fieldName: string;
  operator: string;
  expectedValue: any;
  actualValue: any;
  pass: boolean;
  severity: 'ERROR' | 'WARNING';
  message: string;
  nodeId?: string;
  nodeType?: string;
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
  flowResult?: FlowExecutionSummary;
  summary: string;
}

export const VI_TO_EN_FIELD_LABELS: Record<string, string> = {
  // Common telemetry
  'Cường độ tín hiệu (RSSI)': 'RSSI Signal Strength',
  'Tỉ số tín hiệu / nhiễu (SNR)': 'Signal-to-Noise Ratio',
  'Bộ đếm gói (FCnt)': 'Frame Counter',
  'LoRaWAN FPort': 'LoRaWAN FPort',

  // Sensor fields
  'Nồng độ CO2': 'CO2 Concentration',
  'Nhiệt độ': 'Temperature',
  'Nhiệt độ môi trường': 'Ambient Temperature',
  'Độ ẩm': 'Humidity',
  'Độ ẩm không khí': 'Air Humidity',
  'Dung lượng pin': 'Battery Voltage',
  'Điện áp pin': 'Battery Voltage',
  'Mức chất lỏng': 'Liquid Level',
  'Tỉ lệ thể tích': 'Volume Percentage',
  'Trạng thái cảnh báo': 'Alarm Status',
  'Điện áp pha': 'Phase Voltage',
  'Dòng điện': 'Electric Current',
  'Công suất tiêu thụ': 'Active Power',
  'Giá trị cảm biến': 'Sensor Value',
  'Trạng thái': 'Status',
};

export function sanitizeFieldLabel(label?: string, fieldName?: string): string {
  if (!label) return fieldName ? formatFieldLabel(fieldName) : '';
  const trimmed = label.trim();
  if (VI_TO_EN_FIELD_LABELS[trimmed]) {
    return VI_TO_EN_FIELD_LABELS[trimmed].replace(/\s*\([^)]*\)/g, '').trim();
  }
  let result = trimmed;
  for (const [vi, en] of Object.entries(VI_TO_EN_FIELD_LABELS)) {
    if (result.includes(vi)) {
      result = result.replace(new RegExp(vi, 'g'), en);
    }
  }
  return result.replace(/\s*\([^)]*\)/g, '').trim();
}

export function sanitizeNodeLabel(label: string): string {
  if (!label) return label;
  return label
    .replace(/So sánh thiết bị chuẩn/g, 'Reference Device Comparison')
    .replace(/Thống kê chuyển động/g, 'Motion Statistics')
    .replace(/Đếm gói tin/g, 'Packet Counter')
    .replace(/So sánh/g, 'Compare');
}

export function sanitizeScript(script: string): string {
  if (!script) return script;
  return script
    .replace(/Hàm kiểm định chất lượng cảm biến LoRaWAN/g, 'LoRaWAN Sensor Quality Verification Function')
    .replace(/@param\s*\{Object\}\s*packet\s*-\s*Gói tin:/g, '@param {Object} packet - Packet:')
    .replace(/@param\s*\{Object\}\s*context\s*-\s*Ngữ cảnh:/g, '@param {Object} context - Context:')
    .replace(/Chưa đủ số lượng/g, 'Insufficient packet count:')
    .replace(/gói tin/g, 'packets')
    .replace(/Tín hiệu RSSI quá yếu:/g, 'RSSI signal too weak:')
    .replace(/Nồng độ CO2/g, 'CO2 concentration')
    .replace(/ngoài dải chuẩn/g, 'out of range');
}

@Injectable()
export class TestBuilderService implements OnModuleInit {
  private readonly logger = new Logger(TestBuilderService.name);

  constructor(
    @Optional() private readonly dbService?: DynamicDatabaseService,
    @Optional() private flowGraphEngine?: FlowGraphEngineService,
  ) {
    if (!this.flowGraphEngine) {
      this.flowGraphEngine = new FlowGraphEngineService();
    }
  }

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
    await this.sanitizeExistingTemplates();
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
          { id: 'node-ext-1', type: 'extractor', label: 'Field Extractor', x: 300, y: 160, params: { field: 'co2', label: 'CO2 Concentration', unit: 'ppm' } },
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
 * LoRaWAN Sensor Quality Verification Function
 * @param {Object} packet - Packet: { rssi, snr, fPort, decoded: { co2, temperature, humidity } }
 * @param {Object} context - Context: { packetCount, minPackets, durationSeconds }
 */
function evaluate(packet, context) {
  if (context.packetCount < context.minPackets) {
    return { pass: false, reason: 'Insufficient packet count: ' + context.packetCount + '/' + context.minPackets };
  }
  if (packet.rssi < -120) {
    return { pass: false, reason: 'RSSI signal too weak: ' + packet.rssi + ' dBm' };
  }
  const decoded = packet.decoded || {};
  if (decoded.co2 !== undefined && (decoded.co2 < 400 || decoded.co2 > 2000)) {
    return { pass: false, reason: 'CO2 concentration (' + decoded.co2 + ' ppm) out of range 400 - 2000 ppm' };
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
    const fwClean = cleanFirmwareVersion(dto.firmwareVersion) || '1';
    const decoderId = resolveDecoderId(skuClean, fwClean);

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
          fieldLabel: sanitizeFieldLabel(a.fieldLabel, a.fieldName),
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
    if (dto.sku !== undefined) template.sku = cleanSku(dto.sku);
    if (dto.firmwareVersion !== undefined) {
      template.firmwareVersion = cleanFirmwareVersion(dto.firmwareVersion) || '1';
    } else if (template.firmwareVersion) {
      template.firmwareVersion = cleanFirmwareVersion(template.firmwareVersion) || '1';
    }
    if (dto.sku !== undefined || dto.firmwareVersion !== undefined) {
      template.decoderId = resolveDecoderId(template.sku, template.firmwareVersion) || undefined;
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
            fieldLabel: sanitizeFieldLabel(a.fieldLabel, a.fieldName),
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

  async getAvailableFields(sku?: string, firmwareVersion?: string): Promise<AvailableFieldsResponse> {
    const commonFields: DiscoveredField[] = [
      { name: 'rssi', label: 'RSSI Signal Strength', type: 'number', unit: 'dBm', sampleValue: -85 },
      { name: 'snr', label: 'Signal-to-Noise Ratio', type: 'number', unit: 'dB', sampleValue: 7.5 },
      { name: 'fPort', label: 'LoRaWAN FPort', type: 'number', sampleValue: 1 },
      { name: 'fCnt', label: 'Frame Counter', type: 'number', sampleValue: 12 },
    ];

    if (!sku) {
      return {
        fields: commonFields,
        decoderFound: false,
        count: 0,
        totalCount: commonFields.length,
      };
    }

    const skuClean = cleanSku(sku);
    const fwClean = cleanFirmwareVersion(firmwareVersion) || '1';
    const decoderId = resolveDecoderId(skuClean, fwClean);

    let extractedSensorFields: DiscoveredField[] = [];
    let decoderFound = false;
    let decoderName: string | undefined = undefined;

    try {
      const decoderRepo = this.getDecoderRepo();
      const decoder = await decoderRepo.findOne({ where: { id: decoderId } });
      if (decoder) {
        decoderFound = true;
        decoderName = decoder.description || decoder.sku;
        if (decoder.decoderCode) {
          extractedSensorFields = this.parseFieldsFromDecoderCode(decoder.decoderCode);
        }
      }
    } catch (e: any) {
      this.logger.debug(`Could not query decoder for fields: ${e.message}`);
    }

    // Absolutely NO fake/mock fallback. Only genuine decoder fields + common telemetry fields.
    const map = new Map<string, DiscoveredField>();
    for (const f of [...extractedSensorFields, ...commonFields]) {
      map.set(f.name, {
        ...f,
        label: (f.label || formatFieldLabel(f.name)).replace(/\s*\([^)]*\)/g, '').trim(),
      });
    }
    const finalFields = Array.from(map.values());

    return {
      fields: finalFields,
      decoderFound,
      decoderId: decoderFound ? decoderId : undefined,
      decoderName,
      count: extractedSensorFields.length,
      totalCount: finalFields.length,
    };
  }

  parseFieldsFromDecoderCode(code: string): DiscoveredField[] {
    return extractDecoderFields(code);
  }

  extractFieldsFromRawCode(decoderCode: string): {
    success: boolean;
    fields: DiscoveredField[];
    count: number;
    error?: string;
  } {
    if (!decoderCode || typeof decoderCode !== 'string' || !decoderCode.trim()) {
      return {
        success: false,
        fields: [],
        count: 0,
        error: 'Decoder code is empty or missing',
      };
    }

    try {
      const fields = extractDecoderFields(decoderCode);
      return {
        success: true,
        fields,
        count: fields.length,
      };
    } catch (err: any) {
      return {
        success: false,
        fields: [],
        count: 0,
        error: err?.message || 'Failed to extract fields from decoder code',
      };
    }
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
    let flowResult: FlowExecutionSummary | undefined = undefined;

    // 1. If flowConfig is provided or template has flowConfig, run Graph DAG Engine
    let flowConfigToRun = dto.flowConfig;
    if (!flowConfigToRun && dto.templateId && this.dbService) {
      try {
        const tpl = await this.findOne(dto.templateId);
        if (tpl && tpl.flowConfig && Array.isArray(tpl.flowConfig.nodes) && tpl.flowConfig.nodes.length > 0) {
          flowConfigToRun = tpl.flowConfig;
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    if ((mode === 'FLOW' || mode === 'HYBRID') && flowConfigToRun && Array.isArray(flowConfigToRun.nodes) && flowConfigToRun.nodes.length > 0) {
      flowResult = await this.flowGraphEngine.executeFlow(flowConfigToRun as unknown as FlowConfig, packet, context);

      // Map flow assertion results into assertionResults array
      for (const fa of flowResult.assertionResults) {
        assertionResults.push({
          fieldName: fa.fieldName || fa.nodeLabel || fa.nodeType,
          operator: fa.operator || 'EVAL',
          expectedValue: fa.expectedValue,
          actualValue: fa.actualValue,
          pass: fa.pass,
          severity: fa.severity,
          message: fa.message,
          nodeId: fa.nodeId,
          nodeType: fa.nodeType,
        });
        if (!fa.pass && fa.severity === 'ERROR') {
          assertionsPassed = false;
        }
      }
    }

    // 2. Also evaluate any legacy/direct assertions if provided
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
      flowResult,
      summary: overallPass
        ? `All test conditions PASSED (${assertionResults.length} rules, ${executionTimeMs}ms)`
        : `Test FAILED: Assertion conditions violated (${executionTimeMs}ms)`,
    };
  }

  async validateFlowConfig(flowConfig: FlowConfig) {
    return this.flowGraphEngine.validateFlow(flowConfig);
  }

  async executeFlowGraph(flowConfig: FlowConfig, mockPacket: any = {}, context: any = {}) {
    return await this.flowGraphEngine.executeFlow(flowConfig, mockPacket, context);
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
        message: `Field '${assert.fieldName}' does not exist in packet payload`,
      };
    }

    switch (operator) {
      case 'EQUALS':
        if (typeof expected === 'number' && typeof actual === 'number' && tolerance > 0) {
          pass = Math.abs(actual - expected) <= tolerance;
          message = pass
            ? `${actual} == ${expected} (±${tolerance})`
            : `${actual} deviated from ${expected} beyond tolerance ±${tolerance}`;
        } else {
          pass = String(actual) === String(expected);
          message = pass ? `${actual} == ${expected}` : `${actual} != ${expected}`;
        }
        break;

      case 'NOT_EQUALS':
        pass = String(actual) !== String(expected);
        message = pass ? `${actual} != ${expected}` : `${actual} == ${expected}`;
        break;

      case 'GREATER_THAN':
        pass = Number(actual) > Number(expected);
        message = pass ? `${actual} > ${expected}` : `${actual} is not greater than ${expected}`;
        break;

      case 'LESS_THAN':
        pass = Number(actual) < Number(expected);
        message = pass ? `${actual} < ${expected}` : `${actual} is not less than ${expected}`;
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
        message = pass ? `Field ${assert.fieldName} has value` : `Field is empty`;
        break;

      case 'CONTAINS':
        pass = String(actual).includes(String(expected));
        message = pass ? `${actual} contains '${expected}'` : `${actual} does not contain '${expected}'`;
        break;

      case 'REGEX':
        try {
          const reg = new RegExp(String(expected));
          pass = reg.test(String(actual));
          message = pass ? `${actual} matches pattern` : `${actual} does not match regex ${expected}`;
        } catch (e: any) {
          pass = false;
          message = `Invalid regex: ${e.message}`;
        }
        break;

      default:
        pass = false;
        message = `Unsupported operator '${operator}'`;
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
        throw new Error("Function 'evaluate(packet, context)' not found in script");
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
          reason: output.reason || (output.pass ? undefined : 'Script returned pass: false'),
          metrics: output.metrics || {},
          logs,
        };
      }
      return { pass: false, reason: 'Script returned invalid result', logs };
    } catch (err: any) {
      return { pass: false, reason: `Sandbox script execution error: ${err.message}`, logs };
    }
  }

  /**
   * Sanitize existing test templates and assertions:
   * - Translates Vietnamese labels to standardized English.
   * - Strips leading 'v' or 'V' from firmware versions.
   * - Normalizes flowConfig node labels and customScript texts.
   */
  async sanitizeExistingTemplates(): Promise<{ templatesUpdated: number; assertionsUpdated: number }> {
    if (!this.dbService) {
      return { templatesUpdated: 0, assertionsUpdated: 0 };
    }

    let templatesUpdated = 0;
    let assertionsUpdated = 0;

    try {
      const templateRepo = this.getTemplateRepo();
      const assertRepo = this.getAssertionRepo();

      // 1. Sanitize Assertions
      const assertions = await assertRepo.find();
      const assertionsToSave: TestAssertionEntity[] = [];

      for (const assert of assertions) {
        const currentLabel = assert.fieldLabel;
        const sanitized = sanitizeFieldLabel(currentLabel, assert.fieldName);
        if (sanitized && sanitized !== currentLabel) {
          assert.fieldLabel = sanitized;
          assertionsToSave.push(assert);
        }
      }

      if (assertionsToSave.length > 0) {
        await assertRepo.save(assertionsToSave);
        assertionsUpdated = assertionsToSave.length;
        this.logger.log(`Sanitized ${assertionsUpdated} test assertion labels to English`);
      }

      // 2. Sanitize Templates
      const templates = await templateRepo.find();
      const templatesToSave: TestTemplateEntity[] = [];

      for (const tpl of templates) {
        let changed = false;

        // Clean firmware version prefix 'v' or 'V'
        const cleanFw = cleanFirmwareVersion(tpl.firmwareVersion) || '1';
        if (cleanFw !== tpl.firmwareVersion) {
          tpl.firmwareVersion = cleanFw;
          tpl.decoderId = resolveDecoderId(tpl.sku, cleanFw) || tpl.decoderId;
          changed = true;
        }

        // Sanitize flowConfig node labels and params
        if (tpl.flowConfig && Array.isArray(tpl.flowConfig.nodes)) {
          let flowConfigChanged = false;
          for (const node of tpl.flowConfig.nodes) {
            if (node.label) {
              const cleanedNodeLabel = sanitizeNodeLabel(node.label);
              if (cleanedNodeLabel !== node.label) {
                node.label = cleanedNodeLabel;
                flowConfigChanged = true;
              }
            }
            if (node.params && node.params.label) {
              const cleanedParamLabel = sanitizeFieldLabel(node.params.label, node.params.field);
              if (cleanedParamLabel !== node.params.label) {
                node.params.label = cleanedParamLabel;
                flowConfigChanged = true;
              }
            }
            if (node.params && node.params.fw) {
              const cleanNodeFw = cleanFirmwareVersion(node.params.fw);
              if (cleanNodeFw !== node.params.fw) {
                node.params.fw = cleanNodeFw;
                flowConfigChanged = true;
              }
            }
          }
          if (flowConfigChanged) {
            changed = true;
          }
        }

        // Sanitize customScript Vietnamese strings
        if (tpl.customScript && typeof tpl.customScript === 'string') {
          const cleanedScript = sanitizeScript(tpl.customScript);
          if (cleanedScript !== tpl.customScript) {
            tpl.customScript = cleanedScript;
            changed = true;
          }
        }

        if (changed) {
          templatesToSave.push(tpl);
        }
      }

      if (templatesToSave.length > 0) {
        await templateRepo.save(templatesToSave);
        templatesUpdated = templatesToSave.length;
        this.logger.log(`Sanitized ${templatesUpdated} test templates (firmware version & labels) to English`);
      }
    } catch (err: any) {
      this.logger.warn(`Error during test templates sanitization: ${err.message}`);
    }

    return { templatesUpdated, assertionsUpdated };
  }
}
