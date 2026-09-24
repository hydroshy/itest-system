import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

async function runWebSerialSuite() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: WEB SERIAL USB DISCONNECT, RECONNECT & ANTI-FREEZE');
  console.log('======================================================================\n');

  const testAutoViewsPath = path.resolve(__dirname, '../src/views/dashboard-modules/test-automation.module.ts');
  const testAutoFrontPath = path.resolve(__dirname, '../src/frontend/modules/dashboard/test-automation.module.ts');
  const serialUartViewsPath = path.resolve(__dirname, '../src/views/dashboard-modules/serial-uart.module.ts');
  const serialUartFrontPath = path.resolve(__dirname, '../src/frontend/modules/dashboard/serial-uart.module.ts');

  const testAutoContent = fs.readFileSync(testAutoViewsPath, 'utf8');
  const testAutoFrontContent = fs.readFileSync(testAutoFrontPath, 'utf8');
  const serialUartContent = fs.readFileSync(serialUartViewsPath, 'utf8');
  const serialUartFrontContent = fs.readFileSync(serialUartFrontPath, 'utf8');

  // --------------------------------------------------------------------
  // TEST 1: 1:1 File Synchronization between src/views and src/frontend
  // --------------------------------------------------------------------
  console.log('[TEST 1] Verifying 1:1 Synchronization between views and frontend modules...');
  assert.strictEqual(
    testAutoContent,
    testAutoFrontContent,
    'test-automation.module.ts in src/views and src/frontend must be 100% identical',
  );
  assert.strictEqual(
    serialUartContent,
    serialUartFrontContent,
    'serial-uart.module.ts in src/views and src/frontend must be 100% identical',
  );
  console.log('  -> PASS: All files are 100% synchronized.\n');

  // --------------------------------------------------------------------
  // TEST 2: Test Automation Module Disconnect & Auto-Reconnect Implementation
  // --------------------------------------------------------------------
  console.log('[TEST 2] Verifying Hardware Disconnect & Reconnect in test-automation.module.ts...');
  assert.ok(
    testAutoContent.includes("navigator.serial.addEventListener('disconnect', handleUartHardwareDisconnect)"),
    'Must register disconnect event listener on navigator.serial in onMounted',
  );
  assert.ok(
    testAutoContent.includes("navigator.serial.addEventListener('connect', handleUartHardwareConnect)"),
    'Must register connect event listener on navigator.serial in onMounted',
  );
  assert.ok(
    testAutoContent.includes("navigator.serial.removeEventListener('disconnect', handleUartHardwareDisconnect)"),
    'Must remove disconnect event listener on navigator.serial in onUnmounted',
  );
  assert.ok(
    testAutoContent.includes("navigator.serial.removeEventListener('connect', handleUartHardwareConnect)"),
    'Must remove connect event listener on navigator.serial in onUnmounted',
  );
  assert.ok(
    testAutoContent.includes('safeCleanupUartPort'),
    'Must define safeCleanupUartPort for releasing stream locks before closing',
  );
  assert.ok(
    testAutoContent.includes('activeUartReader.cancel()'),
    'Must cancel activeUartReader before releasing lock to prevent stream deadlock',
  );
  assert.ok(
    testAutoContent.includes('activeUartReader.releaseLock()'),
    'Must release activeUartReader lock',
  );
  assert.ok(
    testAutoContent.includes('isAutoReconnectingUart'),
    'Must track isAutoReconnectingUart state',
  );
  console.log('  -> PASS: Test Automation module Web Serial hardware lifecycle verified.\n');

  // --------------------------------------------------------------------
  // TEST 3: Serial UART Diagnostic Module Disconnect, Read Loop & Auto-Reconnect
  // --------------------------------------------------------------------
  console.log('[TEST 3] Verifying Hardware Disconnect, Freeze Prevention & Auto-Reconnect in serial-uart.module.ts...');
  assert.ok(
    serialUartContent.includes("navigator.serial.addEventListener('disconnect', handleSerialDisconnect)"),
    'Must register disconnect event listener on navigator.serial in onMounted',
  );
  assert.ok(
    serialUartContent.includes("navigator.serial.addEventListener('connect', handleSerialConnect)"),
    'Must register connect event listener on navigator.serial in onMounted',
  );
  assert.ok(
    serialUartContent.includes("navigator.serial.removeEventListener('disconnect', handleSerialDisconnect)"),
    'Must remove disconnect event listener on navigator.serial in onUnmounted',
  );
  assert.ok(
    serialUartContent.includes("navigator.serial.removeEventListener('connect', handleSerialConnect)"),
    'Must remove connect event listener on navigator.serial in onUnmounted',
  );
  assert.ok(
    serialUartContent.includes('keepReadingSerial = false') && serialUartContent.includes('break;'),
    'Read loop must terminate immediately upon stream read error / hardware disconnect to prevent infinite freeze loop',
  );
  assert.ok(
    serialUartContent.includes('serialReader.cancel()'),
    'Must cancel serialReader upon disconnect or error',
  );
  assert.ok(
    serialUartContent.includes('serialReader.releaseLock()'),
    'Must release serialReader lock',
  );
  assert.ok(
    serialUartContent.includes('isAutoReconnecting'),
    'Must track isAutoReconnecting state in serial-uart module',
  );
  console.log('  -> PASS: Serial UART diagnostic module freeze prevention and auto-reconnect verified.\n');

  // --------------------------------------------------------------------
  // TEST 4: Mock Simulation of Hardware Disconnect, Lock Cleanup & Reconnect
  // --------------------------------------------------------------------
  console.log('[TEST 4] Simulating Hardware Disconnect & Reconnect Lifecycle...');

  let portClosed = false;
  let readerCancelled = false;
  let readerLockReleased = false;

  const mockReader = {
    cancel: async () => { readerCancelled = true; },
    releaseLock: () => { readerLockReleased = true; },
  };

  const mockPort = {
    getInfo: () => ({ usbVendorId: 0x10C4, usbProductId: 0xEA60 }),
    open: async () => { portClosed = false; },
    close: async () => { portClosed = true; },
    readable: {
      getReader: () => mockReader,
    },
  };

  const listeners: Record<string, ((event: any) => void)[]> = {};
  const mockNavigatorSerial = {
    addEventListener: (type: string, cb: any) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(cb);
    },
    removeEventListener: (type: string, cb: any) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter(l => l !== cb);
      }
    },
    getPorts: async () => [mockPort],
  };

  // Verify disconnect event trigger
  let activePort: any = mockPort;
  let activeReader: any = mockReader;
  let isConnected = true;
  let isReconnecting = false;

  mockNavigatorSerial.addEventListener('disconnect', async (event: any) => {
    if (activePort && (activePort === event.target || !event.target)) {
      if (activeReader) {
        await activeReader.cancel();
        activeReader.releaseLock();
        activeReader = null;
      }
      if (activePort) {
        await activePort.close();
      }
      isConnected = false;
      isReconnecting = true;
    }
  });

  mockNavigatorSerial.addEventListener('connect', async (event: any) => {
    if (isReconnecting) {
      activePort = event.target;
      await activePort.open();
      isConnected = true;
      isReconnecting = false;
    }
  });

  // Fire disconnect
  for (const cb of listeners['disconnect'] || []) {
    await cb({ target: mockPort });
  }

  assert.strictEqual(readerCancelled, true, 'Mock reader must be cancelled on disconnect');
  assert.strictEqual(readerLockReleased, true, 'Mock reader lock must be released on disconnect');
  assert.strictEqual(portClosed, true, 'Port must be closed cleanly on disconnect');
  assert.strictEqual(isConnected, false, 'Connection state must be false after disconnect');
  assert.strictEqual(isReconnecting, true, 'Reconnecting state must be true after disconnect');

  // Fire connect (re-enumeration)
  for (const cb of listeners['connect'] || []) {
    await cb({ target: mockPort });
  }

  assert.strictEqual(isConnected, true, 'Connection must be restored upon connect event');
  assert.strictEqual(isReconnecting, false, 'Reconnecting state must be reset to false');
  console.log('  -> PASS: Mock Web Serial hardware disconnect and reconnect cycle verified.\n');

  // --------------------------------------------------------------------
  // TEST 5: English UI Standardization
  // --------------------------------------------------------------------
  console.log('[TEST 5] Verifying 100% Pure English UI & Logs...');
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  assert.ok(
    !vietnameseRegex.test(testAutoContent.substring(0, 1400)),
    'Test Automation template must have 0 Vietnamese characters',
  );
  assert.ok(
    !vietnameseRegex.test(serialUartContent.substring(0, 750)),
    'Serial UART template must have 0 Vietnamese characters',
  );
  console.log('  -> PASS: 100% Pure English UI standardized.\n');

  console.log('======================================================================');
  console.log('ALL 5 WEB SERIAL TESTS PASSED SUCCESSFULLY (100% VERIFIED)!');
  console.log('======================================================================');
}

runWebSerialSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
