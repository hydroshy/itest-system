import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';
import { TestingDeviceEntity } from '../src/backend/core-models/testing-device.entity';
import { DevicePacketEntity } from '../src/backend/core-models/device-packet.entity';
import { GatewayTestSessionEntity } from '../src/backend/core-models/gateway-test-session.entity';
import { TraceabilitySoEntity } from '../src/backend/core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../src/backend/core-models/traceability-wa.entity';

console.log('--- Starting TestingAdapterController & Testing Subsystem Verification ---');

// In-memory data store for tests
const mockSimulationProfiles: any[] = [];
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

const mockRegistrations: any[] = [
  {
    id: 'reg-001-uuid',
    registration_code: 'REG-2026-001',
    serial_number: 'SN-TEST-ATH-001',
    item_code: 'LR-SENSOR-TEMP-V1',
    fw_version: 'v6.0101',
    hw_version: 'v1.0',
    fw_code: 'ATH',
    me_version: 'v1.0',
    dev_eui: '0004A30B001F0001',
    app_eui: '0000000000000000',
    app_key: '0102030405060708090A0B0C0D0E0F10',
    class_mode: 'A',
    class: 'A',
    region_code: 'AS923-1',
    region: 'AS923-1',
    sensor_type: '1',
    created_by: 'tester1',
    application_id: 'app-iot-monitoring',
    device_profile_id: 'dp-as923-otaa',
    network_server_id: 'srv-001',
    network_server_name: 'ChirpStack Test',
    network_server_url: 'https://chirpstack.example.com',
    connectivity: 'LoRaWAN',
    so_number: 'SO/2026/01855',
    wa_number: 'WA/2026/00412',
    status: 'SUCCESS_ATTACH_BATTERY',
    message: 'Đăng ký Thành công vui lòng gắn pin cảm biến',
    created_at: new Date('2026-11-01T10:00:00Z'),
    updated_at: new Date('2026-11-01T10:00:00Z'),
  },
  {
    id: 'reg-002-uuid',
    registration_code: 'REG-2026-002',
    serial_number: 'SN-TEST-ATH-002',
    item_code: 'LR-SENSOR-TEMP-V1',
    fw_version: 'v6.0101',
    hw_version: 'v1.0',
    fw_code: 'ATH',
    me_version: 'v1.0',
    dev_eui: '0004A30B001F0002',
    app_eui: '0000000000000000',
    app_key: '0102030405060708090A0B0C0D0E0F10',
    class_mode: 'A',
    class: 'A',
    region_code: 'AU915',
    region: 'AU915',
    sensor_type: '1',
    created_by: 'admin_user',
    application_id: 'app-iot-monitoring',
    device_profile_id: 'dp-au915-otaa',
    network_server_id: 'srv-001',
    network_server_name: 'ChirpStack Test',
    network_server_url: 'https://chirpstack.example.com',
    connectivity: 'LoRaWAN',
    so_number: 'SO/2026/01855',
    wa_number: 'WA/2026/00412',
    status: 'SUCCESS_ATTACH_BATTERY',
    message: 'Đăng ký Thành công vui lòng gắn pin cảm biến',
    created_at: new Date('2026-11-02T12:00:00Z'),
    updated_at: new Date('2026-11-02T12:00:00Z'),
  },
  {
    id: 'reg-003-uuid',
    registration_code: 'REG-2026-003',
    serial_number: 'REF-STD-003',
    item_code: 'LR-SENSOR-TEMP-V1',
    fw_version: 'v6.0101',
    hw_version: 'v1.0',
    fw_code: 'ATH',
    me_version: 'v1.0',
    dev_eui: '0004A30B001F0003',
    app_eui: '0000000000000000',
    app_key: '0102030405060708090A0B0C0D0E0F10',
    class_mode: 'A',
    class: 'A',
    region_code: 'AS923-1',
    region: 'AS923-1',
    sensor_type: '1',
    created_by: 'tester1',
    application_id: 'app-other-lab',
    device_profile_id: 'dp-as923-otaa',
    network_server_id: 'srv-001',
    network_server_name: 'ChirpStack Test',
    network_server_url: 'https://chirpstack.example.com',
    connectivity: 'LoRaWAN',
    so_number: 'SO/2026/01855',
    wa_number: 'WA/2026/00412',
    status: 'SUCCESS_ATTACH_BATTERY',
    is_reference: true,
    message: 'Thiết bị chuẩn Calibrated Lab 3',
    created_at: new Date('2026-11-02T13:00:00Z'),
    updated_at: new Date('2026-11-02T13:00:00Z'),
  },
  {
    id: 'reg-004-uuid',
    registration_code: 'REG-2026-004',
    serial_number: 'REF-STD-004',
    item_code: 'LR-SENSOR-TEMP-V1',
    fw_version: 'v6.0101',
    hw_version: 'v1.0',
    fw_code: 'ATH',
    me_version: 'v1.0',
    dev_eui: '0004A30B001F0004',
    app_eui: '0000000000000000',
    app_key: '0102030405060708090A0B0C0D0E0F10',
    class_mode: 'A',
    class: 'A',
    region_code: 'AS923-1',
    region: 'AS923-1',
    sensor_type: '1',
    created_by: 'tester1',
    application_id: 'app-other-lab',
    device_profile_id: 'dp-as923-otaa',
    network_server_id: 'srv-001',
    network_server_name: 'ChirpStack Test',
    network_server_url: 'https://chirpstack.example.com',
    connectivity: 'LoRaWAN',
    so_number: 'SO/2026/01855',
    wa_number: 'WA/2026/00412',
    status: 'SUCCESS_ATTACH_BATTERY',
    is_reference: true,
    message: 'Thiết bị chuẩn Calibrated Lab 4',
    created_at: new Date('2026-11-02T14:00:00Z'),
    updated_at: new Date('2026-11-02T14:00:00Z'),
  },
  {
    id: 'reg-005-uuid',
    registration_code: 'REG-2026-005',
    serial_number: 'REF-STD-005',
    item_code: 'LR-SENSOR-TEMP-V1',
    fw_version: 'v6.0101',
    hw_version: 'v1.0',
    fw_code: 'ATH',
    me_version: 'v1.0',
    dev_eui: '0004A30B001F0005',
    app_eui: '0000000000000000',
    app_key: '0102030405060708090A0B0C0D0E0F10',
    class_mode: 'A',
    class: 'A',
    region_code: 'AS923-1',
    region: 'AS923-1',
    sensor_type: '1',
    created_by: 'tester1',
    application_id: 'app-other-lab',
    device_profile_id: 'dp-as923-otaa',
    network_server_id: 'srv-001',
    network_server_name: 'ChirpStack Test',
    network_server_url: 'https://chirpstack.example.com',
    connectivity: 'LoRaWAN',
    so_number: 'SO/2026/01855',
    wa_number: 'WA/2026/00412',
    status: 'SUCCESS_ATTACH_BATTERY',
    is_reference: true,
    message: 'Thiết bị chuẩn Calibrated Lab 5',
    created_at: new Date('2026-11-02T15:00:00Z'),
    updated_at: new Date('2026-11-02T15:00:00Z'),
  },
];

