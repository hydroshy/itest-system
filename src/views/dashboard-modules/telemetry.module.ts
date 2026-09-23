// ========================================================
// D-MODULE: LIVE TELEMETRY MATRIX & PACKET DECODER
// ========================================================

export const TELEMETRY_TEMPLATE = `          <div v-else-if="activeFeature.id === 'telemetry-decoder'" class="space-y-4">

            <!-- Header Toolbar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-xl">
              <div class="flex items-center gap-3.5">
                <button @click="returnToHome" title="Back to Dashboard" class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition">
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 text-xl shadow-inner">
                  <i class="fa-solid fa-table-cells"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-sm font-bold text-white tracking-wide">LIVE TELEMETRY & SENSOR MATRIX</h3>
                    <span v-if="telemetryLoaded" class="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[10px] font-bold font-mono">
                      {{ sortedDashboardMatrixRows.length }} / {{ dashboardMatrixRows.length }} RECORDS
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Time-series tabular log — network metadata & decoded sensor telemetry</p>
                </div>
              </div>
              <!-- Auto-Sync Controls (visible when telemetry loaded) -->
              <div v-if="telemetryLoaded" class="flex items-center gap-2 flex-wrap">
                <button
                  @click="toggleAutoSync"
                  :title="autoSyncEnabled ? 'Click to Pause Auto-Sync' : 'Click to Enable Auto-Sync'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 cursor-pointer"
                  :class="autoSyncEnabled ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60' : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'"
                >
                  <span class="relative flex h-2 w-2">
                    <span v-if="autoSyncEnabled" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2" :class="autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-500'"></span>
                  </span>
                  <span class="font-mono text-[11px] font-bold">{{ autoSyncEnabled ? 'LIVE (3s)' : 'PAUSED' }}</span>
                </button>
                <button
                  @click="fetchLiveTelemetry(false)"
                  title="Manually fetch latest telemetry packets"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': loadingTelemetry }"></i>
                  <span>REFRESH</span>
                </button>
              </div>
            </div>

            <!-- TOP CONTROLS PANEL: CONTROLS (LEFT) + DEVICE INFO (RIGHT) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

              <!-- LEFT (lg:col-span-7): SELECT DEVICE, TIME RANGE, SHOW & DELETE BUTTONS -->
              <div class="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xl">
                <!-- 1. Select Device -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="block text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                      <i class="fa-solid fa-microchip text-purple-400 mr-1.5"></i>DEVICE
                    </label>
                    <span v-if="devicesList.length > 0" class="text-[10px] text-slate-500 font-mono">
                      {{ devicesList.length }} devices
                    </span>
                  </div>
                  <select
                    v-model="selectedTelemetryDeviceEUI"
                    @change="onSelectTelemetryDevice"
                    class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner transition"
                  >
                    <option value="" class="bg-slate-900 text-slate-400">-- SELECT DEVICE --</option>
                    <option v-for="dev in devicesList" :key="dev.devEUI" :value="dev.devEUI" class="bg-slate-900 text-slate-200">
                      {{ dev.name }}
                    </option>
                  </select>
                </div>

                <!-- 2. Select Time Range -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="block text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                      <i class="fa-solid fa-calendar-days text-sky-400 mr-1.5"></i>TIME RANGE
                    </label>
                    <button
                      v-if="telemetryRangeStart || telemetryRangeEnd"
                      @click="telemetryRangeStart = ''; telemetryRangeEnd = '';"
                      class="text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer transition font-bold"
                      title="Clear date range"
                    >
                      <i class="fa-solid fa-xmark mr-1"></i>RESET DATES
                    </button>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[10px] text-slate-500 font-bold mb-1 uppercase">FROM</label>
                      <input
                        v-model="telemetryRangeStart"
                        type="datetime-local"
                        class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500 shadow-inner"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-slate-500 font-bold mb-1 uppercase">TO</label>
                      <input
                        v-model="telemetryRangeEnd"
                        type="datetime-local"
                        class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500 shadow-inner"
                      />
                    </div>
                  </div>
                  <p class="text-[10px] text-slate-500">Leave empty to show all packets</p>
                </div>

                <!-- 3. SHOW & DELETE Buttons -->
                <div class="flex items-center gap-3 pt-2 border-t border-slate-800">
                  <button
                    @click="showTelemetry"
                    :disabled="!selectedTelemetryDeviceEUI || loadingTelemetry"
                    title="Fetch and display telemetry packets"
                    class="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30 transition"
                  >
                    <i class="fa-solid" :class="loadingTelemetry ? 'fa-spinner fa-spin' : 'fa-play'"></i>
                    <span>SHOW</span>
                  </button>
                  <button
                    @click="clearTelemetry"
                    title="Reset selection and clear table"
                    class="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <i class="fa-solid fa-trash-can text-rose-400"></i>
                    <span>DELETE</span>
                  </button>
                </div>
              </div>

              <!-- RIGHT (lg:col-span-5): DEVICE INFO DISPLAY -->
              <div class="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
                <div>
                  <div class="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase tracking-wider pb-3 border-b border-slate-800/80">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 text-xs">
                        <i class="fa-solid fa-circle-info"></i>
                      </div>
                      <span>DEVICE INFO</span>
                    </div>
                    <span
                      v-if="selectedTelemetryDevice"
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wide flex items-center gap-1.5"
                      :class="selectedTelemetryDevice.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'"
                    >
                      <span class="inline-block w-1.5 h-1.5 rounded-full" :class="selectedTelemetryDevice.isActive !== false ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                      {{ selectedTelemetryDevice.isActive !== false ? 'ACTIVE' : 'INACTIVE' }}
                    </span>
                  </div>

                  <div v-if="selectedTelemetryDevice" class="grid grid-cols-2 sm:grid-cols-3 gap-4 py-3.5 text-xs">
                    <div>
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">NAME</span>
                      <span class="text-white font-mono font-bold truncate block text-sm" :title="selectedTelemetryDevice.name">
                        {{ selectedTelemetryDevice.name }}
                      </span>
                    </div>
                    <div>
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">DEV EUI</span>
                      <span class="text-purple-300 font-mono font-semibold truncate block" :title="selectedTelemetryDevice.devEUI">
                        {{ selectedTelemetryDevice.devEUI }}
                      </span>
                    </div>
                    <div>
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">STATUS</span>
                      <span :class="selectedTelemetryDevice.isActive !== false ? 'text-emerald-400' : 'text-rose-400'" class="font-bold font-mono">
                        {{ selectedTelemetryDevice.isActive !== false ? 'ACTIVE' : 'INACTIVE' }}
                      </span>
                    </div>
                    <div class="sm:col-span-2">
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">SERVER</span>
                      <span class="text-amber-300 font-mono font-semibold truncate block" :title="selectedTelemetryDevice.networkServer?.name || 'CHIRPSTACK TEST'">
                        {{ (selectedTelemetryDevice.networkServer?.name || 'CHIRPSTACK TEST').toUpperCase() }}
                      </span>
                    </div>
                    <div>
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">PACKETS</span>
                      <span class="text-white font-bold font-mono text-base">
                        {{ telemetryLoaded ? dashboardMatrixRows.length : '—' }}
                      </span>
                    </div>
                  </div>

                  <div v-else class="py-12 flex flex-col items-center justify-center text-center text-slate-500">
                    <i class="fa-solid fa-microchip text-2xl text-slate-700 mb-2"></i>
                    <p class="text-xs">No device selected.</p>
                    <p class="text-[11px] text-slate-600 mt-0.5">Choose a device from the left panel to view info.</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- BOTTOM SECTION: TABULAR TABLE -->
            <div v-if="!telemetryLoaded" class="py-16 text-center text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl p-8">
              <div class="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-2xl mx-auto mb-3">
                <i class="fa-solid fa-satellite-dish"></i>
              </div>
              <h4 class="text-sm font-bold text-white mb-1">Telemetry Table is Empty</h4>
              <p class="text-slate-400 max-w-md mx-auto">
                Please select a device above and click <span class="text-purple-400 font-bold font-mono">SHOW</span> to display telemetry packets.
              </p>
            </div>

            <div v-else class="space-y-3">
              <!-- Search & Filter Toolbar -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <!-- Search -->
                <div class="relative flex-1 min-w-[200px]">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    v-model="telemetrySearchQuery"
                    type="text"
                    placeholder="Search sensor values or timestamps..."
                    class="w-full pl-8 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                  <button
                    v-if="telemetrySearchQuery"
                    @click="telemetrySearchQuery = ''"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                  ><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  <!-- Row Count Badge -->
                  <span v-if="sortedDashboardMatrixRows.length > 0" class="text-[11px] font-mono font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-inner">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{{ sortedDashboardMatrixRows.length }} rows</span>
                  </span>

                  <!-- Reset Filter -->
                  <button
                    v-if="isTelemetryFilterActive"
                    @click="resetTelemetryFilters"
                    title="Clear all filters"
                    class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <i class="fa-solid fa-filter-circle-xmark text-rose-400"></i>
                    <span>RESET</span>
                  </button>

                  <!-- Export Dropdown -->
                  <div class="relative export-dropdown-container">
                    <button
                      @click="exportDropdownOpen = !exportDropdownOpen"
                      :disabled="sortedDashboardMatrixRows.length === 0"
                      class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-300 hover:text-emerald-300 flex items-center gap-2 cursor-pointer shadow-inner transition"
                      title="Export telemetry data to file"
                    >
                      <i class="fa-solid fa-file-export text-emerald-400"></i>
                      <span>EXPORT</span>
                      <i class="fa-solid fa-chevron-down text-[9px] transition-transform duration-200" :class="exportDropdownOpen ? 'rotate-180 text-emerald-400' : 'text-slate-500'"></i>
                    </button>

                    <!-- Export Dropdown Menu -->
                    <div
                      v-if="exportDropdownOpen"
                      @click.stop
                      class="absolute right-0 top-full mt-2 z-30 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 min-w-[200px] space-y-1"
                    >
                      <div class="text-[10px] font-bold text-slate-400 uppercase px-2.5 py-1 tracking-wider border-b border-slate-800">
                        EXPORT AS ({{ sortedDashboardMatrixRows.length }} ROWS)
                      </div>
                      <button
                        @click="exportTelemetry('xlsx')"
                        class="w-full text-left flex items-center gap-2.5 px-2.5 py-2 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-xl text-xs text-slate-200 transition cursor-pointer"
                      >
                        <i class="fa-solid fa-file-excel text-emerald-400 w-4 text-center"></i>
                        <div class="flex flex-col">
                          <span class="font-bold">Excel (.xlsx)</span>
                          <span class="text-[10px] text-slate-500">Modern spreadsheet</span>
                        </div>
                      </button>
                      <button
                        @click="exportTelemetry('xls')"
                        class="w-full text-left flex items-center gap-2.5 px-2.5 py-2 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-xl text-xs text-slate-200 transition cursor-pointer"
                      >
                        <i class="fa-solid fa-file-lines text-teal-400 w-4 text-center"></i>
                        <div class="flex flex-col">
                          <span class="font-bold">Excel 97-2004 (.xls)</span>
                          <span class="text-[10px] text-slate-500">Legacy workbook</span>
                        </div>
                      </button>
                      <button
                        @click="exportTelemetry('csv')"
                        class="w-full text-left flex items-center gap-2.5 px-2.5 py-2 hover:bg-sky-500/10 hover:text-sky-300 rounded-xl text-xs text-slate-200 transition cursor-pointer"
                      >
                        <i class="fa-solid fa-file-csv text-sky-400 w-4 text-center"></i>
                        <div class="flex flex-col">
                          <span class="font-bold">CSV (.csv)</span>
                          <span class="text-[10px] text-slate-500">Comma-separated values</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- Column Visibility Filter Dropdown -->
                  <div class="relative column-filter-container">
                    <button
                      @click="columnFilterOpen = !columnFilterOpen"
                      class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer shadow-inner transition"
                      :class="totalHiddenColumnsCount > 0 ? 'border-amber-500/50 text-amber-300' : ''"
                      title="Toggle visible metadata and sensor columns"
                    >
                      <i class="fa-solid fa-sliders text-purple-400"></i>
                      <span>COLUMNS</span>
                      <span v-if="totalHiddenColumnsCount > 0" class="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none">
                        -{{ totalHiddenColumnsCount }}
                      </span>
                      <i class="fa-solid fa-chevron-down text-[9px] transition-transform duration-200" :class="columnFilterOpen ? 'rotate-180 text-purple-400' : 'text-slate-500'"></i>
                    </button>

                    <!-- Dropdown Menu -->
                    <div
                      v-if="columnFilterOpen"
                      @click.stop
                      class="absolute right-0 top-full mt-2 z-30 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3.5 min-w-[250px] max-h-[420px] overflow-y-auto custom-scroll"
                    >
                      <!-- SECTION 1: METADATA COLUMNS -->
                      <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider pb-1.5 border-b border-slate-800">
                        <span class="flex items-center gap-1.5">
                          <i class="fa-solid fa-network-wired text-sky-400"></i>
                          <span>METADATA FIELDS</span>
                        </span>
                        <span class="text-slate-500 font-mono text-[9px]">
                          {{ metadataColumnsList.filter(c => isMetadataColumnVisible(c.key)).length }}/{{ metadataColumnsList.length }}
                        </span>
                      </div>
                      <div class="space-y-1 mb-3">
                        <label
                          v-for="col in metadataColumnsList"
                          :key="col.key"
                          class="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-800/80 rounded-lg cursor-pointer transition select-none"
                        >
                          <input
                            type="checkbox"
                            :checked="isMetadataColumnVisible(col.key)"
                            @change="toggleMetadataColumn(col.key)"
                            class="accent-sky-500 cursor-pointer rounded"
                          />
                          <span class="text-[11px] font-mono uppercase" :class="isMetadataColumnVisible(col.key) ? 'text-sky-300 font-bold' : 'text-slate-500 line-through'">
                            {{ col.label }}
                          </span>
                        </label>
                      </div>

                      <!-- SECTION 2: SENSOR FIELDS -->
                      <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider pt-2 pb-1.5 border-t border-b border-slate-800">
                        <span class="flex items-center gap-1.5">
                          <i class="fa-solid fa-microchip text-amber-400"></i>
                          <span>SENSOR FIELDS</span>
                        </span>
                        <span v-if="dashboardSensorColumns.length > 0" class="text-slate-500 font-mono text-[9px]">
                          {{ dashboardSensorColumns.filter(c => isSensorColumnVisible(c)).length }}/{{ dashboardSensorColumns.length }}
                        </span>
                      </div>
                      <div v-if="dashboardSensorColumns.length === 0" class="text-[11px] text-slate-500 py-2 text-center">
                        No sensor fields detected
                      </div>
                      <div v-else class="space-y-1">
                        <label
                          v-for="col in dashboardSensorColumns"
                          :key="col"
                          class="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-800/80 rounded-lg cursor-pointer transition select-none"
                        >
                          <input
                            type="checkbox"
                            :checked="isSensorColumnVisible(col)"
                            @change="toggleSensorColumn(col)"
                            class="accent-purple-500 cursor-pointer rounded"
                          />
                          <span class="text-[11px] font-mono uppercase" :class="isSensorColumnVisible(col) ? 'text-amber-200 font-bold' : 'text-slate-500 line-through'">
                            {{ col }}
                          </span>
                        </label>
                      </div>

                      <!-- Global Actions -->
                      <div class="border-t border-slate-800 mt-3 pt-2.5 flex items-center justify-between">
                        <button @click="showAllColumns" class="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-bold transition">SHOW ALL</button>
                        <button @click="resetDefaultColumns" class="text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer font-bold transition">RESET DEFAULT</button>
                        <button @click="hideAllSensorColumns" class="text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer font-bold transition">HIDE SENSORS</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top Horizontal Scrollbar (Synchronized with table) -->
              <div
                v-if="sortedDashboardMatrixRows.length > 0 && tableHasHorizontalOverflow"
                ref="topScrollRef"
                @scroll="handleTopScroll"
                class="overflow-x-auto top-horizontal-scroll bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-0.5 shadow-inner select-none transition"
                title="Horizontal scrollbar (Top)"
              >
                <div
                  :style="{ width: tableScrollWidth + 'px', height: '6px' }"
                  class="pointer-events-none"
                ></div>
              </div>

              <!-- Full Width Telemetry Table: TIME + METADATA + SENSOR FIELDS + PAYLOAD HEX -->
              <div
                ref="tableScrollRef"
                @scroll="handleTableScroll"
                class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 max-h-[680px] overflow-y-auto custom-scroll shadow-2xl"
                @click="columnFilterOpen = false; exportDropdownOpen = false"
              >
                <div v-if="sortedDashboardMatrixRows.length === 0" class="py-16 text-center text-slate-500 text-xs">
                  <i class="fa-solid fa-satellite-dish text-3xl text-slate-700 mb-2 block"></i>
                  <span v-if="dashboardMatrixRows.length === 0">No uplink telemetry packets received for this device.</span>
                  <span v-else>
                    No packets match the current filters.
                    <button @click="resetTelemetryFilters" class="text-purple-400 underline ml-1 cursor-pointer">RESET</button>
                  </span>
                </div>
                <table v-else ref="telemetryTableRef" class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-900 text-slate-300 text-[11px] font-bold border-b border-slate-800 sticky top-0 z-10 select-none">
                    <tr>
                      <!-- TIME COLUMN (First column) -->
                      <th
                        @click="toggleTelemetrySort('time')"
                        class="py-3 px-4 whitespace-nowrap bg-slate-900 border-r border-slate-800 text-purple-300 cursor-pointer hover:bg-slate-800 transition min-w-[170px]"
                      >
                        <div class="flex items-center gap-1.5">
                          <i class="fa-solid fa-clock text-purple-400 text-[10px]"></i>
                          <span>TIME</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'time' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-purple-400' : 'fa-arrow-down text-purple-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- METADATA: FPORT -->
                      <th
                        v-if="isMetadataColumnVisible('fPort')"
                        @click="toggleTelemetrySort('fPort')"
                        class="py-3 px-3 whitespace-nowrap bg-slate-900 text-slate-400 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1">
                          <span>FPORT</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'fPort' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-sky-400' : 'fa-arrow-down text-sky-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- METADATA: FCNT -->
                      <th
                        v-if="isMetadataColumnVisible('fCnt')"
                        @click="toggleTelemetrySort('fCnt')"
                        class="py-3 px-3 whitespace-nowrap bg-slate-900 text-slate-400 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1">
                          <span>FCNT</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'fCnt' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-sky-400' : 'fa-arrow-down text-sky-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- METADATA: RSSI -->
                      <th
                        v-if="isMetadataColumnVisible('rssi')"
                        @click="toggleTelemetrySort('rssi')"
                        class="py-3 px-3 whitespace-nowrap bg-slate-900 text-emerald-400 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1">
                          <span>RSSI</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'rssi' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-emerald-400' : 'fa-arrow-down text-emerald-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- METADATA: SNR -->
                      <th
                        v-if="isMetadataColumnVisible('snr')"
                        @click="toggleTelemetrySort('snr')"
                        class="py-3 px-3 whitespace-nowrap bg-slate-900 text-sky-400 border-r border-slate-800 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1">
                          <span>SNR</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'snr' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-sky-400' : 'fa-arrow-down text-sky-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- ALL SENSOR FIELDS (Filtered by visibility) -->
                      <template v-if="dashboardSensorColumns.length > 0">
                        <th
                          v-for="col in dashboardSensorColumns.filter(c => isSensorColumnVisible(c))"
                          :key="col"
                          @click="toggleTelemetrySort('sensor:' + col)"
                          class="py-3 px-4 whitespace-nowrap bg-slate-900 text-amber-300 font-mono cursor-pointer hover:bg-slate-800 transition"
                        >
                          <div class="flex items-center gap-1.5">
                            <span class="uppercase">{{ col }}</span>
                            <i class="fa-solid text-[9px]" :class="telemetrySortKey === ('sensor:' + col) ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-amber-400' : 'fa-arrow-down text-amber-400') : 'fa-sort text-slate-600'"></i>
                          </div>
                        </th>
                      </template>

                      <!-- PAYLOAD HEX (Metadata or fallback) -->
                      <th
                        v-if="isMetadataColumnVisible('payloadHex') || dashboardSensorColumns.length === 0"
                        @click="toggleTelemetrySort('payloadHex')"
                        class="py-3 px-4 whitespace-nowrap bg-slate-900 text-slate-400 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1.5">
                          <span>PAYLOAD HEX</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'payloadHex' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-slate-300' : 'fa-arrow-down text-slate-300') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr
                      v-for="(row, rIdx) in paginatedDashboardMatrixRows"
                      :key="rIdx"
                      class="hover:bg-slate-800/40 transition"
                    >
                      <!-- TIME -->
                      <td class="py-2.5 px-4 whitespace-nowrap bg-slate-950/40 border-r border-slate-800">
                        <span class="text-purple-300 font-bold">{{ formatDateTime(row.time) }}</span>
                      </td>

                      <!-- FPORT -->
                      <td v-if="isMetadataColumnVisible('fPort')" class="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {{ row.fPort }}
                      </td>

                      <!-- FCNT -->
                      <td v-if="isMetadataColumnVisible('fCnt')" class="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {{ row.fCnt }}
                      </td>

                      <!-- RSSI -->
                      <td v-if="isMetadataColumnVisible('rssi')" class="py-2.5 px-3 whitespace-nowrap">
                        <span v-if="row.rssi != null" class="font-bold" :class="row.rssi >= -90 ? 'text-emerald-400' : (row.rssi >= -110 ? 'text-amber-400' : 'text-rose-400')">{{ row.rssi }}</span>
                        <span v-else class="text-slate-700">—</span>
                      </td>

                      <!-- SNR -->
                      <td v-if="isMetadataColumnVisible('snr')" class="py-2.5 px-3 whitespace-nowrap border-r border-slate-800">
                        <span v-if="row.snr != null" class="font-bold" :class="row.snr >= 5 ? 'text-emerald-400' : (row.snr >= 0 ? 'text-sky-400' : 'text-orange-400')">{{ row.snr }}</span>
                        <span v-else class="text-slate-700">—</span>
                      </td>

                      <!-- SENSOR VALUES (Filtered by visibility) -->
                      <template v-if="dashboardSensorColumns.length > 0">
                        <td
                          v-for="col in dashboardSensorColumns.filter(c => isSensorColumnVisible(c))"
                          :key="col"
                          class="py-2.5 px-4 whitespace-nowrap font-bold"
                          :class="row.sensorValues[col] !== '—' && row.sensorValues[col] !== undefined ? 'text-emerald-300' : 'text-slate-700'"
                        >
                          {{ row.sensorValues[col] !== undefined ? row.sensorValues[col] : '—' }}
                        </td>
                      </template>

                      <!-- PAYLOAD HEX -->
                      <td
                        v-if="isMetadataColumnVisible('payloadHex') || dashboardSensorColumns.length === 0"
                        class="py-2.5 px-4 text-purple-400 uppercase truncate max-w-[200px]"
                        :title="row.payloadHex"
                      >
                        {{ row.payloadHex }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination Controls Bar -->
              <div
                v-if="sortedDashboardMatrixRows.length > 0"
                class="flex items-center justify-between gap-3 flex-wrap bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-inner select-none"
              >
                <!-- Record count info -->
                <div class="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>Showing</span>
                  <span class="text-white font-bold">{{ paginationRangeText }}</span>
                  <span>of</span>
                  <span class="text-purple-300 font-bold">{{ sortedDashboardMatrixRows.length }}</span>
                  <span>records</span>
                  <span v-if="sortedDashboardMatrixRows.length < dashboardMatrixRows.length" class="text-slate-500 text-[10px]">
                    (filtered from {{ dashboardMatrixRows.length }} total)
                  </span>
                </div>

                <div class="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <!-- Page Size Selector -->
                  <div class="flex items-center gap-2 text-xs text-slate-400">
                    <span class="text-[11px] font-medium">Rows per page:</span>
                    <select
                      v-model="telemetryPageSize"
                      class="bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner"
                    >
                      <option :value="25">25</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                      <option :value="250">250</option>
                      <option :value="500">500</option>
                      <option value="ALL">All ({{ sortedDashboardMatrixRows.length }})</option>
                    </select>
                  </div>

                  <!-- Page navigation buttons -->
                  <div v-if="telemetryPageSize !== 'ALL' && totalTelemetryPages > 1" class="flex items-center gap-1">
                    <!-- First Page -->
                    <button
                      @click="setTelemetryPage(1)"
                      :disabled="telemetryPage === 1"
                      class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="First Page"
                    >
                      <i class="fa-solid fa-angles-left text-[10px]"></i>
                    </button>

                    <!-- Prev Page -->
                    <button
                      @click="prevTelemetryPage"
                      :disabled="telemetryPage === 1"
                      class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="Previous Page"
                    >
                      <i class="fa-solid fa-chevron-left text-[10px]"></i>
                    </button>

                    <!-- Page Numbers Pill list -->
                    <template v-for="(p, pIdx) in visiblePageNumbers" :key="pIdx">
                      <span v-if="p === '...'" class="px-1 text-slate-600 text-xs font-mono">...</span>
                      <button
                        v-else
                        @click="setTelemetryPage(p)"
                        class="min-w-[32px] h-8 px-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                        :class="telemetryPage === p ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'"
                      >
                        {{ p }}
                      </button>
                    </template>

                    <!-- Next Page -->
                    <button
                      @click="nextTelemetryPage"
                      :disabled="telemetryPage >= totalTelemetryPages"
                      class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="Next Page"
                    >
                      <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    </button>

                    <!-- Last Page -->
                    <button
                      @click="setTelemetryPage(totalTelemetryPages)"
                      :disabled="telemetryPage >= totalTelemetryPages"
                      class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="Last Page"
                    >
                      <i class="fa-solid fa-angles-right text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- FEATURE: HMI SCADA VIEWER (D_MOD_HMI_SCADA) -->`;

