import * as assert from 'assert';
import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

async function run() {
  const originalFetch = global.fetch;
  const server = { id: 'server', isActive: true, tenantId: 'tenant', applicationId: 'app', apiUrl: 'https://example.invalid', apiToken: 'token' };
  const body = { serverId: 'server', regionCode: 'AU915', deviceClass: 'C', devEui: '0011223344556677', appKey: '0'.repeat(32) };
  try {
    for (const scenario of ['success', 'keys-failed', 'local-failed', 'exists']) {
      let keysCalls = 0;
      let insert = '';
      const repo = { findOne: async () => null, create: (value: any) => ({ ...value, id: 'local' }), save: async () => { if (scenario === 'local-failed') throw new Error('local unavailable'); } };
      const controller = new TestingAdapterController({
        getRepositoryForTable: (table: string) => table === 'network_servers' ? { findOne: async () => server } : repo,
        getDataSourceForTable: () => ({ query: async (sql: string) => { insert = sql; if (scenario === 'local-failed') throw new Error('history unavailable'); } }),
      } as any);
      global.fetch = (async (url: string) => {
        if (url.includes('device-profiles')) return { ok: true, json: async () => ({ result: [{ id: 'profile', region: 'AU915', supportsClassC: true }], totalCount: 1 }) };
        if (url.endsWith('/keys')) { keysCalls++; return { ok: scenario !== 'keys-failed', status: 500 }; }
        return { ok: scenario !== 'exists', status: scenario === 'exists' ? 409 : 200, text: async () => '' };
      }) as any;
      const result = await controller.registerDeviceFlow3Steps(body);
      assert.strictEqual(result.success, ['success', 'local-failed'].includes(scenario));
      assert.ok(insert.includes('region_code, class_mode, sensor_type'));
      if (scenario === 'local-failed') { assert.strictEqual(result.stages.local, 'failed'); assert.strictEqual(result.warnings.length, 2); }
      if (scenario === 'keys-failed') assert.ok(result.message.includes('Thiết bị đã tạo'));
      if (scenario === 'exists') { assert.strictEqual(keysCalls, 0); assert.strictEqual(result.stages.device, 'exists'); }
    }
    console.log('Registration results distinguish device, keys, local persistence and existing devices; SQL uses class_mode.');
  } finally { global.fetch = originalFetch; }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
