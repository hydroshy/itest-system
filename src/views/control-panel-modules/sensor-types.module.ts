// ========================================================
// C-MODULE: LORAWAN SENSOR TYPES & SKU MAPPINGS
// ========================================================

export const SENSOR_TYPES_TEMPLATE = `
        <!-- TAB 16: LORAWAN SENSOR TYPES MANAGEMENT -->
        <div v-show="activeTab === 'sensor-types'" class="space-y-6">
          <!-- Header Banner -->
          <div class="glass-card rounded-2xl p-5 border border-sky-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl shadow-inner">
                <i class="fa-solid fa-microchip"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-extrabold text-white">LoRaWAN Sensor Types & SKU Mappings</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">C-MODULE</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">Map Modbus Register 103 (Sensor Type Code) to hardware SKU (e.g. 71 → WSLRW-LKS), default Region, and LoRaWAN Class for automated testing.</p>
              </div>
            </div>

            <!-- Header Quick Actions -->
            <div class="flex items-center gap-2">
              <button
                @click="openAddSensorTypeModal"
                class="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20 transition"
              >
                <i class="fa-solid fa-plus"></i> Add Sensor Type
              </button>
              <button
                @click="fetchSensorTypes"
                :disabled="loadingSensorTypes"
                class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition disabled:opacity-50"
                title="Refresh Sensor Types"
              >
                <i :class="loadingSensorTypes ? 'animate-spin' : ''" class="fa-solid fa-arrows-rotate"></i>
              </button>
            </div>
          </div>

          <!-- Filter & Search Bar -->
          <div class="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-80">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-500"></i>
              <input
                v-model="sensorTypeFilter"
                @input="onSensorTypeFilterChange"
                type="text"
                placeholder="Search by code, SKU, or name..."
                class="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div class="text-xs text-slate-400 font-mono">
              Total Mappings: <strong class="text-white">{{ sensorTypesList.length }}</strong>
            </div>
          </div>

          <!-- Sensor Types Data Table -->
          <div class="glass-card rounded-xl overflow-hidden border border-slate-800">
            <div class="overflow-x-auto custom-scroll">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th class="py-3 px-4 font-mono">Code (Dec)</th>
                    <th class="py-3 px-4 font-mono">Target SKU</th>
                    <th class="py-3 px-4">Sensor Name & Description</th>
                    <th class="py-3 px-4 font-mono">Region</th>
                    <th class="py-3 px-4 font-mono">Class</th>
                    <th class="py-3 px-4 text-center">Status</th>
                    <th class="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  <tr v-if="loadingSensorTypes">
                    <td colspan="7" class="py-8 text-center text-slate-500">
                      <i class="fa-solid fa-circle-notch animate-spin text-sky-400 mr-2"></i> Loading sensor types...
                    </td>
                  </tr>
                  <tr v-else-if="filteredSensorTypes.length === 0">
                    <td colspan="7" class="py-8 text-center text-slate-500">
                      No sensor type mappings found matching criteria.
                    </td>
                  </tr>
                  <tr v-for="item in filteredSensorTypes" :key="item.id || item.sensorTypeCode" class="hover:bg-slate-800/30 transition group">
                    <td class="py-3 px-4 font-mono font-bold text-amber-400">
                      <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {{ item.sensorTypeCode }}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-mono font-bold text-cyan-300">
                      {{ item.sku }}
                    </td>
                    <td class="py-3 px-4">
                      <div class="font-semibold text-white">{{ item.name }}</div>
                      <div class="text-[11px] text-slate-400 line-clamp-1">{{ item.description || '—' }}</div>
                    </td>
                    <td class="py-3 px-4 font-mono text-slate-300">
                      <span class="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-bold">
                        {{ item.defaultRegion || 'EU868' }}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-mono text-slate-300">
                      <span class="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 text-[10px] font-bold">
                        Class {{ item.defaultClass || 'A' }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span :class="item.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'" class="px-2 py-0.5 rounded text-[10px] font-bold border inline-block">
                        {{ item.isActive ? 'ACTIVE' : 'DISABLED' }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right space-x-1">
                      <button
                        @click="openEditSensorTypeModal(item)"
                        class="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                        title="Edit Mapping"
                      >
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        @click="openDeleteSensorTypeModal(item)"
                        class="p-1.5 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
                        title="Delete Mapping"
                      >
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
`;

