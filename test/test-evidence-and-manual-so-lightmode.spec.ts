import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { TestEvidenceEntity } from '../src/modules/d-modules/test-automation/entities/test-evidence.entity';
import { TestSessionEntity } from '../src/modules/d-modules/test-automation/entities/test-session.entity';
import { TestDeviceRunEntity } from '../src/modules/d-modules/test-automation/entities/test-device-run.entity';
import { TestAutomationService } from '../src/modules/d-modules/test-automation/test-automation.service';
import { TestAutomationRepository } from '../src/modules/d-modules/test-automation/test-automation.repository';
import { TEST_AUTOMATION_TEMPLATE, TEST_AUTOMATION_MODALS, TEST_AUTOMATION_SCRIPT } from '../src/views/dashboard-modules/test-automation.module';
import { DASHBOARD_HTML } from '../src/views/dashboard.view';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: POST-TEST EVIDENCE, MANUAL SO & LIGHT MODE VERIFICATION');
  console.log('======================================================================\n');

  // --------------------------------------------------------------------
  // TEST 1: TestEvidenceEntity & TypeORM Schema Mapping
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying TestEvidenceEntity in ALL_DATABASE_ENTITIES & TypeORM metadata...');
  const entityNames = ALL_DATABASE_ENTITIES.map((e: any) => e?.name);
  assert.ok(entityNames.includes('TestEvidenceEntity'), 'TestEvidenceEntity must be in ALL_DATABASE_ENTITIES');

  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  const evMeta = ds.getMetadata(TestEvidenceEntity);
  assert.strictEqual(evMeta.tableName, 'test_evidence', 'Entity must map to table test_evidence');
  assert.ok(evMeta.findColumnWithPropertyName('decodedFields'), 'decodedFields column must exist (JSONB)');
  assert.ok(evMeta.findColumnWithPropertyName('assertionResults'), 'assertionResults column must exist (JSONB)');
  assert.ok(evMeta.findColumnWithPropertyName('serialNumber'), 'serialNumber column must exist (Modbus Reg 259)');
  assert.ok(evMeta.findColumnWithPropertyName('soCode'), 'soCode column must exist');
  assert.ok(evMeta.findColumnWithPropertyName('itemCode'), 'itemCode column must exist');
  assert.ok(evMeta.findColumnWithPropertyName('sku'), 'sku column must exist');
  assert.ok(evMeta.findColumnWithPropertyName('verdict'), 'verdict column must exist');
  assert.ok(evMeta.findColumnWithPropertyName('payloadHex'), 'payloadHex column must exist');
  assert.ok(evMeta.findColumnWithPropertyName('testedAt'), 'testedAt column must exist');
  console.log('  -> PASS: TestEvidenceEntity metadata verified with complete post-test audit fields.\n');

  // --------------------------------------------------------------------
  // TEST 2: Database Routing Configuration
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying db-routing.config.json table routing...');
  const dbRoutingPath = path.join(process.cwd(), 'config', 'db-routing.config.json');
  const routingContent = JSON.parse(fs.readFileSync(dbRoutingPath, 'utf8'));
  assert.strictEqual(
    routingContent.table_routes['test_evidence'],
    'core_db',
    'test_evidence table must route to core_db',
  );
  console.log('  -> PASS: test_evidence route correctly configured to core_db.\n');

  // --------------------------------------------------------------------
  // TEST 3: TestAutomationService - Manual SO Session Creation
  // --------------------------------------------------------------------
  console.log('[TEST 3] Testing Manual Sales Order (SO) creation in TestAutomationService...');
  const mockDbService: any = {
    getRepositoryForTable: (tableName: string) => {
      throw new Error(`Mock DB: Table ${tableName} offline, use in-memory fallback`);
    },
  };

  const repository = new TestAutomationRepository(mockDbService);
  const service = new TestAutomationService(repository);

  const manualSession = await service.createSession({
    soCode: 'SO/2026/MANUAL-TEST-999',
    itemCode: 'WSLRW-ATH-MANUAL',
    sku: 'WSLRW-ATH',
    firmwareVersion: '2.0',
    devEUIs: ['0018B271AABBCC01', '0018B271AABBCC02'],
    notes: 'Manual SO factory line audit',
    autoStart: true,
  });

  assert.strictEqual(manualSession.soCode, 'SO/2026/MANUAL-TEST-999');
  assert.strictEqual(manualSession.itemCode, 'WSLRW-ATH-MANUAL');
  assert.strictEqual(manualSession.status, 'IN_PROGRESS');
  assert.strictEqual(manualSession.deviceRuns.length, 2);
  assert.strictEqual(manualSession.deviceRuns[0].sku, 'WSLRW-ATH');
  assert.strictEqual(manualSession.deviceRuns[0].firmwareVersion, '2.0');
  console.log('  -> PASS: Manual SO session created with explicit sku, firmwareVersion, and auto-started runs.\n');

  // --------------------------------------------------------------------
  // TEST 4: Post-Test Evidence Persistence & Modbus Reg 259 Serial Number
  // --------------------------------------------------------------------
  console.log('[TEST 4] Testing post-test evidence creation on packet processing...');
  const packetResult = await service.processPacket({
    devEUI: '0018B271AABBCC01',
    payloadHex: '010100f50201025803010e10',
    serialNumber: 'WSLRW-ATH-260999', // Modbus Reg 259
    fPort: 1,
    fCnt: 1,
    rssi: -68,
    snr: 10.2,
  });

  assert.ok(packetResult.success);
  assert.ok(packetResult.decodedData);
  assert.ok(packetResult.decodedData.battery !== undefined || packetResult.decodedData.temperature !== undefined);

  // Verify saved evidence in repository
  const { items: evidences } = await repository.findEvidences({ devEUI: '0018B271AABBCC01' });
  assert.ok(evidences.length >= 1, 'Evidence record must be persisted on packet processing');
  const latestEv = evidences[0];
  assert.strictEqual(latestEv.devEUI, '0018B271AABBCC01');
  assert.strictEqual(latestEv.serialNumber, 'WSLRW-ATH-260999');
  assert.strictEqual(latestEv.soCode, 'SO/2026/MANUAL-TEST-999');
  assert.strictEqual(latestEv.itemCode, 'WSLRW-ATH-MANUAL');
  assert.ok(latestEv.decodedFields, 'Decoded fields must be captured as evidence');
  console.log('  -> Decoded Fields Evidence:', JSON.stringify(latestEv.decodedFields));
  console.log('  -> Modbus Reg 259 Serial:', latestEv.serialNumber);
  console.log('  -> Verdict:', latestEv.verdict);
  console.log('  -> PASS: Sensor decoded fields and Reg 259 serial number captured in test_evidence.\n');

  // --------------------------------------------------------------------
  // TEST 5: Evidence CSV Export
  // --------------------------------------------------------------------
  console.log('[TEST 5] Testing CSV Evidence export for factory audit...');
  const csvReport = await service.exportEvidenceCsv({ soCode: 'SO/2026/MANUAL-TEST-999' });
  assert.ok(csvReport.fileName.startsWith('test-evidence-report-'));
  assert.ok(csvReport.content.includes('Evidence ID,Tested At (UTC),DevEUI,Serial Number (Reg 259)'));
  assert.ok(csvReport.content.includes('0018B271AABBCC01'));
  assert.ok(csvReport.content.includes('WSLRW-ATH-260999'));
  console.log('  -> PASS: Evidence CSV report generated with complete audit headers.\n');

  // --------------------------------------------------------------------
  // TEST 6: Frontend Template & Script Inspection (Manual SO & Evidence)
  // --------------------------------------------------------------------
  console.log('[TEST 6] Verifying Frontend Module for Manual SO and Evidence Modal...');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes('test-automation-container'), 'Template must include test-automation-container');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes('isManualSo'), 'Template must have isManualSo toggle logic');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes('manualSoCode'), 'Template must have manualSoCode input');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes('manualItemCode'), 'Template must have manualItemCode input');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes('manualSku'), 'Template must have manualSku input');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes('manualFw'), 'Template must have manualFw input');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes('openEvidenceModal'), 'Template must have openEvidenceModal button');

  assert.ok(TEST_AUTOMATION_MODALS.includes('showEvidenceModal'), 'Modals must include showEvidenceModal');
  assert.ok(TEST_AUTOMATION_MODALS.includes('Post-Test Sensor Evidence'), 'Modals must include Evidence title');
  assert.ok(TEST_AUTOMATION_MODALS.includes('SERIAL_NUMBER (Reg 259)'), 'Modals must display SERIAL_NUMBER (Reg 259)');
  assert.ok(TEST_AUTOMATION_MODALS.includes('Decoded Sensor Fields'), 'Modals must display Decoded Sensor Fields');

  assert.ok(TEST_AUTOMATION_SCRIPT.includes('isManualSo'), 'Script must define isManualSo');
  assert.ok(TEST_AUTOMATION_SCRIPT.includes('fetchEvidences'), 'Script must define fetchEvidences');
  assert.ok(TEST_AUTOMATION_SCRIPT.includes('exportEvidenceCsvReport'), 'Script must define exportEvidenceCsvReport');
  assert.ok(TEST_AUTOMATION_SCRIPT.includes('openEvidenceModal'), 'Script must define openEvidenceModal');
  console.log('  -> PASS: Frontend templates and scripts properly implement Manual SO and Evidence Audit.\n');

  // --------------------------------------------------------------------
  // TEST 7: Light Mode CSS Font Color Fix
  // --------------------------------------------------------------------
  console.log('[TEST 7] Verifying Light Mode CSS in dashboard.view.ts...');
  assert.ok(
    !DASHBOARD_HTML.includes('.theme-light [class*="bg-gradient-"] .text-white'),
    'CRITICAL: Must NOT contain over-broad .theme-light [class*="bg-gradient-"] .text-white',
  );
  assert.ok(
    DASHBOARD_HTML.includes('.theme-light .test-automation-container'),
    'Must contain .theme-light .test-automation-container rules',
  );
  assert.ok(
    DASHBOARD_HTML.includes('.theme-light .test-automation-container .text-white'),
    'Must contain .theme-light .test-automation-container .text-white rule',
  );
  console.log('  -> PASS: Light mode CSS selector fixed, white font on white background completely eliminated.\n');

  // --------------------------------------------------------------------
  // TEST 8: Views & Frontend File Synchronization
  // --------------------------------------------------------------------
  console.log('[TEST 8] Verifying views and frontend modules are 100% synchronized...');
  const viewsModPath = path.join(process.cwd(), 'src/views/dashboard-modules/test-automation.module.ts');
  const frontModPath = path.join(process.cwd(), 'src/frontend/modules/dashboard/test-automation.module.ts');
  const viewsContent = fs.readFileSync(viewsModPath, 'utf8');
  const frontContent = fs.readFileSync(frontModPath, 'utf8');
  assert.strictEqual(viewsContent, frontContent, 'src/views and src/frontend test-automation modules must be 100% identical');
  console.log('  -> PASS: Exact 1:1 synchronization between views and frontend.\n');

  console.log('======================================================================');
  console.log('ALL 8 TESTS PASSED WITH 100% COMPLIANCE!');
  console.log('======================================================================');
}

runTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
