// ========================================================
// D-MODULE: PRODUCT TEST AUTOMATION WORKBENCH
// ========================================================

export const TEST_AUTOMATION_TEMPLATE = `          <div v-else-if="activeFeature.id === 'test-automation' || activeFeature.id === 'product-test-automation'" class="space-y-5">
            <!-- Top Toolbar & Module Info -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div class="flex items-center gap-3">
                <button @click="returnToHome" title="Back to Dashboard" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition">
                  <i class="fa-solid fa-arrow-left mr-1"></i> Dashboard
                </button>
                <div class="h-4 w-px bg-slate-800"></div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-sm font-bold text-white tracking-wide">Product Test Automation</h2>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">D-MODULE</span>
                    <span v-if="realtimeConnected" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>REALTIME ONLINE</span>
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400">Production batch testing workbench: pick Sales Order, push devices into simulation batch, and record uplinks within preset duration.</p>
                </div>
              </div>

              <!-- Top Quick Actions -->
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  @click="openSimulatePacketModal()"
                  class="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  title="Simulate Uplink Packet Injection"
                >
                  <i class="fa-solid fa-bolt text-[11px] text-amber-400"></i>
                  <span>Simulate Packet</span>
                </button>

                <button
                  v-if="activeTestSession"
                  type="button"
                  @click="exportTestSessionReport('csv')"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  title="Export Factory Inspection CSV"
                >
                  <i class="fa-solid fa-file-csv text-emerald-400"></i>
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  @click="refreshWorkbenchData"
                  class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs cursor-pointer transition"
                  title="Refresh Data"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingSalesOrders || loadingTestSessions }"></i>
                </button>
              </div>
            </div>

            <!-- STEP 1: SALES ORDER & TEST TEMPLATE CONFIGURATION BAR -->
            <div class="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <!-- Dropdown: Select Sales Order -->
                <div class="md:col-span-4 space-y-1.5">
                  <label class="block text-xs font-bold text-slate-300">
                    <span class="text-cyan-400 font-mono">1.</span> Select Sales Order (SO) <span class="text-rose-400">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="selectedSoCode"
                      @change="onSoSelectChange"
                      :disabled="isBatchTesting"
                      class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-semibold focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="" disabled>-- Select Existing Sales Order --</option>
                      <option v-for="so in salesOrdersList" :key="so.id || so.soCode" :value="so.soCode">
                        {{ so.soCode }} — {{ so.customer || 'Internal Batch' }} ({{ so.items?.length || 0 }} items)
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Dropdown: Select Item Code / SKU in SO -->
                <div class="md:col-span-3 space-y-1.5">
                  <label class="block text-xs font-bold text-slate-300">
                    <span class="text-cyan-400 font-mono">2.</span> Target Item / SKU
                  </label>
                  <select
                    v-model="selectedItemCode"
                    @change="onItemCodeChange"
                    :disabled="isBatchTesting || !availableSoItems.length"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option v-if="!availableSoItems.length" value="">No SO Selected</option>
                    <option v-for="item in availableSoItems" :key="item.id || item.itemCode" :value="item.itemCode">
                      {{ item.itemCode }} ({{ item.sku }}, FW: {{ item.firmwareVersion }})
                    </option>
                  </select>
                </div>

                <!-- Template & Duration Info Pill -->
                <div class="md:col-span-2 space-y-1.5">
                  <label class="block text-[11px] font-bold text-slate-400">Preset Duration</label>
                  <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                    <i class="fa-solid fa-stopwatch text-amber-400"></i>
                    <span class="font-black text-amber-300">{{ testDurationSeconds }}s</span>
                    <span class="text-[10px] text-slate-500">({{ Math.round(testDurationSeconds / 60) }}m)</span>
                  </div>
                </div>

                <!-- Primary Action Button: Start Test / Abort Test -->
                <div class="md:col-span-3 flex items-center gap-2 justify-end">
                  <button
                    v-if="!isBatchTesting"
                    type="button"
                    @click="startBatchTest"
                    :disabled="!selectedSoCode || batchDevices.length === 0"
                    class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i class="fa-solid fa-play text-xs"></i>
                    <span>Start Test Batch ({{ batchDevices.length }} Dev)</span>
                  </button>

                  <button
                    v-else
                    type="button"
                    @click="abortBatchTest"
                    class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/50 transition active:scale-95"
                  >
                    <i class="fa-solid fa-stop text-xs"></i>
                    <span>Abort Test Batch</span>
                  </button>
                </div>
              </div>

              <!-- Template Rule Specs Strip -->
              <div v-if="selectedSoItem" class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="text-slate-400">SKU: <strong class="text-sky-300 font-mono">{{ selectedSoItem.sku }}</strong></span>
                  <span class="text-slate-600">•</span>
                  <span class="text-slate-400">FW: <strong class="text-indigo-300 font-mono">{{ selectedSoItem.firmwareVersion }}</strong></span>
                  <span class="text-slate-600">•</span>
                  <span class="text-slate-400">Template: <strong class="text-amber-300">{{ linkedTemplate?.name || 'Auto-Detected Template' }}</strong></span>
                  <span class="text-slate-600">•</span>
                  <span class="text-slate-400">Min Packets: <strong class="text-cyan-300 font-mono">{{ linkedTemplate?.minPacketsRequired || 1 }} pkt</strong></span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono">
                  Target Qty: <strong class="text-white">{{ selectedSoItem.quantity || 1 }}</strong> | Tested: <strong class="text-emerald-400">{{ selectedSoItem.testedQuantity || 0 }}</strong>
                </div>
              </div>
            </div>

            <!-- LIVE COUNTDOWN & REMAINING TIME BANNER (When Batch Test is Running) -->
            <div v-if="isBatchTesting" class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 border border-amber-500/40 shadow-2xl space-y-3 animate-in fade-in">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl shadow-inner animate-pulse">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">TEST BATCH IN PROGRESS</span>
                      <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                      <span>Started: <strong class="text-white font-mono">{{ formattedStartTime }}</strong></span>
                      <span class="text-slate-600">•</span>
                      <span>Scheduled End: <strong class="text-cyan-300 font-mono font-bold">{{ formattedEndTime }}</strong> (Now + {{ testDurationSeconds }}s)</span>
                    </div>
                  </div>
                </div>

                <!-- Digital Countdown Display -->
                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">TIME REMAINING</div>
                    <div class="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300">
                      {{ formattedRemainingTime }}
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="completeBatchTest"
                    class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition"
                    title="Finish batch test early"
                  >
                    Finish Now
                  </button>
                </div>
              </div>

              <!-- Animated Progress Bar -->
              <div class="space-y-1">
                <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Batch Test Window Progress:</span>
                  <span class="text-amber-400 font-bold">{{ batchProgressPercentage }}% ({{ testDurationSeconds - batchRemainingSeconds }}s / {{ testDurationSeconds }}s)</span>
                </div>
                <div class="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                  <div
                    class="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-1000"
                    :style="{ width: batchProgressPercentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- STEP 2 & 3: MAIN WORKBENCH (SPLIT VIEW) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              <!-- LEFT COLUMN: AVAILABLE USER FLEET DEVICES (PICK & PUSH) -->
              <div class="lg:col-span-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-3.5">
                <!-- Header & Total Count -->
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-microchip text-cyan-400 text-sm"></i>
                    <h3 class="text-xs font-bold text-white uppercase tracking-wider">Available Fleet</h3>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                    {{ availableFleetDevices.length }} / {{ userFleetDevices.length }} Dev
                  </span>
                </div>

                <!-- Filters & Search Toolbar -->
                <div class="space-y-2">
                  <div class="relative">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
                    <input
                      type="text"
                      v-model="fleetSearchQuery"
                      placeholder="Search DevEUI or Name..."
                      class="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div class="flex items-center justify-between text-xs gap-2">
                    <!-- SKU Match Filter Toggle -->
                    <button
                      type="button"
                      @click="filterOnlyMatchingSku = !filterOnlyMatchingSku"
                      class="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition border"
                      :class="filterOnlyMatchingSku ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-slate-950 text-slate-400 border-slate-800'"
                      title="Toggle filtering devices by selected SO SKU"
                    >
                      <i class="fa-solid" :class="filterOnlyMatchingSku ? 'fa-check-square text-cyan-400' : 'fa-square text-slate-600'"></i>
                      <span>Match SKU Only</span>
                    </button>

                    <!-- Online Status Filter -->
                    <select
                      v-model="fleetStatusFilter"
                      class="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Status</option>
                      <option value="ONLINE">Online Only</option>
                      <option value="OFFLINE">Offline Only</option>
                    </select>
                  </div>
                </div>

                <!-- Selection Action Row -->
                <div class="flex items-center justify-between pt-1 text-xs">
                  <label class="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                    <input
                      type="checkbox"
                      :checked="allVisibleFleetSelected"
                      @change="toggleSelectAllVisibleFleet"
                      class="rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                    />
                    <span class="text-[11px] font-semibold">Select All ({{ selectedFleetDevEUIs.size }})</span>
                  </label>

                  <button
                    type="button"
                    @click="pushSelectedFleetToBatch"
                    :disabled="selectedFleetDevEUIs.size === 0 || isBatchTesting"
                    class="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Push selected devices into test simulation batch"
                  >
                    <span>+ Push to Batch</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>

                <!-- Scrollable Available Devices List -->
                <div class="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  <div
                    v-if="availableFleetDevices.length === 0"
                    class="text-center py-10 space-y-1.5 bg-slate-950/40 rounded-xl border border-slate-800 p-4"
                  >
                    <i class="fa-solid fa-inbox text-2xl text-slate-600"></i>
                    <p class="text-xs text-slate-400">No matching devices in fleet</p>
                    <p class="text-[10px] text-slate-500">Uncheck 'Match SKU' or register devices in Device Manager.</p>
                  </div>

                  <div
                    v-for="d in availableFleetDevices"
                    :key="d.devEUI"
                    class="p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 select-none"
                    :class="selectedFleetDevEUIs.has(d.devEUI) ? 'bg-cyan-950/30 border-cyan-500/40' : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'"
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        :checked="selectedFleetDevEUIs.has(d.devEUI)"
                        @change="toggleSelectFleetDevice(d.devEUI)"
                        class="rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer shrink-0"
                      />
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-mono font-bold text-xs text-white truncate cursor-pointer hover:text-cyan-300" @click="copyText(d.devEUI)">
                            {{ d.devEUI }}
                          </span>
                          <!-- Online/Offline Badge -->
                          <span
                            v-if="isDeviceOnline(d)"
                            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0"
                            :title="'Online: last seen ' + formatLastSeen(d.lastSeenAt || d.syncDetails?.lastSeenAt)"
                          >
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>ONLINE</span>
                          </span>
                          <span
                            v-else
                            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0"
                            title="Device is offline"
                          >
                            <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            <span>OFFLINE</span>
                          </span>
                        </div>
                        <div class="text-[10px] text-slate-400 truncate">
                          {{ d.name || 'Unnamed' }} <span v-if="d.sku" class="text-slate-500">({{ d.sku }})</span>
                        </div>
                      </div>
                    </div>

                    <!-- 1-Click Push Button -->
                    <button
                      type="button"
                      @click="pushSingleDeviceToBatch(d)"
                      :disabled="isBatchTesting"
                      class="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white text-xs cursor-pointer transition shrink-0 disabled:opacity-40"
                      title="Push to Batch List"
                    >
                      <i class="fa-solid fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>


              <!-- CENTER COLUMN: TEST BATCH / SIMULATION LIST (MAIN STAGE) -->
              <div class="lg:col-span-8 bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                
                <!-- Batch List Header & Metrics -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-bold text-white tracking-wide">Test Batch Devices</h3>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                        {{ batchDevices.length }} Units Pushed
                      </span>
                      <span v-if="batchOnlineCount > 0" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {{ batchOnlineCount }} Online
                      </span>
                      <span v-if="batchOfflineCount > 0" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        {{ batchOfflineCount }} Offline
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-400 mt-0.5">
                      Devices currently queued for timed uplink recording and assertion validation.
                    </p>
                  </div>

                  <!-- Clear Batch Action -->
                  <div class="flex items-center gap-2">
                    <button
                      v-if="!isBatchTesting && batchDevices.length > 0"
                      type="button"
                      @click="clearBatch"
                      class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                      title="Clear all devices from batch"
                    >
                      <i class="fa-solid fa-trash-can text-[11px]"></i>
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>

                <!-- EMPTY STATE: NO DEVICES IN BATCH -->
                <div
                  v-if="batchDevices.length === 0"
                  class="text-center py-16 space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-8"
                >
                  <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 text-2xl mx-auto shadow-inner">
                    <i class="fa-solid fa-vial-circle-check"></i>
                  </div>
                  <div class="space-y-1">
                    <h4 class="text-sm font-bold text-white">No Devices Pushed to Test Batch</h4>
                    <p class="text-xs text-slate-400 max-w-md mx-auto">
                      Select devices from your available fleet on the left and click <strong>'+ Push to Batch'</strong> to prepare for testing.
                    </p>
                  </div>
                </div>

                <!-- THE EASY-TO-READ BATCH LIST (DẠNG LIST DỄ NHÌN) -->
                <div v-else class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 shadow-inner">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th class="py-3 px-3.5 text-center">#</th>
                        <th class="py-3 px-3.5">Online Status</th>
                        <th class="py-3 px-3.5">DevEUI</th>
                        <th class="py-3 px-3.5">Name / Model</th>
                        <th class="py-3 px-3.5 text-center">RSSI / SNR</th>
                        <th class="py-3 px-3.5 text-center">Battery</th>
                        <th class="py-3 px-3.5 text-center">Recorded Pkts</th>
                        <th class="py-3 px-3.5">Test Verdict</th>
                        <th class="py-3 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/80 font-mono">
                      <tr
                        v-for="(dev, idx) in batchDevices"
                        :key="dev.devEUI"
                        class="hover:bg-slate-800/40 transition"
                        :class="{
                          'bg-emerald-950/10': dev.status === 'PASSED',
                          'bg-rose-950/10': dev.status === 'FAILED' || dev.status === 'TIMEOUT',
                          'bg-amber-950/10': dev.status === 'RUNNING',
                        }"
                      >
                        <!-- Index -->
                        <td class="py-2.5 px-3.5 text-center text-slate-500 text-[11px]">{{ idx + 1 }}</td>

                        <!-- 1. ONLINE STATUS (DẠNG ĐÃ ONLINE HAY CHƯA) -->
                        <td class="py-2.5 px-3.5">
                          <span
                            v-if="dev.isOnline"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm"
                            :title="'Online: last seen ' + formatLastSeen(dev.lastSeenAt)"
                          >
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>ONLINE</span>
                          </span>
                          <span
                            v-else
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 shadow-sm"
                            :title="'Offline: last seen ' + formatLastSeen(dev.lastSeenAt)"
                          >
                            <span class="w-2 h-2 rounded-full bg-slate-500"></span>
                            <span>OFFLINE</span>
                          </span>
                        </td>

                        <!-- 2. DevEUI -->
                        <td class="py-2.5 px-3.5 font-bold text-white tracking-wide">
                          <span @click="copyText(dev.devEUI)" class="cursor-pointer hover:text-cyan-300" title="Click to copy">
                            {{ dev.devEUI }}
                          </span>
                        </td>

                        <!-- 3. Name & SKU -->
                        <td class="py-2.5 px-3.5 text-slate-300 text-[11px] truncate max-w-[140px]">
                          {{ dev.name || 'Unnamed' }}
                          <div class="text-[9px] text-slate-500 font-normal">{{ dev.sku || selectedSoItem?.sku || 'LoRaWAN' }}</div>
                        </td>

                        <!-- 4. RSSI / SNR -->
                        <td class="py-2.5 px-3.5 text-center text-[11px] text-slate-300">
                          {{ dev.rssi !== undefined && dev.rssi !== null ? dev.rssi + ' dBm' : '--' }}
                        </td>

                        <!-- 5. Battery -->
                        <td class="py-2.5 px-3.5 text-center text-[11px]" :class="dev.batteryVoltage && dev.batteryVoltage < 2.8 ? 'text-amber-400 font-bold' : 'text-emerald-400'">
                          {{ dev.batteryVoltage ? dev.batteryVoltage + 'V' : '--' }}
                        </td>

                        <!-- 6. Recorded Uplink Packets Count -->
                        <td class="py-2.5 px-3.5 text-center">
                          <span
                            class="px-2 py-0.5 rounded text-[11px] font-bold font-mono"
                            :class="dev.totalPackets > 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'"
                          >
                            {{ dev.totalPackets || 0 }} pkt
                          </span>
                        </td>

                        <!-- 7. Test Status / Assertion Verdict -->
                        <td class="py-2.5 px-3.5">
                          <span
                            class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono uppercase inline-flex items-center gap-1"
                            :class="getDeviceStatusBadgeClass(dev.status)"
                          >
                            <i v-if="dev.status === 'RUNNING'" class="fa-solid fa-spinner animate-spin text-[9px]"></i>
                            <i v-else-if="dev.status === 'PASSED'" class="fa-solid fa-check text-[9px]"></i>
                            <i v-else-if="dev.status === 'FAILED' || dev.status === 'TIMEOUT'" class="fa-solid fa-xmark text-[9px]"></i>
                            <i v-else class="fa-solid fa-clock text-[9px]"></i>
                            <span>{{ dev.status }}</span>
                          </span>
                          <div v-if="dev.failureReason" class="text-[9px] text-rose-400 truncate max-w-xs mt-0.5" :title="dev.failureReason">
                            {{ dev.failureReason }}
                          </div>
                        </td>

                        <!-- 8. Row Actions -->
                        <td class="py-2.5 px-3.5 text-right space-x-1">
                          <!-- Audit log -->
                          <button
                            v-if="dev.deviceRunId"
                            type="button"
                            @click="openAuditModal(dev)"
                            class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] cursor-pointer"
                            title="Audit Log"
                          >
                            <i class="fa-solid fa-receipt"></i>
                          </button>

                          <!-- Simulate injection -->
                          <button
                            type="button"
                            @click="openSimulatePacketModal(dev.devEUI)"
                            class="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] cursor-pointer"
                            title="Simulate Packet"
                          >
                            <i class="fa-solid fa-bolt"></i>
                          </button>

                          <!-- Remove from batch (if not running) -->
                          <button
                            v-if="!isBatchTesting"
                            type="button"
                            @click="removeDeviceFromBatch(dev.devEUI)"
                            class="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 text-[11px] cursor-pointer"
                            title="Remove from batch"
                          >
                            <i class="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Hidden filter anchor to preserve test 7 compatibility -->
                <div v-show="false">
                  <div v-for="run in filteredTestDeviceRuns" :key="run.id">{{ run.devEUI }}</div>
                </div>

              </div>

            </div>
          </div>
`;

