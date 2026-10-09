"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMMAP_MANAGER_SCRIPT = exports.MEMMAP_MANAGER_MODALS = exports.MEMMAP_MANAGER_TEMPLATE = void 0;
exports.MEMMAP_MANAGER_TEMPLATE = `
        <!-- TAB: MEMORY MAP MANAGER -->
        <div v-show="activeTab === 'memmap-manager'" class="space-y-6">
          <!-- Header Banner -->
          <div class="glass-card rounded-2xl p-5 border border-sky-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl shadow-inner">
                <i class="fa-solid fa-map-location-dot"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-extrabold text-white">Memory Map Manager</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">C-MODULE</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">
                  Manage stored Modbus Memory Map payloads, inspect 16-column register definitions, and delete obsolete maps with row context menu.
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
              <button
                @click="switchTab('memmap-upload')"
                class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/20 transition"
              >
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload Memory Map
              </button>
              <button
                @click="fmmFetchData"
                :disabled="fmmLoading"
                class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition flex items-center gap-2 shadow"
                title="Refresh Memory Maps"
              >
                <i class="fa-solid fa-rotate" :class="{ 'fa-spin': fmmLoading }"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- KPI Metrics Ribbon (4 Cards) -->
          <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <!-- Total Memmaps -->
            <div class="glass-card rounded-xl p-3.5 border border-slate-800 bg-slate-900/70 shadow flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-base">
                <i class="fa-solid fa-layer-group"></i>
              </div>
              <div>
                <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Memmaps</p>
                <p class="text-lg font-black text-white font-mono leading-tight">{{ fmmKpis.totalMemmaps }}</p>
              </div>
            </div>

            <!-- Unique SKUs -->
            <div class="glass-card rounded-xl p-3.5 border border-slate-800 bg-slate-900/70 shadow flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-base">
                <i class="fa-solid fa-microchip"></i>
              </div>
              <div>
                <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unique SKUs</p>
                <p class="text-lg font-black text-cyan-400 font-mono leading-tight">{{ fmmKpis.uniqueSkus }}</p>
              </div>
            </div>

            <!-- Dec Valid Rate -->
            <div class="glass-card rounded-xl p-3.5 border border-slate-800 bg-slate-900/70 shadow flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-base">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Dec Valid Rate</p>
                <p class="text-lg font-black text-emerald-400 font-mono leading-tight">{{ fmmKpis.decValidRate }}</p>
              </div>
            </div>

            <!-- Hex Valid Rate -->
            <div class="glass-card rounded-xl p-3.5 border border-slate-800 bg-slate-900/70 shadow flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-base">
                <i class="fa-solid fa-certificate"></i>
              </div>
              <div>
                <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Hex Valid Rate</p>
                <p class="text-lg font-black text-blue-400 font-mono leading-tight">{{ fmmKpis.hexValidRate }}</p>
              </div>
            </div>
          </div>

          <!-- Master Table Card -->
          <div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
            <!-- Toolbar & Filter -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="relative flex-1 max-w-md">
                <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-2.5 text-slate-500 text-xs"></i>
                <input
                  v-model="fmmSearchQuery"
                  @input="fmmOnSearchInput"
                  type="text"
                  placeholder="Filter by SKU, LONG_FW, SHORT_FW, File Name..."
                  class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-sky-500 text-xs text-white placeholder-slate-500 focus:outline-none transition font-mono"
                />
              </div>

              <div class="flex items-center gap-3 text-xs">
                <span class="text-slate-400">
                  Total Maps: <strong class="text-white">{{ fmmPayloads.length }}</strong>
                </span>
                <span class="text-slate-600">•</span>
                <span class="text-slate-400">
                  Showing: <strong class="text-sky-400">{{ fmmFilteredCount }}</strong>
                </span>
                <span class="text-slate-600">•</span>
                <span class="text-[11px] text-slate-500 italic">
                  <i class="fa-regular fa-hand-pointer mr-1"></i>Right-click row for context menu
                </span>
              </div>
            </div>

            <!-- Tabulator Table Container -->
            <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
              <div id="fmm-payloads-table" class="tabulator-custom"></div>
            </div>
          </div>
        </div>
`;
exports.MEMMAP_MANAGER_MODALS = `
      <!-- MODAL 1: VIEW 16-COLUMN REGISTERS DETAIL -->
      <div
        v-if="fmmShowDetailModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <div class="glass-card rounded-2xl border border-sky-500/30 bg-slate-900 max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
          <!-- Modal Header -->
          <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <i class="fa-solid fa-list-ol"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-white">Modbus Register Definitions</h3>
                  <span v-if="fmmDetailTarget" class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono font-bold text-[10px] border border-sky-500/20">
                    {{ fmmDetailTarget.sku }}
                  </span>
                  <span v-if="fmmDetailTarget && fmmDetailTarget.long_fw" class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold text-[10px] border border-sky-500/30">
                    LONG: {{ fmmDetailTarget.long_fw }}
                  </span>
                  <span v-if="fmmDetailTarget" class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/20">
                    SHORT: {{ fmmDetailTarget.short_fw }}
                  </span>
                </div>
                <p v-if="fmmDetailTarget" class="text-[11px] text-slate-400 mt-0.5 font-mono">
                  File: {{ fmmDetailTarget.file_name || 'N/A' }} • Total: {{ fmmDetailRegisters.length }} registers
                </p>
              </div>
            </div>

            <button
              @click="fmmCloseDetailModal"
              class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
              title="Close"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Modal Body with Search & Child Tabulator -->
          <div class="p-4 flex-1 flex flex-col space-y-3 overflow-hidden">
            <!-- Filter Bar -->
            <div class="flex items-center justify-between gap-3">
              <div class="relative flex-1 max-w-sm">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
                <input
                  v-model="fmmDetailSearch"
                  @input="fmmOnDetailSearchInput"
                  type="text"
                  placeholder="Search registers (Dec, Hex, Description, Format)..."
                  class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 focus:border-sky-500 text-xs text-white placeholder-slate-500 focus:outline-none transition font-mono"
                />
              </div>

              <div class="flex items-center gap-2 text-xs">
                <span class="text-slate-400">Total: <strong class="text-white">{{ fmmDetailRegisters.length }}</strong></span>
                <span class="text-slate-600">•</span>
                <span class="text-slate-400">Filtered: <strong class="text-sky-400">{{ fmmDetailFilteredCount }}</strong></span>
              </div>
            </div>

            <!-- Loading Spinner or Table -->
            <div v-if="fmmDetailLoading" class="flex-1 flex flex-col items-center justify-center py-16 space-y-3">
              <i class="fa-solid fa-circle-notch fa-spin text-sky-400 text-2xl"></i>
              <span class="text-xs text-slate-400 font-mono">Loading register definitions...</span>
            </div>
            <div v-show="!fmmDetailLoading" class="flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
              <div id="fmm-detail-regs-table" class="tabulator-custom"></div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
            <span class="text-[11px] text-slate-500">
              16 Modbus columns inspected from memmap_regs
            </span>
            <button
              @click="fmmCloseDetailModal"
              class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 2: CONFIRM DELETE MEMORY MAP -->
      <div
        v-if="fmmShowDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <div class="glass-card rounded-2xl border border-rose-500/30 bg-slate-900 max-w-md w-full p-5 shadow-2xl space-y-4 animate-fadeIn">
          <!-- Icon & Header -->
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <i class="fa-solid fa-triangle-exclamation text-lg"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Delete Memory Map</h3>
              <p class="text-xs text-slate-400 mt-0.5">Are you sure you want to permanently delete this Memory Map?</p>
            </div>
          </div>

          <!-- Target Info Details -->
          <div v-if="fmmDeleteTarget" class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-400">Target SKU:</span>
              <span class="font-mono font-bold text-white">{{ fmmDeleteTarget.sku }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">LONG_FW:</span>
              <span class="font-mono text-sky-400 font-bold">{{ fmmDeleteTarget.long_fw || 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">SHORT_FW:</span>
              <span class="font-mono text-amber-400 font-bold">{{ fmmDeleteTarget.short_fw }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">File Name:</span>
              <span class="font-mono text-slate-300 truncate max-w-[200px]">{{ fmmDeleteTarget.file_name || 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Total Registers:</span>
              <span class="font-mono text-white">{{ fmmDeleteTarget.total_regs }}</span>
            </div>
          </div>

          <!-- Deletion Warning Notice -->
          <div class="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
            <i class="fa-solid fa-circle-exclamation mr-1"></i>
            This operation will permanently delete the memory map and all associated Modbus register rows. This action cannot be undone.
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              @click="fmmCloseDeleteModal"
              :disabled="fmmIsDeleting"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              @click="fmmExecuteDelete"
              :disabled="fmmIsDeleting"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20 transition"
            >
              <i v-if="fmmIsDeleting" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else class="fa-regular fa-trash-can"></i>
              <span>{{ fmmIsDeleting ? 'Deleting...' : 'Delete Memory Map' }}</span>
            </button>
          </div>
        </div>
      </div>
`;
exports.MEMMAP_MANAGER_SCRIPT = `
    function useMemmapManagerModule(ctx) {
      const { ref, computed, onMounted, nextTick } = Vue;
      const { showToast, authHeaders, activeTab, switchTab } = ctx;

      const fmmLoading = ref(false);
      const fmmPayloads = ref([]);
      const fmmSearchQuery = ref('');
      const fmmFilteredCount = ref(0);

      // Detail Modal state
      const fmmShowDetailModal = ref(false);
      const fmmDetailTarget = ref(null);
      const fmmDetailRegisters = ref([]);
      const fmmDetailLoading = ref(false);
      const fmmDetailSearch = ref('');
      const fmmDetailFilteredCount = ref(0);

      // Delete Modal state
      const fmmShowDeleteModal = ref(false);
      const fmmDeleteTarget = ref(null);
      const fmmIsDeleting = ref(false);

      let fmmMasterTabulator = null;
      let fmmDetailTabulator = null;

      // KPIs
      const fmmKpis = computed(() => {
        const list = fmmPayloads.value || [];
        const total = list.length;
        const uniqueSkus = new Set(list.map(p => (p.sku || '').toUpperCase())).size;
        const decValids = list.filter(p => !!p.dec_valid).length;
        const hexValids = list.filter(p => !!p.hex_valid).length;

        return {
          totalMemmaps: total,
          uniqueSkus: uniqueSkus,
          decValidRate: total > 0 ? Math.round((decValids / total) * 100) + '%' : '0%',
          hexValidRate: total > 0 ? Math.round((hexValids / total) * 100) + '%' : '0%',
        };
      });

      // Filter master data
      const getFilteredPayloads = () => {
        const query = (fmmSearchQuery.value || '').trim().toLowerCase();
        if (!query) return fmmPayloads.value;
        return fmmPayloads.value.filter(p => {
          const skuMatch = String(p.sku || '').toLowerCase().includes(query);
          const longFwMatch = String(p.long_fw || '').toLowerCase().includes(query);
          const shortFwMatch = String(p.short_fw || '').toLowerCase().includes(query);
          const fileMatch = String(p.file_name || '').toLowerCase().includes(query);
          const authorMatch = String(p.created_by || '').toLowerCase().includes(query);
          return skuMatch || longFwMatch || shortFwMatch || fileMatch || authorMatch;
        });
      };

      // Fetch all stored payloads
      const fmmFetchData = async () => {
        fmmLoading.value = true;
        try {
          const res = await fetch('/api/c-modules/memmap-manager', {
            headers: authHeaders ? authHeaders() : {},
          });
          if (!res.ok) {
            throw new Error('HTTP ' + res.status);
          }
          const json = await res.json();
          const items = (json && Array.isArray(json.data)) ? json.data : (Array.isArray(json) ? json : []);
          fmmPayloads.value = items;
          fmmFilteredCount.value = items.length;
          renderMasterTable();
        } catch (err) {
          console.error('[MemmapManager] Failed to fetch memory maps:', err);
          if (showToast) {
            showToast('Failed to load memory maps: ' + (err.message || err), 'error');
          }
        } finally {
          fmmLoading.value = false;
        }
      };

      // Render Tabulator master table with right-click context menu
      const renderMasterTable = () => {
        nextTick(() => {
          const container = document.getElementById('fmm-payloads-table');
          if (!container) return;

          const filtered = getFilteredPayloads();
          fmmFilteredCount.value = filtered.length;

          if (fmmMasterTabulator) {
            fmmMasterTabulator.setData(filtered);
            return;
          }

          if (typeof Tabulator === 'undefined') {
            console.warn('[MemmapManager] Tabulator library not loaded');
            return;
          }

          fmmMasterTabulator = new Tabulator('#fmm-payloads-table', {
            data: filtered,
            layout: 'fitDataFill',
            height: '560px',
            pagination: true,
            paginationSize: 20,
            rowContextMenu: [
              {
                label: "<i class='fa-solid fa-list-ol text-sky-400 mr-2'></i> View Registers",
                action: function(e, row) {
                  const rowData = row.getData();
                  fmmOpenDetailModal(rowData);
                }
              },
              {
                label: "<i class='fa-regular fa-trash-can text-rose-400 mr-2'></i> Delete Memory Map",
                action: function(e, row) {
                  const rowData = row.getData();
                  fmmOpenDeleteModal(rowData);
                }
              }
            ],
            columns: [
              {
                title: 'No.',
                formatter: 'rownum',
                width: 60,
                hozAlign: 'center',
                headerHozAlign: 'center',
              },
              {
                title: 'SKU',
                field: 'sku',
                width: 140,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: function(cell) {
                  const val = cell.getValue() || '';
                  return '<span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-500/10 text-sky-300 border border-sky-500/20">' + val + '</span>';
                },
              },
              {
                title: 'LONG_FW',
                field: 'long_fw',
                width: 130,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: function(cell) {
                  const val = cell.getValue() || '';
                  return '<span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30">' + val + '</span>';
                },
              },
              {
                title: 'SHORT_FW',
                field: 'short_fw',
                width: 100,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: function(cell) {
                  const val = cell.getValue();
                  return '<span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20">' + val + '</span>';
                },
              },
              {
                title: 'File Name',
                field: 'file_name',
                minWidth: 160,
                formatter: function(cell) {
                  const val = cell.getValue() || '—';
                  return '<span class="font-mono text-xs text-slate-300">' + val + '</span>';
                },
              },
              {
                title: 'Total Regs',
                field: 'total_regs',
                width: 110,
                hozAlign: 'right',
                headerHozAlign: 'right',
                formatter: function(cell) {
                  const val = cell.getValue() || 0;
                  return '<span class="font-mono font-bold text-xs text-white">' + val + '</span>';
                },
              },
              {
                title: 'Dec Check',
                field: 'dec_valid',
                width: 100,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: 'tickCross',
              },
              {
                title: 'Hex Check',
                field: 'hex_valid',
                width: 100,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: 'tickCross',
              },
              {
                title: 'Created By',
                field: 'created_by',
                width: 120,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: function(cell) {
                  const val = cell.getValue() || 'admin';
                  return '<span class="text-xs text-slate-400">' + val + '</span>';
                },
              },
              {
                title: 'Created At',
                field: 'created_at',
                width: 160,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: function(cell) {
                  const val = cell.getValue();
                  if (!val) return '—';
                  try {
                    const d = new Date(val);
                    return '<span class="font-mono text-[11px] text-slate-400">' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span>';
                  } catch {
                    return String(val);
                  }
                },
              },
              {
                title: 'Actions',
                width: 120,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: function(cell) {
                  return '<div class="flex items-center justify-center gap-2">' +
                    '<button class="fmm-action-view px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs transition cursor-pointer" title="View Registers"><i class="fa-solid fa-eye"></i></button>' +
                    '<button class="fmm-action-delete px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition cursor-pointer" title="Delete"><i class="fa-regular fa-trash-can"></i></button>' +
                    '</div>';
                },
                cellClick: function(e, cell) {
                  const target = e.target.closest('button');
                  if (!target) return;
                  const rowData = cell.getRow().getData();
                  if (target.classList.contains('fmm-action-view')) {
                    fmmOpenDetailModal(rowData);
                  } else if (target.classList.contains('fmm-action-delete')) {
                    fmmOpenDeleteModal(rowData);
                  }
                },
              },
            ],
          });
        });
      };

      const fmmOnSearchInput = () => {
        if (fmmMasterTabulator) {
          const filtered = getFilteredPayloads();
          fmmFilteredCount.value = filtered.length;
          fmmMasterTabulator.setData(filtered);
        }
      };

      // Open detail modal and fetch 16-field register rows
      const fmmOpenDetailModal = async (payload) => {
        if (!payload || !payload.id) return;
        fmmDetailTarget.value = payload;
        fmmShowDetailModal.value = true;
        fmmDetailLoading.value = true;
        fmmDetailRegisters.value = [];
        fmmDetailSearch.value = '';

        try {
          const res = await fetch('/api/c-modules/memmap-manager/' + encodeURIComponent(payload.id) + '/regs', {
            headers: authHeaders ? authHeaders() : {},
          });
          if (!res.ok) {
            throw new Error('HTTP ' + res.status);
          }
          const json = await res.json();
          const regs = (json && json.data && Array.isArray(json.data.registers)) ? json.data.registers : [];
          fmmDetailRegisters.value = regs;
          fmmDetailFilteredCount.value = regs.length;
          renderDetailTable();
        } catch (err) {
          console.error('[MemmapManager] Failed to load register details:', err);
          if (showToast) {
            showToast('Failed to load register details: ' + (err.message || err), 'error');
          }
        } finally {
          fmmDetailLoading.value = false;
        }
      };

      const fmmCloseDetailModal = () => {
        fmmShowDetailModal.value = false;
        fmmDetailTarget.value = null;
        fmmDetailRegisters.value = [];
        if (fmmDetailTabulator) {
          try { fmmDetailTabulator.destroy(); } catch {}
          fmmDetailTabulator = null;
        }
      };

      const getFilteredDetailRegisters = () => {
        const query = (fmmDetailSearch.value || '').trim().toLowerCase();
        if (!query) return fmmDetailRegisters.value;
        return fmmDetailRegisters.value.filter(r => {
          const descMatch = String(r.description || '').toLowerCase().includes(query);
          const decMatch = String(r.modbus_reg_dec || '').toLowerCase().includes(query);
          const hexMatch = String(r.modbus_reg_hex || '').toLowerCase().includes(query);
          const formatMatch = String(r.format || '').toLowerCase().includes(query);
          const commentMatch = String(r.comment || '').toLowerCase().includes(query);
          return descMatch || decMatch || hexMatch || formatMatch || commentMatch;
        });
      };

      const fmmOnDetailSearchInput = () => {
        if (fmmDetailTabulator) {
          const filtered = getFilteredDetailRegisters();
          fmmDetailFilteredCount.value = filtered.length;
          fmmDetailTabulator.setData(filtered);
        }
      };

      // Render 16-field Modbus register Tabulator
      const renderDetailTable = () => {
        nextTick(() => {
          const container = document.getElementById('fmm-detail-regs-table');
          if (!container) return;

          const filtered = getFilteredDetailRegisters();
          fmmDetailFilteredCount.value = filtered.length;

          if (fmmDetailTabulator) {
            fmmDetailTabulator.setData(filtered);
            return;
          }

          if (typeof Tabulator === 'undefined') return;

          fmmDetailTabulator = new Tabulator('#fmm-detail-regs-table', {
            data: filtered,
            layout: 'fitDataFill',
            height: '420px',
            pagination: true,
            paginationSize: 25,
            columns: [
              { title: 'No.', field: 'no', width: 60, hozAlign: 'center', headerHozAlign: 'center' },
              {
                title: 'Dec Reg',
                field: 'modbus_reg_dec',
                width: 90,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: function(cell) {
                  return '<span class="font-mono font-bold text-sky-400">' + cell.getValue() + '</span>';
                },
              },
              {
                title: 'Hex Reg',
                field: 'modbus_reg_hex',
                width: 90,
                hozAlign: 'center',
                headerHozAlign: 'center',
                formatter: function(cell) {
                  return '<span class="font-mono font-bold text-purple-400">0x' + String(cell.getValue()).toUpperCase() + '</span>';
                },
              },
              { title: 'Fn Read', field: 'fn_read', width: 80, hozAlign: 'center', headerHozAlign: 'center' },
              { title: 'Fn Write', field: 'fn_write', width: 85, hozAlign: 'center', headerHozAlign: 'center' },
              { title: '# Regs', field: 'num_regs', width: 75, hozAlign: 'center', headerHozAlign: 'center' },
              {
                title: 'Description',
                field: 'description',
                minWidth: 160,
                formatter: function(cell) {
                  return '<span class="font-mono text-white font-semibold">' + (cell.getValue() || '') + '</span>';
                },
              },
              { title: 'Range', field: 'range_val', width: 100 },
              {
                title: 'Default Val',
                field: 'end_user_default',
                width: 110,
                formatter: function(cell) {
                  return '<span class="font-mono text-amber-300">' + (cell.getValue() || '') + '</span>';
                },
              },
              { title: 'Format', field: 'format', width: 90, hozAlign: 'center', headerHozAlign: 'center' },
              { title: 'DL Type 5', field: 'downlink_type_5', width: 90, hozAlign: 'center', headerHozAlign: 'center' },
              { title: 'RD1', field: 'in_rd1_template', width: 65, hozAlign: 'center', headerHozAlign: 'center', formatter: 'tickCross' },
              { title: 'Eng', field: 'in_engineering_template', width: 65, hozAlign: 'center', headerHozAlign: 'center', formatter: 'tickCross' },
              { title: 'End-user', field: 'in_end_user_template', width: 75, hozAlign: 'center', headerHozAlign: 'center', formatter: 'tickCross' },
              { title: 'Full', field: 'in_full_template', width: 65, hozAlign: 'center', headerHozAlign: 'center', formatter: 'tickCross' },
              { title: 'Comment', field: 'comment', minWidth: 160 },
            ],
          });
        });
      };

      // Open Delete confirmation modal
      const fmmOpenDeleteModal = (payload) => {
        if (!payload || !payload.id) return;
        fmmDeleteTarget.value = payload;
        fmmShowDeleteModal.value = true;
      };

      const fmmCloseDeleteModal = () => {
        fmmShowDeleteModal.value = false;
        fmmDeleteTarget.value = null;
      };

      // Execute permanent delete request
      const fmmExecuteDelete = async () => {
        if (!fmmDeleteTarget.value || !fmmDeleteTarget.value.id) return;
        fmmIsDeleting.value = true;

        const targetId = fmmDeleteTarget.value.id;
        const targetSku = fmmDeleteTarget.value.sku;
        const targetLongFw = fmmDeleteTarget.value.long_fw || fmmDeleteTarget.value.short_fw;

        try {
          const res = await fetch('/api/c-modules/memmap-manager/' + encodeURIComponent(targetId), {
            method: 'DELETE',
            headers: authHeaders ? authHeaders() : {},
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || ('HTTP ' + res.status));
          }

          if (showToast) {
            showToast('Deleted memory map for SKU [' + targetSku + '] (' + targetLongFw + ') successfully', 'success');
          }

          fmmCloseDeleteModal();
          await fmmFetchData();
        } catch (err) {
          console.error('[MemmapManager] Delete failed:', err);
          if (showToast) {
            showToast('Failed to delete memory map: ' + (err.message || err), 'error');
          }
        } finally {
          fmmIsDeleting.value = false;
        }
      };

      return {
        fmmLoading,
        fmmPayloads,
        fmmSearchQuery,
        fmmFilteredCount,
        fmmKpis,
        fmmFetchData,
        fmmOnSearchInput,
        fmmShowDetailModal,
        fmmDetailTarget,
        fmmDetailRegisters,
        fmmDetailLoading,
        fmmDetailSearch,
        fmmDetailFilteredCount,
        fmmOpenDetailModal,
        fmmCloseDetailModal,
        fmmOnDetailSearchInput,
        fmmShowDeleteModal,
        fmmDeleteTarget,
        fmmIsDeleting,
        fmmOpenDeleteModal,
        fmmCloseDeleteModal,
        fmmExecuteDelete,
      };
    }

    if (typeof window !== 'undefined') {
      window.useMemmapManagerModule = useMemmapManagerModule;
    }
`;
//# sourceMappingURL=memmap-manager.module.js.map