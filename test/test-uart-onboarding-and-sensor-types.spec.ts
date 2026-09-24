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

  // --------------------------------------------------------------------
  // TEST 9: Blank Write Presets & Port Check Popup when SERIAL_NUMBER is Unreadable
  // --------------------------------------------------------------------
  console.log('[TEST 9] Verifying Blank Write Presets & Port Check Popup on Read Failure...');
  const presetsJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/modbus-presets.json'), 'utf8'));
  const reg259 = presetsJson[0].registers.find((r: any) => r.reg === 259);
  assert.ok(reg259, 'Reg 259 must exist in modbus-presets.json');
  assert.strictEqual(reg259.valuetowrite, '', 'valuetowrite for Reg 259 must be blank (no auto-write dummy serial numbers)');

  // Purely actual read - no fallback WSLRW-LKS-260901 or dynamic date generator
  assert.ok(
    !TEST_AUTOMATION_SCRIPT.includes('serialNumber = sku + \'-\' + new Date().toISOString()'),
    'readDeviceViaUart must not generate fallback serial numbers when unreadable',
  );

  // Port check popup trigger on missing/unreadable SERIAL_NUMBER
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('openPortCheckModal') &&
    TEST_AUTOMATION_SCRIPT.includes('showPortCheckModal'),
    'Script must define and call openPortCheckModal when SERIAL_NUMBER cannot be read',
  );
  assert.ok(
    TEST_AUTOMATION_MODALS.includes('showPortCheckModal') &&
    TEST_AUTOMATION_MODALS.includes('Check Port Connection'),
    'Modals template must include Check Port Connection modal (showPortCheckModal)',
  );
  console.log('  -> PASS: Blank write presets, strictly actual hardware read, and port connection check popup verified.\n');

  // --------------------------------------------------------------------
  // TEST 10: 1-Line SERIAL_NUMBER Fitting & ChirpStack Network Server Auto-Routing
  // --------------------------------------------------------------------
  console.log('[TEST 10] Verifying 1-Line SERIAL_NUMBER Fitting & ChirpStack Network Server Auto-Routing...');
  // 1. SERIAL_NUMBER 1-line fitting
  assert.ok(
    TEST_AUTOMATION_MODALS.includes('whitespace-nowrap tracking-tight') &&
    TEST_AUTOMATION_MODALS.includes('sm:col-span-3') &&
    TEST_AUTOMATION_MODALS.includes('sm:grid-cols-12'),
    'SERIAL_NUMBER must be styled with whitespace-nowrap in 12-column layout to fit on 1 line',
  );

  // 2. Network Server selection & auto-discovery in UI
  assert.ok(
    TEST_AUTOMATION_MODALS.includes('selectedNetworkServerId') &&
    TEST_AUTOMATION_MODALS.includes('Local Fleet Mode (Offline Test)') &&
    TEST_AUTOMATION_MODALS.includes('CHIRPSTACK ONLINE'),
    'Modal must provide Network Server selector and Local Fleet mode fallback',
  );

  // 3. Script Network Server routing & payload provisioning
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('fetchNetworkServersList') &&
    TEST_AUTOMATION_SCRIPT.includes('selectedNetworkServer') &&
    TEST_AUTOMATION_SCRIPT.includes('networkServerId: isLocal ? undefined : (targetNs?.id || undefined)'),
    'Script must automatically bind target networkServerId, regionProfileId and provisionTarget',
  );

  // 4. Backend LorawanService auto-fallback to default/active network server
  const lorawanServiceSrc = fs.readFileSync(path.join(__dirname, '../src/modules/lorawan/lorawan.service.ts'), 'utf8');
  assert.ok(
    lorawanServiceSrc.includes('this.serverRepo.findOne({ where: { isDefault: true } })'),
    'LorawanService must fallback to isDefault network server when dto.networkServerId is omitted',
  );
  console.log('  -> PASS: 1-line SERIAL_NUMBER card fitting and ChirpStack Network Server auto-routing verified.\n');

  // --------------------------------------------------------------------
  // TEST 11: Modbus Reg 27 DEV_EUI Reading, Card Placement & Duplicate Handling
  // --------------------------------------------------------------------
  console.log('[TEST 11] Verifying Modbus Reg 27 DEV_EUI Reading, Card Placement & Duplicate Handling...');
  // 1. Script reads Reg 27 (FC 3, 4 registers, hex format)
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('readModbusRegistersFromPort(1, 27, 4)'),
    'Script must read Reg 27 with length 4 using FC 3',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('bytesToHex'),
    'Script must define bytesToHex to parse DEV_EUI in hex format',
  );

  // 2. Validation requires both SERIAL_NUMBER and DEV_EUI
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('!serialNumber || !serialNumber.trim() || !devEUI || !devEUI.trim()'),
    'Script must require both SERIAL_NUMBER and DEV_EUI or prompt port check error',
  );

  // 3. Modal displays DEV_EUI right after SERIAL_NUMBER
  assert.ok(
    TEST_AUTOMATION_MODALS.includes('DEV_EUI') &&
    TEST_AUTOMATION_MODALS.includes('readDeviceInfo.devEUI'),
    'Modal must display DEV_EUI in hardware verification card',
  );

  // 4. Duplicate device error handling and alert
  assert.ok(
    TEST_AUTOMATION_MODALS.includes('registrationErrorMessage'),
    'Modal must include registrationErrorMessage alert banner for duplicate devices',
  );
  assert.ok(
    TEST_AUTOMATION_SCRIPT.includes('isDuplicate') &&
    TEST_AUTOMATION_SCRIPT.includes('registrationErrorMessage.value = duplicateMsg'),
    'Script must catch duplicate device key error from network server and display warning',
  );

  // 5. LorawanResilienceService non-retryable duplicate error handling
  const resilienceSrc = fs.readFileSync(path.join(__dirname, '../src/modules/lorawan/services/lorawan-resilience.service.ts'), 'utf8');
  assert.ok(
    resilienceSrc.includes('isDuplicateKeyError') &&
    resilienceSrc.includes('device_pkey'),
    'LorawanResilienceService must treat device_pkey / duplicate key violations as non-retryable',
  );
  console.log('  -> PASS: Reg 27 DEV_EUI reading, placement after SERIAL_NUMBER, and duplicate device handling verified.\n');

  console.log('======================================================================');
  console.log('ALL 11 TESTS PASSED SUCCESSFULLY WITH 100% SPECIFICATION COMPLIANCE!');
  console.log('======================================================================');
}

runVerificationTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
