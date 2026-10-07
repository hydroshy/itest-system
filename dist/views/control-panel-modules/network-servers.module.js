"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORK_SERVERS_MODALS = exports.NETWORK_SERVERS_TEMPLATE = void 0;
exports.NETWORK_SERVERS_TEMPLATE = `
        <!-- TAB 2: NETWORK SERVERS (ThingPark & ChirpStack v4 Management) -->
        <div v-show="activeTab === 'network-servers'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-tower-broadcast text-sky-400"></i> Network Servers Management
                  </h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/25">
                    {{ networkServersList.length }} Servers
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Configure Actility ThingPark Wireless and ChirpStack v4 instances, Route References, and Region Profiles</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="fetchNetworkServers" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button @click="openCreateNetworkServerDialog" class="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-plus"></i> Add Network Server
                </button>
              </div>
            </div>

            <!-- Server Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="networkServersList.length === 0" class="col-span-2 py-10 text-center text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800">
                <i class="fa-solid fa-tower-broadcast text-3xl text-slate-700 mb-2"></i>
                <div class="text-sm font-bold text-slate-400">No Network Servers Configured</div>
                <p class="text-xs text-slate-500 mt-1">Add your ThingPark or ChirpStack server to start routing LoRaWAN traffic.</p>
                <button @click="openCreateNetworkServerDialog" class="mt-4 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg cursor-pointer">
                  + Add Network Server Now
                </button>
              </div>

              <div
                v-for="ns in networkServersList"
                :key="ns.id"
                class="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition duration-150 space-y-4 flex flex-col justify-between"
              >
                <div class="space-y-3">
                  <!-- Header -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div :class="ns.type === 'THINGPARK' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-sky-500/10 border-sky-500/30 text-sky-400'" class="w-10 h-10 rounded-xl border flex items-center justify-center text-lg shadow-inner">
                        <i :class="ns.type === 'THINGPARK' ? 'fa-solid fa-satellite-dish' : 'fa-solid fa-tower-cell'"></i>
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <h3 class="text-sm font-bold text-white">{{ ns.name }}</h3>
                          <span v-if="ns.isDefault" class="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-bold">DEFAULT</span>
                        </div>
                        <div class="text-[10px] font-mono text-slate-400 mt-0.5">Type: <strong class="text-sky-400">{{ ns.type }}</strong></div>
                      </div>
                    </div>
                    <span :class="ns.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border">
                      {{ ns.status || 'CONFIGURED' }}
                    </span>
                  </div>

                  <p class="text-xs text-slate-400 leading-relaxed">{{ ns.description || 'Enterprise LoRaWAN Network Server instance' }}</p>

                  <!-- API & Routing Details -->
                  <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                    <div class="flex items-center justify-between">
                      <span class="text-slate-500 text-[11px]">API Base URL:</span>
                      <span class="text-slate-200 truncate max-w-xs">{{ ns.apiUrl || '--' }}</span>
                    </div>
                    <div v-if="ns.routeRef" class="flex items-center justify-between">
                      <span class="text-slate-500 text-[11px]">Default RouteRef:</span>
                      <span class="text-emerald-400 font-bold">{{ ns.routeRef }}</span>
                    </div>
                    <div v-if="ns.applicationId" class="flex items-center justify-between">
                      <span class="text-slate-500 text-[11px]">Application ID:</span>
                      <span class="text-cyan-400 font-mono text-[11px] truncate max-w-xs">{{ ns.applicationId }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-slate-500 text-[11px]">Webhook Endpoint:</span>
                      <button @click="copyUrl(ns.type === 'THINGPARK' ? '/lorawan/webhook/thingpark' : '/lorawan/webhook/chirpstack')" class="text-sky-400 hover:text-sky-300 text-[11px] font-sans font-semibold cursor-pointer">
                        <i class="fa-solid fa-copy mr-1"></i> Copy Ingestion URL
                      </button>
                    </div>
                  </div>

                  <!-- Region Profiles List -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>Region Profiles:</span>
                      <span class="text-slate-500 font-mono">{{ (ns.regionProfiles || []).length }} Regions</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      <span v-for="rp in (ns.regionProfiles || [])" :key="rp.id || rp.region" class="px-2 py-0.8 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono flex items-center gap-1.5">
                        <span class="text-sky-400 font-bold">{{ rp.region }}</span>
                        <span class="text-slate-500">&bull;</span>
                        <span class="text-slate-400">{{ rp.routeRef || rp.profileId || rp.name }}</span>
                      </span>
                      <span v-if="!(ns.regionProfiles || []).length" class="text-[11px] text-slate-500 italic">No region profiles configured</span>
                    </div>
                  </div>
                </div>

                <!-- Footer Actions -->
                <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button @click="testNetworkServer(ns)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer">
                    <i class="fa-solid fa-bolt text-amber-400"></i> Test Connection
                  </button>
                  <div class="flex items-center gap-1.5">
                    <button @click="openEditNetworkServerDialog(ns)" class="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 font-semibold cursor-pointer">
                      <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button @click="deleteNetworkServer(ns.id)" class="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-semibold cursor-pointer">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

`;
exports.NETWORK_SERVERS_MODALS = `
    <!-- MODAL: CREATE / EDIT NETWORK SERVER -->
    <div v-if="networkServerDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-tower-broadcast text-sky-400"></i> {{ isEditingNetworkServer ? 'Edit Network Server' : 'Add Network Server Instance' }}
          </h3>
          <button @click="networkServerDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitNetworkServerForm" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Server Name</label>
              <input v-model="currentNetworkServer.name" type="text" required placeholder="e.g. ThingPark Production EU868" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Server Type</label>
              <select v-model="currentNetworkServer.type" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
                <option value="THINGPARK">Actility ThingPark Wireless</option>
                <option value="CHIRPSTACK">ChirpStack v4 Server</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Base API URL</label>
              <input v-model="currentNetworkServer.apiUrl" type="text" placeholder="e.g. http://mas.local:8080 or https://api.thingpark.com" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">API Key / Token (Bearer Token)</label>
              <input v-model="currentNetworkServer.apiKey" type="password" placeholder="Enter API Bearer Token" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500" />
            </div>
          </div>

          <div v-if="currentNetworkServer.type === 'THINGPARK'">
            <label class="block font-semibold text-slate-300 mb-1">Default Route Reference (ThingPark)</label>
            <input v-model="currentNetworkServer.routeRef" type="text" placeholder="e.g. DAVITEQ_DEFAULT_ROUTE" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-sky-500" />
          </div>

          <div v-if="currentNetworkServer.type === 'CHIRPSTACK'">
            <label class="block font-semibold text-slate-300 mb-1">ChirpStack Application ID / UUID (Optional)</label>
            <input v-model="currentNetworkServer.applicationId" type="text" placeholder="e.g. 018e69d7-8947-79b8-a764-96d552bd3b8e" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-sky-500" />
            <p class="text-[10px] text-slate-500 mt-0.5">Leave blank to test using /api/tenants, or provide Application UUID to target a specific ChirpStack application.</p>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input v-model="currentNetworkServer.description" type="text" placeholder="e.g. Primary network server for industrial sensors" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
          </div>

          <!-- Region Profiles Builder -->
          <div class="space-y-2 pt-2 border-t border-slate-800">
            <div class="flex items-center justify-between">
              <div>
                <label class="font-bold text-slate-200">Region Profiles & Frequency Bands</label>
                <p class="text-[11px] text-slate-500">Add frequency regions and routeRef (ThingPark) or profileId (ChirpStack)</p>
              </div>
              <button type="button" @click="addRegionRow" class="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 font-bold cursor-pointer">
                <i class="fa-solid fa-plus mr-1"></i> Add Region
              </button>
            </div>

            <div class="space-y-2 max-h-48 overflow-y-auto custom-scroll p-2 bg-slate-950 border border-slate-800 rounded-xl">
              <div v-if="!(currentNetworkServer.regionProfiles && currentNetworkServer.regionProfiles.length)" class="py-4 text-center text-slate-600 italic">
                No region profiles added. Click "+ Add Region" to configure frequency plans.
              </div>
              <div v-for="(rp, idx) in currentNetworkServer.regionProfiles" :key="idx" class="p-2 bg-slate-900 rounded-lg border border-slate-800 grid grid-cols-12 gap-2 items-center">
                <div class="col-span-3">
                  <select v-model="rp.region" class="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-sky-400 font-mono text-xs">
                    <option value="AS923-1">AS923-1</option>
                    <option value="AS923-2">AS923-2</option>
                    <option value="AS923-3">AS923-3</option>
                    <option value="AS923-4">AS923-4</option>
                    <option value="VN920">VN920</option>
                    <option value="EU868">EU868</option>
                    <option value="US915">US915</option>
                    <option value="AU915">AU915</option>
                    <option value="KR920">KR920</option>
                    <option value="IN865">IN865</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
                <div class="col-span-4">
                  <input v-model="rp.name" type="text" placeholder="Profile Name" class="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white text-xs" />
                </div>
                <div class="col-span-4">
                  <input v-if="currentNetworkServer.type === 'THINGPARK'" v-model="rp.routeRef" type="text" placeholder="RouteRef" class="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono text-xs" />
                  <input v-else v-model="rp.profileId" type="text" placeholder="Profile ID" class="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-cyan-400 font-mono text-xs" />
                </div>
                <div class="col-span-1 text-right">
                  <button type="button" @click="removeRegionRow(idx)" class="text-red-400 hover:text-red-300 p-1 cursor-pointer"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input type="checkbox" v-model="currentNetworkServer.isDefault" class="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0" />
              <span>Set as default Network Server for new devices</span>
            </label>
            <div class="flex gap-2">
              <button type="button" @click="networkServerDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
              <button type="submit" :disabled="savingNetworkServer" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer">Save Server</button>
            </div>
          </div>
        </form>
      </div>
    </div>

`;
//# sourceMappingURL=network-servers.module.js.map