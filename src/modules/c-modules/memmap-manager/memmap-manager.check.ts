/**
 * Self-contained verification check for Memory Map Manager, LONG_FW/SHORT_FW extraction,
 * and Create Final Config upgrade.
 * Ponytail rule: one minimal assert-based check file without heavy framework dependencies.
 */
import * as assert from 'assert';
import { extractShortFwFromLongFw } from '../memmap-upload/fw-utils';
import { MemmapUploadRepository } from '../memmap-upload/memmap-upload.repository';
import { MemmapUploadService } from '../memmap-upload/memmap-upload.service';
import { MemmapManagerRepository } from './memmap-manager.repository';
import { MemmapManagerService } from './memmap-manager.service';
import { CreateFinalConfigRepository } from '../create-final-config/create-final-config.repository';
import { CreateFinalConfigService } from '../create-final-config/create-final-config.service';

export async function runMemmapManagerAndFwCheck(): Promise<boolean> {
  // -------------------------------------------------------------
  // Test 1: extractShortFwFromLongFw Unit Tests
  // -------------------------------------------------------------
  assert.strictEqual(extractShortFwFromLongFw('3F0825'), 3);
  assert.strictEqual(extractShortFwFromLongFw('6Fmmdd'), 6);
  assert.strictEqual(extractShortFwFromLongFw('12F0101'), 12);
  assert.strictEqual(extractShortFwFromLongFw('3f0825'), 3); // case-insensitive
  assert.strictEqual(extractShortFwFromLongFw('  6F1234  '), 6); // trimming
  assert.strictEqual(extractShortFwFromLongFw('6'), 6); // pure integer fallback
  assert.strictEqual(extractShortFwFromLongFw('10'), 10);
  assert.strictEqual(extractShortFwFromLongFw(''), null);
  assert.strictEqual(extractShortFwFromLongFw(null), null);
  assert.strictEqual(extractShortFwFromLongFw(undefined), null);
  assert.strictEqual(extractShortFwFromLongFw('v3.0.0'), null); // no 'F' and not pure integer
  assert.strictEqual(extractShortFwFromLongFw('INVALID'), null);

  // -------------------------------------------------------------
  // Test 2: Memmap Upload with LONG_FW & SHORT_FW
  // -------------------------------------------------------------
  const uploadRepo = new MemmapUploadRepository();
  const uploadService = new MemmapUploadService(uploadRepo);

  const sampleRegs = [
    {
      no: 1,
      modbus_reg_dec: 0,
      modbus_reg_hex: '0',
      num_regs: 1,
      fn_read: '3',
      fn_write: 'None',
      description: 'DEVICE_TYPE',
      in_rd1_template: false,
      in_engineering_template: false,
      in_end_user_template: false,
      in_full_template: true,
    },
    {
      no: 2,
      modbus_reg_dec: 1,
      modbus_reg_hex: '1',
      num_regs: 4,
      fn_read: '3',
      fn_write: 'None',
      description: 'SERIAL_NUMBER',
      in_rd1_template: false,
      in_engineering_template: false,
      in_end_user_template: false,
      in_full_template: true,
    },
    {
      no: 3,
      modbus_reg_dec: 5,
      modbus_reg_hex: '5',
      num_regs: 4,
      fn_read: '3',
      fn_write: 'None',
      description: 'FW_VERSION',
      end_user_default: '3F0825',
      in_rd1_template: false,
      in_engineering_template: false,
      in_end_user_template: false,
      in_full_template: true,
    },
    {
      no: 4,
      modbus_reg_dec: 303,
      modbus_reg_hex: '12F',
      num_regs: 1,
      fn_read: '3',
      fn_write: '16',
      description: 'TRANSMISSION_INTERVAL',
      range_val: '10-3600',
      end_user_default: '60',
      format: 'uint',
      in_rd1_template: true,
      in_engineering_template: true,
      in_end_user_template: true,
      in_full_template: true,
    },
  ];

  const uploadResult = await uploadService.uploadMemmap({
    sku: 'WSLRW-ATH',
    long_fw: '3F0825',
    short_fw: 3,
    file_name: 'WSLRW-ATH-3F0825.csv',
    registers: sampleRegs,
  });

  assert.strictEqual(uploadResult.success, true);
  assert.strictEqual(uploadResult.data.sku, 'WSLRW-ATH');
  assert.strictEqual(uploadResult.data.shortFw, 3);
  assert.strictEqual(uploadResult.data.longFw, '3F0825');
  assert.strictEqual(uploadResult.data.totalRegs, 4);

  const payloadId = uploadResult.data.payloadId;

  // Retrieve by SKU and short_fw
  const bySku = await uploadService.getBySkuAndShortFw('WSLRW-ATH', 3);
  assert.strictEqual(bySku.success, true);
  assert.strictEqual(bySku.data.sku, 'WSLRW-ATH');
  assert.strictEqual(bySku.data.short_fw, 3);
  assert.strictEqual(bySku.data.long_fw, '3F0825');
  assert.strictEqual(bySku.data.registers.length, 4);

  // -------------------------------------------------------------
  // Test 3: Memmap Manager Service (Listing, Detail & Deletion)
  // -------------------------------------------------------------
  const managerRepo = new MemmapManagerRepository();
  const managerService = new MemmapManagerService(managerRepo);

  // List all
  const listAll = await managerService.findAll();
  assert(listAll.length >= 1, 'Expected at least 1 payload in manager');
  const targetPayload = listAll.find((p) => p.id === payloadId);
  assert(!!targetPayload, 'Uploaded payload must be listed in manager');
  assert.strictEqual(targetPayload.long_fw, '3F0825');

  // Get registers detail by ID
  const detail = await managerService.getRegistersByPayloadId(payloadId);
  assert.strictEqual(detail.payload.id, payloadId);
  assert.strictEqual(detail.registers.length, 4);
  assert.strictEqual(detail.registers[0].description, 'DEVICE_TYPE');
  assert.strictEqual(detail.registers[2].description, 'FW_VERSION');
  assert.strictEqual(detail.registers[2].end_user_default, '3F0825');

  // -------------------------------------------------------------
  // Test 4: Create Final Config with LONG_FW & SHORT_FW
  // -------------------------------------------------------------
  const finalConfigRepo = new CreateFinalConfigRepository();
  const finalConfigService = new CreateFinalConfigService(finalConfigRepo);

  const saveFcResult = await finalConfigService.saveFinalConfig({
    so: 'SO/2026/00001',
    item_code: 'WSLRW-ATH-01',
    sku: 'WSLRW-ATH',
    firmware_version: '3F0825',
    short_fw: 3,
    name: '[Final Config] SO/2026/00001 - WSLRW-ATH-01',
    registers: [
      {
        address: 303,
        modbus_reg_hex: '12F',
        format: 'uint',
        parameter_name: 'TRANSMISSION_INTERVAL',
        value_to_write: '120',
        checked: true,
      },
    ],
  });

  assert.strictEqual(saveFcResult.success, true);
  assert.strictEqual(saveFcResult.data.preset.so, 'SO/2026/00001');
  assert.strictEqual(saveFcResult.data.preset.sku, 'WSLRW-ATH');
  assert.strictEqual(saveFcResult.data.preset.firmware_version, '3F0825');
  assert.strictEqual(saveFcResult.data.preset.short_fw, 3);
  assert.strictEqual(saveFcResult.data.registers.length, 1);
  assert.strictEqual(saveFcResult.data.registers[0].value_to_write, '120');

  // Verify fetch final config
  const fetchedFc = await finalConfigService.getFinalConfig('SO/2026/00001', 'WSLRW-ATH-01');
  assert(!!fetchedFc, 'Saved Final Config must be retrievable');
  assert.strictEqual(fetchedFc.preset.firmware_version, '3F0825');
  assert.strictEqual(fetchedFc.preset.short_fw, 3);

  // -------------------------------------------------------------
  // Test 5: Delete Memory Map via Memmap Manager
  // -------------------------------------------------------------
  const deleteResult = await managerService.deletePayload(payloadId);
  assert.strictEqual(deleteResult.success, true);
  assert.strictEqual(deleteResult.data.id, payloadId);
  assert.strictEqual(deleteResult.data.sku, 'WSLRW-ATH');
  assert.strictEqual(deleteResult.data.longFw, '3F0825');
  assert.strictEqual(deleteResult.data.shortFw, 3);

  // Verify NotFoundException on subsequent fetch
  let notFoundCaught = false;
  try {
    await managerService.getRegistersByPayloadId(payloadId);
  } catch (err: any) {
    notFoundCaught = true;
  }
  assert.strictEqual(notFoundCaught, true, 'Deleted payload registers must throw NotFoundException');

  // Verify NotFoundException on duplicate delete
  let duplicateDeleteCaught = false;
  try {
    await managerService.deletePayload(payloadId);
  } catch (err: any) {
    duplicateDeleteCaught = true;
  }
  assert.strictEqual(duplicateDeleteCaught, true, 'Deleting non-existent payload must throw NotFoundException');

  return true;
}

if (require.main === module) {
  runMemmapManagerAndFwCheck()
    .then(() => {
      console.log('✅ ALL MEMMAP MANAGER, LONG/SHORT FW & FINAL CONFIG CHECKS PASSED');
    })
    .catch((err) => {
      console.error('❌ CHECK FAILED:', err);
      process.exit(1);
    });
}
