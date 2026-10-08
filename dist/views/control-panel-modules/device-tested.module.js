"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEVICE_TESTED_SCRIPT = exports.DEVICE_TESTED_MODALS = exports.DEVICE_TESTED_TEMPLATE = void 0;
exports.DEVICE_TESTED_TEMPLATE = `
        <!-- C-MODULE: DEVICE TESTED (QA INSPECTION) -->
        <div v-show="activeTab === 'device-tested'" class="space-y-6">
          <!-- Header Banner & KPI Ribbon -->
          <div class="glass-card rounded-2xl p-5 border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl shadow-inner">
                <i class="fa-solid fa-vial-circle-check"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-extrabold text-white">Device Tested Catalog (QA Inspection)</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">C-MODULE</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">QA VERIFIED</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">
                  Import QA inspection CSV files, inspect 6-field validation rules, and organize tested inventory by Sales Order tree view.
                </p>
              </div>
            </div>

            <!-- Header Action Buttons -->
            <div class="flex items-center gap-3">
              <button
                @click="dtOpenImportModal"
                class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold cursor-pointer transition flex items-center gap-2 shadow-lg shadow-cyan-900/30"
              >
                <i class="fa-solid fa-file-arrow-up"></i>
                <span>Import QA CSV</span>
              </button>

              <button
                @click="dtFetchData"
                :disabled="dtLoading"
                class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition flex items-center gap-2 shadow"
                title="Refresh QA tested devices"
              >
                <i class="fa-solid fa-rotate" :class="{ 'fa-spin': dtLoading }"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- KPI Ribbon (5 KPI Cards) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <!-- Total SOs -->
            <div class="glass-card rounded-xl p-3.5 border border-slate-800 bg-slate-900/70 shadow flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-base">
                <i class="fa-solid fa-folder-tree"></i>
              </div>
              <div>
                <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total SOs</p>
                <p class="text-lg font-black text-white font-mono leading-tight">{{ dtKpis.totalSos }}</p>
              </div>
            </div>

            <!-- Total Devices Tested -->
            <div class="glass-card rounded-xl p-3.5 border border-slate-800 bg-slate-900/70 shadow flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-base">
                <i class="fa-solid fa-microchip"></i>
              </div>
              <div>
                <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Devices Tested</p>
                <p class="text-lg font-black text-sky-400 font-mono leading-tight">{{ dtKpis.totalDevices }}</p>
              </div>
            </div>

            <!-- Fully Verified (PASS) -->
            <div class="glass-card rounded-xl p-3.5 border border-slate-800 bg-slate-900/70 shadow flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-base">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fully Verified</p>
                <p class="text-lg font-black text-emerald-400 font-mono leading-tight">{{ dtKpis.fullyVerified }}</p>
              </div>
            </div>

            <!-- Failed / Rejected -->
            <div class="glass-card rounded-xl p-3.5 border border-slate-800 bg-slate-900/70 shadow flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-base">
                <i class="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Failed / Rejected</p>
                <p class="text-lg font-black text-rose-400 font-mono leading-tight">{{ dtKpis.failed }}</p>
              </div>
            </div>

            <!-- Pass Rate -->
            <div class="glass-card rounded-xl p-3.5 border border-slate-800 bg-slate-900/70 shadow flex items-center gap-3 col-span-2 sm:col-span-1">
              <div class="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-base">
                <i class="fa-solid fa-chart-line"></i>
              </div>
              <div>
                <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pass Rate</p>
                <p class="text-lg font-black text-amber-400 font-mono leading-tight">{{ dtKpis.passRate }}%</p>
              </div>
            </div>
          </div>

          <!-- Action Toolbar & Filter Controls -->
          <div class="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
            <div class="flex flex-wrap items-center gap-3 flex-1">
              <!-- Search Box -->
              <div class="relative min-w-[240px] max-w-sm flex-1">
                <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  v-model="dtSearchQuery"
                  type="text"
                  placeholder="Search by SO, Serial Number, DevEUI, Item Code..."
                  class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-500 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />
                <button
                  v-if="dtSearchQuery"
                  @click="dtSearchQuery = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <!-- Status Filter Dropdown -->
              <select
                v-model="dtStatusFilter"
                class="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-500 text-xs text-white focus:outline-none transition cursor-pointer"
              >
                <option value="ALL">All Statuses (All Devices)</option>
                <option value="ELIGIBLE">Eligible (auto_check=PASS & result=PASS)</option>
                <option value="RESULT_FAIL">Result FAIL</option>
                <option value="AUTO_FAIL">Auto Check FAIL</option>
              </select>
            </div>

            <!-- Tree View Expand / Collapse All -->
            <div class="flex items-center gap-2">
              <button
                @click="dtExpandAllSos"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition flex items-center gap-1.5"
              >
                <i class="fa-solid fa-angles-down text-[10px]"></i>
                <span>Expand All</span>
              </button>
              <button
                @click="dtCollapseAllSos"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition flex items-center gap-1.5"
              >
                <i class="fa-solid fa-angles-up text-[10px]"></i>
                <span>Collapse All</span>
              </button>
            </div>
          </div>

          <!-- Tree View: Sales Order -> Serial Numbers -->
          <div class="space-y-4">
            <div v-if="dtLoading && dtTreeGroups.length === 0" class="p-12 text-center text-slate-400">
              <i class="fa-solid fa-circle-notch fa-spin text-3xl text-cyan-400 mb-3"></i>
              <p class="text-xs">Loading tested devices tree catalog...</p>
            </div>

            <div v-else-if="dtFilteredTreeGroups.length === 0" class="glass-card rounded-2xl p-12 text-center border border-slate-800 text-slate-400 space-y-3">
              <i class="fa-solid fa-folder-open text-4xl text-slate-600"></i>
              <p class="text-sm font-semibold text-white">No tested devices found matching filters</p>
              <p class="text-xs text-slate-500">Import a QA CSV file or clear search queries to view records.</p>
              <button
                @click="dtOpenImportModal"
                class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer mt-2"
              >
                <i class="fa-solid fa-file-arrow-up"></i>
                <span>Import QA CSV File</span>
              </button>
            </div>

            <!-- Sales Order Tree Node Cards -->
            <div
              v-for="soGroup in dtFilteredTreeGroups"
              :key="soGroup.so_number"
              class="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-lg transition"
            >
              <!-- SO Header Accordion Strip -->
              <div
                @click="dtToggleSoGroup(soGroup.so_number)"
                class="px-5 py-4 bg-slate-900/90 hover:bg-slate-850 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 transition select-none"
              >
                <div class="flex items-center gap-3">
                  <span class="text-slate-400 text-sm w-5 text-center">
                    <i
                      class="fa-solid transition-transform duration-200"
                      :class="dtExpandedSos[soGroup.so_number] ? 'fa-folder-open text-cyan-400' : 'fa-folder text-slate-500'"
                    ></i>
                  </span>
                  <div>
                    <div class="flex items-center gap-2.5">
                      <span class="text-sm font-black text-white font-mono tracking-tight">{{ soGroup.so_number }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {{ soGroup.filteredDevices.length }} {{ soGroup.filteredDevices.length === 1 ? 'Device' : 'Devices' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 self-end md:self-auto">
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border"
                      :class="soGroup.pass_count === soGroup.total_devices ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
                    >
                      {{ soGroup.pass_count }} PASS / {{ soGroup.fail_count }} FAIL
                    </span>
                  </div>
                  <i
                    class="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform duration-200"
                    :class="{ 'rotate-180': dtExpandedSos[soGroup.so_number] }"
                  ></i>
                </div>
              </div>

              <!-- Collapsible Devices Table under SO -->
              <div v-show="dtExpandedSos[soGroup.so_number]" class="p-0 overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-slate-950/70 border-b border-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th class="py-3 px-4">Serial Number</th>
                      <th class="py-3 px-4">Device Key (DevEUI)</th>
                      <th class="py-3 px-4">Item Code</th>
                      <th class="py-3 px-4">SKU / HW / FW</th>
                      <th class="py-3 px-4 text-center">Auto Check</th>
                      <th class="py-3 px-4 text-center">Result</th>
                      <th class="py-3 px-4">Final Config AppKey</th>
                      <th class="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-850">
                    <tr
                      v-for="dev in soGroup.filteredDevices"
                      :key="dev.id || dev.serial_number"
                      class="hover:bg-slate-800/40 transition"
                    >
                      <!-- Serial Number -->
                      <td class="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {{ dev.serial_number }}
                      </td>

                      <!-- DevEUI -->
                      <td class="py-3 px-4 font-mono text-cyan-300 whitespace-nowrap">
                        {{ dev.device_key || '—' }}
                      </td>

                      <!-- Item Code -->
                      <td class="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {{ dev.item_code }}
                      </td>

                      <!-- SKU / HW / FW -->
                      <td class="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <span class="font-semibold text-slate-200">{{ dev.sku || 'WSLRW' }}</span>
                        <span class="text-slate-500 mx-1">|</span>
                        <span class="font-mono text-slate-400">HW {{ dev.hw_ver || '—' }}</span>
                        <span class="text-slate-500 mx-1">|</span>
                        <span class="font-mono text-slate-400">FW {{ dev.fw_ver || '—' }}</span>
                      </td>

                      <!-- Auto Check Badge -->
                      <td class="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                          :class="String(dev.auto_check).toUpperCase() === 'PASS' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'"
                        >
                          {{ dev.auto_check || 'FAIL' }}
                        </span>
                      </td>

                      <!-- Result Badge -->
                      <td class="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                          :class="(String(dev.result).toUpperCase() === 'PASS' || String(dev.result).toUpperCase() === 'PASSED') ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'"
                        >
                          {{ dev.result || 'FAIL' }}
                        </span>
                      </td>

                      <!-- Final Config AppKey -->
                      <td class="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                        <span v-if="dev.app_key" class="text-amber-300" :title="dev.app_key">
                          {{ dev.app_key.substr(0, 8) }}...{{ dev.app_key.substr(-8) }}
                        </span>
                        <span v-else class="text-slate-600">—</span>
                      </td>

                      <!-- Actions -->
                      <td class="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          @click="dtOpenDeviceDetailModal(dev)"
                          class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer transition flex items-center gap-1.5 ml-auto"
                          title="View 63 QA inspection fields"
                        >
                          <i class="fa-solid fa-list-check text-cyan-400 text-[10px]"></i>
                          <span>QA Details</span>
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
exports.DEVICE_TESTED_MODALS = `
        <!-- MODAL: IMPORT QA CSV FILE -->
        <div
          v-if="dtShowImportModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div class="glass-card rounded-2xl border border-slate-800 bg-slate-900 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-file-csv text-cyan-400 text-lg"></i>
                <h3 class="text-sm font-bold text-white">Import QA Testing CSV</h3>
              </div>
              <button
                @click="dtCloseImportModal"
                class="text-slate-400 hover:text-white text-sm cursor-pointer p-1"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4 overflow-y-auto">
              <p class="text-xs text-slate-400">
                Upload QA inspection CSV file exported from QA test stations (matches 63 columns format of <code class="text-cyan-300">device_tested.csv</code>).
              </p>

              <!-- Drag and Drop Dropzone -->
              <div
                @dragover.prevent="dtDragOver = true"
                @dragleave.prevent="dtDragOver = false"
                @drop.prevent="dtHandleFileDrop"
                class="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition"
                :class="dtDragOver ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'"
                @click="$refs.dtFileInput.click()"
              >
                <input
                  ref="dtFileInput"
                  type="file"
                  accept=".csv"
                  class="hidden"
                  @change="dtHandleFileSelect"
                />
                <i class="fa-solid fa-cloud-arrow-up text-3xl text-cyan-400 mb-2"></i>
                <p class="text-xs font-semibold text-white">Click or drag & drop QA CSV file here</p>
                <p class="text-[11px] text-slate-500 mt-1">Supports standard CSV with UTF-8 encoding</p>
              </div>

              <!-- Selected File Preview -->
              <div v-if="dtSelectedFileName" class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div class="flex items-center gap-2 text-slate-300">
                  <i class="fa-solid fa-file-csv text-emerald-400"></i>
                  <span>{{ dtSelectedFileName }}</span>
                  <span class="text-slate-500 text-[11px]">({{ dtCsvLinesCount }} rows)</span>
                </div>
                <button
                  @click="dtClearSelectedFile"
                  class="text-slate-500 hover:text-rose-400 text-xs cursor-pointer"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>

              <!-- Paste Raw CSV Text Fallback -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-300">Or paste raw CSV text:</label>
                <textarea
                  v-model="dtRawCsvText"
                  rows="4"
                  placeholder="Paste CSV contents with header row..."
                  class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition resize-none"
                ></textarea>
              </div>

              <!-- Import Feedback Status -->
              <div v-if="dtImportResult" class="p-3.5 rounded-xl border text-xs" :class="dtImportResult.success ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'">
                <p class="font-bold flex items-center gap-1.5">
                  <i class="fa-solid" :class="dtImportResult.success ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
                  <span>{{ dtImportResult.message }}</span>
                </p>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-3.5 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/60">
              <button
                type="button"
                @click="dtCloseImportModal"
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="dtSubmitCsvImport"
                :disabled="dtImporting || (!dtRawCsvText && !dtSelectedFileName)"
                class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold cursor-pointer transition flex items-center gap-2 shadow disabled:opacity-40"
              >
                <i class="fa-solid" :class="dtImporting ? 'fa-circle-notch fa-spin' : 'fa-upload'"></i>
                <span>{{ dtImporting ? 'Importing...' : 'Upload & Process CSV' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL: INSPECT DEVICE QA DETAILS (63 CSV FIELDS) -->
        <div
          v-if="dtShowDetailModal && dtSelectedDevice"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div class="glass-card rounded-2xl border border-slate-800 bg-slate-900 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm">
                  <i class="fa-solid fa-microchip"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white font-mono">{{ dtSelectedDevice.serial_number }}</h3>
                  <p class="text-[11px] text-slate-400">DevEUI: <span class="font-mono text-cyan-300">{{ dtSelectedDevice.device_key }}</span> | SO: <span class="font-mono text-slate-200">{{ dtSelectedDevice.so_number }}</span></p>
                </div>
              </div>
              <button
                @click="dtCloseDeviceDetailModal"
                class="text-slate-400 hover:text-white text-sm cursor-pointer p-1"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Body Grid -->
            <div class="p-6 overflow-y-auto space-y-4">
              <!-- Key QA Indicators Ribbon -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p class="text-[10px] text-slate-500 uppercase font-semibold">Auto Check</p>
                  <p class="text-sm font-bold font-mono" :class="dtSelectedDevice.auto_check === 'PASS' ? 'text-emerald-400' : 'text-rose-400'">{{ dtSelectedDevice.auto_check }}</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p class="text-[10px] text-slate-500 uppercase font-semibold">Overall Result</p>
                  <p class="text-sm font-bold font-mono" :class="dtSelectedDevice.result === 'PASS' ? 'text-emerald-400' : 'text-rose-400'">{{ dtSelectedDevice.result }}</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p class="text-[10px] text-slate-500 uppercase font-semibold">Item Code</p>
                  <p class="text-xs font-mono text-white truncate" :title="dtSelectedDevice.item_code">{{ dtSelectedDevice.item_code }}</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p class="text-[10px] text-slate-500 uppercase font-semibold">Hardware / FW</p>
                  <p class="text-xs font-mono text-slate-300">HW {{ dtSelectedDevice.hw_ver }} | FW {{ dtSelectedDevice.fw_ver }}</p>
                </div>
              </div>

              <!-- Full Raw Data Table -->
              <div class="border border-slate-800 rounded-xl overflow-hidden">
                <div class="px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>QA Inspection Attributes (63 Columns)</span>
                  <span class="text-[11px] text-slate-500 font-mono">{{ Object.keys(dtSelectedDevice.csv_raw_data || {}).length }} fields</span>
                </div>
                <div class="max-h-72 overflow-y-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    <tbody class="divide-y divide-slate-850">
                      <tr v-for="(val, key) in (dtSelectedDevice.csv_raw_data || {})" :key="key" class="hover:bg-slate-800/30">
                        <td class="py-2 px-4 font-mono font-semibold text-slate-400 bg-slate-950/40 w-1/3 truncate" :title="key">{{ key }}</td>
                        <td class="py-2 px-4 font-mono text-white break-all">{{ val }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-3.5 border-t border-slate-800 flex items-center justify-end bg-slate-950/60">
              <button
                type="button"
                @click="dtCloseDeviceDetailModal"
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
`;
exports.DEVICE_TESTED_SCRIPT = `
    function useDeviceTestedModule(ctx) {
      // Defensive Vue API destructuring with infallible fallbacks
      const vueObj = (typeof Vue !== 'undefined') ? Vue : (typeof window !== 'undefined' && window.Vue ? window.Vue : {});
      const {
        ref = (v => ({ value: v })),
        computed = (fn => ({ get value() { return fn(); } })),
        watch = (() => {}),
        onMounted = (() => {}),
      } = vueObj;

      const nextTick = (vueObj && typeof vueObj.nextTick === 'function')
        ? vueObj.nextTick
        : (typeof window !== 'undefined' && typeof window.nextTick === 'function')
          ? window.nextTick
          : (cb => (typeof Promise !== 'undefined' ? Promise.resolve().then(cb) : setTimeout(cb, 0)));

      const { showToast, authHeaders, activeTab } = ctx || {};

      const dtLoading = ref(false);
      const dtTreeGroups = ref([]);
      const dtSearchQuery = ref('');
      const dtStatusFilter = ref('ALL');
      const dtExpandedSos = ref({});

      // Modals state
      const dtShowImportModal = ref(false);
      const dtShowDetailModal = ref(false);
      const dtSelectedDevice = ref(null);
      const dtDragOver = ref(false);
      const dtSelectedFileName = ref('');
      const dtCsvLinesCount = ref(0);
      const dtRawCsvText = ref('');
      const dtImporting = ref(false);
      const dtImportResult = ref(null);

      // KPIs
      const dtKpis = computed(() => {
        let totalSos = dtTreeGroups.value.length;
        let totalDevices = 0;
        let fullyVerified = 0;
        let failed = 0;

        for (const g of dtTreeGroups.value) {
          totalDevices += g.total_devices || 0;
          fullyVerified += g.pass_count || 0;
          failed += g.fail_count || 0;
        }

        const passRate = totalDevices > 0 ? Math.round((fullyVerified / totalDevices) * 100) : 100;
        return { totalSos, totalDevices, fullyVerified, failed, passRate };
      });

      // Filtered Tree Groups
      const dtFilteredTreeGroups = computed(() => {
        const q = dtSearchQuery.value.trim().toLowerCase();
        const sf = dtStatusFilter.value;

        return dtTreeGroups.value.map(group => {
          let devices = group.devices || [];

          // Search query filter
          if (q) {
            devices = devices.filter(d =>
              (d.serial_number && d.serial_number.toLowerCase().includes(q)) ||
              (d.device_key && d.device_key.toLowerCase().includes(q)) ||
              (d.item_code && d.item_code.toLowerCase().includes(q)) ||
              (group.so_number && group.so_number.toLowerCase().includes(q))
            );
          }

          // Status filter
          if (sf === 'ELIGIBLE') {
            devices = devices.filter(d =>
              String(d.auto_check).toUpperCase() === 'PASS' &&
              (String(d.result).toUpperCase() === 'PASS' || String(d.result).toUpperCase() === 'PASSED')
            );
          } else if (sf === 'RESULT_FAIL') {
            devices = devices.filter(d =>
              String(d.result).toUpperCase() === 'FAIL' || String(d.result).toUpperCase() === 'FAILED'
            );
          } else if (sf === 'AUTO_FAIL') {
            devices = devices.filter(d =>
              String(d.auto_check).toUpperCase() === 'FAIL'
            );
          }

          return {
            ...group,
            filteredDevices: devices,
          };
        }).filter(group => {
          // If search query is applied, only show groups with matching devices or matching SO name
          if (q) {
            return group.filteredDevices.length > 0 || group.so_number.toLowerCase().includes(q);
          }
          if (sf !== 'ALL') {
            return group.filteredDevices.length > 0;
          }
          return true;
        });
      });

      const dtFetchData = async () => {
        dtLoading.value = true;
        try {
          const res = await fetch('/api/device-tested/tree', {
            headers: authHeaders ? authHeaders() : {},
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            dtTreeGroups.value = json.data;
            // Expand first SO by default
            if (json.data.length > 0 && Object.keys(dtExpandedSos.value).length === 0) {
              dtExpandedSos.value[json.data[0].so_number] = true;
            }
          }
        } catch (err) {
          console.error('[Device Tested] Failed to fetch tree:', err);
          if (showToast) showToast('Failed to load tested devices: ' + (err.message || err), 'error');
        } finally {
          dtLoading.value = false;
        }
      };

      const dtToggleSoGroup = (soNumber) => {
        dtExpandedSos.value[soNumber] = !dtExpandedSos.value[soNumber];
      };

      const dtExpandAllSos = () => {
        const next = {};
        for (const g of dtTreeGroups.value) {
          next[g.so_number] = true;
        }
        dtExpandedSos.value = next;
      };

      const dtCollapseAllSos = () => {
        dtExpandedSos.value = {};
      };

      const dtOpenImportModal = () => {
        dtShowImportModal.value = true;
        dtImportResult.value = null;
      };

      const dtCloseImportModal = () => {
        dtShowImportModal.value = false;
        dtSelectedFileName.value = '';
        dtRawCsvText.value = '';
        dtImportResult.value = null;
      };

      const dtClearSelectedFile = () => {
        dtSelectedFileName.value = '';
        dtCsvLinesCount.value = 0;
        dtRawCsvText.value = '';
      };

      const dtHandleFileSelect = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        readFile(file);
      };

      const dtHandleFileDrop = (e) => {
        dtDragOver.value = false;
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;
        readFile(file);
      };

      const readFile = (file) => {
        dtSelectedFileName.value = file.name;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target.result;
          dtRawCsvText.value = text;
          dtCsvLinesCount.value = (text.match(/\\n/g) || []).length;
        };
        reader.readAsText(file);
      };

      const dtSubmitCsvImport = async () => {
        if (!dtRawCsvText.value && !dtSelectedFileName.value) return;
        dtImporting.value = true;
        dtImportResult.value = null;

        try {
          const res = await fetch('/api/device-tested/import-csv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeaders ? authHeaders() : {}),
            },
            body: JSON.stringify({ csv_content: dtRawCsvText.value }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            dtImportResult.value = { success: true, message: json.message || 'Import completed successfully' };
            if (showToast) showToast('QA CSV imported successfully!', 'success');
            setTimeout(() => {
              dtCloseImportModal();
              dtFetchData();
            }, 1200);
          } else {
            dtImportResult.value = { success: false, message: json.message || 'Failed to import CSV' };
            if (showToast) showToast('Import failed: ' + (json.message || 'Error'), 'error');
          }
        } catch (err) {
          dtImportResult.value = { success: false, message: err.message || 'Network error importing CSV' };
          if (showToast) showToast('Import request error: ' + (err.message || err), 'error');
        } finally {
          dtImporting.value = false;
        }
      };

      const dtOpenDeviceDetailModal = (device) => {
        dtSelectedDevice.value = device;
        dtShowDetailModal.value = true;
      };

      const dtCloseDeviceDetailModal = () => {
        dtShowDetailModal.value = false;
        dtSelectedDevice.value = null;
      };

      watch(activeTab, (tab) => {
        if (tab === 'device-tested') {
          nextTick(() => {
            dtFetchData();
          });
        }
      });

      onMounted(() => {
        if (activeTab && activeTab.value === 'device-tested') {
          dtFetchData();
        }
      });

      return {
        dtLoading,
        dtTreeGroups,
        dtSearchQuery,
        dtStatusFilter,
        dtExpandedSos,
        dtShowImportModal,
        dtShowDetailModal,
        dtSelectedDevice,
        dtDragOver,
        dtSelectedFileName,
        dtCsvLinesCount,
        dtRawCsvText,
        dtImporting,
        dtImportResult,
        dtKpis,
        dtFilteredTreeGroups,
        dtFetchData,
        dtToggleSoGroup,
        dtExpandAllSos,
        dtCollapseAllSos,
        dtOpenImportModal,
        dtCloseImportModal,
        dtClearSelectedFile,
        dtHandleFileSelect,
        dtHandleFileDrop,
        dtSubmitCsvImport,
        dtOpenDeviceDetailModal,
        dtCloseDeviceDetailModal,
      };
    }

    if (typeof window !== 'undefined') {
      window.useDeviceTestedModule = useDeviceTestedModule;
    }
`;
//# sourceMappingURL=device-tested.module.js.map