export const SENSOR_TYPES_MODALS = `
    <!-- MODAL: ADD / EDIT SENSOR TYPE -->
    <div v-if="showSensorTypeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card rounded-2xl w-full max-w-lg border border-slate-700 p-6 space-y-5 shadow-2xl animate-fade-in">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm">
              <i class="fa-solid fa-microchip"></i>
            </div>
            <h3 class="text-sm font-bold text-white">{{ isEditingSensorType ? 'Edit Sensor Type Mapping' : 'Add New Sensor Type Mapping' }}</h3>
          </div>
          <button @click="closeSensorTypeModal" class="text-slate-400 hover:text-white text-xs cursor-pointer">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <form @submit.prevent="saveSensorType" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-300">Sensor Type Code (Dec) <span class="text-rose-400">*</span></label>
              <input
                v-model.number="sensorTypeForm.sensorTypeCode"
                type="number"
                min="1"
                max="255"
                required
                :disabled="isEditingSensorType"
                placeholder="e.g. 71"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
              <p class="text-[10px] text-slate-500">Decimal value from Modbus Register 103 (1-255).</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-300">Target Hardware SKU <span class="text-rose-400">*</span></label>
              <input
                v-model="sensorTypeForm.sku"
                type="text"
                required
                placeholder="e.g. WSLRW-LKS"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500 uppercase"
              />
              <p class="text-[10px] text-slate-500">Exact SKU in Decoder and Item Code catalog.</p>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-300">Sensor Name <span class="text-rose-400">*</span></label>
            <input
              v-model="sensorTypeForm.name"
              type="text"
              required
              placeholder="e.g. Wireless LoRaWAN Leak Sensor"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-300">Description</label>
            <textarea
              v-model="sensorTypeForm.description"
              rows="2"
              placeholder="Optional notes or hardware specifications..."
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-sky-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-300">Default Region Profile</label>
              <select
                v-model="sensorTypeForm.defaultRegion"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="EU868">EU868</option>
                <option value="AS923-1">AS923-1</option>
                <option value="AS923-2">AS923-2</option>
                <option value="US915">US915</option>
                <option value="AU915">AU915</option>
                <option value="IN865">IN865</option>
                <option value="KR920">KR920</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-300">Default LoRaWAN Class</label>
              <select
                v-model="sensorTypeForm.defaultClass"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="A">Class A (Battery-powered)</option>
                <option value="C">Class C (Main-powered / Continuous)</option>
                <option value="B">Class B</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input
              id="sensorTypeActiveCheck"
              type="checkbox"
              v-model="sensorTypeForm.isActive"
              class="rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-950 cursor-pointer"
            />
            <label for="sensorTypeActiveCheck" class="text-xs text-slate-300 cursor-pointer">
              Active in automatic registration & workbench lookup
            </label>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="closeSensorTypeModal"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSavingSensorType"
              class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              <i v-if="isSavingSensorType" class="fa-solid fa-circle-notch animate-spin"></i>
              <span>{{ isEditingSensorType ? 'Update Mapping' : 'Create Mapping' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: DELETE SENSOR TYPE CONFIRM -->
    <div v-if="showDeleteSensorTypeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="glass-card rounded-2xl w-full max-w-sm border border-rose-500/30 p-6 space-y-4 shadow-2xl animate-fade-in text-center">
        <div class="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-lg">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Delete Sensor Type Mapping?</h3>
          <p class="text-xs text-slate-400 mt-1">
            Are you sure you want to remove mapping for Code <strong class="text-amber-400 font-mono">{{ deletingSensorType?.sensorTypeCode }}</strong> (<span class="text-cyan-300 font-mono">{{ deletingSensorType?.sku }}</span>)?
          </p>
        </div>
        <div class="flex items-center justify-center gap-3 pt-2">
          <button
            @click="showDeleteSensorTypeModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            @click="confirmDeleteSensorType"
            class="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold cursor-pointer shadow-lg shadow-rose-500/20 transition"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
`;

