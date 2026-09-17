// ========================================================
// C-MODULE: DEVICES
// ========================================================

export const DEVICES_TEMPLATE = `
        <!-- TAB 7: DEVICES -->
        <div v-show="activeTab === 'devices'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-microchip text-teal-400"></i> LoRaWAN Device Fleet
                </h2>
                <p class="text-[11px] text-slate-400 mt-0.5">End-devices provisioned across ThingPark Wireless and ChirpStack v4 Network Servers</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="fetchDevices" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button @click="openRegisterDeviceDialog" class="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-plus"></i> Register Device
                </button>
              </div>
            </div>

            <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3.5">DevEUI</th>
                    <th class="py-2.5 px-3.5">Device Name</th>
                    <th class="py-2.5 px-3.5">SKU</th>
                    <th class="py-2.5 px-3.5">Firmware</th>
                    <th class="py-2.5 px-3.5">Created By</th>
                    <th class="py-2.5 px-3.5">Network Server</th>
                    <th class="py-2.5 px-3.5">Region Profile</th>
                    <th class="py-2.5 px-3.5">Status</th>
                    <th class="py-2.5 px-3.5">Last Seen</th>
                    <th class="py-2.5 px-3.5">Decoder</th>
                    <th class="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-if="devicesList.length === 0">
                    <td colspan="11" class="py-6 text-center text-slate-500">No LoRaWAN devices registered. Click "Register Device" to provision a device.</td>
                  </tr>
                  <tr v-for="d in devicesList" :key="d.id || d.devEUI" class="hover:bg-slate-800/30 transition">
                    <td class="py-2.5 px-3.5 font-mono font-bold text-sky-400">{{ d.devEUI }}</td>
                    <td class="py-2.5 px-3.5 font-bold text-white">{{ d.name || '--' }}</td>
                    <td class="py-2.5 px-3.5 font-mono text-cyan-300 font-semibold">{{ d.sku || '—' }}</td>
                    <td class="py-2.5 px-3.5 font-mono text-purple-300 font-semibold">{{ formatFirmware(d.firmwareVersion) }}</td>
                    <td class="py-2.5 px-3.5">
                      <span v-if="d.owner" class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px] font-medium inline-flex items-center gap-1.5">
                        <i class="fa-solid fa-user text-[10px]"></i>
                        <span>{{ d.owner.username }}</span>
                      </span>
                      <span v-else class="text-slate-500 text-[11px] italic">admin / system</span>
                    </td>
                    <td class="py-2.5 px-3.5">
                      <span v-if="d.networkServer" class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono">
                        {{ d.networkServer.name }}
                      </span>
                      <span v-else class="text-slate-500 text-[11px] italic">Local Fleet</span>
                    </td>
                    <td class="py-2.5 px-3.5">
                      <span v-if="d.regionProfileName" class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono">
                        {{ d.regionProfileName }}
                      </span>
                      <span v-else class="text-slate-500 text-[11px]">Default</span>
                    </td>
                    <td class="py-2.5 px-3.5">
                      <span v-if="!d.isActive" class="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-800 text-slate-400 border-slate-700 flex items-center gap-1 w-max" title="Device is disabled">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        <span>DISABLED</span>
                      </span>
                      <span v-else-if="isDeviceOnline(d)" class="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/25 flex items-center gap-1 w-max" title="Actively transmitting packets">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>ONLINE</span>
                      </span>
                      <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/25 flex items-center gap-1 w-max" :title="(d.lastSeenAt || d.syncDetails?.lastSeenAt) ? 'Inactive for > 24 hours' : 'Device has not joined or transmitted packets yet'">
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        <span>OFFLINE</span>
                      </span>
                    </td>
                    <td class="py-2.5 px-3.5 font-mono text-[11px]">
                      <span v-if="d.lastSeenAt || d.syncDetails?.lastSeenAt" class="text-emerald-400 font-semibold" :title="new Date(d.lastSeenAt || d.syncDetails?.lastSeenAt).toLocaleString()">
                        {{ formatLastSeen(d.lastSeenAt || d.syncDetails?.lastSeenAt) }}
                      </span>
                      <span v-else class="text-slate-500 italic text-[10px]" title="Device has not transmitted any packets yet">
                        Never joined
                      </span>
                    </td>
                    <td class="py-2.5 px-3.5">
                      <span v-if="d.decoderId" class="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-bold inline-flex items-center gap-1">
                        <i class="fa-solid fa-code text-[10px]"></i>
                        {{ d.decoderId }}
                      </span>
                      <span v-else-if="d.payloadFormatterScript" class="text-emerald-400 text-[11px] font-medium inline-flex items-center gap-1">
                        <i class="fa-solid fa-code mr-1"></i> Custom
                      </span>
                      <span v-else class="text-slate-500 text-[11px] italic">None</span>
                    </td>
                    <td class="py-2.5 px-3.5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button @click="checkDeviceHealth(d)" :disabled="checkingHealthDevEUI === d.devEUI" title="Check Health & Online Status from Network Server API" class="p-1.5 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-xs cursor-pointer disabled:opacity-50">
                          <i class="fa-solid fa-heart-pulse" :class="checkingHealthDevEUI === d.devEUI ? 'animate-spin' : ''"></i>
                        </button>
                        <button @click="openEditDeviceDialog(d)" title="Edit Device" class="p-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs cursor-pointer">
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button @click="testDevice(d)" title="Test JavaScript Decoder" class="p-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs cursor-pointer">
                          <i class="fa-solid fa-code"></i>
                        </button>
                        <button @click="deleteDevice(d)" title="Delete Device" class="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs cursor-pointer">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

`;

