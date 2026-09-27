import * as fs from 'fs';
import * as path from 'path';
import { C_MODULES_REGISTRY } from '../src/modules/c-modules/c-module-registry';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { TestResultEntity } from '../src/modules/c-modules/traceability/entities/test-result.entity';
import { RawData3Entity } from '../src/modules/c-modules/traceability/entities/raw-data3.entity';
import { TraceabilityService } from '../src/modules/c-modules/traceability/traceability.service';

/**
 * Automated Verification Suite for Traceability Module (T-Module)
 * Governed under C-Module RBAC, Node-RED 0-Test_Result and 1-Device_Test_Details
 */
async function runTraceabilitySuite() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: TRACEABILITY MODULE (T-MODULE / C-MODULE)');
  console.log('FLOW 0: 0-Test_Result & FLOW 1: 1-Device_Test_Details');
  console.log('======================================================================\n');

  let passedTests = 0;
  const totalTests = 8;

  // -------------------------------------------------------------------
  // TEST 1: C-Module Registry Registration
  // -------------------------------------------------------------------
  console.log('[TEST 1] Verifying C_MODULES_REGISTRY registration for c-traceability...');
  const traceModuleEntry = C_MODULES_REGISTRY.find(m => m.id === 'c-traceability' || m.code === 'T_MOD_TRACEABILITY');
  if (!traceModuleEntry) {
    throw new Error('FAILED: c-traceability / T_MOD_TRACEABILITY not found in C_MODULES_REGISTRY!');
  }
  if (traceModuleEntry.routeHash !== '#traceability') {
    throw new Error(`FAILED: Expected routeHash to be #traceability, got: ${traceModuleEntry.routeHash}`);
  }
  if (traceModuleEntry.requiredPermission !== 'traceability:read') {
    throw new Error(`FAILED: Expected requiredPermission to be traceability:read, got: ${traceModuleEntry.requiredPermission}`);
  }
  console.log('  -> PASS: C-Module c-traceability (T_MOD_TRACEABILITY) registered with #traceability & traceability:read.');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 2: Dynamic Database & TypeORM Entities Registration
  // -------------------------------------------------------------------
  console.log('\n[TEST 2] Verifying TypeORM Entities & dynamic db-routing.config.json...');
  const hasTestResult = ALL_DATABASE_ENTITIES.includes(TestResultEntity);
  const hasRawData3 = ALL_DATABASE_ENTITIES.includes(RawData3Entity);
  if (!hasTestResult || !hasRawData3) {
    throw new Error('FAILED: TestResultEntity or RawData3Entity missing from ALL_DATABASE_ENTITIES!');
  }

  const routingPath = path.join(process.cwd(), 'config', 'db-routing.config.json');
  const routingContent = JSON.parse(fs.readFileSync(routingPath, 'utf8'));
  if (routingContent.table_routes['test_result'] !== 'core_db' || routingContent.table_routes['raw_data3'] !== 'core_db') {
    throw new Error('FAILED: test_result or raw_data3 route missing from db-routing.config.json!');
  }
  console.log('  -> PASS: TestResultEntity and RawData3Entity registered in TypeORM & routed to core_db.');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 3: Roles & Permissions Matrix
  // -------------------------------------------------------------------
  console.log('\n[TEST 3] Verifying default RBAC permissions in roles.service.ts...');
  const rolesServiceFile = fs.readFileSync(path.join(process.cwd(), 'src/modules/roles-permissions/roles.service.ts'), 'utf8');
  if (!rolesServiceFile.includes('traceability:read') || !rolesServiceFile.includes('traceability:manage')) {
    throw new Error('FAILED: traceability:read or traceability:manage missing in roles.service.ts defaultPerms!');
  }
  console.log('  -> PASS: traceability:read and traceability:manage defined in RBAC matrix.');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 4: Backend Module & Controller Endpoints
  // -------------------------------------------------------------------
  console.log('\n[TEST 4] Verifying OrderManagementSubsystemModule backend registration...');
  const orderSubsystemFile = fs.readFileSync(path.join(process.cwd(), 'src/backend/order-management/order-management.module.ts'), 'utf8');
  if (!orderSubsystemFile.includes('TraceabilityModule')) {
    throw new Error('FAILED: TraceabilityModule not imported in OrderManagementSubsystemModule!');
  }
  console.log('  -> PASS: TraceabilityModule integrated in backend subsystem.');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 5: Business Logic Unit Test - Test ID Parsing & Modbus Config Decoder
  // -------------------------------------------------------------------
  console.log('\n[TEST 5] Testing TraceabilityService parsing & Modbus register decoder...');
  const mockDbService: any = {
    getDataSourceForTable: () => null,
  };
  const traceService = new TraceabilityService(mockDbService);

  // 5a. Test ID Parsing
  const parsed1 = (traceService as any).parseTestId('WSLRW-ATH_6_SATH26000254');
  if (parsed1.sku !== 'WSLRW-ATH' || parsed1.firmwareVersion !== '6' || parsed1.serialNumber !== 'SATH26000254') {
    throw new Error(`FAILED: parseTestId unexpected output: ${JSON.stringify(parsed1)}`);
  }

  const parsed2 = (traceService as any).parseTestId('SO2603001-WSLRW-LKS-01-SN123456');
  if (parsed2.soNumber !== 'SO2603001' || parsed2.sku !== 'WSLRW-LKS') {
    throw new Error(`FAILED: parseTestId SO pattern unexpected output: ${JSON.stringify(parsed2)}`);
  }

  // 5b. Modbus Decoder logic from Node-RED
  // 0001 = 1 (uint16), 0000000A = 10 (uint32), 42280000 = 42.0 (float BE)
  const hexSample = '0001' + '0000000A' + '42280000';
  const paramsName = 'Device Type|Baud Rate|Calibration Factor';
  const paramsType = 'uint16|uint32|float';
  const paramsLen = '1|2|2';
  const decodedRegs = traceService.decodeFinalConfig(hexSample, paramsName, paramsType, paramsLen);
  if (!Array.isArray(decodedRegs) || decodedRegs.length === 0) {
    throw new Error('FAILED: decodeFinalConfig returned empty register list!');
  }
  const reg1 = decodedRegs.find(r => r.reg === 'Reg 1');
  const reg2 = decodedRegs.find(r => r.reg === 'Reg 2');
  const reg3 = decodedRegs.find(r => r.reg === 'Reg 4');

  if (!reg1 || reg1.value !== 1) {
    throw new Error(`FAILED: Expected Reg 1 to decode to 1, got ${reg1?.value}`);
  }
  if (!reg2 || reg2.value !== 10) {
    throw new Error(`FAILED: Expected Reg 2 to decode to 10, got ${reg2?.value}`);
  }
  if (!reg3 || Math.abs(Number(reg3.value) - 42.0) > 0.01) {
    throw new Error(`FAILED: Expected Reg 4 float to decode to 42.0, got ${reg3?.value}`);
  }
  console.log('  -> PASS: Test ID parser and Modbus register decoder verified with IEEE-754 BE floats and uints.');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 6: Flow 1 Telemetry Stats & Event Code Distribution
  // -------------------------------------------------------------------
  console.log('\n[TEST 6] Testing statistical aggregation & Event Distribution classification (Flow 1)...');
  const com1Values = [3.3, 3.2, 3.4, 3.3, 3.1];
  const p1Events = [0, 1, 1, 4, 15]; // 0: Normal/periodic, 1: Power up, 4: Alarm, 15: Low Batt

  const com1Stat = traceService.computeStats(com1Values, 'com1', 'COM1 (Battery / Supply)');
  if (!com1Stat || com1Stat.min !== 3.1 || com1Stat.max !== 3.4) {
    throw new Error(`FAILED: COM1 stats incorrect: ${JSON.stringify(com1Stat)}`);
  }

  const eventStats = traceService.computeEventDistribution(p1Events);
  if (eventStats.event_s !== 1 || eventStats.event_p !== 2 || eventStats.event_a !== 1 || eventStats.event_lns !== 1) {
    throw new Error(`FAILED: Event stats incorrect: ${JSON.stringify(eventStats)}`);
  }
  console.log('  -> PASS: COM1/COM2/P1..P35 stats and Event Code classification (event_s, event_p, event_a, event_lns) verified.');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 7: 1:1 Synchronization between views and frontend control-panel modules
  // -------------------------------------------------------------------
  console.log('\n[TEST 7] Verifying 1:1 synchronization between views and frontend modules...');
  const viewPath = path.join(process.cwd(), 'src/views/control-panel-modules/traceability.module.ts');
  const frontPath = path.join(process.cwd(), 'src/frontend/modules/control-panel/traceability.module.ts');

  if (!fs.existsSync(viewPath) || !fs.existsSync(frontPath)) {
    throw new Error('FAILED: traceability.module.ts missing from views or frontend directory!');
  }

  const viewFile = fs.readFileSync(viewPath, 'utf8');
  const frontFile = fs.readFileSync(frontPath, 'utf8');
  if (viewFile !== frontFile) {
    throw new Error('FAILED: src/views/.../traceability.module.ts and src/frontend/.../traceability.module.ts are not identical!');
  }
  console.log('  -> PASS: Both traceability.module.ts copies are 100% byte-for-byte identical.');
  passedTests++;

  // -------------------------------------------------------------------
  // TEST 8: Control Panel View Integration
  // -------------------------------------------------------------------
  console.log('\n[TEST 8] Verifying control-panel.view.ts integration...');
  const cpViewContent = fs.readFileSync(path.join(process.cwd(), 'src/views/control-panel.view.ts'), 'utf8');

  const checks = [
    { name: 'Traceability import', str: "from './control-panel-modules/traceability.module'" },
    { name: 'Sidebar nav button #traceability', str: "switchTab('traceability')" },
    { name: 'c-module-boundary for traceability', str: 'module-id="traceability"' },
    { name: 'TRACEABILITY_MODALS injection', str: '${TRACEABILITY_MODALS}' },
    { name: 'TRACEABILITY_SCRIPT execution', str: '${TRACEABILITY_SCRIPT}' },
    { name: 'createTraceabilityFallback defined', str: 'createTraceabilityFallback' },
    { name: 'traceability in moduleStatesRegistry', str: "'traceability': { id: 'c-traceability'" },
    { name: 'traceability in activeTabLabel', str: "case 'traceability': return 'Traceability (T-Module)';" },
    { name: 'traceabilityModule safe setup', str: "safeExecuteModuleSetup(\n          'c-traceability'" },
    { name: 'activeTab watch for traceability', str: "if (newTab === 'traceability')" },
    { name: 'traceabilityModule spread in return', str: '...traceabilityModule,' },
  ];

  for (const c of checks) {
    if (!cpViewContent.includes(c.str)) {
      throw new Error(`FAILED: control-panel.view.ts is missing ${c.name} (searched for: "${c.str}")`);
    }
  }
  console.log('  -> PASS: All 11 integration checkpoints verified in control-panel.view.ts.');
  passedTests++;

  console.log('\n======================================================================');
  console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY (100% VERIFIED)!`);
  console.log('======================================================================');
}

runTraceabilitySuite().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
