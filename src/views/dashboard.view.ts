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
  <link rel="prefetch" href="/control-panel" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @keyframes pageFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    body {
      background-color: #030712;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      color: #f1f5f9;
      font-size: 13.5px;
      overflow-x: hidden;
      animation: pageFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    body.page-transitioning {
      opacity: 0;
      transform: translateY(-4px);
      pointer-events: none;
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
    <header class="glass-header sticky top-0 z-40 px-4 sm:px-6 h-14 flex items-center justify-between">
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
        <!-- User Menu Dropdown Button -->
        <div class="relative">
          <button
            @click.stop="userMenuOpen = !userMenuOpen"
            class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer select-none"
          >
            <div class="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs">
              {{ userInitials }}
            </div>
            <span class="text-xs font-bold text-slate-200 hidden sm:inline">{{ currentUser.fullName || currentUser.username || 'User' }}</span>
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

            <!-- Portal Switch Navigation Links -->
            <div class="space-y-1 text-xs pb-3 border-b border-slate-800">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-1">Switch View</div>
              
              <div class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
                <span class="flex items-center gap-2"><i class="fa-solid fa-layer-group"></i> User Dashboard</span>
                <span class="text-[9px] font-mono font-bold uppercase bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-300">Active</span>
              </div>

              <button
                v-if="isSuperAdmin"
                @click="navigateTo('/control-panel')"
                class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition flex items-center justify-between cursor-pointer"
              >
                <span class="flex items-center gap-2"><i class="fa-solid fa-sliders text-sky-400"></i> Admin Control Panel</span>
                <i class="fa-solid fa-arrow-right text-[10px] text-slate-500"></i>
              </button>
            </div>

            <!-- App Version -->
            <div class="space-y-1 text-xs text-slate-400 pb-3 border-b border-slate-800">
              <div class="flex items-center justify-between text-[11px]">
                <span>Platform:</span>
                <strong class="text-slate-200">Daviteq LoRaWAN</strong>
              </div>
              <div class="flex items-center justify-between text-[11px]">
                <span>Core Engine:</span>
                <strong class="text-emerald-400 font-mono">v1.0.0 (NestJS)</strong>
              </div>
            </div>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              class="w-full py-2 px-3 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <i class="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- MAIN BODY CONTAINER -->
    <main class="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
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
            <h2 class="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Dashboard Modules</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">{{ accessibleFeatures.length }}</span>
          </div>
          <span class="text-xs text-slate-500 font-medium">Click any card to launch module</span>
        </div>

        <!-- Grid of Action Feature Buttons / Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4.5">
          <div
            v-for="feature in accessibleFeatures"
            :key="feature.id"
            @click="openFeature(feature)"
            class="glass-card rounded-2xl p-5 space-y-3 cursor-pointer group flex flex-col justify-between"
            :class="feature.span === 2 ? 'sm:col-span-2 md:col-span-2' : 'col-span-1'"
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
          <h3 class="text-sm font-bold text-white">No Assigned Dashboard Modules</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Your account currently has no dashboard modules assigned. Please contact your Super Administrator to configure role permissions.
          </p>
        </div>
      </div>

      <!-- MODE 2: ACTIVE FEATURE MODULE VIEW -->
      <div v-else class="space-y-4">
        <!-- Feature Content Container -->
        <div class="glass-card rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6">
          
          <!-- FEATURE: DEVICE MANAGER (CARD GRID) -->
          <div v-if="activeFeature.id === 'device-manager'" class="space-y-5">
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

          <!-- General Module Template for independent module source extension -->
          <div v-else class="text-center py-10 space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 text-2xl mx-auto shadow-inner">
              <i :class="activeFeature.icon"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-white">{{ activeFeature.title }} Module</h3>
              <p class="text-xs text-slate-400 max-w-md mx-auto">{{ activeFeature.description }}</p>
            </div>
            <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 max-w-lg mx-auto text-xs text-slate-400">
              <span class="font-bold text-slate-300">Feature Code:</span> <code class="text-sky-400 font-mono">{{ activeFeature.code }}</code>
            </div>
          </div>

        </div>
      </div>

    </main>

    <!-- MODAL: REGISTER / EDIT DEVICE -->
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
        const isEditingDevice = ref(false);
        const savingDevice = ref(false);
        const deleteConfirmDialog = ref(false);
        const deviceToDelete = ref(null);
        const deletingDevice = ref(false);
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

        const deviceSearchQuery = ref('');
        const filteredDevices = computed(() => {
          if (!deviceSearchQuery.value.trim()) return devicesList.value;
          const q = deviceSearchQuery.value.trim().toLowerCase();
          return devicesList.value.filter(d => 
            (d.name && d.name.toLowerCase().includes(q)) ||
            (d.devEUI && d.devEUI.toLowerCase().includes(q)) ||
            (d.networkServer && d.networkServer.name && d.networkServer.name.toLowerCase().includes(q)) ||
            (d.regionProfileName && d.regionProfileName.toLowerCase().includes(q))
          );
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

        const navigateTo = (url) => {
          userMenuOpen.value = false;
          document.body.classList.add('page-transitioning');
          setTimeout(() => {
            window.location.href = url;
          }, 120);
        };

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
          if (feature.id === 'device-manager' || feature.id === 'device-fleet') {
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
                  if (found.id === 'device-manager' || found.id === 'device-fleet') {
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
          isEditingDevice.value = false;
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
            provisionTarget: 'SERVER',
            isActive: true,
          };
          registerDeviceDialog.value = true;
        };

        const openEditDeviceDialog = (d) => {
          isEditingDevice.value = true;
          const nsId = d.networkServerId || (d.networkServer ? d.networkServer.id : '');
          let regId = d.regionProfileId || '';
          if (!regId && nsId) {
            const ns = networkServersList.value.find(n => n.id === nsId);
            if (ns && Array.isArray(ns.regionProfiles) && ns.regionProfiles.length > 0) {
              regId = ns.regionProfiles[0].id;
            }
          }

          newDevice.value = {
            name: d.name || '',
            devEUI: d.devEUI || '',
            networkServerId: nsId,
            regionProfileId: regId,
            appEUI: d.appEUI || '0102030405060708',
            appKey: d.appKey || '0102030405060708090A0B0C0D0E0F10',
            activationType: d.activationMode || 'OTAA',
            provisionTarget: d.syncStatus === 'LOCAL' ? 'LOCAL' : 'SERVER',
            isActive: d.isActive !== undefined ? d.isActive : true,
          };
          registerDeviceDialog.value = true;
        };

        const submitDeviceForm = async () => {
          if (!newDevice.value.name.trim()) {
            showToast("Please enter device name", "error");
            return;
          }
          if (!newDevice.value.devEUI.trim()) {
            showToast("Please enter DevEUI (16 Hex characters)", "error");
            return;
          }
          if (!isEditingDevice.value && newDevice.value.provisionTarget !== 'LOCAL' && !newDevice.value.networkServerId) {
            showToast("Please select a Network Server or switch to Local Fleet mode", "error");
            return;
          }

          savingDevice.value = true;
          try {
            const isEdit = isEditingDevice.value;
            const cleanDevEUI = newDevice.value.devEUI.trim().toUpperCase();
            const url = isEdit ? '/lorawan/devices/' + cleanDevEUI : '/lorawan/devices';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
              method,
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                name: newDevice.value.name.trim(),
                devEUI: cleanDevEUI,
                networkServerId: newDevice.value.networkServerId || undefined,
                regionProfileId: newDevice.value.regionProfileId || undefined,
                appEUI: newDevice.value.appEUI ? newDevice.value.appEUI.trim().toUpperCase() : '0102030405060708',
                appKey: newDevice.value.appKey ? newDevice.value.appKey.trim().toUpperCase() : '0102030405060708090A0B0C0D0E0F10',
                activationType: newDevice.value.activationType || 'OTAA',
                provisionTarget: newDevice.value.provisionTarget || 'SERVER',
                isActive: Boolean(newDevice.value.isActive),
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || (isEdit ? "Failed to update device" : "Failed to register device"));
            showToast(data.message || (isEdit ? "Device updated successfully!" : "Device registered successfully!"), "success");
            registerDeviceDialog.value = false;
            fetchDevices();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingDevice.value = false;
          }
        };

        const deleteDevice = (d) => {
          deviceToDelete.value = d;
          deleteConfirmDialog.value = true;
        };

        const confirmDeleteDevice = async () => {
          if (!deviceToDelete.value) return;
          deletingDevice.value = true;
          const d = deviceToDelete.value;
          try {
            const res = await fetch('/lorawan/devices/' + d.devEUI, {
              method: 'DELETE',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete device");
            showToast("Device " + (d.name || d.devEUI) + " deleted successfully", "success");
            deleteConfirmDialog.value = false;
            deviceToDelete.value = null;
            fetchDevices();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            deletingDevice.value = false;
          }
        };

        const checkingHealthDevEUI = ref(null);

        const isDeviceOnline = (d) => {
          if (!d || d.isActive === false) return false;
          const lastSeen = d.lastSeenAt || (d.syncDetails && d.syncDetails.lastSeenAt);
          if (!lastSeen) return false;
          const t = new Date(lastSeen).getTime();
          if (isNaN(t)) return false;
          return (Date.now() - t) < 24 * 60 * 60 * 1000;
        };

        const checkDeviceHealth = async (device) => {
          checkingHealthDevEUI.value = device.devEUI;
          try {
            const res = await fetch('/lorawan/devices/' + device.devEUI + '/health', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Health check failed");
            
            if (data.device) {
              Object.assign(device, data.device);
            }
            if (data.health) {
              device.lastSeenAt = data.health.lastSeenAt || null;
              if (device.syncDetails) {
                device.syncDetails.lastSeenAt = data.health.lastSeenAt || null;
              }
              device.isOnline = Boolean(data.health.isOnline);
            }
            
            showToast(data.health?.message || "Device health check completed", data.health?.isOnline ? "success" : "info");
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            checkingHealthDevEUI.value = null;
          }
        };

        const formatLastSeen = (ts) => {
          if (!ts) return 'Never joined';
          try {
            const d = new Date(ts);
            if (isNaN(d.getTime())) return 'Never joined';
            const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
            if (diffSec < 0) return 'Just now';
            if (diffSec < 60) return 'Just now';
            if (diffSec < 3600) return Math.floor(diffSec / 60) + 'm ago';
            if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          } catch(e) {
            return 'Never joined';
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
          navigateTo,
          isSuperAdmin,
          telemetryList,
          devicesList,
          deviceSearchQuery,
          filteredDevices,
          networkServersList,
          registerDeviceDialog,
          isEditingDevice,
          savingDevice,
          deleteConfirmDialog,
          deviceToDelete,
          deletingDevice,
          newDevice,
          selectedDeviceNetworkServer,
          availableDeviceRegions,
          onDeviceNetworkServerChange,
          openRegisterDeviceDialog,
          openEditDeviceDialog,
          submitDeviceForm,
          deleteDevice,
          confirmDeleteDevice,
          checkingHealthDevEUI,
          checkDeviceHealth,
          formatLastSeen,
          isDeviceOnline,
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
