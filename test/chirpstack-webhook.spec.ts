import 'reflect-metadata';
import * as assert from 'assert';
import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

async function run() {
  const saved: any[] = [];
  const events: any[] = [];
  const db: any = {
    getRepositoryForTable: (table: string) => table === 'device_packets'
      ? { create: (v: any) => v, save: async (v: any) => { saved.push(v); return { ...v, id: '1' }; } }
      : { createQueryBuilder: () => ({ where: () => ({ getOne: async () => null }) }) },
    getDataSourceForTable: () => ({ query: async () => [] }),
  };
  const controller = new TestingAdapterController(db, { publishPluginLifecycle: (...args: any[]) => events.push(args) } as any);
  const oldToken = process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN;
  process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN = 'test-token';
  try {
    await assert.rejects(controller.ingestChirpstackUplink({}, 'wrong'), /Invalid webhook token/);
    await assert.rejects(controller.ingestChirpstackUplink({ deviceInfo: { devEui: 'bad' } }, 'test-token'), /valid devEui/);
    const result = await controller.ingestChirpstackUplink({
      deviceInfo: { devEui: '0102030405060708' }, data: 'AQID', fCnt: 0, fPort: 1,
      rxInfo: [{ rssi: -90, snr: 0 }], txInfo: { frequency: 923200000, modulation: { lora: { spreadingFactor: 7 } } },
    }, 'test-token');
    assert.strictEqual(result.success, true);
    assert.strictEqual(saved[0].device_id, null);
    assert.strictEqual(saved[0].raw_payload, '010203');
    assert.strictEqual(saved[0].snr, 0);
    assert.strictEqual(saved[0].f_cnt, 0);
    assert.strictEqual(saved[0].sf, 7);
    assert.strictEqual(saved[0].rf_info.decodeError, 'No active decoder matched');
    assert.strictEqual(events[0][0], 'testing:packet:received');

    const status = await controller.getChirpstackIntegrationStatus();
    assert.strictEqual(status.success, true);
    assert.strictEqual(status.data.webhookListening, true);
    assert.ok(status.data.supportedUplinkRoutes.includes('/lorawan/chirpstack/uplink'));

    console.log('Webhook auth, validation, unknown device persistence, RF metadata, status and realtime passed');
  } finally {
    if (oldToken === undefined) delete process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN;
    else process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN = oldToken;
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