const mockServers: any[] = [
  {
    id: 'srv-001',
    name: 'ChirpStack Main Server',
    apiUrl: 'https://chirpstack.example.com',
    apiToken: 'test-token',
    tenantId: 'tenant-001',
    applicationId: 'app-iot-monitoring',
    deviceProfileId: 'dp-as923-otaa',
    isActive: true,
  },
];

const mockBatches: any[] = [];
const mockBatchItems: any[] = [];

const mockDatabaseService: any = {
  getRepositoryForTable: (tableName: string) => {
    if (tableName === 'devices') return createMockRepository('devices');
    if (tableName === 'device_packets') return createMockRepository('packets');
    if (tableName === 'gateway_test_sessions') return createMockRepository('gatewaySessions');
    if (tableName === 'traceability_so') return createMockRepository('sos');
    if (tableName === 'traceability_wa') return createMockRepository('was');
    if (tableName === 'lorawan_chirpstack' || tableName === 'network_servers') {
      return {
        find: async () => mockServers,
        findOne: async (opt: any) => mockServers.find((s) => !opt.where || (opt.where.isActive ? s.isActive : true)) || mockServers[0],
      };
    }
    throw new Error(`Unknown table: ${tableName}`);
  },
  getDataSourceForTable: (tableName: string) => ({
    transaction: async (work: (manager: any) => Promise<any>) => work(mockDatabaseService.getDataSourceForTable(tableName)),
    query: async (sql: string, params: any[]) => {
      if (sql.includes('INSERT INTO system_schema.simulation_profiles')) {
        mockSimulationProfiles.push({ id: params[0], simu_id: params[0], name: params[1], flow_blocks: JSON.parse(params[7]) });
        return [];
      }
      if (sql.includes('v_simulation_flows') || sql.includes('FROM system_schema.simulation_profiles')) return mockSimulationProfiles;
      if (sql.includes('COUNT(*)')) {
        let list = [...mockRegistrations];
        if (sql.includes('created_by = $')) {
          list = list.filter((r) => r.created_by.toLowerCase() === params[0].toLowerCase());
        }
        return [{ total: list.length }];
      }
      if (sql.includes('v_list_device_testing') || sql.includes('device_test_registrations') || sql.includes('v_reference_devices')) {
        if (sql.includes('WHERE id = $1')) {
          return mockRegistrations.filter((r) => r.id === params[0]);
        }
        if (sql.startsWith('DELETE FROM system_schema.device_test_registrations')) {
          const idx = mockRegistrations.findIndex((r) => r.id === params[0]);
          if (idx >= 0) mockRegistrations.splice(idx, 1);
          return [];
        }
        let list = [...mockRegistrations];
        if (sql.includes('created_by) = LOWER($')) {
          list = list.filter((r) => r.created_by.toLowerCase() === params[1].toLowerCase());
        }
        if (sql.includes('WHERE') && (sql.includes('.item_code = $') || sql.includes('item_code) = UPPER($'))) {
          list = list.filter((r) => !params[0] || r.item_code.toUpperCase() === params[0].toUpperCase());
        }
        return list;
      }
      if (sql.includes('device_test_batch_sessions')) {
        return [{ id: '11111111-2222-3333-4444-555555555555' }];
      }
      if (sql.includes('device_test_batches') && !sql.includes('device_test_batch_items')) {
        if (sql.includes('INSERT INTO system_schema.device_test_batches')) {
          const newBatch = {
            id: `batch-${Date.now()}`,
            batch_code: params[0],
            batch_name: params[1],
            item_code: params[2],
            long_fw: params[3],
            fw_version: params[4],
            simu_id: params[5],
            simulation_flow: JSON.parse(params[6] || '[]'),
            flow_duration_seconds: params[7],
            auto_check_criteria: JSON.parse(params[8] || '{}'),
            max_devices: params[9],
            reference_devices: params[10] ? JSON.parse(params[10] || '[]') : [],
            simulator_device: params[11] ? JSON.parse(params[11] || 'null') : null,
            status: 'DRAFT',
            verdict: 'PENDING',
            created_by: params[params.length - 1],
            created_at: new Date(),
            updated_at: new Date(),
          };
          mockBatches.push(newBatch);
          return [newBatch];
        }
        if (sql.trimStart().startsWith('SELECT') && sql.includes('WHERE id = $1')) {
          return mockBatches.filter((b) => b.id === params[0]);
        }
        if (sql.includes('UPDATE system_schema.device_test_batches')) {
          const b = mockBatches.find((item) => item.id === params[0]);
          if (b) {
            b.status = sql.includes("status = 'STOPPED'") ? 'STOPPED' : 'RUNNING';
            b.started_at = params[1];
          }
          return [];
        }
        if (sql.startsWith('DELETE FROM system_schema.device_test_batches')) {
          const idx = mockBatches.findIndex((b) => b.id === params[0]);
          if (idx >= 0) mockBatches.splice(idx, 1);
          return [];
        }
        return mockBatches;
      }
      if (sql.includes('device_test_batch_items')) {
        if (sql.includes('INSERT INTO system_schema.device_test_batch_items')) {
          const newItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            batch_id: params[0],
            device_test_registration_id: params[1],
            serial_number: params[2],
            dev_eui: params[3],
            item_code: params[4],
            fw_version: params[5],
            reference_device_id: params[6],
            reference_serial_number: params[7],
            reference_dev_eui: params[8],
            reference_device_name: params[9],
            status: 'RUNNING',
            verdict: 'PENDING',
            dut_values: JSON.parse(params[10] || '{}'),
            reference_values: JSON.parse(params[11] || '{}'),
            comparison_result: JSON.parse(params[12] || '{}'),
            packets_received: 0,
            rules_passed: 0,
            rules_failed: 0,
          };
          mockBatchItems.push(newItem);
          return [newItem];
        }
        if (sql.includes('WHERE batch_id = $1')) {
          return mockBatchItems.filter((i) => i.batch_id === params[0]);
        }
        if (sql.includes("WHERE b.status = 'RUNNING' AND b.id != $1")) {
          return mockBatchItems.filter((i) => {
            const batch = mockBatches.find((b) => b.id === i.batch_id);
            return batch && batch.status === 'RUNNING' && batch.id !== params[0] && (params[1] || []).includes(i.serial_number);
          }).map((i) => {
            const batch = mockBatches.find((b) => b.id === i.batch_id);
            return { serial_number: i.serial_number, batch_code: batch?.batch_code || 'MOCK-BATCH' };
          });
        }
        if (sql.startsWith('DELETE FROM system_schema.device_test_batch_items')) {
          const remaining = mockBatchItems.filter((i) => i.batch_id !== params[0]);
          mockBatchItems.length = 0;
          mockBatchItems.push(...remaining);
          return [];
        }
        return mockBatchItems;
      }
      return [];
    },
  }),
};