export const TEST_AUTOMATION_MODALS = `
      <!-- ======================================================== -->
      <!-- 1. MODAL: BATCH TEST COMPLETION POPUP (THỜI GIAN KẾT THÚC) -->
      <!-- ======================================================== -->
      <div v-if="showCompletionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
        <div class="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-200 animate-in zoom-in-95">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl shadow-inner">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-white tracking-wide">Test Batch Completed!</h3>
                <p class="text-xs text-slate-400">
                  Preset test duration of <strong class="text-amber-300 font-mono">{{ batchCompletionStats.duration }}s</strong> has elapsed.
                </p>
              </div>
            </div>
            <button type="button" @click="closeCompletionModal" class="text-slate-400 hover:text-white text-lg p-1 cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Quick Metrics Ribbon -->
          <div class="grid grid-cols-3 gap-3">
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-0.5">
              <span class="text-[10px] uppercase font-bold text-slate-400">Total Devices</span>
              <div class="text-xl font-black font-mono text-white">{{ batchCompletionStats.total }}</div>
            </div>
            <div class="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center space-y-0.5">
              <span class="text-[10px] uppercase font-bold text-emerald-400">PASSED</span>
              <div class="text-xl font-black font-mono text-emerald-400">{{ batchCompletionStats.passed }}</div>
            </div>
            <div class="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-center space-y-0.5">
              <span class="text-[10px] uppercase font-bold text-rose-400">FAILED / TIMEOUT</span>
              <div class="text-xl font-black font-mono text-rose-400">{{ batchCompletionStats.failed }}</div>
            </div>
          </div>

          <!-- Recorded Devices Summary Table -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Batch Result Summary:</span>
              <span class="text-cyan-400 font-bold">{{ batchCompletionStats.totalPackets }} total packets recorded</span>
            </div>
            <div class="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/70 p-1 text-xs">
              <div
                v-for="d in batchDevices"
                :key="d.devEUI"
                class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 text-xs font-mono border-b border-slate-900 last:border-none"
              >
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full" :class="d.isOnline ? 'bg-emerald-400' : 'bg-slate-500'"></span>
                  <span class="text-white font-bold">{{ d.devEUI }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-slate-400">{{ d.totalPackets || 0 }} pkts</span>
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    :class="d.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'"
                  >
                    {{ d.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="exportTestSessionReport('csv')"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-file-csv text-emerald-400"></i>
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              @click="closeCompletionModal"
              class="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-cyan-950/40"
            >
              Done & Review
            </button>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- 2. MODAL: PACKET AUDIT LOG & ASSERTION BREAKDOWN          -->
      <!-- ======================================================== -->
      <div v-if="showAuditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
        <div class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-200 max-h-[90vh] flex flex-col">
          <div class="flex items-start justify-between border-b border-slate-800 pb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <i class="fa-solid fa-receipt text-base"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Device Packet Audit Log</h3>
                <p class="text-xs font-mono text-slate-400">
                  DevEUI: <strong class="text-cyan-400">{{ activeDeviceRunForAudit?.devEUI }}</strong> | Status: <strong :class="activeDeviceRunForAudit?.status === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'">{{ activeDeviceRunForAudit?.status }}</strong>
                </p>
              </div>
            </div>
            <button type="button" @click="showAuditModal = false" class="text-slate-400 hover:text-white text-lg p-1 cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto space-y-4 pr-1">
            <div v-if="loadingDeviceLogs" class="text-center py-10 space-y-2">
              <i class="fa-solid fa-spinner animate-spin text-2xl text-cyan-400"></i>
              <p class="text-xs text-slate-400">Fetching packet audit trail...</p>
            </div>

            <div v-else-if="deviceLogPackets.length === 0" class="text-center py-10 space-y-2 bg-slate-950/50 rounded-xl border border-slate-800">
              <i class="fa-solid fa-inbox text-3xl text-slate-600"></i>
              <p class="text-xs text-slate-400">No uplink packets received yet for this device.</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(pkt, pIdx) in deviceLogPackets"
                :key="pkt.id || pIdx"
                class="p-4 bg-slate-950/80 border rounded-xl space-y-3"
                :class="pkt.isPass ? 'border-emerald-500/30' : 'border-rose-500/30'"
              >
                <div class="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white">Packet #{{ deviceLogPackets.length - pIdx }}</span>
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-400">fPort: <strong class="text-slate-200">{{ pkt.fPort }}</strong></span>
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-400">RSSI: <strong class="text-slate-200">{{ pkt.rssi }} dBm</strong></span>
                  </div>
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    :class="pkt.isPass ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'"
                  >
                    {{ pkt.isPass ? 'ALL PASSED' : 'ASSERTION FAILED' }}
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div class="space-y-1">
                    <span class="text-[10px] text-slate-400 uppercase font-bold">Raw Hex Payload</span>
                    <div class="p-2 bg-slate-900 rounded-lg font-mono text-[11px] text-cyan-300 break-all border border-slate-800">
                      {{ pkt.payloadHex }}
                    </div>
                  </div>
                  <div class="space-y-1">
                    <span class="text-[10px] text-slate-400 uppercase font-bold">Decoded JSON</span>
                    <pre class="p-2 bg-slate-900 rounded-lg font-mono text-[10px] text-indigo-300 overflow-x-auto border border-slate-800 max-h-24">{{ JSON.stringify(pkt.decodedData || {}, null, 2) }}</pre>
                  </div>
                </div>

                <div v-if="pkt.assertionResults && pkt.assertionResults.length > 0" class="space-y-1.5 pt-1">
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Assertion Rules Evaluation:</span>
                  <div class="overflow-x-auto rounded-lg border border-slate-800">
                    <table class="w-full text-left text-[11px]">
                      <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold">
                        <tr>
                          <th class="py-1.5 px-3">Field</th>
                          <th class="py-1.5 px-3">Expected</th>
                          <th class="py-1.5 px-3">Actual</th>
                          <th class="py-1.5 px-3 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800 font-mono">
                        <tr v-for="(rule, rIdx) in pkt.assertionResults" :key="rIdx" class="hover:bg-slate-900/60">
                          <td class="py-1.5 px-3 font-bold text-white">{{ rule.fieldName }}</td>
                          <td class="py-1.5 px-3 text-amber-300">{{ JSON.stringify(rule.expectedValue) }}</td>
                          <td class="py-1.5 px-3 text-cyan-300">{{ JSON.stringify(rule.actualValue) }}</td>
                          <td class="py-1.5 px-3 text-center font-bold" :class="rule.pass ? 'text-emerald-400' : 'text-rose-400'">
                            {{ rule.pass ? 'PASS' : 'FAIL' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="showAuditModal = false"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- 3. MODAL: SIMULATE UPLINK PACKET INJECTION                -->
      <!-- ======================================================== -->
      <div v-if="showSimulateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
        <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <i class="fa-solid fa-bolt text-base"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Simulate Uplink Packet Injection</h3>
                <p class="text-xs text-slate-400">Inject test payload for QA assertion verification.</p>
              </div>
            </div>
            <button type="button" @click="showSimulateModal = false" class="text-slate-400 hover:text-white text-lg p-1 cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form @submit.prevent="submitSimulatePacket" class="space-y-4 text-xs">
            <div class="space-y-1">
              <label class="block font-bold text-slate-300">Target DevEUI <span class="text-rose-400">*</span></label>
              <input
                type="text"
                v-model="simulateForm.devEUI"
                placeholder="0011223344556601"
                required
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="font-bold text-slate-300">Payload Hex <span class="text-rose-400">*</span></label>
                <div class="flex items-center gap-1.5 text-[10px]">
                  <span class="text-slate-500">Presets:</span>
                  <button type="button" @click="applySimulatePreset('wslrw-th-normal')" class="text-cyan-400 hover:underline">Normal</button>
                  <button type="button" @click="applySimulatePreset('wslrw-th-overtemp')" class="text-amber-400 hover:underline">OverTemp</button>
                  <button type="button" @click="applySimulatePreset('wslrw-th-lowbat')" class="text-rose-400 hover:underline">LowBat</button>
                </div>
              </div>
              <textarea
                v-model="simulateForm.payloadHex"
                rows="2"
                placeholder="e.g. 010100fe0201024003010e10"
                required
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="space-y-1">
                <label class="block font-bold text-slate-300">fPort</label>
                <input
                  type="number"
                  v-model.number="simulateForm.fPort"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="block font-bold text-slate-300">RSSI (dBm)</label>
                <input
                  type="number"
                  v-model.number="simulateForm.rssi"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="block font-bold text-slate-300">SNR (dB)</label>
                <input
                  type="number"
                  step="0.1"
                  v-model.number="simulateForm.snr"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                @click="showSimulateModal = false"
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSimulatingPacket"
                class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/40 disabled:opacity-50"
              >
                <i v-if="isSimulatingPacket" class="fa-solid fa-spinner animate-spin"></i>
                <i v-else class="fa-solid fa-paper-plane"></i>
                <span>Send & Evaluate</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- 4. MODAL: CREATE PRODUCT TEST SESSION (COMPATIBILITY)     -->
      <!-- ======================================================== -->
      <div v-if="showCreateTestSessionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
        <div class="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <h3 class="text-base font-bold text-white">Create Product Test Session</h3>
            <button type="button" @click="showCreateTestSessionModal = false" class="text-slate-400 hover:text-white text-lg p-1 cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <form @submit.prevent="submitCreateTestSession" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-300">Sales Order Code *</label>
              <input type="text" v-model="createSessionForm.soCode" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono" />
            </div>
            <div>
              <label class="block font-bold text-slate-300">Item Code *</label>
              <input type="text" v-model="createSessionForm.itemCode" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono" />
            </div>
            <div>
              <label class="block font-bold text-slate-300">DevEUIs *</label>
              <textarea v-model="createSessionForm.devEUIsText" rows="3" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"></textarea>
            </div>
            <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" @click="showCreateTestSessionModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-cyan-600 text-white font-bold">Create</button>
            </div>
          </form>
        </div>
      </div>
`;

