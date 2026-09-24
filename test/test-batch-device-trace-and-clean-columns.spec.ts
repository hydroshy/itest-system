import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { TestAutomationService } from '../src/modules/d-modules/test-automation/test-automation.service';
import { TestAutomationRepository } from '../src/modules/d-modules/test-automation/test-automation.repository';
import { TestAutomationController } from '../src/modules/d-modules/test-automation/test-automation.controller';

async function runBatchDeviceTraceAndCleanColumnsTests() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: BATCH DEVICE TRACE, NO FAKE DATA & CLEAN COLUMNS');
  console.log('======================================================================\n');

  // Mock DB Service with memory fallback
  const mockDbService: any = {
    getRepositoryForTable: () => {
      throw new Error('Mock DB offline, fallback to memory');
    },
  };

  const repository = new TestAutomationRepository(mockDbService);
  const service = new TestAutomationService(repository);
  const controller = new TestAutomationController(service);

  // --------------------------------------------------------------------
  // TEST 1: Backend trace API endpoints (GET single & POST batch)
  // --------------------------------------------------------------------
  console.log('[TEST 1] Testing backend trace endpoints for real device inspection...');
  const singleTrace = await controller.getDeviceTrace('0080E11500001234');
  assert.strictEqual(singleTrace.devEUI, '0080E11500001234');
  assert.strictEqual(singleTrace.isOnline, false);
  assert.strictEqual(singleTrace.rssi, null);
  assert.strictEqual(singleTrace.snr, null);
  assert.strictEqual(singleTrace.lastSeenAt, null);

  const batchTrace = await controller.getBatchDeviceTrace(['0080E11500001234', '0080E11500005678']);
  assert.strictEqual(Array.isArray(batchTrace), true);
  assert.strictEqual(batchTrace.length, 2);
  assert.strictEqual(batchTrace[0].isOnline, false);
  assert.strictEqual(batchTrace[1].isOnline, false);
  console.log('  -> PASS: Backend trace endpoints return real trace state (no fake online or fake RSSI/SNR).');

  // --------------------------------------------------------------------
  // TEST 2: Dev simulation testing correctly supplies RSSI/SNR and marks online
  // --------------------------------------------------------------------
  console.log('\n[TEST 2] Verifying dev packet simulation correctly supplies RSSI/SNR for dev testing...');
  await service.createSession({
    soCode: 'SO-SIM-001',
    itemCode: 'WSLRW-ATH',
    sku: 'WSLRW-ATH',
    firmwareVersion: '6',
    devEUIs: ['0080E11500009999'],
    autoStart: true,
  });

  await service.processPacket({
    devEUI: '0080E11500009999',
    fPort: 1,
    fCnt: 1,
    payloadHex: '010100f50201025803010e10',
    rssi: -72,
    snr: 8.5,
  });

  const traceAfterSim = await service.getDeviceTrace('0080E11500009999');
  assert.strictEqual(traceAfterSim.isOnline, true);
  assert.strictEqual(traceAfterSim.rssi, -72);
  assert.strictEqual(traceAfterSim.snr, 8.5);
  assert.ok(traceAfterSim.lastSeenAt, 'lastSeenAt must be populated');
  console.log('  -> PASS: Dev simulation correctly provides verified telemetry for testing in dev.');

  // --------------------------------------------------------------------
  // TEST 3: Views and Frontend files are 100% byte-for-byte identical
  // --------------------------------------------------------------------
  console.log('\n[TEST 3] Verifying 1:1 synchronization between views and frontend modules...');
  const viewsPath = path.resolve(__dirname, '../src/views/dashboard-modules/test-automation.module.ts');
  const frontendPath = path.resolve(__dirname, '../src/frontend/modules/dashboard/test-automation.module.ts');

  const viewsContent = fs.readFileSync(viewsPath, 'utf8');
  const frontendContent = fs.readFileSync(frontendPath, 'utf8');
  assert.strictEqual(viewsContent, frontendContent, 'views and frontend modules must be 100% byte identical');
  console.log('  -> PASS: views and frontend modules are 100% byte identical.');

  // --------------------------------------------------------------------
  // TEST 4: Elimination of fake data
  // --------------------------------------------------------------------
  console.log('\n[TEST 4] Verifying elimination of fake hardcoded values in templates & scripts...');
  assert.ok(!viewsContent.includes('rssi: -65'), 'Must not contain hardcoded fake rssi: -65');
  assert.ok(!viewsContent.includes('snr: 9.8'), 'Must not contain hardcoded fake snr: 9.8');
  assert.ok(!viewsContent.includes('batteryVoltage: 3.6'), 'Must not contain hardcoded fake batteryVoltage: 3.6');
  console.log('  -> PASS: No hardcoded fake data found in test-automation modules.');

  // --------------------------------------------------------------------
  // TEST 5: Batch Test Table Columns (No Battery, No Recorded Pkts, Has RSSI/SNR)
  // --------------------------------------------------------------------
  console.log('\n[TEST 5] Verifying batch table header and cell columns...');
  assert.ok(viewsContent.includes('<th class="py-3 px-3.5 text-center">RSSI (best) | SNR (best)</th>'), 'Header must have RSSI (best) | SNR (best)');
  assert.ok(!viewsContent.includes('<th class="py-3 px-3.5 text-center">Battery</th>'), 'Header must NOT have Battery');
  assert.ok(!viewsContent.includes('<th class="py-3 px-3.5 text-center">Recorded Pkts</th>'), 'Header must NOT have Recorded Pkts');

  assert.ok(viewsContent.includes('fetchSingleDeviceTrace'), 'Must export fetchSingleDeviceTrace');
  assert.ok(viewsContent.includes('fetchBatchDevicesTrace'), 'Must export fetchBatchDevicesTrace');
  assert.ok(viewsContent.includes('loadingTrace'), 'Must export loadingTrace');
  assert.ok(viewsContent.includes('dev.isCheckingOnline'), 'Must support checking online state');
  assert.ok(viewsContent.includes('CHECKING...'), 'Must show CHECKING spinner badge');

  // Verify dev simulation button is labeled for dev testing
  assert.ok(viewsContent.includes('Simulate Packet (Dev Testing)'), 'Must indicate Dev Testing for packet simulation');

  console.log('  -> PASS: Batch table columns verified: Battery and Recorded Pkts removed, RSSI/SNR (best) displayed.');

  console.log('\n======================================================================');
  console.log('ALL 5 TESTS PASSED SUCCESSFULLY WITH 100% SPECIFICATION COMPLIANCE!');
  console.log('======================================================================');
}

runBatchDeviceTraceAndCleanColumnsTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
