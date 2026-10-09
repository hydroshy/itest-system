import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// Services, repos, utilities
import { sanitizeFw, formatShortFw } from '../src/modules/c-modules/final-config-manager/final-config-utils';
import { CreateFinalConfigRepository } from '../src/modules/c-modules/create-final-config/create-final-config.repository';
import { CreateFinalConfigService } from '../src/modules/c-modules/create-final-config/create-final-config.service';
import { FinalConfigManagerRepository } from '../src/modules/c-modules/final-config-manager/final-config-manager.repository';
import { FinalConfigManagerService } from '../src/modules/c-modules/final-config-manager/final-config-manager.service';
import {
  readFirstRegisterUntilSuccess,
  ReadRegisterResult,
  ReadFirstRegisterOptions,
} from '../src/views/dashboard-modules/final-config-device.module';

async function runTestSuite() {
  console.log('========================================================================================');
  console.log('🧪 TEST SUITE: FIRST REG CONTINUOUS RETRY & INTEGER SHORT FW STANDARDIZATION');
  console.log('========================================================================================\n');

  let passed = 0;
  const total = 8;

  // ----------------------------------------------------------------------------------------
  // TEST 1: 1:1 Code Synchronization between views and frontend modules
  // ----------------------------------------------------------------------------------------
  console.log('[TEST 1] Verifying 1:1 Code Synchronization (views vs frontend)...');
  const viewsPath = path.resolve(__dirname, '../src/views/dashboard-modules/final-config-device.module.ts');
  const frontPath = path.resolve(__dirname, '../src/frontend/modules/dashboard/final-config-device.module.ts');
  assert.ok(fs.existsSync(viewsPath), 'views final-config-device.module.ts must exist');
  assert.ok(fs.existsSync(frontPath), 'frontend final-config-device.module.ts must exist');

  const viewsContent = fs.readFileSync(viewsPath, 'utf8');
  const frontContent = fs.readFileSync(frontPath, 'utf8');
  assert.strictEqual(
    viewsContent,
    frontContent,
    'final-config-device.module.ts in src/views and src/frontend must be 100% identical'
  );
  console.log('  -> PASS: 1:1 code synchronization confirmed.\n');
  passed++;

  // ----------------------------------------------------------------------------------------
  // TEST 2: sanitizeFw / formatShortFw Comprehensive Edge Cases
  // ----------------------------------------------------------------------------------------
  console.log('[TEST 2] Verifying sanitizeFw and formatShortFw utility edge cases...');
  assert.strictEqual(sanitizeFw('6.0'), '6');
  assert.strictEqual(sanitizeFw('6.0.0'), '6');
  assert.strictEqual(sanitizeFw('v6.0'), '6');
  assert.strictEqual(sanitizeFw('V6.0'), '6');
  assert.strictEqual(sanitizeFw('v1.0.0'), '1');
  assert.strictEqual(sanitizeFw('6'), '6');
  assert.strictEqual(sanitizeFw(6), '6');
  assert.strictEqual(sanitizeFw(1), '1');
  assert.strictEqual(sanitizeFw('1.0'), '1');
  assert.strictEqual(sanitizeFw(null), '1');
  assert.strictEqual(sanitizeFw(undefined), '1');
  assert.strictEqual(sanitizeFw(''), '1');
  assert.strictEqual(sanitizeFw('   6.0   '), '6');
  assert.strictEqual(sanitizeFw('2.00'), '2');
  assert.strictEqual(sanitizeFw('10.0'), '10');
  assert.strictEqual(formatShortFw('7.0'), '7');
  console.log('  -> PASS: All sanitizeFw test cases passed.\n');
  passed++;

  // ----------------------------------------------------------------------------------------
  // TEST 3: Mock Hardware Simulation: Continuous Retry for Reg 0 succeeds after timeouts
  // ----------------------------------------------------------------------------------------
  console.log('[TEST 3] Testing readFirstRegisterUntilSuccess with simulated MCU Deep Sleep wakeup...');
  let attemptCount = 0;
  let flushCount = 0;
  const statusMsgRef = { value: '' };
  const abortRef = { value: false };
  const loggedMessages: string[] = [];

  const mockFlushBuffer = async () => {
    flushCount++;
  };

  // Simulate MCU taking 4 attempts to wake up (3 timeouts, 4th attempt succeeds)
  const mockReadModbus = async (slave: number, addr: number, numreg: number) => {
    attemptCount++;
    if (attemptCount < 4) {
      throw new Error(`Timeout reading Reg ${addr}: MCU in Deep Sleep`);
    }
    // Success on attempt 4: return mock 5 words for Reg 0 (FW_CODE: WSLRW-ATH-01)
    return [0x57, 0x53, 0x4c, 0x52, 0x57, 0x2d, 0x41, 0x54, 0x48, 0x00];
  };

  const mockLogFn = (level: string, frame: any, msg: string) => {
    loggedMessages.push(`[${level}] ${msg}`);
  };

  const res = await readFirstRegisterUntilSuccess(1, 0, 5, {
    backoffMs: 10,
    label: 'Reg 0 (FW_CODE)',
    abortRef,
    flushBufferFn: mockFlushBuffer,
    readModbusFn: mockReadModbus,
    logFn: mockLogFn,
    statusMsgRef,
    interReadDelayMs: 5,
  });

  assert.strictEqual(res.success, true, 'readFirstRegisterUntilSuccess must succeed when MCU finally responds');
  assert.strictEqual(res.attempts, 4, 'Must have taken exactly 4 attempts');
  assert.ok(res.rawBytes && res.rawBytes.length === 10, 'Must return rawBytes of Reg 0');
  assert.ok(flushCount >= 4, 'flushUartRxBuffer must be called before and after retry attempts');
  assert.ok(statusMsgRef.value.includes('Waking up MCU'), 'Status message must reflect retrying/wakeup');
  assert.ok(loggedMessages.some(m => m.includes('[WARN]') && m.includes('Retrying continuously until MCU wakes up')), 'Must log WARN for retry attempts');
  assert.ok(loggedMessages.some(m => m.includes('[INFO]') && m.includes('read SUCCESS on attempt 4')), 'Must log INFO on final success');
  console.log('  -> PASS: Continuous retry loop successfully waited for MCU wakeup across multiple timeouts.\n');
  passed++;

  // ----------------------------------------------------------------------------------------
  // TEST 4: Safe Abort Handling: User abortRequested terminates loop cleanly
  // ----------------------------------------------------------------------------------------
  console.log('[TEST 4] Testing readFirstRegisterUntilSuccess safe abort handling...');
  let abortAttemptCount = 0;
  const abortActiveRef = { value: false };

  const mockNeverWakingModbus = async () => {
    abortAttemptCount++;
    if (abortAttemptCount >= 2) {
      // User clicks Abort during attempt 2
      abortActiveRef.value = true;
    }
    throw new Error('Hardware disconnected or dead');
  };

  const abortRes = await readFirstRegisterUntilSuccess(1, 0, 5, {
    backoffMs: 10,
    label: 'Reg 0',
    abortRef: abortActiveRef,
    readModbusFn: mockNeverWakingModbus,
  });

  assert.strictEqual(abortRes.success, false, 'Aborted read must return success: false');
  assert.strictEqual(abortRes.aborted, true, 'Result must indicate aborted: true');
  assert.strictEqual(abortRes.rawBytes, null, 'rawBytes must be null when aborted');
  console.log('  -> PASS: Safe abort halts continuous loop cleanly.\n');
  passed++;

  // ----------------------------------------------------------------------------------------
  // TEST 4B: Physical Disconnect Guard: isConnectedFn halts loop immediately
  // ----------------------------------------------------------------------------------------
  console.log('[TEST 4B] Testing readFirstRegisterUntilSuccess physical disconnect detection...');
  let disconnectAttemptCount = 0;
  let isHardwareConnected = true;

  const mockDisconnectingModbus = async () => {
    disconnectAttemptCount++;
    if (disconnectAttemptCount >= 2) {
      // Physical USB cable pulled during attempt 2
      isHardwareConnected = false;
    }
    throw new Error('No response from device');
  };

  const disconnectRes = await readFirstRegisterUntilSuccess(1, 0, 5, {
    backoffMs: 10,
    label: 'Reg 0',
    isConnectedFn: () => isHardwareConnected,
    readModbusFn: mockDisconnectingModbus,
  });

  assert.strictEqual(disconnectRes.success, false, 'Disconnected port must return success: false');
  assert.strictEqual(disconnectRes.aborted, true, 'Result must indicate aborted: true');
  assert.strictEqual(disconnectRes.error?.message, 'User aborted operation or serial port disconnected', 'Error must indicate disconnect');
  console.log('  -> PASS: Physical disconnect detection halts continuous retry loop without infinite hang.\n');
  passed++;

  // ----------------------------------------------------------------------------------------
  // TEST 5: Backend Preset Creation Standardizes firmware_version and short_fw
  // ----------------------------------------------------------------------------------------
  console.log('[TEST 5] Verifying CreateFinalConfigService and FinalConfigManagerRepository short FW standardization...');
  const createPresetRepo = new CreateFinalConfigRepository();
  const createPresetService = new CreateFinalConfigService(createPresetRepo);

  // Case A: Input with '6.0' firmware_version
  const savedPreset1 = await createPresetService.saveFinalConfig({
    so: 'SO/2026/QA-001',
    item_code: 'WSLRW-ATH-01',
    sku: 'WSLRW-ATH',
    name: '[Final Config] SO/2026/QA-001 - WSLRW-ATH-01',
    firmware_version: '6.0',
    short_fw: 6,
    registers: [
      {
        address: 303,
        modbus_reg_hex: '0x012F',
        slave: 1,
        reg_num: 1,
        format: 'uint',
        parameter_name: 'Device Slave ID',
        value_to_write: '1',
      },
    ],
  });

  assert.strictEqual(savedPreset1.data.preset.firmware_version, '6', 'Preset firmware_version must be standardized to integer short FW "6" without ".0"');
  assert.strictEqual(savedPreset1.data.preset.short_fw, 6, 'Preset short_fw must be integer 6');

  // Case B: Input without firmware_version, only short_fw = 2 (previously defaulted to '2.0')
  const savedPreset2 = await createPresetService.saveFinalConfig({
    so: 'SO/2026/QA-002',
    item_code: 'WSLRW-STH-01',
    sku: 'WSLRW-STH',
    name: '',
    firmware_version: '',
    short_fw: 2,
    registers: [
      {
        address: 303,
        modbus_reg_hex: '0x012F',
        slave: 1,
        reg_num: 1,
        format: 'uint',
        parameter_name: 'Tx Interval',
        value_to_write: '600',
      },
    ],
  });

  assert.strictEqual(savedPreset2.data.preset.firmware_version, '2', 'Defaulted preset firmware_version must be "2" (never "2.0")');
  assert.strictEqual(savedPreset2.data.preset.short_fw, 2, 'Preset short_fw must be integer 2');

  // Case C: Sync from Preset into Devices
  const fcmRepo = new FinalConfigManagerRepository(undefined, createPresetRepo);
  const fcmService = new FinalConfigManagerService(fcmRepo);

  const syncRes = await fcmService.syncFromPreset({
    so: 'SO/2026/QA-001',
    item_code: 'WSLRW-ATH-01',
    serial_numbers: ['QA-SN-2026001'],
    operator: 'qa_specialist',
  });
  assert.strictEqual(syncRes.success, true);
  assert.strictEqual(syncRes.createdCount, 1);

  const deviceRecord = await fcmService.getDeviceBySerialNumber('QA-SN-2026001', 'WSLRW-ATH-01');
  assert.strictEqual(deviceRecord.success, true);
  assert.strictEqual(deviceRecord.data.device.firmware_version, '6', 'Synced device firmware_version must be "6"');
  assert.strictEqual(deviceRecord.data.device.short_fw, 6, 'Synced device short_fw must be 6');

  // Case D: Direct saveOrUpdateDevice with raw 'v1.0.0'
  const directDev = await fcmService.saveDevice({
    serial_number: 'QA-SN-DIRECT',
    item_code: 'WSLRW-ATH-01',
    so: 'SO/2026/QA-001',
    sku: 'WSLRW-ATH',
    firmware_version: 'v1.0.0',
    status: 'NONE' as any,
  });
  assert.strictEqual(directDev.data.firmware_version, '1', 'Direct saved device firmware_version must be standardized to "1"');
  assert.strictEqual(directDev.data.short_fw, 1, 'Direct saved device short_fw must be 1');

  console.log('  -> PASS: Backend service, repository & sync flows standardize firmware_version to integer short FW.\n');
  passed++;

  // ----------------------------------------------------------------------------------------
  // TEST 6: Frontend Tabulator Columns and Modal Binding Standardized
  // ----------------------------------------------------------------------------------------
  console.log('[TEST 6] Verifying C-Module UI Tabulator columns & Modals sanitizeFw formatting...');
  const fcmUiPath = path.resolve(__dirname, '../src/views/control-panel-modules/final-config-manager.module.ts');
  const fcmUiContent = fs.readFileSync(fcmUiPath, 'utf8');

  // Check sanitizeFw helper exists in module
  assert.ok(fcmUiContent.includes('export function sanitizeFw'), 'final-config-manager.module.ts must export sanitizeFw');
  assert.ok(fcmUiContent.includes('function sanitizeFw(rawFw)'), 'final-config-manager.module.ts script must include sanitizeFw');

  // Check Tabulator Presets column Firmware uses sanitizeFw
  assert.ok(
    fcmUiContent.includes("const cleanFw = sanitizeFw(val || row.short_fw);"),
    'Tabulator Presets & Devices columns must format firmware_version with sanitizeFw'
  );

  // Check Tabulator Devices column Firmware exists
  assert.ok(
    fcmUiContent.includes("title: 'Firmware'") && fcmUiContent.includes("field: 'firmware_version'"),
    'Tabulator Devices table must have a Firmware column'
  );

  // Check Modals sanitizeFw binding
  assert.ok(
    fcmUiContent.includes('sanitizeFw(fcmSelectedPreset?.firmware_version || fcmSelectedPreset?.short_fw)'),
    'Preset modal must format FW using sanitizeFw'
  );
  assert.ok(
    fcmUiContent.includes('sanitizeFw(fcmSelectedDevice?.firmware_version || fcmSelectedDevice?.short_fw)'),
    'Device modal must format FW using sanitizeFw'
  );
  assert.ok(
    fcmUiContent.includes('sanitizeFw(fcmPresetToDelete?.firmware_version || fcmPresetToDelete?.short_fw)'),
    'Delete Preset modal must format FW using sanitizeFw'
  );

  console.log('  -> PASS: Frontend Tabulator formatters and modals verified.\n');
  passed++;

  // ----------------------------------------------------------------------------------------
  // TEST 7: Database DDL Script 22 Verification
  // ----------------------------------------------------------------------------------------
  console.log('[TEST 7] Verifying DDL Migration 22 (deploy/database/updates/22_standardize_firmware_version_integer.sql)...');
  const ddl22Path = path.resolve(__dirname, '../../deploy/database/updates/22_standardize_firmware_version_integer.sql');
  assert.ok(fs.existsSync(ddl22Path), 'Migration 22 SQL file must exist in deploy/database/updates/');
  const ddl22Content = fs.readFileSync(ddl22Path, 'utf8');

  assert.ok(ddl22Content.includes('BEGIN;'), 'Migration 22 must be transactional (BEGIN)');
  assert.ok(ddl22Content.includes('COMMIT;'), 'Migration 22 must commit transaction (COMMIT)');
  assert.ok(ddl22Content.includes('UPDATE "final_config_presets"'), 'Migration 22 must update final_config_presets');
  assert.ok(ddl22Content.includes('UPDATE "final_config_sn"'), 'Migration 22 must update final_config_sn');
  assert.ok(ddl22Content.includes('UPDATE "device_tested"'), 'Migration 22 must update device_tested');
  assert.ok(ddl22Content.includes('REGEXP_REPLACE'), 'Migration 22 must strip regex patterns');
  assert.ok(ddl22Content.includes('idx_final_config_sn_firmware_version'), 'Migration 22 must index firmware_version');

  console.log('  -> PASS: DDL Migration 22 structure and indexes verified.\n');
  passed++;

  console.log('========================================================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passed}/${total} CHECKS SUCCESSFUL`);
  console.log('========================================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
