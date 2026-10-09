import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import { FinalConfigManagerRepository } from '../src/modules/c-modules/final-config-manager/final-config-manager.repository';
import { FinalConfigManagerService } from '../src/modules/c-modules/final-config-manager/final-config-manager.service';
import { FinalConfigManagerController } from '../src/modules/c-modules/final-config-manager/final-config-manager.controller';
import { FinalConfigStatus } from '../src/modules/c-modules/final-config-manager/dto/final-config-manager.dto';
import { FinalConfigSnEntity } from '../src/modules/c-modules/final-config-manager/entities/final-config-sn.entity';

async function runStage1DuplicateCheckSuite() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: STAGE 1 DUPLICATE FINAL CONFIG PASS PROTECTION');
  console.log('======================================================================\n');

  let passedTests = 0;
  const totalTests = 7;

  const viewsModulePath = path.resolve(__dirname, '../src/views/dashboard-modules/final-config-device.module.ts');
  const frontModulePath = path.resolve(__dirname, '../src/frontend/modules/dashboard/final-config-device.module.ts');

  // --------------------------------------------------------------------
  // TEST 1: 100% Code Synchronization between src/views and src/frontend
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
  // TEST 2: UI Elements verification (Simplified UI & Debug Mode)
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying Simplified UI, Port Placement, Debug Mode & PROGRESS: X%...');
  
  // 2a. Subtitle removal check
  assert.ok(
    !viewsContent.includes('Direct UART Modbus RTU execution: Hardware ID & SO Verification'),
    'Header subtitle must be removed'
  );

  // 2b. Placeholder banner removal check
  assert.ok(
    !viewsContent.includes('Awaiting Stage 1'),
    'Awaiting Stage 1 placeholder banner must be removed'
  );

  // 2c. Progress format
  assert.ok(
    viewsContent.includes('PROGRESS: {{ fcProgress }}%'),
    'Progress bar label must use PROGRESS: {{ fcProgress }}%'
  );

  // 2d. Debug mode controls for UART stats and logs
  assert.ok(
    viewsContent.includes('v-show="fcDebugMode"'),
    'UART stats or logs must be guarded by v-show="fcDebugMode"'
  );
  assert.ok(
    viewsContent.includes("fcDebugMode = ref(false)"),
    'fcDebugMode must default to false'
  );

  // 2e. Select Port position before START button
  const portSectionPos = viewsContent.indexOf('Serial Port Selection & Connection Row');
  const startBtnPos = viewsContent.indexOf(':disabled="!fcSerialConnected || isRunningFinalConfig || finalVerdict === \'FAIL\'"');
  assert.ok(portSectionPos !== -1, 'Serial Port Selection & Connection Row must exist');
  assert.ok(startBtnPos !== -1, 'START button with FAIL freeze must exist');
  assert.ok(portSectionPos < startBtnPos, 'Port selection must be placed before START button in the Workbench card');

  console.log('  -> PASS: UI layout, Select Port positioning, and Debug mode controls verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 3: Freeze START button when FAIL and Unfreeze on Reset
  // --------------------------------------------------------------------
  console.log('[TEST 3] Verifying START Button Freeze on FAIL and Unfreeze on Reset...');
  
  // 3a. Template disabled binding
  assert.ok(
    viewsContent.includes(':disabled="!fcSerialConnected || isRunningFinalConfig || finalVerdict === \'FAIL\'"'),
    'START button must be disabled when finalVerdict === FAIL'
  );

  // 3b. Guard in startFinalConfig
  assert.ok(
    viewsContent.includes("if (finalVerdict.value === 'FAIL')"),
    'startFinalConfig must guard against finalVerdict === FAIL'
  );

  // 3c. Reset restores finalVerdict to NONE
  assert.ok(
    viewsContent.includes("finalVerdict.value = 'NONE'"),
    'resetFinalConfig must restore finalVerdict.value to NONE'
  );

  console.log('  -> PASS: START button freeze on FAIL and reset mechanism verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 4: Backend Service & Controller check-pass Endpoint
  // --------------------------------------------------------------------
  console.log('[TEST 4] Verifying FinalConfigManager check-pass endpoint and service logic...');
  const repo = new FinalConfigManagerRepository();
  const service = new FinalConfigManagerService(repo);
  const controller = new FinalConfigManagerController(service);

  // 4a. Check with missing identifiers
  const missingRes = await controller.checkDevicePassed(undefined, undefined);
  assert.strictEqual(missingRes.passed, false, 'Missing identifiers must return passed: false');

  // 4b. Check non-existent device
  const notFoundRes = await controller.checkDevicePassed('SN-NON-EXIST-001', 'A840410000000001');
  assert.strictEqual(notFoundRes.passed, false, 'Non-existent device must return passed: false');

  // 4c. Register a device with FAIL status
  await repo.saveOrUpdateDevice({
    serial_number: 'SN-TEST-FAIL-001',
    dev_eui: 'A840410000000002',
    sku: 'WSLRW-ATH',
    so: 'SO-TEST-2026',
    item_code: 'WSLRW-ATH-01',
    status: FinalConfigStatus.FAIL,
    registers: [],
  });

  const failCheckRes = await controller.checkDevicePassed('SN-TEST-FAIL-001', 'A840410000000002');
  assert.strictEqual(failCheckRes.passed, false, 'Device with status FAIL must return passed: false');

  // 4d. Register a device with PASS status
  await repo.saveOrUpdateDevice({
    serial_number: 'SN-TEST-PASS-001',
    dev_eui: 'A840410000000003',
    sku: 'WSLRW-ATH',
    so: 'SO-TEST-2026',
    item_code: 'WSLRW-ATH-01',
    status: FinalConfigStatus.PASS,
    registers: [],
  });

  const passCheckRes = await controller.checkDevicePassed('SN-TEST-PASS-001', 'A840410000000003');
  assert.strictEqual(passCheckRes.passed, true, 'Device with status PASS must return passed: true');
  assert.strictEqual(passCheckRes.data?.serial_number, 'SN-TEST-PASS-001');
  assert.strictEqual(passCheckRes.data?.dev_eui, 'A840410000000003');
  assert.strictEqual(passCheckRes.data?.status, 'PASS');

  // 4e. Lookup by DevEUI only
  const passCheckByEuiRes = await controller.checkDevicePassed(undefined, 'A840410000000003');
  assert.strictEqual(passCheckByEuiRes.passed, true, 'Device lookup by DevEUI only must return passed: true');

  // 4f. Lookup by Serial Number only
  const passCheckBySnRes = await controller.checkDevicePassed('SN-TEST-PASS-001', undefined);
  assert.strictEqual(passCheckBySnRes.passed, true, 'Device lookup by Serial Number only must return passed: true');

  console.log('  -> PASS: Controller and Service check-pass logic fully validated.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 5: Stage 1 Frontend Workflow Contract for Duplicate PASS
  // --------------------------------------------------------------------
  console.log('[TEST 5] Verifying Stage 1 Frontend Logic for Duplicate PASS...');

  // 5a. Check endpoint call in Stage 1
  assert.ok(
    viewsContent.includes('/api/c-modules/final-config-manager/check-pass?serial_number='),
    'Stage 1 must invoke GET /api/c-modules/final-config-manager/check-pass'
  );

  // 5b. Check alreadyPassedModal trigger and info assignment
  assert.ok(
    viewsContent.includes('alreadyPassedModal.value = true'),
    'Stage 1 must set alreadyPassedModal.value = true when passed'
  );
  assert.ok(
    viewsContent.includes('alreadyPassedInfo.value = checkPassJson.data'),
    'Stage 1 must store passed record in alreadyPassedInfo'
  );

  // 5c. Safe exit: return without setting finalVerdict to FAIL or saving device
  assert.ok(
    viewsContent.includes("fcStatusMessage.value = 'Device has already passed Final Configuration!'"),
    'Stage 1 must set friendly status message'
  );
  assert.ok(
    viewsContent.includes("stage1Status.value = 'IDLE'"),
    'Stage 1 must keep stage1Status safe (IDLE)'
  );
  assert.ok(
    viewsContent.includes("finalVerdict.value = 'NONE'"),
    'Stage 1 must set finalVerdict to NONE'
  );

  // 5d. Modal markup verification
  assert.ok(
    viewsContent.includes('v-if="alreadyPassedModal"'),
    'Modal template must have v-if="alreadyPassedModal"'
  );
  assert.ok(
    viewsContent.includes('Device Already Configured'),
    'Modal template must display title Device Already Configured'
  );
  assert.ok(
    viewsContent.includes('Device has already passed Final Configuration!'),
    'Modal template must show clear warning message'
  );

  console.log('  -> PASS: Stage 1 duplicate PASS detection & safe termination contract verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 6: Database DDL Migration Index Verification (Migration 20)
  // --------------------------------------------------------------------
  console.log('[TEST 6] Verifying Database DDL Migration 20...');
  const ddlPath = path.resolve(__dirname, '../../deploy/database/updates/20_optimize_final_config_sn_pass_check_indexes.sql');
  assert.ok(fs.existsSync(ddlPath), 'Migration file 20_optimize_final_config_sn_pass_check_indexes.sql must exist');
  
  const ddlContent = fs.readFileSync(ddlPath, 'utf8');
  assert.ok(ddlContent.includes('BEGIN;'), 'Migration 20 must be transactional (BEGIN)');
  assert.ok(ddlContent.includes('COMMIT;'), 'Migration 20 must commit transaction (COMMIT)');
  assert.ok(
    ddlContent.includes('CREATE INDEX IF NOT EXISTS "idx_final_config_sn_dev_eui"'),
    'Migration 20 must index dev_eui'
  );
  assert.ok(
    ddlContent.includes('CREATE INDEX IF NOT EXISTS "idx_final_config_sn_sn_status"'),
    'Migration 20 must create composite index on (serial_number, status)'
  );
  assert.ok(
    ddlContent.includes('CREATE INDEX IF NOT EXISTS "idx_final_config_sn_deveui_status"'),
    'Migration 20 must create composite index on (dev_eui, status)'
  );

  console.log('  -> PASS: Database migration 20 DDL verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 7: TypeORM Entity Index Annotations
  // --------------------------------------------------------------------
  console.log('[TEST 7] Verifying FinalConfigSnEntity Index Annotations...');
  const entityPath = path.resolve(
    __dirname,
    '../src/modules/c-modules/final-config-manager/entities/final-config-sn.entity.ts'
  );
  assert.ok(fs.existsSync(entityPath), 'final-config-sn.entity.ts must exist');
  const entityContent = fs.readFileSync(entityPath, 'utf8');
  assert.ok(
    entityContent.includes("@Index('idx_final_config_sn_dev_eui', ['dev_eui'])"),
    'Entity must declare idx_final_config_sn_dev_eui'
  );

  console.log('  -> PASS: Entity index declarations verified.\n');
  passedTests++;

  console.log('======================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} CHECKS SUCCESSFUL`);
  console.log('======================================================================');
}

runStage1DuplicateCheckSuite().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
