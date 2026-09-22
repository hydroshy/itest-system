// ========================================================
// D-MODULE: PRODUCT TEST AUTOMATION WORKBENCH
// ========================================================

export const TEST_AUTOMATION_TEMPLATE = `          <div v-else-if="activeFeature.id === 'test-automation' || activeFeature.id === 'product-test-automation'" class="space-y-6">
            <!-- Top Toolbar & Breadcrumb -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-sm">
              <div class="flex items-center gap-3">
                <button @click="returnToHome" title="Back to Dashboard" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition">
                  <i class="fa-solid fa-arrow-left mr-1"></i> Dashboard
                </button>
                <div class="h-4 w-px bg-slate-800"></div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-sm font-bold text-white tracking-wide">Product Test Automation</h2>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">D-MODULE</span>
                    <span v-if="realtimeConnected" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LIVE REALTIME</span>
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400">Factory inspection workbench: execute test sessions by SO & Item Code with live assertion rules.</p>
                </div>
              </div>

              <!-- Quick Action Buttons -->
              <div class="flex flex-wrap items-center gap-2">
                <!-- Session Dropdown Selector -->
                <div class="relative">
                  <select
                    v-model="selectedTestSessionId"
                    @change="onTestSessionSelectChange"
                    class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none max-w-[200px] truncate"
                  >
                    <option value="" disabled>-- Select Session --</option>
                    <option v-for="s in testSessionsList" :key="s.id" :value="s.id">
                      {{ s.sessionCode }} ({{ s.status }})
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  @click="openCreateTestSessionModal"
                  class="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-900/30 transition"
                >
                  <i class="fa-solid fa-plus text-[11px]"></i>
                  <span>New Session</span>
                </button>

                <button
                  v-if="activeTestSession"
                  type="button"
                  @click="openSimulatePacketModal"
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
                  @click="fetchTestSessions(true)"
                  class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs cursor-pointer transition"
                  title="Refresh Sessions"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingTestSessions }"></i>
                </button>
              </div>
            </div>

            <!-- HERO: ACTIVE SESSION METRICS & CONTROL BANNER -->
            <div v-if="activeTestSession" class="space-y-4">
              <!-- Session Header Summary Card -->
              <div class="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div class="space-y-1">
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Session Code:</span>
                      <span class="text-base font-extrabold text-white font-mono tracking-wide">{{ activeTestSession.sessionCode }}</span>
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border font-mono uppercase inline-flex items-center gap-1"
                        :class="getSessionStatusBadgeClass(activeTestSession.status)"
                      >
                        <i v-if="activeTestSession.status === 'IN_PROGRESS'" class="fa-solid fa-gear animate-spin text-[9px]"></i>
                        <i v-else-if="activeTestSession.status === 'COMPLETED'" class="fa-solid fa-circle-check text-[9px]"></i>
                        <i v-else-if="activeTestSession.status === 'ABORTED'" class="fa-solid fa-ban text-[9px]"></i>
                        <i v-else class="fa-solid fa-clock text-[9px]"></i>
                        <span>{{ activeTestSession.status }}</span>
                      </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <span>Sales Order: <strong class="text-cyan-400 font-mono">{{ activeTestSession.soCode }}</strong></span>
                      <span class="text-slate-600">•</span>
                      <span>Item Code: <strong class="text-indigo-400 font-mono">{{ activeTestSession.itemCode }}</strong></span>
                      <span class="text-slate-600">•</span>
                      <span>Template: <strong class="text-amber-400">{{ activeTestSession.template?.name || 'Auto-Detected Rules' }}</strong></span>
                      <span class="text-slate-600">•</span>
                      <span>Operator: <strong class="text-slate-300">{{ activeTestSession.operatorId || 'QA Tech' }}</strong></span>
                    </div>
                  </div>

                  <!-- Session Control Actions -->
                  <div class="flex items-center gap-2">
                    <button
                      v-if="activeTestSession.status === 'PENDING'"
                      type="button"
                      @click="startActiveTestSession"
                      :disabled="isStartingTestSession"
                      class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
                    >
                      <i class="fa-solid fa-play"></i>
                      <span>Start Session</span>
                    </button>

                    <button
                      v-if="activeTestSession.status === 'IN_PROGRESS'"
                      type="button"
                      @click="abortActiveTestSession"
                      class="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-2 cursor-pointer transition"
                    >
                      <i class="fa-solid fa-stop"></i>
                      <span>Abort Session</span>
                    </button>
                  </div>
                </div>

                <!-- 5-Metric Quick KPI Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <!-- Total Units -->
                  <div class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Units</div>
                    <div class="text-xl font-black text-white font-mono">{{ testSessionSummary.totalDevices }}</div>
                    <div class="text-[10px] text-slate-500 font-mono">100% of batch</div>
                  </div>

                  <!-- Passed Units -->
                  <div class="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
                    <div class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <i class="fa-solid fa-circle-check"></i>
                      <span>Passed</span>
                    </div>
                    <div class="text-xl font-black text-emerald-400 font-mono">{{ testSessionSummary.passedDevices }}</div>
                    <div class="text-[10px] text-emerald-300/70 font-mono">{{ testSessionSummary.passRatePercentage }}% pass rate</div>
                  </div>

                  <!-- Failed Units -->
                  <div class="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-1">
                    <div class="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <i class="fa-solid fa-circle-xmark"></i>
                      <span>Failed</span>
                    </div>
                    <div class="text-xl font-black text-rose-400 font-mono">{{ testSessionSummary.failedDevices }}</div>
                    <div class="text-[10px] text-rose-300/70 font-mono">{{ testSessionSummary.totalDevices ? Math.round((testSessionSummary.failedDevices / testSessionSummary.totalDevices) * 100) : 0 }}% of batch</div>
                  </div>

                  <!-- Running / In-Test -->
                  <div class="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1">
                    <div class="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <i class="fa-solid fa-spinner animate-spin"></i>
                      <span>Testing</span>
                    </div>
                    <div class="text-xl font-black text-amber-400 font-mono">{{ testSessionSummary.runningDevices }}</div>
                    <div class="text-[10px] text-amber-300/70 font-mono">listening uplinks</div>
                  </div>

                  <!-- Waiting / Queued -->
                  <div class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <i class="fa-solid fa-clock"></i>
                      <span>Waiting</span>
                    </div>
                    <div class="text-xl font-black text-slate-300 font-mono">{{ testSessionSummary.waitingDevices }}</div>
                    <div class="text-[10px] text-slate-500 font-mono">pending first packet</div>
                  </div>
                </div>

                <!-- Two-Tone Completion Progress Bar -->
                <div class="space-y-1.5 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div class="flex items-center justify-between text-xs font-mono">
                    <span class="text-slate-300 font-semibold flex items-center gap-1.5">
                      <i class="fa-solid fa-chart-line text-cyan-400"></i>
                      <span>Session Progress:</span>
                    </span>
                    <span class="font-bold text-cyan-400">{{ testSessionSummary.progressPercentage }}% Completed</span>
                  </div>
                  <div class="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                    <div
                      class="h-full bg-emerald-500 transition-all duration-300"
                      :style="{ width: ((testSessionSummary.passedDevices / (testSessionSummary.totalDevices || 1)) * 100) + '%' }"
                      :title="'Passed: ' + testSessionSummary.passedDevices"
                    ></div>
                    <div
                      class="h-full bg-rose-500 transition-all duration-300"
                      :style="{ width: ((testSessionSummary.failedDevices / (testSessionSummary.totalDevices || 1)) * 100) + '%' }"
                      :title="'Failed: ' + testSessionSummary.failedDevices"
                    ></div>
                    <div
                      class="h-full bg-amber-500/80 transition-all duration-300"
                      :style="{ width: ((testSessionSummary.runningDevices / (testSessionSummary.totalDevices || 1)) * 100) + '%' }"
                      :title="'Testing: ' + testSessionSummary.runningDevices"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- DEVICE VERIFICATION SECTION -->
              <div class="space-y-4">
                <!-- Search & Filters Toolbar -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div class="flex flex-wrap items-center gap-2">
                    <!-- Status Filter Tabs -->
                    <button
                      type="button"
                      @click="testDeviceStatusFilter = 'ALL'"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition"
                      :class="testDeviceStatusFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'"
                    >
                      ALL ({{ activeTestSession.deviceRuns?.length || 0 }})
                    </button>
                    <button
                      type="button"
                      @click="testDeviceStatusFilter = 'PASSED'"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition"
                      :class="testDeviceStatusFilter === 'PASSED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'"
                    >
                      PASS ({{ testSessionSummary.passedDevices }})
                    </button>
                    <button
                      type="button"
                      @click="testDeviceStatusFilter = 'FAILED'"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition"
                      :class="testDeviceStatusFilter === 'FAILED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'"
                    >
                      FAIL ({{ testSessionSummary.failedDevices }})
                    </button>
                    <button
                      type="button"
                      @click="testDeviceStatusFilter = 'RUNNING'"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition"
                      :class="testDeviceStatusFilter === 'RUNNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'"
                    >
                      TESTING ({{ testSessionSummary.runningDevices }})
                    </button>
                    <button
                      type="button"
                      @click="testDeviceStatusFilter = 'WAITING'"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition"
                      :class="testDeviceStatusFilter === 'WAITING' ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-slate-800 text-slate-400 hover:text-white'"
                    >
                      WAITING ({{ testSessionSummary.waitingDevices }})
                    </button>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Search Input -->
                    <div class="relative w-full sm:w-60">
                      <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
                      <input
                        type="text"
                        v-model="testDeviceSearchQuery"
                        placeholder="Search DevEUI..."
                        class="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <!-- View Mode Toggle -->
                    <div class="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                      <button
                        type="button"
                        @click="testDeviceViewMode = 'grid'"
                        class="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition"
                        :class="testDeviceViewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'"
                        title="Card Grid Mode"
                      >
                        <i class="fa-solid fa-table-cells-large"></i>
                      </button>
                      <button
                        type="button"
                        @click="testDeviceViewMode = 'table'"
                        class="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition"
                        :class="testDeviceViewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'"
                        title="Tabular List Mode"
                      >
                        <i class="fa-solid fa-list"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- VIEW 1: CARD GRID MODE -->
                <div v-if="testDeviceViewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div
                    v-for="run in filteredTestDeviceRuns"
                    :key="run.id"
                    class="rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden"
                    :class="getDeviceCardClass(run.status)"
                  >
                    <div class="space-y-2">
                      <!-- DevEUI Header & Status Badge -->
                      <div class="flex items-start justify-between gap-2">
                        <div class="space-y-0.5">
                          <span class="text-[10px] text-slate-400 uppercase font-mono block">DevEUI</span>
                          <span
                            @click="copyText(run.devEUI)"
                            class="text-xs font-bold font-mono text-white tracking-wider cursor-pointer hover:text-cyan-300 transition flex items-center gap-1"
                            title="Click to copy DevEUI"
                          >
                            <span>{{ run.devEUI }}</span>
                            <i class="fa-regular fa-copy text-[10px] text-slate-500"></i>
                          </span>
                        </div>

                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono uppercase inline-flex items-center gap-1 shadow-sm"
                          :class="getDeviceStatusBadgeClass(run.status)"
                        >
                          <i v-if="run.status === 'PASSED'" class="fa-solid fa-check text-[9px]"></i>
                          <i v-else-if="run.status === 'FAILED'" class="fa-solid fa-xmark text-[9px]"></i>
                          <i v-else-if="run.status === 'RUNNING'" class="fa-solid fa-gear animate-spin text-[9px]"></i>
                          <i v-else class="fa-solid fa-clock text-[9px]"></i>
                          <span>{{ run.status }}</span>
                        </span>
                      </div>

                      <!-- RF & Telemetry Metrics -->
                      <div class="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-center">
                        <div>
                          <div class="text-[9px] text-slate-400 uppercase">Packets</div>
                          <div class="text-xs font-bold font-mono text-white mt-0.5">{{ run.totalPackets || 0 }}</div>
                        </div>
                        <div>
                          <div class="text-[9px] text-slate-400 uppercase">RSSI / SNR</div>
                          <div class="text-xs font-bold font-mono text-slate-200 mt-0.5">
                            {{ run.rssiAvg !== undefined && run.rssiAvg !== null ? run.rssiAvg + 'dBm' : '--' }}
                          </div>
                        </div>
                        <div>
                          <div class="text-[9px] text-slate-400 uppercase">Battery</div>
                          <div class="text-xs font-bold font-mono mt-0.5" :class="run.batteryVoltage && run.batteryVoltage < 2.8 ? 'text-amber-400' : 'text-emerald-400'">
                            {{ run.batteryVoltage ? run.batteryVoltage + 'V' : '--' }}
                          </div>
                        </div>
                      </div>

                      <!-- Failure Reason Box if Failed -->
                      <div v-if="run.status === 'FAILED' && run.failureReason" class="p-2 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-300 space-y-0.5">
                        <div class="font-bold flex items-center gap-1 text-rose-400">
                          <i class="fa-solid fa-triangle-exclamation text-[10px]"></i>
                          <span>Failure Reason</span>
                        </div>
                        <p class="font-mono text-[10px] break-words">{{ run.failureReason }}</p>
                      </div>
                    </div>

                    <!-- Card Action Footer -->
                    <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        @click="openAuditModal(run)"
                        class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                        title="View Packet Log & Assertions"
                      >
                        <i class="fa-solid fa-receipt text-[10px] text-cyan-400"></i>
                        <span>Audit Log</span>
                      </button>

                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          @click="openSimulatePacketModal(run.devEUI)"
                          class="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] cursor-pointer transition"
                          title="Simulate Packet for this Device"
                        >
                          <i class="fa-solid fa-bolt"></i>
                        </button>

                        <button
                          v-if="run.status === 'FAILED' || run.status === 'PASSED'"
                          type="button"
                          @click="retryDeviceRun(run.id)"
                          class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] cursor-pointer transition"
                          title="Reset & Retry Test"
                        >
                          <i class="fa-solid fa-rotate-left"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- VIEW 2: TABULAR LIST MODE -->
                <div v-else class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th class="py-3 px-4">#</th>
                        <th class="py-3 px-4">DevEUI</th>
                        <th class="py-3 px-4">SKU / Firmware</th>
                        <th class="py-3 px-4">Status</th>
                        <th class="py-3 px-4 text-center">Packets</th>
                        <th class="py-3 px-4 text-center">RSSI / SNR</th>
                        <th class="py-3 px-4 text-center">Battery</th>
                        <th class="py-3 px-4">Result / Notes</th>
                        <th class="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/80 font-mono">
                      <tr v-for="(run, idx) in filteredTestDeviceRuns" :key="run.id" class="hover:bg-slate-800/40 transition">
                        <td class="py-2.5 px-4 text-slate-500 text-[11px]">{{ idx + 1 }}</td>
                        <td class="py-2.5 px-4 font-bold text-white tracking-wide">
                          <span @click="copyText(run.devEUI)" class="cursor-pointer hover:text-cyan-300">
                            {{ run.devEUI }}
                          </span>
                        </td>
                        <td class="py-2.5 px-4 text-slate-300 text-[11px]">
                          {{ run.sku }} <span class="text-slate-500">({{ run.firmwareVersion }})</span>
                        </td>
                        <td class="py-2.5 px-4">
                          <span
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono uppercase inline-flex items-center gap-1"
                            :class="getDeviceStatusBadgeClass(run.status)"
                          >
                            <span>{{ run.status }}</span>
                          </span>
                        </td>
                        <td class="py-2.5 px-4 text-center text-slate-200">{{ run.totalPackets || 0 }}</td>
                        <td class="py-2.5 px-4 text-center text-slate-400 text-[11px]">
                          {{ run.rssiAvg !== undefined && run.rssiAvg !== null ? run.rssiAvg + ' / ' + run.snrAvg : '--' }}
                        </td>
                        <td class="py-2.5 px-4 text-center" :class="run.batteryVoltage && run.batteryVoltage < 2.8 ? 'text-amber-400' : 'text-emerald-400'">
                          {{ run.batteryVoltage ? run.batteryVoltage + 'V' : '--' }}
                        </td>
                        <td class="py-2.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                          {{ run.failureReason || (run.status === 'PASSED' ? 'All assertions passed' : 'Waiting for packets...') }}
                        </td>
                        <td class="py-2.5 px-4 text-right space-x-1">
                          <button
                            type="button"
                            @click="openAuditModal(run)"
                            class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] cursor-pointer"
                            title="Audit Log"
                          >
                            <i class="fa-solid fa-receipt"></i>
                          </button>
                          <button
                            type="button"
                            @click="openSimulatePacketModal(run.devEUI)"
                            class="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] cursor-pointer"
                            title="Simulate Packet"
                          >
                            <i class="fa-solid fa-bolt"></i>
                          </button>
                          <button
                            v-if="run.status === 'FAILED'"
                            type="button"
                            @click="retryDeviceRun(run.id)"
                            class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] cursor-pointer"
                            title="Retry"
                          >
                            <i class="fa-solid fa-rotate-left"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

            <!-- EMPTY STATE: NO ACTIVE TEST SESSION -->
            <div v-else class="text-center py-16 space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
              <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 text-2xl mx-auto shadow-inner">
                <i class="fa-solid fa-vial-circle-check"></i>
              </div>
              <div class="space-y-1">
                <h3 class="text-base font-bold text-white">No Active Test Session Selected</h3>
                <p class="text-xs text-slate-400 max-w-md mx-auto">
                  Create a new session to inspect manufactured devices against Sales Orders, or pick an existing session from the dropdown above.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  @click="openCreateTestSessionModal"
                  class="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/30 transition"
                >
                  <i class="fa-solid fa-plus"></i>
                  <span>Create First Test Session</span>
                </button>
              </div>
            </div>
          </div>
`;

