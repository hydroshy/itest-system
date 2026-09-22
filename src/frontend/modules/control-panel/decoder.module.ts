// ========================================================
// C-MODULE: DECODER
// ========================================================

export const DECODER_TEMPLATE = `
        <!-- TAB 9: DECODER MANAGER -->
        <div v-show="activeTab === 'decoder'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-code text-purple-400"></i> LoRaWAN Decoder Manager
                </h2>
                <p class="text-[11px] text-slate-400 mt-0.5">Manage JavaScript decoders by Product SKU & Firmware Version (1 - 32)</p>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="relative">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    v-model="decoderSearchQuery"
                    type="text"
                    placeholder="Search SKU or ID..."
                    class="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono w-40 sm:w-52"
                  />
                </div>
                <button @click="fetchDecoders" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': loadingDecoders }"></i> Refresh
                </button>
                <button @click="openAddDecoderModal" class="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-plus"></i> Add Decoder
                </button>
              </div>
            </div>

            <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3.5">Decoder ID</th>
                    <th class="py-2.5 px-3.5">Product SKU</th>
                    <th class="py-2.5 px-3.5">Firmware</th>
                    <th class="py-2.5 px-3.5">Description</th>
                    <th class="py-2.5 px-3.5">Updated At</th>
                    <th class="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-if="filteredDecoders.length === 0">
                    <td colspan="6" class="py-6 text-center text-slate-500">
                      {{ loadingDecoders ? 'Loading decoders...' : 'No decoders registered. Click "Add Decoder" to create one.' }}
                    </td>
                  </tr>
                  <tr v-for="dec in filteredDecoders" :key="dec.id" class="hover:bg-slate-800/30 transition">
                    <td class="py-2.5 px-3.5 font-mono font-bold text-purple-300">{{ dec.id }}</td>
                    <td class="py-2.5 px-3.5 font-bold text-white">{{ dec.sku }}</td>
                    <td class="py-2.5 px-3.5">
                      <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono font-bold">{{ dec.firmwareVersion }}</span>
                    </td>
                    <td class="py-2.5 px-3.5 text-slate-400 max-w-xs truncate" :title="dec.description || ''">
                      {{ dec.description || '—' }}
                    </td>
                    <td class="py-2.5 px-3.5 text-slate-500 font-mono text-[11px]">
                      {{ formatDateTime(dec.updatedAt) }}
                    </td>
                    <td class="py-2.5 px-3.5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          @click="loadDecoderIntoSandbox(dec)"
                          title="Test in JavaScript Sandbox"
                          class="p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs cursor-pointer"
                        >
                          <i class="fa-solid fa-play"></i>
                        </button>
                        <button
                          @click="openEditDecoderModal(dec)"
                          title="Edit Decoder"
                          class="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs cursor-pointer"
                        >
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          @click="confirmDeleteDecoder(dec)"
                          title="Delete Decoder"
                          class="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs cursor-pointer"
                        >
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- JavaScript Decoder Sandbox & Live Device Decoder Debugger -->
          <div id="decoder-sandbox-section" class="glass-card rounded-xl p-5 space-y-4">
            <!-- Header with Dual Dropdowns: Select Device from Fleet + Quick Load Saved Decoder -->
            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <i class="fa-solid fa-terminal text-purple-400"></i> Interactive Payload Sandbox & Device Decoder
                </h3>
                <p class="text-[11px] text-slate-400 mt-0.5">Select any registered device or saved decoder to inspect live telemetry decoding and verify payload codecs.</p>
              </div>

              <div class="flex flex-wrap items-center gap-2.5">
                <!-- Dropdown: Select Device from Fleet -->
                <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-purple-500/30">
                  <span class="text-[11px] text-purple-300 font-bold px-1.5 flex items-center gap-1">
                    <i class="fa-solid fa-microchip"></i> Device:
                  </span>
                  <select
                    v-model="selectedSandboxDeviceEUI"
                    @change="onSelectSandboxDevice"
                    class="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-purple-500 max-w-[220px] sm:max-w-[280px]"
                  >
                    <option value="">-- Select Created Device --</option>
                    <option v-for="dev in devicesList" :key="dev.devEUI" :value="dev.devEUI">
                      {{ dev.name }} ({{ dev.devEUI }}) [Decoder: {{ dev.decoderId || 'None' }}]
                    </option>
                  </select>
                </div>

                <!-- Dropdown: Quick Load Decoder -->
                <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <span class="text-[11px] text-slate-400 px-1">Decoder:</span>
                  <select
                    v-model="selectedSandboxDecoderId"
                    @change="onSelectSandboxDecoder"
                    class="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-purple-500 max-w-[200px]"
                  >
                    <option value="">-- Choose saved decoder --</option>
                    <option v-for="d in decodersList" :key="d.id" :value="d.id">{{ d.id }} (FW: {{ formatFirmware(d.firmwareVersion) }})</option>
                  </select>
                </div>

                <button
                  v-if="selectedSandboxDeviceEUI"
                  @click="onSelectSandboxDevice"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Reload Latest Device Telemetry"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': loadingDeviceTelemetry }"></i>
                </button>
              </div>
            </div>

            <!-- Active Device Metadata Banner (when device selected) -->
            <div v-if="sandboxActiveMetadata" class="p-3 bg-purple-950/20 border border-purple-500/25 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-3 flex-wrap">
                <div class="flex items-center gap-1.5 text-purple-300 font-bold">
                  <i class="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
                  <span>Target: {{ sandboxActiveMetadata.deviceName }}</span>
                  <span class="font-mono text-purple-200">({{ sandboxActiveMetadata.devEui }})</span>
                </div>
                <div class="h-4 w-[1px] bg-purple-500/30 hidden sm:block"></div>
                <div class="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>FPort: <strong class="text-white">{{ sandboxActiveMetadata.fPort }}</strong></span>
                  <span>FCnt: <strong class="text-white">#{{ sandboxActiveMetadata.fCnt }}</strong></span>
                  <span v-if="sandboxActiveMetadata.rssi != null">RSSI: <strong class="text-emerald-400">{{ sandboxActiveMetadata.rssi }} dBm</strong></span>
                  <span v-if="sandboxActiveMetadata.snr != null">SNR: <strong class="text-sky-400">{{ sandboxActiveMetadata.snr }} dB</strong></span>
                  <span v-if="sandboxActiveMetadata.gatewayId">GW: <strong class="text-slate-300">{{ sandboxActiveMetadata.gatewayId }}</strong></span>
                </div>
              </div>
              <div class="text-[11px] font-mono text-slate-400">
                <span v-if="sandboxActiveMetadata.timestamp">Time: {{ formatDateTime(sandboxActiveMetadata.timestamp) }}</span>
                <span v-else class="text-amber-400">No live packet recorded yet</span>
              </div>
            </div>

            <!-- Main Editor and Decoded Results Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
              <!-- Column 1: JavaScript Decoder Function -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-sans font-semibold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-brands fa-js text-amber-400"></i> JavaScript Decoder Code
                  </label>
                  <span class="text-[10px] font-sans text-slate-400">Entry: <code class="text-purple-300">decodeUplink(input)</code> or <code class="text-purple-300">Decoder(bytes, fPort)</code></span>
                </div>
                <textarea
                  v-model="sandboxCode"
                  rows="12"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs leading-relaxed custom-scroll"
                ></textarea>
              </div>

              <!-- Column 2: Test Hex Payload & Tabular / JSON Output -->
              <div class="space-y-2.5 font-sans">
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-semibold text-slate-300">Test Hex String Payload</label>
                    <div class="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>FPort:</span>
                      <input
                        v-model.number="sandboxFPort"
                        type="number"
                        min="1"
                        max="223"
                        class="w-14 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-center text-white text-xs"
                      />
                    </div>
                  </div>
                  <div class="flex gap-2 font-mono text-xs">
                    <input
                      v-model="sandboxHex"
                      type="text"
                      placeholder="e.g. 09C441"
                      class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs uppercase"
                    />
                    <button
                      @click="runSandboxDecode"
                      class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-sans font-bold rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20 flex items-center gap-1.5 flex-shrink-0"
                    >
                      <i class="fa-solid fa-play text-xs"></i>
                      <span>Decode</span>
                    </button>
                  </div>
                </div>

                <!-- Decoded Output View (Tabular vs JSON Switcher) -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between pt-1">
                    <div class="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        @click="sandboxViewMode = 'tabular'"
                        :class="sandboxViewMode === 'tabular' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                        class="px-2.5 py-1 rounded text-[11px] transition flex items-center gap-1 cursor-pointer"
                      >
                        <i class="fa-solid fa-table"></i> Tabular View
                      </button>
                      <button
                        @click="sandboxViewMode = 'json'"
                        :class="sandboxViewMode === 'json' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                        class="px-2.5 py-1 rounded text-[11px] transition flex items-center gap-1 cursor-pointer"
                      >
                        <i class="fa-solid fa-code"></i> Raw JSON
                      </button>
                    </div>

                    <button
                      v-if="sandboxResult"
                      @click="sandboxResult = ''; sandboxDecodedObject = null"
                      class="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <!-- Tabular Output Mode -->
                  <div v-if="sandboxViewMode === 'tabular'" class="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-2.5 overflow-y-auto custom-scroll">
                    <div v-if="decodedFieldsList.length === 0" class="h-full flex items-center justify-center text-center text-slate-500 text-xs font-sans">
                      <div>
                        <i class="fa-solid fa-table-list text-xl mb-1.5 block text-slate-600"></i>
                        <span>Click <strong>Decode</strong> or select a device with packets to view tabular sensor fields.</span>
                      </div>
                    </div>
                    <table v-else class="w-full text-left text-xs font-sans">
                      <thead class="text-slate-400 border-b border-slate-800 text-[11px] font-semibold">
                        <tr>
                          <th class="pb-1.5 px-2">Sensor Field</th>
                          <th class="pb-1.5 px-2">Decoded Value</th>
                          <th class="pb-1.5 px-2 text-right">Data Type</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
                        <tr v-for="f in decodedFieldsList" :key="f.key" class="hover:bg-slate-900/50">
                          <td class="py-1.5 px-2 font-bold text-purple-300">{{ f.key }}</td>
                          <td class="py-1.5 px-2 text-emerald-400 font-bold break-all">{{ f.value }}</td>
                          <td class="py-1.5 px-2 text-right text-slate-500 uppercase text-[10px]">{{ f.type }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Raw JSON Output Mode -->
                  <div v-else class="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-auto custom-scroll">
                    <pre class="text-emerald-400 text-xs font-mono">{{ sandboxDisplayOutput }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Unified Time-Series Tabular Grid (Time is Primary Column + Network Metadata + Sensor Columns) -->
            <div class="pt-3 border-t border-slate-800/80 space-y-3 font-sans">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-white text-xs flex items-center gap-1.5">
                    <i class="fa-solid fa-table-cells text-purple-400"></i> Unified Telemetry & Decoded Sensor Tabular Log
                  </span>
                  <span v-if="selectedSandboxDevice" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25">
                    Device: {{ selectedSandboxDevice.name }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {{ sortedMatrixRows.length }} / {{ matrixRows.length }} records
                  </span>
                  <span v-if="matrixSensorColumns.length > 0" class="text-emerald-400 font-bold text-[10px] font-mono">• {{ matrixSensorColumns.length }} sensor fields</span>
                </div>

                <!-- Auto-sync & Refresh -->
                <div class="flex items-center gap-2">
                  <button
                    @click="toggleSandboxAutoSync"
                    :title="sandboxAutoSync ? 'Click to pause live polling' : 'Click to enable live polling'"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer"
                    :class="sandboxAutoSync ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'"
                  >
                    <span class="relative flex h-2 w-2">
                      <span v-if="sandboxAutoSync" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2" :class="sandboxAutoSync ? 'bg-emerald-500' : 'bg-slate-500'"></span>
                    </span>
                    <span class="font-mono text-[10px] font-bold">{{ sandboxAutoSync ? 'Live Sync (3s)' : 'Sync Off' }}</span>
                  </button>

                  <button
                    @click="fetchSandboxTelemetry(false)"
                    title="Refresh Telemetry Packets"
                    class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <i class="fa-solid fa-arrows-rotate text-[10px]" :class="{ 'fa-spin': loadingDeviceTelemetry }"></i>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <!-- Filter Toolbar -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div class="flex items-center gap-2">
                  <!-- Time Filter -->
                  <div class="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-xs">
                    <i class="fa-solid fa-clock text-sky-400 text-[10px]"></i>
                    <span class="text-[10px] text-slate-400 font-bold hidden sm:inline">Time:</span>
                    <select
                      v-model="sandboxTimeFilter"
                      class="bg-transparent text-xs text-white font-mono focus:outline-none cursor-pointer"
                    >
                      <option value="ALL" class="bg-slate-900 text-slate-200">All Time</option>
                      <option value="15M" class="bg-slate-900 text-slate-200">Last 15 Mins</option>
                      <option value="1H" class="bg-slate-900 text-slate-200">Last 1 Hour</option>
                      <option value="24H" class="bg-slate-900 text-slate-200">Last 24 Hours</option>
                      <option value="7D" class="bg-slate-900 text-slate-200">Last 7 Days</option>
                    </select>
                  </div>
                </div>

                <!-- Search & Reset -->
                <div class="flex items-center gap-2 flex-1 sm:max-w-xs">
                  <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]"></i>
                    <input
                      v-model="sandboxSearchQuery"
                      type="text"
                      placeholder="Filter records..."
                      class="w-full pl-7 pr-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <button
                    v-if="isSandboxFilterActive"
                    @click="resetSandboxFilters"
                    title="Reset Filter"
                    class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <!-- Matrix Table Container -->
              <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 max-h-80 overflow-y-auto custom-scroll shadow-inner">
                <div v-if="sortedMatrixRows.length === 0" class="py-12 text-center text-slate-500 text-xs font-sans">
                  <i class="fa-solid fa-table-list text-2xl text-slate-700 mb-2 block"></i>
                  <span v-if="matrixRows.length === 0">{{ selectedSandboxDeviceEUI ? 'No telemetry packets recorded for this device yet.' : 'Select a device from the dropdown above to view its time-series tabular sensor matrix.' }}</span>
                  <span v-else>
                    No telemetry packets match your filter.
                    <button @click="resetSandboxFilters" class="text-purple-400 underline ml-1 cursor-pointer">Reset Filters</button>
                  </span>
                </div>
                <table v-else class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-900 text-slate-300 text-[11px] font-bold border-b border-slate-800 sticky top-0 z-10 select-none">
                    <tr>
                      <!-- Primary Time Column (Sortable) -->
                      <th
                        @click="toggleSandboxSort('time')"
                        class="py-2.5 px-3 whitespace-nowrap bg-slate-900 border-r border-slate-800/80 text-purple-300 cursor-pointer hover:bg-slate-800 transition"
                        title="Click to sort by Time"
                      >
                        <div class="flex items-center gap-1">
                          <i class="fa-solid fa-clock text-purple-400 text-[10px]"></i>
                          <span>TIME (Primary)</span>
                          <i
                            class="fa-solid text-[9px] ml-1"
                            :class="sandboxSortKey === 'time' ? (sandboxSortOrder === 'asc' ? 'fa-arrow-up-long text-purple-400' : 'fa-arrow-down-long text-purple-400') : 'fa-sort text-slate-600'"
                          ></i>
                        </div>
                      </th>

                      <!-- Network Metadata Columns (Sortable) -->
                      <th
                        @click="toggleSandboxSort('fPort')"
                        class="py-2.5 px-2.5 whitespace-nowrap bg-slate-900 text-slate-300 cursor-pointer hover:bg-slate-800 transition"
                        title="Click to sort by Port"
                      >
                        <div class="flex items-center gap-1">
                          <span>Port</span>
                          <i
                            class="fa-solid text-[8px]"
                            :class="sandboxSortKey === 'fPort' ? (sandboxSortOrder === 'asc' ? 'fa-arrow-up text-sky-400' : 'fa-arrow-down text-sky-400') : 'fa-sort text-slate-600'"
                          ></i>
                        </div>
                      </th>

                      <th
                        @click="toggleSandboxSort('fCnt')"
                        class="py-2.5 px-2.5 whitespace-nowrap bg-slate-900 text-slate-300 cursor-pointer hover:bg-slate-800 transition"
                        title="Click to sort by FCnt"
                      >
                        <div class="flex items-center gap-1">
                          <span>FCnt</span>
                          <i
                            class="fa-solid text-[8px]"
                            :class="sandboxSortKey === 'fCnt' ? (sandboxSortOrder === 'asc' ? 'fa-arrow-up text-sky-400' : 'fa-arrow-down text-sky-400') : 'fa-sort text-slate-600'"
                          ></i>
                        </div>
                      </th>

                      <th
                        @click="toggleSandboxSort('rssi')"
                        class="py-2.5 px-2.5 whitespace-nowrap bg-slate-900 text-emerald-400 cursor-pointer hover:bg-slate-800 transition"
                        title="Click to sort by RSSI"
                      >
                        <div class="flex items-center gap-1">
                          <span>RSSI (dBm)</span>
                          <i
                            class="fa-solid text-[8px]"
                            :class="sandboxSortKey === 'rssi' ? (sandboxSortOrder === 'asc' ? 'fa-arrow-up text-emerald-400' : 'fa-arrow-down text-emerald-400') : 'fa-sort text-slate-600'"
                          ></i>
                        </div>
                      </th>

                      <th
                        @click="toggleSandboxSort('snr')"
                        class="py-2.5 px-2.5 whitespace-nowrap bg-slate-900 text-sky-400 border-r border-slate-800/80 cursor-pointer hover:bg-slate-800 transition"
                        title="Click to sort by SNR"
                      >
                        <div class="flex items-center gap-1">
                          <span>SNR (dB)</span>
                          <i
                            class="fa-solid text-[8px]"
                            :class="sandboxSortKey === 'snr' ? (sandboxSortOrder === 'asc' ? 'fa-arrow-up text-sky-400' : 'fa-arrow-down text-sky-400') : 'fa-sort text-slate-600'"
                          ></i>
                        </div>
                      </th>

                      <!-- Dynamic Sensor Field Columns (Sortable) -->
                      <th
                        v-for="col in matrixSensorColumns"
                        :key="col"
                        @click="toggleSandboxSort('sensor:' + col)"
                        class="py-2.5 px-3 whitespace-nowrap bg-slate-900 text-amber-300 font-mono capitalize cursor-pointer hover:bg-slate-800 transition"
                        :title="'Click to sort by ' + col"
                      >
                        <div class="flex items-center gap-1">
                          <i class="fa-solid fa-chart-line text-[9px] text-amber-400/70"></i>
                          <span>{{ col }}</span>
                          <i
                            class="fa-solid text-[8px]"
                            :class="sandboxSortKey === ('sensor:' + col) ? (sandboxSortOrder === 'asc' ? 'fa-arrow-up text-amber-400' : 'fa-arrow-down text-amber-400') : 'fa-sort text-slate-600'"
                          ></i>
                        </div>
                      </th>

                      <!-- Payload Hex & Action -->
                      <th
                        @click="toggleSandboxSort('payloadHex')"
                        class="py-2.5 px-3 whitespace-nowrap bg-slate-900 text-slate-400 cursor-pointer hover:bg-slate-800 transition"
                        title="Click to sort by Payload Hex"
                      >
                        <div class="flex items-center gap-1">
                          <span>Payload Hex</span>
                          <i
                            class="fa-solid text-[8px]"
                            :class="sandboxSortKey === 'payloadHex' ? (sandboxSortOrder === 'asc' ? 'fa-arrow-up text-slate-300' : 'fa-arrow-down text-slate-300') : 'fa-sort text-slate-600'"
                          ></i>
                        </div>
                      </th>
                      <th class="py-2.5 px-3 whitespace-nowrap bg-slate-900 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr
                      v-for="(row, rIdx) in sortedMatrixRows"
                      :key="rIdx"
                      class="hover:bg-slate-800/50 transition group"
                    >
                      <!-- Time Cell (Chủ lực) -->
                      <td class="py-2 px-3 whitespace-nowrap font-bold text-white bg-slate-950/40 border-r border-slate-800/80">
                        <span class="text-purple-300 font-sans font-semibold">{{ formatDateTime(row.time) }}</span>
                      </td>

                      <!-- Network Metadata Cells -->
                      <td class="py-2 px-2.5 text-slate-400">{{ row.fPort }}</td>
                      <td class="py-2 px-2.5 text-slate-300 font-bold">#{{ row.fCnt }}</td>
                      <td class="py-2 px-2.5">
                        <span
                          v-if="row.rssi != null"
                          class="font-bold"
                          :class="row.rssi >= -90 ? 'text-emerald-400' : (row.rssi >= -110 ? 'text-amber-400' : 'text-rose-400')"
                        >
                          {{ row.rssi }}
                        </span>
                        <span v-else class="text-slate-600">—</span>
                      </td>
                      <td class="py-2 px-2.5 border-r border-slate-800/80">
                        <span
                          v-if="row.snr != null"
                          class="font-bold"
                          :class="row.snr >= 5 ? 'text-emerald-400' : (row.snr >= 0 ? 'text-sky-400' : 'text-orange-400')"
                        >
                          {{ row.snr }}
                        </span>
                        <span v-else class="text-slate-600">—</span>
                      </td>

                      <!-- Dynamic Sensor Field Value Cells -->
                      <td
                        v-for="col in matrixSensorColumns"
                        :key="col"
                        class="py-2 px-3 font-bold"
                        :class="row.sensorValues[col] !== '—' ? 'text-emerald-300 bg-emerald-950/10' : 'text-slate-600'"
                      >
                        {{ row.sensorValues[col] }}
                      </td>

                      <!-- Payload Hex Cell -->
                      <td class="py-2 px-3 text-purple-400 uppercase truncate max-w-[120px]" :title="row.payloadHex">{{ row.payloadHex }}</td>

                      <!-- Action Cell -->
                      <td class="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          @click="loadHistoricalTelemetryPacket(row.raw)"
                          class="px-2.5 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[10px] font-bold cursor-pointer transition inline-flex items-center gap-1"
                          title="Load this packet into Sandbox"
                        >
                          <i class="fa-solid fa-play text-[9px]"></i>
                          <span>Load & Test</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

`;

