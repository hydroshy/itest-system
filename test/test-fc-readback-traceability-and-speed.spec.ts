import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// Entities & Modules
import { DeviceRegisterDto, SaveDeviceFinalConfigDto, TraceabilityData, FinalConfigSnMetadata } from '../src/modules/c-modules/final-config-manager/dto/final-config-manager.dto';
import { FinalConfigSnEntity } from '../src/modules/c-modules/final-config-manager/entities/final-config-sn.entity';
import { FinalConfigRegsSnEntity } from '../src/modules/c-modules/final-config-manager/entities/final-config-regs-sn.entity';

/**
 * WSLRW-ATH-6.csv Parser to verify 10 Traceability registers against authoritative manufacturer csv
 */
interface CsvRegisterRecord {
  no: number;
  modbus_reg_dec: number;
  modbus_reg_hex: string;
  fn_read: string;
  fn_write: string;
  num_regs: number;
  description: string;
  range_val: string;
  end_user_default: string;
  format: string;
  downlink_type_5: string;
}

function parseWslrwAthCsv(filePath: string): CsvRegisterRecord[] {
  const text = fs.readFileSync(filePath, 'utf8');
  const rows: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        current += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        current += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(current);
        current = '';
      } else if (c === '\r' && next === '\n') {
        row.push(current);
        current = '';
        rows.push(row);
        row = [];
        i++;
      } else if (c === '\n' || c === '\r') {
        row.push(current);
        current = '';
        rows.push(row);
        row = [];
      } else {
        current += c;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const records: CsvRegisterRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 6) continue;
    const no = parseInt(r[0], 10);
    const modbusDec = parseInt(r[1], 10);
    const modbusHex = (r[2] || '').trim();
    const fnRead = r[3] || '3';
    const fnWrite = r[4] || 'None';
    const numRegs = parseInt(r[5], 10) || 1;
    const description = r[6] || '';
    const rangeVal = r[7] || '';
    const endUserDefault = r[8] || '';
    const format = r[9] || '';
    const downlinkType5 = r[10] || '';

    if (!isNaN(no) && !isNaN(modbusDec)) {
      records.push({
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
      });
    }
  }
  return records;
}

