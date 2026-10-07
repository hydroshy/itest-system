"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMemmapEngineCheck = runMemmapEngineCheck;
const assert = require("assert");
const memmap_upload_service_1 = require("./memmap-upload.service");
const memmap_upload_repository_1 = require("./memmap-upload.repository");
const sandbox_assertion_service_1 = require("../../d-modules/test-automation/sandbox-assertion.service");
async function runMemmapEngineCheck() {
    const repo = new memmap_upload_repository_1.MemmapUploadRepository();
    const memmapService = new memmap_upload_service_1.MemmapUploadService(repo);
    const sandboxService = new sandbox_assertion_service_1.SandboxAssertionService();
    const validRegs = [
        { no: 1, modbus_reg_dec: 0, modbus_reg_hex: '0', num_regs: 5, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 2, modbus_reg_dec: 5, modbus_reg_hex: '5', num_regs: 4, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 3, modbus_reg_dec: 9, modbus_reg_hex: '9', num_regs: 2, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 4, modbus_reg_dec: 11, modbus_reg_hex: 'B', num_regs: 4, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 5, modbus_reg_dec: 15, modbus_reg_hex: 'F', num_regs: 12, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 6, modbus_reg_dec: 27, modbus_reg_hex: '1B', num_regs: 4, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
    ];
    const validCheck = memmapService.validateContinuity(validRegs);
    assert.strictEqual(validCheck.decValid, true, 'Valid Dec continuity check failed');
    assert.strictEqual(validCheck.hexValid, true, 'Valid Hex continuity check failed');
    assert.strictEqual(validCheck.decErrors.length, 0);
    assert.strictEqual(validCheck.hexErrors.length, 0);
    const brokenDecRegs = [
        { no: 1, modbus_reg_dec: 0, modbus_reg_hex: '0', num_regs: 5, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 2, modbus_reg_dec: 5, modbus_reg_hex: '5', num_regs: 4, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 3, modbus_reg_dec: 10, modbus_reg_hex: '9', num_regs: 2, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
    ];
    const brokenDecCheck = memmapService.validateContinuity(brokenDecRegs);
    assert.strictEqual(brokenDecCheck.decValid, false, 'Expected Dec mismatch to fail');
    assert.strictEqual(brokenDecCheck.hexValid, true, 'Hex should remain valid');
    assert.strictEqual(brokenDecCheck.decErrors.length, 1);
    const brokenHexRegs = [
        { no: 1, modbus_reg_dec: 0, modbus_reg_hex: '0', num_regs: 5, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 2, modbus_reg_dec: 5, modbus_reg_hex: '5', num_regs: 4, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 3, modbus_reg_dec: 9, modbus_reg_hex: '9', num_regs: 2, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
        { no: 4, modbus_reg_dec: 11, modbus_reg_hex: 'C', num_regs: 4, in_rd1_template: false, in_engineering_template: false, in_end_user_template: false, in_full_template: true },
    ];
    const brokenHexCheck = memmapService.validateContinuity(brokenHexRegs);
    assert.strictEqual(brokenHexCheck.decValid, true, 'Dec should remain valid');
    assert.strictEqual(brokenHexCheck.hexValid, false, 'Expected Hex mismatch to fail');
    assert.strictEqual(brokenHexCheck.hexErrors.length, 1);
    await assert.rejects(async () => {
        await memmapService.uploadMemmap({
            sku: 'WSLRW-ATH',
            short_fw: 'v6',
            registers: validRegs,
        });
    }, /Short FW Version chỉ được chứa ký số nguyên/);
    await assert.rejects(async () => {
        await memmapService.uploadMemmap({
            sku: 'WSLRW-ATH',
            short_fw: 6.5,
            registers: validRegs,
        });
    }, /Short FW Version chỉ được chứa ký số nguyên/);
    const saveResult = await memmapService.uploadMemmap({
        sku: 'WSLRW-ATH',
        short_fw: 6,
        file_name: 'WSLRW-ATH-6.csv',
        registers: validRegs,
    });
    assert.strictEqual(saveResult.success, true);
    assert.strictEqual(saveResult.data.sku, 'WSLRW-ATH');
    assert.strictEqual(saveResult.data.shortFw, 6);
    assert.strictEqual(saveResult.data.decValid, true);
    assert.strictEqual(saveResult.data.hexValid, true);
    const fetched = await memmapService.getBySkuAndShortFw('WSLRW-ATH', 6);
    assert.strictEqual(fetched.success, true);
    assert.strictEqual(fetched.data.registers.length, validRegs.length);
    const ruleResult = sandboxService.evaluateSingleAssertion({ fieldName: 'temperature', operator: 'IN_RANGE', expectedValue: [15, 35], severity: 'ERROR' }, 24.5);
    assert.strictEqual(ruleResult.pass, true);
    const script = `
    function evaluate(packet, context) {
      return {
        pass: packet.decoded.battery >= 2.5 && packet.fPort === 1,
        message: 'Battery and fPort verified in VM sandbox'
      };
    }
  `;
    const vmResult = sandboxService.executeSandboxScript(script, { fPort: 1, payloadHex: '0102', decoded: { battery: 3.6 } }, { sku: 'WSLRW-ATH', shortFw: 6 });
    assert.strictEqual(vmResult.pass, true);
    return true;
}
if (require.main === module) {
    runMemmapEngineCheck()
        .then(() => {
        console.log('✅ ALL MEMMAP ENGINE & SANDBOX ASSERTION CHECKS PASSED');
    })
        .catch((err) => {
        console.error('❌ CHECK FAILED:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=memmap-engine.check.js.map