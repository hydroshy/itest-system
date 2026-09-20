import * as assert from 'assert';
import {
  extractDecoderFields,
  extractFieldsWithAst,
  extractFieldsWithVm,
  DiscoveredField,
} from '../src/modules/c-modules/test-builder/decoder-field-extractor';
import { TestBuilderService } from '../src/modules/c-modules/test-builder/test-builder.service';

async function runRealDecoderTests() {
  console.log('=== VERIFYING REAL DECODER FIELD EXTRACTION (AST + VM SANDBOX) ===\n');

  // =========================================================================
  // 1. Decoder trả về Object Literal: return { data: { co2, temp, battery } }
  // =========================================================================
  console.log('[Test 1] Decoder returning Object Literal');
  {
    // 1.1: Standard return { data: { co2, temp, battery } }
    const codeLiteral1 = `
      function decodeUplink(input) {
        var bytes = input.bytes;
        var co2 = (bytes[0] << 8) | bytes[1];
        var temp = ((bytes[2] << 8) | bytes[3]) / 10;
        var battery = bytes[4] / 10;
        return {
          data: {
            co2: co2,
            temp: temp,
            battery: battery
          }
        };
      }
    `;
    const fields1 = extractDecoderFields(codeLiteral1);
    const names1 = fields1.map((f) => f.name);
    assert(names1.includes('co2'), 'Must extract co2');
    assert(names1.includes('temp'), 'Must extract temp');
    assert(names1.includes('battery'), 'Must extract battery');
    assert.strictEqual(names1.length, 3, 'Must not extract extra fields');

    // Verify AST directly
    const ast1 = extractFieldsWithAst(codeLiteral1);
    assert.deepStrictEqual(ast1.map(f => f.name).sort(), ['battery', 'co2', 'temp']);

    // Verify VM directly
    const vm1 = extractFieldsWithVm(codeLiteral1);
    assert.deepStrictEqual(vm1.map(f => f.name).sort(), ['battery', 'co2', 'temp']);

    // 1.2: Shorthand property return { data: { co2, temp, battery } }
    const codeShorthand = `
      function Decoder(bytes, port) {
        var co2 = (bytes[0] << 8) | bytes[1];
        var temp = 25.5;
        var battery = 3.6;
        return { data: { co2, temp, battery } };
      }
    `;
    const fieldsShorthand = extractDecoderFields(codeShorthand);
    const namesShorthand = fieldsShorthand.map((f) => f.name);
    assert(namesShorthand.includes('co2'), 'Shorthand must extract co2');
    assert(namesShorthand.includes('temp'), 'Shorthand must extract temp');
    assert(namesShorthand.includes('battery'), 'Shorthand must extract battery');

    // 1.3: Arrow function returning object literal directly
    const codeArrow = `
      const decode = (bytes) => ({
        data: {
          voltage: (bytes[0] << 8) | bytes[1],
          current: bytes[2],
          activePower: (bytes[3] << 8) | bytes[4]
        }
      });
    `;
    const fieldsArrow = extractDecoderFields(codeArrow);
    const namesArrow = fieldsArrow.map((f) => f.name);
    assert(namesArrow.includes('voltage'), 'Arrow must extract voltage');
    assert(namesArrow.includes('current'), 'Arrow must extract current');
    assert(namesArrow.includes('activePower'), 'Arrow must extract activePower');

    console.log('  -> PASS: Object literal decoders extracted accurately via AST + VM\n');
  }

  // =========================================================================
  // 2. Decoder gán thuộc tính: decoded.pressure = ..., decoded.flow = ...
  // =========================================================================
  console.log('[Test 2] Decoder with Property Assignments (decoded.pressure = ..., decoded.flow = ...)');
  {
    // 2.1: Property assignment on decoded object
    const codeProp = `
      function decodeUplink(input) {
        var bytes = input.bytes;
        var decoded = {};
        decoded.pressure = ((bytes[0] << 8) | bytes[1]) / 100;
        decoded.flow = ((bytes[2] << 8) | bytes[3]) / 10;
        decoded.total_volume = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7];
        return decoded;
      }
    `;
    const fieldsProp = extractDecoderFields(codeProp);
    const namesProp = fieldsProp.map((f) => f.name);
    assert(namesProp.includes('pressure'), 'Must extract pressure');
    assert(namesProp.includes('flow'), 'Must extract flow');
    assert(namesProp.includes('total_volume'), 'Must extract total_volume');
    assert.strictEqual(namesProp.length, 3);

    // 2.2: Property assignment returning { data: result }
    const codeResult = `
      function Decoder(bytes, fPort) {
        var result = {};
        result.pressure = 101.325;
        result.flow = 45.2;
        return { data: result };
      }
    `;
    const fieldsResult = extractDecoderFields(codeResult);
    const namesResult = fieldsResult.map((f) => f.name);
    assert(namesResult.includes('pressure'), 'Must extract pressure');
    assert(namesResult.includes('flow'), 'Must extract flow');

    // 2.3: Element access assignment: decoded['pressure'] = ...
    const codeBracket = `
      function decodeUplink(input) {
        var output = {};
        output['pressure'] = 1013;
        output['flow'] = 50;
        return { data: output };
      }
    `;
    const fieldsBracket = extractDecoderFields(codeBracket);
    const namesBracket = fieldsBracket.map((f) => f.name);
    assert(namesBracket.includes('pressure'), 'Must extract bracket access pressure');
    assert(namesBracket.includes('flow'), 'Must extract bracket access flow');

    console.log('  -> PASS: Property assignment decoders extracted accurately\n');
  }

  // =========================================================================
  // 3. Decoder chuẩn TTN / ChirpStack: decodeUplink({ bytes, fPort })
  // =========================================================================
  console.log('[Test 3] TTN / ChirpStack Standard Decoder (decodeUplink({ bytes, fPort }))');
  {
    const codeTtn = `
      function decodeUplink(input) {
        var bytes = input.bytes;
        var fPort = input.fPort;
        var data = {};

        if (fPort === 1) {
          data.temperature = ((bytes[0] << 8) | bytes[1]) / 100;
          data.humidity = bytes[2];
          data.battery_voltage = ((bytes[3] << 8) | bytes[4]) / 1000;
        } else if (fPort === 2) {
          data.alarm = bytes[0] === 1;
        }

        return {
          data: data,
          warnings: [],
          errors: []
        };
      }
    `;
    const fieldsTtn = extractDecoderFields(codeTtn);
    const namesTtn = fieldsTtn.map((f) => f.name);

    // Both AST and VM contribute to multi-branch code
    assert(namesTtn.includes('temperature'), 'Must extract temperature from fPort 1');
    assert(namesTtn.includes('humidity'), 'Must extract humidity from fPort 1');
    assert(namesTtn.includes('battery_voltage'), 'Must extract battery_voltage from fPort 1');
    assert(namesTtn.includes('alarm'), 'Must extract alarm from fPort 2 branch via AST');

    // Verify protocol keys are NOT extracted
    assert(!namesTtn.includes('warnings'), 'Must ignore protocol key: warnings');
    assert(!namesTtn.includes('errors'), 'Must ignore protocol key: errors');
    assert(!namesTtn.includes('bytes'), 'Must ignore protocol key: bytes');
    assert(!namesTtn.includes('fPort'), 'Must ignore protocol key: fPort');

    console.log('  -> PASS: TTN/ChirpStack decodeUplink handled with multi-branch AST coverage\n');
  }

  // =========================================================================
  // 4. Decoder công nghiệp (Modbus registers, Soil moisture, Vibration 3-axis)
  // =========================================================================
  console.log('[Test 4] Industrial Decoders');
  {
    // 4.1: Modbus registers decoder
    console.log('  [4.1] Modbus registers decoder');
    const codeModbus = `
      function decodeUplink(input) {
        var bytes = input.bytes;
        return {
          data: {
            modbus_reg_0: (bytes[0] << 8) | bytes[1],
            modbus_reg_1: (bytes[2] << 8) | bytes[3],
            modbus_reg_2: (bytes[4] << 8) | bytes[5],
            modbus_reg_3: (bytes[6] << 8) | bytes[7],
            supply_voltage: ((bytes[8] << 8) | bytes[9]) / 100
          }
        };
      }
    `;
    const fieldsModbus = extractDecoderFields(codeModbus);
    const namesModbus = fieldsModbus.map((f) => f.name);
    assert(namesModbus.includes('modbus_reg_0'), 'Must extract modbus_reg_0');
    assert(namesModbus.includes('modbus_reg_1'), 'Must extract modbus_reg_1');
    assert(namesModbus.includes('modbus_reg_2'), 'Must extract modbus_reg_2');
    assert(namesModbus.includes('modbus_reg_3'), 'Must extract modbus_reg_3');
    assert(namesModbus.includes('supply_voltage'), 'Must extract supply_voltage');
    const voltField = fieldsModbus.find(f => f.name === 'supply_voltage');
    assert.strictEqual(voltField?.unit, 'V', 'supply_voltage inferred unit must be V');

    // 4.2: Soil moisture & agricultural sensor decoder
    console.log('  [4.2] Soil moisture decoder');
    const codeSoil = `
      function decodeUplink(input) {
        var bytes = input.bytes;
        var decoded = {};
        decoded.soil_moisture = ((bytes[0] << 8) | bytes[1]) / 10;
        decoded.soil_temperature = ((bytes[2] << 8) | bytes[3]) / 10;
        decoded.soil_ec = (bytes[4] << 8) | bytes[5];
        decoded.soil_ph = bytes[6] / 10;
        decoded.battery = bytes[7] / 10;
        return { data: decoded };
      }
    `;
    const fieldsSoil = extractDecoderFields(codeSoil);
    const namesSoil = fieldsSoil.map((f) => f.name);
    assert(namesSoil.includes('soil_moisture'), 'Must extract soil_moisture');
    assert(namesSoil.includes('soil_temperature'), 'Must extract soil_temperature');
    assert(namesSoil.includes('soil_ec'), 'Must extract soil_ec');
    assert(namesSoil.includes('soil_ph'), 'Must extract soil_ph');
    assert(namesSoil.includes('battery'), 'Must extract battery');
    assert.strictEqual(fieldsSoil.find(f => f.name === 'soil_temperature')?.unit, '°C');
    assert.strictEqual(fieldsSoil.find(f => f.name === 'soil_ph')?.unit, 'pH');

    // 4.3: Vibration 3-axis decoder (accel_x, accel_y, accel_z)
    console.log('  [4.3] Vibration 3-axis decoder');
    const codeVibration = `
      function decodeUplink(input) {
        var bytes = input.bytes;
        return {
          data: {
            accel_x: ((bytes[0] << 8) | bytes[1]) / 1000,
            accel_y: ((bytes[2] << 8) | bytes[3]) / 1000,
            accel_z: ((bytes[4] << 8) | bytes[5]) / 1000,
            velocity_rms: ((bytes[6] << 8) | bytes[7]) / 100,
            peak_acceleration: ((bytes[8] << 8) | bytes[9]) / 100,
            temperature: bytes[10]
          }
        };
      }
    `;
    const fieldsVib = extractDecoderFields(codeVibration);
    const namesVib = fieldsVib.map((f) => f.name);
    assert(namesVib.includes('accel_x'), 'Must extract accel_x');
    assert(namesVib.includes('accel_y'), 'Must extract accel_y');
    assert(namesVib.includes('accel_z'), 'Must extract accel_z');
    assert(namesVib.includes('velocity_rms'), 'Must extract velocity_rms');
    assert(namesVib.includes('peak_acceleration'), 'Must extract peak_acceleration');
    assert(namesVib.includes('temperature'), 'Must extract temperature');

    console.log('  -> PASS: All industrial decoders (Modbus, Soil, 3-Axis Vibration) verified\n');
  }

  // =========================================================================
  // 5. Xác nhận hệ thống KHÔNG còn sinh ra field bịa/fake
  // =========================================================================
  console.log('[Test 5] Anti-Fake Verification (No fabricated / hallucinated fields)');
  {
    // 5.1: Specialized sensor with ONLY lux and uv_index
    const codeLuxOnly = `
      function decodeUplink(input) {
        var bytes = input.bytes;
        return {
          data: {
            lux: (bytes[0] << 8) | bytes[1],
            uv_index: bytes[2]
          }
        };
      }
    `;
    const fieldsLux = extractDecoderFields(codeLuxOnly);
    const namesLux = fieldsLux.map((f) => f.name);
    assert.deepStrictEqual(namesLux.sort(), ['lux', 'uv_index']);
    assert(!namesLux.includes('temperature'), 'CRITICAL: Must not hallucinate temperature');
    assert(!namesLux.includes('humidity'), 'CRITICAL: Must not hallucinate humidity');
    assert(!namesLux.includes('co2'), 'CRITICAL: Must not hallucinate co2');
    assert(!namesLux.includes('battery'), 'CRITICAL: Must not hallucinate battery');

    // 5.2: Water flow meter decoder with ONLY flow_rate and volume
    const codeWater = `
      function Decoder(bytes, port) {
        var decoded = {};
        decoded.flow_rate = bytes[0];
        decoded.cumulative_m3 = (bytes[1] << 8) | bytes[2];
        return decoded;
      }
    `;
    const fieldsWater = extractDecoderFields(codeWater);
    const namesWater = fieldsWater.map((f) => f.name);
    assert.deepStrictEqual(namesWater.sort(), ['cumulative_m3', 'flow_rate']);
    assert(!namesWater.includes('rssi'), 'Sensor extractor must not include common telemetry');
    assert(!namesWater.includes('co2'), 'Must not inject CO2');
    assert(!namesWater.includes('voltage'), 'Must not inject voltage');

    // 5.3: Empty or whitespace code -> 0 sensor fields, NO fake fallbacks
    const emptyFields = extractDecoderFields('');
    assert.strictEqual(emptyFields.length, 0, 'Empty code must return 0 sensor fields');

    const spaceFields = extractDecoderFields('   // comment only \n\n  ');
    assert.strictEqual(spaceFields.length, 0, 'Comment-only code must return 0 sensor fields');

    console.log('  -> PASS: System strictly extracts only authentic decoder fields; zero fake fields\n');
  }

  // =========================================================================
  // 6. Robustness & Sandbox Security
  // =========================================================================
  console.log('[Test 6] Robustness & Sandbox Security');
  {
    // Syntax error in decoder code -> gracefully caught by AST/VM without crash
    const brokenCode = `function decodeUplink(input) { return { data: { broken: ; } }`;
    const brokenFields = extractDecoderFields(brokenCode);
    assert(Array.isArray(brokenFields), 'Must return array even on syntax error');

    // Malicious code attempting to access process/fs -> isolated in VM
    const evilCode = `
      function decodeUplink(input) {
        try {
          var p = typeof process !== 'undefined' ? process.exit(1) : null;
          var r = typeof require !== 'undefined' ? require('fs') : null;
        } catch(e) {}
        return { data: { safe_field: 123 } };
      }
    `;
    const evilFields = extractDecoderFields(evilCode);
    const namesEvil = evilFields.map((f) => f.name);
    assert(namesEvil.includes('safe_field'), 'Must safely execute in sandbox');

    // Infinite loop in decoder -> VM timeout triggers, AST still extracts
    const infiniteCode = `
      function decodeUplink(input) {
        while(true) {}
        return { data: { timeout_field: 999 } };
      }
    `;
    const timeoutFields = extractDecoderFields(infiniteCode);
    const namesTimeout = timeoutFields.map((f) => f.name);
    assert(namesTimeout.includes('timeout_field'), 'AST extracts field even if VM times out');

    console.log('  -> PASS: Robustness, timeout handling, and sandbox isolation verified\n');
  }

  // =========================================================================
  // 7. TestBuilderService Integration & No-Mock Verification
  // =========================================================================
  console.log('[Test 7] TestBuilderService Integration (parseFieldsFromDecoderCode, extractFieldsFromRawCode, getAvailableFields)');
  {
    const testBuilder = new TestBuilderService();

    // 7.1: parseFieldsFromDecoderCode
    const code = `
      function decodeUplink(input) {
        return { data: { pressure_bar: 5.2, flow_lpm: 120 } };
      }
    `;
    const parsed = testBuilder.parseFieldsFromDecoderCode(code);
    assert.strictEqual(parsed.length, 2);
    assert(parsed.some(f => f.name === 'pressure_bar'));
    assert(parsed.some(f => f.name === 'flow_lpm'));

    // 7.2: extractFieldsFromRawCode
    const rawRes = testBuilder.extractFieldsFromRawCode(code);
    assert.strictEqual(rawRes.success, true);
    assert.strictEqual(rawRes.count, 2);
    assert(rawRes.fields.some(f => f.name === 'pressure_bar'));

    // 7.3: extractFieldsFromRawCode with empty code
    const emptyRes = testBuilder.extractFieldsFromRawCode('');
    assert.strictEqual(emptyRes.success, false);
    assert.strictEqual(emptyRes.count, 0);

    // 7.4: getAvailableFields without SKU -> returns only 4 common fields
    const defaultRes = await testBuilder.getAvailableFields();
    assert.strictEqual(defaultRes.count, 0, 'No decoder fields without SKU');
    assert.strictEqual(defaultRes.totalCount, 4, 'Total 4 common fields');
    assert.strictEqual(defaultRes.decoderFound, false);
    const defaultNames = defaultRes.fields.map(f => f.name);
    assert.deepStrictEqual(defaultNames.sort(), ['FCNT', 'FPORT', 'RSSI', 'SNR']);

    // 7.5: getAvailableFields with SKU whose decoder is NOT in DB
    // VERIFY ZERO FAKE FIELDS INJECTED (e.g. WSLRW-CO2, WSLRW-TH, WSLRW-LVL, WSLRW-MB485)
    const co2Res = await testBuilder.getAvailableFields('WSLRW-CO2', '1');
    assert.strictEqual(co2Res.decoderFound, false, 'No decoder found in DB without mock');
    assert.strictEqual(co2Res.count, 0, 'Must have 0 decoder fields when decoder not in DB');
    assert.strictEqual(co2Res.totalCount, 4, 'Must only contain the 4 common fields in total');
    assert(!co2Res.fields.some(f => f.name === 'co2'), 'Must NOT contain fake co2');
    assert(!co2Res.fields.some(f => f.name === 'temperature'), 'Must NOT contain fake temperature');
    assert(!co2Res.fields.some(f => f.name === 'humidity'), 'Must NOT contain fake humidity');
    assert(!co2Res.fields.some(f => f.name === 'battery'), 'Must NOT contain fake battery');

    const mbRes = await testBuilder.getAvailableFields('WSLRW-MB485', '1');
    assert.strictEqual(mbRes.count, 0, 'Must have 0 decoder fields for MB485 without decoder');
    assert.strictEqual(mbRes.totalCount, 4, 'Must only contain 4 common fields in total');
    assert(!mbRes.fields.some(f => f.name === 'voltage'), 'Must NOT contain fake voltage');
    assert(!mbRes.fields.some(f => f.name === 'current'), 'Must NOT contain fake current');

    console.log('  -> PASS: TestBuilderService successfully integrated with zero fake fallbacks\n');
  }

  console.log('=== ALL REAL DECODER FIELD EXTRACTION SPECIFICATIONS PASSED (100%) ===\n');
}

runRealDecoderTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
