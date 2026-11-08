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
  const packet = (seconds: number, data: any, rssi = -50, snr = 8) => ({
    created_at: new Date(started.getTime() + seconds * 1000).toISOString(),
    decoded_payload: data, raw_payload: 'abcd', f_cnt: seconds, rssi, snr,
  });
  const dutPackets = [packet(8, { temperature: 25, battery: 90 }, -60, 6), packet(2, { temperature: 24, custom: false }, -40, 10), packet(-2, { old: true }), packet(4000, { outside: true })];
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
      if (sql.includes('so_test_batches')) return [{ so_number: 'SO/2026/001' }];
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
  assert.strictEqual(stored.avg_cycle, 0.1);
  assert.strictEqual(stored.avg_rssi, -50.0);
  assert.strictEqual(stored.avg_snr, 8.0);
  primaryMissing = false;
  withReference = false;
  await telemetry.getTestBatchStatus('timeline', owner);
  assert.deepStrictEqual(stored.reference_packets, []);

  // Verify no fallback to historical packets when no packets arrive after batch started
  let zeroPackets = true;
  const noUplinkDs = {
    transaction: async (work: any) => work(noUplinkDs),
    query: async (sql: string, params: any[]) => {
      if (/^(SAVEPOINT|RELEASE SAVEPOINT|ROLLBACK TO SAVEPOINT)/.test(sql)) return [];
      if (sql.includes('SELECT * FROM system_schema.device_test_batches')) return [{
        id: 'no-uplink', created_by: 'alice', status: 'RUNNING', started_at: started, flow_duration_seconds: 3600,
      }];
      if (sql.includes('SELECT * FROM system_schema.device_test_batch_items')) return [{
        id: 'dut-zero', serial_number: 'serial-zero', dev_eui: 'aa', reference_dev_eui: 'bb',
      }];
      if (sql.includes('FROM devices.device_packets') || sql.includes('FROM system_schema.device_packets')) {
        // Query must use created_at >= started_at filter and never LIMIT 5 without date filter
        assert(sql.includes('created_at >= $2::timestamptz'), 'Must query strictly with created_at >= started_at');
        assert(!sql.includes('LIMIT 5'), 'Must never fallback to LIMIT 5 historical packets');
        return []; // No packets after started_at
      }
      if (sql.includes('UPDATE system_schema.device_test_batch_items')) {
        stored = JSON.parse(params[3]);
        return [];
      }
      throw new Error(`Unexpected SQL in no-uplink test: ${sql}`);
    },
  };
  const noUplinkController = new TestingAdapterController({ getDataSourceForTable: () => noUplinkDs } as any, {} as any);
  await noUplinkController.getTestBatchStatus('no-uplink', owner);
  assert.strictEqual(stored.packets_since_start, 0);
  assert.strictEqual(stored.status, 'AWAITING_UPLINK');
  assert.strictEqual(stored.dut_temp, null);
  assert.strictEqual(stored.ref_temp, null);
  assert.strictEqual(stored.dut_hum, null);
  assert.strictEqual(stored.ref_hum, null);
  assert.strictEqual(stored.rssi, null);
  assert.strictEqual(stored.snr, null);
  assert.strictEqual(stored.last_packet_at, null);
  assert.strictEqual(stored.tolerance_pass, null);
  assert.strictEqual(stored.avg_cycle, null);
  assert.strictEqual(stored.avg_rssi, null);
  assert.strictEqual(stored.avg_snr, null);
  assert.deepStrictEqual(stored.dut_packets, []);
  assert.deepStrictEqual(stored.reference_packets, []);

  failWrite = true;
  await assert.rejects(() => telemetry.getTestBatchStatus('timeline', owner), /archive write failed/);

  // --- TEST: Available Devices User Scoping ---
  const allRegistrations = [
    { id: 'reg-1', serial_number: 'SN-ALICE-1', dev_eui: '1111111111111111', item_code: 'ITEM-A', fw_version: 'v1.0', created_by: 'alice', is_reference: false },
    { id: 'reg-2', serial_number: 'SN-BOB-1', dev_eui: '2222222222222222', item_code: 'ITEM-A', fw_version: 'v1.0', created_by: 'bob', is_reference: false },
    { id: 'reg-3', serial_number: 'REF-STD-1', dev_eui: '3333333333333333', item_code: 'ITEM-A', fw_version: 'v1.0', created_by: 'alice', is_reference: true },
  ];
  const userScopingDs = {
    query: async (sql: string, params: any[]) => {
      if (sql.includes('v_list_device_testing') || sql.includes('device_test_registrations')) {
        let rows = [...allRegistrations];
        if (sql.includes('LOWER(v.created_by) = LOWER($1)') || sql.includes('LOWER(r.created_by) = LOWER($1)')) {
          rows = rows.filter(r => r.created_by.toLowerCase() === params[0].toLowerCase());
        }
        if (sql.includes('is_reference, false) = false')) {
          rows = rows.filter(r => !r.is_reference);
        }
        return rows;
      }
      return [];
    },
  };
  const scopingController = new TestingAdapterController({ getDataSourceForTable: () => userScopingDs } as any, {} as any);

  // Alice sees only Alice's devices (and not reference device or Bob's device)
  const aliceDevices = await scopingController.getAvailableDevicesForBatch({}, owner);
  assert.strictEqual(aliceDevices.success, true);
  assert.strictEqual(aliceDevices.data.length, 1);
  assert.strictEqual(aliceDevices.data[0].serialNumber, 'SN-ALICE-1');

  // Carol (user with no devices) gets 0 devices
  const carolDevices = await scopingController.getAvailableDevicesForBatch({}, { user: { username: 'carol' } });
  assert.strictEqual(carolDevices.success, true);
  assert.strictEqual(carolDevices.data.length, 0);

  // Unauthenticated call gets 0 devices (no cross-user leak)
  const noUserDevices = await scopingController.getAvailableDevicesForBatch({});
  assert.strictEqual(noUserDevices.success, true);
  assert.strictEqual(noUserDevices.data.length, 0);

  // --- TEST: Batch Completion Auto-Delete & Traceability Push ---
  const completionQueries: string[] = [];
  const testBatchFinishedAt = new Date(Date.now() - 60000); // 60s ago
  const completionDs = {
    transaction: async (work: any) => work(completionDs),
    query: async (sql: string, params: any[] = []) => {
      completionQueries.push(sql);
      if (/^(SAVEPOINT|RELEASE SAVEPOINT|ROLLBACK TO SAVEPOINT)/.test(sql)) return [];
      if (sql.includes('SELECT * FROM system_schema.device_test_batches')) {
        return [{
          id: 'batch-finish',
          batch_code: 'BATCH-FINISH-01',
          created_by: 'alice',
          status: 'RUNNING',
          started_at: testBatchFinishedAt,
          flow_duration_seconds: 10, // already elapsed
        }];
      }
      if (sql.includes('SELECT * FROM system_schema.device_test_batch_items')) {
        return [{
          id: 'item-finish-1',
          batch_id: 'batch-finish',
          serial_number: 'SN-FINISH-DUT',
          dev_eui: 'AABBCCDDEEFF0011',
          packets_received: 5,
          comparison_result: { tolerance_pass: true, avg_cycle: 1.0, avg_rssi: -60, avg_snr: 9 },
        }];
      }
      if (sql.includes('SELECT') && sql.includes('device_packets')) {
        return [{
          dev_eui: 'AABBCCDDEEFF0011',
          created_at: new Date(Date.now() - 30000),
          payload_hex: '01020304',
          decoded_json: { temperature: 25.5, humidity: 60.0 },
          rssi: -65,
          snr: 8.5,
        }];
      }
      if (sql.includes('SELECT r.id, r.so_id') && sql.includes('device_test_registrations')) {
        return [{
          id: 'reg-finish-1',
          so_number: 'SO/2026/001',
          item_code: 'ITEM-TEST',
          created_by: 'alice',
        }];
      }
      if (sql.includes('SELECT id FROM traceability_manager.traceability_so')) {
        return [{ id: 'so-uuid-001' }];
      }
      if (sql.includes('INSERT INTO traceability_manager.traceability_device')) return [{ id: 'trace-dev-1' }];
      if (sql.includes('UPDATE traceability_manager.traceability_device')) return [{ id: 'trace-dev-1' }];
      if (sql.includes('DELETE FROM system_schema.device_test_registrations')) return [];
      if (sql.includes('UPDATE system_schema.device_test_batch_items')) return [];
      if (sql.includes('UPDATE system_schema.device_test_batches')) return [];
      return [];
    },
  };
  const completionController = new TestingAdapterController({
    getDataSourceForTable: () => completionDs,
    getRepositoryForTable: () => ({ delete: async () => {} }),
  } as any, {} as any);

  const completionStatus = await completionController.getTestBatchStatus('batch-finish', owner);
  assert.strictEqual(completionStatus.success, true);
  assert.strictEqual(completionStatus.data.status, 'COMPLETED');
  assert.strictEqual(completionStatus.data.verdict, 'PASS');

  // Verify traceability device was upserted
  const hasTraceabilityInsert = completionQueries.some(q =>
    q.includes('traceability_manager.traceability_device') && (q.includes('INSERT INTO') || q.includes('UPDATE'))
  );
  assert(hasTraceabilityInsert, 'Must push completed test results to traceability_manager.traceability_device');

  // Verify device was deleted from device_test_registrations
  const hasDeviceDelete = completionQueries.some(q =>
    q.includes('DELETE FROM system_schema.device_test_registrations') && q.includes('is_reference, false) = false')
  );
  assert(hasDeviceDelete, 'Must auto-delete tested DUT from system_schema.device_test_registrations upon batch completion');

  console.log('PASS: owned batches, cancellation, restart conflict, timestamped DUT/reference packet archive, no historical fallback, user scoping, and completion auto-delete with traceability push');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
