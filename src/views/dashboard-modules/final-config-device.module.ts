// ==============================================================================
// D-MODULE: FINAL CONFIG DEVICE (`final-config-device`)
// Automated 4-Stage Final Configuration & QA Hardware Execution Engine
// ==============================================================================

export interface ReadRegisterResult {
  success: boolean;
  rawBytes: number[] | null;
  error?: any;
  attempts?: number;
  aborted?: boolean;
}

export interface ReadFirstRegisterOptions {
  backoffMs?: number;
  label?: string;
  abortRef?: { value: boolean };
  flushBufferFn?: () => Promise<void>;
  readModbusFn?: (slave: number, addr: number, numreg: number) => Promise<number[]>;
  logFn?: (level: string, frame: any, msg: string) => void;
  statusMsgRef?: { value: string };
  interReadDelayMs?: number;
  isConnectedFn?: () => boolean;
}

/**
 * Continuous retry loop for reading the first register until success or user abort.
 * Designed to handle slow MCU wake-up from Deep Sleep without failing on fixed attempt limits.
 * Protects against infinite hangs if the serial port is physically disconnected.
 */
export async function readFirstRegisterUntilSuccess(
  slave: number,
  addr: number,
  numreg: number,
  options?: ReadFirstRegisterOptions,
): Promise<ReadRegisterResult> {
  const backoffMs = options?.backoffMs || 300;
  const label = options?.label || `Reg ${addr}`;
  let attempt = 0;
  let lastErr: any = null;

  while (!options?.abortRef?.value) {
    if (options?.isConnectedFn && !options.isConnectedFn()) {
      if (options?.logFn) {
        options.logFn('ERROR', null, `[First Register] ${label} serial port disconnected. Halting retry loop.`);
      }
      return { success: false, aborted: true, error: new Error('Serial port disconnected'), rawBytes: null };
    }

    attempt++;
    try {
      if (options?.flushBufferFn) await options.flushBufferFn();
      if (!options?.readModbusFn) {
        throw new Error('readModbusFn not provided');
      }
      const rawBytes = await options.readModbusFn(slave, addr, numreg);
      if (options?.interReadDelayMs) {
        await new Promise((r) => setTimeout(r, options.interReadDelayMs));
      }
      if (options?.logFn) {
        options.logFn('INFO', null, `[First Register] ${label} read SUCCESS on attempt ${attempt}`);
      }
      return { success: true, rawBytes, attempts: attempt };
    } catch (rErr) {
      lastErr = rErr;
      if (options?.abortRef?.value || (options?.isConnectedFn && !options.isConnectedFn())) {
        return { success: false, aborted: true, error: new Error('User aborted operation or serial port disconnected'), rawBytes: null };
      }
      const errMsg = (rErr as any)?.message || String(rErr);
      if (options?.logFn) {
        options.logFn(
          'WARN',
          null,
          `[First Register] ${label} read failed (attempt ${attempt}): ${errMsg}. Retrying continuously until MCU wakes up...`,
        );
      }
      if (options?.statusMsgRef) {
        options.statusMsgRef.value = `Waking up MCU / Retrying ${label} (attempt ${attempt})...`;
      }
      if (options?.flushBufferFn) await options.flushBufferFn();
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  return { success: false, aborted: true, error: lastErr || new Error('Aborted'), rawBytes: null };
}

export interface ProbeTimingOptions {
  enableProbe?: boolean;
  enable_probe_verification?: boolean;
  probeIntervalMs?: number;
  probe_interval_ms?: number;
  maxProbeTimeoutMs?: number;
  max_probe_timeout_ms?: number;
  appkeyProbeTimeoutMs?: number;
  appkey_probe_timeout_ms?: number;
  enableAdaptiveProbe?: boolean;
  enable_adaptive_probe?: boolean;
  uartStallRecoveryFlush?: boolean;
  uart_stall_recovery_flush?: boolean;
  safeProbeRegister?: number;
  safe_probe_register?: number;
  guardSilenceMs?: number;
  guard_silence_ms?: number;
  isAppKey?: boolean;
  isFlashHeavy?: boolean;
  usbReconnectTimeoutMs?: number;
  usb_reconnect_patience_timeout_ms?: number;
  enableUsbReconnectPatience?: boolean;
  enable_usb_reconnect_patience?: boolean;
  waitForPortReconnectionFn?: (timeoutMs?: number) => Promise<boolean>;
  isPortConnectedFn?: () => boolean;
  readModbusFn?: (slave: number, fc: number, reg: number, numreg: number, timeoutMs: number) => Promise<number[]>;
  flushBufferFn?: (flushTimeoutMs?: number) => Promise<void>;
  logFn?: (level: string, frame: any, msg: string) => void;
  statusMsgRef?: { value: string };
}

export interface ProbeVerificationResult {
  success: boolean;
  elapsedMs: number;
  attempts: number;
}

/**
 * Standardized port disconnection detection.
 * Architectural Contract: Spec Section 3.1
 */
export function isPortDisconnectedError(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err).toLowerCase();
  const name = String(err?.name || '').toLowerCase();
  return (
    name === 'networkerror' ||
    msg.includes('networkerror') ||
    msg.includes('serial port is not open') ||
    msg.includes('not open or readable') ||
    msg.includes('not open or writable') ||
    msg.includes('the device has been lost') ||
    msg.includes('device lost') ||
    msg.includes('closed') ||
    msg.includes('disconnected') ||
    msg.includes('cannot read properties of null') ||
    msg.includes('underlying stream has been closed')
  );
}

export interface WaitForPortReconnectionOptions {
  isConnectedFn?: () => boolean;
  abortRef?: { value: boolean };
  logFn?: (level: string, frame: any, msg: string) => void;
  statusMsgRef?: { value: string };
  checkIntervalMs?: number;
}

/**
 * Patience wait for USB port re-enumeration & reconnection (up to 15s)
 * Architectural Contract: Spec Section 3.2
 */
export async function waitForPortReconnection(
  timeoutMs: number = 15000,
  options?: WaitForPortReconnectionOptions,
): Promise<boolean> {
  if (options?.isConnectedFn && options.isConnectedFn()) {
    return true;
  }

  const startWait = Date.now();
  if (options?.logFn) {
    options.logFn(
      'WARN',
      null,
      `[Patience Wait] USB port disconnected/resetting. Waiting up to ${Math.round(timeoutMs / 1000)}s for reconnect...`,
    );
  }
  if (options?.statusMsgRef) {
    options.statusMsgRef.value = `USB reset detected. Patience waiting for USB reconnect (max ${Math.round(timeoutMs / 1000)}s)...`;
  }

  const intervalMs = options?.checkIntervalMs || 100;
  return new Promise<boolean>((resolve, reject) => {
    let checkInterval: any = null;
    let timeoutTimer: any = null;

    const cleanup = () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };

    checkInterval = setInterval(() => {
      if (options?.abortRef?.value) {
        cleanup();
        reject(new Error('Operation aborted by operator'));
        return;
      }
      if (options?.isConnectedFn && options.isConnectedFn()) {
        cleanup();
        const duration = Date.now() - startWait;
        if (options?.logFn) {
          options.logFn(
            'SYS',
            null,
            `[Patience Wait] USB port re-enumerated & reconnected successfully after ${duration}ms. Resuming...`,
          );
        }
        resolve(true);
      }
    }, intervalMs);

    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error(`USB reconnection patience wait timeout (${timeoutMs}ms) exceeded. Port did not recover.`));
    }, timeoutMs);
  });
}

/**
 * Closed-Loop Write-Verification Handshake (Adaptive Write-Then-Probe Polling Engine)
 * Architectural Contract: Spec Section 2, 3.4, 4.2 & Section 6
 */
export async function probeDeviceReadyAndVerified(
  slave: number,
  reg: number,
  numreg: number,
  expectedBytes: number[],
  isWriteOnly: boolean,
  options?: ProbeTimingOptions,
): Promise<ProbeVerificationResult> {
  const isAppKeyOrHeavy = Boolean(reg === 274 || options?.isAppKey || options?.isFlashHeavy);
  const enableProbe = options?.enableProbe !== undefined
    ? Boolean(options.enableProbe)
    : (options?.enable_probe_verification !== undefined ? Boolean(options.enable_probe_verification) : true);
  const effectiveTimeout = isAppKeyOrHeavy
    ? (options?.appkeyProbeTimeoutMs || options?.appkey_probe_timeout_ms || options?.maxProbeTimeoutMs || options?.max_probe_timeout_ms || 10000)
    : (options?.maxProbeTimeoutMs || options?.max_probe_timeout_ms || 10000);
  const safeReg = options?.safeProbeRegister !== undefined
    ? Number(options.safeProbeRegister)
    : (options?.safe_probe_register !== undefined ? Number(options.safe_probe_register) : 0);
  const guardSilence = options?.guardSilenceMs !== undefined
    ? Number(options.guardSilenceMs)
    : (options?.guard_silence_ms !== undefined ? Number(options.guard_silence_ms) : (isAppKeyOrHeavy ? 150 : 30));

  const enableUsbPatience = options?.enableUsbReconnectPatience !== undefined
    ? Boolean(options.enableUsbReconnectPatience)
    : (options?.enable_usb_reconnect_patience !== undefined ? Boolean(options.enable_usb_reconnect_patience) : true);
  const usbReconnectTimeoutMs = options?.usbReconnectTimeoutMs || options?.usb_reconnect_patience_timeout_ms || 15000;

  // Backward compatibility: If probe disabled, fallback to settling delay
  if (!enableProbe) {
    if (options?.logFn) {
      options.logFn('INFO', null, 'Settling MCU (600ms) for Flash/EEPROM persistence (Probe disabled)...');
    }
    if (options?.statusMsgRef) {
      options.statusMsgRef.value = 'Device settling/retrying... MCU settling (600ms) for Flash/EEPROM storage...';
    }
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, elapsedMs: 600, attempts: 1 };
  }

  // Guard silence interval before first probe to allow MCU to begin Flash/EEPROM cycle safely
  if (guardSilence > 0) {
    await new Promise((r) => setTimeout(r, guardSilence));
  }

  const isAdaptive = options?.enableAdaptiveProbe !== undefined
    ? Boolean(options.enableAdaptiveProbe)
    : (options?.enable_adaptive_probe !== undefined ? Boolean(options.enable_adaptive_probe) : true);

  const getAdaptiveInterval = (elapsedMs: number): number => {
    if (!isAdaptive) {
      return options?.probeIntervalMs || options?.probe_interval_ms || 50;
    }
    if (elapsedMs < 1000) return 100;
    if (elapsedMs < 4000) return 300;
    return 800; // Patience mode
  };

  const startTime = Date.now();
  let totalFrozenMs = 0;
  let attempts = 0;
  let lastMismatch = false;

  const invokeRead = async (s: number, r: number, n: number, t: number): Promise<number[]> => {
    if (!options?.readModbusFn) {
      throw new Error('readModbusFn not provided in options');
    }
    if (options.readModbusFn.length <= 4) {
      return await (options.readModbusFn as any)(s, r, n, t);
    }
    return await options.readModbusFn(s, 3, r, n, t);
  };

  while ((Date.now() - startTime - totalFrozenMs) < effectiveTimeout) {
    // 1. Proactive Port Connection Check & Frozen Probe Clock
    if (enableUsbPatience && options?.isPortConnectedFn && !options.isPortConnectedFn()) {
      if (options.waitForPortReconnectionFn) {
        const freezeStart = Date.now();
        await options.waitForPortReconnectionFn(usbReconnectTimeoutMs);
        totalFrozenMs += (Date.now() - freezeStart);
        if (options.flushBufferFn) await options.flushBufferFn(50);
        continue;
      }
    }

    attempts++;
    const elapsedNow = Date.now() - startTime - totalFrozenMs;
    const remainingTime = Math.max(50, effectiveTimeout - elapsedNow);
    const probeTimeout = Math.min(Math.max(300, remainingTime), 500);

    try {
      if (isWriteOnly) {
        // Case B: Write-Only register (e.g. AppKey Reg 274) -> Read Safe Anchor (default Reg 0x0000 Firmware Code)
        const readBytes = await invokeRead(slave, safeReg, 1, probeTimeout);
        if (readBytes && readBytes.length >= 2) {
          return { success: true, elapsedMs: Date.now() - startTime, attempts };
        }
      } else {
        // Case A: Read-Write register -> Read Target Reg & compare byte-to-byte
        const readBytes = await invokeRead(slave, reg, numreg, probeTimeout);
        let match = false;
        if (readBytes && expectedBytes && readBytes.length === expectedBytes.length) {
          match = true;
          for (let b = 0; b < expectedBytes.length; b++) {
            if (readBytes[b] !== expectedBytes[b]) {
              match = false;
              break;
            }
          }
        }
        if (match) {
          return { success: true, elapsedMs: Date.now() - startTime, attempts };
        } else {
          lastMismatch = true;
        }
      }
    } catch (probeErr) {
      // 2. Reactive Port Drop Check: USB disconnect during invokeRead -> Freeze Probe Clock & Patience Wait
      if (enableUsbPatience && isPortDisconnectedError(probeErr)) {
        if (options?.waitForPortReconnectionFn) {
          const freezeStart = Date.now();
          await options.waitForPortReconnectionFn(usbReconnectTimeoutMs);
          totalFrozenMs += (Date.now() - freezeStart);
          if (options?.flushBufferFn) await options.flushBufferFn(50);
          continue;
        }
      }
      // MCU busy with Flash write, UART IRQ masked or frame timeout/CRC error
    }

    // Active UART Stall Recovery Purge
    const enableRecovery = options?.uartStallRecoveryFlush !== undefined
      ? Boolean(options.uartStallRecoveryFlush)
      : (options?.uart_stall_recovery_flush !== undefined ? Boolean(options.uart_stall_recovery_flush) : true);

    if (enableRecovery) {
      try {
        if (options?.flushBufferFn) {
          await options.flushBufferFn(50);
        } else if (typeof (globalThis as any).flushUartRxBuffer === 'function') {
          await (globalThis as any).flushUartRxBuffer(50);
        }
      } catch (flushErr) {}
    }

    const currentInterval = getAdaptiveInterval(Date.now() - startTime - totalFrozenMs);
    const sleepTime = Math.min(currentInterval, Math.max(10, effectiveTimeout - (Date.now() - startTime - totalFrozenMs)));
    await new Promise((r) => setTimeout(r, sleepTime));
  }

  if (lastMismatch) {
    throw new Error('Device busy / probe timeout after ' + (Date.now() - startTime - totalFrozenMs) + 'ms for register ' + reg + ' (data mismatch)');
  }
  throw new Error('Device busy / probe timeout after ' + (Date.now() - startTime - totalFrozenMs) + 'ms for register ' + reg + (isAppKeyOrHeavy ? ' (AppKey/Flash-heavy timeout ' + effectiveTimeout + 'ms reached)' : ''));
}

const probeDeviceReadyAndVerifiedCore = probeDeviceReadyAndVerified;
const isPortDisconnectedErrorCore = isPortDisconnectedError;
const waitForPortReconnectionCore = waitForPortReconnection;

if (typeof globalThis !== 'undefined') {
  (globalThis as any).probeDeviceReadyAndVerifiedCore = probeDeviceReadyAndVerified;
  (globalThis as any).isPortDisconnectedError = isPortDisconnectedError;
  (globalThis as any).waitForPortReconnection = waitForPortReconnection;
}

