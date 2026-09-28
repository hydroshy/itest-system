// ========================================================
// C-MODULE: TRACEABILITY MODULE (T-MODULE)
// Flow 0: 0-Test_Result & Flow 1: 1-Device_Test_Details
// ========================================================

export const TRACEABILITY_TEMPLATE = `
        <!-- TAB: TRACEABILITY (T-MODULE) -->
        <div v-show="activeTab === 'traceability'" class="space-y-6">

          <!-- Header Banner -->
          <div class="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl shadow-inner">
                <i class="fa-solid fa-clipboard-check"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-extrabold text-white">Traceability Module (T-Module)</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">C-MODULE RBAC</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">NODE-RED ENG FLOWS</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">QA Test Result records (Flow 0) and deep telemetry inspection (Flow 1) for LoRaWAN industrial sensors.</p>
              </div>
            </div>

            <!-- Sub-Mode Navigation Tabs -->
            <div class="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button
                @click="traceViewMode = 'catalog'"
                :class="traceViewMode === 'catalog' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border-transparent'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer"
              >
                <i class="fa-solid fa-table-list"></i>
                <span>0-Test Results</span>
              </button>
              <button
                @click="traceViewMode = 'details'"
                :class="traceViewMode === 'details' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm' : 'text-slate-400 hover:text-white border-transparent'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer"
              >
                <i class="fa-solid fa-microchip"></i>
                <span>1-Device Test Details</span>
              </button>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- MODE 0: TEST RESULTS CATALOG (0-Test_Result)              -->
          <!-- ======================================================== -->
          <div v-show="traceViewMode === 'catalog'" class="space-y-5 animate-fade-in">
            <!-- Filter Panel -->
            <div class="glass-card rounded-xl p-4 border border-slate-800/80 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <i class="fa-solid fa-filter text-emerald-400"></i> Query & Multi-Filters (Flow 0)
                </span>
                <div class="flex items-center gap-2">
                  <button
                    @click="resetTraceFilters"
                    class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                  >
                    Clear Filter
                  </button>
                  <button
                    @click="fetchTestResults"
                    :disabled="loadingTestResults"
                    class="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i :class="loadingTestResults ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-magnifying-glass'"></i>
                    Filter Test Result
                  </button>
                  <button
                    @click="seedSampleTraceData"
                    :disabled="isSeedingTraceData"
                    class="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    title="Seed authentic baseline records for WSLRW-ATH and WSLRW-LKS"
                  >
                    <i :class="isSeedingTraceData ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-database'"></i>
                    Seed Baseline Data
                  </button>
                </div>
              </div>

              <!-- Input Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">SO Number</label>
                  <input
                    v-model="traceFilters.so_number"
                    @keyup.enter="fetchTestResults"
                    type="text"
                    placeholder="e.g. SO2603001"
                    class="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Serial Number (SN)</label>
                  <input
                    v-model="traceFilters.serial_number"
                    @keyup.enter="fetchTestResults"
                    type="text"
                    placeholder="e.g. SATH26000254"
                    class="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">SKU</label>
                  <input
                    v-model="traceFilters.sku"
                    @keyup.enter="fetchTestResults"
                    type="text"
                    placeholder="e.g. WSLRW-ATH"
                    class="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Item Code</label>
                  <input
                    v-model="traceFilters.item_code"
                    @keyup.enter="fetchTestResults"
                    type="text"
                    placeholder="e.g. WSLRW-ATH-01"
                    class="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Device Key (DevEUI)</label>
                  <input
                    v-model="traceFilters.device_key"
                    @keyup.enter="fetchTestResults"
                    type="text"
                    placeholder="e.g. 20635F0141000001"
                    class="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Keyword Search</label>
                  <input
                    v-model="traceFilters.search"
                    @keyup.enter="fetchTestResults"
                    type="text"
                    placeholder="Combined search..."
                    class="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <!-- Date Range & Limit Filter Row -->
              <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] uppercase font-bold text-slate-500">From:</span>
                    <input
                      v-model="traceFilters.from_date"
                      type="date"
                      class="px-2 py-1 bg-slate-950/80 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] uppercase font-bold text-slate-500">To:</span>
                    <input
                      v-model="traceFilters.to_date"
                      type="date"
                      class="px-2 py-1 bg-slate-950/80 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] uppercase font-bold text-slate-500">Rows:</span>
                    <select
                      v-model="traceFilters.limit"
                      @change="fetchTestResults"
                      class="px-2 py-1 bg-slate-950/80 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                    >
                      <option :value="25">25</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                      <option :value="200">200</option>
                    </select>
                  </div>
                </div>

                <!-- KPI Metric Pills -->
                <div class="flex items-center gap-2 font-mono text-[11px]">
                  <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Total: <strong class="text-white">{{ testResultsSummary.total }}</strong>
                  </span>
                  <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Pass: <strong>{{ testResultsSummary.pass }}</strong>
                  </span>
                  <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Fail: <strong>{{ testResultsSummary.fail }}</strong>
                  </span>
                  <span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    Pass Rate: <strong>{{ testResultsSummary.passRate }}%</strong>
                  </span>
                </div>
              </div>
            </div>

            <!-- Test Results Table -->
            <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
              <div class="overflow-x-auto custom-scroll">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th class="py-3 px-3 w-10 text-center">#</th>
                      <th class="py-3 px-3 font-mono">Test ID</th>
                      <th class="py-3 px-3 font-mono">Finish Time</th>
                      <th class="py-3 px-3 font-mono">SO Number</th>
                      <th class="py-3 px-3 font-mono">Item Code</th>
                      <th class="py-3 px-3 font-mono">SKU</th>
                      <th class="py-3 px-3 font-mono text-center">FW</th>
                      <th class="py-3 px-3 font-mono">Serial Number</th>
                      <th class="py-3 px-3 font-mono">Device Key</th>
                      <th class="py-3 px-3 text-center">Result</th>
                      <th class="py-3 px-3 text-center">Config</th>
                      <th class="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60 font-sans">
                    <tr v-if="loadingTestResults">
                      <td colspan="12" class="py-8 text-center text-slate-500">
                        <i class="fa-solid fa-circle-notch animate-spin text-emerald-400 mr-2"></i> Loading test results...
                      </td>
                    </tr>
                    <tr v-else-if="testResultsList.length === 0">
                      <td colspan="12" class="py-10 text-center text-slate-500 space-y-2">
                        <div><i class="fa-solid fa-folder-open text-2xl text-slate-600 mb-1"></i></div>
                        <div>No test records found matching filter criteria.</div>
                        <button
                          @click="seedSampleTraceData"
                          class="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition cursor-pointer"
                        >
                          Seed Baseline Records Now
                        </button>
                      </td>
                    </tr>
                    <tr
                      v-for="(item, idx) in testResultsList"
                      :key="item.id || item.test_id"
                      @click="loadDeviceDetails(item.test_id || item.serial_number)"
                      :class="deviceDetails && (deviceDetails.test_id === item.test_id || deviceDetails.serial_number === item.serial_number)
                        ? 'bg-emerald-950/40 border-l-4 border-emerald-500 font-semibold'
                        : 'hover:bg-slate-800/30 cursor-pointer'"
                      class="transition group"
                    >
                      <td class="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">{{ idx + 1 }}</td>
                      <td class="py-3 px-3 font-mono font-bold text-sky-400">
                        <span class="hover:underline cursor-pointer" @click="inspectDeviceTest(item.test_id)">
                          {{ item.test_id }}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-slate-300 whitespace-nowrap text-[11px] font-mono">
                        {{ formatDateTime(item.finish_time || item.time_finish || item.timeFinish || item.test_time) }}
                      </td>
                      <td class="py-3 px-3 font-mono text-amber-300 font-semibold">
                        {{ item.so_number || '—' }}
                      </td>
                      <td class="py-3 px-3 font-mono text-slate-300 text-[11px]">
                        {{ item.item_code || '—' }}
                      </td>
                      <td class="py-3 px-3 font-mono font-bold text-cyan-300">
                        {{ item.sku || '—' }}
                      </td>
                      <td class="py-3 px-3 font-mono text-center text-slate-300">
                        <span class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                          v{{ item.firmware_version || '1.0' }}
                        </span>
                      </td>
                      <td class="py-3 px-3 font-mono font-semibold text-emerald-300">
                        {{ item.serial_number || '—' }}
                      </td>
                      <td class="py-3 px-3 font-mono text-slate-400 text-[11px]">
                        {{ item.device_key || '—' }}
                      </td>
                      <td class="py-3 px-3 text-center">
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider"
                          :class="isTestPassed(item.result) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
                        >
                          {{ item.result || 'UNKNOWN' }}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-center">
                        <button
                          v-if="item.configuration_string"
                          @click="openDecodedConfigModal(item)"
                          class="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold transition cursor-pointer"
                          title="View Decoded Register Map"
                        >
                          <i class="fa-solid fa-code mr-1"></i> Decoded
                        </button>
                        <span v-else class="text-slate-600 text-[10px]">—</span>
                      </td>
                      <td class="py-3 px-3 text-right">
                        <button
                          @click="inspectDeviceTest(item.test_id)"
                          class="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Detail Result</span>
                          <i class="fa-solid fa-arrow-right text-[10px]"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ======================================================== -->
            <!-- LOWER SECTION: TEST QUERY PARAMETERS AS FLOWS DID         -->
            <!-- (PHẦN DƯỚI HIỂN THỊ CÁC THÔNG SỐ TRUY VẤN QUÁ TRÌNH TEST) -->
            <!-- ======================================================== -->
            <div v-if="deviceDetails" class="glass-card rounded-2xl p-5 border border-emerald-500/25 bg-slate-900/90 shadow-2xl space-y-5 animate-fade-in">
              <!-- Summary Header -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg shadow-inner">
                    <i class="fa-solid fa-microchip"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="text-sm font-extrabold text-white uppercase tracking-wider">
                        Device Test Query Parameters & Sensor Telemetry
                      </h3>
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {{ deviceDetails.serial_number || deviceDetails.test_id }}
                      </span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono" :class="isTestPassed(deviceDetails.test_result?.result) ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'">
                        {{ isTestPassed(deviceDetails.test_result?.result) ? 'QA PASS' : 'QA FAIL' }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Detailed sensor metrics, event classifications, Modbus config registers, and raw frames recorded during the test execution flow.
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a
                    :href="'/api/traceability/export-csv?test_id=' + encodeURIComponent(deviceDetails.test_id)"
                    target="_blank"
                    class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
                  >
                    <i class="fa-solid fa-file-csv text-emerald-400"></i>
                    <span>Export CSV</span>
                  </a>
                  <button
                    @click="loadDeviceDetails(deviceDetails.test_id)"
                    :disabled="loadingDeviceDetails"
                    class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer border border-slate-700"
                    title="Reload Telemetry"
                  >
                    <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingDeviceDetails }"></i>
                  </button>
                </div>
              </div>

              <!-- Content identical to details mode -->
              <div class="space-y-5">
                <!-- Device Metadata -->
                <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 font-mono text-xs">
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-500">Serial Number</div>
                    <div class="font-extrabold text-amber-300 mt-0.5">{{ deviceDetails.serial_number }}</div>
                  </div>
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-500">Sales Order (SO)</div>
                    <div class="font-extrabold text-cyan-300 mt-0.5">{{ deviceDetails.so_number || '—' }}</div>
                  </div>
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-500">Item Code / SKU</div>
                    <div class="text-slate-300 mt-0.5 truncate">{{ deviceDetails.item_code || deviceDetails.sku }}</div>
                  </div>
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-500">HW / FW Version</div>
                    <div class="text-slate-300 mt-0.5">{{ deviceDetails.hardware_version || '1.0' }} / v{{ deviceDetails.firmware_version || '1.0' }}</div>
                  </div>
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-500">Duration & Station</div>
                    <div class="text-slate-300 mt-0.5">{{ deviceDetails.test_result?.duration_time || '00:30:00' }} ({{ deviceDetails.test_result?.test_station || 'STATION-01' }})</div>
                  </div>
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-500">Finish Time</div>
                    <div class="text-slate-300 mt-0.5 text-[11px] font-mono">{{ formatDateTime(deviceDetails.finish_time || deviceDetails.time_finish || deviceDetails.test_result?.time_finish || deviceDetails.test_result?.finish_time) }}</div>
                  </div>
                </div>

                <!-- Event Code Distribution -->
                <div v-if="deviceDetails.event_stats" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-tags text-indigo-400"></i>
                      <span>Event Code Distribution (Header P1 Protocol)</span>
                    </span>
                    <span class="text-[10px] font-mono text-slate-500">Total Frames: {{ deviceDetails.telemetry_count }}</span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-xs text-center">
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span class="text-[10px] text-slate-500 block uppercase font-sans">Startup [0]</span>
                      <strong class="text-sky-300 text-sm">{{ deviceDetails.event_stats?.event_s || 0 }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span class="text-[10px] text-slate-500 block uppercase font-sans">Periodic [1]</span>
                      <strong class="text-emerald-400 text-sm">{{ deviceDetails.event_stats?.event_p || 0 }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span class="text-[10px] text-slate-500 block uppercase font-sans">Function [2]</span>
                      <strong class="text-amber-300 text-sm">{{ deviceDetails.event_stats?.event_f || 0 }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span class="text-[10px] text-slate-500 block uppercase font-sans">Command [3]</span>
                      <strong class="text-indigo-300 text-sm">{{ deviceDetails.event_stats?.event_c || 0 }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span class="text-[10px] text-slate-500 block uppercase font-sans">Alarm [4]</span>
                      <strong class="text-rose-400 text-sm">{{ deviceDetails.event_stats?.event_a || 0 }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span class="text-[10px] text-slate-500 block uppercase font-sans">Heartbeat [5]</span>
                      <strong class="text-teal-300 text-sm">{{ deviceDetails.event_stats?.event_h || 0 }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span class="text-[10px] text-slate-500 block uppercase font-sans">Schedule [14]</span>
                      <strong class="text-purple-300 text-sm">{{ deviceDetails.event_stats?.event_sch || 0 }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span class="text-[10px] text-slate-500 block uppercase font-sans">Low Batt [15]</span>
                      <strong class="text-yellow-300 text-sm">{{ deviceDetails.event_stats?.event_lns || 0 }}</strong>
                    </div>
                  </div>
                </div>

                <!-- B1. Raw Data 3 Telemetry Statistics (Separated Field Groups: General Info & Sensor Params 1-4) -->
                <!-- Cột là Field Data, Hàng là MIN, AVG, MAX -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-table-cells text-emerald-400"></i>
                      <span>Raw Data 3 Field Telemetry Statistics (Transposed: Rows = MIN, AVG, MAX)</span>
                    </span>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      5 Parameter Groups
                    </span>
                  </div>

                  <!-- 1. General Information (COM1, COM2, P1..P3) -->
                  <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                    <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <i class="fa-solid fa-bolt text-amber-400"></i> General Information (COM1, COM2, P1..P3)
                      </span>
                      <span class="text-[10px] font-mono text-slate-500">Power & Protocol Headers</span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                          <tr>
                            <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                            <th v-for="col in (deviceDetails.general_info || [])" :key="col.field" class="py-2.5 px-3 text-right">
                              <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                              <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                            </td>
                            <td v-for="col in (deviceDetails.general_info || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                              {{ formatStatNum(col.min) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                            </td>
                            <td v-for="col in (deviceDetails.general_info || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                              {{ formatStatNum(col.avg) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                            </td>
                            <td v-for="col in (deviceDetails.general_info || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                              {{ formatStatNum(col.max) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- 2. Sensor Parameters 1 (P4 .. P11) -->
                  <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                    <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <i class="fa-solid fa-gauge text-cyan-400"></i> Sensor Parameters 1 (P4 .. P11)
                      </span>
                      <span class="text-[10px] font-mono text-cyan-400">Primary Sensors</span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                          <tr>
                            <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                            <th v-for="col in (deviceDetails.params_1 || [])" :key="col.field" class="py-2.5 px-3 text-right">
                              <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                              <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_1 || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                              {{ formatStatNum(col.min) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_1 || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                              {{ formatStatNum(col.avg) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_1 || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                              {{ formatStatNum(col.max) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- 3. Sensor Parameters 2 (P12 .. P19) -->
                  <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                    <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <i class="fa-solid fa-wave-square text-sky-400"></i> Sensor Parameters 2 (P12 .. P19)
                      </span>
                      <span class="text-[10px] font-mono text-sky-400">Secondary Telemetry</span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                          <tr>
                            <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                            <th v-for="col in (deviceDetails.params_2 || [])" :key="col.field" class="py-2.5 px-3 text-right">
                              <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                              <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_2 || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                              {{ formatStatNum(col.min) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_2 || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                              {{ formatStatNum(col.avg) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_2 || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                              {{ formatStatNum(col.max) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- 4. Sensor Parameters 3 (P20 .. P27) -->
                  <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                    <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <i class="fa-solid fa-cubes text-purple-400"></i> Sensor Parameters 3 (P20 .. P27)
                      </span>
                      <span class="text-[10px] font-mono text-purple-400">Auxiliary Channels</span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                          <tr>
                            <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                            <th v-for="col in (deviceDetails.params_3 || [])" :key="col.field" class="py-2.5 px-3 text-right">
                              <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                              <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_3 || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                              {{ formatStatNum(col.min) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_3 || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                              {{ formatStatNum(col.avg) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_3 || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                              {{ formatStatNum(col.max) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- 5. Sensor Parameters 4 (P28 .. P35) -->
                  <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                    <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <i class="fa-solid fa-cubes text-purple-400"></i> Sensor Parameters 4 (P28 .. P35)
                      </span>
                      <span class="text-[10px] font-mono text-purple-400">Auxiliary Channels</span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                          <tr>
                            <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                            <th v-for="col in (deviceDetails.params_4 || [])" :key="col.field" class="py-2.5 px-3 text-right">
                              <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                              <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_4 || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                              {{ formatStatNum(col.min) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_4 || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                              {{ formatStatNum(col.avg) }}
                            </td>
                          </tr>
                          <tr class="hover:bg-slate-800/20">
                            <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                              <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                            </td>
                            <td v-for="col in (deviceDetails.params_4 || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                              {{ formatStatNum(col.max) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Enhanced Focused Telemetry Trend Visualizer (High-Resolution Oscilloscope) -->
                <div
                  id="focused-oscilloscope-visualizer-cp"
                  class="glass-card rounded-2xl border border-sky-500/20 p-4 space-y-3.5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/20 shadow-xl"
                >
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm shadow-inner">
                        <i class="fa-solid fa-wave-square"></i>
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-extrabold uppercase tracking-wider text-white">Oscilloscope Telemetry Waveform Visualizer</span>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            {{ selectedTrendField.toUpperCase() }}
                          </span>
                        </div>
                        <p class="text-[11px] text-slate-400 mt-0.5">
                          High-resolution vector trend with ±15% cushioned boundary scaling, real-time mouse scrubbing crosshair, and packet telemetry inspection.
                        </p>
                      </div>
                    </div>

                    <!-- Channel Field Selection Pills / Dropdown -->
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-[10px] uppercase font-bold text-slate-400 font-mono">Spotlight Channel:</span>
                      <select
                        v-model="selectedTrendField"
                        class="px-2.5 py-1 bg-slate-950/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 font-mono cursor-pointer"
                      >
                        <option v-for="f in availableTrendFields" :key="f.key" :value="f.key">
                          {{ f.key.toUpperCase() }} — {{ f.label }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Quick Channel Chips (Most Common Channels) -->
                  <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono custom-scroll">
                    <span class="text-slate-500 text-[9px] uppercase tracking-wider font-sans font-bold shrink-0">Quick Channels:</span>
                    <button
                      v-for="f in (availableTrendFields || []).slice(0, 10)"
                      :key="'chip-cp-' + f.key"
                      type="button"
                      @click="selectedTrendField = f.key"
                      :class="selectedTrendField === f.key ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'"
                      class="px-2 py-0.5 rounded border transition cursor-pointer shrink-0"
                    >
                      {{ f.key.toUpperCase() }}
                    </button>
                  </div>

                  <!-- Focused Chart Interactive Toolbar: Zoom, Display Toggles, and Inspection Actions -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[10px] font-mono">
                    <!-- Left: Zoom Window Controls -->
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-slate-500 font-sans font-bold uppercase text-[9px]">Timeline Window:</span>
                      <div class="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                        <button
                          type="button"
                          @click="setFocusedChartZoom('all')"
                          :class="focusedChartZoom === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                          class="px-2 py-0.5 rounded transition cursor-pointer"
                          title="Show all recorded packets"
                        >
                          All ({{ selectedTrendChartData?.totalPackets || selectedTrendChartData?.count || 0 }})
                        </button>
                        <button
                          v-if="(selectedTrendChartData?.totalPackets || selectedTrendChartData?.count || 0) > 50"
                          type="button"
                          @click="setFocusedChartZoom(50)"
                          :class="focusedChartZoom === 50 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                          class="px-2 py-0.5 rounded transition cursor-pointer"
                          title="Zoom into last 50 packets"
                        >
                          50 pkts
                        </button>
                        <button
                          v-if="(selectedTrendChartData?.totalPackets || selectedTrendChartData?.count || 0) > 25"
                          type="button"
                          @click="setFocusedChartZoom(25)"
                          :class="focusedChartZoom === 25 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                          class="px-2 py-0.5 rounded transition cursor-pointer"
                          title="Zoom into last 25 packets"
                        >
                          25 pkts
                        </button>
                        <button
                          v-if="(selectedTrendChartData?.totalPackets || selectedTrendChartData?.count || 0) > 10"
                          type="button"
                          @click="setFocusedChartZoom(10)"
                          :class="focusedChartZoom === 10 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                          class="px-2 py-0.5 rounded transition cursor-pointer"
                          title="Zoom into last 10 packets"
                        >
                          10 pkts
                        </button>
                      </div>
                      <!-- Step Zoom buttons -->
                      <div class="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                        <button
                          type="button"
                          @click="focusedZoomStep(1)"
                          class="px-1.5 py-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Zoom In"
                        >
                          <i class="fa-solid fa-plus text-[9px]"></i>
                        </button>
                        <button
                          type="button"
                          @click="focusedZoomStep(-1)"
                          class="px-1.5 py-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Zoom Out"
                        >
                          <i class="fa-solid fa-minus text-[9px]"></i>
                        </button>
                        <button
                          type="button"
                          @click="setFocusedChartZoom('all')"
                          class="px-1.5 py-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Reset Zoom"
                        >
                          <i class="fa-solid fa-rotate-left text-[9px]"></i>
                        </button>
                      </div>
                    </div>

                    <!-- Right: Feature Toggles & Actions -->
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        @click="focusedShowArea = !focusedShowArea"
                        :class="focusedShowArea ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'"
                        class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
                        title="Toggle Area Gradient"
                      >
                        <i class="fa-solid fa-chart-area text-[9px]"></i>
                        <span>Area</span>
                      </button>
                      <button
                        type="button"
                        @click="focusedShowAvg = !focusedShowAvg"
                        :class="focusedShowAvg ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'"
                        class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
                        title="Toggle Mean Reference Line"
                      >
                        <i class="fa-solid fa-arrows-split-up-and-left text-[9px]"></i>
                        <span>Avg</span>
                      </button>
                      <button
                        type="button"
                        @click="focusedShowDots = !focusedShowDots"
                        :class="focusedShowDots ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'"
                        class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
                        title="Toggle Data Points"
                      >
                        <i class="fa-solid fa-circle-dot text-[9px]"></i>
                        <span>Dots</span>
                      </button>
                      <button
                        type="button"
                        @click="focusedShowGrid = !focusedShowGrid"
                        :class="focusedShowGrid ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'"
                        class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
                        title="Toggle Oscilloscope Grid"
                      >
                        <i class="fa-solid fa-border-all text-[9px]"></i>
                        <span>Grid</span>
                      </button>
                      <button
                        type="button"
                        @click="openFieldInspectModal(selectedTrendChartData?.fieldObj || selectedTrendChartData)"
                        class="px-2.5 py-0.5 rounded border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 font-bold transition cursor-pointer flex items-center gap-1"
                        title="Open Fullscreen Waveform Inspector & Data Table"
                      >
                        <i class="fa-solid fa-expand text-[9px]"></i>
                        <span>Inspect</span>
                      </button>
                      <button
                        type="button"
                        @click="exportFieldCsv(selectedTrendChartData?.fieldObj || selectedTrendChartData)"
                        class="px-2.5 py-0.5 rounded border border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                        title="Download CSV dataset for this channel"
                      >
                        <i class="fa-solid fa-download text-[9px]"></i>
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>

                  <!-- Interactive Live HUD Readout / KPI Metric Strip -->
                  <div v-if="focusedHoverPoint" class="p-2.5 rounded-lg bg-sky-950 border border-sky-500/40 flex flex-wrap items-center justify-between gap-2 font-mono text-xs animate-in fade-in">
                    <div class="flex items-center gap-2 text-sky-300">
                      <i class="fa-solid fa-crosshairs text-sky-400 text-xs animate-pulse"></i>
                      <span class="font-bold">PACKET #{{ focusedHoverPoint.index }}</span>
                      <span class="text-slate-400">| TIME: <strong class="text-white">{{ focusedHoverPoint.timeStr }}</strong></span>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-slate-300">MEASURED VALUE: <strong class="text-white text-sm font-black">{{ focusedHoverPoint.valFormatted }}</strong></span>
                      <span :class="focusedHoverPoint.isAboveAvg ? 'text-emerald-400' : 'text-amber-400'" class="font-bold">
                        {{ focusedHoverPoint.deltaFormatted }} vs Avg ({{ focusedHoverPoint.pctFormatted }})
                      </span>
                    </div>
                  </div>
                  <div v-else-if="selectedTrendChartData" class="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                    <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <span class="text-slate-500 text-[10px] uppercase font-sans">Min Value</span>
                      <strong class="text-cyan-300 font-bold">{{ formatStatNum(selectedTrendChartData.rawMin) }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <span class="text-slate-500 text-[10px] uppercase font-sans">Avg Value</span>
                      <strong class="text-emerald-400 font-bold">{{ formatStatNum(selectedTrendChartData.rawAvg) }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <span class="text-slate-500 text-[10px] uppercase font-sans">Max Value</span>
                      <strong class="text-amber-300 font-bold">{{ formatStatNum(selectedTrendChartData.rawMax) }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <span class="text-slate-500 text-[10px] uppercase font-sans">Latest</span>
                      <strong class="text-white font-bold">{{ formatStatNum(selectedTrendChartData.latestVal) }}</strong>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
                      <span class="text-slate-500 text-[10px] uppercase font-sans">Packets</span>
                      <strong class="text-sky-300 font-bold">
                        <span v-if="selectedTrendChartData.isZoomed" class="text-amber-400">Zoomed: </span>
                        {{ selectedTrendChartData.count }} / {{ selectedTrendChartData.totalPackets || selectedTrendChartData.count }}
                      </strong>
                    </div>
                  </div>

                  <!-- SVG Trend Chart with Grid System, Y-Axis interval ticks, and Mouse Scrubbing -->
                  <div
                    class="w-full bg-slate-950/90 rounded-xl border border-slate-800 p-3 relative overflow-hidden cursor-crosshair select-none"
                    @mousemove="onFocusedChartMouseMove($event)"
                    @mouseleave="onFocusedChartMouseLeave()"
                  >
                    <div v-if="selectedTrendChartData && selectedTrendChartData.count > 0" class="w-full">
                      <svg class="w-full h-64 overflow-visible" viewBox="0 0 820 240" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="trendAreaGradCP" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" :stop-color="selectedTrendChartData.colors?.stroke || '#0ea5e9'" stop-opacity="0.30" />
                            <stop offset="100%" :stop-color="selectedTrendChartData.colors?.stroke || '#0ea5e9'" stop-opacity="0.02" />
                          </linearGradient>
                          <pattern id="focused-grid-pattern-cp" width="73" height="37" patternUnits="userSpaceOnUse">
                            <path d="M 73 0 L 0 0 0 37" fill="none" stroke="rgba(148, 163, 184, 0.08)" stroke-width="0.8" stroke-dasharray="2,2" />
                          </pattern>
                        </defs>

                        <!-- Grid Area Background -->
                        <rect x="70" y="20" width="730" height="185" fill="#080e1a" rx="4" stroke="#1e293b" stroke-width="1" />
                        <rect v-if="focusedShowGrid" x="70" y="20" width="730" height="185" fill="url(#focused-grid-pattern-cp)" rx="4" />

                        <!-- Horizontal Dashed Grid Lines & Y-Axis Value Labels -->
                        <g v-for="tick in selectedTrendChartData.yTicks" :key="'ytick-cp-' + tick.ratio">
                          <line
                            v-if="focusedShowGrid"
                            x1="70"
                            :y1="tick.y"
                            x2="800"
                            :y2="tick.y"
                            stroke="rgba(148, 163, 184, 0.15)"
                            stroke-width="1"
                            stroke-dasharray="4,4"
                          />
                          <line
                            x1="65"
                            :y1="tick.y"
                            x2="70"
                            :y2="tick.y"
                            stroke="#475569"
                            stroke-width="1.5"
                          />
                          <text
                            x="60"
                            :y="tick.y + 3.5"
                            text-anchor="end"
                            fill="#94a3b8"
                            font-size="10"
                            font-family="monospace"
                            font-weight="600"
                          >
                            {{ tick.valFormatted }}
                          </text>
                        </g>

                        <!-- Vertical Dashed Grid Lines & X-Axis Timestamp Labels -->
                        <g v-for="(xtick, xIdx) in selectedTrendChartData.xTicks" :key="'xtick-cp-' + xIdx">
                          <line
                            v-if="focusedShowGrid"
                            :x1="xtick.x"
                            y1="20"
                            :x2="xtick.x"
                            y2="205"
                            stroke="rgba(148, 163, 184, 0.15)"
                            stroke-width="1"
                            stroke-dasharray="3,3"
                          />
                          <line
                            :x1="xtick.x"
                            y1="205"
                            :x2="xtick.x"
                            y2="210"
                            stroke="#475569"
                            stroke-width="1"
                          />
                          <text
                            :x="xtick.x"
                            y="223"
                            text-anchor="middle"
                            fill="#64748b"
                            font-size="9"
                            font-family="monospace"
                          >
                            {{ xtick.label }}
                          </text>
                        </g>

                        <!-- Average Reference Dashed Line -->
                        <g v-if="focusedShowAvg">
                          <line
                            x1="70"
                            :y1="selectedTrendChartData.avgY"
                            x2="800"
                            :y2="selectedTrendChartData.avgY"
                            stroke="#f59e0b"
                            stroke-width="1.5"
                            stroke-dasharray="6,3"
                            stroke-opacity="0.85"
                          />
                          <text
                            x="795"
                            :y="selectedTrendChartData.avgY - 4"
                            text-anchor="end"
                            fill="#f59e0b"
                            font-size="9"
                            font-family="monospace"
                            font-weight="bold"
                          >
                            AVG: {{ formatStatNum(selectedTrendChartData.rawAvg) }}
                          </text>
                        </g>

                        <!-- Shaded Polygon Area Under Curve -->
                        <polygon
                          v-if="focusedShowArea"
                          :points="selectedTrendChartData.areaPolygonStr"
                          fill="url(#trendAreaGradCP)"
                        />

                        <!-- Vector Curve Polyline -->
                        <polyline
                          fill="none"
                          :stroke="selectedTrendChartData.colors?.stroke || '#0ea5e9'"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          :points="selectedTrendChartData.polylineStr"
                        />

                        <!-- Data Points (Circles) -->
                        <g v-if="focusedShowDots">
                          <circle
                            v-for="p in selectedTrendChartData.renderedPoints"
                            :key="'pt-cp-' + p.index"
                            :cx="p.x"
                            :cy="p.y"
                            :r="focusedHoverPoint?.index === p.index ? 6 : 3"
                            :fill="selectedTrendChartData.colors?.stroke || '#0ea5e9'"
                            stroke="#0f172a"
                            stroke-width="1.5"
                            class="transition-all"
                          />
                        </g>

                        <!-- Interactive Crosshair Lines & Snapped Point Indicator -->
                        <g v-if="focusedHoverPoint">
                          <line
                            :x1="focusedHoverPoint.x"
                            y1="20"
                            :x2="focusedHoverPoint.x"
                            y2="205"
                            stroke="#38bdf8"
                            stroke-width="1.5"
                            stroke-dasharray="3,3"
                          />
                          <line
                            x1="70"
                            :y1="focusedHoverPoint.y"
                            x2="800"
                            :y2="focusedHoverPoint.y"
                            stroke="rgba(56, 189, 248, 0.45)"
                            stroke-width="1.2"
                            stroke-dasharray="3,3"
                          />
                          <circle
                            :cx="focusedHoverPoint.x"
                            :cy="focusedHoverPoint.y"
                            r="8"
                            fill="none"
                            stroke="#38bdf8"
                            stroke-width="2"
                            class="animate-ping"
                          />
                          <circle
                            :cx="focusedHoverPoint.x"
                            :cy="focusedHoverPoint.y"
                            r="5.5"
                            fill="#38bdf8"
                            stroke="#ffffff"
                            stroke-width="2"
                          />
                        </g>
                      </svg>

                      <!-- Chart Legend & Boundary Note -->
                      <div class="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 pt-2 px-1 border-t border-slate-800/80 mt-1">
                        <div class="flex items-center gap-4 flex-wrap">
                          <span class="flex items-center gap-1.5">
                            <span class="w-3 h-0.5 rounded" :style="{ backgroundColor: selectedTrendChartData.colors?.stroke || '#0ea5e9' }"></span>
                            <strong class="text-white">{{ selectedTrendField.toUpperCase() }} Trend</strong>
                          </span>
                          <span class="flex items-center gap-1.5">
                            <span class="w-3 h-0.5 bg-amber-500 border-dashed"></span>
                            <span class="text-amber-400">Mean Level</span>
                          </span>
                          <span class="text-slate-500">
                            (Y-Axis cushioned ±15% at bounds)
                          </span>
                        </div>
                        <div class="text-slate-400">
                          Range: <span class="text-cyan-300 font-bold">{{ formatStatNum(selectedTrendChartData.rawMin) }}</span> → <span class="text-amber-300 font-bold">{{ formatStatNum(selectedTrendChartData.rawMax) }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-else class="py-16 text-center text-slate-500 text-xs">
                      <i class="fa-solid fa-chart-line text-2xl text-slate-600 mb-2 block"></i>
                      No telemetry data points available for {{ selectedTrendField.toUpperCase() }}.
                    </div>
                  </div>
                </div>

                <!-- B2. Trend Graphs for Each Field Data in raw_data3 with Interactive Controls -->
                <div v-if="rawDataFieldList && rawDataFieldList.length > 0" class="space-y-3">
                  <!-- Header & Interactive Filtering / Global Controls Toolbar -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <i class="fa-solid fa-chart-line text-sky-400"></i>
                          <span>Field Data Channels & Interactive Waveforms</span>
                        </span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          {{ filteredRawDataFieldList.length }} / {{ rawDataFieldList.length }} Active
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-400 mt-0.5">
                        Interactive cards for individual telemetry channels. Click buttons on each card to zoom, inspect waveform, or focus.
                      </p>
                    </div>

                    <!-- Category Pills -->
                    <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                      <button
                        type="button"
                        @click="trendCategoryFilter = 'all'"
                        :class="trendCategoryFilter === 'all' ? 'bg-sky-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'"
                        class="px-2.5 py-0.5 rounded-lg transition cursor-pointer"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        @click="trendCategoryFilter = 'sensors'"
                        :class="trendCategoryFilter === 'sensors' ? 'bg-sky-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'"
                        class="px-2.5 py-0.5 rounded-lg transition cursor-pointer"
                      >
                        Sensors (P)
                      </button>
                      <button
                        type="button"
                        @click="trendCategoryFilter = 'com'"
                        :class="trendCategoryFilter === 'com' ? 'bg-sky-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'"
                        class="px-2.5 py-0.5 rounded-lg transition cursor-pointer"
                      >
                        COM
                      </button>
                      <button
                        type="button"
                        @click="trendCategoryFilter = 'active'"
                        :class="trendCategoryFilter === 'active' ? 'bg-sky-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'"
                        class="px-2.5 py-0.5 rounded-lg transition cursor-pointer"
                      >
                        Active Only
                      </button>
                    </div>
                  </div>

                  <!-- Global Channel Search & Global Display Buttons Bar -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono">
                    <!-- Search Input -->
                    <div class="relative flex-1 max-w-sm">
                      <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-500"></i>
                      <input
                        v-model="trendChannelSearch"
                        type="text"
                        placeholder="Search channel (e.g. p4, com1, battery, temp)..."
                        class="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
                      />
                      <button
                        v-if="trendChannelSearch"
                        type="button"
                        @click="trendChannelSearch = ''"
                        class="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    <!-- Global Card Zoom & Feature Toggles -->
                    <div class="flex items-center gap-2 flex-wrap">
                      <div class="flex items-center gap-1">
                        <span class="text-slate-500 text-[10px] uppercase font-sans font-bold">All Cards Zoom:</span>
                        <div class="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                          <button
                            type="button"
                            @click="setGlobalCardZoom('all')"
                            :class="globalCardZoom === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                            class="px-2 py-0.5 rounded text-[10px] transition cursor-pointer"
                            title="Show all recorded packets on all cards"
                          >
                            All Pkts
                          </button>
                          <button
                            type="button"
                            @click="setGlobalCardZoom(25)"
                            :class="globalCardZoom === 25 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                            class="px-2 py-0.5 rounded text-[10px] transition cursor-pointer"
                            title="Zoom all cards to last 25 packets"
                          >
                            Last 25
                          </button>
                          <button
                            type="button"
                            @click="setGlobalCardZoom(10)"
                            :class="globalCardZoom === 10 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                            class="px-2 py-0.5 rounded text-[10px] transition cursor-pointer"
                            title="Zoom all cards to last 10 packets"
                          >
                            Last 10
                          </button>
                        </div>
                      </div>

                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          @click="toggleGlobalCardArea"
                          class="px-2 py-0.5 rounded border text-[10px] transition cursor-pointer"
                          :class="globalCardArea ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
                          title="Toggle Area fill on all cards"
                        >
                          Area
                        </button>
                        <button
                          type="button"
                          @click="toggleGlobalCardAvg"
                          class="px-2 py-0.5 rounded border text-[10px] transition cursor-pointer"
                          :class="globalCardAvg ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
                          title="Toggle Average line on all cards"
                        >
                          Avg
                        </button>
                        <button
                          type="button"
                          @click="toggleGlobalCardDots"
                          class="px-2 py-0.5 rounded border text-[10px] transition cursor-pointer"
                          :class="globalCardDots ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
                          title="Toggle Dots on all cards"
                        >
                          Dots
                        </button>
                        <button
                          type="button"
                          @click="toggleGlobalCardGrid"
                          class="px-2 py-0.5 rounded border text-[10px] transition cursor-pointer"
                          :class="globalCardGrid ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
                          title="Toggle Grid on all cards"
                        >
                          Grid
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Cards Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    <div
                      v-for="field in filteredRawDataFieldList"
                      :key="field.key"
                      class="p-3.5 rounded-xl bg-slate-950/80 border space-y-2.5 transition flex flex-col justify-between"
                      :class="selectedTrendField === field.key ? 'border-sky-500/60 ring-1 ring-sky-500/30 shadow-lg shadow-sky-950/30' : 'border-slate-800 hover:border-slate-700'"
                    >
                      <!-- Header of Field Trend Card with Interactive Action Buttons -->
                      <div class="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div class="min-w-0">
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-black border" :class="field.colors.badge">
                              {{ field.key.toUpperCase() }}
                            </span>
                            <span class="text-xs font-bold text-slate-200 truncate" :title="field.label">
                              {{ field.label }}
                            </span>
                          </div>
                        </div>

                        <!-- Interactive Buttons on Card Header -->
                        <div class="flex items-center gap-1 shrink-0">
                          <!-- Focus in Top Chart Button -->
                          <button
                            type="button"
                            @click.stop="focusChannel(field.key)"
                            class="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                            :class="selectedTrendField === field.key ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-900 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30'"
                            title="Focus this channel in the main Oscilloscope"
                          >
                            <i class="fa-solid fa-crosshairs text-[9px]"></i>
                            <span class="hidden sm:inline">Focus</span>
                          </button>
                          <!-- Inspect Fullscreen Modal Button -->
                          <button
                            type="button"
                            @click.stop="openFieldInspectModal(field)"
                            class="p-1 rounded text-[10px] font-mono bg-slate-900 text-purple-300 hover:text-white hover:bg-purple-900/50 border border-purple-500/30 transition cursor-pointer"
                            title="Inspect Waveform & Data Table in Fullscreen Modal"
                          >
                            <i class="fa-solid fa-expand text-[10px]"></i>
                          </button>
                          <!-- Export CSV Button -->
                          <button
                            type="button"
                            @click.stop="exportFieldCsv(field)"
                            class="p-1 rounded text-[10px] font-mono bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
                            title="Export CSV for this channel"
                          >
                            <i class="fa-solid fa-download text-[10px]"></i>
                          </button>
                        </div>
                      </div>

                      <!-- Interactive Toolbar on Card: Zoom Window & Feature Toggles -->
                      <div class="flex items-center justify-between gap-1 text-[9px] font-mono py-1 px-1.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex-wrap">
                        <!-- Zoom Window Selector Buttons -->
                        <div class="flex items-center gap-1">
                          <span class="text-slate-500 text-[8px] uppercase tracking-wider font-sans font-bold">Zoom:</span>
                          <div class="inline-flex rounded bg-slate-950 p-0.5 border border-slate-800">
                            <button
                              type="button"
                              @click.stop="setCardZoom(field.key, 'all')"
                              class="px-1.5 py-0.5 rounded text-[8px] font-bold transition cursor-pointer"
                              :class="field.activeZoom === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'"
                              title="Show all recorded packets"
                            >
                              All ({{ field.totalCount }})
                            </button>
                            <button
                              v-if="field.totalCount > 25"
                              type="button"
                              @click.stop="setCardZoom(field.key, 25)"
                              class="px-1.5 py-0.5 rounded text-[8px] font-bold transition cursor-pointer"
                              :class="field.activeZoom === 25 ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'"
                              title="Zoom into last 25 packets"
                            >
                              25
                            </button>
                            <button
                              v-if="field.totalCount > 10"
                              type="button"
                              @click.stop="setCardZoom(field.key, 10)"
                              class="px-1.5 py-0.5 rounded text-[8px] font-bold transition cursor-pointer"
                              :class="field.activeZoom === 10 ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'"
                              title="Zoom into last 10 packets"
                            >
                              10
                            </button>
                          </div>
                        </div>

                        <!-- Display Feature Toggle Buttons -->
                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            @click.stop="toggleCardSetting(field.key, 'showArea')"
                            class="px-1.5 py-0.5 rounded border text-[8px] font-bold transition cursor-pointer flex items-center gap-0.5"
                            :class="field.showArea ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'"
                            title="Toggle Area Gradient"
                          >
                            <i class="fa-solid fa-chart-area"></i>
                            <span>Area</span>
                          </button>
                          <button
                            type="button"
                            @click.stop="toggleCardSetting(field.key, 'showAvg')"
                            class="px-1.5 py-0.5 rounded border text-[8px] font-bold transition cursor-pointer flex items-center gap-0.5"
                            :class="field.showAvg ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'"
                            title="Toggle Average Guide Line"
                          >
                            <i class="fa-solid fa-arrows-split-up-and-left"></i>
                            <span>Avg</span>
                          </button>
                          <button
                            type="button"
                            @click.stop="toggleCardSetting(field.key, 'showDots')"
                            class="px-1.5 py-0.5 rounded border text-[8px] font-bold transition cursor-pointer flex items-center gap-0.5"
                            :class="field.showDots ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'"
                            title="Toggle Data Points"
                          >
                            <i class="fa-solid fa-circle-dot"></i>
                            <span>Dots</span>
                          </button>
                          <button
                            type="button"
                            @click.stop="toggleCardSetting(field.key, 'showGrid')"
                            class="px-1.5 py-0.5 rounded border text-[8px] font-bold transition cursor-pointer flex items-center gap-0.5"
                            :class="field.showGrid ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'"
                            title="Toggle Oscilloscope Grid"
                          >
                            <i class="fa-solid fa-border-all"></i>
                            <span>Grid</span>
                          </button>
                        </div>
                      </div>

                      <!-- Interactive HUD Strip / Mini Stats Row -->
                      <!-- If user is hovering over the card's SVG, show real-time dynamic readout -->
                      <div v-if="cardHoverMap[field.key]" class="flex items-center justify-between px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/40 text-[10px] font-mono animate-in fade-in">
                        <div class="flex items-center gap-1.5 text-sky-300 truncate">
                          <i class="fa-solid fa-crosshairs text-sky-400 text-[9px] animate-pulse"></i>
                          <span class="font-bold">#{{ cardHoverMap[field.key].index }}</span>
                          <span class="text-slate-400 font-sans text-[9px]">({{ cardHoverMap[field.key].timeStr }})</span>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <strong class="text-white text-xs font-black">{{ formatStatNum(cardHoverMap[field.key].val) }}</strong>
                          <span :class="cardHoverMap[field.key].isAboveAvg ? 'text-emerald-400' : 'text-amber-400'" class="text-[9px] font-bold">
                            {{ cardHoverMap[field.key].deltaFormatted }} vs Avg
                          </span>
                        </div>
                      </div>

                      <!-- Standard Min / Avg / Max / Latest row when not hovering -->
                      <div v-else class="grid grid-cols-4 gap-1 text-center font-mono text-[10px] py-1 bg-slate-900/60 rounded-lg border border-slate-800/60">
                        <div>
                          <span class="text-slate-500 block text-[8px] uppercase">Min</span>
                          <span class="text-cyan-300 font-bold">{{ formatStatNum(field.min) }}</span>
                        </div>
                        <div>
                          <span class="text-slate-500 block text-[8px] uppercase">Avg</span>
                          <span class="text-emerald-400 font-extrabold">{{ formatStatNum(field.avg) }}</span>
                        </div>
                        <div>
                          <span class="text-slate-500 block text-[8px] uppercase">Max</span>
                          <span class="text-amber-300 font-bold">{{ formatStatNum(field.max) }}</span>
                        </div>
                        <div>
                          <span class="text-slate-500 block text-[8px] uppercase">Latest</span>
                          <span class="text-white font-black">{{ formatStatNum(field.latest) }}</span>
                        </div>
                      </div>

                      <!-- Trend Graph (SVG) with Oscilloscope/Engineering Grid and Mouse Tracking -->
                      <div
                        class="w-full bg-slate-900/80 rounded-lg p-1.5 border border-slate-800 relative chart-grid-container cursor-crosshair select-none"
                        @mousemove="onCardChartMouseMove($event, field)"
                        @mouseleave="onCardChartMouseLeave(field.key)"
                      >
                        <!-- Y-axis guide labels on chart -->
                        <div class="absolute right-2 top-1 text-[8px] font-mono text-slate-500 pointer-events-none">Max: {{ formatStatNum(field.max) }}</div>
                        <div class="absolute right-2 bottom-6 text-[8px] font-mono text-slate-500 pointer-events-none">Min: {{ formatStatNum(field.min) }}</div>

                        <svg class="w-full h-24 overflow-visible" viewBox="0 0 320 88" preserveAspectRatio="none">
                          <defs>
                            <linearGradient :id="'grad-cp-' + field.key" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" :stop-color="field.colors.stroke" stop-opacity="0.28" />
                              <stop offset="100%" :stop-color="field.colors.stroke" stop-opacity="0.01" />
                            </linearGradient>
                            <!-- Grid Pattern Definition -->
                            <pattern :id="'trace-grid-cp-' + field.key" width="73" height="17.5" patternUnits="userSpaceOnUse">
                              <path d="M 73 0 L 0 0 0 17.5" fill="none" stroke="rgba(148, 163, 184, 0.12)" stroke-width="0.8" stroke-dasharray="2,2" />
                            </pattern>
                          </defs>

                          <!-- Background Grid Pattern -->
                          <rect v-if="field.showGrid" x="14" y="8" width="292" height="70" :fill="'url(#trace-grid-cp-' + field.key + ')'" />

                          <!-- Outer Grid Frame -->
                          <rect x="14" y="8" width="292" height="70" fill="none" stroke="rgba(148, 163, 184, 0.22)" stroke-width="1" rx="2" />

                          <!-- Horizontal Grid Reference Lines (25%, 50%, 75%) -->
                          <g v-if="field.showGrid">
                            <line x1="14" y1="25.5" x2="306" y2="25.5" stroke="rgba(148, 163, 184, 0.15)" stroke-width="0.8" stroke-dasharray="3,3" />
                            <line x1="14" y1="43" x2="306" y2="43" stroke="rgba(148, 163, 184, 0.18)" stroke-width="0.8" stroke-dasharray="3,3" />
                            <line x1="14" y1="60.5" x2="306" y2="60.5" stroke="rgba(148, 163, 184, 0.15)" stroke-width="0.8" stroke-dasharray="3,3" />
                          </g>

                          <!-- Vertical Grid Timeline Ticks -->
                          <g v-if="field.showGrid">
                            <line x1="87" y1="8" x2="87" y2="78" stroke="rgba(148, 163, 184, 0.15)" stroke-width="0.8" stroke-dasharray="3,3" />
                            <line x1="160" y1="8" x2="160" y2="78" stroke="rgba(148, 163, 184, 0.18)" stroke-width="0.8" stroke-dasharray="3,3" />
                            <line x1="233" y1="8" x2="233" y2="78" stroke="rgba(148, 163, 184, 0.15)" stroke-width="0.8" stroke-dasharray="3,3" />
                          </g>

                          <!-- Average Reference Dashed Line -->
                          <line
                            v-if="field.showAvg"
                            x1="14"
                            :y1="field.avgY"
                            x2="306"
                            :y2="field.avgY"
                            stroke="rgba(245, 158, 11, 0.75)"
                            stroke-width="1.2"
                            stroke-dasharray="4,3"
                          />

                          <!-- Shaded Area Below Trend Line -->
                          <polygon
                            v-if="field.showArea"
                            :points="field.areaPolygonStr"
                            :fill="'url(#grad-cp-' + field.key + ')'"
                          />

                          <!-- Trend Polyline -->
                          <polyline
                            fill="none"
                            :stroke="field.colors.stroke"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            :points="field.polylineStr"
                          />

                          <!-- Interactive Data Points -->
                          <g v-if="field.showDots">
                            <circle
                              v-for="p in field.renderedPoints"
                              :key="p.index"
                              :cx="p.x"
                              :cy="p.y"
                              :r="cardHoverMap[field.key]?.index === p.index ? 4.5 : 2.5"
                              :fill="field.colors.stroke"
                              stroke="#0f172a"
                              stroke-width="1.5"
                              class="transition-all"
                            />
                          </g>

                          <!-- Interactive Hover Crosshair Lines & Snapped Dot -->
                          <g v-if="cardHoverMap[field.key]">
                            <line
                              :x1="cardHoverMap[field.key].x"
                              y1="8"
                              :x2="cardHoverMap[field.key].x"
                              y2="78"
                              stroke="#38bdf8"
                              stroke-width="1.2"
                              stroke-dasharray="3,2"
                            />
                            <line
                              x1="14"
                              :y1="cardHoverMap[field.key].y"
                              x2="306"
                              :y2="cardHoverMap[field.key].y"
                              stroke="rgba(56, 189, 248, 0.45)"
                              stroke-width="1"
                              stroke-dasharray="2,2"
                            />
                            <circle
                              :cx="cardHoverMap[field.key].x"
                              :cy="cardHoverMap[field.key].y"
                              r="5.5"
                              fill="#38bdf8"
                              stroke="#ffffff"
                              stroke-width="2"
                            />
                          </g>
                        </svg>

                        <!-- X-axis Timeline Labels (Start -> Finish) -->
                        <div class="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-800/80 px-1">
                          <span class="truncate max-w-[120px]" :title="field.startTime"><i class="fa-regular fa-clock text-[8px] mr-0.5"></i>{{ field.startTime }}</span>
                          <span class="text-slate-400 font-bold">
                            <span v-if="field.isZoomed" class="text-sky-400">Zoomed: </span>{{ field.count }} pkts
                          </span>
                          <span class="truncate max-w-[120px] text-right" :title="field.endTime">{{ field.endTime }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Decoded Configuration -->
                <div v-if="(deviceDetails.decoded_config || []).length > 0" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-code text-indigo-400"></i>
                      <span>Decoded Configuration Map (Modbus Memory Map)</span>
                    </span>
                    <span class="text-[10px] font-mono text-indigo-400">{{ (deviceDetails.decoded_config || []).length }} Registers</span>
                  </div>
                  <div class="overflow-x-auto max-h-48">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                        <tr>
                          <th class="py-2 px-3">Register</th>
                          <th class="py-2 px-3">Parameter Name</th>
                          <th class="py-2 px-3">Decoded Value</th>
                          <th class="py-2 px-3">Type</th>
                          <th class="py-2 px-3">Unit</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr v-for="cfg in deviceDetails.decoded_config" :key="cfg.reg" class="hover:bg-slate-900/40">
                          <td class="py-1.5 px-3 font-bold text-cyan-300">{{ cfg.reg }}</td>
                          <td class="py-1.5 px-3 text-slate-200">{{ cfg.name }}</td>
                          <td class="py-1.5 px-3 font-extrabold text-amber-300">{{ cfg.value }}</td>
                          <td class="py-1.5 px-3 text-slate-400 text-[10px]">{{ cfg.type }}</td>
                          <td class="py-1.5 px-3 text-slate-400">{{ cfg.unit || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Raw Telemetry Frames -->
                <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-database text-purple-400"></i>
                      <span>Captured Telemetry Frames (PostgreSQL raw_data3)</span>
                    </span>
                    <span class="text-[10px] font-mono text-purple-300">{{ (deviceDetails.raw_telemetry || []).length }} Frames</span>
                  </div>
                  <div class="overflow-x-auto max-h-56">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                        <tr>
                          <th class="py-2 px-2.5 w-10 text-center">#</th>
                          <th class="py-2 px-2.5">Timestamp</th>
                          <th class="py-2 px-2.5 text-center">SF</th>
                          <th class="py-2 px-2.5 text-center">RSSI (com1)</th>
                          <th class="py-2 px-2.5 text-center">SNR (com2)</th>
                          <th class="py-2 px-2.5 text-center">P1 (Event)</th>
                          <th class="py-2 px-2.5 text-center">P2 (Batt)</th>
                          <th class="py-2 px-2.5">Payload Hex</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr v-for="(f, fIdx) in (deviceDetails.raw_telemetry || [])" :key="fIdx" class="hover:bg-slate-900/40">
                          <td class="py-1.5 px-2.5 text-center text-slate-500">{{ fIdx + 1 }}</td>
                          <td class="py-1.5 px-2.5 text-slate-300">{{ formatDateTime(f.epochtime ? f.epochtime * 1000 : f.timestamp) }}</td>
                          <td class="py-1.5 px-2.5 text-center text-slate-400">{{ f.spreading_factor || 'SF7' }}</td>
                          <td class="py-1.5 px-2.5 text-center text-emerald-400 font-bold">{{ f.com1 ? f.com1 + ' dBm' : '—' }}</td>
                          <td class="py-1.5 px-2.5 text-center text-sky-400">{{ f.com2 ? f.com2 + ' dB' : '—' }}</td>
                          <td class="py-1.5 px-2.5 text-center font-bold text-amber-300">{{ f.p1 !== undefined ? f.p1 : '—' }}</td>
                          <td class="py-1.5 px-2.5 text-center text-slate-300">{{ f.p2 !== undefined ? f.p2 : '—' }}</td>
                          <td class="py-1.5 px-2.5 font-mono text-[10px] text-indigo-300 truncate max-w-xs">{{ f.uplink_payload || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- MODE 1: DEVICE TEST DETAILS (1-Device_Test_Details)       -->
          <!-- ======================================================== -->
          <div v-show="traceViewMode === 'details'" class="space-y-6 animate-fade-in">
            <!-- Details Navigation Bar -->
            <div class="glass-card rounded-xl p-4 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <button
                  @click="traceViewMode = 'catalog'"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <i class="fa-solid fa-arrow-left text-[11px]"></i>
                  <span>Review Result (Back)</span>
                </button>
                <div class="h-5 w-px bg-slate-800 hidden md:block"></div>
                <div class="flex items-center gap-2">
                  <input
                    v-model="activeTestIdInput"
                    @keyup.enter="loadDeviceDetails(activeTestIdInput)"
                    type="text"
                    placeholder="Enter or paste Test ID..."
                    class="w-64 px-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <button
                    @click="loadDeviceDetails(activeTestIdInput)"
                    :disabled="loadingDeviceDetails"
                    class="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                  >
                    <i :class="loadingDeviceDetails ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-magnifying-glass'"></i>
                    <span>Inspect</span>
                  </button>
                </div>
              </div>

              <!-- Quick Export & Refresh Actions -->
              <div class="flex items-center gap-2">
                <a
                  v-if="deviceDetails && deviceDetails.test_id"
                  :href="'/api/traceability/export-csv?test_id=' + encodeURIComponent(deviceDetails.test_id)"
                  target="_blank"
                  class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <i class="fa-solid fa-file-csv"></i>
                  <span>Export CSV</span>
                </a>
                <button
                  @click="loadDeviceDetails(deviceDetails ? deviceDetails.test_id : activeTestIdInput)"
                  :disabled="loadingDeviceDetails"
                  class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                  title="Reload Telemetry"
                >
                  <i :class="loadingDeviceDetails ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-rotate'"></i>
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loadingDeviceDetails" class="glass-card rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <i class="fa-solid fa-circle-notch animate-spin text-3xl text-sky-400"></i>
              <div class="text-sm font-semibold">Loading deep QA telemetry for Test ID {{ activeTestIdInput }}...</div>
            </div>

            <!-- Device Summary Banner (If Loaded) -->
            <div v-else-if="deviceDetails" class="space-y-6">
              <div class="glass-card rounded-xl p-5 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 bg-slate-900/60">
                <div>
                  <div class="text-[10px] uppercase font-bold text-slate-500">Test ID</div>
                  <div class="text-xs font-mono font-bold text-sky-300 mt-0.5 truncate" :title="deviceDetails.test_id">{{ deviceDetails.test_id }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase font-bold text-slate-500">SKU / Model</div>
                  <div class="text-xs font-mono font-bold text-cyan-400 mt-0.5">{{ deviceDetails.sku }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase font-bold text-slate-500">Serial Number</div>
                  <div class="text-xs font-mono font-bold text-emerald-300 mt-0.5">{{ deviceDetails.serial_number }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase font-bold text-slate-500">Sales Order</div>
                  <div class="text-xs font-mono font-bold text-amber-300 mt-0.5">{{ deviceDetails.so_number || '—' }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase font-bold text-slate-500">Firmware</div>
                  <div class="text-xs font-mono text-slate-300 mt-0.5">v{{ deviceDetails.firmware_version || '1.0' }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase font-bold text-slate-500">Finish Time</div>
                  <div class="text-xs font-mono text-slate-300 mt-0.5">{{ formatDateTime(deviceDetails.finish_time || deviceDetails.time_finish || deviceDetails.test_result?.time_finish || deviceDetails.test_result?.finish_time) }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase font-bold text-slate-500">QA Status</div>
                  <div class="mt-0.5">
                    <span
                      class="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider"
                      :class="isTestPassed(deviceDetails.test_result?.result) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'"
                    >
                      {{ deviceDetails.test_result?.result || 'PASSED' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Event Classification Chips (Flow 1: event_s, event_p, event_f, event_c, event_a, event_h, event_sch, event_lns) -->
              <div class="glass-card rounded-xl p-4 border border-slate-800 space-y-2">
                <div class="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <i class="fa-solid fa-tags text-indigo-400"></i> Event Code Distribution (P1 Header)
                  </span>
                  <span class="text-[10px] font-mono text-slate-500">Total Frames: {{ deviceDetails.telemetry_count }}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                  <div class="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center gap-2">
                    <span class="text-slate-400 font-sans text-[10px] uppercase font-bold">Startup [0]:</span>
                    <strong class="text-sky-300">{{ deviceDetails.event_stats?.event_s || 0 }}</strong>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <span class="text-slate-400 font-sans text-[10px] uppercase font-bold">Periodic [1]:</span>
                    <strong class="text-emerald-300">{{ deviceDetails.event_stats?.event_p || 0 }}</strong>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                    <span class="text-slate-400 font-sans text-[10px] uppercase font-bold">Function [2]:</span>
                    <strong class="text-amber-300">{{ deviceDetails.event_stats?.event_f || 0 }}</strong>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                    <span class="text-slate-400 font-sans text-[10px] uppercase font-bold">Command [3]:</span>
                    <strong class="text-indigo-300">{{ deviceDetails.event_stats?.event_c || 0 }}</strong>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                    <span class="text-slate-400 font-sans text-[10px] uppercase font-bold">Alarm [4]:</span>
                    <strong class="text-rose-300">{{ deviceDetails.event_stats?.event_a || 0 }}</strong>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center gap-2">
                    <span class="text-slate-400 font-sans text-[10px] uppercase font-bold">Heartbeat [5]:</span>
                    <strong class="text-teal-300">{{ deviceDetails.event_stats?.event_h || 0 }}</strong>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
                    <span class="text-slate-400 font-sans text-[10px] uppercase font-bold">Schedule [14]:</span>
                    <strong class="text-purple-300">{{ deviceDetails.event_stats?.event_sch || 0 }}</strong>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
                    <span class="text-slate-400 font-sans text-[10px] uppercase font-bold">Low Batt [15]:</span>
                    <strong class="text-yellow-300">{{ deviceDetails.event_stats?.event_lns || 0 }}</strong>
                  </div>
                </div>
              </div>

              <!-- Statistical Tables (Separated Field Groups: General Info & Sensor Params 1-4) -->
              <!-- Cột là Field Data, Hàng là MIN, AVG, MAX -->
              <div class="space-y-4">
                <div class="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-table-cells text-emerald-400"></i>
                    <span>Sensor Telemetry Statistics (Transposed: Rows = MIN, AVG, MAX)</span>
                  </span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    5 Parameter Groups
                  </span>
                </div>

                <!-- 1. General Info (COM1, COM2, P1, P2, P3) -->
                <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                  <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-bolt text-amber-400"></i> General Information (COM1, COM2, P1..P3)
                    </span>
                    <span class="text-[10px] font-mono text-slate-500">Power & Protocol Headers</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                          <th v-for="col in (deviceDetails.general_info || [])" :key="col.field" class="py-2.5 px-3 text-right">
                            <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                            <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                          </td>
                          <td v-for="col in (deviceDetails.general_info || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                            {{ formatStatNum(col.min) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                          </td>
                          <td v-for="col in (deviceDetails.general_info || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                            {{ formatStatNum(col.avg) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                          </td>
                          <td v-for="col in (deviceDetails.general_info || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                            {{ formatStatNum(col.max) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 2. Sensor Parameters 1 (P4 .. P11) -->
                <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                  <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-gauge text-cyan-400"></i> Sensor Parameters 1 (P4 .. P11)
                    </span>
                    <span class="text-[10px] font-mono text-cyan-400">Primary Sensors</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                          <th v-for="col in (deviceDetails.params_1 || [])" :key="col.field" class="py-2.5 px-3 text-right">
                            <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                            <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_1 || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                            {{ formatStatNum(col.min) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_1 || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                            {{ formatStatNum(col.avg) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_1 || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                            {{ formatStatNum(col.max) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 3. Sensor Parameters 2 (P12 .. P19) -->
                <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                  <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-wave-square text-sky-400"></i> Sensor Parameters 2 (P12 .. P19)
                    </span>
                    <span class="text-[10px] font-mono text-sky-400">Secondary Telemetry</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                          <th v-for="col in (deviceDetails.params_2 || [])" :key="col.field" class="py-2.5 px-3 text-right">
                            <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                            <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_2 || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                            {{ formatStatNum(col.min) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_2 || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                            {{ formatStatNum(col.avg) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_2 || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                            {{ formatStatNum(col.max) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 4. Sensor Parameters 3 (P20 .. P27) -->
                <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                  <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-cubes text-purple-400"></i> Sensor Parameters 3 (P20 .. P27)
                    </span>
                    <span class="text-[10px] font-mono text-purple-400">Auxiliary Channels</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                          <th v-for="col in (deviceDetails.params_3 || [])" :key="col.field" class="py-2.5 px-3 text-right">
                            <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                            <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_3 || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                            {{ formatStatNum(col.min) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_3 || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                            {{ formatStatNum(col.avg) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_3 || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                            {{ formatStatNum(col.max) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 5. Sensor Parameters 4 (P28 .. P35) -->
                <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                  <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-cubes text-purple-400"></i> Sensor Parameters 4 (P28 .. P35)
                    </span>
                    <span class="text-[10px] font-mono text-purple-400">Auxiliary Channels</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th class="py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider w-28">THỐNG KÊ</th>
                          <th v-for="col in (deviceDetails.params_4 || [])" :key="col.field" class="py-2.5 px-3 text-right">
                            <div class="font-extrabold text-slate-200">{{ col.field.toUpperCase() }}</div>
                            <div class="text-[9px] font-sans font-normal text-slate-400 truncate max-w-[130px]" :title="col.label">{{ col.label }}</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-cyan-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black">MIN</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_4 || [])" :key="'min-' + col.field" class="py-2 px-3 text-right text-cyan-300 font-semibold">
                            {{ formatStatNum(col.min) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black">AVG</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_4 || [])" :key="'avg-' + col.field" class="py-2 px-3 text-right text-emerald-400 font-extrabold">
                            {{ formatStatNum(col.avg) }}
                          </td>
                        </tr>
                        <tr class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 font-bold text-amber-400 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black">MAX</span>
                          </td>
                          <td v-for="col in (deviceDetails.params_4 || [])" :key="'max-' + col.field" class="py-2 px-3 text-right text-amber-300 font-semibold">
                            {{ formatStatNum(col.max) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Interactive Telemetry Trend Charts & Telemetry Stream (Grid System & Padded Y-Axis) -->
              <div class="glass-card rounded-xl border border-slate-800 p-4 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span class="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-chart-line text-emerald-400"></i>
                      <span>Telemetry Trend Visualizer (raw_data3 Grid Chart)</span>
                    </span>
                    <p class="text-[11px] text-slate-400 mt-0.5">
                      Oscilloscope-style grid view with cushioned Y-axis bounds (±15% margin), interval tick labels, and packet timestamps.
                    </p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] uppercase font-bold text-slate-400">Channel Field:</span>
                    <select
                      v-model="selectedTrendField"
                      class="px-3 py-1.5 bg-slate-950/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                    >
                      <option v-for="f in availableTrendFields" :key="f.key" :value="f.key">
                        {{ f.key.toUpperCase() }} — {{ f.label }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- KPI Metric Strip for Selected Field -->
                <div v-if="selectedTrendChartData" class="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                  <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <span class="text-slate-500 text-[10px] uppercase font-sans">Min Value</span>
                    <strong class="text-cyan-300 font-bold">{{ formatStatNum(selectedTrendChartData.rawMin) }}</strong>
                  </div>
                  <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <span class="text-slate-500 text-[10px] uppercase font-sans">Avg Value</span>
                    <strong class="text-emerald-400 font-bold">{{ formatStatNum(selectedTrendChartData.rawAvg) }}</strong>
                  </div>
                  <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <span class="text-slate-500 text-[10px] uppercase font-sans">Max Value</span>
                    <strong class="text-amber-300 font-bold">{{ formatStatNum(selectedTrendChartData.rawMax) }}</strong>
                  </div>
                  <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <span class="text-slate-500 text-[10px] uppercase font-sans">Latest</span>
                    <strong class="text-white font-bold">{{ formatStatNum(selectedTrendChartData.latestVal) }}</strong>
                  </div>
                  <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
                    <span class="text-slate-500 text-[10px] uppercase font-sans">Packets</span>
                    <strong class="text-sky-300 font-bold">{{ selectedTrendChartData.count }} pkts</strong>
                  </div>
                </div>

                <!-- SVG Trend Chart with Grid System and Y-Axis interval ticks -->
                <div class="w-full bg-slate-950/90 rounded-xl border border-slate-800 p-3 relative overflow-hidden">
                  <div v-if="selectedTrendChartData && selectedTrendChartData.count > 0" class="w-full">
                    <svg class="w-full h-64 overflow-visible" viewBox="0 0 820 240" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="trendAreaGradDetails" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stop-color="#10b981" stop-opacity="0.30" />
                          <stop offset="100%" stop-color="#10b981" stop-opacity="0.02" />
                        </linearGradient>
                      </defs>

                      <!-- Grid Area Background -->
                      <rect x="70" y="20" width="730" height="185" fill="#0b1120" rx="4" stroke="#1e293b" stroke-width="1" />

                      <!-- Horizontal Dashed Grid Lines & Y-Axis Value Labels -->
                      <g v-for="tick in selectedTrendChartData.yTicks" :key="'ytick-dt-' + tick.ratio">
                        <!-- Horizontal Grid Line -->
                        <line
                          x1="70"
                          :y1="tick.y"
                          x2="800"
                          :y2="tick.y"
                          stroke="#1e293b"
                          stroke-width="1"
                          stroke-dasharray="4,4"
                        />
                        <!-- Tick Mark on Y-Axis -->
                        <line
                          x1="65"
                          :y1="tick.y"
                          x2="70"
                          :y2="tick.y"
                          stroke="#475569"
                          stroke-width="1.5"
                        />
                        <!-- Y-Axis Value Label -->
                        <text
                          x="60"
                          :y="tick.y + 3.5"
                          text-anchor="end"
                          fill="#94a3b8"
                          font-size="10"
                          font-family="monospace"
                          font-weight="600"
                        >
                          {{ tick.valFormatted }}
                        </text>
                      </g>

                      <!-- Vertical Dashed Grid Lines & X-Axis Timestamp Labels -->
                      <g v-for="(xtick, xIdx) in selectedTrendChartData.xTicks" :key="'xtick-dt-' + xIdx">
                        <!-- Vertical Grid Line -->
                        <line
                          :x1="xtick.x"
                          y1="20"
                          :x2="xtick.x"
                          y2="205"
                          stroke="#1e293b"
                          stroke-width="1"
                          stroke-dasharray="3,3"
                        />
                        <!-- Bottom Tick Mark -->
                        <line
                          :x1="xtick.x"
                          y1="205"
                          :x2="xtick.x"
                          y2="210"
                          stroke="#475569"
                          stroke-width="1"
                        />
                        <!-- X-Axis Time Label -->
                        <text
                          :x="xtick.x"
                          y="223"
                          text-anchor="middle"
                          fill="#64748b"
                          font-size="9"
                          font-family="monospace"
                        >
                          {{ xtick.label }}
                        </text>
                      </g>

                      <!-- Average Reference Dashed Line -->
                      <line
                        x1="70"
                        :y1="selectedTrendChartData.avgY"
                        x2="800"
                        :y2="selectedTrendChartData.avgY"
                        stroke="#f59e0b"
                        stroke-width="1.5"
                        stroke-dasharray="6,3"
                        stroke-opacity="0.8"
                      />
                      <text
                        x="795"
                        :y="selectedTrendChartData.avgY - 4"
                        text-anchor="end"
                        fill="#f59e0b"
                        font-size="9"
                        font-family="monospace"
                        font-weight="bold"
                      >
                        AVG: {{ formatStatNum(selectedTrendChartData.rawAvg) }}
                      </text>

                      <!-- Shaded Polygon Area Under Curve -->
                      <polygon
                        :points="selectedTrendChartData.areaPolygonStr"
                        fill="url(#trendAreaGradDetails)"
                      />

                      <!-- Vector Curve Polyline -->
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        :points="selectedTrendChartData.polylineStr"
                      />

                      <!-- Data Points (Circles with hover tooltips) -->
                      <circle
                        v-for="p in selectedTrendChartData.renderedPoints"
                        :key="'pt-dt-' + p.index"
                        :cx="p.x"
                        :cy="p.y"
                        r="3.5"
                        fill="#10b981"
                        stroke="#0f172a"
                        stroke-width="1.5"
                        class="cursor-pointer hover:scale-150 transition-transform origin-center"
                      >
                        <title>Packet #{{ p.index }} | Time: {{ p.timeStr }} | Value: {{ p.valFormatted }}</title>
                      </circle>
                    </svg>

                    <!-- Chart Legend & Boundary Note -->
                    <div class="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 pt-2 px-1 border-t border-slate-800/80 mt-1">
                      <div class="flex items-center gap-4">
                        <span class="flex items-center gap-1.5">
                          <span class="w-3 h-0.5 bg-emerald-500 rounded"></span>
                          <strong class="text-white">{{ selectedTrendField.toUpperCase() }} Trend</strong>
                        </span>
                        <span class="flex items-center gap-1.5">
                          <span class="w-3 h-0.5 bg-amber-500 border-dashed"></span>
                          <span class="text-amber-400">Mean Level</span>
                        </span>
                        <span class="text-slate-500">
                          (Y-Axis padded ±15% at bounds)
                        </span>
                      </div>
                      <div class="text-slate-400">
                        Span: <span class="text-cyan-300 font-bold">{{ formatStatNum(selectedTrendChartData.rawMin) }}</span> → <span class="text-amber-300 font-bold">{{ formatStatNum(selectedTrendChartData.rawMax) }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="py-16 text-center text-slate-500 text-xs">
                    <i class="fa-solid fa-chart-line text-2xl text-slate-600 mb-2 block"></i>
                    No telemetry data points available for {{ selectedTrendField.toUpperCase() }}.
                  </div>
                </div>
              </div>

              <!-- Raw Data 3 Telemetry Log Table -->
              <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                <div class="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <i class="fa-solid fa-list-ol text-slate-400"></i> Raw Telemetry Frames (raw_data3)
                  </span>
                  <span class="text-[10px] font-mono text-slate-400">Showing last {{ (deviceDetails.telemetry || []).length }} frames</span>
                </div>
                <div class="overflow-x-auto max-h-72 custom-scroll">
                  <table class="w-full text-left text-xs font-mono">
                    <thead class="bg-slate-950/80 text-slate-400 text-[10px] uppercase sticky top-0 border-b border-slate-800">
                      <tr>
                        <th class="py-2 px-3">#</th>
                        <th class="py-2 px-3">Timestamp</th>
                        <th class="py-2 px-3 text-right">COM1 (V)</th>
                        <th class="py-2 px-3 text-right">COM2 (mA)</th>
                        <th class="py-2 px-3 text-center">Event (P1)</th>
                        <th class="py-2 px-3 text-right">P4</th>
                        <th class="py-2 px-3 text-right">P5</th>
                        <th class="py-2 px-3 text-right">P6</th>
                        <th class="py-2 px-3 text-right">P7</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-[11px]">
                      <tr v-for="(frame, fIdx) in deviceDetails.telemetry" :key="frame.id || fIdx" class="hover:bg-slate-800/20">
                        <td class="py-1.5 px-3 text-slate-500">{{ fIdx + 1 }}</td>
                        <td class="py-1.5 px-3 text-slate-300">{{ formatDateTime(frame.created_at) }}</td>
                        <td class="py-1.5 px-3 text-right text-amber-300">{{ formatStatNum(frame.com1) }}</td>
                        <td class="py-1.5 px-3 text-right text-cyan-300">{{ formatStatNum(frame.com2) }}</td>
                        <td class="py-1.5 px-3 text-center">
                          <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-sky-300">
                            {{ frame.p1 }}
                          </span>
                        </td>
                        <td class="py-1.5 px-3 text-right text-emerald-300">{{ formatStatNum(frame.p4) }}</td>
                        <td class="py-1.5 px-3 text-right text-emerald-300">{{ formatStatNum(frame.p5) }}</td>
                        <td class="py-1.5 px-3 text-right text-slate-400">{{ formatStatNum(frame.p6) }}</td>
                        <td class="py-1.5 px-3 text-right text-slate-400">{{ formatStatNum(frame.p7) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <!-- Empty / Not Selected State -->
            <div v-else class="glass-card rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <i class="fa-solid fa-microchip text-4xl text-slate-600 mb-1"></i>
              <div class="text-sm font-semibold text-slate-400">No Device Test Selected</div>
              <p class="text-xs text-slate-500 max-w-md mx-auto">
                Select a test record from the <strong>0-Test Results</strong> catalog or enter a Test ID above to inspect deep telemetry and Modbus parameter analytics.
              </p>
            </div>
          </div>

        </div>
`;