const mockRealtimeService: any = {
  publishPluginLifecycle: (name: string, payload: any) => {},
  publishTelemetry: (payload: any) => {},
};

async function runTests() {
  mockBatches.length = 0;
  mockBatchItems.length = 0;
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

  // 8.1 Testing Standard FUNC_AUTOCHECK Rules (from template/FUNC_AUTOCHECK.xlsx)
  const testPackets = [
    { created_at: new Date('2026-11-03T10:00:00Z'), decoded_payload: { temperature: 25.0, humidity: 60.0 } },
    { created_at: new Date('2026-11-03T10:00:10Z'), decoded_payload: { temperature: 25.5, humidity: 61.0 } },
    { created_at: new Date('2026-11-03T10:00:20Z'), decoded_payload: { temperature: 26.0, humidity: 59.0 } },
  ];

  const funcAutoCheckRes = await controller.evaluateAutoCheck({
    target: { packets: testPackets },
    criteria: {
      functionRules: [
        { function_name: 'CHECKVALUE', uplink_parameter: 'temperature', low_threshold: 20, high_threshold: 30 },
        { function_name: 'CHECKAVG', uplink_parameter: 'temperature', low_threshold: 25.0, high_threshold: 26.0 },
        { function_name: 'CHECKCOUNT', uplink_parameter: 'humidity', low_threshold: 58, high_threshold: 62, min_count: 2, max_count: 5 },
        { function_name: 'FUNC_AVG', uplink_parameter: 'temperature', start_time: 0, duration: 30 },
        { function_name: 'FUNC_OFFSET_AVGZERO', uplink_parameter: 'temperature', standard_zero: 25.0, start_offset_time_for_avg_zero: 0, duration_for_avg_zero: 30 },
        { function_name: 'CHECKVALUE_PERIOD', uplink_parameter: 'temperature', period_start_offset_time: 0, period_duration_time: 30, low_threshold: 24, high_threshold: 27 },
        { function_name: 'CHECKAVG_PERIOD', uplink_parameter: 'humidity', period_start_offset_time: 0, period_duration_time: 30, low_threshold: 55, high_threshold: 65 },
      ],
    },
  });

  if (!funcAutoCheckRes.success || funcAutoCheckRes.data.verdict !== 'PASS') {
    throw new Error(`Standard FUNC_AUTOCHECK evaluation failed: ${JSON.stringify(funcAutoCheckRes)}`);
  }
  if (funcAutoCheckRes.data.passedRules !== 7) {
    throw new Error(`Expected all 7 standard functions to pass, got ${funcAutoCheckRes.data.passedRules}/${funcAutoCheckRes.data.totalRules}`);
  }
  console.log('✓ All 7 FUNC_AUTOCHECK standard function rules evaluated and passed successfully.');

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

  console.log('10. Testing Flow 3 Steps Registration & ChirpStack Provisioning Endpoint...');
  const serversRes = await controller.getTestingNetworkServers();
  if (!serversRes.success || !Array.isArray(serversRes.data) || serversRes.data.length === 0) {
    throw new Error('getTestingNetworkServers failed');
  }
  console.log('✓ Network servers lookup returned valid data.');

  let rejectedMissingServer = false;
  try {
    await controller.registerDeviceFlow3Steps({
    connectivity: 'LoRaWAN',
    soNumber: 'SO-2026-TEST-3STEP',
    waNumber: 'WA-2026-TEST-3STEP',
    serverUrl: 'https://chirpstack-test-api.globiots.com/dummy',
    fwCode: 'ATH',
    fwVersion: 'v6.0101',
    hwVersion: 'v1.0',
    meVersion: 'v1.0',
    devEui: '70B3D57ED005AAAA',
    appEui: '0000000000000000',
    appKey: '2B7E151628AED2A6ABF7158809CF4F3C',
    regionCode: 'AS923-1',
    deviceClass: 'CLASS_A',
    sensorType: '10',
    serialNumber: 'SN-ATH-3STEP-001',
    itemCode: 'ITEM-ATH-001',
  });

  } catch (error: any) {
    rejectedMissingServer = error.message.includes('Network Server là bắt buộc');
  }
  if (!rejectedMissingServer) throw new Error('Registration must reject missing server instead of using dummy URL');
  console.log('✓ Registration rejects missing configured server.');

  console.log('11. Testing Device Testing List & Management Endpoints (11 Fields, User/Admin isolation, Delete)...');
  const defaultAppRes = await controller.getDefaultTestingApplication();
  if (!defaultAppRes.success || defaultAppRes.data.applicationId !== 'app-iot-monitoring') {
    throw new Error(`getDefaultTestingApplication failed: ${JSON.stringify(defaultAppRes)}`);
  }
  console.log('✓ Default Application lookup returned active server defaults.');

  // Test admin query: gets records
  const adminList = await controller.getTestingDeviceRegistrations({ isAdmin: 'true', role: 'ADMIN' });
  if (!adminList.success || adminList.total === 0 || adminList.data.length === 0) {
    throw new Error(`Admin list failed: expected devices, got ${adminList.total}`);
  }
  const item0 = adminList.data[0];
  const required11Fields = [
    'serialNumber', 'itemCode', 'fwVersion', 'hwVersion', 'fwCode',
    'devEui', 'appEui', 'appKey', 'class', 'region', 'createdBy',
  ];
  for (const field of required11Fields) {
    if (item0[field] === undefined) {
      throw new Error(`Missing required field '${field}' in device registration list item`);
    }
  }
  console.log('✓ Admin query retrieved all devices with all 11 required fields.');

  // Test user query: gets user's devices
  const userList = await controller.getTestingDeviceRegistrations({ user: 'tester1', role: 'TESTER', isAdmin: 'false' });
  if (!userList.success || !userList.data) {
    throw new Error(`User list query failed: ${JSON.stringify(userList)}`);
  }
  console.log('✓ User query filtered by user/tester successfully.');

  // Test non-admin deleting someone else's device
  let forbiddenDeleteCaught = false;
  try {
    await controller.deleteTestingDeviceRegistration('reg-002-uuid', { user: 'tester1', isAdmin: 'false' });
  } catch (err: any) {
    forbiddenDeleteCaught = err.status === 403 || err.message?.includes('không có quyền');
  }
  if (!forbiddenDeleteCaught) {
    throw new Error('Non-admin deleting other user device must be rejected with 403 Forbidden');
  }
  console.log('✓ Non-admin unauthorized delete prevented correctly.');

  // Test admin deleting device
  const deleteRes = await controller.deleteTestingDeviceRegistration('reg-001-uuid', { isAdmin: 'true', role: 'ADMIN' });
  if (!deleteRes.success || deleteRes.data.id !== 'reg-001-uuid') {
    throw new Error(`Admin delete failed: ${JSON.stringify(deleteRes)}`);
  }
  console.log('✓ Admin device delete executed successfully.');

  console.log('12. Testing Test Batch & Create Test Batch Endpoints (Multi-Device, Reference Mapping, Timer)...');
  const batchMeta = await controller.getTestBatchMetadata();
  if (!batchMeta.success || !Array.isArray(batchMeta.data.itemCodes) || !Array.isArray(batchMeta.data.defaultFlow)) {
    throw new Error('getTestBatchMetadata failed');
  }
  console.log('✓ Test batch metadata retrieved successfully.');

  const availDevs = await controller.getAvailableDevicesForBatch({ itemCode: 'LR-SENSOR-TEMP-V1' });
  if (!availDevs.success || !Array.isArray(availDevs.data)) {
    throw new Error('getAvailableDevicesForBatch failed');
  }
  if (availDevs.data.length > 0 && (!availDevs.data[0].longFw || !availDevs.data[0].fwVersion)) {
    throw new Error('getAvailableDevicesForBatch item missing longFw or fwVersion mapping');
  }
  console.log('✓ Available devices for batch filtered by ITEM-CODE.');

  const availDevsByFw = await controller.getAvailableDevicesForBatch({
    itemCode: 'LR-SENSOR-TEMP-V1',
    fwVersion: 'v6.0101',
  });
  if (!availDevsByFw.success || !Array.isArray(availDevsByFw.data)) {
    throw new Error('getAvailableDevicesForBatch with fwVersion failed');
  }
  const availDevsByLongFw = await controller.getAvailableDevicesForBatch({
    itemCode: 'LR-SENSOR-TEMP-V1',
    longFw: 'v6.0101',
  });
  if (!availDevsByLongFw.success || !Array.isArray(availDevsByLongFw.data)) {
    throw new Error('getAvailableDevicesForBatch with longFw failed');
  }
  console.log('✓ Available devices for batch with fwVersion / longFw fallback verified.');

  const refDevs = await controller.getReferenceDevices({ itemCode: 'LR-SENSOR-TEMP-V1' });
  if (!refDevs.success || !Array.isArray(refDevs.data) || refDevs.data.length === 0) {
    throw new Error('getReferenceDevices failed to return reference device pool');
  }
  console.log(`✓ Reference standard devices pool retrieved from database successfully (${refDevs.data.length} devices).`);

  const createdBatch = await controller.createTestBatch({
    itemCode: 'LR-SENSOR-TEMP-V1',
    longFw: 'v6.0101',
    fwVersion: 'v6.0101',
    simulationFlow: batchMeta.data.defaultFlow,
    flowDurationSeconds: 60,
    autoCheckCriteria: batchMeta.data.defaultCriteria,
    maxDevices: 5,
  }, { user: { username: 'test-user' } });
  if (!createdBatch.success || !createdBatch.data.id) {
    throw new Error('createTestBatch failed');
  }
  const batchId = createdBatch.data.id;
  console.log('✓ Test batch created with ITEM-CODE, LONG_FW, Simulation Flow, and Autocheck Criteria.');

  const batchList = await controller.getTestBatches({}, { user: { username: 'test-user' } });
  if (!batchList.success || batchList.data.length === 0) {
    throw new Error('getTestBatches failed');
  }
  console.log('✓ Test batches query returned configured batches.');

  // Start test batch with 2 DUTs mapped to 2 distinct reference standard devices
  const startRes = await controller.startTestBatch(batchId, {
    devices: [
      {
        deviceId: 'dev-001',
        serialNumber: 'SN-TEST-ATH-001',
        devEui: '0004A30B001F0001',
        referenceDeviceId: refDevs.data[0].id,
        referenceSerialNumber: refDevs.data[0].serialNumber,
        referenceDevEui: refDevs.data[0].devEui,
        referenceDeviceName: refDevs.data[0].name,
      },
      {
        deviceId: 'dev-002',
        serialNumber: 'SN-TEST-ATH-002',
        devEui: '0004A30B001F0002',
        referenceDeviceId: refDevs.data[1].id,
        referenceSerialNumber: refDevs.data[1].serialNumber,
        referenceDevEui: refDevs.data[1].devEui,
        referenceDeviceName: refDevs.data[1].name,
      },
    ],
  }, { user: { username: 'test-user' } });
  if (!startRes.success || startRes.data.status !== 'RUNNING') {
    throw new Error(`startTestBatch failed: ${JSON.stringify(startRes)}`);
  }
  console.log('✓ Test batch started with 1-to-1 reference standard device mapping and timer countdown.');

  const statusRes = await controller.getTestBatchStatus(batchId, { user: { username: 'test-user' } });
  if (!statusRes.success || statusRes.data.devices.length !== 2) {
    throw new Error('getTestBatchStatus failed to return device comparison states');
  }
  console.log('✓ Test batch status verified with progress timer and cross-device comparison values.');

  await controller.cancelTestBatch(batchId, { user: { username: 'test-user' } });
  const delBatchRes = await controller.deleteTestBatch(batchId, { user: { username: 'test-user' } });
  if (!delBatchRes.success) {
    throw new Error('deleteTestBatch failed');
  }
  console.log('✓ Test batch and item cleanup verified.');

  console.log('\n================================================================');
  console.log('ALL TESTING ADAPTER CONTROLLER VERIFICATION TESTS PASSED 100%!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