export const FINAL_CONFIG_DEVICE_TEMPLATE = `          <div v-else-if="activeFeature.id === 'final-config-device'" class="space-y-6">

            <!-- 1. TOP HEADER -->
            <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <!-- Title & Badges -->
                <div class="flex items-center gap-3.5 flex-wrap">
                  <div class="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl shadow-inner">
                    <i class="fa-solid fa-sliders"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h2 class="text-sm font-bold text-white uppercase tracking-wider">
                        FINAL CONFIG DEVICE - EXECUTION ENGINE
                      </h2>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        WEB SERIAL API
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        4-STAGE AUTOMATION
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        PRODUCTION QA
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Packet & Communication Counters (Debug Mode only) -->
                <div v-show="fcDebugMode" class="flex items-center gap-2 flex-wrap">
                  <div class="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-3">
                    <span class="text-cyan-400 font-bold" title="Transmitted Packets">
                      <i class="fa-solid fa-arrow-up text-[10px] mr-1"></i>TX: {{ fcSerialStats.txPackets }} ({{ fcFormatBytes(fcSerialStats.txBytes) }})
                    </span>
                    <span class="text-slate-700">|</span>
                    <span class="text-emerald-400 font-bold" title="Received Packets">
                      <i class="fa-solid fa-arrow-down text-[10px] mr-1"></i>RX: {{ fcSerialStats.rxPackets }} ({{ fcFormatBytes(fcSerialStats.rxBytes) }})
                    </span>
                    <span class="text-slate-700">|</span>
                    <span class="text-rose-400 font-bold" title="Communication Errors">
                      <i class="fa-solid fa-circle-exclamation text-[10px] mr-1"></i>Err: {{ fcSerialStats.errCount }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. WORK ORDER & SERIAL NUMBER STRIP (READONLY, SHOWN AFTER 25%) -->
            <!-- Layout mode reference: lg:grid-cols-5 -->
            <div v-if="fcProgress >= 25" class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-clipboard-list text-cyan-400"></i>
                  <h3 class="text-xs font-bold text-white uppercase tracking-wider">WORK ORDER & SERIAL NUMBER</h3>
                </div>
                <div class="text-[11px] text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <i class="fa-solid fa-circle-check"></i>
                  <span>Hardware identified & QA verified (Read-only)</span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Serial Number (SN) -->
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                    SERIAL NUMBER
                  </label>
                  <input
                    type="text"
                    v-model="fcSerialNumberInput"
                    placeholder="Auto-read Reg 259..."
                    readonly
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-cyan-300 text-xs font-mono font-bold cursor-not-allowed select-all"
                  />
                </div>

                <!-- Sales Order (SO) -->
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                    SALES ORDER (SO)
                  </label>
                  <input
                    type="text"
                    v-model="fcSelectedSo"
                    placeholder="Auto-mapped from QA device_tested..."
                    readonly
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono font-bold cursor-not-allowed select-all"
                  />
                </div>
              </div>
            </div>

            <!-- 3. EXECUTION CONTROLS & 4-STAGE PROGRESS WORKBENCH -->
            <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
              <!-- Serial Port Selection & Connection Row (Placed directly above Action Controls) -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Select Port button -->
                  <button
                    v-if="!fcSerialPort"
                    type="button"
                    @click="fcSelectSerialPort"
                    class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-900/20 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <i class="fa-solid fa-plug"></i>
                    <span>Select Port</span>
                  </button>

                  <!-- Connect button -->
                  <button
                    v-if="fcSerialPort && !fcSerialConnected"
                    type="button"
                    @click="fcConnectSerial(fcSerialPort)"
                    :disabled="fcSerialConnecting || fcIsAutoReconnecting"
                    class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/20 flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                  >
                    <i class="fa-solid fa-link" :class="{ 'animate-spin': fcSerialConnecting || fcIsAutoReconnecting }"></i>
                    <span>{{ fcIsAutoReconnecting ? 'Reconnecting...' : 'Connect' }}</span>
                  </button>

                  <!-- Disconnect button -->
                  <button
                    v-if="fcSerialConnected"
                    type="button"
                    @click="fcDisconnectSerial(true)"
                    class="px-3.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <i class="fa-solid fa-link-slash"></i>
                    <span>Disconnect</span>
                  </button>

                  <!-- Change Port button -->
                  <button
                    v-if="fcSerialPort"
                    type="button"
                    @click="fcSelectSerialPort"
                    :disabled="fcSerialConnected || isRunningFinalConfig"
                    class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition disabled:opacity-40"
                  >
                    <i class="fa-solid fa-rotate"></i>
                    <span>Change Port</span>
                  </button>

                  <!-- Baud Rate Select -->
                  <div class="flex items-center gap-1.5 ml-2">
                    <label class="text-[11px] text-slate-400 font-medium">Baud:</label>
                    <select
                      v-model.number="fcSerialConfig.baudRate"
                      :disabled="fcSerialConnected || isRunningFinalConfig"
                      class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition disabled:opacity-50"
                    >
                      <option :value="9600">9600 bps</option>
                      <option :value="19200">19200 bps</option>
                      <option :value="38400">38400 bps</option>
                      <option :value="57600">57600 bps</option>
                      <option :value="115200">115200 bps</option>
                    </select>
                  </div>

                  <!-- Signals DTR / RTS -->
                  <div class="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      @click="fcToggleDTR"
                      :disabled="!fcSerialConnected"
                      class="px-2 py-1 rounded text-[10px] font-mono font-bold border transition cursor-pointer disabled:opacity-30"
                      :class="fcSerialSignals.dtr ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'"
                      title="Toggle Data Terminal Ready"
                    >
                      DTR: {{ fcSerialSignals.dtr ? '1' : '0' }}
                    </button>
                    <button
                      type="button"
                      @click="fcToggleRTS"
                      :disabled="!fcSerialConnected"
                      class="px-2 py-1 rounded text-[10px] font-mono font-bold border transition cursor-pointer disabled:opacity-30"
                      :class="fcSerialSignals.rts ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'"
                      title="Toggle Request To Send"
                    >
                      RTS: {{ fcSerialSignals.rts ? '1' : '0' }}
                    </button>
                  </div>
                </div>

                <!-- Port Status Badge -->
                <div
                  class="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition"
                  :class="fcSerialConnected
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : (fcIsAutoReconnecting
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : (fcSerialPort
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'))"
                >
                  <span
                    class="w-2 h-2 rounded-full"
                    :class="fcSerialConnected ? 'bg-emerald-400 animate-ping' : (fcIsAutoReconnecting ? 'bg-amber-400 animate-ping' : (fcSerialPort ? 'bg-blue-400' : 'bg-slate-500'))"
                  ></span>
                  <i :class="fcSerialConnected ? 'fa-solid fa-link' : (fcIsAutoReconnecting ? 'fa-solid fa-arrows-rotate animate-spin text-amber-400' : (fcSerialPort ? 'fa-solid fa-microchip' : 'fa-solid fa-plug-circle-xmark'))"></i>
                  <span class="font-mono text-xs">{{ fcSerialPortInfo || 'No Port Selected' }} {{ fcSerialConnected ? '(Connected)' : (fcIsAutoReconnecting ? '(Reconnecting...)' : (fcSerialPort ? '(Ready)' : '')) }}</span>
                </div>
              </div>

              <!-- Top Actions: Run, Reset, Abort & Verdict Banner -->
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-3 flex-wrap">
                  <!-- START BUTTON -->
                  <button
                    type="button"
                    @click="startFinalConfig"
                    :disabled="!fcSerialConnected || isRunningFinalConfig || finalVerdict === 'FAIL'"
                    class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i class="fa-solid" :class="isRunningFinalConfig ? 'fa-spinner animate-spin' : 'fa-play'"></i>
                    <span>{{ isRunningFinalConfig ? 'EXECUTING...' : 'START' }}</span>
                  </button>

                  <!-- RESET BUTTON -->
                  <button
                    type="button"
                    @click="resetFinalConfig"
                    :disabled="isRunningFinalConfig"
                    class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-40"
                  >
                    <i class="fa-solid fa-arrows-rotate"></i>
                    <span>Reset</span>
                  </button>

                  <!-- ABORT BUTTON -->
                  <button
                    v-if="isRunningFinalConfig"
                    type="button"
                    @click="abortFinalConfig"
                    class="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition"
                  >
                    <i class="fa-solid fa-hand"></i>
                    <span>Abort</span>
                  </button>

                  <!-- DEBUG MODE SLIDE SWITCH -->
                  <div class="h-6 w-px bg-slate-800 mx-1"></div>
                  <label class="relative inline-flex items-center cursor-pointer select-none gap-2">
                    <input type="checkbox" v-model="fcDebugMode" class="sr-only peer" />
                    <div class="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600 border border-slate-700"></div>
                    <span class="text-xs font-bold text-slate-300">Debug Mode</span>
                  </label>
                </div>

                <!-- Overall Verdict Badge -->
                <div class="flex items-center gap-3">
                  <div
                    class="px-4 py-2 rounded-xl border flex items-center gap-3 shadow-lg"
                    :class="finalVerdict === 'PASS'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : (finalVerdict === 'FAIL'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400')"
                  >
                    <div class="text-xl">
                      <i :class="finalVerdict === 'PASS' ? 'fa-solid fa-circle-check text-emerald-400' : (finalVerdict === 'FAIL' ? 'fa-solid fa-circle-xmark text-rose-400' : 'fa-solid fa-circle-dot text-slate-600')"></i>
                    </div>
                    <div>
                      <div class="text-xl font-black font-mono tracking-wider">
                        {{ finalVerdict === 'PASS' ? 'PASS' : (finalVerdict === 'FAIL' ? 'FAIL' : 'READY') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Main Visual Progress Bar (0% - 100%) -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs font-mono font-bold">
                  <span class="text-slate-300 flex items-center gap-2">
                    <span class="text-cyan-400 font-mono font-bold">PROGRESS: {{ fcProgress }}%</span>
                    <span v-if="fcStatusMessage" class="text-slate-400 font-normal text-xs truncate">({{ fcStatusMessage }})</span>
                  </span>
                </div>
                <div class="w-full h-6 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative p-0.5 shadow-inner">
                  <div
                    class="h-full transition-all duration-300 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white tracking-wider"
                    :class="finalVerdict === 'FAIL'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-lg shadow-rose-950/50'
                      : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 shadow-lg shadow-cyan-950/50'"
                    :style="{ width: fcProgress + '%' }"
                  ></div>
                </div>
              </div>

              <!-- 4-Stage Step Cards Grid -->
              <div v-show="fcDebugMode" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <!-- STAGE 1: 0% -> 25% -->
                <div
                  class="p-4 rounded-xl border transition-all"
                  :class="currentStage === 1
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                    : (currentStage > 1
                      ? 'bg-slate-950/80 border-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800/80')"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">STAGE 1 (0-25%)</span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                      :class="stage1Status === 'PASS'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : (stage1Status === 'FAIL'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : (stage1Status === 'RUNNING'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700'))"
                    >
                      {{ stage1Status }}
                    </span>
                  </div>
                  <h4 class="text-xs font-bold text-white mb-2">Hardware ID & SO Check</h4>
                  <div class="space-y-1 text-[11px] font-mono">
                    <div class="flex justify-between text-slate-400">
                      <span>SN (259):</span>
                      <span class="text-white font-bold">{{ fcHardwareInfo.serialNumber || '-' }}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>DevEUI (27):</span>
                      <span class="text-cyan-300">{{ fcHardwareInfo.devEui || '-' }}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>FW (5) / Type (103):</span>
                      <span class="text-slate-300">{{ fcHardwareInfo.firmwareVersion || '-' }} / {{ fcHardwareInfo.sensorType || '-' }}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>HW (9):</span>
                      <span class="text-cyan-300 font-bold">{{ fcHardwareInfo.hwVersion || '-' }}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>Item Code (386):</span>
                      <span class="text-slate-300">{{ fcHardwareInfo.itemCode || '-' }}</span>
                    </div>
                    <div class="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>device_tested SO:</span>
                      <span
                        class="font-bold"
                        :class="fcSoCheckStatus === 'MATCH' ? 'text-emerald-400' : (fcSoCheckStatus === 'MISMATCH' ? 'text-rose-400' : 'text-slate-500')"
                      >
                        {{ fcSoCheckStatus }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- STAGE 2: 25% -> 50% -->
                <div
                  class="p-4 rounded-xl border transition-all"
                  :class="currentStage === 2
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                    : (currentStage > 2
                      ? 'bg-slate-950/80 border-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800/80')"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">STAGE 2 (25-50%)</span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                      :class="stage2Status === 'PASS'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : (stage2Status === 'FAIL'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : (stage2Status === 'RUNNING'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700'))"
                    >
                      {{ stage2Status }}
                    </span>
                  </div>
                  <h4 class="text-xs font-bold text-white mb-2">Write Preset & AppKey</h4>
                  <div class="space-y-1 text-[11px] font-mono">
                    <div class="flex justify-between text-slate-400">
                      <span>Preset Regs (>=303):</span>
                      <span class="text-white font-bold">{{ fcWrittenRegsCount }} / {{ fcTotalWriteRegsCount }} written</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>LoRa AppKey (274):</span>
                      <span
                        class="font-bold"
                        :class="fcAppKeyWriteStatus === 'WRITTEN' ? 'text-emerald-400' : (fcAppKeyWriteStatus === 'FAIL' ? 'text-rose-400' : 'text-slate-500')"
                      >
                        {{ fcAppKeyWriteStatus }} (8 words)
                      </span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>Write Method:</span>
                      <span class="text-cyan-300">Modbus FC 16</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>EEPROM Settle:</span>
                      <span class="text-slate-300">{{ stage2Settled ? '300ms OK' : 'Waiting' }}</span>
                    </div>
                  </div>
                </div>

                <!-- STAGE 3: 50% -> 75% -->
                <div
                  class="p-4 rounded-xl border transition-all"
                  :class="currentStage === 3
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                    : (currentStage > 3
                      ? 'bg-slate-950/80 border-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800/80')"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">STAGE 3 (50-75%)</span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                      :class="stage3Status === 'PASS'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : (stage3Status === 'FAIL'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : (stage3Status === 'RUNNING'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700'))"
                    >
                      {{ stage3Status }}
                    </span>
                  </div>
                  <h4 class="text-xs font-bold text-white mb-2">Read Full Memory Map</h4>
                  <div class="space-y-1 text-[11px] font-mono">
                    <div class="flex justify-between text-slate-400">
                      <span>Read Registers:</span>
                      <span class="text-white font-bold">{{ fcReadBackRegsCount }} / {{ fcTotalMemmapRegsCount }}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>Polling Function:</span>
                      <span class="text-cyan-300">Modbus FC 03 Chunk</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>Snapshot Memory:</span>
                      <span class="text-slate-300">{{ stage3Status === 'PASS' ? 'Captured' : 'Pending' }}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>Auto-Reconnect:</span>
                      <span class="text-emerald-400">Guard Active</span>
                    </div>
                  </div>
                </div>

                <!-- STAGE 4: 75% -> 100% -->
                <div
                  class="p-4 rounded-xl border transition-all"
                  :class="currentStage === 4
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                    : (currentStage > 4 || finalVerdict !== 'NONE'
                      ? 'bg-slate-950/80 border-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800/80')"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">STAGE 4 (75-100%)</span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                      :class="stage4Status === 'PASS'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : (stage4Status === 'FAIL'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : (stage4Status === 'RUNNING'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700'))"
                    >
                      {{ stage4Status }}
                    </span>
                  </div>
                  <h4 class="text-xs font-bold text-white mb-2">Automated QA Verdict</h4>
                  <div class="space-y-1 text-[11px] font-mono">
                    <div class="flex justify-between text-slate-400">
                      <span>Compared Regs:</span>
                      <span class="text-white font-bold">{{ fcAuditRegisters.length }} regs</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>Mismatch Count:</span>
                      <span
                        class="font-bold"
                        :class="fcMismatchCount === 0 ? 'text-emerald-400' : 'text-rose-400'"
                      >
                        {{ fcMismatchCount }}
                      </span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>DB Persistence:</span>
                      <span class="text-purple-300">{{ fcDbSaved ? 'Saved to DB' : 'Pending' }}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                      <span>Tables:</span>
                      <span class="text-slate-400">final_config_sn / regs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. LIVE REGISTER AUDIT GRID (TABULATOR 6.X) -->
            <div v-show="fcDebugMode" class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <!-- Grid Toolbar -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3 flex-wrap">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-table-list text-cyan-400"></i>
                    <h3 class="text-xs font-bold text-white uppercase tracking-wider">LIVE REGISTER AUDIT GRID</h3>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {{ filteredAuditRegisters.length }} of {{ fcAuditRegisters.length }} Registers
                  </span>

                  <!-- Status Filter Pills -->
                  <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      @click="auditStatusFilter = 'ALL'"
                      class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer"
                      :class="auditStatusFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'"
                    >
                      ALL
                    </button>
                    <button
                      type="button"
                      @click="auditStatusFilter = 'PASS'"
                      class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer"
                      :class="auditStatusFilter === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'"
                    >
                      PASS
                    </button>
                    <button
                      type="button"
                      @click="auditStatusFilter = 'FAIL'"
                      class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer"
                      :class="auditStatusFilter === 'FAIL' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'"
                    >
                      FAIL
                    </button>
                    <button
                      type="button"
                      @click="auditStatusFilter = 'NONE'"
                      class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer"
                      :class="auditStatusFilter === 'NONE' ? 'bg-slate-700 text-slate-300' : 'text-slate-400 hover:text-white'"
                    >
                      NONE
                    </button>
                  </div>
                </div>

                <!-- Export & Search Actions -->
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Search input -->
                  <div class="relative">
                    <input
                      type="text"
                      v-model="auditSearchQuery"
                      placeholder="Search register..."
                      class="px-3 py-1.5 pl-8 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition w-44"
                    />
                    <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-500 text-xs"></i>
                  </div>

                  <!-- Export CSV -->
                  <button
                    type="button"
                    @click="exportAuditCsv"
                    :disabled="fcAuditRegisters.length === 0"
                    class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                  >
                    <i class="fa-solid fa-file-csv text-emerald-400"></i>
                    <span>Export CSV</span>
                  </button>

                  <!-- Export XLSX -->
                  <button
                    type="button"
                    @click="exportAuditXlsx"
                    :disabled="fcAuditRegisters.length === 0"
                    class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                  >
                    <i class="fa-solid fa-file-excel text-cyan-400"></i>
                    <span>Export XLSX</span>
                  </button>
                </div>
              </div>

              <!-- Tabulator Table Mount Element -->
              <div class="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <div id="final-config-device-table" class="w-full"></div>
              </div>
            </div>

            <!-- 5. UART LOG TERMINAL DRAWER -->
            <div v-show="fcDebugMode" class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-terminal text-cyan-400"></i>
                  <h3 class="text-xs font-bold text-white uppercase tracking-wider">HARDWARE UART COMMUNICATION LOGS</h3>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="fcCopySerialLogs"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    <i class="fa-solid fa-copy mr-1"></i>Copy
                  </button>
                  <button
                    type="button"
                    @click="fcClearSerialLogs"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    <i class="fa-solid fa-trash mr-1"></i>Clear
                  </button>
                </div>
              </div>

              <div class="h-48 overflow-y-auto font-mono text-[11px] p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div v-if="fcSerialLogs.length === 0" class="text-slate-600 text-center py-6">
                  No UART communication packets recorded yet.
                </div>
                <div v-for="(log, idx) in fcSerialLogs" :key="idx" class="flex items-start gap-2 leading-relaxed">
                  <span class="text-slate-500 whitespace-nowrap">{{ log.time }}</span>
                  <span
                    class="px-1.5 py-0.2 rounded text-[9px] font-bold"
                    :class="log.tag === 'TX'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : (log.tag === 'RX'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : (log.tag === 'ERR'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-purple-500/20 text-purple-300'))"
                  >
                    {{ log.tag }}
                  </span>
                  <span class="text-slate-300 break-all">{{ log.message }}</span>
                </div>
              </div>
            </div>

          </div>
`;

