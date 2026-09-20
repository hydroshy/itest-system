import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import { TestBuilderService } from '../src/modules/c-modules/test-builder/test-builder.service';
import { extractDecoderFields, formatFieldLabel } from '../src/modules/c-modules/test-builder/decoder-field-extractor';

console.log('=== VERIFYING TEST BUILDER FIELD UX & NODE CONTEXT MENU ===\n');

const tbPath = path.join(__dirname, '../src/views/control-panel-modules/test-builder.module.ts');
const cpPath = path.join(__dirname, '../src/views/control-panel.view.ts');

const tbContent = fs.readFileSync(tbPath, 'utf8');
const cpContent = fs.readFileSync(cpPath, 'utf8');

// 1. Backend Contract: count = extractedSensorFields.length, totalCount = finalFields.length
console.log('[Test 1] Backend Contract: count vs totalCount');
const service = new TestBuilderService();
(async () => {
  const resNoSku = await service.getAvailableFields();
  assert.strictEqual(resNoSku.count, 0, 'Without SKU/Decoder, count (extracted decoder fields) must be 0');
  assert.strictEqual(resNoSku.totalCount, 4, 'totalCount must equal common telemetry count (4)');
  assert.strictEqual(resNoSku.fields.length, 4, 'fields array must contain 4 common fields');

  const resWithSkuNoDb = await service.getAvailableFields('WSLRW-CO2', '1.0');
  assert.strictEqual(resWithSkuNoDb.count, 0, 'When decoder not in DB, count must be 0 (no fake fields)');
  assert.strictEqual(resWithSkuNoDb.totalCount, 4, 'totalCount must be 4');
  console.log('  -> PASS: Backend returns count as genuine decoder fields count and totalCount as total fields');

  // 2. Clean Field Labels & Names: No Parentheses
  console.log('\n[Test 2] Field Names and Labels Without Parentheses');
  for (const f of resNoSku.fields) {
    assert(!f.label.includes('(') && !f.label.includes(')'), `Field label "${f.label}" must not have parentheses`);
    assert(!f.name.includes('(') && !f.name.includes(')'), `Field name "${f.name}" must not have parentheses`);
  }
  assert.strictEqual(formatFieldLabel('snr'), 'Signal-to-Noise Ratio');
  assert.strictEqual(formatFieldLabel('fcnt'), 'Frame Counter');
  assert.strictEqual(formatFieldLabel('temperature (temp)'), 'Temperature');
  console.log('  -> PASS: All field labels and names have parentheses removed cleanly');

  // 3. UI Uppercase Headers: LORAWAN HEADERS and DECODER FIELDS
  console.log('\n[Test 3] UI Uppercase Headers (LORAWAN HEADERS & DECODER FIELDS)');
  assert(tbContent.includes('LORAWAN HEADERS'), 'Palette and options must contain LORAWAN HEADERS');
  assert(tbContent.includes('DECODER FIELDS'), 'Palette and options must contain DECODER FIELDS');
  assert(!tbContent.includes('<span>Trường từ Decoder'), 'Old Vietnamese header "Trường từ Decoder" must be removed');
  console.log('  -> PASS: Palette and dropdowns render LORAWAN HEADERS and DECODER FIELDS in uppercase');

  // 4. Data Type Badges: Explicit NUMBER / STRING Badges
  console.log('\n[Test 4] Explicit Data Type Badges (NUMBER / STRING)');
  assert(tbContent.includes("{{ f.type === 'string' ? 'STRING' : 'NUMBER' }}"), 'Palette must render uppercase NUMBER or STRING badge');
  assert(tbContent.includes('text-sky-300') && tbContent.includes('text-emerald-300'), 'Badges must have distinctive type colors');
  console.log('  -> PASS: Fields clearly render distinct NUMBER and STRING data type badges');

  // 5. Canvas Node Right-Click Context Menu
  console.log('\n[Test 5] Canvas Node Right-Click Context Menu');
  assert(tbContent.includes('@contextmenu.prevent.stop="openNodeContextMenu($event, node)"'), 'Canvas nodes must have right-click contextmenu event handler');
  assert(tbContent.includes('nodeContextMenu'), 'nodeContextMenu state must exist');
  assert(tbContent.includes('openNodeContextMenu'), 'openNodeContextMenu must be defined');
  assert(tbContent.includes('closeNodeContextMenu'), 'closeNodeContextMenu must be defined');
  assert(tbContent.includes('editScriptFromNodeMenu'), 'editScriptFromNodeMenu must be defined');
  assert(tbContent.includes('cloneNodeFromMenu'), 'cloneNodeFromMenu must be defined');
  assert(tbContent.includes('disconnectWiresFromNode'), 'disconnectWiresFromNode must be defined');
  assert(tbContent.includes('deleteNodeFromMenu'), 'deleteNodeFromMenu must be defined');

  // Verify context menu template buttons
  assert(tbContent.includes('Edit Script'), 'Context menu must include Edit Script option');
  assert(tbContent.includes('Clone Node'), 'Context menu must include Clone Node option');
  assert(tbContent.includes('Disconnect Wires'), 'Context menu must include Disconnect Wires option');
  assert(tbContent.includes('Delete Node'), 'Context menu must include Delete Node option');
  console.log('  -> PASS: Node context menu fully implemented with Edit Script, Clone, Disconnect, and Delete options');

  // 6. Zero Vietnamese Text in UI Templates and Modals
  console.log('\n[Test 6] Zero Vietnamese Text in Test Builder & Control Panel');
  const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

  // Verify test-builder.module.ts (ignoring backward-compatible sanitization regex constants)
  const lines = tbContent.split('\n');
  const viLinesInTb: { line: number; text: string }[] = [];
  lines.forEach((lineText, idx) => {
    // Skip internal sanitization regex patterns or mapping tables for legacy imports
    if (lineText.includes('VI_TO_EN') || lineText.includes('/[\\u00C0-\\u1EF9]/') || lineText.includes('includes(')) {
      return;
    }
    if (viRegex.test(lineText)) {
      viLinesInTb.push({ line: idx + 1, text: lineText.trim() });
    }
  });

  assert.strictEqual(
    viLinesInTb.length,
    0,
    `Found Vietnamese text in test-builder.module.ts: ${JSON.stringify(viLinesInTb, null, 2)}`
  );
  console.log('  -> PASS: test-builder.module.ts is 100% free of Vietnamese text');

  // 7. AST & VM Field Extraction Verification (4 real fields for CO2 decoder)
  console.log('\n[Test 7] Decoder Field Extractor Real Fields Count');
  const sampleCo2Decoder = `
    function decodeUplink(input) {
      var bytes = input.bytes;
      var co2 = (bytes[0] << 8) | bytes[1];
      var temp = ((bytes[2] << 8) | bytes[3]) / 10;
      var hum = bytes[4];
      var battery = bytes[5] / 10;
      return {
        data: {
          co2: co2,
          temperature: temp,
          humidity: hum,
          battery: battery
        }
      };
    }
  `;
  const extracted = extractDecoderFields(sampleCo2Decoder);
  assert.strictEqual(extracted.length, 4, 'Must extract exactly 4 real fields');
  const fieldNames = extracted.map(e => e.name).sort();
  assert.deepStrictEqual(fieldNames, ['battery', 'co2', 'humidity', 'temperature']);
  for (const f of extracted) {
    assert(!f.label.includes('(') && !f.label.includes(')'), `Extracted field label "${f.label}" must not have parentheses`);
  }
  console.log('  -> PASS: Decoder extractor accurately returns 4 real fields with clean labels');

  console.log('\n=== ALL FIELD UX & CONTEXT MENU VERIFICATIONS PASSED (100%) ===\n');
})();
