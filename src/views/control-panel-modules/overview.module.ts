// ========================================================
// C-MODULE: OVERVIEW
// ========================================================

export const OVERVIEW_TEMPLATE = `
        <!-- TAB 1: OVERVIEW & CENTRAL MANAGEMENT HUB -->
        <div v-show="activeTab === 'overview'" class="space-y-6">
          <!-- Top Stat Metrics: Comprehensive 8-Card Platform Overview -->
          <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <!-- 1. Platform Engine -->
            <div class="glass-card rounded-xl p-4 space-y-1">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Platform Engine</span>
                <i class="fa-solid fa-server text-sky-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white flex items-center gap-2 pt-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
              </div>
              <div class="text-[11px] text-slate-500">NestJS Core Runtime</div>
            </div>

            <!-- 2. Network Servers -->
            <div @click="switchTab('network-servers')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-sky-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Network Servers</span>
                <i class="fa-solid fa-tower-broadcast text-sky-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ networkServersList?.length || '--' }}</div>
              <div class="text-[11px] text-slate-500">ThingPark & ChirpStack v4</div>
            </div>

            <!-- 3. Device Fleet -->
            <div @click="switchTab('devices')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-teal-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Device Fleet</span>
                <i class="fa-solid fa-microchip text-teal-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ devicesList?.length || '--' }}</div>
              <div class="text-[11px] text-slate-500">Registered End-Devices</div>
            </div>

            <!-- 4. System Roles -->
            <div @click="switchTab('roles')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-amber-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>System Roles</span>
                <i class="fa-solid fa-shield-halved text-amber-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ rolesList?.length || '--' }}</div>
              <div class="text-[11px] text-slate-500">RBAC Role Definitions</div>
            </div>

            <!-- 5. Item Code Catalog -->
            <div @click="switchTab('item-codes')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-cyan-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Item Code Catalog</span>
                <i class="fa-solid fa-barcode text-cyan-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ itemCodesList?.length || dbHealth?.tableStats?.item_codes?.recordCount || '--' }}</div>
              <div class="text-[11px] text-slate-500">Master Commercial SKUs</div>
            </div>

            <!-- 6. Sales Orders -->
            <div @click="switchTab('sales-orders')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-amber-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Sales Orders</span>
                <i class="fa-solid fa-boxes-stacked text-amber-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ salesOrdersList?.length || dbHealth?.tableStats?.sales_orders?.recordCount || '--' }}</div>
              <div class="text-[11px] text-slate-500">Odoo ERP & Batch Orders</div>
            </div>

            <!-- 7. Test Automation -->
            <div @click="switchTab('test-builder')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-emerald-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Test Automation</span>
                <i class="fa-solid fa-vial-circle-check text-emerald-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ dbHealth?.tableStats?.test_templates?.recordCount || '--' }}</div>
              <div class="text-[11px] text-slate-500">Flow Test Templates</div>
            </div>

            <!-- 8. Payload Decoders -->
            <div @click="switchTab('decoder')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-purple-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Payload Decoders</span>
                <i class="fa-solid fa-code text-purple-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ decodersList?.length || dbHealth?.tableStats?.decoder?.recordCount || '--' }}</div>
              <div class="text-[11px] text-slate-500">JavaScript Sandbox Parsers</div>
            </div>
          </div>

          <!-- SYSTEM RUNTIME & DEVOPS LIFECYCLE MANAGEMENT PANEL -->
          <div class="glass-card rounded-2xl p-6 space-y-4 border border-sky-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-sky-950/20">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 text-base">
                  <i class="fa-solid fa-server"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-base font-extrabold text-white">System Runtime & Git Lifecycle Manager</h2>
                    <span :class="systemVersionInfo?.opsAgent?.online ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border-amber-500/25'" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1">
                      <span :class="systemVersionInfo?.opsAgent?.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'" class="w-1.5 h-1.5 rounded-full"></span>
                      {{ systemVersionInfo?.opsAgent?.online ? 'OPS AGENT ONLINE' : 'STANDALONE MODE' }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">Live Git commit tracking, Docker container orchestration, and server lifecycle operations</p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2">
                <a
                  :href="standaloneOpsUrl"
                  target="_blank"
                  class="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-lg shadow-amber-500/10"
                  title="Open Standalone Ops Console (Port 3099 - Runs independently even when NestJS is down)"
                >
                  <i class="fa-solid fa-bolt text-amber-400"></i>
                  <span>Standalone Ops</span>
                  <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                </a>
                <button
                  @click="fetchSystemVersion"
                  :disabled="loadingSystemVersion"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                  title="Refresh version and container metrics"
                >
                  <i :class="loadingSystemVersion ? 'animate-spin' : ''" class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button
                  v-if="systemVersionInfo?.opsAgent?.online"
                  @click="openServerLogsDialog"
                  class="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  title="View live container logs"
                >
                  <i class="fa-solid fa-terminal"></i> Container Logs
                </button>
                <button
                  @click="openRestartConfirmDialog"
                  class="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-500/20 transition"
                  title="Restart NestJS server container"
                >
                  <i class="fa-solid fa-rotate text-xs"></i> Restart Server
                </button>
              </div>
            </div>

            <!-- Version & Metadata Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <!-- Git Commit Hash -->
              <div class="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div class="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Git Commit Hash</span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-500/20 text-sky-300">{{ systemVersionInfo?.git?.branch || 'main' }}</span>
                </div>
                <div class="flex items-center justify-between pt-1">
                  <span class="text-sm font-mono font-bold text-sky-400">#{{ systemVersionInfo?.git?.shortHash || 'unknown' }}</span>
                  <button
                    @click="copyCommitHash(systemVersionInfo?.git?.commitHash)"
                    class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs cursor-pointer"
                    title="Copy Full Commit Hash"
                  >
                    <i class="fa-regular fa-copy"></i>
                  </button>
                </div>
                <div class="text-[10px] text-slate-500 truncate" :title="systemVersionInfo?.git?.commitHash">
                  {{ systemVersionInfo?.git?.commitHash || 'Loading hash...' }}
                </div>
              </div>

              <!-- Last Commit Message -->
              <div class="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div class="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Last Commit Message</span>
                  <i class="fa-solid fa-code-commit text-slate-500 text-xs"></i>
                </div>
                <div class="text-xs font-bold text-white line-clamp-1 pt-1" :title="systemVersionInfo?.git?.commitMessage">
                  {{ systemVersionInfo?.git?.commitMessage || 'Production build' }}
                </div>
                <div class="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span><i class="fa-regular fa-user mr-1"></i>{{ systemVersionInfo?.git?.author || 'Daviteq Team' }}</span>
                </div>
              </div>

              <!-- Server Uptime & Node Runtime -->
              <div class="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div class="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Engine Runtime</span>
                  <span class="text-emerald-400 font-mono text-[10px] font-bold">Node.js {{ systemVersionInfo?.server?.nodeVersion || 'v20' }}</span>
                </div>
                <div class="text-sm font-mono font-bold text-white pt-1">
                  {{ formatUptime(systemVersionInfo?.server?.uptimeSeconds) }}
                </div>
                <div class="text-[10px] text-slate-500">
                  Platform: {{ systemVersionInfo?.server?.platform || 'linux' }} ({{ systemVersionInfo?.server?.environment || 'production' }})
                </div>
              </div>

              <!-- Target Container & Orchestration -->
              <div class="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div class="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Target Container</span>
                  <span :class="systemVersionInfo?.opsAgent?.dockerAvailable ? 'text-emerald-400' : 'text-slate-400'" class="font-mono text-[10px] font-bold">
                    {{ systemVersionInfo?.opsAgent?.dockerAvailable ? 'DOCKER ACTIVE' : 'STANDALONE' }}
                  </span>
                </div>
                <div class="text-xs font-mono font-bold text-slate-200 pt-1 flex items-center gap-1.5">
                  <i class="fa-brands fa-docker text-sky-400 text-sm"></i>
                  <span>nest_lorawan_app</span>
                </div>
                <div class="text-[10px] text-slate-400 truncate">
                  Port: 3000 | Ops: :3099
                </div>
              </div>
            </div>
          </div>

          <!-- INTERACTIVE MANAGEMENT HUB GRID (Direct access to all sections) -->
          <div class="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <h2 class="text-base font-extrabold text-white flex items-center gap-2">
                <i class="fa-solid fa-grid-2 text-sky-400"></i> Admin Management Hub
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Quickly jump into any administrative module or system governance function</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              
              <!-- Card: Network Servers -->
              <div @click="switchTab('network-servers')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-sky-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-tower-broadcast"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {{ networkServersList?.length || 0 }} Configured
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-sky-400 transition">Network Servers Management</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Manage ThingPark Wireless and ChirpStack v4 connections, Route References, API keys, and Region profiles.</p>
                </div>
                <div class="text-xs text-sky-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Servers</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Modules -->
              <div @click="switchTab('modules')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-cubes"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {{ modulesList?.length || 0 }} Modules
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-cyan-400 transition">Dashboard module Manager</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Customize dashboard layouts, drag-and-drop arrange module order per role, and configure permissions.</p>
                </div>
                <div class="text-xs text-cyan-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Modules</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Database Manager -->
              <div @click="switchTab('database')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-database"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    ONLINE
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-indigo-400 transition">Database Manager</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">PostgreSQL connection health, real-time pool metrics, table stats, and dynamic multi-DB pool routing.</p>
                </div>
                <div class="text-xs text-indigo-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Database</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Roles -->
              <div @click="switchTab('roles')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-amber-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-shield-halved"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {{ rolesList?.length || 0 }} Roles
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-amber-400 transition">Roles & Permissions (RBAC)</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Define system roles, group privileges by functional area, and control operational capabilities.</p>
                </div>
                <div class="text-xs text-amber-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Configure Roles</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Users -->
              <div @click="switchTab('users')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-users"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {{ usersList?.length || 0 }} Users
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-emerald-400 transition">User Directory</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Create and manage accounts, assign roles, toggle account status, and configure credentials.</p>
                </div>
                <div class="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Users</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Devices -->
              <div @click="switchTab('devices')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-teal-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-microchip"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {{ devicesList?.length || 0 }} Devices
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-teal-400 transition">LoRaWAN Device Fleet</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Register End-Devices, manage DevEUIs, configure OTAA/ABP keys, and link payload decoders.</p>
                </div>
                <div class="text-xs text-teal-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Fleet</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Decoders -->
              <div @click="switchTab('decoder')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-purple-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-code"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {{ decodersList?.length || dbHealth?.tableStats?.decoder?.recordCount || 0 }} Decoders
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-purple-400 transition">Payload Decoder Manager</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Manage LoRaWAN JavaScript decoders by SKU and FW version with interactive VM sandbox.</p>
                </div>
                <div class="text-xs text-purple-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Decoders</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Item Code Catalog -->
              <div @click="switchTab('item-codes')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-barcode"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {{ itemCodesList?.length || dbHealth?.tableStats?.item_codes?.recordCount || 0 }} Items
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-cyan-400 transition">Item Code Catalog</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Master commercial Daviteq catalog, standardized SKU and clean FW versions, default test template links.</p>
                </div>
                <div class="text-xs text-cyan-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Browse Catalog</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Sales Orders -->
              <div @click="switchTab('sales-orders')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-amber-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-boxes-stacked"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {{ salesOrdersList?.length || dbHealth?.tableStats?.sales_orders?.recordCount || 0 }} Orders
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-amber-400 transition">Sales Orders & Items</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Manage production orders, sync with Odoo ERP, import CSV data, attach item codes and track QA status.</p>
                </div>
                <div class="text-xs text-amber-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Orders</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Test Automation -->
              <div @click="switchTab('test-builder')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-vial-circle-check"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {{ dbHealth?.tableStats?.test_templates?.recordCount || 'Active' }} Templates
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-emerald-400 transition">Test Automation Builder</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Visual Flow Canvas test scenario designer, AST payload decoder extraction, and assertion rules.</p>
                </div>
                <div class="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Launch Builder</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: HMI SCADA Studio -->
              <div @click="switchTab('hmi-studio')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-rose-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-palette"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    {{ hmiScreensList?.length || 0 }} Screens
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-rose-400 transition">HMI SCADA Studio</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Industrial synoptic screens builder, sensor telemetry tag bindings, and runtime operator views.</p>
                </div>
                <div class="text-xs text-rose-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Open Studio</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Downlink Actuator -->
              <div @click="switchTab('downlink')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-blue-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-paper-plane"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {{ downlinkHistory?.length || 0 }} Sent
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-blue-400 transition">Downlink Actuator</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Transmit raw hex payloads & config presets to LoRaWAN end-devices with queue management and audit log.</p>
                </div>
                <div class="text-xs text-blue-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Send Downlink</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Webhook Manager -->
              <div @click="switchTab('webhooks')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-sky-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-satellite-dish"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {{ dbHealth?.tableStats?.webhook_logs?.recordCount || webhookLogs?.length || 0 }} Packets
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-sky-400 transition">Webhook Manager</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Live packet ingestion streams from ChirpStack & ThingPark with automated retention limits.</p>
                </div>
                <div class="text-xs text-sky-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>View Webhooks</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Modbus Presets -->
              <div @click="switchTab('modbus-presets')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-teal-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-file-excel"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {{ (modbusPresetsList?.length ?? presetsList?.length ?? 0) }} Presets
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-teal-400 transition">Modbus Presets</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Manage Modbus register presets, import Excel templates (RD1, Engineering, Full), and configure maps.</p>
                </div>
                <div class="text-xs text-teal-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Configure Presets</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              <!-- Card: Sensor Types -->
              <div @click="switchTab('sensor-types')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-sky-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-microchip"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {{ sensorTypesList?.length || 0 }} Mappings
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-sky-400 transition">LoRaWAN Sensor Types</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Map Modbus Register 103 codes (e.g. 71 → WSLRW-LKS) to hardware SKUs, regions, and LoRaWAN classes.</p>
                </div>
                <div class="text-xs text-sky-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Sensor Types</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

            </div>
          </div>
        </div>


        <!-- TAB: DATABASE MANAGER -->
        <div v-show="activeTab === 'database'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-3">
                  <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-database text-indigo-400"></i> Database Manager
                  </h2>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    core_db &bull; ONLINE
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Real-time status of PostgreSQL connection pools, metrics, and dynamic table routing</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="fetchDbHealth" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button @click="reloadDbConfig" class="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-gear"></i> Hot-Reload Config
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div v-for="(conn, key) in (dbHealth?.connections || {})" :key="key" class="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-white text-xs">{{ conn.name }}</span>
                  <span :class="conn.isAlive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'" class="px-2 py-0.5 rounded-full text-[10px] font-bold border">
                    {{ conn.isAlive ? 'CONNECTED' : 'OFFLINE' }}
                  </span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono space-y-1">
                  <div>Host: <strong class="text-slate-200">{{ conn.host }}:{{ conn.port }}</strong></div>
                  <div>Database: <strong class="text-slate-200">{{ conn.database }}</strong></div>
                  <div>Ping Latency: <strong :class="conn.latencyMs < 50 ? 'text-emerald-400' : 'text-amber-400'">{{ conn.latencyMs !== null ? conn.latencyMs + ' ms' : 'N/A' }}</strong></div>
                  <div>Pool Size: <strong class="text-slate-300">{{ conn.poolSize }} max connections</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div class="glass-card rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-white">Active Table Routing & Live Record Counts</h3>
              <span class="text-[10px] font-mono text-slate-500">config/db-routing.config.json</span>
            </div>
            <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-sans font-semibold">
                  <tr>
                    <th class="py-2.5 px-3.5">Table / Entity</th>
                    <th class="py-2.5 px-3.5">Assigned Database Pool</th>
                    <th class="py-2.5 px-3.5">Record Count</th>
                    <th class="py-2.5 px-3.5">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-for="(stat, tableName) in (dbHealth?.tableStats || {})" :key="tableName" class="hover:bg-slate-800/30 transition">
                    <td class="py-2.5 px-3.5 font-bold text-white">{{ tableName }}</td>
                    <td class="py-2.5 px-3.5 text-sky-400">{{ stat.routedTo }}</td>
                    <td class="py-2.5 px-3.5 text-emerald-400 font-bold">{{ Number(stat.recordCount).toLocaleString() }} rows</td>
                    <td class="py-2.5 px-3.5"><span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">{{ stat.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

`;

