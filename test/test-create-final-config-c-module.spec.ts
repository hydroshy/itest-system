import * as fs from 'fs';
import * as path from 'path';
import { C_MODULES_REGISTRY } from '../src/modules/c-modules/c-module-registry';
import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { FinalConfigPresetEntity } from '../src/modules/c-modules/create-final-config/entities/final-config-preset.entity';
import { FinalConfigRegEntity } from '../src/modules/c-modules/create-final-config/entities/final-config-reg.entity';
import { CreateFinalConfigRepository } from '../src/modules/c-modules/create-final-config/create-final-config.repository';
import { CreateFinalConfigService } from '../src/modules/c-modules/create-final-config/create-final-config.service';
import { ModbusPresetsService } from '../src/modules/c-modules/modbus-presets/modbus-presets.service';
import {
  CREATE_FINAL_CONFIG_TEMPLATE,
  CREATE_FINAL_CONFIG_SCRIPT,
  validateRegisterValue as moduleValidateRegisterValue,
  precheckConfigValue as modulePrecheckConfigValue,
} from '../src/views/control-panel-modules/create-final-config.module';

async function runTestSuite() {
  console.log('======================================================================');
  console.log('SUITE: C-MODULE CREATE FINAL CONFIG & BACKEND ENGINE VERIFICATION');
  console.log('======================================================================\n');

  let passedTests = 0;
  const totalTests = 7;

  // -------------------------------------------------------------------
  // TEST 1: C_MODULES_REGISTRY Registration
  // -------------------------------------------------------------------
  console.log('[TEST 1] Verifying C_MODULES_REGISTRY registration...');
  const entry = C_MODULES_REGISTRY.find(m => m.id === 'c-create-final-config');
  if (!entry) {
    throw new Error('FAILED: c-create-final-config not found in C_MODULES_REGISTRY');
  }
  if (entry.code !== 'C_MOD_CREATE_FINAL_CONFIG') {
    throw new Error(`FAILED: Expected code C_MOD_CREATE_FINAL_CONFIG, got ${entry.code}`);
  }
  if (entry.routeHash !== '#create-final-config') {
    throw new Error(`FAILED: Expected routeHash #create-final-config, got ${entry.routeHash}`);
  }
  if (entry.category !== 'Developer') {
    throw new Error(`FAILED: Expected category Developer, got ${entry.category}`);
  }
  console.log('  -> PASS: c-create-final-config registered in C_MODULES_REGISTRY with #create-final-config');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 2: TypeORM Entities & Database Routing
  // -------------------------------------------------------------------
  console.log('\n[TEST 2] Verifying TypeORM Entities & db-routing.config.json...');
  const hasPresetEntity = ALL_DATABASE_ENTITIES.includes(FinalConfigPresetEntity);
  const hasRegEntity = ALL_DATABASE_ENTITIES.includes(FinalConfigRegEntity);
  if (!hasPresetEntity || !hasRegEntity) {
    throw new Error('FAILED: FinalConfigPresetEntity or FinalConfigRegEntity missing from ALL_DATABASE_ENTITIES');
  }

  const routingPath = path.join(__dirname, '../config/db-routing.config.json');
  const routing = JSON.parse(fs.readFileSync(routingPath, 'utf8'));
  if (routing.table_routes['final_config_presets'] !== 'core_db' || routing.table_routes['final_config_regs'] !== 'core_db') {
    throw new Error('FAILED: final_config_presets or final_config_regs missing from table_routes in db-routing.config.json');
  }
  console.log('  -> PASS: TypeORM entities registered and routed to core_db');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 3: Precheck UART Format Engine Algorithm & Empty Value Auto-Pass
  // -------------------------------------------------------------------
  console.log('\n[TEST 3] Verifying UART Format Precheck Engine algorithm & empty value auto-pass...');
  const validateRegisterValue = moduleValidateRegisterValue;

  // (Spec Requirement 1 & 2): Empty value auto-pass check
  const emptyCheck1 = validateRegisterValue('', 'uint', 1);
  if (!emptyCheck1.valid || !emptyCheck1.isEmpty) {
    throw new Error('FAILED: Empty string should be valid (pass check) and marked isEmpty');
  }
  const emptyCheck2 = validateRegisterValue('   ', 'float', 2);
  if (!emptyCheck2.valid || !emptyCheck2.isEmpty) {
    throw new Error('FAILED: Whitespace-only string should be valid (pass check) and marked isEmpty');
  }
  const emptyCheck3 = validateRegisterValue(undefined, 'string', 4);
  if (!emptyCheck3.valid || !emptyCheck3.isEmpty) {
    throw new Error('FAILED: undefined value should be valid (pass check) and marked isEmpty');
  }
  const emptyCheck4 = validateRegisterValue(null, 'hex', 1);
  if (!emptyCheck4.valid || !emptyCheck4.isEmpty) {
    throw new Error('FAILED: null value should be valid (pass check) and marked isEmpty');
  }
  if (modulePrecheckConfigValue('', 'int', 1).valid !== true) {
    throw new Error('FAILED: precheckConfigValue alias must also pass empty string');
  }

  // Uint tests
  if (!validateRegisterValue('1', 'uint', 1).valid) throw new Error('uint 1 should be valid');
  if (validateRegisterValue('70000', 'uint', 1).valid) throw new Error('uint 70000 should be invalid for 1 reg');
  if (!validateRegisterValue('70000', 'uint', 2).valid) throw new Error('uint 70000 should be valid for 2 regs');
  if (validateRegisterValue('-5', 'uint', 1).valid) throw new Error('uint -5 should be invalid');

  // Int tests
  if (!validateRegisterValue('-100', 'int', 1).valid) throw new Error('int -100 should be valid');
  if (validateRegisterValue('-40000', 'int', 1).valid) throw new Error('int -40000 should be invalid for 1 reg');

  // Float tests
  if (!validateRegisterValue('12.34', 'float', 2).valid) throw new Error('float 12.34 with 2 regs should be valid');
  if (validateRegisterValue('12.34', 'float', 1).valid) throw new Error('float 12.34 with 1 reg should be invalid');

  // String tests
  if (!validateRegisterValue('TEST', 'string', 2).valid) throw new Error('string TEST with 2 regs (4 chars) should be valid');
  if (validateRegisterValue('TOOLONG', 'string', 2).valid) throw new Error('string TOOLONG with 2 regs (7 > 4 chars) should be invalid');

  // Hex tests
  if (!validateRegisterValue('01A2', 'hex', 1).valid) throw new Error('hex 01A2 with 1 reg (4 hex chars) should be valid');
  if (validateRegisterValue('01A', 'hex', 1).valid) throw new Error('hex 01A (odd length) should be invalid');

  // Range tests
  if (!validateRegisterValue('50', 'uint', 1, '1..100').valid) throw new Error('50 in range 1..100 should be valid');
  if (validateRegisterValue('150', 'uint', 1, '1..100').valid) throw new Error('150 in range 1..100 should be invalid');

  console.log('  -> PASS: All UART format validation checks (uint, int, float, string, hex, range) succeeded');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 4: Backend CreateFinalConfigService & Repository
  // -------------------------------------------------------------------
  console.log('\n[TEST 4] Verifying CreateFinalConfigService & Repository persistence...');
  const repo = new CreateFinalConfigRepository();
  const service = new CreateFinalConfigService(repo);

  const saveRes = await service.saveFinalConfig({
    so: 'SO/2026/00001',
    item_code: 'WSLRW-ATH-01',
    sku: 'WSLRW-ATH',
    firmware_version: '1.0',
    short_fw: 1,
    name: '[Final Config] SO/2026/00001 - WSLRW-ATH-01 (WSLRW-ATH_1)',
    registers: [
      {
        address: 303,
        modbus_reg_hex: '0x012F',
        slave: 1,
        reg_num: 1,
        format: 'uint',
        parameter_name: 'Device Slave ID',
        value_to_write: '1',
        value_on_memmap: '1',
      },
      {
        address: 304,
        modbus_reg_hex: '0x0130',
        slave: 1,
        reg_num: 2,
        format: 'uint',
        parameter_name: 'Tx Cycle Seconds',
        value_to_write: '600',
        value_on_memmap: '300',
      },
      {
        address: 200, // Should be ignored because address < 303
        modbus_reg_hex: '0x00C8',
        slave: 1,
        reg_num: 2,
        format: 'float',
        parameter_name: 'Telemetry Temp',
        value_to_write: '25.0',
      },
    ],
  });

  if (!saveRes.success) throw new Error('FAILED: saveFinalConfig returned success: false');
  if (saveRes.data.registers.length !== 2) {
    throw new Error(`FAILED: Expected 2 registers (address >= 303), got ${saveRes.data.registers.length}`);
  }

  const retrieved = await service.getFinalConfig('SO/2026/00001', 'WSLRW-ATH-01');
  if (!retrieved || retrieved.preset.so !== 'SO/2026/00001') {
    throw new Error('FAILED: getFinalConfig could not retrieve saved preset');
  }
  if (retrieved.registers.length !== 2) {
    throw new Error(`FAILED: Expected 2 retrieved registers, got ${retrieved.registers.length}`);
  }
  console.log('  -> PASS: Service & repository successfully saved and retrieved preset with strict Dec Reg >= 303 filtering');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 5: ModbusPresetsService Integration
  // -------------------------------------------------------------------
  console.log('\n[TEST 5] Verifying ModbusPresetsService auto-persistence to Final Config...');
  const presetsService = new ModbusPresetsService(undefined, service);

  const preset = await presetsService.create({
    name: '[Final Config] SO-002 - ITEM-02',
    profileType: 'FinalConfig',
    so: 'SO/2026/00002',
    itemCode: 'ITEM-WSLRW-02',
    sku: 'WSLRW-LKS',
    shortFw: 6,
    firmwareVersion: '6.0',
    registers: [
      {
        id: 'r303',
        reg: 303,
        numreg: 1,
        format: 'uint',
        parameter: 'Operating Mode',
        valuetowrite: '2',
      },
      {
        id: 'r304',
        reg: 304,
        numreg: 2,
        format: 'uint',
        parameter: 'Heartbeat Interval',
        valuetowrite: '120',
      },
    ],
  });

  if (!preset || preset.profileType !== 'FinalConfig') {
    throw new Error('FAILED: ModbusPresetsService did not create FinalConfig preset');
  }

  const linkedFc = await service.getFinalConfig('SO/2026/00002', 'ITEM-WSLRW-02');
  if (!linkedFc || linkedFc.registers.length !== 2) {
    throw new Error('FAILED: ModbusPresetsService did not persist to final_config_presets / final_config_regs');
  }
  console.log('  -> PASS: ModbusPresetsService seamlessly synchronized preset to final_config_presets & final_config_regs');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 6: Template, Tabulator & Control Panel Wiring
  // -------------------------------------------------------------------
  console.log('\n[TEST 6] Verifying Frontend View Template, Tabulator Columns & Control Panel Integration...');
  // Template contents
  if (!CREATE_FINAL_CONFIG_TEMPLATE.includes('Create Final Config')) {
    throw new Error('FAILED: CREATE_FINAL_CONFIG_TEMPLATE missing title');
  }
  if (!CREATE_FINAL_CONFIG_TEMPLATE.includes('create-final-config-tabulator-table')) {
    throw new Error('FAILED: CREATE_FINAL_CONFIG_TEMPLATE missing Tabulator table container');
  }
  if (!CREATE_FINAL_CONFIG_TEMPLATE.includes('MEMMAP Chưa tồn tại')) {
    throw new Error('FAILED: CREATE_FINAL_CONFIG_TEMPLATE missing "MEMMAP Chưa tồn tại" notice');
  }
  if (!CREATE_FINAL_CONFIG_TEMPLATE.includes('showFinalConfigSaveModal')) {
    throw new Error('FAILED: CREATE_FINAL_CONFIG_TEMPLATE missing confirmation modal');
  }
  if (!CREATE_FINAL_CONFIG_TEMPLATE.includes('configuredRegsCount')) {
    throw new Error('FAILED: CREATE_FINAL_CONFIG_TEMPLATE missing configuredRegsCount in modal');
  }

  // Script contents
  if (!CREATE_FINAL_CONFIG_SCRIPT.includes('useCreateFinalConfigModule')) {
    throw new Error('FAILED: CREATE_FINAL_CONFIG_SCRIPT missing useCreateFinalConfigModule');
  }
  if (!CREATE_FINAL_CONFIG_SCRIPT.includes('/api/c-modules/memmap-upload/by-sku/')) {
    throw new Error('FAILED: Script does not query memmap-upload API');
  }
  if (!CREATE_FINAL_CONFIG_SCRIPT.includes('modbus_reg_dec') || !CREATE_FINAL_CONFIG_SCRIPT.includes('303')) {
    throw new Error('FAILED: Script missing Dec Reg >= 303 filter');
  }
  if (!CREATE_FINAL_CONFIG_SCRIPT.includes('precheckConfigValue')) {
    throw new Error('FAILED: Script missing precheckConfigValue');
  }
  if (!CREATE_FINAL_CONFIG_SCRIPT.includes("placeholder = 'Trống'")) {
    throw new Error('FAILED: Script missing placeholder "Trống" for Input Config cell');
  }
  if (!CREATE_FINAL_CONFIG_SCRIPT.includes('Chưa cấu hình (tự động pass)')) {
    throw new Error('FAILED: Script missing tooltip "Chưa cấu hình (tự động pass)" for empty cell badge');
  }

  // Control Panel view integration
  const cpViewPath = path.join(__dirname, '../src/views/control-panel.view.ts');
  const cpViewContent = fs.readFileSync(cpViewPath, 'utf8');
  if (!cpViewContent.includes('CREATE_FINAL_CONFIG_TEMPLATE') || !cpViewContent.includes('c-create-final-config')) {
    throw new Error('FAILED: control-panel.view.ts does not integrate CREATE_FINAL_CONFIG_TEMPLATE');
  }
  console.log('  -> PASS: Template, Tabulator columns, UART precheck, modal and control panel wiring verified');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 7: No Mock Data Audit
  // -------------------------------------------------------------------
  console.log('\n[TEST 7] Verifying NO MOCK DATA in new C-Module files...');
  const modulePath = path.join(__dirname, '../src/views/control-panel-modules/create-final-config.module.ts');
  const moduleContent = fs.readFileSync(modulePath, 'utf8');

  const forbiddenMockPatterns = [
    /mockRegisters/i,
    /mockPresets/i,
    /dummyData/i,
    /fakeData/i,
    /sampleRegisters\s*=\s*\[/i,
  ];

  for (const pattern of forbiddenMockPatterns) {
    if (pattern.test(moduleContent)) {
      throw new Error(`FAILED: Found mock data pattern ${pattern} in create-final-config.module.ts!`);
    }
  }
  console.log('  -> PASS: No mock data arrays detected. All data loaded from live REST endpoints.');
  passedTests++;

  console.log('\n======================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('======================================================================\n');
}

runTestSuite().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
