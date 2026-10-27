import { Test, TestingModule } from '@nestjs/testing';
import { DeviceAdapterController } from '../src/backend/plugins/device.adapter.controller';
import { DynamicDatabaseService } from '../src/backend/database/dynamic-database.service';
import { RealtimeService } from '../src/backend/realtime/modules/realtime/realtime.service';

async function runDeviceAdapterVerification() {
  console.log('--- Starting DeviceAdapterController & Subsystem Verification ---');

  const mockDbService = {
    getRepositoryForTable: (table: string, entity: any) => {
      if (table === 'traceability_so') {
        return {
          createQueryBuilder: () => ({
            andWhere: function () { return this; },
            skip: function () { return this; },
            take: function () { return this; },
            orderBy: function () { return this; },
            getManyAndCount: async () => [
              [
                {
                  id: 'so-1',
                  so_number: 'SO-TEST-001',
                  customer_name: 'Customer A',
                  partner_email: 'a@customer.com',
                  notes: 'Test',
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              ],
              1,
            ],
          }),
          findOne: async ({ where }: any) => ({
            id: where?.id || 'so-1',
            so_number: 'SO-TEST-001',
            customer_name: 'Customer A',
          }),
        };
      }
      if (table === 'traceability_wa') {
        return {
          createQueryBuilder: () => ({
            leftJoinAndSelect: function () { return this; },
            andWhere: function () { return this; },
            skip: function () { return this; },
            take: function () { return this; },
            orderBy: function () { return this; },
            getManyAndCount: async () => [
              [
                {
                  id: 'wa-1',
                  so_id: 'so-1',
                  so: { so_number: 'SO-TEST-001' },
                  wa_number: 'WA-TEST-001',
                  item_code: 'ITEM-TEST-001',
                  planned_quantity: 100,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              ],
              1,
            ],
            select: function () { return this; },
            getRawMany: async () => [{ item_code: 'ITEM-TEST-001' }],
          }),
          findOne: async () => ({
            id: 'wa-1',
            so_id: 'so-1',
            wa_number: 'WA-TEST-001',
            item_code: 'ITEM-TEST-001',
          }),
        };
      }
      if (table === 'devices') {
        return {
          createQueryBuilder: () => ({
            andWhere: function () { return this; },
            skip: function () { return this; },
            take: function () { return this; },
            orderBy: function () { return this; },
            getManyAndCount: async () => [
              [
                {
                  id: 'dev-1',
                  serial_number: 'SN-001',
                  network_id: 'NET-001',
                  device_name: 'Dev 1',
                  device_type: 'sensor',
                  plugin_id: 'device',
                  so_id: 'so-1',
                  so_number: 'SO-TEST-001',
                  wa_id: 'wa-1',
                  wa_number: 'WA-TEST-001',
                  item_code: 'ITEM-TEST-001',
                  status: 'active',
                  metadata: {},
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              ],
              1,
            ],
          }),
          findOne: async ({ where }: any) => {
            if (Array.isArray(where)) {
              return { id: 'dev-1', serial_number: 'SN-001', network_id: 'NET-001' };
            }
            if (where.serial_number === 'DUPLICATE') {
              return { id: 'dev-exist', serial_number: 'DUPLICATE' };
            }
            if (where.id === 'dev-1') {
              return {
                id: 'dev-1',
                serial_number: 'SN-001',
                network_id: 'NET-001',
                device_name: 'Dev 1',
                status: 'active',
              };
            }
            return null;
          },
          create: (dto: any) => ({ ...dto, id: 'dev-new-id', created_at: new Date() }),
          save: async (entity: any) => entity,
          remove: async () => true,
        };
      }
      if (table === 'device_packets') {
        return {
          createQueryBuilder: () => ({
            andWhere: function () { return this; },
            skip: function () { return this; },
            take: function () { return this; },
            orderBy: function () { return this; },
            getManyAndCount: async () => [[], 0],
          }),
          find: async () => [],
          create: (dto: any) => ({ ...dto, id: 'pkt-new-id', created_at: new Date() }),
          save: async (entity: any) => entity,
        };
      }
      throw new Error(`Unknown table ${table}`);
    },
  };

  const mockRealtimeService = {
    publishPluginLifecycle: () => {},
    publishTelemetry: () => {},
  };

  const controller = new DeviceAdapterController(
    mockDbService as any,
    mockRealtimeService as any,
  );

  console.log('1. Testing SO/WA/Item Lookup...');
  const soRes = await controller.lookupSalesOrders('TEST');
  if (soRes.total !== 1 || soRes.data[0].soNumber !== 'SO-TEST-001') {
    throw new Error('SO Lookup failed');
  }
  const waRes = await controller.lookupWorkAuthorizations('so-1');
  if (waRes.total !== 1 || waRes.data[0].waNumber !== 'WA-TEST-001') {
    throw new Error('WA Lookup failed');
  }
  const itemRes = await controller.lookupItemCodes('so-1', 'wa-1');
  if (itemRes.data[0] !== 'ITEM-TEST-001') {
    throw new Error('Item lookup failed');
  }
  console.log('✓ Lookup endpoints verified.');

  console.log('2. Testing Device Registration...');
  const regRes = await controller.registerDevice({
    serialNumber: 'SN-999',
    deviceName: 'Sensor 999',
    waId: 'wa-1',
  });
  if (regRes.data.so_number !== 'SO-TEST-001' || regRes.data.plugin_id !== 'device') {
    throw new Error('Device registration failed to resolve SO/WA');
  }
  console.log('✓ Device registration and SO/WA resolution passed.');

  console.log('3. Testing Duplicate Serial...');
  try {
    await controller.registerDevice({
      serialNumber: 'DUPLICATE',
      deviceName: 'Dup Sensor',
    });
    throw new Error('Should have thrown BadRequestException');
  } catch (err: any) {
    if (!err.message.includes('already exists')) throw err;
  }
  console.log('✓ Duplicate serial prevention verified.');

  console.log('4. Testing Packet Ingestion with Network ID Resolution...');
  const pktRes = await controller.ingestDevicePacket({
    networkId: 'NET-001',
    packetType: 'uplink',
    rawPayload: '01020304',
    decodedPayload: { temp: 25.5 },
  });
  if (pktRes.data.device_id !== 'dev-1' || pktRes.data.decoded_payload.temp !== 25.5) {
    throw new Error('Packet ingestion failed');
  }
  console.log('✓ Packet ingestion with device_id resolution passed.');

  console.log('\n=============================================================');
  console.log('🎉 ALL DEVICE ADAPTER CONTROLLER VERIFICATION TESTS PASSED! 🎉');
  console.log('=============================================================\n');
}

runDeviceAdapterVerification().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
