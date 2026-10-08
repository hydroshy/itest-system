"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FINAL_CONFIG_MANAGER_SCRIPT = exports.FINAL_CONFIG_MANAGER_MODALS = exports.FINAL_CONFIG_MANAGER_TEMPLATE = void 0;
exports.FINAL_CONFIG_MANAGER_TEMPLATE = `
        <!-- C-MODULE: FINAL CONFIG MANAGER -->
        <div v-show="activeTab === 'final-config-manager'" class="space-y-6">
          <!-- Header Banner -->
          <div class="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl shadow-inner">
                <i class="fa-solid fa-list-check"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-extrabold text-white">Final Config Manager</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">C-MODULE</span>
                </div>
              </div>
            </div>

            <!-- Global Action Buttons -->
            <div class="flex items-center gap-3">
              <button
                @click="fcmRefreshCurrentTab"
                :disabled="fcmLoading"
                class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition flex items-center gap-2 shadow"
                title="Refresh current data"
              >
                <i class="fa-solid fa-rotate" :class="{ 'fa-spin': fcmLoading }"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- Two Sub-Tabs Navigation Bar -->
          <div class="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              @click="fcmSwitchSubTab('presets')"
              :class="fcmActiveSubTab === 'presets' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'"
              class="px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <i class="fa-solid fa-sliders text-sky-400"></i>
              <span>Final Config Presets</span>
              <span class="ml-1.5 px-2 py-0.2 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {{ fcmPresetsTotalCount }}
              </span>
            </button>

            <button
              @click="fcmSwitchSubTab('devices')"
              :class="fcmActiveSubTab === 'devices' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'"
              class="px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <i class="fa-solid fa-microchip text-emerald-400"></i>
              <span>Device Final Config Records</span>
              <span class="ml-1.5 px-2 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {{ fcmDevicesKpis.total }}
              </span>
            </button>
          </div>

          <!-- ================================================================= -->
          <!-- SUB-TAB 1: FINAL CONFIG PRESETS STATUS -->
          <!-- ================================================================= -->
          <div v-show="fcmActiveSubTab === 'presets'" class="space-y-4">
            <!-- Filter & KPI Controls Strip -->
            <div class="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
              <div class="flex flex-wrap items-center gap-3 flex-1">
                <!-- Search Input -->
                <div class="relative min-w-[240px] max-w-sm flex-1">
                  <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    v-model="fcmPresetsSearch"
                    @input="fcmOnPresetsSearchInput"
                    type="text"
                    placeholder="Search by SO, Item Code, SKU, Name..."
                    class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                  />
                  <button
                    v-if="fcmPresetsSearch"
                    @click="fcmClearPresetsSearch"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <!-- SO Filter Dropdown -->
                <select
                  v-model="fcmPresetsSoFilter"
                  @change="fcmApplyPresetsFilters"
                  class="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs text-white focus:outline-none transition cursor-pointer"
                >
                  <option value="">All Sales Orders</option>
                  <option v-for="so in fcmUniquePresetsSos" :key="so" :value="so">{{ so }}</option>
                </select>

                <!-- Item Code Filter Dropdown -->
                <select
                  v-model="fcmPresetsItemCodeFilter"
                  @change="fcmApplyPresetsFilters"
                  class="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs text-white focus:outline-none transition cursor-pointer"
                >
                  <option value="">All Item Codes</option>
                  <option v-for="code in fcmUniquePresetsItemCodes" :key="code" :value="code">{{ code }}</option>
                </select>
              </div>

              <!-- Presets KPI Badges -->
              <div class="flex items-center gap-3">
                <div class="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                  <span class="text-[11px] text-slate-400 font-semibold uppercase">Total Presets:</span>
                  <span class="text-xs font-mono font-bold text-sky-400">{{ fcmPresetsTotalCount }}</span>
                </div>
                <div class="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                  <span class="text-[11px] text-slate-400 font-semibold uppercase">Total Regs Defined:</span>
                  <span class="text-xs font-mono font-bold text-emerald-400">{{ fcmPresetsTotalRegsCount }}</span>
                </div>
              </div>
            </div>

            <!-- Presets Tabulator Table Container -->
            <div class="glass-card rounded-2xl border border-slate-800 p-4 shadow-xl">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-table-list text-sky-400 text-sm"></i>
                  <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Final Config Presets List</span>
                </div>
                <span class="text-[11px] text-slate-500 font-mono">Showing {{ fcmFilteredPresets.length }} of {{ fcmPresetsTotalCount }} presets</span>
              </div>
              <div id="fcm-presets-table" class="tabulator-custom"></div>
            </div>
          </div>

          <!-- ================================================================= -->
          <!-- SUB-TAB 2: DEVICE FINAL CONFIG RECORDS (PASS/FAIL/NONE) -->
          <!-- ================================================================= -->
          <div v-show="fcmActiveSubTab === 'devices'" class="space-y-4">
            <!-- Status Badges KPI & Filter Strip -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- KPI Card: Total Devices -->
              <div
                @click="fcmSetStatusFilter('ALL')"
                :class="fcmStatusFilter === 'ALL' ? 'border-sky-500 ring-2 ring-sky-500/30' : 'border-slate-800 hover:border-slate-700'"
                class="glass-card rounded-2xl p-3.5 border bg-slate-900/60 flex items-center justify-between cursor-pointer transition shadow"
              >
                <div>
                  <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Devices</div>
                  <div class="text-xl font-mono font-extrabold text-white mt-0.5">{{ fcmDevicesKpis.total }}</div>
                </div>
                <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <i class="fa-solid fa-cubes text-sm"></i>
                </div>
              </div>

              <!-- KPI Card: PASS -->
              <div
                @click="fcmSetStatusFilter('PASS')"
                :class="fcmStatusFilter === 'PASS' ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-emerald-500/20 hover:border-emerald-500/40'"
                class="glass-card rounded-2xl p-3.5 border bg-gradient-to-br from-slate-900/90 to-emerald-950/20 flex items-center justify-between cursor-pointer transition shadow"
              >
                <div>
                  <div class="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check text-emerald-400"></i> PASS
                  </div>
                  <div class="text-xl font-mono font-extrabold text-emerald-300 mt-0.5">{{ fcmDevicesKpis.pass }}</div>
                </div>
                <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <i class="fa-solid fa-check text-sm"></i>
                </div>
              </div>

              <!-- KPI Card: FAIL -->
              <div
                @click="fcmSetStatusFilter('FAIL')"
                :class="fcmStatusFilter === 'FAIL' ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-rose-500/20 hover:border-rose-500/40'"
                class="glass-card rounded-2xl p-3.5 border bg-gradient-to-br from-slate-900/90 to-rose-950/20 flex items-center justify-between cursor-pointer transition shadow"
              >
                <div>
                  <div class="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-xmark text-rose-400"></i> FAIL
                  </div>
                  <div class="text-xl font-mono font-extrabold text-rose-300 mt-0.5">{{ fcmDevicesKpis.fail }}</div>
                </div>
                <div class="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <i class="fa-solid fa-xmark text-sm"></i>
                </div>
              </div>

              <!-- KPI Card: NONE -->
              <div
                @click="fcmSetStatusFilter('NONE')"
                :class="fcmStatusFilter === 'NONE' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-amber-500/20 hover:border-amber-500/40'"
                class="glass-card rounded-2xl p-3.5 border bg-gradient-to-br from-slate-900/90 to-amber-950/20 flex items-center justify-between cursor-pointer transition shadow"
              >
                <div>
                  <div class="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-minus text-amber-400"></i> NONE
                  </div>
                  <div class="text-xl font-mono font-extrabold text-amber-300 mt-0.5">{{ fcmDevicesKpis.none }}</div>
                </div>
                <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <i class="fa-solid fa-minus text-sm"></i>
                </div>
              </div>
            </div>

            <!-- Controls & Action Buttons Strip -->
            <div class="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
              <div class="flex flex-wrap items-center gap-3 flex-1">
                <!-- Status Filter Buttons (Desktop quick pills) -->
                <div class="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  <button
                    @click="fcmSetStatusFilter('ALL')"
                    :class="fcmStatusFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
                  >
                    All
                  </button>
                  <button
                    @click="fcmSetStatusFilter('PASS')"
                    :class="fcmStatusFilter === 'PASS' ? 'bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <i class="fa-solid fa-circle-check text-[10px]"></i> PASS
                  </button>
                  <button
                    @click="fcmSetStatusFilter('FAIL')"
                    :class="fcmStatusFilter === 'FAIL' ? 'bg-rose-600/30 text-rose-300 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <i class="fa-solid fa-circle-xmark text-[10px]"></i> FAIL
                  </button>
                  <button
                    @click="fcmSetStatusFilter('NONE')"
                    :class="fcmStatusFilter === 'NONE' ? 'bg-amber-600/30 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <i class="fa-solid fa-circle-minus text-[10px]"></i> NONE
                  </button>
                </div>

                <!-- Search Input -->
                <div class="relative min-w-[240px] max-w-sm flex-1">
                  <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    v-model="fcmDevicesSearch"
                    @input="fcmOnDevicesSearchInput"
                    type="text"
                    placeholder="Search by Serial Number, Item Code, SO..."
                    class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                  />
                  <button
                    v-if="fcmDevicesSearch"
                    @click="fcmClearDevicesSearch"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>

              <!-- Primary Action Buttons -->
              <div class="flex items-center gap-2">
                <button
                  @click="fcmOpenSyncModal"
                  class="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/20 transition"
                  title="Initialize device records from preset"
                >
                  <i class="fa-solid fa-arrows-rotate"></i>
                  <span>Sync from Preset</span>
                </button>
              </div>
            </div>

            <!-- Devices Tabulator Table Container -->
            <div class="glass-card rounded-2xl border border-slate-800 p-4 shadow-xl">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-microchip text-emerald-400 text-sm"></i>
                  <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Device Final Config Records</span>
                </div>
                <span class="text-[11px] text-slate-500 font-mono">Showing {{ fcmFilteredDevices.length }} of {{ fcmDevicesKpis.total }} devices</span>
              </div>
              <div id="fcm-devices-table" class="tabulator-custom"></div>
            </div>
          </div>
        </div>
`;
exports.FINAL_CONFIG_MANAGER_MODALS = `
    <!-- MODAL 1: PRESET REGISTERS INSPECTION MODAL -->
    <div
      v-if="fcmShowPresetRegsModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="fcmClosePresetRegsModal"
    >
      <div class="glass-card rounded-2xl border border-sky-500/30 bg-slate-900 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg">
              <i class="fa-solid fa-sliders"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>Preset Registers Inspection</span>
                <span class="text-xs font-mono font-normal text-sky-400">({{ fcmSelectedPresetRegs.length }} registers &ge; 303)</span>
              </h3>
              <p class="text-xs text-slate-400 font-mono mt-0.5">
                SO: <span class="text-sky-300 font-bold">{{ fcmSelectedPreset?.so }}</span> | 
                Item: <span class="text-amber-300 font-bold">{{ fcmSelectedPreset?.item_code }}</span> | 
                SKU: <span class="text-white">{{ fcmSelectedPreset?.sku }}</span>
              </p>
            </div>
          </div>
          <button
            @click="fcmClosePresetRegsModal"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Body / Table -->
        <div class="p-5 flex-1 overflow-y-auto space-y-4">
          <div class="overflow-x-auto rounded-xl border border-slate-800">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                  <th class="p-2.5 text-right w-20">Address</th>
                  <th class="p-2.5 w-24">Hex</th>
                  <th class="p-2.5 text-center w-16">Slave</th>
                  <th class="p-2.5 text-center w-16"># Reg</th>
                  <th class="p-2.5 min-w-[180px]">Parameter Name</th>
                  <th class="p-2.5 w-20">Format</th>
                  <th class="p-2.5 font-bold text-emerald-400 min-w-[140px]">Value to Write</th>
                  <th class="p-2.5 w-24">Endianness</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                <tr v-if="fcmSelectedPresetRegs.length === 0">
                  <td colspan="8" class="p-6 text-center text-slate-500">
                    No registers found for this preset.
                  </td>
                </tr>
                <tr
                  v-for="reg in fcmSelectedPresetRegs"
                  :key="reg.id || reg.address"
                  class="hover:bg-slate-800/40 transition"
                >
                  <td class="p-2.5 text-right font-bold text-sky-400">{{ reg.address }}</td>
                  <td class="p-2.5 text-slate-300">{{ reg.modbus_reg_hex }}</td>
                  <td class="p-2.5 text-center text-slate-400">{{ reg.slave }}</td>
                  <td class="p-2.5 text-center text-slate-400">{{ reg.reg_num }}</td>
                  <td class="p-2.5 font-sans text-slate-200">{{ reg.parameter_name }}</td>
                  <td class="p-2.5"><span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">{{ reg.format }}</span></td>
                  <td class="p-2.5 font-bold text-emerald-300 bg-emerald-500/5">{{ reg.value_to_write !== '' ? reg.value_to_write : '—' }}</td>
                  <td class="p-2.5 text-slate-400 text-[10px]">{{ reg.endianness }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            @click="fcmClosePresetRegsModal"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: SYNC FROM PRESET MODAL -->
    <div
      v-if="fcmShowSyncModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="fcmCloseSyncModal"
    >
      <div class="glass-card rounded-2xl border border-sky-500/30 bg-slate-900 w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg">
              <i class="fa-solid fa-arrows-rotate"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Sync Devices from Preset</h3>
              <p class="text-xs text-slate-400 mt-0.5">Batch create device Final Config records initialized with status NONE.</p>
            </div>
          </div>
          <button
            @click="fcmCloseSyncModal"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-5 space-y-4">
          <!-- Select SO -->
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Sales Order (SO) <span class="text-red-400">*</span>
            </label>
            <select
              v-model="fcmSyncForm.so"
              @change="fcmOnSyncSoChange"
              class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs text-white focus:outline-none transition"
            >
              <option value="">-- Select Sales Order --</option>
              <option v-for="so in fcmUniquePresetsSos" :key="so" :value="so">{{ so }}</option>
            </select>
          </div>

          <!-- Select Item Code -->
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Item Code <span class="text-red-400">*</span>
            </label>
            <select
              v-model="fcmSyncForm.item_code"
              class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs text-white focus:outline-none transition"
            >
              <option value="">-- Select Item Code --</option>
              <option v-for="code in fcmSyncAvailableItemCodes" :key="code" :value="code">{{ code }}</option>
            </select>
          </div>

          <!-- Serial Numbers Input -->
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Serial Numbers (SN) <span class="text-red-400">*</span>
            </label>
            <textarea
              v-model="fcmSyncForm.serial_numbers_text"
              rows="5"
              placeholder="Enter Serial Numbers (one per line or separated by comma)&#10;e.g.&#10;SN2026001&#10;SN2026002&#10;SN2026003"
              class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition"
            ></textarea>
            <p class="text-[11px] text-slate-500 mt-1">
              Parsed count: <span class="text-sky-400 font-mono font-bold">{{ fcmParsedSyncSnsCount }}</span> SN(s)
            </p>
          </div>

          <!-- Operator Input -->
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Operator
            </label>
            <input
              v-model="fcmSyncForm.operator"
              type="text"
              placeholder="e.g. admin"
              class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs text-white placeholder-slate-500 focus:outline-none transition"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            @click="fcmCloseSyncModal"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            @click="fcmSubmitSyncFromPreset"
            :disabled="!fcmCanSubmitSync || fcmSubmittingSync"
            class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow transition"
          >
            <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': fcmSubmittingSync }"></i>
            <span>{{ fcmSubmittingSync ? 'Syncing...' : 'Sync Devices' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: DEVICE REGISTER RESULTS INSPECTION MODAL -->
    <div
      v-if="fcmShowDeviceInspectModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="fcmCloseDeviceInspectModal"
    >
      <div class="glass-card rounded-2xl border border-emerald-500/30 bg-slate-900 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
              <i class="fa-solid fa-sliders"></i>
            </div>
            <div>
              <div class="flex items-center gap-2.5">
                <h3 class="text-sm font-bold text-white">Device Final Config Results</h3>
                <span
                  :class="{
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30': fcmSelectedDevice?.status === 'PASS',
                    'bg-rose-500/20 text-rose-300 border-rose-500/30': fcmSelectedDevice?.status === 'FAIL',
                    'bg-slate-800 text-slate-400 border-slate-700': fcmSelectedDevice?.status === 'NONE',
                  }"
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
                >
                  {{ fcmSelectedDevice?.status }}
                </span>
              </div>
              <p class="text-xs text-slate-400 font-mono mt-0.5">
                SN: <span class="text-amber-300 font-bold">{{ fcmSelectedDevice?.serial_number }}</span> | 
                Item: <span class="text-sky-300">{{ fcmSelectedDevice?.item_code }}</span> | 
                SO: <span class="text-slate-300">{{ fcmSelectedDevice?.so || '—' }}</span> | 
                Operator: <span class="text-slate-300">{{ fcmSelectedDevice?.operator || 'admin' }}</span>
              </p>
            </div>
          </div>
          <button
            @click="fcmCloseDeviceInspectModal"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Body / Content -->
        <div class="p-5 flex-1 overflow-y-auto space-y-4">
          <!-- Quick Status Actions Strip -->
          <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-400 uppercase">Change Device Verdict:</span>
              <button
                @click="fcmUpdateSelectedDeviceStatus('PASS')"
                class="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <i class="fa-solid fa-circle-check"></i> Set PASS
              </button>
              <button
                @click="fcmUpdateSelectedDeviceStatus('FAIL')"
                class="px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <i class="fa-solid fa-circle-xmark"></i> Set FAIL
              </button>
              <button
                @click="fcmUpdateSelectedDeviceStatus('NONE')"
                class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <i class="fa-solid fa-circle-minus"></i> Set NONE
              </button>
            </div>

            <div class="text-xs font-mono text-slate-400">
              Tested At: <span class="text-slate-200">{{ fcmFormatDate(fcmSelectedDevice?.tested_at) }}</span>
            </div>
          </div>

          <!-- Notes Card -->
          <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Device Test Notes</label>
              <button
                @click="fcmSaveDeviceNotes"
                class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition flex items-center gap-1"
              >
                <i class="fa-solid fa-floppy-disk"></i> Save Notes
              </button>
            </div>
            <textarea
              v-model="fcmDeviceNotesInput"
              rows="2"
              placeholder="Add test bench observations, failure causes or serial notes..."
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none transition"
            ></textarea>
          </div>

          <!-- Register Evaluation Results Table -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-table-cells text-emerald-400"></i>
                <span>Register Evaluation Results ({{ fcmSelectedDeviceRegs.length }} registers)</span>
              </div>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-800">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                    <th class="p-2.5 text-right w-20">Address</th>
                    <th class="p-2.5 w-24">Hex</th>
                    <th class="p-2.5 min-w-[180px]">Parameter Name</th>
                    <th class="p-2.5 w-20">Format</th>
                    <th class="p-2.5 min-w-[130px] font-bold text-sky-300">Target Value</th>
                    <th class="p-2.5 min-w-[130px] font-bold text-amber-300">Read Back Value</th>
                    <th class="p-2.5 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-mono">
                  <tr v-if="fcmSelectedDeviceRegs.length === 0">
                    <td colspan="7" class="p-6 text-center text-slate-500">
                      No register results recorded for this device.
                    </td>
                  </tr>
                  <tr
                    v-for="reg in fcmSelectedDeviceRegs"
                    :key="reg.id || reg.address"
                    class="hover:bg-slate-800/40 transition"
                  >
                    <td class="p-2.5 text-right font-bold text-sky-400">{{ reg.address }}</td>
                    <td class="p-2.5 text-slate-300">{{ reg.modbus_reg_hex }}</td>
                    <td class="p-2.5 font-sans text-slate-200">{{ reg.parameter_name }}</td>
                    <td class="p-2.5"><span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">{{ reg.format }}</span></td>
                    <td class="p-2.5 text-sky-200 font-bold bg-sky-500/5">{{ reg.value_to_write !== '' ? reg.value_to_write : '—' }}</td>
                    <td class="p-2.5 text-amber-200 font-bold bg-amber-500/5">{{ reg.value_read_back !== '' ? reg.value_read_back : '—' }}</td>
                    <td class="p-2.5 text-center">
                      <span
                        v-if="reg.status === 'PASS'"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1"
                      >
                        <i class="fa-solid fa-circle-check"></i> PASS
                      </span>
                      <span
                        v-else-if="reg.status === 'FAIL'"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1"
                      >
                        <i class="fa-solid fa-circle-xmark"></i> FAIL
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-1"
                      >
                        <i class="fa-solid fa-circle-minus"></i> NONE
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            @click="fcmCloseDeviceInspectModal"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 4: DELETE PRESET CONFIRMATION MODAL -->
    <div
      v-if="fcmShowDeletePresetModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="fcmCloseDeletePresetModal"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5 font-bold text-white text-sm">
            <div class="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <i class="fa-solid fa-triangle-exclamation text-xs"></i>
            </div>
            <span>Delete Final Config Preset</span>
          </div>
          <button type="button" @click="fcmCloseDeletePresetModal" class="text-slate-400 hover:text-white cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="text-xs text-slate-300 space-y-2">
          <p>Are you sure you want to permanently delete this preset?</p>
          <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div>
              <span class="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Preset Name:</span>
              <span class="text-rose-300 font-bold block text-sm">{{ fcmPresetToDelete?.name }}</span>
            </div>
            <div class="text-[11px] text-slate-400 font-mono flex flex-wrap gap-x-3 gap-y-1 mt-1">
              <span>SO: <strong class="text-sky-300">{{ fcmPresetToDelete?.so }}</strong></span>
              <span>Item: <strong class="text-amber-300">{{ fcmPresetToDelete?.item_code }}</strong></span>
              <span>SKU: <strong class="text-white">{{ fcmPresetToDelete?.sku }}</strong></span>
              <span>Regs: <strong class="text-emerald-400">{{ fcmPresetToDelete?.total_regs }}</strong></span>
            </div>
          </div>
          <p class="text-[11px] text-rose-400/90 font-medium">
            <i class="fa-solid fa-circle-exclamation mr-1"></i> This action cannot be reversed. Linked register configurations will be deleted.
          </p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            @click="fcmCloseDeletePresetModal"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="fcmConfirmDeletePreset"
            :disabled="fcmDeletingPreset"
            class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer transition active:scale-95"
          >
            <i class="fa-solid fa-trash-can text-xs" :class="{ 'fa-bounce': fcmDeletingPreset }"></i>
            <span>{{ fcmDeletingPreset ? 'Deleting...' : 'Delete Preset' }}</span>
          </button>
        </div>
      </div>
    </div>
`;
exports.FINAL_CONFIG_MANAGER_SCRIPT = `
    function useFinalConfigManagerModule(ctx) {
      const { ref, computed, watch, onMounted, onUnmounted, nextTick } = Vue;
      const { showToast, authHeaders, currentUser, activeTab } = ctx || {};

      // Loading state
      const fcmLoading = ref(false);

      // Active sub-tab ('presets' | 'devices')
      const fcmActiveSubTab = ref('presets');

      // Zero-mock initial datasets
      const fcmPresetsList = ref([]);
      const fcmDevicesList = ref([]);
      const fcmDevicesKpis = ref({ total: 0, pass: 0, fail: 0, none: 0 });

      // Tabulator instances
      let fcmPresetsTabulator = null;
      let fcmDevicesTabulator = null;

      // Tab 1: Presets Filters & State
      const fcmPresetsSearch = ref('');
      const fcmPresetsSoFilter = ref('');
      const fcmPresetsItemCodeFilter = ref('');

      // Tab 2: Devices Filters & State
      const fcmDevicesSearch = ref('');
      const fcmStatusFilter = ref('ALL');

      // Modals State
      const fcmShowPresetRegsModal = ref(false);
      const fcmSelectedPreset = ref(null);
      const fcmSelectedPresetRegs = ref([]);

      const fcmShowDeviceInspectModal = ref(false);
      const fcmSelectedDevice = ref(null);
      const fcmSelectedDeviceRegs = ref([]);
      const fcmDeviceNotesInput = ref('');

      const fcmShowSyncModal = ref(false);
      const fcmSubmittingSync = ref(false);
      const fcmSyncForm = ref({
        so: '',
        item_code: '',
        serial_numbers_text: '',
        operator: 'admin',
      });

      // Delete Preset Modal State
      const fcmShowDeletePresetModal = ref(false);
      const fcmPresetToDelete = ref(null);
      const fcmDeletingPreset = ref(false);

      // Headers builder
      function getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('dvt_token');
          if (token) headers['Authorization'] = 'Bearer ' + token;
          if (authHeaders && authHeaders.value && authHeaders.value['Authorization']) {
            headers['Authorization'] = authHeaders.value['Authorization'];
          }
        } catch(e) {}
        return headers;
      }

      // Date formatter
      function fcmFormatDate(dateVal) {
        if (!dateVal) return '—';
        try {
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return '—';
          return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0') + ' ' +
            String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0');
        } catch(e) {
          return '—';
        }
      }

      // =======================================================================
      // DATA FETCHING (REST APIs)
      // =======================================================================

      async function fetchFcmPresets() {
        try {
          fcmLoading.value = true;
          const headers = getAuthHeaders();
          const res = await fetch('/api/c-modules/final-config-manager/presets', { headers });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const body = await res.json();
          if (body && Array.isArray(body.data)) {
            fcmPresetsList.value = body.data;
          } else {
            fcmPresetsList.value = [];
          }
        } catch(e) {
          fcmPresetsList.value = [];
          if (showToast) showToast('Failed to load presets: ' + e.message, 'error');
        } finally {
          fcmLoading.value = false;
          renderPresetsTabulator();
        }
      }

      async function fetchFcmDevices() {
        try {
          fcmLoading.value = true;
          const headers = getAuthHeaders();
          let url = '/api/c-modules/final-config-manager/devices';
          if (fcmStatusFilter.value && fcmStatusFilter.value !== 'ALL') {
            url += '?status=' + encodeURIComponent(fcmStatusFilter.value);
          }
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const body = await res.json();
          if (body && Array.isArray(body.data)) {
            fcmDevicesList.value = body.data;
          } else {
            fcmDevicesList.value = [];
          }
          if (body && body.kpis) {
            fcmDevicesKpis.value = body.kpis;
          } else {
            fcmDevicesKpis.value = {
              total: fcmDevicesList.value.length,
              pass: fcmDevicesList.value.filter(d => d.status === 'PASS').length,
              fail: fcmDevicesList.value.filter(d => d.status === 'FAIL').length,
              none: fcmDevicesList.value.filter(d => d.status === 'NONE').length,
            };
          }
        } catch(e) {
          fcmDevicesList.value = [];
          if (showToast) showToast('Failed to load devices: ' + e.message, 'error');
        } finally {
          fcmLoading.value = false;
          renderDevicesTabulator();
        }
      }

      function fcmRefreshCurrentTab() {
        if (fcmActiveSubTab.value === 'presets') {
          fetchFcmPresets();
        } else {
          fetchFcmDevices();
        }
      }

      function fcmSwitchSubTab(tab) {
        fcmActiveSubTab.value = tab;
        nextTick(() => {
          if (tab === 'presets') {
            if (fcmPresetsList.value.length === 0) fetchFcmPresets();
            else renderPresetsTabulator();
          } else {
            if (fcmDevicesList.value.length === 0) fetchFcmDevices();
            else renderDevicesTabulator();
          }
        });
      }

      // =======================================================================
      // COMPUTED PROPERTIES
      // =======================================================================

      const fcmPresetsTotalCount = computed(() => fcmPresetsList.value.length);
      const fcmPresetsTotalRegsCount = computed(() => {
        return fcmPresetsList.value.reduce((acc, p) => acc + (Number(p.total_regs) || 0), 0);
      });

      const fcmUniquePresetsSos = computed(() => {
        const set = new Set();
        fcmPresetsList.value.forEach(p => { if (p.so) set.add(p.so); });
        return Array.from(set).sort();
      });

      const fcmUniquePresetsItemCodes = computed(() => {
        const set = new Set();
        fcmPresetsList.value.forEach(p => { if (p.item_code) set.add(p.item_code); });
        return Array.from(set).sort();
      });

      const fcmFilteredPresets = computed(() => {
        let list = [...fcmPresetsList.value];
        if (fcmPresetsSoFilter.value) {
          list = list.filter(p => p.so === fcmPresetsSoFilter.value);
        }
        if (fcmPresetsItemCodeFilter.value) {
          list = list.filter(p => p.item_code === fcmPresetsItemCodeFilter.value);
        }
        if (fcmPresetsSearch.value) {
          const q = fcmPresetsSearch.value.trim().toLowerCase();
          list = list.filter(p =>
            (p.so || '').toLowerCase().includes(q) ||
            (p.item_code || '').toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q) ||
            (p.name || '').toLowerCase().includes(q)
          );
        }
        return list;
      });

      const fcmFilteredDevices = computed(() => {
        let list = [...fcmDevicesList.value];
        if (fcmStatusFilter.value && fcmStatusFilter.value !== 'ALL') {
          list = list.filter(d => d.status === fcmStatusFilter.value);
        }
        if (fcmDevicesSearch.value) {
          const q = fcmDevicesSearch.value.trim().toLowerCase();
          list = list.filter(d =>
            (d.serial_number || '').toLowerCase().includes(q) ||
            (d.item_code || '').toLowerCase().includes(q) ||
            (d.so || '').toLowerCase().includes(q) ||
            (d.sku || '').toLowerCase().includes(q) ||
            (d.dev_eui || '').toLowerCase().includes(q)
          );
        }
        return list;
      });

      const fcmSyncAvailableItemCodes = computed(() => {
        if (!fcmSyncForm.value.so) return fcmUniquePresetsItemCodes.value;
        const set = new Set();
        fcmPresetsList.value
          .filter(p => p.so === fcmSyncForm.value.so)
          .forEach(p => { if (p.item_code) set.add(p.item_code); });
        return Array.from(set).sort();
      });

      const fcmParsedSyncSnsCount = computed(() => {
        const text = fcmSyncForm.value.serial_numbers_text || '';
        const tokens = text.split(/[\\r\\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
        return tokens.length;
      });

      const fcmCanSubmitSync = computed(() => {
        return !!fcmSyncForm.value.so && !!fcmSyncForm.value.item_code && fcmParsedSyncSnsCount.value > 0;
      });

      // Filter Handlers
      function fcmOnPresetsSearchInput() {
        if (fcmPresetsTabulator) {
          fcmPresetsTabulator.setData(fcmFilteredPresets.value);
        }
      }

      function fcmClearPresetsSearch() {
        fcmPresetsSearch.value = '';
        if (fcmPresetsTabulator) {
          fcmPresetsTabulator.setData(fcmFilteredPresets.value);
        }
      }

      function fcmApplyPresetsFilters() {
        if (fcmPresetsTabulator) {
          fcmPresetsTabulator.setData(fcmFilteredPresets.value);
        }
      }

      function fcmOnDevicesSearchInput() {
        if (fcmDevicesTabulator) {
          fcmDevicesTabulator.setData(fcmFilteredDevices.value);
        }
      }

      function fcmClearDevicesSearch() {
        fcmDevicesSearch.value = '';
        if (fcmDevicesTabulator) {
          fcmDevicesTabulator.setData(fcmFilteredDevices.value);
        }
      }

      function fcmSetStatusFilter(status) {
        fcmStatusFilter.value = status;
        fetchFcmDevices();
      }

      // =======================================================================
      // TABULATOR RENDERING
      // =======================================================================

      function renderPresetsTabulator() {
        if (typeof Tabulator === 'undefined') return;
        const container = document.getElementById('fcm-presets-table');
        if (!container) return;

        if (fcmPresetsTabulator) {
          try { fcmPresetsTabulator.destroy(); } catch(e) {}
          fcmPresetsTabulator = null;
        }
        container.innerHTML = '';

        try {
          fcmPresetsTabulator = new Tabulator(container, {
            data: fcmFilteredPresets.value,
            layout: 'fitDataFill',
            height: '560px',
            pagination: true,
            paginationSize: 20,
            placeholder: '<div class="text-slate-500 py-8 text-center"><i class="fa-solid fa-inbox text-2xl mb-2"></i><br>No presets found</div>',
            rowContextMenu: [
              {
                label: "<i class='fa-solid fa-eye text-sky-400 mr-2'></i> View Registers",
                action: function(e, row) {
                  const rowData = row.getData();
                  fcmOpenPresetRegsModal(rowData);
                }
              },
              {
                label: "<i class='fa-regular fa-trash-can text-rose-400 mr-2'></i> Delete Preset",
                action: function(e, row) {
                  const rowData = row.getData();
                  fcmOpenDeletePresetModal(rowData);
                }
              }
            ],
            columns: [
              {
                title: 'Sales Order',
                field: 'so',
                width: 180,
                formatter: function(cell) {
                  const val = cell.getValue() || '—';
                  return '<span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-500/10 text-sky-400 border border-sky-500/30">' + val + '</span>';
                }
              },
              {
                title: 'Item Code',
                field: 'item_code',
                width: 200,
                formatter: function(cell) {
                  const val = cell.getValue() || '—';
                  return '<span class="px-2 py-0.5 rounded font-mono text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20">' + val + '</span>';
                }
              },
              {
                title: 'Hardware SKU',
                field: 'sku',
                width: 150,
                formatter: function(cell) {
                  return '<span class="font-bold text-white">' + (cell.getValue() || '—') + '</span>';
                }
              },
              {
                title: 'Firmware',
                field: 'firmware_version',
                width: 110,
                formatter: function(cell) {
                  const val = cell.getValue() || '—';
                  return '<span class="px-2 py-0.5 rounded font-mono text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">' + val + '</span>';
                }
              },
              {
                title: 'Preset Name',
                field: 'name',
                minWidth: 220,
                formatter: function(cell) {
                  const val = cell.getValue() || '—';
                  return '<span class="text-slate-200" title="' + val + '">' + val + '</span>';
                }
              },
              {
                title: 'Total Regs',
                field: 'total_regs',
                width: 110,
                hozAlign: 'right',
                headerHozAlign: 'right',
                formatter: function(cell) {
                  return '<span class="font-mono font-bold text-slate-100">' + (cell.getValue() || 0) + '</span>';
                }
              },
              {
                title: 'Author',
                field: 'created_by',
                width: 120,
                formatter: function(cell) {
                  return '<span class="text-slate-400">' + (cell.getValue() || 'admin') + '</span>';
                }
              },
              {
                title: 'Created Date',
                field: 'created_at',
                width: 160,
                formatter: function(cell) {
                  return '<span class="text-slate-400 font-mono text-[11px]">' + fcmFormatDate(cell.getValue()) + '</span>';
                }
              },
              {
                title: 'Actions',
                width: 130,
                hozAlign: 'center',
                headerHozAlign: 'center',
                headerSort: false,
                formatter: function() {
                  return '<button class="fcm-btn-view-regs px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"><i class="fa-solid fa-eye"></i> View Regs</button>';
                },
                cellClick: function(e, cell) {
                  const rowData = cell.getRow().getData();
                  fcmOpenPresetRegsModal(rowData);
                }
              }
            ]
          });
        } catch(e) {
          console.error('[FCM Presets Tabulator Error]', e);
        }
      }

      function renderDevicesTabulator() {
        if (typeof Tabulator === 'undefined') return;
        const container = document.getElementById('fcm-devices-table');
        if (!container) return;

        if (fcmDevicesTabulator) {
          try { fcmDevicesTabulator.destroy(); } catch(e) {}
          fcmDevicesTabulator = null;
        }
        container.innerHTML = '';

        try {
          fcmDevicesTabulator = new Tabulator(container, {
            data: fcmFilteredDevices.value,
            layout: 'fitDataFill',
            height: '560px',
            pagination: true,
            paginationSize: 25,
            placeholder: '<div class="text-slate-500 py-8 text-center"><i class="fa-solid fa-inbox text-2xl mb-2"></i><br>No device records found</div>',
            columns: [
              {
                title: 'Serial Number',
                field: 'serial_number',
                width: 220,
                formatter: function(cell) {
                  const val = cell.getValue() || '—';
                  return '<span class="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1.5">' +
                    val +
                    '<i class="fcm-copy-sn fa-regular fa-copy text-slate-400 hover:text-white cursor-pointer ml-1" title="Copy SN"></i>' +
                    '</span>';
                },
                cellClick: function(e, cell) {
                  if (e.target && e.target.classList.contains('fcm-copy-sn')) {
                    e.stopPropagation();
                    const sn = cell.getValue();
                    if (sn && navigator.clipboard) {
                      navigator.clipboard.writeText(sn).then(() => {
                        if (showToast) showToast('Copied SN ' + sn + ' to clipboard', 'success');
                      });
                    }
                  }
                }
              },
              {
                title: 'Item Code',
                field: 'item_code',
                width: 190,
                formatter: function(cell) {
                  return '<span class="font-mono text-sky-300 font-semibold">' + (cell.getValue() || '—') + '</span>';
                }
              },
              {
                title: 'Sales Order',
                field: 'so',
                width: 170,
                formatter: function(cell) {
                  const val = cell.getValue();
                  return val ? '<span class="font-mono text-slate-300">' + val + '</span>' : '<span class="text-slate-500">—</span>';
                }
              },
              {
                title: 'Config Status',
                field: 'status',
                width: 130,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: function(cell) {
                  const s = (cell.getValue() || 'NONE').toUpperCase();
                  if (s === 'PASS') {
                    return '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> PASS</span>';
                  } else if (s === 'FAIL') {
                    return '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-xmark"></i> FAIL</span>';
                  } else {
                    return '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-minus"></i> NONE</span>';
                  }
                }
              },
              {
                title: 'Registers',
                field: 'configured_regs_count',
                width: 120,
                hozAlign: 'right',
                headerHozAlign: 'right',
                formatter: function(cell) {
                  const row = cell.getRow().getData();
                  const configured = row.configured_regs_count || 0;
                  const total = row.total_regs_count || 0;
                  return '<span class="font-mono font-bold text-slate-200">' + configured + ' / ' + total + '</span>';
                }
              },
              {
                title: 'DevEUI',
                field: 'dev_eui',
                width: 180,
                formatter: function(cell) {
                  const val = cell.getValue();
                  return val ? '<span class="font-mono text-slate-300 text-xs">' + val + '</span>' : '<span class="text-slate-500">—</span>';
                }
              },
              {
                title: 'Tested At',
                field: 'tested_at',
                width: 160,
                formatter: function(cell) {
                  return '<span class="font-mono text-slate-400 text-[11px]">' + fcmFormatDate(cell.getValue()) + '</span>';
                }
              },
              {
                title: 'Operator',
                field: 'operator',
                width: 110,
                formatter: function(cell) {
                  return '<span class="text-slate-400 text-xs">' + (cell.getValue() || 'admin') + '</span>';
                }
              },
              {
                title: 'Notes',
                field: 'notes',
                minWidth: 160,
                formatter: function(cell) {
                  const val = cell.getValue();
                  return val ? '<span class="text-slate-400 truncate max-w-xs block" title="' + val + '">' + val + '</span>' : '<span class="text-slate-600">—</span>';
                }
              },
              {
                title: 'Actions',
                width: 130,
                hozAlign: 'center',
                headerHozAlign: 'center',
                headerSort: false,
                formatter: function() {
                  return '<button class="fcm-btn-inspect px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"><i class="fa-solid fa-sliders"></i> Inspect SN</button>';
                },
                cellClick: function(e, cell) {
                  const rowData = cell.getRow().getData();
                  fcmOpenDeviceInspectModal(rowData);
                }
              }
            ]
          });
        } catch(e) {
          console.error('[FCM Devices Tabulator Error]', e);
        }
      }

      // =======================================================================
      // MODALS HANDLERS
      // =======================================================================

      async function fcmOpenPresetRegsModal(preset) {
        fcmSelectedPreset.value = preset;
        fcmSelectedPresetRegs.value = [];
        fcmShowPresetRegsModal.value = true;

        try {
          const headers = getAuthHeaders();
          const res = await fetch('/api/c-modules/final-config-manager/presets/' + preset.id, { headers });
          if (res.ok) {
            const body = await res.json();
            if (body && body.data && Array.isArray(body.data.registers)) {
              fcmSelectedPresetRegs.value = body.data.registers;
            }
          }
        } catch(e) {
          console.error('[FCM Preset Regs Error]', e);
        }
      }

      function fcmClosePresetRegsModal() {
        fcmShowPresetRegsModal.value = false;
        fcmSelectedPreset.value = null;
        fcmSelectedPresetRegs.value = [];
      }

      function fcmOpenDeletePresetModal(preset) {
        if (!preset) return;
        fcmPresetToDelete.value = preset;
        fcmShowDeletePresetModal.value = true;
      }

      function fcmCloseDeletePresetModal() {
        fcmShowDeletePresetModal.value = false;
        fcmPresetToDelete.value = null;
        fcmDeletingPreset.value = false;
      }

      async function fcmConfirmDeletePreset() {
        if (!fcmPresetToDelete.value || !fcmPresetToDelete.value.id) return;
        const presetId = fcmPresetToDelete.value.id;
        try {
          fcmDeletingPreset.value = true;
          const headers = getAuthHeaders();
          const res = await fetch('/api/c-modules/final-config-manager/presets/' + encodeURIComponent(presetId), {
            method: 'DELETE',
            headers,
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || ('HTTP ' + res.status));
          }
          if (showToast) showToast('Preset deleted successfully', 'success');
          fcmCloseDeletePresetModal();
          // Refresh presets list
          await fetchFcmPresets();
        } catch(e) {
          if (showToast) showToast('Failed to delete preset: ' + e.message, 'error');
        } finally {
          fcmDeletingPreset.value = false;
        }
      }

      function fcmOpenSyncModal() {
        fcmSyncForm.value = {
          so: fcmUniquePresetsSos.value[0] || '',
          item_code: '',
          serial_numbers_text: '',
          operator: (currentUser && (currentUser.value?.username || currentUser.value?.fullName)) || 'admin',
        };
        if (fcmSyncAvailableItemCodes.value.length > 0) {
          fcmSyncForm.value.item_code = fcmSyncAvailableItemCodes.value[0];
        }
        fcmShowSyncModal.value = true;
      }

      function fcmOnSyncSoChange() {
        if (fcmSyncAvailableItemCodes.value.length > 0) {
          fcmSyncForm.value.item_code = fcmSyncAvailableItemCodes.value[0];
        } else {
          fcmSyncForm.value.item_code = '';
        }
      }

      function fcmCloseSyncModal() {
        fcmShowSyncModal.value = false;
        fcmSubmittingSync.value = false;
      }

      async function fcmSubmitSyncFromPreset() {
        if (!fcmCanSubmitSync.value) return;
        const text = fcmSyncForm.value.serial_numbers_text || '';
        const serialNumbers = text.split(/[\\r\\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);

        try {
          fcmSubmittingSync.value = true;
          const headers = getAuthHeaders();
          const payload = {
            so: fcmSyncForm.value.so,
            item_code: fcmSyncForm.value.item_code,
            serial_numbers: serialNumbers,
            operator: fcmSyncForm.value.operator || 'admin',
          };

          const res = await fetch('/api/c-modules/final-config-manager/devices/sync-from-preset', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });

          const body = await res.json();
          if (!res.ok || !body.success) {
            throw new Error(body.message || 'Sync failed');
          }

          if (showToast) {
            showToast(
              'Synced successfully: ' + body.createdCount + ' created, ' + body.updatedCount + ' updated',
              'success'
            );
          }
          fcmCloseSyncModal();
          fetchFcmDevices();
        } catch(e) {
          if (showToast) showToast('Sync failed: ' + e.message, 'error');
        } finally {
          fcmSubmittingSync.value = false;
        }
      }

      async function fcmOpenDeviceInspectModal(device) {
        fcmSelectedDevice.value = device;
        fcmSelectedDeviceRegs.value = [];
        fcmDeviceNotesInput.value = device.notes || '';
        fcmShowDeviceInspectModal.value = true;

        try {
          const headers = getAuthHeaders();
          const res = await fetch('/api/c-modules/final-config-manager/devices/' + encodeURIComponent(device.serial_number) + '?item_code=' + encodeURIComponent(device.item_code), { headers });
          if (res.ok) {
            const body = await res.json();
            if (body && body.data) {
              fcmSelectedDevice.value = body.data.device || device;
              fcmSelectedDeviceRegs.value = body.data.registers || [];
              fcmDeviceNotesInput.value = fcmSelectedDevice.value.notes || '';
            }
          }
        } catch(e) {
          console.error('[FCM Device Details Error]', e);
        }
      }

      function fcmCloseDeviceInspectModal() {
        fcmShowDeviceInspectModal.value = false;
        fcmSelectedDevice.value = null;
        fcmSelectedDeviceRegs.value = [];
        fcmDeviceNotesInput.value = '';
      }

      async function fcmUpdateSelectedDeviceStatus(status) {
        if (!fcmSelectedDevice.value) return;
        try {
          const headers = getAuthHeaders();
          const op = (currentUser && (currentUser.value?.username || currentUser.value?.fullName)) || 'admin';
          const payload = {
            status,
            notes: fcmDeviceNotesInput.value,
            operator: op,
          };

          const res = await fetch('/api/c-modules/final-config-manager/devices/' + fcmSelectedDevice.value.id + '/status', {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload),
          });

          const body = await res.json();
          if (!res.ok || !body.success) throw new Error(body.message || 'Status update failed');

          fcmSelectedDevice.value = body.data;
          if (showToast) showToast('Updated device status to ' + status, 'success');
          fetchFcmDevices();
        } catch(e) {
          if (showToast) showToast('Failed to update status: ' + e.message, 'error');
        }
      }

      async function fcmSaveDeviceNotes() {
        if (!fcmSelectedDevice.value) return;
        try {
          const headers = getAuthHeaders();
          const op = (currentUser && (currentUser.value?.username || currentUser.value?.fullName)) || 'admin';
          const payload = {
            status: fcmSelectedDevice.value.status,
            notes: fcmDeviceNotesInput.value,
            operator: op,
          };

          const res = await fetch('/api/c-modules/final-config-manager/devices/' + fcmSelectedDevice.value.id + '/status', {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload),
          });

          const body = await res.json();
          if (!res.ok || !body.success) throw new Error(body.message || 'Notes update failed');

          fcmSelectedDevice.value = body.data;
          if (showToast) showToast('Device notes saved successfully', 'success');
          fetchFcmDevices();
        } catch(e) {
          if (showToast) showToast('Failed to save notes: ' + e.message, 'error');
        }
      }

      // Lifecycle Tab Activation
      function onTabActivated() {
        if (fcmActiveSubTab.value === 'presets') {
          fetchFcmPresets();
        } else {
          fetchFcmDevices();
        }
      }

      watch(activeTab, (tab) => {
        if (tab === 'final-config-manager') {
          nextTick(() => {
            onTabActivated();
          });
        }
      });

      onMounted(() => {
        if (activeTab && activeTab.value === 'final-config-manager') {
          onTabActivated();
        }
      });

      return {
        fcmLoading,
        fcmActiveSubTab,
        fcmPresetsList,
        fcmDevicesList,
        fcmDevicesKpis,
        fcmPresetsSearch,
        fcmPresetsSoFilter,
        fcmPresetsItemCodeFilter,
        fcmDevicesSearch,
        fcmStatusFilter,
        fcmPresetsTotalCount,
        fcmPresetsTotalRegsCount,
        fcmUniquePresetsSos,
        fcmUniquePresetsItemCodes,
        fcmFilteredPresets,
        fcmFilteredDevices,
        fcmShowPresetRegsModal,
        fcmSelectedPreset,
        fcmSelectedPresetRegs,
        fcmShowDeletePresetModal,
        fcmPresetToDelete,
        fcmDeletingPreset,
        fcmShowDeviceInspectModal,
        fcmSelectedDevice,
        fcmSelectedDeviceRegs,
        fcmDeviceNotesInput,
        fcmShowSyncModal,
        fcmSubmittingSync,
        fcmSyncForm,
        fcmSyncAvailableItemCodes,
        fcmParsedSyncSnsCount,
        fcmCanSubmitSync,
        fcmFormatDate,
        fcmRefreshCurrentTab,
        fcmSwitchSubTab,
        fcmOnPresetsSearchInput,
        fcmClearPresetsSearch,
        fcmApplyPresetsFilters,
        fcmOnDevicesSearchInput,
        fcmClearDevicesSearch,
        fcmSetStatusFilter,
        fcmOpenPresetRegsModal,
        fcmClosePresetRegsModal,
        fcmOpenDeletePresetModal,
        fcmCloseDeletePresetModal,
        fcmConfirmDeletePreset,
        fcmOpenSyncModal,
        fcmOnSyncSoChange,
        fcmCloseSyncModal,
        fcmSubmitSyncFromPreset,
        fcmOpenDeviceInspectModal,
        fcmCloseDeviceInspectModal,
        fcmUpdateSelectedDeviceStatus,
        fcmSaveDeviceNotes,
        renderPresetsTabulator,
        renderDevicesTabulator,
        onTabActivated,
      };
    }

    if (typeof window !== 'undefined') {
      window.useFinalConfigManagerModule = useFinalConfigManagerModule;
    }
`;
//# sourceMappingURL=final-config-manager.module.js.map