export const TEST_AUTOMATION_MODALS = `
      <!-- 1. MODAL: CREATE TEST SESSION -->
      <div v-if="showCreateTestSessionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
        <div class="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <i class="fa-solid fa-vial-circle-check text-base"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Create Product Test Session</h3>
                <p class="text-xs text-slate-400">Link Sales Order, Item Code, and input DevEUIs for inspection.</p>
              </div>
            </div>
            <button type="button" @click="showCreateTestSessionModal = false" class="text-slate-400 hover:text-white text-lg p-1 cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form @submit.prevent="submitCreateTestSession" class="space-y-4 text-xs">
            <!-- Row 1: SO Code & Item Code -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block font-bold text-slate-300">Sales Order (SO Code) <span class="text-rose-400">*</span></label>
                <div class="relative">
                  <input
                    type="text"
                    v-model="createSessionForm.soCode"
                    @change="onSoCodeChangedInModal"
                    placeholder="e.g. SO-2026-8899"
                    required
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label class="block font-bold text-slate-300">Item Code <span class="text-rose-400">*</span></label>
                <input
                  type="text"
                  v-model="createSessionForm.itemCode"
                  @change="onItemCodeChangedInModal"
                  placeholder="e.g. WSLRW-TH-01"
                  required
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <!-- Row 2: Test Template & Session Code -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block font-bold text-slate-300">Test Template (Optional)</label>
                <select
                  v-model="createSessionForm.templateId"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">-- Auto-detect by Item Code / SKU --</option>
                  <option v-for="t in availableTestTemplatesList" :key="t.id" :value="t.id">
                    {{ t.name }} ({{ t.code }})
                  </option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="block font-bold text-slate-300">Session Code (Optional)</label>
                <input
                  type="text"
                  v-model="createSessionForm.sessionCode"
                  placeholder="Leave blank for auto-generate"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <!-- DevEUIs Input (Multiline / Barcode Gun) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="font-bold text-slate-300">
                  Target DevEUIs (16 Hex characters each) <span class="text-rose-400">*</span>
                </label>
                <span class="text-[11px] font-mono text-cyan-400 font-bold">
                  {{ detectedDevEuiCount }} valid unit(s)
                </span>
              </div>
              <textarea
                v-model="createSessionForm.devEUIsText"
                rows="5"
                placeholder="Paste DevEUIs or scan with barcode gun (one per line or comma-separated)&#10;0011223344556601&#10;0011223344556602&#10;0011223344556603"
                required
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              ></textarea>
              <p class="text-[10px] text-slate-500">Supports whitespace, dashes, colons cleanup automatically.</p>
            </div>

            <!-- Notes & Auto-start Checkbox -->
            <div class="space-y-1">
              <label class="block font-bold text-slate-300">Batch Notes / Lot Number</label>
              <input
                type="text"
                v-model="createSessionForm.notes"
                placeholder="e.g. Batch LOT-2026-A1 exported to Europe"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoStartCheck"
                v-model="createSessionForm.autoStart"
                class="rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
              />
              <label for="autoStartCheck" class="text-xs text-slate-300 font-semibold cursor-pointer">
                Start session immediately upon creation
              </label>
            </div>

            <!-- Footer Actions -->
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                @click="showCreateTestSessionModal = false"
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isCreatingTestSession || detectedDevEuiCount === 0"
                class="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/40 disabled:opacity-50"
              >
                <i v-if="isCreatingTestSession" class="fa-solid fa-spinner animate-spin"></i>
                <span>Create Session</span>
              </button>
            </div>
          </form>
        </div>
      </div>


      <!-- 2. MODAL: PACKET AUDIT LOG & ASSERTION BREAKDOWN -->
      <div v-if="showAuditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
        <div class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-200 max-h-[90vh] flex flex-col">
          <!-- Header -->
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

          <!-- Body with Scroll -->
          <div class="flex-1 overflow-y-auto space-y-4 pr-1">
            <div v-if="loadingDeviceLogs" class="text-center py-10 space-y-2">
              <i class="fa-solid fa-spinner animate-spin text-2xl text-cyan-400"></i>
              <p class="text-xs text-slate-400">Fetching packet audit trail...</p>
            </div>

            <div v-else-if="deviceLogPackets.length === 0" class="text-center py-10 space-y-2 bg-slate-950/50 rounded-xl border border-slate-800">
              <i class="fa-solid fa-inbox text-3xl text-slate-600"></i>
              <p class="text-xs text-slate-400">No uplink packets received yet for this device.</p>
            </div>

            <!-- List of Packets -->
            <div v-else class="space-y-4">
              <div
                v-for="(pkt, pIdx) in deviceLogPackets"
                :key="pkt.id || pIdx"
                class="p-4 bg-slate-950/80 border rounded-xl space-y-3"
                :class="pkt.isPass ? 'border-emerald-500/30' : 'border-rose-500/30'"
              >
                <!-- Packet Meta Header -->
                <div class="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white">Packet #{{ deviceLogPackets.length - pIdx }}</span>
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-400">fPort: <strong class="text-slate-200">{{ pkt.fPort }}</strong></span>
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-400">RSSI: <strong class="text-slate-200">{{ pkt.rssi }} dBm</strong></span>
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-400">SNR: <strong class="text-slate-200">{{ pkt.snr }} dB</strong></span>
                  </div>
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    :class="pkt.isPass ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'"
                  >
                    {{ pkt.isPass ? 'ALL PASSED' : 'ASSERTION FAILED' }}
                  </span>
                </div>

                <!-- Hex & Decoded Split -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div class="space-y-1">
                    <span class="text-[10px] text-slate-400 uppercase font-bold">Raw Hex Payload</span>
                    <div class="p-2 bg-slate-900 rounded-lg font-mono text-[11px] text-cyan-300 break-all border border-slate-800">
                      {{ pkt.payloadHex }}
                    </div>
                  </div>
                  <div class="space-y-1">
                    <span class="text-[10px] text-slate-400 uppercase font-bold">Decoded JSON Attributes</span>
                    <pre class="p-2 bg-slate-900 rounded-lg font-mono text-[10px] text-indigo-300 overflow-x-auto border border-slate-800 max-h-24">{{ JSON.stringify(pkt.decodedData || {}, null, 2) }}</pre>
                  </div>
                </div>

                <!-- Assertion Breakdown Table -->
                <div v-if="pkt.assertionResults && pkt.assertionResults.length > 0" class="space-y-1.5 pt-1">
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Assertion Rules Evaluation:</span>
                  <div class="overflow-x-auto rounded-lg border border-slate-800">
                    <table class="w-full text-left text-[11px]">
                      <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold">
                        <tr>
                          <th class="py-1.5 px-3">Rule / Field</th>
                          <th class="py-1.5 px-3">Operator</th>
                          <th class="py-1.5 px-3">Expected</th>
                          <th class="py-1.5 px-3">Actual</th>
                          <th class="py-1.5 px-3 text-center">Result</th>
                          <th class="py-1.5 px-3">Details</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800 font-mono">
                        <tr v-for="(rule, rIdx) in pkt.assertionResults" :key="rIdx" class="hover:bg-slate-900/60">
                          <td class="py-1.5 px-3 font-bold text-white">{{ rule.fieldName }}</td>
                          <td class="py-1.5 px-3 text-slate-400">{{ rule.operator }}</td>
                          <td class="py-1.5 px-3 text-amber-300">{{ JSON.stringify(rule.expectedValue) }}</td>
                          <td class="py-1.5 px-3 text-cyan-300">{{ JSON.stringify(rule.actualValue) }}</td>
                          <td class="py-1.5 px-3 text-center">
                            <span v-if="rule.pass" class="text-emerald-400 font-bold">
                              <i class="fa-solid fa-check"></i> PASS
                            </span>
                            <span v-else class="text-rose-400 font-bold">
                              <i class="fa-solid fa-xmark"></i> FAIL
                            </span>
                          </td>
                          <td class="py-1.5 px-3 text-[10px] text-slate-400">{{ rule.message || '--' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
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


      <!-- 3. MODAL: SIMULATE PACKET INJECTION -->
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
            <!-- Target DevEUI -->
            <div class="space-y-1">
              <label class="block font-bold text-slate-300">Target DevEUI <span class="text-rose-400">*</span></label>
              <input
                type="text"
                v-model="simulateForm.devEUI"
                placeholder="16 hex characters..."
                required
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <!-- Quick Payload Presets -->
            <div class="space-y-1.5">
              <label class="block font-bold text-slate-300">Quick Sensor Presets:</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  @click="applySimulatePreset('wslrw-th-normal')"
                  class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer border border-slate-700"
                >
                  WSLRW-TH Normal (25.4°C, 3.6V)
                </button>
                <button
                  type="button"
                  @click="applySimulatePreset('wslrw-th-overtemp')"
                  class="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-[11px] font-semibold cursor-pointer border border-rose-500/30"
                >
                  Over-temp (85°C FAIL)
                </button>
                <button
                  type="button"
                  @click="applySimulatePreset('wslrw-th-lowbat')"
                  class="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 text-[11px] font-semibold cursor-pointer border border-amber-500/30"
                >
                  Low Battery (2.2V)
                </button>
              </div>
            </div>

            <!-- Hex Payload -->
            <div class="space-y-1">
              <label class="block font-bold text-slate-300">Payload Hex <span class="text-rose-400">*</span></label>
              <textarea
                v-model="simulateForm.payloadHex"
                rows="2"
                placeholder="e.g. 010100fe0201024003010e10"
                required
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              ></textarea>
            </div>

            <!-- RF Details -->
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

            <!-- Footer Actions -->
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
`;

