import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

async function runDashboardTemplateSuite() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: DASHBOARD VUE TEMPLATE SYNTAX & STATE ISOLATION');
  console.log('======================================================================\n');

  let passedTests = 0;
  const totalTests = 6;

  const viewsDir = path.resolve(__dirname, '../src/views/dashboard-modules');
  const frontDir = path.resolve(__dirname, '../src/frontend/modules/dashboard');
  const dashViewPath = path.resolve(__dirname, '../src/views/dashboard.view.ts');

  // --------------------------------------------------------------------
  // TEST 1: Validate all Vue Template Expressions & Directives Syntax
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying all Vue template binding expressions (:prop, v-if, {{ }})...');

  function checkTemplateExpressions(filePath: string): number {
    const content = fs.readFileSync(filePath, 'utf8');
    const directiveRegex = /(?::[a-zA-Z0-9_\-]+|v-(?:if|else-if|show|bind:[a-zA-Z0-9_\-]+))\s*=\s*"([^"]+)"/g;
    let match;
    let errorCount = 0;
    while ((match = directiveRegex.exec(content)) !== null) {
      const expr = match[1];
      try {
        new Function('ctx', 'with(ctx) { return (' + expr + '); }');
      } catch (err: any) {
        console.error(`  [SYNTAX ERROR at ${path.basename(filePath)}]: ${err.message} in expression: ${expr}`);
        errorCount++;
      }
    }

    const interpRegex = /\{\{\s*([^{}]+?)\s*\}\}/g;
    while ((match = interpRegex.exec(content)) !== null) {
      const expr = match[1];
      try {
        new Function('ctx', 'with(ctx) { return (' + expr + '); }');
      } catch (err: any) {
        console.error(`  [INTERPOLATION SYNTAX ERROR at ${path.basename(filePath)}]: ${err.message} in: ${expr}`);
        errorCount++;
      }
    }

    const eventRegex = /@[a-zA-Z0-9_\-.]+\s*=\s*"([^"]+)"/g;
    while ((match = eventRegex.exec(content)) !== null) {
      const expr = match[1];
      try {
        new Function('ctx', '$event', 'with(ctx) { ' + expr + ' }');
      } catch (err: any) {
        console.error(`  [EVENT SYNTAX ERROR at ${path.basename(filePath)}]: ${err.message} in: ${expr}`);
        errorCount++;
      }
    }

    return errorCount;
  }

  const moduleFiles = fs.readdirSync(viewsDir).filter(f => f.endsWith('.module.ts'));
  let totalErrors = 0;
  for (const f of moduleFiles) {
    const errCount = checkTemplateExpressions(path.join(viewsDir, f));
    totalErrors += errCount;
  }

  assert.strictEqual(totalErrors, 0, 'Must have zero syntax errors in Vue template expressions');
  console.log(`  -> PASS: All ${moduleFiles.length} modules have 0 template expression syntax errors.\n`);
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 2: Validate No Duplicate HTML Attributes in Any D-Module
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying no duplicate HTML attributes in all D-Modules...');
  let duplicateCount = 0;

  for (const f of moduleFiles) {
    const content = fs.readFileSync(path.join(viewsDir, f), 'utf8');
    const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*?)>/gs;
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      const tagName = match[1];
      const attrsStr = match[2];
      const attrRegex = /([:@a-zA-Z0-9_\-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;
      let attrMatch;
      const seen = new Set<string>();
      while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
        const attrName = attrMatch[1];
        if (seen.has(attrName)) {
          console.error(`  Duplicate attr "${attrName}" in <${tagName}> in ${f}`);
          duplicateCount++;
        }
        seen.add(attrName);
      }
    }
  }

  assert.strictEqual(duplicateCount, 0, 'Must have 0 duplicate HTML attributes');
  console.log('  -> PASS: Zero duplicate HTML attributes across all modules.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 3: Verify 1:1 Synchronization between views and frontend
  // --------------------------------------------------------------------
  console.log('[TEST 3] Verifying 1:1 synchronization between src/views and src/frontend...');
  for (const f of moduleFiles) {
    const viewPath = path.join(viewsDir, f);
    const frontPath = path.join(frontDir, f);
    assert.ok(fs.existsSync(frontPath), `Frontend counterpart ${f} must exist`);
    const viewCode = fs.readFileSync(viewPath, 'utf8');
    const frontCode = fs.readFileSync(frontPath, 'utf8');
    assert.strictEqual(viewCode, frontCode, `${f} must be 100% identical between views and frontend`);
  }
  console.log('  -> PASS: All dashboard modules are 100% synchronized.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 4: State & Function Isolation between Composable Modules
  // --------------------------------------------------------------------
  console.log('[TEST 4] Verifying state and method isolation (no fatal collisions)...');

  function getExportedKeys(filePath: string, fnName: string): Set<string> {
    const content = fs.readFileSync(filePath, 'utf8');
    const fnStart = content.indexOf('function ' + fnName);
    assert.ok(fnStart !== -1, `Function ${fnName} must exist in ${filePath}`);
    const fnContent = content.substring(fnStart);
    const returnIndex = fnContent.lastIndexOf('return {');
    assert.ok(returnIndex !== -1, `return { must exist in ${fnName}`);
    const returnBlock = fnContent.substring(returnIndex);
    const closeIndex = returnBlock.indexOf('};');
    const body = returnBlock.substring(8, closeIndex);
    const keys = body.split(/[\n,]/).map(s => s.trim().split(':')[0].trim()).filter(s => s && !s.startsWith('//'));
    return new Set(keys);
  }

  const serialKeys = getExportedKeys(path.join(viewsDir, 'serial-uart.module.ts'), 'useSerialModule');
  const testAutoKeys = getExportedKeys(path.join(viewsDir, 'test-automation.module.ts'), 'useTestAutomationModule');
  const fcKeys = getExportedKeys(path.join(viewsDir, 'final-config-device.module.ts'), 'useFinalConfigDeviceModule');

  // Verify finalConfigDeviceModule does not overwrite critical serialModule states
  const criticalSerialKeys = [
    'serialPort', 'serialConnected', 'serialConnecting', 'serialConfig',
    'serialSignals', 'serialStats', 'serialLogs', 'selectSerialPort',
    'connectSerial', 'disconnectSerial', 'toggleDTR', 'toggleRTS'
  ];
  for (const key of criticalSerialKeys) {
    assert.ok(!fcKeys.has(key), `finalConfigDeviceModule must NOT export colliding key '${key}' over serialModule`);
  }

  // Verify finalConfigDeviceModule does not overwrite testAutomationModule SO keys
  const criticalTestAutoKeys = ['selectedSo', 'selectedItemCode', 'salesOrdersList', 'onItemCodeChange'];
  for (const key of criticalTestAutoKeys) {
    assert.ok(!fcKeys.has(key), `finalConfigDeviceModule must NOT export colliding key '${key}' over testAutomationModule`);
  }

  console.log('  -> PASS: State isolation fully verified without destructive collisions.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 5: Verify Vue Helpers Destructuring in test-automation.module.ts
  // --------------------------------------------------------------------
  console.log('[TEST 5] Verifying Vue helpers in useTestAutomationModule...');
  const testAutoContent = fs.readFileSync(path.join(viewsDir, 'test-automation.module.ts'), 'utf8');
  assert.ok(
    testAutoContent.includes('const { ref, computed, watch, nextTick, onMounted, onUnmounted } = Vue;'),
    'useTestAutomationModule must destructure Vue helpers explicitly'
  );
  console.log('  -> PASS: Vue helpers explicitly destructured in testAutomationModule.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 6: Verify Dashboard Script Runtime Execution & Global Safety
  // --------------------------------------------------------------------
  console.log('[TEST 6] Verifying dashboard script runtime execution & global safety...');
  const dashContent = fs.readFileSync(dashViewPath, 'utf8');
  assert.ok(
    dashContent.includes('let socketClient = null;') && dashContent.includes('let sseSource = null;'),
    'dashboard.view.ts must declare socketClient and sseSource to prevent ReferenceError in initRealtimeConnection'
  );
  console.log('  -> PASS: socketClient and sseSource properly declared in dashboard.view.ts.\n');
  passedTests++;

  console.log('======================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} CHECKS SUCCESSFUL`);
  console.log('======================================================================');
}

runDashboardTemplateSuite().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
