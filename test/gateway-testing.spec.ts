import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

async function runGatewayTests() {
  console.log('--- Starting Gateway Proxy & Session Orchestration Tests ---');

  const createdRecords: any[] = [];
  const mockSessionRepo = {
    create: (data: any) => ({ ...data, id: 'test-session-uuid-123' }),
    save: async (entity: any) => {
      createdRecords.push(entity);
      return entity;
    },
    createQueryBuilder: () => ({
      andWhere: () => {},
      skip: () => ({ take: () => ({ orderBy: () => ({ getManyAndCount: async () => [createdRecords, createdRecords.length] }) }) }),
    }),
    findOne: async ({ where }: any) => createdRecords.find(r => r.id === where.id),
  };

  const mockDbService: any = {
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
      { gatewayId: '0016C001F1E2D3C4', serialNumber: 'GW-0016C001F1E2D3C4', gatewayName: 'Gateway A' },
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
  ]);

  const afterUplinkStatus = await controller.getGatewayTestBatchStatus(batchRes.data.id);
  const targetGw = afterUplinkStatus.data.gateways.find((g: any) => g.gatewayId === '0016c001f1e2d3c4');
  if (!targetGw || targetGw.uplinkCount !== 1) throw new Error('Gateway uplinkCount should be 1');
  if (targetGw.lastRssi !== -42) throw new Error('Gateway lastRssi should be -42');
  console.log('✓ gateway uplink packet counting passed.');

  // 7. Test Complete Gateway Test Batch
  console.log('7. Testing completeGatewayTestBatch...');
  const completeRes = await controller.completeGatewayTestBatch(batchRes.data.id, { minUplinks: 1 });
  if (completeRes.data.status !== 'COMPLETED') throw new Error('Batch status should be COMPLETED');
  console.log('✓ completeGatewayTestBatch passed.');

  console.log('\n=============================================================');
  console.log('🎉 ALL GATEWAY CONTROLLER & PROXY VERIFICATION TESTS PASSED! 🎉');
  console.log('=============================================================\n');
}

runGatewayTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
