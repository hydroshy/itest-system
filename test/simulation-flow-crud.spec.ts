import * as assert from 'assert';
import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

async function run() {
  let fail = false;
  let linked = false;
  const queries: any[] = [];
  const row = { id: 'uuid', simu_id: 'SIMU-1', flow_blocks: [{ functionType: 'delay', delaySeconds: 15 }] };
  const ds = { query: async (sql: string, params: any[]) => {
    queries.push({ sql, params });
    if (fail) throw new Error('DB offline');
    if (sql.includes('SELECT b.batch_code')) return linked ? [{ batch_code: 'BATCH-1' }] : [];
    if (sql.includes('DELETE')) return [{ id: row.id }];
    if (sql.includes('INSERT')) return [];
    return [row];
  } };
  const controller = new TestingAdapterController({ getDataSourceForTable: () => ds } as any);
  const blocks = [
    { functionType: 'downlink', targetDevice: 'DUT', payloadHex: '0102' },
    { functionType: 'clear_downlink', targetDevice: 'REF' },
    { functionType: 'delay', delaySeconds: 15 },
  ];
  const saved = await controller.saveSimulationProfile({ simuId: 'SIMU-1', flowBlocks: blocks });
  assert.strictEqual(saved.data.duration, 15);
  assert.strictEqual(saved.data.flowBlocks[0].fPort, 1);
  assert.strictEqual(queries.find(q => q.sql.includes('INSERT')).params[9], 1);
  const updated = await controller.updateSimulationProfile('uuid', { flowBlocks: [{ functionType: 'delay', delaySeconds: 30 }] });
  assert.strictEqual(updated.data.simuId, 'SIMU-1');
  assert.strictEqual(updated.data.duration, 30);
  await assert.rejects(() => controller.saveSimulationProfile({ flowBlocks: [{ functionType: 'oops' }] }));
  linked = true;
  await assert.rejects(() => controller.deleteSimulationProfile('uuid'), /BATCH-1/);
  linked = false;
  assert.strictEqual((await controller.deleteSimulationProfile('uuid')).deleted, true);
  fail = true;
  await assert.rejects(() => controller.saveSimulationProfile({ flowBlocks: blocks }), /DB offline/);
  await assert.rejects(() => controller.deleteSimulationProfile('uuid'), /DB offline/);

  const originalFetch = global.fetch;
  const requests: any[] = [];
  global.fetch = (async (url: string, options: any) => {
    requests.push({ url, options });
    return { ok: true };
  }) as any;
  const runtime = new TestingAdapterController({
    getDataSourceForTable: () => ({ query: async () => [{ status: 'RUNNING' }] }),
    getRepositoryForTable: () => ({ findOne: async () => ({ apiUrl: 'http://chirpstack', apiToken: 'test' }) }),
  } as any);
  try {
    await (runtime as any).executeSimulationFlow('batch', blocks.slice(0, 2), [{ devEui: '0102030405060708', referenceDevEui: '1122334455667788' }]);
    assert.strictEqual(requests[0].options.method, 'POST');
    assert.strictEqual(JSON.parse(requests[0].options.body).queueItem.fPort, 1);
    assert.strictEqual(JSON.parse(requests[0].options.body).queueItem.data, 'AQI=');
    assert.strictEqual(requests[1].options.method, 'DELETE');
    assert.ok(requests[1].url.endsWith('/1122334455667788/queue'));
  } finally { global.fetch = originalFetch; }
  console.log('Simulation flow CRUD and queue tests passed');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