export const DECODER_MODALS = `
    <!-- MODAL: ADD DECODER -->
    <div v-if="addDecoderDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto custom-scroll">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <i class="fa-solid fa-code text-sm"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                Add New Decoder
                <span v-if="newDecoder.sku && newDecoder.firmwareVersion" class="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/30">
                  ID: {{ newDecoder.sku.trim() }}_{{ newDecoder.firmwareVersion }}
                </span>
              </h3>
              <p class="text-[11px] text-slate-400">Register a LoRaWAN payload decoder by Product SKU and Firmware Version (1 - 32)</p>
            </div>
          </div>
          <button @click="closeAddDecoderModal" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="promptSubmitAddDecoder" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <!-- SKU Input (Empty by default) -->
            <div>
              <label class="block font-semibold text-slate-300 mb-1">
                Product SKU <span class="text-red-400">*</span>
              </label>
              <input
                v-model="newDecoder.sku"
                type="text"
                required
                placeholder="e.g. WSLRW-V1A"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              />
              <p class="text-[10px] text-slate-500 mt-1">Hardware model identifier (Product SKU)</p>
            </div>

            <!-- Firmware Version Dropdown (1 - 32, Empty by default) -->
            <div>
              <label class="block font-semibold text-slate-300 mb-1">
                Firmware Version (1 - 32) <span class="text-red-400">*</span>
              </label>
              <select
                v-model="newDecoder.firmwareVersion"
                required
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="" disabled selected>-- Select Firmware (1 - 32) --</option>
                <option v-for="v in 32" :key="v" :value="v">{{ v }}</option>
              </select>
              <p class="text-[10px] text-slate-500 mt-1">Device firmware version number from 1 to 32</p>
            </div>
          </div>

          <!-- Description (Optional, Empty by default) -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input
              v-model="newDecoder.description"
              type="text"
              placeholder="e.g. Decoder for WSLRW-V1A Ambient Temperature & Humidity Sensor"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <!-- Decoder JavaScript Code (Empty by default) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block font-semibold text-slate-300">
                Decoder JavaScript Code <span class="text-red-400">*</span>
              </label>
              <button
                type="button"
                @click="loadSampleDecoderTemplate"
                class="text-[11px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
              >
                Insert Sample Template (Sub-functions & Main)
              </button>
            </div>
            <textarea
              v-model="newDecoder.decoderCode"
              rows="12"
              required
              placeholder="// Enter JavaScript decoder code here...
// Supports helper sub-functions alongside main entry function (decodeUplink or Decoder)
// Example:
// function parseTemp(raw) { return raw / 100; }
// function decodeUplink(input) {
//   var bytes = input.bytes;
//   return { data: { temp: parseTemp((bytes[0] << 8) | bytes[1]) } };
// }"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-purple-500"
            ></textarea>
            <p class="text-[10px] text-slate-500 mt-1">Supports modular sub-functions alongside main entry function <code class="text-purple-300">decodeUplink(input)</code> or <code class="text-purple-300">Decoder(bytes, fPort)</code>.</p>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="closeAddDecoderModal"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition"
            >
              <i class="fa-solid fa-check"></i>
              <span>Submit</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CONFIRM ADD DECODER TO DATABASE -->
    <div v-if="addDecoderConfirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center text-lg flex-shrink-0">
            <i class="fa-solid fa-circle-question"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Confirm Adding Decoder to Database</h3>
            <p class="text-xs text-slate-400 mt-0.5">Please review decoder configuration before committing</p>
          </div>
        </div>

        <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
          <p class="text-slate-300 font-medium">Are you sure you want to add this decoder to the database?</p>
          <div class="space-y-1 font-mono text-[11px] pt-1">
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-500">Product SKU:</span>
              <span class="text-white font-bold">{{ newDecoder.sku }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-500">Firmware Version:</span>
              <span class="text-indigo-300 font-bold">{{ newDecoder.firmwareVersion }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-500">Composite ID:</span>
              <span class="text-purple-400 font-bold">{{ newDecoder.sku ? newDecoder.sku.trim() : '' }}_{{ newDecoder.firmwareVersion }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-500">Database Table:</span>
              <span class="text-emerald-400 font-bold">decoder</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="addDecoderConfirmDialog = false"
            :disabled="savingDecoder"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitAddDecoder"
            :disabled="savingDecoder"
            class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition"
          >
            <i v-if="savingDecoder" class="fa-solid fa-circle-notch fa-spin"></i>
            <i v-else class="fa-solid fa-cloud-arrow-up"></i>
            <span>{{ savingDecoder ? 'Saving...' : 'Yes, Add to Database' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: EDIT DECODER -->
    <div v-if="editDecoderDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto custom-scroll">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-pen-to-square text-purple-400"></i> Edit Decoder: {{ currentDecoder.id }}
            </h3>
            <p class="text-[11px] text-slate-400">SKU: {{ currentDecoder.sku }} | Firmware: {{ currentDecoder.firmwareVersion }}</p>
          </div>
          <button @click="editDecoderDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="submitEditDecoder" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input
              v-model="currentDecoder.description"
              type="text"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">JavaScript Decoder Function</label>
            <textarea
              v-model="currentDecoder.decoderCode"
              rows="12"
              required
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-purple-500"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="editDecoderDialog = false"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="savingDecoder"
              class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition"
            >
              <i v-if="savingDecoder" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ savingDecoder ? 'Updating...' : 'Save Changes' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: DELETE DECODER CONFIRM -->
    <div v-if="deleteDecoderConfirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center text-lg flex-shrink-0">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Delete Decoder Confirmation</h3>
            <p class="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          Are you sure you want to permanently delete decoder <code class="font-mono text-purple-300 font-bold">{{ decoderToDelete?.id }}</code> from the database?
        </p>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="deleteDecoderConfirmDialog = false"
            :disabled="savingDecoder"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitDeleteDecoder"
            :disabled="savingDecoder"
            class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer transition"
          >
            <i v-if="savingDecoder" class="fa-solid fa-circle-notch fa-spin"></i>
            <i v-else class="fa-solid fa-trash-can"></i>
            <span>{{ savingDecoder ? 'Deleting...' : 'Delete Decoder' }}</span>
          </button>
        </div>
      </div>
    </div>

`;
