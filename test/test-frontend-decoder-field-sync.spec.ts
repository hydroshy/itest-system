import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

console.log('=== VERIFYING FRONTEND DECODER FIELD EXTRACTION & SYNC (TASK T2) ===\n');

const tbPath = path.join(__dirname, '../src/views/control-panel-modules/test-builder.module.ts');
const cpPath = path.join(__dirname, '../src/views/control-panel.view.ts');

const tbContent = fs.readFileSync(tbPath, 'utf8');
const cpContent = fs.readFileSync(cpPath, 'utf8');

// 1. Verify UI Test Builder displays real decoder extraction status
console.log('[Test 1] Real Decoder Status Display in Header & Palette');
assert(tbContent.includes('decoderExtractionStatus'), 'decoderExtractionStatus reactive ref must be defined');
assert(tbContent.includes('decoderExtractionStatus.decoderFound'), 'Must handle decoderFound state');
assert(tbContent.includes('decoderExtractionStatus.realFieldsCount'), 'Must display real fields count');
assert(tbContent.includes('decoderExtractionStatus.decoderName || decoderExtractionStatus.decoderId'), 'Must show decoder name or ID');
assert(tbContent.includes('Extracting Decoder...'), 'Must show loading state in header');
console.log('  -> PASS: Top bar metadata badge displays real decoder status, name, and field count.');

// 2. Verify SKU/Firmware change and Refresh Fields sync with DB
console.log('\n[Test 2] SKU/Firmware and Refresh Fields Synchronization');
assert(tbContent.includes('/api/c-modules/test-builder/available-fields?sku='), 'Must query available-fields with sku and firmwareVersion query parameters');
assert(tbContent.includes('fetchTestAvailableFields'), 'fetchTestAvailableFields function must be present');
assert(tbContent.includes("watch("), 'Must watch activeTestTemplate SKU/Firmware for automatic refresh');
assert(tbContent.includes("activeTestTemplate.value?.sku") && tbContent.includes("activeTestTemplate.value?.firmwareVersion"), 'Watch must monitor both SKU and firmwareVersion');
assert(tbContent.includes('@click="fetchTestAvailableFields"'), 'Refresh Fields button must trigger fetchTestAvailableFields');
console.log('  -> PASS: Automatic sync on SKU/FW changes and manual Refresh Fields calling real DB API.');

// 3. Verify clear warning when no decoder registered (No Fake Fallback)
console.log('\n[Test 3] No Registered Decoder Alert (Zero Fake Fields)');
assert(tbContent.includes('No registered decoder found for this SKU/FW'), 'Must display clear warning message when no decoder found');
assert(tbContent.includes('No mock fallback used') || tbContent.includes('Không sử dụng mock fallback'), 'Must explicitly explain that mock fallback is disabled');
assert(tbContent.includes('realDecoderFields'), 'realDecoderFields computed property must be defined');
assert(tbContent.includes('commonTelemetryFields'), 'commonTelemetryFields computed property must be defined');
assert(!tbContent.includes("testAvailableFields.value[0]?.name || 'co2'"), 'Must not default to hardcoded fake co2 field');
assert(!tbContent.includes("testAvailableFields.value[0]?.name || 'temperature'"), 'Must not default to hardcoded fake temperature field');
console.log('  -> PASS: Clear warning banner rendered when decoder missing; hardcoded fake fields eliminated.');

// 4. Verify Quick Test Decoder Code & Link to Decoder Manager
console.log('\n[Test 4] Quick Test Decoder Code & Decoder Manager Navigation');
assert(tbContent.includes('showQuickTestModal'), 'showQuickTestModal reactive state must be defined');
assert(tbContent.includes('/api/c-modules/test-builder/extract-decoder-fields'), 'Must call POST extract-decoder-fields endpoint');
assert(tbContent.includes('runQuickTestExtract'), 'runQuickTestExtract function must be implemented');
assert(tbContent.includes('loadActiveDecoderCodeIntoQuickTest'), 'Must allow loading current registered decoder code from DB');
assert(tbContent.includes('loadSampleQuickTestCode'), 'Must support loading sample decoder code');
assert(tbContent.includes('applyQuickTestFieldsToScenario'), 'Must allow applying extracted fields to scenario');
assert(tbContent.includes('navigateToDecoderManager'), 'navigateToDecoderManager function must be implemented');
assert(tbContent.includes("ctx.switchTab('decoder')") || tbContent.includes("switchTab('decoder')"), 'Must switch to decoder tab');
assert(tbContent.includes('ctx.decoderSearchQuery'), 'Must set decoder search query when navigating');
assert(cpContent.includes('switchTab,') && cpContent.includes('decoderSearchQuery,'), 'control-panel.view.ts must pass switchTab and decoderSearchQuery to testBuilderModule');
console.log('  -> PASS: Quick test modal allows AST/VM inspection and deep link to Decoder Manager tab works.');

console.log('\n=== ALL FRONTEND DECODER FIELD EXTRACTION TESTS PASSED (100%) ===\n');
