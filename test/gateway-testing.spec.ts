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

  console.log('\n=============================================================');
  console.log('🎉 ALL GATEWAY CONTROLLER & PROXY VERIFICATION TESTS PASSED! 🎉');
  console.log('=============================================================\n');
}

runGatewayTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
