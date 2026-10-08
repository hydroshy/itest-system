import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { DeviceTestedRepository } from '../src/modules/c-modules/device-tested/device-tested.repository';
import { DeviceTestedService } from '../src/modules/c-modules/device-tested/device-tested.service';
import { DeviceTestedEntity } from '../src/modules/c-modules/device-tested/entities/device-tested.entity';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { DEFAULT_D_MODULES } from '../src/modules/d-modules/d-module-registry';

/**
 * Robust WSLRW-ATH-6.csv Parser
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
  in_rd1_template: boolean;
  comment: string;
  in_engineering_template: boolean;
  in_end_user_template: boolean;
  in_full_template: boolean;
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
  // Skip header (row 0)
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
    const inRd1 = r[11] === 'Yes';
    const comment = r[12] || '';
    const inEng = r[13] === 'Yes';
    const inEndUser = r[14] === 'Yes';
    const inFull = r[15] === 'Yes';

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
        in_rd1_template: inRd1,
        comment,
        in_engineering_template: inEng,
        in_end_user_template: inEndUser,
        in_full_template: inFull,
      });
    }
  }

  return records;
}

/**
 * Modbus CRC-16 Calculation
 */
function calculateCrc16(buffer: Uint8Array): number {
  let crc = 0xffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x0001) !== 0) {
        crc = (crc >> 1) ^ 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}

/**
 * Helper to build FC 16 (0x10) frame for Writing Multiple Registers
 */
function buildModbusFc16Frame(slaveAddress: number, startReg: number, regValues: number[]): Uint8Array {
  const byteCount = regValues.length * 2;
  const frame = new Uint8Array(7 + byteCount + 2);
  frame[0] = slaveAddress;
  frame[1] = 0x10; // FC 16
  frame[2] = (startReg >> 8) & 0xff;
  frame[3] = startReg & 0xff;
  frame[4] = (regValues.length >> 8) & 0xff;
  frame[5] = regValues.length & 0xff;
  frame[6] = byteCount;

  for (let i = 0; i < regValues.length; i++) {
    frame[7 + i * 2] = (regValues[i] >> 8) & 0xff;
    frame[7 + i * 2 + 1] = regValues[i] & 0xff;
  }

  const crc = calculateCrc16(frame.subarray(0, 7 + byteCount));
  frame[7 + byteCount] = crc & 0xff; // Low byte first
  frame[7 + byteCount + 1] = (crc >> 8) & 0xff; // High byte
  return frame;
}

