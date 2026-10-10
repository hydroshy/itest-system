import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  probeDeviceReadyAndVerified,
  ProbeTimingOptions,
} from '../src/views/dashboard-modules/final-config-device.module';

/**
 * Mock MCU Flash Write Simulator with configurable Flash program/erase latency,
 * CPU bus stall, and UART interrupt masking behavior.
 */
class MockMcuFlashDevice {
  public flashBusyUntil = 0;
  public registers: Map<number, number[]> = new Map();
  public safeAnchorCode = [0x12, 0x34]; // Reg 0x0000 Firmware Code (2 bytes)
  public rxDropCount = 0;
  public totalProbeCount = 0;

  constructor() {
    this.registers.set(0, [...this.safeAnchorCode]);
  }

  setFlashBusy(durationMs: number) {
    this.flashBusyUntil = Date.now() + durationMs;
  }

  isBusy(): boolean {
    return Date.now() < this.flashBusyUntil;
  }

  writeRegisters(reg: number, data: number[]) {
    this.registers.set(reg, [...data]);
  }

  async handleModbusRead(
    slave: number,
    fc: number,
    reg: number,
    numreg: number,
    timeoutMs: number,
  ): Promise<number[]> {
    this.totalProbeCount++;
    if (this.isBusy()) {
      this.rxDropCount++;
      // Simulate hardware UART interrupt disabled: packet dropped / no response (timeout)
      await new Promise((r) => setTimeout(r, Math.min(timeoutMs, 60)));
      throw new Error(`Modbus timeout: MCU busy with Flash write/erase (UART IRQ masked)`);
    }

    // MCU is ready
    if (reg === 0) {
      return [...this.safeAnchorCode];
    }
    const val = this.registers.get(reg);
    if (!val) {
      // Uninitialized register returns zeros
      return new Array(numreg * 2).fill(0);
    }
    return [...val];
  }
}

