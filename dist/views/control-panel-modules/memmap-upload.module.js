"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMMAP_UPLOAD_SCRIPT = exports.MEMMAP_UPLOAD_MODALS = exports.MEMMAP_UPLOAD_TEMPLATE = void 0;
exports.MEMMAP_UPLOAD_TEMPLATE = `
        <!-- TAB 18: MEMORY MAP UPLOAD -->
        <div v-show="activeTab === 'memmap-upload'" class="space-y-6">
          <!-- Header Banner -->
          <div class="glass-card rounded-2xl p-5 border border-sky-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl shadow-inner">
                <i class="fa-solid fa-file-csv"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-extrabold text-white">Memory Map Upload</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">C-MODULE</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">Upload and validate Modbus Register Maps (CSV WSLRW) with dual Dec/Hex continuity checks and link to SKU & Short FW version.</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
              <button
                @click="openMemmapSaveModal"
                :disabled="!canSaveMemmap"
                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition"
              >
                <i class="fa-solid fa-cloud-arrow-up"></i> Save Memory Map
              </button>
              <button
                @click="resetMemmapForm"
                class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition"
                title="Reset Form"
              >
                <i class="fa-solid fa-rotate-left"></i> Reset
              </button>
            </div>
          </div>

          <!-- Input Configuration & File Dropzone Card -->
          <div class="glass-card rounded-2xl p-5 border border-slate-800 grid grid-cols-1 lg:grid-cols-3 gap-6 shadow-xl">
            <!-- Form Parameters -->
            <div class="space-y-4 lg:col-span-1">
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target SKU <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="memmapSku"
                    @input="onMemmapSkuInput"
                    type="text"
                    placeholder="e.g. WSLRW-ATH"
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition uppercase"
                    :class="skuValidationError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-sky-500'"
                  />
                  <span v-if="memmapSku && !skuValidationError" class="absolute right-3 top-2.5 text-xs text-emerald-400">
                    <i class="fa-solid fa-check"></i>
                  </span>
                </div>
                <p v-if="skuValidationError" class="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-mono">
                  <i class="fa-solid fa-circle-exclamation"></i> {{ skuValidationError }}
                </p>
                <p v-else class="text-[11px] text-slate-500 mt-1">
                  Uppercase alphanumeric string (e.g. WSLRW-ATH, WSLRW-LKS).
                </p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  LONG_FW <span class="text-slate-500 font-normal">(e.g. 3F0825, 6Fmmdd)</span>
                </label>
                <div class="relative">
                  <input
                    v-model="memmapLongFw"
                    @input="onMemmapLongFwInput"
                    type="text"
                    placeholder="e.g. 3F0825 or 6Fmmdd"
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition"
                  />
                  <span v-if="memmapLongFw" class="absolute right-3 top-2.5 text-xs text-sky-400">
                    <i class="fa-solid fa-code-branch"></i>
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">
                  Full firmware version string. Extracts SHORT_FW automatically.
                </p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Short FW Version <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="memmapShortFw"
                    @input="onMemmapShortFwInput"
                    type="text"
                    placeholder="e.g. 6 (strictly integer)"
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition"
                    :class="fwValidationError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-sky-500'"
                  />
                  <span v-if="memmapShortFw && !fwValidationError" class="absolute right-3 top-2.5 text-xs text-emerald-400">
                    <i class="fa-solid fa-check"></i>
                  </span>
                </div>
                <p v-if="fwValidationError" class="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-mono">
                  <i class="fa-solid fa-circle-exclamation"></i> {{ fwValidationError }}
                </p>
                <p v-else class="text-[11px] text-slate-500 mt-1">
                  Strict positive integer only. Do NOT include 'v' prefix or decimals (e.g. 6 instead of v6 or 6.0).
                </p>
              </div>

              <div v-if="memmapSku && memmapShortFw && !skuValidationError && !fwValidationError" class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Unique Version Key:</span>
                  <span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono font-bold border border-sky-500/20">
                    {{ memmapSku }}_{{ memmapShortFw }}
                  </span>
                </div>
                <div v-if="memmapLongFw" class="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span class="text-slate-400">LONG_FW:</span>
                  <span class="font-mono text-sky-400 font-semibold">{{ memmapLongFw }}</span>
                </div>
              </div>
            </div>

            <!-- Drag & Drop CSV File Area -->
            <div class="lg:col-span-2 flex flex-col justify-between">
              <div
                @dragover.prevent="onCsvDragOver"
                @dragleave.prevent="onCsvDragLeave"
                @drop.prevent="onCsvDrop"
                @click="triggerCsvFileInput"
                class="flex-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition duration-150 min-h-[160px]"
                :class="isDraggingCsv ? 'border-sky-400 bg-sky-500/10' : (memmapFileName ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-700 hover:border-slate-500 bg-slate-950/40')"
              >
                <input
                  type="file"
                  ref="csvFileInputRef"
                  id="csvFileInputRef"
                  @change="onCsvFileSelected"
                  accept=".csv,text/csv"
                  class="hidden"
                />

                <div v-if="!memmapFileName" class="space-y-2">
                  <div class="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-sky-400 text-xl mx-auto shadow-inner">
                    <i class="fa-solid fa-file-arrow-up"></i>
                  </div>
                  <div>
                    <span class="text-xs font-bold text-white hover:text-sky-300">Choose CSV File</span>
                    <span class="text-xs text-slate-400"> or drag and drop here</span>
                  </div>
                  <p class="text-[11px] text-slate-500">Supports WSLRW standard Modbus CSV with 16 columns (e.g. WSLRW-ATH-6.csv)</p>
                </div>

                <div v-else class="space-y-2">
                  <div class="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl mx-auto shadow-inner">
                    <i class="fa-solid fa-file-csv"></i>
                  </div>
                  <div>
                    <span class="text-xs font-bold text-emerald-300 font-mono">{{ memmapFileName }}</span>
                    <span class="text-[11px] text-slate-400 ml-2">({{ memmapRegisters.length }} registers loaded)</span>
                  </div>
                  <p class="text-[11px] text-slate-400">Click to replace file or drop another file</p>
                </div>
              </div>

              <!-- Continuity & Quality Badges -->
              <div v-if="memmapRegisters.length > 0" class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Total Registers</div>
                    <div class="text-sm font-extrabold text-white font-mono">{{ memmapRegisters.length }}</div>
                  </div>
                  <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <i class="fa-solid fa-list-ol"></i>
                  </div>
                </div>

                <div class="p-3 rounded-xl border flex items-center justify-between"
                  :class="continuityResults.decValid ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/40'">
                  <div>
                    <div class="text-[10px] uppercase font-bold" :class="continuityResults.decValid ? 'text-emerald-400' : 'text-red-400'">
                      Decimal Continuity
                    </div>
                    <div class="text-xs font-extrabold font-mono flex items-center gap-1.5" :class="continuityResults.decValid ? 'text-emerald-300' : 'text-red-300'">
                      <i :class="continuityResults.decValid ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
                      <span>{{ continuityResults.decValid ? 'PASS (100%)' : continuityResults.decErrors.length + ' Discontinuities' }}</span>
                    </div>
                  </div>
                  <button v-if="!continuityResults.decValid" @click="showDecErrorsModal = true" class="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 font-bold">
                    View
                  </button>
                </div>

                <div class="p-3 rounded-xl border flex items-center justify-between"
                  :class="continuityResults.hexValid ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/40'">
                  <div>
                    <div class="text-[10px] uppercase font-bold" :class="continuityResults.hexValid ? 'text-emerald-400' : 'text-red-400'">
                      Hex Continuity
                    </div>
                    <div class="text-xs font-extrabold font-mono flex items-center gap-1.5" :class="continuityResults.hexValid ? 'text-emerald-300' : 'text-red-300'">
                      <i :class="continuityResults.hexValid ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
                      <span>{{ continuityResults.hexValid ? 'PASS (100%)' : continuityResults.hexErrors.length + ' Discontinuities' }}</span>
                    </div>
                  </div>
                  <button v-if="!continuityResults.hexValid" @click="showHexErrorsModal = true" class="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 font-bold">
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabulator Table Section -->
          <div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 shadow-xl">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-table-list text-sky-400 text-sm"></i>
                <h3 class="text-sm font-extrabold text-white">Modbus Register Map Data (Read-Only 16 Columns)</h3>
                <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">Tabulator 6.x</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="relative w-64">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-2 text-xs text-slate-500"></i>
                  <input
                    v-model="memmapTableSearch"
                    @input="onMemmapTableSearchChange"
                    type="text"
                    placeholder="Search register description, hex, dec..."
                    class="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <!-- Tabulator Container -->
            <div class="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <div v-show="memmapRegisters.length === 0" class="py-16 text-center text-slate-500">
                <i class="fa-solid fa-file-csv text-3xl mb-3 text-slate-600 block"></i>
                <p class="text-xs">No CSV file loaded yet. Please select or drag & drop a WSLRW Modbus CSV file above.</p>
              </div>
              <div v-show="memmapRegisters.length > 0" id="memmap-tabulator-container" class="w-full" style="min-height: 480px;"></div>
            </div>
          </div>
        </div>
`;
exports.MEMMAP_UPLOAD_MODALS = `
  <!-- MODAL: SAVE MEMMAP CONFIRMATION -->
  <div
    v-if="showMemmapSaveModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
    style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);"
    @click.self="showMemmapSaveModal = false"
  >
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-200">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2.5 font-bold text-white text-base">
          <i class="fa-solid fa-cloud-arrow-up text-emerald-400"></i>
          <span>Confirm Save Memory Map</span>
        </div>
        <button type="button" @click="showMemmapSaveModal = false" class="text-slate-400 hover:text-white cursor-pointer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="space-y-3 text-xs">
        <p class="text-slate-300">You are about to save the following Modbus Memory Map specification to the database:</p>

        <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
          <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Hardware SKU:</span>
            <span class="font-bold text-cyan-300">{{ memmapSku }}</span>
          </div>
          <div v-if="memmapLongFw" class="flex justify-between items-center py-1 border-b border-slate-800/80">
            <span class="text-slate-400">LONG_FW:</span>
            <span class="font-bold text-sky-300">{{ memmapLongFw }}</span>
          </div>
          <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Short Firmware Version:</span>
            <span class="font-bold text-amber-300">{{ memmapShortFw }}</span>
          </div>
          <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Unique Identifier:</span>
            <span class="font-bold text-sky-400">{{ memmapSku }}_{{ memmapShortFw }}</span>
          </div>
          <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
            <span class="text-slate-400">File Name:</span>
            <span class="text-slate-300 truncate max-w-[240px]">{{ memmapFileName || 'WSLRW.csv' }}</span>
          </div>
          <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Total Registers:</span>
            <span class="font-bold text-white">{{ memmapRegisters.length }} rows</span>
          </div>
          <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Decimal Continuity:</span>
            <span :class="continuityResults.decValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'">
              {{ continuityResults.decValid ? 'PASS' : 'FAIL (' + continuityResults.decErrors.length + ' issues)' }}
            </span>
          </div>
          <div class="flex justify-between items-center py-1">
            <span class="text-slate-400">Hexadecimal Continuity:</span>
            <span :class="continuityResults.hexValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'">
              {{ continuityResults.hexValid ? 'PASS' : 'FAIL (' + continuityResults.hexErrors.length + ' issues)' }}
            </span>
          </div>
        </div>

        <div v-if="!continuityResults.decValid || !continuityResults.hexValid" class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
          <i class="fa-solid fa-triangle-exclamation mt-0.5"></i>
          <div>Warning: Register continuity check has discrepancies. You can still save if this matches your hardware firmware specification.</div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          @click="showMemmapSaveModal = false"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="confirmSaveMemmap"
          :disabled="isSavingMemmap"
          class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
        >
          <i :class="isSavingMemmap ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-check'"></i>
          <span>{{ isSavingMemmap ? 'Saving to Database...' : 'Confirm Save' }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL: DECIMAL ERRORS LIST -->
  <div
    v-if="showDecErrorsModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
    style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);"
    @click.self="showDecErrorsModal = false"
  >
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl text-slate-200">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2 font-bold text-red-400 text-sm">
          <i class="fa-solid fa-circle-xmark"></i>
          <span>Decimal Register Discontinuities ({{ continuityResults.decErrors.length }})</span>
        </div>
        <button type="button" @click="showDecErrorsModal = false" class="text-slate-400 hover:text-white cursor-pointer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="max-h-80 overflow-y-auto custom-scroll space-y-1.5 text-xs font-mono">
        <div v-for="(err, idx) in continuityResults.decErrors" :key="idx" class="p-2 rounded bg-slate-950 border border-red-500/20 text-red-300">
          {{ err }}
        </div>
      </div>
      <div class="flex justify-end pt-2">
        <button @click="showDecErrorsModal = false" class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold">Close</button>
      </div>
    </div>
  </div>

  <!-- MODAL: HEX ERRORS LIST -->
  <div
    v-if="showHexErrorsModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
    style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);"
    @click.self="showHexErrorsModal = false"
  >
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl text-slate-200">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2 font-bold text-red-400 text-sm">
          <i class="fa-solid fa-circle-xmark"></i>
          <span>Hexadecimal Register Discontinuities ({{ continuityResults.hexErrors.length }})</span>
        </div>
        <button type="button" @click="showHexErrorsModal = false" class="text-slate-400 hover:text-white cursor-pointer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="max-h-80 overflow-y-auto custom-scroll space-y-1.5 text-xs font-mono">
        <div v-for="(err, idx) in continuityResults.hexErrors" :key="idx" class="p-2 rounded bg-slate-950 border border-red-500/20 text-red-300">
          {{ err }}
        </div>
      </div>
      <div class="flex justify-end pt-2">
        <button @click="showHexErrorsModal = false" class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold">Close</button>
      </div>
    </div>
  </div>
`;
exports.MEMMAP_UPLOAD_SCRIPT = `
    function useMemmapUploadModule(ctx) {
      const { ref, computed, watch, onUnmounted } = Vue;
      const { showToast, authHeaders, activeTab } = ctx;

      const memmapSku = ref('');
      const memmapLongFw = ref('');
      const memmapShortFw = ref('');
      const memmapFileName = ref('');
      const memmapRegisters = ref([]);
      const isDraggingCsv = ref(false);
      const isSavingMemmap = ref(false);
      const showMemmapSaveModal = ref(false);
      const showDecErrorsModal = ref(false);
      const showHexErrorsModal = ref(false);
      const memmapTableSearch = ref('');
      const csvFileInputRef = ref(null);

      let memmapTabulatorInstance = null;
      let initTableTimeout = null;

      function extractShortFwFromLongFw(longFw) {
        if (!longFw || typeof longFw !== 'string') return null;
        const trimmed = longFw.trim();
        const match = trimmed.match(/^(\d+)[fF]/i);
        if (match) {
          const val = parseInt(match[1], 10);
          return isNaN(val) ? null : val;
        }
        if (/^\d+$/.test(trimmed)) {
          const val = parseInt(trimmed, 10);
          return isNaN(val) ? null : val;
        }
        return null;
      }

      // Validation
      const skuValidationError = computed(() => {
        if (!memmapSku.value) return '';
        const trimmed = memmapSku.value.trim().toUpperCase();
        if (!/^[A-Z0-9_-]+$/.test(trimmed)) {
          return 'SKU only allows uppercase letters, digits, underscores and hyphens';
        }
        return '';
      });

      const fwValidationError = computed(() => {
        if (!memmapShortFw.value) return '';
        const trimmed = String(memmapShortFw.value).trim();
        if (!/^[0-9]+$/.test(trimmed)) {
          return 'Short FW Version must be positive integer only (no v, no decimals)';
        }
        if (Number(trimmed) <= 0) {
          return 'Short FW Version must be > 0';
        }
        return '';
      });

      const onMemmapSkuInput = () => {
        if (memmapSku.value) {
          memmapSku.value = memmapSku.value.toUpperCase();
        }
      };

      const onMemmapLongFwInput = () => {
        if (memmapLongFw.value) {
          const extracted = extractShortFwFromLongFw(memmapLongFw.value);
          if (extracted !== null) {
            memmapShortFw.value = String(extracted);
          }
        }
      };

      const onMemmapShortFwInput = () => {
        // Handled via computed fwValidationError
      };

      // Continuity Checker
      const continuityResults = computed(() => {
        const regs = memmapRegisters.value;
        const decErrors = [];
        const hexErrors = [];

        if (!regs || regs.length === 0) {
          return { decValid: true, hexValid: true, decErrors, hexErrors };
        }

        const sorted = [...regs].sort((a, b) => (Number(a.no) || 0) - (Number(b.no) || 0));

        for (let i = 0; i < sorted.length; i++) {
          const cur = sorted[i];
          const curDec = Number(cur.modbus_reg_dec);
          const curHexStr = String(cur.modbus_reg_hex || '').trim();
          const curHexParsed = parseInt(curHexStr, 16);

          if (i === 0) {
            if (isNaN(curDec) || curDec < 0) {
              decErrors.push('Row 1 (No. ' + cur.no + '): Invalid Decimal reg ' + cur.modbus_reg_dec);
            }
            if (isNaN(curHexParsed) || curHexParsed < 0) {
              hexErrors.push('Row 1 (No. ' + cur.no + '): Invalid Hex reg ' + cur.modbus_reg_hex);
            }
          } else {
            const prev = sorted[i - 1];
            const prevDec = Number(prev.modbus_reg_dec);
            const prevNum = Number(prev.num_regs) > 0 ? Number(prev.num_regs) : 1;
            const expectedDec = prevDec + prevNum;

            if (curDec !== expectedDec) {
              decErrors.push('Row ' + (i + 1) + ' (No. ' + cur.no + '): Expected Dec ' + expectedDec + ', got ' + curDec);
            }

            const prevHexParsed = parseInt(String(prev.modbus_reg_hex || '').trim(), 16);
            if (!isNaN(prevHexParsed) && !isNaN(curHexParsed)) {
              const expectedHexVal = prevHexParsed + prevNum;
              if (curHexParsed !== expectedHexVal) {
                hexErrors.push('Row ' + (i + 1) + ' (No. ' + cur.no + '): Expected Hex 0x' + expectedHexVal.toString(16).toUpperCase() + ', got 0x' + curHexStr.toUpperCase());
              }
            } else {
              hexErrors.push('Row ' + (i + 1) + ' (No. ' + cur.no + '): Invalid Hex format');
            }
          }
        }

        return {
          decValid: decErrors.length === 0,
          hexValid: hexErrors.length === 0,
          decErrors,
          hexErrors,
        };
      });

      const canSaveMemmap = computed(() => {
        return (
          memmapSku.value.trim().length > 0 &&
          !skuValidationError.value &&
          memmapShortFw.value.trim().length > 0 &&
          !fwValidationError.value &&
          memmapRegisters.value.length > 0
        );
      });

      // CSV Parsing
      const parseCSV = (text) => {
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let inQuotes = false;

        const cleanText = text.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n');

        for (let i = 0; i < cleanText.length; i++) {
          const char = cleanText[i];
          const nextChar = cleanText[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              currentCell += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
          } else if (char === '\\n' && !inQuotes) {
            currentRow.push(currentCell.trim());
            if (currentRow.some(c => c.length > 0)) {
              rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
          } else {
            currentCell += char;
          }
        }

        if (currentCell.length > 0 || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          if (currentRow.some(c => c.length > 0)) {
            rows.push(currentRow);
          }
        }

        return rows;
      };

      const handleCsvContent = (content, fileName) => {
        try {
          const rawRows = parseCSV(content);
          if (rawRows.length < 2) {
            showToast('CSV file is empty or does not contain header and data rows', 'error');
            return;
          }

          // Header inspection
          const headers = rawRows[0].map(h => h.trim().toLowerCase());
          const isStandardWSLRW = headers.some(h => h.includes('modbus register'));

          const parsedItems = [];
          for (let r = 1; r < rawRows.length; r++) {
            const cols = rawRows[r];
            if (cols.length < 3) continue;

            // Extract row index
            const noVal = parseInt(cols[0], 10) || r;
            const decVal = parseInt(cols[1], 10) || 0;
            const hexVal = String(cols[2] || '').trim();
            const fnRead = cols[3] || '3';
            const fnWrite = cols[4] || 'None';
            const numRegs = parseInt(cols[5], 10) || 1;
            const description = cols[6] || '';
            const rangeVal = cols[7] || '';
            const endUserDef = cols[8] || '';
            const formatVal = cols[9] || '';
            const dlType5 = cols[10] || '';
            const inRd1 = String(cols[11] || '').toLowerCase() === 'yes';
            const commentVal = cols[12] || '';
            const inEng = String(cols[13] || '').toLowerCase() === 'yes';
            const inEndUser = String(cols[14] || '').toLowerCase() === 'yes';
            const inFull = String(cols[15] || '').toLowerCase() === 'yes';

            parsedItems.push({
              no: noVal,
              modbus_reg_dec: decVal,
              modbus_reg_hex: hexVal,
              fn_read: fnRead,
              fn_write: fnWrite,
              num_regs: numRegs,
              description: description,
              range_val: rangeVal,
              end_user_default: endUserDef,
              format: formatVal,
              downlink_type_5: dlType5,
              in_rd1_template: inRd1,
              comment: commentVal,
              in_engineering_template: inEng,
              in_end_user_template: inEndUser,
              in_full_template: inFull,
            });
          }

          memmapRegisters.value = parsedItems;
          memmapFileName.value = fileName;

          // Attempt autofill SKU / Short FW from filename (e.g. WSLRW-ATH-6.csv)
          if (fileName) {
            const match = fileName.replace(/\\.csv$/i, '').match(/^([A-Za-z0-9_-]+)-(\\d+)$/);
            if (match) {
              if (!memmapSku.value) memmapSku.value = match[1].toUpperCase();
              if (!memmapShortFw.value) memmapShortFw.value = match[2];
            }
          }

          // Scan Reg 5 (FW_VERSION) to auto-extract LONG_FW and SHORT_FW
          const reg5 = parsedItems.find(r =>
            (r.description && String(r.description).toUpperCase() === 'FW_VERSION') ||
            Number(r.modbus_reg_dec) === 5
          );
          if (reg5 && reg5.end_user_default) {
            const fwVal = String(reg5.end_user_default).trim();
            if (fwVal) {
              if (!memmapLongFw.value) {
                memmapLongFw.value = fwVal;
              }
              const extracted = extractShortFwFromLongFw(fwVal);
              if (extracted !== null) {
                memmapShortFw.value = String(extracted);
              }
            }
          }

          showToast('Loaded ' + parsedItems.length + ' registers from ' + fileName, 'success');
          renderMemmapTabulator();
        } catch (err) {
          console.error('[CSV Parse Error]', err);
          showToast('Failed to parse CSV: ' + err.message, 'error');
        }
      };

      const onCsvFileSelected = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          handleCsvContent(event.target.result, file.name);
        };
        reader.readAsText(file);
      };

      const triggerCsvFileInput = () => {
        const input = document.getElementById('csvFileInputRef');
        if (input) input.click();
      };

      const onCsvDragOver = (e) => {
        isDraggingCsv.value = true;
      };

      const onCsvDragLeave = (e) => {
        isDraggingCsv.value = false;
      };

      const onCsvDrop = (e) => {
        isDraggingCsv.value = false;
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          handleCsvContent(event.target.result, file.name);
        };
        reader.readAsText(file);
      };

      // Tabulator Table Construction
      const destroyMemmapTabulator = () => {
        if (memmapTabulatorInstance) {
          try {
            memmapTabulatorInstance.destroy();
          } catch (e) {}
          memmapTabulatorInstance = null;
        }
        if (initTableTimeout) {
          clearTimeout(initTableTimeout);
          initTableTimeout = null;
        }
      };

      const renderMemmapTabulator = () => {
        destroyMemmapTabulator();

        const container = document.getElementById('memmap-tabulator-container');
        if (!container) return;

        if (typeof Tabulator === 'undefined') {
          initTableTimeout = setTimeout(renderMemmapTabulator, 100);
          return;
        }

        try {
          memmapTabulatorInstance = new Tabulator(container, {
            data: memmapRegisters.value,
            layout: 'fitDataFill',
            height: '520px',
            selectableRows: false,
            columns: [
              { title: 'No.', field: 'no', hozAlign: 'center', width: 60, headerHozAlign: 'center' },
              { title: 'Dec Reg', field: 'modbus_reg_dec', hozAlign: 'right', width: 85, headerHozAlign: 'right' },
              { title: 'Hex Reg', field: 'modbus_reg_hex', hozAlign: 'center', width: 85, headerHozAlign: 'center' },
              { title: 'FC Read', field: 'fn_read', hozAlign: 'center', width: 80, headerHozAlign: 'center' },
              { title: 'FC Write', field: 'fn_write', hozAlign: 'center', width: 85, headerHozAlign: 'center' },
              { title: '# Regs', field: 'num_regs', hozAlign: 'right', width: 75, headerHozAlign: 'right' },
              { title: 'Description', field: 'description', hozAlign: 'left', minWidth: 160 },
              { title: 'Range', field: 'range_val', hozAlign: 'left', width: 110 },
              { title: 'Default', field: 'end_user_default', hozAlign: 'left', width: 100 },
              { title: 'Format', field: 'format', hozAlign: 'center', width: 85, headerHozAlign: 'center' },
              { title: 'DL Type 5', field: 'downlink_type_5', hozAlign: 'center', width: 90, headerHozAlign: 'center' },
              { title: 'RD1', field: 'in_rd1_template', hozAlign: 'center', width: 70, formatter: 'tickCross', headerHozAlign: 'center' },
              { title: 'Comment', field: 'comment', hozAlign: 'left', minWidth: 200, tooltip: true },
              { title: 'Engineering', field: 'in_engineering_template', hozAlign: 'center', width: 95, formatter: 'tickCross', headerHozAlign: 'center' },
              { title: 'End-user', field: 'in_end_user_template', hozAlign: 'center', width: 85, formatter: 'tickCross', headerHozAlign: 'center' },
              { title: 'Full', field: 'in_full_template', hozAlign: 'center', width: 70, formatter: 'tickCross', headerHozAlign: 'center' },
            ],
          });
        } catch (err) {
          console.error('[Tabulator Initialization Error]', err);
        }
      };

      const onMemmapTableSearchChange = () => {
        if (!memmapTabulatorInstance) return;
        const q = String(memmapTableSearch.value || '').trim().toLowerCase();
        if (!q) {
          memmapTabulatorInstance.clearFilter();
          return;
        }
        memmapTabulatorInstance.setFilter((data) => {
          return (
            String(data.description || '').toLowerCase().includes(q) ||
            String(data.modbus_reg_dec || '').toLowerCase().includes(q) ||
            String(data.modbus_reg_hex || '').toLowerCase().includes(q) ||
            String(data.comment || '').toLowerCase().includes(q)
          );
        });
      };

      // Modal & Save
      const openMemmapSaveModal = () => {
        if (!canSaveMemmap.value) return;
        showMemmapSaveModal.value = true;
      };

      const confirmSaveMemmap = async () => {
        if (!canSaveMemmap.value) return;
        isSavingMemmap.value = true;

        try {
          const payload = {
            sku: memmapSku.value.trim().toUpperCase(),
            long_fw: (memmapLongFw.value || '').trim() || String(memmapShortFw.value.trim()),
            short_fw: Number(memmapShortFw.value.trim()),
            file_name: memmapFileName.value || 'WSLRW.csv',
            registers: memmapRegisters.value,
          };

          const res = await fetch('/api/c-modules/memmap-upload', {
            method: 'POST',
            headers: {
              ...authHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok && data.success !== false) {
            showToast('Memory Map saved successfully (' + (data.data?.totalRegs || memmapRegisters.value.length) + ' registers)', 'success');
            showMemmapSaveModal.value = false;
          } else {
            showToast(data.message || 'Failed to save Memory Map', 'error');
          }
        } catch (err) {
          console.error('[Save Memmap Error]', err);
          showToast('Failed to save Memory Map: ' + err.message, 'error');
        } finally {
          isSavingMemmap.value = false;
        }
      };

      const resetMemmapForm = () => {
        memmapSku.value = '';
        memmapLongFw.value = '';
        memmapShortFw.value = '';
        memmapFileName.value = '';
        memmapRegisters.value = [];
        destroyMemmapTabulator();
      };

      watch(activeTab, (tab) => {
        if (tab === 'memmap-upload') {
          if (memmapRegisters.value.length > 0) {
            initTableTimeout = setTimeout(renderMemmapTabulator, 120);
          }
        } else {
          destroyMemmapTabulator();
        }
      });

      onUnmounted(() => {
        destroyMemmapTabulator();
      });

      return {
        memmapSku,
        memmapLongFw,
        memmapShortFw,
        memmapFileName,
        memmapRegisters,
        isDraggingCsv,
        isSavingMemmap,
        showMemmapSaveModal,
        showDecErrorsModal,
        showHexErrorsModal,
        memmapTableSearch,
        skuValidationError,
        fwValidationError,
        continuityResults,
        canSaveMemmap,
        onMemmapSkuInput,
        onMemmapLongFwInput,
        onMemmapShortFwInput,
        onCsvFileSelected,
        triggerCsvFileInput,
        onCsvDragOver,
        onCsvDragLeave,
        onCsvDrop,
        onMemmapTableSearchChange,
        openMemmapSaveModal,
        confirmSaveMemmap,
        resetMemmapForm,
        renderMemmapTabulator,
      };
    }

    if (typeof window !== 'undefined') {
      window.useMemmapUploadModule = useMemmapUploadModule;
    }
`;
//# sourceMappingURL=memmap-upload.module.js.map