// ========================================================
// D-MODULE: DEVICE FLEET MANAGER
// ========================================================

export const DEVICE_MANAGER_TEMPLATE = `          <div v-if="activeFeature.id === 'device-manager'" class="space-y-5">
            <!-- Action Toolbar & Search -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div class="flex items-center gap-3">
                <button @click="returnToHome" title="Back to Dashboard" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer">
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-lg shadow-inner">
                  <i class="fa-solid fa-microchip"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-white tracking-wide">DEVICE MANAGER</h3>
                    <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold font-mono">
                      {{ filteredDevices.length }} {{ filteredDevices.length === 1 ? 'Device' : 'Devices' }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Manage and provision your LoRaWAN end-devices</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="relative">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input v-model="deviceSearchQuery" type="text" placeholder="Search devEUI, name..." class="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56" />
                </div>
                <button @click="fetchDevices" title="Refresh Device List" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate"></i>
                </button>
                <button @click="openRegisterDeviceDialog" class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-plus"></i> Register Device
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredDevices.length === 0" class="text-center py-16 px-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
              <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl mx-auto">
                <i class="fa-solid fa-microchip"></i>
              </div>
              <div class="space-y-1">
                <h4 class="text-sm font-bold text-white">No devices found</h4>
                <p class="text-xs text-slate-400 max-w-sm mx-auto">
                  {{ deviceSearchQuery ? 'No devices match your search filter.' : 'You have not provisioned any LoRaWAN devices yet.' }}
                </p>
              </div>
              <button v-if="!deviceSearchQuery" @click="openRegisterDeviceDialog" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-plus"></i> Register Your First Device
              </button>
            </div>

            <!-- Card Grid (Spacious 1 to 3 columns) -->
            <div v-else class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              <div v-for="d in filteredDevices" :key="d.id || d.devEUI" class="bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition duration-200 flex flex-col justify-between space-y-5 group">
                
                <!-- Card Header -->
                <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div class="flex items-start gap-3.5 min-w-0">
                    <div class="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-lg flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <i class="fa-solid fa-microchip"></i>
                    </div>
                    <div class="space-y-1 min-w-0">
                      <h4 class="font-bold text-white text-base truncate group-hover:text-emerald-300 transition" :title="d.name">{{ d.name }}</h4>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs font-bold text-sky-400 tracking-wider bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                          {{ d.devEUI }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span v-if="!d.isActive" class="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-slate-800 text-slate-400 border-slate-700 flex items-center gap-1.5 shadow-sm" title="Device is disabled">
                      <span class="w-2 h-2 rounded-full bg-slate-500"></span>
                      <span>DISABLED</span>
                    </span>
                    <span v-else-if="isDeviceOnline(d)" class="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/25 flex items-center gap-1.5 shadow-sm" title="Actively transmitting packets">
                      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>ONLINE</span>
                    </span>
                    <span v-else class="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/25 flex items-center gap-1.5 shadow-sm" :title="(d.lastSeenAt || d.syncDetails?.lastSeenAt) ? 'Inactive for > 24 hours' : 'Device has not joined or transmitted packets yet'">
                      <span class="w-2 h-2 rounded-full bg-rose-400"></span>
                      <span>OFFLINE</span>
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono" :class="d.syncStatus === 'SYNCED' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'">
                      {{ d.syncStatus === 'SYNCED' ? 'SYNCED' : (d.syncStatus || 'LOCAL') }}
                    </span>
                  </div>
                </div>

                <!-- Card Body (Organized Sub-Boxes) -->
                <div class="space-y-3 text-xs">
                  
                  <!-- Box 1: Network & Region -->
                  <div class="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-slate-400 flex items-center gap-2">
                        <i class="fa-solid fa-server text-sky-400 w-4 text-center"></i>
                        <span class="font-medium">Network Server:</span>
                      </span>
                      <span v-if="d.networkServer" class="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono font-medium text-xs truncate max-w-[240px]" :title="d.networkServer.name">
                        {{ d.networkServer.name }}
                      </span>
                      <span v-else class="text-slate-500 italic">Local Fleet</span>
                    </div>

                    <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                      <span class="text-slate-400 flex items-center gap-2">
                        <i class="fa-solid fa-globe text-indigo-400 w-4 text-center"></i>
                        <span class="font-medium">Region Profile:</span>
                      </span>
                      <span v-if="d.regionProfileName" class="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-xs truncate max-w-[240px]" :title="d.regionProfileName">
                        {{ d.regionProfileName }}
                      </span>
                      <span v-else class="text-slate-500">Default</span>
                    </div>
                  </div>

                  <!-- Box 2: OTAA Keys -->
                  <div class="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-slate-400 flex items-center gap-2">
                        <i class="fa-solid fa-key text-amber-400 w-4 text-center"></i>
                        <span class="font-medium">AppEUI / JoinEUI:</span>
                      </span>
                      <span class="font-mono text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-semibold tracking-wider text-xs">
                        {{ d.appEUI || '0102030405060708' }}
                      </span>
                    </div>

                    <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                      <span class="text-slate-400 flex items-center gap-2">
                        <i class="fa-solid fa-shield-halved text-emerald-400 w-4 text-center"></i>
                        <span class="font-medium">AppKey:</span>
                      </span>
                      <span class="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-medium tracking-wider text-[11px] truncate max-w-[240px]" :title="d.appKey">
                        {{ d.appKey || '0102030405060708090A0B0C0D0E0F10' }}
                      </span>
                    </div>
                  </div>

                  <!-- Box 3: Product SKU & Firmware Version -->
                  <div class="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-slate-400 flex items-center gap-2">
                        <i class="fa-solid fa-barcode text-cyan-400 w-4 text-center"></i>
                        <span class="font-medium">SKU:</span>
                      </span>
                      <span class="font-mono text-cyan-300 font-bold">
                        {{ d.sku || '—' }}
                      </span>
                    </div>

                    <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                      <span class="text-slate-400 flex items-center gap-2">
                        <i class="fa-solid fa-code-branch text-purple-400 w-4 text-center"></i>
                        <span class="font-medium">Firmware Version:</span>
                      </span>
                      <span class="font-mono text-purple-300 font-bold">
                        {{ formatFirmware(d.firmwareVersion) }}
                      </span>
                    </div>
                  </div>

                </div>

                <!-- Card Footer (Actions) -->
                <div class="pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                    <i class="fa-solid fa-clock-rotate-left text-slate-500"></i>
                    <span class="text-slate-500">Last Seen:</span>
                    <span class="font-mono text-xs" :class="(d.lastSeenAt || d.syncDetails?.lastSeenAt) ? 'text-emerald-400 font-bold' : 'text-slate-500'">
                      {{ formatLastSeen(d.lastSeenAt || d.syncDetails?.lastSeenAt) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button @click="checkDeviceHealth(d)" :disabled="checkingHealthDevEUI === d.devEUI" title="Check Health & Online Status from Network Server API" class="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50">
                      <i class="fa-solid fa-heart-pulse" :class="checkingHealthDevEUI === d.devEUI ? 'animate-spin' : ''"></i> <span>Health</span>
                    </button>
                    <button @click="openEditDeviceDialog(d)" title="Edit Device" class="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition">
                      <i class="fa-solid fa-pen-to-square"></i> <span>Edit</span>
                    </button>
                    <button @click="deleteDevice(d)" title="Delete Device" class="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs cursor-pointer transition flex items-center justify-center">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

          <!-- FEATURE: LIVE TELEMETRY & DECODER -->
          <!-- FEATURE: LIVE TELEMETRY & DECODER -->`;

