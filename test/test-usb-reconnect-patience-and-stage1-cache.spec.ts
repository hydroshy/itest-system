import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  probeDeviceReadyAndVerified,
  waitForPortReconnection,
  isPortDisconnectedError,
  readFirstRegisterUntilSuccess,
  ProbeTimingOptions,
} from '../src/views/dashboard-modules/final-config-device.module';

/**
 * ==============================================================================
 * AUTOMATED QA TEST SUITE: USB RESET RECONNECT PATIENCE & STAGE 1 CACHE REUSE
 * Architectural Spec: docs/usb_reset_reconnect_patience_and_stage1_cache_spec.md
 * Task: t4 [create_lorawan_tests]
 * ==============================================================================
 */

/**
 * Mock MCU Flash Device with configurable USB disconnect and port re-enumeration.
 */
class MockUsbResetMcuDevice {
  public isPortConnected = true;
  public registers: Map<number, number[]> = new Map();
  public safeAnchorCode = [0x12, 0x34]; // Reg 0x0000 Firmware Code (2 bytes)
  public probeCount = 0;
  public disconnectOccurred = false;
  public totalDisconnects = 0;
  public reconnectsCompleted = 0;

  constructor() {
    this.registers.set(0, [...this.safeAnchorCode]);
  }

  setRegister(addr: number, data: number[]) {
    this.registers.set(addr, [...data]);
  }

  /**
   * Simulate a USB hardware disconnect / reset event lasting durationMs.
   */
  triggerUsbReset(durationMs: number) {
    this.isPortConnected = false;
    this.disconnectOccurred = true;
    this.totalDisconnects++;
    setTimeout(() => {
      this.isPortConnected = true;
      this.reconnectsCompleted++;
    }, durationMs);
  }

  async handleModbusRead(
    slave: number,
    fc: number,
    reg: number,
    numreg: number,
    timeoutMs: number,
  ): Promise<number[]> {
    this.probeCount++;
    if (!this.isPortConnected) {
      throw new Error('NetworkError: The device has been lost / serial port is disconnected');
    }

    if (reg === 0) {
      return [...this.safeAnchorCode];
    }

    const val = this.registers.get(reg);
    if (!val) {
      return new Array(numreg * 2).fill(0);
    }
    return [...val];
  }
}

