import * as assert from 'assert';
import { ChirpStackApiClient } from '../src/backend/plugins/lorawan-chirpstack-core/chirpstack-api.client';
import { LoRaWanChirpStackService } from '../src/backend/plugins/lorawan-chirpstack-core/lorawan-chirpstack.service';

async function run() {
  const originalFetch = global.fetch;

  try {
    const client = new ChirpStackApiClient(5000);
    const server: any = {
      id: 'test-srv',
      name: 'ChirpStack Test',
      apiUrl: '192.168.1.110:8090', // Missing http:// scheme
      apiToken: 'test-token',
      tenantId: '',
    };

    let requestedUrl = '';
    let requestedHeaders: any = {};

    global.fetch = (async (url: string, opts: any) => {
      requestedUrl = url;
      requestedHeaders = opts?.headers || {};
      return {
        ok: true,
        status: 200,
        json: async () => ({ result: [{ id: 'tenant-1', name: 'Default Tenant' }] }),
      };
    }) as any;

    // 1. Test cleanUrl prepends http:// when scheme omitted and targets /api/tenants?limit=1 when tenantId is empty
    const result = await client.testConnection(server);
    assert.strictEqual(requestedUrl, 'http://192.168.1.110:8090/api/tenants?limit=1');
    assert.strictEqual(requestedHeaders['Authorization'], 'Bearer test-token');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.ok, true);

    // 2. Test service.testServerConnection returns both ok and success
    const service = new LoRaWanChirpStackService();
    const added = await service.addNetworkServer({
      name: 'Server 110',
      apiUrl: 'http://192.168.1.110:8090',
      apiToken: 'cs_token',
    });

    const srvResult = await service.testServerConnection(added.id);
    assert.strictEqual(srvResult.success, true);
    assert.strictEqual(srvResult.ok, true);
    assert.strictEqual(added.status, 'online');

    // 3. Test failure case returns ok: false, success: false and detailed message
    global.fetch = (async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })) as any;

    const failResult = await service.testServerConnection(added.id);
    assert.strictEqual(failResult.success, false);
    assert.strictEqual(failResult.ok, false);
    assert.strictEqual(added.status, 'offline');
    assert.ok(failResult.message.includes('401'));

    console.log('ChirpStack connection test unit tests passed successfully!');
  } finally {
    global.fetch = originalFetch;
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
