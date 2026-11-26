import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';
import * as assert from 'node:assert/strict';

async function runGatewayTests() {
  console.log('--- Starting Gateway Proxy & Session Orchestration Tests ---');

  const createdRecords: any[] = [];
  const mockSessionRepo = {
    create: (data: any) => ({ ...data, id: 'test-session-uuid-123' }),
    find: async () => createdRecords,
    remove: async (items: any[]) => {
      for (const item of items) createdRecords.splice(createdRecords.indexOf(item), 1);
    },
    save: async (entity: any) => {
      if (!createdRecords.includes(entity)) createdRecords.push(entity);
      return entity;
    },
    createQueryBuilder: () => ({
      andWhere: () => {},
      skip: () => ({ take: () => ({ orderBy: () => ({ getManyAndCount: async () => [createdRecords, createdRecords.length] }) }) }),
    }),
    findOne: async ({ where }: any) => createdRecords.find(r => r.id === where.id),
  };

  const mockDbService: any = {
    getDataSourceForTable: () => null,
    getRepositoryForTable: (table: string, entityClass: any) => {
      return mockSessionRepo;
    },
  };

  const controller = new TestingAdapterController(mockDbService);

  // 1. Test Gateway Session Creation with full Traceability Metadata
  console.log('1. Testing createGatewaySession with full traceability payload...');
  const res = await controller.createGatewaySession({
    gatewayId: '0016C001F1E2D3C4',
    soNumber: 'SO-2026-TEST',
    waNumber: 'WA-2026-TEST',
    serialNumber: 'GW-0016C001F1E2D3C4',
    itemCode: 'GW-ETH-01',
    sku: 'SKU-GW-LTE-01',
    hardwareVersion: 'HW1.0',
    firmwareVersion: 'FW2.1.0',
    gatewayIp: '192.168.1.50',
    internetTestType: 'ETHERNET',
    regionTest: 'AS923',
    networkServerId: '00000000-0000-0000-0000-000000000001',
    configSnapshot: { test: true },
    forwarderConfig: { serverAddress: 'chirpstack.daviteq.com' },
  });

  if (res.data.gateway_id !== '0016C001F1E2D3C4') throw new Error('Gateway ID mismatch');
  if (res.data.so_number !== 'SO-2026-TEST') throw new Error('SO number mismatch');
  if (res.data.serial_number !== 'GW-0016C001F1E2D3C4') throw new Error('Serial mismatch');
  if (res.data.internet_test_type !== 'ETHERNET') throw new Error('Internet test type mismatch');
  console.log('✓ createGatewaySession passed.');

  // 2. Test Gateway Proxy Input Validation
  console.log('2. Testing getGatewayProxyConfig validation...');
  try {
    await controller.getGatewayProxyConfig('');
    throw new Error('Should fail without IP');
  } catch (err: any) {
    if (err.status !== 400 && err.message !== 'Query parameter "ip" is required') {
      throw err;
    }
    console.log('✓ getGatewayProxyConfig validation passed.');
  }

  console.log('3. Testing changeGatewayProxyConfig validation...');
  try {
    await controller.changeGatewayProxyConfig({});
    throw new Error('Should fail without gatewayIp');
  } catch (err: any) {
    if (err.status !== 400 && err.message !== 'Field "gatewayIp" is required') {
      throw err;
    }
    console.log('✓ changeGatewayProxyConfig validation passed.');
  }

  // 4. Test Gateway Test Batch Lifecycle (12-hour soak test)
  console.log('4. Testing Gateway Test Batch creation and 12-hour configuration...');
  const batchRes = await controller.createGatewayTestBatch({
    batchCode: 'GWB-TEST-001',
    batchName: 'Lô đo kiểm Gateway 12 giờ',
    soNumber: 'SO-2026-TEST',
    gateways: [
      { gatewayId: '0016C001F1E2D3C4', serialNumber: 'GW-0016C001F1E2D3C4', gatewayName: 'Gateway A', regionTest: 'EU868' },
      { gatewayId: '0016C001F1E2D3C5', serialNumber: 'GW-0016C001F1E2D3C5', gatewayName: 'Gateway B' },
    ],
  });
  if (batchRes.data.batch_code !== 'GWB-TEST-001') throw new Error('Batch code mismatch');
  if (batchRes.data.duration_seconds !== 43200) throw new Error('Batch duration must be 43200s (12 hours)');
  if (batchRes.data.gateways.length !== 2) throw new Error('Gateways count mismatch');
  console.log('✓ createGatewayTestBatch passed.');

  // 5. Test Start Gateway Batch & Live Countdown Status
  console.log('5. Testing startGatewayTestBatch and countdown timer status...');
  const startRes = await controller.startGatewayTestBatch(batchRes.data.id);
  if (startRes.data.status !== 'RUNNING') throw new Error('Batch status should be RUNNING');

  const runningRes = await controller.getRunningGatewayTestBatches();
  if (!runningRes.data.some((b: any) => b.id === batchRes.data.id)) throw new Error('Batch should be in running list');

  const statusRes = await controller.getGatewayTestBatchStatus(batchRes.data.id);
  if (!statusRes.data.isTesting) throw new Error('isTesting should be true');
  if (statusRes.data.flowDurationSeconds !== 43200) throw new Error('flowDurationSeconds must be 43200');
  console.log('✓ startGatewayTestBatch and status passed.');

  // 6. Test Uplink Packet Counting for Gateway from Webhook
  console.log('6. Testing gateway uplink packet counting via recordGatewayUplinkStats...');
  await (controller as any).recordGatewayUplinkStats([
    { gatewayId: '0016C001F1E2D3C4', rssi: -42, snr: 13.5 },
  ], '3531383163306c18');
  await (controller as any).recordGatewayUplinkStats([
    { gatewayId: '0016C001F1E2D3C4', rssi: -42 },
  ], 'DEADBEEF');
  await (controller as any).recordGatewayUplinkStats([
    { gatewayId: 'UNRELATED', rssi: -42 },
  ], '3531383163306c18');

  const afterUplinkStatus = await controller.getGatewayTestBatchStatus(batchRes.data.id);
  const targetGw = afterUplinkStatus.data.gateways.find((g: any) => g.gatewayId === '0016c001f1e2d3c4');
  if (!targetGw || targetGw.uplinkCount !== 1) throw new Error('Gateway uplinkCount should be 1');
  if (targetGw.lastRssi !== -42) throw new Error('Gateway lastRssi should be -42');
  console.log('✓ gateway uplink packet counting passed.');

  // 7. Test Complete Gateway Test Batch
  createdRecords.push({ id: 'other-so-session', gateway_id: '0016C001F1E2D3C4', status: 'RUNNING', so_number: 'OTHER-SO' });
  console.log('7. Testing completeGatewayTestBatch...');
  const completeRes = await controller.completeGatewayTestBatch(batchRes.data.id, { minUplinks: 1 });
  if (completeRes.data.status !== 'COMPLETED') throw new Error('Batch status should be COMPLETED');
  assert.deepEqual(createdRecords.map(s => s.id), ['other-so-session'], 'remove only active sessions for matching SO');
  console.log('✓ completeGatewayTestBatch passed.');

  // DB-backed batches must count after a process restart, not only in the controller's memory.
  const dbBatch: any = { ...batchRes.data, id: 'stored-batch', status: 'RUNNING',
    gateways: [{ gatewayId: '0016c001f1e2d3c4', regionTest: 'EU868', uplinkCount: 0 }], summary: {} };
  const queries: string[] = [];
  const dbController = new TestingAdapterController({
    getRepositoryForTable: () => ({ find: async () => [], save: async (s: any) => s }),
    getDataSourceForTable: () => ({ query: async (sql: string, params?: any[]) => {
      queries.push(sql);
      if (sql.startsWith('SELECT * FROM devices.gateway_test_batches WHERE status')) return [dbBatch];
      if (sql.startsWith('UPDATE devices.gateway_test_batches SET gateways')) {
        dbBatch.gateways = JSON.parse(params![0]);
        dbBatch.summary = JSON.parse(params![1]);
      }
      return [];
    } }),
  } as any);
  await (dbController as any).recordGatewayUplinkStats([{ gatewayId: '0016C001F1E2D3C4' }], '3531383163306C18');
  assert.equal(dbBatch.gateways[0].uplinkCount, 1);
  assert.equal(dbBatch.summary.totalUplinkPackets, 1);
  assert.ok(queries.some(q => q.startsWith('UPDATE devices.gateway_test_batches SET gateways')));
  await (dbController as any).recordGatewayUplinkStats([{ gatewayId: '0016C001F1E2D3C4' }], 'DEADBEEF');
  assert.equal(dbBatch.gateways[0].uplinkCount, 1, 'unrelated payload must not count');

  console.log('\n=============================================================');
  console.log('🎉 ALL GATEWAY CONTROLLER & PROXY VERIFICATION TESTS PASSED! 🎉');
  console.log('=============================================================\n');
}

runGatewayTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
