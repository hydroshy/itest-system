"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACEABILITY_SCRIPT = exports.TRACEABILITY_MODALS = exports.TRACEABILITY_TEMPLATE = void 0;
exports.TRACEABILITY_TEMPLATE = `          <div v-else-if="activeFeature.id === 'traceability' || activeFeature.id === 'product-traceability'" class="space-y-6">

            <!-- 1. TOP HEADER & DATABASE STATS BAR -->
            <div class="glass-card rounded-2xl p-5 border border-purple-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div class="flex items-center gap-3.5">
                <button @click="returnToHome" title="Back to Dashboard" class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition">
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl shadow-inner">
                  <i class="fa-solid fa-fingerprint"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-base font-extrabold text-white tracking-wide">PRODUCT TRACEABILITY WORKBENCH</h2>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      POSTGRESQL dvt
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      ISO 9001 QA
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      FLOW 0 & 1
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">
                    End-to-end device audit trail: QA test verification (<strong class="font-mono text-purple-300">test_result</strong>) and historical telemetry frames (<strong class="font-mono text-purple-300">raw_data3</strong>).
                  </p>
                </div>
              </div>

              <!-- Action Controls -->
              <div class="flex items-center gap-2 flex-wrap">
                <button
                  @click="seedSampleTraceData"
                  :disabled="isSeedingTraceData"
                  class="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  title="Seed sample baseline test results for testing"
                >
                  <i :class="isSeedingTraceData ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-database'"></i>
                  <span>Seed Baseline</span>
                </button>
                <button
                  @click="exportTraceabilityCsv"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  title="Export filtered records to CSV"
                >
                  <i class="fa-solid fa-file-csv text-emerald-400"></i>
                  <span>Export CSV</span>
                </button>
                <button
                  @click="fetchTestResults"
                  :disabled="traceLoading"
                  class="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Refresh data"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': traceLoading }"></i>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <!-- 2. NAVIGATION CARDS / TABS (THẺ ĐIỀU HƯỚNG) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <!-- Tab 1 Card: test_result -->
              <div
                @click="activeTraceTab = 'test_results'"
                :class="activeTraceTab === 'test_results'
                  ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'"
                class="glass-card rounded-2xl p-4 border cursor-pointer transition-all duration-200 flex items-start gap-3.5 group"
              >
                <div
                  :class="activeTraceTab === 'test_results' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:text-slate-200'"
                  class="w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 transition"
                >
                  <i class="fa-solid fa-clipboard-check"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-white truncate">1. Test Results QA</h3>
                    <span
                      :class="activeTraceTab === 'test_results' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0"
                    >
                      test_result
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1 line-clamp-1">Multi-criteria query by SO, SN, Item Code & QA Verdict</p>
                  <div class="mt-2 flex items-center gap-2 text-[10px] font-mono text-emerald-400 font-bold">
                    <span>{{ traceMetrics.totalTests || traceResults.length }} Records</span>
                    <span class="text-slate-600">•</span>
                    <span>{{ traceMetrics.passRate }}% Pass Rate</span>
                  </div>
                </div>
              </div>

              <!-- Tab 2 Card: raw_data3 -->
              <div
                @click="activeTraceTab = 'telemetry'"
                :class="activeTraceTab === 'telemetry'
                  ? 'border-sky-500/50 bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'"
                class="glass-card rounded-2xl p-4 border cursor-pointer transition-all duration-200 flex items-start gap-3.5 group"
              >
                <div
                  :class="activeTraceTab === 'telemetry' ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:text-slate-200'"
                  class="w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 transition"
                >
                  <i class="fa-solid fa-satellite-dish"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-white truncate">2. Telemetry Inspector</h3>
                    <span
                      :class="activeTraceTab === 'telemetry' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0"
                    >
                      raw_data3
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1 line-clamp-1">Deep-dive uplink telemetry packets, RSSI/SNR & sensor calculations</p>
                  <div class="mt-2 flex items-center gap-2 text-[10px] font-mono text-sky-400 font-bold">
                    <span>1,713,781+ Frames</span>
                    <span class="text-slate-600">•</span>
                    <span>Min/Max/Avg Stats</span>
                  </div>
                </div>
              </div>

              <!-- Tab 3 Card: lifecycle -->
              <div
                @click="activeTraceTab = 'lifecycle'"
                :class="activeTraceTab === 'lifecycle'
                  ? 'border-purple-500/50 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'"
                class="glass-card rounded-2xl p-4 border cursor-pointer transition-all duration-200 flex items-start gap-3.5 group"
              >
                <div
                  :class="activeTraceTab === 'lifecycle' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:text-slate-200'"
                  class="w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 transition"
                >
                  <i class="fa-solid fa-timeline"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-white truncate">3. Serialization Lifecycle</h3>
                    <span
                      :class="activeTraceTab === 'lifecycle' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0"
                    >
                      Audit Trail
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1 line-clamp-1">End-to-end device timeline: Flash -> SO -> QA -> NS -> Live Telemetry</p>
                  <div class="mt-2 flex items-center gap-2 text-[10px] font-mono text-purple-400 font-bold">
                    <span>5 Stage History</span>
                    <span class="text-slate-600">•</span>
                    <span>Birth Certificate</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ======================================================== -->
            <!-- 3. TAB CONTENT 1: TEST RESULTS CATALOG (test_result)     -->
            <!-- ======================================================== -->
            <div v-show="activeTraceTab === 'test_results'" class="space-y-5 animate-in fade-in">
              <!-- Multi-Criteria Dropdown Filter Panel (SO / SN / Item Code / SKU) - PLACED AT TOP -->
              <div class="glass-card rounded-2xl p-4 border border-slate-800/80 space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <i class="fa-solid fa-filter text-purple-400"></i> Multi-Criteria Filter (SO / SN / Item Code / SKU)
                  </span>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="resetTraceFilters"
                      class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                    >
                      <i class="fa-solid fa-arrow-rotate-left text-[10px]"></i>
                      <span>Clear</span>
                    </button>
                    <button
                      type="button"
                      @click="applyTraceFilter"
                      :disabled="traceLoading"
                      class="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 cursor-pointer transition flex items-center gap-1.5"
                    >
                      <i :class="traceLoading ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-magnifying-glass'"></i>
                      <span>Filter Results</span>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                  <!-- 1. Dropdown Chọn Mục Filter (SO / SN / Item Code / SKU) -->
                  <div class="md:col-span-4">
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Filter Field</label>
                    <select
                      v-model="traceFilterTarget"
                      @change="onFilterTargetChange"
                      class="w-full px-3 py-2 bg-slate-950/90 border border-purple-500/40 rounded-xl text-xs text-white font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                    >
                      <option value="soNumber">Sales Order (SO Number)</option>
                      <option value="serialNumber">Serial Number (SN)</option>
                      <option value="itemCode">Item Code</option>
                      <option value="sku">Product SKU</option>
                    </select>
                  </div>

                  <!-- 2. Ô Search Value tương ứng với mục đã chọn -->
                  <div class="md:col-span-8">
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      <span>Search Value: </span>
                      <span class="text-purple-300 font-mono">{{ getFilterTargetLabel() }}</span>
                    </label>
                    <div class="relative">
                      <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                      <input
                        type="text"
                        v-model="traceFilterValue"
                        @keyup.enter="applyTraceFilter"
                        :placeholder="getFilterPlaceholder()"
                        class="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- KPI Summary Counters -->
              <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 font-mono">
                <div class="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Tests</div>
                  <div class="text-xl font-extrabold text-white mt-1">{{ traceMetrics.totalTests || traceResults.length }}</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">PostgreSQL test_result</div>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <div class="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                    <i class="fa-solid fa-circle-check text-xs"></i> Passed QA
                  </div>
                  <div class="text-xl font-extrabold text-emerald-400 mt-1">{{ traceMetrics.passCount || 0 }}</div>
                  <div class="text-[10px] text-emerald-500/80 mt-0.5">Verified Standard</div>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <div class="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                    <i class="fa-solid fa-triangle-exclamation text-xs"></i> Failed QA
                  </div>
                  <div class="text-xl font-extrabold text-rose-400 mt-1">{{ traceMetrics.failCount || 0 }}</div>
                  <div class="text-[10px] text-rose-500/80 mt-0.5">Defects Caught</div>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <div class="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Pass Rate</div>
                  <div class="text-xl font-extrabold text-cyan-300 mt-1">{{ traceMetrics.passRate || 0 }}%</div>
                  <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div class="bg-cyan-500 h-full rounded-full transition-all duration-300" :style="{ width: (traceMetrics.passRate || 0) + '%' }"></div>
                  </div>
                </div>
                <div class="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl col-span-2 sm:col-span-1">
                  <div class="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Avg Duration</div>
                  <div class="text-xl font-extrabold text-purple-300 mt-1">{{ formatDuration(traceMetrics.avgDurationSeconds) }}</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">Execution Speed</div>
                </div>
              </div>

              <!-- 1. Master Tabulator Table: Tested Devices Catalog (Click row to inspect test parameters below) -->
              <div class="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div class="p-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-table-list text-purple-400"></i>
                      <span>Tested Devices Catalog (Click row to inspect test parameters below)</span>
                    </span>
                    <span v-if="selectedSoNumber" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      <i class="fa-solid fa-folder-open text-sky-400 text-[10px]"></i>
                      <span>SO: {{ selectedSoNumber }}</span>
                      <button type="button" @click.stop="deselectSoRow" class="text-slate-400 hover:text-white ml-0.5 cursor-pointer text-xs" title="Deselect SO (or double-click row)">&times;</button>
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-slate-400 text-[11px]">
                      Showing {{ soCatalogList.length }} SO Batches
                    </span>
                    <button
                      type="button"
                      @click="initCatalogTabulator"
                      class="text-slate-400 hover:text-white text-xs cursor-pointer transition p-1"
                      title="Redraw Catalog Table"
                    >
                      <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                  </div>
                </div>

                <!-- Loading State -->
                <div v-if="traceLoading" class="py-14 text-center space-y-3">
                  <div class="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg mx-auto">
                    <i class="fa-solid fa-circle-notch animate-spin"></i>
                  </div>
                  <div class="text-xs font-bold text-white">Loading Sales Order Catalog from PostgreSQL...</div>
                </div>

                <!-- Empty State -->
                <div v-else-if="soCatalogList.length === 0" class="py-12 text-center space-y-3 px-4">
                  <div class="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 text-lg mx-auto">
                    <i class="fa-solid fa-inbox"></i>
                  </div>
                  <div class="text-sm font-bold text-white">No Sales Orders matched filter criteria</div>
                  <p class="text-xs text-slate-400 max-w-md mx-auto">
                    No SO records found for current filter criteria. You can clear filters, check the SO number or seed representative baseline data.
                  </p>
                  <div class="pt-2 flex items-center justify-center gap-2">
                    <button
                      @click="resetTraceFilters"
                      class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
                    >
                      Reset Filters
                    </button>
                    <button
                      @click="seedSampleTraceData"
                      class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition"
                    >
                      Seed Baseline Data
                    </button>
                  </div>
                </div>

                <!-- Tabulator Container for Tested Devices Catalog -->
                <div v-show="!traceLoading && soCatalogList.length > 0" class="p-2 bg-slate-950/60">
                  <div id="trace-catalog-tabulator" class="rounded-xl overflow-hidden border border-slate-800/80"></div>
                </div>

                <!-- Footer Summary Bar -->
                <div class="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
                  <span>Showing {{ soCatalogList.length }} SO Batches ({{ traceTotal || traceResults.length }} total tested records)</span>
                  <div class="flex items-center gap-2">
                    <span class="text-slate-500">Database: PostgreSQL dvt | Table: test_result (Tabulator Grid)</span>
                  </div>
                </div>
              </div>

              <!-- 2. Detail Tabulator Table: Tested Devices in Selected SO -->
              <div class="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div class="p-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-microchip text-cyan-400"></i>
                      <span>Tested Devices in Selected SO:</span>
                      <span class="font-extrabold text-cyan-300">{{ selectedSoNumber || 'All SOs' }}</span>
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {{ soDevicesList.length }} Devices
                    </span>
                    <span v-if="selectedDeviceDetails" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <i class="fa-solid fa-microchip text-amber-400 text-[10px]"></i>
                      <span>SN: {{ selectedDeviceDetails.serial_number || selectedDeviceDetails.generalInfo?.serialNumber }}</span>
                      <button type="button" @click.stop="deselectDevice" class="text-slate-400 hover:text-white ml-0.5 cursor-pointer text-xs" title="Deselect Device (or double-click row)">&times;</button>
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="exportSelectedSoCsv"
                      class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 border border-slate-700"
                      title="Export devices in this SO to CSV"
                    >
                      <i class="fa-solid fa-file-csv text-emerald-400"></i>
                      <span>Export SO Devices</span>
                    </button>
                    <button
                      type="button"
                      @click="initDevicesTabulator"
                      class="text-slate-400 hover:text-white text-xs cursor-pointer transition p-1"
                      title="Redraw Devices Table"
                    >
                      <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                  </div>
                </div>

                <!-- Loading State for SO Devices -->
                <div v-if="loadingSoDevices" class="py-14 text-center space-y-3">
                  <div class="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg mx-auto">
                    <i class="fa-solid fa-circle-notch animate-spin"></i>
                  </div>
                  <div class="text-xs font-bold text-white">Querying devices for SO {{ selectedSoNumber }}...</div>
                </div>

                <!-- Empty State for SO Devices -->
                <div v-else-if="soDevicesList.length === 0" class="py-12 text-center space-y-2 px-4">
                  <div class="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 text-lg mx-auto">
                    <i class="fa-solid fa-box-open"></i>
                  </div>
                  <div class="text-sm font-bold text-white">No devices found for SO {{ selectedSoNumber || 'selected' }}</div>
                  <p class="text-xs text-slate-400">Please select another SO from the catalog above.</p>
                </div>

                <!-- Tabulator Container for SO Devices Detail Table -->
                <div v-show="!loadingSoDevices && soDevicesList.length > 0" class="p-2 bg-slate-950/60">
                  <div id="trace-devices-tabulator" class="rounded-xl overflow-hidden border border-slate-800/80"></div>
                </div>

                <!-- Footer Summary Bar -->
                <div class="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
                  <span>Showing {{ soDevicesList.length }} devices in SO: {{ selectedSoNumber || 'All' }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-slate-500">Columns include SERIAL_NUMBER, DEV_EUI, HW/FW, QA Result & formatted Finish Time</span>
                  </div>
                </div>
              </div>

              <!-- ======================================================== -->
              <!-- 4. LOWER SECTION: TEST QUERY PARAMETERS AS FLOWS DID     -->
              <!-- (PHẦN DƯỚI HIỂN THỊ CÁC THÔNG SỐ TRUY VẤN QUÁ TRÌNH TEST) -->
              <!-- ======================================================== -->
              <div class="glass-card rounded-2xl p-5 border border-purple-500/25 bg-slate-900/90 shadow-2xl space-y-5 animate-in fade-in">
                <!-- Section Title & Status Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg shadow-inner">
                      <i class="fa-solid fa-microchip"></i>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <h3 class="text-sm font-extrabold text-white uppercase tracking-wider">
                          Device Test Query Parameters & Sensor Telemetry
                        </h3>
                        <span v-if="selectedDeviceDetails" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {{ selectedDeviceDetails.serial_number || selectedDeviceDetails.test_id }}
                        </span>
                        <span v-if="selectedDeviceDetails" class="px-2 py-0.5 rounded text-[10px] font-bold font-mono" :class="isTestPassed(selectedDeviceDetails.test_result?.result) ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'">
                          {{ isTestPassed(selectedDeviceDetails.test_result?.result) ? 'QA PASS' : 'QA FAIL' }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-400 mt-0.5">
                        Detailed sensor metrics, event classifications, Modbus config registers, and raw frames recorded during the test execution flow.
                      </p>
                    </div>
                  </div>

                  <!-- Quick Actions for Selected Device -->
                  <div class="flex items-center gap-2" v-if="selectedDeviceDetails">
                    <button
                      type="button"
                      @click="exportDeviceTelemetryCsv"
                      class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
                      title="Export this device telemetry to CSV"
                    >
                      <i class="fa-solid fa-file-csv text-emerald-400"></i>
                      <span>Export Device CSV</span>
                    </button>
                    <button
                      type="button"
                      @click="selectDeviceForInspection(selectedTraceItem || selectedDeviceDetails)"
                      :disabled="loadingDeviceDetails"
                      class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer border border-slate-700"
                      title="Reload Telemetry"
                    >
                      <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingDeviceDetails }"></i>
                    </button>
                  </div>
                </div>

                <!-- Loading State -->
                <div v-if="loadingDeviceDetails" class="py-12 text-center space-y-3">
                  <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg mx-auto">
                    <i class="fa-solid fa-circle-notch animate-spin"></i>
                  </div>
                  <div class="text-xs font-bold text-white">Loading device test parameters & telemetry...</div>
                  <div class="text-[11px] text-slate-400 font-mono">Querying PostgreSQL test_result & raw_data3</div>
                </div>

                <!-- Empty State (No device selected) -->
                <div v-else-if="!selectedDeviceDetails" class="py-12 text-center space-y-2">
                  <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-lg mx-auto">
                    <i class="fa-solid fa-hand-pointer"></i>
                  </div>
                  <div class="text-xs font-bold text-slate-300">No Device Selected</div>
                  <div class="text-[11px] text-slate-500">Please select any device row from the table above to view test parameters.</div>
                </div>

                <!-- Detail Content (Populated as Flows Did) -->
                <div v-else class="space-y-5">
                  <!-- A. Device & QA Summary Attributes Card -->
                  <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 font-mono text-xs">
                    <div>
                      <div class="text-[10px] uppercase font-bold text-slate-500">Serial Number</div>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="font-extrabold text-amber-300">{{ selectedDeviceDetails.serial_number || '—' }}</span>
                        <button
                          type="button"
                          @click="copyText(selectedDeviceDetails.serial_number)"
                          class="text-slate-500 hover:text-white transition p-0.5"
                          title="Copy Serial Number"
                        >
                          <i class="fa-regular fa-copy text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] uppercase font-bold text-slate-500">Sales Order (SO)</div>
                      <div class="font-extrabold text-cyan-300 mt-0.5">{{ selectedDeviceDetails.so_number || selectedDeviceDetails.test_result?.so_number || '—' }}</div>
                    </div>
                    <div>
                      <div class="text-[10px] uppercase font-bold text-slate-500">Item Code / SKU</div>
                      <div class="text-slate-300 mt-0.5 truncate" :title="selectedDeviceDetails.item_code">
                        {{ selectedDeviceDetails.item_code || selectedDeviceDetails.sku || '—' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] uppercase font-bold text-slate-500">HW / FW Version</div>
                      <div class="text-slate-300 mt-0.5">
                        {{ selectedDeviceDetails.hardware_version || selectedDeviceDetails.generalInfo?.hwVer || '1.0' }} /
                        {{ selectedDeviceDetails.firmware_version || selectedDeviceDetails.generalInfo?.fwVer || '1' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] uppercase font-bold text-slate-500">Duration & Test Station</div>
                      <div class="text-slate-300 mt-0.5">
                        {{ selectedDeviceDetails.test_result?.duration_time || selectedDeviceDetails.generalInfo?.durationTime || '—' }}
                        <span class="text-slate-500">({{ selectedDeviceDetails.test_result?.test_station || 'STATION-01' }})</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] uppercase font-bold text-slate-500">Test Time Finish</div>
                      <div class="text-slate-400 mt-0.5 text-[11px]">
                        {{ formatTraceDate(selectedDeviceDetails.test_result?.time_finish || selectedDeviceDetails.generalInfo?.timeFinish) }}
                      </div>
                    </div>
                  </div>

                  <!-- B. Event Code Distribution (Header P1 - Flow 1 Standard) -->
                  <div v-if="selectedDeviceDetails.event_stats || selectedDeviceDetails.eventStats" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-tags text-indigo-400"></i>
                        <span>Event Code Distribution (Header P1 Protocol)</span>
                      </span>
                      <span class="text-[10px] font-mono text-slate-500">
                        Total Frames: {{ selectedDeviceDetails.telemetry_count || (selectedDeviceDetails.raw_telemetry || []).length }}
                      </span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-xs text-center">
                      <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span class="text-[10px] text-slate-500 block uppercase font-sans">Startup [0]</span>
                        <strong class="text-sky-300 text-sm">{{ (selectedDeviceDetails.event_stats || selectedDeviceDetails.eventStats)?.event_s || 0 }}</strong>
                      </div>
                      <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span class="text-[10px] text-slate-500 block uppercase font-sans">Periodic [1]</span>
                        <strong class="text-emerald-400 text-sm">{{ (selectedDeviceDetails.event_stats || selectedDeviceDetails.eventStats)?.event_p || 0 }}</strong>
                      </div>
                      <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span class="text-[10px] text-slate-500 block uppercase font-sans">Function [2]</span>
                        <strong class="text-amber-300 text-sm">{{ (selectedDeviceDetails.event_stats || selectedDeviceDetails.eventStats)?.event_f || 0 }}</strong>
                      </div>
                      <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span class="text-[10px] text-slate-500 block uppercase font-sans">Command [3]</span>
                        <strong class="text-indigo-300 text-sm">{{ (selectedDeviceDetails.event_stats || selectedDeviceDetails.eventStats)?.event_c || 0 }}</strong>
                      </div>
                      <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span class="text-[10px] text-slate-500 block uppercase font-sans">Alarm [4]</span>
                        <strong class="text-rose-400 text-sm">{{ (selectedDeviceDetails.event_stats || selectedDeviceDetails.eventStats)?.event_a || 0 }}</strong>
                      </div>
                      <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span class="text-[10px] text-slate-500 block uppercase font-sans">Heartbeat [5]</span>
                        <strong class="text-teal-300 text-sm">{{ (selectedDeviceDetails.event_stats || selectedDeviceDetails.eventStats)?.event_h || 0 }}</strong>
                      </div>
                      <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span class="text-[10px] text-slate-500 block uppercase font-sans">Schedule [14]</span>
                        <strong class="text-purple-300 text-sm">{{ (selectedDeviceDetails.event_stats || selectedDeviceDetails.eventStats)?.event_sch || 0 }}</strong>
                      </div>
                      <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span class="text-[10px] text-slate-500 block uppercase font-sans">Low Batt [15]</span>
                        <strong class="text-yellow-300 text-sm">{{ (selectedDeviceDetails.event_stats || selectedDeviceDetails.eventStats)?.event_lns || 0 }}</strong>
                      </div>
                    </div>
                  </div>

                  <!-- B1. raw_data3 Telemetry Statistics Matrix Cards -->
                  <div v-if="rawDataFieldList && rawDataFieldList.length > 0" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <div class="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-microchip text-emerald-400"></i>
                        <span>Raw Data 3 Field Telemetry Statistics (MAX / AVG / MIN Matrix Cards)</span>
                      </span>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {{ rawDataFieldList.length }} Sensor Channels
                      </span>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 font-mono">
                      <div
                        v-for="item in rawDataFieldList"
                        :key="'card-' + item.key"
                        class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                      >
                        <div>
                          <div class="flex items-center justify-between gap-1 mb-1">
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-black border" :class="item.colors.badge">
                              {{ item.key.toUpperCase() }}
                            </span>
                            <span class="text-[9px] text-slate-500 font-mono">{{ item.count }} pkts</span>
                          </div>
                          <div class="text-[10px] text-slate-400 truncate" :title="item.label">{{ item.label }}</div>
                        </div>

                        <div class="mt-2 pt-1.5 border-t border-slate-800/60">
                          <div class="flex items-baseline justify-between mb-1.5">
                            <span class="text-[9px] text-slate-500 uppercase font-sans">Latest</span>
                            <span :key="'latest-' + item.key" class="text-sm font-extrabold text-white font-mono">{{ formatStatNum(item.latest) }}</span>
                          </div>
                          <div class="grid grid-cols-3 gap-1 text-[9px] text-center bg-slate-950/70 rounded p-1">
                            <div>
                              <span class="text-[8px] text-slate-500 block uppercase">Min</span>
                              <span :key="'min-' + item.key" class="text-cyan-300 font-semibold">{{ formatStatNum(item.min) }}</span>
                            </div>
                            <div>
                              <span class="text-[8px] text-slate-500 block uppercase">Avg</span>
                              <span :key="'avg-' + item.key" class="text-emerald-400 font-bold">{{ formatStatNum(item.avg) }}</span>
                            </div>
                            <div>
                              <span class="text-[8px] text-slate-500 block uppercase">Max</span>
                              <span :key="'max-' + item.key" class="text-amber-300 font-semibold">{{ formatStatNum(item.max) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- B2. Trend Graphs for Each Field Data in raw_data3 -->
                  <div v-if="rawDataFieldList && rawDataFieldList.length > 0" class="space-y-3">
                    <div class="flex flex-col gap-2.5 px-1 pb-1">
                      <!-- Top Row: Title & Active Count Badge -->
                      <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <i class="fa-solid fa-chart-line text-sky-400"></i>
                            <span>Field Data Trends (raw_data3 Timeline Series)</span>
                          </span>
                          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            {{ filteredRawDataFieldList.length }} / {{ rawDataFieldList.length }} Channels • Interactive Trend Cards
                          </span>
                        </div>
                      </div>

                      <!-- Bottom Row: Channel Search, Category Filter, Global Zoom, and Global Toggles -->
                      <div class="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                        <!-- Channel Search & Category Filter Pills -->
                        <div class="flex items-center gap-2 flex-wrap">
                          <div class="relative">
                            <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2 text-[10px] text-slate-500"></i>
                            <input
                              v-model="trendChannelSearch"
                              type="text"
                              placeholder="Filter field (e.g. p4, com1, batt)..."
                              class="pl-7 pr-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white font-mono focus:border-sky-500 focus:outline-none w-44 placeholder:text-slate-500 placeholder:text-[11px]"
                            />
                            <button
                              v-if="trendChannelSearch"
                              type="button"
                              @click="trendChannelSearch = ''"
                              class="absolute right-2 top-1.5 text-slate-500 hover:text-white text-[10px]"
                            >
                              <i class="fa-solid fa-xmark"></i>
                            </button>
                          </div>

                          <!-- Category Filter Pills -->
                          <div class="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[10px] font-mono">
                            <button
                              type="button"
                              @click="trendCategoryFilter = 'all'"
                              :class="trendCategoryFilter === 'all' ? 'bg-sky-600/30 text-sky-300 font-bold border border-sky-500/40' : 'text-slate-400 hover:text-white border border-transparent'"
                              class="px-2 py-0.5 rounded transition cursor-pointer"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              @click="trendCategoryFilter = 'sensors'"
                              :class="trendCategoryFilter === 'sensors' ? 'bg-sky-600/30 text-sky-300 font-bold border border-sky-500/40' : 'text-slate-400 hover:text-white border border-transparent'"
                              class="px-2 py-0.5 rounded transition cursor-pointer"
                              title="Sensors P1 to P35 only"
                            >
                              Sensors (P)
                            </button>
                            <button
                              type="button"
                              @click="trendCategoryFilter = 'com'"
                              :class="trendCategoryFilter === 'com' ? 'bg-sky-600/30 text-sky-300 font-bold border border-sky-500/40' : 'text-slate-400 hover:text-white border border-transparent'"
                              class="px-2 py-0.5 rounded transition cursor-pointer"
                              title="COM1 & COM2 only"
                            >
                              COM
                            </button>
                            <button
                              type="button"
                              @click="trendCategoryFilter = 'active'"
                              :class="trendCategoryFilter === 'active' ? 'bg-sky-600/30 text-sky-300 font-bold border border-sky-500/40' : 'text-slate-400 hover:text-white border border-transparent'"
                              class="px-2 py-0.5 rounded transition cursor-pointer"
                              title="Channels with dynamic variation only"
                            >
                              Active Only
                            </button>
                          </div>
                        </div>

                        <!-- Global Zoom & Display Toggles for All Cards -->
                        <div class="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                          <!-- Global Zoom Buttons -->
                          <div class="flex items-center gap-1">
                            <span class="text-slate-500 font-sans font-bold uppercase text-[9px]">Global Zoom:</span>
                            <div class="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                              <button
                                type="button"
                                @click="setGlobalCardZoom('all')"
                                :class="globalCardZoom === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                                class="px-2 py-0.5 rounded transition cursor-pointer"
                                title="Show full packet series on all cards"
                              >
                                All Pkts
                              </button>
                              <button
                                type="button"
                                @click="setGlobalCardZoom(25)"
                                :class="globalCardZoom === 25 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                                class="px-2 py-0.5 rounded transition cursor-pointer"
                                title="Zoom to last 25 packets on all cards"
                              >
                                Last 25
                              </button>
                              <button
                                type="button"
                                @click="setGlobalCardZoom(10)"
                                :class="globalCardZoom === 10 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                                class="px-2 py-0.5 rounded transition cursor-pointer"
                                title="Zoom to last 10 packets on all cards"
                              >
                                Last 10
                              </button>
                            </div>
                          </div>

                          <!-- Global Display Toggles -->
                          <div class="flex items-center gap-1 border-l border-slate-800 pl-2">
                            <button
                              type="button"
                              @click="toggleGlobalCardArea"
                              :class="globalCardArea ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
                              class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
                              title="Toggle Area Gradient on all cards"
                            >
                              <i class="fa-solid fa-chart-area text-[9px]"></i>
                              <span>Area</span>
                            </button>
                            <button
                              type="button"
                              @click="toggleGlobalCardAvg"
                              :class="globalCardAvg ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
                              class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
                              title="Toggle Mean Reference Line on all cards"
                            >
                              <i class="fa-solid fa-arrows-split-up-and-left text-[9px]"></i>
                              <span>Avg</span>
                            </button>
                            <button
                              type="button"
                              @click="toggleGlobalCardDots"
                              :class="globalCardDots ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
                              class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
                              title="Toggle Data Points on all cards"
                            >
                              <i class="fa-solid fa-circle-dot text-[9px]"></i>
                              <span>Dots</span>
                            </button>
                            <button
                              type="button"
                              @click="toggleGlobalCardGrid"
                              :class="globalCardGrid ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'"
                              class="px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1"
                              title="Toggle Oscilloscope Grid on all cards"
                            >
                              <i class="fa-solid fa-border-all text-[9px]"></i>
                              <span>Grid</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- All Channel Cards Grid -->
                    <!-- v-for="field in rawDataFieldList" -->
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      <!-- Empty state if search filters out all cards -->
                      <div
                        v-if="filteredRawDataFieldList.length === 0"
                        class="col-span-full py-12 text-center bg-slate-950/70 border border-slate-800 rounded-xl space-y-2"
                      >
                        <i class="fa-solid fa-filter-circle-xmark text-slate-600 text-2xl"></i>
                        <div class="text-xs text-slate-400 font-mono">No channels match filter criteria</div>
                        <button
                          type="button"
                          @click="trendChannelSearch = ''; trendCategoryFilter = 'all'"
                          class="px-3 py-1 rounded bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-mono font-bold hover:bg-sky-600/50 cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </div>

                      <!-- Field Trend Card for each sensor/parameter -->
                      <div
                        v-for="field in filteredRawDataFieldList"
                        :key="field.key"
                        class="p-3.5 rounded-xl border space-y-2.5 transition flex flex-col justify-between border-slate-800 bg-slate-950/80 hover:border-slate-700"
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

                        <!-- Interactive HUD Strip / Mini Stats Row (Stable Height Container) -->
                        <div class="h-9 min-h-[36px] flex items-center mb-1">
                          <div v-if="cardHoverMap[field.key]" class="w-full flex items-center justify-between px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/40 text-[10px] font-mono animate-in fade-in">
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
                          <div v-else class="w-full grid grid-cols-4 gap-1 text-center font-mono text-[10px] py-1 bg-slate-900/60 rounded-lg border border-slate-800/60">
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
                              <linearGradient :id="'grad-trace-' + field.key" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" :stop-color="field.colors.stroke" stop-opacity="0.28" />
                                <stop offset="100%" :stop-color="field.colors.stroke" stop-opacity="0.01" />
                              </linearGradient>
                              <!-- Grid Pattern Definition -->
                              <pattern :id="'trace-grid-' + field.key" width="73" height="17.5" patternUnits="userSpaceOnUse">
                                <path d="M 73 0 L 0 0 0 17.5" fill="none" stroke="rgba(148, 163, 184, 0.12)" stroke-width="0.8" stroke-dasharray="2,2" />
                              </pattern>
                            </defs>

                            <!-- Background Grid Pattern -->
                            <rect v-if="field.showGrid" x="14" y="8" width="292" height="70" :fill="'url(#trace-grid-' + field.key + ')'" />

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
                              :fill="'url(#grad-trace-' + field.key + ')'"
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
                            <g v-if="field.showDots" class="pointer-events-none">
                              <circle
                                v-for="p in field.renderedPoints"
                                :key="p.index"
                                :cx="p.x"
                                :cy="p.y"
                                :r="cardHoverMap[field.key]?.index === p.index ? 4.5 : 2.5"
                                :fill="field.colors.stroke"
                                stroke="#0f172a"
                                stroke-width="1.2"
                              />
                            </g>

                            <!-- Interactive Hover Crosshair Lines & Snapped Dot -->
                            <g v-if="cardHoverMap[field.key]" class="pointer-events-none">
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
                                r="5"
                                fill="#38bdf8"
                                stroke="#ffffff"
                                stroke-width="1.8"
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

                  <!-- C. Queried Sensor Parameters & Statistics Tables Grid (General Info & Parameters 1-4) -->
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <!-- General Information (COM1, COM2, P1..P3) -->
                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <i class="fa-solid fa-bolt text-amber-400"></i>
                          <span>General Info (COM1, COM2, P1..P3)</span>
                        </span>
                        <span class="text-[10px] font-mono text-slate-500">Power & Link</span>
                      </div>
                      <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs font-mono">
                          <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                            <tr>
                              <th class="py-2 px-2.5">Field</th>
                              <th class="py-2 px-2.5 text-right">Min</th>
                              <th class="py-2 px-2.5 text-right">Max</th>
                              <th class="py-2 px-2.5 text-right text-emerald-400 font-bold">Average</th>
                              <th class="py-2 px-2.5 text-right">Latest</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-800/60 text-[11px]">
                            <tr v-for="r in (selectedDeviceDetails.general_info || [])" :key="r.field" class="hover:bg-slate-900/40">
                              <td class="py-1.5 px-2.5 font-semibold text-slate-200">{{ r.label }}</td>
                              <td class="py-1.5 px-2.5 text-right text-cyan-300">{{ formatStatNum(r.min) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-amber-300">{{ formatStatNum(r.max) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-emerald-400 font-bold">{{ formatStatNum(r.avg) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-white font-bold">{{ formatStatNum(r.latest) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- Parameters 1 (P4..P11 Primary Sensors) -->
                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <i class="fa-solid fa-gauge text-cyan-400"></i>
                          <span>Primary Sensor Parameters (P4 .. P11)</span>
                        </span>
                        <span class="text-[10px] font-mono text-cyan-400">Primary Channels</span>
                      </div>
                      <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs font-mono">
                          <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                            <tr>
                              <th class="py-2 px-2.5">Field</th>
                              <th class="py-2 px-2.5 text-right">Min</th>
                              <th class="py-2 px-2.5 text-right">Max</th>
                              <th class="py-2 px-2.5 text-right text-cyan-300 font-bold">Average</th>
                              <th class="py-2 px-2.5 text-right">Latest</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-800/60 text-[11px]">
                            <tr v-for="r in (selectedDeviceDetails.params_1 || [])" :key="r.field" class="hover:bg-slate-900/40">
                              <td class="py-1.5 px-2.5 font-semibold text-slate-200">{{ r.label }}</td>
                              <td class="py-1.5 px-2.5 text-right text-cyan-300">{{ formatStatNum(r.min) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-amber-300">{{ formatStatNum(r.max) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-cyan-300 font-bold">{{ formatStatNum(r.avg) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-white font-bold">{{ formatStatNum(r.latest) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- Parameters 2 (P12..P19 Secondary Telemetry) -->
                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <i class="fa-solid fa-wave-square text-sky-400"></i>
                          <span>Secondary Telemetry (P12 .. P19)</span>
                        </span>
                        <span class="text-[10px] font-mono text-sky-400">Aux Telemetry</span>
                      </div>
                      <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs font-mono">
                          <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                            <tr>
                              <th class="py-2 px-2.5">Field</th>
                              <th class="py-2 px-2.5 text-right">Min</th>
                              <th class="py-2 px-2.5 text-right">Max</th>
                              <th class="py-2 px-2.5 text-right text-sky-300 font-bold">Average</th>
                              <th class="py-2 px-2.5 text-right">Latest</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-800/60 text-[11px]">
                            <tr v-for="r in (selectedDeviceDetails.params_2 || [])" :key="r.field" class="hover:bg-slate-900/40">
                              <td class="py-1.5 px-2.5 font-semibold text-slate-200">{{ r.label }}</td>
                              <td class="py-1.5 px-2.5 text-right text-cyan-300">{{ formatStatNum(r.min) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-amber-300">{{ formatStatNum(r.max) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-sky-300 font-bold">{{ formatStatNum(r.avg) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-white font-bold">{{ formatStatNum(r.latest) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- Parameters 3 & 4 (P20..P35 Auxiliary Slots) -->
                    <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <i class="fa-solid fa-cubes text-purple-400"></i>
                          <span>Auxiliary Sensor Channels (P20 .. P35)</span>
                        </span>
                        <span class="text-[10px] font-mono text-purple-400">Extended Slots</span>
                      </div>
                      <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs font-mono">
                          <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                            <tr>
                              <th class="py-2 px-2.5">Field</th>
                              <th class="py-2 px-2.5 text-right">Min</th>
                              <th class="py-2 px-2.5 text-right">Max</th>
                              <th class="py-2 px-2.5 text-right text-purple-300 font-bold">Average</th>
                              <th class="py-2 px-2.5 text-right">Latest</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-800/60 text-[11px]">
                            <tr v-for="r in ((selectedDeviceDetails.params_3 || []).concat(selectedDeviceDetails.params_4 || []))" :key="r.field" class="hover:bg-slate-900/40">
                              <td class="py-1.5 px-2.5 font-semibold text-slate-200">{{ r.label }}</td>
                              <td class="py-1.5 px-2.5 text-right text-cyan-300">{{ formatStatNum(r.min) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-amber-300">{{ formatStatNum(r.max) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-purple-300 font-bold">{{ formatStatNum(r.avg) }}</td>
                              <td class="py-1.5 px-2.5 text-right text-white font-bold">{{ formatStatNum(r.latest) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <!-- D. Decoded Memory Map / Configuration String (if available) -->
                  <div v-if="(selectedDeviceDetails.decoded_config || selectedDeviceDetails.decodedConfig || []).length > 0" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-code text-indigo-400"></i>
                        <span>Decoded Configuration Map (from test_result.configuration_string)</span>
                      </span>
                      <span class="text-[10px] font-mono text-indigo-400">
                        {{ (selectedDeviceDetails.decoded_config || selectedDeviceDetails.decodedConfig || []).length }} Registers Decoded
                      </span>
                    </div>
                    <div class="overflow-x-auto max-h-48">
                      <table class="w-full text-left text-xs font-mono">
                        <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                          <tr>
                            <th class="py-2 px-3">Register</th>
                            <th class="py-2 px-3">Parameter Name</th>
                            <th class="py-2 px-3">Decoded Value</th>
                            <th class="py-2 px-3">Data Type</th>
                            <th class="py-2 px-3">Unit</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr v-for="cfg in (selectedDeviceDetails.decoded_config || selectedDeviceDetails.decodedConfig || [])" :key="cfg.reg" class="hover:bg-slate-900/40">
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

                  <!-- E. Raw Telemetry Uplink Frames (PostgreSQL raw_data3) -->
                  <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-database text-purple-400"></i>
                        <span>Captured Telemetry Frames (PostgreSQL raw_data3)</span>
                      </span>
                      <span class="text-[10px] font-mono text-purple-300">
                        {{ (selectedDeviceDetails.raw_telemetry || selectedDeviceDetails.telemetry || []).length }} Frames
                      </span>
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
                            <th class="py-2 px-2.5 text-center">P3 / P4</th>
                            <th class="py-2 px-2.5">Payload Hex</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-[11px]">
                          <tr v-if="!selectedDeviceDetails.raw_telemetry || selectedDeviceDetails.raw_telemetry.length === 0">
                            <td colspan="9" class="py-4 text-center text-slate-500">No raw telemetry frames recorded in raw_data3</td>
                          </tr>
                          <tr v-for="(f, fIdx) in (selectedDeviceDetails.raw_telemetry || selectedDeviceDetails.telemetry || [])" :key="fIdx" class="hover:bg-slate-900/40">
                            <td class="py-1.5 px-2.5 text-center text-slate-500">{{ fIdx + 1 }}</td>
                            <td class="py-1.5 px-2.5 text-slate-300">{{ formatTraceDate(f.epochtime ? f.epochtime * 1000 : f.timestamp) }}</td>
                            <td class="py-1.5 px-2.5 text-center text-slate-400">{{ f.spreading_factor || 'SF7' }}</td>
                            <td class="py-1.5 px-2.5 text-center text-emerald-400 font-bold">{{ f.com1 ? f.com1 + ' dBm' : '—' }}</td>
                            <td class="py-1.5 px-2.5 text-center text-sky-400">{{ f.com2 ? f.com2 + ' dB' : '—' }}</td>
                            <td class="py-1.5 px-2.5 text-center font-bold text-amber-300">{{ f.p1 !== undefined ? f.p1 : '—' }}</td>
                            <td class="py-1.5 px-2.5 text-center text-slate-300">{{ f.p2 !== undefined ? f.p2 : '—' }}</td>
                            <td class="py-1.5 px-2.5 text-center text-slate-400">{{ f.p3 !== undefined ? f.p3 : '—' }} / {{ f.p4 !== undefined ? f.p4 : '—' }}</td>
                            <td class="py-1.5 px-2.5">
                              <div class="flex items-center gap-1.5">
                                <span class="text-indigo-300 font-mono text-[10px] truncate max-w-[140px]">{{ f.uplink_payload || f.rawPayload || '—' }}</span>
                                <button
                                  v-if="f.uplink_payload || f.rawPayload"
                                  type="button"
                                  @click="copyText(f.uplink_payload || f.rawPayload)"
                                  class="text-slate-500 hover:text-white transition p-0.5"
                                  title="Copy Payload Hex"
                                >
                                  <i class="fa-regular fa-copy text-[10px]"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- ======================================================== -->
            <!-- 5. TAB CONTENT 2: TELEMETRY INSPECTION (raw_data3)       -->
            <!-- ======================================================== -->
            <div v-show="activeTraceTab === 'telemetry'" class="space-y-4 animate-in fade-in">
              <!-- Search & Device Selection Bar -->
              <div class="glass-card rounded-2xl p-4 border border-slate-800/80">
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div class="flex-1 flex items-center gap-2 max-w-xl">
                    <div class="relative flex-1">
                      <i class="fa-solid fa-microchip absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                      <input
                        type="text"
                        v-model="telemetrySearchKey"
                        @keyup.enter="fetchDeviceTelemetryDetails(telemetrySearchKey)"
                        placeholder="Enter Serial Number or Device Key (DevEUI) to query raw_data3..."
                        class="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      @click="fetchDeviceTelemetryDetails(telemetrySearchKey)"
                      :disabled="loadingDeviceTelemetry"
                      class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-sky-500/20 flex items-center gap-1.5 shrink-0"
                    >
                      <i :class="loadingDeviceTelemetry ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-satellite-dish'"></i>
                      <span>Inspect Telemetry</span>
                    </button>
                  </div>

                  <!-- Quick selector chips from recent tests -->
                  <div v-if="traceResults.length > 0" class="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
                    <span class="text-slate-500 shrink-0">Recent:</span>
                    <button
                      v-for="r in traceResults.slice(0, 4)"
                      :key="r.serialNumber || r.serial_number"
                      type="button"
                      @click="telemetrySearchKey = (r.serialNumber || r.serial_number); fetchDeviceTelemetryDetails(r.serialNumber || r.serial_number)"
                      class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shrink-0"
                    >
                      {{ r.serialNumber || r.serial_number }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Selected Device Telemetry Profile -->
              <div v-if="selectedDeviceTelemetry" class="glass-card rounded-2xl p-5 border border-sky-500/20 space-y-4">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg">
                      <i class="fa-solid fa-satellite-dish"></i>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="text-sm font-bold text-white font-mono">{{ selectedDeviceTelemetry.generalInfo?.serialNumber || selectedDeviceTelemetry.serial_number }}</h4>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono">
                          {{ selectedDeviceTelemetry.generalInfo?.sku || selectedDeviceTelemetry.sku }}
                        </span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                          DevEUI: {{ selectedDeviceTelemetry.generalInfo?.deviceKey || selectedDeviceTelemetry.device_key }}
                        </span>
                      </div>
                      <div class="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>Item Code: <strong class="text-slate-300">{{ selectedDeviceTelemetry.generalInfo?.itemCode || selectedDeviceTelemetry.item_code }}</strong></span>
                        <span>•</span>
                        <span>SO: <strong class="text-cyan-300">{{ selectedDeviceTelemetry.generalInfo?.soNumber || selectedDeviceTelemetry.so_number || '—' }}</strong></span>
                        <span>•</span>
                        <span>HW/FW: <strong class="text-slate-300">{{ selectedDeviceTelemetry.generalInfo?.hwVer || '1.0' }} / {{ selectedDeviceTelemetry.generalInfo?.fwVer || '1' }}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <span
                      :class="isTestPassed(selectedDeviceTelemetry.test_result?.result || selectedDeviceTelemetry.generalInfo?.result)
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'"
                      class="px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5"
                    >
                      <i :class="isTestPassed(selectedDeviceTelemetry.test_result?.result || selectedDeviceTelemetry.generalInfo?.result) ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
                      <span>QA {{ isTestPassed(selectedDeviceTelemetry.test_result?.result || selectedDeviceTelemetry.generalInfo?.result) ? 'PASSED' : 'FAILED' }}</span>
                    </span>
                    <button
                      type="button"
                      @click="exportDeviceTelemetryCsv"
                      class="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                    >
                      <i class="fa-solid fa-download mr-1"></i> CSV
                    </button>
                  </div>
                </div>

                <!-- Parameter Calculation Stats (Min / Max / Avg) -->
                <div v-if="telemetryCalcStats && Object.keys(telemetryCalcStats).length > 0" class="space-y-2">
                  <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-chart-line text-sky-400"></i>
                    <span>Calculated Sensor Telemetry Metrics (Min / Max / Avg from raw_data3):</span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
                    <div
                      v-for="(stat, pName) in telemetryCalcStats"
                      :key="pName"
                      class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center"
                    >
                      <div class="text-[10px] text-slate-400 truncate uppercase font-bold">{{ pName }}</div>
                      <div class="text-xs font-extrabold text-cyan-300 mt-0.5">{{ stat.latest !== null ? stat.latest : (stat.avg !== null ? stat.avg : '—') }}</div>
                      <div class="text-[9px] text-slate-500 mt-0.5">
                        Min: {{ stat.min ?? '—' }} | Max: {{ stat.max ?? '—' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tab 2: Field Data Trends (raw_data3 Timeline Series) Cards Grid -->
              <div v-if="selectedDeviceTelemetry && rawDataFieldList && rawDataFieldList.length > 0" class="space-y-3">
                <div class="flex items-center justify-between pb-1 px-1">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-chart-line text-sky-400"></i>
                    <span class="text-xs font-bold text-white uppercase tracking-wider">Field Data Trends (raw_data3 Timeline Series)</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      {{ rawDataFieldList.length }} Channels • Interactive Trend Cards
                    </span>
                  </div>
                </div>

                <!-- Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  <div
                    v-for="field in rawDataFieldList"
                    :key="'t2-card-' + field.key"
                    class="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 space-y-2.5 transition flex flex-col justify-between"
                  >
                    <!-- Header -->
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
                      <div class="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          @click.stop="openFieldInspectModal(field)"
                          class="p-1 rounded text-[10px] font-mono bg-slate-900 text-purple-300 hover:text-white hover:bg-purple-900/50 border border-purple-500/30 transition cursor-pointer"
                          title="Inspect Waveform & Data Table in Fullscreen Modal"
                        >
                          <i class="fa-solid fa-expand text-[10px]"></i>
                        </button>
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

                    <!-- Toolbar -->
                    <div class="flex items-center justify-between gap-1 text-[9px] font-mono py-1 px-1.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex-wrap">
                      <div class="flex items-center gap-1">
                        <span class="text-slate-500 text-[8px] uppercase tracking-wider font-sans font-bold">Zoom:</span>
                        <div class="inline-flex rounded bg-slate-950 p-0.5 border border-slate-800">
                          <button
                            type="button"
                            @click.stop="setCardZoom(field.key, 'all')"
                            class="px-1.5 py-0.5 rounded text-[8px] font-bold transition cursor-pointer"
                            :class="field.activeZoom === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'"
                          >
                            All ({{ field.totalCount }})
                          </button>
                          <button
                            v-if="field.totalCount > 25"
                            type="button"
                            @click.stop="setCardZoom(field.key, 25)"
                            class="px-1.5 py-0.5 rounded text-[8px] font-bold transition cursor-pointer"
                            :class="field.activeZoom === 25 ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'"
                          >
                            25
                          </button>
                          <button
                            v-if="field.totalCount > 10"
                            type="button"
                            @click.stop="setCardZoom(field.key, 10)"
                            class="px-1.5 py-0.5 rounded text-[8px] font-bold transition cursor-pointer"
                            :class="field.activeZoom === 10 ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'"
                          >
                            10
                          </button>
                        </div>
                      </div>

                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          @click.stop="toggleCardSetting(field.key, 'showArea')"
                          class="px-1.5 py-0.5 rounded border text-[8px] font-bold transition cursor-pointer flex items-center gap-0.5"
                          :class="field.showArea ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'"
                        >
                          <i class="fa-solid fa-chart-area"></i> Area
                        </button>
                        <button
                          type="button"
                          @click.stop="toggleCardSetting(field.key, 'showAvg')"
                          class="px-1.5 py-0.5 rounded border text-[8px] font-bold transition cursor-pointer flex items-center gap-0.5"
                          :class="field.showAvg ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'"
                        >
                          <i class="fa-solid fa-arrows-split-up-and-left"></i> Avg
                        </button>
                        <button
                          type="button"
                          @click.stop="toggleCardSetting(field.key, 'showDots')"
                          class="px-1.5 py-0.5 rounded border text-[8px] font-bold transition cursor-pointer flex items-center gap-0.5"
                          :class="field.showDots ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'"
                        >
                          <i class="fa-solid fa-circle-dot"></i> Dots
                        </button>
                        <button
                          type="button"
                          @click.stop="toggleCardSetting(field.key, 'showGrid')"
                          class="px-1.5 py-0.5 rounded border text-[8px] font-bold transition cursor-pointer flex items-center gap-0.5"
                          :class="field.showGrid ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'"
                        >
                          <i class="fa-solid fa-border-all"></i> Grid
                        </button>
                      </div>
                    </div>

                    <!-- HUD or Stats row (Stable Height Container) -->
                    <div class="h-9 min-h-[36px] flex items-center mb-1">
                      <div v-if="cardHoverMap[field.key]" class="w-full flex items-center justify-between px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/40 text-[10px] font-mono animate-in fade-in">
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
                      <div v-else class="w-full grid grid-cols-4 gap-1 text-center font-mono text-[10px] py-1 bg-slate-900/60 rounded-lg border border-slate-800/60">
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
                    </div>

                    <!-- SVG Trend Graph -->
                    <div
                      class="w-full bg-slate-900/80 rounded-lg p-1.5 border border-slate-800 relative chart-grid-container cursor-crosshair select-none"
                      @mousemove="onCardChartMouseMove($event, field)"
                      @mouseleave="onCardChartMouseLeave(field.key)"
                    >
                      <div class="absolute right-2 top-1 text-[8px] font-mono text-slate-500 pointer-events-none">Max: {{ formatStatNum(field.max) }}</div>
                      <div class="absolute right-2 bottom-6 text-[8px] font-mono text-slate-500 pointer-events-none">Min: {{ formatStatNum(field.min) }}</div>

                      <svg class="w-full h-24 overflow-visible" viewBox="0 0 320 88" preserveAspectRatio="none">
                        <defs>
                          <linearGradient :id="'grad-trace-t2-' + field.key" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" :stop-color="field.colors.stroke" stop-opacity="0.28" />
                            <stop offset="100%" :stop-color="field.colors.stroke" stop-opacity="0.01" />
                          </linearGradient>
                          <pattern :id="'trace-grid-t2-' + field.key" width="73" height="17.5" patternUnits="userSpaceOnUse">
                            <path d="M 73 0 L 0 0 0 17.5" fill="none" stroke="rgba(148, 163, 184, 0.12)" stroke-width="0.8" stroke-dasharray="2,2" />
                          </pattern>
                        </defs>
                        <rect v-if="field.showGrid" x="14" y="8" width="292" height="70" :fill="'url(#trace-grid-t2-' + field.key + ')'" />
                        <rect x="14" y="8" width="292" height="70" fill="none" stroke="rgba(148, 163, 184, 0.22)" stroke-width="1" rx="2" />
                        <g v-if="field.showGrid">
                          <line x1="14" y1="25.5" x2="306" y2="25.5" stroke="rgba(148, 163, 184, 0.15)" stroke-width="0.8" stroke-dasharray="3,3" />
                          <line x1="14" y1="43" x2="306" y2="43" stroke="rgba(148, 163, 184, 0.18)" stroke-width="0.8" stroke-dasharray="3,3" />
                          <line x1="14" y1="60.5" x2="306" y2="60.5" stroke="rgba(148, 163, 184, 0.15)" stroke-width="0.8" stroke-dasharray="3,3" />
                          <line x1="87" y1="8" x2="87" y2="78" stroke="rgba(148, 163, 184, 0.15)" stroke-width="0.8" stroke-dasharray="3,3" />
                          <line x1="160" y1="8" x2="160" y2="78" stroke="rgba(148, 163, 184, 0.18)" stroke-width="0.8" stroke-dasharray="3,3" />
                          <line x1="233" y1="8" x2="233" y2="78" stroke="rgba(148, 163, 184, 0.15)" stroke-width="0.8" stroke-dasharray="3,3" />
                        </g>
                        <line v-if="field.showAvg" x1="14" :y1="field.avgY" x2="306" :y2="field.avgY" stroke="rgba(245, 158, 11, 0.75)" stroke-width="1.2" stroke-dasharray="4,3" />
                        <polygon v-if="field.showArea" :points="field.areaPolygonStr" :fill="'url(#grad-trace-t2-' + field.key + ')'" />
                        <polyline fill="none" :stroke="field.colors.stroke" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :points="field.polylineStr" />
                        <g v-if="field.showDots" class="pointer-events-none">
                          <circle v-for="p in field.renderedPoints" :key="'t2-dot-' + field.key + '-' + p.index" :cx="p.x" :cy="p.y" :r="cardHoverMap[field.key]?.index === p.index ? 4.5 : 2.2" :fill="field.colors.stroke" stroke="#0f172a" stroke-width="1.2" />
                        </g>
                        <g v-if="cardHoverMap[field.key]" class="pointer-events-none">
                          <line :x1="cardHoverMap[field.key].x" y1="8" :x2="cardHoverMap[field.key].x" y2="78" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2,2" />
                          <line x1="14" :y1="cardHoverMap[field.key].y" x2="306" :y2="cardHoverMap[field.key].y" stroke="rgba(56, 189, 248, 0.5)" stroke-width="0.8" stroke-dasharray="2,2" />
                          <circle :cx="cardHoverMap[field.key].x" :cy="cardHoverMap[field.key].y" r="5" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.6" />
                          <circle :cx="cardHoverMap[field.key].x" :cy="cardHoverMap[field.key].y" r="3.5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
                        </g>
                      </svg>
                      <div class="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-1 border-t border-slate-800/80 mt-1">
                        <span>{{ field.startTime }}</span>
                        <span>{{ field.endTime }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Raw Telemetry Uplink Frames Table -->
              <div class="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div class="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-list-ol text-sky-400 text-xs"></i>
                    <h3 class="text-xs font-bold text-white uppercase tracking-wider">Raw Telemetry Frames (PostgreSQL raw_data3)</h3>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/25">
                    {{ telemetryRawFrames.length }} Frames Loaded
                  </span>
                </div>

                <!-- Loading State -->
                <div v-if="loadingDeviceTelemetry" class="py-16 text-center space-y-3">
                  <div class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl mx-auto">
                    <i class="fa-solid fa-circle-notch animate-spin"></i>
                  </div>
                  <div class="text-xs font-bold text-white">Querying PostgreSQL raw_data3...</div>
                  <div class="text-[11px] text-slate-400 font-mono">Fetching uplink frames and payload packets</div>
                </div>

                <!-- Empty State -->
                <div v-else-if="telemetryRawFrames.length === 0" class="py-16 text-center space-y-3 px-4">
                  <div class="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 text-xl mx-auto">
                    <i class="fa-solid fa-satellite-dish"></i>
                  </div>
                  <div class="text-sm font-bold text-white">No raw telemetry frames found</div>
                  <p class="text-xs text-slate-400 max-w-md mx-auto">
                    Please select a device from the Test Results tab or enter a valid Serial Number / DevEUI to inspect packets from raw_data3.
                  </p>
                </div>

                <!-- Frames Table -->
                <div v-else class="overflow-x-auto max-h-[500px]">
                  <table class="w-full text-left text-xs font-mono">
                    <thead class="bg-slate-950/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10">
                      <tr>
                        <th class="py-2.5 px-3 w-12 text-center">#</th>
                        <th class="py-2.5 px-3">Timestamp</th>
                        <th class="py-2.5 px-3">Epoch Time</th>
                        <th class="py-2.5 px-3">Raw Payload (Hex)</th>
                        <th class="py-2.5 px-3">RSSI</th>
                        <th class="py-2.5 px-3">SNR</th>
                        <th class="py-2.5 px-3">Sensor Values (P1..P6)</th>
                        <th class="py-2.5 px-3 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-300">
                      <tr
                        v-for="(f, fIdx) in telemetryRawFrames"
                        :key="fIdx"
                        class="hover:bg-slate-855/60 transition"
                      >
                        <td class="py-2 px-3 text-center text-slate-500">{{ fIdx + 1 }}</td>
                        <td class="py-2 px-3 text-slate-300">{{ formatTraceDate(f.epochtime ? f.epochtime * 1000 : f.timestamp) }}</td>
                        <td class="py-2 px-3 text-slate-500 text-[11px]">{{ f.epochtime || '—' }}</td>
                        <td class="py-2 px-3">
                          <div class="flex items-center gap-1.5">
                            <span class="text-amber-300 font-bold truncate max-w-[200px]">{{ f.rawPayload || f.raw_payload || f.data || '—' }}</span>
                            <button
                              v-if="f.rawPayload || f.raw_payload"
                              type="button"
                              @click="copyText(f.rawPayload || f.raw_payload)"
                              class="text-slate-500 hover:text-white transition p-0.5"
                              title="Copy Payload Hex"
                            >
                              <i class="fa-regular fa-copy text-[10px]"></i>
                            </button>
                          </div>
                        </td>
                        <td class="py-2 px-3 text-emerald-400 font-bold">{{ f.rssi ? f.rssi + ' dBm' : '—' }}</td>
                        <td class="py-2 px-3 text-sky-400">{{ f.snr ? f.snr + ' dB' : '—' }}</td>
                        <td class="py-2 px-3 text-[11px] text-slate-400">
                          P1: {{ f.p1 !== undefined ? f.p1 : '—' }} | P2: {{ f.p2 !== undefined ? f.p2 : '—' }} | P3: {{ f.p3 !== undefined ? f.p3 : '—' }}
                        </td>
                        <td class="py-2 px-3 text-right">
                          <button
                            type="button"
                            @click="viewRawPacket(f)"
                            class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-semibold transition cursor-pointer"
                          >
                            <i class="fa-solid fa-magnifying-glass"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- ======================================================== -->
            <!-- 6. TAB CONTENT 3: SERIALIZATION LIFECYCLE AUDIT TRAIL    -->
            <!-- ======================================================== -->
            <div v-show="activeTraceTab === 'lifecycle'" class="space-y-4 animate-in fade-in">
              <!-- Search bar -->
              <div class="glass-card rounded-2xl p-4 border border-slate-800/80">
                <div class="flex flex-col sm:flex-row items-center gap-3">
                  <div class="relative flex-1 w-full">
                    <i class="fa-solid fa-barcode absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    <input
                      type="text"
                      v-model="lifecycleSearchKey"
                      @keyup.enter="inspectDeviceLifecycle(lifecycleSearchKey)"
                      placeholder="Enter Serial Number (e.g. SATH26000254) for complete lifecycle history..."
                      class="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    @click="inspectDeviceLifecycle(lifecycleSearchKey)"
                    :disabled="loadingLifecycle"
                    class="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <i :class="loadingLifecycle ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-timeline'"></i>
                    <span>Trace Lifecycle</span>
                  </button>
                </div>
              </div>

              <!-- Lifecycle Profile -->
              <div v-if="lifecycleData" class="space-y-4">
                <!-- Device Header -->
                <div class="glass-card rounded-2xl p-5 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl shadow-inner">
                      <i class="fa-solid fa-fingerprint"></i>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="text-base font-extrabold text-white font-mono">{{ lifecycleData.serialNumber }}</h3>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                          {{ lifecycleData.sku }}
                        </span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          DevEUI: {{ lifecycleData.deviceKey }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-400 mt-1">
                        Item Code: <strong class="text-slate-200">{{ lifecycleData.itemCode }}</strong> | Sales Order: <strong class="text-cyan-300">{{ lifecycleData.soNumber }}</strong> | HW/FW: <strong class="text-slate-300">{{ lifecycleData.hwVer }} / {{ lifecycleData.fwVer }}</strong>
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
                      <i class="fa-solid fa-circle-check"></i>
                      <span>Certified Unit</span>
                    </span>
                  </div>
                </div>

                <!-- 5-Stage Visual Stepper Timeline -->
                <div class="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
                    <i class="fa-solid fa-timeline text-purple-400"></i>
                    <span>End-to-End Serialization Timeline (Birth Certificate)</span>
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                    <!-- Step 1: Flashed -->
                    <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                      <div class="flex items-center justify-between">
                        <span class="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                        <span class="text-[10px] font-mono text-emerald-400 font-bold">PASSED</span>
                      </div>
                      <div class="text-xs font-bold text-white">Firmware Flashed</div>
                      <div class="text-[11px] text-slate-400 font-mono">Hex FW: v{{ lifecycleData.fwVer }}</div>
                      <div class="text-[10px] text-slate-500">Factory MCU programmer</div>
                    </div>

                    <!-- Step 2: SO Assigned -->
                    <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                      <div class="flex items-center justify-between">
                        <span class="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                        <span class="text-[10px] font-mono text-emerald-400 font-bold">LINKED</span>
                      </div>
                      <div class="text-xs font-bold text-white">Sales Order Linked</div>
                      <div class="text-[11px] text-cyan-300 font-mono font-bold">{{ lifecycleData.soNumber }}</div>
                      <div class="text-[10px] text-slate-500">Item: {{ lifecycleData.itemCode }}</div>
                    </div>

                    <!-- Step 3: QA Test Results -->
                    <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                      <div class="flex items-center justify-between">
                        <span class="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
                        <span class="text-[10px] font-mono text-emerald-400 font-bold">QA PASS</span>
                      </div>
                      <div class="text-xs font-bold text-white">Functional QA</div>
                      <div class="text-[11px] text-emerald-300 font-mono">Duration: {{ lifecycleData.testResult?.durationTime || '00:30:00' }}</div>
                      <div class="text-[10px] text-slate-500">Station: {{ lifecycleData.testResult?.testStation || 'STATION-01' }}</div>
                    </div>

                    <!-- Step 4: Network Server -->
                    <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                      <div class="flex items-center justify-between">
                        <span class="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-center font-bold">4</span>
                        <span class="text-[10px] font-mono text-emerald-400 font-bold">PROVISIONED</span>
                      </div>
                      <div class="text-xs font-bold text-white">ChirpStack LNS</div>
                      <div class="text-[11px] text-purple-300 font-mono truncate">DevEUI: {{ lifecycleData.deviceKey }}</div>
                      <div class="text-[10px] text-slate-500">OTAA Keys registered</div>
                    </div>

                    <!-- Step 5: Live In-Field Telemetry -->
                    <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                      <div class="flex items-center justify-between">
                        <span class="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-xs flex items-center justify-center font-bold">5</span>
                        <span class="text-[10px] font-mono text-sky-400 font-bold">ONLINE</span>
                      </div>
                      <div class="text-xs font-bold text-white">raw_data3 Logging</div>
                      <div class="text-[11px] text-sky-300 font-mono">{{ lifecycleData.telemetryFramesCount }}</div>
                      <div class="text-[10px] text-slate-500">Continuous telemetry active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
`;
exports.TRACEABILITY_MODALS = `
      <!-- ======================================================== -->
      <!-- MODAL: QA TEST RESULT RECORD DETAILS                     -->
      <!-- ======================================================== -->
      <div v-if="showTraceDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
        <div class="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-200">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <i class="fa-solid fa-clipboard-check text-lg"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">QA Test Verification Record</h3>
                <p class="text-xs text-slate-400 font-mono">
                  PostgreSQL <strong class="text-purple-300">test_result</strong> | ID: {{ selectedTraceItem?.testResultId || selectedTraceItem?.test_result_id || selectedTraceItem?.testId || '—' }}
                </p>
              </div>
            </div>
            <button type="button" @click="closeTraceDetailModal" class="text-slate-400 hover:text-white text-lg p-1 cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Metadata Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">SO Number</span>
              <span class="text-cyan-300 font-bold">{{ selectedTraceItem?.soNumber || selectedTraceItem?.so_number || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Serial Number</span>
              <span class="text-amber-300 font-extrabold">{{ selectedTraceItem?.serialNumber || selectedTraceItem?.serial_number || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Item Code</span>
              <span class="text-slate-200">{{ selectedTraceItem?.itemCode || selectedTraceItem?.item_code || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">SKU</span>
              <span class="text-slate-200">{{ selectedTraceItem?.sku || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Device Key</span>
              <span class="text-purple-300 truncate block">{{ selectedTraceItem?.deviceKey || selectedTraceItem?.device_key || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">HW / FW Ver</span>
              <span class="text-slate-300">{{ selectedTraceItem?.hwVer || selectedTraceItem?.hw_ver || '—' }} / {{ selectedTraceItem?.fwVer || selectedTraceItem?.fw_ver || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Duration</span>
              <span class="text-slate-300">{{ selectedTraceItem?.durationTime || selectedTraceItem?.duration_time || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Finish Time</span>
              <span class="text-slate-400 text-[11px]">{{ formatTraceDate(selectedTraceItem?.timeFinish || selectedTraceItem?.time_finish || selectedTraceItem?.createdAt) }}</span>
            </div>
          </div>

          <!-- Configuration & Parameters Strings (if present) -->
          <div v-if="selectedTraceItem?.configurationString || selectedTraceItem?.configuration_string" class="space-y-2">
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              <i class="fa-solid fa-code text-purple-400 mr-1"></i> Device Memory Map Configuration String:
            </label>
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-purple-200 break-all max-h-32 overflow-y-auto">
              {{ selectedTraceItem?.configurationString || selectedTraceItem?.configuration_string }}
            </div>
          </div>

          <!-- Action Footer -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="closeTraceDetailModal"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Close
            </button>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="closeTraceDetailModal(); inspectDeviceTelemetry(selectedTraceItem)"
                class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <i class="fa-solid fa-satellite-dish"></i>
                <span>Inspect in raw_data3</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: SINGLE RAW PACKET INSPECTOR                       -->
      <!-- ======================================================== -->
      <div v-if="showRawPacketModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
        <div class="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <i class="fa-solid fa-cube text-sm"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white">Raw Uplink Packet Frame</h3>
                <p class="text-[11px] text-slate-400 font-mono">Source: PostgreSQL raw_data3</p>
              </div>
            </div>
            <button type="button" @click="closeRawPacketModal" class="text-slate-400 hover:text-white text-base p-1 cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div v-if="selectedRawPacket" class="space-y-3 text-xs font-mono">
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div class="flex justify-between"><span class="text-slate-500">Timestamp:</span> <span class="text-white">{{ formatTraceDate(selectedRawPacket.epochtime ? selectedRawPacket.epochtime * 1000 : selectedRawPacket.timestamp) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Epoch Time:</span> <span class="text-slate-300">{{ selectedRawPacket.epochtime || '—' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">RSSI:</span> <span class="text-emerald-400 font-bold">{{ selectedRawPacket.rssi ? selectedRawPacket.rssi + ' dBm' : '—' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">SNR:</span> <span class="text-sky-400 font-bold">{{ selectedRawPacket.snr ? selectedRawPacket.snr + ' dB' : '—' }}</span></div>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between items-center text-[11px] text-slate-400">
                <span class="font-bold uppercase">Raw Payload Hex:</span>
                <button
                  type="button"
                  @click="copyText(selectedRawPacket.rawPayload || selectedRawPacket.raw_payload || selectedRawPacket.data)"
                  class="text-sky-400 hover:text-sky-300 text-[10px] cursor-pointer"
                >
                  <i class="fa-regular fa-copy mr-1"></i>Copy
                </button>
              </div>
              <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-amber-300 font-bold break-all text-xs">
                {{ selectedRawPacket.rawPayload || selectedRawPacket.raw_payload || selectedRawPacket.data || '—' }}
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-800">
            <button
              type="button"
              @click="closeRawPacketModal"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL: FIELD WAVEFORM INSPECTOR & TELEMETRY DEEP-DIVE     -->
      <!-- ======================================================== -->
      <div v-if="showFieldInspectModal && inspectingField && inspectChartData" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in overflow-y-auto">
        <div class="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-2xl text-slate-200 my-auto">
          <!-- Modal Header -->
          <div class="flex items-start justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-black border" :class="inspectChartData.colors?.badge || 'bg-sky-500/10 text-sky-300 border-sky-500/30'">
                {{ inspectChartData.key.toUpperCase() }}
              </span>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <span>{{ inspectChartData.label }}</span>
                  <span class="text-xs font-mono font-normal text-slate-400">— Waveform & Telemetry Log</span>
                </h3>
                <p class="text-xs text-slate-400 font-mono">
                  Device: <strong class="text-sky-300">{{ selectedDeviceDetails?.serialNumber || selectedDeviceTelemetry?.serialNumber || selectedTraceItem?.serialNumber || 'SN-UNKNOWN' }}</strong>
                  <span class="mx-1.5 text-slate-600">•</span>
                  DevEUI: <span class="text-slate-300">{{ selectedDeviceDetails?.devEUI || selectedDeviceTelemetry?.devEUI || '—' }}</span>
                  <span class="mx-1.5 text-slate-600">•</span>
                  Total Packets: <strong class="text-emerald-400">{{ inspectChartData.totalCount }} pkts</strong>
                </p>
              </div>
            </div>
            <button type="button" @click="closeFieldInspectModal" class="text-slate-400 hover:text-white text-lg p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Modal Interactive Toolbar: Zoom Window, Toggles, and Data Export Actions -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <!-- Left: Zoom Window Pills -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-slate-500 font-sans font-bold uppercase text-[9px]">Timeline Window:</span>
              <div class="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  @click="inspectModalZoom = 'all'"
                  :class="inspectModalZoom === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-0.5 rounded transition cursor-pointer"
                  title="Show all recorded packets"
                >
                  All ({{ inspectChartData.totalCount }})
                </button>
                <button
                  v-if="inspectChartData.totalCount > 50"
                  type="button"
                  @click="inspectModalZoom = 50"
                  :class="inspectModalZoom === 50 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-0.5 rounded transition cursor-pointer"
                  title="Zoom to last 50 packets"
                >
                  Last 50
                </button>
                <button
                  v-if="inspectChartData.totalCount > 25"
                  type="button"
                  @click="inspectModalZoom = 25"
                  :class="inspectModalZoom === 25 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-0.5 rounded transition cursor-pointer"
                  title="Zoom to last 25 packets"
                >
                  Last 25
                </button>
                <button
                  v-if="inspectChartData.totalCount > 10"
                  type="button"
                  @click="inspectModalZoom = 10"
                  :class="inspectModalZoom === 10 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-2.5 py-0.5 rounded transition cursor-pointer"
                  title="Zoom to last 10 packets"
                >
                  Last 10
                </button>
              </div>
            </div>

            <!-- Right: Display Feature Toggles & Actions -->
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

          <!-- Interactive Live HUD Readout / Metric Strip (Stable Height Container) -->
          <div class="min-h-[52px] flex items-center">
            <div v-if="inspectHoverPoint" class="w-full p-2.5 rounded-xl bg-sky-950 border border-sky-500/40 flex flex-wrap items-center justify-between gap-2 font-mono text-xs animate-in fade-in">
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
            <div v-else class="w-full grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-xs">
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
          </div>

          <!-- Large High-Resolution Waveform Display -->
          <div
            class="w-full bg-slate-950 rounded-xl border border-slate-800 p-2 sm:p-3 relative overflow-hidden cursor-crosshair select-none"
            @mousemove="onInspectChartMouseMove($event)"
            @mouseleave="onInspectChartMouseLeave()"
          >
            <svg class="w-full h-64 overflow-visible" viewBox="0 0 900 260" preserveAspectRatio="none">
              <defs>
                <linearGradient id="modalWaveAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" :stop-color="inspectChartData.colors?.stroke || '#0ea5e9'" stop-opacity="0.32" />
                  <stop offset="100%" :stop-color="inspectChartData.colors?.stroke || '#0ea5e9'" stop-opacity="0.01" />
                </linearGradient>
                <pattern id="modal-osc-grid" width="75" height="41" patternUnits="userSpaceOnUse">
                  <path d="M 75 0 L 0 0 0 41" fill="none" stroke="rgba(148, 163, 184, 0.08)" stroke-width="0.8" stroke-dasharray="2,2" />
                </pattern>
              </defs>

              <rect x="70" y="20" width="805" height="205" fill="#080e1a" rx="4" stroke="#1e293b" stroke-width="1" />
              <rect v-if="inspectShowGrid" x="70" y="20" width="805" height="205" fill="url(#modal-osc-grid)" rx="4" />

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
              <polygon v-if="inspectShowArea" :points="inspectChartData.areaPolygonStr" fill="url(#modalWaveAreaGrad)" />

              <!-- Polyline -->
              <polyline fill="none" :stroke="inspectChartData.colors?.stroke || '#0ea5e9'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :points="inspectChartData.polylineStr" />

              <!-- Data Points -->
              <g v-if="inspectShowDots" class="pointer-events-none">
                <circle
                  v-for="p in inspectChartData.renderedPoints"
                  :key="'m-pt-' + p.index"
                  :cx="p.x"
                  :cy="p.y"
                  :r="inspectHoverPoint?.index === p.index ? 5.5 : 3"
                  :fill="inspectChartData.colors?.stroke || '#0ea5e9'"
                  stroke="#0f172a"
                  stroke-width="1.5"
                />
              </g>

              <!-- Crosshair Lines & Hover Point -->
              <g v-if="inspectHoverPoint" class="pointer-events-none">
                <line :x1="inspectHoverPoint.x" y1="20" :x2="inspectHoverPoint.x" y2="225" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" />
                <line x1="70" :y1="inspectHoverPoint.y" x2="875" :y2="inspectHoverPoint.y" stroke="rgba(56, 189, 248, 0.45)" stroke-width="1.2" stroke-dasharray="3,3" />
                <circle :cx="inspectHoverPoint.x" :cy="inspectHoverPoint.y" r="8" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.6" />
                <circle :cx="inspectHoverPoint.x" :cy="inspectHoverPoint.y" r="5" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
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
exports.TRACEABILITY_SCRIPT = `
function useTraceabilityModule(ctx) {
  const { showToast, authHeaders, activeFeature, copyText, currentUser } = ctx;
  const ref = (typeof Vue !== 'undefined' && Vue.ref) ? Vue.ref : (window.Vue?.ref || (function(v) { return { value: v }; }));
  const computed = (typeof Vue !== 'undefined' && Vue.computed) ? Vue.computed : (window.Vue?.computed || (function(fn) { return { get value() { return fn(); } }; }));
  const watch = (typeof Vue !== 'undefined' && Vue.watch) ? Vue.watch : (window.Vue?.watch || (function() {}));

  const activeTraceTab = ref('test_results'); // 'test_results' | 'telemetry' | 'lifecycle'
  const traceLoading = ref(false);
  const traceResults = ref([]);
  const traceTotal = ref(0);
  const traceMetrics = ref({ totalTests: 0, passCount: 0, failCount: 0, passRate: 0, avgDurationSeconds: 0 });

  const traceFilters = ref({
    search: '',
    soNumber: '',
    serialNumber: '',
    itemCode: '',
    sku: '',
    deviceKey: '',
    result: 'ALL',
    limit: 50,
  });

  const traceFilterTarget = ref('soNumber'); // 'soNumber' | 'serialNumber' | 'itemCode' | 'sku'
  const traceFilterValue = ref('');
  const soCatalogList = ref([]);
  const selectedSoNumber = ref('');
  const soDevicesList = ref([]);
  const loadingSoDevices = ref(false);

  let catalogTabulatorInstance = null;
  let devicesTabulatorInstance = null;
  let initCatalogTimer = null;
  let initDevicesTimer = null;

  const selectedTraceItem = ref(null);
  const showTraceDetailModal = ref(false);

  // Lower Section Details state (Flow 1 test query parameters & telemetry)
  const selectedDeviceDetails = ref(null);
  const loadingDeviceDetails = ref(false);

  // Telemetry (raw_data3) state
  const telemetrySearchKey = ref('');
  const loadingDeviceTelemetry = ref(false);
  const selectedDeviceTelemetry = ref(null);
  const telemetryRawFrames = ref([]);
  const telemetryCalcStats = ref({});
  const showRawPacketModal = ref(false);
  const selectedRawPacket = ref(null);

  // Lifecycle state
  const lifecycleSearchKey = ref('');
  const loadingLifecycle = ref(false);
  const lifecycleData = ref(null);
  const isSeedingTraceData = ref(false);

  const formatStatNum = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    const n = Number(val);
    return isNaN(n) ? String(val) : (n % 1 === 0 ? String(n) : n.toFixed(2));
  };

  // Trend Graph view & channel selection state
  const trendGraphViewMode = ref('all'); // 'all' | 'detail' | 'grid'
  const selectedTrendField = ref('p4');

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
    if (trendGraphViewMode.value === 'grid') {
      trendGraphViewMode.value = 'all';
    }
    if (typeof showToast === 'function') {
      showToast('Spotlight focused on ' + fieldKey.toUpperCase(), 'info');
    }
    try {
      const el = document.getElementById('focused-oscilloscope-visualizer');
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
    const dev = selectedDeviceDetails.value || selectedDeviceTelemetry.value || {};
    const devId = dev.serialNumber || dev.devEUI || dev.deveui || 'DEVICE';
    const filename = devId + '_' + field.key + '_' + Date.now() + '.csv';
    let csv = 'Packet_Index,Timestamp,Epochtime,Field,Field_Label,Value,Min,Avg,Max\\n';
    for (const p of pts) {
      csv += p.index + ',"' + (p.timeStr || '') + '",' + (p.epochtime || '') + ',' + field.key + ',"' + field.label + '",' + p.val + ',' + field.min + ',' + field.avg + ',' + field.max + '\\n';
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
    const text = 'Channel: ' + field.key.toUpperCase() + ' (' + field.label + ')\\nMin: ' + field.min + ' | Avg: ' + field.avg + ' | Max: ' + field.max + ' | Latest: ' + field.latest + ' | Packets: ' + field.count;
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
    const details = selectedDeviceDetails.value || selectedDeviceTelemetry.value;
    if (!details) return [];
    const frames = details.raw_telemetry || details.telemetry || telemetryRawFrames.value || [];
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
              epochtime: ep,
            });
          }
        }
      }

      // CRUCIAL RULE: If field is null or has no data, skip it!
      let validPoints = allValidPoints;
      if (validPoints.length === 0) {
        continue;
      }

      // Apply zoom if set
      const effectiveZoom = cardZoomMap.value[key] || globalCardZoom.value || 'all';
      if (effectiveZoom !== 'all' && Number(effectiveZoom) > 0 && Number(effectiveZoom) < allValidPoints.length) {
        validPoints = allValidPoints.slice(-Number(effectiveZoom));
      }

      const numValues = validPoints.map(p => p.val);
      const minVal = Math.min(...numValues);
      const maxVal = Math.max(...numValues);
      const sum = numValues.reduce((acc, v) => acc + v, 0);
      const avgVal = Number((sum / numValues.length).toFixed(2));
      const latestVal = numValues[numValues.length - 1];
      const count = validPoints.length;

      // SVG Trend Graph Coordinates with 15% cushioning
      const svgW = 320;
      const svgH = 88;
      const padX = 14;
      const padTop = 10;
      const padBottom = 16;
      const plotW = svgW - 2 * padX;
      const plotH = svgH - padTop - padBottom;
      
      let delta = maxVal - minVal;
      if (delta === 0) delta = Math.abs(maxVal) === 0 ? 1 : Math.abs(maxVal) * 0.2;
      const cushion = delta * 0.15;
      const yMinBound = minVal - cushion;
      const yMaxBound = maxVal + cushion;
      const yRange = yMaxBound - yMinBound;

      const renderedPoints = validPoints.map((p, idx) => {
        const x = validPoints.length === 1
          ? (svgW / 2)
          : (padX + (idx / (validPoints.length - 1)) * plotW);
        const norm = (p.val - yMinBound) / yRange;
        const y = padTop + plotH - norm * plotH;
        return {
          x: Number(x.toFixed(1)),
          y: Number(y.toFixed(1)),
          val: p.val,
          timeStr: p.timeStr,
          epochtime: p.epochtime,
          index: p.index,
        };
      });

      const polylineStr = renderedPoints.map(p => p.x + ',' + p.y).join(' ');
      const firstX = renderedPoints[0].x;
      const lastX = renderedPoints[renderedPoints.length - 1].x;
      const baseFloorY = (svgH - padBottom).toFixed(1);
      const areaPolygonStr = firstX + ',' + baseFloorY + ' ' + polylineStr + ' ' + lastX + ',' + baseFloorY;

      const avgNorm = (avgVal - yMinBound) / yRange;
      const avgY = Number((padTop + plotH - avgNorm * plotH).toFixed(1));

      const customLabel = details.calculations?.[key]?.label || details.calculations?.[key]?.name;
      const displayLabel = customLabel || labelsMap[key] || key.toUpperCase();
      const colors = colorAccents[key] || defaultColor;

      const showArea = cardSettingMap.value[key]?.showArea !== undefined ? cardSettingMap.value[key].showArea : globalCardArea.value;
      const showAvg = cardSettingMap.value[key]?.showAvg !== undefined ? cardSettingMap.value[key].showAvg : globalCardAvg.value;
      const showDots = cardSettingMap.value[key]?.showDots !== undefined ? cardSettingMap.value[key].showDots : globalCardDots.value;
      const showGrid = cardSettingMap.value[key]?.showGrid !== undefined ? cardSettingMap.value[key].showGrid : globalCardGrid.value;

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
      // Category filter
      if (trendCategoryFilter.value === 'sensors' && !item.key.startsWith('p')) return false;
      if (trendCategoryFilter.value === 'com' && !item.key.startsWith('com')) return false;
      if (trendCategoryFilter.value === 'active' && item.min === item.max && item.totalCount <= 1) return false;

      // Search filter
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
    if (rawDataFieldList.value && rawDataFieldList.value.length > 0) {
      return rawDataFieldList.value.map(f => ({ key: f.key, label: f.label }));
    }
    const details = selectedDeviceDetails.value || selectedDeviceTelemetry.value;
    if (!details) return [];
    return [
      { key: 'com1', label: 'COM1 (Supply Voltage / RSSI)' },
      { key: 'com2', label: 'COM2 (Operating Current / SNR)' },
      { key: 'p1', label: 'P1 (Event Code)' },
      { key: 'p2', label: 'P2 (Battery Voltage)' },
      { key: 'p4', label: 'P4 (Sensor Channel 1)' },
      { key: 'p5', label: 'P5 (Sensor Channel 2)' },
    ];
  });

  // High-Resolution Focused Oscilloscope Trend Chart Data
  const selectedTrendChartData = computed(() => {
    const details = selectedDeviceDetails.value || selectedDeviceTelemetry.value;
    if (!details) return null;
    const frames = details.raw_telemetry || details.telemetry || telemetryRawFrames.value || [];
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
            epochtime: ep,
          });
        }
      }
    }

    if (allValidPoints.length === 0) return null;

    // Apply focusedChartZoom
    let validPoints = allValidPoints;
    if (focusedChartZoom.value !== 'all' && Number(focusedChartZoom.value) > 0 && Number(focusedChartZoom.value) < allValidPoints.length) {
      validPoints = allValidPoints.slice(-Number(focusedChartZoom.value));
    }

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

    // Boundary padding: 15% cushioning at top and bottom
    const padding = delta * 0.15;
    const yMin = rawMin - padding;
    const yMax = rawMax + padding;
    const yRange = yMax - yMin;

    // SVG dimensions for full width view
    const svgW = 820;
    const svgH = 240;
    const padLeft = 70;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 35;
    const plotW = svgW - padLeft - padRight;
    const plotH = svgH - padTop - padBottom;

    // 5 Horizontal Grid lines & Y-axis labels
    const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
      const y = Number((padTop + plotH - ratio * plotH).toFixed(1));
      const val = yMin + ratio * yRange;
      return {
        ratio,
        y,
        valFormatted: Number.isInteger(val) ? String(val) : val.toFixed(2),
      };
    });

    // Points coordinate mapping
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

    const avgNorm = (rawAvg - yMin) / yRange;
    const avgY = Number((padTop + plotH - avgNorm * plotH).toFixed(1));

    // Vertical Grid lines (5 timeline divisions)
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

    // Median
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));

    // Standard deviation
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

    // Table search filter
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
      '\\nPacket Log:',
      'Index\\tTimestamp\\tValue\\tDiff_Avg\\tStatus',
      ...data.tablePoints.map(p => p.index + '\\t' + p.timeStr + '\\t' + p.val + '\\t' + p.diffFromAvg + '\\t' + p.status),
    ];
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\\n'));
      if (typeof showToast === 'function') showToast('Copied inspection data table to clipboard', 'success');
    }
  };

  const selectDeviceForInspection = async (itemOrId) => {
    if (!itemOrId) return;
    const key = typeof itemOrId === 'string'
      ? itemOrId
      : (itemOrId.serialNumber || itemOrId.serial_number || itemOrId.deviceKey || itemOrId.device_key || itemOrId.testId || itemOrId.test_id || '');
    if (!key) return;

    selectedTraceItem.value = typeof itemOrId === 'object' ? itemOrId : { serialNumber: key };
    loadingDeviceDetails.value = true;
    try {
      const res = await fetch('/api/traceability/device-details?testId=' + encodeURIComponent(key) + '&serialNumber=' + encodeURIComponent(key), {
        headers: authHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        selectedDeviceDetails.value = data;
        selectedDeviceTelemetry.value = data;
        telemetryRawFrames.value = data.raw_telemetry || data.telemetry || [];
        telemetryCalcStats.value = data.calculations || {};
        if (devicesTabulatorInstance) {
          try {
            devicesTabulatorInstance.getRows().forEach(r => {
              const d = r.getData();
              const sn = d ? (d.serialNumber || d.serial_number) : null;
              const isMatch = sn && (sn === (data.serial_number || data.generalInfo?.serialNumber));
              const el = r.getElement();
              if (isMatch) {
                r.select();
                if (el && el.classList) el.classList.add('tabulator-selected', 'device-row-selected');
              } else {
                r.deselect();
                if (el && el.classList) el.classList.remove('tabulator-selected', 'device-row-selected');
              }
            });
            devicesTabulatorInstance.reformat();
          } catch (e) {}
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'No telemetry records in raw_data3 for this device', 'warning');
      }
    } catch (e) {
      console.error('Error fetching device test query parameters:', e);
      showToast('Failed to load device details from raw_data3', 'error');
    } finally {
      loadingDeviceDetails.value = false;
      if (devicesTabulatorInstance) {
        try { devicesTabulatorInstance.reformat(); } catch (e) {}
      }
    }
  };

  const getFilterPlaceholder = () => {
    switch (traceFilterTarget.value) {
      case 'soNumber':
        return 'Enter SO (e.g. 123, 1527, SO/2026/01527...)';
      case 'serialNumber':
        return 'Enter Serial Number (e.g. LRV126000212, SATH...)';
      case 'itemCode':
        return 'Enter Item Code (e.g. WSLRW-V1A-025, WSLRW-ATH-01...)';
      case 'sku':
        return 'Enter Product SKU (e.g. WSLRW-V1A, WSLRW-ATH...)';
      default:
        return 'Search...';
    }
  };

  const getFilterTargetLabel = () => {
    switch (traceFilterTarget.value) {
      case 'soNumber': return 'SO Number';
      case 'serialNumber': return 'Serial (SN)';
      case 'itemCode': return 'Item Code';
      case 'sku': return 'SKU';
      default: return 'Filter';
    }
  };

  const onFilterTargetChange = () => {
    traceFilters.value.soNumber = '';
    traceFilters.value.serialNumber = '';
    traceFilters.value.itemCode = '';
    traceFilters.value.sku = '';
    if (traceFilterValue.value.trim()) {
      applyTraceFilter();
    }
  };

  const applyTraceFilter = () => {
    const val = traceFilterValue.value.trim();
    traceFilters.value.soNumber = '';
    traceFilters.value.serialNumber = '';
    traceFilters.value.itemCode = '';
    traceFilters.value.sku = '';
    if (val) {
      traceFilters.value[traceFilterTarget.value] = val;
    }
    fetchTestResults();
  };

  const selectSoRow = async (soData) => {
    if (!soData) return;
    const soNum = typeof soData === 'string' ? soData : (soData.soNumber || soData.so_number);
    if (!soNum) return;
    selectedSoNumber.value = soNum;
    if (catalogTabulatorInstance) {
      try {
        catalogTabulatorInstance.getRows().forEach(r => {
          const d = r.getData();
          const rSo = d ? (d.soNumber || d.so_number) : null;
          const isMatch = rSo === soNum;
          const el = r.getElement();
          if (isMatch) {
            try { r.select(); } catch (err) {}
            if (el && el.classList) el.classList.add('tabulator-selected', 'so-row-selected');
          } else {
            try { r.deselect(); } catch (err) {}
            if (el && el.classList) el.classList.remove('tabulator-selected', 'so-row-selected');
          }
        });
        catalogTabulatorInstance.reformat();
        try { if (typeof catalogTabulatorInstance.redraw === 'function') catalogTabulatorInstance.redraw(true); } catch (e) {}
      } catch (e) {}
    }
    await fetchDevicesForSelectedSo(soNum);
  };

  const deselectSoRow = () => {
    selectedSoNumber.value = '';
    if (catalogTabulatorInstance) {
      try {
        catalogTabulatorInstance.deselectRow();
        catalogTabulatorInstance.getRows().forEach(r => {
          const el = r.getElement();
          if (el && el.classList) {
            el.classList.remove('tabulator-selected', 'so-row-selected');
          }
        });
        catalogTabulatorInstance.reformat();
        try { if (typeof catalogTabulatorInstance.redraw === 'function') catalogTabulatorInstance.redraw(true); } catch (e) {}
      } catch (e) {}
    }
    soDevicesList.value = [];
    if (devicesTabulatorInstance) {
      try { devicesTabulatorInstance.setData([]); } catch (e) {}
    }
    deselectDevice();
  };

  const deselectDevice = () => {
    selectedDeviceDetails.value = null;
    selectedDeviceTelemetry.value = null;
    telemetryRawFrames.value = [];
    telemetryCalcStats.value = {};
    selectedTraceItem.value = null;
    if (devicesTabulatorInstance) {
      try {
        devicesTabulatorInstance.deselectRow();
        devicesTabulatorInstance.getRows().forEach(r => {
          const el = r.getElement();
          if (el && el.classList) {
            el.classList.remove('tabulator-selected', 'device-row-selected');
          }
        });
        devicesTabulatorInstance.reformat();
        try { if (typeof devicesTabulatorInstance.redraw === 'function') devicesTabulatorInstance.redraw(true); } catch (e) {}
      } catch (e) {}
    }
  };

  const fetchDevicesForSelectedSo = async (soNumber) => {
    if (!soNumber) {
      soDevicesList.value = [];
      return;
    }
    loadingSoDevices.value = true;
    try {
      const res = await fetch('/api/traceability/test-results?soNumber=' + encodeURIComponent(soNumber) + '&limit=1000', {
        headers: authHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        let items = json.data || json.items || [];
        if (items.length === 0 && traceResults.value.length > 0) {
          items = traceResults.value.filter(r => (r.soNumber || r.so_number) === soNumber);
        }
        soDevicesList.value = items;

        // Maintain device selection only if previously selected and exists in new list
        if (items.length > 0 && selectedDeviceDetails.value) {
          const curSn = selectedDeviceDetails.value?.serial_number || selectedDeviceDetails.value?.generalInfo?.serialNumber;
          const match = items.find(d => (d.serialNumber || d.serial_number) === curSn);
          if (match) {
            selectDeviceForInspection(match);
          } else {
            deselectDevice();
          }
        } else {
          deselectDevice();
        }
      } else {
        if (traceResults.value.length > 0) {
          soDevicesList.value = traceResults.value.filter(r => (r.soNumber || r.so_number) === soNumber);
        }
      }
    } catch (err) {
      console.error('Error fetching devices for SO:', err);
      if (traceResults.value.length > 0) {
        soDevicesList.value = traceResults.value.filter(r => (r.soNumber || r.so_number) === soNumber);
      }
    } finally {
      loadingSoDevices.value = false;
    }

    Vue.nextTick(() => {
      initDevicesTabulator();
    });
  };

  const exportSelectedSoCsv = () => {
    const so = selectedSoNumber.value;
    if (!so) {
      showToast('Please select a Sales Order first', 'warning');
      return;
    }
    window.open('/api/traceability/export-csv?soNumber=' + encodeURIComponent(so), '_blank');
  };

  const initCatalogTabulator = (retryCount = 0) => {
    const container = document.getElementById('trace-catalog-tabulator');
    if (!container || typeof Tabulator === 'undefined') {
      if (retryCount < 10) {
        clearTimeout(initCatalogTimer);
        initCatalogTimer = setTimeout(() => initCatalogTabulator(retryCount + 1), 100);
      }
      return;
    }

    if (catalogTabulatorInstance) {
      try {
        catalogTabulatorInstance.setData(soCatalogList.value || []);
        try { if (typeof catalogTabulatorInstance.redraw === 'function') catalogTabulatorInstance.redraw(true); } catch (e) {}
        return;
      } catch (e) {
        try { catalogTabulatorInstance.destroy(); } catch (err) {}
        catalogTabulatorInstance = null;
      }
    }

    container.innerHTML = '';

    catalogTabulatorInstance = new Tabulator(container, {
      data: soCatalogList.value,
      layout: 'fitColumns',
      height: '320px',
      pagination: false,
      placeholder: 'No Sales Orders matched',
      selectableRows: 1, // Only allow exactly 1 row to be selected at a time
      rowFormatter: (row) => {
        const d = row.getData();
        const so = d ? (d.soNumber || d.so_number) : null;
        const isSel = so && so === selectedSoNumber.value;
        const el = row.getElement();
        if (el && el.classList) {
          if (isSel) {
            el.classList.add('tabulator-selected', 'so-row-selected');
          } else {
            el.classList.remove('tabulator-selected', 'so-row-selected');
          }
        }
      },
      columns: [
        {
          title: 'SO Number',
          field: 'soNumber',
          headerFilter: 'list',
          headerFilterParams: {
            valuesLookup: 'all',
            clearable: true,
            autocomplete: true,
            sort: 'asc',
          },
          headerFilterFunc: (headerValue, rowValue) => {
            if (!headerValue) return true;
            return String(rowValue || '').toLowerCase().includes(String(headerValue).toLowerCase().trim());
          },
          headerFilterPlaceholder: 'All SOs...',
          formatter: (cell) => {
            const val = cell.getValue() || '—';
            return '<span class="font-bold font-mono text-cyan-300 flex items-center gap-1.5"><i class="fa-solid fa-folder-closed text-purple-400 text-[11px]"></i>' + val + '</span>';
          },
        },
        {
          title: 'Item Code',
          field: 'itemCode',
          headerFilter: 'list',
          headerFilterParams: {
            valuesLookup: 'all',
            clearable: true,
            autocomplete: true,
            sort: 'asc',
          },
          headerFilterFunc: (headerValue, rowValue) => {
            if (!headerValue) return true;
            return String(rowValue || '').toLowerCase().includes(String(headerValue).toLowerCase().trim());
          },
          headerFilterPlaceholder: 'All Items...',
          formatter: (cell) => '<span class="text-slate-300 font-mono text-[11px] truncate">' + (cell.getValue() || '—') + '</span>',
        },
        {
          title: 'SKU',
          field: 'sku',
          headerFilter: 'list',
          headerFilterParams: {
            valuesLookup: 'all',
            clearable: true,
            autocomplete: true,
            sort: 'asc',
          },
          headerFilterFunc: (headerValue, rowValue) => {
            if (!headerValue) return true;
            return String(rowValue || '').toLowerCase().includes(String(headerValue).toLowerCase().trim());
          },
          headerFilterPlaceholder: 'All SKUs...',
          formatter: (cell) => '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">' + (cell.getValue() || '—') + '</span>',
        },
        {
          title: 'Total',
          field: 'totalDevices',
          sorter: 'number',
          width: 75,
          hozAlign: 'center',
          formatter: (cell) => '<span class="font-mono font-bold text-white text-xs">' + (cell.getValue() || 0) + '</span>',
        },
        {
          title: 'PASS',
          field: 'passCount',
          sorter: 'number',
          width: 85,
          hozAlign: 'center',
          formatter: (cell) => {
            const val = cell.getValue() || 0;
            return '<span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1"><i class="fa-solid fa-check text-[10px]"></i>' + val + '</span>';
          },
        },
        {
          title: 'FAIL',
          field: 'failCount',
          sorter: 'number',
          width: 85,
          hozAlign: 'center',
          formatter: (cell) => {
            const val = cell.getValue() || 0;
            return '<span class="px-2 py-0.5 rounded font-mono font-bold text-xs ' + (val > 0 ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-extrabold' : 'bg-slate-800/80 text-slate-400 border border-slate-700/50') + ' inline-flex items-center gap-1"><i class="fa-solid fa-xmark text-[10px]"></i>' + val + '</span>';
          },
        },
        {
          title: 'Pass Rate',
          field: 'passRate',
          sorter: 'number',
          width: 140,
          formatter: (cell) => {
            const pct = cell.getValue() || 0;
            return '<div class="w-full pr-2"><div class="flex justify-between text-[10px] font-mono mb-0.5"><span class="text-cyan-300 font-bold">' + pct + '%</span></div><div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div class="bg-cyan-500 h-full rounded-full" style="width:' + pct + '%"></div></div></div>';
          },
        },
        {
          title: 'Action',
          field: '_action',
          headerSort: false,
          width: 95,
          hozAlign: 'center',
          formatter: (cell) => {
            const d = cell.getData();
            const so = d ? (d.soNumber || d.so_number) : null;
            const isSel = so && selectedSoNumber.value === so;
            return '<button type="button" class="so-select-btn px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ' +
              (isSel ? 'bg-sky-600 text-white shadow-sm' : 'bg-sky-500/15 hover:bg-sky-500/30 text-sky-300 border border-sky-500/25') +
              '"><i class="fa-solid ' + (isSel ? 'fa-check' : 'fa-folder-open') + ' text-[10px]"></i><span>' +
              (isSel ? 'Active' : 'Select') + '</span></button>';
          },
          cellClick: (e, cell) => {
            const row = cell.getRow();
            if (row) {
              handleSoRowClick(e, row);
            }
          },
        },
      ],
    });

    let _lastSoHandledTime = 0;
    let _lastSoHandledVal = null;
    const handleSoRowClick = (e, row) => {
      if (!row) return;
      const d = row.getData();
      if (!d) return;
      const so = d.soNumber || d.so_number;
      if (!so) return;

      const now = Date.now();
      if (_lastSoHandledVal === so && now - _lastSoHandledTime < 250) {
        return;
      }
      _lastSoHandledTime = now;
      _lastSoHandledVal = so;

      if (selectedSoNumber.value === so) {
        deselectSoRow();
      } else {
        selectSoRow(d);
      }
    };

    catalogTabulatorInstance.on('rowClick', (e, row) => {
      handleSoRowClick(e, row);
    });

    catalogTabulatorInstance.on('cellClick', (e, cell) => {
      const row = cell.getRow();
      if (row) {
        handleSoRowClick(e, row);
      }
    });

    catalogTabulatorInstance.on('tableBuilt', () => {
      if (selectedSoNumber.value) {
        try {
          catalogTabulatorInstance.getRows().forEach(r => {
            const d = r.getData();
            const rSo = d ? (d.soNumber || d.so_number) : null;
            const isMatch = rSo === selectedSoNumber.value;
            const el = r.getElement();
            if (isMatch) {
              try { r.select(); } catch (err) {}
              if (el && el.classList) el.classList.add('tabulator-selected', 'so-row-selected');
            } else {
              try { r.deselect(); } catch (err) {}
              if (el && el.classList) el.classList.remove('tabulator-selected', 'so-row-selected');
            }
          });
        } catch (e) {}
      }
    });

    catalogTabulatorInstance.on('dataFiltered', (filters, rows) => {
      if (rows && rows.length > 0) {
        const stillSelected = rows.find(r => {
          const d = r.getData();
          const rSo = d ? (d.soNumber || d.so_number) : null;
          return rSo === selectedSoNumber.value;
        });
        if (!stillSelected) {
          deselectSoRow();
        } else {
          try {
            stillSelected.select();
            const el = stillSelected.getElement();
            if (el && el.classList) el.classList.add('tabulator-selected', 'so-row-selected');
          } catch (e) {}
        }
      }
    });

    container.onclick = (e) => {
      const rowEl = e.target.closest('.tabulator-row');
      if (rowEl && catalogTabulatorInstance) {
        const row = catalogTabulatorInstance.getRow(rowEl);
        if (row) {
          handleSoRowClick(e, row);
        }
      }
    };
  };

  const initDevicesTabulator = (retryCount = 0) => {
    const container = document.getElementById('trace-devices-tabulator');
    if (!container || typeof Tabulator === 'undefined') {
      if (retryCount < 10) {
        clearTimeout(initDevicesTimer);
        initDevicesTimer = setTimeout(() => initDevicesTabulator(retryCount + 1), 100);
      }
      return;
    }

    if (devicesTabulatorInstance) {
      try {
        devicesTabulatorInstance.setData(soDevicesList.value || []);
        try { if (typeof devicesTabulatorInstance.redraw === 'function') devicesTabulatorInstance.redraw(true); } catch (e) {}
        return;
      } catch (e) {
        try { devicesTabulatorInstance.destroy(); } catch (err) {}
        devicesTabulatorInstance = null;
      }
    }

    container.innerHTML = '';

    devicesTabulatorInstance = new Tabulator(container, {
      data: soDevicesList.value,
      layout: 'fitColumns',
      height: '380px',
      pagination: false,
      placeholder: 'No tested devices found for this SO',
      selectableRows: 1,
      rowFormatter: (row) => {
        const d = row.getData();
        const sn = d ? (d.serialNumber || d.serial_number) : null;
        const curSn = selectedDeviceDetails.value ? (selectedDeviceDetails.value.serial_number || selectedDeviceDetails.value.generalInfo?.serialNumber) : null;
        const isSel = sn && curSn && sn === curSn;
        const el = row.getElement();
        if (el && el.classList) {
          if (isSel) {
            el.classList.add('tabulator-selected', 'device-row-selected');
          } else {
            el.classList.remove('tabulator-selected', 'device-row-selected');
          }
        }
      },
      columns: [
        {
          title: '#',
          width: 45,
          headerSort: false,
          formatter: (cell) => '<span class="text-slate-500 font-mono text-center block text-[11px]">' + (cell.getRow().getPosition()) + '</span>',
        },
        {
          title: 'SERIAL_NUMBER',
          field: 'serialNumber',
          headerFilter: 'input',
          formatter: (cell) => {
            const d = cell.getData();
            const sn = cell.getValue() || d.serial_number || '—';
            return '<div class="flex items-center gap-1.5"><span class="font-extrabold text-amber-300 font-mono tracking-tight">' + sn + '</span><button type="button" data-copy-sn="' + sn + '" class="text-slate-500 hover:text-white p-0.5 cursor-pointer" title="Copy Serial"><i class="fa-regular fa-copy text-[10px]"></i></button></div>';
          },
        },
        {
          title: 'DEV_EUI',
          field: 'deviceKey',
          headerFilter: 'input',
          formatter: (cell) => {
            const d = cell.getData();
            const eui = cell.getValue() || d.device_key || d.devEUI || d.dev_eui || '—';
            return '<div class="flex items-center gap-1.5"><span class="font-mono text-purple-300 font-semibold text-[11px]">' + eui + '</span><button type="button" data-copy-eui="' + eui + '" class="text-slate-500 hover:text-white p-0.5 cursor-pointer" title="Copy DevEUI"><i class="fa-regular fa-copy text-[10px]"></i></button></div>';
          },
        },
        {
          title: 'SO Number',
          field: 'soNumber',
          headerFilter: 'input',
          formatter: (cell) => {
            const d = cell.getData();
            return '<span class="font-bold text-cyan-300 font-mono">' + (cell.getValue() || d.so_number || '—') + '</span>';
          },
        },
        {
          title: 'Item Code',
          field: 'itemCode',
          headerFilter: 'input',
          formatter: (cell) => {
            const d = cell.getData();
            return '<span class="text-slate-300 font-mono text-[11px] truncate">' + (cell.getValue() || d.item_code || '—') + '</span>';
          },
        },
        {
          title: 'SKU',
          field: 'sku',
          headerFilter: 'input',
          formatter: (cell) => '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">' + (cell.getValue() || '—') + '</span>',
        },
        {
          title: 'HW / FW',
          formatter: (cell) => {
            const d = cell.getData();
            return '<span class="text-slate-400 text-[11px] font-mono">' + (d.hwVer || d.hw_ver || '—') + ' / ' + (d.fwVer || d.fw_ver || '—') + '</span>';
          },
        },
        {
          title: 'QA Result',
          field: 'result',
          headerFilter: 'select',
          headerFilterParams: { values: { "": "ALL", "PASS": "PASS", "FAIL": "FAIL" } },
          formatter: (cell) => {
            const r = cell.getValue();
            const ok = isTestPassed(r);
            return '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border inline-flex items-center gap-1 ' + (ok ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30') + '"><i class="' + (ok ? 'fa-solid fa-check' : 'fa-solid fa-xmark') + '"></i><span>' + (ok ? 'PASS' : 'FAIL') + '</span></span>';
          },
        },
        {
          title: 'Duration',
          field: 'durationTime',
          formatter: (cell) => {
            const d = cell.getData();
            return '<span class="text-slate-400 font-mono text-[11px]">' + (cell.getValue() || d.duration_time || '—') + '</span>';
          },
        },
        {
          title: 'Finish Time',
          field: 'timeFinish',
          sorter: 'number',
          formatter: (cell) => {
            const d = cell.getData();
            const val = cell.getValue() || d.time_finish || d.createdAt;
            return '<span class="text-slate-400 font-mono text-[11px]">' + formatTraceDate(val) + '</span>';
          },
        },
        {
          title: 'Action',
          headerSort: false,
          width: 100,
          formatter: (cell) => {
            const d = cell.getData();
            const sn = d.serialNumber || d.serial_number;
            const curSn = selectedDeviceDetails.value ? (selectedDeviceDetails.value.serial_number || selectedDeviceDetails.value.generalInfo?.serialNumber) : null;
            const isSel = curSn && sn && curSn === sn;
            return '<button type="button" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ' + (isSel ? 'bg-sky-600 text-white shadow-sm' : 'bg-sky-500/15 hover:bg-sky-500/30 text-sky-300 border border-sky-500/25') + '"><i class="fa-solid fa-microchip text-[10px]"></i><span>' + (isSel ? 'Selected' : 'Inspect') + '</span></button>';
          },
          cellClick: (e, cell) => {
            const row = cell.getRow();
            if (row) {
              handleDeviceRowClick(e, row);
            }
          },
        },
      ],
    });

    let _lastDeviceHandledTime = 0;
    let _lastDeviceHandledVal = null;
    const handleDeviceRowClick = (e, row) => {
      if (!row) return;
      const target = e ? e.target : null;
      if (target && target.closest('[data-copy-sn]')) {
        copyText(target.closest('[data-copy-sn]').getAttribute('data-copy-sn'));
        return;
      }
      if (target && target.closest('[data-copy-eui]')) {
        copyText(target.closest('[data-copy-eui]').getAttribute('data-copy-eui'));
        return;
      }
      const d = row.getData();
      if (!d) return;
      const sn = d.serialNumber || d.serial_number;
      if (!sn) return;

      const now = Date.now();
      if (_lastDeviceHandledVal === sn && now - _lastDeviceHandledTime < 250) {
        return;
      }
      _lastDeviceHandledTime = now;
      _lastDeviceHandledVal = sn;

      const curSn = selectedDeviceDetails.value ? (selectedDeviceDetails.value.serial_number || selectedDeviceDetails.value.generalInfo?.serialNumber) : null;
      if (curSn && curSn === sn) {
        deselectDevice();
      } else {
        selectDeviceForInspection(d);
      }
    };

    devicesTabulatorInstance.on('rowClick', (e, row) => {
      handleDeviceRowClick(e, row);
    });

    devicesTabulatorInstance.on('cellClick', (e, cell) => {
      const row = cell.getRow();
      if (row) {
        handleDeviceRowClick(e, row);
      }
    });

    container.onclick = (e) => {
      const rowEl = e.target.closest('.tabulator-row');
      if (rowEl && devicesTabulatorInstance) {
        const row = devicesTabulatorInstance.getRow(rowEl);
        if (row) {
          handleDeviceRowClick(e, row);
        }
      }
    };
  };

  const fetchTestResults = async () => {
    traceLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (traceFilters.value.search && traceFilters.value.search.trim()) {
        params.append('search', traceFilters.value.search.trim());
      }
      if (traceFilters.value.soNumber && traceFilters.value.soNumber.trim()) {
        params.append('soNumber', traceFilters.value.soNumber.trim());
      }
      if (traceFilters.value.serialNumber && traceFilters.value.serialNumber.trim()) {
        params.append('serialNumber', traceFilters.value.serialNumber.trim());
      }
      if (traceFilters.value.itemCode && traceFilters.value.itemCode.trim()) {
        params.append('itemCode', traceFilters.value.itemCode.trim());
      }
      if (traceFilters.value.sku && traceFilters.value.sku.trim()) {
        params.append('sku', traceFilters.value.sku.trim());
      }
      if (traceFilters.value.result && traceFilters.value.result !== 'ALL') {
        params.append('result', traceFilters.value.result);
      }
      params.append('limit', String(traceFilters.value.limit || 50));

      // 1. Fetch aggregated SO Catalog from PostgreSQL
      try {
        const catRes = await fetch('/api/traceability/so-catalog?' + params.toString(), {
          headers: authHeaders(),
          credentials: 'include',
        });
        if (catRes.ok) {
          const catJson = await catRes.json();
          const list = catJson.data || [];
          soCatalogList.value = list.map(item => ({
            ...item,
            latestFinishTime: formatTraceDate(item.latestFinishTime || item.latestFinishTimeFormatted),
          }));
        }
      } catch (err) {
        console.warn('so-catalog endpoint unavailable, falling back to client aggregation:', err);
      }

      // 2. Fetch test results
      const res = await fetch('/api/traceability/test-results?' + params.toString(), {
        headers: authHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const items = json.data || json.items || [];
        traceResults.value = items;
        traceTotal.value = json.total || items.length;

        // Client-side aggregation fallback if soCatalogList is empty
        if (soCatalogList.value.length === 0 && items.length > 0) {
          const map = new Map();
          for (const d of items) {
            const so = d.soNumber || d.so_number || 'UNKNOWN_SO';
            if (!map.has(so)) {
              map.set(so, {
                soNumber: so,
                itemCode: d.itemCode || d.item_code || '—',
                sku: d.sku || '—',
                hwVer: d.hwVer || d.hw_ver || '—',
                fwVer: d.fwVer || d.fw_ver || '—',
                totalDevices: 0,
                passCount: 0,
                failCount: 0,
                passRate: 0,
                latestFinishTime: formatTraceDate(d.timeFinish || d.time_finish || d.createdAt),
              });
            }
            const entry = map.get(so);
            entry.totalDevices++;
            if (isTestPassed(d.result)) entry.passCount++;
            else entry.failCount++;
            entry.passRate = Math.round((entry.passCount / entry.totalDevices) * 100);
          }
          soCatalogList.value = Array.from(map.values());
        }

        if (json.metrics) {
          traceMetrics.value = {
            totalTests: json.metrics.totalTests || items.length,
            passCount: json.metrics.passCount || 0,
            failCount: json.metrics.failCount || 0,
            passRate: json.metrics.passRate || 0,
            avgDurationSeconds: json.metrics.avgDurationSeconds || 0,
          };
        } else {
          let pass = 0;
          items.forEach(r => {
            if (isTestPassed(r.result)) pass++;
          });
          const total = items.length;
          const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
          traceMetrics.value = {
            totalTests: total,
            passCount: pass,
            failCount: total - pass,
            passRate,
            avgDurationSeconds: 180,
          };
        }

        // Maintain selection if already chosen, but DO NOT force auto-selection of the first row on load/refresh
        if (soCatalogList.value.length > 0 && selectedSoNumber.value) {
          const found = soCatalogList.value.find(s => (s.soNumber || s.so_number) === selectedSoNumber.value);
          if (found) {
            await selectSoRow({ soNumber: found.soNumber || found.so_number });
          } else {
            deselectSoRow();
          }
        } else {
          deselectSoRow();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to query test_result from PostgreSQL', 'error');
      }
    } catch (e) {
      console.error('Error fetching test results:', e);
      showToast('Network error querying test results', 'error');
    } finally {
      traceLoading.value = false;
      Vue.nextTick(() => {
        initCatalogTabulator();
        if (selectedSoNumber.value && soDevicesList.value.length > 0) {
          initDevicesTabulator();
        }
      });
    }
  };

  const resetTraceFilters = () => {
    traceFilterTarget.value = 'soNumber';
    traceFilterValue.value = '';
    traceFilters.value = {
      search: '',
      soNumber: '',
      serialNumber: '',
      itemCode: '',
      sku: '',
      deviceKey: '',
      result: 'ALL',
      limit: 50,
    };
    fetchTestResults();
  };

  const inspectDeviceTelemetry = async (itemOrKey) => {
    const key = typeof itemOrKey === 'string'
      ? itemOrKey
      : (itemOrKey.serialNumber || itemOrKey.serial_number || itemOrKey.deviceKey || itemOrKey.device_key || itemOrKey.testId || '');
    if (!key) return;
    activeTraceTab.value = 'telemetry';
    telemetrySearchKey.value = key;
    await fetchDeviceTelemetryDetails(key);
  };

  const fetchDeviceTelemetryDetails = async (key) => {
    if (!key || !key.trim()) {
      showToast('Please enter a Serial Number or Device Key', 'warning');
      return;
    }
    const cleanKey = key.trim();
    loadingDeviceTelemetry.value = true;
    try {
      const res = await fetch('/api/traceability/device-details?serialNumber=' + encodeURIComponent(cleanKey) + '&testId=' + encodeURIComponent(cleanKey), {
        headers: authHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        selectedDeviceTelemetry.value = data;
        selectedDeviceDetails.value = data;
        telemetryRawFrames.value = data.raw_telemetry || data.telemetry || [];
        telemetryCalcStats.value = data.calculations || {};
        showToast('Loaded ' + (telemetryRawFrames.value.length) + ' telemetry frames from raw_data3', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'No telemetry records in raw_data3 for this device', 'warning');
        selectedDeviceTelemetry.value = null;
        telemetryRawFrames.value = [];
        telemetryCalcStats.value = {};
      }
    } catch (e) {
      console.error('Error fetching device telemetry details:', e);
      showToast('Failed to load raw_data3 telemetry', 'error');
    } finally {
      loadingDeviceTelemetry.value = false;
    }
  };

  const viewTraceDetail = (item) => {
    selectedTraceItem.value = item;
    showTraceDetailModal.value = true;
  };

  const closeTraceDetailModal = () => {
    showTraceDetailModal.value = false;
    selectedTraceItem.value = null;
  };

  const viewRawPacket = (packet) => {
    selectedRawPacket.value = packet;
    showRawPacketModal.value = true;
  };

  const closeRawPacketModal = () => {
    showRawPacketModal.value = false;
    selectedRawPacket.value = null;
  };

  const inspectDeviceLifecycle = async (snOrKey) => {
    if (!snOrKey || !snOrKey.trim()) {
      showToast('Please enter a Serial Number', 'warning');
      return;
    }
    const clean = snOrKey.trim();
    activeTraceTab.value = 'lifecycle';
    lifecycleSearchKey.value = clean;
    loadingLifecycle.value = true;

    try {
      // Find matching test result
      let trItem = traceResults.value.find(r => (r.serialNumber === clean || r.serial_number === clean || r.deviceKey === clean));
      if (!trItem) {
        const res = await fetch('/api/traceability/test-results?search=' + encodeURIComponent(clean) + '&limit=1', {
          headers: authHeaders(),
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          trItem = (json.data && json.data[0]) || null;
        }
      }

      lifecycleData.value = {
        serialNumber: clean,
        sku: trItem?.sku || 'WSLRW-ATH',
        itemCode: trItem?.itemCode || trItem?.item_code || 'WSLRW-ATH-01',
        soNumber: trItem?.soNumber || trItem?.so_number || 'SO2603001',
        deviceKey: trItem?.deviceKey || trItem?.device_key || '0018B27100000001',
        fwVer: trItem?.fwVer || trItem?.fw_ver || '1F0926',
        hwVer: trItem?.hwVer || trItem?.hw_ver || '1H',
        testResult: trItem,
        telemetryFramesCount: '15+ frames in raw_data3',
        lastSeen: trItem?.timeFinish || trItem?.createdAt || new Date().toISOString(),
      };
    } catch (e) {
      console.error('Lifecycle trace error:', e);
    } finally {
      loadingLifecycle.value = false;
    }
  };

  const exportTraceabilityCsv = () => {
    const params = new URLSearchParams();
    if (traceFilters.value.search && traceFilters.value.search.trim()) {
      params.append('search', traceFilters.value.search.trim());
    }
    if (traceFilters.value.soNumber && traceFilters.value.soNumber.trim()) {
      params.append('soNumber', traceFilters.value.soNumber.trim());
    }
    if (traceFilters.value.serialNumber && traceFilters.value.serialNumber.trim()) {
      params.append('serialNumber', traceFilters.value.serialNumber.trim());
    }
    if (traceFilters.value.itemCode && traceFilters.value.itemCode.trim()) {
      params.append('itemCode', traceFilters.value.itemCode.trim());
    }
    if (traceFilters.value.sku && traceFilters.value.sku.trim()) {
      params.append('sku', traceFilters.value.sku.trim());
    }
    if (traceFilters.value.result && traceFilters.value.result !== 'ALL') {
      params.append('result', traceFilters.value.result);
    }
    window.open('/api/traceability/export-csv?' + params.toString(), '_blank');
  };

  const exportDeviceTelemetryCsv = () => {
    const sn = selectedDeviceDetails.value?.serial_number || selectedDeviceTelemetry.value?.generalInfo?.serialNumber || selectedDeviceTelemetry.value?.serial_number || telemetrySearchKey.value;
    if (!sn) return;
    window.open('/api/traceability/export-csv?serialNumber=' + encodeURIComponent(sn), '_blank');
  };

  const seedSampleTraceData = async () => {
    isSeedingTraceData.value = true;
    try {
      const res = await fetch('/api/traceability/seed', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        showToast('Baseline test results & raw_data3 frames seeded successfully!', 'success');
        await fetchTestResults();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Seeding baseline data failed', 'error');
      }
    } catch (e) {
      console.error('Seed error:', e);
      showToast('Error connecting to seed endpoint', 'error');
    } finally {
      isSeedingTraceData.value = false;
    }
  };

  const isTestPassed = (res) => {
    const s = String(res || '').toUpperCase();
    return s === 'PASS' || s === 'PASSED' || s === 'OK' || s === '1' || s === 'TRUE';
  };

  const formatTraceDate = (val) => {
    if (!val) return '—';
    try {
      let d;
      if (typeof val === 'number') {
        d = new Date(val < 1e11 ? val * 1000 : val);
      } else if (typeof val === 'string' && /^\d+$/.test(val.trim())) {
        const num = Number(val.trim());
        d = new Date(num < 1e11 ? num * 1000 : num);
      } else {
        d = new Date(val);
      }
      if (isNaN(d.getTime())) return String(val);
      const pad = (n) => String(n).padStart(2, '0');
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return y + '-' + m + '-' + day + ' ' + hh + ':' + mm + ':' + ss;
    } catch (e) {
      return String(val);
    }
  };

  const formatDuration = (secOrStr) => {
    if (!secOrStr) return '00:00';
    if (typeof secOrStr === 'string' && secOrStr.includes(':')) return secOrStr;
    const s = Number(secOrStr);
    if (isNaN(s)) return String(secOrStr);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  };

  // Watch for activeFeature selection to auto-fetch
  watch(() => activeFeature.value, (newFeat) => {
    if (newFeat && (newFeat.id === 'traceability' || newFeat.id === 'product-traceability')) {
      if (traceResults.value.length === 0) {
        fetchTestResults();
      }
    }
  }, { immediate: true });

  watch(() => activeTraceTab.value, (newTab) => {
    if (newTab === 'test_results') {
      Vue.nextTick(() => {
        initCatalogTabulator();
        initDevicesTabulator();
      });
    }
  });

  return {
    activeTraceTab,
    traceLoading,
    traceResults,
    traceTotal,
    traceMetrics,
    traceFilters,
    traceFilterTarget,
    traceFilterValue,
    getFilterPlaceholder,
    getFilterTargetLabel,
    onFilterTargetChange,
    applyTraceFilter,
    soCatalogList,
    selectedSoNumber,
    soDevicesList,
    loadingSoDevices,
    selectSoRow,
    deselectSoRow,
    deselectDevice,
    fetchDevicesForSelectedSo,
    exportSelectedSoCsv,
    initCatalogTabulator,
    initDevicesTabulator,
    selectedTraceItem,
    showTraceDetailModal,
    selectedDeviceDetails,
    loadingDeviceDetails,
    selectDeviceForInspection,
    formatStatNum,
    rawDataFieldList,
    filteredRawDataFieldList,
    trendGraphViewMode,
    selectedTrendField,
    availableTrendFields,
    selectedTrendChartData,
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
    telemetrySearchKey,
    loadingDeviceTelemetry,
    selectedDeviceTelemetry,
    telemetryRawFrames,
    telemetryCalcStats,
    showRawPacketModal,
    selectedRawPacket,
    lifecycleSearchKey,
    loadingLifecycle,
    lifecycleData,
    isSeedingTraceData,
    fetchTestResults,
    resetTraceFilters,
    inspectDeviceTelemetry,
    fetchDeviceTelemetryDetails,
    viewTraceDetail,
    closeTraceDetailModal,
    viewRawPacket,
    closeRawPacketModal,
    inspectDeviceLifecycle,
    exportTraceabilityCsv,
    exportDeviceTelemetryCsv,
    seedSampleTraceData,
    isTestPassed,
    formatTraceDate,
    formatDuration,
  };
}
`;
//# sourceMappingURL=traceability.module.js.map