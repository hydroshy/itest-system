"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERIAL_UART_SCRIPT = exports.SERIAL_UART_MODALS = exports.SERIAL_UART_TEMPLATE = void 0;
exports.SERIAL_UART_TEMPLATE = `          <div v-else-if="activeFeature.id === 'serial-uart-monitor' || activeFeature.id === 'serial-diagnostic'" class="space-y-5">
            <!-- 1. TOP HEADER & CONNECTION CONTROL BAR -->
            <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <!-- Top row: Title, Status Chip, Stats & Controls -->
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <!-- Title & Status -->
                <div class="flex items-center gap-3 flex-wrap">
                  <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
                    <i class="fa-solid fa-bolt"></i>
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>MODBUS TTL / RS485 & SERIAL UART DIAGNOSTIC</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        WEB SERIAL API
                      </span>
                    </h2>
                    <p class="text-xs text-slate-400">Direct hardware UART connection for Modbus RTU register polling, memory mapping, and packet analysis.</p>
                  </div>

                  <!-- Connection status pill -->
                  <div
                    class="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border transition ml-auto lg:ml-2"
                    :class="serialConnected
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : (serialPort
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400')"
                  >
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="serialConnected ? 'bg-emerald-400 animate-ping' : (isAutoReconnecting ? 'bg-amber-400 animate-ping' : (serialPort ? 'bg-amber-400' : 'bg-slate-500'))"
                    ></span>
                    <i :class="serialConnected ? 'fa-solid fa-link' : (isAutoReconnecting ? 'fa-solid fa-arrows-rotate animate-spin text-amber-400' : (serialPort ? 'fa-solid fa-microchip' : 'fa-solid fa-plug-circle-xmark'))"></i>
                    <span>{{ serialPortInfo || 'No Port Selected' }} {{ serialConnected ? '(Connected)' : (isAutoReconnecting ? '(Reconnecting...)' : (serialPort ? '(Ready)' : '')) }}</span>
                  </div>
                </div>

                <!-- Packet & Log Stats Pills -->
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-3">
                    <span class="text-cyan-400 font-bold" title="Transmit Packets & Bytes">
                      <i class="fa-solid fa-arrow-up text-[10px] mr-1"></i>TX: {{ serialStats.txPackets }} ({{ formatBytes(serialStats.txBytes) }})
                    </span>
                    <span class="text-slate-600">|</span>
                    <span class="text-emerald-400 font-bold" title="Receive Packets & Bytes">
                      <i class="fa-solid fa-arrow-down text-[10px] mr-1"></i>RX: {{ serialStats.rxPackets }} ({{ formatBytes(serialStats.rxBytes) }})
                    </span>
                    <span class="text-slate-600">|</span>
                    <span class="text-rose-400 font-bold" title="Timeout or CRC Error Packets">
                      <i class="fa-solid fa-circle-exclamation text-[10px] mr-1"></i>Err: {{ serialStats.errCount }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Connection Actions Bar -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Select Device / Port button -->
                  <button
                    v-if="!serialPort"
                    type="button"
                    @click="selectSerialPort"
                    class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-900/20 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <i class="fa-solid fa-plug"></i>
                    <span>Select Port</span>
                  </button>

                  <!-- Connect button -->
                  <button
                    v-if="serialPort && !serialConnected"
                    type="button"
                    @click="connectSerial"
                    :disabled="serialConnecting || isAutoReconnecting"
                    class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/20 flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                  >
                    <i class="fa-solid fa-link" :class="{ 'animate-spin': serialConnecting || isAutoReconnecting }"></i>
                    <span>{{ isAutoReconnecting ? 'Reconnecting...' : 'Connect' }}</span>
                  </button>

                  <!-- Disconnect button -->
                  <button
                    v-if="serialConnected"
                    type="button"
                    @click="disconnectSerial"
                    class="px-3.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <i class="fa-solid fa-link-slash"></i>
                    <span>Disconnect</span>
                  </button>

                  <!-- Change Port button -->
                  <button
                    v-if="serialPort"
                    type="button"
                    @click="selectSerialPort"
                    :disabled="serialConnected || isAutoReconnecting"
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-40"
                    title="Choose a different serial port"
                  >
                    <i class="fa-solid fa-arrows-rotate"></i>
                    <span>Change Port</span>
                  </button>

                  <!-- Baud Rate Selector -->
                  <div class="flex items-center gap-1 text-xs">
                    <span class="text-slate-400 font-semibold hidden md:inline">Baud:</span>
                    <select
                      v-model.number="serialConfig.baudRate"
                      :disabled="serialConnected"
                      class="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono disabled:opacity-50"
                    >
                      <option :value="1200">1200 bps</option>
                      <option :value="2400">2400 bps</option>
                      <option :value="4800">4800 bps</option>
                      <option :value="9600">9600 bps</option>
                      <option :value="19200">19200 bps</option>
                      <option :value="38400">38400 bps</option>
                      <option :value="57600">57600 bps</option>
                      <option :value="115200">115200 bps</option>
                      <option :value="230400">230400 bps</option>
                      <option :value="460800">460800 bps</option>
                      <option :value="921600">921600 bps</option>
                    </select>
                  </div>

                  <!-- DTR / RTS signals toggle -->
                  <div class="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                    <button
                      type="button"
                      @click="toggleDTR"
                      :disabled="!serialConnected"
                      class="px-2 py-1 rounded text-[11px] font-mono font-bold border transition cursor-pointer disabled:opacity-40"
                      :class="serialSignals.dtr ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm' : 'bg-slate-950 text-slate-500 border-slate-800'"
                      title="Data Terminal Ready (DTR) signal"
                    >
                      DTR: {{ serialSignals.dtr ? 'HIGH' : 'LOW' }}
                    </button>
                    <button
                      type="button"
                      @click="toggleRTS"
                      :disabled="!serialConnected"
                      class="px-2 py-1 rounded text-[11px] font-mono font-bold border transition cursor-pointer disabled:opacity-40"
                      :class="serialSignals.rts ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm' : 'bg-slate-950 text-slate-500 border-slate-800'"
                      title="Request To Send (RTS) signal"
                    >
                      RTS: {{ serialSignals.rts ? 'HIGH' : 'LOW' }}
                    </button>
                  </div>
                </div>

                <!-- Settings Toggle Button -->
                <button
                  type="button"
                  @click="showSettingsDrawer = !showSettingsDrawer"
                  class="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition self-end sm:self-auto"
                  :class="showSettingsDrawer ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'"
                >
                  <i class="fa-solid fa-sliders"></i>
                  <span>{{ showSettingsDrawer ? 'Hide Port Settings' : 'Port Settings' }}</span>
                  <i class="fa-solid" :class="showSettingsDrawer ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </button>
              </div>

              <!-- Browser Compatibility Warning (if Web Serial not supported) -->
              <div v-if="!isSerialSupported" class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
                <i class="fa-solid fa-triangle-exclamation text-amber-400 text-base mt-0.5"></i>
                <div class="space-y-1">
                  <div class="font-bold">Web Serial API is not supported in this browser environment.</div>
                  <p class="text-slate-300">
                    The Web Serial API requires a Chromium-based browser (Google Chrome, Microsoft Edge, or Opera) running over a secure context (HTTPS) or <code>localhost</code>. Safari and Firefox currently do not support Web Serial.
                  </p>
                </div>
              </div>

              <!-- Collapsible Serial Configuration Panel -->
              <div v-if="showSettingsDrawer" class="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 animate-in fade-in">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-wrench text-cyan-400"></i>
                    <span>UART & Protocol Parameters</span>
                  </span>
                  <span class="text-[11px] text-slate-400 font-mono">Standard 8-N-1 default</span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Data Bits</label>
                    <select v-model.number="serialConfig.dataBits" :disabled="serialConnected" class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono disabled:opacity-50">
                      <option :value="8">8 bits</option>
                      <option :value="7">7 bits</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Stop Bits</label>
                    <select v-model.number="serialConfig.stopBits" :disabled="serialConnected" class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono disabled:opacity-50">
                      <option :value="1">1 bit</option>
                      <option :value="2">2 bits</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Parity</label>
                    <select v-model="serialConfig.parity" :disabled="serialConnected" class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono disabled:opacity-50">
                      <option value="none">None</option>
                      <option value="even">Even</option>
                      <option value="odd">Odd</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Flow Control</label>
                    <select v-model="serialConfig.flowControl" :disabled="serialConnected" class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono disabled:opacity-50">
                      <option value="none">None</option>
                      <option value="hardware">Hardware (RTS/CTS)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Timeout (ms)</label>
                    <select v-model.number="serialConfig.timeoutMs" class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono">
                      <option :value="300">300 ms</option>
                      <option :value="500">500 ms</option>
                      <option :value="1000">1000 ms</option>
                      <option :value="2000">2000 ms</option>
                      <option :value="3000">3000 ms</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Inter-frame Delay</label>
                    <select v-model.number="serialConfig.interframeDelayMs" class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono">
                      <option :value="10">10 ms</option>
                      <option :value="20">20 ms</option>
                      <option :value="50">50 ms</option>
                      <option :value="100">100 ms</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. MAIN SUB-TABS NAVIGATION -->
            <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                @click="serialActiveTab = 'MAP'"
                class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border"
                :class="serialActiveTab === 'MAP'
                  ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50 text-cyan-300 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                <i class="fa-solid fa-table-list"></i>
                <span>Tabular Memory Map</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-950 text-cyan-400 border border-slate-800">
                  {{ modbusRegisters.length }}
                </span>
              </button>

              <button
                type="button"
                @click="serialActiveTab = 'TERMINAL'"
                class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border"
                :class="serialActiveTab === 'TERMINAL'
                  ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50 text-cyan-300 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'"
              >
                <i class="fa-solid fa-terminal"></i>
                <span>Raw Serial Terminal</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
                  {{ serialLogs.length }}
                </span>
              </button>
            </div>

            <!-- 3. TAB 1: TABULAR MEMORY MAP -->
            <div v-show="serialActiveTab === 'MAP'" class="space-y-4">
              <!-- Action Toolbar -->
              <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
                <!-- Left: Profile selector & Batch Read/Write -->
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Preset selector -->
                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="text-slate-400 font-semibold text-[11px]">Preset:</span>
                    <select
                      v-model="selectedModbusPreset"
                      @change="applySelectedPreset"
                      @focus="fetchAvailablePresets"
                      @click="fetchAvailablePresets"
                      class="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option v-for="p in modbusPresets" :key="p.sku" :value="p.sku">
                        {{ p.name }}
                      </option>
                    </select>
                    <button
                      type="button"
                      @click="refreshCurrentPreset"
                      class="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-700 transition cursor-pointer"
                      title="Sync / Reload template from server"
                    >
                      <i class="fa-solid fa-arrows-rotate text-xs"></i>
                    </button>
                  </div>

                  <!-- Start / Stop Button -->
                  <button
                    type="button"
                    @click="toggleStartStop"
                    class="px-3.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-md"
                    :class="isPolling
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/50 text-rose-300'
                      : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-emerald-900/30'"
                    title="Auto Read / Write based on tick box (FC 03/04 = Read, FC 16/06 = Write)"
                  >
                    <span class="w-2 h-2 rounded-full" :class="isPolling ? 'bg-rose-400 animate-ping' : 'bg-white'"></span>
                    <i class="fa-solid" :class="isPolling ? 'fa-stop' : 'fa-play'"></i>
                    <span>{{ isPolling ? 'Stop' : 'Start' }}</span>
                  </button>

                  <!-- Polling Interval selector -->
                  <div class="flex items-center gap-1 text-xs">
                    <span class="text-slate-400 font-semibold text-[11px] hidden sm:inline">Interval:</span>
                    <select
                      v-model.number="pollingIntervalMs"
                      class="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
                      title="Interval between cycles"
                    >
                      <option :value="200">200 ms</option>
                      <option :value="500">500 ms</option>
                      <option :value="1000">1000 ms</option>
                      <option :value="2000">2000 ms</option>
                      <option :value="5000">5000 ms</option>
                    </select>
                  </div>
                </div>

                <!-- Right: Add, Import, Export, Clear -->
                <div class="flex items-center gap-2 flex-wrap self-end md:self-auto">
                  <!-- Register search filter -->
                  <div class="relative">
                    <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-500 text-xs"></i>
                    <input
                      type="text"
                      v-model="registerSearchQuery"
                      placeholder="Search registers..."
                      class="pl-7 pr-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 font-mono w-36 lg:w-48 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <!-- Add Row button (Spreadsheet inline) -->
                  <button
                    type="button"
                    @click="addNewRegisterRow"
                    class="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    title="Insert new register row"
                  >
                    <i class="fa-solid fa-plus"></i>
                    <span>Add Row</span>
                  </button>

                  <!-- Delete Selected button -->
                  <button
                    v-if="selectedRowCount > 0"
                    type="button"
                    @click="deleteSelectedRows"
                    class="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition animate-pulse"
                    title="Delete selected rows (or press Delete key)"
                  >
                    <i class="fa-regular fa-trash-can"></i>
                    <span>Delete ({{ selectedRowCount }})</span>
                  </button>

                  <!-- Add Register Modal button -->
                  <button
                    type="button"
                    @click="showAddRegisterModal = true"
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    title="Add custom register via dialog"
                  >
                    <i class="fa-solid fa-sliders text-cyan-400"></i>
                    <span>Add Dialog</span>
                  </button>

                  <!-- Hidden CSV File Input -->
                  <input
                    type="file"
                    ref="csvFileInputRef"
                    accept=".csv"
                    class="hidden"
                    @change="handleImportCSV"
                  />

                  <!-- Import CSV -->
                  <button
                    type="button"
                    @click="$refs.csvFileInputRef.click()"
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    title="Import Modbus registers from CSV"
                  >
                    <i class="fa-solid fa-file-import text-amber-400"></i>
                    <span>Import</span>
                  </button>

                  <!-- Export CSV -->
                  <button
                    type="button"
                    @click="exportRegistersCSV"
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    title="Export memory map to CSV"
                  >
                    <i class="fa-solid fa-file-export text-emerald-400"></i>
                    <span>Export</span>
                  </button>

                  <!-- Clear Values -->
                  <button
                    type="button"
                    @click="clearAllRegisterValues"
                    class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs cursor-pointer transition"
                    title="Clear live values"
                  >
                    <i class="fa-solid fa-broom"></i>
                  </button>
                </div>
              </div>

              <!-- Modbus Registers Grid Card (Tabulator 6.x Table) -->
              <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
                <!-- Tabulator Table Container -->
                <div id="modbus-tabulator-table" tabindex="0" class="rounded-xl overflow-hidden shadow-inner min-h-[420px] outline-none"></div>
                <!-- Status footer summary -->
                <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 px-2 pt-1 border-t border-slate-800/60">
                  <div class="flex items-center gap-3">
                    <span>Total: <strong class="text-white">{{ modbusRegisters.length }}</strong> registers</span>
                    <span>Checked: <strong class="text-cyan-400">{{ checkedRowCount }}</strong></span>
                    <span v-if="selectedRowCount > 0">Selected: <strong class="text-amber-400">{{ selectedRowCount }}</strong></span>
                  </div>
                  <div class="flex items-center gap-2 text-[10px] text-slate-500">
                    <span class="flex items-center gap-1"><i class="fa-solid fa-lightbulb text-cyan-400"></i> Double-click cell to edit</span>
                    <span>•</span>
                    <span>Right-click row for actions</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. TAB 2: RAW SERIAL TERMINAL -->
            <div v-show="serialActiveTab === 'TERMINAL'" class="space-y-4">
              <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <!-- Terminal Controls Bar -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-terminal text-cyan-400"></i>
                      <span>Serial Stream Monitor</span>
                    </span>

                    <!-- Filter pills -->
                    <div class="flex items-center gap-1 pl-2 border-l border-slate-800">
                      <button
                        v-for="flt in ['ALL', 'TX', 'RX', 'ERR']"
                        :key="flt"
                        type="button"
                        @click="serialLogFilter = flt"
                        class="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer border"
                        :class="serialLogFilter === flt
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'"
                      >
                        {{ flt }}
                      </button>
                    </div>

                    <!-- View mode toggle: HEX vs ASCII -->
                    <div class="flex items-center gap-1 pl-2 border-l border-slate-800">
                      <button
                        type="button"
                        @click="serialLogViewMode = 'HEX'"
                        class="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer border"
                        :class="serialLogViewMode === 'HEX' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'"
                      >
                        HEX
                      </button>
                      <button
                        type="button"
                        @click="serialLogViewMode = 'ASCII'"
                        class="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer border"
                        :class="serialLogViewMode === 'ASCII' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'"
                      >
                        ASCII
                      </button>
                    </div>
                  </div>

                  <!-- Right actions: Auto-scroll, Copy, Clear -->
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="serialPauseScroll = !serialPauseScroll"
                      class="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer"
                      :class="serialPauseScroll ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'"
                      title="Pause or resume auto-scroll"
                    >
                      <i class="fa-solid" :class="serialPauseScroll ? 'fa-pause' : 'fa-arrow-down'"></i>
                      <span>{{ serialPauseScroll ? 'Paused' : 'Auto-scroll' }}</span>
                    </button>

                    <button
                      type="button"
                      @click="copySerialTerminalLogs"
                      class="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs cursor-pointer transition"
                      title="Copy all logs to clipboard"
                    >
                      <i class="fa-regular fa-copy"></i>
                    </button>

                    <button
                      type="button"
                      @click="clearSerialTerminalLogs"
                      class="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs cursor-pointer transition"
                      title="Clear terminal stream"
                    >
                      <i class="fa-solid fa-broom"></i>
                    </button>
                  </div>
                </div>

                <!-- Log Stream Window -->
                <div
                  ref="serialTerminalBoxRef"
                  class="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 h-80 overflow-y-auto custom-scroll space-y-1 select-text"
                >
                  <div v-if="filteredSerialLogs.length === 0" class="h-full flex items-center justify-center text-slate-600 italic">
                    Serial stream is idle. Connect port and transmit or poll data to view packets.
                  </div>
                  <div
                    v-for="(log, lIdx) in filteredSerialLogs"
                    :key="log.id || lIdx"
                    class="flex items-start gap-2 py-0.5 leading-relaxed hover:bg-slate-900/50 rounded px-1"
                  >
                    <!-- Time -->
                    <span class="text-[10px] text-slate-500 select-none whitespace-nowrap">{{ log.time }}</span>

                    <!-- Tag Badge -->
                    <span
                      class="px-1.5 py-0.2 rounded text-[10px] font-bold select-none whitespace-nowrap"
                      :class="getLogTagClass(log.type)"
                    >
                      [{{ log.type }}]
                    </span>

                    <!-- Data Body -->
                    <div class="flex-1 break-all font-mono">
                      <span v-if="serialLogViewMode === 'HEX'" :class="getLogTextClass(log.type)">
                        {{ log.hex }}
                      </span>
                      <span v-else :class="getLogTextClass(log.type)">
                        {{ log.ascii }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Raw Command Sender Bar -->
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span class="font-bold text-slate-300">Transmit Custom Packet / Command:</span>
                    <div class="flex items-center gap-2">
                      <span>Format:</span>
                      <label class="cursor-pointer flex items-center gap-1">
                        <input type="radio" value="HEX" v-model="rawTx.format" class="text-cyan-500 focus:ring-0" />
                        <span>HEX</span>
                      </label>
                      <label class="cursor-pointer flex items-center gap-1">
                        <input type="radio" value="ASCII" v-model="rawTx.format" class="text-cyan-500 focus:ring-0" />
                        <span>ASCII</span>
                      </label>

                      <span class="ml-2">Suffix:</span>
                      <select v-model="rawTx.suffix" class="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-[10px]">
                        <option value="NONE">None</option>
                        <option value="CR">\\r (CR)</option>
                        <option value="LF">\\n (LF)</option>
                        <option value="CRLF">\\r\\n (CRLF)</option>
                      </select>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      v-model="rawTx.text"
                      @keyup.enter="sendRawCommand"
                      :placeholder="rawTx.format === 'HEX' ? 'e.g. 01 03 00 00 00 02 C4 0B' : 'e.g. AT+INFO'"
                      class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      @click="sendRawCommand"
                      :disabled="!serialConnected || !rawTx.text"
                      class="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/20 flex items-center gap-1.5 cursor-pointer transition disabled:opacity-40"
                    >
                      <i class="fa-solid fa-paper-plane"></i>
                      <span>Send</span>
                    </button>
                  </div>

                  <!-- Quick Command Shortcuts -->
                  <div class="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                    <span class="text-slate-500 text-[10px]">Shortcuts:</span>
                    <button
                      type="button"
                      @click="rawTx.format = 'HEX'; rawTx.text = '01 03 00 00 00 02 C4 0B'"
                      class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-mono text-[10px] cursor-pointer"
                    >
                      Modbus Read FC03 (Slave 1, Reg 0, Len 2)
                    </button>
                    <button
                      type="button"
                      @click="rawTx.format = 'HEX'; rawTx.text = '01 03 01 03 00 09 74 30'"
                      class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-mono text-[10px] cursor-pointer"
                      title="Read Reg 259 (SERIAL_NUMBER, 9 regs, FC 3)"
                    >
                      Modbus Read FC03 (Reg 259, Len 9 - Serial Number)
                    </button>
                    <button
                      type="button"
                      @click="rawTx.format = 'HEX'; rawTx.text = '01 04 00 00 00 02 71 CB'"
                      class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-mono text-[10px] cursor-pointer"
                    >
                      Modbus Read FC04 (Slave 1, Reg 0, Len 2)
                    </button>
                    <button
                      type="button"
                      @click="rawTx.format = 'ASCII'; rawTx.suffix = 'CRLF'; rawTx.text = 'AT'"
                      class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-[10px] cursor-pointer"
                    >
                      AT Test
                    </button>
                    <button
                      type="button"
                      @click="rawTx.format = 'ASCII'; rawTx.suffix = 'CRLF'; rawTx.text = 'AT+VER'"
                      class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-[10px] cursor-pointer"
                    >
                      AT+VER
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
`;
exports.SERIAL_UART_MODALS = `    <!-- MODAL: ADD MODBUS REGISTER ROW (SERIAL DIAGNOSTIC) -->
    <div v-if="showAddRegisterModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in text-slate-200">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2 font-bold text-white text-sm">
            <i class="fa-solid fa-plus text-cyan-400"></i>
            <span>Add Modbus Register Row</span>
          </div>
          <button type="button" @click="showAddRegisterModal = false" class="text-slate-400 hover:text-white cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Register Address (DEC)</label>
              <input type="number" v-model.number="newRegisterForm.reg" min="0" class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono" />
            </div>
            <div>
              <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Slave ID (1..247)</label>
              <input type="number" v-model.number="newRegisterForm.slave" min="1" max="247" class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Function Code (FC)</label>
              <select v-model.number="newRegisterForm.fc" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono">
                <option :value="4">04 (Input Register)</option>
                <option :value="16">16 (Write Multiple)</option>
                <option :value="3">03 (Holding Register)</option>
                <option :value="1">01 (Read Coils)</option>
                <option :value="2">02 (Discrete Inputs)</option>
                <option :value="6">06 (Write Single Reg)</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">REG_NUM (Count)</label>
              <select v-model.number="newRegisterForm.numreg" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono">
                <option :value="1">1 register (16-bit)</option>
                <option :value="2">2 registers (32-bit)</option>
                <option :value="4">4 registers (64-bit)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Data Format</label>
              <select v-model="newRegisterForm.format" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono">
                <option value="float">float</option>
                <option value="uint">uint</option>
                <option value="int">int</option>
                <option value="hex">hex</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Endianness</label>
              <select v-model="newRegisterForm.endianness" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono">
                <option value="Big-Endian">Big-Endian</option>
                <option value="Little-Endian">Little-Endian</option>
                <option value="Mid-Big">Mid-Big</option>
                <option value="Mid-Little">Mid-Little</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Parameter Name</label>
            <input type="text" v-model="newRegisterForm.parameter" placeholder="e.g. Temperature Sensor 1" class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono" />
          </div>

          <div>
            <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Value to Write</label>
            <input type="text" v-model="newRegisterForm.valuetowrite" placeholder="Optional" class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" @click="showAddRegisterModal = false" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
            Cancel
          </button>
          <button type="button" @click="confirmAddCustomRegister" class="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/20 cursor-pointer">
            Add Register
          </button>
        </div>
      </div>
    </div>
`;
exports.SERIAL_UART_SCRIPT = `
function useSerialModule(ctx) {
  const { showToast, authHeaders, activeFeature, copyText } = ctx || {};
  const { ref, computed, watch, nextTick, onMounted, onUnmounted } = Vue;

        // ========================================================
        // 5. SERIAL UART & MODBUS DIAGNOSTIC ENGINE (WEB SERIAL)
        // ========================================================
        const isSerialSupported = ref(typeof navigator !== 'undefined' && 'serial' in navigator);
        const serialPort = ref(null);
        const serialConnected = ref(false);
        const serialConnecting = ref(false);
        const isAutoReconnecting = ref(false);
        const serialPortInfo = ref('');
        const serialConfig = ref({
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none',
          bufferSize: 255,
          timeoutMs: 1000,
          interframeDelayMs: 20,
        });
        const serialSignals = ref({ dtr: false, rts: false });
        const serialStats = ref({
          txPackets: 0,
          rxPackets: 0,
          txBytes: 0,
          rxBytes: 0,
          errCount: 0,
        });
        const serialLogs = ref([]);
        const serialLogFilter = ref('ALL');
        const serialLogViewMode = ref('HEX');
        const serialPauseScroll = ref(false);
        const serialActiveTab = ref('MAP');
        const showSettingsDrawer = ref(false);
        const showAddRegisterModal = ref(false);
        const registerSearchQuery = ref('');
        const selectedModbusPreset = ref('WSL-AMBIENT');
        const rawTx = ref({ text: '01 03 00 00 00 02 C4 0B', format: 'HEX', suffix: 'NONE' });
        const serialTerminalBoxRef = ref(null);
        const csvFileInputRef = ref(null);

        const isPolling = ref(false);
        const pollingIntervalMs = ref(1000);
        const batchReading = ref(false);
        const batchWriting = ref(false);
        let pollingTimer = null;

        let serialReader = null;
        let serialWriter = null;
        let keepReadingSerial = false;
        let incomingBuffer = [];
        let pendingModbusTx = null;
        let lastConnectedPortInfo = null;
        let autoReconnectTimer = null;

        const modbusPresets = ref([
          {
            sku: 'WSL-AMBIENT',
            name: 'Daviteq WSL Ambient T&H Sensor',
            description: 'Ambient Temperature, Humidity, Barometer, Light, Battery',
            fw: 1,
          },
          {
            sku: 'WSL-LEVEL',
            name: 'Daviteq WSL Hydrostatic Level Sensor',
            description: 'Liquid Level, Water Temperature, Sensor Status, Battery',
            fw: 1,
          },
          {
            sku: 'ENERGY-METER-3P',
            name: '3-Phase Industrial Energy Meter',
            description: 'Voltage L1-L3, Current L1-L3, Active Power, Power Factor, Frequency',
            fw: 1,
          },
          {
            sku: 'MODBUS-IO-MODULE',
            name: 'Daviteq Modbus IO Module',
            description: 'Digital Inputs, Relay Outputs, 4-20mA / 0-10V Analog Inputs',
            fw: 1,
          },
          {
            sku: 'CUSTOM',
            name: 'Custom Memory Map',
            description: 'Empty table ready for manual register mapping and CSV import',
            fw: 1,
          },
        ]);

        const modbusRegisters = ref([]);

        const newRegisterForm = ref({
          reg: 0,
          slave: 1,
          fc: 4,
          numreg: 1,
          format: 'uint',
          endianness: 'Big-Endian',
          parameter: '',
          valuetowrite: '',
        });

        // Tabulator 6.x Instance & Reactive Selection
        let tabulatorTable = null;
        let isBuildingTable = false;
        let lastSelectedRowId = null;
        const selectedRowCount = ref(0);
        const checkedRowCount = computed(() => modbusRegisters.value.filter(r => r.checked).length);

        const updateTabulatorData = async () => {
          const container = document.getElementById('modbus-tabulator-table');
          if (!container) return;
          if (!tabulatorTable || tabulatorTable.element !== container) {
            initTabulatorTable();
            return;
          }
          if (isBuildingTable) {
            setTimeout(updateTabulatorData, 80);
            return;
          }
          try {
            await tabulatorTable.setData(modbusRegisters.value);
            tabulatorTable.redraw(true);
          } catch(e) {
            initTabulatorTable();
          }
        };

        let initTableTimer = null;
        const initTabulatorTable = (retryCount = 0) => {
          if (isBuildingTable) return;

          // Don't mount if serial-uart-monitor is not active
          if (activeFeature && activeFeature.value && activeFeature.value.id !== 'serial-uart-monitor' && activeFeature.value.id !== 'serial-diagnostic') {
            return;
          }

          const container = document.getElementById('modbus-tabulator-table');
          if (!container) {
            if (retryCount < 30) {
              clearTimeout(initTableTimer);
              initTableTimer = setTimeout(() => initTabulatorTable(retryCount + 1), 60);
            }
            return;
          }

          if (typeof Tabulator === 'undefined') {
            if (retryCount < 40) {
              clearTimeout(initTableTimer);
              initTableTimer = setTimeout(() => initTabulatorTable(retryCount + 1), 100);
            }
            return;
          }

          // If table already exists on THIS exact container, is attached to DOM, and healthy
          if (tabulatorTable && tabulatorTable.element === container && container.classList.contains('tabulator')) {
            try {
              tabulatorTable.setData(modbusRegisters.value);
              tabulatorTable.redraw(true);
              return;
            } catch(e) {
              tabulatorTable = null;
            }
          }

          isBuildingTable = true;
          if (tabulatorTable) {
            try {
              tabulatorTable.destroy();
            } catch(e) {}
            tabulatorTable = null;
          }
          container.innerHTML = '';

          try {
            tabulatorTable = new Tabulator(container, {
              data: modbusRegisters.value,
              layout: "fitColumns",
              height: "560px",
              reactiveData: false,
              selectableRows: "highlight",
              history: true,
            rowClick: function(e, row) {
              if (e._handledInCell) return;
              const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
              if (tag === 'input' || tag === 'select') return;
              row.select();
              lastSelectedRowId = row.getData().id;
            },
            rowDblClick: function(e, row) {
              if (e._handledInCell) return;
              const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
              if (tag === 'input' || tag === 'select') return;
              row.deselect();
            },
            rowContextMenu: [
              {
                label: "<i class='fa-solid fa-play text-emerald-400 mr-2'></i> Execute Read / Write",
                action: function(e, row) {
                  executeSingleRow(row.getData());
                }
              },
              {
                label: "<i class='fa-solid fa-plus text-cyan-400 mr-2'></i> Insert Row Below",
                action: function(e, row) {
                  const cur = row.getData();
                  const nextAddr = Number(cur.reg) + (Number(cur.numreg) || 1);
                  const newRow = {
                    id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    checked: true,
                    slave: cur.slave || 1,
                    fc: cur.fc || 3,
                    reg: nextAddr,
                    numreg: cur.numreg || 2,
                    format: cur.format || 'float',
                    endianness: cur.endianness || 'Big-Endian',
                    parameter: 'Parameter ' + (modbusRegisters.value.length + 1),
                    valuetowrite: '',
                    liveValue: '',
                    exception: '',
                    status: 'IDLE'
                  };
                  const idx = modbusRegisters.value.findIndex(r => r.id === cur.id);
                  if (idx !== -1) {
                    modbusRegisters.value.splice(idx + 1, 0, newRow);
                  } else {
                    modbusRegisters.value.push(newRow);
                  }
                  if (tabulatorTable) {
                    tabulatorTable.setData(modbusRegisters.value);
                  }
                }
              },
              {
                label: "<i class='fa-regular fa-trash-can text-rose-400 mr-2'></i> Delete Row",
                action: function(e, row) {
                  const cur = row.getData();
                  modbusRegisters.value = modbusRegisters.value.filter(r => r.id !== cur.id);
                  row.delete();
                  showToast('Row deleted', 'info');
                }
              }
            ],
            columns: [
              {
                title: "#",
                formatter: "rownum",
                hozAlign: "center",
                headerHozAlign: "center",
                width: 48,
                headerSort: false,
                cssClass: "cursor-pointer select-none",
                headerTooltip: "Click to select all / deselect all rows",
                headerClick: function(e, column) {
                  const table = column.getTable();
                  const selected = table.getSelectedRows();
                  if (selected.length === table.getRows().length) {
                    table.deselectRow();
                  } else {
                    table.selectRow();
                  }
                },
                cellClick: function(e, cell) {
                  e._handledInCell = true;
                  const row = cell.getRow();
                  if (e.shiftKey && lastSelectedRowId) {
                    const allRows = tabulatorTable ? tabulatorTable.getRows() : [];
                    const idx1 = allRows.findIndex(r => r.getData().id === lastSelectedRowId);
                    const idx2 = allRows.findIndex(r => r.getData().id === row.getData().id);
                    if (idx1 !== -1 && idx2 !== -1) {
                      const start = Math.min(idx1, idx2);
                      const end = Math.max(idx1, idx2);
                      for (let i = start; i <= end; i++) {
                        allRows[i].select();
                      }
                      return;
                    }
                  }
                  lastSelectedRowId = row.getData().id;
                  row.toggleSelect();
                }
              },
              {
                titleFormatter: function() {
                  const chk = document.createElement('input');
                  chk.type = 'checkbox';
                  chk.id = 'tabulator-header-tick-all';
                  chk.className = 'rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer';
                  chk.checked = modbusRegisters.value.length > 0 && modbusRegisters.value.every(r => r.checked);
                  chk.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e._handledInCell = true;
                  });
                  chk.addEventListener('change', function(e) {
                    e._handledInCell = true;
                    const next = e.target.checked;
                    modbusRegisters.value.forEach(r => { r.checked = next; });
                    modbusRegisters.value = [...modbusRegisters.value];
                    if (tabulatorTable) {
                      tabulatorTable.updateData(modbusRegisters.value);
                    }
                  });
                  return chk;
                },
                field: "checked",
                hozAlign: "center",
                headerHozAlign: "center",
                headerSort: false,
                width: 45,
                cellClick: function(e) {
                  e._handledInCell = true;
                },
                formatter: function(cell) {
                  const isChecked = !!cell.getValue();
                  const input = document.createElement('input');
                  input.type = 'checkbox';
                  input.checked = isChecked;
                  input.className = 'rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer';
                  input.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e._handledInCell = true;
                  });
                  input.addEventListener('change', function(e) {
                    e._handledInCell = true;
                    const rowData = cell.getRow().getData();
                    rowData.checked = e.target.checked;
                    const item = modbusRegisters.value.find(r => r.id === rowData.id);
                    if (item) item.checked = e.target.checked;
                    modbusRegisters.value = [...modbusRegisters.value];

                    const headerChk = document.getElementById('tabulator-header-tick-all');
                    if (headerChk) {
                      headerChk.checked = modbusRegisters.value.length > 0 && modbusRegisters.value.every(r => r.checked);
                    }
                  });
                  return input;
                }
              },
              {
                title: "ADDRESS",
                field: "reg",
                editor: "number",
                editorParams: { min: 0 },
                width: 95,
                hozAlign: "right",
                headerHozAlign: "left",
                formatter: function(cell) {
                  return '<span class="font-mono font-bold text-white">' + (cell.getValue() ?? 0) + '</span>';
                }
              },
              {
                title: "SLAVE",
                field: "slave",
                editor: "number",
                editorParams: { min: 1, max: 247 },
                width: 75,
                hozAlign: "center",
                headerHozAlign: "center"
              },
              {
                title: "FC",
                field: "fc",
                editor: "list",
                editorParams: {
                  values: [
                    { value: 3, label: "03" },
                    { value: 4, label: "04" },
                    { value: 16, label: "16" },
                    { value: 1, label: "01" },
                    { value: 2, label: "02" },
                    { value: 6, label: "06" },
                  ]
                },
                width: 75,
                hozAlign: "center",
                headerHozAlign: "center",
                formatter: function(cell) {
                  const v = Number(cell.getValue());
                  const s = v < 10 ? '0' + v : String(v);
                  return '<span class="font-bold text-cyan-400 font-mono">' + s + '</span>';
                }
              },
              {
                title: "REG_NUM",
                field: "numreg",
                editor: "number",
                editorParams: { min: 1, max: 125 },
                width: 85,
                hozAlign: "center",
                headerHozAlign: "center"
              },
              {
                title: "FORMAT",
                field: "format",
                editor: "list",
                editorParams: {
                  values: ["float", "uint", "int", "hex", "string"]
                },
                width: 90,
                hozAlign: "center",
                headerHozAlign: "center",
                formatter: function(cell) {
                  return '<span class="text-amber-400 font-mono">' + (cell.getValue() || 'uint') + '</span>';
                }
              },
              {
                title: "PARAMETER_NAME",
                field: "parameter",
                editor: "input",
                minWidth: 150
              },
              {
                title: "VALUE ON MEMMAP",
                field: "liveValue",
                minWidth: 140,
                hozAlign: "center",
                headerHozAlign: "center",
                formatter: function(cell) {
                  const v = cell.getValue();
                  if (v === undefined || v === null || v === '' || v === '--') {
                    return '';
                  }
                  return '<span class="w-full block py-0.5 px-2 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-center">' + v + '</span>';
                }
              },
              {
                title: "VALUE TO WRITE",
                field: "valuetowrite",
                minWidth: 140,
                hozAlign: "center",
                headerHozAlign: "center",
                formatter: function(cell, formatterParams, onRendered) {
                  const row = cell.getRow().getData();
                  const val = row.valuetowrite !== undefined && row.valuetowrite !== null ? row.valuetowrite : '';
                  const input = document.createElement('input');
                  input.type = 'text';
                  input.value = val;
                  input.placeholder = '';
                  input.className = 'w-full h-7 px-2 text-center text-xs font-mono font-bold text-amber-300 bg-slate-950/80 border border-slate-700/80 rounded focus:border-amber-400 focus:bg-slate-900 outline-none transition';
                  input.style.width = '100%';
                  input.style.boxSizing = 'border-box';

                  input.addEventListener('input', function(e) {
                    const v = e.target.value;
                    row.valuetowrite = v;
                    const r = modbusRegisters.value.find(x => x.id === row.id);
                    if (r) r.valuetowrite = v;
                  });

                  input.addEventListener('click', function(e) {
                    e.stopPropagation();
                  });

                  input.addEventListener('dblclick', function(e) {
                    e.stopPropagation();
                  });

                  return input;
                }
              },
              {
                title: "EXCEPTION",
                field: "exception",
                width: 120,
                hozAlign: "center",
                headerHozAlign: "center",
                formatter: function(cell) {
                  const v = cell.getValue();
                  if (!v) return '';
                  if (v === 'WRITE_OK' || v === 'READ_OK' || v === 'OK') {
                    return '<span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">' + v + '</span>';
                  }
                  if (v === 'TIMEOUT') {
                    return '<span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">' + v + '</span>';
                  }
                  return '<span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">' + v + '</span>';
                }
              },
              {
                title: "ENDIANNESS",
                field: "endianness",
                editor: "list",
                editorParams: {
                  values: ["Big-Endian", "Little-Endian", "Mid-Big", "Mid-Little"]
                },
                width: 125,
                hozAlign: "center",
                headerHozAlign: "center"
              }
            ]
          });

          tabulatorTable.on("rowSelectionChanged", function(data, rows) {
            selectedRowCount.value = rows.length;
          });

          tabulatorTable.on("cellEdited", function(cell) {
            const rowData = cell.getRow().getData();
            const idx = modbusRegisters.value.findIndex(r => r.id === rowData.id);
            if (idx !== -1) {
              modbusRegisters.value[idx] = { ...modbusRegisters.value[idx], ...rowData };
            }
          });

            tabulatorTable.on("tableBuilt", function() {
              isBuildingTable = false;
              setTimeout(() => {
                if (tabulatorTable) {
                  tabulatorTable.redraw(true);
                }
              }, 50);
            });
          } catch(err) {
            console.error("Tabulator init error:", err);
            isBuildingTable = false;
          }
        };

        const executeSingleRow = async (row) => {
          const fc = Number(row.fc);
          if (fc === 16 || fc === 6 || fc === 5) {
            await writeSingleRegister(row);
          } else {
            await readSingleRegister(row);
          }
        };

        const deleteSelectedRows = () => {
          let rows = [];
          if (tabulatorTable) {
            rows = tabulatorTable.getSelectedRows();
          }
          let idsToDelete = new Set();
          if (rows.length > 0) {
            idsToDelete = new Set(rows.map(r => r.getData().id));
          }
          if (idsToDelete.size === 0) {
            showToast('No rows selected to delete (click row or # to select)', 'info');
            return;
          }
          const count = idsToDelete.size;
          modbusRegisters.value = modbusRegisters.value.filter(r => !idsToDelete.has(r.id));
          selectedRowCount.value = 0;
          updateTabulatorData();
          showToast('Deleted ' + count + ' row(s)', 'info');
        };

        const addNewRegisterRow = () => {
          const last = modbusRegisters.value[modbusRegisters.value.length - 1];
          const nextReg = last ? Number(last.reg) + (Number(last.numreg) || 1) : 0;
          const nextSlave = last ? Number(last.slave) || 1 : 1;
          const newRow = {
            id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            checked: true,
            slave: nextSlave,
            fc: 3,
            reg: nextReg,
            numreg: 2,
            format: 'float',
            endianness: 'Big-Endian',
            parameter: 'Parameter ' + (modbusRegisters.value.length + 1),
            valuetowrite: '',
            liveValue: '',
            exception: '',
            status: 'IDLE',
          };
          modbusRegisters.value.push(newRow);
          if (tabulatorTable) {
            tabulatorTable.addRow(newRow, false).then(row => {
              try { row.select(); } catch(e) {}
            });
          }
          showToast('Row added at address ' + nextReg, 'info');
        };

        const handleKeydown = (e) => {
          const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
          const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';

          if (e.key === 'Delete' || e.key === 'Backspace') {
            if (!isInput && selectedRowCount.value > 0) {
              e.preventDefault();
              deleteSelectedRows();
            }
          }
        };

        const normalizeFormat = (f) => {
          const s = String(f || '').toLowerCase();
          if (s.includes('string') || s.includes('str') || s.includes('ascii') || s.includes('text')) return 'string';
          if (s.includes('float') || s.includes('double')) return 'float';
          if (s.includes('uint')) return 'uint';
          if (s.includes('int')) return 'int';
          if (s.includes('hex')) return 'hex';
          return 'uint';
        };

        // CRC-16 Modbus (polynomial 0xA001, init 0xFFFF)
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

        const formatHexAddress = (addr) => {
          const n = Number(addr) || 0;
          return '0x' + n.toString(16).padStart(4, '0').toUpperCase();
        };

        const formatFCName = (fc) => {
          switch (Number(fc)) {
            case 1: return 'FC 01 Coils';
            case 2: return 'FC 02 Discrete';
            case 3: return 'FC 03 Holding';
            case 4: return 'FC 04 Input';
            case 5: return 'FC 05 Write Coil';
            case 6: return 'FC 06 Write Reg';
            case 16: return 'FC 16 Write Multi';
            default: return 'FC ' + fc;
          }
        };

        const getFCBadgeClass = (fc) => {
          switch (Number(fc)) {
            case 1:
            case 2:
              return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
            case 3:
              return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
            case 4:
              return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
            default:
              return 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30';
          }
        };

        const getLiveValueClass = (row) => {
          if (row.reading) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse';
          if (row.writing) return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
          if (row.status === 'OK') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
          if (row.status === 'TIMEOUT' || row.status === 'ERROR' || row.status === 'CRC_ERR') {
            return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
          }
          return 'bg-slate-950 text-slate-400 border-slate-800';
        };

        const formatLiveValue = (row) => {
          if (row.reading) return 'Reading...';
          if (row.writing) return 'Writing...';
          if (row.status === 'TIMEOUT') return 'TIMEOUT';
          if (row.status === 'CRC_ERR') return 'CRC ERR';
          if (row.status === 'ERROR') return 'ERROR';
          if (row.liveValue === undefined || row.liveValue === null || row.liveValue === '' || row.liveValue === '--') return '';
          return row.liveValue;
        };

        const formatShortTime = (isoString) => {
          if (!isoString) return '';
          try {
            const d = new Date(isoString);
            return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
          } catch(e) {
            return '';
          }
        };

        const formatBytes = (bytes) => {
          if (!bytes || bytes === 0) return '0 B';
          if (bytes < 1024) return bytes + ' B';
          if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
          return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        };

        const getLogTagClass = (type) => {
          switch (type) {
            case 'TX': return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
            case 'RX': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
            case 'ERR': return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
            case 'SYS': return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
            default: return 'bg-slate-800 text-slate-400 border border-slate-700';
          }
        };

        const getLogTextClass = (type) => {
          switch (type) {
            case 'TX': return 'text-cyan-300';
            case 'RX': return 'text-emerald-300';
            case 'ERR': return 'text-rose-400';
            case 'SYS': return 'text-amber-300';
            default: return 'text-slate-300';
          }
        };

        const addSerialLog = (type, uint8Bytes, customText = '') => {
          const now = new Date();
          const time = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
          let hex = '';
          let ascii = '';

          if (uint8Bytes && uint8Bytes.length > 0) {
            hex = Array.from(uint8Bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
            ascii = Array.from(uint8Bytes).map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
          } else if (customText) {
            hex = customText;
            ascii = customText;
          }

          serialLogs.value.push({
            id: Date.now() + Math.random(),
            time,
            type,
            hex,
            ascii,
          });

          // Cap logs at 500 entries to prevent memory buildup
          if (serialLogs.value.length > 500) {
            serialLogs.value.shift();
          }

          if (!serialPauseScroll.value && serialTerminalBoxRef.value) {
            nextTick(() => {
              if (serialTerminalBoxRef.value) {
                serialTerminalBoxRef.value.scrollTop = serialTerminalBoxRef.value.scrollHeight;
              }
            });
          }
        };

        const filteredSerialLogs = computed(() => {
          if (serialLogFilter.value === 'ALL') return serialLogs.value;
          return serialLogs.value.filter(l => l.type === serialLogFilter.value);
        });

        const isAllRegistersChecked = computed(() => {
          return modbusRegisters.value.length > 0 && modbusRegisters.value.every(r => r.checked);
        });

        const toggleSelectAllRegisters = () => {
          const next = !isAllRegistersChecked.value;
          modbusRegisters.value.forEach(r => { r.checked = next; });
        };

        const filteredModbusRegisters = computed(() => {
          const q = (registerSearchQuery.value || '').trim().toLowerCase();
          if (!q) return modbusRegisters.value;
          return modbusRegisters.value.filter(r => {
            return (
              String(r.reg).includes(q) ||
              formatHexAddress(r.reg).toLowerCase().includes(q) ||
              (r.parameter && r.parameter.toLowerCase().includes(q)) ||
              (r.description && r.description.toLowerCase().includes(q)) ||
              (r.format && r.format.toLowerCase().includes(q))
            );
          });
        });

        // Fetch available presets from C-Module API
        const fetchAvailablePresets = async () => {
          try {
            const res = await fetch('/api/modbus-presets', {
              headers: authHeaders(),
              credentials: 'include',
            });
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                // Map presets so only the template name is loaded for display, as required
                const customList = data.map(t => ({
                  sku: t.id,
                  name: t.name,
                  description: t.description || '',
                  profileType: t.profileType,
                  isCustomTemplate: true,
                }));
                const allList = [...customList];
                if (!allList.some(p => p.sku === 'CUSTOM')) {
                  allList.push({ sku: 'CUSTOM', name: 'Custom Memory Map', fw: 1 });
                }
                modbusPresets.value = allList;
                if (!selectedModbusPreset.value || !modbusPresets.value.some(p => p.sku === selectedModbusPreset.value)) {
                  selectedModbusPreset.value = modbusPresets.value[0]?.sku || 'CUSTOM';
                }
              }
            }
          } catch (e) {
            console.warn('Could not fetch modbus presets in D-module:', e);
          }
        };

        const refreshCurrentPreset = async () => {
          await fetchAvailablePresets();
          if (selectedModbusPreset.value) {
            await loadModbusPresetBySku(selectedModbusPreset.value);
          }
          showToast('Synced presets with server', 'info');
        };

        // Initialize and fetch profiles
        let isInitializingModule = false;
        const initSerialModule = async () => {
          if (isInitializingModule) return;
          isInitializingModule = true;
          try {
            await fetchAvailablePresets();
            if (modbusRegisters.value.length === 0) {
              await applySelectedPreset();
            }
          } finally {
            isInitializingModule = false;
          }
          initTabulatorTable();
        };

        const applySelectedPreset = async () => {
          await loadModbusPresetBySku(selectedModbusPreset.value);
        };

        const loadModbusPresetBySku = async (sku) => {
          selectedModbusPreset.value = sku;
          selectedRowCount.value = 0;
          if (sku === 'CUSTOM') {
            modbusRegisters.value = [];
            updateTabulatorData();
            showToast('Loaded empty custom register map', 'info');
            return;
          }

          // 1. Try loading from C-module templates API (/api/modbus-presets/:id)
          try {
            const res = await fetch('/api/modbus-presets/' + encodeURIComponent(sku), {
              headers: authHeaders(),
              credentials: 'include',
            });
            if (res.ok) {
              const tpl = await res.json();
              if (tpl && Array.isArray(tpl.registers)) {
                modbusRegisters.value = tpl.registers.map((r, i) => ({
                  id: r.id || 'reg_' + sku + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
                  checked: r.checked !== false,
                  slave: Number(r.slave) || 1,
                  fc: Number(r.fc) || 3,
                  reg: Number(r.reg) || 0,
                  numreg: Number(r.numreg) || 1,
                  format: normalizeFormat(r.format),
                  endianness: r.endianness || 'Big-Endian',
                  parameter: r.parameter || ('Register ' + (r.reg ?? i)),
                  description: r.description || r.comment || '',
                  valuetowrite: r.valuetowrite !== undefined && r.valuetowrite !== null ? String(r.valuetowrite) : '',
                  liveValue: '',
                  exception: '',
                  status: 'IDLE',
                  reading: false,
                  writing: false,
                  lastUpdated: null,
                }));
                updateTabulatorData();
                showToast('Loaded ' + modbusRegisters.value.length + ' registers for ' + tpl.name, 'success');
                return;
              }
            }
          } catch (e) {
            console.warn('Failed to load from /api/modbus-presets:', e);
          }

          try {
            const res = await fetch('/api/d-modules/serial-memmap/registers?sku=' + encodeURIComponent(sku), {
              headers: authHeaders(),
              credentials: 'include',
            });
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                modbusRegisters.value = data.map((r, i) => ({
                  id: r.id || 'reg_' + sku + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
                  checked: r.check !== false,
                  slave: Number(r.slave) || 1,
                  fc: Number(r.fc) || 4,
                  reg: Number(r.reg) || 0,
                  numreg: Number(r.numreg) || 1,
                  format: normalizeFormat(r.format),
                  endianness: r.endianness || 'Big-Endian',
                  parameter: r.parameter || 'Register ' + r.reg,
                  description: r.description || '',
                  valuetowrite: r.valuetowrite || '',
                  liveValue: '',
                  exception: '',
                  status: 'IDLE',
                  reading: false,
                  writing: false,
                  lastUpdated: null,
                }));
                updateTabulatorData();
                showToast('Loaded ' + modbusRegisters.value.length + ' registers for ' + sku, 'success');
                return;
              }
            }
          } catch(e) {
            console.error('Failed to load profile from backend, using fallback:', e);
          }

          // Fallback built-in registers
          const fallbackMap = {
            'WSL-AMBIENT': [
              { id: 1, checked: true, slave: 1, fc: 4, reg: 0, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Ambient Temperature', valuetowrite: '', liveValue: '', exception: '' },
              { id: 2, checked: true, slave: 1, fc: 4, reg: 2, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Relative Humidity', valuetowrite: '', liveValue: '', exception: '' },
              { id: 3, checked: true, slave: 1, fc: 4, reg: 4, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Barometric Pressure', valuetowrite: '', liveValue: '', exception: '' },
              { id: 4, checked: true, slave: 1, fc: 4, reg: 6, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Illuminance / Light', valuetowrite: '', liveValue: '', exception: '' },
              { id: 5, checked: true, slave: 1, fc: 4, reg: 8, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Battery Voltage', valuetowrite: '', liveValue: '', exception: '' },
              { id: 6, checked: true, slave: 1, fc: 3, reg: 100, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Transmission Interval', valuetowrite: '60', liveValue: '', exception: '' },
              { id: 7, checked: true, slave: 1, fc: 3, reg: 101, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Modbus Slave Address', valuetowrite: '1', liveValue: '', exception: '' },
            ],
            'WSL-LEVEL': [
              { id: 1, checked: true, slave: 1, fc: 4, reg: 0, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Liquid Level / Depth', valuetowrite: '', liveValue: '', exception: '' },
              { id: 2, checked: true, slave: 1, fc: 4, reg: 2, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Water Temperature', valuetowrite: '', liveValue: '', exception: '' },
              { id: 3, checked: true, slave: 1, fc: 4, reg: 4, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Sensor Status Code', valuetowrite: '', liveValue: '', exception: '' },
              { id: 4, checked: true, slave: 1, fc: 4, reg: 5, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'Battery Voltage', valuetowrite: '', liveValue: '', exception: '' },
              { id: 5, checked: true, slave: 1, fc: 3, reg: 50, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Zero Calibration', valuetowrite: '0.0', liveValue: '', exception: '' },
              { id: 6, checked: true, slave: 1, fc: 3, reg: 52, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'High Alarm Threshold', valuetowrite: '8.5', liveValue: '', exception: '' },
            ],
            'ENERGY-METER-3P': [
              { id: 1, checked: true, slave: 1, fc: 3, reg: 0, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase A Voltage', valuetowrite: '', liveValue: '', exception: '' },
              { id: 2, checked: true, slave: 1, fc: 3, reg: 2, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase B Voltage', valuetowrite: '', liveValue: '', exception: '' },
              { id: 3, checked: true, slave: 1, fc: 3, reg: 4, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase C Voltage', valuetowrite: '', liveValue: '', exception: '' },
              { id: 4, checked: true, slave: 1, fc: 3, reg: 6, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase A Current', valuetowrite: '', liveValue: '', exception: '' },
              { id: 5, checked: true, slave: 1, fc: 3, reg: 8, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase B Current', valuetowrite: '', liveValue: '', exception: '' },
              { id: 6, checked: true, slave: 1, fc: 3, reg: 10, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Phase C Current', valuetowrite: '', liveValue: '', exception: '' },
              { id: 7, checked: true, slave: 1, fc: 3, reg: 12, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Total Active Power', valuetowrite: '', liveValue: '', exception: '' },
              { id: 8, checked: true, slave: 1, fc: 3, reg: 14, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Power Factor', valuetowrite: '', liveValue: '', exception: '' },
              { id: 9, checked: true, slave: 1, fc: 3, reg: 16, numreg: 2, format: 'float', endianness: 'Big-Endian', parameter: 'Grid Frequency', valuetowrite: '', liveValue: '', exception: '' },
            ],
            'MODBUS-IO-MODULE': [
              { id: 1, checked: true, slave: 1, fc: 1, reg: 0, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'DO 1 (Relay Output 1)', valuetowrite: '1', liveValue: '', exception: '' },
              { id: 2, checked: true, slave: 1, fc: 1, reg: 1, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'DO 2 (Relay Output 2)', valuetowrite: '0', liveValue: '', exception: '' },
              { id: 3, checked: true, slave: 1, fc: 2, reg: 0, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'DI 1 (Digital Input 1)', valuetowrite: '', liveValue: '', exception: '' },
              { id: 4, checked: true, slave: 1, fc: 2, reg: 1, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'DI 2 (Digital Input 2)', valuetowrite: '', liveValue: '', exception: '' },
              { id: 5, checked: true, slave: 1, fc: 4, reg: 0, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'AI 1 (4-20mA Raw ADC)', valuetowrite: '', liveValue: '', exception: '' },
              { id: 6, checked: true, slave: 1, fc: 4, reg: 1, numreg: 1, format: 'uint', endianness: 'Big-Endian', parameter: 'AI 2 (0-10V Raw ADC)', valuetowrite: '', liveValue: '', exception: '' },
              { id: 7, checked: true, slave: 1, fc: 4, reg: 2, numreg: 2, format: 'uint', endianness: 'Big-Endian', parameter: 'Pulse Counter 1', valuetowrite: '', liveValue: '', exception: '' },
            ],
          };

          const list = fallbackMap[sku] || [];
          modbusRegisters.value = list.map((item, i) => ({
            ...item,
            id: 'reg_' + sku + '_' + (item.id || i) + '_' + Math.random().toString(36).substr(2, 5),
            format: normalizeFormat(item.format),
            liveValue: '',
            exception: '',
            status: 'IDLE',
            reading: false,
            writing: false,
            lastUpdated: null,
          }));
          updateTabulatorData();
          showToast('Loaded ' + modbusRegisters.value.length + ' registers for ' + sku, 'success');
        };

        // Web Serial API: Select Port
        const selectSerialPort = async () => {
          if (!('serial' in navigator)) {
            showToast('Web Serial API is not supported in this browser.', 'error');
            return;
          }
          try {
            const port = await navigator.serial.requestPort();
            serialPort.value = port;
            const info = port.getInfo ? port.getInfo() : {};
            lastConnectedPortInfo = info;
            let desc = 'Serial Device';
            if (info.usbVendorId) {
              desc = 'VID: 0x' + info.usbVendorId.toString(16).toUpperCase() + ' PID: 0x' + (info.usbProductId ? info.usbProductId.toString(16).toUpperCase() : '');
            }
            serialPortInfo.value = desc;
            addSerialLog('SYS', null, 'Port selected: ' + desc);
            showToast('Port selected: ' + desc, 'info');
          } catch(e) {
            if (e.name !== 'NotFoundError') {
              console.error('Serial select error:', e);
              showToast('Port selection error: ' + (e.message || e), 'error');
            }
          }
        };

        // Web Serial API: Connect
        const connectSerial = async (portToOpen = null) => {
          if (portToOpen) {
            serialPort.value = portToOpen;
          }
          if (!serialPort.value) {
            await selectSerialPort();
            if (!serialPort.value) return;
          }
          serialConnecting.value = true;
          try {
            const info = serialPort.value.getInfo ? serialPort.value.getInfo() : {};
            if (info.usbVendorId) {
              lastConnectedPortInfo = info;
            }
            await serialPort.value.open({
              baudRate: Number(serialConfig.value.baudRate) || 9600,
              dataBits: Number(serialConfig.value.dataBits) || 8,
              stopBits: Number(serialConfig.value.stopBits) || 1,
              parity: serialConfig.value.parity || 'none',
              flowControl: serialConfig.value.flowControl || 'none',
              bufferSize: Number(serialConfig.value.bufferSize) || 255,
            });

            serialConnected.value = true;
            isAutoReconnecting.value = false;
            addSerialLog('SYS', null, 'Connected @ ' + serialConfig.value.baudRate + ' bps, 8-N-1');
            showToast('Connected to COM / UART @ ' + serialConfig.value.baudRate + ' bps', 'success');

            // Set initial signals if supported
            try {
              if (serialPort.value.setSignals) {
                await serialPort.value.setSignals({
                  dataTerminalReady: serialSignals.value.dtr,
                  requestToSend: serialSignals.value.rts,
                });
              }
            } catch(e) {}

            startSerialReadLoop();
          } catch(e) {
            console.error('Serial connect error:', e);
            addSerialLog('ERR', null, 'Failed to open port: ' + (e.message || e));
            showToast('Connection failed: ' + (e.message || e), 'error');
            serialConnected.value = false;
          } finally {
            serialConnecting.value = false;
          }
        };

        // Web Serial API: Disconnect
        const disconnectSerial = async (isManual = true) => {
          if (autoReconnectTimer) {
            clearTimeout(autoReconnectTimer);
            autoReconnectTimer = null;
          }
          stopContinuousPolling();
          keepReadingSerial = false;
          if (serialReader) {
            try {
              await serialReader.cancel();
            } catch(e) {}
            try {
              serialReader.releaseLock();
            } catch(e) {}
            serialReader = null;
          }
          if (pendingModbusTx) {
            clearTimeout(pendingModbusTx.timer);
            pendingModbusTx.reject(new Error('Port closed or disconnected'));
            pendingModbusTx = null;
          }
          if (serialPort.value) {
            try {
              await serialPort.value.close();
            } catch(e) {}
          }
          serialConnected.value = false;
          if (isManual) {
            isAutoReconnecting.value = false;
            serialPortInfo.value = '';
            serialPort.value = null;
            lastConnectedPortInfo = null;
            addSerialLog('SYS', null, 'Port disconnected by user');
            showToast('Serial port disconnected', 'info');
          }
        };

        // Hardware disconnect event listener (e.g. chip reset or power glitch)
        const handleSerialDisconnect = async (event) => {
          console.warn('Hardware serial disconnect detected:', event.target);
          const isTarget = serialPort.value && (serialPort.value === event.target || !event.target);
          if (isTarget || serialConnected.value) {
            const wasConnected = serialConnected.value;
            addSerialLog('WARN', null, 'Hardware disconnected (USB reset or power glitch detected). Cleaning up locks...');
            await disconnectSerial(false);
            if (wasConnected) {
              isAutoReconnecting.value = true;
              showToast('Serial port disconnected (hardware reset or power conflict)', 'warning');
              addSerialLog('SYS', null, 'Port closed and locks released. Waiting for USB re-enumeration to reconnect automatically...');
            }
          }
        };

        // Hardware connect event listener (chip reboot & USB re-enumeration)
        const handleSerialConnect = async (event) => {
          console.log('Hardware serial connect detected:', event.target);
          if (isAutoReconnecting.value || (!serialConnected.value && lastConnectedPortInfo)) {
            const newPort = event.target || (navigator.serial && navigator.serial.getPorts ? (await navigator.serial.getPorts())[0] : null);
            if (!newPort) return;

            const newInfo = newPort.getInfo ? newPort.getInfo() : {};
            const isMatching = !lastConnectedPortInfo || !lastConnectedPortInfo.usbVendorId ||
              (newInfo.usbVendorId === lastConnectedPortInfo.usbVendorId &&
               newInfo.usbProductId === lastConnectedPortInfo.usbProductId);

            if (isMatching) {
              addSerialLog('SYS', null, 'USB device detected after reset. Auto-reconnecting in 600ms...');
              showToast('USB device re-detected. Auto-reconnecting...', 'info');

              if (autoReconnectTimer) clearTimeout(autoReconnectTimer);
              autoReconnectTimer = setTimeout(async () => {
                try {
                  serialPort.value = newPort;
                  let desc = 'Serial Device';
                  if (newInfo.usbVendorId) {
                    desc = 'VID: 0x' + newInfo.usbVendorId.toString(16).toUpperCase() + ' PID: 0x' + (newInfo.usbProductId ? newInfo.usbProductId.toString(16).toUpperCase() : '');
                  }
                  serialPortInfo.value = desc;

                  await connectSerial(newPort);
                  isAutoReconnecting.value = false;
                  addSerialLog('SYS', null, 'Auto-reconnected successfully to ' + desc);
                  showToast('Serial device auto-reconnected successfully', 'success');
                } catch (err) {
                  console.warn('Auto-reconnect attempt 1 failed, retrying in 1000ms...', err);
                  setTimeout(async () => {
                    try {
                      if (serialConnected.value) return;
                      await connectSerial(newPort);
                      isAutoReconnecting.value = false;
                      addSerialLog('SYS', null, 'Auto-reconnected successfully after retry');
                      showToast('Serial device auto-reconnected successfully', 'success');
                    } catch (retryErr) {
                      console.error('Auto-reconnect retry failed:', retryErr);
                      isAutoReconnecting.value = false;
                      addSerialLog('ERR', null, 'Auto-reconnect failed: ' + (retryErr.message || retryErr) + '. Please click Connect.');
                      showToast('Auto-reconnect failed. Click Connect to retry.', 'error');
                    }
                  }, 1000);
                }
              }, 600);
            }
          }
        };

        // DTR / RTS Signals
        const toggleDTR = async () => {
          if (!serialPort.value || !serialConnected.value) return;
          serialSignals.value.dtr = !serialSignals.value.dtr;
          try {
            if (serialPort.value.setSignals) {
              await serialPort.value.setSignals({ dataTerminalReady: serialSignals.value.dtr });
              addSerialLog('SYS', null, 'DTR set to ' + (serialSignals.value.dtr ? 'HIGH' : 'LOW'));
            }
          } catch(e) {
            console.error('Set DTR error:', e);
          }
        };

        const toggleRTS = async () => {
          if (!serialPort.value || !serialConnected.value) return;
          serialSignals.value.rts = !serialSignals.value.rts;
          try {
            if (serialPort.value.setSignals) {
              await serialPort.value.setSignals({ requestToSend: serialSignals.value.rts });
              addSerialLog('SYS', null, 'RTS set to ' + (serialSignals.value.rts ? 'HIGH' : 'LOW'));
            }
          } catch(e) {
            console.error('Set RTS error:', e);
          }
        };

        // Read stream loop
        const startSerialReadLoop = async () => {
          keepReadingSerial = true;
          incomingBuffer = [];
          while (serialPort.value && serialPort.value.readable && keepReadingSerial) {
            try {
              serialReader = serialPort.value.readable.getReader();
              while (keepReadingSerial) {
                const { value, done } = await serialReader.read();
                if (done) break;
                if (value && value.length > 0) {
                  serialStats.value.rxPackets++;
                  serialStats.value.rxBytes += value.length;
                  addSerialLog('RX', value);

                  // Append to buffer and process Modbus frame
                  for (let i = 0; i < value.length; i++) {
                    incomingBuffer.push(value[i]);
                  }
                  processIncomingModbusBuffer();
                }
              }
            } catch(e) {
              console.error('Serial read loop error:', e);
              if (keepReadingSerial) {
                addSerialLog('ERR', null, 'Read error: ' + (e.message || e));
              }
              // Stop read loop on stream error / hardware disconnect to prevent UI freeze
              keepReadingSerial = false;
              break;
            } finally {
              if (serialReader) {
                try {
                  await serialReader.cancel();
                } catch(err) {}
                try {
                  serialReader.releaseLock();
                } catch(err) {}
                serialReader = null;
              }
            }
          }
        };

        // Process incoming buffer against pending Modbus transaction
        const processIncomingModbusBuffer = () => {
          if (!pendingModbusTx) return;
          const { slave, fc, expectedLen, resolve, reject, timer } = pendingModbusTx;

          // Check if exception response (5 bytes: Slave, FC | 0x80, ExCode, CRCLo, CRCHi)
          for (let i = 0; i < incomingBuffer.length; i++) {
            if (incomingBuffer[i] === slave && incomingBuffer[i + 1] === (fc | 0x80)) {
              if (incomingBuffer.length >= i + 5) {
                const exFrame = incomingBuffer.slice(i, i + 5);
                const crc = calcModbusCRC16(exFrame.slice(0, 3));
                const rxCrc = exFrame[3] | (exFrame[4] << 8);
                if (crc === rxCrc) {
                  clearTimeout(timer);
                  pendingModbusTx = null;
                  incomingBuffer.splice(0, i + 5);
                  serialStats.value.errCount++;
                  reject(new Error('Modbus Exception Code ' + exFrame[2]));
                  return;
                }
              }
            }
          }

          // Check if normal expected response received
          for (let i = 0; i < incomingBuffer.length; i++) {
            if (incomingBuffer[i] === slave && incomingBuffer[i + 1] === fc) {
              if (incomingBuffer.length >= i + expectedLen) {
                const frame = incomingBuffer.slice(i, i + expectedLen);
                const crc = calcModbusCRC16(frame.slice(0, expectedLen - 2));
                const rxCrc = frame[expectedLen - 2] | (frame[expectedLen - 1] << 8);
                if (crc === rxCrc) {
                  clearTimeout(timer);
                  pendingModbusTx = null;
                  incomingBuffer.splice(0, i + expectedLen);
                  resolve(frame);
                  return;
                } else {
                  // CRC Mismatch
                  serialStats.value.errCount++;
                  clearTimeout(timer);
                  pendingModbusTx = null;
                  incomingBuffer.splice(0, i + expectedLen);
                  reject(new Error('CRC_ERR'));
                  return;
                }
              }
            }
          }
        };

        // Send raw bytes to port
        const sendSerialBytes = async (uint8Array) => {
          if (!serialPort.value || !serialConnected.value) {
            throw new Error('Serial port not connected');
          }
          const writer = serialPort.value.writable.getWriter();
          try {
            await writer.write(uint8Array);
            serialStats.value.txPackets++;
            serialStats.value.txBytes += uint8Array.length;
            addSerialLog('TX', uint8Array);
          } finally {
            try {
              writer.releaseLock();
            } catch(e) {}
          }
        };

        // Execute one Modbus Request-Response cycle with promise and timeout
        const executeModbusTransaction = (requestBytes, slave, fc, expectedLen, timeoutMs = 1000) => {
          return new Promise(async (resolve, reject) => {
            if (pendingModbusTx) {
              reject(new Error('Busy: another Modbus transaction is active'));
              return;
            }

            const timer = setTimeout(() => {
              if (pendingModbusTx) {
                serialStats.value.errCount++;
                pendingModbusTx = null;
                reject(new Error('TIMEOUT'));
              }
            }, timeoutMs);

            pendingModbusTx = { slave, fc, expectedLen, resolve, reject, timer };

            try {
              await sendSerialBytes(requestBytes);
            } catch(e) {
              clearTimeout(timer);
              pendingModbusTx = null;
              reject(e);
            }
          });
        };

        // Build read frame (FC 01, 02, 03, 04)
        const buildModbusReadFrame = (slave, fc, reg, numreg) => {
          const s = Number(slave) & 0xFF;
          const f = Number(fc) & 0xFF;
          const r = Number(reg);
          const n = Number(numreg);
          const frame = [
            s,
            f,
            (r >> 8) & 0xFF,
            r & 0xFF,
            (n >> 8) & 0xFF,
            n & 0xFF,
          ];
          const crc = calcModbusCRC16(frame);
          frame.push(crc & 0xFF);
          frame.push((crc >> 8) & 0xFF);
          return new Uint8Array(frame);
        };

        // Decode Modbus payload
        const decodeModbusPayload = (dataBytes, format, endianness) => {
          if (!dataBytes || dataBytes.length === 0) return '';
          const len = dataBytes.length;
          const fmt = (format || '').toLowerCase();

          if (fmt === 'boolean' || fmt === 'bit') {
            return (dataBytes[0] & 1) !== 0 ? 'TRUE (1)' : 'FALSE (0)';
          }

          if (fmt === 'hex') {
            return dataBytes.map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          }

          if (len === 2) {
            let b0 = dataBytes[0];
            let b1 = dataBytes[1];
            if (endianness === 'Little-Endian' || endianness === 'BA') {
              [b0, b1] = [b1, b0];
            }
            const u16 = (b0 << 8) | b1;
            if (fmt === 'int' || fmt === 'int16') {
              return u16 >= 0x8000 ? u16 - 0x10000 : u16;
            }
            return u16;
          }

          if (len === 4) {
            let [a, b, c, d] = dataBytes;
            let reordered = [a, b, c, d]; // Big-Endian ABCD
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
              return Number(dv.getFloat32(0, false).toFixed(4));
            } else if (fmt === 'int' || fmt === 'int32') {
              return dv.getInt32(0, false);
            } else {
              return dv.getUint32(0, false);
            }
          }

          if (len === 8) {
            const u8 = new Uint8Array(dataBytes);
            const dv = new DataView(u8.buffer);
            return Number(dv.getFloat64(0, false).toFixed(4));
          }

          if (fmt === 'ascii' || fmt === 'string') {
            return String.fromCharCode(...dataBytes.filter(x => x >= 32 && x <= 126));
          }

          // Fallback Hex
          return dataBytes.map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        };

        // Encode write value into bytes
        const encodeModbusWriteValue = (valStr, format, endianness, numreg = 1) => {
          const bytesNeeded = numreg * 2;
          const buffer = new ArrayBuffer(bytesNeeded);
          const view = new DataView(buffer);
          const fmt = (format || '').toLowerCase();

          if (fmt === 'hex') {
            const cleanHex = String(valStr).replace(/[^0-9a-fA-F]/g, '');
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
            const raw = Array.from(new Uint8Array(buffer)); // [A, B, C, D]
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

        // Read Single Register
        const readSingleRegister = async (row) => {
          if (!serialConnected.value) {
            showToast('Please connect to serial port first', 'error');
            return;
          }
          row.reading = true;
          try {
            let fc = Number(row.fc);
            if (fc === 16 || fc === 6) {
              fc = 3;
            }
            const numreg = Number(row.numreg) || 1;
            const req = buildModbusReadFrame(row.slave, fc, row.reg, numreg);

            // Expected response length
            let expectedLen = 0;
            if (fc === 1 || fc === 2) {
              const byteCount = Math.ceil(numreg / 8);
              expectedLen = 1 + 1 + 1 + byteCount + 2; // Slave, FC, ByteCount, Bytes, CRC
            } else {
              expectedLen = 1 + 1 + 1 + (numreg * 2) + 2; // Slave, FC, ByteCount, Bytes, CRC
            }

            const timeout = Number(serialConfig.value.timeoutMs) || 1000;
            const resFrame = await executeModbusTransaction(req, row.slave, fc, expectedLen, timeout);

            const byteCount = resFrame[2];
            const dataBytes = resFrame.slice(3, 3 + byteCount);
            const val = decodeModbusPayload(dataBytes, row.format, row.endianness);

            row.liveValue = val;
            row.exception = 'READ_OK';
            row.status = 'OK';
            row.lastUpdated = new Date().toISOString();
          } catch(e) {
            console.error('Read register error:', e);
            row.status = 'ERROR';
            row.exception = e.message === 'TIMEOUT' ? 'TIMEOUT' : 'CMD_ERROR';
          } finally {
            row.reading = false;
            if (tabulatorTable) {
              tabulatorTable.updateRow(row.id, {
                liveValue: row.liveValue,
                exception: row.exception,
                status: row.status
              });
            }
          }
        };

        // Write Single Register
        const writeSingleRegister = async (row) => {
          if (!serialConnected.value) {
            showToast('Please connect to serial port first', 'error');
            return;
          }
          if (row.valuetowrite === '' || row.valuetowrite === undefined) {
            row.exception = 'CMD_ERROR';
            if (tabulatorTable) {
              tabulatorTable.updateRow(row.id, { exception: 'CMD_ERROR' });
            }
            showToast('Please enter a value to write', 'error');
            return;
          }
          row.writing = true;
          try {
            const slave = Number(row.slave);
            const numreg = Number(row.numreg) || 1;
            const reg = Number(row.reg);
            let req = null;
            let expectedLen = 8;
            let respFC = 6;

            if (row.fc === 1 || row.fc === 5) {
              // Write single coil FC 05
              respFC = 5;
              const isHigh = row.valuetowrite === '1' || row.valuetowrite === 1 || String(row.valuetowrite).toLowerCase() === 'true';
              const v = isHigh ? 0xFF00 : 0x0000;
              const frame = [slave, 0x05, (reg >> 8) & 0xFF, reg & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
              const crc = calcModbusCRC16(frame);
              frame.push(crc & 0xFF);
              frame.push((crc >> 8) & 0xFF);
              req = new Uint8Array(frame);
              expectedLen = 8;
            } else if (row.fc === 16 || numreg > 1) {
              // Write Multiple Registers FC 16 (0x10)
              respFC = 16;
              const encoded = encodeModbusWriteValue(row.valuetowrite, row.format, row.endianness, numreg);
              const byteCount = encoded.length;
              const frame = [
                slave,
                0x10,
                (reg >> 8) & 0xFF,
                reg & 0xFF,
                (numreg >> 8) & 0xFF,
                numreg & 0xFF,
                byteCount,
                ...encoded,
              ];
              const crc = calcModbusCRC16(frame);
              frame.push(crc & 0xFF);
              frame.push((crc >> 8) & 0xFF);
              req = new Uint8Array(frame);
              expectedLen = 8;
            } else {
              // Write Single Register FC 06
              respFC = 6;
              const v = parseInt(row.valuetowrite, 10) || 0;
              const frame = [slave, 0x06, (reg >> 8) & 0xFF, reg & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
              const crc = calcModbusCRC16(frame);
              frame.push(crc & 0xFF);
              frame.push((crc >> 8) & 0xFF);
              req = new Uint8Array(frame);
              expectedLen = 8;
            }

            const timeout = Number(serialConfig.value.timeoutMs) || 1000;
            await executeModbusTransaction(req, slave, respFC, expectedLen, timeout);

            row.status = 'OK';
            row.exception = 'WRITE_OK';
            // auto uncheck after write completion
            row.checked = false;
            showToast('Write successfully to register ' + row.reg, 'success');
          } catch(e) {
            console.error('Write register error:', e);
            row.status = 'ERROR';
            row.exception = e.message === 'TIMEOUT' ? 'TIMEOUT' : 'CMD_ERROR';
            showToast('Write failed: ' + (e.message || e), 'error');
          } finally {
            row.writing = false;
            if (tabulatorTable) {
              tabulatorTable.updateRow(row.id, {
                checked: row.checked,
                exception: row.exception,
                status: row.status
              });
              const headerChk = document.getElementById('tabulator-header-tick-all');
              if (headerChk) {
                headerChk.checked = modbusRegisters.value.length > 0 && modbusRegisters.value.every(r => r.checked);
              }
            }
          }
        };

        // Start / Stop Loop: auto read/write based on tick box
        // Function 3 (and 4, 1, 2) is READ; Function 16 (and 6, 5) is WRITE
        const toggleStartStop = () => {
          if (isPolling.value) {
            stopContinuousPolling();
            showToast('Auto Read/Write cycle stopped', 'info');
          } else {
            if (!serialConnected.value) {
              showToast('Please connect to serial port first', 'error');
              return;
            }
            const checked = modbusRegisters.value.filter(r => r.checked);
            if (checked.length === 0) {
              showToast('No registers checked to read/write', 'info');
              return;
            }
            isPolling.value = true;
            runContinuousPollingLoop();
            showToast('Started auto Read/Write cycle (' + pollingIntervalMs.value + ' ms)', 'success');
          }
        };

        const runContinuousPollingLoop = async () => {
          if (!isPolling.value || !serialConnected.value) {
            stopContinuousPolling();
            return;
          }

          const checked = modbusRegisters.value.filter(r => r.checked);
          if (checked.length === 0) {
            stopContinuousPolling();
            showToast('All operations completed', 'info');
            return;
          }

          const delay = Number(serialConfig.value.interframeDelayMs) || 20;
          for (const row of checked) {
            if (!isPolling.value || !serialConnected.value) break;

            const fc = Number(row.fc);
            // Function 16, 6, 5: WRITE
            if (fc === 16 || fc === 6 || fc === 5) {
              await writeSingleRegister(row);
            }
            // Function 3, 4, 1, 2: READ
            else {
              await readSingleRegister(row);
            }

            await new Promise(r => setTimeout(r, delay));
          }

          if (isPolling.value && serialConnected.value) {
            const remainingChecked = modbusRegisters.value.filter(r => r.checked);
            if (remainingChecked.length === 0) {
              stopContinuousPolling();
              showToast('All operations completed', 'info');
              return;
            }
            pollingTimer = setTimeout(() => {
              runContinuousPollingLoop();
            }, pollingIntervalMs.value);
          }
        };

        const stopContinuousPolling = () => {
          isPolling.value = false;
          if (pollingTimer) {
            clearTimeout(pollingTimer);
            pollingTimer = null;
          }
        };

        // Fallbacks for backwards compatibility
        const readAllCheckedRegisters = toggleStartStop;
        const writeAllCheckedRegisters = toggleStartStop;
        const toggleContinuousPolling = toggleStartStop;

        const clearAllRegisterValues = () => {
          modbusRegisters.value.forEach(r => {
            r.liveValue = '';
            r.exception = '';
            r.status = 'IDLE';
            r.lastUpdated = null;
          });
          updateTabulatorData();
          showToast('Live values cleared', 'info');
        };

        const confirmAddCustomRegister = () => {
          const form = newRegisterForm.value;
          const newRow = {
            id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            checked: true,
            slave: Number(form.slave) || 1,
            fc: Number(form.fc) || 4,
            reg: Number(form.reg) || 0,
            numreg: Number(form.numreg) || 1,
            format: form.format || 'uint',
            endianness: form.endianness || 'Big-Endian',
            parameter: form.parameter || 'Register ' + form.reg,
            description: '',
            valuetowrite: form.valuetowrite || '',
            liveValue: '',
            exception: '',
            status: 'IDLE',
            reading: false,
            writing: false,
            lastUpdated: null,
          };
          modbusRegisters.value.push(newRow);
          if (tabulatorTable) {
            tabulatorTable.addRow(newRow, false).then(row => {
              try { row.select(); } catch(e) {}
            });
          }
          showAddRegisterModal.value = false;
          showToast('Register added to memory map', 'success');
        };

        const deleteRegisterRow = (idx) => {
          const row = modbusRegisters.value[idx];
          if (row) {
            modbusRegisters.value.splice(idx, 1);
            updateTabulatorData();
          }
        };

        // CSV Export
        const exportRegistersCSV = () => {
          const headers = ['CHECK', 'SLAVE', 'FC', 'ADDRESS', 'REG_NUM', 'FORMAT', 'PARAMETER_NAME', 'VALUE_ON_MEMMAP', 'VALUE_TO_WRITE', 'EXCEPTION', 'ENDIANNESS'];
          const rows = modbusRegisters.value.map(r => [
            r.checked ? 'TRUE' : 'FALSE',
            r.slave,
            r.fc,
            r.reg,
            r.numreg,
            r.format,
            '"' + (r.parameter || '').replace(/"/g, '""') + '"',
            '"' + (r.liveValue || '') + '"',
            '"' + (r.valuetowrite || '') + '"',
            r.exception || '',
            r.endianness || 'Big-Endian',
          ]);

          const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute('download', 'modbus_registers_' + selectedModbusPreset.value + '.csv');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('Exported registers to CSV', 'success');
        };

        // CSV Import
        const handleImportCSV = (event) => {
          const file = event.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const text = e.target.result;
              const lines = text.split(/\\r?\\n/).filter(l => l.trim().length > 0);
              if (lines.length < 2) {
                showToast('CSV file is empty or invalid', 'error');
                return;
              }

              const headerLine = lines[0].toLowerCase();
              const parsed = [];
              for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                if (parts.length >= 4) {
                  let checked = true;
                  let slave = 1;
                  let fc = 4;
                  let reg = 0;
                  let numreg = 1;
                  let format = 'uint';
                  let endianness = 'Big-Endian';
                  let parameter = '';
                  let valuetowrite = '';

                  if (headerLine.includes('modbus register')) {
                    // Template DVT CSV format (No., Modbus Register (Decimal), ..., FC Read, FC Write, # of Registers, Description, Range, End-user Default, Format...)
                    slave = 1;
                    reg = Number(parts[1]) || 0;
                    fc = Number(parts[3]) || 3;
                    numreg = Number(parts[5]) || 1;
                    parameter = parts[6] || ('Reg ' + reg);
                    // Do NOT fill write value if read/default is empty
                    valuetowrite = parts[8] || '';
                    format = normalizeFormat(parts[9] || 'string');
                    endianness = 'Big-Endian';
                    checked = true;
                  } else if (headerLine.includes('check')) {
                    checked = parts[0].toUpperCase() === 'TRUE' || parts[0] === '1';
                    slave = Number(parts[1]) || 1;
                    fc = Number(parts[2]) || 4;
                    reg = Number(parts[3]) || 0;
                    numreg = Number(parts[4]) || 1;
                    format = normalizeFormat(parts[5]);
                    parameter = parts[6] || 'Reg ' + reg;
                    valuetowrite = parts[7] || '';
                    endianness = parts[9] || parts[8] || 'Big-Endian';
                  } else {
                    slave = Number(parts[0]) || 1;
                    fc = Number(parts[1]) || 4;
                    reg = Number(parts[2]) || 0;
                    numreg = Number(parts[3]) || 1;
                    format = normalizeFormat(parts[4]);
                    parameter = parts[5] || 'Reg ' + reg;
                    valuetowrite = parts[6] || '';
                    endianness = parts[8] || parts[7] || 'Big-Endian';
                  }

                  parsed.push({
                    id: 'reg_' + Date.now() + '_' + i,
                    checked,
                    slave,
                    fc,
                    reg,
                    numreg,
                    format,
                    endianness,
                    parameter,
                    valuetowrite,
                    liveValue: '',
                    exception: '',
                    status: 'IDLE',
                    reading: false,
                    writing: false,
                    lastUpdated: null,
                  });
                }
              }

              if (parsed.length > 0) {
                modbusRegisters.value = parsed;
                selectedModbusPreset.value = 'CUSTOM';
                selectedRowCount.value = 0;
                updateTabulatorData();
                showToast('Imported ' + parsed.length + ' registers from CSV', 'success');
              } else {
                showToast('No valid register rows found in CSV', 'error');
              }
            } catch(err) {
              console.error('Import CSV error:', err);
              showToast('Failed to parse CSV file: ' + err.message, 'error');
            }
          };
          reader.readAsText(file);
          event.target.value = '';
        };

        // Raw Command Sender
        const sendRawCommand = async () => {
          if (!serialConnected.value) {
            showToast('Please connect to serial port first', 'error');
            return;
          }
          const raw = rawTx.value.text.trim();
          if (!raw) return;

          let uint8Bytes = null;
          if (rawTx.value.format === 'HEX') {
            const cleanHex = raw.replace(/[^0-9a-fA-F]/g, '');
            if (cleanHex.length % 2 !== 0) {
              showToast('Invalid Hex string: odd number of characters', 'error');
              return;
            }
            const bytes = [];
            for (let i = 0; i < cleanHex.length; i += 2) {
              bytes.push(parseInt(cleanHex.substr(i, 2), 16));
            }
            uint8Bytes = new Uint8Array(bytes);
          } else {
            let str = raw;
            if (rawTx.value.suffix === 'CR') str += '\\r';
            else if (rawTx.value.suffix === 'LF') str += '\\n';
            else if (rawTx.value.suffix === 'CRLF') str += '\\r\\n';
            uint8Bytes = new TextEncoder().encode(str);
          }

          try {
            await sendSerialBytes(uint8Bytes);
            showToast('Packet transmitted', 'info');
          } catch(e) {
            console.error('Raw send error:', e);
            showToast('Transmit error: ' + (e.message || e), 'error');
          }
        };

        const copySerialTerminalLogs = () => {
          if (serialLogs.value.length === 0) return;
          const text = serialLogs.value.map(l => l.time + ' [' + l.type + '] ' + (serialLogViewMode.value === 'HEX' ? l.hex : l.ascii)).join('\\n');
          copyText(text);
          showToast('Logs copied to clipboard', 'info');
        };

        const clearSerialTerminalLogs = () => {
          serialLogs.value = [];
          showToast('Terminal logs cleared', 'info');
        };

        // Search filter sync with Tabulator
        watch(registerSearchQuery, (q) => {
          if (!tabulatorTable) return;
          const term = (q || '').trim().toLowerCase();
          if (!term) {
            tabulatorTable.clearFilter();
          } else {
            tabulatorTable.setFilter(function(data) {
              return (
                String(data.reg).includes(term) ||
                (data.parameter && data.parameter.toLowerCase().includes(term)) ||
                (data.format && data.format.toLowerCase().includes(term))
              );
            });
          }
        });

        // Feature switch sync with Tabulator
        if (activeFeature) {
          watch(activeFeature, (newFeature) => {
            if (newFeature && (newFeature.id === 'serial-uart-monitor' || newFeature.id === 'serial-diagnostic')) {
              nextTick(async () => {
                await initSerialModule();
                initTabulatorTable();
              });
            } else {
              // Navigated away (Home or another feature): cleanly destroy instance & reset state
              if (tabulatorTable) {
                try {
                  tabulatorTable.destroy();
                } catch(e) {}
                tabulatorTable = null;
              }
              isBuildingTable = false;
              clearTimeout(initTableTimer);
            }
          }, { immediate: true });
        }

        // Tab switch sync with Tabulator
        watch(serialActiveTab, (tab) => {
          if (tab === 'MAP') {
            nextTick(() => {
              const container = document.getElementById('modbus-tabulator-table');
              if (tabulatorTable && tabulatorTable.element === container && !isBuildingTable) {
                tabulatorTable.redraw(true);
              } else {
                initTabulatorTable();
              }
            });
          }
        });

        const handleResize = () => {
          if (tabulatorTable && !isBuildingTable) {
            tabulatorTable.redraw(true);
          }
        };

        let presetsBroadcastChannel = null;

        const handlePresetsSync = async (changedPresetId, action) => {
          await fetchAvailablePresets();
          if (changedPresetId && selectedModbusPreset.value === changedPresetId) {
            if (action === 'deleted') {
              if (modbusPresets.value.length > 0) {
                selectedModbusPreset.value = modbusPresets.value[0].sku;
              }
            }
            await loadModbusPresetBySku(selectedModbusPreset.value);
          }
        };

        const handleStorageEvent = (e) => {
          if (e.key === 'dvt_presets_updated_at') {
            handlePresetsSync(selectedModbusPreset.value, 'updated');
          }
        };

        const handleWindowFocus = () => {
          fetchAvailablePresets();
        };

        // Lifecycle Listeners
        onMounted(() => {
          window.addEventListener('keydown', handleKeydown);
          window.addEventListener('resize', handleResize);
          if (typeof navigator !== 'undefined' && navigator.serial) {
            try {
              navigator.serial.addEventListener('disconnect', handleSerialDisconnect);
              navigator.serial.addEventListener('connect', handleSerialConnect);
            } catch(e) {}
          }
          if (typeof BroadcastChannel !== 'undefined') {
            try {
              presetsBroadcastChannel = new BroadcastChannel('dvt_modbus_presets_sync');
              presetsBroadcastChannel.onmessage = (ev) => {
                if (ev.data && ev.data.type === 'PRESETS_CHANGED') {
                  handlePresetsSync(ev.data.presetId, ev.data.action);
                }
              };
            } catch(e) {}
          }
          window.addEventListener('storage', handleStorageEvent);
          window.addEventListener('focus', handleWindowFocus);
          nextTick(async () => {
            if (activeFeature && activeFeature.value && (activeFeature.value.id === 'serial-uart-monitor' || activeFeature.value.id === 'serial-diagnostic')) {
              await initSerialModule();
              initTabulatorTable();
            }
          });
        });

        // Clean up on unmount
        onUnmounted(() => {
          window.removeEventListener('keydown', handleKeydown);
          window.removeEventListener('resize', handleResize);
          if (typeof navigator !== 'undefined' && navigator.serial) {
            try {
              navigator.serial.removeEventListener('disconnect', handleSerialDisconnect);
              navigator.serial.removeEventListener('connect', handleSerialConnect);
            } catch(e) {}
          }
          if (autoReconnectTimer) {
            clearTimeout(autoReconnectTimer);
            autoReconnectTimer = null;
          }
          if (presetsBroadcastChannel) {
            try { presetsBroadcastChannel.close(); } catch(e) {}
            presetsBroadcastChannel = null;
          }
          window.removeEventListener('storage', handleStorageEvent);
          window.removeEventListener('focus', handleWindowFocus);
          stopContinuousPolling();
          if (serialConnected.value) {
            disconnectSerial();
          }
          if (tabulatorTable) {
            try {
              tabulatorTable.destroy();
            } catch(e) {}
            tabulatorTable = null;
          }
          isBuildingTable = false;
          clearTimeout(initTableTimer);
        });

  return {
          isSerialSupported,
          serialPort,
          serialConnected,
          serialConnecting,
          isAutoReconnecting,
          serialPortInfo,
          serialConfig,
          serialSignals,
          serialStats,
          serialLogs,
          serialLogFilter,
          serialLogViewMode,
          serialPauseScroll,
          serialActiveTab,
          showSettingsDrawer,
          showAddRegisterModal,
          registerSearchQuery,
          selectedModbusPreset,
          rawTx,
          serialTerminalBoxRef,
          csvFileInputRef,
          isPolling,
          pollingIntervalMs,
          batchReading,
          batchWriting,
          modbusPresets,
          modbusRegisters,
          newRegisterForm,
          selectedRowCount,
          checkedRowCount,
          toggleStartStop,
          deleteSelectedRows,
          addNewRegisterRow,
          initTabulatorTable,
          formatHexAddress,
          formatFCName,
          getFCBadgeClass,
          getLiveValueClass,
          formatLiveValue,
          formatShortTime,
          formatBytes,
          getLogTagClass,
          getLogTextClass,
          filteredSerialLogs,
          isAllRegistersChecked,
          toggleSelectAllRegisters,
          filteredModbusRegisters,
          initSerialModule,
          fetchAvailablePresets,
          refreshCurrentPreset,
          applySelectedPreset,
          loadModbusPresetBySku,
          selectSerialPort,
          connectSerial,
          disconnectSerial,
          toggleDTR,
          toggleRTS,
          readSingleRegister,
          writeSingleRegister,
          readAllCheckedRegisters,
          writeAllCheckedRegisters,
          toggleContinuousPolling,
          stopContinuousPolling,
          clearAllRegisterValues,
          confirmAddCustomRegister,
          deleteRegisterRow,
          exportRegistersCSV,
          handleImportCSV,
          sendRawCommand,
          copySerialTerminalLogs,
          clearSerialTerminalLogs,
  };
}
`;
//# sourceMappingURL=serial-uart.module.js.map