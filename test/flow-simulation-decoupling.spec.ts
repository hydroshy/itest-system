import * as assert from 'assert';
import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

class MockDataSource {
  public queries: { sql: string; params: any[] }[] = [];
  public rows: any[] = [];

  constructor(initialRows: any[] = []) {
    this.rows = initialRows;
  }

  async query(sql: string, params: any[] = []) {
    this.queries.push({ sql, params });
    if (sql.includes('SELECT b.batch_code')) return [];
    if (sql.includes('INSERT INTO system_schema.simulation_profiles')) {
      this.rows.push({ id: params[0], simu_id: params[0], name: params[1], flow_blocks: JSON.parse(params[7]) });
      return [];
    }
    if (sql.includes('v_simulation_flows') || sql.includes('system_schema.simulation_profiles')) {
      if (sql.startsWith('DELETE')) {
        const idToDelete = params[0];
        const prevLen = this.rows.length;
        this.rows = this.rows.filter((r) => r.id !== idToDelete && r.simu_id !== idToDelete);
        return [null, prevLen - this.rows.length];
      }
      if (sql.includes('WHERE id::text = $1 OR simu_id = $1')) {
        const targetId = params[0];
        return this.rows.filter((r) => r.id === targetId || r.simu_id === targetId);
      }
      return this.rows;
    }
    if (sql.includes('v_list_device_testing') || sql.includes('device_test_registrations')) {
      return [
        {
          id: 'dev-1',
          serial_number: 'SN-001',
          item_code: 'WSSFC-ATH',
          fw_version: '1.0.4',
          long_fw: 'v1.0.4-rc1',
          dev_eui: '0004A30B001F0001',
          status: 'ACTIVE',
          created_at: new Date(),
        },
        {
          id: 'dev-2',
          serial_number: 'SN-002',
          item_code: 'WSLRW-TEMP',
          fw_version: '2.0.0',
          long_fw: 'v2.0.0',
          dev_eui: '0004A30B001F0002',
          status: 'ACTIVE',
          created_at: new Date(),
        },
      ];
    }
    return [];
  }
}

class MockRepo {
  public savedItems: any[] = [];
  public findOneCalls = 0;

  async findOne() {
    this.findOneCalls++;
    return null;
  }
  create(dto: any) {
    return { ...dto };
  }
  async save(entity: any) {
    this.savedItems.push(entity);
    return entity;
  }
  createQueryBuilder() {
    return {
      where: () => this,
      orderBy: () => this,
      getMany: async () => [],
    };
  }
}

