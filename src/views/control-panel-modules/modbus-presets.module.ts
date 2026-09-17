/**
 * C-Module: Modbus Preset & Template Manager
 * Comprehensive Modbus register preset & template management with Excel import (RD1, Engineering, End-user, Full)
 * Tabulator 6.x editable table, inline row manipulations, and full template persistence.
 */

export const MODBUS_PRESETS_TEMPLATE = `
  <!-- C-MODULE: MODBUS PRESETS & TEMPLATES -->
  <div class="space-y-5">
    
    <!-- Top Action & Selection Bar -->
    <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      
      <!-- Left: Template Selector & Metadata Badges -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <i class="fa-solid fa-file-excel text-sm"></i>
          </div>
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Template:</span>
        </div>

        <select
          v-model="activePresetId"
          @change="onPresetSelectChange"
          class="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-w-[240px]"
        >
          <option v-for="p in presetsList" :key="p.id" :value="p.id">
            {{ p.name }} ({{ p.profileType || 'Custom' }})
          </option>
        </select>

        <!-- Metadata Badges -->
        <div v-if="activePreset" class="flex items-center gap-2 flex-wrap text-xs">
          <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-slate-300 flex items-center gap-1.5">
            <i class="fa-solid fa-user text-[10px] text-sky-400"></i>
            <span>Author: <strong class="text-sky-300">{{ activePreset.createdBy || 'admin' }}</strong></span>
          </span>

          <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono text-emerald-300 font-semibold flex items-center gap-1.5">
            <i class="fa-solid fa-layer-group text-[10px]"></i>
            <span>Profile: {{ activePreset.profileType || 'Custom' }}</span>
          </span>

          <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-slate-300">
            Total: <strong class="text-white">{{ presetRegisters.length }}</strong> regs
            (<strong class="text-emerald-400">{{ checkedRegistersCount }}</strong> checked)
          </span>

          <span v-if="selectedPresetRowCount > 0" class="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 font-mono text-cyan-300 font-bold">
            Selected: {{ selectedPresetRowCount }} rows
          </span>
        </div>
      </div>

      <!-- Right: Action Buttons -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Import Excel -->
        <button
          type="button"
          @click="openImportModal"
          class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition active:scale-95"
        >
          <i class="fa-solid fa-file-import text-xs"></i>
          <span>Import Excel</span>
        </button>

        <!-- New Template -->
        <button
          type="button"
          @click="openCreateModal"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition active:scale-95"
        >
          <i class="fa-solid fa-plus text-xs text-sky-400"></i>
          <span>New Template</span>
        </button>

        <!-- Save Template -->
        <button
          type="button"
          @click="saveCurrentPreset"
          :disabled="isSavingPreset"
          class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/20 transition active:scale-95"
        >
          <i class="fa-solid" :class="isSavingPreset ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          <span>{{ isSavingPreset ? 'Saving...' : 'Save Template' }}</span>
        </button>

        <!-- Delete Template -->
        <button
          type="button"
          @click="deleteCurrentPreset"
          class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold cursor-pointer transition"
          title="Delete Template"
        >
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    </div>

    <!-- Active Template Editor Toolbar & Details -->
    <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      
      <!-- Template Properties Inputs -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Template Name</label>
          <input
            type="text"
            v-model="activePreset.name"
            placeholder="e.g. Daviteq LKS Gas Sensor - RD1"
            class="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-medium focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Target Profile</label>
          <select
            v-model="activePreset.profileType"
            class="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-sky-500 focus:outline-none"
          >
            <option value="RD1">RD1</option>
            <option value="Engineering">Engineering</option>
            <option value="End-user">End-user</option>
            <option value="Full">Full</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Description / Notes</label>
          <input
            type="text"
            v-model="activePreset.description"
            placeholder="e.g. Standard Modbus register profile for LKS sensor"
            class="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-medium focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <!-- Quick Row Actions & Search Filter -->
      <div class="flex items-center gap-2 self-end lg:self-center flex-wrap">
        <!-- Search filter in table -->
        <div class="relative">
          <input
            type="text"
            v-model="presetFilterQuery"
            @input="filterPresetsTable"
            placeholder="Filter registers..."
            class="w-44 pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <i class="fa-solid fa-search absolute left-2.5 top-2.5 text-slate-500 text-xs"></i>
        </div>

        <!-- Add Row Button -->
        <button
          type="button"
          @click="addPresetRow"
          class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
        >
          <i class="fa-solid fa-plus text-[11px]"></i>
          <span>Add Row</span>
        </button>

        <!-- Delete Selected Rows -->
        <button
          type="button"
          @click="deleteSelectedPresetRows"
          :disabled="selectedPresetRowCount === 0"
          class="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
        >
          <i class="fa-solid fa-trash-can text-[11px]"></i>
          <span>Delete ({{ selectedPresetRowCount }})</span>
        </button>

        <!-- Export CSV -->
        <button
          type="button"
          @click="exportPresetCSV"
          class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          title="Export registers to CSV"
        >
          <i class="fa-solid fa-file-csv text-xs text-amber-400"></i>
          <span>CSV</span>
        </button>
      </div>

    </div>

    <!-- Tabulator Grid Container -->
    <div class="rounded-2xl bg-slate-950 border border-slate-800 p-3 shadow-2xl relative">
      <div id="cmod-tabulator-table" class="rounded-xl overflow-hidden min-h-[500px]"></div>
      
      <!-- Empty State -->
      <div
        v-if="presetRegisters.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-950/80 rounded-2xl pointer-events-none"
      >
        <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
          <i class="fa-solid fa-table-cells-large text-2xl"></i>
        </div>
        <p class="text-slate-400 font-semibold text-sm">No registers in this template</p>
        <p class="text-slate-500 text-xs mt-1">Click "Import Excel" to load a file or "Add Row" to build manually.</p>
      </div>
    </div>

  </div>
`;

