"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FINAL_CONFIG_DEVICE_SCRIPT = exports.FINAL_CONFIG_DEVICE_MODALS = exports.FINAL_CONFIG_DEVICE_TEMPLATE = void 0;
exports.FINAL_CONFIG_DEVICE_TEMPLATE = `          <div v-else-if="activeFeature.id === 'final-config-device'" class="space-y-6">

            <!-- 1. TOP HEADER & WEB SERIAL CONNECTION BAR -->
            <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <!-- Title, Badges & Hardware Status -->
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
                    <p class="text-xs text-slate-400 mt-0.5">
                      Direct UART Modbus RTU execution: Hardware ID & SO Verification, Preset & AppKey 274 Writing, Memory Snapshot, and Automated Pass/Fail Verdict.
                    </p>
                  </div>

                  <!-- Connection status pill -->
                  <div
                    class="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition ml-auto lg:ml-2"
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

                <!-- Packet & Communication Counters -->
                <div class="flex items-center gap-2 flex-wrap">
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

              <!-- Connection Actions Bar -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
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

                <!-- Right controls: Terminal Log Toggle -->
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="fcShowTerminalLogs = !fcShowTerminalLogs"
                    class="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    :class="fcShowTerminalLogs ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
                  >
                    <i class="fa-solid fa-terminal"></i>
                    <span>UART Log ({{ fcSerialLogs.length }})</span>
                  </button>
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

            <!-- Banner placeholder before 25% -->
            <div v-else class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-slate-400 text-xs shadow-md">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-shield-halved text-cyan-400 text-sm"></i>
                <span>Work Order & Serial Number will automatically appear after Stage 1 (>= 25%) hardware identification and QA validation.</span>
              </div>
              <span class="text-[10px] font-mono font-bold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800">Awaiting Stage 1</span>
            </div>

            <!-- 3. EXECUTION CONTROLS & 4-STAGE PROGRESS WORKBENCH -->
            <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
              <!-- Top Actions: Run, Reset, Abort & Verdict Banner -->
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-3 flex-wrap">
                  <!-- START BUTTON -->
                  <button
                    type="button"
                    @click="startFinalConfig"
                    :disabled="!fcSerialConnected || isRunningFinalConfig"
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
                      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">FINAL VERDICT</div>
                      <div class="text-sm font-black font-mono">
                        {{ finalVerdict === 'PASS' ? 'FINAL PASS' : (finalVerdict === 'FAIL' ? 'FINAL FAIL' : 'NONE / READY') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Main Visual Progress Bar (0% - 100%) -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs font-mono font-bold">
                  <span class="text-slate-300 flex items-center gap-2">
                    <span>EXECUTION PROGRESS:</span>
                    <span class="text-cyan-400">{{ fcProgress }}%</span>
                    <span v-if="fcStatusMessage" class="text-slate-400 font-normal">({{ fcStatusMessage }})</span>
                  </span>
                  <span class="text-slate-400">Stage {{ currentStage > 0 ? currentStage : '-' }} / 4</span>
                </div>
                <div class="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
                  <div
                    class="h-full transition-all duration-300 rounded-full"
                    :class="finalVerdict === 'FAIL'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500'"
                    :style="{ width: fcProgress + '%' }"
                  ></div>
                </div>
              </div>

              <!-- 4-Stage Step Cards Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
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
                      <span class="text-cyan-300">Modbus FC 16 / 06</span>
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
            <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
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
            <div v-if="fcShowTerminalLogs" class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
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
exports.FINAL_CONFIG_DEVICE_MODALS = ``;
exports.FINAL_CONFIG_DEVICE_SCRIPT = `
function useFinalConfigDeviceModule(ctx) {
  const { showToast, authHeaders, activeFeature, copyText, currentUser } = ctx || {};
  const { ref, computed, watch, nextTick, onMounted, onUnmounted } = Vue;

  // ----------------------------------------------------------------------
  // 1. WEB SERIAL CONNECTION & HARDWARE AUTO-RECONNECT ENGINE
  // ----------------------------------------------------------------------
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
  const fcSerialPortInfo = ref('');
  const serialPortInfo = fcSerialPortInfo;
  const fcSerialConfig = ref({
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none',
    bufferSize: 255,
    timeoutMs: 1200,
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
      isAutoReconnecting.value = false;
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
            addSerialLog('SYS', null, 'Auto-reconnected successfully to ' + desc);
            if (showToast) showToast('COM port auto-reconnected successfully', 'success');
          } catch (err) {
            console.warn('Auto-reconnect attempt 1 failed, retrying in 1000ms...', err);
            setTimeout(async () => {
              try {
                if (serialConnected.value) return;
                await connectSerial(newPort);
                isAutoReconnecting.value = false;
                addSerialLog('SYS', null, 'Auto-reconnected successfully on retry');
                if (showToast) showToast('COM port auto-reconnected successfully', 'success');
              } catch (retryErr) {
                console.error('Auto-reconnect retry failed:', retryErr);
                isAutoReconnecting.value = false;
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
  // 2. MODBUS RTU COMMUNICATION PROTOCOL (FC 03, FC 06, FC 16)
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
  const readModbusRegistersFromPort = async (slave, reg, numreg, timeoutMs = 1200) => {
    if (!serialPort.value || !serialPort.value.readable || !serialPort.value.writable) {
      throw new Error('Serial port is not open or readable');
    }
    await safeCleanupUartPort();

    const req = buildModbusReadReq(slave, 3, reg, numreg);
    activeUartWriter = serialPort.value.writable.getWriter();
    try {
      await activeUartWriter.write(req);
      serialStats.value.txPackets++;
      serialStats.value.txBytes += req.length;
      addSerialLog('TX', req, 'Read Reg ' + reg + ' (' + numreg + ' regs)');
    } finally {
      try { activeUartWriter.releaseLock(); } catch (e) {}
      activeUartWriter = null;
    }

    activeUartReader = serialPort.value.readable.getReader();
    const expectedBytes = 3 + numreg * 2 + 2;
    const rxBuffer = [];
    const startTime = Date.now();

    try {
      while (rxBuffer.length < expectedBytes && (Date.now() - startTime) < timeoutMs) {
        const remaining = Math.max(10, timeoutMs - (Date.now() - startTime));
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
      throw new Error('No response received from device for register ' + reg);
    }

    serialStats.value.rxPackets++;
    serialStats.value.rxBytes += rxBuffer.length;
    addSerialLog('RX', rxBuffer, 'Read Reg ' + reg + ' response');

    // CRC check
    const dataLen = rxBuffer.length;
    const calcCrc = calcModbusCRC16(rxBuffer.slice(0, dataLen - 2));
    const rxCrc = rxBuffer[dataLen - 2] | (rxBuffer[dataLen - 1] << 8);
    if (calcCrc !== rxCrc) {
      serialStats.value.errCount++;
      throw new Error('CRC error for register ' + reg);
    }

    const byteCount = rxBuffer[2];
    return rxBuffer.slice(3, 3 + byteCount);
  };

  // Write Modbus Registers via FC 16 (Multiple) or FC 06 (Single)
  const writeModbusRegistersToPort = async (slave, fc, reg, numreg, dataBytes, timeoutMs = 1200) => {
    if (!serialPort.value || !serialPort.value.readable || !serialPort.value.writable) {
      throw new Error('Serial port is not open or writable');
    }
    await safeCleanupUartPort();

    const s = Number(slave) & 0xFF;
    const r = Number(reg);
    let frame = [];

    if (fc === 6 && numreg === 1 && dataBytes.length === 2) {
      // Single Register FC 06
      frame = [s, 0x06, (r >> 8) & 0xFF, r & 0xFF, dataBytes[0], dataBytes[1]];
    } else {
      // Multiple Registers FC 16 (0x10)
      const n = Number(numreg);
      const byteCount = dataBytes.length;
      frame = [
        s,
        0x10,
        (r >> 8) & 0xFF,
        r & 0xFF,
        (n >> 8) & 0xFF,
        n & 0xFF,
        byteCount,
        ...dataBytes,
      ];
    }

    const crc = calcModbusCRC16(frame);
    frame.push(crc & 0xFF);
    frame.push((crc >> 8) & 0xFF);
    const req = new Uint8Array(frame);

    activeUartWriter = serialPort.value.writable.getWriter();
    try {
      await activeUartWriter.write(req);
      serialStats.value.txPackets++;
      serialStats.value.txBytes += req.length;
      addSerialLog('TX', req, 'Write Reg ' + reg + ' (FC ' + (fc === 6 ? '06' : '16') + ')');
    } finally {
      try { activeUartWriter.releaseLock(); } catch (e) {}
      activeUartWriter = null;
    }

    activeUartReader = serialPort.value.readable.getReader();
    const expectedBytes = 8; // Slave (1), FC (1), Addr (2), RegCount (2), CRC (2)
    const rxBuffer = [];
    const startTime = Date.now();

    try {
      while (rxBuffer.length < expectedBytes && (Date.now() - startTime) < timeoutMs) {
        const remaining = Math.max(10, timeoutMs - (Date.now() - startTime));
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
      throw new Error('No write response received for register ' + reg);
    }

    serialStats.value.rxPackets++;
    serialStats.value.rxBytes += rxBuffer.length;
    addSerialLog('RX', rxBuffer, 'Write Reg ' + reg + ' response');

    // Check Modbus exception (FC | 0x80)
    if (rxBuffer[1] & 0x80) {
      serialStats.value.errCount++;
      throw new Error('Modbus Exception Code ' + rxBuffer[2] + ' on register ' + reg);
    }

    return rxBuffer;
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
          // Seed audit table from preset
          const regs = json.data.registers || [];
          fcAuditRegisters.value = regs.map((r, i) => ({
            order_no: i + 1,
            address: Number(r.address),
            modbus_reg_hex: r.modbus_reg_hex || ('0x' + Number(r.address).toString(16).padStart(4, '0').toUpperCase()),
            parameter_name: r.parameter_name || ('Register ' + r.address),
            format: r.format || 'uint',
            endianness: r.endianness || 'Big-Endian',
            reg_num: Number(r.reg_num) || 1,
            fn_write: r.fn_write || 'FC 16',
            value_to_write: r.value_to_write !== undefined ? String(r.value_to_write) : '',
            value_read_back: '',
            status: 'NONE',
          }));
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
  // 5. AUTOMATED 4-STAGE FINAL CONFIG WORKFLOW
  // ----------------------------------------------------------------------
  const startFinalConfig = async () => {
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
      fcStatusMessage.value = 'Reading hardware registers (SN, FW, DevEUI, Type, Item Code)...';
      fcProgress.value = 5;

      const bytesToAscii = (bytes) => {
        if (!bytes || !bytes.length) return '';
        return String.fromCharCode(...bytes.filter(b => b >= 32 && b <= 126)).trim();
      };
      const bytesToHex = (bytes) => {
        if (!bytes || !bytes.length) return '';
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      };

      // 1. Read Reg 259 (SERIAL_NUMBER: 9 regs, string)
      let readSn = '';
      try {
        const snBytes = await readModbusRegistersFromPort(1, 259, 9);
        readSn = bytesToAscii(snBytes);
      } catch (err) {
        throw new Error('Failed to read Serial Number (Reg 259): ' + (err.message || err));
      }
      if (!readSn) throw new Error('Serial Number (Reg 259) read from hardware is empty');
      fcHardwareInfo.value.serialNumber = readSn;
      fcSerialNumberInput.value = readSn;
      fcProgress.value = 10;

      // 2. Read Reg 27 (DEV_EUI: 4 regs = 8 bytes, hex)
      let readDevEui = '';
      try {
        const euiBytes = await readModbusRegistersFromPort(1, 27, 4);
        readDevEui = bytesToHex(euiBytes);
      } catch (err) {
        throw new Error('Failed to read DevEUI (Reg 27): ' + (err.message || err));
      }
      if (!readDevEui) throw new Error('DevEUI (Reg 27) read from hardware is empty');
      fcHardwareInfo.value.devEui = readDevEui;
      fcProgress.value = 15;

      // 3. Read Reg 5 (FW_VERSION: 4 regs, string)
      let readFw = '';
      try {
        const fwBytes = await readModbusRegistersFromPort(1, 5, 4);
        readFw = bytesToAscii(fwBytes);
      } catch (e) {
        console.warn('Failed to read FW (Reg 5):', e);
      }
      fcHardwareInfo.value.firmwareVersion = readFw || '1.0.0';
      fcHardwareInfo.value.shortFw = readFw ? (parseInt(readFw.charAt(0), 10) || 1) : 1;

      // 4. Read Reg 9 (HW_VERSION: 2 regs, string, FC 03)
      let readHw = '';
      try {
        const hwBytes = await readModbusRegistersFromPort(1, 9, 2);
        readHw = bytesToAscii(hwBytes);
      } catch (e) {
        console.warn('Failed to read HW (Reg 9):', e);
      }
      fcHardwareInfo.value.hwVersion = readHw || '';

      // 5. Read Reg 103 (SENSOR_TYPE: 1 reg, uint16)
      let readType = 0;
      try {
        const typeBytes = await readModbusRegistersFromPort(1, 103, 1);
        if (typeBytes && typeBytes.length >= 2) {
          readType = (typeBytes[0] << 8) | typeBytes[1];
        }
      } catch (e) {
        console.warn('Failed to read Sensor Type (Reg 103):', e);
      }
      fcHardwareInfo.value.sensorType = readType;

      // 6. Read Reg 386 (ITEM_CODE: 14 regs, string)
      let readItemCode = '';
      try {
        const icBytes = await readModbusRegistersFromPort(1, 386, 14);
        readItemCode = bytesToAscii(icBytes);
      } catch (e) {
        console.warn('Failed to read Item Code (Reg 386):', e);
      }
      fcHardwareInfo.value.itemCode = readItemCode;
      fcProgress.value = 20;

      // 7. Verify against device_tested table & Auto-map SO, Item Code, AppKey & Preset
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
        const fc = regItem.fn_write === 'FC 06' || numreg === 1 ? 6 : 16;

        // Retry up to 3 times on timeout
        let written = false;
        let lastErr = null;
        for (let retry = 0; retry < 3; retry++) {
          try {
            await writeModbusRegistersToPort(1, fc, addr, numreg, dataBytes);
            written = true;
            break;
          } catch (wErr) {
            lastErr = wErr;
            await new Promise(r => setTimeout(r, 150));
          }
        }
        if (!written) {
          throw new Error('Failed to write register ' + addr + ': ' + (lastErr?.message || lastErr));
        }

        fcWrittenRegsCount.value++;
        fcProgress.value = Math.min(45, 25 + Math.round((fcWrittenRegsCount.value / fcTotalWriteRegsCount.value) * 20));
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
        try {
          await writeModbusRegistersToPort(1, 16, 274, 8, appKeyBytes);
          appKeyWritten = true;
          break;
        } catch (kErr) {
          appKeyErr = kErr;
          await new Promise(r => setTimeout(r, 200));
        }
      }
      if (!appKeyWritten) {
        fcAppKeyWriteStatus.value = 'FAIL';
        throw new Error('Failed to write LoRaWAN AppKey (Reg 274): ' + (appKeyErr?.message || appKeyErr));
      }

      fcAppKeyWriteStatus.value = 'WRITTEN';
      fcWrittenRegsCount.value++;
      fcProgress.value = 50;

      // Settle time for MCU Flash / EEPROM commit
      fcStatusMessage.value = 'Hardware settling for Flash / EEPROM storage (350ms)...';
      await new Promise(r => setTimeout(r, 350));
      stage2Settled.value = true;
      stage2Status.value = 'PASS';
      if (abortRequested.value) return;

      // ==================================================================
      // STAGE 3: READ FULL MEMORY MAP & REGISTER SNAPSHOT (50% -> 75%)
      // ==================================================================
      currentStage.value = 3;
      stage3Status.value = 'RUNNING';
      fcStatusMessage.value = 'Reading full register memory map and taking snapshot...';

      // Build target registers to read back
      const allAuditList = [...fcAuditRegisters.value];

      // Ensure HW_VERSION Reg 9 is in audit list
      if (!allAuditList.some(r => r.address === 9)) {
        allAuditList.unshift({
          order_no: -1,
          address: 9,
          modbus_reg_hex: '0x0009',
          parameter_name: 'HW Version',
          format: 'ascii',
          endianness: 'Big-Endian',
          reg_num: 2,
          fn_read: 'FC 03',
          value_to_write: fcHardwareInfo.value.hwVersion || '',
          value_read_back: '',
          status: 'NONE',
        });
      }

      // Ensure AppKey 274 is in audit list
      if (!allAuditList.some(r => r.address === 274)) {
        allAuditList.unshift({
          order_no: 0,
          address: 274,
          modbus_reg_hex: '0x0112',
          parameter_name: 'LoRaWAN AppKey',
          format: 'hex',
          endianness: 'Big-Endian',
          reg_num: 8,
          fn_write: 'FC 16',
          value_to_write: cleanAppKey.toUpperCase(),
          value_read_back: '',
          status: 'NONE',
        });
      }

      fcTotalMemmapRegsCount.value = allAuditList.length;
      fcReadBackRegsCount.value = 0;

      for (let i = 0; i < allAuditList.length; i++) {
        if (abortRequested.value) return;
        const row = allAuditList[i];
        const addr = Number(row.address);
        const numreg = Number(row.reg_num) || 1;

        try {
          const rawBytes = await readModbusRegistersFromPort(1, addr, numreg);
          if (addr === 274 && numreg === 8) {
            row.value_read_back = bytesToHex(rawBytes);
          } else if (addr === 9 && numreg === 2) {
            row.value_read_back = bytesToAscii(rawBytes);
          } else {
            row.value_read_back = decodeModbusPayload(rawBytes, row.format, row.endianness);
          }
        } catch (rErr) {
          row.value_read_back = 'READ_ERR';
          console.warn('Read-back error for register ' + addr + ':', rErr);
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
        if (!isMatch) mismatchCount++;
      }

      fcMismatchCount.value = mismatchCount;
      const verdict = mismatchCount === 0 ? 'PASS' : 'FAIL';
      finalVerdict.value = verdict;
      stage4Status.value = verdict;
      fcProgress.value = 90;

      // Persist results to DB via POST /api/c-modules/final-config-manager/devices
      fcStatusMessage.value = 'Saving final config results to PostgreSQL (final_config_sn)...';
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
        registers: fcAuditRegisters.value.map(r => ({
          address: r.address,
          modbus_reg_hex: r.modbus_reg_hex,
          reg_num: r.reg_num,
          format: r.format,
          parameter_name: r.parameter_name,
          value_to_write: r.value_to_write,
          value_read_back: r.value_read_back,
          status: r.status,
        })),
      };

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
    if (showToast) showToast('Execution state reset.', 'info');
  };

  const abortFinalConfig = () => {
    abortRequested.value = true;
    isRunningFinalConfig.value = false;
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
        String(r.modbus_reg_hex || '').toLowerCase().includes(q) ||
        String(r.parameter_name || '').toLowerCase().includes(q) ||
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
          {
            title: 'Hex Reg',
            field: 'modbus_reg_hex',
            width: 90,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => '<span class="font-mono text-cyan-400">' + (cell.getValue() || '') + '</span>',
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
          {
            title: 'FC Write',
            field: 'fn_write',
            width: 80,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => '<span class="text-[10px] font-mono text-slate-400">' + (cell.getValue() || 'FC 16') + '</span>',
          },
        ],
      });
    });
  };

  watch(filteredAuditRegisters, () => {
    updateTabulatorData();
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
      'Hex Address': r.modbus_reg_hex,
      'Parameter Name': r.parameter_name,
      Format: r.format,
      'Target Value': r.value_to_write,
      'Read-Back Value': r.value_read_back,
      Status: r.status,
      'FC Write': r.fn_write,
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
    generateRandomAppKey,
    startFinalConfig,
    resetFinalConfig,
    abortFinalConfig,
    exportAuditCsv,
    exportAuditXlsx,
    fcFormatBytes: formatBytes,
    initFinalConfigDeviceModule,
  };
}
`;
//# sourceMappingURL=final-config-device.module.js.map