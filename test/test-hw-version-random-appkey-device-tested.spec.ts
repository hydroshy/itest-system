import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { C_MODULES_REGISTRY } from '../src/modules/c-modules/c-module-registry';
import { DeviceTestedEntity } from '../src/modules/c-modules/device-tested/entities/device-tested.entity';
import { FinalConfigSnEntity } from '../src/modules/c-modules/final-config-manager/entities/final-config-sn.entity';
import { DeviceTestedRepository } from '../src/modules/c-modules/device-tested/device-tested.repository';
import { DeviceTestedService } from '../src/modules/c-modules/device-tested/device-tested.service';
import { DeviceTestedController } from '../src/modules/c-modules/device-tested/device-tested.controller';
import { FinalConfigManagerRepository } from '../src/modules/c-modules/final-config-manager/final-config-manager.repository';
import { CONTROL_PANEL_HTML } from '../src/views/control-panel.view';

async function runTestSuite() {
  console.log('======================================================================');
  console.log('TEST SUITE: HW_VERSION, RANDOM APPKEY, 6-FIELD QA & C-MODULE DEVICE-TESTED');
  console.log('======================================================================\n');

  let passedTests = 0;
  const totalTests = 10;

  // --------------------------------------------------------------------
  // TEST 1: C_MODULES_REGISTRY Registration
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying C_MODULES_REGISTRY registration for c-device-tested...');
  const cMod = C_MODULES_REGISTRY.find(m => m.id === 'c-device-tested');
  assert.ok(cMod, 'c-device-tested must be registered in C_MODULES_REGISTRY');
  assert.strictEqual(cMod.code, 'C_MOD_DEVICE_TESTED');
  assert.strictEqual(cMod.routeHash, '#device-tested');
  assert.strictEqual(cMod.category, 'Governance');
  console.log('  -> PASS: c-device-tested registered in C_MODULES_REGISTRY (#device-tested, Governance)\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 2: DeviceTestedEntity & FinalConfigSnEntity schema
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying TypeORM Entities columns & aliases...');
  const dtEntity = new DeviceTestedEntity();
  dtEntity.device_key = '373137315832700E';
  assert.strictEqual(dtEntity.devEui, '373137315832700E');
  assert.strictEqual(dtEntity.deviceKey, '373137315832700E');

  dtEntity.so_number = 'SO/2026/01462';
  assert.strictEqual(dtEntity.soNumber, 'SO/2026/01462');

  dtEntity.fw_ver = '3F0819';
  assert.strictEqual(dtEntity.firmwareVersion, '3F0819');
  assert.strictEqual(dtEntity.fwVer, '3F0819');

  dtEntity.hw_ver = '1H';
  assert.strictEqual(dtEntity.hwVer, '1H');

  dtEntity.auto_check = 'PASS';
  dtEntity.result = 'PASS';

  const fcSnEntity = new FinalConfigSnEntity();
  fcSnEntity.app_key = 'A1B2C3D4E5F60718293A4B5C6D7E8F90';
  assert.strictEqual(fcSnEntity.appKey, 'A1B2C3D4E5F60718293A4B5C6D7E8F90');
  console.log('  -> PASS: Entity columns, getters/setters & app_key mappings verified\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 3: DeviceTestedRepository preloading from docs/device_tested.csv
  // --------------------------------------------------------------------
  console.log('[TEST 3] Verifying DeviceTestedRepository preloads docs/device_tested.csv...');
  const repo = new DeviceTestedRepository();
  const sampleDevice = await repo.findBySerialNumber('LRRS26000599');
  assert.ok(sampleDevice, 'LRRS26000599 from docs/device_tested.csv must be found in repo');
  assert.strictEqual(sampleDevice.device_key, '373137315832700E');
  assert.strictEqual(sampleDevice.item_code, 'WSLRW-IEC485-04-DC-RT');
  assert.strictEqual(sampleDevice.hw_ver, '1H');
  assert.strictEqual(sampleDevice.fw_ver, '3F0819');
  assert.strictEqual(sampleDevice.auto_check, 'PASS');
  assert.strictEqual(sampleDevice.result, 'PASS');
  console.log('  -> PASS: Preload & parsing from docs/device_tested.csv verified (LRRS26000599 loaded)\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 4: Strict 6-Field QA Verification in DeviceTestedService
  // --------------------------------------------------------------------
  console.log('[TEST 4] Verifying 6-Field QA Verification contract in DeviceTestedService.verify()...');
  const service = new DeviceTestedService(repo);

  // 4a. Matching all 6 fields
  const passRes = await service.verify({
    serial_number: 'LRRS26000599',
    device_key: '373137315832700E',
    item_code: 'WSLRW-IEC485-04-DC-RT',
    fw_ver: '3F0819',
    hw_ver: '1H',
    so: 'SO/2026/01462',
  });
  assert.strictEqual(passRes.verified, true);
  assert.strictEqual(passRes.success, true);
  assert.ok(passRes.message.includes('6-field validation passed'));

  // 4b. DevEUI mismatch
  const devKeyMismatch = await service.verify({
    serial_number: 'LRRS26000599',
    device_key: 'WRONGDEVEUI12345',
  });
  assert.strictEqual(devKeyMismatch.verified, false);
  assert.ok(devKeyMismatch.message.includes('Device Key mismatch'));

  // 4c. Item Code mismatch
  const itemMismatch = await service.verify({
    serial_number: 'LRRS26000599',
    item_code: 'WRONG-ITEM-CODE',
  });
  assert.strictEqual(itemMismatch.verified, false);
  assert.ok(itemMismatch.message.includes('Item Code mismatch'));

  // 4d. FW Version mismatch
  const fwMismatch = await service.verify({
    serial_number: 'LRRS26000599',
    fw_ver: '9.9.9',
  });
  assert.strictEqual(fwMismatch.verified, false);
  assert.ok(fwMismatch.message.includes('Firmware version mismatch'));

  // 4e. auto_check !== 'PASS'
  await repo.saveOrUpdate({
    serial_number: 'SN-TEST-FAIL-AC',
    item_code: 'WSLRW-01',
    so_number: 'SO/TEST/01',
    device_key: '1122334455667788',
    fw_ver: '1.0',
    auto_check: 'FAIL',
    result: 'PASS',
  });
  const autoFailRes = await service.verify({
    serial_number: 'SN-TEST-FAIL-AC',
  });
  assert.strictEqual(autoFailRes.verified, false);
  assert.ok(autoFailRes.message.includes('auto_check'));

  // 4f. result !== 'PASS'
  await repo.saveOrUpdate({
    serial_number: 'SN-TEST-FAIL-RES',
    item_code: 'WSLRW-01',
    so_number: 'SO/TEST/01',
    device_key: '1122334455667799',
    fw_ver: '1.0',
    auto_check: 'PASS',
    result: 'FAIL',
  });
  const resFailRes = await service.verify({
    serial_number: 'SN-TEST-FAIL-RES',
  });
  assert.strictEqual(resFailRes.verified, false);
  assert.ok(resFailRes.message.includes('QA test result status'));

  console.log('  -> PASS: 6-field strict validation verified (all rejection conditions tested)\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 5: Tree View API grouping by Sales Order
  // --------------------------------------------------------------------
  console.log('[TEST 5] Verifying Tree View API grouping by Sales Order...');
  const treeRes = await service.getTree();
  assert.strictEqual(treeRes.success, true);
  assert.ok(Array.isArray(treeRes.data));
  assert.ok(treeRes.data.length > 0);

  const so1462 = treeRes.data.find(g => g.so_number === 'SO/2026/01462');
  assert.ok(so1462, 'SO/2026/01462 group must exist');
  assert.ok(so1462.total_devices > 0);
  assert.ok(so1462.pass_count > 0);
  assert.ok(so1462.devices.some(d => d.serial_number === 'LRRS26000599'));
  console.log('  -> PASS: Tree view grouping by SO & calculation of pass/fail counts verified\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 6: CSV Import API and parsing
  // --------------------------------------------------------------------
  console.log('[TEST 6] Verifying CSV Import API parsing and bulk upsert...');
  const sampleCsv = `device_key,serial_number,item_code,so_number,sku,hw_ver,fw_ver,result,auto_check
AABBCCDDEEFF0011,SN-CSV-IMPORT-01,WSLRW-TEST-01,SO/CSV/01,WSLRW,2A,1.2.3,PASS,PASS
AABBCCDDEEFF0022,SN-CSV-IMPORT-02,WSLRW-TEST-01,SO/CSV/01,WSLRW,2A,1.2.3,FAIL,PASS`;

  const importRes = await service.importCsv(sampleCsv);
  assert.strictEqual(importRes.success, true);
  assert.strictEqual(importRes.data.total, 2);

  const imported1 = await repo.findBySerialNumber('SN-CSV-IMPORT-01');
  assert.ok(imported1);
  assert.strictEqual(imported1.device_key, 'AABBCCDDEEFF0011');
  assert.strictEqual(imported1.hw_ver, '2A');
  console.log('  -> PASS: CSV import parsed, validated and bulk saved\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 7: LoRaWAN AppKey update contract
  // --------------------------------------------------------------------
  console.log('[TEST 7] Verifying PATCH /api/device-tested/:serialNumber/app-key...');
  const patchRes = await service.updateAppKey('LRRS26000599', '2B7E151628AED2A6ABF7158809CF4F3C');
  assert.strictEqual(patchRes.success, true);
  assert.strictEqual(patchRes.data?.app_key, '2B7E151628AED2A6ABF7158809CF4F3C');

  const reloaded = await repo.findBySerialNumber('LRRS26000599');
  assert.strictEqual(reloaded?.app_key, '2B7E151628AED2A6ABF7158809CF4F3C');
  console.log('  -> PASS: AppKey successfully updated on tested device record\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 8: FinalConfigSnEntity & AppKey persistence in FinalConfigManager
  // --------------------------------------------------------------------
  console.log('[TEST 8] Verifying AppKey persistence in FinalConfigManagerRepository...');
  const fcRepo = new FinalConfigManagerRepository();
  const savedSn = await fcRepo.saveOrUpdateDevice({
    serial_number: 'LRRS26000599',
    item_code: 'WSLRW-IEC485-04-DC-RT',
    so: 'SO/2026/01462',
    sku: 'WSLRW-IEC485',
    dev_eui: '373137315832700E',
    app_key: '2B7E151628AED2A6ABF7158809CF4F3C',
    status: 'PASS' as any,
  });
  assert.strictEqual(savedSn.device.app_key, '2B7E151628AED2A6ABF7158809CF4F3C');
  console.log('  -> PASS: final_config_sn successfully stores app_key\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 9: D-Module final-config-device (HW_VERSION, AppKey & Work Order strip)
  // --------------------------------------------------------------------
  console.log('[TEST 9] Verifying D-Module final-config-device frontend specifications...');
  const dViewsPath = path.resolve(__dirname, '../src/views/dashboard-modules/final-config-device.module.ts');
  const dFrontPath = path.resolve(__dirname, '../src/frontend/modules/dashboard/final-config-device.module.ts');
  const dViewsCode = fs.readFileSync(dViewsPath, 'utf8');
  const dFrontCode = fs.readFileSync(dFrontPath, 'utf8');

  // 9a. 1:1 sync
  assert.strictEqual(dViewsCode, dFrontCode, 'final-config-device.module.ts must be 100% synchronized');

  // 9b. Work order strip only after 25%
  assert.ok(dViewsCode.includes('v-if="fcProgress >= 25"'), 'Work Order strip must have v-if="fcProgress >= 25"');
  assert.ok(dViewsCode.includes('SERIAL NUMBER'), 'Work Order strip must contain SERIAL NUMBER label');
  assert.ok(dViewsCode.includes('SALES ORDER (SO)'), 'Work Order strip must contain SALES ORDER (SO) label');
  assert.ok(dViewsCode.includes('v-model="fcSerialNumberInput"'), 'Must bind v-model="fcSerialNumberInput"');
  assert.ok(dViewsCode.includes('v-model="fcSelectedSo"'), 'Must bind v-model="fcSelectedSo"');
  assert.ok(dViewsCode.includes('Work Order & Serial Number will automatically appear after Stage 1'), 'Must render pre-25% placeholder banner');

  // 9c. Stage 1 HW_VERSION (Reg 9, len 2)
  assert.ok(dViewsCode.includes('readModbusRegistersFromPort(1, 9, 2)'), 'Stage 1 must read Reg 9 with len 2 words');
  assert.ok(dViewsCode.includes('fcHardwareInfo.value.hwVersion'), 'Must store HW version into fcHardwareInfo.value.hwVersion');

  // 9d. Stage 2 Random 128-bit AppKey & Reg 274
  assert.ok(dViewsCode.includes('crypto.getRandomValues'), 'Stage 2 must use crypto.getRandomValues for 128-bit LoRaWAN AppKey');
  assert.ok(dViewsCode.includes('readModbusRegistersFromPort(1, 16, 274, 8') || dViewsCode.includes('274, 8'), 'Stage 2 must write to Reg 274 (8 words)');

  // 9e. Stage 3 Reg 9 & Reg 274 audit snapshot
  assert.ok(dViewsCode.includes('address: 9'), 'Stage 3 must audit Reg 9');
  assert.ok(dViewsCode.includes('address: 274'), 'Stage 3 must audit Reg 274');

  // 9f. Stage 4 patch app_key
  assert.ok(dViewsCode.includes('/api/device-tested/') && dViewsCode.includes('/app-key'), 'Stage 4 must patch app_key to device_tested');
  console.log('  -> PASS: D-Module final-config-device specifications fully verified\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 10: C-Module device-tested UI & Control Panel Integration
  // --------------------------------------------------------------------
  console.log('[TEST 10] Verifying C-Module device-tested UI & Control Panel Integration...');
  const cViewsPath = path.resolve(__dirname, '../src/views/control-panel-modules/device-tested.module.ts');
  const cFrontPath = path.resolve(__dirname, '../src/frontend/modules/control-panel/device-tested.module.ts');
  const cViewsCode = fs.readFileSync(cViewsPath, 'utf8');
  const cFrontCode = fs.readFileSync(cFrontPath, 'utf8');

  // 10a. 1:1 sync
  assert.strictEqual(cViewsCode, cFrontCode, 'device-tested.module.ts must be 100% synchronized');

  // 10b. Template & Components
  assert.ok(cViewsCode.includes('Device Tested Catalog (QA Inspection)'), 'Must include module title');
  assert.ok(cViewsCode.includes('Import QA CSV'), 'Must include Import QA CSV action');
  assert.ok(cViewsCode.includes('dtFilteredTreeGroups'), 'Must render Tree View groups');
  assert.ok(cViewsCode.includes('soGroup.so_number'), 'Must group by soGroup.so_number');
  assert.ok(cViewsCode.includes('dev.serial_number'), 'Must render device serial_number');
  assert.ok(cViewsCode.includes('dev.device_key'), 'Must render device device_key');
  assert.ok(cViewsCode.includes('dev.auto_check'), 'Must render auto_check status');
  assert.ok(cViewsCode.includes('dev.result'), 'Must render result status');
  assert.ok(cViewsCode.includes('useDeviceTestedModule'), 'Script must define useDeviceTestedModule');

  // 10c. Control Panel View integration
  assert.ok(CONTROL_PANEL_HTML.includes('device-tested'), 'Control Panel HTML must include device-tested tab');
  assert.ok(CONTROL_PANEL_HTML.includes('Tested Devices (QA)'), 'Control Panel HTML must include navigation label');
  console.log('  -> PASS: C-Module device-tested UI & Control Panel integration verified\n');
  passedTests++;

  console.log('======================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} CHECKS SUCCESSFUL`);
  console.log('======================================================================');
}

runTestSuite().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