export const FINAL_CONFIG_DEVICE_MODALS = `
  <!-- POPUP CẢNH BÁO THIẾT BỊ ĐÃ FINAL CONFIG PASS -->
  <div v-if="alreadyPassedModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
    <div class="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">Device Already Configured</h3>
          <p class="text-xs text-amber-400 font-semibold">Final Configuration Protection</p>
        </div>
      </div>
      <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div class="font-bold text-amber-300">Device has already passed Final Configuration!</div>
        <div v-if="alreadyPassedInfo" class="space-y-1 font-mono text-[11px] text-slate-400">
          <div>Serial Number: <span class="text-white font-bold">{{ alreadyPassedInfo.serial_number }}</span></div>
          <div v-if="alreadyPassedInfo.dev_eui">DevEUI: <span class="text-cyan-300">{{ alreadyPassedInfo.dev_eui }}</span></div>
          <div v-if="alreadyPassedInfo.so">Sales Order: <span class="text-slate-300">{{ alreadyPassedInfo.so }}</span></div>
          <div v-if="alreadyPassedInfo.tested_at">Passed At: <span class="text-emerald-400">{{ new Date(alreadyPassedInfo.tested_at).toLocaleString() }}</span></div>
        </div>
      </div>
      <div class="flex justify-end pt-2">
        <button
          type="button"
          @click="alreadyPassedModal = false"
          class="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg transition cursor-pointer"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  </div>
`;

