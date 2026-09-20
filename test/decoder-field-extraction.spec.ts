import * as assert from 'assert';
import {
  extractDecoderFields,
  extractFieldsWithVm,
  extractFieldsWithAst,
  formatFieldLabel,
  inferUnit,
} from '../src/modules/c-modules/test-builder/decoder-field-extractor';
import { TestBuilderService } from '../src/modules/c-modules/test-builder/test-builder.service';

async function runTestSuite() {
  console.log('=== VERIFYING REAL DECODER FIELD EXTRACTION (AST + VM) ===\n');

  const testBuilder = new TestBuilderService();

  // Test Case 1: Standard ChirpStack / Daviteq decodeUplink with Object Literal return
  console.log('[Test 1] decodeUplink with direct Object Literal return');
  const code1 = `
    function decodeUplink(input) {
      var bytes = input.bytes;
      return {
        data: {
          temperature: ((bytes[0] << 8) | bytes[1]) / 10,
          humidity: bytes[2],
          co2: (bytes[3] << 8) | bytes[4],
          battery: 3.6
        },
        warnings: ['Low battery warning'],
        errors: []
      };
    }
  `;
  const fields1 = extractDecoderFields(code1);
  assert.strictEqual(fields1.length, 4);
  assert.deepStrictEqual(
    fields1.map((f) => f.name).sort(),
    ['battery', 'co2', 'humidity', 'temperature'],
  );
  assert.strictEqual(fields1.find((f) => f.name === 'co2')?.label, 'CO2 Concentration');
  assert.strictEqual(fields1.find((f) => f.name === 'co2')?.unit, 'ppm');
  assert.strictEqual(fields1.find((f) => f.name === 'temperature')?.unit, '°C');
  assert.strictEqual(fields1.find((f) => f.name === 'battery')?.unit, 'V');
  // Confirm protocol wrapper keys are excluded
  assert.strictEqual(fields1.find((f) => f.name === 'warnings'), undefined);
  assert.strictEqual(fields1.find((f) => f.name === 'errors'), undefined);
  console.log('  -> PASS: Correctly extracted 4 fields with standard labels, units, and filtered wrapper keys\n');

  // Test Case 2: Legacy TTN Decoder(bytes, fPort) with dynamic property assignment
  console.log('[Test 2] Legacy Decoder(bytes, fPort) with dynamic property assignments');
  const code2 = `
    function Decoder(bytes, fPort) {
      var decoded = {};
      decoded.pressure = 1013.25;
      decoded['differential_pressure'] = 2.5;
      decoded.status = "NORMAL";
      return decoded;
    }
  `;
  const fields2 = extractDecoderFields(code2);
  assert.strictEqual(fields2.length, 3);
  assert(fields2.some((f) => f.name === 'pressure' && f.unit === 'hPa'));
  assert(fields2.some((f) => f.name === 'differential_pressure' && f.unit === 'hPa'));
  assert(fields2.some((f) => f.name === 'status' && f.type === 'string'));
  console.log('  -> PASS: Successfully extracted dynamic assignments from Decoder(bytes, fPort)\n');

  // Test Case 3: Arrow function with concise body
  console.log('[Test 3] Arrow function with concise parenthesized body');
  const code3 = `
    const decodeUplink = (input) => ({
      data: {
        illuminance: (input.bytes[0] << 8) | input.bytes[1],
        solarRadiation: 450
      }
    });
  `;
  const fields3 = extractDecoderFields(code3);
  assert.strictEqual(fields3.length, 2);
  assert(fields3.some((f) => f.name === 'illuminance' && f.unit === 'lux'));
  assert(fields3.some((f) => f.name === 'solarRadiation'));
  console.log('  -> PASS: Concise arrow function body parsed cleanly\n');

  // Test Case 4: Multi-branch returns (if/else per fPort)
  console.log('[Test 4] Multi-branch return statement discovery');
  const code4 = `
    function decodeUplink(input) {
      if (input.fPort === 1) {
        return { data: { temperature: 25.5, humidity: 60 } };
      } else if (input.fPort === 2) {
        return { data: { co2: 800, tvoc: 120 } };
      } else if (input.fPort === 3) {
        return { data: { batteryVoltage: 3.6 } };
      }
      return { data: { alarmCode: 0 } };
    }
  `;
  const fields4 = extractDecoderFields(code4);
  const fieldNames4 = fields4.map((f) => f.name).sort();
  assert(fieldNames4.includes('temperature'));
  assert(fieldNames4.includes('humidity'));
  assert(fieldNames4.includes('co2'));
  assert(fieldNames4.includes('tvoc'));
  assert(fieldNames4.includes('batteryVoltage'));
  assert(fieldNames4.includes('alarmCode'));
  console.log('  -> PASS: All return branches scanned and extracted\n');

  // Test Case 5: Code that throws error in VM (strict check) handled by AST
  console.log('[Test 5] AST fallback when VM execution fails on strict payload check');
  const code5 = `
    function decodeUplink(input) {
      if (input.bytes.length !== 100) {
        throw new Error("Payload size must be exactly 100 bytes");
      }
      return {
        data: {
          flowRate: input.bytes[0],
          totalVolume: input.bytes[1]
        }
      };
    }
  `;
  const vmFields5 = extractFieldsWithVm(code5);
  assert.strictEqual(vmFields5.length, 0); // VM throws error
  const combinedFields5 = extractDecoderFields(code5);
  assert.strictEqual(combinedFields5.length, 2);
  assert(combinedFields5.some((f) => f.name === 'flowRate'));
  assert(combinedFields5.some((f) => f.name === 'totalVolume'));
  console.log('  -> PASS: AST parser caught all fields when VM failed\n');

  // Test Case 6: Dynamic loop assignment handled by VM
  console.log('[Test 6] VM execution for dynamic array iteration assignments');
  const code6 = `
    function decodeUplink(input) {
      var channels = ['ch1_temp', 'ch2_temp', 'ch3_temp'];
      var data = {};
      for (var i = 0; i < channels.length; i++) {
        data[channels[i]] = input.bytes[i] || 0;
      }
      return { data: data };
    }
  `;
  const vmFields6 = extractFieldsWithVm(code6);
  assert.strictEqual(vmFields6.length, 3);
  assert(vmFields6.some((f) => f.name === 'ch1_temp'));
  assert(vmFields6.some((f) => f.name === 'ch2_temp'));
  assert(vmFields6.some((f) => f.name === 'ch3_temp'));
  console.log('  -> PASS: Dynamic loop assignment extracted by VM runner\n');

  // Test Case 7: API extractFieldsFromRawCode in TestBuilderService
  console.log('[Test 7] extractFieldsFromRawCode service method');
  const rawRes = testBuilder.extractFieldsFromRawCode(code1);
  assert.strictEqual(rawRes.success, true);
  assert.strictEqual(rawRes.count, 4);
  assert.strictEqual(rawRes.fields.length, 4);

  const emptyRes = testBuilder.extractFieldsFromRawCode('');
  assert.strictEqual(emptyRes.success, false);
  assert.strictEqual(emptyRes.count, 0);
  assert.strictEqual(emptyRes.error, 'Decoder code is empty or missing');
  console.log('  -> PASS: Raw code extraction API contract validated\n');

  // Test Case 8: Zero fake fallback verification
  console.log('[Test 8] No fake fallback when decoder is not found');
  const availRes = await testBuilder.getAvailableFields('WSLRW-CO2', '1');
  assert.strictEqual(availRes.decoderFound, false);
  assert.strictEqual(availRes.count, 0, 'Must have count 0 for decoder fields when not found');
  assert.strictEqual(availRes.totalCount, 4, 'Must have totalCount 4 for common fields');
  assert.deepStrictEqual(
    availRes.fields.map((f) => f.name),
    ['RSSI', 'SNR', 'FPORT', 'FCNT'],
  );
  // Verify clean labels without parentheses
  for (const f of availRes.fields) {
    assert(!f.label.includes('(') && !f.label.includes(')'), `Field label "${f.label}" should not have parentheses`);
  }
  // Ensure 'co2', 'temperature', 'humidity', 'battery' are NOT in result
  assert.strictEqual(availRes.fields.find((f) => f.name === 'co2'), undefined);
  assert.strictEqual(availRes.fields.find((f) => f.name === 'battery'), undefined);
  console.log('  -> PASS: 100% verified no fake fallback fields generated\n');

  // Test Case 9: Infinite loop safety in VM
  console.log('[Test 9] Sandbox timeout and infinite loop safety');
  const infiniteLoopCode = `
    function decodeUplink(input) {
      while(true) {}
      return { data: { temp: 25 } };
    }
  `;
  const loopFields = extractDecoderFields(infiniteLoopCode);
  // VM will time out safely at 500ms, AST will still extract temp
  assert(loopFields.some((f) => f.name === 'temp'));
  console.log('  -> PASS: Infinite loop timed out gracefully, AST extracted field\n');

  console.log('=== ALL REAL DECODER FIELD EXTRACTION TESTS PASSED! ===\n');
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