async function runHandshakeTestSuite() {
  console.log('======================================================================');
  console.log('🧪 TEST SUITE: CLOSED-LOOP WRITE-VERIFICATION HANDSHAKE & PROBE ENGINE');
  console.log('======================================================================\n');

  let passedTests = 0;

  // --------------------------------------------------------------------
  // TEST 1: Fast Flash Commit Verification (30ms latency)
  // --------------------------------------------------------------------
  console.log('[TEST 1] Fast Flash Commit Verification (Fast MCU path)...');
  {
    const mcu = new MockMcuFlashDevice();
    const testReg = 303;
    const testData = [0x00, 0x05]; // 1 register = 2 bytes
    mcu.writeRegisters(testReg, testData);
    mcu.setFlashBusy(30); // 30ms fast commit

    const t0 = Date.now();
    const result = await probeDeviceReadyAndVerified(
      1,
      testReg,
      1,
      testData,
      false, // Read-Write register
      {
        enableProbe: true,
        guardSilenceMs: 15,
        probeIntervalMs: 25,
        maxProbeTimeoutMs: 1500,
        readModbusFn: (slave, fc, reg, numreg, timeout) =>
          mcu.handleModbusRead(slave, fc, reg, numreg, timeout),
      },
    );
    const totalElapsed = Date.now() - t0;

    assert.strictEqual(result.success, true, 'Probe must succeed');
    assert.ok(result.attempts >= 1, `Probe attempts should be >= 1 (got ${result.attempts})`);
    assert.ok(
      totalElapsed < 250,
      `Fast probe must complete well under 250ms (got ${totalElapsed}ms), saving massive time over 600ms blind delay`,
    );
    console.log(
      `  -> PASS: Verified Reg ${testReg} in ${result.elapsedMs}ms (${result.attempts} probes). Elapsed: ${totalElapsed}ms (vs 600ms blind delay: ~${Math.round(600 / totalElapsed)}x faster).\n`,
    );
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 2: Slow / Heavy Flash Write Adaptation (400ms latency)
  // --------------------------------------------------------------------
  console.log('[TEST 2] Slow / Heavy Flash Write Adaptation (Dynamic backoff under 400ms Flash stall)...');
  {
    const mcu = new MockMcuFlashDevice();
    const testReg = 304;
    const testData = [0x01, 0x2C]; // 300 dec
    mcu.writeRegisters(testReg, testData);
    mcu.setFlashBusy(400); // 400ms heavy Flash erase / sector write

    const t0 = Date.now();
    const result = await probeDeviceReadyAndVerified(
      1,
      testReg,
      1,
      testData,
      false,
      {
        enableProbe: true,
        guardSilenceMs: 20,
        probeIntervalMs: 50,
        maxProbeTimeoutMs: 1500,
        readModbusFn: (slave, fc, reg, numreg, timeout) =>
          mcu.handleModbusRead(slave, fc, reg, numreg, timeout),
      },
    );
    const totalElapsed = Date.now() - t0;

    assert.strictEqual(result.success, true, 'Probe must succeed once MCU Flash write completes');
    assert.ok(result.attempts >= 3, `Probe should retry multiple times while MCU busy (attempts: ${result.attempts})`);
    assert.ok(mcu.rxDropCount >= 2, `MCU should have dropped initial probes during bus stall (drops: ${mcu.rxDropCount})`);
    assert.ok(totalElapsed >= 380, `Must wait for MCU Flash commit window (got ${totalElapsed}ms)`);
    assert.ok(totalElapsed < 900, `Must succeed without exceeding timeout threshold (got ${totalElapsed}ms)`);
    console.log(
      `  -> PASS: Handshake adapted smoothly to 400ms Flash latency in ${result.elapsedMs}ms (${result.attempts} attempts, ${mcu.rxDropCount} initial busy drops).\n`,
    );
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 3: Write-Only Register Handshake (Reg 274 LoRaWAN AppKey)
  // --------------------------------------------------------------------
  console.log('[TEST 3] Write-Only Register Handshake (Reg 274 LoRaWAN AppKey via Safe Anchor 0x0000)...');
  {
    const mcu = new MockMcuFlashDevice();
    const appKeyBytes = [
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
    ];
    mcu.setFlashBusy(100); // 100ms NVS wear leveling write for AppKey

    let probedReg = -1;
    const result = await probeDeviceReadyAndVerified(
      1,
      274, // AppKey
      8,
      appKeyBytes,
      true, // isWriteOnly = true
      {
        enableProbe: true,
        guardSilenceMs: 20,
        probeIntervalMs: 30,
        maxProbeTimeoutMs: 1500,
        safeProbeRegister: 0, // Safe Anchor Reg 0x0000 Firmware Code
        readModbusFn: (slave, fc, reg, numreg, timeout) => {
          probedReg = reg;
          return mcu.handleModbusRead(slave, fc, reg, numreg, timeout);
        },
      },
    );

    assert.strictEqual(result.success, true, 'Write-only probe must succeed');
    assert.strictEqual(probedReg, 0, 'Must query Safe Anchor Reg 0x0000 Firmware Code instead of write-only Reg 274');
    console.log(
      `  -> PASS: Write-Only Reg 274 verified via Safe Anchor Reg 0x0000 (Firmware Code) in ${result.elapsedMs}ms (${result.attempts} probes).\n`,
    );
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 4: Data Mismatch Detection on Read-Write Registers
  // --------------------------------------------------------------------
  console.log('[TEST 4] Data Mismatch Detection on Read-Write Registers (Flash cell wear / corruption)...');
  {
    const mcu = new MockMcuFlashDevice();
    const testReg = 305;
    const writtenData = [0x00, 0x64]; // 100 dec
    const corruptedData = [0x00, 0x00]; // Flash failed to hold bits, read returns 0
    mcu.writeRegisters(testReg, corruptedData);

    let errorThrown: any = null;
    try {
      await probeDeviceReadyAndVerified(
        1,
        testReg,
        1,
        writtenData,
        false,
        {
          enableProbe: true,
          guardSilenceMs: 10,
          probeIntervalMs: 25,
          maxProbeTimeoutMs: 200,
          readModbusFn: (slave, fc, reg, numreg, timeout) =>
            mcu.handleModbusRead(slave, fc, reg, numreg, timeout),
        },
      );
    } catch (err) {
      errorThrown = err;
    }

    assert.ok(errorThrown, 'Must throw error when read-back data does not match written data');
    assert.ok(
      String(errorThrown.message).includes('data mismatch'),
      `Error message should report data mismatch, got: ${errorThrown.message}`,
    );
    console.log(`  -> PASS: Data mismatch detected and trapped correctly: "${errorThrown.message}".\n`);
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 5: Unresponsive MCU Timeout Gate
  // --------------------------------------------------------------------
  console.log('[TEST 5] Unresponsive MCU Timeout Gate (MCU HardFault / Infinite bus hang)...');
  {
    const mcu = new MockMcuFlashDevice();
    const testReg = 306;
    mcu.setFlashBusy(999999); // Hung forever

    let errorThrown: any = null;
    const t0 = Date.now();
    try {
      await probeDeviceReadyAndVerified(
        1,
        testReg,
        1,
        [0x00, 0x01],
        false,
        {
          enableProbe: true,
          guardSilenceMs: 10,
          probeIntervalMs: 30,
          maxProbeTimeoutMs: 250, // 250ms max timeout gate
          readModbusFn: (slave, fc, reg, numreg, timeout) =>
            mcu.handleModbusRead(slave, fc, reg, numreg, timeout),
        },
      );
    } catch (err) {
      errorThrown = err;
    }
    const elapsed = Date.now() - t0;

    assert.ok(errorThrown, 'Must throw timeout error when MCU never responds');
    assert.ok(
      String(errorThrown.message).includes('Device busy / probe timeout'),
      `Error message must indicate probe timeout, got: ${errorThrown.message}`,
    );
    assert.ok(elapsed >= 240, `Must respect maxProbeTimeoutMs threshold (elapsed: ${elapsed}ms)`);
    console.log(`  -> PASS: Timeout gated cleanly at ${elapsed}ms: "${errorThrown.message}".\n`);
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 6: Backward Compatibility (enableProbe = false fallback to 600ms)
  // --------------------------------------------------------------------
  console.log('[TEST 6] Backward Compatibility: enableProbe = false fallback...');
  {
    let probeCalled = false;
    const t0 = Date.now();
    const res = await probeDeviceReadyAndVerified(
      1,
      303,
      1,
      [0x00, 0x01],
      false,
      {
        enableProbe: false,
        readModbusFn: async () => {
          probeCalled = true;
          return [0x00, 0x01];
        },
      },
    );
    const elapsed = Date.now() - t0;

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.elapsedMs, 600);
    assert.strictEqual(probeCalled, false, 'No probe calls should be made when probe disabled');
    assert.ok(elapsed >= 590, `Should sleep 600ms settling delay (got ${elapsed}ms)`);
    console.log(`  -> PASS: Backward compatibility fallback verified (waited ${elapsed}ms without probe polling).\n`);
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 7: 1:1 Code Synchronization between src/views and src/frontend
  // --------------------------------------------------------------------
  console.log('[TEST 7] Verifying 1:1 Code Synchronization between src/views and src/frontend...');
  const viewsModulePath = path.resolve(__dirname, '../src/views/dashboard-modules/final-config-device.module.ts');
  const frontModulePath = path.resolve(__dirname, '../src/frontend/modules/dashboard/final-config-device.module.ts');

  assert.ok(fs.existsSync(viewsModulePath), 'views final-config-device.module.ts must exist');
  assert.ok(fs.existsSync(frontModulePath), 'frontend final-config-device.module.ts must exist');

  const viewsContent = fs.readFileSync(viewsModulePath, 'utf8');
  const frontContent = fs.readFileSync(frontModulePath, 'utf8');

  assert.strictEqual(
    viewsContent,
    frontContent,
    'final-config-device.module.ts in src/views and src/frontend must be 100% identical',
  );
  console.log('  -> PASS: 1:1 code synchronization confirmed.\n');
  passedTests++;

  console.log('======================================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${passedTests} CHECKS SUCCESSFUL`);
  console.log('======================================================================\n');
}

runHandshakeTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