export const FINAL_CONFIG_DEVICE_SCRIPT = `
function useFinalConfigDeviceModule(ctx) {
  const { showToast, authHeaders, activeFeature, copyText, currentUser } = ctx || {};
  const { ref, computed, watch, nextTick, onMounted, onUnmounted } = Vue;

  // ----------------------------------------------------------------------
  // 1. WEB SERIAL CONNECTION & HARDWARE AUTO-RECONNECT ENGINE
  // ----------------------------------------------------------------------
  // Protocol Timing & Progressive Retry Configuration (Spec Rule 1, 2, 3)
  const MODBUS_WRITE_TIMEOUT_MS = 3500;
  const INTER_WRITE_SETTLING_DELAY_MS = 600;
  const RETRY_BACKOFF_DELAYS = [800, 1500, 2500];

  // Progressive Read Retry & Speed Optimization (< 60s sleep limit)
  const MAX_READ_ATTEMPTS = 5;
  const READ_RETRY_BACKOFF_DELAYS = [50, 100, 200, 400];
  const INTER_READ_DELAY_MS = 35;

  const fcIsSerialSupported = ref(typeof navigator !== 'undefined' && 'serial' in navigator);
  const isSerialSupported = fcIsSerialSupported;
  const fcSerialPort = ref(null);
  const serialPort = fcSerialPort;
  const fcSerialConnected = ref(false);
  const serialConnected = fcSerialConnected;
  const fcSerialConnecting = ref(false);
  const serialConnecting = fcSerialConnecting;
  const fcIsAutoReconnecting = ref(false);
  const isAutoReconnecting = fcIsAutoReconnecting;
  const isWaitingReconnectOnAppKey = ref(false);
  const fcSerialPortInfo = ref('');
  const serialPortInfo = fcSerialPortInfo;
  const fcSerialConfig = ref({
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none',
    bufferSize: 255,
    timeoutMs: 3500, // Tăng từ 1200ms lên 3500ms
  });
  const serialConfig = fcSerialConfig;
  const fcSerialSignals = ref({ dtr: false, rts: false });
  const serialSignals = fcSerialSignals;
  const fcSerialStats = ref({
    txPackets: 0,
    rxPackets: 0,
    txBytes: 0,
    rxBytes: 0,
    errCount: 0,
  });
  const serialStats = fcSerialStats;
  const fcSerialLogs = ref([]);
  const serialLogs = fcSerialLogs;
  const fcShowTerminalLogs = ref(false);
  const showTerminalLogs = fcShowTerminalLogs;
  const alreadyPassedModal = ref(false);
  const alreadyPassedInfo = ref(null);

  let lastConnectedPortInfo = null;
  let autoReconnectTimer = null;
  let activeUartReader = null;
  let activeUartWriter = null;

  // Add communication log
  const addSerialLog = (tag, bytes, msg) => {
    const time = new Date().toLocaleTimeString('en-GB');
    let message = msg || '';
    if (bytes && bytes.length > 0) {
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ').toUpperCase();
      message = hex + (msg ? ' (' + msg + ')' : '');
    }
    serialLogs.value.unshift({ time, tag, message });
    if (serialLogs.value.length > 200) {
      serialLogs.value.pop();
    }
  };

  const copySerialLogs = () => {
    const text = serialLogs.value.map(l => '[' + l.time + '] [' + l.tag + '] ' + l.message).join('\\n');
    if (copyText) copyText(text);
  };

  const clearSerialLogs = () => {
    serialLogs.value = [];
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  // Safe stream lock release
  const safeCleanupUartPort = async () => {
    if (activeUartReader) {
      try {
        await activeUartReader.cancel();
      } catch (e) {}
      try {
        activeUartReader.releaseLock();
      } catch (e) {}
      activeUartReader = null;
    }
    if (activeUartWriter) {
      try {
        activeUartWriter.releaseLock();
      } catch (e) {}
      activeUartWriter = null;
    }
  };

  // Flush UART RX Buffer to drain stray/stale bytes before Modbus write or retry
  const flushUartRxBuffer = async (flushTimeoutMs = 100) => {
    if (!serialPort.value || !serialPort.value.readable) return;
    await safeCleanupUartPort();
    try {
      // Pulse Hardware Handshake Signals (RTS/DTR toggle if supported) to reset transceiver state
      if (serialPort.value.setSignals) {
        try {
          await serialPort.value.setSignals({ requestToSend: false, dataTerminalReady: false });
          await new Promise(r => setTimeout(r, 5));
          await serialPort.value.setSignals({ requestToSend: true, dataTerminalReady: true });
        } catch (sigErr) {}
      }

      activeUartReader = serialPort.value.readable.getReader();
      const startTime = Date.now();
      while (Date.now() - startTime < flushTimeoutMs) {
        const remaining = Math.max(10, flushTimeoutMs - (Date.now() - startTime));
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('FLUSH_TIMEOUT')), remaining);
        });
        let res;
        try {
          res = await Promise.race([activeUartReader.read(), timeoutPromise]);
        } finally {
          clearTimeout(timeoutId);
        }
        if (res.done) break;
      }
    } catch (e) {
      if (activeUartReader) {
        try { await activeUartReader.cancel(); } catch (cancelErr) {}
      }
    } finally {
      if (activeUartReader) {
        try { activeUartReader.releaseLock(); } catch (releaseErr) {}
        activeUartReader = null;
      }
    }
    // RS485 line idle recovery (30ms)
    await new Promise(r => setTimeout(r, 30));
  };

  // Select COM Port
  const selectSerialPort = async () => {
    if (!isSerialSupported.value) {
      if (showToast) showToast('Web Serial API is not supported in this browser.', 'error');
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      if (!port) return;
      serialPort.value = port;
      const info = port.getInfo ? port.getInfo() : {};
      let desc = 'Serial COM Port';
      if (info.usbVendorId) {
        desc = 'VID: 0x' + info.usbVendorId.toString(16).toUpperCase() + ' PID: 0x' + (info.usbProductId ? info.usbProductId.toString(16).toUpperCase() : '');
        lastConnectedPortInfo = info;
      }
      serialPortInfo.value = desc;
      await connectSerial(port);
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        console.error('Serial port selection error:', err);
        addSerialLog('ERR', null, 'Select port error: ' + (err.message || err));
      }
    }
  };

  // Connect to Serial Port
  const connectSerial = async (targetPort) => {
    const p = targetPort || serialPort.value;
    if (!p) return;
    serialConnecting.value = true;
    try {
      await safeCleanupUartPort();
      const info = p.getInfo ? p.getInfo() : {};
      if (info.usbVendorId) {
        lastConnectedPortInfo = info;
      }
      await p.open({
        baudRate: Number(serialConfig.value.baudRate) || 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
        bufferSize: 255,
      });

      serialPort.value = p;
      serialConnected.value = true;
      isAutoReconnecting.value = false;
      addSerialLog('SYS', null, 'Connected @ ' + serialConfig.value.baudRate + ' bps, 8-N-1');
      if (showToast) showToast('Connected to COM port @ ' + serialConfig.value.baudRate + ' bps', 'success');

      if (p.setSignals) {
        try {
          await p.setSignals({
            dataTerminalReady: serialSignals.value.dtr,
            requestToSend: serialSignals.value.rts,
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Serial connection error:', err);
      addSerialLog('ERR', null, 'Connect failed: ' + (err.message || err));
      if (showToast) showToast('Failed to connect: ' + (err.message || err), 'error');
      serialConnected.value = false;
    } finally {
      serialConnecting.value = false;
    }
  };

  // Disconnect Serial Port
  const disconnectSerial = async (isManual = true) => {
    if (autoReconnectTimer) {
      clearTimeout(autoReconnectTimer);
      autoReconnectTimer = null;
    }
    await safeCleanupUartPort();
    if (serialPort.value) {
      try {
        await serialPort.value.close();
      } catch (e) {}
    }
    serialConnected.value = false;
    if (isManual) {
      if (isRunningFinalConfig.value) {
        abortRequested.value = true;
        isRunningFinalConfig.value = false;
      }
      isAutoReconnecting.value = false;
      isWaitingReconnectOnAppKey.value = false;
      serialPort.value = null;
      serialPortInfo.value = '';
      lastConnectedPortInfo = null;
      addSerialLog('SYS', null, 'Port disconnected by operator');
      if (showToast) showToast('Serial port disconnected', 'info');
    }
  };

  // Hardware Disconnect listener (Anti-Freeze & Reconnect Guard)
  const handleSerialDisconnect = async (event) => {
    console.warn('Web Serial hardware disconnect detected:', event.target);
    const wasConnected = serialConnected.value;
    addSerialLog('WARN', null, 'Hardware disconnected (USB reset / reboot detected). Cleaning up locks...');
    await disconnectSerial(false);
    if (wasConnected) {
      isAutoReconnecting.value = true;
      if (isRunningFinalConfig.value && currentStage.value === 2) {
        isWaitingReconnectOnAppKey.value = true;
        addSerialLog('WARN', null, 'COM port dropped during Stage 2 Flash write. Waiting for USB re-enumeration...');
        fcStatusMessage.value = 'USB disconnect detected during Flash write. Waiting for auto-reconnect...';
      }
      if (showToast) showToast('Serial disconnected. Waiting for USB re-enumeration...', 'warning');
      addSerialLog('SYS', null, 'Stream locks released. Auto-reconnect armed.');
    }
  };

  // Hardware Connect listener (Re-enumeration)
  const handleSerialConnect = async (event) => {
    console.log('Web Serial hardware connect detected:', event.target);
    if (isAutoReconnecting.value || (!serialConnected.value && lastConnectedPortInfo)) {
      const newPort = event.target || (navigator.serial && navigator.serial.getPorts ? (await navigator.serial.getPorts())[0] : null);
      if (!newPort) return;

      const newInfo = newPort.getInfo ? newPort.getInfo() : {};
      const isMatching = !lastConnectedPortInfo || !lastConnectedPortInfo.usbVendorId ||
        (newInfo.usbVendorId === lastConnectedPortInfo.usbVendorId &&
         newInfo.usbProductId === lastConnectedPortInfo.usbProductId);

      if (isMatching) {
        addSerialLog('SYS', null, 'USB device re-detected. Auto-reconnecting in 600ms...');
        if (showToast) showToast('USB device re-detected. Auto-reconnecting...', 'info');

        if (autoReconnectTimer) clearTimeout(autoReconnectTimer);
        autoReconnectTimer = setTimeout(async () => {
          try {
            serialPort.value = newPort;
            let desc = 'Serial COM Port';
            if (newInfo.usbVendorId) {
              desc = 'VID: 0x' + newInfo.usbVendorId.toString(16).toUpperCase() + ' PID: 0x' + (newInfo.usbProductId ? newInfo.usbProductId.toString(16).toUpperCase() : '');
            }
            serialPortInfo.value = desc;
            await connectSerial(newPort);
            isAutoReconnecting.value = false;
            if (isWaitingReconnectOnAppKey.value) {
              addSerialLog('SYS', null, 'COM port reconnected during Stage 2. Resuming probe recovery...');
              isWaitingReconnectOnAppKey.value = false;
            }
            addSerialLog('SYS', null, 'Auto-reconnected successfully to ' + desc);
            if (showToast) showToast('COM port auto-reconnected successfully', 'success');
          } catch (err) {
            console.warn('Auto-reconnect attempt 1 failed, retrying in 1000ms...', err);
            setTimeout(async () => {
              try {
                if (serialConnected.value) return;
                await connectSerial(newPort);
                isAutoReconnecting.value = false;
                if (isWaitingReconnectOnAppKey.value) {
                  addSerialLog('SYS', null, 'COM port reconnected during Stage 2. Resuming probe recovery...');
                  isWaitingReconnectOnAppKey.value = false;
                }
                addSerialLog('SYS', null, 'Auto-reconnected successfully on retry');
                if (showToast) showToast('COM port auto-reconnected successfully', 'success');
              } catch (retryErr) {
                console.error('Auto-reconnect retry failed:', retryErr);
                isAutoReconnecting.value = false;
                isWaitingReconnectOnAppKey.value = false;
                addSerialLog('ERR', null, 'Auto-reconnect failed: ' + (retryErr.message || retryErr));
                if (showToast) showToast('Auto-reconnect failed. Click Connect to retry.', 'error');
              }
            }, 1000);
          }
        }, 600);
      }
    }
  };

  const toggleDTR = async () => {
    if (!serialPort.value || !serialConnected.value) return;
    serialSignals.value.dtr = !serialSignals.value.dtr;
    try {
      if (serialPort.value.setSignals) {
        await serialPort.value.setSignals({ dataTerminalReady: serialSignals.value.dtr });
      }
    } catch (e) {}
  };

  const toggleRTS = async () => {
    if (!serialPort.value || !serialConnected.value) return;
    serialSignals.value.rts = !serialSignals.value.rts;
    try {
      if (serialPort.value.setSignals) {
        await serialPort.value.setSignals({ requestToSend: serialSignals.value.rts });
      }
    } catch (e) {}
  };

  // ----------------------------------------------------------------------
  // 1.5. PATIENCE WAIT & USB RECONNECT ENGINE (Spec Section 3.1 & 3.2)
  // ----------------------------------------------------------------------
  const isPortDisconnectedError = (err) => {
    if (!err) return false;
    const msg = String(err?.message || err).toLowerCase();
    const name = String(err?.name || '').toLowerCase();
    return (
      name === 'networkerror' ||
      msg.includes('networkerror') ||
      msg.includes('serial port is not open') ||
      msg.includes('not open or readable') ||
      msg.includes('not open or writable') ||
      msg.includes('the device has been lost') ||
      msg.includes('device lost') ||
      msg.includes('closed') ||
      msg.includes('disconnected') ||
      msg.includes('cannot read properties of null') ||
      msg.includes('underlying stream has been closed')
    );
  };

  const waitForPortReconnection = async (timeoutMs = 15000) => {
    if (serialConnected.value && serialPort.value && serialPort.value.readable && serialPort.value.writable) {
      return true;
    }

    const startWait = Date.now();
    addSerialLog('WARN', null, '[Patience Wait] USB port disconnected/resetting. Waiting up to ' + Math.round(timeoutMs / 1000) + 's for reconnect...');
    fcStatusMessage.value = 'USB reset detected. Patience waiting for USB reconnect (max ' + Math.round(timeoutMs / 1000) + 's)...';

    return new Promise((resolve, reject) => {
      let checkInterval = null;
      let timeoutTimer = null;

      const cleanup = () => {
        if (checkInterval) clearInterval(checkInterval);
        if (timeoutTimer) clearTimeout(timeoutTimer);
      };

      checkInterval = setInterval(() => {
        if (abortRequested.value) {
          cleanup();
          reject(new Error('Operation aborted by operator'));
          return;
        }
        if (serialConnected.value && serialPort.value && serialPort.value.readable && serialPort.value.writable) {
          cleanup();
          const duration = Date.now() - startWait;
          addSerialLog('SYS', null, '[Patience Wait] USB port re-enumerated & reconnected successfully after ' + duration + 'ms. Resuming...');
          resolve(true);
        }
      }, 100);

      timeoutTimer = setTimeout(() => {
        cleanup();
        reject(new Error('USB reconnection patience wait timeout (' + timeoutMs + 'ms) exceeded. Port did not recover.'));
      }, timeoutMs);
    });
  };

  // ----------------------------------------------------------------------
  // 2. MODBUS RTU COMMUNICATION PROTOCOL (FC 03, FC 16)
  // ----------------------------------------------------------------------
  const calcModbusCRC16 = (bytes) => {
    let crc = 0xFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i];
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x0001) !== 0) {
          crc = (crc >> 1) ^ 0xA001;
        } else {
          crc = crc >> 1;
        }
      }
    }
    return crc;
  };

  const buildModbusReadReq = (slave, fc, reg, numreg) => {
    const s = Number(slave) & 0xFF;
    const f = Number(fc) & 0xFF;
    const r = Number(reg);
    const n = Number(numreg);
    const frame = [s, f, (r >> 8) & 0xFF, r & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
    const crc = calcModbusCRC16(frame);
    frame.push(crc & 0xFF);
    frame.push((crc >> 8) & 0xFF);
    return new Uint8Array(frame);
  };

  // Read Modbus Registers via FC 03
  const readModbusRegistersFromPort = async (slave, reg, numreg, timeoutMs = 1200, maybeTimeoutMs) => {
    let actualReg = reg;
    let actualNumreg = numreg;
    let actualTimeout = timeoutMs;
    if (maybeTimeoutMs !== undefined) {
      // Support (slave, fc, reg, numreg, timeoutMs)
      actualReg = numreg;
      actualNumreg = timeoutMs;
      actualTimeout = maybeTimeoutMs;
    }

    const patienceTimeoutMs = currentPreset.value?.usb_reconnect_patience_timeout_ms || 15000;
    const enablePatience = currentPreset.value?.enable_usb_reconnect_patience !== undefined
      ? Boolean(currentPreset.value.enable_usb_reconnect_patience)
      : true;

    if (!serialPort.value || !serialPort.value.readable || !serialPort.value.writable || !serialConnected.value || isAutoReconnecting.value) {
      if (enablePatience) {
        await waitForPortReconnection(patienceTimeoutMs);
        await flushUartRxBuffer();
      } else {
        throw new Error('Serial port is not open or readable');
      }
    }
    await safeCleanupUartPort();

    const req = buildModbusReadReq(slave, 3, actualReg, actualNumreg);
    activeUartWriter = serialPort.value.writable.getWriter();
    try {
      await activeUartWriter.write(req);
      serialStats.value.txPackets++;
      serialStats.value.txBytes += req.length;
      addSerialLog('TX', req, 'Read Reg ' + actualReg + ' (' + actualNumreg + ' regs)');
    } finally {
      try { activeUartWriter.releaseLock(); } catch (e) {}
      activeUartWriter = null;
    }

    activeUartReader = serialPort.value.readable.getReader();
    const expectedBytes = 3 + actualNumreg * 2 + 2;
    const rxBuffer = [];
    const startTime = Date.now();

    try {
      while (rxBuffer.length < expectedBytes && (Date.now() - startTime) < actualTimeout) {
        const remaining = Math.max(10, actualTimeout - (Date.now() - startTime));
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), remaining);
        });
        let res;
        try {
          res = await Promise.race([activeUartReader.read(), timeoutPromise]);
        } finally {
          clearTimeout(timeoutId);
        }
        const { value, done } = res;
        if (done) break;
        if (value) {
          for (let i = 0; i < value.length; i++) rxBuffer.push(value[i]);
        }
      }
    } catch (err) {
      serialStats.value.errCount++;
      if (activeUartReader) {
        try { await activeUartReader.cancel(); } catch (e) {}
      }
      throw err;
    } finally {
      if (activeUartReader) {
        try { activeUartReader.releaseLock(); } catch (e) {}
        activeUartReader = null;
      }
    }

    if (rxBuffer.length < 5) {
      serialStats.value.errCount++;
      throw new Error('No response received from device for register ' + actualReg);
    }

    serialStats.value.rxPackets++;
    serialStats.value.rxBytes += rxBuffer.length;
    addSerialLog('RX', rxBuffer, 'Read Reg ' + actualReg + ' response');

    // CRC check
    const dataLen = rxBuffer.length;
    const calcCrc = calcModbusCRC16(rxBuffer.slice(0, dataLen - 2));
    const rxCrc = rxBuffer[dataLen - 2] | (rxBuffer[dataLen - 1] << 8);
    if (calcCrc !== rxCrc) {
      serialStats.value.errCount++;
      throw new Error('CRC error for register ' + actualReg);
    }

    const byteCount = rxBuffer[2];
    return rxBuffer.slice(3, 3 + byteCount);
  };

  // Write Modbus Registers via FC 16 (0x10 - Write Multiple Registers)
  const writeModbusRegistersToPort = async (slave, fc, reg, numreg, dataBytes, timeoutMs = 3500) => {
    // Support both (slave, fc, reg, numreg, dataBytes, timeoutMs) and (slave, reg, numreg, dataBytes, timeoutMs)
    let actualReg = reg;
    let actualNumreg = numreg;
    let actualData = dataBytes;
    let actualTimeout = timeoutMs;
    if (Array.isArray(numreg) || (numreg && typeof numreg === 'object' && 'length' in numreg)) {
      actualTimeout = dataBytes || 3500;
      actualData = numreg;
      actualNumreg = reg;
      actualReg = fc;
    }

    const patienceTimeoutMs = currentPreset.value?.usb_reconnect_patience_timeout_ms || 15000;
    const enablePatience = currentPreset.value?.enable_usb_reconnect_patience !== undefined
      ? Boolean(currentPreset.value.enable_usb_reconnect_patience)
      : true;

    if (!serialPort.value || !serialPort.value.readable || !serialPort.value.writable || !serialConnected.value || isAutoReconnecting.value) {
      if (enablePatience) {
        await waitForPortReconnection(patienceTimeoutMs);
        await flushUartRxBuffer();
      } else {
        throw new Error('Serial port is not open or writable');
      }
    }
    await safeCleanupUartPort();

    const s = Number(slave) & 0xFF;
    const r = Number(actualReg);
    const n = Number(actualNumreg);
    const byteCount = actualData.length;

    // Standard Modbus FC 16 (0x10): Mandatory for 100% write operations
    const frame = [
      s,
      0x10,
      (r >> 8) & 0xFF,
      r & 0xFF,
      (n >> 8) & 0xFF,
      n & 0xFF,
      byteCount,
      ...actualData,
    ];

    const crc = calcModbusCRC16(frame);
    frame.push(crc & 0xFF);
    frame.push((crc >> 8) & 0xFF);
    const req = new Uint8Array(frame);

    activeUartWriter = serialPort.value.writable.getWriter();
    try {
      await activeUartWriter.write(req);
      serialStats.value.txPackets++;
      serialStats.value.txBytes += req.length;
      addSerialLog('TX', req, 'Write Reg ' + actualReg + ' (FC 16)');
    } finally {
      try { activeUartWriter.releaseLock(); } catch (e) {}
      activeUartWriter = null;
    }

    activeUartReader = serialPort.value.readable.getReader();
    const expectedBytes = 8; // Slave (1), FC (1), Addr (2), RegCount (2), CRC (2)
    const rxBuffer = [];
    const startTime = Date.now();

    try {
      while (rxBuffer.length < expectedBytes && (Date.now() - startTime) < actualTimeout) {
        const remaining = Math.max(10, actualTimeout - (Date.now() - startTime));
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), remaining);
        });
        let res;
        try {
          res = await Promise.race([activeUartReader.read(), timeoutPromise]);
        } finally {
          clearTimeout(timeoutId);
        }
        const { value, done } = res;
        if (done) break;
        if (value) {
          for (let i = 0; i < value.length; i++) rxBuffer.push(value[i]);
        }
      }
    } catch (err) {
      serialStats.value.errCount++;
      if (activeUartReader) {
        try { await activeUartReader.cancel(); } catch (e) {}
      }
      throw err;
    } finally {
      if (activeUartReader) {
        try { activeUartReader.releaseLock(); } catch (e) {}
        activeUartReader = null;
      }
    }

    if (rxBuffer.length < 5) {
      serialStats.value.errCount++;
      throw new Error('No write response received for register ' + actualReg);
    }

    serialStats.value.rxPackets++;
    serialStats.value.rxBytes += rxBuffer.length;
    addSerialLog('RX', rxBuffer, 'Write Reg ' + actualReg + ' response');

    // Check Modbus exception (FC | 0x80)
    if (rxBuffer[1] & 0x80) {
      serialStats.value.errCount++;
      throw new Error('Modbus Exception Code ' + rxBuffer[2] + ' on register ' + actualReg);
    }

    if (rxBuffer.length < 8) {
      serialStats.value.errCount++;
      throw new Error('Incomplete write response for register ' + actualReg + ': expected 8 bytes, got ' + rxBuffer.length);
    }

    const calcCrc = calcModbusCRC16(rxBuffer.slice(0, 6));
    const rxCrc = rxBuffer[6] | (rxBuffer[7] << 8);
    if (calcCrc !== rxCrc) {
      serialStats.value.errCount++;
      throw new Error('CRC error on write response for register ' + actualReg);
    }

    return rxBuffer;
  };

  // Closed-Loop Write-Verification Handshake (Write-Then-Probe Polling)
  // Contract: Spec Section 3.2.A, 3.4 & Section 4.2
  const probeDeviceReadyAndVerified = async (
    slave,
    reg,
    numreg,
    expectedBytes,
    isWriteOnly,
    options = {}
  ) => {
    const patienceTimeoutMs = currentPreset.value?.usb_reconnect_patience_timeout_ms || 15000;
    const enablePatience = currentPreset.value?.enable_usb_reconnect_patience !== undefined
      ? Boolean(currentPreset.value.enable_usb_reconnect_patience)
      : true;

    const opts = {
      ...options,
      usbReconnectTimeoutMs: options.usbReconnectTimeoutMs || patienceTimeoutMs,
      enableUsbReconnectPatience: options.enableUsbReconnectPatience !== undefined ? options.enableUsbReconnectPatience : enablePatience,
      waitForPortReconnectionFn: options.waitForPortReconnectionFn || ((tMs) => waitForPortReconnection(tMs)),
      isPortConnectedFn: options.isPortConnectedFn || (() => Boolean(serialConnected.value && !isAutoReconnecting.value && serialPort.value?.readable && serialPort.value?.writable)),
      readModbusFn: options.readModbusFn || ((s, fc, r, n, t) => readModbusRegistersFromPort(s, fc, r, n, t)),
      flushBufferFn: options.flushBufferFn || ((t) => flushUartRxBuffer(t)),
      logFn: options.logFn || ((lvl, frame, msg) => addSerialLog(lvl, frame, msg)),
      statusMsgRef: options.statusMsgRef || fcStatusMessage,
    };

    const isAppKeyOrHeavy = Boolean(reg === 274 || opts.isAppKey || opts.isFlashHeavy);
    const enableProbe = opts.enableProbe !== undefined
      ? Boolean(opts.enableProbe)
      : (opts.enable_probe_verification !== undefined ? Boolean(opts.enable_probe_verification) : true);
    const effectiveTimeout = isAppKeyOrHeavy
      ? (opts.appkeyProbeTimeoutMs || opts.appkey_probe_timeout_ms || opts.maxProbeTimeoutMs || opts.max_probe_timeout_ms || 10000)
      : (opts.maxProbeTimeoutMs || opts.max_probe_timeout_ms || 10000);
    const safeReg = opts.safeProbeRegister !== undefined
      ? Number(opts.safeProbeRegister)
      : (opts.safe_probe_register !== undefined ? Number(opts.safe_probe_register) : 0);
    const guardSilence = opts.guardSilenceMs !== undefined
      ? Number(opts.guardSilenceMs)
      : (opts.guard_silence_ms !== undefined ? Number(opts.guard_silence_ms) : (isAppKeyOrHeavy ? 150 : 30));
    const enableUsbPatience = opts.enableUsbReconnectPatience;
    const usbReconnectTimeoutMs = opts.usbReconnectTimeoutMs;

    if (!enableProbe) {
      if (opts.logFn) opts.logFn('INFO', null, 'Settling MCU (600ms) for Flash/EEPROM persistence (Probe disabled)...');
      if (opts.statusMsgRef) opts.statusMsgRef.value = 'Device settling/retrying... MCU settling (600ms) for Flash/EEPROM storage...';
      await new Promise((r) => setTimeout(r, 600));
      return { success: true, elapsedMs: 600, attempts: 1 };
    }

    if (guardSilence > 0) {
      await new Promise((r) => setTimeout(r, guardSilence));
    }

    const isAdaptive = opts.enableAdaptiveProbe !== undefined
      ? Boolean(opts.enableAdaptiveProbe)
      : (opts.enable_adaptive_probe !== undefined ? Boolean(opts.enable_adaptive_probe) : true);

    const getAdaptiveInterval = (elapsedMs) => {
      if (!isAdaptive) return opts.probeIntervalMs || opts.probe_interval_ms || 50;
      if (elapsedMs < 1000) return 100;
      if (elapsedMs < 4000) return 300;
      return 800;
    };

    const invokeRead = async (s, r, n, t) => {
      if (!opts.readModbusFn) throw new Error('readModbusFn not provided in options');
      return await opts.readModbusFn(s, 3, r, n, t);
    };

    const startTime = Date.now();
    let totalFrozenMs = 0;
    let attempts = 0;
    let lastMismatch = false;

    while ((Date.now() - startTime - totalFrozenMs) < effectiveTimeout) {
      if (enableUsbPatience && opts.isPortConnectedFn && !opts.isPortConnectedFn()) {
        if (opts.waitForPortReconnectionFn) {
          const freezeStart = Date.now();
          await opts.waitForPortReconnectionFn(usbReconnectTimeoutMs);
          totalFrozenMs += (Date.now() - freezeStart);
          if (opts.flushBufferFn) await opts.flushBufferFn(50);
          continue;
        }
      }

      attempts++;
      const elapsedNow = Date.now() - startTime - totalFrozenMs;
      const remainingTime = Math.max(50, effectiveTimeout - elapsedNow);
      const probeTimeout = Math.min(Math.max(300, remainingTime), 500);

      try {
        if (isWriteOnly) {
          const readBytes = await invokeRead(slave, safeReg, 1, probeTimeout);
          if (readBytes && readBytes.length >= 2) {
            return { success: true, elapsedMs: Date.now() - startTime, attempts };
          }
        } else {
          const readBytes = await invokeRead(slave, reg, numreg, probeTimeout);
          let match = false;
          if (readBytes && expectedBytes && readBytes.length === expectedBytes.length) {
            match = true;
            for (let b = 0; b < expectedBytes.length; b++) {
              if (readBytes[b] !== expectedBytes[b]) { match = false; break; }
            }
          }
          if (match) {
            return { success: true, elapsedMs: Date.now() - startTime, attempts };
          } else {
            lastMismatch = true;
          }
        }
      } catch (probeErr) {
        if (enableUsbPatience && isPortDisconnectedError(probeErr)) {
          if (opts.waitForPortReconnectionFn) {
            const freezeStart = Date.now();
            await opts.waitForPortReconnectionFn(usbReconnectTimeoutMs);
            totalFrozenMs += (Date.now() - freezeStart);
            if (opts.flushBufferFn) await opts.flushBufferFn(50);
            continue;
          }
        }
      }

      const enableRecovery = opts.uartStallRecoveryFlush !== undefined
        ? Boolean(opts.uartStallRecoveryFlush)
        : (opts.uart_stall_recovery_flush !== undefined ? Boolean(opts.uart_stall_recovery_flush) : true);
      if (enableRecovery) {
        try {
          if (opts.flushBufferFn) await opts.flushBufferFn(50);
        } catch (flushErr) {}
      }

      const currentInterval = getAdaptiveInterval(Date.now() - startTime - totalFrozenMs);
      const sleepTime = Math.min(currentInterval, Math.max(10, effectiveTimeout - (Date.now() - startTime - totalFrozenMs)));
      await new Promise((r) => setTimeout(r, sleepTime));
    }

    if (lastMismatch) {
      throw new Error('Device busy / probe timeout after ' + (Date.now() - startTime - totalFrozenMs) + 'ms for register ' + reg + ' (data mismatch)');
    }
    throw new Error('Device busy / probe timeout after ' + (Date.now() - startTime - totalFrozenMs) + 'ms for register ' + reg + (isAppKeyOrHeavy ? ' (AppKey/Flash-heavy timeout ' + effectiveTimeout + 'ms reached)' : ''));
  };

  // Helper: Encode Value String to Modbus Bytes
  const encodeModbusWriteValue = (valStr, format, endianness, numreg = 1) => {
    const bytesNeeded = (Number(numreg) || 1) * 2;
    const buffer = new ArrayBuffer(bytesNeeded);
    const view = new DataView(buffer);
    const fmt = (format || '').toLowerCase();

    if (fmt === 'hex') {
      const cleanHex = String(valStr || '').replace(/[^0-9a-fA-F]/g, '');
      const bytes = [];
      for (let i = 0; i < cleanHex.length; i += 2) {
        bytes.push(parseInt(cleanHex.substr(i, 2), 16) || 0);
      }
      while (bytes.length < bytesNeeded) bytes.push(0);
      return bytes.slice(0, bytesNeeded);
    }

    if (fmt === 'string' || fmt === 'ascii') {
      const bytes = [];
      const s = String(valStr || '');
      for (let i = 0; i < s.length && i < bytesNeeded; i++) {
        bytes.push(s.charCodeAt(i));
      }
      while (bytes.length < bytesNeeded) bytes.push(0);
      return bytes;
    }

    if (numreg === 1) {
      const num = parseInt(valStr, 10) || 0;
      if (fmt === 'int' || fmt === 'int16') {
        view.setInt16(0, num, false);
      } else {
        view.setUint16(0, num, false);
      }
      const res = Array.from(new Uint8Array(buffer));
      if (endianness === 'Little-Endian' || endianness === 'BA') {
        res.reverse();
      }
      return res;
    } else if (numreg === 2) {
      const num = parseFloat(valStr) || 0;
      if (fmt === 'float' || fmt === 'float32') {
        view.setFloat32(0, num, false);
      } else if (fmt === 'int' || fmt === 'int32') {
        view.setInt32(0, parseInt(valStr, 10) || 0, false);
      } else {
        view.setUint32(0, parseInt(valStr, 10) || 0, false);
      }
      const raw = Array.from(new Uint8Array(buffer));
      if (endianness === 'Little-Endian' || endianness === 'DCBA') {
        return [raw[3], raw[2], raw[1], raw[0]];
      } else if (endianness === 'Mid-Big' || endianness === 'BADC') {
        return [raw[1], raw[0], raw[3], raw[2]];
      } else if (endianness === 'Mid-Little' || endianness === 'CDAB') {
        return [raw[2], raw[3], raw[0], raw[1]];
      }
      return raw;
    }
    return new Array(bytesNeeded).fill(0);
  };

  // Helper: Decode Modbus Payload
  const decodeModbusPayload = (dataBytes, format, endianness) => {
    if (!dataBytes || dataBytes.length === 0) return '';
    const len = dataBytes.length;
    const fmt = (format || '').toLowerCase();

    if (fmt === 'hex') {
      return dataBytes.map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('');
    }

    if (fmt === 'string' || fmt === 'ascii') {
      return String.fromCharCode(...dataBytes.filter(x => x >= 32 && x <= 126)).trim();
    }

    if (len === 2) {
      let b0 = dataBytes[0];
      let b1 = dataBytes[1];
      if (endianness === 'Little-Endian' || endianness === 'BA') {
        [b0, b1] = [b1, b0];
      }
      const u16 = (b0 << 8) | b1;
      if (fmt === 'int' || fmt === 'int16') {
        return String(u16 >= 0x8000 ? u16 - 0x10000 : u16);
      }
      return String(u16);
    }

    if (len === 4) {
      let [a, b, c, d] = dataBytes;
      let reordered = [a, b, c, d];
      if (endianness === 'Little-Endian' || endianness === 'DCBA') {
        reordered = [d, c, b, a];
      } else if (endianness === 'Mid-Big' || endianness === 'BADC') {
        reordered = [b, a, d, c];
      } else if (endianness === 'Mid-Little' || endianness === 'CDAB') {
        reordered = [c, d, a, b];
      }
      const u8 = new Uint8Array(reordered);
      const dv = new DataView(u8.buffer);
      if (fmt === 'float' || fmt === 'float32') {
        return String(Number(dv.getFloat32(0, false).toFixed(4)));
      } else if (fmt === 'int' || fmt === 'int32') {
        return String(dv.getInt32(0, false));
      } else {
        return String(dv.getUint32(0, false));
      }
    }

    return dataBytes.map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('');
  };

  // ----------------------------------------------------------------------
  // 3. REACTIVE STATE & FORM BINDING
  // ----------------------------------------------------------------------
  const fcSerialNumberInput = ref('');
  const serialNumberInput = fcSerialNumberInput;
  const fcSelectedSo = ref('');
  const selectedSo = fcSelectedSo;
  const fcSelectedItemCode = ref('');
  const selectedItemCode = fcSelectedItemCode;
  const fcSalesOrdersList = ref([]);
  const salesOrdersList = fcSalesOrdersList;
  const fcItemCodesList = ref([]);
  const itemCodesList = fcItemCodesList;
  const currentPreset = ref(null);
  const appKeyInput = ref('2B7E151628AED2A6ABF7158809CF4F3C');

  // Execution states
  const isRunningFinalConfig = ref(false);
  const abortRequested = ref(false);
  const fcProgress = ref(0);
  const currentStage = ref(0);
  const fcStatusMessage = ref('');
  const finalVerdict = ref('NONE'); // 'PASS' | 'FAIL' | 'NONE'

  // Hardware inspection data (Stage 1)
  const fcHardwareInfo = ref({
    serialNumber: '',
    devEui: '',
    firmwareVersion: '',
    hwVersion: '',
    shortFw: 1,
    sensorType: 0,
    itemCode: '',
    sku: '',
  });
  const fcSoCheckStatus = ref('NONE'); // 'MATCH' | 'MISMATCH' | 'NONE'
  const fcTraceabilityData = ref(null);

  // Stage 1 - 4 progress status
  const stage1Status = ref('IDLE'); // 'IDLE' | 'RUNNING' | 'PASS' | 'FAIL'
  const stage2Status = ref('IDLE');
  const stage3Status = ref('IDLE');
  const stage4Status = ref('IDLE');
  const stage2Settled = ref(false);

  // Counters
  const fcWrittenRegsCount = ref(0);
  const fcTotalWriteRegsCount = ref(0);
  const fcAppKeyWriteStatus = ref('PENDING'); // 'PENDING' | 'WRITTEN' | 'FAIL'
  const fcReadBackRegsCount = ref(0);
  const fcTotalMemmapRegsCount = ref(0);
  const fcMismatchCount = ref(0);
  const fcDbSaved = ref(false);

  // Tabulator audit data
  const fcAuditRegisters = ref([]);
  const auditSearchQuery = ref('');
  const auditStatusFilter = ref('ALL');
  const fcDebugMode = ref(false);
  let auditTabulatorInstance = null;

  // Validation
  const isAppKeyValid = computed(() => {
    if (!appKeyInput.value) return false;
    const clean = appKeyInput.value.replace(/[^0-9a-fA-F]/g, '');
    return clean.length === 32;
  });

  const generateRandomAppKey = () => {
    const array = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
    }
    const key = Array.from(array, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    appKeyInput.value = key;
    if (showToast) showToast('Generated new random LoRaWAN AppKey', 'info');
    return key;
  };

  // ----------------------------------------------------------------------
  // 4. REST API DATA FETCHING
  // ----------------------------------------------------------------------
  const fetchSalesOrders = async () => {
    try {
      const res = await fetch('/api/c-modules/sales-orders?limit=100', {
        headers: authHeaders ? authHeaders() : {},
      });
      if (res.ok) {
        const json = await res.json();
        salesOrdersList.value = json.data || json || [];
      }
    } catch (e) {
      console.warn('Failed to fetch sales orders:', e);
    }
  };

  const fetchItemCodesForSo = async (soCode) => {
    if (!soCode) {
      itemCodesList.value = [];
      return;
    }
    try {
      const res = await fetch('/api/c-modules/sales-orders/' + encodeURIComponent(soCode) + '/items', {
        headers: authHeaders ? authHeaders() : {},
      });
      if (res.ok) {
        const json = await res.json();
        itemCodesList.value = json.data || json || [];
      } else {
        // Fallback to all item codes
        const fb = await fetch('/api/c-modules/item-codes?limit=100', {
          headers: authHeaders ? authHeaders() : {},
        });
        if (fb.ok) {
          const fbJson = await fb.json();
          itemCodesList.value = fbJson.data || fbJson || [];
        }
      }
    } catch (e) {
      console.warn('Failed to fetch item codes:', e);
    }
  };

  const loadPresetBySoItem = async (so, itemCode) => {
    if (!so || !itemCode) {
      currentPreset.value = null;
      return;
    }
    try {
      const res = await fetch('/api/c-modules/final-config-manager/presets/by-so-item?so=' + encodeURIComponent(so) + '&item_code=' + encodeURIComponent(itemCode), {
        headers: authHeaders ? authHeaders() : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          currentPreset.value = json.data;
          // Seed audit table from preset, preserving any Stage 1 read-back cache (Spec Section 4.3.1)
          const regs = json.data.registers || [];
          const sortedRegs = [...regs].sort((a, b) => Number(a.address) - Number(b.address));
          const existingMap = new Map();
          for (const ex of fcAuditRegisters.value) {
            existingMap.set(Number(ex.address), ex);
          }
          const mergedList = sortedRegs.map((r, i) => {
            const addr = Number(r.address);
            const ex = existingMap.get(addr);
            return {
              order_no: i + 1,
              address: addr,
              modbus_reg_hex: r.modbus_reg_hex || ('0x' + addr.toString(16).padStart(4, '0').toUpperCase()),
              parameter_name: r.parameter_name || ('Register ' + addr),
              format: r.format || 'uint',
              endianness: r.endianness || 'Big-Endian',
              reg_num: Number(r.reg_num || r.numreg) || 1,
              fn_write: 'FC 16',
              default_value: r.default_value || r.value_on_memmap || '',
              value_to_write: r.value_to_write !== undefined ? String(r.value_to_write) : '',
              value_read_back: (ex && ex.value_read_back) ? ex.value_read_back : '',
              status: (ex && ex.status && ex.status !== 'NONE') ? ex.status : 'NONE',
            };
          });
          // Also retain any Stage 1 scanned hardware registers that are not in preset
          for (const [addr, ex] of existingMap.entries()) {
            if (!mergedList.some(r => Number(r.address) === addr)) {
              mergedList.push({ ...ex });
            }
          }
          mergedList.sort((a, b) => Number(a.address) - Number(b.address));
          mergedList.forEach((r, idx) => { r.order_no = idx + 1; });
          fcAuditRegisters.value = mergedList;
          updateTabulatorData();
        } else {
          currentPreset.value = null;
          fcAuditRegisters.value = [];
        }
      }
    } catch (e) {
      console.warn('Failed to load preset by SO & Item:', e);
    }
  };

  const onSoChange = async () => {
    selectedItemCode.value = '';
    currentPreset.value = null;
    if (selectedSo.value) {
      await fetchItemCodesForSo(selectedSo.value);
    }
  };

  const onItemCodeChange = async () => {
    if (selectedSo.value && selectedItemCode.value) {
      await loadPresetBySoItem(selectedSo.value, selectedItemCode.value);
    }
  };

  const lookupDeviceBySn = async (sn) => {
    if (!sn || !sn.trim()) return null;
    try {
      const res = await fetch('/api/device-tested/by-sn/' + encodeURIComponent(sn.trim()), {
        headers: authHeaders ? authHeaders() : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const record = json.data;
          if (record.so && !selectedSo.value) {
            selectedSo.value = record.so;
            fcSelectedSo.value = record.so;
            await fetchItemCodesForSo(record.so);
          }
          if (record.item_code && !selectedItemCode.value) {
            selectedItemCode.value = record.item_code;
            fcSelectedItemCode.value = record.item_code;
            if (selectedSo.value) {
              await loadPresetBySoItem(selectedSo.value, record.item_code);
            }
          }
          if (record.app_key) {
            appKeyInput.value = record.app_key.toUpperCase();
          }
          return record;
        }
      }
    } catch (e) {
      console.warn('Failed to lookup device by SN:', e);
    }
    return null;
  };

  const fcOnSerialNumberChange = async () => {
    if (fcSerialNumberInput.value) {
      await lookupDeviceBySn(fcSerialNumberInput.value);
    }
  };

  // ----------------------------------------------------------------------
  // 4.5. CONTINUOUS RETRY ENGINE FOR FIRST REGISTER (MCU WAKE-UP GUARD)
  // ----------------------------------------------------------------------
  const readFirstRegisterUntilSuccess = async (slave, addr, numreg, options) => {
    const backoffMs = (options && options.backoffMs) || 300;
    const label = (options && options.label) || ('Reg ' + addr);
    let attempt = 0;
    let lastErr = null;
    const patienceTimeoutMs = currentPreset.value?.usb_reconnect_patience_timeout_ms || 15000;
    const enablePatience = currentPreset.value?.enable_usb_reconnect_patience !== undefined
      ? Boolean(currentPreset.value.enable_usb_reconnect_patience)
      : true;

    while (!abortRequested.value) {
      // 0. Physical disconnect guard & Patience wait:
      if (!serialConnected.value || isAutoReconnecting.value || !serialPort.value) {
        if (enablePatience) {
          try {
            await waitForPortReconnection(patienceTimeoutMs);
            await flushUartRxBuffer();
          } catch (pErr) {
            addSerialLog('ERROR', null, '[First Register] USB reconnection timeout exceeded. Aborting retry loop.');
            return { success: false, aborted: true, error: pErr, rawBytes: null };
          }
        } else {
          addSerialLog('ERROR', null, '[First Register] Serial port is disconnected. Aborting retry loop.');
          return { success: false, aborted: true, error: new Error('Serial port disconnected'), rawBytes: null };
        }
      }

      attempt++;
      try {
        // 1. Luôn flush UART RX Buffer trước mỗi lần gửi frame Modbus
        await flushUartRxBuffer();

        // 2. Gửi request Modbus FC 03
        const rawBytes = await readModbusRegistersFromPort(slave, addr, numreg);

        // 3. Thành công -> Đợi settling delay tiêu chuẩn giữa 2 lần đọc
        await new Promise(r => setTimeout(r, INTER_READ_DELAY_MS));

        addSerialLog('INFO', null, '[First Register] ' + label + ' read SUCCESS on attempt ' + attempt);
        return { success: true, rawBytes, attempts: attempt };
      } catch (rErr) {
        lastErr = rErr;

        // 4. Nếu người dùng đã bấm Abort
        if (abortRequested.value) {
          return { success: false, aborted: true, error: rErr || new Error('User aborted operation'), rawBytes: null };
        }

        if (enablePatience && isPortDisconnectedError(rErr)) {
          addSerialLog('WARN', null, '[First Register] Port dropped during ' + label + '. Awaiting USB reconnect...');
          try {
            await waitForPortReconnection(patienceTimeoutMs);
            await flushUartRxBuffer();
            attempt--; // Do not count dropped port against wake-up attempts
            continue;
          } catch (pErr) {
            return { success: false, aborted: true, error: pErr, rawBytes: null };
          }
        }

        if (!enablePatience && (!serialConnected.value && !isAutoReconnecting.value)) {
          return { success: false, aborted: true, error: rErr || new Error('User aborted operation or serial port disconnected'), rawBytes: null };
        }

        // 5. Cập nhật thông báo tiến trình và log cảnh báo
        const errMsg = (rErr && rErr.message) || String(rErr);
        addSerialLog('WARN', null, '[First Register] ' + label + ' read failed (attempt ' + attempt + '): ' + errMsg + '. Retrying continuously until MCU wakes up...');
        fcStatusMessage.value = 'Waking up MCU / Retrying ' + label + ' (attempt ' + attempt + ')...';

        // 6. Flush bộ đệm và nghỉ backoff trước lần thử tiếp theo
        await flushUartRxBuffer();
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }

    return { success: false, aborted: true, error: lastErr || new Error('Aborted'), rawBytes: null };
  };

  // ----------------------------------------------------------------------
  // 5. AUTOMATED 4-STAGE FINAL CONFIG WORKFLOW
  // ----------------------------------------------------------------------
  const startFinalConfig = async () => {
    if (finalVerdict.value === 'FAIL') {
      if (showToast) showToast('Please click Reset before restarting after a failure.', 'warning');
      return;
    }
    if (!serialConnected.value) {
      if (showToast) showToast('Please select and connect COM port first.', 'warning');
      return;
    }

    isRunningFinalConfig.value = true;
    abortRequested.value = false;
    finalVerdict.value = 'NONE';
    fcProgress.value = 0;
    currentStage.value = 1;
    fcMismatchCount.value = 0;
    fcDbSaved.value = false;
    stage1Status.value = 'RUNNING';
    stage2Status.value = 'IDLE';
    stage3Status.value = 'IDLE';
    stage4Status.value = 'IDLE';
    stage2Settled.value = false;
    fcAppKeyWriteStatus.value = 'PENDING';

    try {
      // ==================================================================
      // STAGE 1: HARDWARE IDENTIFICATION & QA VERIFICATION (0% -> 25%)
      // ==================================================================
      currentStage.value = 1;
      const stage1StartTime = Date.now();
      fcStatusMessage.value = 'Reading hardware & traceability registers (0..51, 103, 259, 386)...';
      fcProgress.value = 3;

      const bytesToString = (bytes) => {
        if (!bytes || !bytes.length) return '';
        return String.fromCharCode(...bytes.filter(b => b >= 32 && b <= 126)).trim();
      };
      const bytesToAscii = bytesToString;
      const bytesToHex = (bytes) => {
        if (!bytes || !bytes.length) return '';
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      };

      // Pre-seed Stage 1 audit table with 13 hardware registers (0..51, 103, 259, 386)
      const STAGE1_REGISTER_DEFS = [
        { address: 0, modbus_reg_hex: '0x0000', parameter_name: 'Firmware Code', format: 'string', endianness: 'Big-Endian', reg_num: 5, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 5, modbus_reg_hex: '0x0005', parameter_name: 'Firmware Version', format: 'string', endianness: 'Big-Endian', reg_num: 4, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 9, modbus_reg_hex: '0x0009', parameter_name: 'HW Version', format: 'string', endianness: 'Big-Endian', reg_num: 2, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 11, modbus_reg_hex: '0x000B', parameter_name: 'LoRaWAN Protocol Version', format: 'string', endianness: 'Big-Endian', reg_num: 4, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 15, modbus_reg_hex: '0x000F', parameter_name: 'Spare Data', format: 'hex', endianness: 'Big-Endian', reg_num: 12, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 27, modbus_reg_hex: '0x001B', parameter_name: 'Device EUI', format: 'hex', endianness: 'Big-Endian', reg_num: 4, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 31, modbus_reg_hex: '0x001F', parameter_name: 'LoRaWAN App EUI', format: 'hex', endianness: 'Big-Endian', reg_num: 4, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 35, modbus_reg_hex: '0x0023', parameter_name: 'Factory Root AppKey', format: 'hex', endianness: 'Big-Endian', reg_num: 8, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 43, modbus_reg_hex: '0x002B', parameter_name: 'Network Session Key', format: 'hex', endianness: 'Big-Endian', reg_num: 8, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 51, modbus_reg_hex: '0x0033', parameter_name: 'Application Session Key', format: 'hex', endianness: 'Big-Endian', reg_num: 8, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 103, modbus_reg_hex: '0x0067', parameter_name: 'Sensor Type', format: 'uint16', endianness: 'Big-Endian', reg_num: 1, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 259, modbus_reg_hex: '0x0103', parameter_name: 'Serial Number', format: 'string', endianness: 'Big-Endian', reg_num: 9, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 386, modbus_reg_hex: '0x0182', parameter_name: 'Item Code', format: 'string', endianness: 'Big-Endian', reg_num: 14, fn_read: 'FC 03', default_value: '-', value_to_write: '' },
      ];

      fcAuditRegisters.value = STAGE1_REGISTER_DEFS.map((def, idx) => ({
        order_no: idx + 1,
        address: def.address,
        modbus_reg_hex: def.modbus_reg_hex,
        parameter_name: def.parameter_name,
        format: def.format,
        endianness: def.endianness,
        reg_num: def.reg_num,
        fn_read: def.fn_read,
        default_value: def.default_value,
        value_to_write: def.value_to_write,
        value_read_back: '',
        status: 'NONE',
      }));
      updateTabulatorData();

      const updateStage1AuditRow = (addr, val, isSuccess = true) => {
        const row = fcAuditRegisters.value.find(r => Number(r.address) === addr);
        if (row) {
          row.value_read_back = isSuccess ? String(val ?? '') : 'READ_ERR';
          row.status = isSuccess ? 'PASS' : 'FAIL';
          updateTabulatorData();
        }
      };

      const readRegisterWithRetry = async (slave, addr, numreg) => {
        let lastErr = null;
        const patienceTimeoutMs = currentPreset.value?.usb_reconnect_patience_timeout_ms || 15000;
        const enablePatience = currentPreset.value?.enable_usb_reconnect_patience !== undefined
          ? Boolean(currentPreset.value.enable_usb_reconnect_patience)
          : true;

        for (let retry = 0; retry < MAX_READ_ATTEMPTS; retry++) {
          if (abortRequested.value) {
            return { success: false, error: new Error('Aborted'), rawBytes: null };
          }
          if (enablePatience && (!serialConnected.value || isAutoReconnecting.value || !serialPort.value)) {
            try {
              await waitForPortReconnection(patienceTimeoutMs);
              await flushUartRxBuffer();
              retry--;
              continue;
            } catch (pErr) {
              return { success: false, error: pErr, rawBytes: null };
            }
          }

          try {
            await flushUartRxBuffer();
            const rawBytes = await readModbusRegistersFromPort(slave, addr, numreg);
            await new Promise(r => setTimeout(r, INTER_READ_DELAY_MS));
            return { success: true, rawBytes };
          } catch (rErr) {
            lastErr = rErr;
            if (enablePatience && isPortDisconnectedError(rErr)) {
              addSerialLog('WARN', null, 'Port disconnected during Read Reg ' + addr + '. Waiting for USB reconnect...');
              try {
                await waitForPortReconnection(patienceTimeoutMs);
                await flushUartRxBuffer();
                retry--;
                continue;
              } catch (pErr) {
                return { success: false, error: pErr, rawBytes: null };
              }
            }

            if (retry < MAX_READ_ATTEMPTS - 1) {
              const delayMs = READ_RETRY_BACKOFF_DELAYS[retry] || 400;
              addSerialLog('WARN', null, 'Read Reg ' + addr + ' failed (attempt ' + (retry + 1) + '/' + MAX_READ_ATTEMPTS + '): ' + (rErr?.message || rErr) + '. Retrying in ' + delayMs + 'ms...');
              fcStatusMessage.value = 'Device settling/retrying... (Read Reg ' + addr + ', attempt ' + (retry + 1) + '/' + MAX_READ_ATTEMPTS + ')';
              await flushUartRxBuffer();
              await new Promise(r => setTimeout(r, delayMs));
            } else {
              addSerialLog('ERROR', null, 'Read Reg ' + addr + ' failed after ' + MAX_READ_ATTEMPTS + ' attempts: ' + (rErr?.message || rErr));
              console.warn('Read error for register ' + addr + ' after ' + MAX_READ_ATTEMPTS + ' attempts:', rErr);
            }
          }
        }
        return { success: false, error: lastErr, rawBytes: null };
      };

      // Read strictly ascending: 0 -> 5 -> 9 -> 11 -> 15 -> 27 -> 31 -> 35 -> 43 -> 51 -> 103 -> 259 -> 386

      // 1. Reg 0 (FW_CODE: 5 regs, string) - readRegisterWithRetry(1, 0, 5) upgraded to continuous retry until MCU wakes up
      let readFwCode = '';
      const resReg0 = await readFirstRegisterUntilSuccess(1, 0, 5, { label: 'Reg 0 (FW_CODE)' });
      if (abortRequested.value || resReg0.aborted || !resReg0.success) return;
      if (resReg0.rawBytes) readFwCode = bytesToString(resReg0.rawBytes);
      updateStage1AuditRow(0, readFwCode, resReg0.success);
      fcProgress.value = 5;

      // 2. Reg 5 (FW_VERSION: 4 regs, string)
      let readFw = '';
      const resReg5 = await readRegisterWithRetry(1, 5, 4);
      if (resReg5.success) readFw = bytesToString(resReg5.rawBytes);
      fcHardwareInfo.value.firmwareVersion = readFw || '1.0.0';
      fcHardwareInfo.value.shortFw = readFw ? (parseInt(readFw.charAt(0), 10) || 1) : 1;
      updateStage1AuditRow(5, readFw, resReg5.success);
      fcProgress.value = 7;

      // 3. Reg 9 (HW_VERSION: 2 regs, string, FC 03)
      let readHw = '';
      const resReg9 = await readRegisterWithRetry(1, 9, 2);
      if (resReg9.success) readHw = bytesToString(resReg9.rawBytes);
      fcHardwareInfo.value.hwVersion = readHw || '';
      const row9 = fcAuditRegisters.value.find(r => Number(r.address) === 9);
      if (row9) {
        row9.value_to_write = readHw || '';
        row9.value_read_back = readHw || '';
        row9.status = resReg9.success ? 'PASS' : 'FAIL';
        updateTabulatorData();
      }
      fcProgress.value = 9;

      // 4. Reg 11 (LORAWAN_PROTOCOL: 4 regs, string)
      let readProto = '';
      const resReg11 = await readRegisterWithRetry(1, 11, 4);
      if (resReg11.success) readProto = bytesToString(resReg11.rawBytes);
      updateStage1AuditRow(11, readProto, resReg11.success);
      fcProgress.value = 11;

      // 5. Reg 15 (SPARE_15: 12 regs, hex)
      let readSpare = '';
      const resReg15 = await readRegisterWithRetry(1, 15, 12);
      if (resReg15.success) readSpare = bytesToHex(resReg15.rawBytes);
      updateStage1AuditRow(15, readSpare, resReg15.success);
      fcProgress.value = 13;

      // 6. Reg 27 (DEV_EUI: 4 regs = 8 bytes, hex)
      let readDevEui = '';
      const resReg27 = await readRegisterWithRetry(1, 27, 4);
      if (resReg27.success) readDevEui = bytesToHex(resReg27.rawBytes);
      if (!readDevEui) throw new Error('DevEUI (Reg 27) read from hardware is empty');
      fcHardwareInfo.value.devEui = readDevEui;
      updateStage1AuditRow(27, readDevEui, resReg27.success);
      fcProgress.value = 15;

      // 7. Reg 31 (APP_EUI: 4 regs = 8 bytes, hex)
      let readAppEui = '';
      const resReg31 = await readRegisterWithRetry(1, 31, 4);
      if (resReg31.success) readAppEui = bytesToHex(resReg31.rawBytes);
      updateStage1AuditRow(31, readAppEui, resReg31.success);
      fcProgress.value = 17;

      // 8. Reg 35 (FACTORY_APP_KEY: 8 regs = 16 bytes, hex)
      let readFactoryAppKey = '';
      const resReg35 = await readRegisterWithRetry(1, 35, 8);
      if (resReg35.success) readFactoryAppKey = bytesToHex(resReg35.rawBytes);
      updateStage1AuditRow(35, readFactoryAppKey, resReg35.success);
      fcProgress.value = 18;

      // 9. Reg 43 (NWK_SKEY: 8 regs = 16 bytes, hex)
      let readNwkSkey = '';
      const resReg43 = await readRegisterWithRetry(1, 43, 8);
      if (resReg43.success) readNwkSkey = bytesToHex(resReg43.rawBytes);
      updateStage1AuditRow(43, readNwkSkey, resReg43.success);
      fcProgress.value = 19;

      // 10. Reg 51 (APP_SKEY: 8 regs = 16 bytes, hex)
      let readAppSkey = '';
      const resReg51 = await readRegisterWithRetry(1, 51, 8);
      if (resReg51.success) readAppSkey = bytesToHex(resReg51.rawBytes);
      updateStage1AuditRow(51, readAppSkey, resReg51.success);
      fcProgress.value = 20;

      // 11. Reg 103 (SENSOR_TYPE: 1 reg, uint16)
      let readType = 0;
      const resReg103 = await readRegisterWithRetry(1, 103, 1);
      if (resReg103.success && resReg103.rawBytes && resReg103.rawBytes.length >= 2) {
        readType = (resReg103.rawBytes[0] << 8) | resReg103.rawBytes[1];
      }
      fcHardwareInfo.value.sensorType = readType;
      updateStage1AuditRow(103, readType, resReg103.success);
      fcProgress.value = 21;

      // 12. Reg 259 (SERIAL_NUMBER: 9 regs, string)
      let readSn = '';
      const resReg259 = await readRegisterWithRetry(1, 259, 9);
      if (resReg259.success) readSn = bytesToString(resReg259.rawBytes);
      if (!readSn) throw new Error('Serial Number (Reg 259) read from hardware is empty');
      fcHardwareInfo.value.serialNumber = readSn;
      fcSerialNumberInput.value = readSn;
      updateStage1AuditRow(259, readSn, resReg259.success);
      fcProgress.value = 23;

      // 13. Reg 386 (ITEM_CODE: 14 regs, string)
      let readItemCode = '';
      const resReg386 = await readRegisterWithRetry(1, 386, 14);
      if (resReg386.success) readItemCode = bytesToString(resReg386.rawBytes);
      fcHardwareInfo.value.itemCode = readItemCode;
      updateStage1AuditRow(386, readItemCode, resReg386.success);
      fcProgress.value = 24;

      // Ingest Traceability passport data
      const traceDuration = Date.now() - stage1StartTime;
      fcTraceabilityData.value = {
        fw_code: readFwCode,
        fw_version: readFw,
        hw_version: readHw,
        lorawan_protocol_version: readProto,
        spare_15: readSpare,
        dev_eui: readDevEui,
        app_eui: readAppEui,
        factory_app_key: readFactoryAppKey,
        factory_nwk_skey: readNwkSkey,
        factory_app_skey: readAppSkey,
        read_at: new Date().toISOString(),
        read_duration_ms: traceDuration,
        max_read_attempts: MAX_READ_ATTEMPTS,
      };

      // Check if device has already passed Final Configuration
      fcStatusMessage.value = 'Checking if device already passed Final Configuration...';
      try {
        const checkPassUrl = '/api/c-modules/final-config-manager/check-pass?serial_number=' + encodeURIComponent(readSn) + '&dev_eui=' + encodeURIComponent(readDevEui);
        const checkPassRes = await fetch(checkPassUrl, {
          headers: authHeaders ? authHeaders() : {},
        });
        const checkPassJson = await checkPassRes.json();
        if (checkPassJson && checkPassJson.passed) {
          alreadyPassedInfo.value = checkPassJson.data;
          alreadyPassedModal.value = true;
          if (showToast) showToast('Device has already passed Final Configuration!', 'warning');
          fcStatusMessage.value = 'Device has already passed Final Configuration!';
          stage1Status.value = 'IDLE';
          finalVerdict.value = 'NONE';
          return;
        }
      } catch (checkErr) {
        console.warn('Check passed final config API warning:', checkErr);
      }

      // Verify against device_tested table & Auto-map SO, Item Code, AppKey & Preset
      fcStatusMessage.value = 'Verifying QA test status and Sales Order match in device_tested...';
      let verifyUrl = '/api/device-tested/verify?serial_number=' + encodeURIComponent(readSn);
      if (readDevEui) {
        verifyUrl += '&device_key=' + encodeURIComponent(readDevEui);
      }
      if (readItemCode || selectedItemCode.value) {
        verifyUrl += '&item_code=' + encodeURIComponent(readItemCode || selectedItemCode.value);
      }
      if (readFw) {
        verifyUrl += '&fw_ver=' + encodeURIComponent(readFw);
      }
      if (readHw) {
        verifyUrl += '&hw_ver=' + encodeURIComponent(readHw);
      }
      if (selectedSo.value) {
        verifyUrl += '&so=' + encodeURIComponent(selectedSo.value);
      }
      const verifyRes = await fetch(verifyUrl, {
        headers: authHeaders ? authHeaders() : {},
      });
      const verifyJson = await verifyRes.json();

      if (!verifyJson.verified || !verifyJson.success) {
        fcSoCheckStatus.value = 'MISMATCH';
        stage1Status.value = 'FAIL';
        finalVerdict.value = 'FAIL';
        fcProgress.value = 25;
        throw new Error('QA Check Failed: ' + (verifyJson.message || 'Device not verified in device_tested table'));
      }

      const record = verifyJson.data;

      // Auto-map / match Sales Order (SO)
      const mappedSo = (record && (record.so_number || record.so)) || selectedSo.value;
      if (mappedSo) {
        selectedSo.value = record.so || record.so_number || mappedSo;
        fcSelectedSo.value = record.so || record.so_number || mappedSo;
        fcSoCheckStatus.value = 'MATCH';
        await fetchItemCodesForSo(mappedSo);
      }

      // Auto-fill Serial Number
      if (record && record.serial_number) {
        fcSerialNumberInput.value = record.serial_number;
        fcHardwareInfo.value.serialNumber = record.serial_number;
      }

      // Auto-fill Item Code
      const resolvedItemCode = (record && record.item_code) || readItemCode || selectedItemCode.value;
      if (resolvedItemCode) {
        selectedItemCode.value = resolvedItemCode;
        fcSelectedItemCode.value = resolvedItemCode;
        fcHardwareInfo.value.itemCode = resolvedItemCode;
      }

      // Auto-fill LoRaWAN AppKey from device_tested if exists
      if (record && record.app_key) {
        appKeyInput.value = record.app_key.toUpperCase();
      }

      // Auto-load configuration preset by (SO, Item Code)
      if (selectedSo.value && selectedItemCode.value) {
        await loadPresetBySoItem(selectedSo.value, selectedItemCode.value);
      }
      if (!currentPreset.value) {
        stage1Status.value = 'FAIL';
        finalVerdict.value = 'FAIL';
        throw new Error('No configuration preset found for SO [' + selectedSo.value + '] and Item Code [' + selectedItemCode.value + ']');
      }

      fcHardwareInfo.value.sku = currentPreset.value?.sku || 'WSLRW';
      stage1Status.value = 'PASS';
      fcProgress.value = 25;
      fcStatusMessage.value = 'Stage 1 PASSED: Hardware verified with QA device_tested. SO & AppKey mapped.';
      if (abortRequested.value) return;

      // ==================================================================
      // STAGE 2: PRESET WRITING & LORAWAN APPKEY (25% -> 50%)
      // ==================================================================
      currentStage.value = 2;
      stage2Status.value = 'RUNNING';

      // 1. Generate random 128-bit LoRaWAN AppKey (32 uppercase hex characters)
      let cleanAppKey = generateRandomAppKey();
      appKeyInput.value = cleanAppKey;
      fcStatusMessage.value = 'Generated 128-bit LoRaWAN AppKey: ' + cleanAppKey + '. Writing preset registers (Dec >= 303)...';

      // Closed-Loop Handshake timing options from preset
      const patienceTimeoutMs = currentPreset.value?.usb_reconnect_patience_timeout_ms || 15000;
      const enablePatience = currentPreset.value?.enable_usb_reconnect_patience !== undefined
        ? Boolean(currentPreset.value.enable_usb_reconnect_patience)
        : true;

      const timingOpts = {
        enableProbe: currentPreset.value?.enable_probe_verification !== undefined ? Boolean(currentPreset.value.enable_probe_verification) : true,
        probeIntervalMs: currentPreset.value?.probe_interval_ms || 50,
        maxProbeTimeoutMs: currentPreset.value?.max_probe_timeout_ms || 10000,
        appkeyProbeTimeoutMs: currentPreset.value?.appkey_probe_timeout_ms || 10000,
        enableAdaptiveProbe: currentPreset.value?.enable_adaptive_probe !== undefined ? Boolean(currentPreset.value.enable_adaptive_probe) : true,
        uartStallRecoveryFlush: currentPreset.value?.uart_stall_recovery_flush !== undefined ? Boolean(currentPreset.value.uart_stall_recovery_flush) : true,
        safeProbeRegister: currentPreset.value?.safe_probe_register !== undefined ? Number(currentPreset.value.safe_probe_register) : 0,
        guardSilenceMs: 30,
        usbReconnectTimeoutMs: patienceTimeoutMs,
        enableUsbReconnectPatience: enablePatience,
        waitForPortReconnectionFn: (tMs) => waitForPortReconnection(tMs),
        isPortConnectedFn: () => Boolean(serialConnected.value && !isAutoReconnecting.value && serialPort.value?.readable && serialPort.value?.writable),
      };

      // Registers to write: address >= 303
      const writeRegs = (currentPreset.value.registers || []).filter(r => Number(r.address) >= 303 && r.value_to_write !== undefined && r.value_to_write !== '');
      fcTotalWriteRegsCount.value = writeRegs.length + 1; // +1 for AppKey 274
      fcWrittenRegsCount.value = 0;

      for (let i = 0; i < writeRegs.length; i++) {
        if (abortRequested.value) return;
        const regItem = writeRegs[i];
        const addr = Number(regItem.address);
        const numreg = Number(regItem.reg_num) || 1;
        const fmt = regItem.format || 'uint';
        const endian = regItem.endianness || 'Big-Endian';
        const valStr = String(regItem.value_to_write);

        const dataBytes = encodeModbusWriteValue(valStr, fmt, endian, numreg);

        // Progressive Retry Backoff [800ms, 1500ms, 2500ms] and UART Flush (Mandatory Modbus FC 16)
        let written = false;
        let lastErr = null;
        for (let retry = 0; retry < 3; retry++) {
          if (abortRequested.value) return;
          if (enablePatience && (!serialConnected.value || isAutoReconnecting.value || !serialPort.value)) {
            try {
              await waitForPortReconnection(patienceTimeoutMs);
              await flushUartRxBuffer();
              retry--;
              continue;
            } catch (pErr) {
              lastErr = pErr;
              break;
            }
          }
          try {
            await flushUartRxBuffer();
            await writeModbusRegistersToPort(1, 16, addr, numreg, dataBytes);
            written = true;
            break;
          } catch (wErr) {
            lastErr = wErr;
            if (enablePatience && isPortDisconnectedError(wErr)) {
              addSerialLog('WARN', null, 'Write Reg ' + addr + ' port dropped. Waiting for USB reconnect...');
              try {
                await waitForPortReconnection(patienceTimeoutMs);
                await flushUartRxBuffer();
                retry--;
                continue;
              } catch (pErr) {
                lastErr = pErr;
                break;
              }
            }
            const delayMs = RETRY_BACKOFF_DELAYS[retry] || 2500;
            addSerialLog('WARN', null, 'Write Reg ' + addr + ' failed (attempt ' + (retry + 1) + '/3): ' + (wErr?.message || wErr) + '. Retrying in ' + delayMs + 'ms...');
            fcStatusMessage.value = 'Device settling/retrying... (Reg ' + addr + ', attempt ' + (retry + 1) + '/3)';
            await flushUartRxBuffer();
            await new Promise(r => setTimeout(r, delayMs));
          }
        }
        if (!written) {
          throw new Error('Failed to write register ' + addr + ': ' + (lastErr?.message || lastErr));
        }

        fcWrittenRegsCount.value++;
        fcProgress.value = Math.min(45, 25 + Math.round((fcWrittenRegsCount.value / fcTotalWriteRegsCount.value) * 20));

        // Closed-Loop Handshake Probe or Settling Delay
        const isWriteOnly = regItem.fn_read === undefined || regItem.fn_read === '' || regItem.fn_read === null || !String(regItem.fn_read).includes('FC 03');
        const res = await probeDeviceReadyAndVerified(1, addr, numreg, dataBytes, isWriteOnly, timingOpts);
        addSerialLog('INFO', null, 'Handshake verified for Reg ' + addr + ' in ' + res.elapsedMs + 'ms (' + res.attempts + ' probes)');
        fcStatusMessage.value = 'Verified Reg ' + addr + ' (' + res.elapsedMs + 'ms). Writing next register...';
      }

      // Settling delay before AppKey Reg 274 when probe handshake is disabled
      if (!timingOpts.enableProbe) {
        addSerialLog('INFO', null, 'Settling MCU (' + INTER_WRITE_SETTLING_DELAY_MS + 'ms) for Flash/EEPROM persistence before AppKey Reg 274...');
        fcStatusMessage.value = 'Device settling/retrying... MCU settling (' + INTER_WRITE_SETTLING_DELAY_MS + 'ms) for Flash/EEPROM persistence before AppKey Reg 274...';
        await new Promise(r => setTimeout(r, INTER_WRITE_SETTLING_DELAY_MS));
      }

      // Write LoRaWAN AppKey to Reg 274 (8 words = 16 bytes, FC 16)
      fcStatusMessage.value = 'Writing LoRaWAN AppKey to Reg 274 (16 bytes, FC 16)...';
      cleanAppKey = appKeyInput.value.replace(/[^0-9a-fA-F]/g, '');
      const appKeyBytes = [];
      for (let i = 0; i < cleanAppKey.length; i += 2) {
        appKeyBytes.push(parseInt(cleanAppKey.substr(i, 2), 16) || 0);
      }
      while (appKeyBytes.length < 16) appKeyBytes.push(0);

      let appKeyWritten = false;
      let appKeyErr = null;
      for (let retry = 0; retry < 3; retry++) {
        if (abortRequested.value) return;
        if (enablePatience && (!serialConnected.value || isAutoReconnecting.value || !serialPort.value)) {
          try {
            await waitForPortReconnection(patienceTimeoutMs);
            await flushUartRxBuffer();
            retry--;
            continue;
          } catch (pErr) {
            appKeyErr = pErr;
            break;
          }
        }
        try {
          await flushUartRxBuffer();
          await writeModbusRegistersToPort(1, 16, 274, 8, appKeyBytes);
          appKeyWritten = true;
          break;
        } catch (kErr) {
          appKeyErr = kErr;
          if (enablePatience && isPortDisconnectedError(kErr)) {
            addSerialLog('WARN', null, 'Write AppKey Reg 274 port dropped. Waiting for USB reconnect...');
            try {
              await waitForPortReconnection(patienceTimeoutMs);
              await flushUartRxBuffer();
              retry--;
              continue;
            } catch (pErr) {
              appKeyErr = pErr;
              break;
            }
          }
          const delayMs = RETRY_BACKOFF_DELAYS[retry] || 2500;
          addSerialLog('WARN', null, 'Write AppKey Reg 274 failed (attempt ' + (retry + 1) + '/3): ' + (kErr?.message || kErr) + '. Retrying in ' + delayMs + 'ms...');
          fcStatusMessage.value = 'Device settling/retrying... (AppKey Reg 274, attempt ' + (retry + 1) + '/3)';
          await flushUartRxBuffer();
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
      if (!appKeyWritten) {
        fcAppKeyWriteStatus.value = 'FAIL';
        throw new Error('Failed to write LoRaWAN AppKey (Reg 274): ' + (appKeyErr?.message || appKeyErr));
      }

      fcAppKeyWriteStatus.value = 'WRITTEN';
      fcWrittenRegsCount.value++;
      fcProgress.value = 50;

      // Closed-Loop Handshake Probe for LoRaWAN AppKey (Write-Only -> Safe Anchor with 10s Adaptive Timeout)
      const appKeyTimingOpts = {
        ...timingOpts,
        isAppKey: true,
        guardSilenceMs: 150,
      };
      fcStatusMessage.value = 'Probing MCU recovery & Flash persistence for AppKey Reg 274 (adaptive up to 10s)...';
      const res = await probeDeviceReadyAndVerified(1, 274, 8, appKeyBytes, true, appKeyTimingOpts);
      addSerialLog('INFO', null, 'Handshake verified for AppKey Reg 274 via safe anchor in ' + res.elapsedMs + 'ms (' + res.attempts + ' probes)');
      fcStatusMessage.value = 'Verified AppKey Reg 274 (' + res.elapsedMs + 'ms). Stage 2 completed.';

      if (!timingOpts.enableProbe) {
        fcStatusMessage.value = 'Hardware settling for Flash / EEPROM storage (' + INTER_WRITE_SETTLING_DELAY_MS + 'ms)...';
        await new Promise(r => setTimeout(r, INTER_WRITE_SETTLING_DELAY_MS));
      }
      stage2Settled.value = true;
      stage2Status.value = 'PASS';
      if (abortRequested.value) return;

      // ==================================================================
      // STAGE 3: READ FULL MEMORY MAP & REGISTER SNAPSHOT (50% -> 75%)
      // ==================================================================
      currentStage.value = 3;
      stage3Status.value = 'RUNNING';
      fcStatusMessage.value = 'Reading full register memory map and taking snapshot (0..51, 274, 303+)...';

      // Build target registers to read back
      const allAuditList = [...fcAuditRegisters.value];

      // 10 Traceability registers config (WSLRW-ATH-6.csv)
      const TRACE_DEFS = [
        { address: 0, modbus_reg_hex: '0x0000', parameter_name: 'Firmware Code', format: 'string', reg_num: 5, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 5, modbus_reg_hex: '0x0005', parameter_name: 'Firmware Version', format: 'string', reg_num: 4, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 9, modbus_reg_hex: '0x0009', parameter_name: 'HW Version', format: 'string', reg_num: 2, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: fcHardwareInfo.value.hwVersion || '' },
        { address: 11, modbus_reg_hex: '0x000B', parameter_name: 'LoRaWAN Protocol Version', format: 'string', reg_num: 4, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 15, modbus_reg_hex: '0x000F', parameter_name: 'Spare Data', format: 'hex', reg_num: 12, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 27, modbus_reg_hex: '0x001B', parameter_name: 'Device EUI', format: 'hex', reg_num: 4, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 31, modbus_reg_hex: '0x001F', parameter_name: 'LoRaWAN App EUI', format: 'hex', reg_num: 4, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 35, modbus_reg_hex: '0x0023', parameter_name: 'Factory Root AppKey', format: 'hex', reg_num: 8, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 43, modbus_reg_hex: '0x002B', parameter_name: 'Network Session Key', format: 'hex', reg_num: 8, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: '' },
        { address: 51, modbus_reg_hex: '0x0033', parameter_name: 'Application Session Key', format: 'hex', reg_num: 8, endianness: 'Big-Endian', fn_read: 'FC 03', default_value: '-', value_to_write: '' },
      ];

      for (const tDef of TRACE_DEFS) {
        let existing = allAuditList.find(r => Number(r.address) === tDef.address);
        if (!existing) {
          allAuditList.push({
            order_no: 0,
            address: tDef.address,
            modbus_reg_hex: tDef.modbus_reg_hex,
            parameter_name: tDef.parameter_name,
            format: tDef.format,
            endianness: tDef.endianness,
            reg_num: tDef.reg_num,
            fn_read: tDef.fn_read,
            default_value: tDef.default_value,
            value_to_write: tDef.value_to_write,
            value_read_back: '',
            status: 'NONE',
          });
        } else {
          if (tDef.address === 9) {
            existing.format = 'string';
          }
        }
      }

      // Ensure AppKey 274 is in audit list
      let appKeyReg = allAuditList.find(r => Number(r.address) === 274);
      if (!appKeyReg) {
        allAuditList.push({
          order_no: 0,
          address: 274,
          modbus_reg_hex: '0x0112',
          parameter_name: 'LoRaWAN AppKey',
          format: 'hex',
          endianness: 'Big-Endian',
          reg_num: 8,
          fn_write: 'FC 16',
          fn_read: 'FC 03',
          default_value: '-',
          value_to_write: cleanAppKey.toUpperCase(),
          value_read_back: '',
          status: 'NONE',
        });
      } else {
        appKeyReg.value_to_write = cleanAppKey.toUpperCase();
      }

      // Sort strictly ascending by Dec reg (address ASC: 0 -> 5 -> 9 -> ... -> 274 -> 303 -> ...)
      allAuditList.sort((a, b) => Number(a.address) - Number(b.address));
      allAuditList.forEach((r, idx) => {
        r.order_no = idx + 1;
      });

      const enableStage1CacheReuse = currentPreset.value?.enable_stage1_cache_reuse !== undefined
        ? Boolean(currentPreset.value.enable_stage1_cache_reuse)
        : true;

      fcTotalMemmapRegsCount.value = allAuditList.length;
      fcReadBackRegsCount.value = 0;

      // ── Stage 3 Batch Read ──────────────────────────────────────────────
      // Split rows: cached (Stage 1 reuse, skip Modbus) vs need-to-read.
      // For need-to-read, compute covering range; issue one FC03 per 100-reg
      // chunk instead of one request per register.
      // ponytail: STAGE3_BATCH_CHUNK=100 (FC03 limit); raise to 125 if firmware allows
      const STAGE3_READ_TIMEOUT_MS = 400;
      const STAGE3_BATCH_CHUNK = 100;

      const cachedRows = [];
      const readRows = [];

      for (const row of allAuditList) {
        const addr = Number(row.address);
        const isStage1StaticReg = [0, 5, 9, 11, 15, 27, 31, 35, 43, 51, 103, 259, 386].includes(addr);
        if (
          enableStage1CacheReuse &&
          row.value_read_back &&
          row.value_read_back !== 'READ_ERR' &&
          (isStage1StaticReg || (addr < 303 && addr !== 274)) &&
          addr !== 274
        ) {
          cachedRows.push(row);
        } else {
          readRows.push(row);
        }
      }

      // Log cache hits upfront
      for (const row of cachedRows) {
        addSerialLog('INFO', null, '[Stage 3 Cache] Reusing Stage 1 cached value for Reg ' + Number(row.address) + " ('" + row.value_read_back + "'). Skipping redundant Modbus read.");
        fcReadBackRegsCount.value++;
        fcProgress.value = Math.min(75, 50 + Math.round((fcReadBackRegsCount.value / fcTotalMemmapRegsCount.value) * 25));
      }

      // Build batchMap: addr -> rawBytes | null
      const batchMap = new Map();

      if (readRows.length > 0) {
        // Wait for device ready via first reg (may need USB patience)
        const firstRow = readRows[0];
        const firstAddr = Number(firstRow.address);
        const firstNumreg = Number(firstRow.reg_num) || 1;
        const resFirst = await readFirstRegisterUntilSuccess(1, firstAddr, firstNumreg, { label: 'Audit Reg ' + firstAddr });
        if (abortRequested.value || resFirst.aborted) return;
        batchMap.set(firstAddr, resFirst.success ? resFirst.rawBytes : null);

        // Compute one covering range over all remaining rows, read in chunks
        const remainingRows = readRows.slice(1);
        if (remainingRows.length > 0) {
          const remainAddrs = remainingRows.map(r => Number(r.address));
          const minAddr = Math.min(...remainAddrs);
          const maxRow = remainingRows.reduce((m, r) =>
            Number(r.address) + (Number(r.reg_num || r.numreg) || 1) > Number(m.address) + (Number(m.reg_num || m.numreg) || 1) ? r : m
          );
          const totalRegs = Number(maxRow.address) + (Number(maxRow.reg_num || maxRow.numreg) || 1) - minAddr;

          fcStatusMessage.value = 'Reading register range ' + minAddr + '\u2013' + (minAddr + totalRegs - 1) + ' in batches...';

          const rawMemory = new Map();

          for (let offset = 0; offset < totalRegs; offset += STAGE3_BATCH_CHUNK) {
            if (abortRequested.value) return;
            if (enablePatience && (!serialConnected.value || isAutoReconnecting.value || !serialPort.value)) {
              try { await waitForPortReconnection(patienceTimeoutMs); await flushUartRxBuffer(); }
              catch (e) { addSerialLog('WARN', null, 'Port lost during Stage 3 batch read. Continuing...'); break; }
            }
            const chunkRegs = Math.min(STAGE3_BATCH_CHUNK, totalRegs - offset);
            const chunkStart = minAddr + offset;
            try {
              await flushUartRxBuffer();
              const raw = await readModbusRegistersFromPort(1, chunkStart, chunkRegs, STAGE3_READ_TIMEOUT_MS);
              addSerialLog('RX', null, 'Batch Read Reg ' + chunkStart + '\u2013' + (chunkStart + chunkRegs - 1) + ' (' + chunkRegs + ' regs)');
              for (let i = 0; i < chunkRegs; i++) {
                if (i * 2 + 1 < raw.length) {
                  rawMemory.set(chunkStart + i, [raw[i * 2], raw[i * 2 + 1]]);
                }
              }
              await new Promise(r => setTimeout(r, INTER_READ_DELAY_MS));
            } catch (rErr) {
              if (enablePatience && isPortDisconnectedError(rErr)) {
                addSerialLog('WARN', null, 'Port disconnected during batch Read Reg ' + chunkStart + '. Waiting for USB reconnect...');
                try { await waitForPortReconnection(patienceTimeoutMs); await flushUartRxBuffer(); offset -= STAGE3_BATCH_CHUNK; continue; }
                catch (e) { break; }
              }
              addSerialLog('ERROR', null, 'Batch Read Reg ' + chunkStart + '\u2013' + (chunkStart + chunkRegs - 1) + ' failed: ' + (rErr?.message || rErr));
            }
          }

          // Stitch registers from rawMemory across chunk boundaries
          for (const row of remainingRows) {
            const addr = Number(row.address);
            const n = Number(row.reg_num || row.numreg) || 1;
            const bytes = [];
            let allPresent = true;
            for (let r = 0; r < n; r++) {
              const pair = rawMemory.get(addr + r);
              if (!pair) {
                allPresent = false;
                break;
              }
              bytes.push(pair[0], pair[1]);
            }
            batchMap.set(addr, allPresent ? bytes : null);
          }
        }
      }

      // Decode batchMap into readRows
      for (const row of readRows) {
        const addr = Number(row.address);
        const numreg = Number(row.reg_num || row.numreg) || 1;
        const rawBytes = batchMap.get(addr) ?? null;
        if (rawBytes) {
          if (row.format === 'hex' || (addr === 274 && numreg === 8)) {
            row.value_read_back = bytesToHex(rawBytes);
          } else if (row.format === 'string' || row.format === 'ascii') {
            row.value_read_back = bytesToString(rawBytes);
          } else {
            row.value_read_back = decodeModbusPayload(rawBytes, row.format, row.endianness);
          }
        } else {
          row.value_read_back = 'READ_ERR';
        }
        fcReadBackRegsCount.value++;
        fcProgress.value = Math.min(75, 50 + Math.round((fcReadBackRegsCount.value / fcTotalMemmapRegsCount.value) * 25));
      }

      fcAuditRegisters.value = allAuditList;
      stage3Status.value = 'PASS';
      fcProgress.value = 75;
      if (abortRequested.value) return;

      // ==================================================================
      // STAGE 4: AUTOMATED VERIFICATION & QA VERDICT (75% -> 100%)
      // ==================================================================
      currentStage.value = 4;
      stage4Status.value = 'RUNNING';
      fcStatusMessage.value = 'Evaluating read-back values against preset targets...';

      let mismatchCount = 0;
      for (const row of fcAuditRegisters.value) {
        const target = String(row.value_to_write || '').trim();
        const read = String(row.value_read_back || '').trim();

        if (target === '') {
          row.status = row.value_read_back !== 'READ_ERR' ? 'PASS' : 'FAIL';
          if (row.status === 'FAIL') mismatchCount++;
          continue;
        }

        let isMatch = false;
        if (row.address === 274) {
          // Hex compare (AppKey)
          isMatch = read.toUpperCase() === target.toUpperCase();
        } else if (row.address === 9) {
          // HW_VERSION compare
          isMatch = target ? (read.toUpperCase() === target.toUpperCase()) : (read !== 'READ_ERR');
        } else if (row.format === 'hex') {
          isMatch = read.toUpperCase() === target.toUpperCase();
        } else if (row.format === 'float' || row.format === 'float32') {
          const numT = parseFloat(target);
          const numR = parseFloat(read);
          isMatch = !isNaN(numT) && !isNaN(numR) && Math.abs(numT - numR) < 0.001;
        } else if (row.format === 'int' || row.format === 'uint' || row.format === 'int16' || row.format === 'uint16') {
          const numT = parseInt(target, 10);
          const numR = parseInt(read, 10);
          isMatch = !isNaN(numT) && !isNaN(numR) && numT === numR;
        } else {
          isMatch = read.toLowerCase() === target.toLowerCase();
        }

        row.status = isMatch ? 'PASS' : 'FAIL';
        if (!isMatch) {
          mismatchCount++;
          addSerialLog('WARN', null, '[Stage 4 MISMATCH] Reg ' + Number(row.address) + ' (' + row.parameter_name + '): read="' + read + '" expected="' + target + '" format=' + row.format);
        }
      }

      fcMismatchCount.value = mismatchCount;
      const verdict = mismatchCount === 0 ? 'PASS' : 'FAIL';
      finalVerdict.value = verdict;
      stage4Status.value = verdict;
      fcProgress.value = 100;
      fcStatusMessage.value = verdict === 'PASS' ? 'Final Config completed successfully! (PASS)' : 'Final Config completed with mismatches (FAIL)';
      updateTabulatorData();

      if (showToast) {
        showToast(
          verdict === 'PASS'
            ? 'FINAL CONFIG PASS: Device ' + fcHardwareInfo.value.serialNumber + ' passed verification.'
            : 'FINAL CONFIG FAIL: Device ' + fcHardwareInfo.value.serialNumber + ' has ' + mismatchCount + ' mismatched registers.',
          verdict === 'PASS' ? 'success' : 'error'
        );
      }

      // Persist results asynchronously (non-blocking for UI & Serial)
      const operator = currentUser?.value?.username || 'admin';
      const savePayload = {
        serial_number: fcHardwareInfo.value.serialNumber,
        item_code: selectedItemCode.value,
        so: selectedSo.value,
        preset_id: currentPreset.value?.id,
        sku: fcHardwareInfo.value.sku || currentPreset.value?.sku || 'WSLRW',
        firmware_version: fcHardwareInfo.value.firmwareVersion,
        short_fw: fcHardwareInfo.value.shortFw,
        status: verdict,
        dev_eui: fcHardwareInfo.value.devEui,
        app_key: appKeyInput.value,
        configured_regs_count: fcWrittenRegsCount.value,
        total_regs_count: fcAuditRegisters.value.length,
        tested_at: new Date().toISOString(),
        operator,
        metadata: {
          traceability: fcTraceabilityData.value || null,
          client_environment: {
            app_version: '1.0.0',
            serial_port: serialPortInfo.value || '',
          },
        },
        registers: fcAuditRegisters.value.map(r => ({
          address: r.address,
          modbus_reg_hex: r.modbus_reg_hex,
          reg_num: r.reg_num,
          format: r.format,
          parameter_name: r.parameter_name,
          default_value: r.default_value || '',
          value_to_write: r.value_to_write,
          value_read_back: r.value_read_back,
          status: r.status,
        })),
      };

      (async () => {
        try {
          const saveRes = await fetch('/api/c-modules/final-config-manager/devices', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeaders ? authHeaders() : {}),
            },
            body: JSON.stringify(savePayload),
          });
          if (saveRes.ok) {
            fcDbSaved.value = true;
          } else {
            console.warn('DB save warning:', await saveRes.text());
          }
        } catch (saveErr) {
          console.warn('DB save request failed:', saveErr);
        }

        // Update app_key in device_tested table
        try {
          await fetch('/api/device-tested/' + encodeURIComponent(fcHardwareInfo.value.serialNumber) + '/app-key', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeaders ? authHeaders() : {}),
            },
            body: JSON.stringify({ app_key: appKeyInput.value }),
          });
        } catch (dtErr) {
          console.warn('device_tested patch app_key warning:', dtErr);
        }
      })();
    } catch (err) {
      console.error('Final Config 4-Stage Workflow error:', err);
      finalVerdict.value = 'FAIL';
      fcStatusMessage.value = 'Execution stopped: ' + (err.message || err);
      if (currentStage.value === 1) stage1Status.value = 'FAIL';
      if (currentStage.value === 2) stage2Status.value = 'FAIL';
      if (currentStage.value === 3) stage3Status.value = 'FAIL';
      if (currentStage.value === 4) stage4Status.value = 'FAIL';
      if (showToast) showToast('Execution failed: ' + (err.message || err), 'error');
    } finally {
      isRunningFinalConfig.value = false;
      await safeCleanupUartPort();
    }
  };

  const resetFinalConfig = () => {
    isRunningFinalConfig.value = false;
    abortRequested.value = false;
    isWaitingReconnectOnAppKey.value = false;
    fcProgress.value = 0;
    currentStage.value = 0;
    finalVerdict.value = 'NONE';
    fcStatusMessage.value = '';
    fcMismatchCount.value = 0;
    fcDbSaved.value = false;
    stage1Status.value = 'IDLE';
    stage2Status.value = 'IDLE';
    stage3Status.value = 'IDLE';
    stage4Status.value = 'IDLE';
    stage2Settled.value = false;
    fcAppKeyWriteStatus.value = 'PENDING';
    fcWrittenRegsCount.value = 0;
    fcTotalWriteRegsCount.value = 0;
    fcReadBackRegsCount.value = 0;
    fcTotalMemmapRegsCount.value = 0;
    fcSoCheckStatus.value = 'NONE';
    fcSerialNumberInput.value = '';
    fcSelectedSo.value = '';
    selectedSo.value = '';
    selectedItemCode.value = '';
    fcSelectedItemCode.value = '';
    appKeyInput.value = '';
    fcHardwareInfo.value = {
      serialNumber: '',
      devEui: '',
      firmwareVersion: '',
      hwVersion: '',
      shortFw: 1,
      sensorType: 0,
      itemCode: '',
      sku: '',
    };
    if (currentPreset.value) {
      loadPresetBySoItem(selectedSo.value, selectedItemCode.value);
    } else {
      fcAuditRegisters.value = [];
      updateTabulatorData();
    }
    alreadyPassedModal.value = false;
    alreadyPassedInfo.value = null;
    fcTraceabilityData.value = null;
    if (showToast) showToast('Execution state reset.', 'info');
  };

  const abortFinalConfig = () => {
    abortRequested.value = true;
    isRunningFinalConfig.value = false;
    isWaitingReconnectOnAppKey.value = false;
    fcStatusMessage.value = 'Aborted by operator.';
    if (showToast) showToast('Execution aborted by operator.', 'warning');
  };

  // ----------------------------------------------------------------------
  // 6. TABULATOR 6.X INTEGRATION & EXPORTS
  // ----------------------------------------------------------------------
  const filteredAuditRegisters = computed(() => {
    let list = fcAuditRegisters.value;
    if (auditStatusFilter.value !== 'ALL') {
      list = list.filter(r => r.status === auditStatusFilter.value);
    }
    if (auditSearchQuery.value && auditSearchQuery.value.trim()) {
      const q = auditSearchQuery.value.trim().toLowerCase();
      list = list.filter(r =>
        String(r.address).includes(q) ||
        String(r.parameter_name || '').toLowerCase().includes(q) ||
        String(r.default_value || '').toLowerCase().includes(q) ||
        String(r.value_to_write || '').toLowerCase().includes(q) ||
        String(r.value_read_back || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  const updateTabulatorData = () => {
    if (auditTabulatorInstance) {
      auditTabulatorInstance.setData(filteredAuditRegisters.value);
    }
  };

  const initTabulatorTable = () => {
    nextTick(() => {
      const el = document.getElementById('final-config-device-table');
      if (!el || typeof Tabulator === 'undefined') return;

      if (auditTabulatorInstance) {
        try { auditTabulatorInstance.destroy(); } catch (e) {}
        auditTabulatorInstance = null;
      }

      auditTabulatorInstance = new Tabulator(el, {
        data: filteredAuditRegisters.value,
        layout: 'fitColumns',
        height: '460px',
        placeholder: 'No configuration registers loaded. Select SO and Item Code to populate.',
        initialSort: [
          { column: 'address', dir: 'asc' },
        ],
        columns: [
          { title: '#', field: 'order_no', width: 50, hozAlign: 'center', headerHozAlign: 'center' },
          {
            title: 'Dec Reg',
            field: 'address',
            width: 90,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => '<span class="font-mono font-bold text-slate-200">' + cell.getValue() + '</span>',
          },
          { title: 'Parameter Name', field: 'parameter_name', minWidth: 180 },
          {
            title: 'Format',
            field: 'format',
            width: 80,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => '<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">' + cell.getValue() + '</span>',
          },
          {
            title: 'Default Value',
            field: 'default_value',
            width: 120,
            hozAlign: 'left',
            headerHozAlign: 'left',
            formatter: (cell) => {
              const v = cell.getValue();
              const displayVal = (v !== undefined && v !== null && String(v).trim() !== '') ? v : '-';
              return '<span class="font-mono text-slate-400">' + displayVal + '</span>';
            },
          },
          {
            title: 'Target Value',
            field: 'value_to_write',
            width: 140,
            hozAlign: 'left',
            formatter: (cell) => '<span class="font-mono font-semibold text-emerald-300">' + (cell.getValue() !== undefined ? cell.getValue() : '') + '</span>',
          },
          {
            title: 'Read-Back',
            field: 'value_read_back',
            width: 140,
            hozAlign: 'left',
            formatter: (cell) => {
              const v = cell.getValue();
              if (v === 'READ_ERR') return '<span class="font-mono text-rose-400 font-bold">ERROR</span>';
              return '<span class="font-mono text-sky-300">' + (v || '-') + '</span>';
            },
          },
          {
            title: 'Status',
            field: 'status',
            width: 90,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const val = cell.getValue();
              if (val === 'PASS') {
                return '<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">PASS</span>';
              }
              if (val === 'FAIL') {
                return '<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">FAIL</span>';
              }
              return '<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-500 border border-slate-700">NONE</span>';
            },
          },
        ],
      });
    });
  };

  watch(filteredAuditRegisters, () => {
    updateTabulatorData();
  });

  watch(fcDebugMode, (newVal) => {
    if (newVal) {
      nextTick(() => {
        if (!auditTabulatorInstance) {
          initTabulatorTable();
        } else {
          auditTabulatorInstance.redraw(true);
          updateTabulatorData();
        }
      });
    }
  });

  const exportAuditCsv = () => {
    if (auditTabulatorInstance) {
      auditTabulatorInstance.download('csv', 'final_config_' + (fcHardwareInfo.value.serialNumber || 'audit') + '.csv');
    }
  };

  const exportAuditXlsx = () => {
    if (typeof XLSX === 'undefined') {
      if (showToast) showToast('SheetJS (XLSX) library not available.', 'error');
      return;
    }
    const data = fcAuditRegisters.value.map(r => ({
      Order: r.order_no,
      'Dec Address': r.address,
      'Parameter Name': r.parameter_name,
      Format: r.format,
      'Default Value': r.default_value || '-',
      'Target Value': r.value_to_write,
      'Read-Back Value': r.value_read_back,
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Final Config Audit');
    XLSX.writeFile(wb, 'final_config_' + (fcHardwareInfo.value.serialNumber || 'audit') + '.xlsx');
    if (showToast) showToast('Exported audit report to XLSX', 'success');
  };

  // ----------------------------------------------------------------------
  // 7. LIFECYCLE HOOKS
  // ----------------------------------------------------------------------
  const initFinalConfigDeviceModule = async () => {
    await fetchSalesOrders();
    initTabulatorTable();
  };

  onMounted(() => {
    if (typeof navigator !== 'undefined' && navigator.serial) {
      try {
        navigator.serial.addEventListener('disconnect', handleSerialDisconnect);
        navigator.serial.addEventListener('connect', handleSerialConnect);
      } catch (e) {}
    }
    if (activeFeature && activeFeature.value && activeFeature.value.id === 'final-config-device') {
      initFinalConfigDeviceModule();
    }
  });

  onUnmounted(() => {
    if (typeof navigator !== 'undefined' && navigator.serial) {
      try {
        navigator.serial.removeEventListener('disconnect', handleSerialDisconnect);
        navigator.serial.removeEventListener('connect', handleSerialConnect);
      } catch (e) {}
    }
    if (autoReconnectTimer) {
      clearTimeout(autoReconnectTimer);
      autoReconnectTimer = null;
    }
    safeCleanupUartPort();
    if (auditTabulatorInstance) {
      try { auditTabulatorInstance.destroy(); } catch (e) {}
      auditTabulatorInstance = null;
    }
  });

  const fcSelectSerialPort = selectSerialPort;
  const fcConnectSerial = connectSerial;
  const fcDisconnectSerial = disconnectSerial;
  const fcToggleDTR = toggleDTR;
  const fcToggleRTS = toggleRTS;
  const fcCopySerialLogs = copySerialLogs;
  const fcClearSerialLogs = clearSerialLogs;
  const fcOnSoChange = onSoChange;
  const fcOnItemCodeChange = onItemCodeChange;

  return {
    fcIsSerialSupported,
    fcSerialPort,
    fcSerialConnected,
    fcSerialConnecting,
    fcIsAutoReconnecting,
    isWaitingReconnectOnAppKey,
    fcSerialPortInfo,
    fcSerialConfig,
    fcSerialSignals,
    fcSerialStats,
    fcSerialLogs,
    fcShowTerminalLogs,
    fcSerialNumberInput,
    fcOnSerialNumberChange,
    fcSelectedSo,
    fcSelectedItemCode,
    fcSalesOrdersList,
    fcItemCodesList,
    fcSelectSerialPort,
    fcConnectSerial,
    fcDisconnectSerial,
    fcToggleDTR,
    fcToggleRTS,
    fcCopySerialLogs,
    fcClearSerialLogs,
    fcOnSoChange,
    fcOnItemCodeChange,
    currentPreset,
    appKeyInput,
    isAppKeyValid,
    isRunningFinalConfig,
    fcProgress,
    currentStage,
    fcStatusMessage,
    finalVerdict,
    fcHardwareInfo,
    fcSoCheckStatus,
    stage1Status,
    stage2Status,
    stage3Status,
    stage4Status,
    stage2Settled,
    fcWrittenRegsCount,
    fcTotalWriteRegsCount,
    fcAppKeyWriteStatus,
    fcReadBackRegsCount,
    fcTotalMemmapRegsCount,
    fcMismatchCount,
    fcDbSaved,
    fcAuditRegisters,
    auditSearchQuery,
    auditStatusFilter,
    filteredAuditRegisters,
    fcDebugMode,
    alreadyPassedModal,
    alreadyPassedInfo,
    generateRandomAppKey,
    startFinalConfig,
    resetFinalConfig,
    abortFinalConfig,
    exportAuditCsv,
    exportAuditXlsx,
    fcFormatBytes: formatBytes,
    MODBUS_WRITE_TIMEOUT_MS,
    INTER_WRITE_SETTLING_DELAY_MS,
    RETRY_BACKOFF_DELAYS,
    MAX_READ_ATTEMPTS,
    READ_RETRY_BACKOFF_DELAYS,
    INTER_READ_DELAY_MS,
    fcTraceabilityData,
    flushUartRxBuffer,
    readFirstRegisterUntilSuccess,
    probeDeviceReadyAndVerified,
    waitForPortReconnection,
    isPortDisconnectedError,
    initFinalConfigDeviceModule,
  };
}
`;
