"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITEM_CODES_SCRIPT = exports.ITEM_CODES_MODALS = exports.ITEM_CODES_TEMPLATE = void 0;
exports.ITEM_CODES_TEMPLATE = `
  <!-- MASTER ITEM CODE CATALOG -->
  <div class="space-y-5">

    <!-- Top Statistics & Action Header Card -->
    <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
      
      <!-- Title & Module Meta -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-inner">
            <i class="fa-solid fa-barcode text-lg"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-base font-bold text-white tracking-wide">Item Code Catalog</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-mono">
                Master Catalog
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Centralized registry of device SKUs, clean firmware versions, standard SKU_FW identifiers, and test templates.
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            @click="fetchItemCodes"
            :disabled="itemCodesLoading"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
            title="Refresh item codes catalog"
          >
            <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': itemCodesLoading }"></i>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            @click="openCreateItemCodeModal"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            title="Register a new Master Item Code"
          >
            <i class="fa-solid fa-plus-circle text-sm"></i>
            <span>+ Create Item Code</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
        <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm">
            <i class="fa-solid fa-tags"></i>
          </div>
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Total Item Codes</div>
            <div class="text-sm font-bold font-mono text-white">{{ itemCodesList.length }}</div>
          </div>
        </div>

        <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Active Items</div>
            <div class="text-sm font-bold font-mono text-emerald-400">
              {{ itemCodesList.filter(it => it.isActive).length }}
            </div>
          </div>
        </div>

        <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-sm">
            <i class="fa-solid fa-microchip"></i>
          </div>
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Unique SKUs</div>
            <div class="text-sm font-bold font-mono text-purple-300">
              {{ uniqueCatalogSkusCount }}
            </div>
          </div>
        </div>

        <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
            <i class="fa-solid fa-vial-circle-check"></i>
          </div>
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Mapped Templates</div>
            <div class="text-sm font-bold font-mono text-indigo-300">
              {{ itemCodesList.filter(it => it.defaultTemplateId || it.template).length }}
            </div>
          </div>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        <div class="flex items-center gap-2 flex-1 max-w-xl">
          <!-- Search Input -->
          <div class="relative flex-1">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none"></i>
            <input
              v-model="itemCodesSearchQuery"
              type="text"
              placeholder="Search by Item Code, SKU, SKU_FW, description..."
              class="w-full pl-8 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
            />
            <button
              v-if="itemCodesSearchQuery"
              @click="itemCodesSearchQuery = ''"
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Status Filter -->
          <select
            v-model="itemCodesStatusFilter"
            class="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        <!-- View Switcher -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl self-end md:self-auto">
          <button
            type="button"
            @click="setCatalogViewMode('reactive')"
            :class="itemCodesViewMode === 'reactive' ? 'bg-cyan-600/30 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Clean Card Table View"
          >
            <i class="fa-solid fa-table-list text-xs"></i>
            <span>Table View</span>
          </button>

          <button
            type="button"
            @click="setCatalogViewMode('tabulator')"
            :class="itemCodesViewMode === 'tabulator' ? 'bg-cyan-600/30 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Tabulator 6.x Data Grid"
          >
            <i class="fa-solid fa-table-cells text-xs"></i>
            <span>Data Grid</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN TABLE VIEW: REACTIVE TABLE -->
    <div v-if="itemCodesViewMode === 'reactive'" class="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
      <div class="overflow-x-auto custom-scroll">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px] tracking-wider">
            <tr>
              <th class="py-3.5 px-4">Item Code</th>
              <th class="py-3.5 px-4">SKU</th>
              <th class="py-3.5 px-4">Firmware</th>
              <th class="py-3.5 px-4">SKU_FW (Standard)</th>
              <th class="py-3.5 px-4">Linked Test Template</th>
              <th class="py-3.5 px-4">Description</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="filteredItemCodes.length === 0">
              <td colspan="8" class="py-12 text-center text-slate-400">
                <div class="max-w-md mx-auto space-y-3">
                  <div class="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                    <i class="fa-solid fa-barcode text-xl"></i>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-white">No Item Codes Found</p>
                    <p class="text-xs text-slate-400 mt-1">Get started by creating your first Master Item Code with clean firmware version.</p>
                  </div>
                  <div class="pt-2">
                    <button
                      type="button"
                      @click="openCreateItemCodeModal"
                      class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer transition active:scale-95"
                    >
                      <i class="fa-solid fa-plus text-xs"></i>
                      <span>+ Create First Item Code</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <tr
              v-for="item in filteredItemCodes"
              :key="item.id || item.itemCode"
              class="hover:bg-slate-800/40 transition group"
            >
              <!-- Item Code -->
              <td class="py-3 px-4 font-mono font-bold text-cyan-300">
                <div class="flex items-center gap-1.5">
                  <span>{{ item.itemCode }}</span>
                  <button
                    type="button"
                    @click="copyText(item.itemCode, 'Item Code')"
                    class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition text-[10px]"
                    title="Copy Item Code"
                  >
                    <i class="fa-solid fa-copy"></i>
                  </button>
                </div>
              </td>

              <!-- SKU -->
              <td class="py-3 px-4 font-mono font-semibold text-purple-300">
                {{ item.sku }}
              </td>

              <!-- Firmware Version (Strictly without 'v') -->
              <td class="py-3 px-4 font-mono text-indigo-300">
                <span class="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  {{ sanitizeFw(item.firmwareVersion) }}
                </span>
              </td>

              <!-- Standard SKU_FW -->
              <td class="py-3 px-4 font-mono">
                <span class="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm">
                  <span>{{ item.skuFw || formatSkuFw(item.sku, item.firmwareVersion) }}</span>
                  <button
                    type="button"
                    @click="copyText(item.skuFw || formatSkuFw(item.sku, item.firmwareVersion), 'SKU_FW')"
                    class="opacity-0 group-hover:opacity-100 text-amber-400/70 hover:text-amber-200 transition text-[10px]"
                    title="Copy SKU_FW"
                  >
                    <i class="fa-solid fa-copy"></i>
                  </button>
                </span>
              </td>

              <!-- Linked Test Template -->
              <td class="py-3 px-4">
                <div v-if="item.template || item.defaultTemplateId" class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="navigateToTestBuilder(item.defaultTemplateId || (item.template && item.template.id))"
                    class="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer transition group/btn"
                    title="Open in Test Automation Builder"
                  >
                    <i class="fa-solid fa-vial-circle-check text-[10px] text-indigo-400"></i>
                    <span class="truncate max-w-[200px]">{{ (item.template && item.template.name) || item.templateName || 'View Template' }}</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-[9px] opacity-60 group-hover/btn:opacity-100"></i>
                  </button>
                </div>
                <div v-else>
                  <span class="px-2 py-0.5 rounded text-[10px] text-slate-500 font-mono bg-slate-800/60 border border-slate-700/60">
                    No Template
                  </span>
                </div>
              </td>

              <!-- Description -->
              <td class="py-3 px-4 text-slate-300 max-w-xs truncate" :title="item.description || ''">
                {{ item.description || '—' }}
              </td>

              <!-- Status Badge -->
              <td class="py-3 px-4">
                <button
                  type="button"
                  @click="toggleItemActive(item)"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1 transition cursor-pointer"
                  :class="item.isActive ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'"
                  :title="item.isActive ? 'Click to deactivate' : 'Click to activate'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="item.isActive ? 'bg-emerald-400' : 'bg-slate-500'"></span>
                  <span>{{ item.isActive ? 'Active' : 'Inactive' }}</span>
                </button>
              </td>

              <!-- Actions -->
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="openEditItemCodeModal(item)"
                    class="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 transition cursor-pointer"
                    title="Edit Item Code"
                  >
                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                  </button>

                  <button
                    type="button"
                    @click="openDeleteItemCodeModal(item)"
                    class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition cursor-pointer"
                    title="Delete Item Code"
                  >
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MAIN TABLE VIEW: TABULATOR DATA GRID -->
    <div v-show="itemCodesViewMode === 'tabulator'" class="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl p-4">
      <div id="item-codes-tabulator-table" class="rounded-xl overflow-hidden border border-slate-800"></div>
    </div>

  </div>
`;
exports.ITEM_CODES_MODALS = `
  <!-- MODAL: CREATE ITEM CODE -->
  <div
    v-if="showCreateItemCodeModal"
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    @click.self="showCreateItemCodeModal = false"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-scale-in">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
            <i class="fa-solid fa-barcode text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Create Master Item Code</h3>
            <p class="text-[11px] text-slate-400">Add a new item code to the centralized product catalog.</p>
          </div>
        </div>
        <button
          type="button"
          @click="showCreateItemCodeModal = false"
          class="text-slate-400 hover:text-white text-xs p-1"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="submitCreateItemCode" class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Item Code -->
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Item Code *</label>
            <input
              v-model="createItemCodeForm.itemCode"
              required
              type="text"
              placeholder="e.g. ITEM-WSLRW-ATH-01"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500 outline-none uppercase"
            />
            <p class="text-[10px] text-slate-500 mt-1">Unique catalog identifier</p>
          </div>

          <!-- SKU -->
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Base Device SKU *</label>
            <input
              v-model="createItemCodeForm.sku"
              required
              type="text"
              placeholder="e.g. WSLRW-ATH"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500 outline-none uppercase"
            />
            <p class="text-[10px] text-slate-500 mt-1">Hardware product SKU</p>
          </div>

          <!-- Firmware Version (strictly no 'v') -->
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Firmware Version *</label>
            <input
              v-model="createItemCodeForm.firmwareVersion"
              @input="createItemCodeForm.firmwareVersion = sanitizeFw(createItemCodeForm.firmwareVersion)"
              required
              type="text"
              placeholder="e.g. 6 or 1.4"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500 outline-none"
            />
            <p class="text-[10px] text-slate-500 mt-1">Version number strictly without 'v' prefix</p>
          </div>

          <!-- SKU_FW Computed Live Preview -->
          <div>
            <label class="block text-slate-300 font-semibold mb-1">SKU_FW Identifier (Standard)</label>
            <div class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-300 font-bold flex items-center justify-between">
              <span>{{ formatSkuFw(createItemCodeForm.sku, createItemCodeForm.firmwareVersion) }}</span>
              <span class="text-[10px] text-slate-500 font-normal">Auto-formatted</span>
            </div>
            <p class="text-[10px] text-slate-500 mt-1">Syntax: &lt;SKU&gt;_&lt;FW&gt; (e.g. WSLRW-ATH_6)</p>
          </div>
        </div>

        <!-- Default Test Template Mapping -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-slate-300 font-semibold">Default Test Template</label>
            <span v-if="createItemCodeForm.defaultTemplateId" class="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
              <i class="fa-solid fa-circle-check"></i> Scenario Linked
            </span>
          </div>
          <select
            v-model="createItemCodeForm.defaultTemplateId"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500 outline-none"
          >
            <option value="">(None - Select or assign later)</option>
            <option v-for="tpl in catalogAvailableTemplates" :key="tpl.id" :value="tpl.id">
              {{ tpl.name }} ({{ tpl.sku }}_{{ sanitizeFw(tpl.firmwareVersion) }})
            </option>
          </select>
          <p class="text-[10px] text-slate-500 mt-1">Pre-link automated test scenario to this Item Code for 1-click execution</p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Description / Notes</label>
          <textarea
            v-model="createItemCodeForm.description"
            rows="2"
            placeholder="Technical details, operating frequencies, or sensor specifications..."
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-500 outline-none"
          ></textarea>
        </div>

        <!-- Active Status Toggle -->
        <div class="flex items-center gap-2 pt-1">
          <input
            id="create-item-active"
            v-model="createItemCodeForm.isActive"
            type="checkbox"
            class="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-cyan-500"
          />
          <label for="create-item-active" class="text-xs text-slate-300 font-medium cursor-pointer">
            Set as Active (immediately available in Sales Order pickers)
          </label>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            @click="showCreateItemCodeModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSavingCatalogItem"
            class="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-cyan-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <i v-if="isSavingCatalogItem" class="fa-solid fa-spinner fa-spin text-xs"></i>
            <span>Create Item Code</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: EDIT ITEM CODE -->
  <div
    v-if="showEditItemCodeModal"
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    @click.self="showEditItemCodeModal = false"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-scale-in">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
            <i class="fa-solid fa-pen-to-square text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Edit Master Item Code</h3>
            <p class="text-[11px] text-slate-400">Update catalog properties and firmware mapping.</p>
          </div>
        </div>
        <button
          type="button"
          @click="showEditItemCodeModal = false"
          class="text-slate-400 hover:text-white text-xs p-1"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Edit Form -->
      <form @submit.prevent="submitEditItemCode" class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Item Code (Read-only identifier) -->
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Item Code</label>
            <input
              :value="editingCatalogItem.itemCode"
              disabled
              type="text"
              class="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 font-mono text-xs cursor-not-allowed uppercase"
            />
          </div>

          <!-- SKU -->
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Base Device SKU *</label>
            <input
              v-model="editingCatalogItem.sku"
              required
              type="text"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-sky-500 outline-none uppercase"
            />
          </div>

          <!-- Firmware Version (Strictly without 'v') -->
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Firmware Version *</label>
            <input
              v-model="editingCatalogItem.firmwareVersion"
              @input="editingCatalogItem.firmwareVersion = sanitizeFw(editingCatalogItem.firmwareVersion)"
              required
              type="text"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-sky-500 outline-none"
            />
          </div>

          <!-- SKU_FW Computed Live Preview -->
          <div>
            <label class="block text-slate-300 font-semibold mb-1">SKU_FW Identifier (Standard)</label>
            <div class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-300 font-bold">
              {{ formatSkuFw(editingCatalogItem.sku, editingCatalogItem.firmwareVersion) }}
            </div>
          </div>
        </div>

        <!-- Default Test Template Mapping -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-slate-300 font-semibold">Default Test Template</label>
            <span v-if="editingCatalogItem.defaultTemplateId" class="text-[10px] text-sky-400 font-mono flex items-center gap-1">
              <i class="fa-solid fa-circle-check"></i> Scenario Linked
            </span>
          </div>
          <select
            v-model="editingCatalogItem.defaultTemplateId"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-sky-500 outline-none"
          >
            <option value="">(None - Select or assign later)</option>
            <option v-for="tpl in catalogAvailableTemplates" :key="tpl.id" :value="tpl.id">
              {{ tpl.name }} ({{ tpl.sku }}_{{ sanitizeFw(tpl.firmwareVersion) }})
            </option>
          </select>
          <p class="text-[10px] text-slate-500 mt-1">Select test scenario to bind with this Item Code</p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Description / Notes</label>
          <textarea
            v-model="editingCatalogItem.description"
            rows="2"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-sky-500 outline-none"
          ></textarea>
        </div>

        <!-- Active Status Toggle -->
        <div class="flex items-center gap-2 pt-1">
          <input
            id="edit-item-active"
            v-model="editingCatalogItem.isActive"
            type="checkbox"
            class="w-4 h-4 rounded bg-slate-950 border-slate-700 text-sky-600 focus:ring-sky-500"
          />
          <label for="edit-item-active" class="text-xs text-slate-300 font-medium cursor-pointer">
            Catalog Item is Active
          </label>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            @click="showEditItemCodeModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSavingCatalogItem"
            class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-sky-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <i v-if="isSavingCatalogItem" class="fa-solid fa-spinner fa-spin text-xs"></i>
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: DELETE ITEM CODE CONFIRMATION -->
  <div
    v-if="showDeleteItemCodeModal"
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="showDeleteItemCodeModal = false"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scale-in">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <i class="fa-solid fa-triangle-exclamation text-base"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Delete Item Code</h3>
          <p class="text-xs text-slate-400">Are you sure you want to remove this item?</p>
        </div>
      </div>

      <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-xs">
        <div class="text-cyan-300 font-bold">{{ itemCodeToDelete.itemCode }}</div>
        <div class="text-slate-400">{{ itemCodeToDelete.sku }} | FW {{ sanitizeFw(itemCodeToDelete.firmwareVersion) }}</div>
        <div class="text-amber-300 text-[11px]">{{ formatSkuFw(itemCodeToDelete.sku, itemCodeToDelete.firmwareVersion) }}</div>
      </div>

      <p class="text-xs text-slate-400">
        This will permanently remove the Item Code from the catalog. Existing completed sales orders will keep their historical record.
      </p>

      <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
        <button
          type="button"
          @click="showDeleteItemCodeModal = false"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="submitDeleteItemCode"
          :disabled="isSavingCatalogItem"
          class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <i v-if="isSavingCatalogItem" class="fa-solid fa-spinner fa-spin text-xs"></i>
          <span>Delete Item</span>
        </button>
      </div>
    </div>
  </div>
`;
exports.ITEM_CODES_SCRIPT = `
  function useItemCodesModule(options) {
    const { showToast, authHeaders, switchTab, activeTestTemplateId } = options || {};

    const credentials = () => {
      const h = typeof authHeaders === 'function' ? authHeaders() : {};
      return { ...h, 'Content-Type': 'application/json' };
    };

    // Helper: sanitize firmware version (strictly no 'v' or 'V' and strip trailing .0)
    const sanitizeFw = (rawFw) => {
      if (rawFw === null || rawFw === undefined || rawFw === '') return '1';
      let clean = String(rawFw).trim().replace(/^[vV]+/, '');
      clean = clean.replace(/(\.0+)+$/, '');
      return clean.length > 0 ? clean : '1';
    };
    const formatFirmware = sanitizeFw;

    // Helper: format standard SKU_FW
    const formatSkuFw = (sku, rawFw) => {
      const cleanSku = (sku || '').trim().toUpperCase();
      const cleanFw = sanitizeFw(rawFw);
      return cleanSku ? cleanSku + '_' + cleanFw : '';
    };

    // Seed templates fallback
    const getInitialTemplatesSeed = () => [
      { id: 'seed-tpl-001', name: 'WSLRW-ATH Standard Sensor Scenario', sku: 'WSLRW-ATH', firmwareVersion: '6' },
      { id: 'seed-tpl-002', name: 'Modbus RS485 Master Suite', sku: 'WSL-MOD', firmwareVersion: '2.1' },
      { id: 'seed-tpl-003', name: 'RTD Temperature Transmitter Scenario', sku: 'WSL-RTD', firmwareVersion: '1' }
    ];

    // Seed data fallback
    const getInitialCatalogSeed = () => [
      {
        id: 'seed-item-001',
        itemCode: 'ITEM-001',
        sku: 'WSLRW-ATH',
        firmwareVersion: '6',
        skuFw: 'WSLRW-ATH_6',
        defaultTemplateId: 'seed-tpl-001',
        templateName: 'WSLRW-ATH Standard Sensor Scenario',
        description: 'Daviteq Ambient Temperature & Humidity LoRaWAN sensor',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'seed-item-002',
        itemCode: 'ITEM-002',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1.4',
        skuFw: 'WSLRW-ATH_1.4',
        defaultTemplateId: 'seed-tpl-001',
        templateName: 'WSLRW-ATH Standard Sensor Scenario',
        description: 'Daviteq ATH sensor legacy firmware release',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'seed-item-003',
        itemCode: 'ITEM-003',
        sku: 'WSL-MOD',
        firmwareVersion: '2.1',
        skuFw: 'WSL-MOD_2.1',
        defaultTemplateId: 'seed-tpl-002',
        templateName: 'Modbus RS485 Master Suite',
        description: 'Wireless Modbus RS485 Master Converter',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'seed-item-004',
        itemCode: 'ITEM-004',
        sku: 'WSL-RTD',
        firmwareVersion: '1',
        skuFw: 'WSL-RTD_1',
        defaultTemplateId: 'seed-tpl-003',
        templateName: 'RTD Temperature Transmitter Scenario',
        description: 'Wireless RTD Temperature Transmitter',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    // State
    const itemCodesList = Vue.ref(getInitialCatalogSeed());
    const itemCodesLoading = Vue.ref(false);
    const itemCodesSearchQuery = Vue.ref('');
    const itemCodesStatusFilter = Vue.ref('ALL');
    const itemCodesViewMode = Vue.ref('reactive'); // 'reactive' | 'tabulator'
    const catalogAvailableTemplates = Vue.ref(getInitialTemplatesSeed());
    const isSavingCatalogItem = Vue.ref(false);

    // Modal states
    const showCreateItemCodeModal = Vue.ref(false);
    const showEditItemCodeModal = Vue.ref(false);
    const showDeleteItemCodeModal = Vue.ref(false);

    const createItemCodeForm = Vue.ref({
      itemCode: '',
      sku: '',
      firmwareVersion: '6',
      defaultTemplateId: '',
      description: '',
      isActive: true
    });

    const editingCatalogItem = Vue.ref({
      id: '',
      itemCode: '',
      sku: '',
      firmwareVersion: '1',
      defaultTemplateId: '',
      description: '',
      isActive: true
    });

    const itemCodeToDelete = Vue.ref({});

    let itemCodesTabulatorInstance = null;

    // Computed properties
    const uniqueCatalogSkusCount = Vue.computed(() => {
      const skus = new Set(itemCodesList.value.map(it => (it.sku || '').toUpperCase()).filter(Boolean));
      return skus.size;
    });

    const filteredItemCodes = Vue.computed(() => {
      let list = itemCodesList.value || [];
      const q = (itemCodesSearchQuery.value || '').trim().toLowerCase();
      if (q) {
        list = list.filter(it =>
          (it.itemCode || '').toLowerCase().includes(q) ||
          (it.sku || '').toLowerCase().includes(q) ||
          (it.skuFw || '').toLowerCase().includes(q) ||
          (it.description || '').toLowerCase().includes(q) ||
          (it.templateName || '').toLowerCase().includes(q)
        );
      }
      if (itemCodesStatusFilter.value === 'ACTIVE') {
        list = list.filter(it => it.isActive);
      } else if (itemCodesStatusFilter.value === 'INACTIVE') {
        list = list.filter(it => !it.isActive);
      }
      return list;
    });

    // View mode switcher
    const setCatalogViewMode = (mode) => {
      itemCodesViewMode.value = mode;
      if (mode === 'tabulator') {
        Vue.nextTick(() => {
          initItemCodesTabulator();
        });
      }
    };

    // Tabulator 6.x Initialization
    const initItemCodesTabulator = () => {
      const container = document.getElementById('item-codes-tabulator-table');
      if (!container || typeof Tabulator === 'undefined') return;

      if (itemCodesTabulatorInstance) {
        try {
          itemCodesTabulatorInstance.destroy();
        } catch (e) {}
        itemCodesTabulatorInstance = null;
      }

      container.innerHTML = '';

      itemCodesTabulatorInstance = new Tabulator(container, {
        data: filteredItemCodes.value,
        layout: 'fitColumns',
        height: '460px',
        placeholder: 'No item codes found',
        columns: [
          {
            title: 'Item Code',
            field: 'itemCode',
            formatter: (cell) => '<span class="font-mono font-bold text-cyan-300">' + cell.getValue() + '</span>'
          },
          {
            title: 'SKU',
            field: 'sku',
            formatter: (cell) => '<span class="font-mono font-semibold text-purple-300">' + cell.getValue() + '</span>'
          },
          {
            title: 'FW',
            field: 'firmwareVersion',
            formatter: (cell) => '<span class="font-mono text-indigo-300">' + sanitizeFw(cell.getValue()) + '</span>'
          },
          {
            title: 'SKU_FW',
            field: 'skuFw',
            formatter: (cell) => {
              const d = cell.getData();
              const val = cell.getValue() || formatSkuFw(d.sku, d.firmwareVersion);
              return '<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono font-bold text-xs">' + val + '</span>';
            }
          },
          {
            title: 'Template',
            field: 'templateName',
            formatter: (cell) => {
              const d = cell.getData();
              const name = cell.getValue() || (d.template && d.template.name) || 'No Template';
              return '<span class="text-slate-300 font-mono text-[11px]">' + name + '</span>';
            }
          },
          {
            title: 'Status',
            field: 'isActive',
            formatter: (cell) => {
              const active = !!cell.getValue();
              return active
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">ACTIVE</span>'
                : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">INACTIVE</span>';
            }
          },
          {
            title: 'Description',
            field: 'description',
            formatter: (cell) => '<span class="text-slate-400 text-xs truncate">' + (cell.getValue() || '—') + '</span>'
          }
        ]
      });
    };

    // Fetch Item Codes from backend
    const fetchItemCodes = async () => {
      itemCodesLoading.value = true;
      try {
        const endpoints = ['/api/c-modules/item-codes', '/api/item-codes'];
        let data = null;
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, { headers: credentials(), credentials: 'include' });
            if (res.ok) {
              data = await res.json();
              break;
            }
          } catch(e) {}
        }

        if (data) {
          const list = Array.isArray(data) ? data : (data.data || data.items || []);
          if (list.length > 0) {
            itemCodesList.value = list.map(it => {
              const cleanFw = sanitizeFw(it.firmwareVersion || it.firmware_version);
              const tplId = it.defaultTemplateId || (it.defaultTemplate && it.defaultTemplate.id) || '';
              const matchedTpl = catalogAvailableTemplates.value.find(t => t.id === tplId);
              const tplName = it.templateName || (it.defaultTemplate && it.defaultTemplate.name) || (it.template && it.template.name) || (matchedTpl ? matchedTpl.name : '');
              return {
                ...it,
                firmwareVersion: cleanFw,
                skuFw: it.skuFw || it.sku_fw || formatSkuFw(it.sku, cleanFw),
                defaultTemplateId: tplId,
                templateName: tplName
              };
            });
          }
        }
      } catch (err) {
        console.warn('Item codes fetch warning:', err);
      } finally {
        itemCodesLoading.value = false;
        if (itemCodesViewMode.value === 'tabulator') {
          Vue.nextTick(() => initItemCodesTabulator());
        }
      }
    };

    // Fetch available templates
    const fetchCatalogAvailableTemplates = async () => {
      try {
        const endpoints = ['/api/c-modules/test-builder/templates', '/api/test-automation/templates'];
        let data = null;
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, { headers: credentials(), credentials: 'include' });
            if (res.ok) {
              data = await res.json();
              break;
            }
          } catch(e) {}
        }

        if (data) {
          const list = Array.isArray(data) ? data : (data.templates || []);
          if (list.length > 0) {
            catalogAvailableTemplates.value = list;
            // Update any existing item codes lacking templateName
            itemCodesList.value.forEach(it => {
              const tId = it.defaultTemplateId || (it.defaultTemplate && it.defaultTemplate.id);
              if (tId && (!it.templateName || it.templateName === 'No Template' || it.templateName === 'Scenario linked')) {
                const found = list.find(t => t.id === tId);
                if (found) it.templateName = found.name;
              }
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load templates for catalog dropdown:', err);
      }
    };

    // Copy to clipboard helper
    const copyText = (text, label) => {
      if (!text) return;
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (showToast) showToast('Copied ' + (label || 'text') + ' to clipboard', 'success');
        }).catch(() => {});
      }
    };

    // Navigate to Test Builder
    const navigateToTestBuilder = (templateId) => {
      if (activeTestTemplateId && templateId) {
        activeTestTemplateId.value = templateId;
      }
      if (typeof switchTab === 'function') {
        switchTab('test-builder');
      }
    };

    // Toggle active status
    const toggleItemActive = async (item) => {
      item.isActive = !item.isActive;
      try {
        await fetch('/api/c-modules/item-codes/' + (item.id || encodeURIComponent(item.itemCode)), {
          method: 'PUT',
          headers: credentials(),
          credentials: 'include',
          body: JSON.stringify({ isActive: item.isActive })
        });
      } catch (e) {}
      if (showToast) showToast('Item status updated', 'success');
      if (itemCodesViewMode.value === 'tabulator') {
        initItemCodesTabulator();
      }
    };

    // Modal Handlers
    const openCreateItemCodeModal = () => {
      fetchCatalogAvailableTemplates();
      createItemCodeForm.value = {
        itemCode: 'ITEM-' + Math.floor(100 + Math.random() * 900),
        sku: 'WSLRW-ATH',
        firmwareVersion: '6',
        defaultTemplateId: catalogAvailableTemplates.value[0]?.id || '',
        description: '',
        isActive: true
      };
      showCreateItemCodeModal.value = true;
    };

    const submitCreateItemCode = async () => {
      if (!createItemCodeForm.value.itemCode.trim()) {
        if (showToast) showToast('Item Code is required', 'error');
        return;
      }
      if (!createItemCodeForm.value.sku.trim()) {
        if (showToast) showToast('SKU is required', 'error');
        return;
      }

      isSavingCatalogItem.value = true;
      const cleanFw = sanitizeFw(createItemCodeForm.value.firmwareVersion);
      const sku = createItemCodeForm.value.sku.trim().toUpperCase();
      const skuFw = formatSkuFw(sku, cleanFw);
      const tplId = createItemCodeForm.value.defaultTemplateId || null;
      const matchedTpl = tplId ? catalogAvailableTemplates.value.find(t => t.id === tplId) : null;
      const payload = {
        itemCode: createItemCodeForm.value.itemCode.trim().toUpperCase(),
        sku,
        firmwareVersion: cleanFw,
        skuFw,
        defaultTemplateId: tplId,
        description: createItemCodeForm.value.description?.trim() || null,
        isActive: createItemCodeForm.value.isActive !== false
      };

      try {
        let saved = false;
        let resData = null;
        const endpoints = ['/api/c-modules/item-codes', '/api/item-codes'];
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, {
              method: 'POST',
              headers: credentials(),
              credentials: 'include',
              body: JSON.stringify(payload)
            });
            if (res.ok) {
              resData = await res.json();
              saved = true;
              break;
            }
          } catch(e) {}
        }

        const localItem = {
          id: resData?.id || ('item-' + Date.now()),
          ...payload,
          defaultTemplateId: tplId || '',
          templateName: matchedTpl ? matchedTpl.name : (resData?.defaultTemplate?.name || ''),
          createdAt: resData?.createdAt || new Date().toISOString()
        };
        itemCodesList.value.unshift(localItem);

        if (showToast) showToast('Item Code ' + payload.itemCode + ' created successfully', 'success');
        showCreateItemCodeModal.value = false;
      } catch (err) {
        if (showToast) showToast('Error creating Item Code', 'error');
      } finally {
        isSavingCatalogItem.value = false;
        if (itemCodesViewMode.value === 'tabulator') {
          Vue.nextTick(() => initItemCodesTabulator());
        }
      }
    };

    const openEditItemCodeModal = (item) => {
      fetchCatalogAvailableTemplates();
      editingCatalogItem.value = {
        id: item.id || '',
        itemCode: item.itemCode,
        sku: item.sku,
        firmwareVersion: sanitizeFw(item.firmwareVersion),
        defaultTemplateId: item.defaultTemplateId || (item.defaultTemplate && item.defaultTemplate.id) || '',
        description: item.description || '',
        isActive: item.isActive !== false
      };
      showEditItemCodeModal.value = true;
    };

    const submitEditItemCode = async () => {
      isSavingCatalogItem.value = true;
      const cleanFw = sanitizeFw(editingCatalogItem.value.firmwareVersion);
      const sku = editingCatalogItem.value.sku.trim().toUpperCase();
      const skuFw = formatSkuFw(sku, cleanFw);
      const tplId = editingCatalogItem.value.defaultTemplateId || null;
      const matchedTpl = tplId ? catalogAvailableTemplates.value.find(t => t.id === tplId) : null;
      const payload = {
        sku,
        firmwareVersion: cleanFw,
        skuFw,
        defaultTemplateId: tplId,
        description: editingCatalogItem.value.description?.trim() || null,
        isActive: editingCatalogItem.value.isActive !== false
      };

      try {
        const id = editingCatalogItem.value.id || encodeURIComponent(editingCatalogItem.value.itemCode);
        const endpoints = ['/api/c-modules/item-codes/' + id, '/api/item-codes/' + id];
        for (const ep of endpoints) {
          try {
            await fetch(ep, {
              method: 'PUT',
              headers: credentials(),
              credentials: 'include',
              body: JSON.stringify(payload)
            });
            break;
          } catch(e) {}
        }

        // Update local list
        const idx = itemCodesList.value.findIndex(it =>
          (it.id && it.id === editingCatalogItem.value.id) ||
          (it.itemCode === editingCatalogItem.value.itemCode)
        );
        if (idx !== -1) {
          itemCodesList.value[idx] = {
            ...itemCodesList.value[idx],
            ...payload,
            defaultTemplateId: tplId || '',
            templateName: matchedTpl ? matchedTpl.name : (itemCodesList.value[idx].templateName || '')
          };
        }

        if (showToast) showToast('Item Code updated successfully', 'success');
        showEditItemCodeModal.value = false;
      } catch (err) {
        if (showToast) showToast('Failed to update Item Code', 'error');
      } finally {
        isSavingCatalogItem.value = false;
        if (itemCodesViewMode.value === 'tabulator') {
          Vue.nextTick(() => initItemCodesTabulator());
        }
      }
    };

    const openDeleteItemCodeModal = (item) => {
      itemCodeToDelete.value = item;
      showDeleteItemCodeModal.value = true;
    };

    const submitDeleteItemCode = async () => {
      if (!itemCodeToDelete.value) return;
      isSavingCatalogItem.value = true;
      try {
        const id = itemCodeToDelete.value.id || encodeURIComponent(itemCodeToDelete.value.itemCode);
        const endpoints = ['/api/c-modules/item-codes/' + id, '/api/item-codes/' + id];
        for (const ep of endpoints) {
          try {
            await fetch(ep, { method: 'DELETE', headers: credentials(), credentials: 'include' });
            break;
          } catch(e) {}
        }

        itemCodesList.value = itemCodesList.value.filter(it =>
          it.itemCode !== itemCodeToDelete.value.itemCode &&
          (!it.id || it.id !== itemCodeToDelete.value.id)
        );

        if (showToast) showToast('Item Code deleted', 'success');
        showDeleteItemCodeModal.value = false;
      } catch (err) {
        if (showToast) showToast('Failed to delete Item Code', 'error');
      } finally {
        isSavingCatalogItem.value = false;
        if (itemCodesViewMode.value === 'tabulator') {
          Vue.nextTick(() => initItemCodesTabulator());
        }
      }
    };

    // Preload available test templates on module setup
    fetchCatalogAvailableTemplates();

    return {
      itemCodesList,
      itemCodesLoading,
      itemCodesSearchQuery,
      itemCodesStatusFilter,
      itemCodesViewMode,
      catalogAvailableTemplates,
      isSavingCatalogItem,
      showCreateItemCodeModal,
      showEditItemCodeModal,
      showDeleteItemCodeModal,
      createItemCodeForm,
      editingCatalogItem,
      itemCodeToDelete,
      uniqueCatalogSkusCount,
      filteredItemCodes,
      setCatalogViewMode,
      initItemCodesTabulator,
      fetchItemCodes,
      fetchCatalogAvailableTemplates,
      sanitizeFw,
      formatFirmware,
      formatSkuFw,
      copyText,
      navigateToTestBuilder,
      toggleItemActive,
      openCreateItemCodeModal,
      submitCreateItemCode,
      openEditItemCodeModal,
      submitEditItemCode,
      openDeleteItemCodeModal,
      submitDeleteItemCode
    };
  }
`;
//# sourceMappingURL=item-codes.module.js.map