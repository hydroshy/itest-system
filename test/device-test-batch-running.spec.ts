import 'reflect-metadata';
import * as assert from 'assert';
import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

async function run() {
  const owner = { user: { username: 'alice' } };
  const other = { user: { username: 'bob' } };
  const batches = [
    { id: 'a1', batch_code: 'A1', created_by: 'Alice', status: 'RUNNING' },
    { id: 'a2', batch_code: 'A2', created_by: 'alice', status: 'RUNNING' },
    { id: 'b1', batch_code: 'B1', created_by: 'bob', status: 'RUNNING' },
    { id: 'done', batch_code: 'DONE', created_by: 'alice', status: 'COMPLETED' },
  ].map(b => ({ ...b, started_at: new Date(), flow_duration_seconds: 3600 }));
  const items = batches.map(b => ({ id: `${b.id}-dut`, batch_id: b.id, serial_number: `${b.id}-serial`, status: 'RUNNING' }));
  const writes: string[] = [];
  const ds = {
    transaction: async (work: (manager: any) => Promise<any>) => work(ds),
    query: async (sql: string, params: any[] = []) => {
      if (sql.includes('SELECT') && sql.includes('device_test_batches')) {
        if (sql.includes('LOWER(created_by)') || sql.includes('LOWER(b.created_by)')) {
          assert.strictEqual(params[0], 'alice');
          return batches.filter(b => b.created_by.toLowerCase() === params[0].toLowerCase() && (!sql.includes("status = 'RUNNING'") || b.status === 'RUNNING'));
        }
        return batches.filter(b => b.id === params[0]);
      }
      if (sql.includes('UPDATE system_schema.device_test_batches')) {
        writes.push(sql);
        const b = batches.find(b => b.id === params[0] && b.status === 'RUNNING');
        if (!b) return [];
        b.status = 'STOPPED';
        return [b];
      }
      if (sql.includes('UPDATE system_schema.device_test_batch_items')) {
        writes.push(sql);
        items.filter(i => i.batch_id === params[0] && i.status === 'RUNNING').forEach(i => i.status = 'STOPPED');
        return [];
      }
      if (sql.includes('SELECT') && sql.includes('device_test_batch_items')) {
        return items.filter(i => i.batch_id === params[0]);
      }
      // No telemetry for these DUTs; exercise batch isolation, not decoder evaluation.
      return [];
    },
  };
  const controller = new TestingAdapterController({ getDataSourceForTable: () => ds } as any);
  const owned = await controller.getTestBatches({ username: 'bob', created_by: 'bob' }, owner);
  assert.deepStrictEqual(owned.data.map((b: any) => b.id), ['a1', 'a2', 'done']);
  const running = await controller.getRunningTestBatch(owner);
  assert.deepStrictEqual(running.data.map((b: any) => b.id), ['a1', 'a2']);

  await assert.rejects(() => controller.getTestBatchStatus('a1', other), (e: any) => e.getStatus() === 403);
  await assert.rejects(() => controller.cancelTestBatch('a1', other), (e: any) => e.getStatus() === 403);
  await assert.rejects(() => controller.getTestBatchById('a1', other), (e: any) => e.getStatus() === 403);
  await assert.rejects(() => controller.deleteTestBatch('a1', other), (e: any) => e.getStatus() === 403);
  await assert.rejects(() => controller.deleteTestBatch('a1', owner), (e: any) => e.getStatus() === 409);
  await assert.rejects(() => controller.cancelTestBatch('a1', {}), (e: any) => e.getStatus() === 401);
  assert.strictEqual(writes.length, 0, 'Unauthorized calls must not mutate batches');
  await assert.rejects(() => controller.cancelTestBatch('missing', owner), (e: any) => e.getStatus() === 404);

  const canceled = await controller.cancelTestBatch('a1', owner);
  assert.strictEqual(canceled.data.status, 'STOPPED');
  assert.strictEqual(items.find(i => i.batch_id === 'a1')?.status, 'STOPPED');
  assert.strictEqual(batches.find(b => b.id === 'a2')?.status, 'RUNNING');
  assert.strictEqual(items.find(i => i.batch_id === 'a2')?.status, 'RUNNING');
  assert.strictEqual(batches.find(b => b.id === 'b1')?.status, 'RUNNING');
  const remaining = await controller.getRunningTestBatch(owner);
  assert.deepStrictEqual(remaining.data.map((b: any) => b.id), ['a2']);

  const stopped = await controller.getTestBatchStatus('a1', owner);
  assert.strictEqual(stopped.data.status, 'STOPPED');
  assert.strictEqual(stopped.data.devices[0].serialNumber, 'a1-serial');
  const writeCount = writes.length;
  await assert.rejects(() => controller.startTestBatch('a2', { devices: [{ serialNumber: 'new-dut' }] }, owner), (e: any) => e.getStatus() === 409);
  assert.strictEqual(writes.length, writeCount, 'Restarting running batch must not replace devices');

  console.log('PASS: multiple owned batches, owner-only status/cancel, isolated cancellation, stopped status, and restart conflict');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