export const DEVICES_MODALS = `
    <!-- MODAL: REGISTER / EDIT DEVICE -->
    <div v-if="registerDeviceDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-microchip text-teal-400"></i> {{ isEditingDevice ? 'Edit LoRaWAN Device' : 'Register LoRaWAN Device' }}
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">{{ isEditingDevice ? 'Update configuration and auto-synchronize with Network Server' : 'Provision end-device to Network Server' }}</p>
          </div>
          <button @click="registerDeviceDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="submitDeviceForm" class="space-y-3.5 text-xs">
          <!-- Provisioning Mode Selector (Only on Register) -->
          <div v-if="!isEditingDevice">
            <label class="block font-semibold text-slate-300 mb-1.5 text-xs">Provisioning Mode <span class="text-red-400">*</span></label>
            <div class="grid grid-cols-2 gap-2.5">
              <button type="button" @click="newDevice.provisionTarget = 'SERVER'" :class="newDevice.provisionTarget !== 'LOCAL' ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 ring-1 ring-teal-500/30' : 'bg-slate-950 border-slate-800 text-slate-400'" class="p-2.5 rounded-xl border text-left cursor-pointer transition">
                <div class="font-bold text-xs flex items-center gap-1.5"><i class="fa-solid fa-cloud-arrow-up text-teal-400"></i> Network Server</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Provision directly on server</div>
              </button>
              <button type="button" @click="newDevice.provisionTarget = 'LOCAL'" :class="newDevice.provisionTarget === 'LOCAL' ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 ring-1 ring-sky-500/30' : 'bg-slate-950 border-slate-800 text-slate-400'" class="p-2.5 rounded-xl border text-left cursor-pointer transition">
                <div class="font-bold text-xs flex items-center gap-1.5"><i class="fa-solid fa-laptop-code text-sky-400"></i> Local Fleet Only</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Offline / decoder testing</div>
              </button>
            </div>
          </div>

          <!-- Device Status Switch (Only on Edit) -->
          <div v-if="isEditingDevice" class="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div>
              <label class="font-semibold text-slate-300 block text-xs">Device Status</label>
              <p class="text-[10px] text-slate-400">Disable device to suspend data ingestion from sensor</p>
            </div>
            <button type="button" @click="newDevice.isActive = !newDevice.isActive" :class="newDevice.isActive ? 'bg-teal-500' : 'bg-slate-700'" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer flex-shrink-0">
              <span :class="newDevice.isActive ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
            </button>
          </div>

          <!-- Device Name -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Device Name <span class="text-red-400">*</span></label>
            <input v-model="newDevice.name" type="text" required placeholder="e.g. Temperature & Humidity Sensor 01" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500" />
          </div>

          <!-- DEV_EUI -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">DEV_EUI (16 Hex Characters) <span class="text-red-400">*</span></label>
            <input v-model="newDevice.devEUI" type="text" required placeholder="0018B20000000001" maxlength="16" minlength="16" :disabled="isEditingDevice" :class="isEditingDevice ? 'opacity-60 cursor-not-allowed bg-slate-900/80 border-slate-800' : 'bg-slate-950 border-slate-700'" class="w-full px-3 py-2 border rounded-lg text-white font-mono uppercase focus:outline-none focus:border-teal-500" />
            <p v-if="isEditingDevice" class="text-[10px] text-slate-500 mt-0.5">DevEUI is the unique hardware identifier and cannot be modified.</p>
          </div>

          <!-- 2 Columns: Network Server & Region Profile -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Network Server <span v-if="newDevice.provisionTarget !== 'LOCAL'" class="text-red-400">*</span></label>
              <select v-model="newDevice.networkServerId" @change="onDeviceNetworkServerChange" :required="newDevice.provisionTarget !== 'LOCAL'" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500">
                <option value="" :disabled="newDevice.provisionTarget !== 'LOCAL'">-- Select Network Server --</option>
                <option v-for="ns in networkServersList" :key="ns.id" :value="ns.id">{{ ns.name }}</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Region Profile</label>
              <select v-model="newDevice.regionProfileId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500">
                <option value="">{{ selectedDeviceNetworkServer ? '-- Select Region --' : 'Default Profile' }}</option>
                <option v-for="rp in availableDeviceRegions" :key="rp.id" :value="rp.id">{{ rp.name }}</option>
              </select>
            </div>
          </div>

          <!-- AppEUI (Pre-filled 0102030405060708) -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">AppEUI / JoinEUI (16 Hex Characters) <span class="text-red-400">*</span></label>
            <input v-model="newDevice.appEUI" type="text" required maxlength="16" minlength="16" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-teal-500" />
          </div>

          <!-- APP_key (Pre-filled 0102030405060708090A0B0C0D0E0F10) -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">APP_Key (32 Hex Characters) <span class="text-red-400">*</span></label>
            <input v-model="newDevice.appKey" type="text" required maxlength="32" minlength="32" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-teal-500" />
          </div>

          <!-- 2 Columns: Product SKU & Firmware Version -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">
                Product SKU <span class="text-slate-500 font-normal text-[11px]">(Optional)</span>
              </label>
              <input
                v-model="newDevice.sku"
                @input="onDeviceSkuOrFwChange"
                type="text"
                placeholder="e.g. WSLRW-V1A"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">
                Firmware Version <span class="text-slate-500 font-normal text-[11px]">(Optional, digits only)</span>
              </label>
              <input
                v-model="newDevice.firmwareVersion"
                @input="onDeviceSkuOrFwChange"
                type="text"
                placeholder="e.g. 9 or 1.0"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <!-- Payload Decoder Selection (Auto or Manual) -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Payload Decoder</span>
              <span v-if="newDevice.decoderId" class="text-purple-400 font-mono text-[10px]">Auto/Selected: {{ newDevice.decoderId }}</span>
            </label>
            <select v-model="newDevice.decoderId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500">
              <option value="">-- None (No Decoder) --</option>
              <option v-for="dec in decodersList" :key="dec.id" :value="dec.id">
                {{ dec.id }} (SKU: {{ dec.sku }}, FW: {{ dec.firmwareVersion }})
              </option>
            </select>
            <p class="text-[10px] text-slate-500 mt-1">Automatically assigns decoder (SKU)_(FIRMWARE_VERSION) when SKU and Firmware are provided, or select manually.</p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" @click="registerDeviceDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingDevice" class="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer">
              <i v-if="savingDevice" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else :class="isEditingDevice ? 'fa-solid fa-floppy-disk' : 'fa-solid fa-plus'"></i>
              <span>{{ savingDevice ? (isEditingDevice ? 'Saving...' : 'Registering...') : (isEditingDevice ? 'Save Changes' : 'Register Device') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CONFIRM DELETE DEVICE -->
    <div v-if="deleteConfirmDialog && deviceToDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-slate-200">
        <!-- Header -->
        <div class="flex items-start gap-3.5">
          <div class="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 text-lg flex-shrink-0 shadow-inner">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-white">Delete Device Confirmation</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this device? This action cannot be undone.
            </p>
          </div>
        </div>

        <!-- Device Info Box -->
        <div class="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-medium">Device Name:</span>
            <span class="font-bold text-white truncate max-w-[200px]">{{ deviceToDelete.name || '--' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-medium">DevEUI:</span>
            <span class="font-mono font-bold text-sky-400">{{ deviceToDelete.devEUI }}</span>
          </div>
          <div v-if="deviceToDelete.owner" class="flex items-center justify-between">
            <span class="text-slate-400 font-medium">Created By:</span>
            <span class="text-purple-300 font-mono text-[11px]">{{ deviceToDelete.owner.username }}</span>
          </div>
          <div v-if="deviceToDelete.networkServer" class="flex items-center justify-between">
            <span class="text-slate-400 font-medium">Network Server:</span>
            <span class="text-slate-300 font-mono text-[11px]">{{ deviceToDelete.networkServer.name }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="deleteConfirmDialog = false"
            :disabled="deletingDevice"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="confirmDeleteDevice"
            :disabled="deletingDevice"
            class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer transition"
          >
            <i v-if="deletingDevice" class="fa-solid fa-circle-notch fa-spin"></i>
            <i v-else class="fa-solid fa-trash-can"></i>
            <span>{{ deletingDevice ? 'Deleting...' : 'Delete Device' }}</span>
          </button>
        </div>
      </div>
    </div>

`;