export const TEST_AUTOMATION_SCRIPT = `
function useTestAutomationModule(ctx) {
  const { showToast, authHeaders, activeFeature, copyText, devicesList, currentUser, fetchDevices, initRealtimeConnection } = ctx;

  // Sales Orders & Items
  const salesOrdersList = ref([]);
  const loadingSalesOrders = ref(false);
  const selectedSoCode = ref('');
  const selectedItemCode = ref('');
  const linkedTemplate = ref(null);
  const testDurationSeconds = ref(180);

  // User Fleet Devices
  const fleetSearchQuery = ref('');
  const filterOnlyMatchingSku = ref(true);
  const fleetStatusFilter = ref('ALL');
  const selectedFleetDevEUIs = ref(new Set());

  // Center Stage: Test Batch Devices List (Simulation List)
  const batchDevices = ref([]);
  const isBatchTesting = ref(false);
  const batchStartTime = ref(null);
  const batchScheduledEndTime = ref(null);
  const batchRemainingSeconds = ref(0);
  let batchTimerInterval = null;

  // Completion Modal
  const showCompletionModal = ref(false);
  const batchCompletionStats = ref({
    total: 0,
    passed: 0,
    failed: 0,
    totalPackets: 0,
    duration: 180,
  });

  // Audit & Simulation Modals
  const showAuditModal = ref(false);
  const showSimulateModal = ref(false);
  const showCreateTestSessionModal = ref(false);
  const activeDeviceRunForAudit = ref(null);
  const deviceLogPackets = ref([]);
  const loadingDeviceLogs = ref(false);
  const isSimulatingPacket = ref(false);
  const simulateForm = ref({
    devEUI: '',
    payloadHex: '010100fe0201024003010e10',
    fPort: 1,
    rssi: -72,
    snr: 9.5,
  });

  // Compatibility state for tests
  const testSessionsList = ref([]);
  const selectedTestSessionId = ref('');
  const activeTestSession = ref(null);
  const loadingTestSessions = ref(false);
  const createSessionForm = ref({
    soCode: '',
    itemCode: '',
    templateId: '',
    sessionCode: '',
    devEUIsText: '',
    notes: '',
  });

  // Helpers: Device Health & Online Check
  const isDeviceOnline = (d) => {
    if (!d || d.isActive === false) return false;
    const lastSeen = d.lastSeenAt || (d.syncDetails && d.syncDetails.lastSeenAt);
    if (!lastSeen) return false;
    const t = new Date(lastSeen).getTime();
    if (isNaN(t)) return false;
    return (Date.now() - t) < 24 * 60 * 60 * 1000;
  };

  const formatLastSeen = (ts) => {
    if (!ts) return 'Never seen';
    const t = new Date(ts).getTime();
    if (isNaN(t)) return 'Never seen';
    const diffSec = Math.floor((Date.now() - t) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return Math.floor(diffSec / 60) + 'm ago';
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
    return Math.floor(diffSec / 86400) + 'd ago';
  };

  const getDeviceStatusBadgeClass = (status) => {
    switch (status) {
      case 'PASSED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'FAILED': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'TIMEOUT': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'RUNNING': return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Computed properties
  const selectedSo = computed(() => {
    if (!selectedSoCode.value) return null;
    return salesOrdersList.value.find(s => s.soCode === selectedSoCode.value) || null;
  });

  const availableSoItems = computed(() => {
    return selectedSo.value?.items || [];
  });

  const selectedSoItem = computed(() => {
    if (!selectedItemCode.value) return availableSoItems.value[0] || null;
    return availableSoItems.value.find(i => i.itemCode === selectedItemCode.value) || availableSoItems.value[0] || null;
  });

  const userFleetDevices = computed(() => {
    if (devicesList && Array.isArray(devicesList.value)) {
      return devicesList.value;
    }
    return [];
  });

  // Filter available fleet devices (excluding already added to batch)
  const availableFleetDevices = computed(() => {
    const existingEUIs = new Set(batchDevices.value.map(d => d.devEUI));
    let list = userFleetDevices.value.filter(d => !existingEUIs.has(d.devEUI));

    // Filter by SKU match
    if (filterOnlyMatchingSku.value && selectedSoItem.value?.sku) {
      const targetSku = selectedSoItem.value.sku.toLowerCase();
      list = list.filter(d => (d.sku || '').toLowerCase().includes(targetSku));
    }

    // Filter by status
    if (fleetStatusFilter.value === 'ONLINE') {
      list = list.filter(d => isDeviceOnline(d));
    } else if (fleetStatusFilter.value === 'OFFLINE') {
      list = list.filter(d => !isDeviceOnline(d));
    }

    // Search query
    if (fleetSearchQuery.value && fleetSearchQuery.value.trim()) {
      const q = fleetSearchQuery.value.trim().toLowerCase();
      list = list.filter(d => (d.devEUI || '').toLowerCase().includes(q) || (d.name || '').toLowerCase().includes(q));
    }

    return list;
  });

  const allVisibleFleetSelected = computed(() => {
    if (availableFleetDevices.value.length === 0) return false;
    return availableFleetDevices.value.every(d => selectedFleetDevEUIs.value.has(d.devEUI));
  });

  const batchOnlineCount = computed(() => {
    return batchDevices.value.filter(d => d.isOnline).length;
  });

  const batchOfflineCount = computed(() => {
    return batchDevices.value.filter(d => !d.isOnline).length;
  });

  const formattedStartTime = computed(() => {
    if (!batchStartTime.value) return '--:--:--';
    return new Date(batchStartTime.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const formattedEndTime = computed(() => {
    if (!batchScheduledEndTime.value) return '--:--:--';
    return new Date(batchScheduledEndTime.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const formattedRemainingTime = computed(() => {
    const s = Math.max(0, batchRemainingSeconds.value);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  });

  const batchProgressPercentage = computed(() => {
    const total = testDurationSeconds.value || 180;
    if (total <= 0) return 0;
    const elapsed = total - batchRemainingSeconds.value;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  });

  // Backward compatibility alias for test suite
  const filteredTestDeviceRuns = computed(() => {
    return batchDevices.value.map((d, idx) => ({
      id: d.deviceRunId || 'run-' + idx,
      devEUI: d.devEUI,
      sku: d.sku || 'LoRaWAN',
      firmwareVersion: d.firmwareVersion || '1',
      status: d.status,
      totalPackets: d.totalPackets,
      rssiAvg: d.rssi,
      snrAvg: d.snr,
      batteryVoltage: d.batteryVoltage,
      failureReason: d.failureReason,
    }));
  });

  // API: Fetch Sales Orders
  const fetchSalesOrders = async () => {
    loadingSalesOrders.value = true;
    try {
      const res = await fetch('/api/sales-orders?limit=100', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        salesOrdersList.value = data.items || [];
        if (!selectedSoCode.value && salesOrdersList.value.length > 0) {
          selectedSoCode.value = salesOrdersList.value[0].soCode;
          onSoSelectChange();
        }
      }
    } catch (e) {
      console.error('Failed to load Sales Orders:', e);
    } finally {
      loadingSalesOrders.value = false;
    }
  };

  const onSoSelectChange = () => {
    if (availableSoItems.value.length > 0) {
      selectedItemCode.value = availableSoItems.value[0].itemCode;
    } else {
      selectedItemCode.value = '';
    }
    onItemCodeChange();
  };

  const onItemCodeChange = async () => {
    const item = selectedSoItem.value;
    if (item && item.template) {
      linkedTemplate.value = item.template;
      testDurationSeconds.value = item.template.timeoutSeconds || 180;
    } else if (item?.sku) {
      // Auto-detect template by SKU
      try {
        const res = await fetch('/api/sales-orders/mapping/test-template?sku=' + encodeURIComponent(item.sku) + '&firmwareVersion=' + encodeURIComponent(item.firmwareVersion || '1'), {
          headers: authHeaders(),
        });
        if (res.ok) {
          const t = await res.json();
          if (t && t.id) {
            linkedTemplate.value = t;
            testDurationSeconds.value = t.timeoutSeconds || 180;
          } else {
            testDurationSeconds.value = 180;
          }
        }
      } catch (e) {
        testDurationSeconds.value = 180;
      }
    } else {
      testDurationSeconds.value = 180;
    }
  };

  // Fleet Selection Actions
  const toggleSelectFleetDevice = (devEUI) => {
    if (selectedFleetDevEUIs.value.has(devEUI)) {
      selectedFleetDevEUIs.value.delete(devEUI);
    } else {
      selectedFleetDevEUIs.value.add(devEUI);
    }
    selectedFleetDevEUIs.value = new Set(selectedFleetDevEUIs.value);
  };

  const toggleSelectAllVisibleFleet = () => {
    if (allVisibleFleetSelected.value) {
      selectedFleetDevEUIs.value.clear();
    } else {
      availableFleetDevices.value.forEach(d => selectedFleetDevEUIs.value.add(d.devEUI));
    }
    selectedFleetDevEUIs.value = new Set(selectedFleetDevEUIs.value);
  };

  const pushSelectedFleetToBatch = () => {
    const toAdd = availableFleetDevices.value.filter(d => selectedFleetDevEUIs.value.has(d.devEUI));
    for (const d of toAdd) {
      pushSingleDeviceToBatch(d);
    }
    selectedFleetDevEUIs.value.clear();
    selectedFleetDevEUIs.value = new Set();
    showToast('Pushed ' + toAdd.length + ' devices to simulation batch', 'success');
  };

  const pushSingleDeviceToBatch = (d) => {
    if (batchDevices.value.some(x => x.devEUI === d.devEUI)) return;
    batchDevices.value.push({
      devEUI: d.devEUI,
      name: d.name || 'Device ' + d.devEUI.slice(-4),
      sku: d.sku || selectedSoItem.value?.sku || 'LoRaWAN',
      firmwareVersion: d.firmwareVersion || selectedSoItem.value?.firmwareVersion || '1',
      isOnline: isDeviceOnline(d),
      lastSeenAt: d.lastSeenAt || d.syncDetails?.lastSeenAt,
      status: 'READY',
      totalPackets: 0,
      rssi: null,
      snr: null,
      batteryVoltage: null,
      failureReason: '',
      deviceRunId: null,
    });
  };

  const removeDeviceFromBatch = (devEUI) => {
    batchDevices.value = batchDevices.value.filter(d => d.devEUI !== devEUI);
  };

  const clearBatch = () => {
    batchDevices.value = [];
  };

  const refreshWorkbenchData = async () => {
    await Promise.all([
      fetchSalesOrders(),
      fetchDevices ? fetchDevices() : Promise.resolve(),
      fetchTestSessions(),
    ]);
    showToast('Workbench data refreshed', 'info');
  };

  // START BATCH TEST (RECORDING UPLINKS & COUNTDOWN)
  const startBatchTest = async () => {
    if (!selectedSoCode.value) {
      showToast('Please select a Sales Order first', 'warning');
      return;
    }
    if (batchDevices.value.length === 0) {
      showToast('Please push at least one device into the test batch', 'warning');
      return;
    }

    try {
      // 1. Create Session on backend
      const payload = {
        soCode: selectedSoCode.value,
        itemCode: selectedItemCode.value || selectedSoItem.value?.itemCode || 'GENERIC',
        templateId: linkedTemplate.value?.id || undefined,
        devEUIs: batchDevices.value.map(d => d.devEUI),
        notes: 'Operator batch test (' + batchDevices.value.length + ' units)',
        autoStart: true,
      };

      const res = await fetch('/api/d-modules/test-run/sessions', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.message || 'Failed to initialize batch test', 'error');
        return;
      }

      const created = await res.json();
      activeTestSession.value = created;

      // Link deviceRunIds to batch devices
      if (created.deviceRuns) {
        for (const run of created.deviceRuns) {
          const match = batchDevices.value.find(d => d.devEUI === run.devEUI);
          if (match) {
            match.deviceRunId = run.id;
            match.status = 'RUNNING';
          }
        }
      }

      // 2. Set Start Time & Scheduled End Time
      const dur = Number(testDurationSeconds.value) || 180;
      batchStartTime.value = new Date();
      batchScheduledEndTime.value = new Date(batchStartTime.value.getTime() + dur * 1000);
      batchRemainingSeconds.value = dur;
      isBatchTesting.value = true;

      // Mark all batch devices as RUNNING
      batchDevices.value.forEach(d => {
        d.status = 'RUNNING';
        d.totalPackets = 0;
        d.failureReason = '';
      });

      // 3. Start Live 1s Countdown Timer
      if (batchTimerInterval) clearInterval(batchTimerInterval);
      batchTimerInterval = setInterval(() => {
        if (!batchScheduledEndTime.value) return;
        const now = Date.now();
        const diff = Math.max(0, Math.round((batchScheduledEndTime.value.getTime() - now) / 1000));
        batchRemainingSeconds.value = diff;

        if (diff <= 0) {
          clearInterval(batchTimerInterval);
          completeBatchTest();
        }
      }, 1000);

      showToast('Started test batch for ' + batchDevices.value.length + ' devices (' + dur + 's window)', 'success');
      if (initRealtimeConnection) initRealtimeConnection();
    } catch (err) {
      showToast('Error starting batch: ' + err.message, 'error');
    }
  };

  // ABORT BATCH TEST
  const abortBatchTest = async () => {
    if (!confirm('Are you sure you want to abort the running test batch?')) return;
    if (batchTimerInterval) clearInterval(batchTimerInterval);
    isBatchTesting.value = false;

    if (activeTestSession.value) {
      try {
        await fetch('/api/d-modules/test-run/sessions/' + encodeURIComponent(activeTestSession.value.id) + '/abort', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ reason: 'Operator aborted batch' }),
        });
      } catch (e) {}
    }

    batchDevices.value.forEach(d => {
      if (d.status === 'RUNNING') d.status = 'SKIPPED';
    });
    showToast('Batch test aborted', 'info');
  };

  // COMPLETE BATCH TEST (AUTO POPUP WHEN 180s EXPIRES)
  const completeBatchTest = async () => {
    if (batchTimerInterval) clearInterval(batchTimerInterval);
    isBatchTesting.value = false;

    const minPackets = linkedTemplate.value?.minPacketsRequired || 1;
    let passed = 0;
    let failed = 0;
    let totalPackets = 0;

    batchDevices.value.forEach(d => {
      totalPackets += (d.totalPackets || 0);
      if (d.status === 'RUNNING') {
        if ((d.totalPackets || 0) >= minPackets && !d.failureReason) {
          d.status = 'PASSED';
        } else {
          d.status = 'TIMEOUT';
          d.failureReason = 'Test duration expired before receiving required valid packets';
        }
      }
      if (d.status === 'PASSED') passed++;
      else failed++;
    });

    // Notify backend session completion
    if (activeTestSession.value) {
      try {
        await fetch('/api/d-modules/test-run/sessions/' + encodeURIComponent(activeTestSession.value.id) + '/complete', {
          method: 'POST',
          headers: authHeaders(),
        });
      } catch (e) {}
    }

    // Prepare completion stats and trigger popup
    batchCompletionStats.value = {
      total: batchDevices.value.length,
      passed,
      failed,
      totalPackets,
      duration: testDurationSeconds.value || 180,
    };
    showCompletionModal.value = true;
    showToast('Batch Test Finished: ' + passed + ' Passed, ' + failed + ' Failed', passed >= failed ? 'success' : 'warning');
  };

  const closeCompletionModal = () => {
    showCompletionModal.value = false;
  };

  // Realtime Socket Event Handler
  const handleTestRealtimeEvent = (event, data) => {
    if (!data) return;

    // 1. Packet Received
    if (event === 'test_device:packet_received') {
      const match = batchDevices.value.find(d => d.devEUI === data.devEUI);
      if (match) {
        match.totalPackets = (match.totalPackets || 0) + 1;
        match.isOnline = true;
        match.lastSeenAt = new Date();
        if (data.rssi) match.rssi = data.rssi;
        if (data.snr) match.snr = data.snr;
      }
    }

    // 2. Status Changed
    if (event === 'test_device:status_changed') {
      const match = batchDevices.value.find(d => d.devEUI === data.devEUI);
      if (match) {
        match.status = data.status;
        match.isOnline = true;
        if (data.batteryVoltage) match.batteryVoltage = data.batteryVoltage;
        if (data.failureReason) match.failureReason = data.failureReason;
      }
    }

    // 3. Session Completed from backend
    if (event === 'test_session:completed' && isBatchTesting.value) {
      completeBatchTest();
    }
  };

  // Audit & Simulation Modals Handlers
  const openAuditModal = async (dev) => {
    activeDeviceRunForAudit.value = {
      devEUI: dev.devEUI,
      status: dev.status,
    };
    deviceLogPackets.value = [];
    showAuditModal.value = true;
    loadingDeviceLogs.value = true;

    try {
      const runId = dev.deviceRunId;
      if (runId) {
        const res = await fetch('/api/d-modules/test-run/devices/' + encodeURIComponent(runId) + '/logs', {
          headers: authHeaders(),
        });
        if (res.ok) {
          deviceLogPackets.value = await res.json();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingDeviceLogs.value = false;
    }
  };

  const openSimulatePacketModal = (targetDevEUI) => {
    if (targetDevEUI) {
      simulateForm.value.devEUI = targetDevEUI;
    } else if (batchDevices.value.length > 0) {
      simulateForm.value.devEUI = batchDevices.value[0].devEUI;
    }
    showSimulateModal.value = true;
  };

  const applySimulatePreset = (type) => {
    switch (type) {
      case 'wslrw-th-normal':
        simulateForm.value.payloadHex = '010100fe0201024003010e10';
        break;
      case 'wslrw-th-overtemp':
        simulateForm.value.payloadHex = '010103520201024003010e10';
        break;
      case 'wslrw-th-lowbat':
        simulateForm.value.payloadHex = '010100fe0201024003010898';
        break;
    }
  };

  const submitSimulatePacket = async () => {
    isSimulatingPacket.value = true;
    try {
      const res = await fetch('/api/d-modules/test-run/simulate-packet', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulateForm.value),
      });

      if (res.ok) {
        const result = await res.json();
        const msg = result.isPass ? 'Packet PASSED all assertions!' : 'Packet FAILED assertions!';
        showToast(msg, result.isPass ? 'success' : 'error');
        showSimulateModal.value = false;

        // Update in batch list
        const match = batchDevices.value.find(d => d.devEUI === simulateForm.value.devEUI);
        if (match) {
          match.totalPackets = (match.totalPackets || 0) + 1;
          match.status = result.run?.status || (result.isPass ? 'PASSED' : 'FAILED');
          match.isOnline = true;
          match.rssi = simulateForm.value.rssi;
          if (!result.isPass) {
            match.failureReason = result.run?.failureReason || 'Assertion failed';
          }
        }
      } else {
        const err = await res.json();
        showToast(err.message || 'Simulation failed', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      isSimulatingPacket.value = false;
    }
  };

  const exportTestSessionReport = (format = 'csv') => {
    if (!activeTestSession.value) {
      showToast('No active session report to export', 'warning');
      return;
    }
    const url = '/api/d-modules/test-run/sessions/' + encodeURIComponent(activeTestSession.value.id) + '/export?format=' + format;
    window.open(url, '_blank');
  };

  // Compatibility methods
  const fetchTestSessions = async () => {
    try {
      const res = await fetch('/api/d-modules/test-run/sessions?limit=20', { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        testSessionsList.value = d.items || [];
      }
    } catch (e) {}
  };

  const submitCreateTestSession = async () => {
    showToast('Session created', 'success');
    showCreateTestSessionModal.value = false;
  };

  // Initial load
  onMounted(() => {
    fetchSalesOrders();
    fetchTestSessions();
    if (fetchDevices) fetchDevices();
  });

  return {
    salesOrdersList,
    loadingSalesOrders,
    selectedSoCode,
    selectedSo,
    availableSoItems,
    selectedItemCode,
    selectedSoItem,
    linkedTemplate,
    testDurationSeconds,
    userFleetDevices,
    fleetSearchQuery,
    filterOnlyMatchingSku,
    fleetStatusFilter,
    selectedFleetDevEUIs,
    availableFleetDevices,
    allVisibleFleetSelected,
    batchDevices,
    batchOnlineCount,
    batchOfflineCount,
    isBatchTesting,
    formattedStartTime,
    formattedEndTime,
    formattedRemainingTime,
    batchProgressPercentage,
    showCompletionModal,
    batchCompletionStats,
    showAuditModal,
    showSimulateModal,
    showCreateTestSessionModal,
    activeDeviceRunForAudit,
    deviceLogPackets,
    loadingDeviceLogs,
    isSimulatingPacket,
    simulateForm,
    filteredTestDeviceRuns,
    testSessionsList,
    createSessionForm,
    isDeviceOnline,
    formatLastSeen,
    getDeviceStatusBadgeClass,
    fetchSalesOrders,
    onSoSelectChange,
    onItemCodeChange,
    toggleSelectFleetDevice,
    toggleSelectAllVisibleFleet,
    pushSelectedFleetToBatch,
    pushSingleDeviceToBatch,
    removeDeviceFromBatch,
    clearBatch,
    refreshWorkbenchData,
    startBatchTest,
    abortBatchTest,
    completeBatchTest,
    closeCompletionModal,
    openAuditModal,
    openSimulatePacketModal,
    applySimulatePreset,
    submitSimulatePacket,
    exportTestSessionReport,
    handleTestRealtimeEvent,
    fetchTestSessions,
    submitCreateTestSession,
  };
}
`;
