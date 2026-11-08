const assert = require('assert');
import { SoTestBatchAdapterController } from '../src/backend/plugins/so-test-batch.adapter.controller';
import { SoTestBatchEntity } from '../src/backend/core-models/so-test-batch.entity';

async function runTests() {
  console.log('--- Starting SO Test Batch Integration Unit Tests ---');

  // Mock DynamicDatabaseService
  const mockDbData = {
    sos: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        so_number: 'SO/2026/01855',
        customer_name: 'Khách Hàng A',
        customer_email: 'a@example.com',
        partner_email: 'partner@example.com',
        notes: 'Test order',
        created_at: new Date('2026-11-01T10:00:00Z'),
        updated_at: new Date('2026-11-01T10:00:00Z'),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        so_number: 'SO/2026/01856',
        customer_name: 'Khách Hàng B',
        customer_email: 'b@example.com',
        partner_email: 'partner_b@example.com',
        notes: null,
        created_at: new Date('2026-11-02T10:00:00Z'),
        updated_at: new Date('2026-11-02T10:00:00Z'),
      },
    ],
    batches: [
      {
        id: 'bbbbbbbb-1111-1111-1111-111111111111',
        batch_code: 'TB-20261108-001',
        batch_name: 'Batch Test Meter 01',
        item_code: 'EM-100',
        long_fw: 'EM100_v1.2.3',
        fw_version: 'v1.2.3',
        status: 'READY',
        verdict: 'PENDING',
        duration_seconds: 120,
        created_at: new Date('2026-11-08T12:00:00Z'),
        device_count: 5,
      },
      {
        id: 'bbbbbbbb-2222-2222-2222-222222222222',
        batch_code: 'TB-20261108-002',
        batch_name: 'Batch Test Sensor 02',
        item_code: 'SN-200',
        long_fw: 'SN200_v2.0.0',
        fw_version: 'v2.0.0',
        status: 'COMPLETED',
        verdict: 'PASS',
        duration_seconds: 300,
        created_at: new Date('2026-11-08T14:00:00Z'),
        device_count: 10,
      },
    ],
    links: [] as any[],
  };

  const mockDataSource = {
    query: async (sql: string, params: any[] = []) => {
      // 1. View v_so_with_test_batches
      if (sql.includes('v_so_with_test_batches')) {
        return mockDbData.sos.map((s) => {
          const linked = mockDbData.links
            .filter((l) => l.so_id === s.id)
            .map((l) => {
              const b = mockDbData.batches.find((b) => b.id === l.batch_id);
              return {
                linkId: l.id,
                batchId: l.batch_id,
                batchCode: l.batch_code,
                batchName: b?.batch_name || '',
                itemCode: b?.item_code || '',
                fwVersion: b?.fw_version || '',
                status: b?.status || 'READY',
                verdict: b?.verdict || 'PENDING',
                deviceCount: b?.device_count || 0,
                linkedAt: l.created_at,
              };
            });
          return {
            id: s.id,
            soNumber: s.so_number,
            customerName: s.customer_name,
            customerEmail: s.customer_email,
            partnerEmail: s.partner_email,
            notes: s.notes,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            testBatches: linked,
            testBatchCount: linked.length,
          };
        });
      }

      // 2. View v_available_test_batches
      if (sql.includes('v_available_test_batches')) {
        return mockDbData.batches.map((b) => ({
          id: b.id,
          batchCode: b.batch_code,
          batchName: b.batch_name,
          itemCode: b.item_code,
          longFw: b.long_fw,
          fwVersion: b.fw_version,
          status: b.status,
          verdict: b.verdict,
          durationSeconds: b.duration_seconds,
          createdAt: b.created_at,
          deviceCount: b.device_count,
        }));
      }

      // 3. Resolve SO
      if (sql.includes('FROM traceability_manager.traceability_so WHERE so_number = $1')) {
        const found = mockDbData.sos.filter((s) => s.so_number === params[0]);
        return found;
      }
      if (sql.includes('FROM traceability_manager.traceability_so WHERE id = $1')) {
        const found = mockDbData.sos.filter((s) => s.id === params[0]);
        return found;
      }

      // 4. Resolve Batch
      if (sql.includes('FROM system_schema.device_test_batches WHERE batch_code = $1')) {
        const found = mockDbData.batches.filter((b) => b.batch_code === params[0]);
        return found;
      }
      if (sql.includes('FROM system_schema.device_test_batches WHERE id = $1')) {
        const found = mockDbData.batches.filter((b) => b.id === params[0]);
        return found;
      }

      // 5. Existing check
      if (sql.includes('SELECT id FROM system_schema.so_test_batches WHERE so_id = $1 AND batch_id = $2')) {
        return mockDbData.links.filter((l) => l.so_id === params[0] && l.batch_id === params[1]);
      }

      // 6. Insert link
      if (sql.includes('INSERT INTO system_schema.so_test_batches')) {
        const newLink = {
          id: 'link-' + Math.random().toString(36).substring(2, 9),
          so_id: params[0],
          so_number: params[1],
          batch_id: params[2],
          batch_code: params[3],
          notes: params[4],
          created_by: params[5],
          created_at: new Date(),
        };
        mockDbData.links.push(newLink);
        return [newLink];
      }

      // 7. Delete link
      if (sql.includes('DELETE FROM system_schema.so_test_batches')) {
        let deleted: any[] = [];
        if (sql.includes('WHERE id = $1')) {
          const idx = mockDbData.links.findIndex((l) => l.id === params[0]);
          if (idx !== -1) {
            deleted = mockDbData.links.splice(idx, 1);
          }
        } else if (sql.includes('so_id = $1 AND batch_id = $2')) {
          const idx = mockDbData.links.findIndex((l) => l.so_id === params[0] && l.batch_id === params[1]);
          if (idx !== -1) {
            deleted = mockDbData.links.splice(idx, 1);
          }
        } else if (sql.includes('so_number = $1 AND batch_id = $2')) {
          const idx = mockDbData.links.findIndex((l) => (l.so_number === params[0] || l.soNumber === params[0]) && (l.batch_id === params[1] || l.batchId === params[1]));
          if (idx !== -1) {
            deleted = mockDbData.links.splice(idx, 1);
          }
        }
        return deleted;
      }

      return [];
    },
  };

  const mockDbService: any = {
    getDataSourceForTable: () => mockDataSource,
    getRepositoryForTable: () => null,
  };

  const controller = new SoTestBatchAdapterController(mockDbService);

  // Test 1: getSos
  const sosResult = await controller.getSos();
  assert.strictEqual(sosResult.success, true);
  assert.strictEqual(sosResult.data.length, 2);
  assert.strictEqual(sosResult.data[0].testBatchCount, 0);
  console.log('✔ Test 1: getSos returned 2 SOs correctly.');

  // Test 2: getAvailableBatches
  const batchesResult = await controller.getAvailableBatches();
  assert.strictEqual(batchesResult.success, true);
  assert.strictEqual(batchesResult.data.length, 2);
  assert.strictEqual(batchesResult.data[0].batchCode, 'TB-20261108-001');
  console.log('✔ Test 2: getAvailableBatches returned 2 available batches.');

  // Test 3: linkBatch
  const linkRes = await controller.linkBatch({
    soNumber: 'SO/2026/01855',
    batchCode: 'TB-20261108-001',
    notes: 'Liên kết thử nghiệm',
  });
  assert.strictEqual(linkRes.success, true);
  assert.strictEqual(linkRes.data.batch_code, 'TB-20261108-001');
  assert.strictEqual(mockDbData.links.length, 1);
  console.log('✔ Test 3: linkBatch successfully linked batch to SO.');

  // Test 4: verify getSos after link
  const sosAfterLink = await controller.getSos();
  assert.strictEqual(sosAfterLink.data[0].testBatchCount, 1);
  assert.strictEqual(sosAfterLink.data[0].testBatches[0].batchCode, 'TB-20261108-001');
  console.log('✔ Test 4: getSos reflected linked batch in aggregated array.');

  // Test 5: unlinkBatch
  const unlinkRes = await controller.unlinkBatch({
    soNumber: 'SO/2026/01855',
    batchId: 'bbbbbbbb-1111-1111-1111-111111111111',
  });
  assert.strictEqual(unlinkRes.success, true);
  assert.strictEqual(mockDbData.links.length, 0);
  console.log('✔ Test 5: unlinkBatch successfully unlinked batch from SO.');

  console.log('--- ALL 5 INTEGRATION UNIT TESTS PASSED ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
