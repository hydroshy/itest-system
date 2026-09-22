// ========================================================
// C-MODULE: WEBHOOKS
// ========================================================

export const WEBHOOKS_TEMPLATE = `
        <!-- TAB 8: WEBHOOK MANAGER -->
        <div v-show="activeTab === 'webhooks'" class="space-y-4">
          <!-- TOP CARD: WEBHOOK ENDPOINTS (2 SERVERS) & CONTROLS -->
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-satellite-dish text-sky-400"></i> Webhook Manager
                </h2>
                <p class="text-[11px] text-slate-400 mt-0.5">Real-time incoming LoRaWAN webhook packet logging from ChirpStack & ThingPark with automated retention control.</p>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <!-- AJAX Live Status Badge -->
                <span class="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 shadow-sm" title="Real-time AJAX stream automatically active on this tab">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live Stream (AJAX)</span>
                </span>

                <!-- Refresh Button -->
                <button
                  @click="fetchWebhookLogs(false)"
                  :disabled="loadingWebhookLogs"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                  title="Manual Refresh Packet Stream"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': loadingWebhookLogs }"></i>
                  <span>Refresh</span>
                </button>

                <!-- Simulate Packet Button -->
                <button
                  @click="openSimulatePacketModal"
                  class="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                  title="Simulate incoming webhook packet from ChirpStack or ThingPark"
                >
                  <i class="fa-solid fa-paper-plane"></i>
                  <span>Simulate Packet</span>
                </button>

                <!-- Retention Settings Button -->
                <button
                  @click="openRetentionModal"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  title="Configure auto-pruning packet limit"
                >
                  <i class="fa-solid fa-sliders"></i>
                  <span>Retention ({{ webhookStats.retentionLimit || 200 }})</span>
                </button>

                <!-- Clear Logs Button -->
                <button
                  @click="openClearLogsModal"
                  :disabled="!webhookLogs.length"
                  class="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-40"
                  title="Clear all webhook packet logs"
                >
                  <i class="fa-solid fa-trash-can"></i>
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <!-- 2 Server Ingestion Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-mono">
              <!-- ChirpStack Endpoint Card -->
              <div class="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2">
                <div class="flex items-center justify-between font-sans">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <i class="fa-solid fa-tower-broadcast text-xs"></i>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-white">ChirpStack v4 Ingestion</h4>
                      <p class="text-[10px] text-slate-400">Uplink HTTP Integration</p>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-bold">
                    {{ webhookStats.chirpstackCount || 0 }} logged
                  </span>
                </div>
                <div class="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 flex items-center justify-between text-xs">
                  <span class="truncate font-mono text-[11px] text-sky-300">POST /lorawan/webhook/chirpstack</span>
                  <button @click="copyUrl('/lorawan/webhook/chirpstack')" class="text-sky-400 hover:text-sky-300 ml-2 cursor-pointer font-sans text-[11px] font-semibold flex-shrink-0">Copy URL</button>
                </div>
              </div>

              <!-- ThingPark Endpoint Card -->
              <div class="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2">
                <div class="flex items-center justify-between font-sans">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <i class="fa-solid fa-satellite-dish text-xs"></i>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-white">ThingPark Wireless Ingestion</h4>
                      <p class="text-[10px] text-slate-400">DX Application Routing</p>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    {{ webhookStats.thingparkCount || 0 }} logged
                  </span>
                </div>
                <div class="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 flex items-center justify-between text-xs">
                  <span class="truncate font-mono text-[11px] text-emerald-300">POST /lorawan/webhook/thingpark</span>
                  <button @click="copyUrl('/lorawan/webhook/thingpark')" class="text-emerald-400 hover:text-emerald-300 ml-2 cursor-pointer font-sans text-[11px] font-semibold flex-shrink-0">Copy URL</button>
                </div>
              </div>
            </div>
          </div>

          <!-- LOG WINDOW CARD: PACKET STREAM -->
          <div class="glass-card rounded-xl p-5 space-y-4">
            <!-- Filter & Server Tabs Toolbar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <!-- Server Filter Tabs -->
              <div class="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                <button
                  @click="webhookServerFilter = 'ALL'"
                  :class="webhookServerFilter === 'ALL' ? 'bg-slate-800 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                  class="px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>All Servers</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 text-[10px]">{{ webhookStats.totalCount || 0 }}</span>
                </button>
                <button
                  @click="webhookServerFilter = 'CHIRPSTACK'"
                  :class="webhookServerFilter === 'CHIRPSTACK' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'"
                  class="px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <i class="fa-solid fa-tower-broadcast text-[10px] text-sky-400"></i>
                  <span>ChirpStack</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px]">{{ webhookStats.chirpstackCount || 0 }}</span>
                </button>
                <button
                  @click="webhookServerFilter = 'THINGPARK'"
                  :class="webhookServerFilter === 'THINGPARK' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'"
                  class="px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <i class="fa-solid fa-satellite-dish text-[10px] text-emerald-400"></i>
                  <span>ThingPark</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">{{ webhookStats.thingparkCount || 0 }}</span>
                </button>
              </div>

              <!-- Search Bar -->
              <div class="flex items-center gap-2">
                <div class="relative">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    v-model="webhookSearchQuery"
                    type="text"
                    placeholder="Search DevEUI, Hex, or JSON..."
                    class="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono w-56 sm:w-72"
                  />
                </div>
              </div>
            </div>

            <!-- Packet Stream Table / Log Window -->
            <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-[580px] overflow-y-auto custom-scroll">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th class="py-2.5 px-3.5 w-32">Server</th>
                    <th class="py-2.5 px-3.5 w-28">Time</th>
                    <th class="py-2.5 px-3.5 w-44">DevEUI</th>
                    <th class="py-2.5 px-3.5 w-36">Port / FCnt</th>
                    <th class="py-2.5 px-3.5">Raw Webhook JSON Payload</th>
                    <th class="py-2.5 px-3.5 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-if="loadingWebhookLogs && filteredWebhookLogs.length === 0">
                    <td colspan="6" class="py-12 text-center text-slate-500">
                      <i class="fa-solid fa-circle-notch fa-spin text-lg text-sky-400 mb-2"></i>
                      <p>Loading incoming packet stream...</p>
                    </td>
                  </tr>
                  <tr v-else-if="filteredWebhookLogs.length === 0">
                    <td colspan="6" class="py-12 text-center text-slate-500">
                      <i class="fa-solid fa-satellite-dish text-2xl text-slate-600 mb-2 block"></i>
                      <p class="font-medium text-slate-400">No webhook packets in log buffer</p>
                      <p class="text-[11px] text-slate-500 mt-1">Packets received by webhook endpoints will appear here automatically in real-time.</p>
                      <button @click="openSimulatePacketModal" class="mt-3 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold cursor-pointer">
                        <i class="fa-solid fa-paper-plane mr-1"></i> Send Simulated Packet
                      </button>
                    </td>
                  </tr>
                  <tr v-for="log in filteredWebhookLogs" :key="log.id" class="hover:bg-slate-800/30 transition">
                    <!-- Source Server -->
                    <td class="py-2.5 px-3.5 align-top">
                      <span v-if="log.serverType === 'CHIRPSTACK'" class="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/25 text-[10px] font-bold inline-flex items-center gap-1 font-mono">
                        <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                        <span>ChirpStack</span>
                      </span>
                      <span v-else-if="log.serverType === 'THINGPARK'" class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold inline-flex items-center gap-1 font-mono">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>ThingPark</span>
                      </span>
                      <span v-else class="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[10px] font-bold inline-flex items-center gap-1 font-mono">
                        <span>{{ log.serverType }}</span>
                      </span>
                    </td>

                    <!-- Timestamp -->
                    <td class="py-2.5 px-3.5 font-mono text-[11px] text-slate-300 whitespace-nowrap align-top" :title="new Date(log.receivedAt).toISOString()">
                      {{ formatLogTime(log.receivedAt) }}
                    </td>

                    <!-- DevEUI -->
                    <td class="py-2.5 px-3.5 font-mono font-bold text-sky-400 whitespace-nowrap align-top">
                      {{ log.devEUI }}
                    </td>

                    <!-- Port / FCnt -->
                    <td class="py-2.5 px-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap align-top">
                      <span>Port {{ log.fPort }}</span>
                      <span class="text-slate-600 mx-1">•</span>
                      <span class="text-slate-500">FCnt #{{ log.fCnt }}</span>
                    </td>

                    <!-- Raw Webhook JSON Payload -->
                    <td class="py-2.5 px-3.5 align-top">
                      <div class="p-2 bg-slate-950/90 border border-slate-800/90 rounded-lg font-mono text-[11px] text-slate-300 relative group max-h-24 overflow-y-auto custom-scroll leading-relaxed">
                        <pre class="whitespace-pre-wrap break-all">{{ formatRawJson(log.rawPayload || log) }}</pre>
                        <div class="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition">
                          <button @click.stop="copyJson(log.rawPayload || log)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-sans font-semibold border border-slate-700 shadow-sm cursor-pointer" title="Copy JSON">
                            <i class="fa-solid fa-copy mr-1 text-sky-400"></i>Copy
                          </button>
                        </div>
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="py-2.5 px-3.5 text-right whitespace-nowrap align-top">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          @click="copyJson(log.rawPayload || log)"
                          class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition"
                          title="Copy JSON Payload"
                        >
                          <i class="fa-solid fa-copy text-slate-400"></i>
                        </button>
                        <button
                          @click="inspectWebhookLog(log)"
                          class="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                          title="Inspect JSON modal"
                        >
                          <i class="fa-solid fa-expand text-[10px]"></i>
                          <span>Expand</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Auto-pruning info note -->
            <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span class="flex items-center gap-1.5">
                <i class="fa-solid fa-circle-info text-sky-400"></i>
                <span>Automated Log Retention: System keeps the last <strong>{{ webhookStats.retentionLimit || 200 }}</strong> packets per server. Oldest logs are automatically pruned.</span>
              </span>
              <span>Showing {{ filteredWebhookLogs.length }} of {{ webhookLogs.length }} buffered logs</span>
            </div>
          </div>
        </div>

`;

