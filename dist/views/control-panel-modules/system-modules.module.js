"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_MODULES_MODALS = exports.SYSTEM_MODULES_TEMPLATE = void 0;
exports.SYSTEM_MODULES_TEMPLATE = `
        <!-- TAB 3: MODULE MANAGER & METABASE-STYLE ROLE LAYOUT CUSTOMIZATION -->
        <div v-show="activeTab === 'modules'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <!-- Header Bar with Segmented Sub-Tab Switcher -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-cubes text-cyan-400"></i> Dashboard module Manager
                  </h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                    {{ modulesList.length }} Registered Modules
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Manage live D-Module engines and customize Metabase-style visual grid layouts per role</p>
              </div>

              <!-- Sub-Tab Segmented Selector & Global Actions -->
              <div class="flex flex-wrap items-center gap-2.5">
                <!-- Sub-Tab Pills -->
                <div class="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
                  <button
                    @click="moduleManagerSubTab = 'layout'"
                    :class="moduleManagerSubTab === 'layout' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200 font-medium'"
                    class="px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i class="fa-solid fa-table-cells-large"></i> Role Layout Grid
                  </button>
                  <button
                    @click="moduleManagerSubTab = 'catalog'"
                    :class="moduleManagerSubTab === 'catalog' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200 font-medium'"
                    class="px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i class="fa-solid fa-server"></i> D-MODULE Registry
                    <span :class="moduleManagerSubTab === 'catalog' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-cyan-400 border border-slate-700'" class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold">
                      {{ modulesList.length }}
                    </span>
                  </button>
                </div>

                <div class="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

                <button @click="fetchModules" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button @click="resetModulesDefaults" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer" title="Reset layout and modules configuration to defaults">
                  <i class="fa-solid fa-rotate-left"></i> Reset Defaults
                </button>
              </div>
            </div>

            <!-- SUB-TAB 1: ROLE LAYOUT GRID CANVAS (METABASE STYLE) -->
            <div v-if="moduleManagerSubTab === 'layout'" class="space-y-4">
              <!-- Role Selector & Metabase Layout Toolbar -->
              <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <!-- Role Selector -->
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label class="text-xs font-bold text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-user-shield text-amber-400"></i> Role Layout Customization:
                  </label>
                  <select
                    v-model="selectedLayoutRole"
                    @change="onLayoutRoleChange"
                    class="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer min-w-[240px]"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Default / Global Layout)</option>
                    <option v-for="r in rolesList" :key="r.id" :value="r.code || r.name">
                      {{ r.name }} ({{ r.code }})
                    </option>
                  </select>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {{ currentRoleModuleList.length }} / {{ modulesList.length }} Modules in Grid
                  </span>
                </div>

                <!-- Action Controls: Edit, Save, Cancel, Add Module -->
                <div class="flex items-center gap-2">
                  <template v-if="!isEditingRoleLayout">
                    <button
                      @click="startEditRoleLayout"
                      class="px-3.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      <i class="fa-solid fa-up-down-left-right"></i> Edit Layout (Drag & Drop)
                    </button>
                    <button
                      @click="openAddModuleToLayoutModal"
                      class="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <i class="fa-solid fa-plus"></i> Add Module
                    </button>
                  </template>
                  <template v-else>
                    <button
                      @click="openAddModuleToLayoutModal"
                      class="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <i class="fa-solid fa-plus"></i> Add Module
                    </button>
                    <span class="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Edit Grid Mode
                    </span>
                    <button
                      @click="saveRoleLayoutOrder"
                      :disabled="savingRoleLayout"
                      class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                    >
                      <i class="fa-solid fa-check"></i> {{ savingRoleLayout ? 'Saving...' : 'Save' }}
                    </button>
                    <button
                      @click="cancelEditRoleLayout"
                      class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <i class="fa-solid fa-xmark"></i> Cancel
                    </button>
                  </template>
                </div>
              </div>

              <!-- Metabase-style Edit Mode Tips -->
              <div v-if="isEditingRoleLayout" class="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-table-cells-large text-cyan-400 text-sm"></i>
                  <span><strong>Metabase Grid Editor:</strong> Drag cards to reposition. Click <strong>1x / 2x Span</strong> to resize tile width. Click <strong>✕</strong> to remove a module from this role layout.</span>
                </div>
                <button @click="openAddModuleToLayoutModal" class="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold border border-cyan-500/30 flex items-center gap-1 cursor-pointer">
                  <i class="fa-solid fa-plus"></i> Select Module
                </button>
              </div>

              <!-- Metabase Responsive 12-Column Grid Canvas -->
              <div class="grid grid-cols-12 gap-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div
                  v-for="(mod, index) in currentRoleModuleList"
                  :key="mod.id"
                  :draggable="isEditingRoleLayout"
                  @dragstart="onDragStart(index, $event)"
                  @dragover.prevent="onDragOver(index, $event)"
                  @drop="onDrop(index, $event)"
                  @dragend="onDragEnd"
                  class="p-4 bg-slate-900/90 rounded-2xl border transition-all duration-150 flex flex-col justify-between space-y-3 group select-none shadow-md"
                  :class="[
                    mod.span === 2 ? 'col-span-12 md:col-span-12 lg:col-span-8' : 'col-span-12 sm:col-span-6 lg:col-span-4',
                    mod.isActive !== false ? 'border-slate-800 hover:border-cyan-500/40' : 'border-red-500/20 opacity-60 bg-red-950/10',
                    isEditingRoleLayout ? 'cursor-grab active:cursor-grabbing border-dashed ring-1 ring-cyan-500/30 hover:scale-[1.01]' : '',
                    dragOverModuleIndex === index && isEditingRoleLayout ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-400' : ''
                  ]"
                >
                  <!-- Tile Header -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2.5">
                        <!-- Drag Handle in Edit Mode -->
                        <div v-if="isEditingRoleLayout" class="text-slate-500 hover:text-cyan-400 cursor-grab px-0.5" title="Drag tile to reposition">
                          <i class="fa-solid fa-grip-vertical text-sm"></i>
                        </div>
                        <div :class="'bg-gradient-to-br ' + mod.color" class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md text-base flex-shrink-0">
                          <i :class="mod.icon"></i>
                        </div>
                        <div>
                          <h3 class="text-sm font-bold text-white group-hover:text-cyan-400 transition">{{ mod.title }}</h3>
                          <div class="text-[10px] font-mono text-slate-500">ID: {{ mod.id }}</div>
                        </div>
                      </div>
                      
                      <div class="flex items-center gap-1.5">
                        <!-- Metabase Span Width Switcher in Edit Mode -->
                        <button
                          v-if="isEditingRoleLayout"
                          @click.stop="toggleModuleSpan(index)"
                          class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer flex items-center gap-1 transition"
                          :title="mod.span === 2 ? 'Click to change to 1x Standard tile' : 'Click to expand to 2x Wide tile'"
                        >
                          <i class="fa-solid fa-arrows-left-right text-[9px]"></i>
                          <span>{{ mod.span === 2 ? '2x Wide' : '1x Standard' }}</span>
                        </button>

                        <!-- Position Badge in Edit Mode -->
                        <span v-if="isEditingRoleLayout" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          #{{ index + 1 }}
                        </span>

                        <!-- Remove from Role Layout in Edit Mode -->
                        <button
                          v-if="isEditingRoleLayout"
                          @click.stop="removeModuleFromCurrentRoleLayout(index)"
                          class="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition"
                          title="Remove module from this role layout"
                        >
                          <i class="fa-solid fa-xmark text-sm"></i>
                        </button>

                        <!-- Active Toggle in View Mode -->
                        <button
                          v-if="!isEditingRoleLayout"
                          @click.stop="toggleModuleActive(mod)"
                          :title="mod.isActive !== false ? 'Active (Click to disable)' : 'Inactive (Click to enable)'"
                          :class="mod.isActive !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'"
                          class="px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition"
                        >
                          {{ mod.isActive !== false ? 'ACTIVE' : 'OFF' }}
                        </button>
                      </div>
                    </div>

                    <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">{{ mod.description }}</p>

                    <!-- Category & Permissions Tag -->
                    <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span class="px-2 py-0.5 rounded font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {{ mod.category }}
                      </span>
                      <span class="font-mono text-slate-500">{{ mod.requiredPermission || 'Public Access' }}</span>
                    </div>
                  </div>

                  <!-- Footer in Edit Mode: Directional Shift Controls -->
                  <div v-if="isEditingRoleLayout" class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-1">
                      <button
                        :disabled="index === 0"
                        @click.stop="moveModuleOrder(index, -1)"
                        class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition text-xs font-bold"
                        title="Move Earlier"
                      >
                        <i class="fa-solid fa-arrow-left"></i>
                      </button>
                      <button
                        :disabled="index === currentRoleModuleList.length - 1"
                        @click.stop="moveModuleOrder(index, 1)"
                        class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition text-xs font-bold"
                        title="Move Later"
                      >
                        <i class="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                    <span class="text-[11px] font-mono text-cyan-400 font-bold">Slot {{ index + 1 }} of {{ currentRoleModuleList.length }}</span>
                  </div>
                </div>

                <!-- Inline Add Module Slot Tile at End of Grid (in Edit Mode) -->
                <div
                  v-if="isEditingRoleLayout"
                  @click="openAddModuleToLayoutModal"
                  class="p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/15 transition cursor-pointer flex flex-col items-center justify-center space-y-2 text-slate-500 hover:text-cyan-400 min-h-[160px] group select-none"
                >
                  <div class="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 text-base">
                    <i class="fa-solid fa-plus"></i>
                  </div>
                  <span class="text-xs font-bold">Add Module to Layout</span>
                  <span class="text-[10px] text-slate-500">Pick from verified system modules</span>
                </div>
              </div>

              <!-- Empty State if no modules visible for role -->
              <div v-if="currentRoleModuleList.length === 0" class="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
                <i class="fa-solid fa-cubes text-3xl text-slate-600"></i>
                <h3 class="text-sm font-bold text-white">No Modules Added to Role '{{ selectedLayoutRole }}'</h3>
                <p class="text-xs text-slate-400 max-w-md mx-auto">
                  No feature modules are currently in this role's layout. Click the button below to pick and add modules to the grid.
                </p>
                <button @click="openAddModuleToLayoutModal" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md">
                  <i class="fa-solid fa-plus"></i> Add Module to Layout
                </button>
              </div>
            </div>

            <!-- SUB-TAB 2: LIVE CODEBASE D-MODULE REGISTRY FLEET -->
            <div v-if="moduleManagerSubTab === 'catalog'" class="space-y-4">
              <!-- Live Core Engine Highlight Banner -->
              <div class="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900/90 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-500/20 flex-shrink-0">
                    <i class="fa-solid fa-microchip"></i>
                  </div>
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-sm font-bold text-white">Core Live Engine: Device Fleet Manager</h3>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> FULLY OPERATIONAL
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/25">
                        D_MOD_DEVICE_MANAGER
                      </span>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      Complete end-to-end backend D-Module with direct PostgreSQL TypeORM models (<span class="font-mono text-cyan-300">DeviceEntity</span>), OTAA/ABP provisioning, ThingPark Wireless & ChirpStack v4 synchronization, and live JavaScript decoder pipeline execution.
                    </p>
                    <div class="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span class="text-emerald-400"><i class="fa-regular fa-folder-open mr-1"></i>src/modules/d-modules/device-manager/</span>
                      <span class="text-slate-500">|</span>
                      <span><i class="fa-solid fa-link mr-1"></i>Route: /dashboard#device-manager</span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-row md:flex-col items-center md:items-end gap-2 flex-shrink-0 w-full md:w-auto">
                  <button
                    @click="navigateTo('/dashboard#device-manager')"
                    class="w-full md:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition"
                  >
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Device Manager
                  </button>
                  <span class="text-[10px] text-slate-400">Launch live module UI</span>
                </div>
              </div>

              <!-- Quick Stats Fleet Overview -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div class="text-[11px] text-slate-400 font-medium">Registered D-Modules</div>
                  <div class="text-lg font-bold text-white font-mono flex items-center justify-between">
                    <span>{{ modulesList.length }}</span>
                    <i class="fa-solid fa-cubes text-cyan-400 text-sm"></i>
                  </div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div class="text-[11px] text-slate-400 font-medium">Active Runtime Modules</div>
                  <div class="text-lg font-bold text-emerald-400 font-mono flex items-center justify-between">
                    <span>{{ modulesList.filter(m => m.isActive !== false).length }}</span>
                    <i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
                  </div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div class="text-[11px] text-slate-400 font-medium">Backend Core Engine</div>
                  <div class="text-lg font-bold text-cyan-300 font-mono flex items-center justify-between">
                    <span>1 Live</span>
                    <i class="fa-solid fa-server text-cyan-400 text-sm"></i>
                  </div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div class="text-[11px] text-slate-400 font-medium">Configured Role Layouts</div>
                  <div class="text-lg font-bold text-amber-400 font-mono flex items-center justify-between">
                    <span>{{ Object.keys(roleLayouts).length }} Roles</span>
                    <i class="fa-solid fa-users-gear text-amber-400 text-sm"></i>
                  </div>
                </div>
              </div>

              <!-- Detailed Table of Real Registered D-Modules -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <i class="fa-solid fa-list-check text-cyan-400"></i> Registered D-Module Fleet Inventory
                  </h3>
                  <span class="text-[11px] text-slate-400 font-mono">
                    All modules verified & available in registry
                  </span>
                </div>

                <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono text-[11px]">
                        <th class="py-3 px-4">Module Name & Details</th>
                        <th class="py-3 px-4">ID & Registry Code</th>
                        <th class="py-3 px-4">Codebase Directory</th>
                        <th class="py-3 px-4">Category</th>
                        <th class="py-3 px-4">RBAC Permission</th>
                        <th class="py-3 px-4 text-center">Status</th>
                        <th class="py-3 px-4 text-right">Runtime Toggle</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                      <tr v-for="mod in modulesList" :key="mod.id" class="hover:bg-slate-900/40 transition">
                        <td class="py-3 px-4">
                          <div class="flex items-center gap-3">
                            <div :class="'bg-gradient-to-br ' + mod.color" class="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md text-sm flex-shrink-0">
                              <i :class="mod.icon"></i>
                            </div>
                            <div>
                              <div class="font-bold text-white flex items-center gap-1.5">
                                {{ mod.title }}
                                <span v-if="mod.id === 'device-manager'" class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  LIVE CORE
                                </span>
                              </div>
                              <div class="text-[11px] text-slate-400 line-clamp-1 max-w-sm">{{ mod.description }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 px-4 font-mono">
                          <div class="text-cyan-300 font-bold">{{ mod.id }}</div>
                          <div class="text-[10px] text-slate-500">{{ mod.code || 'D_MOD_' + mod.id.toUpperCase().replace(/-/g, '_') }}</div>
                        </td>
                        <td class="py-3 px-4 font-mono text-[11px]">
                          <span v-if="mod.id === 'device-manager'" class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold inline-flex items-center gap-1">
                            <i class="fa-solid fa-code text-[10px]"></i> src/modules/d-modules/device-manager
                          </span>
                          <span v-else class="text-slate-400 font-mono">
                            src/modules/d-modules/{{ mod.id }}
                          </span>
                        </td>
                        <td class="py-3 px-4">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {{ mod.category || 'General' }}
                          </span>
                        </td>
                        <td class="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {{ mod.requiredPermission || 'Public / Role-based' }}
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span :class="mod.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'" class="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border">
                            {{ mod.isActive !== false ? 'ACTIVE' : 'DISABLED' }}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <button
                            @click="toggleModuleActive(mod)"
                            :class="mod.isActive !== false ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400 border-slate-800 hover:border-red-500/30' : 'hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border-slate-800 hover:border-emerald-500/30'"
                            class="p-2 rounded-lg border text-xs transition cursor-pointer"
                            :title="mod.isActive !== false ? 'Disable Module' : 'Enable Module'"
                          >
                            <i :class="mod.isActive !== false ? 'fa-solid fa-power-off' : 'fa-solid fa-check'"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>



        <!-- TAB 4: ROLES & RBAC MATRIX -->
        <div v-show="activeTab === 'roles'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-shield-halved text-amber-400"></i> Role & Permissions Control Matrix (RBAC)
                  </h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    {{ rolesList.length }} Roles Configured
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Control view access, module permissions, and operational capabilities for each user role</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="fetchRoles" :disabled="loadingRoles" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i :class="loadingRoles ? 'fa-spin' : ''" class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button @click="openCreateRoleDialog" class="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-plus"></i> Create Role
                </button>
              </div>
            </div>

            <!-- Visual Role Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="r in rolesList" :key="r.id" class="p-4 bg-slate-950/75 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between hover:border-amber-500/30 transition">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 font-bold text-sm" :class="r.code === 'SUPER_ADMIN' ? 'text-emerald-400' : 'text-amber-400'">
                      <i :class="r.code === 'SUPER_ADMIN' ? 'fa-crown text-emerald-400' : 'fa-user-shield text-amber-400'" class="fa-solid text-base"></i>
                      <span>{{ r.name }}</span>
                    </div>
                    <span :class="r.code === 'SUPER_ADMIN' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-amber-500/10 text-amber-300 border-amber-500/25'" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border">
                      {{ r.code }}
                    </span>
                  </div>

                  <p class="text-xs text-slate-400 leading-relaxed">{{ r.description || 'Standard operational role' }}</p>

                  <div class="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                    <div class="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Privileges Enabled:</span>
                      <strong class="text-white font-mono">{{ r.permissions ? r.permissions.length : 0 }} / {{ allPermissions.length }}</strong>
                    </div>
                    <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div class="bg-gradient-to-r from-amber-500 to-sky-500 h-1.5 rounded-full" :style="{ width: ((r.permissions ? r.permissions.length : 0) / (allPermissions.length || 1) * 100) + '%' }"></div>
                    </div>
                  </div>

                  <div class="space-y-1 text-xs">
                    <div class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Dashboard Modules Unlocked:</div>
                    <div class="flex flex-wrap gap-1">
                      <span v-for="mod in getModulesForRole(r.code)" :key="mod.id" class="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono">
                        {{ mod.title }}
                      </span>
                      <span v-if="!getModulesForRole(r.code).length" class="text-[10px] text-slate-600 italic">No specific modules mapped</span>
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button v-if="r.code !== 'SUPER_ADMIN'" @click="openEditRoleDialog(r)" class="w-full py-1.5 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                    <i class="fa-solid fa-pen-to-square"></i> Configure Permissions & Modules
                  </button>
                  <div v-else class="w-full py-1.5 px-3 text-center text-slate-500 font-mono text-xs bg-slate-900/50 rounded-lg">
                    <i class="fa-solid fa-lock text-emerald-400 mr-1"></i> Full System Access (Immutable)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        <!-- TAB 5: USERS -->
        <div v-show="activeTab === 'users'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-users text-emerald-400"></i> User Directory
                </h2>
                <p class="text-[11px] text-slate-400 mt-0.5">Manage administrative and operator accounts</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="fetchUsers" :disabled="loadingUsers" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i :class="loadingUsers ? 'fa-spin' : ''" class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button @click="openCreateUserDialog" class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-user-plus"></i> Create User
                </button>
              </div>
            </div>

            <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3.5">Username</th>
                    <th class="py-2.5 px-3.5">Full Name</th>
                    <th class="py-2.5 px-3.5">Email</th>
                    <th class="py-2.5 px-3.5">Type</th>
                    <th class="py-2.5 px-3.5">Roles</th>
                    <th class="py-2.5 px-3.5">Status</th>
                    <th class="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-if="usersList.length === 0">
                    <td colspan="7" class="py-6 text-center text-slate-500">No user accounts found.</td>
                  </tr>
                  <tr v-for="u in usersList" :key="u.id" class="hover:bg-slate-800/30 transition">
                    <td class="py-2.5 px-3.5 font-mono font-bold text-white">{{ u.username }}</td>
                    <td class="py-2.5 px-3.5 text-slate-300">{{ u.fullName || '--' }}</td>
                    <td class="py-2.5 px-3.5 text-slate-400">{{ u.email }}</td>
                    <td class="py-2.5 px-3.5">
                      <span :class="u.userType === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border">
                        {{ u.userType }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3.5">
                      <span v-if="!u.roles || !u.roles.length" class="text-slate-500 text-[11px]">None</span>
                      <span v-for="r in u.roles" :key="r.id || r" class="inline-block px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono mr-1">
                        {{ r.name || r.code || r }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3.5">
                      <span :class="u.isActive ? 'text-emerald-400' : 'text-red-400'" class="inline-flex items-center gap-1.5 text-[11px] font-medium">
                        <span :class="u.isActive ? 'bg-emerald-500' : 'bg-red-500'" class="w-1.5 h-1.5 rounded-full"></span>
                        {{ u.isActive ? 'Active' : 'Suspended' }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3.5 text-right space-x-1">
                      <button @click="openEditUserDialog(u)" class="px-2 py-0.8 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[11px] font-semibold cursor-pointer">Edit</button>
                      <button @click="deleteUser(u.id)" :disabled="u.username === 'admin'" class="px-2 py-0.8 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-semibold cursor-pointer disabled:opacity-30">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

`;
exports.SYSTEM_MODULES_MODALS = `
    <!-- MODAL: ADD VERIFIED SYSTEM MODULE TO LAYOUT -->
    <div v-if="addModuleToLayoutModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-layer-group text-cyan-400"></i> Add Module to Layout
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Select from verified system modules to add to role <strong class="text-amber-400 font-mono">{{ selectedLayoutRole }}</strong>
            </p>
          </div>
          <button @click="closeAddModuleToLayoutModal" class="text-slate-500 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition">
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <!-- Verified Modules List -->
        <div class="space-y-2.5 overflow-y-auto custom-scroll pr-1 flex-1 py-1">
          <div
            v-for="mod in modulesList"
            :key="mod.id"
            class="p-3.5 rounded-xl border transition flex items-center justify-between gap-3"
            :class="isModuleInCurrentLayout(mod.id) ? 'bg-slate-950/60 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-slate-950/90 border-slate-800 hover:border-cyan-500/40'"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div :class="'bg-gradient-to-br ' + mod.color" class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md text-base flex-shrink-0">
                <i :class="mod.icon"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-bold text-white truncate">{{ mod.title }}</h4>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">{{ mod.id }}</span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{{ mod.category }}</span>
                </div>
                <p class="text-[11px] text-slate-400 truncate mt-0.5 max-w-md">{{ mod.description }}</p>
              </div>
            </div>

            <!-- Action Button / State Badge -->
            <div class="flex-shrink-0 flex items-center gap-2">
              <template v-if="isModuleInCurrentLayout(mod.id)">
                <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <i class="fa-solid fa-check text-xs"></i> Added in Layout
                </span>
              </template>
              <template v-else>
                <button
                  @click="addModuleToCurrentRoleLayout(mod)"
                  class="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20 transition active:scale-95"
                >
                  <i class="fa-solid fa-plus"></i> Add to Layout
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-3 border-t border-slate-800 flex items-center justify-between flex-shrink-0 text-xs">
          <div class="text-[11px] text-slate-400">
            <span>Currently in layout: </span>
            <strong class="text-cyan-400 font-mono">{{ currentRoleModuleList.length }} / {{ modulesList.length }} modules</strong>
          </div>
          <button
            type="button"
            @click="closeAddModuleToLayoutModal"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: CREATE / EDIT ROLE -->
    <div v-if="roleDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-amber-400"></i> {{ isEditingRole ? 'Configure Role & Permissions' : 'Create New System Role' }}
          </h3>
          <button @click="roleDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitRoleForm" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Role Code</label>
              <input v-model="currentRole.code" :disabled="isEditingRole" type="text" required placeholder="e.g. AUDITOR" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-amber-500 disabled:opacity-50" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Display Name</label>
              <input v-model="currentRole.name" type="text" required placeholder="e.g. Security Auditor" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input v-model="currentRole.description" type="text" placeholder="Description of role responsibilities..." class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500" />
          </div>

          <!-- Permission Category Matrix -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200">System Privileges Matrix ({{ currentRole.permissions.length }} Selected):</label>
              <button type="button" @click="toggleSelectAllRolePermissions" class="text-amber-400 hover:text-amber-300 text-[11px] font-semibold cursor-pointer">Toggle All Privileges</button>
            </div>
            <div class="max-h-56 overflow-y-auto custom-scroll p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div v-for="(perms, groupName) in groupedPermissions" :key="groupName" class="space-y-1">
                <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                  <span>{{ groupName }}</span>
                  <button type="button" @click="toggleGroupPermissions(perms)" class="text-sky-400 hover:text-sky-300 lowercase text-[10px] cursor-pointer">toggle group</button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  <label v-for="p in perms" :key="p.id" class="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 text-slate-300 hover:text-white cursor-pointer select-none">
                    <input type="checkbox" :value="p.id" v-model="currentRole.permissions" class="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0" />
                    <div class="leading-tight">
                      <div class="font-mono text-[11px] text-amber-400 font-semibold">{{ p.name }}</div>
                      <div class="text-[10px] text-slate-500">{{ p.description }}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="roleDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingRole" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer">
              {{ isEditingRole ? 'Update Role' : 'Create Role' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CREATE USER -->
    <div v-if="createUserDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-user-plus text-emerald-400"></i> Create User Account
          </h3>
          <button @click="createUserDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitCreateUser" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Username</label>
            <input v-model="newUser.username" type="text" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Full Name <span class="text-slate-500 font-normal">(Optional)</span></label>
            <input v-model="newUser.fullName" type="text" placeholder="Optional" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Email <span class="text-slate-500 font-normal">(Optional)</span></label>
            <input v-model="newUser.email" type="email" placeholder="Optional - Not required for login" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Password</label>
            <input v-model="newUser.password" type="password" required minlength="6" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">User Type</label>
            <select v-model="newUser.userType" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
              <option value="USER">Standard User (USER)</option>
              <option value="SUB_ADMIN">Sub-Administrator (SUB_ADMIN)</option>
              <option value="ADMIN">Super Administrator (ADMIN)</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Assign Role</label>
            <select v-model="newUser.roleId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
              <option value="">No role assigned</option>
              <option v-for="r in rolesList" :key="r.id" :value="r.id">{{ r.name }} ({{ r.code }})</option>
            </select>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="createUserDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingUser" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer">Save User</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: EDIT USER -->
    <div v-if="editUserDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-user-gear text-sky-400"></i> Edit User & Roles
          </h3>
          <button @click="editUserDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitEditUser" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Username</label>
            <input v-model="editUser.username" type="text" disabled class="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-400 font-mono" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Assign Role</label>
            <select v-model="editUser.roleId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
              <option value="">No role assigned</option>
              <option v-for="r in rolesList" :key="r.id" :value="r.id">{{ r.name }} ({{ r.code }})</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Account Status</label>
            <select v-model="editUser.isActive" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
              <option :value="true">Active</option>
              <option :value="false">Suspended</option>
            </select>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="editUserDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingUser" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer">Update User</button>
          </div>
        </form>
      </div>
    </div>

`;
//# sourceMappingURL=system-modules.module.js.map