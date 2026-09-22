/**
 * Sales Orders & Item Code Management
 * Subsystem: Manufacturing & Testing Management
 * Standard: 100% English UI, Minimalist Clean UX
 * Features:
 *  - Sales Orders table with search, status filters, and source badges
 *  - Collapsible/Expanded Item Code sub-table with testing progress (tested, passed, failed)
 *  - Standardized SKU_FW syntax (e.g. WSLRW-ATH_6, clean firmware without 'v')
 *  - Standardized Sales Order code format (SO/2026/xxxxx)
 *  - Fast Item Code Catalog Picker for SO line items
 *  - Dual View Mode: Responsive Tailwind Card Table + Tabulator 6.x Data Grid
 *  - Manual Sales Order Creation Modal with dynamic Item Code rows & catalog picker
 *  - Multi-tab Import Modal: Odoo JSON payload (webhook/export), CSV spreadsheet bulk upload, Odoo Remote API
 *  - Edit & Delete Sales Order modals with cascade confirmation
 *  - Real-time Item Test Status dialog linked to test sessions
 *  - Deep-link integration with Test Builder
 */

export const SALES_ORDERS_TEMPLATE = `
  <!-- SALES ORDERS & ITEM CODES -->
  <div class="space-y-5">

    <!-- Top Action & Statistics Header Card -->
    <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
      
      <!-- Title & Module Meta -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-inner">
            <i class="fa-solid fa-file-invoice-dollar text-lg"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-base font-bold text-white tracking-wide">Sales Orders & Item Codes</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono">
                Production Orders
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Manage production sales orders, SKU firmware item tracking, Odoo ERP synchronization, and automated test suite linkages.
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            @click="fetchSalesOrders"
            :disabled="soLoading"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
            title="Refresh sales orders list"
          >
            <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': soLoading }"></i>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            @click="openImportSoModal"
            class="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition active:scale-95 shadow-sm"
            title="Import Sales Orders from Odoo JSON, CSV file, or live Odoo API"
          >
            <i class="fa-solid fa-cloud-arrow-down text-indigo-400"></i>
            <span>Import Odoo / CSV</span>
          </button>

          <button
            type="button"
            @click="openCreateSoModal"
            class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/20 transition active:scale-95"
            title="Create manual Sales Order with dynamic Item Codes"
          >
            <i class="fa-solid fa-plus text-xs"></i>
            <span>+ Create Sales Order</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
        <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm">
            <i class="fa-solid fa-boxes-stacked"></i>
          </div>
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Total Orders</div>
            <div class="text-sm font-bold font-mono text-white">{{ soPagination.total || salesOrdersList.length }}</div>
          </div>
        </div>

        <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-sm">
            <i class="fa-solid fa-barcode"></i>
          </div>
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Total Items / Units</div>
            <div class="text-sm font-bold font-mono text-white">
              {{ soStats.totalItems }} <span class="text-xs text-slate-400 font-normal">({{ soStats.totalUnits }} units)</span>
            </div>
          </div>
        </div>

        <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
            <i class="fa-solid fa-vial-circle-check"></i>
          </div>
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Units Tested</div>
            <div class="text-sm font-bold font-mono text-indigo-300">
              {{ soStats.testedUnits }} <span class="text-xs text-slate-400 font-normal">/ {{ soStats.totalUnits }}</span>
            </div>
          </div>
        </div>

        <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Overall Pass Rate</div>
            <div class="text-sm font-bold font-mono" :class="soStats.passRate >= 90 ? 'text-emerald-400' : (soStats.passRate >= 50 ? 'text-amber-400' : 'text-slate-300')">
              {{ soStats.passRate }}%
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
              v-model="soSearchQuery"
              @input="onSoSearch"
              type="text"
              placeholder="Search by SO code, customer name..."
              class="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
            <button
              v-if="soSearchQuery"
              @click="soSearchQuery = ''; onSoSearch()"
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Status Filter -->
          <select
            v-model="soStatusFilter"
            @change="fetchSalesOrders"
            class="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="IN_PRODUCTION">IN PRODUCTION</option>
            <option value="TESTING">TESTING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <!-- Source Filter -->
          <select
            v-model="soSourceFilter"
            @change="fetchSalesOrders"
            class="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          >
            <option value="ALL">All Sources</option>
            <option value="MANUAL">MANUAL</option>
            <option value="ODOO">ODOO</option>
            <option value="CSV">CSV</option>
            <option value="EXCEL">EXCEL</option>
            <option value="API">API</option>
          </select>
        </div>

        <!-- View Switcher (Reactive Accordion vs Tabulator Grid) -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl self-end md:self-auto">
          <button
            type="button"
            @click="setSoViewMode('reactive')"
            :class="soTableViewMode === 'reactive' ? 'bg-amber-600/30 text-amber-300 font-bold border border-amber-500/40 shadow-sm' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Interactive card table with expandable item code drawers"
          >
            <i class="fa-solid fa-table-list text-xs"></i>
            <span>Interactive Table</span>
          </button>
          <button
            type="button"
            @click="setSoViewMode('tabulator')"
            :class="soTableViewMode === 'tabulator' ? 'bg-amber-600/30 text-amber-300 font-bold border border-amber-500/40 shadow-sm' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Tabulator 6.x high-density spreadsheet grid"
          >
            <i class="fa-solid fa-table-cells text-xs"></i>
            <span>Tabulator Grid</span>
          </button>
        </div>
      </div>

    </div>

    <!-- MAIN DATA VIEW -->
    <div class="glass-card rounded-2xl p-5 space-y-4">
      
      <!-- MODE A: INTERACTIVE REACTIVE ACCORDION TABLE -->
      <div v-show="soTableViewMode === 'reactive'" class="space-y-4">
        <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 select-none">
              <tr>
                <th class="py-3 px-3 w-10 text-center"></th>
                <th class="py-3 px-3.5">SO Code</th>
                <th class="py-3 px-3.5">Customer</th>
                <th class="py-3 px-3.5">Order Date</th>
                <th class="py-3 px-3.5">Source</th>
                <th class="py-3 px-3.5">Status</th>
                <th class="py-3 px-3.5">Line Items</th>
                <th class="py-3 px-3.5">Testing Progress</th>
                <th class="py-3 px-3.5">Created At</th>
                <th class="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <!-- Loading State -->
              <tr v-if="soLoading && salesOrdersList.length === 0">
                <td colspan="10" class="py-12 text-center text-slate-400">
                  <i class="fa-solid fa-spinner fa-spin text-lg text-amber-400 mb-2"></i>
                  <div>Loading sales orders...</div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-else-if="salesOrdersList.length === 0">
                <td colspan="10" class="py-12 text-center text-slate-500">
                  <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-600 text-xl">
                    <i class="fa-solid fa-file-invoice"></i>
                  </div>
                  <div class="text-sm font-semibold text-slate-400">No Sales Orders Found</div>
                  <p class="text-xs text-slate-500 mt-1">Create a manual sales order or import from Odoo/CSV to get started.</p>
                  <div class="mt-4 flex items-center justify-center gap-2">
                    <button
                      @click="openCreateSoModal"
                      class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      + Create Order
                    </button>
                    <button
                      @click="openImportSoModal"
                      class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Import Odoo / CSV
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Sales Order Rows -->
              <template v-for="so in salesOrdersList" :key="so.id">
                <tr
                  class="hover:bg-slate-800/30 transition group cursor-pointer"
                  :class="{ 'bg-slate-800/20': isSoExpanded(so.id) }"
                  @click="toggleSoExpand(so.id)"
                >
                  <!-- Expand Toggle Chevron -->
                  <td class="py-3 px-3 text-center" @click.stop="toggleSoExpand(so.id)">
                    <button
                      type="button"
                      class="w-6 h-6 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
                      :title="isSoExpanded(so.id) ? 'Collapse item details' : 'Expand item details'"
                    >
                      <i class="fa-solid text-[10px] transition-transform duration-200" :class="isSoExpanded(so.id) ? 'fa-chevron-down text-amber-400' : 'fa-chevron-right'"></i>
                    </button>
                  </td>

                  <!-- SO Code -->
                  <td class="py-3 px-3.5 font-mono font-bold text-sky-400 group-hover:text-sky-300">
                    <div class="flex items-center gap-1.5">
                      <span>{{ so.soCode }}</span>
                      <span v-if="so.odooId" class="text-[10px] font-normal text-purple-400" :title="'Odoo Sale Order #' + so.odooId">
                        (#{{ so.odooId }})
                      </span>
                    </div>
                  </td>

                  <!-- Customer -->
                  <td class="py-3 px-3.5 font-semibold text-white">
                    {{ so.customer || '—' }}
                  </td>

                  <!-- Order Date -->
                  <td class="py-3 px-3.5 font-mono text-slate-300">
                    {{ formatDate(so.orderDate) }}
                  </td>

                  <!-- Source Badge -->
                  <td class="py-3 px-3.5">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 font-mono"
                      :class="getSourceBadgeClass(so.source)"
                    >
                      <i :class="getSourceIcon(so.source)" class="text-[9px]"></i>
                      <span>{{ so.source }}</span>
                    </span>
                  </td>

                  <!-- Status Badge -->
                  <td class="py-3 px-3.5">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 uppercase"
                      :class="getStatusBadgeClass(so.status)"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(so.status)"></span>
                      <span>{{ so.status }}</span>
                    </span>
                  </td>

                  <!-- Items Count & Units -->
                  <td class="py-3 px-3.5">
                    <span class="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-mono font-semibold">
                      {{ (so.items && so.items.length) || so.itemsCount || 0 }} items
                    </span>
                    <span class="text-[11px] text-slate-400 ml-1.5 font-mono">
                      ({{ so.totalQuantity || calculateTotalQuantity(so) }} units)
                    </span>
                  </td>

                  <!-- Testing Progress -->
                  <td class="py-3 px-3.5 min-w-[170px]">
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-[11px] font-mono">
                        <span class="text-slate-300">{{ so.testProgress || calculateProgress(so) }}%</span>
                        <span class="text-slate-400 text-[10px]">
                          {{ so.testedQuantity || 0 }}/{{ so.totalQuantity || calculateTotalQuantity(so) }} tested
                        </span>
                      </div>
                      <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          class="h-full bg-emerald-500 transition-all duration-300"
                          :style="{ width: ((so.passedQuantity || 0) / (so.totalQuantity || 1) * 100) + '%' }"
                          :title="'Passed: ' + (so.passedQuantity || 0)"
                        ></div>
                        <div
                          class="h-full bg-rose-500 transition-all duration-300"
                          :style="{ width: ((so.failedQuantity || 0) / (so.totalQuantity || 1) * 100) + '%' }"
                          :title="'Failed: ' + (so.failedQuantity || 0)"
                        ></div>
                      </div>
                      <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span class="text-emerald-400">P: {{ so.passedQuantity || 0 }}</span>
                        <span class="text-rose-400">F: {{ so.failedQuantity || 0 }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Created At -->
                  <td class="py-3 px-3.5 font-mono text-[11px] text-slate-400">
                    <div>{{ formatDateTime(so.createdAt) }}</div>
                    <div class="text-[10px] text-slate-500">{{ so.createdBy || 'system' }}</div>
                  </td>

                  <!-- Actions -->
                  <td class="py-3 px-3.5 text-right" @click.stop>
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        @click="openSoDetails(so)"
                        class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="View Full Sales Order Details"
                      >
                        <i class="fa-solid fa-eye text-xs"></i>
                      </button>

                      <button
                        type="button"
                        @click="openEditSoModal(so)"
                        class="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 transition cursor-pointer"
                        title="Edit Sales Order"
                      >
                        <i class="fa-solid fa-pen-to-square text-xs"></i>
                      </button>

                      <button
                        type="button"
                        @click="openDeleteSoModal(so)"
                        class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition cursor-pointer"
                        title="Delete Sales Order"
                      >
                        <i class="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- EXPANDED ITEM CODES SUB-TABLE ACCORDION -->
                <tr v-if="isSoExpanded(so.id)" class="bg-slate-950/80 border-b border-slate-800/80">
                  <td colspan="10" class="p-4 sm:p-5">
                    <div class="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-inner">
                      
                      <!-- Sub-header -->
                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span class="text-xs font-bold text-white uppercase tracking-wider">Item Codes for {{ so.soCode }}</span>
                          <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                            {{ (so.items && so.items.length) || 0 }} line items
                          </span>
                          <span v-if="so.notes" class="text-[11px] text-slate-400 italic">
                            &ldquo;{{ so.notes }}&rdquo;
                          </span>
                        </div>

                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            @click="openEditSoModal(so)"
                            class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <i class="fa-solid fa-plus text-[10px] text-sky-400"></i>
                            <span>Manage Items</span>
                          </button>
                        </div>
                      </div>

                      <!-- Items Sub-Table -->
                      <div class="overflow-x-auto custom-scroll border border-slate-800/90 rounded-lg">
                        <table class="w-full text-left text-xs">
                          <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                            <tr>
                              <th class="py-2 px-3">Item Code</th>
                              <th class="py-2 px-3">SKU</th>
                              <th class="py-2 px-3">FW</th>
                              <th class="py-2 px-3">SKU_FW</th>
                              <th class="py-2 px-3 text-right">Quantity</th>
                              <th class="py-2 px-3">Assigned Test Template</th>
                              <th class="py-2 px-3 text-center">Tested / Pass / Fail</th>
                              <th class="py-2 px-3">Status</th>
                              <th class="py-2 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-800/50">
                            <tr v-if="!so.items || so.items.length === 0">
                              <td colspan="9" class="py-4 text-center text-slate-500 italic">
                                No Item Codes registered in this Sales Order. Click "Manage Items" to add line items.
                              </td>
                            </tr>
                            <tr v-for="item in so.items" :key="item.id || item.itemCode" class="hover:bg-slate-800/40 transition">
                              
                              <!-- Item Code -->
                              <td class="py-2 px-3 font-mono font-bold text-cyan-300">
                                {{ item.itemCode }}
                              </td>

                              <!-- SKU -->
                              <td class="py-2 px-3 font-mono text-purple-300 font-semibold">
                                {{ item.sku }}
                              </td>

                              <!-- Firmware Version (Clean without 'v') -->
                              <td class="py-2 px-3 font-mono text-indigo-300">
                                <span class="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[11px]">
                                  {{ sanitizeFw(item.firmwareVersion) }}
                                </span>
                              </td>

                              <!-- Standard SKU_FW (e.g. WSLRW-ATH_6) -->
                              <td class="py-2 px-3 font-mono">
                                <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold text-[11px] inline-flex items-center gap-1">
                                  {{ formatSkuFw(item.sku, item.firmwareVersion) }}
                                </span>
                              </td>

                              <!-- Quantity -->
                              <td class="py-2 px-3 font-mono text-right font-bold text-white">
                                {{ item.quantity || 1 }}
                              </td>

                              <!-- Assigned Test Template -->
                              <td class="py-2 px-3">
                                <div v-if="item.template" class="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    @click="navigateToTestBuilder(item.template.id)"
                                    class="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition group"
                                    :title="'Open ' + item.template.name + ' (' + item.template.code + ') in Test Automation Builder'"
                                  >
                                    <i class="fa-solid fa-vial-circle-check text-[10px] text-indigo-400"></i>
                                    <span class="truncate max-w-[180px]">{{ item.template.name }}</span>
                                    <i class="fa-solid fa-arrow-up-right-from-square text-[9px] opacity-60 group-hover:opacity-100"></i>
                                  </button>
                                </div>
                                <div v-else class="flex items-center gap-1.5">
                                  <span class="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/25 text-[10px] font-mono flex items-center gap-1" title="No test template mapped yet">
                                    <i class="fa-solid fa-triangle-exclamation text-[10px]"></i>
                                    <span>No Template</span>
                                  </span>
                                  <button
                                    type="button"
                                    @click="autoResolveItemTemplate(so, item)"
                                    class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                                    title="Auto-detect template by SKU and Firmware"
                                  >
                                    Auto-Match
                                  </button>
                                </div>
                              </td>

                              <!-- Tested / Pass / Fail Counts -->
                              <td class="py-2 px-3 text-center font-mono text-[11px]">
                                <span class="text-white font-bold">{{ item.testedQuantity || 0 }}</span>
                                <span class="text-slate-500"> / </span>
                                <span class="text-emerald-400 font-semibold">{{ item.passedQuantity || 0 }} P</span>
                                <span class="text-slate-500"> / </span>
                                <span class="text-rose-400 font-semibold">{{ item.failedQuantity || 0 }} F</span>
                              </td>

                              <!-- Status Badge -->
                              <td class="py-2 px-3">
                                <span
                                  class="px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 font-mono uppercase"
                                  :class="getItemStatusBadgeClass(item.status)"
                                >
                                  <span>{{ item.status || 'PENDING' }}</span>
                                </span>
                              </td>

                              <!-- Action Buttons -->
                              <td class="py-2 px-3 text-right">
                                <div class="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    @click="inspectItemTestStatus(so.soCode, item.itemCode)"
                                    class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                                    title="Check live test session status"
                                  >
                                    <i class="fa-solid fa-bolt text-[10px] text-amber-400"></i>
                                    <span>Test Status</span>
                                  </button>

                                  <button
                                    v-if="item.template"
                                    type="button"
                                    @click="navigateToTestBuilder(item.template.id)"
                                    class="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                                    title="Open Scenario in Test Builder"
                                  >
                                    <i class="fa-solid fa-diagram-project text-[10px]"></i>
                                    <span>Builder</span>
                                  </button>
                                </div>
                              </td>

                            </tr>
                          </tbody>
                        </table>
                      </div>

                    </div>
                  </td>
                </tr>

              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
          <div>
            Showing <span class="text-white font-semibold">{{ (soPagination.page - 1) * soPagination.limit + (salesOrdersList.length > 0 ? 1 : 0) }}</span> to
            <span class="text-white font-semibold">{{ (soPagination.page - 1) * soPagination.limit + salesOrdersList.length }}</span> of
            <span class="text-white font-semibold">{{ soPagination.total || salesOrdersList.length }}</span> orders
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="changeSoPage(soPagination.page - 1)"
              :disabled="soPagination.page <= 1"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-semibold cursor-pointer transition"
            >
              <i class="fa-solid fa-chevron-left text-[10px] mr-1"></i> Prev
            </button>

            <span class="font-mono text-xs px-2 text-slate-300">
              Page {{ soPagination.page }} / {{ soPagination.totalPages || 1 }}
            </span>

            <button
              type="button"
              @click="changeSoPage(soPagination.page + 1)"
              :disabled="soPagination.page >= (soPagination.totalPages || 1)"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-semibold cursor-pointer transition"
            >
              Next <i class="fa-solid fa-chevron-right text-[10px] ml-1"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- MODE B: TABULATOR 6.x DATA GRID CONTAINER -->
      <div v-show="soTableViewMode === 'tabulator'" class="space-y-3">
        <div class="flex items-center justify-between text-xs text-slate-400 pb-1">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-table-cells text-amber-400"></i>
            <span class="font-bold text-white">Tabulator High-Density Grid</span>
            <span class="text-slate-500 font-mono">({{ salesOrdersList.length }} rows loaded)</span>
          </div>
          <button
            type="button"
            @click="initSoTabulator"
            class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer"
          >
            <i class="fa-solid fa-rotate mr-1 text-[10px]"></i> Redraw Grid
          </button>
        </div>

        <div id="so-tabulator-table" class="rounded-xl overflow-hidden border border-slate-800 min-h-[420px]"></div>
      </div>

    </div>

  </div>
`;

