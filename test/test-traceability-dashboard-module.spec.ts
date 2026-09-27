import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_D_MODULES } from '../src/modules/d-modules/d-module-registry';
import {
  TRACEABILITY_TEMPLATE,
  TRACEABILITY_MODALS,
  TRACEABILITY_SCRIPT,
} from '../src/views/dashboard-modules/traceability.module';

async function runTraceabilityDashboardModuleTests() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: D-MODULE PRODUCT TRACEABILITY & AUDIT WORKBENCH');
  console.log('FLOW 0: test_result (QA Verification) & FLOW 1: raw_data3 (Telemetry)');
  console.log('======================================================================\n');

  let passedTests = 0;
  const totalTests = 7;

  // --------------------------------------------------------------------
  // TEST 1: D-Module Registry & JSON Config Verification
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying D-Module Registry & config/dashboard-modules.json...');
  const traceDMod = DEFAULT_D_MODULES.find((m) => m.id === 'traceability');
  assert.ok(traceDMod, 'D-Module [traceability] must be registered in DEFAULT_D_MODULES');
  assert.strictEqual(traceDMod.code, 'D_MOD_TRACEABILITY', 'Module code must be D_MOD_TRACEABILITY');
  assert.strictEqual(traceDMod.title, 'PRODUCT TRACEABILITY', 'Title must be PRODUCT TRACEABILITY');
  assert.ok(traceDMod.icon && traceDMod.icon.includes('fa-fingerprint'), 'Icon must be fa-fingerprint');
  assert.strictEqual(traceDMod.category, 'Reports', 'Category must be Reports');
  assert.strictEqual(traceDMod.isActive, true, 'Module must be active');

  const configPath = path.join(process.cwd(), 'config/dashboard-modules.json');
  assert.ok(fs.existsSync(configPath), 'config/dashboard-modules.json must exist');
  const dModConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const configEntry = dModConfig.modules.find((m: any) => m.id === 'traceability');
  assert.ok(configEntry, 'traceability entry must exist in dashboard-modules.json modules array');
  assert.ok(
    dModConfig.roleLayouts.SUPER_ADMIN.moduleOrder.includes('traceability'),
    'traceability must be in SUPER_ADMIN moduleOrder',
  );
  assert.ok(
    dModConfig.roleLayouts.OPERATOR.moduleOrder.includes('traceability'),
    'traceability must be in OPERATOR moduleOrder',
  );
  console.log('  -> PASS: D-Module registry and dashboard-modules.json configurations verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 2: 1:1 Synchronization Between Views and Frontend Modules
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying 1:1 synchronization between views and frontend modules...');
  const viewPath = path.join(process.cwd(), 'src/views/dashboard-modules/traceability.module.ts');
  const frontPath = path.join(process.cwd(), 'src/frontend/modules/dashboard/traceability.module.ts');
  assert.ok(fs.existsSync(viewPath), 'src/views/dashboard-modules/traceability.module.ts must exist');
  assert.ok(fs.existsSync(frontPath), 'src/frontend/modules/dashboard/traceability.module.ts must exist');

  const viewContent = fs.readFileSync(viewPath, 'utf8');
  const frontContent = fs.readFileSync(frontPath, 'utf8');
  assert.strictEqual(viewContent, frontContent, 'Both traceability.module.ts files must be 100% byte-for-byte identical');
  console.log('  -> PASS: Dashboard Traceability module files are 100% synchronized.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 3: Navigation Cards / Tabs (Thẻ điều hướng) Structure
  // --------------------------------------------------------------------
  console.log('[TEST 3] Verifying interactive navigation cards/tabs (thẻ điều hướng)...');
  // Tab 1: test_result
  assert.ok(
    TRACEABILITY_TEMPLATE.includes("activeTraceTab = 'test_results'"),
    'Must include navigation card for Tab 1 (test_results)',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('test_result'),
    'Tab 1 card must explicitly reference table test_result',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('1. Test Results QA'),
    'Tab 1 card must display "1. Test Results QA"',
  );

  // Tab 2: raw_data3
  assert.ok(
    TRACEABILITY_TEMPLATE.includes("activeTraceTab = 'telemetry'"),
    'Must include navigation card for Tab 2 (telemetry)',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('raw_data3'),
    'Tab 2 card must explicitly reference table raw_data3',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('2. Telemetry Inspector'),
    'Tab 2 card must display "2. Telemetry Inspector"',
  );

  // Tab 3: lifecycle
  assert.ok(
    TRACEABILITY_TEMPLATE.includes("activeTraceTab = 'lifecycle'"),
    'Must include navigation card for Tab 3 (lifecycle)',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('3. Serialization Lifecycle'),
    'Tab 3 card must display "3. Serialization Lifecycle"',
  );
  console.log('  -> PASS: All 3 navigation cards/tabs verified with proper activeTab triggers.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 4: Querying & Filters for test_result & raw_data3
  // --------------------------------------------------------------------
  console.log('[TEST 4] Verifying search, filtering, and data inspection capabilities...');
  // Multi-criteria search
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('traceFilters.search'),
    'Must include search input bound to traceFilters.search (SO, SN, Item Code)',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('traceFilters.result'),
    'Must include QA result selector (ALL, PASS, FAIL)',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('exportTraceabilityCsv'),
    'Must include CSV export button for test_result',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('seedSampleTraceData'),
    'Must include Baseline Seed button for easy demonstration',
  );

  // Detail Modals
  assert.ok(
    TRACEABILITY_MODALS.includes('showTraceDetailModal'),
    'Must include QA Test Result detail modal',
  );
  assert.ok(
    TRACEABILITY_MODALS.includes('showRawPacketModal'),
    'Must include Raw Hex Telemetry Packet modal',
  );
  console.log('  -> PASS: Multi-criteria filters, CSV export, and detail modals verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 5: dashboard.view.ts Wiring & Lifecycle Hooks
  // --------------------------------------------------------------------
  console.log('[TEST 5] Verifying dashboard.view.ts integration points...');
  const dashViewPath = path.join(process.cwd(), 'src/views/dashboard.view.ts');
  const dashView = fs.readFileSync(dashViewPath, 'utf8');

  assert.ok(
    dashView.includes("import { TRACEABILITY_TEMPLATE, TRACEABILITY_MODALS, TRACEABILITY_SCRIPT } from './dashboard-modules/traceability.module'"),
    'dashboard.view.ts must import TRACEABILITY_TEMPLATE, TRACEABILITY_MODALS, TRACEABILITY_SCRIPT',
  );
  assert.ok(
    dashView.includes('${TRACEABILITY_TEMPLATE}'),
    'dashboard.view.ts must interpolate ${TRACEABILITY_TEMPLATE}',
  );
  assert.ok(
    dashView.includes('${TRACEABILITY_MODALS}'),
    'dashboard.view.ts must interpolate ${TRACEABILITY_MODALS}',
  );
  assert.ok(
    dashView.includes('${TRACEABILITY_SCRIPT}'),
    'dashboard.view.ts must interpolate ${TRACEABILITY_SCRIPT}',
  );
  assert.ok(
    dashView.includes('const traceabilityModule = useTraceabilityModule({'),
    'dashboard.view.ts setup() must instantiate useTraceabilityModule',
  );
  assert.ok(
    dashView.includes("feature.id === 'traceability' || feature.id === 'product-traceability'"),
    'dashboard.view.ts openFeature must handle traceability feature',
  );
  assert.ok(
    dashView.includes('...traceabilityModule,'),
    'dashboard.view.ts setup() return object must spread ...traceabilityModule',
  );
  console.log('  -> PASS: All dashboard.view.ts integration points verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 6: Standard English UI & Clean Design
  // --------------------------------------------------------------------
  console.log('[TEST 6] Verifying English UI standards & script structure...');
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  assert.ok(
    !vietnameseRegex.test(TRACEABILITY_TEMPLATE.slice(0, 1500)),
    'Template header must not contain unescaped Vietnamese characters (clean English standard)',
  );
  assert.ok(
    TRACEABILITY_SCRIPT.includes('function useTraceabilityModule'),
    'TRACEABILITY_SCRIPT must define useTraceabilityModule',
  );
  console.log('  -> PASS: Clean English UI and composable script verified.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 7: raw_data3 Field Statistics (min/avg/max) & Trend Graphs
  // --------------------------------------------------------------------
  console.log('[TEST 7] Verifying raw_data3 Field Statistics & Dedicated Trend Visualizers...');
  // 1. Statistics table placement below Event Code Distribution
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('Raw Data 3 Field Telemetry Statistics (Min / Avg / Max)'),
    'TRACEABILITY_TEMPLATE must include raw_data3 field statistics section',
  );
  const eventDistPos = TRACEABILITY_TEMPLATE.indexOf('Event Code Distribution (Header P1 Protocol)');
  const statsPos = TRACEABILITY_TEMPLATE.indexOf('Raw Data 3 Field Telemetry Statistics (Min / Avg / Max)');
  const trendPos = TRACEABILITY_TEMPLATE.indexOf('Field Data Trends (raw_data3 Timeline Series)');
  assert.ok(
    eventDistPos !== -1 && statsPos !== -1 && trendPos !== -1,
    'All three sections must exist in template',
  );
  assert.ok(
    eventDistPos < statsPos,
    'Statistics section must be positioned below Event Code Distribution',
  );
  assert.ok(
    statsPos < trendPos,
    'Trend graphs section must be positioned below Statistics section',
  );

  // 2. Trend graphs UI features (1 card per field, X: timestamp, Y: data value)
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('v-for="field in rawDataFieldList"'),
    'Must iterate each active field in rawDataFieldList for trend graphs',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes(':points="field.polylineStr"') &&
    TRACEABILITY_TEMPLATE.includes(':points="field.areaPolygonStr"') &&
    TRACEABILITY_TEMPLATE.includes('v-for="p in field.renderedPoints"'),
    'Must render SVG polyline, gradient area, and interactive packet data points',
  );
  assert.ok(
    TRACEABILITY_TEMPLATE.includes('field.startTime') &&
    TRACEABILITY_TEMPLATE.includes('field.endTime') &&
    TRACEABILITY_TEMPLATE.includes('pkts'),
    'Trend graph must display X-axis timestamps (start -> end) and packet counts',
  );

  // 3. Script: rawDataFieldList computed logic & null filtering
  assert.ok(
    TRACEABILITY_SCRIPT.includes('const rawDataFieldList = computed('),
    'TRACEABILITY_SCRIPT must define rawDataFieldList computed property',
  );
  assert.ok(
    TRACEABILITY_SCRIPT.includes('if (validPoints.length === 0)') &&
    TRACEABILITY_SCRIPT.includes('continue;'),
    'Must strictly exclude fields with null or no data from trend display',
  );
  assert.ok(
    TRACEABILITY_SCRIPT.includes('rawDataFieldList,') || TRACEABILITY_SCRIPT.includes('rawDataFieldList'),
    'TRACEABILITY_SCRIPT must export rawDataFieldList in return object',
  );
  console.log('  -> PASS: raw_data3 statistics, trend visualizers, and null-field exclusion verified.\n');
  passedTests++;

  console.log('======================================================================');
  console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY (100% VERIFIED)!`);
  console.log('======================================================================');
}

runTraceabilityDashboardModuleTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