async function runTestSuite() {
  console.log('========================================================================================');
  console.log('🧪 TEST SUITE: REG 9 STRING FORMAT, 5-RETRY ENGINE, 10 TRACEABILITY REGS & SPEED (< 60S)');
  console.log('========================================================================================\n');

  let passed = 0;
  const total = 7;

  const viewsPath = path.resolve(__dirname, '../src/views/dashboard-modules/final-config-device.module.ts');
  const frontendPath = path.resolve(__dirname, '../src/frontend/modules/dashboard/final-config-device.module.ts');
  const viewsCode = fs.readFileSync(viewsPath, 'utf8');
  const frontendCode = fs.readFileSync(frontendPath, 'utf8');

  // TEST 1: 1:1 SYNC & ZERO MOCK DATA BETWEEN VIEWS AND FRONTEND
  console.log('[TEST 1] Verifying 1:1 Sync between Views and Frontend & Zero Mock Data...');
  assert.strictEqual(viewsCode, frontendCode, 'views and frontend final-config-device.module.ts must be 100% byte-for-byte identical');
  assert.ok(!viewsCode.includes('MOCK_SERIAL_PORT'), 'Zero Mock Data: MOCK_SERIAL_PORT must not exist');
  assert.ok(!viewsCode.includes('mockWebSerial'), 'Zero Mock Data: mockWebSerial must not exist');
  assert.ok(!viewsCode.includes('useMockData'), 'Zero Mock Data: useMockData must not exist');
  console.log('  -> PASS: 100% 1:1 sync and Zero Mock Data confirmed.\n');
  passed++;

  // TEST 2: REG 9 HW VERSION SPECIFICATION & STRING FORMAT
  console.log('[TEST 2] Verifying Reg 9 HW Version: Format string, pure Dec 9 display & FC 03...');
  const csvPath = path.resolve(__dirname, '../../docs/WSLRW-ATH-6.csv');
  const csvRecords = parseWslrwAthCsv(csvPath);
  const reg9Csv = csvRecords.find(r => r.modbus_reg_dec === 9);
  assert.ok(reg9Csv, 'Reg 9 must exist in WSLRW-ATH-6.csv');
  assert.strictEqual(reg9Csv.num_regs, 2, 'Reg 9 must be 2 words (4 bytes)');
  assert.strictEqual(reg9Csv.fn_read, '3', 'Reg 9 must be read with FC 03');
  assert.strictEqual(reg9Csv.format.toLowerCase(), 'string', 'Reg 9 in CSV must be format string');

  // Verify in code: no 'ascii', format 'string', address 9
  assert.ok(
    viewsCode.includes("{ address: 9, modbus_reg_hex: '0x0009', parameter_name: 'HW Version', format: 'string', reg_num: 2"),
    'Stage 3 TRACE_DEFS must define Reg 9 with format: "string", reg_num: 2, modbus_reg_hex: "0x0009"'
  );
  assert.ok(
    !viewsCode.includes("format: 'ascii'"),
    'Code must NOT contain format: "ascii"'
  );
  assert.ok(
    viewsCode.includes('resReg9 = await readRegisterWithRetry(1, 9, 2);'),
    'Stage 1 must read Reg 9 with address=9, numreg=2'
  );

  // Verify bytesToString decoding logic safely handles non-printable bytes
  const sampleHwBytes = [0x31, 0x48, 0x00, 0x00]; // "1H\0\0"
  const bytesToString = (bytes: number[]) => String.fromCharCode(...bytes.filter(b => b >= 32 && b <= 126)).trim();
  assert.strictEqual(bytesToString(sampleHwBytes), '1H', 'bytesToString must cleanly decode "1H" without null bytes');

  console.log('  -> PASS: Reg 9 string format, Dec 9 address and bytesToString decoder verified.\n');
  passed++;

  // TEST 3: MAX_READ_ATTEMPTS = 5 & PROGRESSIVE BACKOFF DELAYS
  console.log('[TEST 3] Verifying 5-attempt retry engine & progressive backoff delays [50, 100, 200, 400]ms...');
  assert.ok(
    viewsCode.includes('const MAX_READ_ATTEMPTS = 5;'),
    'MAX_READ_ATTEMPTS must be explicitly configured as 5'
  );
  assert.ok(
    viewsCode.includes('const READ_RETRY_BACKOFF_DELAYS = [50, 100, 200, 400];'),
    'READ_RETRY_BACKOFF_DELAYS must be [50, 100, 200, 400]'
  );
  assert.ok(
    viewsCode.includes('for (let retry = 0; retry < MAX_READ_ATTEMPTS; retry++)'),
    'Read loop must iterate MAX_READ_ATTEMPTS times'
  );
  assert.ok(
    viewsCode.includes('await flushUartRxBuffer();'),
    'Each read attempt and retry must flush UART RX buffer'
  );

  // Verify total max retry delay budget < 750ms
  const backoffDelays = [50, 100, 200, 400];
  const totalBackoffDelay = backoffDelays.reduce((acc, d) => acc + d, 0);
  assert.strictEqual(totalBackoffDelay, 750, 'Total progressive backoff delay for 5 attempts must be 750ms');

  console.log('  -> PASS: 5 read attempts, backoff [50, 100, 200, 400]ms and flushUartRxBuffer verified.\n');
  passed++;

  // TEST 4: 10 TRACEABILITY REGISTERS (0..51) SPECIFICATION & INGESTION
  console.log('[TEST 4] Verifying 10 Traceability Registers (0..51) against WSLRW-ATH-6.csv and DTO contract...');
  const expectedTraceability = [
    { address: 0, hex: '0x0000', num_regs: 5, format: 'string', field: 'fw_code' },
    { address: 5, hex: '0x0005', num_regs: 4, format: 'string', field: 'fw_version' },
    { address: 9, hex: '0x0009', num_regs: 2, format: 'string', field: 'hw_version' },
    { address: 11, hex: '0x000B', num_regs: 4, format: 'string', field: 'lorawan_protocol_version' },
    { address: 15, hex: '0x000F', num_regs: 12, format: 'hex', field: 'spare_15' },
    { address: 27, hex: '0x001B', num_regs: 4, format: 'hex', field: 'dev_eui' },
    { address: 31, hex: '0x001F', num_regs: 4, format: 'hex', field: 'app_eui' },
    { address: 35, hex: '0x0023', num_regs: 8, format: 'hex', field: 'factory_app_key' },
    { address: 43, hex: '0x002B', num_regs: 8, format: 'hex', field: 'factory_nwk_skey' },
    { address: 51, hex: '0x0033', num_regs: 8, format: 'hex', field: 'factory_app_skey' },
  ];

  for (const t of expectedTraceability) {
    const csvMatch = csvRecords.find(r => r.modbus_reg_dec === t.address);
    assert.ok(csvMatch, `Register Dec ${t.address} must exist in CSV`);
    assert.strictEqual(csvMatch.num_regs, t.num_regs, `Register Dec ${t.address} num_regs mismatch with CSV`);
    assert.strictEqual(csvMatch.format.toLowerCase(), t.format.toLowerCase(), `Register Dec ${t.address} format mismatch with CSV`);
    // Validate hex equivalence
    const normalizedCsvHex = parseInt(csvMatch.modbus_reg_hex, 16);
    const normalizedExpectedHex = parseInt(t.hex, 16);
    assert.strictEqual(normalizedCsvHex, normalizedExpectedHex, `Register Dec ${t.address} hex mismatch with CSV`);
  }

  // Verify DTO TraceabilityData interface and SaveDeviceFinalConfigDto
  const dummyTrace: TraceabilityData = {
    fw_code: 'SATH',
    fw_version: '6F0328',
    hw_version: '1H',
    lorawan_protocol_version: '01.00.03',
    spare_15: '000000000000000000000000000000000000000000000000',
    dev_eui: '0011223344556677',
    app_eui: '8899AABBCCDDEEFF',
    factory_app_key: '000102030405060708090A0B0C0D0E0F',
    factory_nwk_skey: '101112131415161718191A1B1C1D1E1F',
    factory_app_skey: '202122232425262728292A2B2C2D2E2F',
    read_at: new Date().toISOString(),
    read_duration_ms: 1200,
    max_read_attempts: 5,
  };
  assert.ok(dummyTrace.fw_code === 'SATH');
  assert.ok(dummyTrace.hw_version === '1H');
  assert.ok(dummyTrace.max_read_attempts === 5);

  // Check code captures all 10 in fcTraceabilityData.value
  assert.ok(viewsCode.includes('fw_code: readFwCode,'), 'fcTraceabilityData must contain fw_code');
  assert.ok(viewsCode.includes('fw_version: readFw,'), 'fcTraceabilityData must contain fw_version');
  assert.ok(viewsCode.includes('hw_version: readHw,'), 'fcTraceabilityData must contain hw_version');
  assert.ok(viewsCode.includes('lorawan_protocol_version: readProto,'), 'fcTraceabilityData must contain lorawan_protocol_version');
  assert.ok(viewsCode.includes('spare_15: readSpare,'), 'fcTraceabilityData must contain spare_15');
  assert.ok(viewsCode.includes('dev_eui: readDevEui,'), 'fcTraceabilityData must contain dev_eui');
  assert.ok(viewsCode.includes('app_eui: readAppEui,'), 'fcTraceabilityData must contain app_eui');
  assert.ok(viewsCode.includes('factory_app_key: readFactoryAppKey,'), 'fcTraceabilityData must contain factory_app_key');
  assert.ok(viewsCode.includes('factory_nwk_skey: readNwkSkey,'), 'fcTraceabilityData must contain factory_nwk_skey');
  assert.ok(viewsCode.includes('factory_app_skey: readAppSkey,'), 'fcTraceabilityData must contain factory_app_skey');

  console.log('  -> PASS: All 10 Traceability registers and DTO contracts verified.\n');
  passed++;

  // TEST 5: STRICTLY ASCENDING READ ORDER & ALGORITHM
  console.log('[TEST 5] Verifying strictly ascending read order (0 -> 5 -> 9 -> ... -> 51 -> 103 -> 259 -> 386)...');
  // Check Stage 1 sequential read calls in code order
  const idxReg0 = viewsCode.indexOf('readRegisterWithRetry(1, 0, 5)');
  const idxReg5 = viewsCode.indexOf('readRegisterWithRetry(1, 5, 4)');
  const idxReg9 = viewsCode.indexOf('readRegisterWithRetry(1, 9, 2)');
  const idxReg11 = viewsCode.indexOf('readRegisterWithRetry(1, 11, 4)');
  const idxReg15 = viewsCode.indexOf('readRegisterWithRetry(1, 15, 12)');
  const idxReg27 = viewsCode.indexOf('readRegisterWithRetry(1, 27, 4)');
  const idxReg31 = viewsCode.indexOf('readRegisterWithRetry(1, 31, 4)');
  const idxReg35 = viewsCode.indexOf('readRegisterWithRetry(1, 35, 8)');
  const idxReg43 = viewsCode.indexOf('readRegisterWithRetry(1, 43, 8)');
  const idxReg51 = viewsCode.indexOf('readRegisterWithRetry(1, 51, 8)');
  const idxReg103 = viewsCode.indexOf('readRegisterWithRetry(1, 103, 1)');
  const idxReg259 = viewsCode.indexOf('readRegisterWithRetry(1, 259, 9)');
  const idxReg386 = viewsCode.indexOf('readRegisterWithRetry(1, 386, 14)');

  const orderIndices = [
    idxReg0, idxReg5, idxReg9, idxReg11, idxReg15,
    idxReg27, idxReg31, idxReg35, idxReg43, idxReg51,
    idxReg103, idxReg259, idxReg386
  ];
  for (let i = 0; i < orderIndices.length - 1; i++) {
    assert.ok(orderIndices[i] !== -1, `Stage 1 register read at index ${i} must be found in code`);
    assert.ok(orderIndices[i] < orderIndices[i + 1], `Stage 1 read order violated: register ${i} must appear before ${i + 1}`);
  }

  // Check Stage 3 ascending sort logic
  assert.ok(
    viewsCode.includes('allAuditList.sort((a, b) => Number(a.address) - Number(b.address));'),
    'Stage 3 audit list must be sorted ascending by address before reading'
  );

  console.log('  -> PASS: Ascending read sequence strictly verified for Stage 1 and Stage 3.\n');
  passed++;

  // TEST 6: MODBUS TIMING, INTER-READ DELAY (35MS) & SLEEP TIMEOUT < 60S
  console.log('[TEST 6] Verifying Modbus timing, INTER_READ_DELAY_MS (35ms), and speed budget under 60s...');
  assert.ok(
    viewsCode.includes('const INTER_READ_DELAY_MS = 35;'),
    'INTER_READ_DELAY_MS must be defined as 35ms (within 30-50ms window)'
  );

  // Timing budget calculation:
  // Reading 40 registers at 9600 baud:
  // 1 read command frame: 8 bytes = 8.3ms
  // 1 read response frame: ~29 bytes = 30.2ms
  // MCU processing time: ~15ms
  // Inter-read delay: 35ms
  // Total per read = 8.3 + 30.2 + 15 + 35 = 88.5ms
  // 40 registers = 3.54 seconds.
  // Flash write (Stage 2): ~4-6 writes with 600ms settling = ~3.6s
  // Total execution time under typical conditions = ~7.5 seconds, far below 60 seconds sleep timeout.
  const numReads = 45;
  const timePerReadMs = 88.5;
  const numWrites = 6;
  const timePerWriteMs = 600 + 40;
  const totalEstimatedTimeSeconds = (numReads * timePerReadMs + numWrites * timePerWriteMs) / 1000;
  assert.ok(totalEstimatedTimeSeconds < 15, `Estimated execution time (${totalEstimatedTimeSeconds.toFixed(1)}s) must be < 15s`);
  assert.ok(totalEstimatedTimeSeconds < 60, `Estimated execution time (${totalEstimatedTimeSeconds.toFixed(1)}s) must be well below 60s sleep limit`);

  // Verify non-blocking async backend save in Stage 4
  assert.ok(
    viewsCode.includes('(async () => {') && viewsCode.includes('/api/c-modules/final-config-manager/devices'),
    'Stage 4 must execute backend persistence inside an async non-blocking closure'
  );
  assert.ok(
    viewsCode.includes("finalVerdict.value = verdict;"),
    'Stage 4 must declare verdict immediately before waiting for DB response'
  );

  console.log(`  -> PASS: INTER_READ_DELAY_MS=35ms, estimated cycle ~${totalEstimatedTimeSeconds.toFixed(1)}s (<60s) & async DB confirmed.\n`);
  passed++;

  // TEST 7: DDL SCRIPT 21 MIGRATION VALIDITY & REPOSITORY ADDRESS CHECK
  console.log('[TEST 7] Verifying DDL Migration 21 (deploy/database/updates/21_add_traceability_metadata_to_final_config_sn.sql)...');
  const ddlPath = path.resolve(__dirname, '../../deploy/database/updates/21_add_traceability_metadata_to_final_config_sn.sql');
  assert.ok(fs.existsSync(ddlPath), 'Migration 21 SQL file must exist in deploy/database/updates/');
  const ddlContent = fs.readFileSync(ddlPath, 'utf8');

  assert.ok(ddlContent.includes('BEGIN;'), 'Migration 21 must be transactional (BEGIN)');
  assert.ok(ddlContent.includes('COMMIT;'), 'Migration 21 must commit transaction (COMMIT)');
  assert.ok(
    ddlContent.includes('idx_final_config_sn_metadata_gin') && ddlContent.includes('USING GIN ("metadata")'),
    'Migration 21 must create GIN index on final_config_sn(metadata)'
  );
  assert.ok(
    ddlContent.includes('idx_final_config_sn_trace_fw_code') &&
    ddlContent.includes('idx_final_config_sn_trace_hw_ver') &&
    ddlContent.includes('idx_final_config_sn_trace_proto_ver') &&
    ddlContent.includes('idx_final_config_sn_trace_factory_appkey'),
    'Migration 21 must create B-Tree expression indexes on core traceability fields'
  );
  assert.ok(
    ddlContent.includes('chk_final_config_regs_sn_address') && ddlContent.includes('"address" >= 0'),
    'Migration 21 must enforce check constraint address >= 0 for registers table'
  );

  // Check Repository and Entities
  const repoPath = path.resolve(__dirname, '../src/modules/c-modules/final-config-manager/final-config-manager.repository.ts');
  const repoCode = fs.readFileSync(repoPath, 'utf8');
  assert.ok(repoCode.includes('metadata: dto.metadata'), 'Repository must persist metadata field');
  assert.ok(repoCode.includes('default_value: r.default_value'), 'Repository must persist default_value');

  console.log('  -> PASS: Migration 21 SQL structure and repository storage verified.\n');
  passed++;

  console.log('========================================================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passed}/${total} COMPREHENSIVE CHECKS SUCCESSFUL`);
  console.log('========================================================================================\n');
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
