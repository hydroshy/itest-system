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
      if (/^(SAVEPOINT|RELEASE SAVEPOINT|ROLLBACK TO SAVEPOINT)/.test(sql)) return [];
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

  const started = new Date(Date.now() - 10000);
  const packet = (seconds: number, data: any) => ({
    created_at: new Date(started.getTime() + seconds * 1000).toISOString(),
    decoded_payload: data, raw_payload: 'abcd', f_cnt: seconds,
  });
  const dutPackets = [packet(8, { temperature: 25, battery: 90 }), packet(2, { temperature: 24, custom: false }), packet(-2, { old: true }), packet(4000, { outside: true })];
  const refPackets = [packet(3, { temperature: 24, humidity: 50 })];
  let stored: any;
  let failWrite = false;
  let withReference = true;
  let primaryMissing = false;
  let aborted = false;
  let rollbacks = 0;
  const telemetryDs = {
    transaction: async (work: any) => work(telemetryDs),
    query: async (sql: string, params: any[]) => {
      if (sql.startsWith('ROLLBACK TO SAVEPOINT')) { aborted = false; rollbacks++; return []; }
      if (aborted) throw new Error('current transaction is aborted, commands ignored until end of transaction block');
      if (sql.startsWith('SAVEPOINT') || sql.startsWith('RELEASE SAVEPOINT')) return [];
      if (sql.includes('SELECT * FROM system_schema.device_test_batches')) return [{
        id: 'timeline', created_by: 'alice', status: 'RUNNING', started_at: started, flow_duration_seconds: 3600,
      }];
      if (sql.includes('SELECT * FROM system_schema.device_test_batch_items')) return [{
        id: 'dut', serial_number: 'serial', dev_eui: 'aa', reference_dev_eui: withReference ? 'bb' : null,
      }];
      if (sql.includes('FROM devices.device_packets')) {
        if (primaryMissing) { aborted = true; throw new Error('relation devices.device_packets does not exist'); }
        return params[0] === 'aa' ? dutPackets : refPackets;
      }
      if (sql.includes('FROM system_schema.device_packets')) return params[0] === 'aa' ? dutPackets : refPackets;
      if (sql.includes('UPDATE system_schema.device_test_batch_items')) {
        if (failWrite) throw new Error('archive write failed');
        stored = JSON.parse(params[3]);
        return [];
      }
      throw new Error(`Unexpected telemetry SQL: ${sql}`);
    },
  };
  const telemetry = new TestingAdapterController({ getDataSourceForTable: () => telemetryDs } as any, {} as any);
  await telemetry.getTestBatchStatus('timeline', owner);
  assert.deepStrictEqual(stored.dut_packets.map((p: any) => p.data), [{ temperature: 24, custom: false }, { temperature: 25, battery: 90 }]);
  assert.strictEqual(stored.dut_packets[0].timestamp, dutPackets[1].created_at);
  assert.deepStrictEqual(stored.reference_packets[0].data, refPackets[0].decoded_payload);
  assert.strictEqual(stored.dut_packets[1].raw_payload, 'abcd');
  primaryMissing = true;
  await telemetry.getTestBatchStatus('timeline', owner);
  assert.strictEqual(rollbacks, 2, 'Each failed primary packet query must roll back before schema fallback');
  assert.strictEqual(aborted, false);
  assert.strictEqual(stored.dut_packets.length, 2);
  assert.strictEqual(stored.reference_packets.length, 1);
  primaryMissing = false;
  withReference = false;
  await telemetry.getTestBatchStatus('timeline', owner);
  assert.deepStrictEqual(stored.reference_packets, []);
  failWrite = true;
  await assert.rejects(() => telemetry.getTestBatchStatus('timeline', owner), /archive write failed/);

  console.log('PASS: owned batches, cancellation, restart conflict, timestamped DUT/reference packet archive, and write failure propagation');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
