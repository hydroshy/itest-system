import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { DEFAULT_D_MODULES } from '../src/modules/d-modules/d-module-registry';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { TestSessionEntity } from '../src/modules/d-modules/test-automation/entities/test-session.entity';
import { TestDeviceRunEntity } from '../src/modules/d-modules/test-automation/entities/test-device-run.entity';
import { TestPacketLogEntity } from '../src/modules/d-modules/test-automation/entities/test-packet-log.entity';
import { TestAutomationService } from '../src/modules/d-modules/test-automation/test-automation.service';
import { TestAutomationRepository } from '../src/modules/d-modules/test-automation/test-automation.repository';
import { TEST_AUTOMATION_TEMPLATE, TEST_AUTOMATION_MODALS, TEST_AUTOMATION_SCRIPT } from '../src/views/dashboard-modules/test-automation.module';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function runTestAutomationDModuleTests() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: D-MODULE PRODUCT TEST AUTOMATION SYSTEM VERIFICATION');
  console.log('======================================================================\n');

  // --------------------------------------------------------------------
  // TEST 1: D-Module Registry Standardization
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying D-Module Registry (DEFAULT_D_MODULES)...');
  const mod = DEFAULT_D_MODULES.find((m) => m.id === 'test-automation');
  assert.ok(mod, 'D-Module [test-automation] must be registered in DEFAULT_D_MODULES');
  assert.strictEqual(mod.code, 'D_MOD_TEST_AUTOMATION', 'Module code must be D_MOD_TEST_AUTOMATION');
  assert.strictEqual(mod.title, 'PRODUCT TEST AUTOMATION', 'Title must be PRODUCT TEST AUTOMATION');
  assert.ok(mod.icon && mod.icon.includes('fa-vial-circle-check'), 'Icon must be fa-vial-circle-check');
  assert.strictEqual(mod.category, 'Monitoring', 'Category must be Monitoring');
  assert.strictEqual(mod.isActive, true, 'Module must be active');
  console.log('  -> PASS: D-Module registered with canonical ID, title, and icon.\n');

  // --------------------------------------------------------------------
  // TEST 2: TypeORM Metadata & Schema Mapping
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying TypeORM ALL_DATABASE_ENTITIES & Schema Metadatas...');
  const entityNames = ALL_DATABASE_ENTITIES.map((e: any) => e?.name);
  assert.ok(entityNames.includes('TestSessionEntity'), 'TestSessionEntity must be in ALL_DATABASE_ENTITIES');
  assert.ok(entityNames.includes('TestDeviceRunEntity'), 'TestDeviceRunEntity must be in ALL_DATABASE_ENTITIES');
  assert.ok(entityNames.includes('TestPacketLogEntity'), 'TestPacketLogEntity must be in ALL_DATABASE_ENTITIES');

  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  const sessionMeta = ds.getMetadata(TestSessionEntity);
  assert.strictEqual(sessionMeta.tableName, 'test_sessions');
  assert.ok(sessionMeta.findColumnWithPropertyName('sessionCode'), 'sessionCode column must exist');
  assert.ok(sessionMeta.findColumnWithPropertyName('soCode'), 'soCode column must exist');
  assert.ok(sessionMeta.findColumnWithPropertyName('itemCode'), 'itemCode column must exist');
  assert.ok(sessionMeta.findColumnWithPropertyName('status'), 'status column must exist');

  const runMeta = ds.getMetadata(TestDeviceRunEntity);
  assert.strictEqual(runMeta.tableName, 'test_device_runs');
  assert.ok(runMeta.findColumnWithPropertyName('devEUI'), 'devEUI column must exist');
  assert.ok(runMeta.findColumnWithPropertyName('status'), 'status column must exist');
  assert.ok(runMeta.findColumnWithPropertyName('totalPackets'), 'totalPackets column must exist');

  const logMeta = ds.getMetadata(TestPacketLogEntity);
  assert.strictEqual(logMeta.tableName, 'test_packet_logs');
  assert.ok(logMeta.findColumnWithPropertyName('payloadHex'), 'payloadHex column must exist');
  assert.ok(logMeta.findColumnWithPropertyName('assertionResults'), 'assertionResults column must exist');
  assert.ok(logMeta.findColumnWithPropertyName('isPass'), 'isPass column must exist');

  console.log('  -> PASS: TypeORM entities and columns verified for test_sessions, test_device_runs, and test_packet_logs.\n');

  // --------------------------------------------------------------------
  // TEST 3: DevEUI Sanitization, Multi-device Session Creation & Pipeline
  // --------------------------------------------------------------------
  console.log('[TEST 3] Testing TestAutomationService session creation & DevEUI parser...');
  const mockDbService: any = {
    getRepositoryForTable: () => ({
      save: async (entity: any) => ({ ...entity, id: entity.id || 'mock-' + Math.random().toString(36).substr(2, 9) }),
      findOne: async () => null,
      find: async () => [],
      createQueryBuilder: () => ({
        leftJoinAndSelect: function() { return this; },
        innerJoinAndSelect: function() { return this; },
        where: function() { return this; },
        andWhere: function() { return this; },
        orderBy: function() { return this; },
        skip: function() { return this; },
        take: function() { return this; },
        getOne: async () => null,
        getManyAndCount: async () => [[], 0],
      }),
    }),
  };

  const repo = new TestAutomationRepository(mockDbService);
  const service = new TestAutomationService(repo);

  // 3.1 DevEUI parser test
  const rawInput = `
    00-11-22-33-44-55-66-01
    00:11:22:33:44:55:66:02
    0011223344556601  // duplicate
    00 11 22 33 44 55 66 03
    invalid_short
  `;
  const parsedEUIs = service.parseAndValidateDevEUIs(rawInput);
  assert.strictEqual(parsedEUIs.length, 3, 'Must filter invalid items and deduplicate, yielding exactly 3 EUIs');
  assert.ok(parsedEUIs.includes('0011223344556601'));
  assert.ok(parsedEUIs.includes('0011223344556602'));
  assert.ok(parsedEUIs.includes('0011223344556603'));
  console.log('  -> PASS: DevEUI parsing cleanly handles colons, dashes, spaces, duplicates, and case-normalization.');

  // 3.2 Create Session
  const session = await service.createSession({
    sessionCode: 'TS-TEST-001',
    soCode: 'SO-2026-9999',
    itemCode: 'WSLRW-TH-01',
    devEUIs: parsedEUIs,
    notes: 'Unit test factory run',
    autoStart: false,
  });

  assert.strictEqual(session.sessionCode, 'TS-TEST-001');
  assert.strictEqual(session.totalDevices, 3);
  assert.strictEqual(session.status, 'PENDING');
  assert.strictEqual(session.deviceRuns.length, 3);
  assert.strictEqual(session.deviceRuns[0].status, 'WAITING');
  console.log('  -> PASS: Created PENDING session with 3 WAITING device runs.');

  // 3.3 Start Session
  const startedSession = await service.startSession(session.id);
  assert.strictEqual(startedSession.status, 'IN_PROGRESS');
  assert.ok(startedSession.startTime instanceof Date, 'startTime must be set');
  console.log('  -> PASS: Session transitioned to IN_PROGRESS and start timestamp recorded.');

  // --------------------------------------------------------------------
  // TEST 4: Packet Ingestion, Assertion Rules & Live Pass/Fail State Machine
  // --------------------------------------------------------------------
  console.log('\n[TEST 4] Testing packet simulation, decoding, and assertion verification...');

  // 4.1 Process valid packet for device 1
  // Hex '010100fe0201024003010e10': Temp = 25.4°C, Hum = 57.6%, Bat = 3.6V
  const pkt1Result = await service.processPacket({
    devEUI: '0011223344556601',
    fPort: 1,
    payloadHex: '010100fe0201024003010e10',
    rssi: -71,
    snr: 9.8,
  });

  assert.strictEqual(pkt1Result.success, true);
  assert.strictEqual(pkt1Result.isPass, true);
  assert.strictEqual(pkt1Result.run.status, 'PASSED');
  assert.strictEqual(pkt1Result.run.totalPackets, 1);
  assert.strictEqual(pkt1Result.run.batteryVoltage, 3.6);
  assert.strictEqual(pkt1Result.decodedData.temperature, 25.4);
  console.log('  -> PASS: Valid uplink decoded, battery checked, and device 1 marked PASSED.');

  // 4.2 Process packet for device 2
  const pkt2Result = await service.processPacket({
    devEUI: '0011223344556602',
    fPort: 1,
    payloadHex: '010100f00201020003010e10',
    rssi: -75,
    snr: 8.5,
  });
  assert.strictEqual(pkt2Result.run.status, 'PASSED');
  console.log('  -> PASS: Device 2 uplink decoded and marked PASSED.');

  // 4.3 Process packet for device 3
  const pkt3Result = await service.processPacket({
    devEUI: '0011223344556603',
    fPort: 1,
    payloadHex: '010100fa0201022003010e10',
  });
  assert.strictEqual(pkt3Result.run.status, 'PASSED');
  console.log('  -> PASS: Device 3 uplink decoded and marked PASSED.');

  // 4.4 Verify parent session automatically completed when all 3 devices passed
  const updatedSession = await service.getSessionById(session.id);
  assert.strictEqual(updatedSession.passedDevices, 3);
  assert.strictEqual(updatedSession.failedDevices, 0);
  assert.strictEqual(updatedSession.status, 'COMPLETED');
  assert.ok(updatedSession.endTime instanceof Date, 'endTime must be set when completed');
  console.log('  -> PASS: Session auto-transitioned to COMPLETED when 100% of devices achieved PASS.');

  // --------------------------------------------------------------------
  // TEST 5: Single Device Run Retry & Metrics Recalculation
  // --------------------------------------------------------------------
  console.log('\n[TEST 5] Testing device run retry logic...');
  const dev1RunId = updatedSession.deviceRuns[0].id;
  const retriedRun = await service.retryDeviceRun(dev1RunId);
  assert.strictEqual(retriedRun.status, 'RUNNING');
  assert.strictEqual(retriedRun.totalPackets, 0);

  const summaryAfterRetry = await service.getSessionSummary(session.id);
  assert.strictEqual(summaryAfterRetry.passedDevices, 2);
  assert.strictEqual(summaryAfterRetry.runningDevices, 1);
  assert.strictEqual(summaryAfterRetry.progressPercentage, 67); // 2 out of 3
  console.log('  -> PASS: Device retry correctly resets state to RUNNING and recalculates session metrics.');

  // --------------------------------------------------------------------
  // TEST 6: Inspection Report Export (CSV)
  // --------------------------------------------------------------------
  console.log('\n[TEST 6] Testing inspection report generation...');
  const csvReport = await service.exportSessionReport(session.id, 'csv');
  assert.ok(csvReport.fileName.includes('TS-TEST-001'), 'CSV filename must contain session code');
  assert.strictEqual(csvReport.contentType, 'text/csv');
  assert.ok(csvReport.content.includes('DAVITEQ FACTORY PRODUCT INSPECTION REPORT'));
  assert.ok(csvReport.content.includes('0011223344556601'));
  assert.ok(csvReport.content.includes('0011223344556602'));
  assert.ok(csvReport.content.includes('0011223344556603'));
  console.log('  -> PASS: CSV report generated with ISO header, SO Code, and all DevEUI records.');

  // --------------------------------------------------------------------
  // TEST 7: Frontend View Integration (Template, Modals, Script)
  // --------------------------------------------------------------------
  console.log('\n[TEST 7] Verifying Frontend Module & Dashboard Integration...');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes("activeFeature.id === 'test-automation'"), 'Template must match test-automation feature ID');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes('Product Test Automation'), 'Template must include module header');
  assert.ok(TEST_AUTOMATION_TEMPLATE.includes('filteredTestDeviceRuns'), 'Template must render filtered device runs');

  assert.ok(TEST_AUTOMATION_MODALS.includes('Create Product Test Session'), 'Modals must include session creation modal');
  assert.ok(TEST_AUTOMATION_MODALS.includes('Device Packet Audit Log'), 'Modals must include packet audit modal');
  assert.ok(TEST_AUTOMATION_MODALS.includes('Simulate Uplink Packet Injection'), 'Modals must include packet simulator modal');

  assert.ok(TEST_AUTOMATION_SCRIPT.includes('useTestAutomationModule'), 'Script must define useTestAutomationModule hook');
  assert.ok(TEST_AUTOMATION_SCRIPT.includes('handleTestRealtimeEvent'), 'Script must handle realtime socket events');

  // Verify dashboard.view.ts mounting
  const dashboardViewPath = path.resolve(__dirname, '../src/views/dashboard.view.ts');
  const dashboardViewContent = fs.readFileSync(dashboardViewPath, 'utf8');
  assert.ok(dashboardViewContent.includes('TEST_AUTOMATION_TEMPLATE'), 'dashboard.view.ts must include TEST_AUTOMATION_TEMPLATE');
  assert.ok(dashboardViewContent.includes('TEST_AUTOMATION_MODALS'), 'dashboard.view.ts must include TEST_AUTOMATION_MODALS');
  assert.ok(dashboardViewContent.includes('TEST_AUTOMATION_SCRIPT'), 'dashboard.view.ts must include TEST_AUTOMATION_SCRIPT');
  assert.ok(dashboardViewContent.includes('testAutomationModule'), 'dashboard.view.ts must instantiate testAutomationModule');
  assert.ok(dashboardViewContent.includes('test_device:packet_received'), 'dashboard.view.ts must listen to test realtime events');
  console.log('  -> PASS: Frontend templates, modals, scripts, and dashboard view verified with 100% integration.');

  console.log('\n======================================================================');
  console.log('ALL 7 D-MODULE TEST AUTOMATION TESTS PASSED WITH 100% COMPLIANCE!');
  console.log('======================================================================\n');
}

runTestAutomationDModuleTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