export const MODBUS_PRESETS_MODALS = `
  <!-- MODAL: IMPORT EXCEL TEMPLATE -->
  <div
    v-if="showImportExcelModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="showImportExcelModal = false"
  >
    <div class="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <i class="fa-solid fa-file-excel text-lg"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Import Modbus Template from Excel</h3>
            <p class="text-xs text-slate-400">Compatible with Daviteq memmap format (.xlsx)</p>
          </div>
        </div>
        <button
          type="button"
          @click="showImportExcelModal = false"
          class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Form Inputs -->
      <div class="space-y-4">
        
        <!-- Template Name -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">
            Template Name <span class="text-rose-400">*</span>
          </label>
          <input
            type="text"
            v-model="importForm.name"
            placeholder="e.g. Daviteq LKS Gas Sensor"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
            required
          />
        </div>

        <!-- Target Profile Selection -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">
            Target Profile Mode <span class="text-rose-400">*</span>
          </label>
          <p class="text-[11px] text-slate-400 mb-2">
            Select profile to determine which registers will have read tickbox checked (Yes/No from Excel columns):
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              v-for="prof in ['RD1', 'Engineering', 'End-user', 'Full']"
              :key="prof"
              @click="importForm.profileType = prof"
              :class="importForm.profileType === prof
                ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-700'"
              class="py-2.5 px-3 rounded-xl border text-xs text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <i class="fa-solid" :class="prof === 'Full' ? 'fa-globe' : prof === 'RD1' ? 'fa-flask' : prof === 'Engineering' ? 'fa-screwdriver-wrench' : 'fa-user-check'"></i>
              <span>{{ prof }}</span>
            </button>
          </div>
        </div>

        <!-- File Upload Area -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">
            Excel File (.xlsx) <span class="text-rose-400">*</span>
          </label>
          
          <div
            class="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/60"
            @click="$refs.excelFileInput.click()"
            @dragover.prevent
            @drop.prevent="onExcelFileDrop"
          >
            <input
              type="file"
              ref="excelFileInput"
              @change="onExcelFileSelect"
              accept=".xlsx, .xls"
              class="hidden"
            />

            <div v-if="!importForm.file">
              <i class="fa-solid fa-cloud-arrow-up text-3xl text-emerald-400/80 mb-2"></i>
              <p class="text-xs font-bold text-slate-200">Click to browse or drag & drop .xlsx file</p>
              <p class="text-[11px] text-slate-500 mt-1">Supports @example/memmap_lks.xlsx format</p>
            </div>

            <div v-else class="flex items-center justify-center gap-3 text-left">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <i class="fa-solid fa-file-excel text-lg"></i>
              </div>
              <div>
                <p class="text-xs font-bold text-white">{{ importForm.fileName }}</p>
                <p class="text-[11px] text-slate-400">{{ (importForm.file.size / 1024).toFixed(1) }} KB</p>
              </div>
              <button
                type="button"
                @click.stop="clearImportFile"
                class="ml-2 w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 flex items-center justify-center text-xs"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Optional Description -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">Description (Optional)</label>
          <input
            type="text"
            v-model="importForm.description"
            placeholder="e.g. Imported from memmap_lks.xlsx"
            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <!-- Mappings Info Banner -->
        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p class="font-bold text-slate-300 flex items-center gap-1.5">
            <i class="fa-solid fa-circle-info text-sky-400"></i>
            <span>Automatic Column Mappings:</span>
          </p>
          <p class="font-mono text-[10px] text-slate-400 pl-4 leading-relaxed">
            No. &rarr; # &bull; Modbus Register &rarr; Address &bull; Slave &rarr; 1 &bull; FC (Read) &rarr; 3 &bull; # of Regs &rarr; REG_NUM &bull; Format &rarr; Format &bull; Description &rarr; Parameter Name &bull; End-user Default &rarr; Value to Write &bull; Endianness &rarr; Big-Endian.
          </p>
        </div>

      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          @click="showImportExcelModal = false"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
        >
          Cancel
        </button>

        <button
          type="button"
          @click="confirmImportExcel"
          :disabled="isProcessingImport || !importForm.file || !importForm.name"
          class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-600/30"
        >
          <i class="fa-solid" :class="isProcessingImport ? 'fa-spinner fa-spin' : 'fa-check'"></i>
          <span>{{ isProcessingImport ? 'Importing...' : 'Import & Apply' }}</span>
        </button>
      </div>

    </div>
  </div>

  <!-- MODAL: CREATE BLANK TEMPLATE -->
  <div
    v-if="showCreateTemplateModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    @click.self="showCreateTemplateModal = false"
  >
    <div class="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-plus text-sky-400"></i>
          <span>Create New Template</span>
        </h3>
        <button
          type="button"
          @click="showCreateTemplateModal = false"
          class="text-slate-400 hover:text-white"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Template Name *</label>
          <input
            type="text"
            v-model="createForm.name"
            placeholder="e.g. Custom Modbus Profile"
            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Profile Mode</label>
          <select
            v-model="createForm.profileType"
            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-sky-500 focus:outline-none"
          >
            <option value="Custom">Custom</option>
            <option value="RD1">RD1</option>
            <option value="Engineering">Engineering</option>
            <option value="End-user">End-user</option>
            <option value="Full">Full</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">Description</label>
          <input
            type="text"
            v-model="createForm.description"
            placeholder="Optional description"
            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          @click="showCreateTemplateModal = false"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="confirmCreateTemplate"
          :disabled="!createForm.name"
          class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2"
        >
          <span>Create Template</span>
        </button>
      </div>
    </div>
  </div>
`;