export const WEBHOOKS_MODALS = `
    <!-- MODAL: INSPECT RAW WEBHOOK PAYLOAD -->
    <div v-if="rawPayloadModal && inspectedWebhookLog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <i class="fa-solid fa-file-code text-sm"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                Webhook Packet Inspector
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border" :class="inspectedWebhookLog.serverType === 'CHIRPSTACK' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'">
                  {{ inspectedWebhookLog.serverType }}
                </span>
              </h3>
              <p class="text-[11px] text-slate-400">DevEUI: {{ inspectedWebhookLog.devEUI }} | Time: {{ new Date(inspectedWebhookLog.receivedAt).toLocaleString() }}</p>
            </div>
          </div>
          <button @click="rawPayloadModal = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="space-y-3 overflow-y-auto custom-scroll flex-1 text-xs">
          <!-- Summary chips -->
          <div class="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div class="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span class="text-slate-500 block text-[10px]">DevEUI:</span>
              <span class="text-sky-400 font-bold">{{ inspectedWebhookLog.devEUI }}</span>
            </div>
            <div class="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span class="text-slate-500 block text-[10px]">fPort / fCnt:</span>
              <span class="text-slate-200">Port {{ inspectedWebhookLog.fPort }} / #{{ inspectedWebhookLog.fCnt }}</span>
            </div>
            <div class="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span class="text-slate-500 block text-[10px]">Payload Hex:</span>
              <span class="text-purple-400 font-bold">{{ inspectedWebhookLog.payloadHex || '00' }}</span>
            </div>
          </div>

          <!-- Decoded Data JSON -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Decoded Data Output</label>
            <pre class="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">{{ JSON.stringify(inspectedWebhookLog.decodedData, null, 2) || '{}' }}</pre>
          </div>

          <!-- Raw Ingestion Payload -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Raw Webhook Ingestion Payload</label>
            <pre class="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed max-h-60">{{ JSON.stringify(inspectedWebhookLog.rawPayload, null, 2) || '{}' }}</pre>
          </div>
        </div>

        <div class="flex justify-end pt-2 border-t border-slate-800">
          <button @click="rawPayloadModal = false" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">Close</button>
        </div>
      </div>
    </div>

    <!-- MODAL: SIMULATE WEBHOOK PACKET -->
    <div v-if="simulatePacketModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-paper-plane text-sky-400"></i>
            <h3 class="text-sm font-bold text-white">Simulate Webhook Packet</h3>
          </div>
          <button @click="simulatePacketModal = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="submitSimulatePacket" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Target Network Server</label>
            <select v-model="simulatePacketForm.serverType" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500">
              <option value="CHIRPSTACK">ChirpStack v4 Ingestion (/lorawan/webhook/chirpstack)</option>
              <option value="THINGPARK">ThingPark Wireless Ingestion (/lorawan/webhook/thingpark)</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Device DevEUI (16 Hex)</label>
            <input v-model="simulatePacketForm.devEUI" type="text" required maxlength="16" minlength="16" placeholder="0018B20000000001" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase text-xs focus:outline-none focus:border-sky-500" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">fPort</label>
              <input v-model.number="simulatePacketForm.fPort" type="number" min="1" max="223" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">fCnt</label>
              <input v-model.number="simulatePacketForm.fCnt" type="number" min="0" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Raw Payload Hex</label>
            <input v-model="simulatePacketForm.payloadHex" type="text" required placeholder="09C441" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase text-xs focus:outline-none focus:border-sky-500" />
            <p class="text-[10px] text-slate-500 mt-1">e.g. 09C441 (Temp: 25.0°C, Humidity: 65%)</p>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" @click="simulatePacketModal = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="simulatingPacket" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer">
              <i v-if="simulatingPacket" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else class="fa-solid fa-paper-plane"></i>
              <span>{{ simulatingPacket ? 'Sending...' : 'Send Packet' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: RETENTION SETTINGS -->
    <div v-if="retentionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-sliders text-sky-400"></i>
            <h3 class="text-sm font-bold text-white">Log Retention & Auto-Pruning</h3>
          </div>
          <button @click="retentionModal = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="space-y-3 text-xs">
          <p class="text-slate-300">Configure maximum number of webhook packets retained per server. When incoming packets exceed this threshold, oldest packets are automatically deleted to optimize storage and system performance.</p>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Max Packets per Server</label>
            <select v-model.number="newRetentionLimit" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500">
              <option :value="50">50 packets (Minimal storage)</option>
              <option :value="100">100 packets</option>
              <option :value="200">200 packets (Recommended default)</option>
              <option :value="500">500 packets</option>
              <option :value="1000">1,000 packets (High retention)</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" @click="retentionModal = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
          <button type="button" @click="submitUpdateRetention" :disabled="savingRetention" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer">
            <i v-if="savingRetention" class="fa-solid fa-circle-notch fa-spin"></i>
            <span>{{ savingRetention ? 'Saving...' : 'Save Retention Limit' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: CLEAR LOGS CONFIRM -->
    <div v-if="clearLogsConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center text-lg flex-shrink-0">
            <i class="fa-solid fa-trash-can"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Clear Webhook Packet Logs</h3>
            <p class="text-xs text-slate-400 mt-0.5">Are you sure you want to clear all buffered webhook logs?</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" @click="clearLogsConfirmModal = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
          <button type="button" @click="submitClearLogs" class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer">Yes, Clear Logs</button>
        </div>
      </div>
    </div>

`;
