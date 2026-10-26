import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { DecoderScriptEntity } from '../src/backend/core-models/decoder-script.entity';
import { DecoderAdapterController } from '../src/backend/plugins/decoder.adapter.controller';
import { MemmapProfileEntity } from '../src/backend/core-models/memmap-profile.entity';

async function runTests() {
  console.log('--- Starting DecoderAdapterController & Subsystem Verification ---');

  // 1. Entity Metadata & Database Routing Configuration
  console.log('1. Verifying TypeORM Entity Metadata & DB Routing...');
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(DecoderScriptEntity),
    'DecoderScriptEntity must be registered in ALL_DATABASE_ENTITIES',
  );

  const configPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(configPath), 'db-routing.config.json must exist');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  assert.strictEqual(
    config.table_routes['decoder_scripts'],
    'core_db',
    'decoder_scripts must route to core_db',
  );
  console.log('✓ Entity metadata and table-to-db routing verified.');

  // 2. Controller Instance & Standard Template
  console.log('2. Verifying Decoder Standard Template & Controller initialization...');
  const mockDynamicDb: any = {
    getRepository: (entity: any) => {
      throw new Error('Not implemented in mock test step 2');
    },
  };

  const controller = new DecoderAdapterController(mockDynamicDb);
  const templateResult = controller.getStandardTemplate();
  assert.strictEqual(templateResult.success, true);
  assert.ok(templateResult.template.includes('function decodeUplink(input)'), 'Template must include decodeUplink');
  assert.ok(templateResult.template.includes('function Decode(fPort, bytes)'), 'Template must include Decode');
  assert.strictEqual(templateResult.sampleFport, 1);
  console.log('✓ Standard template verification passed.');

  // 3. Isolated Sandbox Execution Engine Tests
  console.log('3. Verifying Isolated Sandbox Execution Engine...');

  // Test 3a: Standard ChirpStack v4 decodeUplink with hex payload
  const chirpstackScript = `
    function decodeUplink(input) {
      var bytes = input.bytes;
      var fPort = input.fPort;
      var temp = ((bytes[0] << 8) | bytes[1]) / 100.0;
      var hum = ((bytes[2] << 8) | bytes[3]) / 100.0;
      var bat = (bytes[4] << 8) | bytes[5];
      return {
        data: {
          temperature: temp,
          humidity: hum,
          battery_mv: bat
        },
        warnings: [],
        errors: []
      };
    }
  `;

  // 0x0A28 = 2600 (26.0 C), 0x1388 = 5000 (50.0 %), 0x0D1A = 3354 mV
  const testResHex = await controller.testDecoder({
    script: chirpstackScript,
    payload: '0A2813880D1A',
    fPort: 1,
    inputFormat: 'hex',
  });

  assert.strictEqual(testResHex.success, true, 'Test with HEX payload must succeed');
  assert.strictEqual(testResHex.data.temperature, 26);
  assert.strictEqual(testResHex.data.humidity, 50);
  assert.strictEqual(testResHex.data.battery_mv, 3354);
  assert.strictEqual(testResHex.fPort, 1);
  assert.strictEqual(testResHex.bytes.length, 6);
  console.log('✓ Hex payload decode test passed.');

  // Test 3b: Base64 payload input
  const base64Payload = Buffer.from([0x0a, 0x28, 0x13, 0x88, 0x0d, 0x1a]).toString('base64');
  const testResB64 = await controller.testDecoder({
    script: chirpstackScript,
    payload: base64Payload,
    fPort: 2,
    inputFormat: 'base64',
  });
  assert.strictEqual(testResB64.success, true, 'Test with Base64 payload must succeed');
  assert.strictEqual(testResB64.data.temperature, 26);
  assert.strictEqual(testResB64.fPort, 2);
  console.log('✓ Base64 payload decode test passed.');

  // Test 3c: Array of bytes input
  const testResBytes = await controller.testDecoder({
    script: chirpstackScript,
    payload: [10, 40, 19, 136, 13, 26],
    fPort: 1,
  });
  assert.strictEqual(testResBytes.success, true, 'Test with byte array payload must succeed');
  assert.strictEqual(testResBytes.data.temperature, 26);
  console.log('✓ Array of bytes decode test passed.');

  // Test 3d: TTN v3 Decode(fPort, bytes) legacy compatibility
  const ttnV3Script = `
    function Decode(fPort, bytes) {
      return {
        voltage: ((bytes[0] << 8) | bytes[1]) / 1000.0,
        port: fPort
      };
    }
  `;
  const testResTTN = await controller.testDecoder({
    script: ttnV3Script,
    payload: '0C80', // 3200 mV -> 3.2 V
    fPort: 10,
  });
  assert.strictEqual(testResTTN.success, true, 'TTN v3 Decode test must succeed');
  assert.strictEqual(testResTTN.data.voltage, 3.2);
  assert.strictEqual(testResTTN.data.port, 10);
  console.log('✓ TTN v3 legacy decode test passed.');

  // Test 3e: TTN v2 Decoder(bytes, fPort) legacy compatibility
  const ttnV2Script = `
    function Decoder(bytes, fPort) {
      return {
        counter: bytes[0],
        port: fPort
      };
    }
  `;
  const testResTTN2 = await controller.testDecoder({
    script: ttnV2Script,
    payload: '2A', // 42
    fPort: 5,
  });
  assert.strictEqual(testResTTN2.success, true, 'TTN v2 Decoder test must succeed');
  assert.strictEqual(testResTTN2.data.counter, 42);
  assert.strictEqual(testResTTN2.data.port, 5);
  console.log('✓ TTN v2 legacy decode test passed.');

  // Test 3f: Infinite loop / Timeout protection
  console.log('Testing sandbox execution timeout...');
  const infiniteLoopScript = `
    function decodeUplink(input) {
      while (true) {}
      return { data: {} };
    }
  `;
  const testResTimeout = await controller.testDecoder({
    script: infiniteLoopScript,
    payload: '0102',
  });
  assert.strictEqual(testResTimeout.success, false, 'Infinite loop must fail');
  assert.ok(
    testResTimeout.errors[0].toLowerCase().includes('timed out') ||
      testResTimeout.errors[0].toLowerCase().includes('execution error'),
    'Error message must indicate timeout/execution error',
  );
  console.log('✓ Timeout protection verified.');

  // Test 3g: Script syntax error handling
  const syntaxErrScript = `function decodeUplink(input { return {}; }`;
  const testResSyntax = await controller.testDecoder({
    script: syntaxErrScript,
    payload: '0102',
  });
  assert.strictEqual(testResSyntax.success, false, 'Syntax error script must fail');
  assert.ok(testResSyntax.errors.length > 0);
  console.log('✓ Syntax error handling verified.');

  // 4. Mock Repository & CRUD & SKU/LONG_FW Resolution
  console.log('4. Verifying CRUD, Discovery & Product Identification Resolution...');
  const inMemoryDecoders: DecoderScriptEntity[] = [];
  const inMemoryMemmaps: MemmapProfileEntity[] = [
    {
      id: 'memmap-1',
      name: 'Water Meter Profile',
      sku: 'WM-NB-01',
      longFw: 'v2.1.0',
      shortFw: '2.1',
      version: 1,
      description: 'Profile 1',
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    {
      id: 'memmap-2',
      name: 'Gas Meter Profile',
      sku: 'GM-LR-02',
      longFw: 'v1.0.4',
      shortFw: '1.0',
      version: 1,
      description: 'Profile 2',
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
  ];

  const mockDecoderRepo: any = {
    find: async () => [...inMemoryDecoders],
    findOne: async ({ where }: any) => {
      if (where.id) return inMemoryDecoders.find((d) => d.id === where.id) || null;
      return null;
    },
    create: (dto: any) => ({
      id: 'mock-uuid-' + Date.now(),
      created_at: new Date(),
      updated_at: new Date(),
      ...dto,
    }),
    save: async (entity: any) => {
      const idx = inMemoryDecoders.findIndex((d) => d.id === entity.id);
      if (idx >= 0) {
        inMemoryDecoders[idx] = entity;
      } else {
        inMemoryDecoders.push(entity);
      }
      return entity;
    },
    remove: async (entity: any) => {
      const idx = inMemoryDecoders.findIndex((d) => d.id === entity.id);
      if (idx >= 0) {
        inMemoryDecoders.splice(idx, 1);
      }
      return entity;
    },
    createQueryBuilder: () => {
      let filterSku: string | null = null;
      let filterLongFw: string | null = null;
      let excludeId: string | null = null;

      const qb: any = {
        where: (expr: string, params: any) => {
          if (params.sku) filterSku = params.sku.toLowerCase();
          if (params.longFw) filterLongFw = params.longFw.toLowerCase();
          if (params.id) excludeId = params.id;
          return qb;
        },
        andWhere: (expr: string, params: any) => {
          if (params.sku) filterSku = params.sku.toLowerCase();
          if (params.longFw) filterLongFw = params.longFw.toLowerCase();
          if (params.id) excludeId = params.id;
          return qb;
        },
        orderBy: () => qb,
        addOrderBy: () => qb,
        getOne: async () => {
          return (
            inMemoryDecoders.find((d) => {
              if (excludeId && d.id === excludeId) return false;
              if (filterSku && d.sku.toLowerCase() !== filterSku) return false;
              if (filterLongFw && d.long_fw.toLowerCase() !== filterLongFw) return false;
              return true;
            }) || null
          );
        },
        getMany: async () => {
          return inMemoryDecoders.filter((d) => {
            if (filterSku && d.sku.toLowerCase() !== filterSku) return false;
            if (filterLongFw && d.long_fw.toLowerCase() !== filterLongFw) return false;
            return true;
          });
        },
      };
      return qb;
    },
  };

  const mockMemmapRepo: any = {
    find: async () => [...inMemoryMemmaps],
    createQueryBuilder: () => {
      return {
        where: () => ({ orderBy: () => ({ addOrderBy: () => ({ getMany: async () => [...inMemoryMemmaps] }) }) }),
        orderBy: () => ({ addOrderBy: () => ({ getMany: async () => [...inMemoryMemmaps] }) }),
        getMany: async () => [...inMemoryMemmaps],
      };
    },
  };

  const dynamicDb: any = {
    getRepositoryForTable: (table: string, entity: any) => {
      if (entity === DecoderScriptEntity || table === 'decoder_scripts') return mockDecoderRepo;
      if (entity === MemmapProfileEntity || table === 'memmap_profiles') return mockMemmapRepo;
      throw new Error(`Unknown entity/table: ${table} - ${entity.name}`);
    },
  };

  const adapter = new DecoderAdapterController(dynamicDb);

  // 4a. Initial Memmap Status (none configured yet)
  const initialMemmaps = await adapter.getMemmapsWithDecoderStatus();
  assert.strictEqual(initialMemmaps.total, 2);
  assert.strictEqual(initialMemmaps.data[0].isConfigured, false);
  assert.strictEqual(initialMemmaps.data[1].isConfigured, false);
  console.log('✓ Initial memmap status listing passed.');

  // 4b. Create Decoder Script for Water Meter (WM-NB-01 / v2.1.0)
  const created = await adapter.createDecoderScript({
    name: 'Water Meter Decoder v2.1',
    sku: 'WM-NB-01',
    longFw: 'v2.1.0',
    script: chirpstackScript,
    protocol: 'lorawan',
    inputFormat: 'hex',
    samplePayload: '0A2813880D1A',
    sampleFport: 1,
  });

  assert.strictEqual(created.success, true);
  assert.strictEqual(created.data.sku, 'WM-NB-01');
  assert.strictEqual(created.data.long_fw, 'v2.1.0');
  console.log('✓ Decoder script creation passed.');

  // 4c. Verify Memmap Status after creation (WM-NB-01 is now configured)
  const updatedMemmaps = await adapter.getMemmapsWithDecoderStatus();
  const wmItem = updatedMemmaps.data.find((m) => m.sku === 'WM-NB-01');
  assert.ok(wmItem);
  assert.strictEqual(wmItem.isConfigured, true);
  assert.strictEqual(wmItem.decoderName, 'Water Meter Decoder v2.1');
  console.log('✓ Memmap configuration status reflection passed.');

  // 4d. Verify Duplicate SKU + LONG_FW is blocked
  try {
    await adapter.createDecoderScript({
      name: 'Duplicate Water Meter',
      sku: 'WM-NB-01',
      longFw: 'v2.1.0',
      script: 'function decodeUplink() {}',
    });
    assert.fail('Should have thrown BadRequestException on duplicate SKU + LONG_FW');
  } catch (err: any) {
    assert.ok(err.message.includes('already exists'));
    console.log('✓ Duplicate SKU + LONG_FW prevention verified.');
  }

  // 4e. Core Feature: Automatic Decode by SKU and LONG_FW
  console.log('4e. Testing automatic product identification: decodeBySkuAndLongFw...');
  const decodeResult = await adapter.decodeBySkuAndLongFw({
    sku: 'WM-NB-01',
    longFw: 'v2.1.0',
    payload: '0A2813880D1A',
  });

  assert.strictEqual(decodeResult.success, true);
  assert.strictEqual(decodeResult.decoder.sku, 'WM-NB-01');
  assert.strictEqual(decodeResult.decoder.longFw, 'v2.1.0');
  assert.strictEqual(decodeResult.data.temperature, 26);
  assert.strictEqual(decodeResult.data.humidity, 50);
  assert.strictEqual(decodeResult.data.battery_mv, 3354);
  console.log('✓ Automatic product identification & payload decoding verified!');

  // 4f. Test unknown SKU/LONG_FW returns NotFoundException
  try {
    await adapter.decodeBySkuAndLongFw({
      sku: 'UNKNOWN-SKU',
      longFw: 'v9.9.9',
      payload: '0102',
    });
    assert.fail('Should have thrown NotFoundException for unknown SKU');
  } catch (err: any) {
    assert.ok(err.message.includes('No registered decoder script found'));
    console.log('✓ Unregistered product rejection verified.');
  }

  // 4g. Update Script
  const updatedScript = await adapter.updateDecoderScript(created.data.id, {
    description: 'Updated description for field deployment',
    isActive: true,
  });
  assert.strictEqual(updatedScript.success, true);
  assert.strictEqual(updatedScript.data.description, 'Updated description for field deployment');
  console.log('✓ Decoder script update verified.');

  // 4h. Delete Script
  const deleteResult = await adapter.deleteDecoderScript(created.data.id);
  assert.strictEqual(deleteResult.success, true);
  assert.strictEqual(inMemoryDecoders.length, 0);
  console.log('✓ Decoder script deletion verified.');

  console.log('\n======================================================');
  console.log('🎉 ALL 12 DECODER ADAPTER VERIFICATION TESTS PASSED! 🎉');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('❌ Decoder adapter verification failed:', err);
  process.exit(1);
});
