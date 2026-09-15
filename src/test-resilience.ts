import * as assert from 'assert';
import { LorawanResilienceService } from './modules/lorawan/services/lorawan-resilience.service';
import {
  cleanDevEUI,
  cleanFirmwareVersion,
  cleanSku,
  resolveDecoderId,
  cleanHexPayload,
  isValidHex,
  calculateHexBytes,
} from './modules/lorawan/common/lorawan-utils';

async function runTests() {
  console.log('=== RUNNING LORAWAN COMMON & RESILIENCE TESTS ===\n');

  // Test 1: Utils
  console.log('Test 1: LoRaWAN Common Utils');
  assert.strictEqual(cleanDevEUI('00-11-22-33-44-55-66-77'), '0011223344556677');
  assert.strictEqual(cleanDevEUI('00:11:22:33:44:55:66:77'), '0011223344556677');
  assert.strictEqual(cleanDevEUI(' 00 11 22 33 44 55 66 77 '), '0011223344556677');
  assert.strictEqual(cleanFirmwareVersion('v1.2.3'), '1.2.3');
  assert.strictEqual(cleanFirmwareVersion('V2.0'), '2.0');
  assert.strictEqual(cleanSku(' wsl-ambient '), 'WSL-AMBIENT');
  assert.strictEqual(resolveDecoderId('WSL-01', '1.0'), 'WSL-01_1.0');
  assert.strictEqual(cleanHexPayload('01 02 A3 ff'), '0102A3FF');
  assert.strictEqual(isValidHex('0102A3FF'), true);
  assert.strictEqual(isValidHex('0102A3FZ'), false);
  assert.strictEqual(calculateHexBytes('0102A3FF'), 4);
  console.log('✔ All LoRaWAN common utils passed!\n');

  // Test 2: Resilience Service - Retry Logic
  console.log('Test 2: Execute with Retry (3 attempts)');
  const resilience = new LorawanResilienceService();
  let callCount = 0;
  const result = await resilience.executeWithRetry(
    'test-operation',
    async (attempt) => {
      callCount++;
      if (attempt < 3) {
        throw new Error(`Transient failure attempt ${attempt}`);
      }
      return 'SUCCESS_ON_3RD_TRY';
    },
    { maxRetries: 3, retryDelayMs: 50, backoffFactor: 1 },
  );
  assert.strictEqual(callCount, 3);
  assert.strictEqual(result, 'SUCCESS_ON_3RD_TRY');
  console.log('✔ Execute with retry succeeded on 3rd attempt!\n');

  // Test 3: Safe Payload Decoder - Normal Function
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

  // Test 4: Safe Payload Decoder - Infinite Loop Timeout Guard
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

  // Test 5: Safe Payload Decoder - Syntax Error
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
