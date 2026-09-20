import * as assert from 'assert';
import {
  TestBuilderService,
  VI_TO_EN_FIELD_LABELS,
  formatFieldLabel,
  sanitizeFieldLabel,
  sanitizeNodeLabel,
  sanitizeScript,
} from '../src/modules/c-modules/test-builder/test-builder.service';
import { FlowGraphEngineService, FlowConfig } from '../src/modules/c-modules/test-builder/flow-graph-engine.service';
import { cleanFirmwareVersion, resolveDecoderId } from '../src/modules/lorawan/common/lorawan-utils';

async function runTests() {
  console.log('=== VERIFYING TEST BUILDER & FLOW GRAPH ENGLISH STANDARDIZATION ===\n');

  const testBuilder = new TestBuilderService();
  const flowEngine = new FlowGraphEngineService();

  // Test 1: Available Fields & Fallbacks
  console.log('[Test 1] Available Telemetry Fields (100% English)');
  const commonFields = await testBuilder.getAvailableFields();
  assert.strictEqual(commonFields.length, 4);
  assert.strictEqual(commonFields.find((f) => f.name === 'rssi')?.label, 'RSSI Signal Strength');
  assert.strictEqual(commonFields.find((f) => f.name === 'snr')?.label, 'Signal-to-Noise Ratio (SNR)');
  assert.strictEqual(commonFields.find((f) => f.name === 'fPort')?.label, 'LoRaWAN FPort');
  assert.strictEqual(commonFields.find((f) => f.name === 'fCnt')?.label, 'Frame Counter (FCnt)');

  // Fallback CO2
  const co2Fields = await testBuilder.getAvailableFields('WSLRW-CO2', 'v1');
  assert.strictEqual(co2Fields.find((f) => f.name === 'co2')?.label, 'CO2 Concentration');
  assert.strictEqual(co2Fields.find((f) => f.name === 'temperature')?.label, 'Temperature');
  assert.strictEqual(co2Fields.find((f) => f.name === 'humidity')?.label, 'Humidity');
  assert.strictEqual(co2Fields.find((f) => f.name === 'battery')?.label, 'Battery Voltage');

  // Fallback Temperature & Humidity
  const thFields = await testBuilder.getAvailableFields('WSLRW-TH', 'v2');
  assert.strictEqual(thFields.find((f) => f.name === 'temperature')?.label, 'Ambient Temperature');
  assert.strictEqual(thFields.find((f) => f.name === 'humidity')?.label, 'Air Humidity');

  // Fallback Level
  const lvlFields = await testBuilder.getAvailableFields('WSLRW-LVL', '1');
  assert.strictEqual(lvlFields.find((f) => f.name === 'levelMm')?.label, 'Liquid Level');
  assert.strictEqual(lvlFields.find((f) => f.name === 'percentage')?.label, 'Volume Percentage');
  assert.strictEqual(lvlFields.find((f) => f.name === 'alarmStatus')?.label, 'Alarm Status');

  // Fallback Modbus MB485
  const mbFields = await testBuilder.getAvailableFields('WSLRW-MB485', 'v6');
  assert.strictEqual(mbFields.find((f) => f.name === 'voltage')?.label, 'Phase Voltage');
  assert.strictEqual(mbFields.find((f) => f.name === 'current')?.label, 'Electric Current');
  assert.strictEqual(mbFields.find((f) => f.name === 'power')?.label, 'Active Power');

  console.log('  -> PASS: All common and sensor fallback fields strictly standardized to English\n');

  // Test 2: Firmware Version Normalization (cleanFirmwareVersion)
  console.log('[Test 2] cleanFirmwareVersion & resolveDecoderId');
  assert.strictEqual(cleanFirmwareVersion('v6'), '6');
  assert.strictEqual(cleanFirmwareVersion('V2.0'), '2.0');
  assert.strictEqual(cleanFirmwareVersion('1'), '1');
  assert.strictEqual(cleanFirmwareVersion('  v12  '), '12');
  assert.strictEqual(cleanFirmwareVersion(undefined), '');
  assert.strictEqual(resolveDecoderId('WSLRW-CO2', 'v1'), 'WSLRW-CO2_1');
  assert.strictEqual(resolveDecoderId('WSLRW-MB485', 'V6'), 'WSLRW-MB485_6');
  console.log('  -> PASS: Firmware version successfully normalized without "v"/"V"\n');

  // Test 3: Backend Assertion Evaluation Messages
  console.log('[Test 3] TestBuilder DryRun Assertion Messages in English');
  const dryRunResult = await testBuilder.dryRun({
    executionMode: 'FLOW',
    mockPacket: {
      rssi: -130,
      snr: 2.0,
      decoded: { co2: 2500 },
    },
    assertions: [
      { fieldName: 'co2', operator: 'BETWEEN', expectedValue: { min: 400, max: 2000 } },
      { fieldName: 'rssi', operator: 'GREATER_THAN', expectedValue: -120 },
      { fieldName: 'non_existent', operator: 'IS_NOT_NULL' },
    ],
  });

  assert.strictEqual(dryRunResult.pass, false);
  assert(dryRunResult.summary.includes('Test FAILED: Assertion conditions violated'));
  const co2Assert = dryRunResult.assertionResults.find((a) => a.fieldName === 'co2');
  assert(co2Assert && co2Assert.message.includes('is outside range [400, 2000]'));
  const rssiAssert = dryRunResult.assertionResults.find((a) => a.fieldName === 'rssi');
  assert(rssiAssert && rssiAssert.message.includes('-130 is not greater than -120'));
  const missingAssert = dryRunResult.assertionResults.find((a) => a.fieldName === 'non_existent');
  assert(missingAssert && missingAssert.message.includes("Field 'non_existent' does not exist in packet payload"));

  // Check PASS summary
  const passDryRun = await testBuilder.dryRun({
    executionMode: 'FLOW',
    mockPacket: {
      rssi: -80,
      decoded: { co2: 800 },
    },
    assertions: [
      { fieldName: 'co2', operator: 'BETWEEN', expectedValue: { min: 400, max: 2000 } },
      { fieldName: 'rssi', operator: 'GREATER_THAN', expectedValue: -120 },
    ],
  });
  assert.strictEqual(passDryRun.pass, true);
  assert(passDryRun.summary.includes('All test conditions PASSED'));
  console.log('  -> PASS: DryRun assertions and summary produce English messages\n');

  // Test 4: Custom Script Evaluation
  console.log('[Test 4] Custom Script Sandbox Evaluation in English');
  const scriptFail = await testBuilder.dryRun({
    executionMode: 'SCRIPT',
    customScript: `
      function evaluate(packet, context) {
        if (packet.rssi < -100) return { pass: false, reason: 'RSSI signal too weak: ' + packet.rssi + ' dBm' };
        return { pass: true };
      }
    `,
    mockPacket: { rssi: -115 },
  });
  assert.strictEqual(scriptFail.pass, false);
  assert.strictEqual(scriptFail.scriptResult?.reason, 'RSSI signal too weak: -115 dBm');

  const scriptNoFunc = await testBuilder.dryRun({
    executionMode: 'SCRIPT',
    customScript: `const a = 1;`,
    mockPacket: {},
  });
  assert.strictEqual(scriptNoFunc.pass, false);
  assert(scriptNoFunc.scriptResult?.reason?.includes("Function 'evaluate(packet, context)' not found in script"));
  console.log('  -> PASS: Script sandbox results strictly in English\n');

  // Test 5: FlowGraphEngine DAG Messages
  console.log('[Test 5] FlowGraphEngine DAG Node & Evaluation Messages in English');
  const cycleFlow: FlowConfig = {
    nodes: [
      { id: 'n1', type: 'trigger' },
      { id: 'n2', type: 'comparator' },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n1' },
    ],
  };
  const cycleVal = flowEngine.validateFlow(cycleFlow);
  assert.strictEqual(cycleVal.valid, false);
  assert(cycleVal.errors[0].includes('Loop/cycle detected in flow configuration'));

  const validFlow: FlowConfig = {
    nodes: [
      { id: 'in', type: 'packet_in' },
      { id: 'counter', type: 'counter', params: { minPackets: 2 } },
      { id: 'comp', type: 'comparator', params: { field: 'co2', operator: 'BETWEEN', min: 400, max: 2000 } },
    ],
    edges: [
      { from: 'in', to: 'counter' },
      { from: 'counter', to: 'comp' },
    ],
  };

  const flowExec = await flowEngine.executeFlow(
    validFlow,
    { decoded: { co2: 3000 } },
    { packetCount: 1 },
  );
  assert.strictEqual(flowExec.pass, false);
  assert(flowExec.summary.includes('Test FAILED: Detected'));
  const counterAssert = flowExec.assertionResults.find((a) => a.nodeType === 'counter');
  assert(counterAssert && counterAssert.message.includes('Insufficient packets collected: 1/2'));
  const compAssert = flowExec.assertionResults.find((a) => a.nodeType === 'comparator');
  assert(compAssert && compAssert.message.includes('3000 is outside range [400, 2000]'));
  console.log('  -> PASS: FlowGraphEngine validation, cycle detection, and execution messages strictly English\n');

  // Test 6: Sanitization / Migration Functions
  console.log('[Test 6] Sanitization Helpers (sanitizeFieldLabel, sanitizeNodeLabel, sanitizeScript)');
  for (const [vi, en] of Object.entries(VI_TO_EN_FIELD_LABELS)) {
    assert.strictEqual(sanitizeFieldLabel(vi), en);
  }
  assert.strictEqual(sanitizeNodeLabel('Đếm gói tin'), 'Packet Counter');
  assert.strictEqual(sanitizeNodeLabel('So sánh thiết bị chuẩn (co2)'), 'Reference Device Comparison (co2)');
  assert.strictEqual(sanitizeNodeLabel('Thống kê chuyển động (acceleration)'), 'Motion Statistics (acceleration)');

  const viScript = `
    /**
     * Hàm kiểm định chất lượng cảm biến LoRaWAN
     * @param {Object} packet - Gói tin: { rssi }
     * @param {Object} context - Ngữ cảnh: { minPackets }
     */
    function evaluate(packet, context) {
      if (context.packetCount < context.minPackets) return { pass: false, reason: 'Chưa đủ số lượng ' + context.minPackets + ' gói tin' };
      if (packet.rssi < -120) return { pass: false, reason: 'Tín hiệu RSSI quá yếu: ' + packet.rssi + ' dBm' };
      return { pass: true };
    }
  `;
  const enScript = sanitizeScript(viScript);
  assert(!enScript.includes('Hàm kiểm định'));
  assert(!enScript.includes('Gói tin:'));
  assert(!enScript.includes('Ngữ cảnh:'));
  assert(enScript.includes('LoRaWAN Sensor Quality Verification Function'));
  assert(enScript.includes('Insufficient packet count:'));
  assert(enScript.includes('RSSI signal too weak:'));
  console.log('  -> PASS: Template and assertion sanitizers correctly convert Vietnamese content to English\n');

  console.log('=== ALL TEST BUILDER & FLOW GRAPH VERIFICATIONS PASSED SUCCESSFULLY! ===\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