class MockDynamicDbService {
  public mockDs = new MockDataSource([
    {
      id: 'uuid-flow-1',
      simu_id: 'SIMU-FLOW-01',
      name: 'Flow AS923 Uplink 60s',
      profile_name: 'Flow AS923 Uplink 60s',
      item_code: 'WSSFC-ATH',
      long_fw: 'v1.0.4',
      sensor_connectivity: 'LoRaWAN',
      sku: 'WSSFC-ATH01',
      flow_blocks: JSON.stringify([
        { id: 'b1', functionType: 'downlink', targetDevice: 'DUT', fPort: 1, payloadHex: '01' },
        { id: 'b2', functionType: 'delay', delaySeconds: 60 },
      ]),
      flow_duration_minutes: 10,
      timed_actions: [],
      created_by: 'tester',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
  public mockDeviceRepo = new MockRepo();

  getDataSourceForTable() {
    return this.mockDs as any;
  }

  getRepositoryForTable() {
    return this.mockDeviceRepo as any;
  }
}

async function runVerification() {
  console.log('--- STARTING FLOW SIMULATION DECOUPLING & BATCH DEVICES VERIFICATION ---');

  const mockDb = new MockDynamicDbService();
  const controller = new TestingAdapterController(mockDb as any);

  // [TEST 1] saveSimulationProfile decouples flow from device creation
  console.log('[TEST 1] Testing saveSimulationProfile decoupling...');
  const saveRes = await controller.saveSimulationProfile({
    simuId: 'SIMU-MY-CUSTOM-FLOW',
    name: 'ATH Custom Flow 5 Min',
    itemCode: 'WSSFC-ATH',
    longFw: 'v1.0.4',
    sensorConnectivity: 'LoRaWAN',
    sku: 'WSSFC-ATH-01',
    flowBlocks: [
      { id: 'blk-1', functionType: 'downlink', targetDevice: 'DUT', payloadHex: '01' },
      { id: 'blk-2', functionType: 'delay', delaySeconds: 30 },
    ],
  });

  assert.strictEqual(saveRes.success, true);
  assert.strictEqual(saveRes.data.simuId, 'SIMU-MY-CUSTOM-FLOW');
  // Device repo should NOT have been called to save a fake device
  assert.strictEqual(mockDb.mockDeviceRepo.savedItems.length, 0, 'Should NOT auto-insert device into devices table');
  console.log('✓ Verified saveSimulationProfile does NOT create dummy device in devices table.');

  // [TEST 2] getSimulationProfiles returns DB and memory profiles
  console.log('[TEST 2] Testing getSimulationProfiles endpoint...');
  const profilesRes = await controller.getSimulationProfiles();
  assert.strictEqual(profilesRes.success, true);
  assert.ok(Array.isArray(profilesRes.data));
  assert.ok(profilesRes.data.length >= 2, 'Should contain both DB flow and newly saved flow');
  const foundFlow = profilesRes.data.find((f: any) => f.simuId === 'SIMU-MY-CUSTOM-FLOW');
  assert.ok(foundFlow, 'Newly saved flow must exist in list');
  assert.strictEqual(foundFlow.blocksCount, 2);
  assert.strictEqual(foundFlow.duration, 30); // Only delay blocks contribute
  console.log('✓ Verified getSimulationProfiles returns formatted flow profiles.');

  // [TEST 3] getSimulationProfileById
  console.log('[TEST 3] Testing getSimulationProfileById...');
  const singleFlow = await controller.getSimulationProfileById('SIMU-MY-CUSTOM-FLOW');
  assert.strictEqual(singleFlow.success, true);
  assert.strictEqual(singleFlow.data.simuId, 'SIMU-MY-CUSTOM-FLOW');
  console.log('✓ Verified getSimulationProfileById retrieves correct flow.');

  // [TEST 4] deleteSimulationProfile
  console.log('[TEST 4] Testing deleteSimulationProfile...');
  const deleteRes = await controller.deleteSimulationProfile('SIMU-MY-CUSTOM-FLOW');
  assert.strictEqual(deleteRes.success, true);
  const profilesAfter = await controller.getSimulationProfiles();
  const deletedStillExists = profilesAfter.data.some((f: any) => f.simuId === 'SIMU-MY-CUSTOM-FLOW');
  assert.strictEqual(deletedStillExists, false, 'Deleted flow must not exist in memory/DB list');
  console.log('✓ Verified deleteSimulationProfile removes flow.');

  // [TEST 5] getAvailableDevicesForBatch returns data & items array
  console.log('[TEST 5] Testing getAvailableDevicesForBatch...');
  const batchDevs = await controller.getAvailableDevicesForBatch({ itemCode: 'WSSFC-ATH' });
  assert.strictEqual(batchDevs.success, true);
  assert.ok(Array.isArray(batchDevs.data));
  assert.ok(Array.isArray(batchDevs.items));
  assert.strictEqual(batchDevs.data.length, 2);
  assert.strictEqual(batchDevs.items.length, 2);
  assert.strictEqual(batchDevs.data[0].itemCode, 'WSSFC-ATH');
  console.log('✓ Verified getAvailableDevicesForBatch returns both data and items arrays.');

  console.log('\n--- ALL FLOW SIMULATION DECOUPLING TESTS PASSED ---');
}

runVerification().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
