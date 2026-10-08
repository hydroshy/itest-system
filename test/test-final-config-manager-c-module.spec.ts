import * as fs from 'fs';
import * as path from 'path';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { C_MODULES_REGISTRY } from '../src/modules/c-modules/c-module-registry';
import { ALL_DATABASE_ENTITIES as BACKEND_ALL_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { ALL_DATABASE_ENTITIES as MODULES_ALL_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { FinalConfigSnEntity } from '../src/modules/c-modules/final-config-manager/entities/final-config-sn.entity';
import { FinalConfigRegsSnEntity } from '../src/modules/c-modules/final-config-manager/entities/final-config-regs-sn.entity';
import { FinalConfigManagerRepository } from '../src/modules/c-modules/final-config-manager/final-config-manager.repository';
import { FinalConfigManagerService } from '../src/modules/c-modules/final-config-manager/final-config-manager.service';
import { FinalConfigManagerController } from '../src/modules/c-modules/final-config-manager/final-config-manager.controller';
import { CreateFinalConfigRepository } from '../src/modules/c-modules/create-final-config/create-final-config.repository';
import { CreateFinalConfigService } from '../src/modules/c-modules/create-final-config/create-final-config.service';
import { DeviceRegisterDto } from '../src/modules/c-modules/final-config-manager/dto/final-config-manager.dto';
import {
  FINAL_CONFIG_MANAGER_TEMPLATE,
  FINAL_CONFIG_MANAGER_MODALS,
  FINAL_CONFIG_MANAGER_SCRIPT,
} from '../src/views/control-panel-modules/final-config-manager.module';

async function runTestSuite() {
  console.log('======================================================================');
  console.log('SUITE: C-MODULE FINAL CONFIG MANAGER (BACKEND & UI 2-TAB TABULATOR)');
  console.log('======================================================================\n');

  let passedTests = 0;
  const totalTests = 8;

  // -------------------------------------------------------------------
  // TEST 1: C_MODULES_REGISTRY Registration
  // -------------------------------------------------------------------
  console.log('[TEST 1] Verifying C_MODULES_REGISTRY registration...');
  const entry = C_MODULES_REGISTRY.find((m) => m.id === 'c-final-config-manager');
  if (!entry) {
    throw new Error('FAILED: c-final-config-manager not found in C_MODULES_REGISTRY');
  }
  if (entry.code !== 'C_MOD_FINAL_CONFIG_MANAGER') {
    throw new Error(`FAILED: Expected code C_MOD_FINAL_CONFIG_MANAGER, got ${entry.code}`);
  }
  if (entry.routeHash !== '#final-config-manager') {
    throw new Error(`FAILED: Expected routeHash #final-config-manager, got ${entry.routeHash}`);
  }
  if (entry.category !== 'Governance') {
    throw new Error(`FAILED: Expected category Governance, got ${entry.category}`);
  }
  if (entry.title !== 'Final Config Manager') {
    throw new Error(`FAILED: Expected title Final Config Manager, got ${entry.title}`);
  }
  console.log('  -> PASS: c-final-config-manager registered in C_MODULES_REGISTRY (#final-config-manager, Governance)');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 2: TypeORM Entities & Database Routing
  // -------------------------------------------------------------------
  console.log('\n[TEST 2] Verifying TypeORM Entities & db-routing.config.json...');
  const backendHasSn = BACKEND_ALL_ENTITIES.includes(FinalConfigSnEntity);
  const backendHasRegsSn = BACKEND_ALL_ENTITIES.includes(FinalConfigRegsSnEntity);
  const modulesHasSn = MODULES_ALL_ENTITIES.includes(FinalConfigSnEntity);
  const modulesHasRegsSn = MODULES_ALL_ENTITIES.includes(FinalConfigRegsSnEntity);

  if (!backendHasSn || !backendHasRegsSn || !modulesHasSn || !modulesHasRegsSn) {
    throw new Error('FAILED: FinalConfigSnEntity or FinalConfigRegsSnEntity missing from ALL_DATABASE_ENTITIES');
  }

  const routingPath = path.join(__dirname, '../config/db-routing.config.json');
  const routing = JSON.parse(fs.readFileSync(routingPath, 'utf8'));
  if (
    routing.table_routes['final_config_sn'] !== 'core_db' ||
    routing.table_routes['final_config_regs_sn'] !== 'core_db'
  ) {
    throw new Error('FAILED: final_config_sn or final_config_regs_sn missing from table_routes in db-routing.config.json');
  }
  console.log('  -> PASS: FinalConfigSnEntity & FinalConfigRegsSnEntity registered and routed to core_db');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 3: Backend Service, Repository & Preset Lookup Flow
  // -------------------------------------------------------------------
  console.log('\n[TEST 3] Verifying Backend Service, Repository & Preset Lookup flow...');
  const createPresetRepo = new CreateFinalConfigRepository();
  const createPresetService = new CreateFinalConfigService(createPresetRepo);

  // Setup a test preset
  await createPresetService.saveFinalConfig({
    so: 'SO/2026/FCM-001',
    item_code: 'WSLRW-FCM-01',
    sku: 'WSLRW-FCM',
    firmware_version: '2.0',
    short_fw: 2,
    name: '[Final Config] SO/2026/FCM-001 - WSLRW-FCM-01',
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
      {
        address: 304,
        modbus_reg_hex: '0x0130',
        slave: 1,
        reg_num: 2,
        format: 'uint',
        parameter_name: 'Tx Interval',
        value_to_write: '300',
      },
    ],
  });

  const fcmRepo = new FinalConfigManagerRepository(undefined, createPresetRepo);
  const fcmService = new FinalConfigManagerService(fcmRepo);

  // Verify Core Requirement: GET /presets/by-so-item
  const presetRes = await fcmService.getPresetBySoItem('SO/2026/FCM-001', 'WSLRW-FCM-01');
  if (!presetRes.success || !presetRes.data) {
    throw new Error('FAILED: getPresetBySoItem could not retrieve preset');
  }
  if (presetRes.data.registers.length !== 2) {
    throw new Error(`FAILED: Expected 2 registers, got ${presetRes.data.registers.length}`);
  }
  console.log('  -> PASS: Core lookup GET /presets/by-so-item successfully retrieved preset and registers');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 4: Device Records Persistence & Sync from Preset
  // -------------------------------------------------------------------
  console.log('\n[TEST 4] Verifying Device Records Persistence & Sync from Preset...');
  // Batch sync SNs from preset
  const syncRes = await fcmService.syncFromPreset({
    so: 'SO/2026/FCM-001',
    item_code: 'WSLRW-FCM-01',
    serial_numbers: ['DVTSN-2026001', 'DVTSN-2026002', 'DVTSN-2026003'],
    operator: 'qa_engineer',
  });

  if (!syncRes.success || syncRes.createdCount !== 3) {
    throw new Error(`FAILED: Expected 3 created devices, got ${syncRes.createdCount}`);
  }

  // Lookup device by SN
  const dev1 = await fcmService.getDeviceBySerialNumber('DVTSN-2026001', 'WSLRW-FCM-01');
  if (!dev1.success || dev1.data.device.status !== 'NONE') {
    throw new Error(`FAILED: Expected initial status NONE, got ${dev1.data.device.status}`);
  }
  if (dev1.data.registers.length !== 2) {
    throw new Error(`FAILED: Expected 2 synced registers on device, got ${dev1.data.registers.length}`);
  }

  // Update device status to PASS with readback values
  const updateRes = await fcmService.updateDeviceStatus(dev1.data.device.id, {
    status: 'PASS' as any,
    notes: 'Bench test 1 passed with 100% register match',
    operator: 'bench_tester_1',
    registers: [
      { address: 303, value_read_back: '1', status: 'PASS' as any },
      { address: 304, value_read_back: '300', status: 'PASS' as any },
    ],
  });

  if (!updateRes.success || updateRes.data.status !== 'PASS') {
    throw new Error(`FAILED: Expected updated status PASS, got ${updateRes.data.status}`);
  }
  if (updateRes.data.configured_regs_count !== 2) {
    throw new Error(`FAILED: Expected configured_regs_count 2, got ${updateRes.data.configured_regs_count}`);
  }

  // Set device 2 to FAIL
  const dev2 = await fcmService.getDeviceBySerialNumber('DVTSN-2026002', 'WSLRW-FCM-01');
  await fcmService.updateDeviceStatus(dev2.data.device.id, {
    status: 'FAIL' as any,
    notes: 'UART CRC mismatch on address 304',
    operator: 'bench_tester_1',
    registers: [
      { address: 303, value_read_back: '1', status: 'PASS' as any },
      { address: 304, value_read_back: '999', status: 'FAIL' as any },
    ],
  });

  // Query devices list with KPIs
  const devicesList = await fcmService.getDevices();
  if (devicesList.total !== 3) {
    throw new Error(`FAILED: Expected 3 devices total, got ${devicesList.total}`);
  }
  if (devicesList.kpis.pass !== 1 || devicesList.kpis.fail !== 1 || devicesList.kpis.none !== 1) {
    throw new Error(`FAILED: KPI mismatch: ${JSON.stringify(devicesList.kpis)}`);
  }

  console.log('  -> PASS: Sync from preset, device status updates, and KPI calculations (PASS: 1, FAIL: 1, NONE: 1) verified');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 5: Low-Range Registers (address >= 0, address 0 falsy fix, validation)
  // -------------------------------------------------------------------
  console.log('\n[TEST 5] Verifying Full Range Registers (address >= 0) and Address 0 handling...');

  // 5.1 DTO Validation: address >= 0 allowed, address < 0 rejected
  const validDto0 = plainToInstance(DeviceRegisterDto, { address: 0 });
  const validDto100 = plainToInstance(DeviceRegisterDto, { address: 100 });
  const invalidDtoNeg = plainToInstance(DeviceRegisterDto, { address: -1 });

  const errors0 = await validate(validDto0);
  const errors100 = await validate(validDto100);
  const errorsNeg = await validate(invalidDtoNeg);

  if (errors0.length > 0) {
    throw new Error(`FAILED: DeviceRegisterDto rejected address 0: ${JSON.stringify(errors0)}`);
  }
  if (errors100.length > 0) {
    throw new Error(`FAILED: DeviceRegisterDto rejected address 100: ${JSON.stringify(errors100)}`);
  }
  if (errorsNeg.length === 0) {
    throw new Error('FAILED: DeviceRegisterDto should reject address -1, but validation passed');
  }

  // 5.2 Direct Save Device with registers: address 0, 1, 100, 303, 304
  const devWithLowRegs = await fcmService.saveDevice({
    serial_number: 'DVTSN-2026-ALLREGS',
    item_code: 'WSLRW-FCM-01',
    sku: 'WSLRW-FCM',
    firmware_version: '2.0',
    short_fw: 2,
    operator: 'qa_engineer',
    registers: [
      {
        address: 0,
        modbus_reg_hex: '0x0000',
        slave: 1,
        reg_num: 1,
        format: 'uint',
        parameter_name: 'Device System Mode',
        value_to_write: '0',
      },
      {
        address: 1,
        modbus_reg_hex: '0x0001',
        slave: 1,
        reg_num: 2,
        format: 'uint',
        parameter_name: 'Battery Voltage',
        value_to_write: '3600',
      },
      {
        address: 100,
        modbus_reg_hex: '0x0064',
        slave: 1,
        reg_num: 1,
        format: 'int',
        parameter_name: 'Sensor Offset',
        value_to_write: '10',
      },
      {
        address: 303,
        modbus_reg_hex: '0x012F',
        slave: 1,
        reg_num: 1,
        format: 'uint',
        parameter_name: 'Device Slave ID',
        value_to_write: '1',
      },
      {
        address: 304,
        modbus_reg_hex: '0x0130',
        slave: 1,
        reg_num: 2,
        format: 'uint',
        parameter_name: 'Tx Interval',
        value_to_write: '300',
      },
    ],
  });

  if (!devWithLowRegs.success || !devWithLowRegs.registers) {
    throw new Error('FAILED: saveOrUpdateDevice failed for full range registers');
  }
  if (devWithLowRegs.registers.length !== 5) {
    throw new Error(`FAILED: Expected 5 registers saved, got ${devWithLowRegs.registers.length}`);
  }

  // Verify retrieval by SN
  const retrievedDev = await fcmService.getDeviceBySerialNumber('DVTSN-2026-ALLREGS', 'WSLRW-FCM-01');
  if (!retrievedDev.success || retrievedDev.data.registers.length !== 5) {
    throw new Error(`FAILED: Expected 5 registers retrieved, got ${retrievedDev.data?.registers?.length}`);
  }
  const addresses = retrievedDev.data.registers.map((r: any) => r.address).sort((a: number, b: number) => a - b);
  const expectedAddresses = [0, 1, 100, 303, 304];
  if (JSON.stringify(addresses) !== JSON.stringify(expectedAddresses)) {
    throw new Error(`FAILED: Addresses mismatch. Expected ${expectedAddresses}, got ${addresses}`);
  }

  // 5.3 Verify updateDeviceStatus on address 0 specifically (testing JavaScript falsy bug fix)
  const updateAddress0Res = await fcmService.updateDeviceStatus(retrievedDev.data.device.id, {
    status: 'PASS' as any,
    notes: 'Low range registers bench test passed including address 0',
    operator: 'bench_tester_low',
    registers: [
      { address: 0, value_read_back: '0', status: 'PASS' as any },
      { address: 1, value_read_back: '3600', status: 'PASS' as any },
      { address: 100, value_read_back: '10', status: 'PASS' as any },
      { address: 303, value_read_back: '1', status: 'PASS' as any },
      { address: 304, value_read_back: '300', status: 'PASS' as any },
    ],
  });

  if (!updateAddress0Res.success || updateAddress0Res.data.configured_regs_count !== 5) {
    throw new Error(
      `FAILED: Expected configured_regs_count 5 after updating address 0..304, got ${updateAddress0Res.data?.configured_regs_count}`
    );
  }

  const recheckDev = await fcmService.getDeviceBySerialNumber('DVTSN-2026-ALLREGS', 'WSLRW-FCM-01');
  const reg0 = recheckDev.data.registers.find((r: any) => r.address === 0);
  if (!reg0 || reg0.status !== 'PASS' || reg0.value_read_back !== '0') {
    throw new Error(`FAILED: Register address 0 status/readback not updated properly: ${JSON.stringify(reg0)}`);
  }

  console.log('  -> PASS: All registers (address 0, 1, 100, 303, 304) stored, retrieved, validated, and updated with address 0 falsy fix verified');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 6: Controller Endpoints Execution
  // -------------------------------------------------------------------
  console.log('\n[TEST 6] Verifying FinalConfigManagerController endpoints...');
  const controller = new FinalConfigManagerController(fcmService);

  const ctrlPresets = await controller.getPresets({});
  if (!ctrlPresets.success || ctrlPresets.data.length === 0) {
    throw new Error('FAILED: Controller getPresets returned empty');
  }

  const ctrlPresetLookup = await controller.getPresetBySoItem('SO/2026/FCM-001', 'WSLRW-FCM-01');
  if (!ctrlPresetLookup.success) {
    throw new Error('FAILED: Controller getPresetBySoItem failed');
  }

  const ctrlDevices = await controller.getDevices({});
  if (!ctrlDevices.success || ctrlDevices.data.length !== 4) {
    throw new Error(`FAILED: Controller getDevices expected 4 devices, got ${ctrlDevices?.data?.length}`);
  }

  const ctrlStats = await controller.getStats();
  if (!ctrlStats.success || ctrlStats.data.devicesCount !== 4) {
    throw new Error(`FAILED: Controller getStats expected 4 devices, got ${ctrlStats?.data?.devicesCount}`);
  }

  console.log('  -> PASS: Controller endpoints successfully invoked and returned expected contracts');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 7: Frontend Template, Modals, Script & Wiring
  // -------------------------------------------------------------------
  console.log('\n[TEST 7] Verifying Frontend View Template, Tabulator Columns & Control Panel Integration...');
  if (!FINAL_CONFIG_MANAGER_TEMPLATE.includes('fcmActiveSubTab === \'presets\'')) {
    throw new Error('FAILED: Sub-tab 1 presets condition missing in TEMPLATE');
  }
  if (!FINAL_CONFIG_MANAGER_TEMPLATE.includes('fcmActiveSubTab === \'devices\'')) {
    throw new Error('FAILED: Sub-tab 2 devices condition missing in TEMPLATE');
  }
  if (!FINAL_CONFIG_MANAGER_TEMPLATE.includes('id="fcm-presets-table"')) {
    throw new Error('FAILED: Container #fcm-presets-table missing in TEMPLATE');
  }
  if (!FINAL_CONFIG_MANAGER_TEMPLATE.includes('id="fcm-devices-table"')) {
    throw new Error('FAILED: Container #fcm-devices-table missing in TEMPLATE');
  }

  if (!FINAL_CONFIG_MANAGER_MODALS.includes('fcmShowPresetRegsModal')) {
    throw new Error('FAILED: Preset inspection modal missing in MODALS');
  }
  if (!FINAL_CONFIG_MANAGER_MODALS.includes('fcmShowSyncModal')) {
    throw new Error('FAILED: Sync from preset modal missing in MODALS');
  }
  if (!FINAL_CONFIG_MANAGER_MODALS.includes('fcmShowDeviceInspectModal')) {
    throw new Error('FAILED: Device inspect modal missing in MODALS');
  }

  if (!FINAL_CONFIG_MANAGER_SCRIPT.includes('useFinalConfigManagerModule')) {
    throw new Error('FAILED: useFinalConfigManagerModule missing in SCRIPT');
  }

  const cpViewPath = path.join(__dirname, '../src/views/control-panel.view.ts');
  const cpViewContent = fs.readFileSync(cpViewPath, 'utf8');

  if (!cpViewContent.includes('FINAL_CONFIG_MANAGER_TEMPLATE')) {
    throw new Error('FAILED: FINAL_CONFIG_MANAGER_TEMPLATE not imported in control-panel.view.ts');
  }
  if (!cpViewContent.includes('final-config-manager')) {
    throw new Error('FAILED: final-config-manager tab route missing in control-panel.view.ts');
  }
  if (!cpViewContent.includes('useFinalConfigManagerModule')) {
    throw new Error('FAILED: useFinalConfigManagerModule invocation missing in control-panel.view.ts');
  }

  const frontendExportPath = path.join(__dirname, '../src/frontend/modules/control-panel/final-config-manager.module.ts');
  if (!fs.existsSync(frontendExportPath)) {
    throw new Error('FAILED: Frontend re-export file missing at src/frontend/modules/control-panel/final-config-manager.module.ts');
  }

  console.log('  -> PASS: Template, 2-tab Tabulator layout, 3 modals, script and control panel integration verified');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 8: ZERO MOCK DATA & Pure English Verification
  // -------------------------------------------------------------------
  console.log('\n[TEST 8] Verifying ZERO MOCK DATA & Pure English in new C-Module files...');
  const fcmFilesToCheck = [
    path.join(__dirname, '../src/modules/c-modules/final-config-manager/final-config-manager.repository.ts'),
    path.join(__dirname, '../src/modules/c-modules/final-config-manager/final-config-manager.service.ts'),
    path.join(__dirname, '../src/modules/c-modules/final-config-manager/final-config-manager.controller.ts'),
    path.join(__dirname, '../src/views/control-panel-modules/final-config-manager.module.ts'),
  ];

  const forbiddenRegexes = [
    /mockPresets/i,
    /mockDevices/i,
    /fakeDevices/i,
    /dummyData/i,
    /sampleRegisters\s*=\s*\[/i,
  ];

  for (const filePath of fcmFilesToCheck) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const rx of forbiddenRegexes) {
      if (rx.test(content)) {
        throw new Error(`FAILED: Forbidden mock data pattern ${rx} found in ${filePath}`);
      }
    }
  }

  // Pure English check on frontend module
  const uiContent = fs.readFileSync(path.join(__dirname, '../src/views/control-panel-modules/final-config-manager.module.ts'), 'utf8');
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
  if (vietnameseRegex.test(uiContent)) {
    throw new Error('FAILED: Non-English characters found in final-config-manager.module.ts');
  }

  console.log('  -> PASS: Zero mock data confirmed across all files. 100% pure English UI confirmed.');
  passedTests++;

  console.log('\n======================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('======================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