export const TRACEABILITY_MODALS = `
    <!-- MODAL: DECODED CONFIGURATION DRAWER / MODAL (Node-RED Register Decoder) -->
    <div v-if="showDecodedConfigModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card rounded-2xl w-full max-w-4xl border border-indigo-500/30 p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-lg">
              <i class="fa-solid fa-code"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>Decoded Modbus Register Map</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {{ activeDecodedItem?.sku }}
                </span>
              </h3>
              <p class="text-[11px] text-slate-400 font-mono">
                Test ID: <span class="text-sky-300">{{ activeDecodedItem?.test_id }}</span> | SN: <span class="text-emerald-300">{{ activeDecodedItem?.serial_number }}</span>
              </p>
            </div>
          </div>
          <button
            @click="showDecodedConfigModal = false"
            class="text-slate-500 hover:text-white transition cursor-pointer p-1"
          >
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <!-- Raw Hex String Display -->
        <div class="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
          <div class="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Raw Configuration String (Hex Words)</span>
            <span class="font-mono text-slate-500">{{ (activeDecodedItem?.configuration_string || '').length }} chars</span>
          </div>
          <div class="text-[11px] font-mono text-amber-300/90 break-all select-all">
            {{ activeDecodedItem?.configuration_string || '—' }}
          </div>
        </div>

        <!-- Decoded Registers Table -->
        <div class="flex-1 overflow-y-auto custom-scroll border border-slate-800 rounded-xl">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-950/90 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0">
              <tr>
                <th class="py-2.5 px-3">Addr</th>
                <th class="py-2.5 px-3">Name / Label</th>
                <th class="py-2.5 px-3">Type</th>
                <th class="py-2.5 px-3">Raw Hex</th>
                <th class="py-2.5 px-3 text-right text-emerald-400 font-bold">Decoded Value</th>
                <th class="py-2.5 px-3">Unit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-[11px]">
              <tr v-for="reg in activeDecodedRegisters" :key="reg.address" class="hover:bg-slate-800/20">
                <td class="py-2 px-3 text-amber-400 font-bold">{{ reg.address }}</td>
                <td class="py-2 px-3 text-white font-sans font-semibold">{{ reg.name }}</td>
                <td class="py-2 px-3 text-slate-400">
                  <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold">{{ reg.type }}</span>
                </td>
                <td class="py-2 px-3 text-slate-400 text-[10px]">{{ reg.rawHex }}</td>
                <td class="py-2 px-3 text-right text-emerald-400 font-bold font-mono">{{ reg.value }}</td>
                <td class="py-2 px-3 text-slate-400 text-[10px]">{{ reg.unit || '—' }}</td>
              </tr>
              <tr v-if="activeDecodedRegisters.length === 0">
                <td colspan="6" class="py-6 text-center text-slate-500 font-sans">
                  No register decoding scheme defined for this configuration format.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between border-t border-slate-800 pt-3">
          <span class="text-[11px] text-slate-500 font-mono">Total Decoded Registers: {{ activeDecodedRegisters.length }}</span>
          <button
            @click="showDecodedConfigModal = false"
            class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    <!-- MODAL: FIELD WAVEFORM INSPECTOR & TELEMETRY DEEP-DIVE -->
    <div
      v-if="showFieldInspectModal && inspectingField && inspectChartData"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      @click.self="closeFieldInspectModal"
    >
      <div class="glass-card rounded-2xl w-full max-w-5xl border border-sky-500/30 p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col bg-slate-900/95 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center text-lg">
              <i class="fa-solid fa-wave-square"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>Field Waveform Inspector:</span>
                <span class="px-2 py-0.5 rounded text-xs font-mono font-black border" :class="inspectChartData.colors?.badge">
                  {{ inspectChartData.key.toUpperCase() }}
                </span>
                <span class="text-slate-300 font-sans text-xs">({{ inspectChartData.label }})</span>
              </h3>
              <p class="text-[11px] text-slate-400 font-mono">
                Total Telemetry Frames: <strong class="text-white">{{ inspectChartData.totalCount }}</strong> | Showing: <strong class="text-sky-300">{{ inspectChartData.count }}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="closeFieldInspectModal"
            class="text-slate-400 hover:text-white transition cursor-pointer p-1"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Interactive Control Bar for Modal -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
          <!-- Zoom selector -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-slate-500 uppercase text-[9px] font-sans font-bold">Timeline Window:</span>
            <div class="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                type="button"
                @click="inspectModalZoom = 'all'"
                :class="inspectModalZoom === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2 py-0.5 rounded transition cursor-pointer text-xs"
              >
                All ({{ inspectChartData.totalCount }})
              </button>
              <button
                v-if="inspectChartData.totalCount > 50"
                type="button"
                @click="inspectModalZoom = 50"
                :class="inspectModalZoom === 50 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2 py-0.5 rounded transition cursor-pointer text-xs"
              >
                Last 50
              </button>
              <button
                v-if="inspectChartData.totalCount > 25"
                type="button"
                @click="inspectModalZoom = 25"
                :class="inspectModalZoom === 25 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2 py-0.5 rounded transition cursor-pointer text-xs"
              >
                Last 25
              </button>
              <button
                v-if="inspectChartData.totalCount > 10"
                type="button"
                @click="inspectModalZoom = 10"
                :class="inspectModalZoom === 10 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2 py-0.5 rounded transition cursor-pointer text-xs"
              >
                Last 10
              </button>
            </div>
          </div>

          <!-- Feature Toggles & Export -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              @click="inspectShowArea = !inspectShowArea"
              :class="inspectShowArea ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
              class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
            >
              <i class="fa-solid fa-chart-area text-[10px]"></i> Area
            </button>
            <button
              type="button"
              @click="inspectShowAvg = !inspectShowAvg"
              :class="inspectShowAvg ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
              class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
            >
              <i class="fa-solid fa-arrows-split-up-and-left text-[10px]"></i> Avg
            </button>
            <button
              type="button"
              @click="inspectShowDots = !inspectShowDots"
              :class="inspectShowDots ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
              class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
            >
              <i class="fa-solid fa-circle-dot text-[10px]"></i> Dots
            </button>
            <button
              type="button"
              @click="inspectShowGrid = !inspectShowGrid"
              :class="inspectShowGrid ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
              class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
            >
              <i class="fa-solid fa-border-all text-[10px]"></i> Grid
            </button>

            <button
              type="button"
              @click="exportInspectModalCsv"
              class="px-2.5 py-0.5 rounded border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 font-bold transition cursor-pointer flex items-center gap-1"
              title="Download CSV dataset"
            >
              <i class="fa-solid fa-download text-[10px]"></i> CSV
            </button>
            <button
              type="button"
              @click="copyInspectModalData"
              class="px-2.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
              title="Copy table to clipboard"
            >
              <i class="fa-regular fa-copy text-[10px]"></i> Copy
            </button>
          </div>
        </div>

        <!-- Interactive Live HUD Readout / Metric Strip -->
        <div v-if="inspectHoverPoint" class="p-2.5 rounded-xl bg-sky-950 border border-sky-500/40 flex flex-wrap items-center justify-between gap-2 font-mono text-xs animate-in fade-in">
          <div class="flex items-center gap-2 text-sky-300">
            <i class="fa-solid fa-crosshairs text-sky-400 text-sm animate-pulse"></i>
            <span class="font-bold">PACKET #{{ inspectHoverPoint.index }}</span>
            <span class="text-slate-400">| TIME: <strong class="text-white">{{ inspectHoverPoint.timeStr }}</strong></span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-slate-300">MEASURED: <strong class="text-white text-sm font-black">{{ inspectHoverPoint.valFormatted }}</strong></span>
            <span :class="inspectHoverPoint.isAboveAvg ? 'text-emerald-400' : 'text-amber-400'" class="font-bold">
              {{ inspectHoverPoint.deltaFormatted }} vs Avg ({{ inspectHoverPoint.status }})
            </span>
          </div>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-xs">
          <div class="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span class="text-slate-500 text-[9px] uppercase font-sans">Min Value</span>
            <strong class="text-cyan-300 text-sm font-black mt-0.5">{{ formatStatNum(inspectChartData.rawMin) }}</strong>
          </div>
          <div class="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span class="text-slate-500 text-[9px] uppercase font-sans">Average (Mean)</span>
            <strong class="text-emerald-400 text-sm font-black mt-0.5">{{ formatStatNum(inspectChartData.rawAvg) }}</strong>
          </div>
          <div class="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span class="text-slate-500 text-[9px] uppercase font-sans">Max Value</span>
            <strong class="text-amber-300 text-sm font-black mt-0.5">{{ formatStatNum(inspectChartData.rawMax) }}</strong>
          </div>
          <div class="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span class="text-slate-500 text-[9px] uppercase font-sans">Peak Span (Δ)</span>
            <strong class="text-purple-300 text-sm font-black mt-0.5">{{ formatStatNum(inspectChartData.span) }}</strong>
          </div>
          <div class="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span class="text-slate-500 text-[9px] uppercase font-sans">Std Dev (σ)</span>
            <strong class="text-indigo-300 text-sm font-black mt-0.5">{{ formatStatNum(inspectChartData.stdDev) }}</strong>
          </div>
          <div class="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span class="text-slate-500 text-[9px] uppercase font-sans">Latest</span>
            <strong class="text-white text-sm font-black mt-0.5">{{ formatStatNum(inspectChartData.latestVal) }}</strong>
          </div>
        </div>

        <!-- Large High-Resolution Waveform Display -->
        <div
          class="w-full bg-slate-950 rounded-xl border border-slate-800 p-2 sm:p-3 relative overflow-hidden cursor-crosshair select-none"
          @mousemove="onInspectChartMouseMove($event)"
          @mouseleave="onInspectChartMouseLeave()"
        >
          <svg class="w-full h-64 overflow-visible" viewBox="0 0 900 260" preserveAspectRatio="none">
            <defs>
              <linearGradient id="modalWaveAreaGradCP" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" :stop-color="inspectChartData.colors?.stroke || '#0ea5e9'" stop-opacity="0.32" />
                <stop offset="100%" :stop-color="inspectChartData.colors?.stroke || '#0ea5e9'" stop-opacity="0.01" />
              </linearGradient>
              <pattern id="modal-osc-grid-cp" width="75" height="41" patternUnits="userSpaceOnUse">
                <path d="M 75 0 L 0 0 0 41" fill="none" stroke="rgba(148, 163, 184, 0.08)" stroke-width="0.8" stroke-dasharray="2,2" />
              </pattern>
            </defs>

            <rect x="70" y="20" width="805" height="205" fill="#080e1a" rx="4" stroke="#1e293b" stroke-width="1" />
            <rect v-if="inspectShowGrid" x="70" y="20" width="805" height="205" fill="url(#modal-osc-grid-cp)" rx="4" />

            <!-- Y-Axis Ticks & Labels -->
            <g v-for="tick in inspectChartData.yTicks" :key="'m-ytick-' + tick.ratio">
              <line v-if="inspectShowGrid" x1="70" :y1="tick.y" x2="875" :y2="tick.y" stroke="rgba(148, 163, 184, 0.18)" stroke-width="1" stroke-dasharray="4,4" />
              <line x1="64" :y1="tick.y" x2="70" :y2="tick.y" stroke="#64748b" stroke-width="1.5" />
              <text x="60" :y="tick.y + 3.5" text-anchor="end" fill="#94a3b8" font-size="10" font-family="monospace" font-weight="600">{{ tick.valFormatted }}</text>
            </g>

            <!-- X-Axis Ticks & Labels -->
            <g v-for="(xtick, xIdx) in inspectChartData.xTicks" :key="'m-xtick-' + xIdx">
              <line v-if="inspectShowGrid" :x1="xtick.x" y1="20" :x2="xtick.x" y2="225" stroke="rgba(148, 163, 184, 0.18)" stroke-width="1" stroke-dasharray="3,3" />
              <line :x1="xtick.x" y1="225" :x2="xtick.x" y2="230" stroke="#64748b" stroke-width="1.5" />
              <text :x="xtick.x" y="243" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="monospace">{{ xtick.label }}</text>
            </g>

            <!-- Average Reference Line -->
            <g v-if="inspectShowAvg">
              <line x1="70" :y1="inspectChartData.avgY" x2="875" :y2="inspectChartData.avgY" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6,3" stroke-opacity="0.85" />
              <text x="870" :y="inspectChartData.avgY - 4" text-anchor="end" fill="#f59e0b" font-size="9" font-family="monospace" font-weight="bold">AVG: {{ formatStatNum(inspectChartData.rawAvg) }}</text>
            </g>

            <!-- Area Fill -->
            <polygon v-if="inspectShowArea" :points="inspectChartData.areaPolygonStr" fill="url(#modalWaveAreaGradCP)" />

            <!-- Polyline -->
            <polyline fill="none" :stroke="inspectChartData.colors?.stroke || '#0ea5e9'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :points="inspectChartData.polylineStr" />

            <!-- Data Points -->
            <g v-if="inspectShowDots">
              <circle
                v-for="p in inspectChartData.renderedPoints"
                :key="'m-pt-' + p.index"
                :cx="p.x"
                :cy="p.y"
                :r="inspectHoverPoint?.index === p.index ? 6 : 3"
                :fill="inspectChartData.colors?.stroke || '#0ea5e9'"
                stroke="#0f172a"
                stroke-width="1.5"
                class="transition-all"
              />
            </g>

            <!-- Crosshair Lines & Hover Point -->
            <g v-if="inspectHoverPoint">
              <line :x1="inspectHoverPoint.x" y1="20" :x2="inspectHoverPoint.x" y2="225" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" />
              <line x1="70" :y1="inspectHoverPoint.y" x2="875" :y2="inspectHoverPoint.y" stroke="rgba(56, 189, 248, 0.45)" stroke-width="1.2" stroke-dasharray="3,3" />
              <circle :cx="inspectHoverPoint.x" :cy="inspectHoverPoint.y" r="8" fill="none" stroke="#38bdf8" stroke-width="2" class="animate-ping" />
              <circle :cx="inspectHoverPoint.x" :cy="inspectHoverPoint.y" r="5.5" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
            </g>
          </svg>
        </div>

        <!-- Telemetry Packets Log Table -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-table-list text-sky-400 text-xs"></i>
              <span class="text-xs font-bold text-white uppercase tracking-wider">Telemetry Packets Log ({{ inspectChartData.tablePoints.length }} / {{ inspectChartData.count }})</span>
            </div>
            <!-- Table Search Filter -->
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2 text-[10px] text-slate-500"></i>
              <input
                v-model="inspectModalSearch"
                type="text"
                placeholder="Filter packet #, time, value..."
                class="pl-7 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-sky-500 focus:outline-none w-52 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div class="overflow-x-auto max-h-56 rounded-xl border border-slate-800 bg-slate-950">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th class="py-2 px-3 w-16 text-center">Pkt #</th>
                  <th class="py-2 px-3">Timestamp</th>
                  <th class="py-2 px-3 text-right">Measured Value</th>
                  <th class="py-2 px-3 text-right">Deviation vs Mean</th>
                  <th class="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-[11px]">
                <tr
                  v-for="row in inspectChartData.tablePoints"
                  :key="'tb-' + row.index"
                  class="hover:bg-slate-900/50 transition cursor-pointer"
                  :class="inspectHoverPoint?.index === row.index ? 'bg-sky-950/60' : ''"
                  @mouseenter="inspectHoverPoint = row"
                  @mouseleave="inspectHoverPoint = null"
                >
                  <td class="py-1.5 px-3 text-center font-bold text-slate-400">#{{ row.index }}</td>
                  <td class="py-1.5 px-3 text-slate-300">{{ row.timeStr }}</td>
                  <td class="py-1.5 px-3 text-right font-black text-white">{{ row.valFormatted }}</td>
                  <td class="py-1.5 px-3 text-right font-bold" :class="row.diffFromAvg >= 0 ? 'text-emerald-400' : 'text-amber-400'">
                    {{ row.diffFromAvg >= 0 ? '+' : '' }}{{ row.diffFromAvg }}
                  </td>
                  <td class="py-1.5 px-3 text-center">
                    <span
                      class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                      :class="row.status === 'Peak Max' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : (row.status === 'Peak Min' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : (row.status === 'Above Mean' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'))"
                    >
                      {{ row.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-800">
          <span class="text-[11px] font-mono text-slate-500">
            Showing {{ inspectChartData.tablePoints.length }} points • Hover waveform or rows for synchronized crosshair
          </span>
          <button
            type="button"
            @click="closeFieldInspectModal"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>

`;