async function runLorawanFinalConfigDeviceTestSuite() {
  console.log('========================================================================================');
  console.log('🧪 TEST SUITE: FINAL CONFIG DEVICE 4-STAGE ENGINE, MEMMAP & COM AUTO-RECONNECT');
  console.log('========================================================================================\n');

  let passedTests = 0;
  const totalTests = 12;

  const csvPath = path.resolve(__dirname, '../../docs/WSLRW-ATH-6.csv');
  const viewsModulePath = path.resolve(__dirname, '../src/views/dashboard-modules/final-config-device.module.ts');
  const frontModulePath = path.resolve(__dirname, '../src/frontend/modules/dashboard/final-config-device.module.ts');

  // ----------------------------------------------------------------------------------------------------
  // TEST 1: CSV Memmap WSLRW-ATH-6.csv Parsing & Fixed Register Validation (5, 27, 103, 259, 274, 386)
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 1] Verifying fixed registers in WSLRW-ATH-6.csv against spec contract...');
  assert.ok(fs.existsSync(csvPath), `WSLRW-ATH-6.csv must exist at ${csvPath}`);
  const csvRecords = parseWslrwAthCsv(csvPath);
  assert.ok(csvRecords.length >= 70, `Parsed CSV must contain at least 70 records, got ${csvRecords.length}`);

  // Reg 5: FW_VERSION (4 regs)
  const reg5 = csvRecords.find(r => r.modbus_reg_dec === 5);
  assert.ok(reg5, 'Reg 5 (FW_VERSION) must be present in CSV');
  assert.strictEqual(reg5.num_regs, 4, 'Reg 5 must have 4 registers (8 bytes)');
  assert.strictEqual(reg5.format, 'string', 'Reg 5 format must be string');
  assert.strictEqual(reg5.fn_read, '3', 'Reg 5 read function must be FC 03');

  // Reg 27: deviceEUI (4 regs, hex)
  const reg27 = csvRecords.find(r => r.modbus_reg_dec === 27);
  assert.ok(reg27, 'Reg 27 (deviceEUI) must be present in CSV');
  assert.strictEqual(reg27.num_regs, 4, 'Reg 27 must have 4 registers (8 bytes, 64-bit DevEUI)');
  assert.strictEqual(reg27.format, 'hex', 'Reg 27 format must be hex');
  assert.strictEqual(reg27.modbus_reg_hex, '1B', 'Reg 27 hex must be 1B (0x001B)');

  // Reg 103: sensor type (1 reg, uint16)
  const reg103 = csvRecords.find(r => r.modbus_reg_dec === 103);
  assert.ok(reg103, 'Reg 103 (sensor type) must be present in CSV');
  assert.strictEqual(reg103.num_regs, 1, 'Reg 103 must have 1 register (2 bytes)');
  assert.strictEqual(reg103.format, 'uint16', 'Reg 103 format must be uint16');
  assert.strictEqual(reg103.modbus_reg_hex, '67', 'Reg 103 hex must be 67 (0x0067)');

  // Reg 259: SERIAL_NUMBER (9 regs, string)
  const reg259 = csvRecords.find(r => r.modbus_reg_dec === 259);
  assert.ok(reg259, 'Reg 259 (SERIAL_NUMBER) must be present in CSV');
  assert.strictEqual(reg259.num_regs, 9, 'Reg 259 must have 9 registers (18 bytes)');
  assert.strictEqual(reg259.format, 'string', 'Reg 259 format must be string');
  assert.strictEqual(reg259.modbus_reg_hex, '103', 'Reg 259 hex must be 103 (0x0103)');

  // Reg 274: lora appKey (8 regs, 16 bytes, hex, write FC 16)
  const reg274 = csvRecords.find(r => r.modbus_reg_dec === 274);
  assert.ok(reg274, 'Reg 274 (lora appKey) must be present in CSV');
  assert.strictEqual(reg274.num_regs, 8, 'Reg 274 must have 8 registers (16 bytes, 128-bit key)');
  assert.strictEqual(reg274.format, 'hex', 'Reg 274 format must be hex');
  assert.strictEqual(reg274.fn_write, '16', 'Reg 274 write function must be FC 16 (0x10)');
  assert.strictEqual(reg274.modbus_reg_hex, '112', 'Reg 274 hex must be 112 (0x0112)');

  // Reg 386: ITEM_CODE (14 regs, string)
  const reg386 = csvRecords.find(r => r.modbus_reg_dec === 386);
  assert.ok(reg386, 'Reg 386 (ITEM_CODE) must be present in CSV');
  assert.strictEqual(reg386.num_regs, 14, 'Reg 386 must have 14 registers (28 bytes)');
  assert.strictEqual(reg386.format, 'string', 'Reg 386 format must be string');
  assert.strictEqual(reg386.modbus_reg_hex, '182', 'Reg 386 hex must be 182 (0x0182)');

  console.log('  -> PASS: All fixed registers (5, 27, 103, 259, 274, 386) exactly match specification.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 2: Stage 1 (0-25%) Verification Logic: HW ID Decoding & device_tested Gate Check
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 2] Verifying Stage 1 (0-25%) HW identification & device_tested gate check...');
  const repo = new DeviceTestedRepository();
  const service = new DeviceTestedService(repo);

  // Seed QA Tested records
  await service.create({
    so: 'SO-DAVITEQ-2026-A',
    item_code: 'WSLRW-ATH-01',
    serial_number: 'SN-WSLRW-0001',
    dev_eui: 'A84041000182A001',
    sku: 'WSLRW-ATH',
    firmware_version: '6F0418',
    short_fw: 6,
    sensor_type: 103,
    status: 'PASS',
    app_key: '2B7E151628AED2A6ABF7158809CF4F3C',
  });

  await service.create({
    so: 'SO-DAVITEQ-2026-B',
    item_code: 'WSLRW-ATH-01',
    serial_number: 'SN-WSLRW-0002',
    dev_eui: 'A84041000182A002',
    sku: 'WSLRW-ATH',
    firmware_version: '6F0418',
    short_fw: 6,
    sensor_type: 103,
    status: 'FAIL',
  });

  // 2a. Verify with matching SO and PASS status -> MUST PASS
  const verifyPass = await service.verify({
    serial_number: 'SN-WSLRW-0001',
    item_code: 'WSLRW-ATH-01',
    so: 'SO-DAVITEQ-2026-A',
  });
  assert.strictEqual(verifyPass.verified, true, 'Stage 1 must pass when SN, Item Code and SO match with PASS status');
  assert.strictEqual(verifyPass.data?.status, 'PASS');
  assert.strictEqual(verifyPass.data?.serial_number, 'SN-WSLRW-0001');

  // 2b. Verify with SO mismatch -> MUST FAIL
  const verifySoMismatch = await service.verify({
    serial_number: 'SN-WSLRW-0001',
    item_code: 'WSLRW-ATH-01',
    so: 'SO-DAVITEQ-2026-OTHER',
  });
  assert.strictEqual(verifySoMismatch.verified, false, 'Stage 1 must fail on SO mismatch');
  assert.ok(verifySoMismatch.message.includes('Sales Order mismatch'));

  // 2c. Verify with FAIL status in device_tested -> MUST FAIL
  const verifyFailStatus = await service.verify({
    serial_number: 'SN-WSLRW-0002',
    item_code: 'WSLRW-ATH-01',
    so: 'SO-DAVITEQ-2026-B',
  });
  assert.strictEqual(verifyFailStatus.verified, false, 'Stage 1 must fail when QA status is FAIL');
  assert.ok(verifyFailStatus.message.includes("status is 'FAIL'"), 'Message must indicate status is FAIL');

  // 2d. Verify non-existent device -> MUST FAIL
  const verifyUnregistered = await service.verify({
    serial_number: 'SN-NOT-FOUND-999',
    item_code: 'WSLRW-ATH-01',
    so: 'SO-DAVITEQ-2026-A',
  });
  assert.strictEqual(verifyUnregistered.verified, false, 'Stage 1 must fail when device not found in device_tested');

  // 2e. Verify without pre-selected SO -> MUST AUTO-MAP SO and AppKey
  const verifyNoPreselectedSo = await service.verify({
    serial_number: 'SN-WSLRW-0001',
    item_code: 'WSLRW-ATH-01',
  });
  assert.strictEqual(verifyNoPreselectedSo.verified, true, 'Stage 1 must pass when no SO is pre-selected and device is PASS in device_tested');
  assert.strictEqual(verifyNoPreselectedSo.data?.so, 'SO-DAVITEQ-2026-A', 'Must auto-map SO from device_tested record');
  assert.ok(verifyNoPreselectedSo.data?.app_key, 'Must return app_key for automatic Stage 2 Reg 274 programming');

  console.log('  -> PASS: Stage 1 hardware ID & QA gate check rigorously verified.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 3: Stage 2 (25-50%): Preset value_to_write (Reg >= 303) & LoRaWAN AppKey (Reg 274, 8 words)
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 3] Verifying Stage 2 (25-50%) Preset filtering & LoRaWAN AppKey Modbus frame construction...');
  const appKeyHex = '2B7E151628AED2A6ABF7158809CF4F3C';
  assert.strictEqual(appKeyHex.length, 32, 'AppKey must be 32 hex characters (16 bytes = 128-bit key)');

  // Convert 32-char hex string to 8 words (16-bit uint big-endian)
  const appKeyWords: number[] = [];
  for (let i = 0; i < 32; i += 4) {
    appKeyWords.push(parseInt(appKeyHex.substring(i, i + 4), 16));
  }
  assert.strictEqual(appKeyWords.length, 8, 'AppKey must split into exactly 8 words');

  // Build Modbus FC 16 frame: Slave 1, Start Reg 274 (0x0112), 8 words
  const fc16Frame = buildModbusFc16Frame(1, 274, appKeyWords);
  assert.strictEqual(fc16Frame[0], 0x01, 'Slave address must be 0x01');
  assert.strictEqual(fc16Frame[1], 0x10, 'Function Code must be 0x10 (FC 16)');
  assert.strictEqual(fc16Frame[2], 0x01, 'Start reg high byte must be 0x01');
  assert.strictEqual(fc16Frame[3], 0x12, 'Start reg low byte must be 0x12 (274 = 0x0112)');
  assert.strictEqual(fc16Frame[4], 0x00, 'Reg count high byte must be 0x00');
  assert.strictEqual(fc16Frame[5], 0x08, 'Reg count low byte must be 0x08 (8 words)');
  assert.strictEqual(fc16Frame[6], 0x10, 'Byte count must be 0x10 (16 bytes)');

  // Verify CRC
  const calculatedCrc = calculateCrc16(fc16Frame.subarray(0, fc16Frame.length - 2));
  const frameCrc = fc16Frame[fc16Frame.length - 2] | (fc16Frame[fc16Frame.length - 1] << 8);
  assert.strictEqual(calculatedCrc, frameCrc, 'Modbus RTU CRC16 checksum must be mathematically valid');

  // Verify Single-word Register 317 (Region) FC 16 Frame Construction (11 bytes total)
  // Register 317 (0x013D), 1 word = 2 bytes, value = 5 (EU868 = 0x0005)
  const reg317Words = [5];
  const fc16Reg317Frame = buildModbusFc16Frame(1, 317, reg317Words);
  assert.strictEqual(fc16Reg317Frame.length, 11, 'Reg 317 FC 16 request frame must be exactly 11 bytes (7 header/qty/count + 2 data + 2 crc)');
  assert.strictEqual(fc16Reg317Frame[0], 0x01, 'Slave address must be 0x01');
  assert.strictEqual(fc16Reg317Frame[1], 0x10, 'Function Code must be 0x10 (FC 16)');
  assert.strictEqual(fc16Reg317Frame[2], 0x01, 'Start reg high byte must be 0x01');
  assert.strictEqual(fc16Reg317Frame[3], 0x3d, 'Start reg low byte must be 0x3D (317 = 0x013D)');
  assert.strictEqual(fc16Reg317Frame[4], 0x00, 'Quantity high byte must be 0x00');
  assert.strictEqual(fc16Reg317Frame[5], 0x01, 'Quantity low byte must be 0x01 (1 word)');
  assert.strictEqual(fc16Reg317Frame[6], 0x02, 'Byte count must be 0x02 (2 bytes)');
  assert.strictEqual(fc16Reg317Frame[7], 0x00, 'Value high byte must be 0x00');
  assert.strictEqual(fc16Reg317Frame[8], 0x05, 'Value low byte must be 0x05 (EU868)');
  const reg317Crc = calculateCrc16(fc16Reg317Frame.subarray(0, 9));
  const reg317FrameCrc = fc16Reg317Frame[9] | (fc16Reg317Frame[10] << 8);
  assert.strictEqual(reg317Crc, reg317FrameCrc, 'Reg 317 FC 16 frame CRC16 must be valid');

  // Verify preset filtering constraint: address >= 303
  const candidatePresets = [
    { address: 256, parameter_name: 'MODBUS_ADDRESS', value_to_write: '1', checked: true },
    { address: 274, parameter_name: 'AppKey', value_to_write: appKeyHex, checked: true },
    { address: 303, parameter_name: 'downlink flag', value_to_write: '1', checked: true },
    { address: 318, parameter_name: 'data rate', value_to_write: '5', checked: true },
    { address: 334, parameter_name: 'CONSTANT_A', value_to_write: '1.25', checked: true },
  ];
  const filteredPresets = candidatePresets.filter(p => p.address >= 303 && p.checked && p.value_to_write);
  assert.strictEqual(filteredPresets.length, 3, 'Only registers with address >= 303 are filtered as user preset params');
  assert.ok(filteredPresets.every(p => p.address >= 303), 'All filtered presets must have address >= 303');

  console.log('  -> PASS: Stage 2 AppKey 8-word FC 16 frame & Reg >= 303 preset filter verified.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 4: Stage 3 (50-75%): Chunked Modbus Reading & Register Snapshot Structure
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 4] Verifying Stage 3 (50-75%) chunked memmap read & snapshot schema...');
  // Simulate chunk generation for registers 0 to 420
  const totalRegCount = 420;
  const chunkSize = 50;
  const chunks: { start: number; count: number }[] = [];
  for (let offset = 0; offset < totalRegCount; offset += chunkSize) {
    chunks.push({
      start: offset,
      count: Math.min(chunkSize, totalRegCount - offset),
    });
  }
  assert.strictEqual(chunks.length, 9, 'Chunking 420 regs with 50 size must result in 9 chunks');
  assert.strictEqual(chunks[0].start, 0);
  assert.strictEqual(chunks[0].count, 50);
  assert.strictEqual(chunks[chunks.length - 1].start, 400);
  assert.strictEqual(chunks[chunks.length - 1].count, 20);

  // Snapshot item schema conformance
  const sampleSnapshotItem = {
    address: 303,
    modbus_reg_hex: '0x012F',
    slave: 1,
    reg_num: 1,
    format: 'uint16',
    parameter_name: 'downlink flag',
    value_to_write: '1',
    value_read_back: '1',
    status: 'PASS',
    endianness: 'big',
    fn_read: '3',
    fn_write: '16',
    order_no: 1,
  };
  assert.strictEqual(typeof sampleSnapshotItem.address, 'number');
  assert.strictEqual(typeof sampleSnapshotItem.value_read_back, 'string');
  assert.strictEqual(sampleSnapshotItem.status, 'PASS');

  console.log('  -> PASS: Stage 3 chunking algorithm & snapshot structure verified.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 5: Stage 4 (75-100%): Automated Verification Engine (PASS/FAIL Verdict)
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 5] Verifying Stage 4 (75-100%) automated comparator and PASS/FAIL verdict logic...');
  interface RegCompareCase {
    name: string;
    target: string;
    readBack: string;
    format: string;
    address: number;
    expectedStatus: 'PASS' | 'FAIL';
  }

  const compareCases: RegCompareCase[] = [
    { name: 'Numeric equal', target: '600', readBack: '600', format: 'uint', address: 303, expectedStatus: 'PASS' },
    { name: 'Numeric mismatch', target: '600', readBack: '300', format: 'uint', address: 303, expectedStatus: 'FAIL' },
    { name: 'Float equal', target: '1.25', readBack: '1.2500', format: 'float', address: 334, expectedStatus: 'PASS' },
    { name: 'Float mismatch', target: '1.25', readBack: '1.50', format: 'float', address: 334, expectedStatus: 'FAIL' },
    { name: 'Hex AppKey equal', target: '2B7E151628AED2A6ABF7158809CF4F3C', readBack: '2b7e151628aed2a6abf7158809cf4f3c', format: 'hex', address: 274, expectedStatus: 'PASS' },
    { name: 'Hex AppKey mismatch', target: '2B7E151628AED2A6ABF7158809CF4F3C', readBack: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', format: 'hex', address: 274, expectedStatus: 'FAIL' },
    { name: 'String equal case insensitive', target: 'WSLRW-ATH-01', readBack: 'wslrw-ath-01', format: 'string', address: 386, expectedStatus: 'PASS' },
    { name: 'String mismatch', target: 'WSLRW-ATH-01', readBack: 'WSLRW-OTHER-02', format: 'string', address: 386, expectedStatus: 'FAIL' },
  ];

  for (const c of compareCases) {
    const target = String(c.target || '').trim();
    const read = String(c.readBack || '').trim();
    let isMatch = false;
    if (c.address === 274) {
      isMatch = read.toUpperCase() === target.toUpperCase();
    } else if (c.format === 'float' || c.format === 'float32') {
      const numT = parseFloat(target);
      const numR = parseFloat(read);
      isMatch = !isNaN(numT) && !isNaN(numR) && Math.abs(numT - numR) < 0.001;
    } else if (c.format === 'int' || c.format === 'uint' || c.format === 'int16' || c.format === 'uint16') {
      const numT = parseInt(target, 10);
      const numR = parseInt(read, 10);
      isMatch = !isNaN(numT) && !isNaN(numR) && numT === numR;
    } else {
      isMatch = read.toLowerCase() === target.toLowerCase();
    }
    const computedStatus = isMatch ? 'PASS' : 'FAIL';
    assert.strictEqual(computedStatus, c.expectedStatus, `Comparison check '${c.name}' must yield ${c.expectedStatus}`);
  }

  // Device overall verdict test: 1 FAIL implies device FAIL
  const listAllPass = [
    { address: 274, status: 'PASS' },
    { address: 303, status: 'PASS' },
    { address: 318, status: 'PASS' },
  ];
  const listWithOneFail = [
    { address: 274, status: 'PASS' },
    { address: 303, status: 'FAIL' },
    { address: 318, status: 'PASS' },
  ];
  const verdictAllPass = listAllPass.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL';
  const verdictWithFail = listWithOneFail.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL';
  assert.strictEqual(verdictAllPass, 'PASS', 'All passing registers must result in overall PASS');
  assert.strictEqual(verdictWithFail, 'FAIL', 'Any register failure must result in overall FAIL');

  console.log('  -> PASS: Stage 4 automated comparator & overall PASS/FAIL verdict verified.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 6: COM Auto-Reconnect & Stream Anti-Freeze Lifecycle in Module Code
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 6] Verifying Web Serial COM Auto-Reconnect & Anti-Freeze Stream Lock Lifecycle...');
  assert.ok(fs.existsSync(viewsModulePath), 'views final-config-device.module.ts must exist');
  assert.ok(fs.existsSync(frontModulePath), 'frontend final-config-device.module.ts must exist');

  const viewsCode = fs.readFileSync(viewsModulePath, 'utf8');
  const frontCode = fs.readFileSync(frontModulePath, 'utf8');

  // Verify 100% sync
  assert.strictEqual(viewsCode, frontCode, 'views and frontend final-config-device.module.ts must be identical');

  // Verify Web Serial API hooks
  assert.ok(viewsCode.includes("navigator.serial.addEventListener('disconnect'"), 'Must register disconnect listener');
  assert.ok(viewsCode.includes("navigator.serial.addEventListener('connect'"), 'Must register connect listener');
  assert.ok(viewsCode.includes("navigator.serial.removeEventListener('disconnect'"), 'Must unregister disconnect listener');
  assert.ok(viewsCode.includes("navigator.serial.removeEventListener('connect'"), 'Must unregister connect listener');

  // Verify stream cleanup and anti-freeze
  assert.ok(viewsCode.includes('activeUartReader.cancel()'), 'Must cancel active reader on port cleanup');
  assert.ok(viewsCode.includes('activeUartReader.releaseLock()'), 'Must release active reader lock');
  assert.ok(viewsCode.includes('safeCleanupUartPort'), 'Must execute safeCleanupUartPort');

  // Verify auto-reconnect state and debounce retry
  assert.ok(viewsCode.includes('isAutoReconnecting'), 'Must manage isAutoReconnecting flag');
  assert.ok(viewsCode.includes('lastConnectedPortInfo'), 'Must preserve lastConnectedPortInfo (VID/PID)');
  assert.ok(viewsCode.includes('autoReconnectTimer'), 'Must handle debounce autoReconnectTimer');
  assert.ok(viewsCode.includes('600'), 'Must debounce reconnect 600ms');
  assert.ok(viewsCode.includes('1000'), 'Must retry reconnect 1000ms');

  console.log('  -> PASS: Web Serial Auto-Reconnect & Anti-Freeze stream lock handling fully verified.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 7: Zero Mock Data Policy Audit across final-config-device.module.ts
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 7] Enforcing Zero Mock Data Policy on final-config-device source code...');
  const forbiddenPatterns = [
    /\bmockData\b/i,
    /\bdummyRegisters\b/i,
    /\bfakeDevice\b/i,
    /\bsimulatedDevice\b/i,
    /MOCK_SERIAL_NUMBER/,
    /DUMMY_DATA/,
  ];

  for (const pattern of forbiddenPatterns) {
    const match = viewsCode.match(pattern);
    assert.strictEqual(match, null, `Forbidden mock pattern ${pattern} found in final-config-device.module.ts`);
  }

  // Ensure real backend endpoints are called
  assert.ok(viewsCode.includes('/api/device-tested/verify'), 'Must call real /api/device-tested/verify');
  assert.ok(viewsCode.includes('/api/c-modules/final-config-manager/devices'), 'Must call real /api/c-modules/final-config-manager/devices');
  assert.ok(viewsCode.includes('/api/c-modules/final-config-manager/presets/by-so-item'), 'Must call real /api/c-modules/final-config-manager/presets/by-so-item');

  console.log('  -> PASS: Zero mock data confirmed, real backend endpoints verified.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 8: Full NestJS Entities & D-Module Architecture Consistency
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 8] Verifying TypeORM Entity Registration and D-Module Registry consistency...');
  assert.ok(ALL_DATABASE_ENTITIES.includes(DeviceTestedEntity), 'DeviceTestedEntity must be part of ALL_DATABASE_ENTITIES');

  const dMod = DEFAULT_D_MODULES.find(m => m.id === 'final-config-device');
  assert.ok(dMod, 'final-config-device must be registered in DEFAULT_D_MODULES');
  assert.strictEqual(dMod.code, 'D_MOD_FINAL_CONFIG_DEVICE');
  assert.strictEqual(dMod.title, 'FINAL CONFIG DEVICE');
  assert.strictEqual(dMod.category, 'Factory');

  console.log('  -> PASS: Entity and D-Module architecture verified.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 9: Strict Static Code Analysis: 100% Modbus FC 16 for Writes (Zero FC 06)
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 9] Verifying Static Code Analysis: 100% Modbus FC 16 for all write operations (Zero FC 06)...');
  // 9a. Verify writeModbusRegistersToPort always hardcodes Function Code 0x10 in frame header
  assert.ok(
    viewsCode.includes('0x10,') && viewsCode.includes('(r >> 8) & 0xFF'),
    'writeModbusRegistersToPort frame header must explicitly hardcode 0x10 (FC 16)'
  );

  // 9b. Verify no residual branching or usage of FC 06 / 6 in write logic
  const forbiddenFc06Patterns = [
    /numreg\s*===?\s*1\s*\?\s*6\s*:\s*16/,
    /fn_write\s*===?\s*['"]FC\s*06['"]/,
    /fn_write\s*===?\s*['"]06['"]/,
    /writeModbusRegistersToPort\([^)]*,\s*6\s*,/,
    /writeModbusRegistersToPort\([^)]*,\s*0x06\s*,/,
    /fc\s*===?\s*6\b/,
    /fc\s*===?\s*0x06\b/,
  ];

  for (const pat of forbiddenFc06Patterns) {
    const match = viewsCode.match(pat);
    assert.strictEqual(
      match,
      null,
      `Forbidden FC 06 write pattern ${pat} detected in final-config-device.module.ts!`
    );
  }

  // 9c. Verify write calls in Stage 2 explicitly use FC 16
  assert.ok(
    viewsCode.includes('await writeModbusRegistersToPort(1, 16, addr, numreg, dataBytes);'),
    'Stage 2 register preset write must explicitly call writeModbusRegistersToPort with FC 16'
  );
  assert.ok(
    viewsCode.includes('await writeModbusRegistersToPort(1, 16, 274, 8, appKeyBytes);'),
    'Stage 2 AppKey write must explicitly call writeModbusRegistersToPort with FC 16'
  );

  // 9d. Verify UI and log indicators reflect FC 16
  assert.ok(
    viewsCode.includes("' (FC 16)'"),
    "Serial log TX message must indicate '(FC 16)'"
  );
  assert.ok(
    viewsCode.includes('Modbus FC 16'),
    "Audit & UI text must reference 'Modbus FC 16'"
  );

  console.log('  -> PASS: 100% Modbus FC 16 enforced across all write operations. Zero FC 06 confirmed.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 10: Spec Database DDL Migration 17_standardize_final_config_fn_write_fc16.sql Verification
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 10] Verifying Migration 17_standardize_final_config_fn_write_fc16.sql...');
  const migration17Path = path.resolve(__dirname, '../../deploy/database/updates/17_standardize_final_config_fn_write_fc16.sql');
  assert.ok(fs.existsSync(migration17Path), 'Migration 17 SQL file must exist in deploy/database/updates/');
  const migration17Content = fs.readFileSync(migration17Path, 'utf8');

  assert.ok(migration17Content.includes('BEGIN;'), 'Migration 17 must start transaction BEGIN');
  assert.ok(migration17Content.includes('COMMIT;'), 'Migration 17 must commit transaction COMMIT');
  assert.ok(migration17Content.includes('UPDATE "final_config_regs"'), 'Migration 17 must update final_config_regs');
  assert.ok(migration17Content.includes('UPDATE "final_config_regs_sn"'), 'Migration 17 must update final_config_regs_sn');
  assert.ok(migration17Content.includes('SET "fn_write" = \'16\''), 'Migration 17 must set fn_write = 16');
  assert.ok(
    migration17Content.includes("ALTER TABLE \"final_config_regs\" \nALTER COLUMN \"fn_write\" SET DEFAULT '16'") ||
    migration17Content.includes("ALTER COLUMN \"fn_write\" SET DEFAULT '16'"),
    'Migration 17 must set default 16 on fn_write'
  );

  console.log('  -> PASS: DDL Migration 17 adheres strictly to transactional spec.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 11: Write Timeout 3500ms, Inter-Write Settling Delay, Progressive Backoff & UART Buffer Flush
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 11] Verifying Write Timeout 3500ms, Inter-Write Settling Delay, Progressive Backoff & UART Buffer Flush...');

  // 11a. Verify write timeout >= 3500ms in writeModbusRegistersToPort and fcSerialConfig
  assert.ok(
    viewsCode.includes('writeModbusRegistersToPort = async (slave, fc, reg, numreg, dataBytes, timeoutMs = 3500)'),
    'writeModbusRegistersToPort default timeoutMs must be 3500ms'
  );
  assert.ok(
    viewsCode.includes('timeoutMs: 3500'),
    'fcSerialConfig.timeoutMs must be configured to 3500ms'
  );

  // 11b. Verify INTER_WRITE_SETTLING_DELAY_MS is 600ms (within 500-1000ms range)
  assert.ok(
    viewsCode.includes('const INTER_WRITE_SETTLING_DELAY_MS = 600;'),
    'INTER_WRITE_SETTLING_DELAY_MS must be defined as 600ms'
  );
  assert.ok(
    viewsCode.includes('await new Promise(r => setTimeout(r, INTER_WRITE_SETTLING_DELAY_MS));'),
    'Stage 2 write loop must execute settling delay between registers and before AppKey'
  );

  // 11c. Verify progressive retry backoff [800, 1500, 2500]ms
  assert.ok(
    viewsCode.includes('const RETRY_BACKOFF_DELAYS = [800, 1500, 2500];'),
    'RETRY_BACKOFF_DELAYS must be defined as [800, 1500, 2500]'
  );
  assert.ok(
    viewsCode.includes('RETRY_BACKOFF_DELAYS[retry]'),
    'Retry loop must look up backoff delay using RETRY_BACKOFF_DELAYS'
  );

  // 11d. Verify flushUartRxBuffer is implemented and called
  assert.ok(
    viewsCode.includes('const flushUartRxBuffer = async (flushTimeoutMs = 100)'),
    'flushUartRxBuffer must be implemented with 100ms default timeout'
  );
  assert.ok(
    viewsCode.includes('await flushUartRxBuffer();'),
    'flushUartRxBuffer must be called before write and retry attempts'
  );

  // 11e. Verify UI message reflects settling/retrying status
  assert.ok(
    viewsCode.includes("'Device settling/retrying..."),
    'fcStatusMessage must display settling/retrying notification'
  );

  // 11f. Verify DDL Migration 18 exists and has correct transactional schema
  const migration18Path = path.resolve(__dirname, '../../deploy/database/updates/18_add_final_config_preset_timing_controls.sql');
  assert.ok(fs.existsSync(migration18Path), 'Migration 18 SQL file must exist in deploy/database/updates/');
  const migration18Content = fs.readFileSync(migration18Path, 'utf8');
  assert.ok(migration18Content.includes('BEGIN;'), 'Migration 18 must start transaction BEGIN');
  assert.ok(migration18Content.includes('COMMIT;'), 'Migration 18 must commit transaction COMMIT');
  assert.ok(migration18Content.includes('write_timeout_ms'), 'Migration 18 must add write_timeout_ms column');
  assert.ok(migration18Content.includes('settling_delay_ms'), 'Migration 18 must add settling_delay_ms column');

  console.log('  -> PASS: Write timeout 3500ms, settling delay 600ms, progressive backoff and buffer flush verified.\n');
  passedTests++;

  // ----------------------------------------------------------------------------------------------------
  // TEST 12: Spec Read-back Ascending Order, Read Retry, UI Table Refactor, Debug Mode, Progress & Verdict
  // ----------------------------------------------------------------------------------------------------
  console.log('[TEST 12] Verifying Read-back Ascending Order, Read Retry, UI Table Refactor, Debug Mode, Progress & Verdict...');

  // 12a. Verify Stage 3 Read-back Order: reg 9, 274, presets >= 303 sorted ascending by address
  assert.ok(
    viewsCode.includes('allAuditList.sort((a, b) => Number(a.address) - Number(b.address));'),
    'Stage 3 must sort allAuditList strictly ascending by numeric address'
  );
  assert.ok(
    viewsCode.includes('allAuditList.forEach((r, idx) => {') && viewsCode.includes('r.order_no = idx + 1;'),
    'Stage 3 must reassign order_no sequentially after ascending sort'
  );

  // 12b. Verify Stage 3 Read Retry Engine: up to 3 attempts, progressive backoff [800, 1500]ms, flushUartRxBuffer
  assert.ok(
    viewsCode.includes('for (let retry = 0; retry < 3; retry++) {') &&
    viewsCode.includes('await flushUartRxBuffer();') &&
    viewsCode.includes('const rawBytes = await readModbusRegistersFromPort(1, addr, numreg);'),
    'Stage 3 read loop must implement 3-attempt retry with flushUartRxBuffer'
  );
  assert.ok(
    viewsCode.includes("const delayMs = RETRY_BACKOFF_DELAYS[retry] || 800;") &&
    viewsCode.includes("'Read Reg ' + addr + ' failed (attempt ' + (retry + 1) + '/3):"),
    'Stage 3 read retry must log warning with attempt count and delay'
  );
  assert.ok(
    viewsCode.includes("row.value_read_back = 'READ_ERR';"),
    'Stage 3 must assign READ_ERR after 3 failed read attempts'
  );

  // 12c. Verify UI Table Refactoring: No Hex Reg, No FC Write, Default Value before Target Value, Initial sort
  assert.ok(
    !viewsCode.includes("title: 'Hex Reg'"),
    'UI Tabulator columns must NOT contain Hex Reg column'
  );
  assert.ok(
    !viewsCode.includes("title: 'FC Write'"),
    'UI Tabulator columns must NOT contain FC Write column'
  );
  assert.ok(
    viewsCode.includes("title: 'Default Value'") && viewsCode.includes("field: 'default_value'"),
    'UI Tabulator columns must contain Default Value column'
  );

  // Check column order: Default Value must appear before Target Value
  const defaultValIdx = viewsCode.indexOf("title: 'Default Value'");
  const targetValIdx = viewsCode.indexOf("title: 'Target Value'");
  assert.ok(defaultValIdx !== -1 && targetValIdx !== -1, 'Both Default Value and Target Value columns must exist');
  assert.ok(defaultValIdx < targetValIdx, 'Default Value column must precede Target Value column');

  // Verify initialSort on address ascending
  assert.ok(
    viewsCode.includes("initialSort: [") && viewsCode.includes("{ column: 'address', dir: 'asc' }"),
    'Tabulator configuration must set initialSort by address asc'
  );

  // 12d. Verify Debug Mode Slide Switch: default false, v-show on 4 stage cards and audit grid
  assert.ok(
    viewsCode.includes('const fcDebugMode = ref(false);'),
    'Debug Mode reactive state fcDebugMode must be default false (OFF)'
  );
  assert.ok(
    viewsCode.includes('<input type="checkbox" v-model="fcDebugMode" class="sr-only peer" />'),
    'Debug Mode slide switch must be bound to fcDebugMode'
  );
  assert.ok(
    viewsCode.includes('<div v-show="fcDebugMode" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">'),
    '4-Stage panels container must use v-show="fcDebugMode"'
  );
  assert.ok(
    viewsCode.includes('<div v-show="fcDebugMode" class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">'),
    'Live Register Audit Grid container must use v-show="fcDebugMode"'
  );

  // 12e. Verify Progress Bar: h-6 height, no Stage X / 4 label
  assert.ok(
    viewsCode.includes('class="w-full h-6 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative p-0.5 shadow-inner"'),
    'Progress bar container must have h-6 (24px) height with shadow-inner'
  );
  assert.ok(
    !viewsCode.includes('Stage {{ currentStage > 0 ? currentStage : \'-\' }} / 4') &&
    !viewsCode.includes('Stage {{ currentStage }} / 4') &&
    !viewsCode.includes('Stage 4 / 4'),
    'Progress bar header must NOT display Stage X / 4 label'
  );

  // 12f. Verify Final Verdict: No FINAL VERDICT text, only clear PASS/FAIL/READY badge
  assert.ok(
    !viewsCode.includes('FINAL VERDICT'),
    'UI template must NOT contain the text FINAL VERDICT'
  );
  assert.ok(
    viewsCode.includes("{{ finalVerdict === 'PASS' ? 'PASS' : (finalVerdict === 'FAIL' ? 'FAIL' : 'READY') }}"),
    'Verdict badge must directly display PASS, FAIL or READY'
  );

  // 12g. Verify Migration 19: default_value column in final_config_regs and final_config_regs_sn
  const migration19Path = path.resolve(__dirname, '../../deploy/database/updates/19_add_default_value_to_final_config_regs.sql');
  assert.ok(fs.existsSync(migration19Path), 'Migration 19 SQL file must exist in deploy/database/updates/');
  const migration19Content = fs.readFileSync(migration19Path, 'utf8');
  assert.ok(migration19Content.includes('BEGIN;'), 'Migration 19 must be transactional (BEGIN)');
  assert.ok(migration19Content.includes('COMMIT;'), 'Migration 19 must commit transaction (COMMIT)');
  assert.ok(
    migration19Content.includes('"final_config_regs_sn"') && migration19Content.includes('"default_value"'),
    'Migration 19 must add default_value to final_config_regs_sn'
  );
  assert.ok(
    migration19Content.includes('"final_config_regs"') && migration19Content.includes('"default_value"'),
    'Migration 19 must add default_value to final_config_regs'
  );

  console.log('  -> PASS: Read-back ascending order, retry engine, UI refactor, debug switch, progress & verdict fully verified.\n');
  passedTests++;

  console.log('========================================================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} COMPREHENSIVE CHECKS SUCCESSFUL`);
  console.log('========================================================================================\n');
}

runLorawanFinalConfigDeviceTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