export const SENSOR_TYPES_SCRIPT = `
    function useSensorTypesModule(ctx) {
      const { showToast, authHeaders, activeTab } = ctx;
      const ref = (typeof Vue !== 'undefined' && Vue.ref) ? Vue.ref : function(v) { return { value: v }; };
      const computed = (typeof Vue !== 'undefined' && Vue.computed) ? Vue.computed : function(fn) { return { get value() { return fn(); } }; };
      const watch = (typeof Vue !== 'undefined' && Vue.watch) ? Vue.watch : function() {};

      const sensorTypesList = ref([]);
      const loadingSensorTypes = ref(false);
      const sensorTypeFilter = ref('');
      const showSensorTypeModal = ref(false);
      const isEditingSensorType = ref(false);
      const isSavingSensorType = ref(false);
      const showDeleteSensorTypeModal = ref(false);
      const deletingSensorType = ref(null);

      const sensorTypeForm = ref({
        sensorTypeCode: '',
        sku: '',
        name: '',
        description: '',
        defaultRegion: 'EU868',
        defaultClass: 'A',
        isActive: true,
      });

      const fetchSensorTypes = async () => {
        loadingSensorTypes.value = true;
        try {
          const res = await fetch('/api/c-modules/sensor-types?limit=100', { headers: authHeaders() });
          if (res.ok) {
            const data = await res.json();
            sensorTypesList.value = data.data || data.items || (Array.isArray(data) ? data : []);
          }
        } catch (e) {
          console.error('Failed to load sensor types:', e);
        } finally {
          loadingSensorTypes.value = false;
        }
      };

      const filteredSensorTypes = computed(() => {
        const q = (sensorTypeFilter.value || '').trim().toLowerCase();
        if (!q) return sensorTypesList.value;
        return sensorTypesList.value.filter(item => {
          return (
            String(item.sensorTypeCode).includes(q) ||
            (item.sku && item.sku.toLowerCase().includes(q)) ||
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.description && item.description.toLowerCase().includes(q))
          );
        });
      });

      const onSensorTypeFilterChange = () => {};

      const openAddSensorTypeModal = () => {
        isEditingSensorType.value = false;
        sensorTypeForm.value = {
          sensorTypeCode: '',
          sku: '',
          name: '',
          description: '',
          defaultRegion: 'EU868',
          defaultClass: 'A',
          isActive: true,
        };
        showSensorTypeModal.value = true;
      };

      const openEditSensorTypeModal = (item) => {
        isEditingSensorType.value = true;
        sensorTypeForm.value = {
          id: item.id,
          sensorTypeCode: item.sensorTypeCode,
          sku: item.sku,
          name: item.name,
          description: item.description || '',
          defaultRegion: item.defaultRegion || 'EU868',
          defaultClass: item.defaultClass || 'A',
          isActive: item.isActive !== undefined ? item.isActive : true,
        };
        showSensorTypeModal.value = true;
      };

      const closeSensorTypeModal = () => {
        showSensorTypeModal.value = false;
      };

      const saveSensorType = async () => {
        isSavingSensorType.value = true;
        try {
          const payload = {
            sensorTypeCode: Number(sensorTypeForm.value.sensorTypeCode),
            sku: (sensorTypeForm.value.sku || '').trim().toUpperCase(),
            name: sensorTypeForm.value.name.trim(),
            description: sensorTypeForm.value.description?.trim(),
            defaultRegion: sensorTypeForm.value.defaultRegion,
            defaultClass: sensorTypeForm.value.defaultClass,
            isActive: sensorTypeForm.value.isActive,
          };

          let res;
          if (isEditingSensorType.value && sensorTypeForm.value.id) {
            res = await fetch('/api/c-modules/sensor-types/' + sensorTypeForm.value.id, {
              method: 'PUT',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          } else {
            res = await fetch('/api/c-modules/sensor-types', {
              method: 'POST',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          }

          if (res.ok) {
            showToast(isEditingSensorType.value ? 'Sensor type updated' : 'Sensor type created', 'success');
            closeSensorTypeModal();
            await fetchSensorTypes();
          } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.message || 'Failed to save sensor type', 'error');
          }
        } catch (e) {
          showToast('Error: ' + e.message, 'error');
        } finally {
          isSavingSensorType.value = false;
        }
      };

      const openDeleteSensorTypeModal = (item) => {
        deletingSensorType.value = item;
        showDeleteSensorTypeModal.value = true;
      };

      const confirmDeleteSensorType = async () => {
        if (!deletingSensorType.value) return;
        try {
          const res = await fetch('/api/c-modules/sensor-types/' + deletingSensorType.value.id, {
            method: 'DELETE',
            headers: authHeaders(),
          });
          if (res.ok) {
            showToast('Sensor type deleted', 'success');
            showDeleteSensorTypeModal.value = false;
            deletingSensorType.value = null;
            await fetchSensorTypes();
          } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.message || 'Failed to delete sensor type', 'error');
          }
        } catch (e) {
          showToast('Delete error: ' + e.message, 'error');
        }
      };

      watch(activeTab, (tab) => {
        if (tab === 'sensor-types') {
          fetchSensorTypes();
        }
      });

      return {
        sensorTypesList,
        loadingSensorTypes,
        sensorTypeFilter,
        showSensorTypeModal,
        isEditingSensorType,
        isSavingSensorType,
        showDeleteSensorTypeModal,
        deletingSensorType,
        sensorTypeForm,
        filteredSensorTypes,
        fetchSensorTypes,
        onSensorTypeFilterChange,
        openAddSensorTypeModal,
        openEditSensorTypeModal,
        closeSensorTypeModal,
        saveSensorType,
        openDeleteSensorTypeModal,
        confirmDeleteSensorType,
      };
    }

    if (typeof window !== 'undefined') {
      window.useSensorTypesModule = useSensorTypesModule;
    }
`;