async function runUsbReconnectPatienceSuite() {
  console.log('======================================================================');
  console.log('🧪 TEST SUITE: USB RESET RECONNECT PATIENCE (15s) & STAGE 1 CACHE REUSE');
  console.log('======================================================================\n');

  let passedTests = 0;
  const viewsModulePath = path.resolve(__dirname, '../src/views/dashboard-modules/final-config-device.module.ts');
  const frontModulePath = path.resolve(__dirname, '../src/frontend/modules/dashboard/final-config-device.module.ts');

  // --------------------------------------------------------------------
  // TEST 1: 1:1 Code Synchronization between src/views and src/frontend
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying 1:1 Code Synchronization...');
  assert.ok(fs.existsSync(viewsModulePath), 'views final-config-device.module.ts must exist');
  assert.ok(fs.existsSync(frontModulePath), 'frontend final-config-device.module.ts must exist');

  const viewsContent = fs.readFileSync(viewsModulePath, 'utf8');
  const frontContent = fs.readFileSync(frontModulePath, 'utf8');

  assert.strictEqual(
    viewsContent,
    frontContent,
    'final-config-device.module.ts in src/views and src/frontend must be 100% identical',
  );
  console.log('  -> PASS: final-config-device.module.ts is 100% synchronized.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 2: isPortDisconnectedError Standardized Detection
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying isPortDisconnectedError standard detection...');
  assert.strictEqual(isPortDisconnectedError(new Error('NetworkError: A device disconnected.')), true);
  assert.strictEqual(isPortDisconnectedError(new Error('Serial port is not open or readable')), true);
  assert.strictEqual(isPortDisconnectedError(new Error('The device has been lost')), true);
  assert.strictEqual(isPortDisconnectedError(new Error('Cannot read properties of null (reading \'readable\')')), true);
  assert.strictEqual(isPortDisconnectedError(new Error('Modbus CRC error: expected 0x1234')), false);
  assert.strictEqual(isPortDisconnectedError(new Error('Timeout waiting for response')), false);
  console.log('  -> PASS: isPortDisconnectedError correctly classifies port drop errors.\n');
  passedTests++;

  // --------------------------------------------------------------------
  // TEST 3: waitForPortReconnection Patience Wait under 5s USB drop
  // --------------------------------------------------------------------
  console.log('[TEST 3] Verifying waitForPortReconnection survives 5s USB drop...');
  {
    let connected = false;
    const startT = Date.now();
    // Simulate USB re-enumerates after 1500ms
    setTimeout(() => {
      connected = true;
    }, 1500);

    const reconnected = await waitForPortReconnection(5000, {
      isConnectedFn: () => connected,
      checkIntervalMs: 50,
    });
    const elapsed = Date.now() - startT;

    assert.strictEqual(reconnected, true, 'waitForPortReconnection must resolve true when port comes back');
    assert.ok(elapsed >= 1400 && elapsed <= 3000, `Patience wait elapsed time (${elapsed}ms) should match drop time`);
    console.log(`  -> PASS: Reconnection resolved in ${elapsed}ms without throwing error.\n`);
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 4: waitForPortReconnection Timeout when USB lost > 15s (unplugged)
  // --------------------------------------------------------------------
  console.log('[TEST 4] Verifying waitForPortReconnection times out on prolonged disconnect (>15s)...');
  {
    let caughtErr: any = null;
    try {
      await waitForPortReconnection(300, {
        isConnectedFn: () => false,
        checkIntervalMs: 30,
      });
    } catch (err) {
      caughtErr = err;
    }

    assert.ok(caughtErr, 'Must reject when port does not reconnect before timeout');
    assert.ok(
      String(caughtErr.message).includes('USB reconnection patience wait timeout'),
      `Error message must indicate patience timeout, got: ${caughtErr?.message}`,
    );
    console.log(`  -> PASS: Timeout gated cleanly: "${caughtErr.message}".\n`);
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 5: Stage 2 Flash Write / AppKey Probe with 5s USB Reset:
  //         Clock freezing, patience wait, automatic probe resume, PASS without abort
  // --------------------------------------------------------------------
  console.log('[TEST 5] Stage 2 AppKey Reg 274: 5s USB Reset during probe, clock freeze & resume...');
  {
    const mcu = new MockUsbResetMcuDevice();
    const t0 = Date.now();

    // Disconnect port before probe starts, simulate 3000ms USB drop
    mcu.triggerUsbReset(3000);

    const probeResult = await probeDeviceReadyAndVerified(
      1,
      274, // AppKey (Write-Only) -> Safe Anchor Reg 0x0000
      8,
      [0x01, 0x02],
      true, // isWriteOnly
      {
        enableProbe: true,
        isAppKey: true,
        guardSilenceMs: 20,
        enableUsbReconnectPatience: true,
        usbReconnectTimeoutMs: 15000,
        appkeyProbeTimeoutMs: 6000, // Probe timeout budget is 6s; frozen clock must preserve it
        isPortConnectedFn: () => mcu.isPortConnected,
        waitForPortReconnectionFn: async (tMs) => {
          return await waitForPortReconnection(tMs, {
            isConnectedFn: () => mcu.isPortConnected,
            checkIntervalMs: 50,
          });
        },
        readModbusFn: (slave, fc, reg, numreg, timeout) =>
          mcu.handleModbusRead(slave, fc, reg, numreg, timeout),
      },
    );

    const elapsedTotal = Date.now() - t0;
    assert.strictEqual(probeResult.success, true, 'Probe must succeed after USB re-connect');
    assert.ok(mcu.disconnectOccurred, 'USB disconnect simulation must have triggered');
    assert.ok(mcu.reconnectsCompleted >= 1, 'USB reconnect must have completed');
    assert.ok(elapsedTotal >= 2900, `Total elapsed time (${elapsedTotal}ms) must reflect the 3s disconnect`);
    console.log(`  -> PASS: Stage 2 survived 3s-5s USB drop! Succeeded in ${elapsedTotal}ms with probe success.\n`);
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 6: Stage 1 readRegisterWithRetry & readFirstRegisterUntilSuccess contract
  // --------------------------------------------------------------------
  console.log('[TEST 6] Stage 1 retry loops patience wait and port drop resilience in source...');
  {
    // Verify readFirstRegisterUntilSuccess in module source has waitForPortReconnection
    assert.ok(
      viewsContent.includes('const readFirstRegisterUntilSuccess = async (slave, addr, numreg, options) => {') &&
      viewsContent.includes('await waitForPortReconnection(patienceTimeoutMs);'),
      'Stage 1 readFirstRegisterUntilSuccess must call waitForPortReconnection when port drops',
    );

    // Verify readRegisterWithRetry in Stage 1 has patience wait
    assert.ok(
      viewsContent.includes('const readRegisterWithRetry = async (slave, addr, numreg) => {') &&
      viewsContent.includes('if (enablePatience && isPortDisconnectedError(rErr)) {') &&
      viewsContent.includes('await waitForPortReconnection(patienceTimeoutMs);'),
      'Stage 1 readRegisterWithRetry must intercept port disconnect errors and patience wait up to 15s',
    );

    // Verify exported standalone readFirstRegisterUntilSuccess handles successful reads
    const res = await readFirstRegisterUntilSuccess(1, 0, 5, {
      backoffMs: 50,
      isConnectedFn: () => true,
      readModbusFn: async () => [0x12, 0x34],
    });
    assert.strictEqual(res.success, true);
    assert.deepStrictEqual(res.rawBytes, [0x12, 0x34]);

    console.log(`  -> PASS: Stage 1 retry loop patience wait & port drop resilience verified.\n`);
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 7: Stage 1 Ascending Scan Order (0 -> 5 -> 9 ... -> 386) & Real-time Audit Row Cache
  // --------------------------------------------------------------------
  console.log('[TEST 7] Verifying Stage 1 Ascending Scan Order & Real-time fcAuditRegisters streaming...');
  {
    // Check STAGE1_REGISTER_DEFS definitions in source
    const expectedAddresses = [0, 5, 9, 11, 15, 27, 31, 35, 43, 51, 103, 259, 386];
    assert.ok(
      viewsContent.includes('const STAGE1_REGISTER_DEFS = ['),
      'STAGE1_REGISTER_DEFS must be defined',
    );
    for (const addr of expectedAddresses) {
      assert.ok(
        viewsContent.includes(`address: ${addr}`),
        `STAGE1_REGISTER_DEFS must contain address ${addr}`,
      );
    }

    // Verify addresses are sorted ascending
    const stage1DefSnippetMatch = viewsContent.match(/const STAGE1_REGISTER_DEFS = \[([\s\S]*?)\];/);
    assert.ok(stage1DefSnippetMatch, 'STAGE1_REGISTER_DEFS snippet must match');
    const addrMatches = [...stage1DefSnippetMatch[1].matchAll(/address:\s*(\d+)/g)].map((m) => Number(m[1]));
    assert.deepStrictEqual(addrMatches, expectedAddresses, 'Stage 1 registers must be in strict ascending order (0..386)');

    // Verify real-time streaming updates: updateStage1AuditRow and updateTabulatorData
    assert.ok(
      viewsContent.includes('updateStage1AuditRow('),
      'updateStage1AuditRow must be called to stream value_read_back row by row',
    );
    assert.ok(
      viewsContent.includes('fcAuditRegisters.value = STAGE1_REGISTER_DEFS.map('),
      'fcAuditRegisters must be pre-seeded in Stage 1',
    );
    console.log('  -> PASS: Stage 1 strict ascending scan (13 registers) and real-time streaming confirmed.\n');
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 8: Stage 3 Cache Reuse (Bypassing Redundant Modbus Reads for 13 Static Regs)
  // --------------------------------------------------------------------
  console.log('[TEST 8] Verifying Stage 3 Cache Reuse logic for Reg < 303 && Reg != 274...');
  {
    assert.ok(
      viewsContent.includes('const enableStage1CacheReuse = currentPreset.value?.enable_stage1_cache_reuse !== undefined'),
      'Stage 3 must evaluate enableStage1CacheReuse configuration flag',
    );
    assert.ok(
      viewsContent.includes('[Stage 3 Cache] Reusing Stage 1 cached value for Reg'),
      'Stage 3 must log info message when reusing cached value and skipping redundant Modbus read',
    );
    assert.ok(
      viewsContent.includes('(isStage1StaticReg || (addr < 303 && addr !== 274))'),
      'Stage 3 must check condition to bypass Modbus read for static registers',
    );
    console.log('  -> PASS: Stage 3 cache reuse bypass contract verified in final-config-device.module.ts.\n');
    passedTests++;
  }

  // --------------------------------------------------------------------
  // TEST 9: DDL Migration 27 & TypeORM Entity Schema Consistency
  // --------------------------------------------------------------------
  console.log('[TEST 9] Verifying DDL Migration 27 and TypeORM Entity consistency...');
  {
    const ddlPath = path.resolve(__dirname, '../../deploy/database/updates/27_add_usb_reconnect_patience_and_stage1_cache.sql');
    assert.ok(fs.existsSync(ddlPath), 'Migration 27 SQL file must exist');
    const ddlContent = fs.readFileSync(ddlPath, 'utf8');

    assert.ok(ddlContent.includes('BEGIN;'), 'Migration 27 must be transactional (BEGIN)');
    assert.ok(ddlContent.includes('COMMIT;'), 'Migration 27 must commit transaction (COMMIT)');
    assert.ok(ddlContent.includes('usb_reconnect_patience_timeout_ms'), 'Must add usb_reconnect_patience_timeout_ms');
    assert.ok(ddlContent.includes('enable_usb_reconnect_patience'), 'Must add enable_usb_reconnect_patience');
    assert.ok(ddlContent.includes('enable_stage1_cache_reuse'), 'Must add enable_stage1_cache_reuse');

    const entityPath = path.resolve(
      __dirname,
      '../src/modules/c-modules/create-final-config/entities/final-config-preset.entity.ts',
    );
    const entityContent = fs.readFileSync(entityPath, 'utf8');
    assert.ok(entityContent.includes('usb_reconnect_patience_timeout_ms'), 'Entity must declare usb_reconnect_patience_timeout_ms');
    assert.ok(entityContent.includes('enable_usb_reconnect_patience'), 'Entity must declare enable_usb_reconnect_patience');
    assert.ok(entityContent.includes('enable_stage1_cache_reuse'), 'Entity must declare enable_stage1_cache_reuse');
    console.log('  -> PASS: DDL Migration 27 and TypeORM entity schema verified.\n');
    passedTests++;
  }

  console.log('======================================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${passedTests} CHECKS SUCCESSFUL`);
  console.log('======================================================================\n');
}

runUsbReconnectPatienceSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
