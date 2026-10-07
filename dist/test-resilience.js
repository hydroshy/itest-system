"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const lorawan_resilience_service_1 = require("./modules/lorawan/services/lorawan-resilience.service");
const lorawan_utils_1 = require("./modules/lorawan/common/lorawan-utils");
async function runTests() {
    console.log('=== RUNNING LORAWAN COMMON & RESILIENCE TESTS ===\n');
    console.log('Test 1: LoRaWAN Common Utils');
    assert.strictEqual((0, lorawan_utils_1.cleanDevEUI)('00-11-22-33-44-55-66-77'), '0011223344556677');
    assert.strictEqual((0, lorawan_utils_1.cleanDevEUI)('00:11:22:33:44:55:66:77'), '0011223344556677');
    assert.strictEqual((0, lorawan_utils_1.cleanDevEUI)(' 00 11 22 33 44 55 66 77 '), '0011223344556677');
    assert.strictEqual((0, lorawan_utils_1.cleanFirmwareVersion)('v1.2.3'), '1.2.3');
    assert.strictEqual((0, lorawan_utils_1.cleanFirmwareVersion)('V2.0'), '2.0');
    assert.strictEqual((0, lorawan_utils_1.cleanSku)(' wsl-ambient '), 'WSL-AMBIENT');
    assert.strictEqual((0, lorawan_utils_1.resolveDecoderId)('WSL-01', '1.0'), 'WSL-01_1.0');
    assert.strictEqual((0, lorawan_utils_1.cleanHexPayload)('01 02 A3 ff'), '0102A3FF');
    assert.strictEqual((0, lorawan_utils_1.isValidHex)('0102A3FF'), true);
    assert.strictEqual((0, lorawan_utils_1.isValidHex)('0102A3FZ'), false);
    assert.strictEqual((0, lorawan_utils_1.calculateHexBytes)('0102A3FF'), 4);
    console.log('✔ All LoRaWAN common utils passed!\n');
    console.log('Test 2: Execute with Retry (3 attempts)');
    const resilience = new lorawan_resilience_service_1.LorawanResilienceService();
    let callCount = 0;
    const result = await resilience.executeWithRetry('test-operation', async (attempt) => {
        callCount++;
        if (attempt < 3) {
            throw new Error(`Transient failure attempt ${attempt}`);
        }
        return 'SUCCESS_ON_3RD_TRY';
    }, { maxRetries: 3, retryDelayMs: 50, backoffFactor: 1 });
    assert.strictEqual(callCount, 3);
    assert.strictEqual(result, 'SUCCESS_ON_3RD_TRY');
    console.log('✔ Execute with retry succeeded on 3rd attempt!\n');
    console.log('Test 3: Safe Payload Decoder - Normal Function');
    const normalCode = `
    function decodeUplink(input) {
      return {
        data: {
          temperature: 25.5,
          humidity: 60,
          rawBytes: input.bytes.length
        }
      };
    }
  `;
    const decodeRes = await resilience.safeDecodePayload(normalCode, '010203', 1);
    assert.strictEqual(decodeRes.success, true);
    assert.strictEqual(decodeRes.data.data.temperature, 25.5);
    assert.strictEqual(decodeRes.data.data.humidity, 60);
    assert.strictEqual(decodeRes.data.data.rawBytes, 3);
    console.log('✔ Normal payload decoding executed safely!\n');
    console.log('Test 4: Safe Payload Decoder - Infinite Loop Abort Guard');
    const maliciousCode = `
    function decodeUplink(input) {
      while(true) {}
      return { data: {} };
    }
  `;
    const startLoop = Date.now();
    const loopRes = await resilience.safeDecodePayload(maliciousCode, '0102', 1, {
        timeoutMs: 300,
        maxRetries: 1,
    });
    const loopDuration = Date.now() - startLoop;
    assert.strictEqual(loopRes.success, false);
    assert(loopDuration < 1000, `Execution should abort near timeout: took ${loopDuration}ms`);
    console.log(`✔ Malicious infinite loop intercepted and aborted in ${loopDuration}ms without event loop freeze!\n`);
    console.log('Test 5: Safe Payload Decoder - Syntax Error Handling');
    const syntaxErrCode = `function decodeUplink(input { return {} }`;
    const syntaxRes = await resilience.safeDecodePayload(syntaxErrCode, '01', 1);
    assert.strictEqual(syntaxRes.success, false);
    assert(syntaxRes.error.length > 0);
    console.log('✔ Syntax error caught safely without unhandled exceptions!\n');
    console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===');
}
runTests().catch((err) => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
//# sourceMappingURL=test-resilience.js.map