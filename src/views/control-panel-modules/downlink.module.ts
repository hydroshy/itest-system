// ========================================================
// C-MODULE: DOWNLINK
// ========================================================

export const DOWNLINK_TEMPLATE = `
        <!-- TAB: DOWNLINK CONTROLLER & ACTUATOR -->
        <div v-show="activeTab === 'downlink'" class="space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 class="text-base font-bold text-white tracking-wide">Downlink Controller</h2>
              <p class="text-xs text-slate-400">Transmit raw Hex payloads to LoRaWAN end-devices.</p>
            </div>
            <button
              @click="fetchDownlinkHistory(); if (downlinkForm.devEUI) fetchDeviceQueue(downlinkForm.devEUI);"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition shadow-sm"
            >
              Refresh
            </button>
          </div>

          <!-- TOP 2-COLUMN SPLIT: DOWNLINK COMMAND (LEFT) & DEVICE PENDING QUEUE (RIGHT) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- 1. LEFT COLUMN: DOWNLINK COMMAND -->
            <div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between h-full">
              <div class="space-y-4">
                <div class="pb-3 border-b border-slate-800 flex items-center justify-between">
                  <h3 class="text-xs font-bold text-white uppercase tracking-wider">Downlink Command</h3>
                </div>

            <!-- 1.1 DEVICE SEARCHABLE DROPLIST -->
            <div class="space-y-1.5 relative" @click.stop>
              <label class="block text-xs font-bold text-slate-300">
                Device
              </label>

              <div class="relative flex items-center">
                <input
                  type="text"
                  v-model="downlinkDeviceSearch"
                  @focus="onDownlinkSearchFocus"
                  @click="downlinkDeviceDropdownOpen = true"
                  placeholder="Search or select device (Name or DevEUI)..."
                  class="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
                />
                <button
                  type="button"
                  @click.stop="toggleDownlinkDropdown"
                  class="absolute right-2 text-slate-400 hover:text-white text-xs p-1 cursor-pointer flex items-center justify-center"
                >
                  <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200" :class="{ 'rotate-180': downlinkDeviceDropdownOpen }"></i>
                </button>
              </div>

              <!-- Dropdown Options -->
              <div
                v-show="downlinkDeviceDropdownOpen"
                class="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-slate-950 border border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-800/80 custom-scroll"
              >
                <div
                  v-for="d in filteredDownlinkDevices"
                  :key="d.devEUI"
                  @click="selectDownlinkDevice(d)"
                  class="px-3 py-2 text-xs font-mono cursor-pointer hover:bg-slate-800 flex items-center justify-between transition"
                  :class="{ 'bg-indigo-950/50 text-indigo-300 font-bold': downlinkForm.devEUI === d.devEUI }"
                >
                  <span class="text-white">{{ d.name ? d.name + ' - ' + d.devEUI : d.devEUI }}</span>
                  <span class="text-[10px] text-slate-400 font-sans ml-2 flex-shrink-0">{{ d.networkServer?.name || 'LNS' }}</span>
                </div>
                <div v-if="filteredDownlinkDevices.length === 0" class="px-3 py-3 text-xs text-slate-500 text-center">
                  No matching devices
                </div>
              </div>

              <!-- Device Details Card: DEV_EUI, NETWORK_SERVER, REGION, FIRMWARE, SKU -->
              <div v-if="selectedDownlinkDevice" class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <div class="text-[10px] text-slate-500 font-bold tracking-wider">DEV_EUI</div>
                    <div class="font-mono font-bold text-sky-400 truncate" :title="selectedDownlinkDevice.devEUI">{{ selectedDownlinkDevice.devEUI }}</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-500 font-bold tracking-wider">NETWORK_SERVER</div>
                    <div class="font-semibold text-white truncate" :title="selectedDownlinkServer?.name || 'Default'">{{ selectedDownlinkServer?.name || 'Default' }}</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-500 font-bold tracking-wider">REGION</div>
                    <div class="font-mono text-indigo-300 truncate" :title="selectedDownlinkDevice.regionProfileName || selectedDownlinkDevice.regionProfileId || 'Default'">
                      {{ selectedDownlinkDevice.regionProfileName || selectedDownlinkDevice.regionProfileId || 'Default' }}
                    </div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-500 font-bold tracking-wider">FIRMWARE</div>
                    <div class="font-mono text-purple-300 font-bold truncate">
                      {{ formatFirmware(selectedDownlinkDevice.firmwareVersion) }}
                    </div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-500 font-bold tracking-wider">SKU</div>
                    <div class="font-mono text-cyan-300 font-bold truncate" :title="selectedDownlinkDevice.sku || '—'">
                      {{ selectedDownlinkDevice.sku || '—' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

                <!-- 1.2 FPORT, CONFIRMED TOGGLE & FLUSH QUEUE TOGGLE -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="space-y-1">
                    <label class="block text-xs font-bold text-slate-300">
                      fPort
                    </label>
                    <input
                      v-model.number="downlinkForm.fPort"
                      type="number"
                      class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div class="space-y-1">
                    <label class="block text-xs font-bold text-slate-300">
                      Confirmed
                    </label>
                    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span class="text-xs font-mono" :class="downlinkForm.confirmed ? 'text-indigo-400 font-bold' : 'text-slate-500'">{{ downlinkForm.confirmed ? 'ON' : 'OFF' }}</span>
                      <button
                        type="button"
                        @click="downlinkForm.confirmed = !downlinkForm.confirmed"
                        :class="downlinkForm.confirmed ? 'bg-indigo-600' : 'bg-slate-800'"
                        class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0"
                      >
                        <span :class="downlinkForm.confirmed ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-slate-400'" class="inline-block h-4 w-4 transform rounded-full transition-transform"></span>
                      </button>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label class="block text-xs font-bold text-slate-300">
                      Flush Queue
                    </label>
                    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span class="text-xs font-mono" :class="downlinkForm.flushQueue ? 'text-amber-400 font-bold' : 'text-slate-500'">{{ downlinkForm.flushQueue ? 'ON' : 'OFF' }}</span>
                      <button
                        type="button"
                        @click="downlinkForm.flushQueue = !downlinkForm.flushQueue"
                        :class="downlinkForm.flushQueue ? 'bg-amber-500' : 'bg-slate-800'"
                        class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0"
                      >
                        <span :class="downlinkForm.flushQueue ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-slate-400'" class="inline-block h-4 w-4 transform rounded-full transition-transform"></span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 1.3 HEX PAYLOAD & COMMAND PRESETS -->
                <div class="space-y-2">
                  <!-- Quick Preset Command Selection -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Quick Command Presets:</span>
                      <span class="text-[10px] text-indigo-400">1-click insert</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        @click="downlinkForm.payloadHex = '01FF'; downlinkForm.fPort = 1"
                        class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500 text-[10px] font-mono cursor-pointer transition"
                        title="Reboot / Reset Device"
                      >
                        ⚡ Reset (01FF)
                      </button>
                      <button
                        type="button"
                        @click="downlinkForm.payloadHex = '0101'; downlinkForm.fPort = 1"
                        class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500 text-[10px] font-mono cursor-pointer transition"
                        title="Trigger Instant Uplink Telemetry"
                      >
                        📡 Request Uplink (0101)
                      </button>
                      <button
                        type="button"
                        @click="downlinkForm.payloadHex = '02003C'; downlinkForm.fPort = 1"
                        class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500 text-[10px] font-mono cursor-pointer transition"
                        title="Set Interval 60s (0x003C)"
                      >
                        ⏱ 60s Interval (02003C)
                      </button>
                      <button
                        type="button"
                        @click="downlinkForm.payloadHex = '02012C'; downlinkForm.fPort = 1"
                        class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500 text-[10px] font-mono cursor-pointer transition"
                        title="Set Interval 300s / 5min (0x012C)"
                      >
                        ⏱ 300s Interval (02012C)
                      </button>
                      <button
                        type="button"
                        @click="downlinkForm.payloadHex = '020384'; downlinkForm.fPort = 1"
                        class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500 text-[10px] font-mono cursor-pointer transition"
                        title="Set Interval 900s / 15min (0x0384)"
                      >
                        ⏱ 900s Interval (020384)
                      </button>
                      <button
                        type="button"
                        @click="downlinkForm.payloadHex = '0300'; downlinkForm.fPort = 1"
                        class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500 text-[10px] font-mono cursor-pointer transition"
                        title="Query Device Internal Configuration"
                      >
                        🔍 Query Config (0300)
                      </button>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-1">
                    <label class="block text-xs font-bold text-slate-300 uppercase">
                      HEX PAYLOAD
                    </label>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-sky-400 border border-slate-800 font-bold">
                      {{ calculatedHexBytes }} Bytes
                    </span>
                  </div>

                  <textarea
                    v-model="downlinkForm.payloadHex"
                    rows="2"
                    placeholder="Enter hex string (e.g. 0102A3FF)..."
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs uppercase focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
                  ></textarea>
                </div>
              </div>

              <!-- 1.4 ACTION BUTTON: LARGE FULL-WIDTH SEND BUTTON -->
              <div class="pt-4">
                <button
                  type="button"
                  @click="openDownlinkConfirm"
                  :disabled="!downlinkForm.devEUI || !downlinkForm.payloadHex"
                  class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition uppercase tracking-wider"
                >
                  <i class="fa-solid fa-paper-plane"></i>
                  <span>SEND</span>
                </button>
              </div>
            </div>

            <!-- 2. RIGHT COLUMN: DEVICE PENDING QUEUE (DISPLAYED ONLY WHEN DEVICE SELECTED) -->
            <div v-if="downlinkForm.devEUI" class="glass-card rounded-2xl p-5 border border-slate-800 shadow-lg flex flex-col h-full">
              <div class="flex flex-col h-full space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
                  <div class="flex items-center gap-2">
                    <h3 class="text-xs font-bold text-white uppercase tracking-wider">Device Pending Queue</h3>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {{ deviceQueue.length }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Flush Queue button -->
                    <button
                      type="button"
                      @click="openFlushConfirm"
                      :disabled="!downlinkForm.devEUI || flushingQueue"
                      class="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                      title="Clear all pending downlinks on Network Server"
                    >
                      <i class="fa-solid fa-broom" :class="{ 'animate-spin': flushingQueue }"></i>
                      <span>Flush Queue</span>
                    </button>

                    <button
                      type="button"
                      @click="fetchDeviceQueue(downlinkForm.devEUI)"
                      :disabled="!downlinkForm.devEUI || loadingDeviceQueue"
                      class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                      title="Refresh Queue"
                    >
                      <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingDeviceQueue }"></i>
                    </button>
                  </div>
                </div>

                <!-- Queue Content -->
                <div v-if="loadingDeviceQueue && deviceQueue.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-10">
                  <i class="fa-solid fa-spinner animate-spin text-amber-400 mb-2"></i>
                  <span>Loading queue...</span>
                </div>
                <div v-else-if="deviceQueue.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                  <i class="fa-solid fa-inbox text-2xl text-slate-700 mb-2 block"></i>
                  <span>Queue is currently empty.</span>
                </div>
                <div v-else class="overflow-x-auto custom-scroll flex-1 overflow-y-auto min-h-0">
                  <table class="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr class="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono sticky top-0 bg-slate-900">
                        <th class="py-2 px-3">#</th>
                        <th class="py-2 px-3">Port</th>
                        <th class="py-2 px-3">Payload (Hex)</th>
                        <th class="py-2 px-3">Bytes</th>
                        <th class="py-2 px-3">Type</th>
                        <th class="py-2 px-3">Status</th>
                        <th class="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-mono text-xs">
                      <tr v-for="(qItem, qIdx) in deviceQueue" :key="qItem.id || qIdx" class="hover:bg-slate-800/40 transition">
                        <td class="py-2 px-3 text-slate-500">{{ qIdx + 1 }}</td>
                        <td class="py-2 px-3 text-white font-bold">{{ qItem.fPort }}</td>
                        <td class="py-2 px-3 text-sky-300 font-bold max-w-[140px] truncate" :title="qItem.payloadHex">
                          {{ qItem.payloadHex }}
                        </td>
                        <td class="py-2 px-3 text-slate-400">{{ Math.ceil((qItem.payloadHex || '').length / 2) }}</td>
                        <td class="py-2 px-3">
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold" :class="qItem.confirmed ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' : 'bg-slate-800 text-slate-400'">
                            {{ qItem.confirmed ? 'ACK' : 'Unconf' }}
                          </span>
                        </td>
                        <td class="py-2 px-3">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                            {{ qItem.isPending ? 'Pending Rx' : 'Queued' }}
                          </span>
                        </td>
                        <td class="py-2 px-3 text-right">
                          <button
                            type="button"
                            @click="copyText(qItem.payloadHex)"
                            class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] cursor-pointer"
                            title="Copy Payload Hex"
                          >
                            Copy
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- PLACEHOLDER WHEN NO DEVICE SELECTED -->
            <div v-else class="glass-card rounded-2xl p-5 border border-dashed border-slate-800/80 text-center py-16 text-slate-500 text-xs flex flex-col items-center justify-center space-y-2 h-full min-h-[300px]">
              <div class="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-600 mb-1">
                <i class="fa-solid fa-list-check text-base"></i>
              </div>
              <span class="text-slate-400 font-medium">Select a device to view pending queue</span>
            </div>

          </div>

          <!-- 3. BOTTOM: DOWNLINK EXECUTION HISTORY -->
          <div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
            <!-- History Header & Filter -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider">Downlink History</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {{ downlinkHistory.length }}
                </span>
              </div>

              <!-- Device Filter for History -->
              <div class="flex items-center gap-2">
                <select
                  v-model="downlinkHistoryFilterDevEUI"
                  @change="fetchDownlinkHistory(downlinkHistoryFilterDevEUI)"
                  class="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none"
                >
                  <option value="">-- All Devices --</option>
                  <option v-for="d in devicesList" :key="d.devEUI" :value="d.devEUI">
                    {{ d.name ? d.name + ' - ' + d.devEUI : d.devEUI }}
                  </option>
                </select>
                <button
                  type="button"
                  @click="fetchDownlinkHistory(downlinkHistoryFilterDevEUI)"
                  class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  title="Refresh"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingDownlinkHistory }"></i>
                </button>
              </div>
            </div>

            <!-- History Table -->
            <div class="overflow-x-auto custom-scroll">
              <table class="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr class="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <th class="py-2.5 px-3">Timestamp</th>
                    <th class="py-2.5 px-3">User</th>
                    <th class="py-2.5 px-3">Device</th>
                    <th class="py-2.5 px-3">Server</th>
                    <th class="py-2.5 px-3">Port</th>
                    <th class="py-2.5 px-3">Payload (Hex)</th>
                    <th class="py-2.5 px-3">Status</th>
                    <th class="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-mono text-xs">
                  <tr v-if="loadingDownlinkHistory && downlinkHistory.length === 0">
                    <td colspan="8" class="text-center py-8 text-slate-500">
                      <i class="fa-solid fa-spinner animate-spin text-sky-400 mr-2"></i>
                      Loading downlink history...
                    </td>
                  </tr>
                  <tr v-else-if="downlinkHistory.length === 0">
                    <td colspan="8" class="text-center py-10 text-slate-500">
                      No downlink records found.
                    </td>
                  </tr>
                  <tr v-for="item in downlinkHistory" :key="item.id" class="hover:bg-slate-800/40 transition">
                    <td class="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {{ formatDateTime(item.createdAt) }}
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                        {{ item.sentBy || 'anonymous' }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <div class="text-white font-bold text-[11px]">{{ item.deviceName || item.devEUI }}</div>
                      <div class="text-[10px] text-slate-500">{{ item.devEUI }}</div>
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <span
                        class="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        :class="item.serverType === 'CHIRPSTACK' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'"
                      >
                        {{ item.serverType || 'LNS' }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <span class="font-bold text-white">{{ item.fPort }}</span>
                      <span v-if="item.flushQueue" class="ml-1 px-1 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30">FLUSH</span>
                      <span v-if="item.confirmed" class="ml-1 px-1 py-0.2 rounded text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">ACK</span>
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-sky-300 max-w-[120px] truncate" :title="item.payloadHex">{{ item.payloadHex }}</span>
                        <button
                          type="button"
                          @click="copyText(item.payloadHex)"
                          class="text-slate-500 hover:text-white text-[10px] cursor-pointer"
                          title="Copy Hex"
                        >
                          <i class="fa-regular fa-copy"></i>
                        </button>
                      </div>
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        :class="item.status === 'QUEUED' || item.status === 'SUCCESS' || item.status === 'SENT' || item.status === 'FLUSHED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'"
                      >
                        {{ item.status }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        @click="resendDownlink(item)"
                        class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold border border-slate-700 cursor-pointer transition ml-auto"
                        title="Reload into form"
                      >
                        Reload
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

`;

