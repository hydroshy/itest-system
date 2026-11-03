import 'reflect-metadata';
import * as assert from 'assert';
import { TestingAdapterController } from '../src/backend/plugins/testing.adapter.controller';

async function run() {
  console.log('--- STARTING AUTOCHECK PROFILE UPGRADE VERIFICATION ---');

  const mockProfilesTable: any[] = [];
  const mockPacketsTable: any[] = [];
  const mockDecoderScripts: any[] = [
    {
      id: 'dec-1111-2222',
      name: 'Daviteq WSLRW-DI Decoder',
      item_code: 'WSLRW-DI',
      fw_code: '3.0',
      long_fw: '3.0',
      sku: 'WSLRW-DI',
      script: 'function decodeUplink(input) { return { data: { temperature: 25.5, humidity: 60.2, battery: 100 } }; }',
      sample_payload: '010203',
      sample_decoded: { temperature: 25.5, humidity: 60.2, battery: 100 },
      is_active: true,
    },
  ];

  const db: any = {
    getRepositoryForTable: (table: string) => {
      if (table === 'device_packets') {
        return {
          create: (v: any) => v,
          save: async (v: any) => {
            mockPacketsTable.push(v);
            return { ...v, id: 'pkt-1' };
          },
          findOne: async (opt: any) => {
            return mockPacketsTable.find((p) => p.id === opt?.where?.id) || null;
          },
          createQueryBuilder: () => ({
            leftJoinAndSelect: function () { return this; },
            orderBy: function () { return this; },
            skip: function () { return this; },
            take: function () { return this; },
            andWhere: function () { return this; },
            getOne: async () => mockPacketsTable[0] || null,
            getManyAndCount: async () => [mockPacketsTable, mockPacketsTable.length],
          }),
        };
      }
      if (table === 'decoder_scripts') {
        return {
          createQueryBuilder: () => {
            let filterCode = '';
            let filterFw = '';
            return {
              where: function () { return this; },
              andWhere: function (cond: string, params: any) {
                if (params?.itemCode) filterCode = params.itemCode;
                if (params?.sku) filterCode = params.sku;
                if (params?.code) filterCode = params.code;
                if (params?.fwCode) filterFw = params.fwCode;
                return this;
              },
              orderBy: function () { return this; },
              getOne: async () => {
                if (filterCode === 'UNKNOWN_PRODUCT' || filterFw === '9.9') return null;
                return mockDecoderScripts[0] || null;
              },
            };
          },
        };
      }
      return {
        createQueryBuilder: () => ({
          where: function () { return this; },
          andWhere: function () { return this; },
          getOne: async () => null,
          getManyAndCount: async () => [[], 0],
        }),
      };
    },
    getDataSourceForTable: (table: string) => ({
      query: async (sql: string, params: any[] = []) => {
        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith('INSERT INTO SYSTEM_SCHEMA.DEVICE_AUTOCHECK_PROFILES')) {
          const newId = `uuid-${Date.now()}`;
          const newAcId = `AC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const row = {
            id: newId,
            autocheck_id: newAcId,
            name: params[0],
            item_code: params[1],
            fw_version: params[2],
            reference_item_code: params[3],
            reference_fw_version: params[4],
            criteria: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
            created_by: params[6],
            created_at: new Date(),
            updated_at: new Date(),
          };
          mockProfilesTable.push(row);
          return [row];
        }
        if (trimmed.startsWith('SELECT * FROM SYSTEM_SCHEMA.DEVICE_AUTOCHECK_PROFILES WHERE LOWER(AUTOCHECK_ID)')) {
          const acId = params[0]?.toLowerCase();
          return mockProfilesTable.filter((r) => r.autocheck_id.toLowerCase() === acId);
        }
        if (trimmed.startsWith('SELECT * FROM SYSTEM_SCHEMA.DEVICE_AUTOCHECK_PROFILES WHERE ID =')) {
          const id = params[0];
          return mockProfilesTable.filter((r) => r.id === id);
        }
        if (trimmed.startsWith('SELECT * FROM SYSTEM_SCHEMA.DEVICE_AUTOCHECK_PROFILES')) {
          return mockProfilesTable;
        }
        if (trimmed.startsWith('SELECT COUNT(*)::INT AS COUNT FROM (SELECT * FROM SYSTEM_SCHEMA.DEVICE_AUTOCHECK_PROFILES')) {
          return [{ count: mockProfilesTable.length }];
        }
        if (trimmed.startsWith('UPDATE SYSTEM_SCHEMA.DEVICE_AUTOCHECK_PROFILES')) {
          const id = params[6];
          const row = mockProfilesTable.find((r) => r.id === id);
          if (row) {
            row.name = params[0];
            row.item_code = params[1];
            row.fw_version = params[2];
            row.reference_item_code = params[3];
            row.reference_fw_version = params[4];
            row.criteria = typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5];
            row.updated_at = new Date();
          }
          return [row];
        }
        if (trimmed.startsWith('DELETE FROM SYSTEM_SCHEMA.DEVICE_AUTOCHECK_PROFILES')) {
          const id = params[0];
          const idx = mockProfilesTable.findIndex((r) => r.id === id);
          if (idx !== -1) mockProfilesTable.splice(idx, 1);
          return [];
        }
        return [];
      },
    }),
  };

  const controller = new TestingAdapterController(db, {
    publishPluginLifecycle: () => {},
  } as any);

  // 1. Validation test on creation
  console.log('[TEST 1] Profile creation validation');
  await assert.rejects(
    controller.createAutoCheckProfile({ name: '', itemCode: 'WSLRW-DI', fwVersion: '3.0' }),
    /Tên cấu hình autocheck/
  );
  await assert.rejects(
    controller.createAutoCheckProfile({ name: 'Check 1', itemCode: '', fwVersion: '3.0' }),
    /ITEM_CODE/
  );
  await assert.rejects(
    controller.createAutoCheckProfile({ name: 'Check 1', itemCode: 'WSLRW-DI', fwVersion: '' }),
    /FW_VERSION/
  );
  await assert.rejects(
    controller.createAutoCheckProfile({
      name: 'Check 1',
      itemCode: 'WSLRW-DI',
      fwVersion: '3.0',
      referenceItemCode: 'WSLRW-DI',
      referenceFwVersion: '',
    }),
    /Thiết bị tham chiếu yêu cầu cả referenceItemCode và referenceFwVersion/
  );
  console.log('✓ Validation rules correctly rejected invalid profile payloads');

  // 2. Successful creation with auto-generated autocheck_id
  console.log('[TEST 2] Profile CRUD with server-generated AUTOCHECK_ID');
  const created = await controller.createAutoCheckProfile({
    name: 'Profile Cảm biến Nhiệt độ',
    itemCode: 'WSLRW-DI',
    fwVersion: '3.0',
    referenceItemCode: 'WSLRW-DI',
    referenceFwVersion: '3.0',
    criteria: {
      dut: {
        item_code: 'WSLRW-DI',
        fw_version: '3.0',
        rules: [
          { field: 'temperature', count: 2, min: 20, max: 40 },
          { field: 'battery', count: 1, equals: 100 },
        ],
      },
      reference: {
        item_code: 'WSLRW-DI',
        fw_version: '3.0',
        rules: [{ field: 'temperature', count: 1 }],
      },
      comparisons: [
        { dut_field: 'temperature', reference_field: 'temperature', tolerance: 2.0 },
      ],
    },
  });

  assert.strictEqual(created.success, true);
  assert.ok(created.data.id);
  assert.ok(created.data.autocheckId.startsWith('AC-'), 'autocheckId must start with AC-');
  assert.strictEqual(created.data.name, 'Profile Cảm biến Nhiệt độ');
  assert.strictEqual(created.data.itemCode, 'WSLRW-DI');
  assert.strictEqual(created.data.fwVersion, '3.0');
  console.log(`✓ Profile created: ID=${created.data.id}, AUTOCHECK_ID=${created.data.autocheckId}`);

  // 3. Lookup by UUID and by AUTOCHECK_ID
  console.log('[TEST 3] Lookup profile by UUID and AC-... code');
  const byUuid = await controller.getAutoCheckProfileById(created.data.id);
  assert.strictEqual(byUuid.data.id, created.data.id);

  const byAcId = await controller.getAutoCheckProfileById(created.data.autocheckId);
  assert.strictEqual(byAcId.data.id, created.data.id);
  assert.strictEqual(byAcId.data.autocheckId, created.data.autocheckId);
  console.log('✓ Successfully retrieved profile by both UUID and AUTOCHECK_ID');

  // 4. Update profile (autocheck_id must not change)
  console.log('[TEST 4] Update profile');
  const updated = await controller.updateAutoCheckProfile(created.data.id, {
    name: 'Profile Cảm biến Nhiệt độ - Updated',
    itemCode: 'WSLRW-DI',
    fwVersion: '3.0',
  });
  assert.strictEqual(updated.data.name, 'Profile Cảm biến Nhiệt độ - Updated');
  assert.strictEqual(updated.data.autocheckId, created.data.autocheckId, 'autocheckId must remain unchanged');
  console.log('✓ Profile updated and immutable autocheckId preserved');

  // 5. List profiles
  console.log('[TEST 5] List profiles with pagination');
  const list = await controller.getAutoCheckProfiles();
  assert.strictEqual(list.success, true);
  assert.strictEqual(list.data.length, 1);
  assert.strictEqual(list.total, 1);
  console.log('✓ Profile list returned correctly');

  // 6. Decoded fields discovery
  console.log('[TEST 6] Decoded fields discovery');
  const fieldsRes = await controller.getAutoCheckFields('WSLRW-DI', '3.0');
  assert.strictEqual(fieldsRes.success, true);
  assert.strictEqual(fieldsRes.data.decoderFound, true);
  assert.ok(Array.isArray(fieldsRes.data.fields));
  assert.ok(fieldsRes.data.fields.some((f) => f.name === 'temperature'));
  assert.ok(fieldsRes.data.fields.some((f) => f.name === 'humidity'));
  assert.ok(fieldsRes.data.fields.some((f) => f.name === 'battery'));
  console.log(`✓ Fields discovered from decoder script: ${fieldsRes.data.fields.map((f) => f.name).join(', ')}`);

  // Non-existent decoder
  const noDecoderRes = await controller.getAutoCheckFields('UNKNOWN_PRODUCT', '9.9');
  assert.strictEqual(noDecoderRes.data.decoderFound, false);
  assert.strictEqual(noDecoderRes.data.fields.length, 0);
  console.log('✓ Gracefully handles non-existent decoder without crashing');

  // 7. Evaluate with DUT rules, Reference rules and Comparisons
  console.log('[TEST 7] Evaluation engine: DUT, Reference and Comparisons');
  const evalResult = await controller.evaluateAutoCheck({
    target: {
      packets: [
        {
          id: 'pkt-dut-1',
          created_at: new Date(),
          decoded_payload: { temperature: 25.0, battery: 100 },
          rf_info: { rssi: -80, snr: 5 },
        },
        {
          id: 'pkt-dut-2',
          created_at: new Date(Date.now() - 1000),
          decoded_payload: { temperature: 26.0, battery: 100 },
          rf_info: { rssi: -82, snr: 4 },
        },
      ],
      referencePackets: [
        {
          id: 'pkt-ref-1',
          created_at: new Date(),
          decoded_payload: { temperature: 25.5 },
          rf_info: { rssi: -75, snr: 8 },
        },
      ],
    },
    criteria: created.data.criteria,
  });

  assert.strictEqual(evalResult.success, true);
  assert.strictEqual(evalResult.data.verdict, 'PASS');
  assert.strictEqual(evalResult.data.failedRules, 0);
  assert.ok(evalResult.data.ruleResults.some((r: any) => r.rule === 'DUT_FIELD_TEMPERATURE' && r.passed));
  assert.ok(evalResult.data.ruleResults.some((r: any) => r.rule === 'DUT_FIELD_BATTERY' && r.passed));
  assert.ok(evalResult.data.ruleResults.some((r: any) => r.rule === 'REFERENCE_FIELD_TEMPERATURE' && r.passed));
  assert.ok(evalResult.data.ruleResults.some((r: any) => r.rule.startsWith('COMPARE_TEMPERATURE') && r.passed));
  console.log(`✓ AutoCheck evaluation passed with verdict PASS (${evalResult.data.passedRules} rules passed)`);

  // 8. Evaluation failure case (tolerance exceeded)
  console.log('[TEST 8] Evaluation failure on tolerance breach');
  const failEvalResult = await controller.evaluateAutoCheck({
    target: {
      packets: [
        {
          id: 'pkt-dut-1',
          decoded_payload: { temperature: 35.0, battery: 100 },
          rf_info: { rssi: -80, snr: 5 },
        },
      ],
      referencePackets: [
        {
          id: 'pkt-ref-1',
          decoded_payload: { temperature: 20.0 }, // diff = 15.0 > tolerance 2.0
          rf_info: { rssi: -75, snr: 8 },
        },
      ],
    },
    criteria: created.data.criteria,
  });

  assert.strictEqual(failEvalResult.data.verdict, 'FAIL');
  assert.ok(failEvalResult.data.failedRules > 0);
  console.log(`✓ Correctly flagged tolerance breach as FAIL`);

  // 9. Delete profile
  console.log('[TEST 9] Delete profile');
  const deleted = await controller.deleteAutoCheckProfile(created.data.id);
  assert.strictEqual(deleted.success, true);
  await assert.rejects(
    controller.getAutoCheckProfileById(created.data.id),
    /Không tìm thấy cấu hình AutoCheck/
  );
  console.log('✓ Profile deleted successfully');

  console.log('\n--- ALL AUTOCHECK PROFILE UPGRADE TESTS PASSED ---');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exitCode = 1;
});