export const DEVICE_MANAGER_MODALS = `    <!-- MODAL: REGISTER / EDIT DEVICE -->
    <div v-if="registerDeviceDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in text-slate-200">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-microchip text-emerald-400"></i> {{ isEditingDevice ? 'Edit LoRaWAN Device' : 'Register LoRaWAN Device' }}
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
              <button type="button" @click="newDevice.provisionTarget = 'SERVER'" :class="newDevice.provisionTarget !== 'LOCAL' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-slate-950 border-slate-800 text-slate-400'" class="p-2.5 rounded-xl border text-left cursor-pointer transition">
                <div class="font-bold text-xs flex items-center gap-1.5"><i class="fa-solid fa-cloud-arrow-up text-emerald-400"></i> Network Server</div>
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
            <button type="button" @click="newDevice.isActive = !newDevice.isActive" :class="newDevice.isActive ? 'bg-emerald-500' : 'bg-slate-700'" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer flex-shrink-0">
              <span :class="newDevice.isActive ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
            </button>
          </div>

          <!-- Device Name -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Device Name <span class="text-red-400">*</span></label>
            <input v-model="newDevice.name" type="text" required placeholder="e.g. Temperature & Humidity Sensor 01" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>

          <!-- DEV_EUI -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">DEV_EUI (16 Hex Characters) <span class="text-red-400">*</span></label>
            <input v-model="newDevice.devEUI" type="text" required placeholder="0018B20000000001" maxlength="16" minlength="16" :disabled="isEditingDevice" :class="isEditingDevice ? 'opacity-60 cursor-not-allowed bg-slate-900/80 border-slate-800' : 'bg-slate-950 border-slate-700'" class="w-full px-3 py-2 border rounded-lg text-white font-mono uppercase focus:outline-none focus:border-emerald-500" />
            <p v-if="isEditingDevice" class="text-[10px] text-slate-500 mt-0.5">DevEUI is the unique hardware identifier and cannot be modified.</p>
          </div>

          <!-- 2 Columns: Network Server & Region Profile -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Network Server <span v-if="newDevice.provisionTarget !== 'LOCAL'" class="text-red-400">*</span></label>
              <select v-model="newDevice.networkServerId" @change="onDeviceNetworkServerChange" :required="newDevice.provisionTarget !== 'LOCAL'" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
                <option value="" :disabled="newDevice.provisionTarget !== 'LOCAL'">-- Select Network Server --</option>
                <option v-for="ns in networkServersList" :key="ns.id" :value="ns.id">{{ ns.name }}</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Region Profile</label>
              <select v-model="newDevice.regionProfileId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
                <option value="">{{ selectedDeviceNetworkServer ? '-- Select Region --' : 'Default Profile' }}</option>
                <option v-for="rp in availableDeviceRegions" :key="rp.id" :value="rp.id">{{ rp.name }}</option>
              </select>
            </div>
          </div>

          <!-- AppEUI (Pre-filled 0102030405060708) -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">AppEUI / JoinEUI (16 Hex Characters) <span class="text-red-400">*</span></label>
            <input v-model="newDevice.appEUI" type="text" required maxlength="16" minlength="16" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-emerald-500" />
          </div>

          <!-- APP_key (Pre-filled 0102030405060708090A0B0C0D0E0F10) -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">APP_Key (32 Hex Characters) <span class="text-red-400">*</span></label>
            <input v-model="newDevice.appKey" type="text" required maxlength="32" minlength="32" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-emerald-500" />
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
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase text-xs focus:outline-none focus:border-emerald-500"
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
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" @click="registerDeviceDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingDevice" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer">
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

