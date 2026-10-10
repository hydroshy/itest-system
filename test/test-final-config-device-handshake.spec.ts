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
  public uartStallFlushes = 0;
  public garbageFrameCount = 0;
  public remainingGarbageResponses = 0;

  constructor() {
    this.registers.set(0, [...this.safeAnchorCode]);
  }

  setFlashBusy(durationMs: number) {
    this.flashBusyUntil = Date.now() + durationMs;
  }

  setGarbageResponses(count: number) {
    this.remainingGarbageResponses = count;
  }

  isBusy(): boolean {
    return Date.now() < this.flashBusyUntil;
  }

  writeRegisters(reg: number, data: number[]) {
    this.registers.set(reg, [...data]);
  }

  async flushRxBuffer(timeoutMs = 50): Promise<void> {
    this.uartStallFlushes++;
    // Draining RX clears hardware FIFO overrun and corrupt frames
    if (this.remainingGarbageResponses > 0) {
      this.remainingGarbageResponses = 0;
    }
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

    if (this.remainingGarbageResponses > 0) {
      this.remainingGarbageResponses--;
      this.garbageFrameCount++;
      // Return corrupted/truncated frame simulating UART Overrun Error (ORE) garbage
      return [0xFF, 0xDE, 0xAD];
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
  // TEST 2: Normal Register Flash Write > 4s (4200ms latency)
  // --------------------------------------------------------------------
  console.log('[TEST 2] Normal Register Flash Write > 4s (4200ms latency with 6000ms timeout)...');
  {
    const mcu = new MockMcuFlashDevice();
    const testReg = 304;
    const testData = [0x01, 0x2C]; // 300 dec
    mcu.writeRegisters(testReg, testData);
    mcu.setFlashBusy(4200); // 4200ms heavy Flash write (> 4s threshold)

    const t0 = Date.now();
    const result = await probeDeviceReadyAndVerified(
      1,
      testReg,
      1,
      testData,
      false,
      {
        enableProbe: true,
        enableAdaptiveProbe: true,
        guardSilenceMs: 20,
        maxProbeTimeoutMs: 6000, // Extended 6000ms threshold for normal regs
        readModbusFn: (slave, fc, reg, numreg, timeout) =>
          mcu.handleModbusRead(slave, fc, reg, numreg, timeout),
      },
    );
    const totalElapsed = Date.now() - t0;

    assert.strictEqual(result.success, true, 'Probe must succeed once MCU Flash write completes');
    assert.ok(totalElapsed >= 4150, `Must wait for MCU Flash commit window (got ${totalElapsed}ms)`);
    assert.ok(totalElapsed < 5500, `Must succeed within 6000ms timeout window (got ${totalElapsed}ms)`);
    console.log(
      `  -> PASS: Normal Reg ${testReg} succeeded after ${result.elapsedMs}ms (${result.attempts} attempts, ${mcu.rxDropCount} busy drops).\n`,
    );
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 3: AppKey Reg 274 Heavy Flash Write (5500ms latency with 10s Adaptive Timeout)
  // --------------------------------------------------------------------
  console.log('[TEST 3] AppKey Reg 274 Heavy Flash Write (5500ms latency with 10000ms ceiling & Safe Anchor 0x0000)...');
  {
    const mcu = new MockMcuFlashDevice();
    const appKeyBytes = [
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
    ];
    mcu.setFlashBusy(5500); // 5500ms heavy Flash erase/NVS compaction (> 4s, was failing at 1578ms!)

    let probedReg = -1;
    const t0 = Date.now();
    const result = await probeDeviceReadyAndVerified(
      1,
      274, // AppKey
      8,
      appKeyBytes,
      true, // isWriteOnly = true
      {
        enableProbe: true,
        enableAdaptiveProbe: true,
        guardSilenceMs: 150, // 150ms guard silence
        appkeyProbeTimeoutMs: 10000, // 10s ceiling
        safeProbeRegister: 0, // Safe Anchor Reg 0x0000 Firmware Code
        readModbusFn: (slave, fc, reg, numreg, timeout) => {
          probedReg = reg;
          return mcu.handleModbusRead(slave, fc, reg, numreg, timeout);
        },
      },
    );
    const totalElapsed = Date.now() - t0;

    assert.strictEqual(result.success, true, 'Write-only probe must succeed');
    assert.strictEqual(probedReg, 0, 'Must query Safe Anchor Reg 0x0000 Firmware Code instead of write-only Reg 274');
    assert.ok(totalElapsed >= 5450, `Must wait across 5500ms Flash write without 1578ms abort (got ${totalElapsed}ms)`);
    assert.ok(totalElapsed < 7500, `Must succeed well within 10000ms window (got ${totalElapsed}ms)`);
    console.log(
      `  -> PASS: Write-Only Reg 274 verified via Safe Anchor Reg 0x0000 in ${result.elapsedMs}ms (${result.attempts} probes, 5500ms Flash wait).\n`,
    );
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 4: UART Stall & Overrun Error Recovery (Flush Buffer & ORE Clear)
  // --------------------------------------------------------------------
  console.log('[TEST 4] UART Stall & Overrun Error Recovery (Draining RX buffer & line recovery)...');
  {
    const mcu = new MockMcuFlashDevice();
    const testReg = 303;
    const testData = [0x00, 0x02];
    mcu.writeRegisters(testReg, testData);
    mcu.setGarbageResponses(2); // First 2 reads return garbage (ORE frame corruption)

    let flushCallCount = 0;
    const result = await probeDeviceReadyAndVerified(
      1,
      testReg,
      1,
      testData,
      false,
      {
        enableProbe: true,
        uartStallRecoveryFlush: true,
        probeIntervalMs: 50,
        maxProbeTimeoutMs: 2000,
        flushBufferFn: async (timeoutMs) => {
          flushCallCount++;
          await mcu.flushRxBuffer(timeoutMs);
        },
        readModbusFn: (slave, fc, reg, numreg, timeout) =>
          mcu.handleModbusRead(slave, fc, reg, numreg, timeout),
      },
    );

    assert.strictEqual(result.success, true, 'Probe must succeed after flushing UART stall');
    assert.ok(flushCallCount >= 1, `flushBufferFn must be invoked upon read failure/mismatch (called: ${flushCallCount})`);
    assert.ok(mcu.uartStallFlushes >= 1, `MCU mock buffer must be cleared (flushes: ${mcu.uartStallFlushes})`);
    console.log(
      `  -> PASS: UART stall recovered successfully via active buffer drain (${flushCallCount} flushes, ${result.attempts} attempts).\n`,
    );
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 5: Data Mismatch Detection on Read-Write Registers
  // --------------------------------------------------------------------
  console.log('[TEST 5] Data Mismatch Detection on Read-Write Registers (Flash cell wear / corruption)...');
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
  // TEST 6: Unresponsive MCU Timeout Gate (Exceeding 10000ms on Reg 274)
  // --------------------------------------------------------------------
  console.log('[TEST 6] Unresponsive MCU Timeout Gate (Exceeding 10000ms on Reg 274)...');
  {
    const mcu = new MockMcuFlashDevice();
    mcu.setFlashBusy(999999); // Hung forever

    let errorThrown: any = null;
    const t0 = Date.now();
    try {
      await probeDeviceReadyAndVerified(
        1,
        274, // Reg 274
        8,
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        true,
        {
          enableProbe: true,
          isAppKey: true,
          guardSilenceMs: 10,
          appkeyProbeTimeoutMs: 600, // Shortened for test speed
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
      String(errorThrown.message).includes('AppKey/Flash-heavy timeout 600ms reached'),
      `Error message must indicate AppKey timeout reached, got: ${errorThrown.message}`,
    );
    assert.ok(elapsed >= 580, `Must respect appkeyProbeTimeoutMs threshold (elapsed: ${elapsed}ms)`);
    console.log(`  -> PASS: AppKey Timeout gated cleanly at ${elapsed}ms: "${errorThrown.message}".\n`);
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 7: USB Disconnect & Reconnect Session Preservation in final-config-device.module.ts
  // --------------------------------------------------------------------
  console.log('[TEST 7] Verifying USB Disconnect & Reconnect Session Preservation in final-config-device.module.ts...');
  {
    const viewsModulePath = path.resolve(__dirname, '../src/views/dashboard-modules/final-config-device.module.ts');
    const content = fs.readFileSync(viewsModulePath, 'utf8');

    assert.ok(
      content.includes('isWaitingReconnectOnAppKey'),
      'Must declare and track isWaitingReconnectOnAppKey state',
    );
    assert.ok(
      content.includes('if (isRunningFinalConfig.value && currentStage.value === 2) {') &&
      content.includes('isWaitingReconnectOnAppKey.value = true;'),
      'Must preserve Stage 2 execution state on disconnect without throwing immediate abort',
    );
    assert.ok(
      content.includes('if (isWaitingReconnectOnAppKey.value) {') &&
      content.includes('isWaitingReconnectOnAppKey.value = false;'),
      'Must resume probe recovery upon USB re-enumeration',
    );
    console.log('  -> PASS: USB disconnect & auto-reconnect session preservation verified in source.\n');
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 8: Backward Compatibility (enableProbe = false fallback to 600ms)
  // --------------------------------------------------------------------
  console.log('[TEST 8] Backward Compatibility: enableProbe = false fallback...');
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
  // TEST 9: 1:1 Code Synchronization between src/views and src/frontend
  // --------------------------------------------------------------------
  console.log('[TEST 9] Verifying 1:1 Code Synchronization between src/views and src/frontend...');
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
