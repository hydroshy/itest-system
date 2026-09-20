import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

console.log('Testing frontend wire canvas, context menu, and FW cleanup...');

const tbPath = path.join(__dirname, '../src/views/control-panel-modules/test-builder.module.ts');
const devicesPath = path.join(__dirname, '../src/views/control-panel-modules/devices.module.ts');
const decoderPath = path.join(__dirname, '../src/views/control-panel-modules/decoder.module.ts');

const tbContent = fs.readFileSync(tbPath, 'utf8');
const devicesContent = fs.readFileSync(devicesPath, 'utf8');
const decoderContent = fs.readFileSync(decoderPath, 'utf8');

// 1. Verify Midpoint 'x' badge with hover scale is removed
assert(!tbContent.includes('Midpoint Wire Delete Badge'), 'Midpoint Wire Delete Badge must be removed from SVG');
assert(!tbContent.includes('Click wire to delete connection'), 'Direct delete click title must be removed from wire path');
console.log('✓ Midpoint hover jitter badge removed');

// 2. Verify Right-click context menu on wires
assert(tbContent.includes('@contextmenu.prevent.stop="openWireContextMenu($event, edge)"'), 'Wire path must have @contextmenu handler');
assert(tbContent.includes('Delete Wire Connection'), 'Context menu must include "Delete Wire Connection"');
assert(tbContent.includes('Inspect Connection'), 'Context menu must include "Inspect Connection"');
assert(tbContent.includes('closeWireContextMenu'), 'Context menu must support dismissal');
assert(tbContent.includes('wireContextMenu'), 'wireContextMenu state must be defined and exposed');
console.log('✓ Wire right-click context menu implemented with dismissal');

// 3. Verify drag listeners and numeric position coordinates
assert(tbContent.includes("window.addEventListener('mousemove', onWindowMouseMove)"), 'Window mousemove listener must be attached on drag');
assert(tbContent.includes("window.addEventListener('mouseup', onWindowMouseUp)"), 'Window mouseup listener must be attached on drag');
assert(tbContent.includes("window.removeEventListener('mousemove', onWindowMouseMove)"), 'Window mousemove listener must be removed on mouseup');
assert(tbContent.includes("window.removeEventListener('mouseup', onWindowMouseUp)"), 'Window mouseup listener must be removed on mouseup');
assert(tbContent.includes('Number.isFinite'), 'Node dragging must enforce Number.isFinite to prevent NaN');
assert(tbContent.includes('wireTick.value++'), 'Reactive wire updates must be triggered during movement');
console.log('✓ Node drag stability, window listeners, strictly numeric coordinates, and reactive wire updates verified');

// 4. Verify FW 'v' prefix removal
assert(!tbContent.includes('FW: v{{'), 'FW: v prefix in header badge must be removed');
assert(!tbContent.includes('PIPELINE: {{ activeTestTemplate.sku }} (v{{'), 'Pipeline title (v...) must be replaced with FW format');
assert(!tbContent.includes('Firmware: <strong class="text-indigo-300">v{{'), 'Node body Firmware: v... must be removed');
assert(!tbContent.includes('Firmware v(*)'), 'Modal label Firmware v(*) must be removed');
assert(tbContent.includes('FW: {{ formatFirmware(activeTestTemplate.firmwareVersion) }}'), 'FW badge must use formatFirmware');
assert(devicesContent.includes('FW: {{ formatFirmware(dec.firmwareVersion) }}'), 'Devices dropdown must use formatFirmware');
assert(decoderContent.includes('FW: {{ formatFirmware(d.firmwareVersion) }}'), 'Decoder dropdown must use formatFirmware');
console.log('✓ Firmware version "v" prefix completely removed across UI');

// 5. Verify Field Extractor English labels
assert(tbContent.includes('Field Extractor'), 'Field Extractor label must be present');
assert(tbContent.includes('Extract sensor field from payload'), 'Field Extractor description must be English in palette');
assert(tbContent.includes('Select telemetry field:'), 'Field Extractor prompt must be in English');
assert(tbContent.includes('getFieldEnglishLabel'), 'Field label sanitizer function must be present');
assert(tbContent.includes('getNodeDisplayName'), 'Node display name sanitizer function must be present');
console.log('✓ Field Extractor node and palette display English labels');

console.log('\nAll frontend assertions PASSED successfully!');
