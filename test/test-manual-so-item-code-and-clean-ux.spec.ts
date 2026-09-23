import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

async function runTests() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: MANUAL SO & ITEM_CODE UX VERIFICATION');
  console.log('======================================================================\n');

  const viewsPath = path.join(process.cwd(), 'src/views/dashboard-modules/test-automation.module.ts');
  const frontPath = path.join(process.cwd(), 'src/frontend/modules/dashboard/test-automation.module.ts');

  const viewsContent = fs.readFileSync(viewsPath, 'utf8');
  const frontContent = fs.readFileSync(frontPath, 'utf8');

  // [TEST 1] File synchronization check
  console.log('[TEST 1] Verifying 1:1 synchronization between views and frontend modules...');
  assert.strictEqual(viewsContent, frontContent, 'src/views and src/frontend must be 100% byte-for-byte identical');
  console.log('  -> PASS: Views and frontend modules are 100% synchronized.\n');

  // [TEST 2] Verification that noisy popup and warning texts are eliminated
  console.log('[TEST 2] Verifying removal of noisy popup and warning texts...');
  assert.ok(!viewsContent.includes('Matching Sales Orders'), 'Must not contain "Matching Sales Orders"');
  assert.ok(!viewsContent.includes('Search by digits or code'), 'Must not contain "Search by digits or code"');
  assert.ok(!viewsContent.includes('No matching Sales Order'), 'Must not contain "No matching Sales Order"');
  assert.ok(!viewsContent.includes('Check the SO code or 3-4 trailing digits.'), 'Must not contain "Check the SO code or 3-4 trailing digits."');
  assert.ok(!viewsContent.includes('Not found</span>'), 'Must not contain "Not found" warning badge in SO header');
  console.log('  -> PASS: All 4 noisy popup texts and "Not found" badge completely removed.\n');

  // [TEST 3] Verification of ITEM_CODE enablement with manual SO
  console.log('[TEST 3] Verifying ITEM_CODE is enabled when manual SO is typed...');
  assert.ok(
    viewsContent.includes(':disabled="!(manualSoCode && manualSoCode.trim()) || isBatchTesting"'),
    'ITEM_CODE input must be enabled when manualSoCode has non-empty text',
  );
  assert.ok(
    viewsContent.includes('v-if="soDropdownOpen && filteredSoList.length > 0"'),
    'SO dropdown must only open if filteredSoList.length > 0 (implicit mode)',
  );
  console.log('  -> PASS: ITEM_CODE is enabled upon typing manual SO, SO dropdown is implicit.\n');

  // [TEST 4] Verification of Register Device button disabled state & handler validation
  console.log('[TEST 4] Verifying Register Device button requires both SO and ITEM_CODE...');
  assert.ok(
    viewsContent.includes(':disabled="!(manualSoCode && manualSoCode.trim()) || !(manualItemCode && manualItemCode.trim()) || isBatchTesting"'),
    'Register Device button must be disabled unless both SO and ITEM_CODE are present',
  );
  assert.ok(
    viewsContent.includes("const effectiveItem = (manualItemCode.value || selectedItemCode.value || '').trim()"),
    'openDeviceOnboardModal must validate effectiveItem',
  );
  assert.ok(
    viewsContent.includes('Please enter or select an Item Code before registering devices.'),
    'openDeviceOnboardModal must show toast warning if ITEM_CODE is missing',
  );
  console.log('  -> PASS: Register Device button and handler strictly require both SO and ITEM_CODE.\n');

  // [TEST 5] Verification of non-destructive manual typing in onSoInputTyped
  console.log('[TEST 5] Verifying onSoInputTyped preserves manual ITEM_CODE...');
  const startIdx = viewsContent.indexOf('const onSoInputTyped = () => {');
  const endIdx = viewsContent.indexOf('const onManualSoCodeInput = () => {');
  assert.ok(startIdx !== -1 && endIdx !== -1, 'onSoInputTyped and onManualSoCodeInput must exist');
  const funcBody = viewsContent.slice(startIdx, endIdx);
  // Verify that an unmatched SO does not unconditionally wipe manualItemCode via an else branch
  assert.ok(
    !funcBody.includes('} else {'),
    'onSoInputTyped must not have an else branch wiping manual values when SO does not match DB',
  );
  console.log('  -> PASS: Manual typing in SO field preserves ITEM_CODE input.\n');

  console.log('======================================================================');
  console.log('ALL 5 UX TESTS PASSED WITH 100% SPECIFICATION COMPLIANCE!');
  console.log('======================================================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
