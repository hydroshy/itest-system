"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMemmapManagerAndFwCheck = runMemmapManagerAndFwCheck;
const assert = require("assert");
const fw_utils_1 = require("../memmap-upload/fw-utils");
const memmap_upload_repository_1 = require("../memmap-upload/memmap-upload.repository");
const memmap_upload_service_1 = require("../memmap-upload/memmap-upload.service");
const memmap_manager_repository_1 = require("./memmap-manager.repository");
const memmap_manager_service_1 = require("./memmap-manager.service");
const create_final_config_repository_1 = require("../create-final-config/create-final-config.repository");
const create_final_config_service_1 = require("../create-final-config/create-final-config.service");
async function runMemmapManagerAndFwCheck() {
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)('3F0825'), 3);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)('6Fmmdd'), 6);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)('12F0101'), 12);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)('3f0825'), 3);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)('  6F1234  '), 6);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)('6'), 6);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)('10'), 10);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)(''), null);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)(null), null);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)(undefined), null);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)('v3.0.0'), null);
    assert.strictEqual((0, fw_utils_1.extractShortFwFromLongFw)('INVALID'), null);
    const uploadRepo = new memmap_upload_repository_1.MemmapUploadRepository();
    const uploadService = new memmap_upload_service_1.MemmapUploadService(uploadRepo);
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
    const bySku = await uploadService.getBySkuAndShortFw('WSLRW-ATH', 3);
    assert.strictEqual(bySku.success, true);
    assert.strictEqual(bySku.data.sku, 'WSLRW-ATH');
    assert.strictEqual(bySku.data.short_fw, 3);
    assert.strictEqual(bySku.data.long_fw, '3F0825');
    assert.strictEqual(bySku.data.registers.length, 4);
    const managerRepo = new memmap_manager_repository_1.MemmapManagerRepository();
    const managerService = new memmap_manager_service_1.MemmapManagerService(managerRepo);
    const listAll = await managerService.findAll();
    assert(listAll.length >= 1, 'Expected at least 1 payload in manager');
    const targetPayload = listAll.find((p) => p.id === payloadId);
    assert(!!targetPayload, 'Uploaded payload must be listed in manager');
    assert.strictEqual(targetPayload.long_fw, '3F0825');
    const detail = await managerService.getRegistersByPayloadId(payloadId);
    assert.strictEqual(detail.payload.id, payloadId);
    assert.strictEqual(detail.registers.length, 4);
    assert.strictEqual(detail.registers[0].description, 'DEVICE_TYPE');
    assert.strictEqual(detail.registers[2].description, 'FW_VERSION');
    assert.strictEqual(detail.registers[2].end_user_default, '3F0825');
    const finalConfigRepo = new create_final_config_repository_1.CreateFinalConfigRepository();
    const finalConfigService = new create_final_config_service_1.CreateFinalConfigService(finalConfigRepo);
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
    const fetchedFc = await finalConfigService.getFinalConfig('SO/2026/00001', 'WSLRW-ATH-01');
    assert(!!fetchedFc, 'Saved Final Config must be retrievable');
    assert.strictEqual(fetchedFc.preset.firmware_version, '3F0825');
    assert.strictEqual(fetchedFc.preset.short_fw, 3);
    const deleteResult = await managerService.deletePayload(payloadId);
    assert.strictEqual(deleteResult.success, true);
    assert.strictEqual(deleteResult.data.id, payloadId);
    assert.strictEqual(deleteResult.data.sku, 'WSLRW-ATH');
    assert.strictEqual(deleteResult.data.longFw, '3F0825');
    assert.strictEqual(deleteResult.data.shortFw, 3);
    let notFoundCaught = false;
    try {
        await managerService.getRegistersByPayloadId(payloadId);
    }
    catch (err) {
        notFoundCaught = true;
    }
    assert.strictEqual(notFoundCaught, true, 'Deleted payload registers must throw NotFoundException');
    let duplicateDeleteCaught = false;
    try {
        await managerService.deletePayload(payloadId);
    }
    catch (err) {
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
//# sourceMappingURL=memmap-manager.check.js.map