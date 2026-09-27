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
                      <th class="py-3 px-3">Test Time</th>
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
                        {{ formatDateTime(item.test_time) }}
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
                    <div class="text-[10px] uppercase font-bold text-slate-500">Time Finish</div>
                    <div class="text-slate-400 mt-0.5 text-[11px]">{{ formatDateTime(deviceDetails.test_result?.time_finish) }}</div>
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

                <!-- B1. raw_data3 Telemetry Statistics (Min / Avg / Max) -->
                <div v-if="rawDataFieldList && rawDataFieldList.length > 0" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div class="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                    <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-chart-simple text-emerald-400"></i>
                      <span>Raw Data 3 Field Telemetry Statistics (Min / Avg / Max)</span>
                    </span>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {{ rawDataFieldList.length }} Active Fields
                    </span>
                  </div>

                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                        <tr>
                          <th class="py-2 px-2.5">Field</th>
                          <th class="py-2 px-2.5">Data Channel</th>
                          <th class="py-2 px-2.5 text-right">Min</th>
                          <th class="py-2 px-2.5 text-right text-emerald-400 font-bold">Average</th>
                          <th class="py-2 px-2.5 text-right">Max</th>
                          <th class="py-2 px-2.5 text-right text-cyan-300 font-bold">Latest</th>
                          <th class="py-2 px-2.5 text-right text-slate-400">Samples</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr v-for="item in rawDataFieldList" :key="item.key" class="hover:bg-slate-900/50 transition">
                          <td class="py-1.5 px-2.5 font-bold uppercase" :class="item.colors.text">{{ item.key }}</td>
                          <td class="py-1.5 px-2.5 text-slate-200 font-medium">{{ item.label }}</td>
                          <td class="py-1.5 px-2.5 text-right text-cyan-300">{{ formatStatNum(item.min) }}</td>
                          <td class="py-1.5 px-2.5 text-right text-emerald-400 font-extrabold">{{ formatStatNum(item.avg) }}</td>
                          <td class="py-1.5 px-2.5 text-right text-amber-300">{{ formatStatNum(item.max) }}</td>
                          <td class="py-1.5 px-2.5 text-right text-white font-bold">{{ formatStatNum(item.latest) }}</td>
                          <td class="py-1.5 px-2.5 text-right text-slate-400 font-mono">{{ item.count }} pkts</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- B2. Trend Graphs for Each Field Data in raw_data3 -->
                <div v-if="rawDataFieldList && rawDataFieldList.length > 0" class="space-y-2">
                  <div class="flex items-center justify-between px-1">
                    <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-chart-line text-sky-400"></i>
                      <span>Field Data Trends (raw_data3 Timeline Series)</span>
                    </span>
                    <span class="text-[10px] font-mono text-slate-500">
                      {{ rawDataFieldList.length }} Graphs • X: Timestamp / Packets • Y: Data Value
                    </span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    <div
                      v-for="field in rawDataFieldList"
                      :key="field.key"
                      class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 hover:border-slate-700 transition flex flex-col justify-between"
                    >
                      <!-- Header of Field Trend Card -->
                      <div class="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div class="min-w-0">
                          <div class="flex items-center gap-1.5">
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-black border" :class="field.colors.badge">
                              {{ field.key.toUpperCase() }}
                            </span>
                            <span class="text-xs font-bold text-slate-200 truncate" :title="field.label">
                              {{ field.label }}
                            </span>
                          </div>
                        </div>
                        <div class="text-right shrink-0">
                          <span class="text-xs font-black font-mono text-white block">{{ formatStatNum(field.latest) }}</span>
                          <span class="text-[9px] text-slate-500 font-mono">{{ field.count }} pkts</span>
                        </div>
                      </div>

                      <!-- Mini Stats Metrics Row -->
                      <div class="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] py-1 bg-slate-900/60 rounded-lg border border-slate-800/60">
                        <div>
                          <span class="text-slate-500 block text-[9px] uppercase">Min</span>
                          <span class="text-cyan-300 font-bold">{{ formatStatNum(field.min) }}</span>
                        </div>
                        <div>
                          <span class="text-slate-500 block text-[9px] uppercase">Avg</span>
                          <span class="text-emerald-400 font-extrabold">{{ formatStatNum(field.avg) }}</span>
                        </div>
                        <div>
                          <span class="text-slate-500 block text-[9px] uppercase">Max</span>
                          <span class="text-amber-300 font-bold">{{ formatStatNum(field.max) }}</span>
                        </div>
                      </div>

                      <!-- Trend Graph (SVG) -->
                      <div class="w-full bg-slate-900/80 rounded-lg p-1.5 border border-slate-800 relative">
                        <!-- Y-axis guide labels on chart -->
                        <div class="absolute right-2 top-1 text-[8px] font-mono text-slate-500 pointer-events-none">Max: {{ formatStatNum(field.max) }}</div>
                        <div class="absolute right-2 bottom-6 text-[8px] font-mono text-slate-500 pointer-events-none">Min: {{ formatStatNum(field.min) }}</div>

                        <svg class="w-full h-24 overflow-visible" viewBox="0 0 320 88" preserveAspectRatio="none">
                          <defs>
                            <linearGradient :id="'grad-cp-' + field.key" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" :stop-color="field.colors.stroke" stop-opacity="0.25" />
                              <stop offset="100%" :stop-color="field.colors.stroke" stop-opacity="0.01" />
                            </linearGradient>
                          </defs>

                          <!-- Average Reference Dashed Line -->
                          <line
                            x1="14"
                            :y1="field.avgY"
                            x2="306"
                            :y2="field.avgY"
                            stroke="rgba(255,255,255,0.18)"
                            stroke-width="1"
                            stroke-dasharray="3,3"
                          />

                          <!-- Shaded Area Below Trend Line -->
                          <polygon
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

                          <!-- Interactive Data Points with Tooltip -->
                          <circle
                            v-for="p in field.renderedPoints"
                            :key="p.index"
                            :cx="p.x"
                            :cy="p.y"
                            r="3"
                            :fill="field.colors.stroke"
                            stroke="#0f172a"
                            stroke-width="1.5"
                            class="cursor-pointer hover:r-5 transition-all"
                          >
                            <title>Packet #{{ p.index }} | Time: {{ p.timeStr }} | Value: {{ p.val }}</title>
                          </circle>
                        </svg>

                        <!-- X-axis Timeline Labels (Start -> Finish) -->
                        <div class="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-800/80 px-1">
                          <span class="truncate max-w-[120px]" :title="field.startTime"><i class="fa-regular fa-clock text-[8px] mr-0.5"></i>{{ field.startTime }}</span>
                          <span class="text-slate-400 font-bold">{{ field.count }} pkts</span>
                          <span class="truncate max-w-[120px] text-right" :title="field.endTime">{{ field.endTime }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Parameters Tables Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <!-- General Info -->
                  <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-bolt text-amber-400"></i> General Information (COM1, COM2, P1..P3)
                      </span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th class="py-2 px-2.5">Field</th>
                            <th class="py-2 px-2.5 text-right">Min</th>
                            <th class="py-2 px-2.5 text-right">Max</th>
                            <th class="py-2 px-2.5 text-right text-emerald-400 font-bold">Average</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr v-for="row in deviceDetails.general_info" :key="row.field" class="hover:bg-slate-900/40">
                            <td class="py-1.5 px-2.5 font-semibold text-slate-200">{{ row.label }}</td>
                            <td class="py-1.5 px-2.5 text-right text-slate-300">{{ formatStatNum(row.min) }}</td>
                            <td class="py-1.5 px-2.5 text-right text-slate-300">{{ formatStatNum(row.max) }}</td>
                            <td class="py-1.5 px-2.5 text-right text-emerald-400 font-bold">{{ formatStatNum(row.avg) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Parameters 1 -->
                  <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-gauge text-cyan-400"></i> Parameters 1 (P4 .. P11 Primary Sensors)
                      </span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th class="py-2 px-2.5">Field</th>
                            <th class="py-2 px-2.5 text-right">Min</th>
                            <th class="py-2 px-2.5 text-right">Max</th>
                            <th class="py-2 px-2.5 text-right text-cyan-300 font-bold">Average</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr v-for="row in deviceDetails.params_1" :key="row.field" class="hover:bg-slate-900/40">
                            <td class="py-1.5 px-2.5 font-semibold text-slate-200">{{ row.label }}</td>
                            <td class="py-1.5 px-2.5 text-right text-slate-300">{{ formatStatNum(row.min) }}</td>
                            <td class="py-1.5 px-2.5 text-right text-slate-300">{{ formatStatNum(row.max) }}</td>
                            <td class="py-1.5 px-2.5 text-right text-cyan-300 font-bold">{{ formatStatNum(row.avg) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Parameters 2 -->
                  <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-wave-square text-sky-400"></i> Parameters 2 (P12 .. P19 Secondary Telemetry)
                      </span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th class="py-2 px-2.5">Field</th>
                            <th class="py-2 px-2.5 text-right">Min</th>
                            <th class="py-2 px-2.5 text-right">Max</th>
                            <th class="py-2 px-2.5 text-right text-sky-300 font-bold">Average</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr v-for="row in deviceDetails.params_2" :key="row.field" class="hover:bg-slate-900/40">
                            <td class="py-1.5 px-2.5 font-semibold text-slate-200">{{ row.label }}</td>
                            <td class="py-1.5 px-2.5 text-right text-slate-300">{{ formatStatNum(row.min) }}</td>
                            <td class="py-1.5 px-2.5 text-right text-slate-300">{{ formatStatNum(row.max) }}</td>
                            <td class="py-1.5 px-2.5 text-right text-sky-300 font-bold">{{ formatStatNum(row.avg) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Parameters 3 & 4 -->
                  <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-cubes text-purple-400"></i> Parameters 3 & 4 (P20 .. P35 Auxiliary Slots)
                      </span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th class="py-2 px-2.5">Field</th>
                            <th class="py-2 px-2.5 text-right">Min</th>
                            <th class="py-2 px-2.5 text-right">Max</th>
                            <th class="py-2 px-2.5 text-right text-purple-300 font-bold">Average</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr v-for="row in ((deviceDetails.params_3 || []).concat(deviceDetails.params_4 || []))" :key="row.field" class="hover:bg-slate-900/40">
                            <td class="py-1.5 px-2.5 font-semibold text-slate-200">{{ row.label }}</td>
                            <td class="py-1.5 px-2.5 text-right text-slate-300">{{ formatStatNum(row.min) }}</td>
                            <td class="py-1.5 px-2.5 text-right text-slate-300">{{ formatStatNum(row.max) }}</td>
                            <td class="py-1.5 px-2.5 text-right text-purple-300 font-bold">{{ formatStatNum(row.avg) }}</td>
                          </tr>
                        </tbody>
                      </table>
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
              <div class="glass-card rounded-xl p-5 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 bg-slate-900/60">
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

              <!-- Statistical Tables Grid (General Info & Sensor Params 1-4) -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <!-- General Info (COM1, COM2, P1, P2, P3) -->
                <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                  <div class="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-bolt text-amber-400"></i> General Information (COM1, COM2, P1..P3)
                    </span>
                    <span class="text-[10px] font-mono text-slate-500">Power & Headers</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th class="py-2.5 px-3">Field</th>
                          <th class="py-2.5 px-3 text-right">Min</th>
                          <th class="py-2.5 px-3 text-right">Max</th>
                          <th class="py-2.5 px-3 text-right text-emerald-400 font-bold">Average</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr v-for="row in deviceDetails.general_info" :key="row.field" class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 text-white font-semibold">{{ row.label }}</td>
                          <td class="py-2 px-3 text-right text-slate-300">{{ formatStatNum(row.min) }}</td>
                          <td class="py-2 px-3 text-right text-slate-300">{{ formatStatNum(row.max) }}</td>
                          <td class="py-2 px-3 text-right text-emerald-400 font-bold">{{ formatStatNum(row.avg) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Parameters 1 (P4..P11) -->
                <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                  <div class="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-gauge text-cyan-400"></i> Parameters 1 (P4 .. P11)
                    </span>
                    <span class="text-[10px] font-mono text-cyan-400">Primary Sensors</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th class="py-2.5 px-3">Field</th>
                          <th class="py-2.5 px-3 text-right">Min</th>
                          <th class="py-2.5 px-3 text-right">Max</th>
                          <th class="py-2.5 px-3 text-right text-cyan-300 font-bold">Average</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr v-for="row in deviceDetails.params_1" :key="row.field" class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 text-white font-semibold">{{ row.label }}</td>
                          <td class="py-2 px-3 text-right text-slate-300">{{ formatStatNum(row.min) }}</td>
                          <td class="py-2 px-3 text-right text-slate-300">{{ formatStatNum(row.max) }}</td>
                          <td class="py-2 px-3 text-right text-cyan-300 font-bold">{{ formatStatNum(row.avg) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Parameters 2 (P12..P19) -->
                <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                  <div class="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-wave-square text-sky-400"></i> Parameters 2 (P12 .. P19)
                    </span>
                    <span class="text-[10px] font-mono text-sky-400">Secondary Telemetry</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th class="py-2.5 px-3">Field</th>
                          <th class="py-2.5 px-3 text-right">Min</th>
                          <th class="py-2.5 px-3 text-right">Max</th>
                          <th class="py-2.5 px-3 text-right text-sky-300 font-bold">Average</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr v-for="row in deviceDetails.params_2" :key="row.field" class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 text-white font-semibold">{{ row.label }}</td>
                          <td class="py-2 px-3 text-right text-slate-300">{{ formatStatNum(row.min) }}</td>
                          <td class="py-2 px-3 text-right text-slate-300">{{ formatStatNum(row.max) }}</td>
                          <td class="py-2 px-3 text-right text-sky-300 font-bold">{{ formatStatNum(row.avg) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Parameters 3 & 4 (P20..P35) -->
                <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
                  <div class="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <i class="fa-solid fa-cubes text-purple-400"></i> Parameters 3 & 4 (P20 .. P35)
                    </span>
                    <span class="text-[10px] font-mono text-purple-400">Auxiliary Slots</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead class="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th class="py-2.5 px-3">Field</th>
                          <th class="py-2.5 px-3 text-right">Min</th>
                          <th class="py-2.5 px-3 text-right">Max</th>
                          <th class="py-2.5 px-3 text-right text-purple-300 font-bold">Average</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-[11px]">
                        <tr v-for="row in [...deviceDetails.params_3, ...deviceDetails.params_4].filter(r => r.count > 0)" :key="row.field" class="hover:bg-slate-800/20">
                          <td class="py-2 px-3 text-white font-semibold">{{ row.label }}</td>
                          <td class="py-2 px-3 text-right text-slate-300">{{ formatStatNum(row.min) }}</td>
                          <td class="py-2 px-3 text-right text-slate-300">{{ formatStatNum(row.max) }}</td>
                          <td class="py-2 px-3 text-right text-purple-300 font-bold">{{ formatStatNum(row.avg) }}</td>
                        </tr>
                        <tr v-if="[...deviceDetails.params_3, ...deviceDetails.params_4].filter(r => r.count > 0).length === 0">
                          <td colspan="4" class="py-4 text-center text-slate-500 font-sans">No auxiliary telemetry frames recorded.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Interactive Telemetry Trend Charts & Telemetry Stream -->
              <div class="glass-card rounded-xl border border-slate-800 p-4 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <i class="fa-solid fa-chart-line text-emerald-400"></i> Telemetry Trend Visualizer (Raw Data 3)
                  </span>
                  <div class="flex items-center gap-2">
                    <select
                      v-model="selectedTrendField"
                      class="px-2.5 py-1 bg-slate-950/80 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      <option value="com1">COM1 (Supply Voltage)</option>
                      <option value="com2">COM2 (Operating Current)</option>
                      <option value="p4">P4 (Temperature / Value 1)</option>
                      <option value="p5">P5 (Humidity / Value 2)</option>
                      <option value="p6">P6 (Diagnostic / Value 3)</option>
                      <option value="p7">P7 (Value 4)</option>
                    </select>
                  </div>
                </div>

                <!-- SVG Trend Chart Visualization -->
                <div class="w-full h-48 bg-slate-950/80 rounded-xl border border-slate-800 p-2 relative overflow-hidden flex flex-col justify-end">
                  <svg v-if="trendChartPoints.length > 1" class="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      stroke-width="2"
                      :points="trendChartPoints"
                    />
                  </svg>
                  <div v-else class="h-full flex items-center justify-center text-slate-500 text-xs">
                    Insufficient data points for trend chart.
                  </div>
                  <!-- Axis Labels -->
                  <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 px-2 pt-1 border-t border-slate-900">
                    <span>Frame 1 (Start)</span>
                    <span class="text-emerald-400 font-bold">Field: {{ selectedTrendField.toUpperCase() }}</span>
                    <span>Frame {{ deviceDetails.telemetry?.length || 0 }} (End)</span>
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
        if (!val) return '—';
        try {
          const d = new Date(val);
          if (isNaN(d.getTime())) return String(val);
          return d.toISOString().replace('T', ' ').substring(0, 19);
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
          const validPoints = [];
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const val = frame[key];
            if (val !== null && val !== undefined && val !== '') {
              const num = Number(val);
              if (!isNaN(num)) {
                let tStr = '';
                if (frame.epochtime) {
                  const d = new Date(Number(frame.epochtime) * 1000);
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
                validPoints.push({
                  index: i + 1,
                  val: num,
                  timeStr: tStr,
                });
              }
            }
          }

          // CRUCIAL RULE: If field is null or has no data, skip it!
          if (validPoints.length === 0) {
            continue;
          }

          const numValues = validPoints.map(p => p.val);
          const minVal = Math.min(...numValues);
          const maxVal = Math.max(...numValues);
          const sum = numValues.reduce((acc, v) => acc + v, 0);
          const avgVal = Number((sum / numValues.length).toFixed(2));
          const latestVal = numValues[numValues.length - 1];
          const count = numValues.length;

          // SVG Trend Graph Coordinates
          const svgW = 320;
          const svgH = 88;
          const padX = 14;
          const padTop = 10;
          const padBottom = 16;
          const plotW = svgW - 2 * padX;
          const plotH = svgH - padTop - padBottom;
          const range = maxVal === minVal ? 1 : (maxVal - minVal);

          const renderedPoints = validPoints.map((p, idx) => {
            const x = validPoints.length === 1
              ? (svgW / 2)
              : (padX + (idx / (validPoints.length - 1)) * plotW);
            const y = maxVal === minVal
              ? (padTop + plotH / 2)
              : (padTop + plotH - ((p.val - minVal) / range) * plotH);
            return {
              x: Number(x.toFixed(1)),
              y: Number(y.toFixed(1)),
              val: p.val,
              timeStr: p.timeStr,
              index: p.index,
            };
          });

          const polylineStr = renderedPoints.map(p => p.x + ',' + p.y).join(' ');
          const firstX = renderedPoints[0].x;
          const lastX = renderedPoints[renderedPoints.length - 1].x;
          const baseFloorY = (svgH - padBottom).toFixed(1);
          const areaPolygonStr = firstX + ',' + baseFloorY + ' ' + polylineStr + ' ' + lastX + ',' + baseFloorY;

          const avgY = maxVal === minVal
            ? Number((padTop + plotH / 2).toFixed(1))
            : Number((padTop + plotH - ((avgVal - minVal) / range) * plotH).toFixed(1));

          const customLabel = details.calculations?.[key]?.label || details.calculations?.[key]?.name;
          const displayLabel = customLabel || labelsMap[key] || key.toUpperCase();
          const colors = colorAccents[key] || defaultColor;

          result.push({
            key,
            label: displayLabel,
            min: minVal,
            avg: avgVal,
            max: maxVal,
            latest: latestVal,
            count,
            startTime: validPoints[0].timeStr,
            endTime: validPoints[validPoints.length - 1].timeStr,
            polylineStr,
            areaPolygonStr,
            renderedPoints,
            avgY,
            colors,
          });
        }

        return result;
      });

      // SVG Trend Chart points calculation
      const trendChartPoints = computed(() => {
        if (!deviceDetails.value || !deviceDetails.value.telemetry || deviceDetails.value.telemetry.length < 2) {
          return '';
        }
        const field = selectedTrendField.value;
        const frames = deviceDetails.value.telemetry;
        const values = frames.map(f => Number(f[field]) || 0);

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max === min ? 1 : (max - min);

        const width = 500;
        const height = 100;
        const step = width / (frames.length - 1);

        return values.map((val, idx) => {
          const x = (idx * step).toFixed(1);
          const y = (height - ((val - min) / range) * (height - 10) - 5).toFixed(1);
          return x + ',' + y;
        }).join(' ');
      });

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
        selectedTrendField,
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
