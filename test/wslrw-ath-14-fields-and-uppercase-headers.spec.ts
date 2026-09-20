/**
 * Comprehensive Automated Test Suite:
 * 1. Verification of complete 14-field extraction for WSLRW-ATH decoder (AST + VM Sandbox)
 * 2. Verification of LoRaWAN default headers UPPERCASE standardization (RSSI, SNR, FPORT, FCNT)
 * 3. Backward compatibility verification for legacy lowercase / camelCase scripts & assertions
 * 4. Protocol key filtering and clean label / unit metadata verification
 * 
 * Usage: npx ts-node test/wslrw-ath-14-fields-and-uppercase-headers.spec.ts
 */

import * as assert from 'assert';
import {
  extractDecoderFields,
  extractFieldsWithAst,
  extractFieldsWithVm,
  DiscoveredField,
  IGNORED_PROTOCOL_KEYS,
  STANDARD_FIELD_LABELS,
} from '../src/modules/c-modules/test-builder/decoder-field-extractor';
import { TestBuilderService } from '../src/modules/c-modules/test-builder/test-builder.service';
import { FlowGraphEngineService } from '../src/modules/c-modules/test-builder/flow-graph-engine.service';

const EXPECTED_14_FIELDS = [
  'temperature',
  'humidity',
  'ambient_temperature',
  'ambient_humidity',
  'barometric_pressure',
  'pressure',
  'altitude',
  'illuminance',
  'light_intensity',
  'dew_point',
  'heat_index',
  'battery_voltage',
  'battery_level',
  'sensor_status',
];

const EXPECTED_UPPERCASE_HEADERS = ['RSSI', 'SNR', 'FPORT', 'FCNT'];