export const OVERVIEW_MODALS = `
    <!-- MODAL: RESTART SERVER CONFIRMATION -->
    <div v-if="restartConfirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" @click="restartConfirmDialog = false">
      <div class="glass-card rounded-2xl p-6 w-full max-w-md border border-red-500/30 shadow-2xl space-y-4" @click.stop>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-xl shadow-inner">
            <i class="fa-solid fa-rotate"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Restart NestJS Server</h3>
            <p class="text-xs text-slate-400">Restart platform backend container</p>
          </div>
        </div>

        <div class="p-3.5 bg-red-950/20 border border-red-500/25 rounded-xl text-xs text-red-300 space-y-2">
          <p><strong>Warning:</strong> Restarting will briefly disconnect active API requests and WebSocket sessions. The NestJS backend container (<code>nest_lorawan_app</code>) will shut down gracefully and restart.</p>
          <p class="text-[11px] text-slate-400">Current Commit: <span class="font-mono text-cyan-300 font-bold">#{{ systemVersionInfo?.git?.shortHash }}</span> ({{ systemVersionInfo?.git?.branch }})</p>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-2">
          <button
            @click="restartConfirmDialog = false"
            :disabled="restartingServer"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="confirmRestartServer"
            :disabled="restartingServer"
            class="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-500/20 transition disabled:opacity-50"
          >
            <i :class="restartingServer ? 'fa-solid fa-spinner animate-spin' : 'fa-solid fa-rotate'"></i>
            <span>{{ restartingServer ? 'Sending Signal...' : 'Confirm Restart' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: SERVER CONTAINER LOGS -->
    <div v-if="serverLogsDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" @click="serverLogsDialog = false">
      <div class="glass-card rounded-2xl p-6 w-full max-w-3xl border border-slate-700 shadow-2xl space-y-4 max-h-[85vh] flex flex-col" @click.stop>
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm">
              <i class="fa-solid fa-terminal"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Container Logs (nest_lorawan_app)</h3>
              <p class="text-[11px] text-slate-400">Recent stdout/stderr output stream</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="openServerLogsDialog"
              :disabled="loadingServerLogs"
              class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <i :class="loadingServerLogs ? 'animate-spin' : ''" class="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
            <button
              @click="serverLogsDialog = false"
              class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scroll bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[300px]">
          {{ serverLogs || 'Loading logs...' }}
        </div>
      </div>
    </div>


    <!-- FLOATING RESTART OVERLAY -->
    <div v-if="restartProgress?.active" class="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-sky-500/40 shadow-2xl flex items-center gap-3">
      <i class="fa-solid fa-spinner fa-spin text-sky-400 text-xl"></i>
      <div>
        <div class="text-xs font-bold text-white">{{ restartProgress?.message || 'Restarting Backend Server...' }}</div>
        <div class="text-[10px] text-slate-400">Reconnecting automatically (Attempt {{ restartProgress?.countdown }}s)...</div>
      </div>
    </div>

`;