export const SALES_ORDERS_MODALS = `
  <!-- MODAL 1: MANUAL SALES ORDER CREATION -->
  <div v-if="showCreateSoModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
    <div class="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-slate-200 max-h-[90vh] overflow-y-auto custom-scroll">
      
      <!-- Header -->
      <div class="flex items-start justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <i class="fa-solid fa-plus text-base"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Create Sales Order</h3>
            <p class="text-xs text-slate-400">Manual creation of Sales Order with dynamic line items (Item Codes).</p>
          </div>
        </div>
        <button
          type="button"
          @click="showCreateSoModal = false"
          class="text-slate-400 hover:text-white text-lg p-1"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="submitCreateSo" class="space-y-4">
        
        <!-- General SO Metadata -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">
              Sales Order Code <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="createSoForm.soCode"
              required
              type="text"
              placeholder="e.g. SO/2026/00001"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Customer / Partner</label>
            <input
              v-model="createSoForm.customer"
              type="text"
              placeholder="e.g. Daviteq IoT Corp"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Order Date</label>
            <input
              v-model="createSoForm.orderDate"
              type="date"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-500 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Status</label>
            <select
              v-model="createSoForm.status"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-amber-500 outline-none"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="IN_PRODUCTION">IN PRODUCTION</option>
              <option value="TESTING">TESTING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Source</label>
            <select
              v-model="createSoForm.source"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-amber-500 outline-none"
            >
              <option value="MANUAL">MANUAL</option>
              <option value="ODOO">ODOO</option>
              <option value="CSV">CSV</option>
              <option value="API">API</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Notes / Remarks</label>
            <input
              v-model="createSoForm.notes"
              type="text"
              placeholder="e.g. Priority customer batch"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
            />
          </div>
        </div>

        <!-- Dynamic Item Codes Section -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-boxes-stacked text-amber-400"></i>
                <span>Line Items (Item Codes)</span>
                <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                  {{ createSoForm.items.length }} items
                </span>
              </h4>
              <p class="text-[11px] text-slate-400">Assign device SKU, target firmware, and link to automated test scenario templates.</p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="openCatalogPickerModal"
                class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
                title="Select registered Item Codes from master catalog"
              >
                <i class="fa-solid fa-barcode text-[11px]"></i>
                <span>Pick from Catalog</span>
              </button>

              <button
                type="button"
                @click="addCreateSoItemRow"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition"
              >
                <i class="fa-solid fa-plus text-[10px]"></i>
                <span>Add Item Row</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Items Table -->
          <div class="border border-slate-800 rounded-xl overflow-x-auto custom-scroll bg-slate-950/60">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3 w-36">Item Code *</th>
                  <th class="py-2.5 px-3 w-36">SKU *</th>
                  <th class="py-2.5 px-3 w-20">FW</th>
                  <th class="py-2.5 px-3 w-32">SKU_FW</th>
                  <th class="py-2.5 px-3 w-20">Qty</th>
                  <th class="py-2.5 px-3">Linked Test Template</th>
                  <th class="py-2.5 px-3">Notes</th>
                  <th class="py-2.5 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-if="createSoForm.items.length === 0">
                  <td colspan="8" class="py-6 text-center text-slate-500">
                    No items added yet. Click &ldquo;Pick from Catalog&rdquo; or &ldquo;Add Item Row&rdquo;.
                  </td>
                </tr>
                <tr v-for="(it, idx) in createSoForm.items" :key="idx" class="hover:bg-slate-800/30">
                  <!-- Item Code with quick catalog picker -->
                  <td class="py-2 px-2.5">
                    <div class="relative flex items-center">
                      <input
                        v-model="it.itemCode"
                        required
                        type="text"
                        placeholder="ITEM-001"
                        class="w-full pl-2.5 pr-7 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 outline-none uppercase"
                      />
                      <button
                        type="button"
                        @click="openCatalogPickerForRow(idx)"
                        class="absolute right-1 text-slate-400 hover:text-cyan-300 p-1 transition cursor-pointer"
                        title="Pick Item Code from Catalog"
                      >
                        <i class="fa-solid fa-folder-open text-[11px]"></i>
                      </button>
                    </div>
                  </td>

                  <!-- SKU -->
                  <td class="py-2 px-2.5">
                    <input
                      v-model="it.sku"
                      @change="onSkuOrFwChange(it)"
                      required
                      type="text"
                      placeholder="WSLRW-ATH"
                      class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 outline-none uppercase"
                    />
                  </td>

                  <!-- Firmware Version (Sanitized strictly without 'v') -->
                  <td class="py-2 px-2.5">
                    <input
                      v-model="it.firmwareVersion"
                      @input="it.firmwareVersion = sanitizeFw(it.firmwareVersion); onSkuOrFwChange(it)"
                      type="text"
                      placeholder="6"
                      class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 outline-none"
                    />
                  </td>

                  <!-- SKU_FW Standard Live Preview -->
                  <td class="py-2 px-2.5 font-mono">
                    <span class="px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold text-[11px] inline-block">
                      {{ formatSkuFw(it.sku, it.firmwareVersion) }}
                    </span>
                  </td>

                  <!-- Quantity -->
                  <td class="py-2 px-2.5">
                    <input
                      v-model.number="it.quantity"
                      type="number"
                      min="1"
                      class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 outline-none text-right"
                    />
                  </td>

                  <!-- Template Selector / Auto Detect -->
                  <td class="py-2 px-2.5">
                    <div class="flex items-center gap-1.5">
                      <select
                        v-model="it.templateId"
                        class="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-indigo-500 outline-none"
                      >
                        <option value="">(Auto-detect by SKU/FW)</option>
                        <option v-for="tpl in availableTestTemplates" :key="tpl.id" :value="tpl.id">
                          {{ tpl.name }} ({{ tpl.sku }}_{{ sanitizeFw(tpl.firmwareVersion) }})
                        </option>
                      </select>
                      <button
                        type="button"
                        @click="triggerAutoDetectTemplate(it)"
                        class="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs transition cursor-pointer"
                        title="Detect matching template from server"
                      >
                        <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                      </button>
                    </div>
                  </td>

                  <!-- Notes -->
                  <td class="py-2 px-2.5">
                    <input
                      v-model="it.notes"
                      type="text"
                      placeholder="Optional notes"
                      class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 outline-none"
                    />
                  </td>

                  <!-- Remove Row -->
                  <td class="py-2 px-2 text-center">
                    <button
                      type="button"
                      @click="removeCreateSoItemRow(idx)"
                      class="p-1.5 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Remove Item Row"
                    >
                      <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Submit Footer -->
        <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <button
            type="button"
            @click="showCreateSoModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSavingSo || createSoForm.items.length === 0"
            class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/20 transition active:scale-95"
          >
            <i class="fa-solid" :class="isSavingSo ? 'fa-spinner fa-spin' : 'fa-check'"></i>
            <span>{{ isSavingSo ? 'Creating Sales Order...' : 'Create Sales Order' }}</span>
          </button>
        </div>

      </form>

    </div>
  </div>

  <!-- MODAL 2: IMPORT SALES ORDERS (ODOO JSON / CSV / ODOO API) -->
  <div v-if="showImportSoModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
    <div class="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-slate-200 max-h-[90vh] overflow-y-auto custom-scroll">
      
      <!-- Header -->
      <div class="flex items-start justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <i class="fa-solid fa-cloud-arrow-down text-base"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Import Sales Orders</h3>
            <p class="text-xs text-slate-400">Ingest orders from Odoo webhook JSON payload, CSV spreadsheet, or live Odoo ERP API.</p>
          </div>
        </div>
        <button
          type="button"
          @click="showImportSoModal = false"
          class="text-slate-400 hover:text-white text-lg p-1"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="p-1 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-1">
        <button
          type="button"
          @click="importActiveTab = 'odoo-json'"
          :class="importActiveTab === 'odoo-json' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'"
          class="flex-1 py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <i class="fa-solid fa-code text-xs"></i>
          <span>Odoo JSON Payload</span>
        </button>

        <button
          type="button"
          @click="importActiveTab = 'csv'"
          :class="importActiveTab === 'csv' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'"
          class="flex-1 py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <i class="fa-solid fa-file-csv text-xs"></i>
          <span>CSV Spreadsheet</span>
        </button>

        <button
          type="button"
          @click="importActiveTab = 'odoo-api'"
          :class="importActiveTab === 'odoo-api' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'"
          class="flex-1 py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <i class="fa-solid fa-network-wired text-xs"></i>
          <span>Odoo Direct API Sync</span>
        </button>
      </div>

      <!-- TAB 1: ODOO JSON PAYLOAD -->
      <div v-show="importActiveTab === 'odoo-json'" class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold text-slate-300">
            Paste Raw Odoo JSON (Webhook or sale.order Export)
          </label>
          <button
            type="button"
            @click="loadSampleOdooJson"
            class="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline flex items-center gap-1"
          >
            <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
            <span>Load Sample JSON</span>
          </button>
        </div>

        <textarea
          v-model="odooJsonPayload"
          rows="8"
          placeholder='{\n  "name": "SO0042",\n  "partner_id": [14, "Customer Name"],\n  "order_line": [\n    { "default_code": "WSLRW-ATH", "item_code": "ITEM-001", "product_uom_qty": 50 }\n  ]\n}'
          class="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-indigo-500 outline-none custom-scroll"
        ></textarea>

        <!-- Preview Button & Parsed Summary -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="previewOdooJson"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <i class="fa-solid fa-magnifying-glass text-[10px]"></i>
            <span>Preview & Validate</span>
          </button>
        </div>

        <!-- Preview Box -->
        <div v-if="odooJsonPreview" class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-circle-check text-emerald-400"></i>
              <span>Parsed Odoo Order: <span class="font-mono text-sky-400">{{ odooJsonPreview.soCode }}</span></span>
            </span>
            <span class="text-slate-400 font-mono text-[11px]">
              Customer: <strong class="text-white">{{ odooJsonPreview.customer }}</strong>
            </span>
          </div>
          <div class="text-[11px] text-slate-400">
            Detected <strong class="text-white">{{ odooJsonPreview.lines.length }}</strong> order lines (total <strong class="text-amber-300">{{ odooJsonPreview.totalUnits }}</strong> units)
          </div>
          <div class="max-h-36 overflow-y-auto custom-scroll border border-slate-800 rounded-lg">
            <table class="w-full text-left text-[11px]">
              <thead class="bg-slate-900 text-slate-400 font-semibold">
                <tr>
                  <th class="py-1.5 px-2">Item Code</th>
                  <th class="py-1.5 px-2">SKU</th>
                  <th class="py-1.5 px-2">FW</th>
                  <th class="py-1.5 px-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40">
                <tr v-for="(line, lidx) in odooJsonPreview.lines" :key="lidx">
                  <td class="py-1 px-2 font-mono text-cyan-300">{{ line.itemCode }}</td>
                  <td class="py-1 px-2 font-mono text-purple-300">{{ line.sku }}</td>
                  <td class="py-1 px-2 font-mono text-indigo-300">{{ sanitizeFw(line.firmwareVersion) }}</td>
                  <td class="py-1 px-2 font-mono text-right text-white">{{ line.quantity }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="showImportSoModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitImportOdooJson"
            :disabled="isImportingSo || !odooJsonPayload.trim()"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition active:scale-95"
          >
            <i class="fa-solid" :class="isImportingSo ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'"></i>
            <span>{{ isImportingSo ? 'Importing...' : 'Import Odoo JSON' }}</span>
          </button>
        </div>
      </div>

      <!-- TAB 2: CSV SPREADSHEET BULK UPLOAD -->
      <div v-show="importActiveTab === 'csv'" class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold text-slate-300">
            CSV File Upload or Paste Raw CSV
          </label>
          <button
            type="button"
            @click="loadSampleCsv"
            class="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline flex items-center gap-1"
          >
            <i class="fa-solid fa-file-lines text-[10px]"></i>
            <span>Load Sample CSV</span>
          </button>
        </div>

        <!-- Drag & Drop / File Input Zone -->
        <div
          class="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center bg-slate-950/40 transition cursor-pointer"
          @click="clickCsvFileInput"
        >
          <input
            id="csv-file-input"
            type="file"
            accept=".csv,text/csv,text/plain"
            @change="onCsvFileSelected"
            class="hidden"
          />
          <i class="fa-solid fa-file-csv text-2xl text-emerald-400 mb-1"></i>
          <p class="text-xs font-semibold text-slate-300">Click to choose or drop a CSV file here</p>
          <p class="text-[10px] text-slate-500 mt-0.5">Columns: soCode, customer, orderDate, itemCode, sku, firmwareVersion, quantity, notes</p>
        </div>

        <!-- Raw CSV Textarea -->
        <div>
          <textarea
            v-model="csvContent"
            rows="6"
            placeholder="soCode,customer,orderDate,itemCode,sku,firmwareVersion,quantity,notes\nSO/2026/00001,Daviteq IoT,2026-09-20,ITEM-001,WSLRW-ATH,6,50,Lot 1"
            class="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-emerald-500 outline-none custom-scroll"
          ></textarea>
        </div>

        <!-- Options & Preview -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              v-model="csvOverwriteExisting"
              type="checkbox"
              class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <span>Overwrite existing Sales Orders if code matches</span>
          </label>

          <button
            type="button"
            @click="previewCsv"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <i class="fa-solid fa-magnifying-glass text-[10px]"></i>
            <span>Preview CSV Rows</span>
          </button>
        </div>

        <!-- CSV Preview Box -->
        <div v-if="csvPreviewRows.length > 0" class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="font-bold text-emerald-400 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check"></i>
              <span>Parsed {{ csvPreviewRows.length }} CSV rows</span>
            </span>
            <span class="text-[11px] text-slate-400 font-mono">
              Ready for import
            </span>
          </div>
          <div class="max-h-36 overflow-y-auto custom-scroll border border-slate-800 rounded-lg">
            <table class="w-full text-left text-[11px]">
              <thead class="bg-slate-900 text-slate-400 font-semibold">
                <tr>
                  <th class="py-1.5 px-2">SO Code</th>
                  <th class="py-1.5 px-2">Customer</th>
                  <th class="py-1.5 px-2">Item Code</th>
                  <th class="py-1.5 px-2">SKU</th>
                  <th class="py-1.5 px-2">FW</th>
                  <th class="py-1.5 px-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40">
                <tr v-for="(r, idx) in csvPreviewRows" :key="idx">
                  <td class="py-1 px-2 font-mono text-sky-400">{{ r.soCode }}</td>
                  <td class="py-1 px-2 text-slate-200">{{ r.customer || '—' }}</td>
                  <td class="py-1 px-2 font-mono text-cyan-300">{{ r.itemCode }}</td>
                  <td class="py-1 px-2 font-mono text-purple-300">{{ r.sku }}</td>
                  <td class="py-1 px-2 font-mono text-indigo-300">{{ sanitizeFw(r.firmwareVersion) }}</td>
                  <td class="py-1 px-2 font-mono text-right text-white">{{ r.quantity || 1 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="showImportSoModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitImportCsv"
            :disabled="isImportingSo || !csvContent.trim()"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <i class="fa-solid" :class="isImportingSo ? 'fa-spinner fa-spin' : 'fa-file-import'"></i>
            <span>{{ isImportingSo ? 'Importing...' : 'Import CSV' }}</span>
          </button>
        </div>
      </div>

      <!-- TAB 3: ODOO DIRECT API SYNC -->
      <div v-show="importActiveTab === 'odoo-api'" class="space-y-4">
        <p class="text-xs text-slate-400">
          Connect directly to your remote Odoo ERP system to synchronize Sales Orders and line items automatically.
        </p>

        <form @submit.prevent="submitSyncOdooApi" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Odoo Server URL</label>
              <input
                v-model="odooApiForm.url"
                type="url"
                placeholder="https://odoo.daviteq.com"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Database Name</label>
              <input
                v-model="odooApiForm.db"
                type="text"
                placeholder="daviteq_prod"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Username / Email</label>
              <input
                v-model="odooApiForm.username"
                type="text"
                placeholder="admin@daviteq.com"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">API Key / Password</label>
              <input
                v-model="odooApiForm.apiKey"
                type="password"
                placeholder="••••••••••••"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">
                Sales Order Code (Filter) <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="odooApiForm.soCode"
                required
                type="text"
                placeholder="SO0042"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-indigo-500 outline-none uppercase"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Odoo sale.order ID (Optional)</label>
              <input
                v-model.number="odooApiForm.odooId"
                type="number"
                placeholder="42"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="showImportSoModal = false"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isImportingSo"
              class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition active:scale-95"
            >
              <i class="fa-solid" :class="isImportingSo ? 'fa-spinner fa-spin' : 'fa-network-wired'"></i>
              <span>{{ isImportingSo ? 'Syncing from Odoo...' : 'Sync Odoo Order' }}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>

  <!-- MODAL 3: EDIT SALES ORDER & LINE ITEMS -->
  <div v-if="showEditSoModal && editingSo" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
    <div class="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-slate-200 max-h-[90vh] overflow-y-auto custom-scroll">
      
      <!-- Header -->
      <div class="flex items-start justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
            <i class="fa-solid fa-pen-to-square text-base"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Edit Sales Order: {{ editingSo.soCode }}</h3>
            <p class="text-xs text-slate-400">Update order metadata and manage line items.</p>
          </div>
        </div>
        <button
          type="button"
          @click="showEditSoModal = false"
          class="text-slate-400 hover:text-white text-lg p-1"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="submitEditSo" class="space-y-4">
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">SO Code</label>
            <input
              v-model="editSoForm.soCode"
              required
              type="text"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Customer</label>
            <input
              v-model="editSoForm.customer"
              type="text"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Status</label>
            <select
              v-model="editSoForm.status"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-sky-500 outline-none"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="IN_PRODUCTION">IN PRODUCTION</option>
              <option value="TESTING">TESTING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Notes</label>
          <input
            v-model="editSoForm.notes"
            type="text"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-sky-500 outline-none"
          />
        </div>

        <!-- Line Items in Edit Modal -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-boxes-stacked text-sky-400"></i>
                <span>Line Items ({{ editSoForm.items.length }})</span>
              </h4>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="openCatalogPickerModal"
                class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
                title="Select registered Item Codes from master catalog"
              >
                <i class="fa-solid fa-barcode text-[11px]"></i>
                <span>Pick from Catalog</span>
              </button>

              <button
                type="button"
                @click="addEditSoItemRow"
                class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
              >
                <i class="fa-solid fa-plus text-[10px]"></i>
                <span>Add Item Row</span>
              </button>
            </div>
          </div>

          <div class="border border-slate-800 rounded-xl overflow-x-auto custom-scroll bg-slate-950/60">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3 w-36">Item Code *</th>
                  <th class="py-2.5 px-3 w-36">SKU *</th>
                  <th class="py-2.5 px-3 w-20">FW</th>
                  <th class="py-2.5 px-3 w-32">SKU_FW</th>
                  <th class="py-2.5 px-3 w-20">Qty</th>
                  <th class="py-2.5 px-3">Linked Test Template</th>
                  <th class="py-2.5 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-for="(it, idx) in editSoForm.items" :key="idx" class="hover:bg-slate-800/30">
                  <td class="py-2 px-2.5">
                    <div class="relative flex items-center">
                      <input
                        v-model="it.itemCode"
                        required
                        type="text"
                        class="w-full pl-2.5 pr-7 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-sky-500 outline-none uppercase"
                      />
                      <button
                        type="button"
                        @click="openCatalogPickerForRow(idx, true)"
                        class="absolute right-1 text-slate-400 hover:text-cyan-300 p-1 transition cursor-pointer"
                        title="Pick Item Code from Catalog"
                      >
                        <i class="fa-solid fa-folder-open text-[11px]"></i>
                      </button>
                    </div>
                  </td>
                  <td class="py-2 px-2.5">
                    <input
                      v-model="it.sku"
                      @change="onSkuOrFwChange(it)"
                      required
                      type="text"
                      class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-sky-500 outline-none uppercase"
                    />
                  </td>
                  <td class="py-2 px-2.5">
                    <input
                      v-model="it.firmwareVersion"
                      @input="it.firmwareVersion = sanitizeFw(it.firmwareVersion); onSkuOrFwChange(it)"
                      type="text"
                      class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-sky-500 outline-none"
                    />
                  </td>
                  <td class="py-2 px-2.5 font-mono">
                    <span class="px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold text-[11px] inline-block">
                      {{ formatSkuFw(it.sku, it.firmwareVersion) }}
                    </span>
                  </td>
                  <td class="py-2 px-2.5">
                    <input
                      v-model.number="it.quantity"
                      type="number"
                      min="1"
                      class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-sky-500 outline-none text-right"
                    />
                  </td>
                  <td class="py-2 px-2.5">
                    <div class="flex items-center gap-1.5">
                      <select
                        v-model="it.templateId"
                        class="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-indigo-500 outline-none"
                      >
                        <option value="">(Auto-detect by SKU/FW)</option>
                        <option v-for="tpl in availableTestTemplates" :key="tpl.id" :value="tpl.id">
                          {{ tpl.name }} ({{ tpl.sku }}_{{ sanitizeFw(tpl.firmwareVersion) }})
                        </option>
                      </select>
                      <button
                        type="button"
                        @click="triggerAutoDetectTemplate(it)"
                        class="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs transition cursor-pointer"
                        title="Detect matching template from server"
                      >
                        <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                      </button>
                    </div>
                  </td>
                  <td class="py-2 px-2 text-center">
                    <button
                      type="button"
                      @click="removeEditSoItemRow(idx)"
                      class="p-1.5 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Remove Row"
                    >
                      <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <button
            type="button"
            @click="showEditSoModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSavingSo"
            class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/20 transition active:scale-95"
          >
            <i class="fa-solid" :class="isSavingSo ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
            <span>{{ isSavingSo ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>

      </form>

    </div>
  </div>

  <!-- MODAL 4: CONFIRM DELETE SALES ORDER -->
  <div v-if="showDeleteSoModal && soToDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-slate-200">
      <div class="flex items-start gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 text-lg flex-shrink-0 shadow-inner">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div class="space-y-1">
          <h3 class="text-base font-bold text-white">Delete Sales Order</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Are you sure you want to delete <strong class="text-rose-400 font-mono">{{ soToDelete.soCode }}</strong>?
            This will cascade and remove all associated Item Codes and test references.
          </p>
        </div>
      </div>

      <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-400">Customer:</span>
          <span class="text-white font-semibold">{{ soToDelete.customer || '—' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Total Items:</span>
          <span class="text-amber-300 font-mono">{{ (soToDelete.items && soToDelete.items.length) || soToDelete.itemsCount || 0 }} items</span>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-2">
        <button
          type="button"
          @click="showDeleteSoModal = false"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="confirmDeleteSo"
          :disabled="isDeletingSo"
          class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20 transition active:scale-95"
        >
          <i class="fa-solid" :class="isDeletingSo ? 'fa-spinner fa-spin' : 'fa-trash-can'"></i>
          <span>{{ isDeletingSo ? 'Deleting...' : 'Confirm Delete' }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 5: FULL SALES ORDER DETAILS INSPECTION DRAWER -->
  <div v-if="showSoDetailsModal && selectedSoDetails" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
    <div class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-slate-200 max-h-[90vh] overflow-y-auto custom-scroll">
      <div class="flex items-start justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
            <i class="fa-solid fa-circle-info text-base"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Sales Order Details: {{ selectedSoDetails.soCode }}</h3>
            <p class="text-xs text-slate-400 font-mono">ID: {{ selectedSoDetails.id }}</p>
          </div>
        </div>
        <button
          type="button"
          @click="showSoDetailsModal = false"
          class="text-slate-400 hover:text-white text-lg p-1"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Metadata Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <div class="text-[10px] text-slate-400 uppercase">Customer</div>
          <div class="text-xs font-bold text-white mt-0.5">{{ selectedSoDetails.customer || '—' }}</div>
        </div>
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <div class="text-[10px] text-slate-400 uppercase">Source</div>
          <div class="text-xs font-bold font-mono text-cyan-300 mt-0.5">{{ selectedSoDetails.source }}</div>
        </div>
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <div class="text-[10px] text-slate-400 uppercase">Status</div>
          <div class="text-xs font-bold uppercase mt-0.5" :class="getStatusTextColor(selectedSoDetails.status)">
            {{ selectedSoDetails.status }}
          </div>
        </div>
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <div class="text-[10px] text-slate-400 uppercase">Test Progress</div>
          <div class="text-xs font-bold font-mono text-emerald-400 mt-0.5">{{ selectedSoDetails.testProgress || 0 }}%</div>
        </div>
      </div>

      <!-- Item Codes Breakdown -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold text-white uppercase tracking-wider">Item Codes Breakdown</h4>
        <div class="border border-slate-800 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th class="py-2 px-3">Item Code</th>
                <th class="py-2 px-3">SKU</th>
                <th class="py-2 px-3">FW</th>
                <th class="py-2 px-3 text-right">Qty</th>
                <th class="py-2 px-3">Template</th>
                <th class="py-2 px-3 text-center">Tested / Pass / Fail</th>
                <th class="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50">
              <tr v-for="it in selectedSoDetails.items" :key="it.id || it.itemCode" class="hover:bg-slate-800/30">
                <td class="py-2 px-3 font-mono font-bold text-cyan-300">{{ it.itemCode }}</td>
                <td class="py-2 px-3 font-mono text-purple-300">{{ it.sku }}</td>
                <td class="py-2 px-3 font-mono text-indigo-300">{{ sanitizeFw(it.firmwareVersion) }}</td>
                <td class="py-2 px-3 font-mono text-right text-white">{{ it.quantity }}</td>
                <td class="py-2 px-3 text-[11px]">
                  <span v-if="it.template" class="text-indigo-300 font-mono">{{ it.template.name }}</span>
                  <span v-else class="text-slate-500 italic">None</span>
                </td>
                <td class="py-2 px-3 text-center font-mono text-[11px]">
                  {{ it.testedQuantity || 0 }} / <span class="text-emerald-400">{{ it.passedQuantity || 0 }}</span> / <span class="text-rose-400">{{ it.failedQuantity || 0 }}</span>
                </td>
                <td class="py-2 px-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" :class="getItemStatusBadgeClass(it.status)">
                    {{ it.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex items-center justify-end pt-2 border-t border-slate-800">
        <button
          type="button"
          @click="showSoDetailsModal = false"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 6: REAL-TIME ITEM TEST STATUS DIALOG -->
  <div v-if="showItemTestStatusModal && itemTestStatusData" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-slate-200">
      
      <!-- Header -->
      <div class="flex items-start justify-between border-b border-slate-800 pb-3.5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <i class="fa-solid fa-vial-circle-check text-base"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Item Test Progress</h3>
            <p class="text-xs text-slate-400 font-mono">
              SO: <strong class="text-sky-400">{{ itemTestStatusData.soCode }}</strong> | Item: <strong class="text-cyan-300">{{ itemTestStatusData.itemCode }}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="showItemTestStatusModal = false"
          class="text-slate-400 hover:text-white text-lg p-1"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Real-time Test Numbers -->
      <div class="grid grid-cols-3 gap-2.5">
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
          <div class="text-[10px] text-slate-400 uppercase">Target Qty</div>
          <div class="text-base font-bold font-mono text-white mt-0.5">{{ itemTestStatusData.targetQuantity }}</div>
        </div>
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
          <div class="text-[10px] text-slate-400 uppercase">Passed</div>
          <div class="text-base font-bold font-mono text-emerald-400 mt-0.5">{{ itemTestStatusData.passedQuantity }}</div>
        </div>
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
          <div class="text-[10px] text-slate-400 uppercase">Failed</div>
          <div class="text-base font-bold font-mono text-rose-400 mt-0.5">{{ itemTestStatusData.failedQuantity }}</div>
        </div>
      </div>

      <!-- Visual Progress Bar -->
      <div class="space-y-1.5 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-slate-300 font-semibold">Test Completion:</span>
          <span class="font-bold text-sky-400">{{ itemTestStatusData.progressPercentage }}%</span>
        </div>
        <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            class="h-full bg-emerald-500 transition-all duration-300"
            :style="{ width: ((itemTestStatusData.passedQuantity / (itemTestStatusData.targetQuantity || 1)) * 100) + '%' }"
          ></div>
          <div
            class="h-full bg-rose-500 transition-all duration-300"
            :style="{ width: ((itemTestStatusData.failedQuantity / (itemTestStatusData.targetQuantity || 1)) * 100) + '%' }"
          ></div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Tested: {{ itemTestStatusData.testedQuantity }} / {{ itemTestStatusData.targetQuantity }} units</span>
          <span class="uppercase font-semibold text-amber-300">{{ itemTestStatusData.itemStatus }}</span>
        </div>
      </div>

      <!-- Linked Test Template / Session Info -->
      <div class="space-y-2 text-xs">
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-medium">Test Template:</span>
            <span v-if="itemTestStatusData.testTemplate" class="font-mono text-indigo-300 font-semibold">
              {{ itemTestStatusData.testTemplate.name }} ({{ itemTestStatusData.testTemplate.code }})
            </span>
            <span v-else class="text-amber-400 italic">No template linked</span>
          </div>

          <div v-if="itemTestStatusData.testSession" class="flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span class="text-slate-400 font-medium">Test Session:</span>
            <span class="font-mono text-sky-300 font-semibold">
              {{ itemTestStatusData.testSession.sessionCode }} ({{ itemTestStatusData.testSession.status }})
            </span>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <a
          href="/dashboard#test-automation"
          target="_blank"
          class="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
          title="Open Factory Test Workbench in D-Module"
        >
          <i class="fa-solid fa-vial-circle-check text-[10px]"></i>
          <span>Open in Test Workbench</span>
        </a>

        <button
          v-if="itemTestStatusData.testTemplate"
          type="button"
          @click="navigateToTestBuilder(itemTestStatusData.testTemplate.id)"
          class="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
        >
          <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          <span>Open in Test Builder</span>
        </button>

        <button
          type="button"
          @click="showItemTestStatusModal = false"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
        >
          Close
        </button>
      </div>

    </div>
  </div>

  <!-- MODAL: ITEM CODE CATALOG PICKER FOR SALES ORDERS -->
  <div
    v-if="showCatalogPickerModal"
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    @click.self="showCatalogPickerModal = false"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 animate-scale-in">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <i class="fa-solid fa-barcode text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Select Item Codes from Catalog</h3>
            <p class="text-[11px] text-slate-400">Attach existing catalog items with standardized SKU_FW and pre-mapped test templates.</p>
          </div>
        </div>
        <button
          type="button"
          @click="showCatalogPickerModal = false"
          class="text-slate-400 hover:text-white text-xs p-1"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Search Toolbar -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none"></i>
          <input
            v-model="catalogPickerSearch"
            type="text"
            placeholder="Search by Item Code, SKU, SKU_FW (e.g. WSLRW-ATH_6)..."
            class="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-indigo-500 outline-none"
          />
        </div>
        <button
          type="button"
          @click="fetchCatalogItemsForPicker"
          class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer"
          title="Refresh catalog items"
        >
          <i class="fa-solid fa-arrows-rotate"></i>
        </button>
        <button
          type="button"
          @click="openQuickCreateItemCodeModal"
          class="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/20 transition active:scale-95 whitespace-nowrap"
          title="Register a new Item Code into catalog"
        >
          <i class="fa-solid fa-plus text-xs"></i>
          <span>+ Create Item Code</span>
        </button>
      </div>

      <!-- Items Table List -->
      <div class="max-h-72 overflow-y-auto custom-scroll border border-slate-800 rounded-xl bg-slate-950/60">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
            <tr>
              <th class="py-2.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  @change="toggleSelectAllCatalogItems"
                  :checked="isAllCatalogSelected"
                  class="rounded bg-slate-900 border-slate-700 text-indigo-600"
                />
              </th>
              <th class="py-2.5 px-3">Item Code</th>
              <th class="py-2.5 px-3">SKU</th>
              <th class="py-2.5 px-3">FW</th>
              <th class="py-2.5 px-3">SKU_FW</th>
              <th class="py-2.5 px-3">Default Template</th>
              <th class="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="filteredCatalogForPicker.length === 0">
              <td colspan="7" class="py-8 text-center text-slate-400">
                <div class="space-y-2">
                  <p class="text-xs text-slate-400">No items match your search in the catalog.</p>
                  <button
                    type="button"
                    @click="openQuickCreateItemCodeModal"
                    class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <i class="fa-solid fa-plus text-xs"></i>
                    <span>+ Create New Item Code</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr
              v-for="catItem in filteredCatalogForPicker"
              :key="catItem.itemCode"
              class="hover:bg-slate-800/40 transition cursor-pointer"
              @click="toggleCatalogItemSelection(catItem)"
            >
              <td class="py-2.5 px-3 text-center" @click.stop>
                <input
                  type="checkbox"
                  :value="catItem.itemCode"
                  v-model="selectedCatalogItemCodes"
                  class="rounded bg-slate-900 border-slate-700 text-indigo-600"
                />
              </td>
              <td class="py-2.5 px-3 font-mono font-bold text-cyan-300">
                {{ catItem.itemCode }}
              </td>
              <td class="py-2.5 px-3 font-mono text-purple-300 font-semibold">
                {{ catItem.sku }}
              </td>
              <td class="py-2.5 px-3 font-mono text-indigo-300">
                {{ sanitizeFw(catItem.firmwareVersion) }}
              </td>
              <td class="py-2.5 px-3 font-mono">
                <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold text-[11px]">
                  {{ formatSkuFw(catItem.sku, catItem.firmwareVersion) }}
                </span>
              </td>
              <td class="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                {{ catItem.templateName || (catItem.template && catItem.template.name) || '—' }}
              </td>
              <td class="py-2.5 px-3 text-right" @click.stop>
                <button
                  type="button"
                  @click="attachSingleCatalogItem(catItem)"
                  class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition cursor-pointer"
                >
                  Attach
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-slate-800">
        <div class="text-xs text-slate-400 font-mono">
          <span class="text-indigo-400 font-bold">{{ selectedCatalogItemCodes.length }}</span> items selected
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="showCatalogPickerModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="attachSelectedCatalogItems"
            :disabled="selectedCatalogItemCodes.length === 0"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow transition disabled:opacity-50"
          >
            Attach Selected ({{ selectedCatalogItemCodes.length }})
          </button>
        </div>
      </div>

    </div>
  </div>

  <!-- MODAL: QUICK CREATE ITEM CODE FROM SALES ORDER PICKER -->
  <div
    v-if="showQuickCreateItemModal"
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    @click.self="showQuickCreateItemModal = false"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-in">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
            <i class="fa-solid fa-barcode text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Create New Master Item Code</h3>
            <p class="text-[11px] text-slate-400">Register into catalog and automatically attach to this Sales Order.</p>
          </div>
        </div>
        <button
          type="button"
          @click="showQuickCreateItemModal = false"
          class="text-slate-400 hover:text-white text-xs p-1"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <form @submit.prevent="submitQuickCreateItemCode" class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Item Code *</label>
            <input
              v-model="quickCreateItemForm.itemCode"
              required
              type="text"
              placeholder="e.g. ITEM-005"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500 outline-none uppercase"
            />
          </div>
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Device SKU *</label>
            <input
              v-model="quickCreateItemForm.sku"
              required
              type="text"
              placeholder="e.g. WSLRW-ATH"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500 outline-none uppercase"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Firmware Version *</label>
            <input
              v-model="quickCreateItemForm.firmwareVersion"
              @input="quickCreateItemForm.firmwareVersion = sanitizeFw(quickCreateItemForm.firmwareVersion)"
              required
              type="text"
              placeholder="e.g. 6 or 1.4"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-slate-300 font-semibold mb-1">SKU_FW (Standard)</label>
            <div class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-300 font-bold">
              {{ formatSkuFw(quickCreateItemForm.sku, quickCreateItemForm.firmwareVersion) || '—' }}
            </div>
          </div>
        </div>

        <div>
          <label class="block text-slate-300 font-semibold mb-1">Default Test Template</label>
          <select
            v-model="quickCreateItemForm.templateId"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-500 outline-none"
          >
            <option value="">(None - Select or assign later)</option>
            <option v-for="tpl in availableTestTemplates" :key="tpl.id" :value="tpl.id">
              {{ tpl.name }} ({{ tpl.sku }}_{{ sanitizeFw(tpl.firmwareVersion) }})
            </option>
          </select>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            @click="switchToCatalogTab"
            class="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
          >
            Open Full Item Codes Catalog &rarr;
          </button>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="showQuickCreateItemModal = false"
              class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSavingCatalogItemInSo"
              class="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <i v-if="isSavingCatalogItemInSo" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <span>Create &amp; Attach</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
`;

