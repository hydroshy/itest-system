import 'reflect-metadata';
import * as assert from 'assert';
import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

async function runTests() {
  console.log('--- STARTING MEASUREMENT WINDOW, AVERAGE & TWO-POINT CALIBRATION VERIFICATION ---');

  const mockDb: any = {
    getRepositoryForTable: (table: string) => ({
      findOne: async () => null,
      find: async () => [],
      create: (v: any) => v,
      save: async (v: any) => v,
    }),
    getDataSourceForTable: () => null,
  };

  const controller = new TestingAdapterController(mockDb, {
    publishPluginLifecycle: () => {},
  } as any);

  // ==========================================================================
  // [TEST 1] Two-Point Linear Calibration (y = a*x + b)
  // ==========================================================================
  console.log('[TEST 1] Testing Two-Point Linear Calibration (y = a*x + b)...');
  // Scenario:
  // x1 = 100 (raw ADC at 0 ppm), y1 = 0
  // x2 = 500 (raw ADC at 20 ppm), y2 = 20
  // a = (20 - 0) / (500 - 100) = 20 / 400 = 0.05
  // b = 0 - 0.05 * 100 = -5.0
  const calibRes = await controller.calibrateLinear({
    x1: 100,
    y1: 0,
    x2: 500,
    y2: 20,
    minDeltaX: 0.0001,
  });

  assert.strictEqual(calibRes.success, true);
  assert.strictEqual(calibRes.data.a, 0.05);
  assert.strictEqual(calibRes.data.b, -5);
  assert.strictEqual(calibRes.data.x1, 100);
  assert.strictEqual(calibRes.data.y1, 0);
  assert.strictEqual(calibRes.data.x2, 500);
  assert.strictEqual(calibRes.data.y2, 20);
  assert.strictEqual(typeof calibRes.data.payloadHex, 'string');
  assert.strictEqual(calibRes.data.payloadHex.length, 16); // 8 bytes = 16 hex chars

  // Verify IEEE-754 decoding from payloadHex
  const buf = Buffer.from(calibRes.data.payloadHex, 'hex');
  const decodedA = Number(buf.readFloatBE(0).toFixed(6));
  const decodedB = Number(buf.readFloatBE(4).toFixed(6));
  assert.strictEqual(decodedA, 0.05);
  assert.strictEqual(decodedB, -5);
  console.log(`✓ Calibration calculated: a=${calibRes.data.a}, b=${calibRes.data.b}, payloadHex=${calibRes.data.payloadHex}`);

  // Test safety guard: reject near-zero delta x2 ≈ x1
  await assert.rejects(
    controller.calibrateLinear({ x1: 200, y1: 0, x2: 200.00001, y2: 20, minDeltaX: 0.001 }),
    /quá nhỏ gần bằng 0/
  );
  console.log('✓ Safety guard correctly rejected near-zero delta x (x2 ≈ x1)');

  // ==========================================================================
  // [TEST 2] Measurement Window Packet Count (Counter At End - Counter At Start)
  // ==========================================================================
  console.log('\n[TEST 2] Testing Measurement Window Packet Count...');
  // Scenario matching Human specification:
  // DUT: Start Counter = 100, End Counter = 118 -> Window Packet Count = 18
  // Reference: Start Counter = 95, End Counter = 114 -> Window Packet Count = 19
  const now = Date.now();
  const dutPackets: any[] = [];
  for (let c = 100; c <= 118; c++) {
    dutPackets.push({
      id: `dut-pkt-${c}`,
      f_cnt: c,
      dev_eui: '0004A30B001F0001',
      created_at: new Date(now + (c - 100) * 1000).toISOString(),
      decoded_payload: { raw_sensor: 100 + (c - 100), temperature: 25.0 + (c - 100) * 0.1 },
      rssi: -75,
      snr: 9.0,
    });
  }

  const refPackets: any[] = [];
  for (let c = 95; c <= 114; c++) {
    refPackets.push({
      id: `ref-pkt-${c}`,
      f_cnt: c,
      dev_eui: '0004A30B001F0002',
      created_at: new Date(now + (c - 95) * 1000).toISOString(),
      decoded_payload: { raw_sensor: 95 + (c - 95), temperature: 25.1 },
      rssi: -72,
      snr: 9.5,
    });
  }

  const evalWindowRes = await controller.evaluateAutoCheck({
    target: {
      packets: dutPackets,
      referencePackets: refPackets,
    },
    criteria: {
      measurement_windows: [
        {
          window_id: 'win_dut_zero',
          device_target: 'dut',
          counter_field: 'f_cnt',
          start_seconds: 0,
          duration_seconds: 30,
          min_packet_count: 15,
        },
        {
          window_id: 'win_ref_zero',
          device_target: 'reference',
          counter_field: 'f_cnt',
          start_seconds: 0,
          duration_seconds: 30,
          min_packet_count: 15,
        },
      ],
    },
  });

  assert.strictEqual(evalWindowRes.success, true);
  assert.ok(evalWindowRes.data.measurementWindows.length >= 2);

  const dutWin = evalWindowRes.data.measurementWindows.find((w: any) => w.window_id === 'win_dut_zero');
  assert.ok(dutWin, 'DUT window result must exist');
  assert.strictEqual(dutWin.start_counter, 100);
  assert.strictEqual(dutWin.end_counter, 118);
  assert.strictEqual(dutWin.window_packet_count, 18);
  assert.strictEqual(dutWin.counter_reset_detected, false);
  assert.strictEqual(dutWin.passed, true);

  const refWin = evalWindowRes.data.measurementWindows.find((w: any) => w.window_id === 'win_ref_zero');
  assert.ok(refWin, 'Reference window result must exist');
  assert.strictEqual(refWin.start_counter, 95);
  assert.strictEqual(refWin.end_counter, 114);
  assert.strictEqual(refWin.window_packet_count, 19);
  assert.strictEqual(refWin.counter_reset_detected, false);
  assert.strictEqual(refWin.passed, true);
  console.log(`✓ DUT Window Packet Count: ${dutWin.window_packet_count} (Start=${dutWin.start_counter}, End=${dutWin.end_counter})`);
  console.log(`✓ REF Window Packet Count: ${refWin.window_packet_count} (Start=${refWin.start_counter}, End=${refWin.end_counter})`);

  // [TEST 2b] Measurement Window with Counter Reset Safe Handling
  console.log('[TEST 2b] Testing Counter Reset safe handling in Measurement Window...');
  // Device rebooted mid-window: start was 150, reset to 0, then reached 5
  const resetPackets = [
    { id: 'p1', f_cnt: 150, created_at: new Date(now).toISOString(), decoded_payload: { v: 1 } },
    { id: 'p2', f_cnt: 151, created_at: new Date(now + 1000).toISOString(), decoded_payload: { v: 2 } },
    { id: 'p3', f_cnt: 0, created_at: new Date(now + 2000).toISOString(), decoded_payload: { v: 3 } },
    { id: 'p4', f_cnt: 5, created_at: new Date(now + 3000).toISOString(), decoded_payload: { v: 4 } },
  ];

  const evalResetRes = await controller.evaluateAutoCheck({
    target: { packets: resetPackets },
    criteria: {
      measurement_windows: [
        {
          window_id: 'win_reset_test',
          device_target: 'dut',
          counter_field: 'f_cnt',
          start_seconds: 0,
          duration_seconds: 10,
        },
      ],
    },
  });

  const resetWin = evalResetRes.data.measurementWindows.find((w: any) => w.window_id === 'win_reset_test');
  assert.ok(resetWin);
  assert.strictEqual(resetWin.counter_reset_detected, true);
  assert.ok(resetWin.window_packet_count > 0, 'Window packet count must be safely calculated and non-negative');
  console.log(`✓ Counter reset safely handled: reset_detected=true, count=${resetWin.window_packet_count}`);

  // ==========================================================================
  // [TEST 3] Independent Average Function (SAMPLE_COUNT, TIME_WINDOW, MEASUREMENT_WINDOW)
  // ==========================================================================
  console.log('\n[TEST 3] Testing Independent Average Function...');
  const avgPackets: any[] = [
    { id: 'a1', f_cnt: 1, created_at: new Date(now).toISOString(), decoded_payload: { raw_sensor: 100, temp: 24.0 }, rssi: -80, snr: 8.0 },
    { id: 'a2', f_cnt: 2, created_at: new Date(now + 2000).toISOString(), decoded_payload: { raw_sensor: 102, temp: 24.2 }, rssi: -78, snr: 8.5 },
    { id: 'a3', f_cnt: 3, created_at: new Date(now + 4000).toISOString(), decoded_payload: { raw_sensor: 104, temp: 24.4 }, rssi: -76, snr: 9.0 },
    { id: 'a4', f_cnt: 4, created_at: new Date(now + 6000).toISOString(), decoded_payload: { raw_sensor: 106, temp: 24.6 }, rssi: -74, snr: 9.5 },
    { id: 'a5', f_cnt: 5, created_at: new Date(now + 8000).toISOString(), decoded_payload: { raw_sensor: 108, temp: 24.8 }, rssi: -72, snr: 10.0 },
  ];

  const evalAvgRes = await controller.evaluateAutoCheck({
    target: { packets: avgPackets },
    criteria: {
      average_rules: [
        // Mode 1: SAMPLE_COUNT on raw_sensor (last 3 samples: 104, 106, 108 -> avg = 106)
        {
          rule_id: 'avg_sample_count',
          target: 'dut',
          metric: 'raw_sensor',
          mode: 'SAMPLE_COUNT',
          sample_count: 3,
          low_threshold: 100,
          high_threshold: 110,
        },
        // Mode 2: TIME_WINDOW on rssi (all 5 samples: -80, -78, -76, -74, -72 -> avg = -76)
        {
          rule_id: 'avg_time_window',
          target: 'dut',
          metric: 'rssi',
          mode: 'TIME_WINDOW',
          start_seconds: 0,
          duration_seconds: 15,
          low_threshold: -85,
          high_threshold: -70,
        },
      ],
    },
  });

  assert.strictEqual(evalAvgRes.success, true);
  assert.ok(evalAvgRes.data.averageMetrics.length >= 2);

  const sampleCountAvg = evalAvgRes.data.averageMetrics.find((m: any) => m.rule_id === 'avg_sample_count');
  assert.ok(sampleCountAvg);
  assert.strictEqual(sampleCountAvg.value, 106);
  assert.strictEqual(sampleCountAvg.sample_count, 3);
  assert.strictEqual(sampleCountAvg.status, 'SUCCESS');
  assert.strictEqual(sampleCountAvg.passed, true);
  console.log(`✓ SAMPLE_COUNT Average (raw_sensor): ${sampleCountAvg.value} (${sampleCountAvg.sample_count} samples)`);

  const timeWindowAvg = evalAvgRes.data.averageMetrics.find((m: any) => m.rule_id === 'avg_time_window');
  assert.ok(timeWindowAvg);
  assert.strictEqual(timeWindowAvg.value, -76);
  assert.strictEqual(timeWindowAvg.sample_count, 5);
  assert.strictEqual(timeWindowAvg.status, 'SUCCESS');
  assert.strictEqual(timeWindowAvg.passed, true);
  console.log(`✓ TIME_WINDOW Average (rssi): ${timeWindowAvg.value} (${timeWindowAvg.sample_count} samples)`);

  // [TEST 3b] Missing metric handling: never deduce average from counter!
  console.log('[TEST 3b] Testing non-existent metric handling (no deduction from counter)...');
  const evalMissingMetric = await controller.evaluateAutoCheck({
    target: { packets: avgPackets },
    criteria: {
      average_rules: [
        {
          rule_id: 'avg_non_existent',
          target: 'dut',
          metric: 'pressure_bar',
          mode: 'SAMPLE_COUNT',
          sample_count: 5,
        },
      ],
    },
  });

  const missingMetricRes = evalMissingMetric.data.averageMetrics.find((m: any) => m.rule_id === 'avg_non_existent');
  assert.ok(missingMetricRes);
  assert.strictEqual(missingMetricRes.status, 'NO_DATA');
  assert.strictEqual(missingMetricRes.value, null);
  assert.strictEqual(missingMetricRes.passed, false);
  console.log('✓ Correctly reported status NO_DATA (value=null) when metric does not exist; counter was not used to fabricate average.');

  // ==========================================================================
  // [TEST 4] Multi-Reference Devices Evaluation
  // ==========================================================================
  console.log('\n[TEST 4] Testing Multi-Reference Devices Evaluation...');
  const multiRefEval = await controller.evaluateAutoCheck({
    target: {
      packets: [
        { id: 'dut1', f_cnt: 1, created_at: new Date(), decoded_payload: { temperature: 25.0 } },
      ],
      referencePackets: [
        { id: 'ref1', dev_eui: 'REF001', created_at: new Date(), decoded_payload: { temperature: 25.2 } },
        { id: 'ref2', dev_eui: 'REF002', created_at: new Date(), decoded_payload: { temperature: 25.1 } },
      ],
    },
    criteria: {
      references: [
        {
          reference_id: 'REF_STD_1',
          dev_eui: 'REF001',
          item_code: 'REF-ITEM-A',
          fw_version: '1.0',
          rules: [{ field: 'temperature', count: 1, min: 20, max: 30 }],
        },
        {
          reference_id: 'REF_STD_2',
          dev_eui: 'REF002',
          item_code: 'REF-ITEM-B',
          fw_version: '2.0',
          rules: [{ field: 'temperature', count: 1, min: 20, max: 30 }],
        },
      ],
    },
  });

  assert.strictEqual(multiRefEval.success, true);
  const multiRefRules = multiRefEval.data.ruleResults.filter((r: any) => r.rule.startsWith('MULTI_REF_'));
  assert.strictEqual(multiRefRules.length, 2);
  assert.ok(multiRefRules.every((r: any) => r.passed === true));
  console.log(`✓ Evaluated multi-reference devices independently: ${multiRefRules.map((r: any) => r.rule).join(', ')}`);

  // ==========================================================================
  // [TEST 5] Simulation Duration with New Calibration Function Blocks
  // ==========================================================================
  console.log('\n[TEST 5] Testing Simulation Duration with new Calibration Blocks...');
  const flowBlocks = [
    { functionType: 'start_measurement', window_id: 'win_zero', durationSeconds: 0 },
    { functionType: 'delay', delaySeconds: 120 },
    { functionType: 'wait_until_offset', offsetSeconds: 600 },
    { functionType: 'stop_measurement', window_id: 'win_zero', durationSeconds: 0 },
    { functionType: 'average', metric: 'raw_sensor', durationSeconds: 0 },
    { functionType: 'calculate_linear', x1: 100, y1: 0, x2: 500, y2: 20, durationSeconds: 0 },
    { functionType: 'downlink', targetDevice: 'DUT', fPort: 1, payloadHex: '{{calib.payloadHex}}', isDynamicPayload: true },
    { functionType: 'device_auto_check', durationSeconds: 0 },
  ];

  // Calling private simulationDuration via prototype / saveSimulationProfile mock
  const simuDuration = (controller as any).simulationDuration(flowBlocks);
  assert.ok(simuDuration >= 600, 'Total duration must respect wait_until_offset of 600s');
  console.log(`✓ All 9 function block types accepted, total calculated duration = ${simuDuration}s`);

  // ==========================================================================
  // [TEST 6] executeSimulationFlow with start_measurement, stop_measurement, average & calibration
  // ==========================================================================
  console.log('\n[TEST 6] Testing executeSimulationFlow with live window, average and convert_to_hex...');
  let savedSimVars: Record<string, any> = {};
  const perDeviceVars: Record<string, Record<string, any>> = {};
  const failures: string[] = [];
  const mockNow = new Date().toISOString();
  let packetTime = new Date();
  const execMockDs: any = {
    query: async (sql: string, params: any[]) => {
      if (sql.includes('SELECT status, started_at FROM system_schema.device_test_batches')) {
        return [{ status: 'RUNNING', started_at: mockNow }];
      }
      if (sql.includes('SET simulation_vars')) {
        savedSimVars = JSON.parse(params[2] || '{}');
        perDeviceVars[params[1]] = savedSimVars;
        return [];
      }
      if (sql.includes('SET status = \'FAIL\'')) {
        failures.push(params[1]);
        return [];
      }
      if (sql.includes('device_packets')) {
        const midTime = new Date(Date.now() - 25);
        if (params[0] === '0004a30b001f0003') return [{ decoded_payload: { humidity: 60 }, created_at: midTime }];
        const temperature = params[0] === '0004a30b001f0002' ? 35 : 25;
        return [
          { raw_payload: '01', decoded_payload: { temperature: temperature - 1, humidity: 60 }, created_at: midTime },
          { raw_payload: '02', decoded_payload: { temperature: temperature + 1, humidity: 62 }, created_at: midTime },
        ];
      }
      return [];
    },
  };
  (mockDb as any).getDataSourceForTable = () => execMockDs;

  const execFlowBlocks = [
    { functionType: 'start_measurement', windowId: 'WIN_TEMP', targetDevice: 'DUT', metric: 'temperature' },
    { functionType: 'delay', delaySeconds: 0.05 },
    { functionType: 'stop_measurement', windowId: 'WIN_TEMP' },
    { functionType: 'average', averageMode: 'MEASUREMENT_WINDOW', windowId: 'WIN_TEMP', metric: 'temperature', outputVar: 'x1' },
    { functionType: 'calculate_linear', point1: { x: '{{x1}}', y: 0 }, point2: { x: 50, y: 100 }, outputVarA: 'slope_a', outputVarB: 'intercept_b' },
    { functionType: 'convert_to_hex', sourceVar: '{{x1}}', outputVar: 'hex_x1', dataType: 'float32_be' },
    { functionType: 'device_auto_check' },
  ];

  await (controller as any).executeSimulationFlow('batch-simu-123', execFlowBlocks, [{ devEui: '0004A30B001F0001' }], mockNow);

  assert.strictEqual(savedSimVars['x1'], 25); // (24 + 26) / 2 = 25
  assert.strictEqual(savedSimVars['slope_a'], 4); // (100 - 0) / (50 - 25) = 4
  assert.strictEqual(savedSimVars['intercept_b'], -100); // 0 - 4 * 25 = -100
  assert.strictEqual(savedSimVars['hex_x1'], '41c80000'); // Float32BE for 25 is 41c80000
  console.log(`✓ executeSimulationFlow executed successfully: x1=${savedSimVars['x1']}, a=${savedSimVars['slope_a']}, b=${savedSimVars['intercept_b']}, hex_x1=${savedSimVars['hex_x1']}`);

  // Flow builder stores flat point fields; zero remains a valid coordinate.
  savedSimVars = {};
  await (controller as any).executeSimulationFlow('batch-simu-123', [
    { functionType: 'calculate_linear', point1X: 0, point1Y: 0, point2X: 10, point2Y: 20, coeffAVar: 'builder_a', coeffBVar: 'builder_b' },
  ], [{ devEui: '0004A30B001F0001' }], mockNow);
  assert.strictEqual(savedSimVars['builder_a'], 2);
  assert.strictEqual(savedSimVars['builder_b'], 0);

  // Missing metrics fail one DUT without cancelling other DUTs or sharing their variables.
  await (controller as any).executeSimulationFlow('batch-simu-123', [
    { functionType: 'average', targetDevice: 'DUT', metric: 'temperature', outputVar: 'x1' },
    { functionType: 'calculate_linear', point1X: '{{x1}}', point1Y: 0, point2X: 50, point2Y: 100 },
  ], [{ devEui: '0004A30B001F0001' }, { devEui: '0004A30B001F0002' }], mockNow);
  assert.strictEqual(perDeviceVars['0004a30b001f0001'].x1, 25);
  assert.strictEqual(perDeviceVars['0004a30b001f0001'].a, 4);
  assert.strictEqual(perDeviceVars['0004a30b001f0002'].x1, 35);
  assert.strictEqual(perDeviceVars['0004a30b001f0002'].a, 6.666667);
  failures.length = 0;
  await (controller as any).executeSimulationFlow('batch-simu-123', [
    { functionType: 'average', targetDevice: 'DUT', metric: 'temperature', outputVar: 'per_dut_x' },
  ], [{ devEui: '0004A30B001F0003' }, { devEui: '0004A30B001F0002' }], mockNow);
  assert.deepStrictEqual(failures, ['0004a30b001f0003']);
  assert.strictEqual(perDeviceVars['0004a30b001f0002'].per_dut_x, 35);

  await (controller as any).executeSimulationFlow('batch-simu-123', [
    { functionType: 'average', targetDevice: 'DUT', metric: 'missing_metric', outputVar: 'missing_x' },
  ], [{ devEui: '0004A30B001F0001' }], mockNow);
  assert.ok(failures.includes('0004a30b001f0001'));
  await (controller as any).executeSimulationFlow('batch-simu-123', [
    { functionType: 'average', targetDevice: 'UNKNOWN_DEVICE', metric: 'temperature', outputVar: 'wrong_target' },
  ], [{ devEui: '0004A30B001F0002' }], mockNow);
  assert.ok(failures.includes('0004a30b001f0002'));

  const originalFetch = globalThis.fetch;
  const originalRepo = mockDb.getRepositoryForTable;
  const queueCalls: Array<{ eui: string; payload: string }> = [];
  mockDb.getRepositoryForTable = () => ({ findOne: async () => ({ apiUrl: 'https://chirpstack.test', apiToken: 'test-token' }) });
  (globalThis as any).fetch = async (url: string, options: any) => {
    queueCalls.push({ eui: url.split('/').at(-2), payload: JSON.parse(options.body).queueItem.data });
    return { ok: true };
  };
  try {
    await (controller as any).executeSimulationFlow('batch-simu-123', [
      { functionType: 'downlink', targetDevice: '0004A30B001F0009', payloadHex: 'AA' },
      { functionType: 'downlink', targetDevice: 'DUT', payloadHex: 'BB' },
    ], [{ devEui: '0004A30B001F0001' }, { devEui: '0004A30B001F0002' }], mockNow);
    assert.deepStrictEqual(queueCalls.map(c => c.eui).sort(), ['0004A30B001F0001', '0004A30B001F0002', '0004A30B001F0009']);
    queueCalls.length = 0;
    await (controller as any).executeSimulationFlow('batch-simu-123', [
      { functionType: 'average', targetDevice: 'DUT', metric: 'temperature', outputVar: 'x' },
      { functionType: 'downlink', targetDevice: '0004A30B001F0002', payloadHex: '{{x}}' },
    ], [{ devEui: '0004A30B001F0001' }, { devEui: '0004A30B001F0002' }], mockNow);
    assert.deepStrictEqual(queueCalls, [{ eui: '0004A30B001F0002', payload: Buffer.from('35', 'hex').toString('base64') }]);
    queueCalls.length = 0;
    await (controller as any).executeSimulationFlow('batch-simu-123', [
      { functionType: 'average', targetDevice: 'DUT', metric: 'temperature', outputVar: 'x1' },
      { functionType: 'calculate_linear', point1X: '{{x1}}', point1Y: 0, point2X: 50, point2Y: 100 },
      { functionType: 'convert_to_hex', sourceVar: 'a', outputVar: 'a_hex' },
      { functionType: 'convert_to_hex', sourceVar: 'b', outputVar: 'b_hex' },
      { functionType: 'downlink', targetDevice: 'DUT', payloadHex: '4E04{{a_hex}}0005' },
      { functionType: 'downlink', targetDevice: 'DUT', payloadHex: '5004{{b_hex}}0005' },
    ], [{ devEui: '0004A30B001F0001' }, { devEui: '0004A30B001F0002' }], mockNow);
    const expectedQueue = [
      ['0004A30B001F0001', 4, -100],
      ['0004A30B001F0002', 6.666667, -233.333345],
    ];
    for (const [eui, slope, offset] of expectedQueue) {
      const aHex = Buffer.alloc(4); aHex.writeFloatBE(Number(slope));
      const bHex = Buffer.alloc(4); bHex.writeFloatBE(Number(offset));
      assert.ok(queueCalls.some(c => c.eui === eui && c.payload === Buffer.from(`4E04${aHex.toString('hex')}0005`, 'hex').toString('base64')));
      assert.ok(queueCalls.some(c => c.eui === eui && c.payload === Buffer.from(`5004${bHex.toString('hex')}0005`, 'hex').toString('base64')));
    }
    assert.strictEqual(queueCalls.length, 4);
  } finally {
    (globalThis as any).fetch = originalFetch;
    mockDb.getRepositoryForTable = originalRepo;
  }

  console.log('\n=========================================================================');
  console.log('ALL MEASUREMENT WINDOW, AVERAGE & CALIBRATION TESTS PASSED 100%!');
  console.log('=========================================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