export const MODBUS_PRESETS_SCRIPT = `
  function useModbusPresetsModule(sharedCtx) {
    const { ref, computed, nextTick, watch, onMounted } = Vue;
    const { showToast, authHeaders, currentUser, activeTab } = sharedCtx;

    const presetsList = ref([]);
    const activePresetId = ref('');
    const activePreset = ref({
      name: '',
      description: '',
      profileType: 'Custom',
      createdBy: 'admin',
      registers: [],
    });
    const presetRegisters = ref([]);
    const selectedPresetRowCount = ref(0);
    const isSavingPreset = ref(false);
    const presetFilterQuery = ref('');

    // Modals
    const showImportExcelModal = ref(false);
    const showCreateTemplateModal = ref(false);
    const isProcessingImport = ref(false);

    const importForm = ref({
      name: '',
      profileType: 'RD1',
      description: '',
      file: null,
      fileName: '',
      author: '',
    });

    const createForm = ref({
      name: '',
      profileType: 'Custom',
      description: '',
    });

    let cmodTabulator = null;
    let isBuildingCmodTable = false;
    let lastSelectedPresetRowId = null;

    const checkedRegistersCount = computed(() => {
      return presetRegisters.value.filter(r => r.checked).length;
    });

    // Helper: Normalize Modbus Format
    const normalizePresetFormat = (f) => {
      const s = String(f || '').toLowerCase();
      if (s.includes('string') || s.includes('str') || s.includes('ascii') || s.includes('text')) return 'string';
      if (s.includes('float') || s.includes('double')) return 'float';
      if (s.includes('uint')) return 'uint';
      if (s.includes('int')) return 'int';
      if (s.includes('hex')) return 'hex';
      return 'uint';
    };

    // Fetch all presets from backend
    const fetchPresets = async () => {
      try {
        const res = await fetch('/api/modbus-presets', {
          headers: authHeaders(),
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            presetsList.value = data;
            if (!activePresetId.value || !data.some(p => p.id === activePresetId.value)) {
              activePresetId.value = data[0].id;
              selectPreset(data[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch modbus presets:', err);
      }
    };

    // Select a preset and load its data into table
    const selectPreset = async (id) => {
      activePresetId.value = id;
      selectedPresetRowCount.value = 0;
      try {
        const res = await fetch('/api/modbus-presets/' + encodeURIComponent(id), {
          headers: authHeaders(),
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          activePreset.value = {
            id: data.id,
            name: data.name || '',
            description: data.description || '',
            profileType: data.profileType || 'Custom',
            createdBy: data.createdBy || 'admin',
            registers: Array.isArray(data.registers) ? data.registers : [],
          };
          presetRegisters.value = (data.registers || []).map((r, i) => ({
            id: r.id || 'reg_' + (r.reg ?? i) + '_' + Math.random().toString(36).substr(2, 5),
            order: Number(r.order) || (i + 1),
            checked: r.checked !== false,
            slave: Number(r.slave) || 1,
            fc: Number(r.fc) || 3,
            reg: Number(r.reg) || 0,
            numreg: Number(r.numreg) || 1,
            format: normalizePresetFormat(r.format),
            endianness: r.endianness || 'Big-Endian',
            parameter: r.parameter || ('Register ' + (r.reg ?? i)),
            valuetowrite: r.valuetowrite !== undefined && r.valuetowrite !== null ? String(r.valuetowrite) : '',
            comment: r.comment || '',
          }));
          updateCmodTabulatorData();
        }
      } catch (e) {
        console.error('Failed to load preset:', e);
      }
    };

    const onPresetSelectChange = () => {
      selectPreset(activePresetId.value);
    };

    // Update Tabulator Table Data safely
    const updateCmodTabulatorData = () => {
      if (cmodTabulator && typeof cmodTabulator.setData === 'function') {
        try {
          cmodTabulator.setData(presetRegisters.value);
        } catch (e) {
          console.warn('Error setting Tabulator data:', e);
        }
      } else {
        initPresetsTabulator();
      }
    };

    // Initialize Tabulator 6.x Table
    const initPresetsTabulator = (retryCount = 0) => {
      if (isBuildingCmodTable) return;
      isBuildingCmodTable = true;

      nextTick(() => {
        const container = document.getElementById('cmod-tabulator-table');
        if (!container) {
          isBuildingCmodTable = false;
          if (retryCount < 10) {
            setTimeout(() => initPresetsTabulator(retryCount + 1), 100);
          }
          return;
        }

        if (typeof Tabulator === 'undefined') {
          isBuildingCmodTable = false;
          if (retryCount < 20) {
            setTimeout(() => initPresetsTabulator(retryCount + 1), 150);
          }
          return;
        }

        if (cmodTabulator) {
          try {
            cmodTabulator.destroy();
          } catch(e) {}
          cmodTabulator = null;
        }

        try {
          cmodTabulator = new Tabulator(container, {
            data: presetRegisters.value,
            layout: "fitColumns",
            responsiveLayout: false,
            height: "560px",
            renderVertical: "virtual",
            selectableRows: "highlight",
            placeholder: "No registers defined in this template",
            rowClick: function(e, row) {
              if (e._handledInCell) return;
              const target = e.target;
              if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'BUTTON')) return;
              row.select();
            },
            rowDblClick: function(e, row) {
              if (e._handledInCell) return;
              row.deselect();
            },
            columns: [
              // Row index column with selection toggle and Excel-like Shift+Click
              {
                title: "#",
                formatter: "rownum",
                hozAlign: "center",
                headerHozAlign: "center",
                width: 48,
                headerSort: false,
                cssClass: "cursor-pointer select-none",
                headerTooltip: "Click to select all / deselect all rows",
                headerClick: function(e, column) {
                  const table = column.getTable();
                  const selected = table.getSelectedRows();
                  if (selected.length === table.getRows().length) {
                    table.deselectRow();
                  } else {
                    table.selectRow();
                  }
                },
                cellClick: function(e, cell) {
                  e._handledInCell = true;
                  const row = cell.getRow();
                  if (e.shiftKey && lastSelectedPresetRowId) {
                    const allRows = cmodTabulator ? cmodTabulator.getRows() : [];
                    const idx1 = allRows.findIndex(r => r.getData().id === lastSelectedPresetRowId);
                    const idx2 = allRows.findIndex(r => r.getData().id === row.getData().id);
                    if (idx1 !== -1 && idx2 !== -1) {
                      const start = Math.min(idx1, idx2);
                      const end = Math.max(idx1, idx2);
                      for (let i = start; i <= end; i++) {
                        allRows[i].select();
                      }
                      return;
                    }
                  }
                  lastSelectedPresetRowId = row.getData().id;
                  row.toggleSelect();
                }
              },
              // Checkbox column: independent toggle, does not toggle row highlight
              {
                titleFormatter: function() {
                  const chk = document.createElement('input');
                  chk.type = 'checkbox';
                  chk.id = 'cmod-header-tick-all';
                  chk.className = 'rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer';
                  chk.checked = presetRegisters.value.length > 0 && presetRegisters.value.every(r => r.checked);
                  chk.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e._handledInCell = true;
                  });
                  chk.addEventListener('change', function(e) {
                    e._handledInCell = true;
                    const next = e.target.checked;
                    presetRegisters.value.forEach(r => { r.checked = next; });
                    presetRegisters.value = [...presetRegisters.value];
                    if (cmodTabulator) {
                      cmodTabulator.updateData(presetRegisters.value);
                    }
                  });
                  return chk;
                },
                field: "checked",
                hozAlign: "center",
                headerHozAlign: "center",
                headerSort: false,
                width: 46,
                cellClick: function(e) {
                  e._handledInCell = true;
                },
                formatter: function(cell) {
                  const isChecked = !!cell.getValue();
                  const input = document.createElement('input');
                  input.type = 'checkbox';
                  input.checked = isChecked;
                  input.className = 'rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer';
                  input.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e._handledInCell = true;
                  });
                  input.addEventListener('change', function(e) {
                    e._handledInCell = true;
                    const rowData = cell.getRow().getData();
                    rowData.checked = e.target.checked;
                    const item = presetRegisters.value.find(r => r.id === rowData.id);
                    if (item) item.checked = e.target.checked;
                    presetRegisters.value = [...presetRegisters.value];

                    const headerChk = document.getElementById('cmod-header-tick-all');
                    if (headerChk) {
                      headerChk.checked = presetRegisters.value.length > 0 && presetRegisters.value.every(r => r.checked);
                    }
                  });
                  return input;
                }
              },
              // Register Address
              {
                title: "ADDRESS",
                field: "reg",
                editor: "number",
                editorParams: { min: 0 },
                width: 95,
                hozAlign: "right",
                headerHozAlign: "left",
                formatter: function(cell) {
                  return '<span class="font-mono font-bold text-white">' + (cell.getValue() ?? 0) + '</span>';
                }
              },
              // Slave ID
              {
                title: "SLAVE",
                field: "slave",
                editor: "number",
                editorParams: { min: 1, max: 247 },
                width: 75,
                hozAlign: "center",
                headerHozAlign: "center"
              },
              // Function Code (Read)
              {
                title: "FC",
                field: "fc",
                editor: "list",
                editorParams: {
                  values: [
                    { value: 3, label: "03" },
                    { value: 4, label: "04" },
                    { value: 16, label: "16" },
                    { value: 1, label: "01" },
                    { value: 2, label: "02" },
                    { value: 6, label: "06" },
                  ]
                },
                width: 75,
                hozAlign: "center",
                headerHozAlign: "center",
                formatter: function(cell) {
                  const v = Number(cell.getValue());
                  const s = v < 10 ? '0' + v : String(v);
                  return '<span class="font-bold text-cyan-400 font-mono">' + s + '</span>';
                }
              },
              // # of Registers
              {
                title: "REG_NUM",
                field: "numreg",
                editor: "number",
                editorParams: { min: 1, max: 125 },
                width: 85,
                hozAlign: "center",
                headerHozAlign: "center"
              },
              // Format
              {
                title: "FORMAT",
                field: "format",
                editor: "list",
                editorParams: {
                  values: ["float", "uint", "int", "hex", "string"]
                },
                width: 95,
                hozAlign: "center",
                headerHozAlign: "center",
                formatter: function(cell) {
                  return '<span class="text-amber-400 font-mono font-semibold">' + (cell.getValue() || 'uint') + '</span>';
                }
              },
              // Endianness
              {
                title: "ENDIANNESS",
                field: "endianness",
                editor: "list",
                editorParams: {
                  values: ["Big-Endian", "Little-Endian", "Mid-Big", "Mid-Little"]
                },
                width: 125,
                hozAlign: "center",
                headerHozAlign: "center"
              },
              // Parameter Name
              {
                title: "PARAMETER_NAME",
                field: "parameter",
                editor: "input",
                minWidth: 160
              },
              // Value to Write (End-user Default)
              {
                title: "VALUE_TO_WRITE",
                field: "valuetowrite",
                minWidth: 140,
                hozAlign: "center",
                headerHozAlign: "center",
                formatter: function(cell) {
                  const row = cell.getRow().getData();
                  const val = row.valuetowrite !== undefined && row.valuetowrite !== null ? row.valuetowrite : '';
                  const input = document.createElement('input');
                  input.type = 'text';
                  input.value = val;
                  input.placeholder = '';
                  input.className = 'w-full h-7 px-2 text-center text-xs font-mono font-bold text-amber-300 bg-slate-950/80 border border-slate-700/80 rounded focus:border-amber-400 focus:bg-slate-900 outline-none transition';
                  input.style.width = '100%';
                  input.style.boxSizing = 'border-box';

                  input.addEventListener('input', function(e) {
                    const v = e.target.value;
                    row.valuetowrite = v;
                    const r = presetRegisters.value.find(x => x.id === row.id);
                    if (r) r.valuetowrite = v;
                  });
                  input.addEventListener('click', function(e) { e.stopPropagation(); });
                  input.addEventListener('dblclick', function(e) { e.stopPropagation(); });
                  return input;
                }
              },
              // Action column
              {
                title: "ACTION",
                width: 75,
                hozAlign: "center",
                headerHozAlign: "center",
                headerSort: false,
                formatter: function() {
                  return '<button type="button" class="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 text-[11px] font-bold"><i class="fa-solid fa-trash-can"></i></button>';
                },
                cellClick: function(e, cell) {
                  e.stopPropagation();
                  e._handledInCell = true;
                  const rowData = cell.getRow().getData();
                  deleteSingleRow(rowData.id);
                }
              }
            ]
          });

          cmodTabulator.on("rowSelectionChanged", function(data, rows) {
            selectedPresetRowCount.value = rows.length;
          });

          cmodTabulator.on("cellEdited", function(cell) {
            const rowData = cell.getRow().getData();
            const idx = presetRegisters.value.findIndex(r => r.id === rowData.id);
            if (idx !== -1) {
              presetRegisters.value[idx] = { ...presetRegisters.value[idx], ...rowData };
            }
          });

        } catch (err) {
          console.error('Failed to construct C-Module Tabulator table:', err);
        } finally {
          isBuildingCmodTable = false;
        }
      });
    };

    // Filter table rows by search query
    const filterPresetsTable = () => {
      if (!cmodTabulator) return;
      const q = (presetFilterQuery.value || '').trim().toLowerCase();
      if (!q) {
        cmodTabulator.clearFilter();
        return;
      }
      cmodTabulator.setFilter(function(data) {
        return (
          String(data.reg || '').toLowerCase().includes(q) ||
          String(data.parameter || '').toLowerCase().includes(q) ||
          String(data.format || '').toLowerCase().includes(q) ||
          String(data.valuetowrite || '').toLowerCase().includes(q)
        );
      });
    };

    // Add a new row to template
    const addPresetRow = () => {
      const maxAddr = presetRegisters.value.reduce((acc, cur) => Math.max(acc, Number(cur.reg) || 0), 0);
      const newRow = {
        id: 'reg_new_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4),
        order: presetRegisters.value.length + 1,
        checked: true,
        slave: 1,
        fc: 3,
        reg: maxAddr + 2,
        numreg: 1,
        format: 'uint',
        endianness: 'Big-Endian',
        parameter: 'New Parameter ' + (presetRegisters.value.length + 1),
        valuetowrite: '',
        comment: '',
      };
      presetRegisters.value.push(newRow);
      presetRegisters.value = [...presetRegisters.value];
      updateCmodTabulatorData();
      showToast('Added new register row', 'info');
    };

    // Delete a single row
    const deleteSingleRow = (id) => {
      const idx = presetRegisters.value.findIndex(r => r.id === id);
      if (idx !== -1) {
        presetRegisters.value.splice(idx, 1);
        presetRegisters.value = [...presetRegisters.value];
        updateCmodTabulatorData();
        showToast('Deleted row', 'info');
      }
    };

    // Delete selected / highlighted rows
    const deleteSelectedPresetRows = () => {
      if (!cmodTabulator) return;
      const selected = cmodTabulator.getSelectedRows();
      if (selected.length === 0) return;
      const idsToRemove = new Set(selected.map(r => r.getData().id));
      presetRegisters.value = presetRegisters.value.filter(r => !idsToRemove.has(r.id));
      selectedPresetRowCount.value = 0;
      updateCmodTabulatorData();
      showToast('Deleted ' + idsToRemove.size + ' selected rows', 'info');
    };

    // Save current active preset
    const saveCurrentPreset = async () => {
      if (!activePreset.value.name || !activePreset.value.name.trim()) {
        showToast('Template name is required', 'error');
        return;
      }
      isSavingPreset.value = true;
      try {
        const payload = {
          name: activePreset.value.name.trim(),
          description: (activePreset.value.description || '').trim(),
          profileType: activePreset.value.profileType || 'Custom',
          registers: presetRegisters.value.map((r, i) => ({
            id: r.id,
            order: i + 1,
            checked: !!r.checked,
            slave: Number(r.slave) || 1,
            fc: Number(r.fc) || 3,
            reg: Number(r.reg) || 0,
            numreg: Number(r.numreg) || 1,
            format: normalizePresetFormat(r.format),
            endianness: r.endianness || 'Big-Endian',
            parameter: r.parameter || '',
            valuetowrite: r.valuetowrite !== undefined ? String(r.valuetowrite) : '',
            comment: r.comment || '',
          })),
        };

        const isExisting = presetsList.value.some(p => p.id === activePresetId.value);
        const url = isExisting ? '/api/modbus-presets/' + encodeURIComponent(activePresetId.value) : '/api/modbus-presets';
        const method = isExisting ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });

        if (res.ok) {
          const saved = await res.json();
          showToast('Template saved successfully: ' + saved.name, 'success');
          await fetchPresets();
          if (saved.id) {
            activePresetId.value = saved.id;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast(errData.message || 'Failed to save template', 'error');
        }
      } catch (err) {
        console.error('Save template error:', err);
        showToast('Error saving template: ' + err.message, 'error');
      } finally {
        isSavingPreset.value = false;
      }
    };

    // Open create template modal
    const openCreateModal = () => {
      createForm.value = {
        name: '',
        profileType: 'Custom',
        description: '',
      };
      showCreateTemplateModal.value = true;
    };

    // Confirm create blank template
    const confirmCreateTemplate = async () => {
      if (!createForm.value.name.trim()) {
        showToast('Template name is required', 'error');
        return;
      }
      try {
        const username = currentUser.value?.username || 'admin';
        const res = await fetch('/api/modbus-presets', {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: createForm.value.name.trim(),
            description: createForm.value.description.trim(),
            profileType: createForm.value.profileType,
            createdBy: username,
            registers: [],
          }),
          credentials: 'include',
        });

        if (res.ok) {
          const created = await res.json();
          showCreateTemplateModal.value = false;
          showToast('Created template: ' + created.name, 'success');
          await fetchPresets();
          activePresetId.value = created.id;
          await selectPreset(created.id);
        }
      } catch (e) {
        showToast('Failed to create template: ' + e.message, 'error');
      }
    };

    // Delete current template
    const deleteCurrentPreset = async () => {
      if (!activePresetId.value) return;
      if (!confirm('Are you sure you want to delete template "' + activePreset.value.name + '"?')) return;
      try {
        const res = await fetch('/api/modbus-presets/' + encodeURIComponent(activePresetId.value), {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        });
        if (res.ok) {
          showToast('Template deleted', 'success');
          activePresetId.value = '';
          await fetchPresets();
        }
      } catch (e) {
        showToast('Failed to delete template: ' + e.message, 'error');
      }
    };

    // Open Import Excel Modal
    const openImportModal = () => {
      importForm.value = {
        name: '',
        profileType: 'RD1',
        description: '',
        file: null,
        fileName: '',
        author: currentUser.value?.username || 'admin',
      };
      showImportExcelModal.value = true;
    };

    const onExcelFileSelect = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        importForm.value.file = file;
        importForm.value.fileName = file.name;
        if (!importForm.value.name) {
          const baseName = file.name.replace(/\\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          importForm.value.name = baseName.toUpperCase() + ' - ' + importForm.value.profileType;
        }
      }
    };

    const onExcelFileDrop = (e) => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        importForm.value.file = file;
        importForm.value.fileName = file.name;
        if (!importForm.value.name) {
          const baseName = file.name.replace(/\\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          importForm.value.name = baseName.toUpperCase() + ' - ' + importForm.value.profileType;
        }
      }
    };

    const clearImportFile = () => {
      importForm.value.file = null;
      importForm.value.fileName = '';
    };

    // Helper: Match Profile Column in Excel
    const findProfileColumnKey = (rowObj, targetProfile) => {
      const keys = Object.keys(rowObj);
      const prof = (targetProfile || '').toLowerCase();
      return keys.find(k => {
        const kl = k.toLowerCase().replace(/[-_ ]/g, '');
        if (prof === 'rd1') return kl.includes('rd1');
        if (prof === 'engineering') return kl.includes('engineering');
        if (prof === 'enduser' || prof === 'end-user') {
          return kl.includes('inenduser') || (kl.includes('enduser') && kl.includes('template'));
        }
        if (prof === 'full') return kl.includes('full');
        return false;
      });
    };

    // Parse and Confirm Import from Excel file using SheetJS (XLSX)
    const confirmImportExcel = async () => {
      if (!importForm.value.file) {
        showToast('Please select an Excel (.xlsx) file', 'error');
        return;
      }
      if (!importForm.value.name.trim()) {
        showToast('Please enter a template name', 'error');
        return;
      }

      if (typeof XLSX === 'undefined') {
        showToast('SheetJS (XLSX) library is loading, please try again in a moment', 'error');
        return;
      }

      isProcessingImport.value = true;
      try {
        const file = importForm.value.file;
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('No sheets found in Excel file');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!Array.isArray(rawRows) || rawRows.length === 0) {
          throw new Error('Sheet is empty or has no readable rows');
        }

        const chosenProfile = importForm.value.profileType || 'RD1';
        let yesCheckedCount = 0;

        // Map Excel rows to standard Modbus registers
        const parsedRegisters = rawRows.map((r, i) => {
          // Profile check (Yes/No)
          let isChecked = false;
          const profKey = findProfileColumnKey(r, chosenProfile);
          if (profKey) {
            const v = String(r[profKey] || '').trim().toLowerCase();
            isChecked = (v === 'yes' || v === 'y' || v === 'true' || v === '1');
          } else if (chosenProfile === 'Full') {
            isChecked = true;
          }

          if (isChecked) yesCheckedCount++;

          const regOrder = Number(r['No.']) || (i + 1);
          const regAddr = Number(r['Modbus Register (Decimal)'] !== undefined ? r['Modbus Register (Decimal)'] : r['Address']) || 0;
          const numReg = Number(r['# of Registers'] !== undefined ? r['# of Registers'] : r['REG_NUM']) || 1;
          const fmt = normalizePresetFormat(r['Format']);
          const paramName = String(r['Description'] !== undefined ? r['Description'] : (r['Parameter_name'] || '')).trim() || ('Register ' + regAddr);
          const valToWrite = String(r['End-user Default'] !== undefined ? r['End-user Default'] : (r['Value_to_write'] || '')).trim();

          return {
            id: 'reg_' + regAddr + '_' + i + '_' + Math.random().toString(36).substr(2, 4),
            order: regOrder,
            checked: isChecked,
            slave: 1,
            fc: 3, // Function Code read default 3
            reg: regAddr,
            numreg: numReg,
            format: fmt,
            endianness: 'Big-Endian',
            parameter: paramName,
            valuetowrite: valToWrite,
            comment: r['Comment'] || '',
          };
        });

        // Create new preset in backend
        const username = currentUser.value?.username || 'admin';
        const newPresetPayload = {
          name: importForm.value.name.trim(),
          description: importForm.value.description.trim() || ('Imported from ' + file.name + ' for ' + chosenProfile),
          profileType: chosenProfile,
          createdBy: username,
          registers: parsedRegisters,
        };

        const res = await fetch('/api/modbus-presets', {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(newPresetPayload),
          credentials: 'include',
        });

        if (res.ok) {
          const created = await res.json();
          showImportExcelModal.value = false;
          showToast('Imported ' + parsedRegisters.length + ' registers (' + yesCheckedCount + ' checked for ' + chosenProfile + ')', 'success');
          await fetchPresets();
          activePresetId.value = created.id;
          await selectPreset(created.id);
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Server rejected template import');
        }

      } catch (err) {
        console.error('Import Excel Error:', err);
        showToast('Excel Import Failed: ' + err.message, 'error');
      } finally {
        isProcessingImport.value = false;
      }
    };

    // Export registers to CSV
    const exportPresetCSV = () => {
      if (presetRegisters.value.length === 0) {
        showToast('No registers to export', 'info');
        return;
      }
      const headers = ['No.', 'Checked', 'Slave', 'FC', 'Address', 'REG_NUM', 'Format', 'Endianness', 'Parameter_name', 'Value_to_write'];
      const rows = presetRegisters.value.map((r, i) => [
        r.order || (i + 1),
        r.checked ? 'Yes' : 'No',
        r.slave || 1,
        r.fc || 3,
        r.reg || 0,
        r.numreg || 1,
        r.format || 'uint',
        r.endianness || 'Big-Endian',
        '"' + String(r.parameter || '').replace(/"/g, '""') + '"',
        '"' + String(r.valuetowrite || '').replace(/"/g, '""') + '"',
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', (activePreset.value.name || 'modbus_template').replace(/[^a-z0-9]/gi, '_') + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported registers to CSV', 'success');
    };

    // Watch tab switch to initialize Tabulator
    watch(activeTab, (newTab) => {
      if (newTab === 'modbus-presets') {
        fetchPresets();
        setTimeout(() => {
          initPresetsTabulator();
        }, 120);
      }
    });

    onMounted(() => {
      if (activeTab.value === 'modbus-presets') {
        fetchPresets();
        setTimeout(() => {
          initPresetsTabulator();
        }, 150);
      }
    });

    return {
      presetsList,
      activePresetId,
      activePreset,
      presetRegisters,
      selectedPresetRowCount,
      checkedRegistersCount,
      isSavingPreset,
      presetFilterQuery,
      showImportExcelModal,
      showCreateTemplateModal,
      isProcessingImport,
      importForm,
      createForm,
      fetchPresets,
      selectPreset,
      onPresetSelectChange,
      addPresetRow,
      deleteSelectedPresetRows,
      saveCurrentPreset,
      deleteCurrentPreset,
      openImportModal,
      openCreateModal,
      confirmCreateTemplate,
      onExcelFileSelect,
      onExcelFileDrop,
      clearImportFile,
      confirmImportExcel,
      exportPresetCSV,
      filterPresetsTable,
      initPresetsTabulator,
    };
  }
`;
