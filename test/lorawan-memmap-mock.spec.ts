import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { C_MODULES_REGISTRY } from '../src/modules/c-modules/c-module-registry';
import { MemmapPayloadEntity } from '../src/modules/c-modules/memmap-upload/entities/memmap-payload.entity';
import { MemmapRegEntity } from '../src/modules/c-modules/memmap-upload/entities/memmap-reg.entity';
import { MemmapUploadService } from '../src/modules/c-modules/memmap-upload/memmap-upload.service';
import { MemmapUploadRepository } from '../src/modules/c-modules/memmap-upload/memmap-upload.repository';
import { SandboxAssertionService } from '../src/modules/d-modules/test-automation/sandbox-assertion.service';
import { TestAutomationService } from '../src/modules/d-modules/test-automation/test-automation.service';
import { TestAutomationRepository } from '../src/modules/d-modules/test-automation/test-automation.repository';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

/**
 * Parser for WSLRW-ATH-6.csv strictly following the 16-field format
 */
function parseWslrwAthCsv(csvContent: string): any[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Regex to split comma while preserving quoted cells
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      const val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      matches.push(val);
    }

    if (matches.length < 6) continue;

    const no = parseInt(matches[0], 10);
    const modbusDec = parseInt(matches[1], 10);
    const modbusHex = (matches[2] || '').trim();
    const fnRead = matches[3] || '3';
    const fnWrite = matches[4] || 'None';
    const numRegs = parseInt(matches[5], 10) || 1;
    const description = matches[6] || '';
    const rangeVal = matches[7] || '';
    const endUserDefault = matches[8] || '';
    const format = matches[9] || '';
    const downlinkType5 = matches[10] || '';
    const inRd1 = matches[11] === 'Yes';
    const comment = matches[12] || '';
    const inEng = matches[13] === 'Yes';
    const inEndUser = matches[14] === 'Yes';
    const inFull = matches[15] === 'Yes';

    if (!isNaN(no) && !isNaN(modbusDec)) {
      rows.push({
        no,
        modbus_reg_dec: modbusDec,
        modbus_reg_hex: modbusHex,
        fn_read: fnRead,
        fn_write: fnWrite,
        num_regs: numRegs,
        description,
        range_val: rangeVal,
        end_user_default: endUserDefault,
        format,
        downlink_type_5: downlinkType5,
        in_rd1_template: inRd1,
        comment,
        in_engineering_template: inEng,
        in_end_user_template: inEndUser,
        in_full_template: inFull,
      });
    }
  }

  return rows;
}