async function runAthAndUppercaseTestSuite() {
  console.log('======================================================================');
  console.log('🚀 RUNNING WSLRW-ATH 14-FIELDS & LORAWAN UPPERCASE HEADERS TEST SUITE');
  console.log('======================================================================\n');

  const flowGraphEngine = new FlowGraphEngineService();
  const testBuilder = new TestBuilderService(null as any, flowGraphEngine);

  // =========================================================================
  // SUITE 1: 14-FIELD EXTRACTION FROM WSLRW-ATH DECODER ACROSS MULTIPLE PATTERNS
  // =========================================================================
  console.log('--- SUITE 1: WSLRW-ATH 14-FIELD EXTRACTION (AST & VM) ---');

  // 1.1: Reassignment pattern: data = { ... } with return { data: data }
  {
    console.log('[Test 1.1] WSLRW-ATH Decoder: Reassignment data = { ... }');
    const codeReassignment = `
      function decodeUplink(input) {
        var bytes = input.bytes;
        var data = {};
        data = {
          temperature: ((bytes[0] << 8) | bytes[1]) / 100,
          humidity: ((bytes[2] << 8) | bytes[3]) / 10,
          ambient_temperature: ((bytes[4] << 8) | bytes[5]) / 100,
          ambient_humidity: ((bytes[6] << 8) | bytes[7]) / 10,
          barometric_pressure: ((bytes[8] << 16) | (bytes[9] << 8) | bytes[10]) / 100,
          pressure: ((bytes[11] << 16) | (bytes[12] << 8) | bytes[13]) / 100,
          altitude: ((bytes[14] << 8) | bytes[15]),
          illuminance: (bytes[16] << 8) | bytes[17],
          light_intensity: (bytes[18] << 8) | bytes[19],
          dew_point: ((bytes[20] << 8) | bytes[21]) / 10,
          heat_index: ((bytes[22] << 8) | bytes[23]) / 10,
          battery_voltage: bytes[24] / 10,
          battery_level: bytes[25],
          sensor_status: bytes[26]
        };
        return { data: data };
      }
    `;

    // AST verification
    const astFields = extractFieldsWithAst(codeReassignment);
    const astNames = astFields.map((f) => f.name);
    assert.strictEqual(astNames.length, 14, `AST must extract exactly 14 fields (got ${astNames.length})`);
    for (const expected of EXPECTED_14_FIELDS) {
      assert(astNames.includes(expected), `AST must extract '${expected}'`);
    }

    // VM verification
    const vmFields = extractFieldsWithVm(codeReassignment);
    const vmNames = vmFields.map((f) => f.name);
    assert.strictEqual(vmNames.length, 14, `VM must extract exactly 14 fields (got ${vmNames.length})`);
    for (const expected of EXPECTED_14_FIELDS) {
      assert(vmNames.includes(expected), `VM must extract '${expected}'`);
    }

    // Unified extraction verification
    const unified = extractDecoderFields(codeReassignment);
    assert.strictEqual(unified.length, 14, 'Unified extractDecoderFields must return 14 fields');
    console.log('  -> PASS: Reassignment data = { ... } extracted 14/14 fields in both AST & VM');
  }

  // 1.2: Shorthand property assignment: return { data: { temperature, humidity, ... } }
  {
    console.log('[Test 1.2] WSLRW-ATH Decoder: Shorthand property return');
    const codeShorthand = `
      function Decoder(bytes, port) {
        var temperature = 26.5;
        var humidity = 58.2;
        var ambient_temperature = 26.3;
        var ambient_humidity = 58.0;
        var barometric_pressure = 1012.4;
        var pressure = 1012.4;
        var altitude = 15;
        var illuminance = 620;
        var light_intensity = 620;
        var dew_point = 17.5;
        var heat_index = 27.2;
        var battery_voltage = 3.62;
        var battery_level = 96;
        var sensor_status = 0;
        return {
          data: {
            temperature,
            humidity,
            ambient_temperature,
            ambient_humidity,
            barometric_pressure,
            pressure,
            altitude,
            illuminance,
            light_intensity,
            dew_point,
            heat_index,
            battery_voltage,
            battery_level,
            sensor_status
          }
        };
      }
    `;

    const astFields = extractFieldsWithAst(codeShorthand);
    assert.strictEqual(astFields.length, 14, 'AST must extract 14 fields from shorthand properties');
    const vmFields = extractFieldsWithVm(codeShorthand);
    assert.strictEqual(vmFields.length, 14, 'VM must extract 14 fields from shorthand properties');
    console.log('  -> PASS: Shorthand return { data: { ... } } extracted 14/14 fields');
  }

  // 1.3: Dynamic property assignment: data.temp = ..., data.hum = ...
  {
    console.log('[Test 1.3] WSLRW-ATH Decoder: Property assignments (data.prop = ...)');
    const codeProps = `
      function decodeUplink(input) {
        var data = {};
        data.temperature = 25.0;
        data.humidity = 60.0;
        data.ambient_temperature = 25.0;
        data.ambient_humidity = 60.0;
        data.barometric_pressure = 1013.25;
        data.pressure = 1013.25;
        data.altitude = 10;
        data.illuminance = 400;
        data.light_intensity = 400;
        data.dew_point = 16.5;
        data.heat_index = 25.5;
        data.battery_voltage = 3.6;
        data.battery_level = 95;
        data.sensor_status = 1;
        return { data: data };
      }
    `;

    const astFields = extractFieldsWithAst(codeProps);
    assert.strictEqual(astFields.length, 14, 'AST must extract 14 fields from property assignments');
    const vmFields = extractFieldsWithVm(codeProps);
    assert.strictEqual(vmFields.length, 14, 'VM must extract 14 fields from property assignments');
    console.log('  -> PASS: Property assignments data.prop = ... extracted 14/14 fields');
  }

  // 1.4: Shorthand return { data } with reassignment data = { ... }
  {
    console.log('[Test 1.4] WSLRW-ATH Decoder: Shorthand return { data } with reassignment');
    const codeShorthandReturn = `
      function decodeUplink(input) {
        var data = {};
        data = {
          temperature: 25.5,
          humidity: 60.2,
          ambient_temperature: 25.4,
          ambient_humidity: 60.0,
          barometric_pressure: 1013.25,
          pressure: 1013.2,
          altitude: 12.5,
          illuminance: 450,
          light_intensity: 450,
          dew_point: 17.2,
          heat_index: 26.1,
          battery_voltage: 3.6,
          battery_level: 95,
          sensor_status: 1
        };
        return { data };
      }
    `;

    const fields = extractDecoderFields(codeShorthandReturn);
    assert.strictEqual(fields.length, 14, 'Must extract 14 fields when return is shorthand { data }');
    for (const expected of EXPECTED_14_FIELDS) {
      assert(fields.some((f) => f.name === expected), `Must include ${expected}`);
    }
    console.log('  -> PASS: Shorthand return { data } with reassignment extracted 14/14 fields');
  }

  // 1.5: Service API extractFieldsFromRawCode contract
  {
    console.log('[Test 1.5] TestBuilderService.extractFieldsFromRawCode API verification');
    const code = `
      function decodeUplink(input) {
        return {
          data: {
            temperature: 25.0,
            humidity: 55.0,
            ambient_temperature: 24.8,
            ambient_humidity: 54.5,
            barometric_pressure: 1013.0,
            pressure: 1013.0,
            altitude: 5.0,
            illuminance: 500,
            light_intensity: 500,
            dew_point: 15.0,
            heat_index: 25.0,
            battery_voltage: 3.6,
            battery_level: 100,
            sensor_status: 0
          }
        };
      }
    `;
    const res = testBuilder.extractFieldsFromRawCode(code);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.count, 14);
    assert.strictEqual(res.fields.length, 14);
    console.log('  -> PASS: extractFieldsFromRawCode returned success=true, count=14');
  }

  // 1.6: Metadata Verification: Standard English labels & units
  {
    console.log('[Test 1.6] Standard English labels and units verification');
    const code = `
      function decodeUplink(input) {
        return {
          data: {
            temperature: 25.0,
            humidity: 55.0,
            ambient_temperature: 24.8,
            ambient_humidity: 54.5,
            barometric_pressure: 1013.0,
            pressure: 1013.0,
            altitude: 5.0,
            illuminance: 500,
            light_intensity: 500,
            dew_point: 15.0,
            heat_index: 25.0,
            battery_voltage: 3.6,
            battery_level: 100,
            sensor_status: 0
          }
        };
      }
    `;
    const fields = extractDecoderFields(code);
    const fieldMap = new Map(fields.map((f) => [f.name, f]));

    // Check Temperature
    assert.strictEqual(fieldMap.get('temperature')?.label, 'Temperature');
    assert.strictEqual(fieldMap.get('temperature')?.unit, '°C');

    // Check Humidity
    assert.strictEqual(fieldMap.get('humidity')?.label, 'Humidity');
    assert.strictEqual(fieldMap.get('humidity')?.unit, '%RH');

    // Check Ambient Temperature
    assert.strictEqual(fieldMap.get('ambient_temperature')?.label, 'Ambient Temperature');
    assert.strictEqual(fieldMap.get('ambient_temperature')?.unit, '°C');

    // Check Ambient Humidity
    assert.strictEqual(fieldMap.get('ambient_humidity')?.label, 'Ambient Humidity');
    assert.strictEqual(fieldMap.get('ambient_humidity')?.unit, '%RH');

    // Check Barometric Pressure & Pressure
    assert.strictEqual(fieldMap.get('barometric_pressure')?.label, 'Barometric Pressure');
    assert(fieldMap.get('barometric_pressure')?.unit?.includes('hPa') || fieldMap.get('barometric_pressure')?.unit?.includes('bar'));
    assert.strictEqual(fieldMap.get('pressure')?.label, 'Atmospheric Pressure');

    // Check Altitude
    assert.strictEqual(fieldMap.get('altitude')?.label, 'Altitude');
    assert.strictEqual(fieldMap.get('altitude')?.unit, 'm');

    // Check Illuminance & Light Intensity
    assert.strictEqual(fieldMap.get('illuminance')?.label, 'Illuminance');
    assert.strictEqual(fieldMap.get('illuminance')?.unit, 'lux');
    assert.strictEqual(fieldMap.get('light_intensity')?.label, 'Light Intensity');
    assert.strictEqual(fieldMap.get('light_intensity')?.unit, 'lux');

    // Check Dew Point & Heat Index
    assert.strictEqual(fieldMap.get('dew_point')?.label, 'Dew Point');
    assert.strictEqual(fieldMap.get('dew_point')?.unit, '°C');
    assert.strictEqual(fieldMap.get('heat_index')?.label, 'Heat Index');
    assert.strictEqual(fieldMap.get('heat_index')?.unit, '°C');

    // Check Battery Voltage & Battery Level
    assert.strictEqual(fieldMap.get('battery_voltage')?.label, 'Battery Voltage');
    assert.strictEqual(fieldMap.get('battery_voltage')?.unit, 'V');
    assert.strictEqual(fieldMap.get('battery_level')?.label, 'Battery Level');

    // Check Sensor Status
    assert.strictEqual(fieldMap.get('sensor_status')?.label, 'Sensor Status');

    // Ensure NO label contains parentheses
    for (const f of fields) {
      assert(!f.label.includes('(') && !f.label.includes(')'), `Label '${f.label}' must not have parentheses`);
    }

    console.log('  -> PASS: All 14 fields have 100% clean English labels and accurate units');
  }

  // 1.7: Protocol Key Isolation (No LoRaWAN header leaking into sensor fields)
  {
    console.log('[Test 1.7] Protocol key isolation in decoder extraction');
    const codeWithLeakedHeaders = `
      function decodeUplink(input) {
        var data = {
          RSSI: input.RSSI || -80,
          rssi: input.rssi || -80,
          SNR: 9.0,
          snr: 9.0,
          FPORT: 1,
          fPort: 1,
          FCNT: 20,
          fCnt: 20,
          temperature: 25.4,
          humidity: 60.1
        };
        return { data };
      }
    `;
    const fields = extractDecoderFields(codeWithLeakedHeaders);
    const names = fields.map((f) => f.name);
    assert.strictEqual(names.length, 2, 'Must only extract temperature & humidity, filtering all headers');
    assert(names.includes('temperature') && names.includes('humidity'));
    assert(!names.includes('RSSI') && !names.includes('rssi'));
    assert(!names.includes('SNR') && !names.includes('snr'));
    assert(!names.includes('FPORT') && !names.includes('fPort'));
    assert(!names.includes('FCNT') && !names.includes('fCnt'));
    console.log('  -> PASS: Protocol keys (RSSI, SNR, FPORT, FCNT & lowercase) completely isolated\n');
  }

  // =========================================================================
  // SUITE 2: LORAWAN DEFAULT HEADERS UPPERCASE STANDARDIZATION & CONTRACT
  // =========================================================================
  console.log('--- SUITE 2: LORAWAN DEFAULT HEADERS UPPERCASE STANDARDIZATION ---');

  // 2.1: getAvailableFields returns UPPERCASE headers
  {
    console.log('[Test 2.1] getAvailableFields() returns RSSI, SNR, FPORT, FCNT in uppercase');
    const res = await testBuilder.getAvailableFields();
    assert.strictEqual(res.totalCount, 4);
    assert.strictEqual(res.count, 0);
    const headerNames = res.fields.map((f) => f.name);
    assert.deepStrictEqual(headerNames, EXPECTED_UPPERCASE_HEADERS);

    // Verify labels and units
    const rssiField = res.fields.find((f) => f.name === 'RSSI');
    assert.strictEqual(rssiField?.label, 'RSSI Signal Strength');
    assert.strictEqual(rssiField?.unit, 'dBm');

    const snrField = res.fields.find((f) => f.name === 'SNR');
    assert.strictEqual(snrField?.label, 'Signal-to-Noise Ratio');
    assert.strictEqual(snrField?.unit, 'dB');

    const fportField = res.fields.find((f) => f.name === 'FPORT');
    assert.strictEqual(fportField?.label, 'LoRaWAN FPort');

    const fcntField = res.fields.find((f) => f.name === 'FCNT');
    assert.strictEqual(fcntField?.label, 'Frame Counter');

    console.log('  -> PASS: getAvailableFields() produces standardized UPPERCASE headers [RSSI, SNR, FPORT, FCNT]');
  }

  // 2.2: Backward Compatibility in Custom JS Script Sandbox
  {
    console.log('[Test 2.2] JS Script Sandbox: Backward compatibility with packet.RSSI & packet.rssi');

    const mockUpperPacket = {
      RSSI: -75,
      SNR: 9.5,
      FPORT: 2,
      FCNT: 45,
      decoded: { temperature: 27.5, humidity: 62.0 },
    };

    // Script accessing UPPERCASE headers
    const upperScript = `
      function evaluate(packet, context) {
        if (packet.RSSI === -75 && packet.SNR === 9.5 && packet.FPORT === 2 && packet.FCNT === 45) {
          return { pass: true, metrics: { rssi: packet.RSSI, snr: packet.SNR } };
        }
        return { pass: false, reason: 'Failed uppercase headers check' };
      }
    `;
    const resUpper = await testBuilder.dryRun({
      executionMode: 'SCRIPT',
      customScript: upperScript,
      mockPacket: mockUpperPacket,
    });
    assert.strictEqual(resUpper.pass, true, 'Custom script accessing packet.RSSI/SNR/FPORT/FCNT must pass');

    // Script accessing LOWERCASE / CAMELCASE headers (Legacy compatibility)
    const lowerScript = `
      function evaluate(packet, context) {
        if (packet.rssi === -75 && packet.snr === 9.5 && packet.fPort === 2 && packet.fCnt === 45) {
          return { pass: true, metrics: { rssi: packet.rssi, snr: packet.snr } };
        }
        return { pass: false, reason: 'Failed lowercase legacy headers check' };
      }
    `;
    const resLower = await testBuilder.dryRun({
      executionMode: 'SCRIPT',
      customScript: lowerScript,
      mockPacket: mockUpperPacket,
    });
    assert.strictEqual(resLower.pass, true, 'Legacy script accessing packet.rssi/snr/fPort/fCnt must pass with uppercase input');

    // Input with lowercase headers -> script accessing uppercase headers
    const mockLowerPacket = {
      rssi: -78,
      snr: 8.2,
      fPort: 1,
      fCnt: 100,
      decoded: { temperature: 25.0 },
    };
    const mixedRes = await testBuilder.dryRun({
      executionMode: 'SCRIPT',
      customScript: `
        function evaluate(packet, context) {
          if (packet.RSSI === -78 && packet.SNR === 8.2 && packet.FPORT === 1 && packet.FCNT === 100) {
            return { pass: true };
          }
          return { pass: false, reason: 'Uppercase access failed on lowercase input' };
        }
      `,
      mockPacket: mockLowerPacket,
    });
    assert.strictEqual(mixedRes.pass, true, 'Uppercase packet access must work seamlessly when mockPacket has lowercase keys');

    console.log('  -> PASS: 100% bidirectional backward compatibility in JS Script Sandbox');
  }

  // 2.3: Backward Compatibility in Relational Assertions (dryRun)
  {
    console.log('[Test 2.3] Relational Assertions: Both UPPERCASE and lowercase fieldNames pass');

    const dryRunResult = await testBuilder.dryRun({
      executionMode: 'SCRIPT',
      assertions: [
        // Uppercase rules
        { fieldName: 'RSSI', operator: 'GREATER_THAN', expectedValue: -90 },
        { fieldName: 'SNR', operator: 'GREATER_THAN', expectedValue: 5.0 },
        { fieldName: 'FPORT', operator: 'EQUALS', expectedValue: 2 },
        { fieldName: 'FCNT', operator: 'GREATER_THAN', expectedValue: 0 },
        // Lowercase legacy rules
        { fieldName: 'rssi', operator: 'GREATER_THAN', expectedValue: -90 },
        { fieldName: 'snr', operator: 'GREATER_THAN', expectedValue: 5.0 },
        { fieldName: 'fPort', operator: 'EQUALS', expectedValue: 2 },
        { fieldName: 'fCnt', operator: 'GREATER_THAN', expectedValue: 0 },
        // Decoder sensor field
        { fieldName: 'temperature', operator: 'BETWEEN', expectedValue: { min: 20, max: 30 } },
      ],
      mockPacket: {
        RSSI: -82,
        SNR: 7.8,
        FPORT: 2,
        FCNT: 15,
        decoded: { temperature: 26.5 },
      },
    });

    assert.strictEqual(dryRunResult.pass, true);
    assert.strictEqual(dryRunResult.assertionResults.length, 9);
    assert.strictEqual(dryRunResult.assertionResults.filter((a) => a.pass).length, 9);
    console.log('  -> PASS: All 9 relational assertions (4 UPPERCASE + 4 lowercase + 1 sensor) passed');
  }

  // 2.4: Flow Graph Engine DAG: Comparator Node & Function Node with UPPERCASE & lowercase
  {
    console.log('[Test 2.4] Flow Graph Engine: Ingestion, Comparator, and Function Node compatibility');

    const flowConfig = {
      nodes: [
        { id: 'in', type: 'lora-in', label: 'Ingestion', x: 0, y: 0, params: {} },
        // Comparator checking UPPERCASE
        { id: 'cmp_rssi_up', type: 'comparator', label: 'Check RSSI', x: 100, y: 0, params: { field: 'RSSI', operator: 'GREATER_THAN', expectedValue: -95 } },
        { id: 'cmp_snr_up', type: 'comparator', label: 'Check SNR', x: 100, y: 50, params: { field: 'SNR', operator: 'GREATER_THAN', expectedValue: 0 } },
        { id: 'cmp_fport_up', type: 'comparator', label: 'Check FPORT', x: 100, y: 100, params: { field: 'FPORT', operator: 'EQUALS', expectedValue: 1 } },
        { id: 'cmp_fcnt_up', type: 'comparator', label: 'Check FCNT', x: 100, y: 150, params: { field: 'FCNT', operator: 'GREATER_THAN', expectedValue: 10 } },
        // Comparator checking lowercase
        { id: 'cmp_rssi_lo', type: 'comparator', label: 'Check rssi', x: 100, y: 200, params: { field: 'rssi', operator: 'GREATER_THAN', expectedValue: -95 } },
        { id: 'cmp_snr_lo', type: 'comparator', label: 'Check snr', x: 100, y: 250, params: { field: 'snr', operator: 'GREATER_THAN', expectedValue: 0 } },
        { id: 'cmp_fport_lo', type: 'comparator', label: 'Check fPort', x: 100, y: 300, params: { field: 'fPort', operator: 'EQUALS', expectedValue: 1 } },
        { id: 'cmp_fcnt_lo', type: 'comparator', label: 'Check fCnt', x: 100, y: 350, params: { field: 'fCnt', operator: 'GREATER_THAN', expectedValue: 10 } },
        // Function Node accessing msg.packet
        {
          id: 'fn_check',
          type: 'function',
          label: 'Function Inspector',
          x: 100,
          y: 400,
          params: {
            script: `
              var p = msg.packet;
              if (p.RSSI === -84 && p.rssi === -84 && p.FPORT === 1 && p.fPort === 1 && p.SNR === 8.5 && p.snr === 8.5) {
                return { pass: true, metrics: { status: 'OK' } };
              }
              return { pass: false, reason: 'Header mismatch in msg.packet' };
            `,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'in', target: 'cmp_rssi_up' },
        { id: 'e2', source: 'in', target: 'cmp_snr_up' },
        { id: 'e3', source: 'in', target: 'cmp_fport_up' },
        { id: 'e4', source: 'in', target: 'cmp_fcnt_up' },
        { id: 'e5', source: 'in', target: 'cmp_rssi_lo' },
        { id: 'e6', source: 'in', target: 'cmp_snr_lo' },
        { id: 'e7', source: 'in', target: 'cmp_fport_lo' },
        { id: 'e8', source: 'in', target: 'cmp_fcnt_lo' },
        { id: 'e9', source: 'in', target: 'fn_check' },
      ],
    };

    const flowResult = await flowGraphEngine.executeFlow(flowConfig, {
      RSSI: -84,
      SNR: 8.5,
      FPORT: 1,
      FCNT: 50,
      decoded: { temperature: 24.5 },
    });

    assert.strictEqual(flowResult.pass, true, `Flow execution should pass: ${flowResult.error}`);
    assert.strictEqual(flowResult.assertionResults.length, 9, 'Must evaluate all 9 assertions');
    const passedCount = flowResult.assertionResults.filter((a) => a.pass).length;
    assert.strictEqual(passedCount, 9, `All 9 assertions must pass (got ${passedCount})`);

    console.log('  -> PASS: Flow Graph DAG comparator and function nodes fully pass with both uppercase & lowercase headers\n');
  }

  // =========================================================================
  // SUITE 3: END-TO-END WSLRW-ATH SIMULATION WITH 14 SENSOR FIELDS + 4 HEADERS
  // =========================================================================
  console.log('--- SUITE 3: COMPLETE END-TO-END WSLRW-ATH FACTORY TEST SIMULATION ---');
  {
    console.log('[Test 3.1] Full E2E Test Execution: WSLRW-ATH 14 Fields + 4 LoRaWAN Headers');

    const wslrwAthMockPacket = {
      RSSI: -72,
      SNR: 11.2,
      FPORT: 2,
      FCNT: 254,
      payloadHex: '0a1b0244...',
      decoded: {
        temperature: 25.32,
        humidity: 61.4,
        ambient_temperature: 25.18,
        ambient_humidity: 61.2,
        barometric_pressure: 1013.45,
        pressure: 1013.4,
        altitude: 12.0,
        illuminance: 480,
        light_intensity: 480,
        dew_point: 17.2,
        heat_index: 26.5,
        battery_voltage: 3.64,
        battery_level: 98,
        sensor_status: 0,
      },
    };

    // Execute dryRun with 18 assertion rules (14 sensor fields + 4 LoRaWAN headers)
    const e2eResult = await testBuilder.dryRun({
      executionMode: 'SCRIPT',
      assertions: [
        // 4 Headers
        { fieldName: 'RSSI', operator: 'GREATER_THAN', expectedValue: -110 },
        { fieldName: 'SNR', operator: 'GREATER_THAN', expectedValue: -5 },
        { fieldName: 'FPORT', operator: 'EQUALS', expectedValue: 2 },
        { fieldName: 'FCNT', operator: 'GREATER_THAN', expectedValue: 100 },
        // 14 Sensor Fields
        { fieldName: 'temperature', operator: 'BETWEEN', expectedValue: { min: -40, max: 85 } },
        { fieldName: 'humidity', operator: 'BETWEEN', expectedValue: { min: 0, max: 100 } },
        { fieldName: 'ambient_temperature', operator: 'BETWEEN', expectedValue: { min: -40, max: 85 } },
        { fieldName: 'ambient_humidity', operator: 'BETWEEN', expectedValue: { min: 0, max: 100 } },
        { fieldName: 'barometric_pressure', operator: 'BETWEEN', expectedValue: { min: 300, max: 1200 } },
        { fieldName: 'pressure', operator: 'BETWEEN', expectedValue: { min: 300, max: 1200 } },
        { fieldName: 'altitude', operator: 'BETWEEN', expectedValue: { min: -500, max: 9000 } },
        { fieldName: 'illuminance', operator: 'BETWEEN', expectedValue: { min: 0, max: 100000 } },
        { fieldName: 'light_intensity', operator: 'BETWEEN', expectedValue: { min: 0, max: 100000 } },
        { fieldName: 'dew_point', operator: 'BETWEEN', expectedValue: { min: -40, max: 85 } },
        { fieldName: 'heat_index', operator: 'BETWEEN', expectedValue: { min: -40, max: 85 } },
        { fieldName: 'battery_voltage', operator: 'GREATER_THAN', expectedValue: 3.0 },
        { fieldName: 'battery_level', operator: 'GREATER_THAN', expectedValue: 20 },
        { fieldName: 'sensor_status', operator: 'EQUALS', expectedValue: 0 },
      ],
      customScript: `
        function evaluate(packet, context) {
          if (packet.RSSI < -110) return { pass: false, reason: 'Low RSSI' };
          if (packet.decoded.temperature > 85) return { pass: false, reason: 'Overheat' };
          if (packet.decoded.battery_voltage < 3.0) return { pass: false, reason: 'Battery low' };
          return {
            pass: true,
            metrics: {
              rssi: packet.RSSI,
              snr: packet.SNR,
              temp: packet.decoded.temperature,
              hum: packet.decoded.humidity,
              baro: packet.decoded.barometric_pressure,
              light: packet.decoded.illuminance,
              bat: packet.decoded.battery_voltage,
            }
          };
        }
      `,
      mockPacket: wslrwAthMockPacket,
    });

    assert.strictEqual(e2eResult.pass, true, 'Full E2E WSLRW-ATH test run must pass');
    assert.strictEqual(e2eResult.assertionResults.length, 18, 'All 18 assertions must be evaluated');
    const passedAssertions = e2eResult.assertionResults.filter((a) => a.pass);
    assert.strictEqual(passedAssertions.length, 18, 'All 18 assertions must pass');

    console.log('  -> PASS: E2E Factory Test verified 18/18 rules (4 UPPERCASE headers + 14 WSLRW-ATH sensor fields)');
  }

  console.log('\n======================================================================');
  console.log('🎉 ALL WSLRW-ATH 14-FIELD & UPPERCASE HEADERS TESTS PASSED (100%)');
  console.log('======================================================================');
}

runAthAndUppercaseTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
