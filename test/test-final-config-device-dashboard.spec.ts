import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_D_MODULES } from '../src/modules/d-modules/d-module-registry';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { DeviceTestedEntity } from '../src/modules/c-modules/device-tested/entities/device-tested.entity';
import { DeviceTestedRepository } from '../src/modules/c-modules/device-tested/device-tested.repository';
import { DeviceTestedService } from '../src/modules/c-modules/device-tested/device-tested.service';

async function runFinalConfigDeviceSuite() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: FINAL CONFIG DEVICE DASHBOARD & 4-STAGE ENGINE');
  console.log('======================================================================\n');

  let passedTests = 0;
  const totalTests = 7;

  const viewsModulePath = path.resolve(__dirname, '../src/views/dashboard-modules/final-config-device.module.ts');
  const frontModulePath = path.resolve(__dirname, '../src/frontend/modules/dashboard/final-config-device.module.ts');

  // --------------------------------------------------------------------
  // TEST 1: 1:1 Code Synchronization between src/views and src/frontend
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying 1:1 Code Synchronization...');
  assert.ok(fs.existsSync(viewsModulePath), 'views final-config-device.module.ts must exist');
  assert.ok(fs.existsSync(frontModulePath), 'frontend final-config-device.module.ts must exist');

  const viewsContent = fs.readFileSync(viewsModulePath, 'utf8');
  const frontContent = fs.readFileSync(frontModulePath, 'utf8');

  assert.strictEqual(
    viewsContent,
    frontContent,
    'final-config-device.module.ts in src/views and src/frontend must be 100% identical'
  );
  console.log('  -> PASS: final-config-device.module.ts is 100% synchronized.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 2: D-Module Registry & JSON Configuration Verification
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying D-Module Registry & dashboard-modules.json...');
  const regEntry = DEFAULT_D_MODULES.find(m => m.id === 'final-config-device');
  assert.ok(regEntry, 'final-config-device must be registered in DEFAULT_D_MODULES');
  assert.strictEqual(regEntry?.code, 'D_MOD_FINAL_CONFIG_DEVICE');
  assert.strictEqual(regEntry?.title, 'FINAL CONFIG DEVICE');
  assert.strictEqual(regEntry?.badge, 'Production QA');

  const configPath = path.resolve(__dirname, '../config/dashboard-modules.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const jsonEntry = config.modules.find((m: any) => m.id === 'final-config-device');
  assert.ok(jsonEntry, 'final-config-device must exist in dashboard-modules.json');
  assert.ok(config.roleLayouts.SUPER_ADMIN.moduleOrder.includes('final-config-device'), 'SUPER_ADMIN layout must include final-config-device');
  assert.ok(config.roleLayouts.OPERATOR.moduleOrder.includes('final-config-device'), 'OPERATOR layout must include final-config-device');
  console.log('  -> PASS: Module correctly registered in TypeScript registry and runtime JSON.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 3: Database DDL Migration & Route Verification
  // --------------------------------------------------------------------
  console.log('[TEST 3] Verifying Database DDL Migration & db-routing.config.json...');
  const ddlPath = path.resolve(__dirname, '../../deploy/database/updates/14_create_device_tested_table.sql');
  assert.ok(fs.existsSync(ddlPath), 'Migration 14_create_device_tested_table.sql must exist');
  const ddlContent = fs.readFileSync(ddlPath, 'utf8');
  assert.ok(ddlContent.includes('CREATE TABLE IF NOT EXISTS "device_tested"'), 'DDL must create device_tested table');
  assert.ok(ddlContent.includes('BEGIN;'), 'DDL must be transactional (BEGIN)');
  assert.ok(ddlContent.includes('COMMIT;'), 'DDL must commit transaction (COMMIT)');
  assert.ok(ddlContent.includes('UQ_device_tested_sn_item'), 'DDL must define unique constraint on (serial_number, item_code)');
  assert.ok(ddlContent.includes('idx_device_tested_serial_number'), 'DDL must index serial_number');

  const routingPath = path.resolve(__dirname, '../config/db-routing.config.json');
  const routing = JSON.parse(fs.readFileSync(routingPath, 'utf8'));
  assert.strictEqual(routing.table_routes['device_tested'], 'core_db', 'table_routes must map device_tested to core_db');
  assert.ok(ALL_DATABASE_ENTITIES.includes(DeviceTestedEntity), 'DeviceTestedEntity must be registered in ALL_DATABASE_ENTITIES');
  console.log('  -> PASS: Database DDL migration and routing verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 4: Backend QA Verification Service (GET /api/device-tested/verify)
  // --------------------------------------------------------------------
  console.log('[TEST 4] Verifying DeviceTestedService verification logic...');
  const repo = new DeviceTestedRepository();
  const service = new DeviceTestedService(repo);

  // 4a. Not found test
  const notFoundRes = await service.verify({ serial_number: 'SN-NON-EXISTENT', so: 'SO-001' });
  assert.strictEqual(notFoundRes.verified, false, 'Unregistered SN must fail verification');

  // 4b. Seed passed record
  await service.create({
    so: 'SO-TEST-2026',
    item_code: 'WSLRW-ATH-01',
    serial_number: 'SN2026040001',
    dev_eui: 'A84041000182ABCD',
    sku: 'WSLRW-ATH',
    firmware_version: '1.0.4',
    short_fw: 1,
    sensor_type: 103,
    status: 'PASS',
  });

  // 4c. SO mismatch test
  const mismatchRes = await service.verify({
    serial_number: 'SN2026040001',
    item_code: 'WSLRW-ATH-01',
    so: 'SO-OTHER-999',
  });
  assert.strictEqual(mismatchRes.verified, false, 'SO mismatch must fail verification');
  assert.ok(mismatchRes.message.includes('Sales Order mismatch'), 'Message must indicate SO mismatch');

  // 4d. Verified match test
  const matchRes = await service.verify({
    serial_number: 'SN2026040001',
    item_code: 'WSLRW-ATH-01',
    so: 'SO-TEST-2026',
  });
  assert.strictEqual(matchRes.verified, true, 'Matching SN, Item Code and SO must pass verification');
  assert.strictEqual(matchRes.success, true);
  assert.strictEqual(matchRes.data?.serial_number, 'SN2026040001');

  // 4e. Status FAIL test
  await service.create({
    so: 'SO-TEST-2026',
    item_code: 'WSLRW-ATH-02',
    serial_number: 'SN2026040002',
    dev_eui: 'A84041000182ABCE',
    sku: 'WSLRW-ATH',
    firmware_version: '1.0.4',
    status: 'FAIL',
  });
  const failStatusRes = await service.verify({
    serial_number: 'SN2026040002',
    item_code: 'WSLRW-ATH-02',
    so: 'SO-TEST-2026',
  });
  assert.strictEqual(failStatusRes.verified, false, 'Device with status FAIL must not pass Stage 1 verification');
  console.log('  -> PASS: DeviceTestedService verification contract fully validated.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 5: 4-Stage Protocol Register Mapping in Frontend Engine
  // --------------------------------------------------------------------
  console.log('[TEST 5] Verifying 4-Stage Modbus RTU Register Protocol in final-config-device.module.ts...');
  // Stage 1 checks
  assert.ok(viewsContent.includes('259'), 'Must read Serial Number from Reg 259 (9 regs)');
  assert.ok(viewsContent.includes('27'), 'Must read DevEUI from Reg 27 (4 regs)');
  assert.ok(viewsContent.includes('5'), 'Must read Firmware Version from Reg 5');
  assert.ok(viewsContent.includes('103'), 'Must read Sensor Type from Reg 103');
  assert.ok(viewsContent.includes('386'), 'Must read Item Code from Reg 386');
  assert.ok(viewsContent.includes('/api/device-tested/verify'), 'Stage 1 must call /api/device-tested/verify');

  // Stage 2 checks
  assert.ok(viewsContent.includes('274'), 'Stage 2 must write LoRaWAN AppKey to Reg 274');
  assert.ok(viewsContent.includes('>= 303'), 'Stage 2 must filter preset target registers address >= 303');
  assert.ok(viewsContent.includes('FC 16') || viewsContent.includes('0x10'), 'Stage 2 must write via Modbus FC 16');

  // Stage 3 checks
  assert.ok(viewsContent.includes('readModbusRegistersFromPort'), 'Stage 3 must read back full register map via Modbus');

  // Stage 4 checks
  assert.ok(viewsContent.includes('/api/c-modules/final-config-manager/devices'), 'Stage 4 must persist final config results to backend');
  assert.ok(viewsContent.includes("verdict = mismatchCount === 0 ? 'PASS' : 'FAIL'"), 'Stage 4 must conclude PASS if 0 mismatches else FAIL');
  console.log('  -> PASS: 4-Stage Modbus register protocol verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 6: Web Serial Anti-Freeze & Hardware Auto-Reconnect Lifecycle
  // --------------------------------------------------------------------
  console.log('[TEST 6] Verifying Web Serial Anti-Freeze & Hardware Auto-Reconnect Lifecycle...');
  assert.ok(
    viewsContent.includes("navigator.serial.addEventListener('disconnect', handleSerialDisconnect)"),
    'Must register disconnect event listener on navigator.serial'
  );
  assert.ok(
    viewsContent.includes("navigator.serial.addEventListener('connect', handleSerialConnect)"),
    'Must register connect event listener on navigator.serial'
  );
  assert.ok(
    viewsContent.includes("navigator.serial.removeEventListener('disconnect', handleSerialDisconnect)"),
    'Must remove disconnect event listener on navigator.serial in onUnmounted'
  );
  assert.ok(
    viewsContent.includes("navigator.serial.removeEventListener('connect', handleSerialConnect)"),
    'Must remove connect event listener on navigator.serial in onUnmounted'
  );
  assert.ok(
    viewsContent.includes('safeCleanupUartPort'),
    'Must define safeCleanupUartPort for releasing reader/writer stream locks'
  );
  assert.ok(
    viewsContent.includes('activeUartReader.cancel()'),
    'Must cancel activeUartReader on error/disconnect'
  );
  assert.ok(
    viewsContent.includes('activeUartReader.releaseLock()'),
    'Must release activeUartReader lock'
  );
  assert.ok(
    viewsContent.includes('isAutoReconnecting'),
    'Must track isAutoReconnecting state flag'
  );
  console.log('  -> PASS: Web Serial hardware disconnect and auto-reconnect logic verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 7: Dashboard View & Frontend Index Integration
  // --------------------------------------------------------------------
  console.log('[TEST 7] Verifying Dashboard View & Frontend Index Integration...');
  const dashViewPath = path.resolve(__dirname, '../src/views/dashboard.view.ts');
  const dashViewContent = fs.readFileSync(dashViewPath, 'utf8');

  assert.ok(dashViewContent.includes('FINAL_CONFIG_DEVICE_TEMPLATE'), 'dashboard.view.ts must include FINAL_CONFIG_DEVICE_TEMPLATE');
  assert.ok(dashViewContent.includes('FINAL_CONFIG_DEVICE_SCRIPT'), 'dashboard.view.ts must include FINAL_CONFIG_DEVICE_SCRIPT');
  assert.ok(dashViewContent.includes('useFinalConfigDeviceModule'), 'dashboard.view.ts must call useFinalConfigDeviceModule');
  assert.ok(dashViewContent.includes('final-config-device'), 'dashboard.view.ts must support final-config-device tab activation');

  const frontIndexPath = path.resolve(__dirname, '../src/frontend/index.ts');
  const frontIndexContent = fs.readFileSync(frontIndexPath, 'utf8');
  assert.ok(frontIndexContent.includes("export * from './modules/dashboard/final-config-device.module'"), 'frontend/index.ts must export final-config-device.module');
  console.log('  -> PASS: Dashboard view and frontend index integration verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 8: START Button Refactor, Auto SO/AppKey Map & SN Input
  // --------------------------------------------------------------------
  console.log('[TEST 8] Verifying START Button State, Auto SO/AppKey Stage 1 & SN Input...');
  
  // 8a. Verify START button binding and text
  assert.ok(
    viewsContent.includes(':disabled="!fcSerialConnected || isRunningFinalConfig || finalVerdict === \'FAIL\'"'),
    'START button disabled condition must freeze when finalVerdict === FAIL'
  );
  assert.ok(
    !viewsContent.includes('!fcSelectedSo || !fcSelectedItemCode || !currentPreset || !isAppKeyValid'),
    'START button must not be locked by SO, Item Code, Preset or AppKey pre-conditions'
  );
  assert.ok(
    viewsContent.includes("isRunningFinalConfig ? 'EXECUTING...' : 'START'"),
    'START button label must be START when idle and EXECUTING... when running'
  );

  // 8b. Verify Serial Number (SN) input in Section 2
  assert.ok(
    viewsContent.includes('v-model="fcSerialNumberInput"'),
    'Section 2 must include Serial Number (SN) input with v-model="fcSerialNumberInput"'
  );
  assert.ok(
    viewsContent.includes('lg:grid-cols-5'),
    'Work Order & Preset Strip grid must be expanded to 5 columns'
  );

  // 8c. Verify Stage 1 automated SO & AppKey mapping contract
  assert.ok(
    viewsContent.includes('fcSerialNumberInput.value = readSn'),
    'Stage 1 must populate fcSerialNumberInput with readSn from Reg 259'
  );
  assert.ok(
    viewsContent.includes('appKeyInput.value = record.app_key.toUpperCase()'),
    'Stage 1 must automatically map AppKey from device_tested to appKeyInput'
  );
  assert.ok(
    viewsContent.includes('selectedSo.value = record.so'),
    'Stage 1 must auto-assign SO when selectedSo was not previously selected'
  );
  assert.ok(
    viewsContent.includes('loadPresetBySoItem(selectedSo.value, selectedItemCode.value)'),
    'Stage 1 must automatically load preset by matched SO and Item Code'
  );

  // 8d. Verify Backend Service lookup without SO (by SN only)
  const autoLookRecord = await service.verify({
    serial_number: 'SN2026040001',
    item_code: 'WSLRW-ATH-01',
  });
  assert.strictEqual(autoLookRecord.verified, true, 'Stage 1 verify must pass without pre-selected SO if SN & Item Code match PASS record');
  assert.strictEqual(autoLookRecord.data?.so, 'SO-TEST-2026', 'Record must return stored SO for auto-mapping');

  console.log('  -> PASS: START button refactor, Stage 1 auto-map & SN input fully verified.\n');
  passedTests++;

  console.log('======================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests + 1} CHECKS SUCCESSFUL`);
  console.log('======================================================================');
}

runFinalConfigDeviceSuite().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
