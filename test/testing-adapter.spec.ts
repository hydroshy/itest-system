import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';
import { TestingDeviceEntity } from '../src/backend/core-models/testing-device.entity';
import { DevicePacketEntity } from '../src/backend/core-models/device-packet.entity';
import { GatewayTestSessionEntity } from '../src/backend/core-models/gateway-test-session.entity';
import { TraceabilitySoEntity } from '../src/backend/core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../src/backend/core-models/traceability-wa.entity';

console.log('--- Starting TestingAdapterController & Testing Subsystem Verification ---');

// In-memory data store for tests
const inMemoryData: {
  devices: any[];
  packets: any[];
  gatewaySessions: any[];
  sos: any[];
  was: any[];
} = {
  devices: [],
  packets: [],
  gatewaySessions: [],
  sos: [
    {
      id: 'so-uuid-001',
      so_number: 'SO/2026/01855',
      customer_name: 'Smart City Corp',
      partner_email: 'sc@example.com',
      notes: 'Urban LoRaWAN Deployment',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  was: [
    {
      id: 'wa-uuid-001',
      so_id: 'so-uuid-001',
      so: { so_number: 'SO/2026/01855' },
      wa_number: 'WA/2026/00412',
      item_code: 'LR-SENSOR-TEMP-V1',
      planned_quantity: 50,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
};

function createMockRepository(table: string) {
  return {
    createQueryBuilder: (alias: string) => {
      const filters: any[] = [];
      let orderByField: string = '';
      let skipCount = 0;
      let takeCount = 100;

      const builder = {
        andWhere: (clause: string, params: any) => {
          filters.push({ clause, params });
          return builder;
        },
        where: (clause: string, params: any) => {
          filters.push({ clause, params });
          return builder;
        },
        orWhere: (clause: string, params: any) => {
          filters.push({ clause, params });
          return builder;
        },
        leftJoinAndSelect: () => builder,
        select: () => builder,
        addSelect: () => builder,
        orderBy: (order: string) => {
          orderByField = order;
          return builder;
        },
        skip: (val: number) => {
          skipCount = val;
          return builder;
        },
        take: (val: number) => {
          takeCount = val;
          return builder;
        },
        getMany: async () => {
          const list = (inMemoryData as any)[table] || [];
          return list.slice(skipCount, skipCount + takeCount);
        },
        getManyAndCount: async () => {
          const list = (inMemoryData as any)[table] || [];
          return [list.slice(skipCount, skipCount + takeCount), list.length];
        },
        getOne: async () => {
          const list = (inMemoryData as any)[table] || [];
          return list[list.length - 1] || null;
        },
        getRawMany: async () => {
          if (table === 'was') {
            return inMemoryData.was.map((w) => ({
              itemCode: w.item_code,
              waNumber: w.wa_number,
              waId: w.id,
              soId: w.so_id,
            }));
          }
          return [];
        },
      };
      return builder;
    },
    findOne: async (options: any) => {
      const list: any[] = (inMemoryData as any)[table] || [];
      if (options.where) {
        if (Array.isArray(options.where)) {
          return list.find((item) =>
            options.where.some((cond: any) =>
              Object.entries(cond).every(([k, v]) => (item as any)[k] === v),
            ),
          );
        }
        return list.find((item) =>
          Object.entries(options.where).every(([k, v]) => (item as any)[k] === v),
        );
      }
      return null;
    },
    find: async (options: any) => {
      const list: any[] = (inMemoryData as any)[table] || [];
      if (options.where) {
        return list.filter((item) =>
          Object.entries(options.where).every(([k, v]) => (item as any)[k] === v),
        );
      }
      return list;
    },
    create: (dto: any) => ({
      id: dto.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...dto,
      created_at: new Date(),
      updated_at: new Date(),
    }),
    save: async (entity: any) => {
      const list: any[] = (inMemoryData as any)[table] || [];
      const idx = list.findIndex((item) => item.id === entity.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entity, updated_at: new Date() };
        return list[idx];
      }
      list.push(entity);
      return entity;
    },
    remove: async (entity: any) => {
      const list: any[] = (inMemoryData as any)[table] || [];
      const idx = list.findIndex((item) => item.id === entity.id);
      if (idx >= 0) list.splice(idx, 1);
      return entity;
    },
  };
}

const mockDatabaseService: any = {
  getRepositoryForTable: (tableName: string) => {
    if (tableName === 'devices') return createMockRepository('devices');
    if (tableName === 'device_packets') return createMockRepository('packets');
    if (tableName === 'gateway_test_sessions') return createMockRepository('gatewaySessions');
    if (tableName === 'traceability_so') return createMockRepository('sos');
    if (tableName === 'traceability_wa') return createMockRepository('was');
    throw new Error(`Unknown table: ${tableName}`);
  },
};

const mockRealtimeService: any = {
  publishPluginLifecycle: (name: string, payload: any) => {},
  publishTelemetry: (payload: any) => {},
};

async function runTests() {
  const controller = new TestingAdapterController(mockDatabaseService, mockRealtimeService);

  console.log('1. Testing Traceability SO/WA/Item Code Lookup...');
  const soRes = await controller.lookupSalesOrders();
  if (soRes.data.length !== 1 || soRes.data[0].soNumber !== 'SO/2026/01855') {
    throw new Error(`SO lookup assertion failed: ${JSON.stringify(soRes)}`);
  }
  console.log('✓ SO Lookup successful.');

  const waRes = await controller.lookupWorkAuthorizations('so-uuid-001');
  if (waRes.data.length !== 1 || waRes.data[0].waNumber !== 'WA/2026/00412') {
    throw new Error(`WA lookup assertion failed: ${JSON.stringify(waRes)}`);
  }
  console.log('✓ WA Lookup successful.');

  const itemRes = await controller.lookupItemCodes('so-uuid-001', 'wa-uuid-001');
  if (itemRes.length !== 1 || itemRes[0].itemCode !== 'LR-SENSOR-TEMP-V1') {
    throw new Error(`Item Code lookup assertion failed: ${JSON.stringify(itemRes)}`);
  }
  console.log('✓ Item Code Lookup successful.');

  console.log('2. Testing Device Registration (SO -> WA -> Item Code)...');
  const regRes = await controller.registerDevice({
    serialNumber: 'SN-TEST-NODE-001',
    deviceName: 'LoRaWAN Temp Sensor #1',
    deviceType: 'lorawan_node',
    networkId: '0004A30B001F0001',
    soId: 'so-uuid-001',
    waId: 'wa-uuid-001',
    itemCode: 'LR-SENSOR-TEMP-V1',
    metadata: { model: 'TH-01', hwVersion: 'v1.2' },
  });

  if (!regRes.data.id || regRes.data.serialNumber !== 'SN-TEST-NODE-001') {
    throw new Error(`Register device failed: ${JSON.stringify(regRes)}`);
  }
  if (regRes.data.soNumber !== 'SO/2026/01855' || regRes.data.waNumber !== 'WA/2026/00412') {
    throw new Error(`Auto SO/WA resolution failed: ${JSON.stringify(regRes.data)}`);
  }
  console.log('✓ Device registered successfully with SO/WA resolution.');

  console.log('3. Testing Duplicate Serial Rejection...');
  let duplicateRejected = false;
  try {
    await controller.registerDevice({
      serialNumber: 'SN-TEST-NODE-001',
      deviceName: 'LoRaWAN Temp Sensor Duplicate',
    });
  } catch (err: any) {
    if (err.message.includes('already exists')) duplicateRejected = true;
  }
  if (!duplicateRejected) throw new Error('Duplicate serial was not rejected!');
  console.log('✓ Duplicate serial correctly rejected.');

  console.log('4. Testing Device Packets Ingestion & Dual Payload...');
  const packetRes = await controller.ingestPacket({
    networkId: '0004A30B001F0001',
    packetType: 'uplink',
    fPort: 2,
    fCnt: 105,
    rawPayload: '01010A',
    decodedPayload: { temperature: 25.6, humidity: 60.2, battery: 98 },
    rfInfo: { rssi: -65, snr: 9.5, gatewayEui: 'AA555A0000000001' },
  });

  if (packetRes.data.device_id !== regRes.data.id) {
    throw new Error(`Packet deviceId resolution failed! Expected ${regRes.data.id}, got ${packetRes.data.device_id}`);
  }
  if (packetRes.data.decoded_payload.temperature !== 25.6) {
    throw new Error(`Decoded payload mismatch: ${JSON.stringify(packetRes.data)}`);
  }
  console.log('✓ Device packet ingested with auto DevEUI/networkId resolution and dynamic JSONB.');

  console.log('5. Testing Device Details with Packets Query...');
  const devDetails = await controller.getDeviceById(regRes.data.id);
  if (devDetails.recentPackets.length !== 1 || devDetails.recentPackets[0].decodedPayload.temperature !== 25.6) {
    throw new Error(`Device recent packets retrieval failed: ${JSON.stringify(devDetails)}`);
  }
  console.log('✓ Device details and recent packets retrieved successfully.');

  console.log('5.1. Testing Simulation Devices Endpoint (Conflict Check with :id)...');
  const simDevs = await controller.getSimulationDevices();
  if (!simDevs || !simDevs.success || !Array.isArray(simDevs.data)) {
    throw new Error('getSimulationDevices failed');
  }
  const simFromId = await controller.getDeviceById('simulation');
  if (!simFromId || !simFromId.success || !Array.isArray(simFromId.data)) {
    throw new Error("getDeviceById('simulation') routing redirect failed");
  }
  console.log('✓ Simulation devices endpoint and routing conflict guard verified successfully.');

  console.log('6. Testing Gateway Test Sessions CRUD...');
  const sessionRes = await controller.createGatewaySession({
    gatewayId: 'GW-0004A30B001F0001',
    gatewayName: 'Outdoor LoRaWAN Gateway Gateway 1',
    sessionName: 'Pre-shipment Gateway Validation',
    status: 'IN_PROGRESS',
    summary: { firmwareCheck: 'PASS', uplinkTest: 'PASS' },
  });

  const sessionDetails = await controller.getGatewaySessionById(sessionRes.data.id);
  if (sessionDetails.gateway_id !== 'GW-0004A30B001F0001') {
    throw new Error(`Gateway session lookup failed: ${JSON.stringify(sessionDetails)}`);
  }
  console.log('✓ Gateway test session created and retrieved.');

  console.log('7. Testing Device Simulation Flow...');
  const profileRes = await controller.saveSimulationProfile({
    name: 'LoRaWAN Field Node Profile',
    devEui: '0004A30B001F0001',
    serialNumber: 'SN-TEST-NODE-001',
    region: 'AS923',
    fPort: 2,
    burstCount: 3,
    payloadHex: '01020304',
    decodedPayload: { temperature: 27.2, battery: 92 },
    rfInfo: { rssi: -70, snr: 9.0 },
  });
  if (!profileRes.success || !profileRes.data.id) {
    throw new Error(`Save simulation profile failed: ${JSON.stringify(profileRes)}`);
  }
  const profilesList = await controller.getSimulationProfiles();
  if (profilesList.data.length < 1) {
    throw new Error('Simulation profiles list is empty');
  }

  const simRunRes = await controller.runDeviceSimulation({
    devEui: '0004A30B001F0001',
    serialNumber: 'SN-TEST-NODE-001',
    burstCount: 3,
    fPort: 2,
    fCnt: 200,
    payloadHex: 'A1B2C3D4',
    decodedPayload: { temperature: 28.0, humidity: 55, battery: 90 },
    rfInfo: { rssi: -68, snr: 10.0 },
  });

  if (!simRunRes.success || simRunRes.data.packetsGenerated.length !== 3) {
    throw new Error(`Simulation run failed: ${JSON.stringify(simRunRes)}`);
  }
  if (simRunRes.data.packetsGenerated[0].fCnt !== 200 || simRunRes.data.packetsGenerated[1].fCnt !== 201) {
    throw new Error(`Simulation fCnt progression failed: ${JSON.stringify(simRunRes.data.packetsGenerated)}`);
  }
  console.log('✓ Device simulation generated burst packets with sequential fCnt.');

  console.log('8. Testing Device Auto Check Flow...');
  const rulesRes = controller.getAutoCheckRules();
  if (!rulesRes.success || !rulesRes.data.minRssi) {
    throw new Error(`Failed to get default autocheck rules: ${JSON.stringify(rulesRes)}`);
  }

  // PASS evaluation
  const passEvalRes = await controller.evaluateAutoCheck({
    target: { networkId: '0004A30B001F0001' },
    criteria: {
      minRssi: -100,
      maxRssi: -30,
      minSnr: -10,
      expectedFPort: 2,
      requiredFields: ['dev_eui', 'payload', 'temperature'],
      fieldRules: {
        temperature: { min: 20, max: 35 },
        battery: { min: 80 },
      },
    },
  });
  if (!passEvalRes.success || passEvalRes.data.verdict !== 'PASS') {
    throw new Error(`AutoCheck PASS evaluation failed: ${JSON.stringify(passEvalRes)}`);
  }
  if (passEvalRes.data.failedRules !== 0) {
    throw new Error(`Expected 0 failed rules, got ${passEvalRes.data.failedRules}`);
  }
  console.log('✓ AutoCheck evaluation passed with 100% compliance.');

  // FAIL evaluation
  const failEvalRes = await controller.evaluateAutoCheck({
    target: { networkId: '0004A30B001F0001' },
    criteria: {
      minRssi: -40, // actual is -68, should fail
      fieldRules: {
        battery: { min: 99 }, // actual is 90, should fail
      },
    },
  });
  if (!failEvalRes.success || failEvalRes.data.verdict !== 'FAIL') {
    throw new Error(`AutoCheck FAIL evaluation failed: ${JSON.stringify(failEvalRes)}`);
  }
  if (failEvalRes.data.failedRules < 2) {
    throw new Error(`Expected at least 2 failed rules, got ${failEvalRes.data.failedRules}`);
  }
  console.log('✓ AutoCheck evaluation correctly reported FAIL on out-of-range thresholds.');

  const historyRes = controller.getAutoCheckHistory();
  if (historyRes.data.length < 2) {
    throw new Error(`AutoCheck history incomplete: ${historyRes.data.length}`);
  }
  console.log('✓ AutoCheck history recorded all evaluations.');

  console.log('9. Testing Create Device Testing Sessions Endpoint...');
  const createSessionRes = await controller.createDeviceTestSession({
    serialNumber: 'SN-TEST-DUT-999',
    devEui: '70B3D57ED0059999',
    itemCode: 'ITEM-TEST-999',
    sku: 'WSLRW-TEST',
    sensorConnectivity: 'LoRaWAN',
    longFw: '5F1234',
    simuId: 'SIMU-ITEM-TEST-999-5F1234',
    flowConfig: [
      { id: 'b1', functionType: 'downlink', delaySeconds: 10, payloadHex: '0102' },
    ],
  });
  if (!createSessionRes || !createSessionRes.success || createSessionRes.data.status !== 'RUNNING') {
    throw new Error(`createDeviceTestSession failed: ${JSON.stringify(createSessionRes)}`);
  }
  const sessionId = createSessionRes.data.sessionId;
  const listSessionsRes = await controller.getDeviceTestSessions();
  if (!listSessionsRes.success || !Array.isArray(listSessionsRes.data) || listSessionsRes.data.length === 0) {
    throw new Error('getDeviceTestSessions failed');
  }
  const sessionDetail = await controller.getDeviceTestSessionById(sessionId);
  if (!sessionDetail.success || sessionDetail.data.sessionId !== sessionId) {
    throw new Error(`getDeviceTestSessionById failed for ${sessionId}`);
  }
  console.log('✓ Create Device Testing Sessions CRUD verified successfully.');

  console.log('\n================================================================');
  console.log('ALL TESTING ADAPTER CONTROLLER VERIFICATION TESTS PASSED 100%!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