export const DOWNLINK_MODALS = `
    <!-- MODAL: CONFIRM DOWNLINK DISPATCH -->
    <div v-if="downlinkConfirmModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-sm font-bold text-white">Confirm Downlink Dispatch</h3>
          <button @click="downlinkConfirmModal.show = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="space-y-2.5 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Device Name:</span>
            <span class="font-bold text-white font-mono">
              {{ downlinkConfirmModal.targetDevice?.name || downlinkConfirmModal.devEUI }}
            </span>
          </div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">SKU:</span>
            <span class="font-mono text-cyan-300 font-semibold">
              {{ downlinkConfirmModal.targetDevice?.sku || '—' }}
            </span>
          </div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">FIRMWARE VERSION:</span>
            <span class="font-mono text-purple-300 font-semibold">
              {{ formatFirmware(downlinkConfirmModal.targetDevice?.firmwareVersion) }}
            </span>
          </div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Device region (class):</span>
            <span class="font-mono text-indigo-300 font-semibold">
              {{ downlinkConfirmModal.targetDevice?.regionProfileName || downlinkConfirmModal.targetDevice?.regionProfileId || 'Default' }} (Class {{ downlinkConfirmModal.targetDevice?.deviceClass || 'A' }})
            </span>
          </div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Network server:</span>
            <span class="font-bold text-sky-400">
              {{ downlinkConfirmModal.targetServer?.name || 'Default' }}
            </span>
          </div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">fPort:</span>
            <span class="font-mono text-white font-bold">
              {{ downlinkConfirmModal.fPort }}
            </span>
          </div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Hex Payload:</span>
            <span class="font-mono text-emerald-400 font-bold tracking-wider">
              {{ downlinkConfirmModal.payloadHex }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-slate-400">Operator:</span>
            <span class="font-semibold text-indigo-300">
              {{ currentUser?.username || 'Operator' }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="downlinkConfirmModal.show = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="executeConfirmedDownlink"
            :disabled="sendingDownlink"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            <i class="fa-solid fa-spinner animate-spin" v-if="sendingDownlink"></i>
            <span>{{ sendingDownlink ? 'Dispatching...' : 'Confirm & Send' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: CONFIRM FLUSH QUEUE (C-MODULE) -->
    <div v-if="flushConfirmModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <i class="fa-solid fa-broom text-sm"></i>
            </div>
            <h3 class="text-sm font-bold text-white">Confirm Queue Flush</h3>
          </div>
          <button @click="flushConfirmModal.show = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="space-y-2.5 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Target Device:</span>
            <span class="font-bold text-white font-mono text-right truncate max-w-[200px]" :title="(flushConfirmModal.targetDevice && flushConfirmModal.targetDevice.name) ? flushConfirmModal.targetDevice.name : flushConfirmModal.devEUI">
              {{ (flushConfirmModal.targetDevice && flushConfirmModal.targetDevice.name) ? (flushConfirmModal.targetDevice.name + ' - ' + flushConfirmModal.devEUI) : flushConfirmModal.devEUI }}
            </span>
          </div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Network Server:</span>
            <span class="font-bold text-sky-400">
              {{ (flushConfirmModal.targetServer && flushConfirmModal.targetServer.name) ? flushConfirmModal.targetServer.name : 'Default' }}
            </span>
          </div>

          <div class="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0"></i>
            <span>This will permanently delete all pending downlink frames in the Network Server queue for this device.</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="flushConfirmModal.show = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="executeConfirmedFlush"
            :disabled="flushingQueue"
            class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            <i class="fa-solid fa-broom" :class="{ 'animate-spin': flushingQueue }"></i>
            <span>{{ flushingQueue ? 'Flushing...' : 'Confirm Flush' }}</span>
          </button>
        </div>
      </div>
    </div>

`;