async function runLorawanMemmapTestSuite() {
  console.log('======================================================================');
  console.log('🧪 TEST SUITE: LORAWAN TELEMETRY MOCK & MEMMAP VALIDATION PASS/FAIL');
  console.log('======================================================================\n');

  let passedAssertions = 0;

  // --------------------------------------------------------------------
  // TEST 1: C-Module Registry & TypeORM Entities Verification
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying C-Module registry and TypeORM entities...');
  const cMod = C_MODULES_REGISTRY.find((m) => m.id === 'c-memmap-upload');
  assert.ok(cMod, 'c-memmap-upload must be registered in C_MODULES_REGISTRY');
  assert.strictEqual(cMod.routeHash, '#memmap-upload');
  assert.strictEqual(cMod.code, 'C_MOD_MEMMAP_UPLOAD');

  const entityNames = ALL_DATABASE_ENTITIES.map((e: any) => e?.name);
  assert.ok(entityNames.includes('MemmapPayloadEntity'), 'MemmapPayloadEntity must be registered');
  assert.ok(entityNames.includes('MemmapRegEntity'), 'MemmapRegEntity must be registered');

  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  const payloadMeta = ds.getMetadata(MemmapPayloadEntity);
  assert.strictEqual(payloadMeta.tableName, 'memmap_payload');
  assert.ok(payloadMeta.findColumnWithPropertyName('sku'), 'sku column exists');
  assert.ok(payloadMeta.findColumnWithPropertyName('short_fw'), 'short_fw column exists');
  assert.ok(payloadMeta.findColumnWithPropertyName('dec_valid'), 'dec_valid column exists');
  assert.ok(payloadMeta.findColumnWithPropertyName('hex_valid'), 'hex_valid column exists');

  const regMeta = ds.getMetadata(MemmapRegEntity);
  assert.strictEqual(regMeta.tableName, 'memmap_regs');
  assert.ok(regMeta.findColumnWithPropertyName('modbus_reg_dec'), 'modbus_reg_dec exists');
  assert.ok(regMeta.findColumnWithPropertyName('modbus_reg_hex'), 'modbus_reg_hex exists');
  assert.ok(regMeta.findColumnWithPropertyName('num_regs'), 'num_regs exists');
  assert.ok(regMeta.findColumnWithPropertyName('range_val'), 'range_val exists');

  console.log('  -> PASS: Module registry and TypeORM metadata verified with synchronize=false.\n');
  passedAssertions++;

  // --------------------------------------------------------------------
  // TEST 2: Parse Real CSV WSLRW-ATH-6.csv & Validate 74 Continuous Registers (PASS)
  // --------------------------------------------------------------------
  console.log('[TEST 2] Parsing docs/WSLRW-ATH-6.csv and verifying 74 registers continuity (PASS)...');
  const csvPath = path.resolve(__dirname, '../../docs/WSLRW-ATH-6.csv');
  assert.ok(fs.existsSync(csvPath), `CSV file must exist at ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf8');

  const registers74 = parseWslrwAthCsv(csvContent);
  assert.strictEqual(registers74.length, 74, `CSV must contain exactly 74 registers, got ${registers74.length}`);

  const memmapRepo = new MemmapUploadRepository();
  const memmapService = new MemmapUploadService(memmapRepo);

  const continuityResult = memmapService.validateContinuity(registers74);
  assert.strictEqual(continuityResult.decValid, true, 'Decimal continuity must PASS');
  assert.strictEqual(continuityResult.hexValid, true, 'Hexadecimal continuity must PASS');
  assert.strictEqual(continuityResult.decErrors.length, 0);
  assert.strictEqual(continuityResult.hexErrors.length, 0);

  // Upload and persist
  const uploadRes = await memmapService.uploadMemmap({
    sku: 'WSLRW-ATH',
    short_fw: 6,
    file_name: 'WSLRW-ATH-6.csv',
    registers: registers74,
  });

  assert.strictEqual(uploadRes.success, true);
  assert.strictEqual(uploadRes.data.sku, 'WSLRW-ATH');
  assert.strictEqual(uploadRes.data.shortFw, 6);
  assert.strictEqual(uploadRes.data.totalRegs, 74);
  assert.strictEqual(uploadRes.data.decValid, true);
  assert.strictEqual(uploadRes.data.hexValid, true);

  console.log('  -> PASS: WSLRW-ATH-6.csv 74 registers continuity passed for both Dec and Hex independently.\n');
  passedAssertions++;

  // --------------------------------------------------------------------
  // TEST 3: Negative Test Cases - Broken Decimal Sequence (FAIL)
  // --------------------------------------------------------------------
  console.log('[TEST 3] Negative continuity: Broken Decimal sequence (FAIL)...');
  const brokenDecRegs = JSON.parse(JSON.stringify(registers74));
  // Mutate row 28 (MODBUS_ADDRESS) from 256 to 258
  brokenDecRegs[27].modbus_reg_dec = 258;

  const brokenDecCheck = memmapService.validateContinuity(brokenDecRegs);
  assert.strictEqual(brokenDecCheck.decValid, false, 'Broken Dec sequence must be detected as FAIL');
  assert.strictEqual(brokenDecCheck.hexValid, true, 'Hex should remain valid');
  assert.ok(brokenDecCheck.decErrors.length > 0);
  assert.ok(brokenDecCheck.decErrors[0].includes('Expected Dec 256, found 258'));
  console.log(`  -> PASS: Caught Dec discontinuity: ${brokenDecCheck.decErrors[0]}\n`);
  passedAssertions++;

  // --------------------------------------------------------------------
  // TEST 4: Negative Test Cases - Broken Hexadecimal Sequence (FAIL)
  // --------------------------------------------------------------------
  console.log('[TEST 4] Negative continuity: Broken Hex sequence (FAIL)...');
  const brokenHexRegs = JSON.parse(JSON.stringify(registers74));
  // Mutate row 31 (SERIAL_NUMBER at 0x103) to 0x105
  brokenHexRegs[30].modbus_reg_hex = '105';

  const brokenHexCheck = memmapService.validateContinuity(brokenHexRegs);
  assert.strictEqual(brokenHexCheck.decValid, true, 'Dec should remain valid');
  assert.strictEqual(brokenHexCheck.hexValid, false, 'Broken Hex sequence must be detected as FAIL');
  assert.ok(brokenHexCheck.hexErrors.length > 0);
  assert.ok(brokenHexCheck.hexErrors[0].includes('Expected Hex 0x103, found 0x105'));
  console.log(`  -> PASS: Caught Hex discontinuity: ${brokenHexCheck.hexErrors[0]}\n`);
  passedAssertions++;

  // --------------------------------------------------------------------
  // TEST 5: Negative Test Cases - Invalid Short FW Formats (FAIL)
  // --------------------------------------------------------------------
  console.log('[TEST 5] Negative validation: Short FW Version strict integer checks (FAIL)...');
  const invalidFwInputs = ['v6', 'V6', '6.0', '6.2.1', -1, 'abc', 6.5];

  for (const invalidFw of invalidFwInputs) {
    await assert.rejects(
      async () => {
        await memmapService.uploadMemmap({
          sku: 'WSLRW-ATH',
          short_fw: invalidFw as any,
          registers: registers74,
        });
      },
      /Short FW Version chỉ được chứa ký số nguyên/,
      `Should reject invalid short_fw '${invalidFw}'`,
    );
  }
  console.log('  -> PASS: Rejected all non-integer and prefixed Short FW formats (v6, 6.0, 6.5, etc.).\n');
  passedAssertions++;

  // --------------------------------------------------------------------
  // TEST 6: Mock LoRaWAN Uplink Packet (RSSI, SNR, Payload Hex/JSON) - PASS Case
  // --------------------------------------------------------------------
  console.log('[TEST 6] LoRaWAN Telemetry Mock: Valid uplink decoding & Sandbox assertions (PASS)...');
  const mockDbService = {
    getRepositoryForTable: () => ({
      save: async (entity: any) => ({ ...entity, id: entity.id || 'mock-' + Math.random().toString(36).substr(2, 9) }),
      findOne: async () => null,
      find: async () => [],
      createQueryBuilder: () => ({
        leftJoinAndSelect: function() { return this; },
        innerJoinAndSelect: function() { return this; },
        where: function() { return this; },
        andWhere: function() { return this; },
        orderBy: function() { return this; },
        skip: function() { return this; },
        take: function() { return this; },
        getOne: async () => null,
        getManyAndCount: async () => [[], 0],
      }),
    }),
  };

  const autoRepo = new TestAutomationRepository(mockDbService as any);
  const sandboxAssertionService = new SandboxAssertionService();
  const autoService = new TestAutomationService(
    autoRepo,
    undefined,
    undefined,
    sandboxAssertionService,
    memmapService,
  );

  // Setup test session
  const validDevEUI = '0011223344556601';
  const session = await autoService.createSession({
    sessionCode: 'TS-LORAWAN-QA-01',
    soCode: 'SO-QA-2026',
    itemCode: 'WSLRW-ATH',
    devEUIs: [validDevEUI],
    autoStart: false,
    template: {
      id: 'tpl-qa',
      code: 'TPL-ATH-QA',
      name: 'WSLRW-ATH Standard Verification',
      sku: 'WSLRW-ATH',
      firmwareVersion: '6.0',
      minPacketsRequired: 1,
      assertions: [
        { fieldName: 'temperature', operator: 'BETWEEN', expectedValue: [15, 35], severity: 'ERROR' },
        { fieldName: 'humidity', operator: 'BETWEEN', expectedValue: [20, 80], severity: 'ERROR' },
        { fieldName: 'battery', operator: 'GREATER_THAN', expectedValue: 3.0, severity: 'ERROR' },
        { fieldName: 'RSSI', operator: 'GREATER_THAN', expectedValue: -110, severity: 'WARNING' },
        { fieldName: 'SNR', operator: 'GREATER_THAN', expectedValue: -5, severity: 'WARNING' },
      ],
      customScript: `
        function evaluate(packet, context, memmapRegs) {
          if (packet.rssi < -120) return { pass: false, message: 'RSSI too low' };
          if (packet.fPort !== 1) return { pass: false, message: 'Invalid fPort' };
          return { pass: true, message: 'LoRaWAN RF & payload telemetry verified' };
        }
      `,
    } as any,
  });

  await autoService.startSession(session.id);

  // Uplink Packet Mock:
  // Hex '010100fe0201024003010e10': Temp = 25.4°C, Hum = 57.6%, Bat = 3.6V
  // RSSI = -72 dBm, SNR = 9.8 dB
  const passUplink = await autoService.processPacket({
    devEUI: validDevEUI,
    fPort: 1,
    fCnt: 1,
    payloadHex: '010100fe0201024003010e10',
    rssi: -72,
    snr: 9.8,
    gatewayId: 'GW-MOCK-LNS-01',
    soCode: 'SO-QA-2026',
    itemCode: 'WSLRW-ATH',
  });

  assert.strictEqual(passUplink.success, true);
  assert.strictEqual(passUplink.isPass, true, 'Uplink assertions must all PASS');
  assert.strictEqual(passUplink.run.status, 'PASSED');
  assert.strictEqual(passUplink.run.batteryVoltage, 3.6);
  assert.strictEqual(passUplink.decodedData.temperature, 25.4);
  assert.strictEqual(passUplink.decodedData.humidity, 57.6);
  assert.strictEqual(passUplink.decodedData.battery, 3.6);
  assert.strictEqual(passUplink.run.rssiAvg, -72);
  assert.strictEqual(passUplink.run.snrAvg, 9.8);
  console.log('  -> PASS: Mock uplink (RSSI -72, SNR 9.8, decoded Temp 25.4C, Hum 57.6%, Bat 3.6V) PASSED.\n');
  passedAssertions++;

  // --------------------------------------------------------------------
  // TEST 7: Mock LoRaWAN Uplink Packet - FAIL Case (Out of Range & Low Battery)
  // --------------------------------------------------------------------
  console.log('[TEST 7] LoRaWAN Telemetry Mock: Out-of-bounds telemetry (FAIL)...');
  const failDevEUI = '0011223344556602';
  const failSession = await autoService.createSession({
    sessionCode: 'TS-LORAWAN-QA-02',
    soCode: 'SO-QA-2026',
    itemCode: 'WSLRW-ATH',
    devEUIs: [failDevEUI],
    autoStart: true,
    template: {
      id: 'tpl-qa-fail',
      code: 'TPL-ATH-FAIL',
      name: 'WSLRW-ATH Bounds Test',
      sku: 'WSLRW-ATH',
      firmwareVersion: '6.0',
      minPacketsRequired: 1,
      assertions: [
        { fieldName: 'temperature', operator: 'BETWEEN', expectedValue: [10, 40], severity: 'ERROR' },
        { fieldName: 'battery', operator: 'GREATER_THAN', expectedValue: 3.0, severity: 'ERROR' },
      ],
    } as any,
  });

  // Abnormal payload:
  // Temp = 85.0°C (0x0352), Hum = 15.0% (0x0096), Bat = 2.4V (0x0960 = 2400mV)
  // Channel 1: 01 01 03 52 (85.0°C)
  // Channel 2: 02 01 00 96 (15.0%)
  // Channel 3: 03 01 09 60 (2.40V)
  const failPayloadHex = '010103520201009603010960';
  const failUplink = await autoService.processPacket({
    devEUI: failDevEUI,
    fPort: 1,
    fCnt: 1,
    payloadHex: failPayloadHex,
    rssi: -125, // Weak RF signal
    snr: -12.0,
    gatewayId: 'GW-MOCK-LNS-02',
    soCode: 'SO-QA-2026',
    itemCode: 'WSLRW-ATH',
  });

  assert.strictEqual(failUplink.success, true);
  assert.strictEqual(failUplink.isPass, false, 'Out-of-range payload must FAIL assertions');
  assert.strictEqual(failUplink.run.status, 'FAILED');
  assert.ok(failUplink.run.failureReason, 'Failure reason must be documented');
  assert.strictEqual(failUplink.decodedData.temperature, 85.0);
  assert.strictEqual(failUplink.decodedData.battery, 2.4);
  console.log(`  -> PASS: Caught failed uplink. Status: FAILED, Reason: ${failUplink.run.failureReason}\n`);
  passedAssertions++;

  // --------------------------------------------------------------------
  // TEST 8: Memory Map Modbus Cross-Validation with Decoded Fields
  // --------------------------------------------------------------------
  console.log('[TEST 8] Cross-checking decoded payload against Memmap Modbus register specifications...');
  const memmapCheck = sandboxAssertionService.validateAgainstMemmap(
    {
      sensor_type: 2,
      modbus_address: 1,
      modbus_baudrate: 0,
    },
    registers74 as any,
  );

  assert.ok(memmapCheck.length >= 2, 'Should validate at least 2 registers against range_val');
  for (const check of memmapCheck) {
    assert.strictEqual(check.pass, true, `Register ${check.fieldName} check should pass`);
  }

  // Cross-check out-of-range modbus_address (valid range in CSV is 1-247)
  const invalidModbusCheck = sandboxAssertionService.validateAgainstMemmap(
    {
      modbus_address: 250, // exceeds 247
    },
    registers74 as any,
  );
  assert.strictEqual(invalidModbusCheck.length, 1);
  assert.strictEqual(invalidModbusCheck[0].pass, false, 'Modbus address 250 should violate 1-247 range');
  console.log('  -> PASS: Successfully cross-checked decoded payload against memmap_regs range specifications.\n');
  passedAssertions++;

  // -------------------------------------------------------------------------
  // TEST 9: Async Listener & Memory Leak Audit (TestAutomationService lifecycle)
  // -------------------------------------------------------------------------
  console.log('[TEST 9] Verify RealtimeService stream listener lifecycle & memory leak prevention...');
  const mockSubject = new (require('rxjs').Subject)();
  const mockRealtimeService = {
    getStream: () => mockSubject.asObservable(),
  };
  const testService = new TestAutomationService(
    testAutomationRepo,
    undefined,
    mockRealtimeService as any,
    sandboxAssertionService,
    memmapService,
  );

  assert.strictEqual(mockSubject.observed, false, 'Subject should have 0 observers before init');
  testService.onModuleInit();
  assert.strictEqual(mockSubject.observed, true, 'Subject should have active observer after onModuleInit');

  testService.onModuleDestroy();
  assert.strictEqual(mockSubject.observed, false, 'Subject should have 0 observers after onModuleDestroy (no memory leak)');
  console.log('  -> PASS: Subscription cleanly unregistered on onModuleDestroy, eliminating async listener memory leaks.\n');
  passedAssertions++;

  console.log('======================================================================');
  console.log(`🎉 ALL ${passedAssertions}/9 LORAWAN TEST & MEMMAP VERIFICATION CHECKS PASSED!`);
  console.log('======================================================================\n');
}

if (require.main === module) {
  runLorawanMemmapTestSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ TEST SUITE FAILED:', err);
      process.exit(1);
    });
}

export { runLorawanMemmapTestSuite };
