"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_FIELD_LABELS = exports.IGNORED_PROTOCOL_KEYS = void 0;
exports.formatFieldLabel = formatFieldLabel;
exports.inferUnit = inferUnit;
exports.inferSampleValue = inferSampleValue;
exports.extractFieldsWithVm = extractFieldsWithVm;
exports.extractFieldsWithAst = extractFieldsWithAst;
exports.extractDecoderFields = extractDecoderFields;
const ts = require("typescript");
const vm = require("vm");
exports.IGNORED_PROTOCOL_KEYS = new Set([
    'errors',
    'warnings',
    'warning',
    'error',
    'raw',
    'bytes',
    'fPort',
    'port',
    'f_port',
    'fCnt',
    'fcnt',
    'f_cnt',
    'rssi',
    'snr',
    'recvTime',
    'timestamp',
    'time',
    'length',
    'constructor',
    'prototype',
    '__proto__',
    'toString',
    'valueOf',
    'push',
    'slice',
    'splice',
    'concat',
    'join',
    'map',
    'filter',
    'reduce',
    'RSSI',
    'SNR',
    'FPORT',
    'FCNT',
    'F_PORT',
    'F_CNT',
    'PORT',
]);
exports.STANDARD_FIELD_LABELS = {
    co2: 'CO2 Concentration',
    temp: 'Temperature',
    temperature: 'Temperature',
    ambient_temp: 'Ambient Temperature',
    ambienttemp: 'Ambient Temperature',
    ambient_temperature: 'Ambient Temperature',
    ambienttemperature: 'Ambient Temperature',
    hum: 'Humidity',
    humidity: 'Humidity',
    ambient_hum: 'Ambient Humidity',
    ambient_humidity: 'Ambient Humidity',
    ambienthumidity: 'Ambient Humidity',
    air_humidity: 'Air Humidity',
    airhumidity: 'Air Humidity',
    battery: 'Battery Voltage',
    bat: 'Battery Voltage',
    vbat: 'Battery Voltage',
    batteryvoltage: 'Battery Voltage',
    battery_voltage: 'Battery Voltage',
    battery_level: 'Battery Level',
    batterylevel: 'Battery Level',
    level: 'Liquid Level',
    levelmm: 'Liquid Level',
    percentage: 'Volume Percentage',
    alarmstatus: 'Alarm Status',
    alarm_status: 'Alarm Status',
    voltage: 'Phase Voltage',
    current: 'Electric Current',
    power: 'Active Power',
    pressure: 'Atmospheric Pressure',
    baro: 'Barometric Pressure',
    barometric_pressure: 'Barometric Pressure',
    barometricpressure: 'Barometric Pressure',
    altitude: 'Altitude',
    rssi: 'RSSI Signal Strength',
    snr: 'Signal-to-Noise Ratio',
    fport: 'LoRaWAN FPort',
    fcnt: 'Frame Counter',
    status: 'Status',
    sensor_status: 'Sensor Status',
    sensorstatus: 'Sensor Status',
    value: 'Sensor Value',
    light: 'Light Intensity',
    lux: 'Light Intensity',
    illuminance: 'Illuminance',
    light_intensity: 'Light Intensity',
    lightintensity: 'Light Intensity',
    dew_point: 'Dew Point',
    dewpoint: 'Dew Point',
    heat_index: 'Heat Index',
    heatindex: 'Heat Index',
};
function formatFieldLabel(name) {
    if (!name)
        return '';
    const cleanName = name.replace(/\s*\([^)]*\)/g, '').trim();
    const rawLower = cleanName.toLowerCase();
    const strippedLower = rawLower.replace(/[^a-z0-9]/g, '');
    if (exports.STANDARD_FIELD_LABELS[rawLower]) {
        return exports.STANDARD_FIELD_LABELS[rawLower];
    }
    if (exports.STANDARD_FIELD_LABELS[strippedLower]) {
        return exports.STANDARD_FIELD_LABELS[strippedLower];
    }
    return cleanName
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (str) => str.toUpperCase())
        .replace(/\s*\([^)]*\)/g, '')
        .trim();
}
function inferUnit(name) {
    if (!name)
        return undefined;
    const lower = name.toLowerCase();
    if (lower.includes('co2'))
        return 'ppm';
    if (lower.includes('dew_point') || lower.includes('dewpoint'))
        return '°C';
    if (lower.includes('heat_index') || lower.includes('heatindex'))
        return '°C';
    if (lower.includes('alt') || lower.includes('altitude'))
        return 'm';
    if (lower.includes('temp') || lower === 't' || lower === 'temperature')
        return '°C';
    if (lower.includes('hum') || lower.includes('rh') || lower.includes('humidity'))
        return '%RH';
    if (lower.includes('volt') || lower.includes('bat') || lower.includes('vbat') || lower.includes('battery'))
        return 'V';
    if (lower.includes('curr') || lower.includes('amp') || lower.includes('current'))
        return 'A';
    if (lower.includes('power') || lower.includes('watt'))
        return 'W';
    if (lower.includes('energy') || lower.includes('kwh'))
        return 'kWh';
    if (lower.includes('press') || lower.includes('baro') || lower.includes('pressure'))
        return 'hPa';
    if (lower.includes('level') || lower.includes('depth') || lower.includes('dist'))
        return 'mm';
    if (lower.includes('lux') || lower.includes('light') || lower.includes('illuminance'))
        return 'lux';
    if (lower.includes('rssi'))
        return 'dBm';
    if (lower.includes('snr'))
        return 'dB';
    if (lower.includes('freq') || lower.includes('frequency'))
        return 'Hz';
    if (lower.includes('speed') || lower.includes('wind'))
        return 'm/s';
    if (lower.includes('percent') || lower.includes('percentage') || lower.includes('ratio'))
        return '%';
    if (lower.includes('ppm'))
        return 'ppm';
    if (lower.includes('ppb'))
        return 'ppb';
    if (lower.includes('ph'))
        return 'pH';
    return undefined;
}
function inferSampleValue(name, type = 'number') {
    if (type === 'string')
        return 'NORMAL';
    if (type === 'boolean')
        return true;
    if (type === 'object')
        return {};
    const lower = name.toLowerCase();
    if (lower.includes('dew_point') || lower.includes('dewpoint'))
        return 18.2;
    if (lower.includes('heat_index') || lower.includes('heatindex'))
        return 26.8;
    if (lower.includes('alt') || lower.includes('altitude'))
        return 15;
    if (lower.includes('co2'))
        return 650;
    if (lower.includes('temp') || lower === 't')
        return 25.5;
    if (lower.includes('hum') || lower.includes('rh'))
        return 60.0;
    if (lower.includes('volt') || lower.includes('bat') || lower.includes('vbat'))
        return 3.6;
    if (lower.includes('curr') || lower.includes('amp'))
        return 4.5;
    if (lower.includes('power') || lower.includes('watt'))
        return 120;
    if (lower.includes('energy'))
        return 15.5;
    if (lower.includes('press') || lower.includes('baro'))
        return 1013.25;
    if (lower.includes('level') || lower.includes('dist'))
        return 500;
    if (lower.includes('lux') || lower.includes('light'))
        return 350;
    if (lower.includes('percent') || lower.includes('percentage'))
        return 75;
    return 25;
}
function extractFieldsWithVm(code, timeoutMs = 500) {
    if (!code || typeof code !== 'string' || !code.trim())
        return [];
    const syntheticPayloads = [
        { bytes: [0x02, 0x8a, 0x3c, 0x24, 0x01, 0x10, 0x03, 0xe8, 0x00, 0x64, 0x00, 0x14, 0x08, 0x00, 0x01, 0x00], fPort: 1 },
        { bytes: [0x01, 0x67, 0x01, 0x10, 0x02, 0x68, 0x70, 0x03, 0x02, 0x01, 0x20, 0x04, 0x00, 0x00, 0x05, 0x00], fPort: 2 },
        { bytes: Array.from({ length: 32 }, (_, i) => ((i * 7) % 250) + 1), fPort: 10 },
        { bytes: Array.from({ length: 64 }, (_, i) => (i + 1) & 0xff), fPort: 1 },
        { bytes: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], fPort: 1 },
    ];
    const fullScript = `
    ${code}
    var __extracted_results = [];
    var __fn = null;
    var __mode = '';
    if (typeof decodeUplink === 'function') {
      __fn = decodeUplink;
      __mode = 'decodeUplink';
    } else if (typeof Decoder === 'function') {
      __fn = Decoder;
      __mode = 'Decoder';
    } else if (typeof decode === 'function') {
      __fn = decode;
      __mode = 'decode';
    } else if (typeof Decode === 'function') {
      __fn = Decode;
      __mode = 'Decode';
    }

    if (__fn) {
      for (var __p = 0; __p < __payloads.length; __p++) {
        var __bytes = __payloads[__p].bytes;
        var __port = __payloads[__p].fPort;
        try {
          var __res = __mode === 'decodeUplink'
            ? __fn({ bytes: __bytes, fPort: __port, recvTime: new Date().toISOString() })
            : __fn(__bytes, __port);
          if (__res && typeof __res === 'object') {
            __extracted_results.push(__res);
          }
        } catch (e) {}
      }
    }
    __extracted_results;
  `;
    const discoveredMap = new Map();
    try {
        const sandbox = {
            __payloads: syntheticPayloads,
            console: { log: () => { }, warn: () => { }, error: () => { }, info: () => { } },
            Math,
            Date,
            parseInt,
            parseFloat,
            Buffer: typeof Buffer !== 'undefined' ? Buffer : undefined,
            String,
            Number,
            Boolean,
            Array,
            Object,
            JSON,
            isNaN,
            isFinite,
        };
        const context = vm.createContext(sandbox);
        const vmScript = new vm.Script(fullScript);
        const results = vmScript.runInContext(context, { timeout: timeoutMs });
        if (Array.isArray(results)) {
            for (const res of results) {
                if (!res || typeof res !== 'object')
                    continue;
                let target = null;
                if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
                    target = res.data;
                }
                else if (res.decoded && typeof res.decoded === 'object' && !Array.isArray(res.decoded)) {
                    target = res.decoded;
                }
                else if (res.result && typeof res.result === 'object' && !Array.isArray(res.result)) {
                    target = res.result;
                }
                else if (res.payload && typeof res.payload === 'object' && !Array.isArray(res.payload)) {
                    target = res.payload;
                }
                else if (res.values && typeof res.values === 'object' && !Array.isArray(res.values)) {
                    target = res.values;
                }
                else if (!Array.isArray(res)) {
                    target = res;
                }
                if (target) {
                    for (const key of Object.keys(target)) {
                        if (exports.IGNORED_PROTOCOL_KEYS.has(key) || key.startsWith('__'))
                            continue;
                        const val = target[key];
                        let type = 'number';
                        if (typeof val === 'string')
                            type = 'string';
                        else if (typeof val === 'boolean')
                            type = 'boolean';
                        else if (typeof val === 'object' && val !== null)
                            type = 'object';
                        const existing = discoveredMap.get(key);
                        const isNonZero = val !== 0 && val !== undefined && (typeof val !== 'number' || Number.isFinite(val));
                        const sampleVal = isNonZero ? val : (existing?.sampleValue ?? val ?? inferSampleValue(key, type));
                        discoveredMap.set(key, {
                            name: key,
                            label: formatFieldLabel(key),
                            type,
                            unit: inferUnit(key),
                            sampleValue: sampleVal,
                        });
                    }
                }
            }
        }
    }
    catch (err) {
    }
    return Array.from(discoveredMap.values());
}
function extractFieldsWithAst(code) {
    if (!code || typeof code !== 'string' || !code.trim())
        return [];
    const discoveredMap = new Map();
    let sf;
    try {
        sf = ts.createSourceFile('decoder.ts', code, ts.ScriptTarget.Latest, true);
    }
    catch (err) {
        return [];
    }
    const targetVars = new Set([
        'data',
        'decoded',
        'result',
        'output',
        'res',
        'payload',
        'values',
        'telemetry',
        'parsed',
    ]);
    function addField(name, type = 'number', sampleValue) {
        if (!name || typeof name !== 'string' || exports.IGNORED_PROTOCOL_KEYS.has(name) || name.startsWith('__'))
            return;
        if (!discoveredMap.has(name)) {
            discoveredMap.set(name, {
                name,
                label: formatFieldLabel(name),
                type,
                unit: inferUnit(name),
                sampleValue: sampleValue !== undefined ? sampleValue : inferSampleValue(name, type),
            });
        }
    }
    function getPropertyInfo(init) {
        let type = 'number';
        let sample = undefined;
        if (init) {
            if (ts.isStringLiteral(init)) {
                type = 'string';
                sample = init.text;
            }
            else if (init.kind === ts.SyntaxKind.TrueKeyword || init.kind === ts.SyntaxKind.FalseKeyword) {
                type = 'boolean';
                sample = init.kind === ts.SyntaxKind.TrueKeyword;
            }
            else if (ts.isNumericLiteral(init)) {
                type = 'number';
                sample = Number(init.text);
            }
        }
        return { type, sample };
    }
    function inspectObjectLiteral(objLiteral) {
        for (const prop of objLiteral.properties) {
            let propName = null;
            if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
                if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) {
                    propName = prop.name.text;
                }
            }
            if (!propName)
                continue;
            if (['data', 'decoded', 'result', 'payload', 'values', 'telemetry', 'output', 'res'].includes(propName)) {
                if (ts.isPropertyAssignment(prop)) {
                    if (ts.isObjectLiteralExpression(prop.initializer)) {
                        inspectObjectLiteral(prop.initializer);
                    }
                    else if (ts.isIdentifier(prop.initializer)) {
                        targetVars.add(prop.initializer.text);
                    }
                }
            }
            else if (!exports.IGNORED_PROTOCOL_KEYS.has(propName)) {
                const info = ts.isPropertyAssignment(prop)
                    ? getPropertyInfo(prop.initializer)
                    : { type: 'number', sample: undefined };
                addField(propName, info.type, info.sample);
            }
        }
    }
    function scanReturns(node) {
        if (ts.isReturnStatement(node) && node.expression) {
            if (ts.isObjectLiteralExpression(node.expression)) {
                inspectObjectLiteral(node.expression);
            }
            else if (ts.isIdentifier(node.expression)) {
                targetVars.add(node.expression.text);
            }
        }
        if (ts.isArrowFunction(node) && node.body) {
            if (ts.isObjectLiteralExpression(node.body)) {
                inspectObjectLiteral(node.body);
            }
            else if (ts.isParenthesizedExpression(node.body) && ts.isObjectLiteralExpression(node.body.expression)) {
                inspectObjectLiteral(node.body.expression);
            }
        }
        ts.forEachChild(node, scanReturns);
    }
    scanReturns(sf);
    function scanAssignments(node) {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
            if (targetVars.has(node.name.text) && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
                inspectObjectLiteral(node.initializer);
            }
        }
        if (ts.isCallExpression(node)) {
            const expr = node.expression;
            if (ts.isPropertyAccessExpression(expr) && expr.expression.getText(sf) === 'Object' && expr.name.text === 'assign') {
                const [targetArg, ...sourceArgs] = node.arguments;
                if (targetArg && ts.isIdentifier(targetArg) && targetVars.has(targetArg.text)) {
                    for (const src of sourceArgs) {
                        if (ts.isObjectLiteralExpression(src)) {
                            inspectObjectLiteral(src);
                        }
                    }
                }
            }
        }
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            const left = node.left;
            if (ts.isIdentifier(left) && targetVars.has(left.text)) {
                if (ts.isObjectLiteralExpression(node.right)) {
                    inspectObjectLiteral(node.right);
                }
            }
            else if (ts.isPropertyAccessExpression(left)) {
                const objName = left.expression.getText(sf);
                const propName = left.name.text;
                if (targetVars.has(objName)) {
                    const info = getPropertyInfo(node.right);
                    addField(propName, info.type, info.sample);
                }
            }
            else if (ts.isElementAccessExpression(left) && left.argumentExpression && ts.isStringLiteral(left.argumentExpression)) {
                const objName = left.expression.getText(sf);
                const propName = left.argumentExpression.text;
                if (targetVars.has(objName)) {
                    const info = getPropertyInfo(node.right);
                    addField(propName, info.type, info.sample);
                }
            }
        }
        ts.forEachChild(node, scanAssignments);
    }
    scanAssignments(sf);
    const regex = /(?:data|decoded|result|output|res|payload|values)\.([a-zA-Z0-9_]+)\s*=/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        const fieldName = match[1];
        addField(fieldName);
    }
    return Array.from(discoveredMap.values());
}
function extractDecoderFields(code) {
    if (!code || typeof code !== 'string' || !code.trim()) {
        return [];
    }
    const vmFields = extractFieldsWithVm(code);
    const astFields = extractFieldsWithAst(code);
    const mergedMap = new Map();
    for (const f of astFields) {
        mergedMap.set(f.name, f);
    }
    for (const f of vmFields) {
        const existing = mergedMap.get(f.name);
        mergedMap.set(f.name, {
            name: f.name,
            label: f.label || existing?.label || formatFieldLabel(f.name),
            type: f.type || existing?.type || 'number',
            unit: f.unit || existing?.unit || inferUnit(f.name),
            sampleValue: f.sampleValue !== undefined ? f.sampleValue : existing?.sampleValue,
        });
    }
    return Array.from(mergedMap.values()).map((f) => ({
        name: f.name,
        label: (f.label || formatFieldLabel(f.name)).replace(/\s*\([^)]*\)/g, '').trim(),
        type: f.type || 'number',
        unit: f.unit || inferUnit(f.name),
        sampleValue: f.sampleValue !== undefined ? f.sampleValue : inferSampleValue(f.name, f.type),
    }));
}
//# sourceMappingURL=decoder-field-extractor.js.map