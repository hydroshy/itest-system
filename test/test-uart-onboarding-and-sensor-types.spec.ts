import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { C_MODULES_REGISTRY } from '../src/modules/c-modules/c-module-registry';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { SensorTypeEntity } from '../src/modules/c-modules/sensor-types/entities/sensor-type.entity';
import { SensorTypesService } from '../src/modules/c-modules/sensor-types/sensor-types.service';
import { TEST_AUTOMATION_TEMPLATE, TEST_AUTOMATION_MODALS, TEST_AUTOMATION_SCRIPT } from '../src/views/dashboard-modules/test-automation.module';
import { SENSOR_TYPES_TEMPLATE, SENSOR_TYPES_MODALS, SENSOR_TYPES_SCRIPT } from '../src/views/control-panel-modules/sensor-types.module';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function runVerificationTests() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: HARDWARE ONBOARDING VIA UART & LORAWAN SENSOR TYPES');
  console.log('======================================================================\n');

  // --------------------------------------------------------------------
  // TEST 1: C-Module Registry & Sensor Types Registration
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying C-Module Registry (C_MODULES_REGISTRY)...');
  const mod = C_MODULES_REGISTRY.find((m) => m.id === 'c-sensor-types');
  assert.ok(mod, 'C-Module [c-sensor-types] must be registered in C_MODULES_REGISTRY');
  assert.strictEqual(mod.code, 'C_MOD_SENSOR_TYPES', 'Module code must be C_MOD_SENSOR_TYPES');
  assert.strictEqual(mod.title, 'LoRaWAN Sensor Types', 'Title must be LoRaWAN Sensor Types');
  assert.ok(mod.icon && mod.icon.includes('fa-microchip'), 'Icon must be fa-microchip');
  assert.strictEqual(mod.category, 'Infrastructure', 'Category must be Infrastructure');
  console.log('  -> PASS: C-Module c-sensor-types successfully registered with standard properties.\n');

  // --------------------------------------------------------------------
  // TEST 2: TypeORM Metadata & Database Routing Configuration
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying TypeORM ALL_DATABASE_ENTITIES & Schema Metadatas...');
  const entityNames = ALL_DATABASE_ENTITIES.map((e: any) => e?.name);
  assert.ok(entityNames.includes('SensorTypeEntity'), 'SensorTypeEntity must be in ALL_DATABASE_ENTITIES');

  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  const sensorMeta = ds.getMetadata(SensorTypeEntity);
  assert.strictEqual(sensorMeta.tableName, 'sensor_types');
  assert.ok(sensorMeta.findColumnWithPropertyName('sensorTypeCode'), 'sensorTypeCode column must exist');
  assert.ok(sensorMeta.findColumnWithPropertyName('sku'), 'sku column must exist');
  assert.ok(sensorMeta.findColumnWithPropertyName('name'), 'name column must exist');
  assert.ok(sensorMeta.findColumnWithPropertyName('defaultRegion'), 'defaultRegion column must exist');
  assert.ok(sensorMeta.findColumnWithPropertyName('defaultClass'), 'defaultClass column must exist');
  assert.ok(sensorMeta.findColumnWithPropertyName('isActive'), 'isActive column must exist');

  // Check db-routing config
  const dbRoutingPath = path.join(__dirname, '../config/db-routing.config.json');
  const dbRouting = JSON.parse(fs.readFileSync(dbRoutingPath, 'utf8'));
  assert.strictEqual(dbRouting.table_routes['sensor_types'], 'core_db', 'sensor_types must route to core_db');
  console.log('  -> PASS: Entity metadata, columns, and core_db routing verified.\n');

  // --------------------------------------------------------------------
  // TEST 3: SensorTypesService SKU Resolver
  // --------------------------------------------------------------------
  console.log('[TEST 3] Testing SensorTypesService SKU resolution (Sensor Type 71 -> WSLRW-LKS)...');
  const mockRepo: any = {
    findBySensorTypeCode: async (code: number) => {
      if (code === 71) {
        return {
          id: 'test-st-71',
          sensorTypeCode: 71,
          sku: 'WSLRW-LKS',
          name: 'LoRaWAN Rope Leak Sensor',
          defaultRegion: 'EU868',
          defaultClass: 'A',
          isActive: true,
        };
      }
      return null;
    },
  };
  const service = new SensorTypesService(mockRepo);
  const resolved = await service.resolveSku(71);
  assert.strictEqual(resolved.sku, 'WSLRW-LKS', 'Sensor Type 71 must resolve to SKU WSLRW-LKS');
  assert.strictEqual(resolved.defaultRegion, 'EU868', 'Default region must be EU868');
  assert.strictEqual(resolved.defaultClass, 'A', 'Default class must be A');
  console.log('  -> PASS: SensorTypesService correctly resolved decimal code 71 to WSLRW-LKS.\n');

  // --------------------------------------------------------------------
  // TEST 4: Control Panel Integration
  // --------------------------------------------------------------------
  console.log('[TEST 4] Verifying Control Panel Sensor Types UI Module...');
  assert.ok(SENSOR_TYPES_TEMPLATE.includes('LoRaWAN Sensor Types'), 'Template must include header');
  assert.ok(SENSOR_TYPES_TEMPLATE.includes('sensorTypeCode'), 'Template must display sensorTypeCode');
  assert.ok(SENSOR_TYPES_MODALS.includes('showSensorTypeModal'), 'Modals must include showSensorTypeModal');
  assert.ok(SENSOR_TYPES_SCRIPT.includes('useSensorTypesModule'), 'Script must define useSensorTypesModule');

  const cpViewPath = path.join(__dirname, '../src/views/control-panel.view.ts');
  const cpContent = fs.readFileSync(cpViewPath, 'utf8');
  assert.ok(cpContent.includes('c-sensor-types'), 'Control panel must register c-sensor-types');
  assert.ok(cpContent.includes('SENSOR_TYPES_TEMPLATE'), 'Control panel must embed SENSOR_TYPES_TEMPLATE');
  assert.ok(cpContent.includes('SENSOR_TYPES_SCRIPT'), 'Control panel must embed SENSOR_TYPES_SCRIPT');
  console.log('  -> PASS: Control Panel Sensor Types module verified.\n');

  // --------------------------------------------------------------------
  // TEST 5: Test Automation Workbench SO Linkage Fix
  // --------------------------------------------------------------------
  console.log('[TEST 5] Verifying Test Automation Workbench SO & Item-Code Linkage...');
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('salesOrdersList.value = json.data || json.items'),
    'fetchSalesOrders must handle json.data from SalesOrdersRepository.findWithPagination',
  );
  assert.ok(
    TEST_AUTOMATION_TEMPLATE.includes('v-for="so in salesOrdersList"'),
    'Template must iterate salesOrdersList',
  );
  assert.ok(
    TEST_AUTOMATION_TEMPLATE.includes('v-for="item in availableSoItems"'),
    'Template must iterate availableSoItems for selected SO',
  );
  console.log('  -> PASS: SO and Item Code linkage verified in Test Automation Workbench.\n');

  // --------------------------------------------------------------------
  // TEST 6: Hardware Verification Popup & Template CSV Reading
  // --------------------------------------------------------------------
  console.log('[TEST 6] Verifying Device Onboarding Modal & Hardware Verification Card...');
  assert.ok(
    TEST_AUTOMATION_TEMPLATE.includes('openDeviceOnboardModal'),
    'Template must include button calling openDeviceOnboardModal',
  );
  assert.ok(
    TEST_AUTOMATION_MODALS.includes('v-if="showDeviceOnboardModal"'),
    'Modals must define showDeviceOnboardModal',
  );

  // Verification popup fields: SERIAL_NUMBER | ITEM_CODE | FW_VERSION | HW_VERSION | ME_VERSION
  assert.ok(TEST_AUTOMATION_MODALS.includes('SERIAL_NUMBER'), 'Modal must display SERIAL_NUMBER');
  assert.ok(TEST_AUTOMATION_MODALS.includes('ITEM_CODE'), 'Modal must display ITEM_CODE');
  assert.ok(TEST_AUTOMATION_MODALS.includes('FW_VERSION'), 'Modal must display FW_VERSION');
  assert.ok(!TEST_AUTOMATION_MODALS.includes('FW_VERSION(LONG)'), 'Modal must not display (LONG)');
  assert.ok(!TEST_AUTOMATION_MODALS.includes('SHORT:'), 'Modal must not display SHORT:');
  assert.ok(!TEST_AUTOMATION_MODALS.includes('Simulate Read'), 'Modal must not display Simulate Read');
  assert.ok(TEST_AUTOMATION_MODALS.includes('REGISTER BY:'), 'Modal must display REGISTER BY:');
  assert.ok(TEST_AUTOMATION_MODALS.includes('HW_VERSION'), 'Modal must display HW_VERSION');
  assert.ok(TEST_AUTOMATION_MODALS.includes('ME_VERSION'), 'Modal must display ME_VERSION');

  // SHORT_FW logic
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('const shortFw = longFw.charAt(0)') ||
    TEST_AUTOMATION_SCRIPT.includes('shortFw = longFw ? longFw.charAt(0) : \'1\''),
    'Script must extract SHORT_FW as the first character of FW_VERSION (e.g. 1F0926 -> 1)',
  );

  // Serial input confirmation & ChirpStack registration
  assert.ok(
    TEST_AUTOMATION_MODALS.includes('v-model="confirmSerialNumberInput"'),
    'Modal must have confirmation input for SERIAL_NUMBER',
  );
  assert.ok(
    TEST_AUTOMATION_MODALS.includes('submitRegisterToChirpstack'),
    'Modal must have action button calling submitRegisterToChirpstack',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('isSerialNumberConfirmed = computed'),
    'Script must compute isSerialNumberConfirmed',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('/lorawan/devices'),
    'Script must post device registration to /lorawan/devices',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('simulateReadDeviceUart'),
    'Script must support simulateReadDeviceUart for @example/template_dvt.csv',
  );
  console.log('  -> PASS: All hardware onboarding verification fields, confirmation checks, and ChirpStack registration flow verified.\n');

  // --------------------------------------------------------------------
  // TEST 7: Pre-Configuration Serial UART Card & Baud Rate Selection Above SO
  // --------------------------------------------------------------------
  console.log('[TEST 7] Verifying Pre-Configuration Serial UART Card & Baud Rate Selection Above SO...');
  assert.ok(
    TEST_AUTOMATION_TEMPLATE.includes('Serial UART COM Port & Baud Rate'),
    'Template must include Serial UART COM Port & Baud Rate card above SO',
  );
  assert.ok(
    TEST_AUTOMATION_TEMPLATE.includes('v-model.number="uartBaudRate"'),
    'Template must have baud rate selector binding uartBaudRate',
  );
  assert.ok(
    TEST_AUTOMATION_TEMPLATE.includes(':value="9600"') && TEST_AUTOMATION_TEMPLATE.includes(':value="115200"'),
    'Template must support both 9600 and 115200 baud rates',
  );
  assert.ok(
    TEST_AUTOMATION_TEMPLATE.includes('@click="connectUart()"'),
    'Template must use connectUart() to prevent event argument passing',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('typeof portToOpen === \'object\' && typeof portToOpen.open === \'function\''),
    'connectUart must safely guard against PointerEvent/MouseEvent being assigned to uartPort',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('readDeviceViaUart()') &&
    TEST_AUTOMATION_SCRIPT.includes('openDeviceOnboardModal = async () => {'),
    'openDeviceOnboardModal must directly trigger readDeviceViaUart when COM port is pre-connected',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('uartBaudRate = ref(9600)'),
    'Script must define reactive uartBaudRate ref defaulting to 9600',
  );
  console.log('  -> PASS: Pre-configuration Serial UART card above SO, baud rate selector (9600/115200), anti-event bug fix, and direct read verified.\n');

  // --------------------------------------------------------------------
  // TEST 8: Simplified Registration Popup & Clean State Re-read Cycle
  // --------------------------------------------------------------------
  console.log('[TEST 8] Verifying Simplified Registration Popup & Clean State Re-read Cycle...');
  assert.ok(
    !TEST_AUTOMATION_MODALS.includes('Connect Serial UART Port'),
    'Modal must not include Connect Serial UART Port',
  );
  assert.ok(
    !TEST_AUTOMATION_MODALS.includes('SERIAL CONNECTED'),
    'Modal must not include SERIAL CONNECTED',
  );
  assert.ok(
    !TEST_AUTOMATION_MODALS.includes('Select COM Port'),
    'Modal must not include Select COM Port',
  );

  // Simplified information display & SERIAL_NUMBER
  assert.ok(TEST_AUTOMATION_MODALS.includes('SERIAL_NUMBER'), 'Modal must prominently display SERIAL_NUMBER');
  assert.ok(TEST_AUTOMATION_MODALS.includes('Hardware Information'), 'Modal must display Hardware Information');
  assert.ok(TEST_AUTOMATION_MODALS.includes('Cancel'), 'Modal must have a Cancel button');
  assert.ok(TEST_AUTOMATION_MODALS.includes('Re-read'), 'Modal must have a Re-read button');

  // Clean re-read state reset
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('const resetReadDeviceInfo = () => {'),
    'Script must define resetReadDeviceInfo to clear state',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('closeDeviceOnboardModal = () => {\n    showDeviceOnboardModal.value = false;\n    resetReadDeviceInfo();\n  };'),
    'closeDeviceOnboardModal must reset readDeviceInfo upon cancel/close',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('openDeviceOnboardModal = async () => {') &&
    TEST_AUTOMATION_SCRIPT.includes('resetReadDeviceInfo();\n    showDeviceOnboardModal.value = true;'),
    'openDeviceOnboardModal must reset readDeviceInfo before reading',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('const readDeviceViaUart = async () => {') &&
    TEST_AUTOMATION_SCRIPT.includes('resetReadDeviceInfo();\n    uartReading.value = true;'),
    'readDeviceViaUart must reset readDeviceInfo before reading fresh registers',
  );
  console.log('  -> PASS: Simplified registration popup (no redundant UART step 1), Cancel/Re-read actions, and fresh state reset verified.\n');

  console.log('======================================================================');
  console.log('ALL 8 TESTS PASSED SUCCESSFULLY WITH 100% SPECIFICATION COMPLIANCE!');
  console.log('======================================================================');
}

runVerificationTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