export const TEST_AUTOMATION_SCRIPT = `
function useTestAutomationModule(ctx) {
  const { showToast, authHeaders, activeFeature, copyText } = ctx;

  const testSessionsList = ref([]);
  const selectedTestSessionId = ref('');
  const activeTestSession = ref(null);
  const loadingTestSessions = ref(false);
  const isStartingTestSession = ref(false);
  const isCreatingTestSession = ref(false);
  const isSimulatingPacket = ref(false);

  const testDeviceStatusFilter = ref('ALL');
  const testDeviceSearchQuery = ref('');
  const testDeviceViewMode = ref('grid');

  // Modals state
  const showCreateTestSessionModal = ref(false);
  const showAuditModal = ref(false);
  const showSimulateModal = ref(false);

  const availableTestTemplatesList = ref([]);
  const activeDeviceRunForAudit = ref(null);
  const deviceLogPackets = ref([]);
  const loadingDeviceLogs = ref(false);

  // Forms
  const createSessionForm = ref({
    soCode: '',
    itemCode: '',
    templateId: '',
    sessionCode: '',
    devEUIsText: '',
    notes: '',
    autoStart: true,
  });

  const simulateForm = ref({
    devEUI: '',
    payloadHex: '010100fe0201024003010e10',
    fPort: 1,
    rssi: -72,
    snr: 9.5,
  });

  const detectedDevEuiCount = computed(() => {
    const raw = createSessionForm.value.devEUIsText || '';
    const lines = raw.split(/[\\r\\n,;]+/).map(s => s.trim().replace(/[^a-fA-F0-9]/g, '')).filter(s => s.length === 16);
    return new Set(lines).size;
  });

  // KPI Summary
  const testSessionSummary = computed(() => {
    if (!activeTestSession.value) {
      return { totalDevices: 0, passedDevices: 0, failedDevices: 0, runningDevices: 0, waitingDevices: 0, progressPercentage: 0, passRatePercentage: 0 };
    }
    const runs = activeTestSession.value.deviceRuns || [];
    const total = runs.length;
    let passed = 0;
    let failed = 0;
    let running = 0;
    let waiting = 0;

    for (const r of runs) {
      if (r.status === 'PASSED') passed++;
      else if (r.status === 'FAILED' || r.status === 'TIMEOUT') failed++;
      else if (r.status === 'RUNNING') running++;
      else waiting++;
    }

    const completed = passed + failed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;

    return {
      totalDevices: total,
      passedDevices: passed,
      failedDevices: failed,
      runningDevices: running,
      waitingDevices: waiting,
      progressPercentage: progress,
      passRatePercentage: passRate,
    };
  });

  // Filtered devices
  const filteredTestDeviceRuns = computed(() => {
    if (!activeTestSession.value || !activeTestSession.value.deviceRuns) return [];
    let list = activeTestSession.value.deviceRuns;

    if (testDeviceStatusFilter.value !== 'ALL') {
      list = list.filter(r => r.status === testDeviceStatusFilter.value);
    }

    if (testDeviceSearchQuery.value && testDeviceSearchQuery.value.trim()) {
      const kw = testDeviceSearchQuery.value.trim().toLowerCase();
      list = list.filter(r => r.devEUI.toLowerCase().includes(kw));
    }

    return list;
  });

  // Badge helpers
  const getSessionStatusBadgeClass = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'ABORTED': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const getDeviceStatusBadgeClass = (status) => {
    switch (status) {
      case 'PASSED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'FAILED': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'RUNNING': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getDeviceCardClass = (status) => {
    switch (status) {
      case 'PASSED': return 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-950/20';
      case 'FAILED': return 'bg-rose-950/20 border-rose-500/40 shadow-rose-950/20';
      case 'RUNNING': return 'bg-amber-950/20 border-amber-500/40 shadow-amber-950/20 animate-pulse-subtle';
      default: return 'bg-slate-900/60 border-slate-800';
    }
  };

  // API operations
  const fetchTestSessions = async (showNotification = false) => {
    loadingTestSessions.value = true;
    try {
      const res = await fetch('/api/d-modules/test-run/sessions?limit=50', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        testSessionsList.value = data.items || [];
        if (showNotification) {
          showToast('Loaded ' + testSessionsList.value.length + ' test sessions', 'info');
        }

        // If no active session, pick the first one
        if (!selectedTestSessionId.value && testSessionsList.value.length > 0) {
          selectedTestSessionId.value = testSessionsList.value[0].id;
          await loadActiveSession(selectedTestSessionId.value);
        } else if (selectedTestSessionId.value) {
          await loadActiveSession(selectedTestSessionId.value);
        }
      }
    } catch (e) {
      console.error('Error fetching test sessions:', e);
    } finally {
      loadingTestSessions.value = false;
    }
  };

  const loadActiveSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/d-modules/test-run/sessions/' + encodeURIComponent(sessionId), {
        headers: authHeaders(),
      });
      if (res.ok) {
        activeTestSession.value = await res.json();
      }
    } catch (e) {
      console.error('Error loading session:', e);
    }
  };

  const onTestSessionSelectChange = async () => {
    if (selectedTestSessionId.value) {
      await loadActiveSession(selectedTestSessionId.value);
    }
  };

  const startActiveTestSession = async () => {
    if (!activeTestSession.value) return;
    isStartingTestSession.value = true;
    try {
      const res = await fetch('/api/d-modules/test-run/sessions/' + encodeURIComponent(activeTestSession.value.id) + '/start', {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        showToast('Test session started successfully', 'success');
        await loadActiveSession(activeTestSession.value.id);
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to start session', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      isStartingTestSession.value = false;
    }
  };

  const abortActiveTestSession = async () => {
    if (!activeTestSession.value) return;
    if (!confirm('Are you sure you want to ABORT this test session?')) return;
    try {
      const res = await fetch('/api/d-modules/test-run/sessions/' + encodeURIComponent(activeTestSession.value.id) + '/abort', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason: 'Operator aborted session' }),
      });
      if (res.ok) {
        showToast('Test session aborted', 'info');
        await loadActiveSession(activeTestSession.value.id);
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  const retryDeviceRun = async (deviceRunId) => {
    try {
      const res = await fetch('/api/d-modules/test-run/devices/' + encodeURIComponent(deviceRunId) + '/retry', {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        showToast('Device reset to RUNNING for retry', 'success');
        if (activeTestSession.value) {
          await loadActiveSession(activeTestSession.value.id);
        }
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  const openAuditModal = async (run) => {
    activeDeviceRunForAudit.value = run;
    deviceLogPackets.value = [];
    showAuditModal.value = true;
    loadingDeviceLogs.value = true;
    try {
      const res = await fetch('/api/d-modules/test-run/devices/' + encodeURIComponent(run.id) + '/logs', {
        headers: authHeaders(),
      });
      if (res.ok) {
        deviceLogPackets.value = await res.json();
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingDeviceLogs.value = false;
    }
  };

  const openCreateTestSessionModal = async () => {
    createSessionForm.value = {
      soCode: '',
      itemCode: '',
      templateId: '',
      sessionCode: '',
      devEUIsText: '',
      notes: '',
      autoStart: true,
    };
    showCreateTestSessionModal.value = true;

    // Load available templates
    try {
      const res = await fetch('/api/c-modules/test-builder/templates', { headers: authHeaders() });
      if (res.ok) {
        availableTestTemplatesList.value = await res.json();
      }
    } catch (e) {}
  };

  const submitCreateTestSession = async () => {
    isCreatingTestSession.value = true;
    try {
      const payload = {
        soCode: createSessionForm.value.soCode.trim(),
        itemCode: createSessionForm.value.itemCode.trim(),
        templateId: createSessionForm.value.templateId || undefined,
        sessionCode: createSessionForm.value.sessionCode.trim() || undefined,
        devEUIs: createSessionForm.value.devEUIsText,
        notes: createSessionForm.value.notes.trim() || undefined,
        autoStart: createSessionForm.value.autoStart,
      };

      const res = await fetch('/api/d-modules/test-run/sessions', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        showToast('Created Test Session ' + created.sessionCode, 'success');
        showCreateTestSessionModal.value = false;
        selectedTestSessionId.value = created.id;
        await fetchTestSessions();
        await loadActiveSession(created.id);
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to create session', 'error');
      }
    } catch (e) {
      showToast('Error creating session: ' + e.message, 'error');
    } finally {
      isCreatingTestSession.value = false;
    }
  };

  const openSimulatePacketModal = (targetDevEUI) => {
    if (targetDevEUI) {
      simulateForm.value.devEUI = targetDevEUI;
    } else if (activeTestSession.value?.deviceRuns?.length > 0) {
      simulateForm.value.devEUI = activeTestSession.value.deviceRuns[0].devEUI;
    }
    showSimulateModal.value = true;
  };

  const applySimulatePreset = (type) => {
    switch (type) {
      case 'wslrw-th-normal':
        // Temp 25.4C (0x00FE), Hum 57.6% (0x0240), Bat 3.6V (0x0E10)
        simulateForm.value.payloadHex = '010100fe0201024003010e10';
        break;
      case 'wslrw-th-overtemp':
        // Temp 85.0C (0x0352) -> likely violates max temp assertion
        simulateForm.value.payloadHex = '010103520201024003010e10';
        break;
      case 'wslrw-th-lowbat':
        // Bat 2.2V (0x0898) -> violates battery >= 2.8V assertion
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
        if (activeTestSession.value) {
          await loadActiveSession(activeTestSession.value.id);
        }
      } else {
        const err = await res.json();
        showToast(err.message || 'Simulation error', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      isSimulatingPacket.value = false;
    }
  };

  const exportTestSessionReport = (format = 'csv') => {
    if (!activeTestSession.value) return;
    const url = '/api/d-modules/test-run/sessions/' + encodeURIComponent(activeTestSession.value.id) + '/export?format=' + format;
    window.open(url, '_blank');
  };

  // Realtime WebSocket packet update handler
  const handleTestRealtimeEvent = (event, data) => {
    if (!activeTestSession.value) return;

    if (data.sessionId === activeTestSession.value.id) {
      if (event === 'test_device:packet_received') {
        const run = activeTestSession.value.deviceRuns?.find(r => r.devEUI === data.devEUI);
        if (run) {
          run.totalPackets = (run.totalPackets || 0) + 1;
        }
      } else if (event === 'test_device:status_changed') {
        const run = activeTestSession.value.deviceRuns?.find(r => r.devEUI === data.devEUI);
        if (run) {
          run.status = data.status;
          if (data.batteryVoltage) run.batteryVoltage = data.batteryVoltage;
          if (data.failureReason) run.failureReason = data.failureReason;
        }
      } else if (event === 'test_session:progress') {
        activeTestSession.value.passedDevices = data.passedDevices;
        activeTestSession.value.failedDevices = data.failedDevices;
        activeTestSession.value.status = data.status;
      }
    }
  };

  return {
    testSessionsList,
    selectedTestSessionId,
    activeTestSession,
    loadingTestSessions,
    isStartingTestSession,
    isCreatingTestSession,
    isSimulatingPacket,
    testDeviceStatusFilter,
    testDeviceSearchQuery,
    testDeviceViewMode,
    showCreateTestSessionModal,
    showAuditModal,
    showSimulateModal,
    availableTestTemplatesList,
    activeDeviceRunForAudit,
    deviceLogPackets,
    loadingDeviceLogs,
    createSessionForm,
    simulateForm,
    detectedDevEuiCount,
    testSessionSummary,
    filteredTestDeviceRuns,
    getSessionStatusBadgeClass,
    getDeviceStatusBadgeClass,
    getDeviceCardClass,
    fetchTestSessions,
    loadActiveSession,
    onTestSessionSelectChange,
    startActiveTestSession,
    abortActiveTestSession,
    retryDeviceRun,
    openAuditModal,
    openCreateTestSessionModal,
    submitCreateTestSession,
    openSimulatePacketModal,
    applySimulatePreset,
    submitSimulatePacket,
    exportTestSessionReport,
    handleTestRealtimeEvent,
  };
}
`;