export const TRACEABILITY_SCRIPT = `
    function useTraceabilityModule(ctx) {
      const { showToast, authHeaders, activeTab } = ctx;
      const ref = (typeof Vue !== 'undefined' && Vue.ref) ? Vue.ref : function(v) { return { value: v }; };
      const computed = (typeof Vue !== 'undefined' && Vue.computed) ? Vue.computed : function(fn) { return { get value() { return fn(); } }; };
      const watch = (typeof Vue !== 'undefined' && Vue.watch) ? Vue.watch : function() {};

      const traceViewMode = ref('catalog'); // 'catalog' (0-Test_Result) or 'details' (1-Device_Test_Details)
      const testResultsList = ref([]);
      const loadingTestResults = ref(false);
      const isSeedingTraceData = ref(false);

      const traceFilters = ref({
        so_number: '',
        serial_number: '',
        sku: '',
        item_code: '',
        device_key: '',
        search: '',
        from_date: '',
        to_date: '',
        limit: 50,
      });

      const activeTestIdInput = ref('');
      const loadingDeviceDetails = ref(false);
      const deviceDetails = ref(null);
      const selectedTrendField = ref('com1');

      const showDecodedConfigModal = ref(false);
      const activeDecodedItem = ref(null);
      const activeDecodedRegisters = ref([]);

      // Fetch test results for Flow 0
      const fetchTestResults = async () => {
        loadingTestResults.value = true;
        try {
          const params = new URLSearchParams();
          if (traceFilters.value.so_number) params.append('so_number', traceFilters.value.so_number.trim());
          if (traceFilters.value.serial_number) params.append('serial_number', traceFilters.value.serial_number.trim());
          if (traceFilters.value.sku) params.append('sku', traceFilters.value.sku.trim());
          if (traceFilters.value.item_code) params.append('item_code', traceFilters.value.item_code.trim());
          if (traceFilters.value.device_key) params.append('device_key', traceFilters.value.device_key.trim());
          if (traceFilters.value.search) params.append('search', traceFilters.value.search.trim());
          if (traceFilters.value.from_date) params.append('from_date', traceFilters.value.from_date);
          if (traceFilters.value.to_date) params.append('to_date', traceFilters.value.to_date);
          if (traceFilters.value.limit) params.append('limit', String(traceFilters.value.limit));

          const res = await fetch('/api/traceability/test-results?' + params.toString(), {
            headers: authHeaders(),
          });

          if (res.ok) {
            const data = await res.json();
            testResultsList.value = data.data || [];
          } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.message || 'Failed to query test results', 'error');
          }
        } catch (e) {
          console.error('Failed to load test results:', e);
          showToast('Network error querying test results', 'error');
        } finally {
          loadingTestResults.value = false;
        }
      };

      const resetTraceFilters = () => {
        traceFilters.value = {
          so_number: '',
          serial_number: '',
          sku: '',
          item_code: '',
          device_key: '',
          search: '',
          from_date: '',
          to_date: '',
          limit: 50,
        };
        fetchTestResults();
      };

      // Summary KPIs
      const testResultsSummary = computed(() => {
        const total = testResultsList.value.length;
        let pass = 0;
        let fail = 0;
        testResultsList.value.forEach(item => {
          const res = String(item.result || '').toUpperCase();
          if (res === 'PASS' || res === 'PASSED' || res === 'OK' || res === '1') {
            pass++;
          } else {
            fail++;
          }
        });
        const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
        return { total, pass, fail, passRate };
      });

      // Seed baseline data
      const seedSampleTraceData = async () => {
        isSeedingTraceData.value = true;
        try {
          const res = await fetch('/api/traceability/seed', {
            method: 'POST',
            headers: {
              ...authHeaders(),
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            showToast('Seeded authentic baseline QA records successfully!', 'success');
            await fetchTestResults();
          } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.message || 'Failed to seed baseline data', 'error');
          }
        } catch (e) {
          console.error('Seed error:', e);
          showToast('Failed to connect to seed endpoint', 'error');
        } finally {
          isSeedingTraceData.value = false;
        }
      };

      // Inspect deep details (Flow 1)
      const inspectDeviceTest = async (testId) => {
        if (!testId) return;
        activeTestIdInput.value = testId;
        traceViewMode.value = 'details';
        await loadDeviceDetails(testId);
      };

      const loadDeviceDetails = async (testId) => {
        if (!testId) {
          showToast('Please enter a valid Test ID', 'error');
          return;
        }
        loadingDeviceDetails.value = true;
        try {
          const res = await fetch('/api/traceability/device-details?test_id=' + encodeURIComponent(testId), {
            headers: authHeaders(),
          });
          if (res.ok) {
            deviceDetails.value = await res.json();
          } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.message || 'Failed to load device details', 'error');
          }
        } catch (e) {
          console.error('Device details load error:', e);
          showToast('Error loading device telemetry', 'error');
        } finally {
          loadingDeviceDetails.value = false;
        }
      };

      // Open decoded config modal
      const openDecodedConfigModal = (item) => {
        activeDecodedItem.value = item;
        activeDecodedRegisters.value = item.decoded_config || [];
        showDecodedConfigModal.value = true;
      };

      // Helper check for pass
      const isTestPassed = (res) => {
        const str = String(res || '').toUpperCase();
        return str === 'PASS' || str === 'PASSED' || str === 'OK' || str === '1';
      };

      // Date formatter
      const formatDateTime = (val) => {
        if (!val || val === '—') return '—';
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val.trim())) {
          return val.trim().replace('T', ' ').substring(0, 19);
        }
        try {
          let num = typeof val === 'number' ? val : (typeof val === 'string' && /^\d+$/.test(val.trim()) ? Number(val.trim()) : null);
          if (num !== null) {
            if (num < 10000000000) num *= 1000;
            const d = new Date(num);
            if (!isNaN(d.getTime())) {
              return d.toISOString().replace('T', ' ').substring(0, 19);
            }
          }
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            return d.toISOString().replace('T', ' ').substring(0, 19);
          }
          return String(val);
        } catch(e) {
          return String(val);
        }
      };

      // Stat number formatter
      const formatStatNum = (num) => {
        if (num === null || num === undefined) return '—';
        const n = Number(num);
        if (isNaN(n)) return '—';
        return Number.isInteger(n) ? String(n) : n.toFixed(2);
      };

      // Interactive Card-Level Controls & Zoom Maps
      const cardZoomMap = ref({}); // { [key]: 'all' | 25 | 10 }
      const cardSettingMap = ref({}); // { [key]: { showArea: bool, showAvg: bool, showDots: bool, showGrid: bool } }
      const cardHoverMap = ref({}); // { [key]: hoverPoint | null }

      // Global Settings for cards
      const globalCardZoom = ref('all');
      const globalCardArea = ref(true);
      const globalCardAvg = ref(true);
      const globalCardDots = ref(true);
      const globalCardGrid = ref(true);

      // Channel search and category filtering
      const trendChannelSearch = ref('');
      const trendCategoryFilter = ref('all'); // 'all' | 'sensors' | 'com' | 'active'

      // Focused Chart interactive controls
      const focusedChartZoom = ref('all'); // 'all' | 50 | 25 | 10
      const focusedShowArea = ref(true);
      const focusedShowAvg = ref(true);
      const focusedShowDots = ref(true);
      const focusedShowGrid = ref(true);
      const focusedShowPeaks = ref(true);
      const focusedHoverPoint = ref(null);

      // Field Waveform Inspection Modal
      const showFieldInspectModal = ref(false);
      const inspectingField = ref(null);
      const inspectModalZoom = ref('all');
      const inspectModalSearch = ref('');
      const inspectModalPage = ref(1);
      const inspectShowArea = ref(true);
      const inspectShowAvg = ref(true);
      const inspectShowGrid = ref(true);
      const inspectShowDots = ref(true);
      const inspectHoverPoint = ref(null);

      // Helper Methods for Card-level Interactions
      const setCardZoom = (fieldKey, range) => {
        cardZoomMap.value = { ...cardZoomMap.value, [fieldKey]: range };
      };

      const getCardSetting = (fieldKey, settingKey, defaultVal = true) => {
        const s = cardSettingMap.value[fieldKey];
        if (s && s[settingKey] !== undefined) return s[settingKey];
        if (settingKey === 'showArea') return globalCardArea.value;
        if (settingKey === 'showAvg') return globalCardAvg.value;
        if (settingKey === 'showDots') return globalCardDots.value;
        if (settingKey === 'showGrid') return globalCardGrid.value;
        return defaultVal;
      };

      const toggleCardSetting = (fieldKey, settingKey) => {
        const current = getCardSetting(fieldKey, settingKey);
        const existing = cardSettingMap.value[fieldKey] || {};
        cardSettingMap.value = {
          ...cardSettingMap.value,
          [fieldKey]: { ...existing, [settingKey]: !current },
        };
      };

      const setGlobalCardZoom = (range) => {
        globalCardZoom.value = range;
        cardZoomMap.value = {};
        if (typeof showToast === 'function') {
          showToast(range === 'all' ? 'Zoom reset: Showing all packets on all cards' : 'Zoomed all cards to last ' + range + ' packets', 'info');
        }
      };

      const toggleGlobalCardArea = () => {
        globalCardArea.value = !globalCardArea.value;
        cardSettingMap.value = {};
      };

      const toggleGlobalCardAvg = () => {
        globalCardAvg.value = !globalCardAvg.value;
        cardSettingMap.value = {};
      };

      const toggleGlobalCardDots = () => {
        globalCardDots.value = !globalCardDots.value;
        cardSettingMap.value = {};
      };

      const toggleGlobalCardGrid = () => {
        globalCardGrid.value = !globalCardGrid.value;
        cardSettingMap.value = {};
      };

      const onCardChartMouseMove = (event, field) => {
        if (!field || !field.renderedPoints || field.renderedPoints.length === 0) return;
        const svgEl = event.currentTarget.querySelector ? (event.currentTarget.querySelector('svg') || event.currentTarget) : event.currentTarget;
        const rect = svgEl.getBoundingClientRect();
        if (!rect.width) return;
        const mouseX = ((event.clientX - rect.left) / rect.width) * 320;

        let closest = field.renderedPoints[0];
        let minDiff = Math.abs(closest.x - mouseX);
        for (let i = 1; i < field.renderedPoints.length; i++) {
          const pt = field.renderedPoints[i];
          const diff = Math.abs(pt.x - mouseX);
          if (diff < minDiff) {
            minDiff = diff;
            closest = pt;
          }
        }
        const delta = Number((closest.val - field.avg).toFixed(2));
        const isAbove = delta >= 0;
        cardHoverMap.value = {
          ...cardHoverMap.value,
          [field.key]: {
            ...closest,
            deltaFromAvg: delta,
            isAboveAvg: isAbove,
            deltaFormatted: (isAbove ? '+' : '') + delta,
          },
        };
      };

      const onCardChartMouseLeave = (fieldKey) => {
        if (cardHoverMap.value[fieldKey]) {
          const updated = { ...cardHoverMap.value };
          delete updated[fieldKey];
          cardHoverMap.value = updated;
        }
      };

      const focusChannel = (fieldKey) => {
        selectedTrendField.value = fieldKey;
        if (typeof showToast === 'function') {
          showToast('Spotlight focused on ' + fieldKey.toUpperCase(), 'info');
        }
        try {
          const el = document.getElementById('focused-oscilloscope-visualizer-cp');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch(e) {}
      };

      const openFieldInspectModal = (field) => {
        inspectingField.value = field;
        inspectModalZoom.value = 'all';
        inspectModalSearch.value = '';
        inspectModalPage.value = 1;
        inspectHoverPoint.value = null;
        showFieldInspectModal.value = true;
      };

      const closeFieldInspectModal = () => {
        showFieldInspectModal.value = false;
        inspectingField.value = null;
        inspectHoverPoint.value = null;
      };

      const exportFieldCsv = (field) => {
        const pts = field.allPoints || field.renderedPoints || [];
        if (pts.length === 0) {
          if (typeof showToast === 'function') showToast('No data available to export', 'error');
          return;
        }
        const dev = deviceDetails.value || {};
        const devId = dev.serial_number || dev.serialNumber || dev.device_key || 'DEVICE';
        const filename = devId + '_' + field.key + '_' + Date.now() + '.csv';
        let csv = 'Packet_Index,Timestamp,Epochtime,Field,Field_Label,Value,Min,Avg,Max\n';
        for (const p of pts) {
          csv += p.index + ',"' + (p.timeStr || '') + '",' + (p.epochtime || '') + ',' + field.key + ',"' + field.label + '",' + p.val + ',' + field.min + ',' + field.avg + ',' + field.max + '\n';
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        if (typeof showToast === 'function') showToast('Exported ' + pts.length + ' rows for ' + field.key.toUpperCase() + ' to CSV', 'success');
      };

      const copyFieldStats = (field) => {
        if (!field) return;
        const text = 'Channel: ' + field.key.toUpperCase() + ' (' + field.label + ')\nMin: ' + field.min + ' | Avg: ' + field.avg + ' | Max: ' + field.max + ' | Latest: ' + field.latest + ' | Packets: ' + field.count;
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(text);
          if (typeof showToast === 'function') showToast('Copied ' + field.key.toUpperCase() + ' stats to clipboard', 'success');
        }
      };

      const onFocusedChartMouseMove = (event) => {
        const chart = selectedTrendChartData.value;
        if (!chart || !chart.renderedPoints || chart.renderedPoints.length === 0) return;
        const svgEl = event.currentTarget.querySelector ? (event.currentTarget.querySelector('svg') || event.currentTarget) : event.currentTarget;
        const rect = svgEl.getBoundingClientRect();
        if (!rect.width) return;
        const mouseX = ((event.clientX - rect.left) / rect.width) * 820;

        let closest = chart.renderedPoints[0];
        let minDiff = Math.abs(closest.x - mouseX);
        for (let i = 1; i < chart.renderedPoints.length; i++) {
          const pt = chart.renderedPoints[i];
          const diff = Math.abs(pt.x - mouseX);
          if (diff < minDiff) {
            minDiff = diff;
            closest = pt;
          }
        }
        const delta = Number((closest.val - chart.rawAvg).toFixed(2));
        const isAbove = delta >= 0;
        const pct = chart.rawAvg !== 0 ? Number(((delta / Math.abs(chart.rawAvg)) * 100).toFixed(1)) : 0;
        focusedHoverPoint.value = {
          ...closest,
          deltaFromAvg: delta,
          isAboveAvg: isAbove,
          deltaFormatted: (isAbove ? '+' : '') + delta,
          pctFormatted: (isAbove ? '+' : '') + pct + '%',
        };
      };

      const onFocusedChartMouseLeave = () => {
        focusedHoverPoint.value = null;
      };

      const setFocusedChartZoom = (range) => {
        focusedChartZoom.value = range;
        focusedHoverPoint.value = null;
      };

      const focusedZoomStep = (delta) => {
        const steps = ['all', 50, 25, 10];
        const currIdx = steps.indexOf(focusedChartZoom.value);
        let nextIdx = (currIdx === -1 ? 0 : currIdx) + delta;
        if (nextIdx < 0) nextIdx = 0;
        if (nextIdx >= steps.length) nextIdx = steps.length - 1;
        focusedChartZoom.value = steps[nextIdx];
      };

      // Field Data List & Trend Graphs for raw_data3 (com1, com2, p1..p35)
      const rawDataFieldList = computed(() => {
        const details = deviceDetails.value;
        if (!details) return [];
        const frames = details.raw_telemetry || details.telemetry || [];
        if (!Array.isArray(frames) || frames.length === 0) return [];

        const fieldKeys = [
          'com1', 'com2',
          ...Array.from({ length: 35 }, (_, i) => 'p' + (i + 1)),
        ];

        const labelsMap = {
          com1: 'COM1 (Supply Voltage / RSSI)',
          com2: 'COM2 (Operating Current / SNR)',
          p1: 'P1 (Event Code)',
          p2: 'P2 (Battery Voltage)',
          p3: 'P3 (Operating Mode / Status)',
          p4: 'P4 (Sensor Channel 1)',
          p5: 'P5 (Sensor Channel 2)',
          p6: 'P6 (Sensor Channel 3)',
          p7: 'P7 (Sensor Channel 4)',
          p8: 'P8 (Sensor Channel 5)',
          p9: 'P9 (Sensor Channel 6)',
          p10: 'P10 (Sensor Channel 7)',
          p11: 'P11 (Sensor Channel 8)',
          p12: 'P12 (Sensor Channel 9)',
          p13: 'P13 (Sensor Channel 10)',
          p14: 'P14 (Sensor Channel 11)',
          p15: 'P15 (Sensor Channel 12)',
          p16: 'P16 (Sensor Channel 13)',
          p17: 'P17 (Sensor Channel 14)',
          p18: 'P18 (Sensor Channel 15)',
          p19: 'P19 (Sensor Channel 16)',
          p20: 'P20 (Auxiliary Channel 17)',
          p21: 'P21 (Auxiliary Channel 18)',
          p22: 'P22 (Auxiliary Channel 19)',
          p23: 'P23 (Auxiliary Channel 20)',
          p24: 'P24 (Auxiliary Channel 21)',
          p25: 'P25 (Auxiliary Channel 22)',
          p26: 'P26 (Auxiliary Channel 23)',
          p27: 'P27 (Auxiliary Channel 24)',
          p28: 'P28 (Auxiliary Channel 25)',
          p29: 'P29 (Auxiliary Channel 26)',
          p30: 'P30 (Auxiliary Channel 27)',
          p31: 'P31 (Auxiliary Channel 28)',
          p32: 'P32 (Auxiliary Channel 29)',
          p33: 'P33 (Auxiliary Channel 30)',
          p34: 'P34 (Auxiliary Channel 31)',
          p35: 'P35 (Auxiliary Channel 32)',
        };

        const colorAccents = {
          com1: { stroke: '#f59e0b', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
          com2: { stroke: '#06b6d4', text: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
          p1: { stroke: '#6366f1', text: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
          p2: { stroke: '#10b981', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
          p3: { stroke: '#14b8a6', text: 'text-teal-400', badge: 'bg-teal-500/10 text-teal-300 border-teal-500/20' },
        };
        const defaultColor = { stroke: '#38bdf8', text: 'text-sky-400', badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20' };

        const result = [];

        for (const key of fieldKeys) {
          const allValidPoints = [];
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const val = frame[key];
            if (val !== null && val !== undefined && val !== '') {
              const num = Number(val);
              if (!isNaN(num)) {
                let tStr = '';
                const ep = frame.epochtime ? Number(frame.epochtime) : null;
                if (ep && !isNaN(ep)) {
                  const d = new Date(ep < 1e11 ? ep * 1000 : ep);
                  tStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : String(frame.epochtime);
                } else if (frame.timestamp) {
                  const d = new Date(frame.timestamp);
                  tStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : String(frame.timestamp);
                } else if (frame.created_at) {
                  const d = new Date(frame.created_at);
                  tStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : String(frame.created_at);
                } else {
                  tStr = 'Pkt #' + (i + 1);
                }
                allValidPoints.push({
                  index: i + 1,
                  val: num,
                  timeStr: tStr,
                  epochtime: frame.epochtime || null,
                });
              }
            }
          }

          if (allValidPoints.length === 0) {
            continue;
          }

          const effectiveZoom = cardZoomMap.value[key] || globalCardZoom.value || 'all';
          let validPoints = allValidPoints;
          if (effectiveZoom !== 'all' && Number(effectiveZoom) > 0 && Number(effectiveZoom) < allValidPoints.length) {
            validPoints = allValidPoints.slice(-Number(effectiveZoom));
          }
          if (validPoints.length === 0) validPoints = allValidPoints;

          const numValues = validPoints.map(p => p.val);
          const minVal = Math.min(...numValues);
          const maxVal = Math.max(...numValues);
          const sum = numValues.reduce((acc, v) => acc + v, 0);
          const avgVal = Number((sum / numValues.length).toFixed(2));
          const latestVal = numValues[numValues.length - 1];
          const count = numValues.length;

          const svgW = 320;
          const svgH = 88;
          const padX = 14;
          const padTop = 10;
          const padBottom = 16;
          const plotW = svgW - 2 * padX;
          const plotH = svgH - padTop - padBottom;
          
          let delta = maxVal - minVal;
          if (delta === 0) delta = Math.abs(maxVal) === 0 ? 1 : Math.abs(maxVal) * 0.2;
          const pad = delta * 0.15;
          const yMin = minVal - pad;
          const yMax = maxVal + pad;
          const yRange = yMax - yMin;

          const renderedPoints = validPoints.map((p, idx) => {
            const x = validPoints.length === 1
              ? (svgW / 2)
              : (padX + (idx / (validPoints.length - 1)) * plotW);
            const norm = (p.val - yMin) / yRange;
            const y = padTop + plotH - norm * plotH;
            return {
              x: Number(x.toFixed(1)),
              y: Number(y.toFixed(1)),
              val: p.val,
              timeStr: p.timeStr,
              index: p.index,
              epochtime: p.epochtime,
            };
          });

          const polylineStr = renderedPoints.map(p => p.x + ',' + p.y).join(' ');
          const firstX = renderedPoints[0].x;
          const lastX = renderedPoints[renderedPoints.length - 1].x;
          const baseFloorY = (svgH - padBottom).toFixed(1);
          const areaPolygonStr = firstX + ',' + baseFloorY + ' ' + polylineStr + ' ' + lastX + ',' + baseFloorY;

          const avgNorm = (avgVal - yMin) / yRange;
          const avgY = Number((padTop + plotH - avgNorm * plotH).toFixed(1));

          const customLabel = details.calculations?.[key]?.label || details.calculations?.[key]?.name;
          const displayLabel = customLabel || labelsMap[key] || key.toUpperCase();
          const colors = colorAccents[key] || defaultColor;

          const showArea = getCardSetting(key, 'showArea', true);
          const showAvg = getCardSetting(key, 'showAvg', true);
          const showDots = getCardSetting(key, 'showDots', true);
          const showGrid = getCardSetting(key, 'showGrid', true);

          result.push({
            key,
            label: displayLabel,
            min: minVal,
            avg: avgVal,
            max: maxVal,
            latest: latestVal,
            count,
            totalCount: allValidPoints.length,
            activeZoom: effectiveZoom,
            isZoomed: validPoints.length < allValidPoints.length,
            startTime: validPoints[0].timeStr,
            endTime: validPoints[validPoints.length - 1].timeStr,
            polylineStr,
            areaPolygonStr,
            renderedPoints,
            avgY,
            colors,
            showArea,
            showAvg,
            showDots,
            showGrid,
            allPoints: allValidPoints,
          });
        }

        return result;
      });

      // Filtered Field Data List based on search and category filter
      const filteredRawDataFieldList = computed(() => {
        const list = rawDataFieldList.value || [];
        if (list.length === 0) return [];

        return list.filter(item => {
          if (trendCategoryFilter.value === 'sensors' && !item.key.startsWith('p')) return false;
          if (trendCategoryFilter.value === 'com' && !item.key.startsWith('com')) return false;
          if (trendCategoryFilter.value === 'active' && item.min === item.max && item.totalCount <= 1) return false;

          if (trendChannelSearch.value && trendChannelSearch.value.trim() !== '') {
            const q = trendChannelSearch.value.trim().toLowerCase();
            const matchKey = item.key.toLowerCase().includes(q);
            const matchLabel = item.label.toLowerCase().includes(q);
            return matchKey || matchLabel;
          }
          return true;
        });
      });

      // Dynamic list of trend fields available from active telemetry
      const availableTrendFields = computed(() => {
        const details = deviceDetails.value;
        if (!details) return [];
        if (rawDataFieldList.value && rawDataFieldList.value.length > 0) {
          return rawDataFieldList.value.map(f => ({ key: f.key, label: f.label }));
        }
        return [
          { key: 'com1', label: 'COM1 (Supply Voltage)' },
          { key: 'com2', label: 'COM2 (Operating Current)' },
          { key: 'p1', label: 'P1 (Event Code)' },
          { key: 'p2', label: 'P2 (Battery Voltage)' },
          { key: 'p4', label: 'P4 (Sensor Channel 1)' },
          { key: 'p5', label: 'P5 (Sensor Channel 2)' },
        ];
      });

      // Enhanced Oscilloscope Trend Chart with Grid System, Interval Ticks, and 15% Bound Cushion
      const selectedTrendChartData = computed(() => {
        const details = deviceDetails.value;
        if (!details) return null;
        const frames = details.telemetry || details.raw_telemetry || [];
        if (!Array.isArray(frames) || frames.length === 0) return null;

        let field = selectedTrendField.value;
        if (rawDataFieldList.value && rawDataFieldList.value.length > 0) {
          if (!rawDataFieldList.value.some(f => f.key === field)) {
            field = rawDataFieldList.value[0].key;
          }
        } else {
          if (!field) field = 'com1';
        }

        const allValidPoints = [];
        for (let i = 0; i < frames.length; i++) {
          const f = frames[i];
          const val = f[field];
          if (val !== null && val !== undefined && val !== '') {
            const num = Number(val);
            if (!isNaN(num)) {
              let tStr = '';
              const ep = f.epochtime ? Number(f.epochtime) : null;
              if (ep && !isNaN(ep)) {
                const d = new Date(ep < 1e11 ? ep * 1000 : ep);
                tStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : String(f.epochtime);
              } else if (f.timestamp) {
                const d = new Date(f.timestamp);
                tStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : String(f.timestamp);
              } else if (f.created_at) {
                const d = new Date(f.created_at);
                tStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : String(f.created_at);
              } else {
                tStr = 'Pkt #' + (i + 1);
              }
              allValidPoints.push({
                index: i + 1,
                val: num,
                timeStr: tStr,
                epochtime: f.epochtime || null,
              });
            }
          }
        }

        if (allValidPoints.length === 0) return null;

        let validPoints = allValidPoints;
        if (focusedChartZoom.value !== 'all' && Number(focusedChartZoom.value) > 0 && Number(focusedChartZoom.value) < allValidPoints.length) {
          validPoints = allValidPoints.slice(-Number(focusedChartZoom.value));
        }
        if (validPoints.length === 0) validPoints = allValidPoints;

        const vals = validPoints.map(p => p.val);
        const rawMin = Math.min(...vals);
        const rawMax = Math.max(...vals);
        const sum = vals.reduce((a, b) => a + b, 0);
        const rawAvg = Number((sum / vals.length).toFixed(2));
        const latestVal = vals[vals.length - 1];

        let delta = rawMax - rawMin;
        if (delta === 0) {
          delta = Math.abs(rawMax) === 0 ? 1 : Math.abs(rawMax) * 0.2;
        }

        const padding = delta * 0.15;
        const yMin = rawMin - padding;
        const yMax = rawMax + padding;
        const yRange = yMax - yMin;

        const svgW = 820;
        const svgH = 240;
        const padLeft = 70;
        const padRight = 20;
        const padTop = 20;
        const padBottom = 35;
        const plotW = svgW - padLeft - padRight;
        const plotH = svgH - padTop - padBottom;

        const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
          const y = Number((padTop + plotH - ratio * plotH).toFixed(1));
          const val = yMin + ratio * yRange;
          return {
            ratio,
            y,
            valFormatted: Number.isInteger(val) ? String(val) : val.toFixed(2),
          };
        });

        const numPoints = validPoints.length;
        const renderedPoints = validPoints.map((p, idx) => {
          const x = numPoints === 1 ? (padLeft + plotW / 2) : (padLeft + (idx / (numPoints - 1)) * plotW);
          const norm = (p.val - yMin) / yRange;
          const y = padTop + plotH - norm * plotH;
          return {
            x: Number(x.toFixed(1)),
            y: Number(y.toFixed(1)),
            val: p.val,
            valFormatted: formatStatNum(p.val),
            index: p.index,
            timeStr: p.timeStr,
            epochtime: p.epochtime,
          };
        });

        const polylineStr = renderedPoints.map(p => p.x + ',' + p.y).join(' ');
        const baseFloorY = (padTop + plotH).toFixed(1);
        const firstX = renderedPoints[0].x;
        const lastX = renderedPoints[renderedPoints.length - 1].x;
        const areaPolygonStr = firstX + ',' + baseFloorY + ' ' + polylineStr + ' ' + lastX + ',' + baseFloorY;

        const xTicks = [0, 1, 2, 3, 4].map(step => {
          const ratio = step / 4;
          const x = Number((padLeft + ratio * plotW).toFixed(1));
          const ptIdx = Math.min(Math.round(ratio * (numPoints - 1)), numPoints - 1);
          const label = renderedPoints[ptIdx]?.timeStr || ('Pkt #' + (ptIdx + 1));
          return {
            x,
            label,
          };
        });

        const avgNorm = (rawAvg - yMin) / yRange;
        const avgY = Number((padTop + plotH - avgNorm * plotH).toFixed(1));

        const matchedField = rawDataFieldList.value ? rawDataFieldList.value.find(f => f.key === field) : null;
        const label = matchedField ? matchedField.label : field.toUpperCase();
        const colors = matchedField ? matchedField.colors : { stroke: '#38bdf8', text: 'text-sky-400', badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20' };

        return {
          field,
          fieldObj: matchedField || { key: field, label, colors, allPoints: allValidPoints },
          label,
          rawMin,
          rawMax,
          rawAvg,
          latestVal,
          count: numPoints,
          totalPackets: allValidPoints.length,
          isZoomed: numPoints < allValidPoints.length,
          yTicks,
          xTicks,
          polylineStr,
          areaPolygonStr,
          renderedPoints,
          avgY,
          colors,
        };
      });

      // Comprehensive Waveform Inspector Data for Modal
      const inspectChartData = computed(() => {
        const f = inspectingField.value;
        if (!f) return null;
        const allPts = f.allPoints || [];
        if (allPts.length === 0) return null;

        let pts = allPts;
        if (inspectModalZoom.value !== 'all' && Number(inspectModalZoom.value) > 0 && Number(inspectModalZoom.value) < allPts.length) {
          pts = allPts.slice(-Number(inspectModalZoom.value));
        }
        if (pts.length === 0) pts = allPts;

        const vals = pts.map(p => p.val);
        const rawMin = Math.min(...vals);
        const rawMax = Math.max(...vals);
        const sum = vals.reduce((a, b) => a + b, 0);
        const rawAvg = Number((sum / vals.length).toFixed(2));
        const latestVal = vals[vals.length - 1];
        const span = Number((rawMax - rawMin).toFixed(2));

        const sorted = [...vals].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));

        const variance = vals.reduce((acc, v) => acc + Math.pow(v - rawAvg, 2), 0) / vals.length;
        const stdDev = Number(Math.sqrt(variance).toFixed(2));

        let delta = rawMax - rawMin;
        if (delta === 0) delta = Math.abs(rawMax) === 0 ? 1 : Math.abs(rawMax) * 0.2;
        const pad = delta * 0.15;
        const yMin = rawMin - pad;
        const yMax = rawMax + pad;
        const yRange = yMax - yMin;

        const svgW = 900;
        const svgH = 260;
        const padLeft = 70;
        const padRight = 25;
        const padTop = 20;
        const padBottom = 35;
        const plotW = svgW - padLeft - padRight;
        const plotH = svgH - padTop - padBottom;

        const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
          const y = Number((padTop + plotH - ratio * plotH).toFixed(1));
          const val = yMin + ratio * yRange;
          return { ratio, y, valFormatted: Number.isInteger(val) ? String(val) : val.toFixed(2) };
        });

        const numPoints = pts.length;
        const renderedPoints = pts.map((p, idx) => {
          const x = numPoints === 1 ? (padLeft + plotW / 2) : (padLeft + (idx / (numPoints - 1)) * plotW);
          const norm = (p.val - yMin) / yRange;
          const y = padTop + plotH - norm * plotH;
          const diffFromAvg = Number((p.val - rawAvg).toFixed(2));
          return {
            x: Number(x.toFixed(1)),
            y: Number(y.toFixed(1)),
            val: p.val,
            valFormatted: formatStatNum(p.val),
            index: p.index,
            timeStr: p.timeStr,
            epochtime: p.epochtime,
            diffFromAvg,
            status: p.val === rawMax ? 'Peak Max' : (p.val === rawMin ? 'Peak Min' : (diffFromAvg >= 0 ? 'Above Mean' : 'Below Mean')),
          };
        });

        const polylineStr = renderedPoints.map(p => p.x + ',' + p.y).join(' ');
        const baseFloorY = (padTop + plotH).toFixed(1);
        const firstX = renderedPoints[0].x;
        const lastX = renderedPoints[renderedPoints.length - 1].x;
        const areaPolygonStr = firstX + ',' + baseFloorY + ' ' + polylineStr + ' ' + lastX + ',' + baseFloorY;

        const avgNorm = (rawAvg - yMin) / yRange;
        const avgY = Number((padTop + plotH - avgNorm * plotH).toFixed(1));

        const xTicks = [0, 1, 2, 3, 4].map(step => {
          const ratio = step / 4;
          const x = Number((padLeft + ratio * plotW).toFixed(1));
          const ptIdx = Math.min(Math.round(ratio * (numPoints - 1)), numPoints - 1);
          const label = renderedPoints[ptIdx]?.timeStr || ('Pkt #' + (ptIdx + 1));
          return { x, label };
        });

        let tablePoints = renderedPoints;
        if (inspectModalSearch.value && inspectModalSearch.value.trim() !== '') {
          const q = inspectModalSearch.value.trim().toLowerCase();
          tablePoints = renderedPoints.filter(p => 
            String(p.index).includes(q) ||
            p.timeStr.toLowerCase().includes(q) ||
            String(p.val).includes(q) ||
            p.status.toLowerCase().includes(q)
          );
        }

        return {
          field: f,
          key: f.key,
          label: f.label,
          colors: f.colors,
          rawMin,
          rawMax,
          rawAvg,
          median,
          stdDev,
          span,
          latestVal,
          count: pts.length,
          totalCount: allPts.length,
          isZoomed: pts.length < allPts.length,
          yTicks,
          xTicks,
          avgY,
          polylineStr,
          areaPolygonStr,
          renderedPoints,
          tablePoints,
        };
      });

      const onInspectChartMouseMove = (event) => {
        const chart = inspectChartData.value;
        if (!chart || !chart.renderedPoints || chart.renderedPoints.length === 0) return;
        const svgEl = event.currentTarget.querySelector ? (event.currentTarget.querySelector('svg') || event.currentTarget) : event.currentTarget;
        const rect = svgEl.getBoundingClientRect();
        if (!rect.width) return;
        const mouseX = ((event.clientX - rect.left) / rect.width) * 900;

        let closest = chart.renderedPoints[0];
        let minDiff = Math.abs(closest.x - mouseX);
        for (let i = 1; i < chart.renderedPoints.length; i++) {
          const pt = chart.renderedPoints[i];
          const diff = Math.abs(pt.x - mouseX);
          if (diff < minDiff) {
            minDiff = diff;
            closest = pt;
          }
        }
        const delta = Number((closest.val - chart.rawAvg).toFixed(2));
        const isAbove = delta >= 0;
        inspectHoverPoint.value = {
          ...closest,
          deltaFromAvg: delta,
          isAboveAvg: isAbove,
          deltaFormatted: (isAbove ? '+' : '') + delta,
        };
      };

      const onInspectChartMouseLeave = () => {
        inspectHoverPoint.value = null;
      };

      const exportInspectModalCsv = () => {
        const data = inspectChartData.value;
        if (!data) return;
        exportFieldCsv(data.field);
      };

      const copyInspectModalData = () => {
        const data = inspectChartData.value;
        if (!data) return;
        const lines = [
          'Channel: ' + data.key.toUpperCase() + ' - ' + data.label,
          'Min: ' + data.rawMin + ' | Max: ' + data.rawMax + ' | Avg: ' + data.rawAvg + ' | Span: ' + data.span + ' | StdDev: ' + data.stdDev + ' | Latest: ' + data.latestVal,
          'Packets: ' + data.count + ' / ' + data.totalCount,
          '\nPacket Log:',
          'Index\tTimestamp\tValue\tDiff_Avg\tStatus',
          ...data.tablePoints.map(p => p.index + '\t' + p.timeStr + '\t' + p.val + '\t' + p.diffFromAvg + '\t' + p.status),
        ];
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(lines.join('\n'));
          if (typeof showToast === 'function') showToast('Copied inspection data table to clipboard', 'success');
        }
      };

      return {
        traceViewMode,
        testResultsList,
        loadingTestResults,
        isSeedingTraceData,
        traceFilters,
        activeTestIdInput,
        loadingDeviceDetails,
        deviceDetails,
        rawDataFieldList,
        filteredRawDataFieldList,
        cardZoomMap,
        cardSettingMap,
        cardHoverMap,
        globalCardZoom,
        globalCardArea,
        globalCardAvg,
        globalCardDots,
        globalCardGrid,
        trendChannelSearch,
        trendCategoryFilter,
        focusedChartZoom,
        focusedShowArea,
        focusedShowAvg,
        focusedShowDots,
        focusedShowGrid,
        focusedShowPeaks,
        focusedHoverPoint,
        showFieldInspectModal,
        inspectingField,
        inspectModalZoom,
        inspectModalSearch,
        inspectModalPage,
        inspectShowArea,
        inspectShowAvg,
        inspectShowGrid,
        inspectShowDots,
        inspectHoverPoint,
        inspectChartData,
        setCardZoom,
        getCardSetting,
        toggleCardSetting,
        setGlobalCardZoom,
        toggleGlobalCardArea,
        toggleGlobalCardAvg,
        toggleGlobalCardDots,
        toggleGlobalCardGrid,
        onCardChartMouseMove,
        onCardChartMouseLeave,
        focusChannel,
        openFieldInspectModal,
        closeFieldInspectModal,
        exportFieldCsv,
        copyFieldStats,
        onFocusedChartMouseMove,
        onFocusedChartMouseLeave,
        setFocusedChartZoom,
        focusedZoomStep,
        onInspectChartMouseMove,
        onInspectChartMouseLeave,
        exportInspectModalCsv,
        copyInspectModalData,
        selectedTrendField,
        availableTrendFields,
        selectedTrendChartData,
        showDecodedConfigModal,
        activeDecodedItem,
        activeDecodedRegisters,
        testResultsSummary,
        trendChartPoints,
        fetchTestResults,
        resetTraceFilters,
        seedSampleTraceData,
        inspectDeviceTest,
        loadDeviceDetails,
        openDecodedConfigModal,
        isTestPassed,
        formatDateTime,
        formatStatNum,
      };
    }
`;