export const SALES_ORDERS_SCRIPT = `
  function useSalesOrdersModule(sharedCtx) {
    const { ref, computed, nextTick, watch, onMounted } = Vue;
    const { showToast, authHeaders, currentUser, activeTab, switchTab, activeTestTemplateId } = sharedCtx;

    const credentials = () => {
      return typeof authHeaders === 'function' ? authHeaders() : (authHeaders.value || {});
    };

    // State Variables
    const salesOrdersList = ref([]);
    const soLoading = ref(false);
    const soSearchQuery = ref('');
    const soStatusFilter = ref('ALL');
    const soSourceFilter = ref('ALL');
    const soTableViewMode = ref('reactive'); // 'reactive' | 'tabulator'
    const expandedSoIds = ref([]);
    const availableTestTemplates = ref([]);

    const soPagination = ref({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });

    // Modals
    const showCreateSoModal = ref(false);
    const showEditSoModal = ref(false);
    const showDeleteSoModal = ref(false);
    const showImportSoModal = ref(false);
    const showSoDetailsModal = ref(false);
    const showItemTestStatusModal = ref(false);

    const isSavingSo = ref(false);
    const isImportingSo = ref(false);
    const isDeletingSo = ref(false);

    const editingSo = ref(null);
    const soToDelete = ref(null);
    const selectedSoDetails = ref(null);
    const itemTestStatusData = ref(null);

    // Create SO Form
    const createSoForm = ref({
      soCode: '',
      customer: '',
      orderDate: new Date().toISOString().substring(0, 10),
      status: 'DRAFT',
      source: 'MANUAL',
      notes: '',
      items: [
        {
          itemCode: 'ITEM-001',
          sku: 'WSLRW-ATH',
          firmwareVersion: '1.4',
          quantity: 10,
          templateId: '',
          notes: ''
        }
      ]
    });

    // Edit SO Form
    const editSoForm = ref({
      id: '',
      soCode: '',
      customer: '',
      status: 'DRAFT',
      notes: '',
      items: []
    });

    // Import State
    const importActiveTab = ref('odoo-json');
    const odooJsonPayload = ref('');
    const odooJsonPreview = ref(null);
    const csvContent = ref('');
    const csvOverwriteExisting = ref(false);
    const csvPreviewRows = ref([]);
    const odooApiForm = ref({
      url: 'https://odoo.daviteq.com',
      db: 'daviteq_prod',
      username: '',
      apiKey: '',
      soCode: '',
      odooId: null
    });

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

    // Helper: normalize SO Code to SO/YYYY/xxxxx format
    const normalizeSoCode = (rawSoCode, defaultYear = 2026) => {
      const trimmed = (rawSoCode || '').trim();
      if (!trimmed) return trimmed;
      const standardMatch = trimmed.match(/^SO\\/(\\d{4})\\/([A-Za-z0-9_-]+)$/i);
      if (standardMatch) {
        return 'SO/' + standardMatch[1] + '/' + standardMatch[2];
      }
      const hyphenMatch = trimmed.match(/^SO-(\\d{4})-(\\d+)$/i);
      if (hyphenMatch) {
        const year = hyphenMatch[1];
        const seq = hyphenMatch[2].padStart(5, '0');
        return 'SO/' + year + '/' + seq;
      }
      const odooMatch = trimmed.match(/^SO-?0*(\\d+)$/i);
      if (odooMatch) {
        const seq = odooMatch[1].padStart(5, '0');
        return 'SO/' + defaultYear + '/' + seq;
      }
      return trimmed;
    };

    // Catalog Picker State for SO line items
    const showCatalogPickerModal = ref(false);
    const catalogPickerSearch = ref('');
    const selectedCatalogItemCodes = ref([]);
    const catalogItemsCache = ref([]);
    const catalogPickerTargetRow = ref(-1);
    const catalogPickerIsEdit = ref(false);

    const getCatalogFallbackSeed = () => [
      {
        itemCode: 'ITEM-001',
        sku: 'WSLRW-ATH',
        firmwareVersion: '6',
        skuFw: 'WSLRW-ATH_6',
        templateName: 'WSLRW-ATH Standard Sensor Scenario',
        defaultTemplateId: '',
        description: 'Daviteq Ambient Temperature & Humidity sensor'
      },
      {
        itemCode: 'ITEM-002',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1.4',
        skuFw: 'WSLRW-ATH_1.4',
        templateName: 'WSLRW-ATH Standard Sensor Scenario',
        defaultTemplateId: '',
        description: 'Daviteq ATH sensor legacy firmware'
      },
      {
        itemCode: 'ITEM-003',
        sku: 'WSL-MOD',
        firmwareVersion: '2.1',
        skuFw: 'WSL-MOD_2.1',
        templateName: 'Modbus RS485 Master Suite',
        defaultTemplateId: '',
        description: 'Wireless Modbus RS485 Master'
      },
      {
        itemCode: 'ITEM-004',
        sku: 'WSL-RTD',
        firmwareVersion: '1',
        skuFw: 'WSL-RTD_1',
        templateName: 'RTD Temperature Transmitter Scenario',
        defaultTemplateId: '',
        description: 'Wireless RTD Transmitter'
      }
    ];

    const fetchCatalogItemsForPicker = async () => {
      try {
        const endpoints = ['/api/c-modules/item-codes/picker', '/api/c-modules/item-codes', '/api/item-codes'];
        let loaded = false;
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, { headers: credentials() });
            if (res.ok) {
              const data = await res.json();
              const list = Array.isArray(data) ? data : (data.data || data.items || []);
              if (list.length > 0) {
                catalogItemsCache.value = list.map(it => ({
                  ...it,
                  firmwareVersion: sanitizeFw(it.firmwareVersion || it.firmware_version),
                  skuFw: it.skuFw || it.sku_fw || formatSkuFw(it.sku, it.firmwareVersion || it.firmware_version)
                }));
                loaded = true;
                break;
              }
            }
          } catch(e) {}
        }
        if (!loaded && catalogItemsCache.value.length === 0) {
          catalogItemsCache.value = getCatalogFallbackSeed();
        }
      } catch (e) {
        if (catalogItemsCache.value.length === 0) {
          catalogItemsCache.value = getCatalogFallbackSeed();
        }
      }
    };

    const filteredCatalogForPicker = computed(() => {
      let list = catalogItemsCache.value || [];
      const q = (catalogPickerSearch.value || '').trim().toLowerCase();
      if (q) {
        list = list.filter(it =>
          (it.itemCode || '').toLowerCase().includes(q) ||
          (it.sku || '').toLowerCase().includes(q) ||
          (it.skuFw || '').toLowerCase().includes(q) ||
          (it.templateName || '').toLowerCase().includes(q) ||
          (it.description || '').toLowerCase().includes(q)
        );
      }
      return list;
    });

    const isAllCatalogSelected = computed(() => {
      const filtered = filteredCatalogForPicker.value;
      if (filtered.length === 0) return false;
      return filtered.every(it => selectedCatalogItemCodes.value.includes(it.itemCode));
    });

    const toggleSelectAllCatalogItems = () => {
      const filtered = filteredCatalogForPicker.value;
      if (isAllCatalogSelected.value) {
        selectedCatalogItemCodes.value = [];
      } else {
        selectedCatalogItemCodes.value = filtered.map(it => it.itemCode);
      }
    };

    const toggleCatalogItemSelection = (catItem) => {
      const idx = selectedCatalogItemCodes.value.indexOf(catItem.itemCode);
      if (idx === -1) {
        selectedCatalogItemCodes.value.push(catItem.itemCode);
      } else {
        selectedCatalogItemCodes.value.splice(idx, 1);
      }
    };

    const openCatalogPickerModal = () => {
      catalogPickerTargetRow.value = -1;
      catalogPickerIsEdit.value = false;
      selectedCatalogItemCodes.value = [];
      catalogPickerSearch.value = '';
      showCatalogPickerModal.value = true;
      fetchCatalogItemsForPicker();
    };

    const openCatalogPickerForRow = (rowIndex, isEdit = false) => {
      catalogPickerTargetRow.value = rowIndex;
      catalogPickerIsEdit.value = isEdit;
      selectedCatalogItemCodes.value = [];
      catalogPickerSearch.value = '';
      showCatalogPickerModal.value = true;
      fetchCatalogItemsForPicker();
    };

    const attachSingleCatalogItem = (catItem) => {
      const cleanFw = sanitizeFw(catItem.firmwareVersion);
      if (catalogPickerTargetRow.value >= 0) {
        const targetList = catalogPickerIsEdit.value ? editSoForm.value.items : createSoForm.value.items;
        if (targetList[catalogPickerTargetRow.value]) {
          targetList[catalogPickerTargetRow.value].itemCode = catItem.itemCode;
          targetList[catalogPickerTargetRow.value].sku = catItem.sku;
          targetList[catalogPickerTargetRow.value].firmwareVersion = cleanFw;
          targetList[catalogPickerTargetRow.value].templateId = catItem.defaultTemplateId || catItem.templateId || '';
          if (catItem.description && !targetList[catalogPickerTargetRow.value].notes) {
            targetList[catalogPickerTargetRow.value].notes = catItem.description;
          }
        }
      } else {
        const targetList = catalogPickerIsEdit.value ? editSoForm.value.items : createSoForm.value.items;
        targetList.push({
          itemCode: catItem.itemCode,
          sku: catItem.sku,
          firmwareVersion: cleanFw,
          quantity: 1,
          templateId: catItem.defaultTemplateId || catItem.templateId || '',
          notes: catItem.description || ''
        });
      }
      showToast('Attached ' + catItem.itemCode + ' (' + formatSkuFw(catItem.sku, cleanFw) + ')', 'success');
      showCatalogPickerModal.value = false;
    };

    const attachSelectedCatalogItems = () => {
      const selected = catalogItemsCache.value.filter(it => selectedCatalogItemCodes.value.includes(it.itemCode));
      if (selected.length === 0) return;
      const targetList = catalogPickerIsEdit.value ? editSoForm.value.items : createSoForm.value.items;
      selected.forEach(catItem => {
        const cleanFw = sanitizeFw(catItem.firmwareVersion);
        targetList.push({
          itemCode: catItem.itemCode,
          sku: catItem.sku,
          firmwareVersion: cleanFw,
          quantity: 1,
          templateId: catItem.defaultTemplateId || catItem.templateId || '',
          notes: catItem.description || ''
        });
      });
      showToast('Attached ' + selected.length + ' item(s) from catalog', 'success');
      showCatalogPickerModal.value = false;
    };

    // Quick Create Item Code Modal inside Sales Orders
    const showQuickCreateItemModal = ref(false);
    const isSavingCatalogItemInSo = ref(false);
    const quickCreateItemForm = ref({
      itemCode: '',
      sku: 'WSLRW-ATH',
      firmwareVersion: '6',
      templateId: '',
      description: ''
    });

    const openQuickCreateItemCodeModal = () => {
      const searchSeed = (catalogPickerSearch.value || '').trim();
      quickCreateItemForm.value = {
        itemCode: searchSeed.toUpperCase().startsWith('ITEM-') ? searchSeed.toUpperCase() : ('ITEM-' + Math.floor(100 + Math.random() * 900)),
        sku: 'WSLRW-ATH',
        firmwareVersion: '6',
        templateId: availableTestTemplates.value[0]?.id || '',
        description: ''
      };
      showQuickCreateItemModal.value = true;
    };

    const switchToCatalogTab = () => {
      showQuickCreateItemModal.value = false;
      showCatalogPickerModal.value = false;
      if (typeof switchTab === 'function') {
        switchTab('item-codes');
      }
    };

    const submitQuickCreateItemCode = async () => {
      if (!quickCreateItemForm.value.itemCode.trim()) {
        showToast('Item Code is required', 'error');
        return;
      }
      if (!quickCreateItemForm.value.sku.trim()) {
        showToast('SKU is required', 'error');
        return;
      }
      isSavingCatalogItemInSo.value = true;
      const cleanFw = sanitizeFw(quickCreateItemForm.value.firmwareVersion);
      const sku = quickCreateItemForm.value.sku.trim().toUpperCase();
      const skuFw = formatSkuFw(sku, cleanFw);
      const tplId = quickCreateItemForm.value.templateId || null;
      const matchedTpl = tplId ? availableTestTemplates.value.find(t => t.id === tplId) : null;
      const payload = {
        itemCode: quickCreateItemForm.value.itemCode.trim().toUpperCase(),
        sku,
        firmwareVersion: cleanFw,
        skuFw,
        defaultTemplateId: tplId,
        description: quickCreateItemForm.value.description?.trim() || null,
        isActive: true
      };

      try {
        let createdItem = null;
        const endpoints = ['/api/c-modules/item-codes', '/api/item-codes'];
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, {
              method: 'POST',
              headers: credentials(),
              body: JSON.stringify(payload)
            });
            if (res.ok) {
              createdItem = await res.json();
              break;
            }
          } catch(e) {}
        }
        if (!createdItem) {
          createdItem = {
            id: 'item-' + Date.now(),
            ...payload,
            defaultTemplateId: tplId || '',
            templateName: matchedTpl ? matchedTpl.name : ''
          };
        }

        const pickerItem = {
          itemCode: createdItem.itemCode,
          sku: createdItem.sku,
          firmwareVersion: cleanFw,
          skuFw,
          defaultTemplateId: tplId || '',
          templateName: matchedTpl ? matchedTpl.name : ''
        };

        catalogItemsCache.value.unshift(pickerItem);

        attachSingleCatalogItem(pickerItem);
        showQuickCreateItemModal.value = false;
        showCatalogPickerModal.value = false;
        showToast('Item Code created and attached: ' + pickerItem.itemCode, 'success');
      } catch (err) {
        showToast('Failed to create Item Code', 'error');
      } finally {
        isSavingCatalogItemInSo.value = false;
      }
    };

    // Tabulator Instance
    let soTabulatorInstance = null;

    // Computed Stats
    const soStats = computed(() => {
      const list = salesOrdersList.value;
      let totalItems = 0;
      let totalUnits = 0;
      let testedUnits = 0;
      let passedUnits = 0;

      list.forEach(so => {
        const items = so.items || [];
        totalItems += items.length || so.itemsCount || 0;
        const soTotalUnits = so.totalQuantity || items.reduce((a, b) => a + (b.quantity || 0), 0);
        totalUnits += soTotalUnits;
        testedUnits += so.testedQuantity || items.reduce((a, b) => a + (b.testedQuantity || 0), 0);
        passedUnits += so.passedQuantity || items.reduce((a, b) => a + (b.passedQuantity || 0), 0);
      });

      const passRate = testedUnits > 0 ? Math.round((passedUnits / testedUnits) * 100) : 100;
      return { totalItems, totalUnits, testedUnits, passedUnits, passRate };
    });

    // Helper functions
    const isSoExpanded = (id) => expandedSoIds.value.includes(id);

    const toggleSoExpand = (id) => {
      const idx = expandedSoIds.value.indexOf(id);
      if (idx === -1) {
        expandedSoIds.value.push(id);
      } else {
        expandedSoIds.value.splice(idx, 1);
      }
    };

    const formatDate = (val) => {
      if (!val) return '—';
      try {
        return new Date(val).toISOString().substring(0, 10);
      } catch (e) {
        return val;
      }
    };

    const formatDateTime = (val) => {
      if (!val) return '—';
      try {
        const d = new Date(val);
        return d.toISOString().replace('T', ' ').substring(0, 16);
      } catch (e) {
        return val;
      }
    };

    const calculateTotalQuantity = (so) => {
      if (typeof so.totalQuantity === 'number') return so.totalQuantity;
      const items = so.items || [];
      return items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
    };

    const calculateProgress = (so) => {
      if (typeof so.testProgress === 'number') return so.testProgress;
      const total = calculateTotalQuantity(so);
      const tested = so.testedQuantity || 0;
      return total > 0 ? Math.min(100, Math.round((tested / total) * 100)) : 0;
    };

    const getStatusBadgeClass = (status) => {
      switch (status) {
        case 'COMPLETED':
          return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
        case 'TESTING':
          return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25';
        case 'IN_PRODUCTION':
          return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
        case 'CONFIRMED':
          return 'bg-sky-500/10 text-sky-400 border-sky-500/25';
        case 'CANCELLED':
          return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
        default:
          return 'bg-slate-800 text-slate-300 border-slate-700';
      }
    };

    const getStatusDotClass = (status) => {
      switch (status) {
        case 'COMPLETED': return 'bg-emerald-400';
        case 'TESTING': return 'bg-indigo-400 animate-pulse';
        case 'IN_PRODUCTION': return 'bg-amber-400';
        case 'CONFIRMED': return 'bg-sky-400';
        case 'CANCELLED': return 'bg-rose-400';
        default: return 'bg-slate-400';
      }
    };

    const getStatusTextColor = (status) => {
      switch (status) {
        case 'COMPLETED': return 'text-emerald-400';
        case 'TESTING': return 'text-indigo-400';
        case 'IN_PRODUCTION': return 'text-amber-400';
        case 'CONFIRMED': return 'text-sky-400';
        case 'CANCELLED': return 'text-rose-400';
        default: return 'text-slate-300';
      }
    };

    const getItemStatusBadgeClass = (status) => {
      switch (status) {
        case 'PASSED':
          return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
        case 'FAILED':
          return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
        case 'TESTING':
          return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25';
        default:
          return 'bg-slate-800 text-slate-400 border-slate-700';
      }
    };

    const getSourceBadgeClass = (source) => {
      switch (source) {
        case 'ODOO':
          return 'bg-purple-500/10 text-purple-300 border-purple-500/25';
        case 'CSV':
        case 'EXCEL':
          return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
        case 'API':
          return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25';
        default:
          return 'bg-sky-500/10 text-sky-300 border-sky-500/25';
      }
    };

    const getSourceIcon = (source) => {
      switch (source) {
        case 'ODOO': return 'fa-solid fa-shapes';
        case 'CSV':
        case 'EXCEL': return 'fa-solid fa-file-excel';
        case 'API': return 'fa-solid fa-network-wired';
        default: return 'fa-solid fa-user-pen';
      }
    };

    // View switcher
    const setSoViewMode = (mode) => {
      soTableViewMode.value = mode;
      if (mode === 'tabulator') {
        nextTick(() => {
          initSoTabulator();
        });
      }
    };

    // Tabulator Table Initialization
    const initSoTabulator = () => {
      const container = document.getElementById('so-tabulator-table');
      if (!container || typeof Tabulator === 'undefined') return;

      if (soTabulatorInstance) {
        try {
          soTabulatorInstance.destroy();
        } catch (e) {}
        soTabulatorInstance = null;
      }

      container.innerHTML = '';

      soTabulatorInstance = new Tabulator(container, {
        data: salesOrdersList.value,
        layout: 'fitColumns',
        height: '480px',
        placeholder: 'No sales orders found',
        columns: [
          {
            title: 'SO Code',
            field: 'soCode',
            formatter: (cell) => {
              const d = cell.getData();
              return '<span class="font-mono font-bold text-sky-400">' + cell.getValue() + '</span>' + (d.odooId ? ' <span class="text-purple-400 text-[10px]">(#' + d.odooId + ')</span>' : '');
            }
          },
          { title: 'Customer', field: 'customer', formatter: (cell) => '<span class="font-semibold text-white">' + (cell.getValue() || '—') + '</span>' },
          {
            title: 'Order Date',
            field: 'orderDate',
            formatter: (cell) => '<span class="font-mono text-slate-300">' + formatDate(cell.getValue()) + '</span>'
          },
          {
            title: 'Source',
            field: 'source',
            formatter: (cell) => '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">' + cell.getValue() + '</span>'
          },
          {
            title: 'Status',
            field: 'status',
            formatter: (cell) => {
              const v = cell.getValue();
              return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' + getStatusBadgeClass(v) + '">' + v + '</span>';
            }
          },
          {
            title: 'Items',
            field: 'itemsCount',
            formatter: (cell) => {
              const d = cell.getData();
              const cnt = (d.items && d.items.length) || d.itemsCount || 0;
              return '<span class="font-mono text-slate-200 font-bold">' + cnt + ' items (' + calculateTotalQuantity(d) + ' units)</span>';
            }
          },
          {
            title: 'Progress',
            field: 'testProgress',
            formatter: (cell) => {
              const d = cell.getData();
              const pct = d.testProgress || calculateProgress(d);
              return '<div class="w-full">' +
                '<div class="flex justify-between text-[10px] font-mono mb-1"><span>' + pct + '%</span><span>P:' + (d.passedQuantity || 0) + ' F:' + (d.failedQuantity || 0) + '</span></div>' +
                '<div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div class="bg-emerald-500 h-full" style="width:' + pct + '%"></div></div>' +
              '</div>';
            }
          },
          {
            title: 'Actions',
            formatter: (cell) => {
              return '<button class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold cursor-pointer">View Items</button>';
            },
            cellClick: (e, cell) => {
              const data = cell.getData();
              openSoDetails(data);
            }
          }
        ]
      });
    };

    // Fetch Sales Orders
    const fetchSalesOrders = async () => {
      soLoading.value = true;
      try {
        let url = '/api/sales-orders?page=' + soPagination.value.page + '&limit=' + soPagination.value.limit;
        if (soSearchQuery.value.trim()) {
          url += '&search=' + encodeURIComponent(soSearchQuery.value.trim());
        }
        if (soStatusFilter.value !== 'ALL') {
          url += '&status=' + encodeURIComponent(soStatusFilter.value);
        }
        if (soSourceFilter.value !== 'ALL') {
          url += '&source=' + encodeURIComponent(soSourceFilter.value);
        }

        const res = await fetch(url, { headers: credentials() });
        if (res.ok) {
          const result = await res.json();
          salesOrdersList.value = result.data || [];
          soPagination.value.total = result.total || 0;
          soPagination.value.totalPages = result.totalPages || 1;

          if (soTableViewMode.value === 'tabulator') {
            nextTick(() => {
              if (soTabulatorInstance) {
                soTabulatorInstance.setData(salesOrdersList.value);
              } else {
                initSoTabulator();
              }
            });
          }
        } else {
          console.error('Failed to load sales orders:', res.statusText);
        }
      } catch (err) {
        console.error('Error fetching sales orders:', err);
      } finally {
        soLoading.value = false;
      }
    };

    let searchTimer = null;
    const onSoSearch = () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        soPagination.value.page = 1;
        fetchSalesOrders();
      }, 300);
    };

    const changeSoPage = (newPage) => {
      if (newPage < 1 || newPage > soPagination.value.totalPages) return;
      soPagination.value.page = newPage;
      fetchSalesOrders();
    };

    // Fetch Test Templates for Dropdown
    const fetchAvailableTemplatesForDropdown = async () => {
      try {
        const res = await fetch('/api/c-modules/test-builder/templates', { headers: credentials() });
        if (res.ok) {
          const list = await res.json();
          availableTestTemplates.value = Array.isArray(list) ? list : [];
        }
      } catch (e) {
        console.warn('Failed to load test templates for SO dropdown:', e);
      }
    };

    // Auto-detect template by SKU and FW
    const triggerAutoDetectTemplate = async (itemRow) => {
      if (!itemRow.sku) {
        showToast('Please enter device SKU first', 'error');
        return;
      }
      try {
        const url = '/api/sales-orders/mapping/test-template?sku=' + encodeURIComponent(itemRow.sku.trim()) +
          (itemRow.firmwareVersion ? '&firmwareVersion=' + encodeURIComponent(itemRow.firmwareVersion.trim()) : '');
        const res = await fetch(url, { headers: credentials() });
        if (res.ok) {
          const data = await res.json();
          if (data.matched && data.template) {
            itemRow.templateId = data.template.id;
            showToast('Matched: ' + data.template.name + ' (' + data.template.code + ')', 'success');
          } else {
            showToast(data.reason || 'No matching test template found', 'info');
          }
        }
      } catch (e) {
        showToast('Error querying template: ' + e.message, 'error');
      }
    };

    const onSkuOrFwChange = (itemRow) => {
      if (itemRow.sku && !itemRow.templateId) {
        triggerAutoDetectTemplate(itemRow);
      }
    };

    // Auto-resolve template for existing item
    const autoResolveItemTemplate = async (so, item) => {
      try {
        const url = '/api/sales-orders/mapping/test-template?sku=' + encodeURIComponent(item.sku) +
          (item.firmwareVersion ? '&firmwareVersion=' + encodeURIComponent(item.firmwareVersion) : '');
        const res = await fetch(url, { headers: credentials() });
        if (res.ok) {
          const data = await res.json();
          if (data.matched && data.template) {
            // Update item template in backend
            const updateRes = await fetch('/api/sales-orders/' + so.id, {
              method: 'PUT',
              headers: credentials(),
              body: JSON.stringify({
                items: [
                  {
                    id: item.id,
                    templateId: data.template.id
                  }
                ]
              })
            });
            if (updateRes.ok) {
              item.template = data.template;
              item.templateId = data.template.id;
              showToast('Template mapped: ' + data.template.name, 'success');
            }
          } else {
            showToast('No active test template found for SKU ' + item.sku, 'info');
          }
        }
      } catch (e) {
        showToast('Template match failed: ' + e.message, 'error');
      }
    };

    // Create SO Modal Handlers
    const openCreateSoModal = () => {
      const year = new Date().getFullYear();
      const seq = String(Math.floor(1 + Math.random() * 99999)).padStart(5, '0');
      createSoForm.value = {
        soCode: 'SO/' + year + '/' + seq,
        customer: '',
        orderDate: new Date().toISOString().substring(0, 10),
        status: 'DRAFT',
        source: 'MANUAL',
        notes: '',
        items: [
          {
            itemCode: 'ITEM-001',
            sku: 'WSLRW-ATH',
            firmwareVersion: '6',
            quantity: 10,
            templateId: '',
            notes: ''
          }
        ]
      };
      showCreateSoModal.value = true;
      fetchAvailableTemplatesForDropdown();
    };

    const addCreateSoItemRow = () => {
      const nextIdx = createSoForm.value.items.length + 1;
      const padded = nextIdx < 10 ? '00' + nextIdx : (nextIdx < 100 ? '0' + nextIdx : '' + nextIdx);
      createSoForm.value.items.push({
        itemCode: 'ITEM-' + padded,
        sku: 'WSLRW-ATH',
        firmwareVersion: '6',
        quantity: 1,
        templateId: '',
        notes: ''
      });
    };

    const removeCreateSoItemRow = (index) => {
      if (createSoForm.value.items.length <= 1) {
        showToast('Sales order must have at least one line item', 'error');
        return;
      }
      createSoForm.value.items.splice(index, 1);
    };

    const submitCreateSo = async () => {
      if (!createSoForm.value.soCode.trim()) {
        showToast('SO Code is required', 'error');
        return;
      }
      if (createSoForm.value.items.length === 0) {
        showToast('At least one item code is required', 'error');
        return;
      }

      // Auto-normalize SO Code
      createSoForm.value.soCode = normalizeSoCode(createSoForm.value.soCode);

      isSavingSo.value = true;
      try {
        const payload = {
          soCode: createSoForm.value.soCode.trim(),
          customer: createSoForm.value.customer?.trim() || undefined,
          orderDate: createSoForm.value.orderDate ? new Date(createSoForm.value.orderDate).toISOString() : undefined,
          status: createSoForm.value.status,
          source: createSoForm.value.source,
          notes: createSoForm.value.notes?.trim() || undefined,
          items: createSoForm.value.items.map(it => ({
            itemCode: it.itemCode.trim(),
            sku: it.sku.trim(),
            quantity: Number(it.quantity) || 1,
            firmwareVersion: sanitizeFw(it.firmwareVersion?.trim() || '1'),
            templateId: it.templateId || undefined,
            notes: it.notes?.trim() || undefined
          }))
        };

        const res = await fetch('/api/sales-orders', {
          method: 'POST',
          headers: credentials(),
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Sales Order created successfully', 'success');
          showCreateSoModal.value = false;
          fetchSalesOrders();
        } else {
          const err = await res.json();
          showToast(err.message || 'Failed to create Sales Order', 'error');
        }
      } catch (e) {
        showToast('Network error: ' + e.message, 'error');
      } finally {
        isSavingSo.value = false;
      }
    };

    // Edit SO Modal Handlers
    const openEditSoModal = (so) => {
      editingSo.value = so;
      editSoForm.value = {
        id: so.id,
        soCode: so.soCode,
        customer: so.customer || '',
        status: so.status || 'DRAFT',
        notes: so.notes || '',
        items: (so.items || []).map(it => ({
          id: it.id,
          itemCode: it.itemCode,
          sku: it.sku,
          firmwareVersion: sanitizeFw(it.firmwareVersion || '1'),
          quantity: it.quantity || 1,
          templateId: it.templateId || (it.template ? it.template.id : ''),
          notes: it.notes || ''
        }))
      };
      showEditSoModal.value = true;
      fetchAvailableTemplatesForDropdown();
    };

    const addEditSoItemRow = () => {
      const nextIdx = editSoForm.value.items.length + 1;
      const padded = nextIdx < 10 ? '00' + nextIdx : '' + nextIdx;
      editSoForm.value.items.push({
        itemCode: 'ITEM-' + padded,
        sku: 'WSLRW-ATH',
        firmwareVersion: '6',
        quantity: 1,
        templateId: '',
        notes: ''
      });
    };

    const removeEditSoItemRow = (index) => {
      if (editSoForm.value.items.length <= 1) {
        showToast('At least one item code is required', 'error');
        return;
      }
      editSoForm.value.items.splice(index, 1);
    };

    const submitEditSo = async () => {
      if (!editingSo.value) return;
      if (!editSoForm.value.soCode.trim()) {
        showToast('SO Code is required', 'error');
        return;
      }

      // Auto-normalize SO Code
      editSoForm.value.soCode = normalizeSoCode(editSoForm.value.soCode);

      isSavingSo.value = true;
      try {
        const payload = {
          soCode: editSoForm.value.soCode.trim(),
          customer: editSoForm.value.customer?.trim() || undefined,
          status: editSoForm.value.status,
          notes: editSoForm.value.notes?.trim() || undefined,
          items: editSoForm.value.items.map(it => ({
            id: it.id || undefined,
            itemCode: it.itemCode.trim(),
            sku: it.sku.trim(),
            quantity: Number(it.quantity) || 1,
            firmwareVersion: sanitizeFw(it.firmwareVersion?.trim() || '1'),
            templateId: it.templateId || undefined,
            notes: it.notes?.trim() || undefined
          }))
        };

        const res = await fetch('/api/sales-orders/' + editingSo.value.id, {
          method: 'PUT',
          headers: credentials(),
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Sales Order updated successfully', 'success');
          showEditSoModal.value = false;
          fetchSalesOrders();
        } else {
          const err = await res.json();
          showToast(err.message || 'Failed to update Sales Order', 'error');
        }
      } catch (e) {
        showToast('Error updating Sales Order: ' + e.message, 'error');
      } finally {
        isSavingSo.value = false;
      }
    };

    // Delete SO Modal Handlers
    const openDeleteSoModal = (so) => {
      soToDelete.value = so;
      showDeleteSoModal.value = true;
    };

    const confirmDeleteSo = async () => {
      if (!soToDelete.value) return;
      isDeletingSo.value = true;
      try {
        const res = await fetch('/api/sales-orders/' + soToDelete.value.id, {
          method: 'DELETE',
          headers: credentials()
        });
        if (res.ok) {
          showToast('Sales Order deleted', 'success');
          showDeleteSoModal.value = false;
          soToDelete.value = null;
          fetchSalesOrders();
        } else {
          const err = await res.json();
          showToast(err.message || 'Failed to delete Sales Order', 'error');
        }
      } catch (e) {
        showToast('Delete error: ' + e.message, 'error');
      } finally {
        isDeletingSo.value = false;
      }
    };

    // Open SO Details Modal
    const openSoDetails = async (so) => {
      try {
        const res = await fetch('/api/sales-orders/' + so.id, { headers: credentials() });
        if (res.ok) {
          selectedSoDetails.value = await res.json();
          showSoDetailsModal.value = true;
        } else {
          selectedSoDetails.value = so;
          showSoDetailsModal.value = true;
        }
      } catch (e) {
        selectedSoDetails.value = so;
        showSoDetailsModal.value = true;
      }
    };

    // Live Item Test Status
    const inspectItemTestStatus = async (soCode, itemCode) => {
      try {
        const res = await fetch('/api/sales-orders/' + encodeURIComponent(soCode) + '/items/' + encodeURIComponent(itemCode) + '/test-status', {
          headers: credentials()
        });
        if (res.ok) {
          itemTestStatusData.value = await res.json();
          showItemTestStatusModal.value = true;
        } else {
          const err = await res.json();
          showToast(err.message || 'Failed to fetch test status', 'error');
        }
      } catch (e) {
        showToast('Error fetching test status: ' + e.message, 'error');
      }
    };

    // Deep-link to Test Builder
    const navigateToTestBuilder = (templateId) => {
      if (templateId && activeTestTemplateId) {
        activeTestTemplateId.value = templateId;
      }
      showSoDetailsModal.value = false;
      showItemTestStatusModal.value = false;
      if (switchTab) {
        switchTab('test-builder');
      }
    };

    // Import Modal Handlers
    const openImportSoModal = () => {
      importActiveTab.value = 'odoo-json';
      showImportSoModal.value = true;
    };

    const loadSampleOdooJson = () => {
      odooJsonPayload.value = JSON.stringify({
        name: 'SO/2026/00001',
        partner_id: [14, 'Daviteq Smart Factory Solutions'],
        date_order: '2026-09-20 08:30:00',
        state: 'sale',
        order_line: [
          {
            id: 101,
            name: 'Industrial LoRaWAN Temperature & Humidity Sensor',
            default_code: 'WSLRW-ATH',
            item_code: 'WSLRW-ATH-01',
            product_uom_qty: 50,
            firmware_version: '6',
            notes: 'Batch 1 - High Accuracy'
          },
          {
            id: 102,
            name: 'Industrial LoRaWAN Current Loop Transmitter',
            default_code: 'WSLRW-CLW',
            item_code: 'WSLRW-CLW-01',
            product_uom_qty: 25,
            firmware_version: '1',
            notes: 'Standard 4-20mA'
          }
        ]
      }, null, 2);
      previewOdooJson();
    };

    const previewOdooJson = () => {
      try {
        const parsed = JSON.parse(odooJsonPayload.value);
        const soCode = parsed.name || parsed.soCode || 'SO-ODOO';
        let customer = '';
        if (Array.isArray(parsed.partner_id)) customer = parsed.partner_id[1];
        else if (typeof parsed.partner_id === 'string') customer = parsed.partner_id;
        else customer = parsed.customer || 'Odoo Partner';

        const lines = (parsed.order_line || []).map((l, idx) => ({
          itemCode: l.item_code || l.name || ('ITEM-' + (idx + 1)),
          sku: l.default_code || (Array.isArray(l.product_id) ? l.product_id[1] : 'SKU-GENERAL'),
          firmwareVersion: sanitizeFw(l.firmware_version || '1'),
          quantity: Number(l.product_uom_qty) || 1
        }));

        const totalUnits = lines.reduce((acc, l) => acc + l.quantity, 0);
        odooJsonPreview.value = { soCode, customer, lines, totalUnits };
        showToast('Odoo JSON parsed: ' + lines.length + ' lines validated', 'success');
      } catch (e) {
        odooJsonPreview.value = null;
        showToast('Invalid JSON syntax: ' + e.message, 'error');
      }
    };

    const submitImportOdooJson = async () => {
      if (!odooJsonPayload.value.trim()) {
        showToast('Please paste Odoo JSON payload', 'error');
        return;
      }

      let payloadObj;
      try {
        payloadObj = JSON.parse(odooJsonPayload.value);
      } catch (e) {
        showToast('Invalid JSON: ' + e.message, 'error');
        return;
      }

      isImportingSo.value = true;
      try {
        const res = await fetch('/api/sales-orders/import/odoo-json', {
          method: 'POST',
          headers: credentials(),
          body: JSON.stringify(payloadObj)
        });

        if (res.ok) {
          const saved = await res.json();
          showToast('Imported Odoo Sales Order: ' + saved.soCode, 'success');
          showImportSoModal.value = false;
          odooJsonPayload.value = '';
          odooJsonPreview.value = null;
          fetchSalesOrders();
        } else {
          const err = await res.json();
          showToast(err.message || 'Failed to import Odoo JSON', 'error');
        }
      } catch (e) {
        showToast('Import error: ' + e.message, 'error');
      } finally {
        isImportingSo.value = false;
      }
    };

    const loadSampleCsv = () => {
      csvContent.value = [
        'soCode,customer,orderDate,itemCode,sku,firmwareVersion,quantity,notes',
        'SO/2026/00001,Daviteq IoT Corp,2026-09-20,ITEM-001,WSLRW-ATH,6,50,Lot 1 Ambient Sensors',
        'SO/2026/00001,Daviteq IoT Corp,2026-09-20,ITEM-002,WSLRW-CLW,1.0,20,Lot 2 Current Loops'
      ].join('\\n');
      previewCsv();
    };

    const clickCsvFileInput = () => {
      const el = document.getElementById('csv-file-input');
      if (el) el.click();
    };

    const onCsvFileSelected = (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        csvContent.value = e.target.result;
        previewCsv();
      };
      reader.readAsText(file);
    };

    const previewCsv = () => {
      if (!csvContent.value.trim()) {
        csvPreviewRows.value = [];
        return;
      }

      const lines = csvContent.value.trim().split(/\\r?\\n/);
      if (lines.length < 2) {
        showToast('CSV must contain a header and at least one data row', 'error');
        csvPreviewRows.value = [];
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const soCodeIdx = headers.indexOf('soCode');
      const itemCodeIdx = headers.indexOf('itemCode');
      const skuIdx = headers.indexOf('sku');
      const customerIdx = headers.indexOf('customer');
      const fwIdx = headers.indexOf('firmwareVersion');
      const qtyIdx = headers.indexOf('quantity');

      if (soCodeIdx === -1 || itemCodeIdx === -1 || skuIdx === -1) {
        showToast('CSV missing required headers: soCode, itemCode, sku', 'error');
        return;
      }

      const parsedRows = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map(c => c.trim());
        parsedRows.push({
          soCode: cols[soCodeIdx] || '',
          customer: customerIdx !== -1 ? cols[customerIdx] : '',
          itemCode: cols[itemCodeIdx] || '',
          sku: cols[skuIdx] || '',
          firmwareVersion: fwIdx !== -1 ? sanitizeFw(cols[fwIdx]) : '1',
          quantity: qtyIdx !== -1 ? Number(cols[qtyIdx]) || 1 : 1
        });
      }

      csvPreviewRows.value = parsedRows;
      showToast('Parsed ' + parsedRows.length + ' CSV rows for preview', 'success');
    };

    const submitImportCsv = async () => {
      if (!csvContent.value.trim()) {
        showToast('Please enter or upload CSV content', 'error');
        return;
      }

      isImportingSo.value = true;
      try {
        const res = await fetch('/api/sales-orders/import/csv', {
          method: 'POST',
          headers: credentials(),
          body: JSON.stringify({
            csvContent: csvContent.value,
            overwriteExisting: csvOverwriteExisting.value
          })
        });

        if (res.ok) {
          const result = await res.json();
          const count = Array.isArray(result) ? result.length : 1;
          showToast('Successfully imported ' + count + ' sales orders from CSV', 'success');
          showImportSoModal.value = false;
          csvContent.value = '';
          csvPreviewRows.value = [];
          fetchSalesOrders();
        } else {
          const err = await res.json();
          showToast(err.message || 'Failed to import CSV', 'error');
        }
      } catch (e) {
        showToast('CSV import error: ' + e.message, 'error');
      } finally {
        isImportingSo.value = false;
      }
    };

    const submitSyncOdooApi = async () => {
      if (!odooApiForm.value.soCode.trim()) {
        showToast('Sales Order code is required for Odoo API sync', 'error');
        return;
      }

      isImportingSo.value = true;
      try {
        const res = await fetch('/api/sales-orders/import/odoo-api', {
          method: 'POST',
          headers: credentials(),
          body: JSON.stringify({
            url: odooApiForm.value.url?.trim() || undefined,
            db: odooApiForm.value.db?.trim() || undefined,
            username: odooApiForm.value.username?.trim() || undefined,
            apiKey: odooApiForm.value.apiKey?.trim() || undefined,
            soCode: odooApiForm.value.soCode.trim(),
            odooId: odooApiForm.value.odooId ? Number(odooApiForm.value.odooId) : undefined
          })
        });

        if (res.ok) {
          const synced = await res.json();
          showToast('Synced Sales Order: ' + synced.soCode, 'success');
          showImportSoModal.value = false;
          fetchSalesOrders();
        } else {
          const err = await res.json();
          showToast(err.message || 'Failed to sync from Odoo API', 'error');
        }
      } catch (e) {
        showToast('Odoo API sync error: ' + e.message, 'error');
      } finally {
        isImportingSo.value = false;
      }
    };

    return {
      salesOrdersList,
      soLoading,
      soSearchQuery,
      soStatusFilter,
      soSourceFilter,
      soTableViewMode,
      soPagination,
      soStats,
      expandedSoIds,
      availableTestTemplates,
      showCreateSoModal,
      showEditSoModal,
      showDeleteSoModal,
      showImportSoModal,
      showSoDetailsModal,
      showItemTestStatusModal,
      isSavingSo,
      isImportingSo,
      isDeletingSo,
      editingSo,
      soToDelete,
      selectedSoDetails,
      itemTestStatusData,
      createSoForm,
      editSoForm,
      importActiveTab,
      odooJsonPayload,
      odooJsonPreview,
      csvContent,
      csvOverwriteExisting,
      csvPreviewRows,
      odooApiForm,
      isSoExpanded,
      toggleSoExpand,
      formatDate,
      formatDateTime,
      calculateTotalQuantity,
      calculateProgress,
      getStatusBadgeClass,
      getStatusDotClass,
      getStatusTextColor,
      getItemStatusBadgeClass,
      getSourceBadgeClass,
      getSourceIcon,
      setSoViewMode,
      initSoTabulator,
      fetchSalesOrders,
      onSoSearch,
      changeSoPage,
      fetchAvailableTemplatesForDropdown,
      triggerAutoDetectTemplate,
      onSkuOrFwChange,
      autoResolveItemTemplate,
      openCreateSoModal,
      addCreateSoItemRow,
      removeCreateSoItemRow,
      submitCreateSo,
      openEditSoModal,
      addEditSoItemRow,
      removeEditSoItemRow,
      submitEditSo,
      openDeleteSoModal,
      confirmDeleteSo,
      openSoDetails,
      inspectItemTestStatus,
      navigateToTestBuilder,
      openImportSoModal,
      loadSampleOdooJson,
      previewOdooJson,
      submitImportOdooJson,
      loadSampleCsv,
      clickCsvFileInput,
      onCsvFileSelected,
      previewCsv,
      submitImportCsv,
      submitSyncOdooApi,
      sanitizeFw,
      formatFirmware,
      formatSkuFw,
      normalizeSoCode,
      showCatalogPickerModal,
      catalogPickerSearch,
      selectedCatalogItemCodes,
      filteredCatalogForPicker,
      isAllCatalogSelected,
      fetchCatalogItemsForPicker,
      toggleSelectAllCatalogItems,
      toggleCatalogItemSelection,
      openCatalogPickerModal,
      openCatalogPickerForRow,
      attachSingleCatalogItem,
      attachSelectedCatalogItems,
      showQuickCreateItemModal,
      isSavingCatalogItemInSo,
      quickCreateItemForm,
      openQuickCreateItemCodeModal,
      switchToCatalogTab,
      submitQuickCreateItemCode,
    };
  }
`;
