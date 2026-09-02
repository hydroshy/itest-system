export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Dashboard - Daviteq LoRaWAN</title>
  <link rel="icon" type="image/png" href="/images/favicon.png" />
  <link rel="shortcut icon" href="/images/favicon.png" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #030712;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      color: #f1f5f9;
      font-size: 13.5px;
      overflow-x: hidden;
    }
    .font-mono { font-family: 'JetBrains Mono', monospace !important; }
    .custom-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
    .custom-scroll::-webkit-scrollbar-track { background: #030712; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }

    .glass-header {
      background: rgba(3, 7, 18, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(30, 41, 59, 0.8);
    }
    .glass-card {
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(30, 41, 59, 0.8);
      transition: all 0.2s ease;
    }
    .glass-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 12px 30px -10px rgba(14, 165, 233, 0.15);
    }
    [v-cloak] { display: none !important; }
    .feature-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased">
  <div id="app" v-cloak class="flex-1 flex flex-col" @click="handleGlobalClick">
    
    <!-- TOP APP BAR -->
    <header class="glass-header sticky top-0 z-40 px-4 sm:px-8 h-14 flex items-center justify-between">
      <!-- Left Logo & Menu (Click to return to Dashboard) -->
      <div class="flex items-center gap-3">
        <button
          @click="returnToHome"
          title="Return to Dashboard Home"
          class="flex items-center gap-2.5 text-white font-extrabold text-sm tracking-tight text-decoration-none hover:opacity-90 transition cursor-pointer"
        >
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center p-0.5 shadow-inner overflow-hidden">
            <img src="/images/logo-navbar.png" onerror="this.onerror=null; this.src='/images/logo-full.png'; this.onerror=function(){this.src='/images/favicon.png';};" class="w-full h-full object-contain rounded-md" alt="Daviteq Logo" />
          </div>
          <div class="leading-none text-left">
            <div class="flex items-center gap-1.5">
              <span><span class="text-sky-400">DAVITEQ</span> IoT</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">v1.0</span>
            </div>
            <span class="text-[10px] text-slate-400 font-normal">Dashboard Portal</span>
          </div>
        </button>

        <!-- Breadcrumb / Return button if inside a feature -->
        <div v-if="activeFeature" class="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-400">
          <button @click="returnToHome" class="hover:text-white transition flex items-center gap-1 font-medium cursor-pointer">
            <i class="fa-solid fa-house text-[11px]"></i> Home
          </button>
          <span>/</span>
          <span class="text-sky-400 font-semibold">{{ activeFeature.title }}</span>
        </div>
      </div>

      <!-- Right Actions & User Menu -->
      <div class="flex items-center gap-2.5">
        <!-- Direct Control Panel Button for Super Admin -->
        <a
          v-if="isSuperAdmin"
          href="/control-panel"
          class="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer text-decoration-none"
        >
          <i class="fa-solid fa-sliders text-xs"></i>
          <span class="hidden sm:inline">Control Panel</span>
        </a>

        <!-- User Menu Dropdown Button -->
        <div class="relative">
          <button
            @click.stop="userMenuOpen = !userMenuOpen"
            class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer select-none"
          >
            <div class="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs">
              {{ userInitials }}
            </div>
            <span class="text-xs font-bold text-slate-200">{{ currentUser.fullName || currentUser.username || 'User' }}</span>
            <i :class="userMenuOpen ? 'rotate-180' : ''" class="fa-solid fa-chevron-down text-[10px] text-slate-500 transition-transform duration-150"></i>
          </button>

        <!-- Dropdown Menu Card -->
        <div
          v-if="userMenuOpen"
          @click.stop
          class="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in"
        >
          <!-- User Profile Info -->
          <div class="space-y-1 pb-3 border-b border-slate-800">
            <div class="text-xs font-bold text-white">{{ currentUser.fullName || currentUser.username }}</div>
            <div class="text-[11px] font-mono text-slate-400">@{{ currentUser.username }}</div>
            <div class="pt-1">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {{ isSuperAdmin ? 'SUPER_ADMIN' : (currentUser.roles?.[0]?.name || currentUser.userType || 'USER') }}
              </span>
            </div>
          </div>

          <!-- App Version -->
          <div class="space-y-1 text-xs text-slate-400 pb-3 border-b border-slate-800">
            <div class="flex items-center justify-between text-[11px]">
              <span>Platform:</span>
              <strong class="text-slate-200">Daviteq LoRaWAN</strong>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span>System Version:</span>
              <strong class="text-emerald-400 font-mono">v1.0.0 (NestJS)</strong>
            </div>
          </div>

          <!-- Admin Control Panel Link (if admin) -->
          <div v-if="isSuperAdmin" class="pt-0.5">
            <a
              href="/control-panel"
              class="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition flex items-center justify-between cursor-pointer text-decoration-none"
            >
              <span class="flex items-center gap-2"><i class="fa-solid fa-sliders text-sky-400"></i> Control Panel</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-500"></i>
            </a>
          </div>

          <!-- Logout Button -->
          <button
            @click="handleLogout"
            class="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </div>
    </header>

    <!-- MAIN BODY CONTAINER -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
      
      <!-- MODE 1: FEATURE MODULES GRID (Dashboard Home) -->
      <div v-if="!activeFeature" class="space-y-6">
        <!-- Welcome Hero Banner -->
        <div class="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div class="relative z-10 space-y-2 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-semibold">
              <i class="fa-solid fa-layer-group"></i> Operational Dashboard
            </div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Welcome back, {{ currentUser.fullName || currentUser.username || 'User' }}
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Select an operational feature module below to inspect telemetry, manage devices, analyze sensor data, or configure integrations.
            </p>
          </div>
        </div>

        <!-- Section Title -->
        <div class="flex items-center justify-between pt-2">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Operational Feature Modules</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">{{ accessibleFeatures.length }}</span>
          </div>
          <span class="text-xs text-slate-500 font-medium">Click any card to launch module</span>
        </div>

        <!-- Grid of Action Feature Buttons / Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="feature in accessibleFeatures"
            :key="feature.id"
            @click="openFeature(feature)"
            class="glass-card rounded-2xl p-5 space-y-3 cursor-pointer group flex flex-col justify-between"
          >
            <!-- Card Header -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div :class="'bg-gradient-to-br ' + feature.color" class="feature-icon-box text-white shadow-lg">
                  <i :class="feature.icon"></i>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {{ feature.badge || feature.category }}
                </span>
              </div>

              <!-- Title & Description -->
              <div>
                <h3 class="text-sm font-bold text-white group-hover:text-sky-400 transition flex items-center justify-between">
                  <span>{{ feature.title }}</span>
                </h3>
                <p class="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {{ feature.description }}
                </p>
              </div>
            </div>

            <!-- Card Action Footer -->
            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 group-hover:text-sky-400 transition font-semibold">
              <span>Open Module</span>
              <i class="fa-solid fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </div>

        <!-- Empty state if no modules assigned -->
        <div v-if="accessibleFeatures.length === 0" class="glass-card rounded-2xl p-8 text-center space-y-2">
          <i class="fa-solid fa-lock text-3xl text-slate-600 mb-2"></i>
          <h3 class="text-sm font-bold text-white">No Assigned Feature Modules</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Your account currently has no feature modules assigned. Please contact your Super Administrator to configure role permissions.
          </p>
        </div>
      </div>

      <!-- MODE 2: ACTIVE FEATURE MODULE VIEW -->
      <div v-else class="space-y-4">
        <!-- Feature Header Banner -->
        <div class="glass-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <button
              @click="returnToHome"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
            </button>
            <div>
              <h2 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <i :class="activeFeature.icon" class="text-sky-400"></i> {{ activeFeature.title }}
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">{{ activeFeature.description }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Module: {{ activeFeature.code }}
            </span>
          </div>
        </div>

        <!-- Feature Content Container (Ready for independent source modular development) -->
        <div class="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          
          <!-- Sample Module Preview Content based on active feature -->
          <div v-if="activeFeature.id === 'telemetry-monitor'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Ingestion Packets</h3>
              <button @click="fetchLiveTelemetry" class="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer">
                <i class="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
            </div>
            <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3">Time</th>
                    <th class="py-2.5 px-3">DevEUI</th>
                    <th class="py-2.5 px-3">Port / FCnt</th>
                    <th class="py-2.5 px-3">Raw Payload</th>
                    <th class="py-2.5 px-3">Decoded JSON</th>
                    <th class="py-2.5 px-3">Signal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-if="telemetryList.length === 0">
                    <td colspan="6" class="py-6 text-center text-slate-500 font-sans">No incoming telemetry packets yet. Send a LoRaWAN webhook to see real-time data.</td>
                  </tr>
                  <tr v-for="t in telemetryList" :key="t.id" class="hover:bg-slate-800/30">
                    <td class="py-2 px-3 text-slate-400">{{ formatTime(t.timestamp || t.createdAt) }}</td>
                    <td class="py-2 px-3 font-bold text-sky-400">{{ t.devEUI }}</td>
                    <td class="py-2 px-3 text-amber-400">p:{{ t.fPort || 1 }} / c:{{ t.fCnt || 0 }}</td>
                    <td class="py-2 px-3 text-slate-300 truncate max-w-xs">{{ t.payloadHex || '--' }}</td>
                    <td class="py-2 px-3 text-emerald-400 truncate max-w-sm">{{ JSON.stringify(t.decodedPayload) }}</td>
                    <td class="py-2 px-3 text-slate-400">{{ t.rssi !== undefined ? t.rssi + ' dBm' : '--' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="activeFeature.id === 'device-fleet'" class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <i class="fa-solid fa-microchip text-emerald-400"></i> Registered LoRaWAN End-Devices
                </h3>
                <p class="text-[11px] text-slate-400 mt-0.5">Provisioned end-devices on ThingPark Wireless & ChirpStack v4</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="fetchDevices" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button @click="openRegisterDeviceDialog" class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-plus"></i> Register Device
                </button>
              </div>
            </div>

            <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3.5">DevEUI</th>
                    <th class="py-2.5 px-3.5">Device Name</th>
                    <th class="py-2.5 px-3.5">Network Server</th>
                    <th class="py-2.5 px-3.5">Region Profile</th>
                    <th class="py-2.5 px-3.5">AppEUI</th>
                    <th class="py-2.5 px-3.5">AppKey</th>
                    <th class="py-2.5 px-3.5">Sync Status</th>
                    <th class="py-2.5 px-3.5">Status</th>
                    <th class="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-if="devicesList.length === 0">
                    <td colspan="9" class="py-6 text-center text-slate-500">No devices registered. Click "Register Device" above to add your first LoRaWAN device.</td>
                  </tr>
                  <tr v-for="d in devicesList" :key="d.id || d.devEUI" class="hover:bg-slate-800/30 transition">
                    <td class="py-2.5 px-3.5 font-mono font-bold text-sky-400">{{ d.devEUI }}</td>
                    <td class="py-2.5 px-3.5 font-bold text-white">{{ d.name }}</td>
                    <td class="py-2.5 px-3.5">
                      <span v-if="d.networkServer" class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono">
                        {{ d.networkServer.name }} ({{ d.networkServer.type }})
                      </span>
                      <span v-else class="text-slate-500 text-[11px]">Unassigned</span>
                    </td>
                    <td class="py-2.5 px-3.5">
                      <span v-if="d.regionProfileName" class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono">
                        {{ d.regionProfileName }}
                      </span>
                      <span v-else class="text-slate-500 text-[11px]">--</span>
                    </td>
                    <td class="py-2.5 px-3.5 font-mono text-slate-300 text-[11px]">{{ d.appEUI || '0102030405060708' }}</td>
                    <td class="py-2.5 px-3.5 font-mono text-slate-400 text-[11px]">
                      <span :title="d.appKey">{{ d.appKey ? d.appKey.slice(0, 6) + '...' + d.appKey.slice(-6) : '010203...0F10' }}</span>
                    </td>
                    <td class="py-2.5 px-3.5">
                      <span :class="d.syncStatus === 'SYNCED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border-amber-500/25'" class="px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-max">
                        <span class="w-1.5 h-1.5 rounded-full" :class="d.syncStatus === 'SYNCED' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
                        <span>{{ d.syncStatus || 'SYNCED' }}</span>
                      </span>
                    </td>
                    <td class="py-2.5 px-3.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="d.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'">
                        {{ d.isActive ? 'ACTIVE' : 'INACTIVE' }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3.5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button v-if="d.networkServer" @click="syncDevice(d)" title="Re-sync to Network Server" class="p-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs cursor-pointer">
                          <i class="fa-solid fa-arrows-rotate"></i>
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

          <!-- General Module Template for independent module source extension -->
          <div v-else class="text-center py-10 space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 text-2xl mx-auto shadow-inner">
              <i :class="activeFeature.icon"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-white">{{ activeFeature.title }} Module</h3>
              <p class="text-xs text-slate-400 max-w-md mx-auto">
                {{ activeFeature.description }}
              </p>
            </div>
            <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl max-w-md mx-auto text-left font-mono text-xs space-y-1">
              <div class="text-slate-500">// Module Source Directory:</div>
              <div class="text-sky-400">src/features/{{ activeFeature.id }}/</div>
              <div class="text-emerald-400">// Status: Ready for business logic development</div>
            </div>
          </div>

        </div>
      </div>

    </main>

    <!-- MODAL: REGISTER DEVICE -->
    <div v-if="registerDeviceDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in text-slate-200">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-microchip text-emerald-400"></i> Register LoRaWAN Device
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Provision end-device to Network Server (ThingPark / ChirpStack)</p>
          </div>
          <button @click="registerDeviceDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <!-- Provisioning Architecture Notice Banner -->
        <div v-if="selectedDeviceNetworkServer" class="p-3 rounded-xl border text-xs space-y-1.5"
          :class="selectedDeviceNetworkServer.type === 'CHIRPSTACK' ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200' : 'bg-sky-950/40 border-sky-500/30 text-sky-200'">
          <div class="flex items-center justify-between font-bold">
            <span class="flex items-center gap-1.5">
              <i :class="selectedDeviceNetworkServer.type === 'CHIRPSTACK' ? 'fa-solid fa-layer-group text-indigo-400' : 'fa-solid fa-bolt text-sky-400'"></i>
              <span>{{ selectedDeviceNetworkServer.name }} ({{ selectedDeviceNetworkServer.type }})</span>
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
              :class="selectedDeviceNetworkServer.type === 'CHIRPSTACK' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-sky-500/20 text-sky-300'">
              {{ selectedDeviceNetworkServer.type === 'CHIRPSTACK' ? '2-Step Provisioning' : '1-Step Provisioning' }}
            </span>
          </div>
          <p class="text-[11px] opacity-90 leading-relaxed">
            <span v-if="selectedDeviceNetworkServer.type === 'CHIRPSTACK'">
              🔄 <strong>2-Step ChirpStack Flow:</strong> Step 1 creates device with AppEUI (JoinEUI) at <code>POST /api/devices</code> ➔ Step 2 configures AppKey at <code>POST /api/devices/{devEUI}/keys</code>.
            </span>
            <span v-else>
              ⚡ <strong>1-Step ThingPark Flow:</strong> Single DX REST payload provisions DevEUI, Name, AppEUI, and AppKey directly in 1 step.
            </span>
          </p>
        </div>

        <form @submit.prevent="submitRegisterDevice" class="space-y-3.5 text-xs">
          <!-- Device Name -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Device Name <span class="text-red-400">*</span></label>
            <input v-model="newDevice.name" type="text" required placeholder="e.g. Temperature & Humidity Sensor 01" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>

          <!-- DEV_EUI -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">DEV_EUI (16 Hex Characters) <span class="text-red-400">*</span></label>
            <input v-model="newDevice.devEUI" type="text" required placeholder="0018B20000000001" maxlength="16" minlength="16" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-emerald-500" />
          </div>

          <!-- 2 Columns: Network Server & Region Profile -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Network Server <span class="text-red-400">*</span></label>
              <select v-model="newDevice.networkServerId" @change="onDeviceNetworkServerChange" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
                <option value="" disabled>-- Select Network Server --</option>
                <option v-for="ns in networkServersList" :key="ns.id" :value="ns.id">{{ ns.name }} ({{ ns.type }})</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Region Profile <span class="text-red-400">*</span></label>
              <select v-model="newDevice.regionProfileId" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
                <option value="" disabled>{{ selectedDeviceNetworkServer ? '-- Select Region --' : 'Select a Network Server first' }}</option>
                <option v-for="rp in availableDeviceRegions" :key="rp.id" :value="rp.id">{{ rp.name }} ({{ rp.region }})</option>
              </select>
            </div>
          </div>

          <!-- AppEUI (Pre-filled 0102030405060708) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-semibold text-slate-300">AppEUI / JoinEUI (16 Hex Characters) <span class="text-red-400">*</span></label>
              <span class="text-[10px] text-emerald-400 font-mono font-bold">Default Pre-filled</span>
            </div>
            <input v-model="newDevice.appEUI" type="text" required maxlength="16" minlength="16" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-emerald-500" />
          </div>

          <!-- APP_key (Pre-filled 0102030405060708090A0B0C0D0E0F10) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-semibold text-slate-300">APP_Key (32 Hex Characters) <span class="text-red-400">*</span></label>
              <span class="text-[10px] text-emerald-400 font-mono font-bold">Default Pre-filled</span>
            </div>
            <input v-model="newDevice.appKey" type="text" required maxlength="32" minlength="32" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-emerald-500" />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" @click="registerDeviceDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingDevice" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer">
              <i v-if="savingDevice" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else class="fa-solid fa-plus"></i>
              <span>{{ savingDevice ? 'Provisioning Device...' : 'Register & Provision' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <div v-if="toast.show" class="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold" :class="toast.type === 'error' ? 'bg-red-950 border border-red-500 text-red-200' : (toast.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-200' : 'bg-sky-950 border border-sky-500 text-sky-200')">
      <i :class="toast.type === 'error' ? 'fa-solid fa-circle-exclamation text-red-400' : (toast.type === 'success' ? 'fa-solid fa-circle-check text-emerald-400' : 'fa-solid fa-circle-info text-sky-400')"></i>
      <span>{{ toast.text }}</span>
    </div>

  </div>

  <script src="https://cdn.jsdelivr.net/npm/vue@3.4.31/dist/vue.global.prod.js"></script>
  <script>
    const { createApp, ref, computed, onMounted } = Vue;

    createApp({
      setup() {
        const currentUser = ref({});
        const accessibleFeatures = ref([]);
        const activeFeature = ref(null);
        const userMenuOpen = ref(false);

        const telemetryList = ref([]);
        const devicesList = ref([]);
        const networkServersList = ref([]);

        const registerDeviceDialog = ref(false);
        const savingDevice = ref(false);
        const toast = ref({ show: false, text: '', type: 'info' });

        const showToast = (text, type = 'info') => {
          toast.value = { show: true, text, type };
          setTimeout(() => { toast.value.show = false; }, 3500);
        };

        const newDevice = ref({
          name: '',
          devEUI: '',
          networkServerId: '',
          regionProfileId: '',
          appEUI: '0102030405060708',
          appKey: '0102030405060708090A0B0C0D0E0F10',
          activationType: 'OTAA',
        });

        const selectedDeviceNetworkServer = computed(() => {
          if (!newDevice.value.networkServerId) return null;
          return networkServersList.value.find(ns => ns.id === newDevice.value.networkServerId) || null;
        });

        const availableDeviceRegions = computed(() => {
          const ns = selectedDeviceNetworkServer.value;
          if (!ns || !Array.isArray(ns.regionProfiles)) return [];
          return ns.regionProfiles.filter(rp => rp.isActive !== false);
        });

        const onDeviceNetworkServerChange = () => {
          const regions = availableDeviceRegions.value;
          if (regions && regions.length > 0) {
            newDevice.value.regionProfileId = regions[0].id;
          } else {
            newDevice.value.regionProfileId = '';
          }
        };

        const userInitials = computed(() => {
          const name = currentUser.value.fullName || currentUser.value.username || 'U';
          return name.slice(0, 2).toUpperCase();
        });

        const isSuperAdmin = computed(() => {
          const user = currentUser.value;
          if (!user) return false;
          if (user.username === 'admin') return true;
          if (user.userType === 'ADMIN' || String(user.userType).toUpperCase() === 'ADMIN') return true;
          if (user.roles && Array.isArray(user.roles)) {
            return user.roles.some(r => (r.code || r) === 'SUPER_ADMIN');
          }
          return false;
        });

        const getAuthToken = () => {
          let token = localStorage.getItem('lorawan_token');
          if (!token || token === 'undefined' || token === 'null') {
            const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
            if (match && match[1] && match[1] !== 'undefined') {
              token = decodeURIComponent(match[1]);
            }
          }
          return token;
        };

        const authHeaders = () => {
          const headers = { 'Content-Type': 'application/json' };
          const token = getAuthToken();
          if (token) headers['Authorization'] = 'Bearer ' + token;
          return headers;
        };

        const handleGlobalClick = () => {
          userMenuOpen.value = false;
        };

        const returnToHome = () => {
          activeFeature.value = null;
          window.location.hash = '';
        };

        const openFeature = (feature) => {
          activeFeature.value = feature;
          window.location.hash = feature.id;
          if (feature.id === 'telemetry-monitor') fetchLiveTelemetry();
          if (feature.id === 'device-fleet') {
            fetchDevices();
            fetchNetworkServers();
          }
        };

        const handleLogout = async () => {
          try {
            await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
          } catch(e) {}
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch(e) {}
          const cookies = ["access_token", "lorawan_token", "session_id", "connect.sid"];
          cookies.forEach(c => {
            document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;";
            document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
          });
          window.location.replace('/login?logout=1');
        };

        const fetchSession = async () => {
          const token = getAuthToken();
          if (!token) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('/login');
            return false;
          }
          try {
            const res = await fetch('/auth/session', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              currentUser.value = await res.json();
              return true;
            } else {
              localStorage.clear();
              sessionStorage.clear();
              window.location.replace('/login');
              return false;
            }
          } catch(e) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('/login');
            return false;
          }
        };

        const fetchFeatures = async () => {
          try {
            const res = await fetch('/api/features', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              accessibleFeatures.value = await res.json();
              
              // Check if URL hash maps to a feature
              const hash = window.location.hash.replace('#', '').trim();
              if (hash) {
                const found = accessibleFeatures.value.find(f => f.id === hash);
                if (found) {
                  activeFeature.value = found;
                  if (found.id === 'telemetry-monitor') fetchLiveTelemetry();
                  if (found.id === 'device-fleet') {
                    fetchDevices();
                    fetchNetworkServers();
                  }
                }
              }
            }
          } catch(e) {
            console.error(e);
          }
        };

        const fetchLiveTelemetry = async () => {
          try {
            const res = await fetch('/lorawan/telemetry?limit=25', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) telemetryList.value = await res.json();
          } catch(e) {}
        };

        const fetchDevices = async () => {
          try {
            const res = await fetch('/lorawan/devices', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) devicesList.value = await res.json();
          } catch(e) {}
        };

        const fetchNetworkServers = async () => {
          try {
            const res = await fetch('/api/network-servers', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) networkServersList.value = await res.json();
          } catch(e) {}
        };

        const openRegisterDeviceDialog = () => {
          const defaultNs = networkServersList.value.find(ns => ns.isDefault) || networkServersList.value[0];
          const defaultNsId = defaultNs ? defaultNs.id : '';
          const defaultRegionId = defaultNs && Array.isArray(defaultNs.regionProfiles) && defaultNs.regionProfiles.length > 0
            ? defaultNs.regionProfiles[0].id
            : '';

          newDevice.value = {
            name: '',
            devEUI: '',
            networkServerId: defaultNsId,
            regionProfileId: defaultRegionId,
            appEUI: '0102030405060708',
            appKey: '0102030405060708090A0B0C0D0E0F10',
            activationType: 'OTAA',
          };
          registerDeviceDialog.value = true;
        };

        const submitRegisterDevice = async () => {
          if (!newDevice.value.name.trim()) {
            showToast("Please enter device name", "error");
            return;
          }
          if (!newDevice.value.devEUI.trim()) {
            showToast("Please enter DevEUI (16 Hex characters)", "error");
            return;
          }
          savingDevice.value = true;
          try {
            const res = await fetch('/lorawan/devices', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                name: newDevice.value.name.trim(),
                devEUI: newDevice.value.devEUI.trim().toUpperCase(),
                networkServerId: newDevice.value.networkServerId || undefined,
                regionProfileId: newDevice.value.regionProfileId || undefined,
                appEUI: newDevice.value.appEUI ? newDevice.value.appEUI.trim().toUpperCase() : '0102030405060708',
                appKey: newDevice.value.appKey ? newDevice.value.appKey.trim().toUpperCase() : '0102030405060708090A0B0C0D0E0F10',
                activationType: 'OTAA',
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to register device");
            showToast(data.message || "Device registered & provisioned successfully!", "success");
            registerDeviceDialog.value = false;
            fetchDevices();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingDevice.value = false;
          }
        };

        const deleteDevice = async (d) => {
          if (!confirm("Are you sure you want to delete device '" + d.name + "' (" + d.devEUI + ")?")) return;
          try {
            const res = await fetch('/lorawan/devices/' + d.devEUI, {
              method: 'DELETE',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete device");
            showToast("Device " + d.devEUI + " deleted successfully", "success");
            fetchDevices();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        const syncDevice = async (d) => {
          try {
            showToast("Provisioning " + d.devEUI + " to Network Server...", "info");
            const res = await fetch('/lorawan/devices/' + d.devEUI + '/sync', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Sync failed");
            showToast(data.provisioning?.summaryMessage || ("Device " + d.devEUI + " synced successfully"), "success");
            fetchDevices();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        const formatTime = (ts) => {
          if (!ts) return '--';
          return new Date(ts).toLocaleTimeString();
        };

        const initDashboard = async () => {
          const ok = await fetchSession();
          if (ok) {
            await fetchFeatures();
            fetchNetworkServers();
          }
        };

        onMounted(() => {
          initDashboard();
        });

        window.addEventListener('pageshow', (event) => {
          initDashboard();
        });

        return {
          currentUser,
          accessibleFeatures,
          activeFeature,
          userMenuOpen,
          userInitials,
          isSuperAdmin,
          telemetryList,
          devicesList,
          networkServersList,
          registerDeviceDialog,
          savingDevice,
          newDevice,
          selectedDeviceNetworkServer,
          availableDeviceRegions,
          onDeviceNetworkServerChange,
          openRegisterDeviceDialog,
          submitRegisterDevice,
          deleteDevice,
          syncDevice,
          toast,
          handleGlobalClick,
          returnToHome,
          openFeature,
          handleLogout,
          fetchLiveTelemetry,
          fetchDevices,
          formatTime
        };
      }
    }).mount('#app');
  </script>
</body>
</html>
`;
