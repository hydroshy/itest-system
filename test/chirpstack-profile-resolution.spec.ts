import * as assert from 'assert';
import { ChirpStackApiClient } from '../src/backend/plugins/lorawan-chirpstack-core/chirpstack-api.client';
import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

async function run() {
  const originalFetch = global.fetch;
  const server = { id: 'server', isActive: true, tenantId: 'tenant', applicationId: 'app', apiUrl: 'https://example.invalid', apiToken: 'token', deviceProfileId: 'stale' };
  const controller = new TestingAdapterController({ getRepositoryForTable: () => ({ findOne: async () => server }) } as any);
  const body = { serverId: 'server', regionCode: 'EU868', devEui: '0011223344556677' };
  let posts = 0;
  try {
    for (const profiles of [[], [{ id: 'wrong', region: 'US915' }], [{ id: 'blank', region: '' }], [{ id: 'a', region: 'EU868' }, { id: 'b', region: 'EU868' }], [{ id: 'foreign', region: 'EU868', tenantId: 'other' }]]) {
      global.fetch = (async (_url: any, options: any) => {
        if (options?.method === 'POST') posts++;
        return { ok: true, json: async () => ({ result: profiles, totalCount: profiles.length }) };
      }) as any;
      await assert.rejects(() => controller.registerDeviceFlow3Steps(body), /Device Profile phù hợp/);
    }
    global.fetch = (async () => ({ ok: false, status: 503 })) as any;
    await assert.rejects(() => controller.registerDeviceFlow3Steps(body), /Không lấy được Device Profiles/);
    global.fetch = (async () => ({ ok: true, json: async () => ({ result: [{ id: 'real', region: 'EU868' }], totalCount: 1 }) })) as any;
    await assert.rejects(() => controller.registerDeviceFlow3Steps({ ...body, deviceProfileId: 'stale' }), /Device Profile phù hợp/);
    // A unique real match passes resolution and reaches the next validation.
    await assert.rejects(() => controller.registerDeviceFlow3Steps({ ...body, devEui: '' }), /deviceEUI/);
    // Explicit selection disambiguates real matches, but never accepts stale IDs.
    global.fetch = (async () => ({ ok: true, json: async () => ({ result: [{ id: 'a', region: 'EU868' }, { id: 'b', region: 'EU868' }], totalCount: 2 }) })) as any;
    await assert.rejects(() => controller.registerDeviceFlow3Steps({ ...body, devEui: '', deviceProfileId: 'b' }), /deviceEUI/);
    await assert.rejects(() => controller.registerDeviceFlow3Steps({ ...body, deviceClass: 'C' }), /Device Profile phù hợp/);
    const capabilityProfile = { id: 'au915', name: 'Generic profile', region: 'AU915', supportsClassB: true, supportsClassC: true, supportsOtaa: true };
    global.fetch = (async () => ({ ok: true, json: async () => ({ result: [capabilityProfile], totalCount: 1 }) })) as any;
    const mapped = await new ChirpStackApiClient(8000).listDeviceProfiles({ ...server, name: 'Test server', version: 'v4', status: 'online' });
    assert.strictEqual(mapped[0]?.supportsClassC, true);
    assert.strictEqual(mapped[0]?.supportsClassB, true);
    assert.strictEqual(mapped[0]?.supportsOtaa, true);
    for (const deviceClass of ['CLASS_A', 'CLASS_B', 'CLASS_C', '0', '1', '2']) {
      await assert.rejects(() => controller.registerDeviceFlow3Steps({ ...body, regionCode: 'AU915', deviceClass, devEui: '' }), /deviceEUI/);
    }
    global.fetch = (async () => ({ ok: true, json: async () => ({ result: [{ ...capabilityProfile, name: 'Class C', supportsClassC: false }], totalCount: 1 }) })) as any;
    await assert.rejects(() => controller.registerDeviceFlow3Steps({ ...body, regionCode: 'AU915', deviceClass: 'CLASS_C' }), /Device Profile phù hợp/);
    assert.strictEqual(posts, 0);
    console.log('Profile resolution rejects empty, wrong/blank region, ambiguous, foreign tenant, API failure and stale ID without provisioning.');
  } finally { global.fetch = originalFetch; }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
