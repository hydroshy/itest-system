import * as assert from 'assert';
import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

async function run() {
  const originalFetch = global.fetch;
  const oldWebhookUrl = process.env.TESTING_CHIRPSTACK_WEBHOOK_URL;
  const oldWebhookToken = process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN;

  try {
    // 1. Test bootstrap without env vars (skip silently)
    delete process.env.TESTING_CHIRPSTACK_WEBHOOK_URL;
    delete process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN;

    const mockDb: any = {
      getRepositoryForTable: () => ({ findOne: async () => null }),
      getDataSourceForTable: () => ({ query: async () => [] }),
    };

    let fetchCalled = false;
    global.fetch = (async () => {
      fetchCalled = true;
      return { ok: true, status: 200, json: async () => ({}) };
    }) as any;

    const controller = new TestingAdapterController(mockDb);
    await controller.onApplicationBootstrap();
    assert.strictEqual(fetchCalled, false, 'Fetch should not be called when env vars are missing');

    // 2. Test bootstrap with env vars configured
    process.env.TESTING_CHIRPSTACK_WEBHOOK_URL = 'http://lanlu.myvnc.com:3000/api/v1/lorawan/chirpstack/uplink';
    process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN = 'secret-token-123';

    const serverEntity = {
      id: 'server-1',
      isActive: true,
      apiUrl: 'http://chirpstack.internal:8080',
      applicationId: 'app-uuid-999',
      apiToken: 'jwt-chirpstack-token',
    };

    const mockDbWithServer: any = {
      getRepositoryForTable: (table: string) => {
        if (table === 'lorawan_chirpstack') {
          return {
            findOne: async (criteria: any) => serverEntity,
          };
        }
        return { findOne: async () => null };
      },
      getDataSourceForTable: () => ({ query: async () => [] }),
    };

    let fetchedUrl = '';
    let fetchedMethod = '';
    let fetchedBody: any = null;
    let fetchedHeaders: any = null;

    global.fetch = (async (url: string, opts: any) => {
      fetchedUrl = url;
      fetchedMethod = opts?.method || 'GET';
      if (opts?.body) {
        fetchedBody = JSON.parse(opts.body);
      }
      fetchedHeaders = opts?.headers;
      // First call is GET (check if existing), returns 404 (not existing)
      if (!opts?.method || opts?.method === 'GET') {
        return { ok: false, status: 404, text: async () => 'Not Found' };
      }
      // Second call is POST (create new integration)
      return { ok: true, status: 200, json: async () => ({}) };
    }) as any;

    const bootstrapController = new TestingAdapterController(mockDbWithServer);
    await bootstrapController.onApplicationBootstrap();

    assert.strictEqual(
      fetchedUrl,
      'http://chirpstack.internal:8080/api/applications/app-uuid-999/integrations/http',
      'Should register at ChirpStack v4 application integrations URL',
    );
    assert.strictEqual(fetchedMethod, 'POST', 'Should POST new integration if not existing');
    assert.strictEqual(
      fetchedBody?.integration?.eventEndpointUrl,
      'http://lanlu.myvnc.com:3000/api/v1/lorawan/chirpstack/uplink',
    );
    assert.strictEqual(
      fetchedBody?.integration?.headers?.['x-testing-webhook-token'],
      'secret-token-123',
    );

    // 3. Test explicit API call registerChirpstackHttpIntegration
    let putCalled = false;
    global.fetch = (async (url: string, opts: any) => {
      if (!opts?.method || opts?.method === 'GET') {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      if (opts?.method === 'PUT') {
        putCalled = true;
        return { ok: true, status: 200, json: async () => ({}) };
      }
      return { ok: false, status: 500 };
    }) as any;

    const manualResult = await bootstrapController.registerChirpstackHttpIntegration();
    assert.strictEqual(manualResult.success, true);
    assert.strictEqual(manualResult.data.applicationId, 'app-uuid-999');
    assert.strictEqual(manualResult.data.updated, true);
    assert.strictEqual(putCalled, true, 'Should PUT when integration already exists');

    console.log('ChirpStack bootstrap registration unit tests passed!');
  } finally {
    global.fetch = originalFetch;
    if (oldWebhookUrl !== undefined) process.env.TESTING_CHIRPSTACK_WEBHOOK_URL = oldWebhookUrl;
    else delete process.env.TESTING_CHIRPSTACK_WEBHOOK_URL;
    if (oldWebhookToken !== undefined) process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN = oldWebhookToken;
    else delete process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN;
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
