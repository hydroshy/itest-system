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
  <!-- SheetJS for XLSX, XLS, and CSV export -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <!-- Socket.IO Client for Realtime Uplink & Downlink Streaming -->
  <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.7.4/dist/socket.io.min.js"></script>
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
    .custom-scroll::-webkit-scrollbar { width: 6px; height: 10px; }
    .custom-scroll::-webkit-scrollbar-track { background: #090d16; border-radius: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #475569; border-radius: 6px; border: 2px solid #090d16; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #64748b; }

    /* Top Horizontal Scrollbar */
    .top-horizontal-scroll {
      height: 14px;
      overflow-y: hidden;
    }
    .top-horizontal-scroll::-webkit-scrollbar {
      height: 10px;
    }
    .top-horizontal-scroll::-webkit-scrollbar-track {
      background: #090d16;
      border-radius: 6px;
    }
    .top-horizontal-scroll::-webkit-scrollbar-thumb {
      background: #7c3aed;
      border-radius: 6px;
      border: 2px solid #090d16;
    }
    .top-horizontal-scroll::-webkit-scrollbar-thumb:hover {
      background: #9333ea;
    }

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

              <a
                v-if="isSuperAdmin"
                :href="standaloneOpsUrl"
                target="_blank"
                class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition flex items-center justify-between cursor-pointer"
                title="Open DevOps & System Lifecycle Console (Port 3099)"
              >
                <span class="flex items-center gap-2"><i class="fa-solid fa-bolt text-amber-400"></i> DevOps Ops Manager</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-amber-400/80"></i>
              </a>
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
          </div>
        </div>

        <!-- Grid of Action Feature Buttons / Cards (12-Column Responsive Layout) -->
        <div class="grid grid-cols-12 gap-4 sm:gap-6">
          <div
            v-for="feature in accessibleFeatures"
            :key="feature.id"
            @click="openFeature(feature)"
            class="glass-card rounded-2xl p-5 sm:p-6 space-y-4 cursor-pointer group flex flex-col justify-between hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-200"
            :class="feature.span === 2 ? 'col-span-12 md:col-span-12 lg:col-span-8' : 'col-span-12 sm:col-span-6 lg:col-span-4'"
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
          <!-- FEATURE: LIVE TELEMETRY & DECODER -->
          <div v-else-if="activeFeature.id === 'telemetry-decoder'" class="space-y-4">

            <!-- Header Toolbar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-xl">
              <div class="flex items-center gap-3.5">
                <button @click="returnToHome" title="Back to Dashboard" class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition">
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 text-xl shadow-inner">
                  <i class="fa-solid fa-table-cells"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-sm font-bold text-white tracking-wide">LIVE TELEMETRY & SENSOR MATRIX</h3>
                    <span v-if="telemetryLoaded" class="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[10px] font-bold font-mono">
                      {{ sortedDashboardMatrixRows.length }} / {{ dashboardMatrixRows.length }} RECORDS
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Time-series tabular log — network metadata & decoded sensor telemetry</p>
                </div>
              </div>
              <!-- Auto-Sync Controls (visible when telemetry loaded) -->
              <div v-if="telemetryLoaded" class="flex items-center gap-2 flex-wrap">
                <button
                  @click="toggleAutoSync"
                  :title="autoSyncEnabled ? 'Click to Pause Auto-Sync' : 'Click to Enable Auto-Sync'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 cursor-pointer"
                  :class="autoSyncEnabled ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60' : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'"
                >
                  <span class="relative flex h-2 w-2">
                    <span v-if="autoSyncEnabled" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2" :class="autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-500'"></span>
                  </span>
                  <span class="font-mono text-[11px] font-bold">{{ autoSyncEnabled ? 'LIVE (3s)' : 'PAUSED' }}</span>
                </button>
                <button
                  @click="fetchLiveTelemetry(false)"
                  title="Manually fetch latest telemetry packets"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': loadingTelemetry }"></i>
                  <span>REFRESH</span>
                </button>
              </div>
            </div>

            <!-- TOP CONTROLS PANEL: CONTROLS (LEFT) + DEVICE INFO (RIGHT) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

              <!-- BÊN TRÁI (lg:col-span-7): CHỌN DEVICE, TIME RANGE, NÚT SHOW & DELETE -->
              <div class="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xl">
                <!-- 1. Chọn Device -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="block text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                      <i class="fa-solid fa-microchip text-purple-400 mr-1.5"></i>DEVICE
                    </label>
                    <span v-if="devicesList.length > 0" class="text-[10px] text-slate-500 font-mono">
                      {{ devicesList.length }} devices
                    </span>
                  </div>
                  <select
                    v-model="selectedTelemetryDeviceEUI"
                    @change="onSelectTelemetryDevice"
                    class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner transition"
                  >
                    <option value="" class="bg-slate-900 text-slate-400">-- SELECT DEVICE --</option>
                    <option v-for="dev in devicesList" :key="dev.devEUI" :value="dev.devEUI" class="bg-slate-900 text-slate-200">
                      {{ dev.name }}
                    </option>
                  </select>
                </div>

                <!-- 2. Chọn Time Range -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="block text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                      <i class="fa-solid fa-calendar-days text-sky-400 mr-1.5"></i>TIME RANGE
                    </label>
                    <button
                      v-if="telemetryRangeStart || telemetryRangeEnd"
                      @click="telemetryRangeStart = ''; telemetryRangeEnd = '';"
                      class="text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer transition font-bold"
                      title="Clear date range"
                    >
                      <i class="fa-solid fa-xmark mr-1"></i>RESET DATES
                    </button>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[10px] text-slate-500 font-bold mb-1 uppercase">FROM</label>
                      <input
                        v-model="telemetryRangeStart"
                        type="datetime-local"
                        class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500 shadow-inner"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-slate-500 font-bold mb-1 uppercase">TO</label>
                      <input
                        v-model="telemetryRangeEnd"
                        type="datetime-local"
                        class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500 shadow-inner"
                      />
                    </div>
                  </div>
                  <p class="text-[10px] text-slate-500">Leave empty to show all packets</p>
                </div>

                <!-- 3. Nút SHOW & DELETE -->
                <div class="flex items-center gap-3 pt-2 border-t border-slate-800">
                  <button
                    @click="showTelemetry"
                    :disabled="!selectedTelemetryDeviceEUI || loadingTelemetry"
                    title="Fetch and display telemetry packets"
                    class="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30 transition"
                  >
                    <i class="fa-solid" :class="loadingTelemetry ? 'fa-spinner fa-spin' : 'fa-play'"></i>
                    <span>SHOW</span>
                  </button>
                  <button
                    @click="clearTelemetry"
                    title="Reset selection and clear table"
                    class="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <i class="fa-solid fa-trash-can text-rose-400"></i>
                    <span>DELETE</span>
                  </button>
                </div>
              </div>

              <!-- BÊN PHẢI (lg:col-span-5): PHẦN HIỂN THỊ DEVICE INFO -->
              <div class="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
                <div>
                  <div class="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase tracking-wider pb-3 border-b border-slate-800/80">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 text-xs">
                        <i class="fa-solid fa-circle-info"></i>
                      </div>
                      <span>DEVICE INFO</span>
                    </div>
                    <span
                      v-if="selectedTelemetryDevice"
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wide flex items-center gap-1.5"
                      :class="selectedTelemetryDevice.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'"
                    >
                      <span class="inline-block w-1.5 h-1.5 rounded-full" :class="selectedTelemetryDevice.isActive !== false ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                      {{ selectedTelemetryDevice.isActive !== false ? 'ACTIVE' : 'INACTIVE' }}
                    </span>
                  </div>

                  <div v-if="selectedTelemetryDevice" class="grid grid-cols-2 sm:grid-cols-3 gap-4 py-3.5 text-xs">
                    <div>
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">NAME</span>
                      <span class="text-white font-mono font-bold truncate block text-sm" :title="selectedTelemetryDevice.name">
                        {{ selectedTelemetryDevice.name }}
                      </span>
                    </div>
                    <div>
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">DEV EUI</span>
                      <span class="text-purple-300 font-mono font-semibold truncate block" :title="selectedTelemetryDevice.devEUI">
                        {{ selectedTelemetryDevice.devEUI }}
                      </span>
                    </div>
                    <div>
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">STATUS</span>
                      <span :class="selectedTelemetryDevice.isActive !== false ? 'text-emerald-400' : 'text-rose-400'" class="font-bold font-mono">
                        {{ selectedTelemetryDevice.isActive !== false ? 'ACTIVE' : 'INACTIVE' }}
                      </span>
                    </div>
                    <div class="sm:col-span-2">
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">SERVER</span>
                      <span class="text-amber-300 font-mono font-semibold truncate block" :title="selectedTelemetryDevice.networkServer?.name || 'CHIRPSTACK TEST'">
                        {{ (selectedTelemetryDevice.networkServer?.name || 'CHIRPSTACK TEST').toUpperCase() }}
                      </span>
                    </div>
                    <div>
                      <span class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">PACKETS</span>
                      <span class="text-white font-bold font-mono text-base">
                        {{ telemetryLoaded ? dashboardMatrixRows.length : '—' }}
                      </span>
                    </div>
                  </div>

                  <div v-else class="py-12 flex flex-col items-center justify-center text-center text-slate-500">
                    <i class="fa-solid fa-microchip text-2xl text-slate-700 mb-2"></i>
                    <p class="text-xs">No device selected.</p>
                    <p class="text-[11px] text-slate-600 mt-0.5">Choose a device from the left panel to view info.</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- BOTTOM SECTION: TABULAR TABLE -->
            <div v-if="!telemetryLoaded" class="py-16 text-center text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl p-8">
              <div class="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-2xl mx-auto mb-3">
                <i class="fa-solid fa-satellite-dish"></i>
              </div>
              <h4 class="text-sm font-bold text-white mb-1">Telemetry Table is Empty</h4>
              <p class="text-slate-400 max-w-md mx-auto">
                Please select a device above and click <span class="text-purple-400 font-bold font-mono">SHOW</span> to display telemetry packets.
              </p>
            </div>

            <div v-else class="space-y-3">
              <!-- Search & Filter Toolbar -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <!-- Search -->
                <div class="relative flex-1 min-w-[200px]">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    v-model="telemetrySearchQuery"
                    type="text"
                    placeholder="Search sensor values or timestamps..."
                    class="w-full pl-8 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                  <button
                    v-if="telemetrySearchQuery"
                    @click="telemetrySearchQuery = ''"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                  ><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  <!-- Row Count Badge -->
                  <span v-if="sortedDashboardMatrixRows.length > 0" class="text-[11px] font-mono font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-inner">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{{ sortedDashboardMatrixRows.length }} rows</span>
                  </span>

                  <!-- Reset Filter -->
                  <button
                    v-if="isTelemetryFilterActive"
                    @click="resetTelemetryFilters"
                    title="Clear all filters"
                    class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <i class="fa-solid fa-filter-circle-xmark text-rose-400"></i>
                    <span>RESET</span>
                  </button>

                  <!-- Export Dropdown -->
                  <div class="relative export-dropdown-container">
                    <button
                      @click="exportDropdownOpen = !exportDropdownOpen"
                      :disabled="sortedDashboardMatrixRows.length === 0"
                      class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-300 hover:text-emerald-300 flex items-center gap-2 cursor-pointer shadow-inner transition"
                      title="Export telemetry data to file"
                    >
                      <i class="fa-solid fa-file-export text-emerald-400"></i>
                      <span>EXPORT</span>
                      <i class="fa-solid fa-chevron-down text-[9px] transition-transform duration-200" :class="exportDropdownOpen ? 'rotate-180 text-emerald-400' : 'text-slate-500'"></i>
                    </button>

                    <!-- Export Dropdown Menu -->
                    <div
                      v-if="exportDropdownOpen"
                      @click.stop
                      class="absolute right-0 top-full mt-2 z-30 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 min-w-[200px] space-y-1"
                    >
                      <div class="text-[10px] font-bold text-slate-400 uppercase px-2.5 py-1 tracking-wider border-b border-slate-800">
                        EXPORT AS ({{ sortedDashboardMatrixRows.length }} ROWS)
                      </div>
                      <button
                        @click="exportTelemetry('xlsx')"
                        class="w-full text-left flex items-center gap-2.5 px-2.5 py-2 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-xl text-xs text-slate-200 transition cursor-pointer"
                      >
                        <i class="fa-solid fa-file-excel text-emerald-400 w-4 text-center"></i>
                        <div class="flex flex-col">
                          <span class="font-bold">Excel (.xlsx)</span>
                          <span class="text-[10px] text-slate-500">Modern spreadsheet</span>
                        </div>
                      </button>
                      <button
                        @click="exportTelemetry('xls')"
                        class="w-full text-left flex items-center gap-2.5 px-2.5 py-2 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-xl text-xs text-slate-200 transition cursor-pointer"
                      >
                        <i class="fa-solid fa-file-lines text-teal-400 w-4 text-center"></i>
                        <div class="flex flex-col">
                          <span class="font-bold">Excel 97-2004 (.xls)</span>
                          <span class="text-[10px] text-slate-500">Legacy workbook</span>
                        </div>
                      </button>
                      <button
                        @click="exportTelemetry('csv')"
                        class="w-full text-left flex items-center gap-2.5 px-2.5 py-2 hover:bg-sky-500/10 hover:text-sky-300 rounded-xl text-xs text-slate-200 transition cursor-pointer"
                      >
                        <i class="fa-solid fa-file-csv text-sky-400 w-4 text-center"></i>
                        <div class="flex flex-col">
                          <span class="font-bold">CSV (.csv)</span>
                          <span class="text-[10px] text-slate-500">Comma-separated values</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- Column Visibility Filter Dropdown -->
                  <div class="relative column-filter-container">
                    <button
                      @click="columnFilterOpen = !columnFilterOpen"
                      class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer shadow-inner transition"
                      :class="totalHiddenColumnsCount > 0 ? 'border-amber-500/50 text-amber-300' : ''"
                      title="Toggle visible metadata and sensor columns"
                    >
                      <i class="fa-solid fa-sliders text-purple-400"></i>
                      <span>COLUMNS</span>
                      <span v-if="totalHiddenColumnsCount > 0" class="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none">
                        -{{ totalHiddenColumnsCount }}
                      </span>
                      <i class="fa-solid fa-chevron-down text-[9px] transition-transform duration-200" :class="columnFilterOpen ? 'rotate-180 text-purple-400' : 'text-slate-500'"></i>
                    </button>

                    <!-- Dropdown Menu -->
                    <div
                      v-if="columnFilterOpen"
                      @click.stop
                      class="absolute right-0 top-full mt-2 z-30 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3.5 min-w-[250px] max-h-[420px] overflow-y-auto custom-scroll"
                    >
                      <!-- SECTION 1: METADATA COLUMNS -->
                      <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider pb-1.5 border-b border-slate-800">
                        <span class="flex items-center gap-1.5">
                          <i class="fa-solid fa-network-wired text-sky-400"></i>
                          <span>METADATA FIELDS</span>
                        </span>
                        <span class="text-slate-500 font-mono text-[9px]">
                          {{ metadataColumnsList.filter(c => isMetadataColumnVisible(c.key)).length }}/{{ metadataColumnsList.length }}
                        </span>
                      </div>
                      <div class="space-y-1 mb-3">
                        <label
                          v-for="col in metadataColumnsList"
                          :key="col.key"
                          class="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-800/80 rounded-lg cursor-pointer transition select-none"
                        >
                          <input
                            type="checkbox"
                            :checked="isMetadataColumnVisible(col.key)"
                            @change="toggleMetadataColumn(col.key)"
                            class="accent-sky-500 cursor-pointer rounded"
                          />
                          <span class="text-[11px] font-mono uppercase" :class="isMetadataColumnVisible(col.key) ? 'text-sky-300 font-bold' : 'text-slate-500 line-through'">
                            {{ col.label }}
                          </span>
                        </label>
                      </div>

                      <!-- SECTION 2: SENSOR FIELDS -->
                      <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider pt-2 pb-1.5 border-t border-b border-slate-800">
                        <span class="flex items-center gap-1.5">
                          <i class="fa-solid fa-microchip text-amber-400"></i>
                          <span>SENSOR FIELDS</span>
                        </span>
                        <span v-if="dashboardSensorColumns.length > 0" class="text-slate-500 font-mono text-[9px]">
                          {{ dashboardSensorColumns.filter(c => isSensorColumnVisible(c)).length }}/{{ dashboardSensorColumns.length }}
                        </span>
                      </div>
                      <div v-if="dashboardSensorColumns.length === 0" class="text-[11px] text-slate-500 py-2 text-center">
                        No sensor fields detected
                      </div>
                      <div v-else class="space-y-1">
                        <label
                          v-for="col in dashboardSensorColumns"
                          :key="col"
                          class="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-800/80 rounded-lg cursor-pointer transition select-none"
                        >
                          <input
                            type="checkbox"
                            :checked="isSensorColumnVisible(col)"
                            @change="toggleSensorColumn(col)"
                            class="accent-purple-500 cursor-pointer rounded"
                          />
                          <span class="text-[11px] font-mono uppercase" :class="isSensorColumnVisible(col) ? 'text-amber-200 font-bold' : 'text-slate-500 line-through'">
                            {{ col }}
                          </span>
                        </label>
                      </div>

                      <!-- Global Actions -->
                      <div class="border-t border-slate-800 mt-3 pt-2.5 flex items-center justify-between">
                        <button @click="showAllColumns" class="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-bold transition">SHOW ALL</button>
                        <button @click="resetDefaultColumns" class="text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer font-bold transition">RESET DEFAULT</button>
                        <button @click="hideAllSensorColumns" class="text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer font-bold transition">HIDE SENSORS</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top Horizontal Scrollbar (Synchronized with table) -->
              <div
                v-if="sortedDashboardMatrixRows.length > 0 && tableHasHorizontalOverflow"
                ref="topScrollRef"
                @scroll="handleTopScroll"
                class="overflow-x-auto top-horizontal-scroll bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-0.5 shadow-inner select-none transition"
                title="Horizontal scrollbar (Top)"
              >
                <div
                  :style="{ width: tableScrollWidth + 'px', height: '6px' }"
                  class="pointer-events-none"
                ></div>
              </div>

              <!-- Full Width Telemetry Table: TIME + METADATA + SENSOR FIELDS + PAYLOAD HEX -->
              <div
                ref="tableScrollRef"
                @scroll="handleTableScroll"
                class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 max-h-[680px] overflow-y-auto custom-scroll shadow-2xl"
                @click="columnFilterOpen = false; exportDropdownOpen = false"
              >
                <div v-if="sortedDashboardMatrixRows.length === 0" class="py-16 text-center text-slate-500 text-xs">
                  <i class="fa-solid fa-satellite-dish text-3xl text-slate-700 mb-2 block"></i>
                  <span v-if="dashboardMatrixRows.length === 0">No uplink telemetry packets received for this device.</span>
                  <span v-else>
                    No packets match the current filters.
                    <button @click="resetTelemetryFilters" class="text-purple-400 underline ml-1 cursor-pointer">RESET</button>
                  </span>
                </div>
                <table v-else ref="telemetryTableRef" class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-900 text-slate-300 text-[11px] font-bold border-b border-slate-800 sticky top-0 z-10 select-none">
                    <tr>
                      <!-- TIME COLUMN (First column) -->
                      <th
                        @click="toggleTelemetrySort('time')"
                        class="py-3 px-4 whitespace-nowrap bg-slate-900 border-r border-slate-800 text-purple-300 cursor-pointer hover:bg-slate-800 transition min-w-[170px]"
                      >
                        <div class="flex items-center gap-1.5">
                          <i class="fa-solid fa-clock text-purple-400 text-[10px]"></i>
                          <span>TIME</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'time' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-purple-400' : 'fa-arrow-down text-purple-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- METADATA: FPORT -->
                      <th
                        v-if="isMetadataColumnVisible('fPort')"
                        @click="toggleTelemetrySort('fPort')"
                        class="py-3 px-3 whitespace-nowrap bg-slate-900 text-slate-400 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1">
                          <span>FPORT</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'fPort' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-sky-400' : 'fa-arrow-down text-sky-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- METADATA: FCNT -->
                      <th
                        v-if="isMetadataColumnVisible('fCnt')"
                        @click="toggleTelemetrySort('fCnt')"
                        class="py-3 px-3 whitespace-nowrap bg-slate-900 text-slate-400 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1">
                          <span>FCNT</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'fCnt' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-sky-400' : 'fa-arrow-down text-sky-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- METADATA: RSSI -->
                      <th
                        v-if="isMetadataColumnVisible('rssi')"
                        @click="toggleTelemetrySort('rssi')"
                        class="py-3 px-3 whitespace-nowrap bg-slate-900 text-emerald-400 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1">
                          <span>RSSI</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'rssi' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-emerald-400' : 'fa-arrow-down text-emerald-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- METADATA: SNR -->
                      <th
                        v-if="isMetadataColumnVisible('snr')"
                        @click="toggleTelemetrySort('snr')"
                        class="py-3 px-3 whitespace-nowrap bg-slate-900 text-sky-400 border-r border-slate-800 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1">
                          <span>SNR</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'snr' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-sky-400' : 'fa-arrow-down text-sky-400') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>

                      <!-- ALL SENSOR FIELDS (Filtered by visibility) -->
                      <template v-if="dashboardSensorColumns.length > 0">
                        <th
                          v-for="col in dashboardSensorColumns.filter(c => isSensorColumnVisible(c))"
                          :key="col"
                          @click="toggleTelemetrySort('sensor:' + col)"
                          class="py-3 px-4 whitespace-nowrap bg-slate-900 text-amber-300 font-mono cursor-pointer hover:bg-slate-800 transition"
                        >
                          <div class="flex items-center gap-1.5">
                            <span class="uppercase">{{ col }}</span>
                            <i class="fa-solid text-[9px]" :class="telemetrySortKey === ('sensor:' + col) ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-amber-400' : 'fa-arrow-down text-amber-400') : 'fa-sort text-slate-600'"></i>
                          </div>
                        </th>
                      </template>

                      <!-- PAYLOAD HEX (Metadata or fallback) -->
                      <th
                        v-if="isMetadataColumnVisible('payloadHex') || dashboardSensorColumns.length === 0"
                        @click="toggleTelemetrySort('payloadHex')"
                        class="py-3 px-4 whitespace-nowrap bg-slate-900 text-slate-400 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div class="flex items-center gap-1.5">
                          <span>PAYLOAD HEX</span>
                          <i class="fa-solid text-[9px]" :class="telemetrySortKey === 'payloadHex' ? (telemetrySortOrder === 'asc' ? 'fa-arrow-up text-slate-300' : 'fa-arrow-down text-slate-300') : 'fa-sort text-slate-600'"></i>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr
                      v-for="(row, rIdx) in paginatedDashboardMatrixRows"
                      :key="rIdx"
                      class="hover:bg-slate-800/40 transition"
                    >
                      <!-- TIME -->
                      <td class="py-2.5 px-4 whitespace-nowrap bg-slate-950/40 border-r border-slate-800">
                        <span class="text-purple-300 font-bold">{{ formatDateTime(row.time) }}</span>
                      </td>

                      <!-- FPORT -->
                      <td v-if="isMetadataColumnVisible('fPort')" class="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {{ row.fPort }}
                      </td>

                      <!-- FCNT -->
                      <td v-if="isMetadataColumnVisible('fCnt')" class="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {{ row.fCnt }}
                      </td>

                      <!-- RSSI -->
                      <td v-if="isMetadataColumnVisible('rssi')" class="py-2.5 px-3 whitespace-nowrap">
                        <span v-if="row.rssi != null" class="font-bold" :class="row.rssi >= -90 ? 'text-emerald-400' : (row.rssi >= -110 ? 'text-amber-400' : 'text-rose-400')">{{ row.rssi }}</span>
                        <span v-else class="text-slate-700">—</span>
                      </td>

                      <!-- SNR -->
                      <td v-if="isMetadataColumnVisible('snr')" class="py-2.5 px-3 whitespace-nowrap border-r border-slate-800">
                        <span v-if="row.snr != null" class="font-bold" :class="row.snr >= 5 ? 'text-emerald-400' : (row.snr >= 0 ? 'text-sky-400' : 'text-orange-400')">{{ row.snr }}</span>
                        <span v-else class="text-slate-700">—</span>
                      </td>

                      <!-- SENSOR VALUES (Filtered by visibility) -->
                      <template v-if="dashboardSensorColumns.length > 0">
                        <td
                          v-for="col in dashboardSensorColumns.filter(c => isSensorColumnVisible(c))"
                          :key="col"
                          class="py-2.5 px-4 whitespace-nowrap font-bold"
                          :class="row.sensorValues[col] !== '—' && row.sensorValues[col] !== undefined ? 'text-emerald-300' : 'text-slate-700'"
                        >
                          {{ row.sensorValues[col] !== undefined ? row.sensorValues[col] : '—' }}
                        </td>
                      </template>

                      <!-- PAYLOAD HEX -->
                      <td
                        v-if="isMetadataColumnVisible('payloadHex') || dashboardSensorColumns.length === 0"
                        class="py-2.5 px-4 text-purple-400 uppercase truncate max-w-[200px]"
                        :title="row.payloadHex"
                      >
                        {{ row.payloadHex }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination Controls Bar -->
              <div
                v-if="sortedDashboardMatrixRows.length > 0"
                class="flex items-center justify-between gap-3 flex-wrap bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-inner select-none"
              >
                <!-- Record count info -->
                <div class="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>Showing</span>
                  <span class="text-white font-bold">{{ paginationRangeText }}</span>
                  <span>of</span>
                  <span class="text-purple-300 font-bold">{{ sortedDashboardMatrixRows.length }}</span>
                  <span>records</span>
                  <span v-if="sortedDashboardMatrixRows.length < dashboardMatrixRows.length" class="text-slate-500 text-[10px]">
                    (filtered from {{ dashboardMatrixRows.length }} total)
                  </span>
                </div>

                <div class="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <!-- Page Size Selector -->
                  <div class="flex items-center gap-2 text-xs text-slate-400">
                    <span class="text-[11px] font-medium">Rows per page:</span>
                    <select
                      v-model="telemetryPageSize"
                      class="bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner"
                    >
                      <option :value="25">25</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                      <option :value="250">250</option>
                      <option :value="500">500</option>
                      <option value="ALL">All ({{ sortedDashboardMatrixRows.length }})</option>
                    </select>
                  </div>

                  <!-- Page navigation buttons -->
                  <div v-if="telemetryPageSize !== 'ALL' && totalTelemetryPages > 1" class="flex items-center gap-1">
                    <!-- First Page -->
                    <button
                      @click="setTelemetryPage(1)"
                      :disabled="telemetryPage === 1"
                      class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="First Page"
                    >
                      <i class="fa-solid fa-angles-left text-[10px]"></i>
                    </button>

                    <!-- Prev Page -->
                    <button
                      @click="prevTelemetryPage"
                      :disabled="telemetryPage === 1"
                      class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="Previous Page"
                    >
                      <i class="fa-solid fa-chevron-left text-[10px]"></i>
                    </button>

                    <!-- Page Numbers Pill list -->
                    <template v-for="(p, pIdx) in visiblePageNumbers" :key="pIdx">
                      <span v-if="p === '...'" class="px-1 text-slate-600 text-xs font-mono">...</span>
                      <button
                        v-else
                        @click="setTelemetryPage(p)"
                        class="min-w-[32px] h-8 px-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                        :class="telemetryPage === p ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'"
                      >
                        {{ p }}
                      </button>
                    </template>

                    <!-- Next Page -->
                    <button
                      @click="nextTelemetryPage"
                      :disabled="telemetryPage >= totalTelemetryPages"
                      class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="Next Page"
                    >
                      <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    </button>

                    <!-- Last Page -->
                    <button
                      @click="setTelemetryPage(totalTelemetryPages)"
                      :disabled="telemetryPage >= totalTelemetryPages"
                      class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="Last Page"
                    >
                      <i class="fa-solid fa-angles-right text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- FEATURE: HMI SCADA VIEWER (D_MOD_HMI_SCADA) -->
          <div v-else-if="activeFeature.id === 'hmi-scada-viewer'" class="space-y-4">
            
            <!-- HMI Header & Control Toolbar -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/70 p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-md">
              <!-- Left: Title, Icon & Screen Selector -->
              <div class="flex items-center gap-3 flex-wrap">
                <button @click="returnToHome" title="Back to Dashboard" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition">
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-lg shadow-inner">
                  <i class="fa-solid fa-palette"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-sm font-bold text-white tracking-wide">HMI SCADA MONITOR</h3>
                    <!-- Screen Selector Dropdown -->
                    <div class="relative inline-block">
                      <select
                        v-if="publishedHmiScreens.length > 0"
                        v-model="selectedHmiScreenId"
                        @change="loadSelectedHmiScreen"
                        class="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option v-for="sc in publishedHmiScreens" :key="sc.id" :value="sc.id">
                          {{ sc.name }} ({{ sc.widgets?.length || 0 }} widgets)
                        </option>
                      </select>
                      <span v-else class="text-xs text-slate-500 italic">No published screens</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
                    {{ currentHmiScreen?.description || 'Interactive Wecon-style industrial HMI diagram with live decoded telemetry and downlink actuator controls' }}
                  </p>
                </div>
              </div>

              <!-- Right: Realtime Status & Tools -->
              <div class="flex items-center gap-2 flex-wrap justify-end">
                <!-- Realtime Online Badge -->
                <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold"
                  :class="realtimeConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'">
                  <span class="w-2 h-2 rounded-full" :class="realtimeConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'"></span>
                  <span>{{ realtimeConnected ? 'REALTIME ONLINE' : 'POLLING MODE' }}</span>
                </div>

                <!-- Rx Packets Counter -->
                <div class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-sky-400 font-bold flex items-center gap-1">
                  <i class="fa-solid fa-satellite-dish text-[10px]"></i>
                  <span>Rx: {{ hmiRxPacketCount }}</span>
                </div>

                <!-- Active Alarms Indicator -->
                <div class="px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1.5"
                  :class="activeAlarmsList.length > 0 ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-400'">
                  <i class="fa-solid fa-triangle-exclamation" :class="activeAlarmsList.length > 0 ? 'text-red-400' : 'text-slate-500'"></i>
                  <span>{{ activeAlarmsList.length }} ALARMS</span>
                </div>

                <!-- View Mode Switcher -->
                <div class="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button
                    @click="hmiViewerMode = 'canvas'"
                    title="Visual SCADA Canvas"
                    class="px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                    :class="hmiViewerMode === 'canvas' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'"
                  >
                    <i class="fa-solid fa-palette text-[11px]"></i> SCADA
                  </button>
                  <button
                    @click="hmiViewerMode = 'alarms'"
                    title="Active Alarms"
                    class="px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                    :class="hmiViewerMode === 'alarms' ? 'bg-red-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'"
                  >
                    <i class="fa-solid fa-bell text-[11px]"></i> Alarms ({{ activeAlarmsList.length }})
                  </button>
                  <button
                    @click="hmiViewerMode = 'matrix'"
                    title="Decoded Tags Matrix"
                    class="px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                    :class="hmiViewerMode === 'matrix' ? 'bg-sky-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'"
                  >
                    <i class="fa-solid fa-table-cells text-[11px]"></i> Tags
                  </button>
                </div>

                <!-- Zoom Controls (for Canvas Mode) -->
                <div v-if="hmiViewerMode === 'canvas'" class="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button @click="hmiZoom = Math.max(0.4, Number((hmiZoom - 0.1).toFixed(1)))" title="Zoom Out" class="px-2 py-1 text-slate-400 hover:text-white cursor-pointer font-bold">-</button>
                  <span class="px-1.5 text-[10px] font-mono text-slate-300">{{ Math.round(hmiZoom * 100) }}%</span>
                  <button @click="hmiZoom = Math.min(2.0, Number((hmiZoom + 0.1).toFixed(1)))" title="Zoom In" class="px-2 py-1 text-slate-400 hover:text-white cursor-pointer font-bold">+</button>
                  <button @click="hmiZoom = 1.0" title="Reset Zoom to 100%" class="px-2 py-1 text-[10px] text-slate-400 hover:text-amber-400 cursor-pointer">1:1</button>
                  <button @click="fitHmiZoom" title="Fit Canvas to Viewport" class="px-2 py-1 text-[10px] text-slate-400 hover:text-amber-400 cursor-pointer">FIT</button>
                </div>

                <!-- Manual Refresh Button -->
                <button
                  @click="refreshHmiViewer"
                  :disabled="hmiLoading"
                  title="Refresh Screen & Live Telemetry"
                  class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': hmiLoading }"></i>
                </button>
              </div>
            </div>

            <!-- VIEW 1: SCADA CANVAS VIEW -->
            <div v-if="hmiViewerMode === 'canvas'" class="space-y-3">
              
              <!-- No Screens Published Fallback -->
              <div v-if="!currentHmiScreen" class="py-20 text-center bg-slate-950/80 rounded-2xl border border-slate-800 p-8 space-y-4 shadow-xl">
                <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-2xl mx-auto shadow-inner">
                  <i class="fa-solid fa-palette"></i>
                </div>
                <div class="space-y-1">
                  <h3 class="text-base font-bold text-white">No Published HMI Screen Available</h3>
                  <p class="text-xs text-slate-400 max-w-md mx-auto">
                    No HMI screens have been published for your role yet. Please ask an Administrator to design and publish a SCADA screen via the Control Panel HMI Studio.
                  </p>
                </div>
                <button @click="fetchPublishedHmiScreens" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 inline-flex items-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate"></i> Check for Published Screens
                </button>
              </div>

              <!-- SCADA Canvas Viewport -->
              <div v-else ref="hmiCanvasViewportRef" class="relative w-full overflow-auto rounded-2xl border border-slate-800 shadow-2xl custom-scroll" style="min-height: 580px; max-height: 82vh; background: #060911;">
                
                <!-- Canvas Stage Container scaled by hmiZoom -->
                <div
                  class="relative transition-transform duration-75 origin-top-left"
                  :style="{
                    width: (currentHmiScreen.canvasConfig?.width || 1280) + 'px',
                    height: (currentHmiScreen.canvasConfig?.height || 720) + 'px',
                    transform: 'scale(' + hmiZoom + ')',
                    backgroundColor: currentHmiScreen.canvasConfig?.background || '#0b0f19',
                    backgroundImage: currentHmiScreen.canvasConfig?.showGrid !== false ? 'radial-gradient(circle, #334155 1px, transparent 1px)' : 'none',
                    backgroundSize: (currentHmiScreen.canvasConfig?.grid || 20) + 'px ' + (currentHmiScreen.canvasConfig?.grid || 20) + 'px'
                  }"
                >
                  
                  <!-- RENDER EACH WIDGET -->
                  <div
                    v-for="w in currentHmiScreen.widgets"
                    :key="w.id"
                    class="absolute select-none transition-all duration-150"
                    :class="{
                      'ring-2 ring-red-500 animate-pulse': isWidgetAlarmActive(w)
                    }"
                    :style="{
                      left: w.x + 'px',
                      top: w.y + 'px',
                      width: w.w + 'px',
                      height: w.h + 'px',
                      zIndex: w.zIndex || 1
                    }"
                  >
                    
                    <!-- 1. STATIC LABEL -->
                    <div v-if="w.type === 'static-label'" class="w-full h-full flex flex-col justify-center px-2 pointer-events-none">
                      <div :style="{ color: w.props?.textColor || '#ffffff', fontSize: (w.props?.fontSize || 14) + 'px', fontWeight: w.props?.fontWeight || 'bold', textAlign: w.props?.textAlign || 'left' }" class="leading-tight">
                        {{ w.props?.text || 'LABEL' }}
                      </div>
                      <div v-if="w.props?.subText" class="text-[10px] text-slate-400 mt-0.5" :style="{ textAlign: w.props?.textAlign || 'left' }">
                        {{ w.props.subText }}
                      </div>
                    </div>

                    <!-- 2. BIT LAMP -->
                    <div v-else-if="w.type === 'bit-lamp'" class="w-full h-full p-2 bg-slate-900/90 rounded-xl border border-slate-800 shadow-md flex items-center justify-between gap-2.5">
                      <div class="truncate">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{{ w.props?.title || 'LAMP' }}</div>
                        <div class="text-xs font-bold mt-0.5" :style="{ color: isWidgetBitOn(w) ? (w.props?.colorOn || '#10b981') : '#64748b' }">
                          {{ isWidgetBitOn(w) ? (w.props?.labelOn || 'RUNNING') : (w.props?.labelOff || 'STOPPED') }}
                        </div>
                      </div>
                      <div
                        class="w-6 h-6 border-2 transition-all duration-200 shrink-0"
                        :class="w.props?.shape === 'rect' ? 'rounded-md' : 'rounded-full'"
                        :style="getWidgetBitLampStyle(w)"
                      ></div>
                    </div>

                    <!-- 3. MULTI-STATE LAMP -->
                    <div v-else-if="w.type === 'multi-state-lamp'" class="w-full h-full p-2 bg-slate-900/90 rounded-xl border border-slate-800 shadow-md flex items-center justify-between gap-2">
                      <div class="truncate">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{{ w.props?.title || 'STATUS' }}</div>
                        <div class="text-xs font-bold mt-0.5 truncate" :style="{ color: getWidgetMultiStateColor(w) }">
                          {{ getWidgetMultiStateLabel(w) }}
                        </div>
                      </div>
                      <div class="px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 shrink-0" :style="getWidgetMultiStateStyle(w)">
                        <i :class="getWidgetMultiStateIcon(w)"></i>
                        <span class="font-mono text-[11px]">{{ getWidgetTelemetryValue(w) }}</span>
                      </div>
                    </div>

                    <!-- 4. ALARM BANNER -->
                    <div v-else-if="w.type === 'alarm-banner'" class="w-full h-full px-3 py-1.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold transition-all duration-300"
                      :class="activeAlarmsList.length > 0 ? 'bg-red-950/90 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-200 animate-pulse' : 'bg-slate-900/90 border-emerald-500/30 text-emerald-400 shadow-inner'">
                      <div class="flex items-center gap-2 overflow-hidden truncate">
                        <i class="fa-solid" :class="activeAlarmsList.length > 0 ? 'fa-triangle-exclamation text-red-400 text-sm' : 'fa-circle-check text-emerald-400'"></i>
                        <span class="uppercase tracking-wider text-[11px] text-slate-300 font-extrabold shrink-0">{{ w.props?.title || 'ALARM MONITOR' }}:</span>
                        <span class="truncate text-[11px]" :class="activeAlarmsList.length > 0 ? 'text-red-200 font-semibold' : 'text-emerald-300'">
                          {{ activeAlarmsList.length > 0 ? activeAlarmsList.map(a => a.text).join(' • ') : (w.props?.idleMessage || 'All parameters normal. No active alarms.') }}
                        </span>
                      </div>
                      <span v-if="activeAlarmsList.length > 0" class="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold shrink-0">
                        {{ activeAlarmsList.length }} ACTIVE
                      </span>
                    </div>

                    <!-- 5. LINEAR TANK -->
                    <div v-else-if="w.type === 'linear-tank'" class="w-full h-full p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between"
                      :class="{ 'border-red-500 ring-2 ring-red-500/50 shadow-red-500/20': isWidgetAlarmActive(w) }">
                      <div class="flex items-center justify-between border-b border-slate-800/80 pb-1">
                        <span class="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider truncate">{{ w.props?.title || 'TANK' }}</span>
                        <span class="text-[10px] font-mono font-bold text-sky-400">{{ getWidgetTankHeightPercent(w) }}%</span>
                      </div>
                      
                      <!-- Tank Body Graphics -->
                      <div class="relative flex-1 my-1.5 rounded-xl border border-slate-700 bg-slate-950/80 overflow-hidden flex items-end p-1 shadow-inner">
                        <!-- Tick marks -->
                        <div class="absolute inset-y-1 right-1 flex flex-col justify-between text-[8px] font-mono text-slate-500 pointer-events-none z-10 pr-0.5">
                          <span>100%</span>
                          <span>75%</span>
                          <span>50%</span>
                          <span>25%</span>
                          <span>0%</span>
                        </div>
                        <!-- Liquid fill bar -->
                        <div
                          class="w-full rounded-lg transition-all duration-300 relative shadow-lg"
                          :style="{
                            height: getWidgetTankHeightPercent(w) + '%',
                            backgroundColor: getWidgetLiquidColor(w),
                            boxShadow: '0 0 16px ' + getWidgetLiquidColor(w) + '55'
                          }"
                        >
                          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/30 rounded-lg"></div>
                        </div>
                      </div>

                      <!-- Footer Value -->
                      <div class="flex items-center justify-between text-xs pt-0.5">
                        <span class="text-[10px] text-slate-500 font-mono">{{ w.props?.min || 0 }} - {{ w.props?.max || 100 }}</span>
                        <span class="font-mono font-extrabold text-white text-xs">
                          {{ getWidgetTelemetryValue(w) }} <span class="text-[10px] text-slate-400 font-normal">{{ w.props?.unit || 'm³' }}</span>
                        </span>
                      </div>
                    </div>

                    <!-- 6. SILO VESSEL -->
                    <div v-else-if="w.type === 'silo-vessel'" class="w-full h-full p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                      <div class="flex items-center justify-between border-b border-slate-800/80 pb-1">
                        <span class="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider truncate">{{ w.props?.title || 'SILO' }}</span>
                        <span class="text-[10px] font-mono font-bold text-amber-400">{{ getWidgetTankHeightPercent(w) }}%</span>
                      </div>
                      <div class="relative flex-1 my-1.5 flex flex-col items-center justify-end">
                        <div class="w-4/5 flex-1 rounded-t-xl border border-slate-700 bg-slate-950/80 overflow-hidden flex items-end p-1 relative shadow-inner">
                          <div class="w-full rounded-t-lg transition-all duration-300"
                            :style="{ height: getWidgetTankHeightPercent(w) + '%', backgroundColor: w.props?.liquidColor || '#d97706' }"></div>
                        </div>
                        <div class="w-4/5 h-6 bg-slate-800 border-x border-b border-slate-700 rounded-b-full flex items-center justify-center text-[9px] text-slate-400">
                          HOPPER
                        </div>
                      </div>
                      <div class="text-right font-mono font-bold text-white text-xs">
                        {{ getWidgetTelemetryValue(w) }} <span class="text-[10px] text-slate-400">{{ w.props?.unit || 'ton' }}</span>
                      </div>
                    </div>

                    <!-- 7. DIAL GAUGE -->
                    <div v-else-if="w.type === 'dial-gauge'" class="w-full h-full p-2 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-center justify-between relative overflow-hidden"
                      :class="{ 'border-red-500 ring-2 ring-red-500/50 shadow-red-500/20': isWidgetAlarmActive(w) }">
                      <div class="w-full text-center text-[10px] font-extrabold text-slate-300 uppercase tracking-wider truncate pb-0.5">
                        {{ w.props?.title || 'PRESSURE GAUGE' }}
                      </div>
                      
                      <!-- SVG Dial Meter -->
                      <div class="relative w-28 h-28 flex items-center justify-center">
                        <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <!-- Dial Background Arc -->
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" stroke-width="8" stroke-dasharray="188.5" stroke-dashoffset="47" stroke-linecap="round" />
                          <!-- Dial Colored Arc -->
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" stroke-width="8" stroke-dasharray="188.5"
                            :stroke-dashoffset="188.5 - (Math.min(100, Math.max(0, getWidgetTankHeightPercent(w))) / 100) * 141.5"
                            stroke-linecap="round" class="transition-all duration-300"
                            :style="{ stroke: getWidgetLiquidColor(w) }" />
                        </svg>
                        <!-- Center needle / hub -->
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div class="w-2.5 h-2.5 rounded-full bg-slate-200 shadow-md z-10"></div>
                          <div class="w-0.5 h-10 bg-red-500 origin-bottom transition-transform duration-300 shadow"
                            :style="{ transform: 'rotate(' + getWidgetGaugeAngle(w) + 'deg)', transformOrigin: 'bottom center', marginBottom: '40px' }"></div>
                        </div>
                      </div>

                      <!-- Value readout -->
                      <div class="w-full text-center pb-0.5">
                        <span class="text-sm font-extrabold font-mono text-white">{{ getWidgetTelemetryValue(w) }}</span>
                        <span class="text-[10px] text-slate-400 font-bold ml-1">{{ w.props?.unit || 'Bar' }}</span>
                      </div>
                    </div>

                    <!-- 8. LED NUMERIC -->
                    <div v-else-if="w.type === 'led-numeric'" class="w-full h-full p-2 bg-slate-900/95 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{{ w.props?.title || 'FLOW RATE' }}</div>
                      <div class="bg-black/80 rounded-lg p-2 border border-slate-800 flex items-baseline justify-end gap-1.5 shadow-inner">
                        <span class="font-mono text-lg sm:text-xl font-extrabold tracking-wider" :style="{ color: w.props?.color || '#38bdf8', textShadow: '0 0 10px ' + (w.props?.color || '#38bdf8') }">
                          {{ getWidgetTelemetryValue(w) }}
                        </span>
                        <span class="text-[10px] font-bold text-slate-400">{{ w.props?.unit || 'm³/h' }}</span>
                      </div>
                    </div>

                    <!-- 9. MONO BOX -->
                    <div v-else-if="w.type === 'mono-box'" class="w-full h-full p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between gap-3">
                      <div class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 text-base shrink-0 shadow-inner">
                        <i :class="w.props?.icon || 'fa-solid fa-gauge-high'"></i>
                      </div>
                      <div class="text-right truncate">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{{ w.props?.title || 'METRIC' }}</div>
                        <div class="text-base font-extrabold font-mono text-white mt-0.5">
                          {{ getWidgetTelemetryValue(w) }} <span class="text-[10px] font-normal text-slate-400">{{ w.props?.unit || '' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 10. TOGGLE SWITCH (DOWNLINK ACTUATOR) -->
                    <div v-else-if="w.type === 'toggle-switch'" class="w-full h-full p-2.5 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                      <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <span class="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider truncate">{{ w.props?.title || 'ACTUATOR SWITCH' }}</span>
                        <span class="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold" :class="isWidgetSwitchOn(w) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'">
                          {{ isWidgetSwitchOn(w) ? (w.props?.labelOn || 'AUTO ON') : (w.props?.labelOff || 'MANUAL OFF') }}
                        </span>
                      </div>
                      
                      <!-- Interactive Switch Slider -->
                      <div class="flex items-center justify-center py-1">
                        <button
                          type="button"
                          @click="triggerWidgetToggleSwitch(w)"
                          :disabled="w._sendingDownlink"
                          class="relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-md"
                          :class="isWidgetSwitchOn(w) ? 'bg-emerald-600' : 'bg-slate-700'"
                        >
                          <span
                            aria-hidden="true"
                            class="pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px]"
                            :class="isWidgetSwitchOn(w) ? 'translate-x-8 text-emerald-600' : 'translate-x-0 text-slate-600'"
                          >
                            <i v-if="w._sendingDownlink" class="fa-solid fa-circle-notch fa-spin text-amber-500"></i>
                            <i v-else-if="isWidgetSwitchOn(w)" class="fa-solid fa-check"></i>
                            <i v-else class="fa-solid fa-xmark"></i>
                          </span>
                        </button>
                      </div>

                      <div class="text-[9px] text-center text-slate-500 font-mono">
                        {{ w.action?.fPort ? ('Port ' + w.action.fPort + ' • Hex ' + (isWidgetSwitchOn(w) ? (w.action?.payloadHex || '0101') : '0100')) : 'Downlink Actuator' }}
                      </div>
                    </div>

                    <!-- 11. ACTION BUTTON (DOWNLINK PUSHBUTTON) -->
                    <div v-else-if="w.type === 'action-button'" class="w-full h-full p-2 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-center">
                      <button
                        type="button"
                        @click="triggerWidgetActionButton(w)"
                        :disabled="w._sendingDownlink"
                        class="w-full h-full rounded-xl text-white text-xs font-extrabold shadow-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-50"
                        :style="{ backgroundColor: w.props?.buttonColor || '#e11d48', boxShadow: '0 4px 14px ' + (w.props?.buttonColor || '#e11d48') + '55' }"
                      >
                        <i v-if="w._sendingDownlink" class="fa-solid fa-circle-notch fa-spin text-sm"></i>
                        <i v-else :class="w.props?.icon || 'fa-solid fa-bolt'" class="text-sm"></i>
                        <span class="text-[11px] tracking-wide">{{ w.props?.label || 'DISPATCH ACTION' }}</span>
                      </button>
                    </div>

                    <!-- 12. REALTIME TREND CHART (METABASE STYLE WITH MULTI-SENSOR Y-AXIS & TIMESTAMP X-AXIS) -->
                    <div v-else-if="w.type === 'realtime-trend'" class="w-full h-full p-3 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-2xl flex flex-col justify-between relative select-none">
                      <!-- Top Bar: Title + Metabase Time Range Filter + Controls -->
                      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 gap-2 shrink-0">
                        <!-- Left: Title & Status -->
                        <div class="flex items-center gap-2 min-w-0">
                          <i class="fa-solid fa-chart-line text-sky-400 text-xs"></i>
                          <span class="text-[11px] font-bold text-white uppercase tracking-wider truncate">{{ w.props?.title || 'REALTIME TELEMETRY TREND' }}</span>
                          <span class="font-mono text-[9px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded shrink-0">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            LIVE
                          </span>
                        </div>

                        <!-- Right: Metabase Time Filter Pills + Add Sensor Button -->
                        <div class="flex items-center gap-1.5 shrink-0">
                          <!-- Metabase Time Range Presets -->
                          <div class="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[9px] font-mono">
                            <button
                              v-for="r in ['15m', '1h', '6h', '24h', '7d']"
                              :key="r"
                              type="button"
                              @click.stop="setTrendTimeRange(w, r)"
                              class="px-1.5 py-0.5 rounded transition font-bold cursor-pointer"
                              :class="(w.props?.timeRange || '1h') === r ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                            >
                              {{ r }}
                            </button>
                          </div>

                          <!-- Add Series / Sensor Button -->
                          <button
                            type="button"
                            @click.stop="openAddTrendSeriesModal(w)"
                            class="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                            title="Thêm cảm biến vào biểu đồ (Y-Axis)"
                          >
                            <i class="fa-solid fa-plus text-[9px]"></i>
                            <span>Sensor</span>
                          </button>
                        </div>
                      </div>

                      <!-- Main Chart SVG Area: Y-Axis + Grid + Curves + X-Axis (Timestamp) -->
                      <div
                        class="flex-1 w-full min-h-0 relative bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden"
                        @mousemove="handleTrendMouseMove($event, w)"
                        @mouseleave="handleTrendMouseLeave(w)"
                      >
                        <svg viewBox="0 0 500 220" preserveAspectRatio="none" class="w-full h-full">
                          <defs>
                            <linearGradient v-for="s in getTrendSeries(w)" :key="'grad_' + s.id" :id="'trend_grad_' + w.id + '_' + s.id" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" :stop-color="s.color || '#38bdf8'" stop-opacity="0.25" />
                              <stop offset="100%" :stop-color="s.color || '#38bdf8'" stop-opacity="0.0" />
                            </linearGradient>
                          </defs>

                          <!-- Horizontal Grid Lines & Y-Axis Labels -->
                          <g v-for="yt in getTrendYBounds(w).ticks" :key="'y_' + yt.y">
                            <line x1="45" :y1="yt.y" x2="485" :y2="yt.y" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
                            <text x="40" :y="yt.y + 3" fill="#64748b" font-size="8" font-family="monospace" text-anchor="end">{{ yt.label }}</text>
                          </g>

                          <!-- Vertical Grid Lines & X-Axis Timestamp Labels (Metabase style) -->
                          <g v-for="xt in getTrendXTicks(w)" :key="'x_' + xt.x">
                            <line :x1="xt.x" y1="16" :x2="xt.x" y2="192" stroke="#1e293b" stroke-width="1" stroke-dasharray="2,2" />
                            <text :x="xt.x" y="210" fill="#64748b" font-size="8" font-family="monospace" text-anchor="middle">{{ xt.label }}</text>
                          </g>

                          <!-- Area & Line Paths for each visible Series -->
                          <template v-for="s in getTrendSeries(w)" :key="'path_' + s.id">
                            <path
                              v-if="s.visible !== false"
                              :d="getTrendSeriesAreaPath(w, s)"
                              :fill="'url(#trend_grad_' + w.id + '_' + s.id + ')'"
                            />
                            <path
                              v-if="s.visible !== false"
                              :d="getTrendSeriesPath(w, s)"
                              fill="none"
                              :stroke="s.color || '#38bdf8'"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <!-- Latest Point Dot -->
                            <circle
                              v-if="s.visible !== false && getTrendLatestPoint(w, s)"
                              :cx="getTrendLatestPoint(w, s).x"
                              :cy="getTrendLatestPoint(w, s).y"
                              r="3.5"
                              :fill="s.color || '#38bdf8'"
                              stroke="#0f172a"
                              stroke-width="1.5"
                            />
                          </template>

                          <!-- Interactive Crosshair Hover Line -->
                          <g v-if="trendHoverState[w.id]?.visible">
                            <line
                              :x1="trendHoverState[w.id].x"
                              y1="16"
                              :x2="trendHoverState[w.id].x"
                              y2="192"
                              stroke="#e2e8f0"
                              stroke-width="1"
                              stroke-dasharray="2,2"
                            />
                          </g>
                        </svg>

                        <!-- Interactive Hover Tooltip Overlay -->
                        <div
                          v-if="trendHoverState[w.id]?.visible"
                          class="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700 p-2 rounded-lg shadow-xl text-[10px] font-mono space-y-1 backdrop-blur"
                          :style="{ left: Math.min(trendHoverState[w.id].pixelX + 10, 260) + 'px', top: '10px' }"
                        >
                          <div class="text-slate-400 font-bold border-b border-slate-800 pb-0.5 flex items-center gap-1">
                            <i class="fa-solid fa-clock text-sky-400 text-[9px]"></i>
                            <span>{{ trendHoverState[w.id].timeStr }}</span>
                          </div>
                          <div v-for="item in trendHoverState[w.id].values" :key="item.label" class="flex items-center justify-between gap-3">
                            <span class="flex items-center gap-1">
                              <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: item.color }"></span>
                              <span class="text-slate-300">{{ item.label }}:</span>
                            </span>
                            <span class="font-bold text-white">{{ item.value }} {{ item.unit }}</span>
                          </div>
                        </div>

                        <!-- Empty State when no series configured -->
                        <div
                          v-if="getTrendSeries(w).length === 0"
                          class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/80"
                        >
                          <i class="fa-solid fa-chart-line text-slate-600 text-2xl mb-1"></i>
                          <span class="text-slate-400 text-[11px] font-medium">Chưa có cảm biến nào được thêm vào trục Y</span>
                          <button
                            type="button"
                            @click.stop="openAddTrendSeriesModal(w)"
                            class="mt-2 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition"
                          >
                            <i class="fa-solid fa-plus"></i>
                            <span>Thêm Cảm Biến Vào Đồ Thị</span>
                          </button>
                        </div>
                      </div>

                      <!-- Bottom Bar: Multi-Sensor Series Legend & Show/Hide Toggles -->
                      <div class="pt-2 mt-1 border-t border-slate-800/60 flex items-center justify-between gap-2 text-[10px] font-mono shrink-0 flex-wrap">
                        <div class="flex items-center gap-2 flex-wrap">
                          <div
                            v-for="s in getTrendSeries(w)"
                            :key="s.id"
                            @click.stop="toggleTrendSeriesVisible(w, s.id)"
                            class="flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition cursor-pointer select-none"
                            :class="s.visible !== false ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60 line-through'"
                            :title="'Bấm để ẩn/hiện: ' + s.label"
                          >
                            <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: s.color || '#38bdf8' }"></span>
                            <span class="font-semibold truncate max-w-[120px]">{{ s.label || s.field }}</span>
                            <span class="text-sky-300 font-bold ml-1">
                              {{ getTrendSeriesLatestVal(w, s) }} {{ s.unit || '' }}
                            </span>
                          </div>
                        </div>

                        <div class="text-[9px] text-slate-500 flex items-center gap-2">
                          <span>{{ (trendPointsMap[w.id] || []).length }} điểm mẫu</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>

            <!-- VIEW 2: ACTIVE ALARMS VIEW -->
            <div v-else-if="hmiViewerMode === 'alarms'" class="space-y-4">
              <div class="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-bell text-red-400"></i>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">HMI Screen Alarms Status</h4>
                  </div>
                  <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" :class="activeAlarmsList.length > 0 ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'">
                    {{ activeAlarmsList.length }} Triggered
                  </span>
                </div>

                <div v-if="activeAlarmsList.length === 0" class="py-12 text-center text-slate-500 text-xs space-y-2">
                  <i class="fa-solid fa-shield-check text-emerald-400 text-3xl mb-1"></i>
                  <div class="text-slate-300 font-bold">All SCADA Telemetry Parameters Normal</div>
                  <p class="text-[11px] text-slate-500">No high/low threshold conditions are currently triggered on any widget.</p>
                </div>

                <div v-else class="space-y-2">
                  <div v-for="alm in activeAlarmsList" :key="alm.widgetId + alm.text" class="p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between gap-3 shadow-md">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-sm">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                      </div>
                      <div>
                        <div class="text-xs font-bold text-white">{{ alm.title || alm.widgetId }}</div>
                        <div class="text-[11px] text-red-300 font-medium mt-0.5">{{ alm.text }}</div>
                      </div>
                    </div>
                    <div class="text-right font-mono">
                      <span class="text-xs font-bold text-amber-400">Value: {{ alm.value }}</span>
                      <div class="text-[9px] text-slate-500">Condition: {{ alm.condition }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- VIEW 3: TAG TELEMETRY MATRIX VIEW -->
            <div v-else-if="hmiViewerMode === 'matrix'" class="space-y-4">
              <div class="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-table-cells text-sky-400"></i>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">Decoded Telemetry Tags & RF Metrics</h4>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400">
                    {{ Object.keys(hmiTelemetryMap).length }} Resolved Tags
                  </span>
                </div>

                <div v-if="Object.keys(hmiTelemetryMap).length === 0" class="py-12 text-center text-slate-500 text-xs">
                  No telemetry tags received yet. Please ensure devices are transmitting or run a packet simulation.
                </div>

                <div v-else class="overflow-x-auto custom-scroll">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th class="py-2.5 px-3">Tag Key / Device</th>
                        <th class="py-2.5 px-3">Current Value</th>
                        <th class="py-2.5 px-3">Data Type</th>
                        <th class="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-mono text-xs">
                      <tr v-for="(val, tagKey) in hmiTelemetryMap" :key="tagKey" class="hover:bg-slate-800/30">
                        <td class="py-2 px-3 text-sky-300 font-bold">{{ tagKey }}</td>
                        <td class="py-2 px-3 text-white font-extrabold text-sm">{{ val }}</td>
                        <td class="py-2 px-3 text-slate-400 text-[11px]">{{ typeof val }}</td>
                        <td class="py-2 px-3 text-right">
                          <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">LIVE</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          <!-- FEATURE: DOWNLINK ACTUATOR (D-MODULE) -->
          <div v-else-if="activeFeature.id === 'lorawan-downlink' || activeFeature.id === 'downlink-actuator'" class="space-y-6">
            <!-- Action Toolbar & Breadcrumb -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-sm">
              <div class="flex items-center gap-3">
                <button @click="returnToHome" title="Back to Dashboard" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer">
                  <i class="fa-solid fa-arrow-left mr-1"></i> Dashboard
                </button>
                <div class="h-4 w-px bg-slate-800"></div>
                <div>
                  <h2 class="text-sm font-bold text-white tracking-wide">Downlink Actuator</h2>
                  <p class="text-[10px] text-slate-400">Transmit raw Hex payloads to LoRaWAN end-devices.</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="fetchDownlinkHistory(); if (downlinkForm.devEUI) fetchDeviceQueue(downlinkForm.devEUI);"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingDownlinkHistory }"></i>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <!-- TOP 2-COLUMN SPLIT: DOWNLINK COMMAND (LEFT) & DEVICE PENDING QUEUE (RIGHT) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <!-- 1. LEFT COLUMN: DOWNLINK COMMAND -->
              <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between h-full">
                <div class="space-y-4">
                  <div class="pb-3 border-b border-slate-800 flex items-center justify-between">
                    <h3 class="text-xs font-bold text-white uppercase tracking-wider">Downlink Command</h3>
                  </div>

                  <!-- 1.1 DEVICE SEARCHABLE DROPLIST -->
                  <div class="space-y-1.5 relative" @click.stop>
                    <label class="block text-xs font-bold text-slate-300">
                      Device
                    </label>

                    <div class="relative flex items-center">
                      <input
                        type="text"
                        v-model="downlinkDeviceSearch"
                        @focus="onDownlinkSearchFocus"
                        @click="downlinkDeviceDropdownOpen = true"
                        placeholder="Search or select device (Name or DevEUI)..."
                        class="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
                      />
                      <button
                        type="button"
                        @click.stop="toggleDownlinkDropdown"
                        class="absolute right-2 text-slate-400 hover:text-white text-xs p-1 cursor-pointer flex items-center justify-center"
                      >
                        <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200" :class="{ 'rotate-180': downlinkDeviceDropdownOpen }"></i>
                      </button>
                    </div>

                    <!-- Dropdown Options -->
                    <div
                      v-show="downlinkDeviceDropdownOpen"
                      class="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-slate-950 border border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-800/80 custom-scroll"
                    >
                      <div
                        v-for="d in filteredDownlinkDevices"
                        :key="d.devEUI"
                        @click="selectDownlinkDevice(d)"
                        class="px-3 py-2 text-xs font-mono cursor-pointer hover:bg-slate-800 flex items-center justify-between transition"
                        :class="{ 'bg-indigo-950/50 text-indigo-300 font-bold': downlinkForm.devEUI === d.devEUI }"
                      >
                        <span class="text-white">{{ d.name ? d.name + ' - ' + d.devEUI : d.devEUI }}</span>
                        <span class="text-[10px] text-slate-400 font-sans ml-2 flex-shrink-0">{{ d.networkServer?.name || 'LNS' }}</span>
                      </div>
                      <div v-if="filteredDownlinkDevices.length === 0" class="px-3 py-3 text-xs text-slate-500 text-center">
                        No matching devices
                      </div>
                    </div>

                    <!-- Device Details Card: DEV_EUI, NETWORK_SERVER, REGION, FIRMWARE, SKU -->
                    <div v-if="selectedDownlinkDevice" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                        <div>
                          <div class="text-[9px] text-slate-500 font-bold tracking-wider">DEV_EUI</div>
                          <div class="font-mono font-bold text-sky-400 truncate" :title="selectedDownlinkDevice.devEUI">{{ selectedDownlinkDevice.devEUI }}</div>
                        </div>
                        <div>
                          <div class="text-[9px] text-slate-500 font-bold tracking-wider">NETWORK_SERVER</div>
                          <div class="font-semibold text-white truncate" :title="selectedDownlinkServer?.name || 'Default'">{{ selectedDownlinkServer?.name || 'Default' }}</div>
                        </div>
                        <div>
                          <div class="text-[9px] text-slate-500 font-bold tracking-wider">REGION</div>
                          <div class="font-mono text-indigo-300 truncate" :title="selectedDownlinkDevice.regionProfileName || selectedDownlinkDevice.regionProfileId || 'Default'">
                            {{ selectedDownlinkDevice.regionProfileName || selectedDownlinkDevice.regionProfileId || 'Default' }}
                          </div>
                        </div>
                        <div>
                          <div class="text-[9px] text-slate-500 font-bold tracking-wider">FIRMWARE</div>
                          <div class="font-mono text-purple-300 font-bold truncate">
                            {{ formatFirmware(selectedDownlinkDevice.firmwareVersion) }}
                          </div>
                        </div>
                        <div>
                          <div class="text-[9px] text-slate-500 font-bold tracking-wider">SKU</div>
                          <div class="font-mono text-cyan-300 font-bold truncate" :title="selectedDownlinkDevice.sku || '—'">
                            {{ selectedDownlinkDevice.sku || '—' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 1.2 FPORT, CONFIRMED TOGGLE & FLUSH QUEUE TOGGLE -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="space-y-1">
                      <label class="block text-xs font-bold text-slate-300">
                        fPort
                      </label>
                      <input
                        v-model.number="downlinkForm.fPort"
                        type="number"
                        class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div class="space-y-1">
                      <label class="block text-xs font-bold text-slate-300">
                        Confirmed
                      </label>
                      <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span class="text-xs font-mono" :class="downlinkForm.confirmed ? 'text-indigo-400 font-bold' : 'text-slate-500'">{{ downlinkForm.confirmed ? 'ON' : 'OFF' }}</span>
                        <button
                          type="button"
                          @click="downlinkForm.confirmed = !downlinkForm.confirmed"
                          :class="downlinkForm.confirmed ? 'bg-indigo-600' : 'bg-slate-800'"
                          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0"
                        >
                          <span :class="downlinkForm.confirmed ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-slate-400'" class="inline-block h-4 w-4 transform rounded-full transition-transform"></span>
                        </button>
                      </div>
                    </div>

                    <div class="space-y-1">
                      <label class="block text-xs font-bold text-slate-300">
                        Flush Queue
                      </label>
                      <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span class="text-xs font-mono" :class="downlinkForm.flushQueue ? 'text-amber-400 font-bold' : 'text-slate-500'">{{ downlinkForm.flushQueue ? 'ON' : 'OFF' }}</span>
                        <button
                          type="button"
                          @click="downlinkForm.flushQueue = !downlinkForm.flushQueue"
                          :class="downlinkForm.flushQueue ? 'bg-amber-500' : 'bg-slate-800'"
                          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0"
                        >
                          <span :class="downlinkForm.flushQueue ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-slate-400'" class="inline-block h-4 w-4 transform rounded-full transition-transform"></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 1.3 HEX PAYLOAD -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <label class="block text-xs font-bold text-slate-300 uppercase">
                        HEX PAYLOAD
                      </label>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-sky-400 border border-slate-800 font-bold">
                        {{ calculatedHexBytes }} Bytes
                      </span>
                    </div>

                    <textarea
                      v-model="downlinkForm.payloadHex"
                      rows="2"
                      placeholder="Enter hex string (e.g. 0102A3FF)..."
                      class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs uppercase focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
                    ></textarea>
                  </div>
                </div>

                <!-- 1.4 ACTION BUTTON: LARGE FULL-WIDTH SEND BUTTON -->
                <div class="pt-4">
                  <button
                    type="button"
                    @click="openDownlinkConfirm"
                    :disabled="!downlinkForm.devEUI || !downlinkForm.payloadHex"
                    class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition uppercase tracking-wider"
                  >
                    <i class="fa-solid fa-paper-plane"></i>
                    <span>SEND</span>
                  </button>
                </div>
              </div>

              <!-- 2. RIGHT COLUMN: DEVICE PENDING QUEUE (DISPLAYED ONLY WHEN DEVICE SELECTED) -->
              <div v-if="downlinkForm.devEUI" class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col h-full">
                <div class="flex flex-col h-full space-y-4">
                  <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
                    <div class="flex items-center gap-2">
                      <h3 class="text-xs font-bold text-white uppercase tracking-wider">Device Pending Queue</h3>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {{ deviceQueue.length }}
                      </span>
                    </div>

                    <div class="flex items-center gap-2">
                      <!-- Flush Queue button -->
                      <button
                        type="button"
                        @click="openFlushConfirm"
                        :disabled="!downlinkForm.devEUI || flushingQueue"
                        class="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                        title="Clear all pending downlinks on Network Server"
                      >
                        <i class="fa-solid fa-broom" :class="{ 'animate-spin': flushingQueue }"></i>
                        <span>Flush Queue</span>
                      </button>

                      <button
                        type="button"
                        @click="fetchDeviceQueue(downlinkForm.devEUI)"
                        :disabled="!downlinkForm.devEUI || loadingDeviceQueue"
                        class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                        title="Refresh Queue"
                      >
                        <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingDeviceQueue }"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Queue Content -->
                  <div v-if="loadingDeviceQueue && deviceQueue.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-10">
                    <i class="fa-solid fa-spinner animate-spin text-amber-400 mb-2"></i>
                    <span>Loading queue...</span>
                  </div>
                  <div v-else-if="deviceQueue.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                    <i class="fa-solid fa-inbox text-2xl text-slate-700 mb-2 block"></i>
                    <span>Queue is currently empty.</span>
                  </div>
                  <div v-else class="overflow-x-auto custom-scroll flex-1 overflow-y-auto min-h-0">
                    <table class="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr class="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono sticky top-0 bg-slate-900">
                          <th class="py-2 px-3">#</th>
                          <th class="py-2 px-3">Port</th>
                          <th class="py-2 px-3">Payload (Hex)</th>
                          <th class="py-2 px-3">Bytes</th>
                          <th class="py-2 px-3">Type</th>
                          <th class="py-2 px-3">Status</th>
                          <th class="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 font-mono text-xs">
                        <tr v-for="(qItem, qIdx) in deviceQueue" :key="qItem.id || qIdx" class="hover:bg-slate-800/40 transition">
                          <td class="py-2 px-3 text-slate-500">{{ qIdx + 1 }}</td>
                          <td class="py-2 px-3 text-white font-bold">{{ qItem.fPort }}</td>
                          <td class="py-2 px-3 text-sky-300 font-bold max-w-[140px] truncate" :title="qItem.payloadHex">
                            {{ qItem.payloadHex }}
                          </td>
                          <td class="py-2 px-3 text-slate-400">{{ Math.ceil((qItem.payloadHex || '').length / 2) }}</td>
                          <td class="py-2 px-3">
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold" :class="qItem.confirmed ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' : 'bg-slate-800 text-slate-400'">
                              {{ qItem.confirmed ? 'ACK' : 'Unconf' }}
                            </span>
                          </td>
                          <td class="py-2 px-3">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                              {{ qItem.isPending ? 'Pending Rx' : 'Queued' }}
                            </span>
                          </td>
                          <td class="py-2 px-3 text-right">
                            <button
                              type="button"
                              @click="copyText(qItem.payloadHex)"
                              class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] cursor-pointer"
                              title="Copy Payload Hex"
                            >
                              Copy
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- PLACEHOLDER WHEN NO DEVICE SELECTED -->
              <div v-else class="p-5 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800/80 text-center py-16 text-slate-500 text-xs flex flex-col items-center justify-center space-y-2 h-full min-h-[300px]">
                <div class="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-600 mb-1">
                  <i class="fa-solid fa-list-check text-base"></i>
                </div>
                <span class="text-slate-400 font-medium">Select a device to view pending queue</span>
              </div>

            </div>

            <!-- 3. BOTTOM: DOWNLINK EXECUTION HISTORY -->
            <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <!-- History Header & Filter -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <h3 class="text-xs font-bold text-white uppercase tracking-wider">Downlink History</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {{ downlinkHistory.length }}
                  </span>
                </div>

                <!-- Device Filter for History -->
                <div class="flex items-center gap-2">
                  <select
                    v-model="downlinkHistoryFilterDevEUI"
                    @change="fetchDownlinkHistory(downlinkHistoryFilterDevEUI)"
                    class="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none"
                  >
                    <option value="">-- All Devices --</option>
                    <option v-for="d in devicesList" :key="d.devEUI" :value="d.devEUI">
                      {{ d.name ? d.name + ' - ' + d.devEUI : d.devEUI }}
                    </option>
                  </select>
                  <button
                    type="button"
                    @click="fetchDownlinkHistory(downlinkHistoryFilterDevEUI)"
                    class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                    title="Refresh"
                  >
                    <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingDownlinkHistory }"></i>
                  </button>
                </div>
              </div>

              <!-- History Table -->
              <div class="overflow-x-auto custom-scroll">
                <table class="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr class="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      <th class="py-2.5 px-3">Timestamp</th>
                      <th class="py-2.5 px-3">User</th>
                      <th class="py-2.5 px-3">Device</th>
                      <th class="py-2.5 px-3">Server</th>
                      <th class="py-2.5 px-3">Port</th>
                      <th class="py-2.5 px-3">Payload (Hex)</th>
                      <th class="py-2.5 px-3">Status</th>
                      <th class="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60 font-mono text-xs">
                    <tr v-if="loadingDownlinkHistory && downlinkHistory.length === 0">
                      <td colspan="8" class="text-center py-8 text-slate-500">
                        <i class="fa-solid fa-spinner animate-spin text-sky-400 mr-2"></i>
                        Loading downlink history...
                      </td>
                    </tr>
                    <tr v-else-if="downlinkHistory.length === 0">
                      <td colspan="8" class="text-center py-10 text-slate-500">
                        No downlink records found.
                      </td>
                    </tr>
                    <tr v-for="item in downlinkHistory" :key="item.id" class="hover:bg-slate-800/40 transition">
                      <td class="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {{ formatDateTime(item.createdAt) }}
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                          {{ item.sentBy || 'anonymous' }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <div class="text-white font-bold text-[11px]">{{ item.deviceName || item.devEUI }}</div>
                        <div class="text-[10px] text-slate-500">{{ item.devEUI }}</div>
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <span
                          class="px-1.5 py-0.5 rounded text-[9px] font-bold"
                          :class="item.serverType === 'CHIRPSTACK' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'"
                        >
                          {{ item.serverType || 'LNS' }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <span class="font-bold text-white">{{ item.fPort }}</span>
                        <span v-if="item.flushQueue" class="ml-1 px-1 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30">FLUSH</span>
                        <span v-if="item.confirmed" class="ml-1 px-1 py-0.2 rounded text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">ACK</span>
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-sky-300 max-w-[120px] truncate" :title="item.payloadHex">{{ item.payloadHex }}</span>
                          <button
                            type="button"
                            @click="copyText(item.payloadHex)"
                            class="text-slate-500 hover:text-white text-[10px] cursor-pointer"
                            title="Copy Hex"
                          >
                            <i class="fa-regular fa-copy"></i>
                          </button>
                        </div>
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          :class="item.status === 'QUEUED' || item.status === 'SUCCESS' || item.status === 'SENT' || item.status === 'FLUSHED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'"
                        >
                          {{ item.status }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          @click="resendDownlink(item)"
                          class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold border border-slate-700 cursor-pointer transition ml-auto"
                          title="Reload into form"
                        >
                          Reload
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
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

    <!-- MODAL: ADD SENSOR / SERIES TO TREND CHART (Y-AXIS) -->
    <div v-if="trendSeriesModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-sm font-bold text-white uppercase flex items-center gap-2">
            <i class="fa-solid fa-chart-line text-sky-400"></i>
            <span>Thêm Cảm Biến Vào Đồ Thị Trend (Trục Y)</span>
          </h3>
          <button @click="trendSeriesModal = false" class="text-slate-400 hover:text-white cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Step 1: Chọn thiết bị (Device) -->
          <div>
            <label class="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
              <span class="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">1</span>
              <span>Chọn Thiết Bị Cảm Biến (DevEUI)</span>
            </label>
            <select
              v-model="trendSeriesForm.devEUI"
              @change="fetchDetectedTrendFields(trendSeriesForm.devEUI)"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-sky-500"
            >
              <option value="">-- Chọn Thiết Bị --</option>
              <option v-for="d in devicesList" :key="d.devEUI" :value="d.devEUI">
                {{ d.name ? d.name + ' (' + d.devEUI + ')' : d.devEUI }}
              </option>
            </select>
          </div>

          <!-- Step 2: Chọn tag/field giải mã của cảm biến -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-slate-300 font-bold flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">2</span>
                <span>Chọn Tag / Thông Số Cảm Biến</span>
              </label>
              <button
                v-if="trendSeriesForm.devEUI"
                type="button"
                @click="fetchDetectedTrendFields(trendSeriesForm.devEUI)"
                class="text-slate-400 hover:text-sky-400 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingTrendFields }"></i>
                <span>Quét lại tags</span>
              </button>
            </div>

            <!-- Loading tags -->
            <div v-if="loadingTrendFields" class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center text-slate-400">
              <i class="fa-solid fa-spinner animate-spin text-sky-400 mr-2"></i>
              <span>Đang quét payload dữ liệu từ cảm biến...</span>
            </div>

            <!-- Tag pills -->
            <div v-else-if="detectedTrendFields.length > 0" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div class="text-[10px] text-slate-400">Bấm chọn một thông số bên dưới:</div>
              <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scroll pr-1">
                <button
                  v-for="f in detectedTrendFields"
                  :key="f.key"
                  type="button"
                  @click="selectTrendTagPill(f)"
                  class="px-2.5 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer border"
                  :class="trendSeriesForm.field === f.key ? 'bg-sky-500/30 border-sky-400 text-white font-bold shadow-md' : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'"
                >
                  <span :class="f.source === 'decoded_payload' ? 'text-emerald-400 font-semibold' : 'text-slate-300'">{{ f.key }}</span>
                  <span class="text-[10px] text-slate-400">({{ f.latestValue }}{{ f.unit || '' }})</span>
                </button>
              </div>
            </div>

            <div v-else-if="trendSeriesForm.devEUI" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 italic">
              Thiết bị chưa có gói tin uplink trong DB. Bạn có thể nhập mã tag thủ công bên dưới.
            </div>

            <!-- Field Name & Unit inputs -->
            <div class="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label class="text-[10px] text-slate-400">Mã Tag (Field)</label>
                <input
                  type="text"
                  v-model="trendSeriesForm.field"
                  placeholder="e.g. HUMIDITY, TEMPERATURE..."
                  class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label class="text-[10px] text-slate-400">Đơn vị đo (Unit)</label>
                <input
                  type="text"
                  v-model="trendSeriesForm.unit"
                  placeholder="e.g. °C, %RH, bar..."
                  class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <!-- Step 3: Tên hiển thị và Màu sắc đường đồ thị -->
          <div class="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label class="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">3</span>
                <span>Tên Hiển Thị (Label)</span>
              </label>
              <input
                type="text"
                v-model="trendSeriesForm.label"
                placeholder="e.g. Cảm biến 01 - Nhiệt độ"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-bold mb-1">Màu Sắc Đường Đồ Thị</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  v-model="trendSeriesForm.color"
                  class="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer"
                />
                <!-- Preset color buttons -->
                <div class="flex items-center gap-1">
                  <button
                    v-for="c in ['#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#06b6d4', '#eab308']"
                    :key="c"
                    type="button"
                    @click="trendSeriesForm.color = c"
                    class="w-5 h-5 rounded-full border border-slate-700 cursor-pointer transition hover:scale-110"
                    :style="{ backgroundColor: c }"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button @click="trendSeriesModal = false" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
            Hủy
          </button>
          <button @click="saveTrendSeries" class="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5">
            <i class="fa-solid fa-check"></i>
            <span>Thêm Vào Đồ Thị</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: CONFIRM DOWNLINK DISPATCH (D-MODULE) -->
    <div v-if="downlinkConfirmModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-sm font-bold text-white">Confirm Downlink Dispatch</h3>
          <button @click="downlinkConfirmModal.show = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="space-y-2.5 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
          <!-- 1. Device Name -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Device Name:</span>
            <span class="font-bold text-white font-mono text-right truncate max-w-[200px]" :title="(downlinkConfirmModal.targetDevice && downlinkConfirmModal.targetDevice.name) ? downlinkConfirmModal.targetDevice.name : downlinkConfirmModal.devEUI">
              {{ (downlinkConfirmModal.targetDevice && downlinkConfirmModal.targetDevice.name) ? downlinkConfirmModal.targetDevice.name : downlinkConfirmModal.devEUI }}
            </span>
          </div>

          <!-- 2. SKU -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">SKU:</span>
            <span class="font-mono text-cyan-300 font-semibold">
              {{ (downlinkConfirmModal.targetDevice && downlinkConfirmModal.targetDevice.sku) ? downlinkConfirmModal.targetDevice.sku : '—' }}
            </span>
          </div>

          <!-- 3. FIRMWARE VERSION -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">FIRMWARE VERSION:</span>
            <span class="font-mono text-purple-300 font-semibold">
              {{ formatFirmware(downlinkConfirmModal.targetDevice && downlinkConfirmModal.targetDevice.firmwareVersion) }}
            </span>
          </div>

          <!-- 4. Device region (class) -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Device region (class):</span>
            <span class="font-mono text-indigo-300 font-semibold text-right">
              {{ ((downlinkConfirmModal.targetDevice && (downlinkConfirmModal.targetDevice.regionProfileName || downlinkConfirmModal.targetDevice.regionProfileId)) ? (downlinkConfirmModal.targetDevice.regionProfileName || downlinkConfirmModal.targetDevice.regionProfileId) : 'Default') + ' (' + ((downlinkConfirmModal.targetDevice && downlinkConfirmModal.targetDevice.deviceClass) ? downlinkConfirmModal.targetDevice.deviceClass : 'Class A') + ')' }}
            </span>
          </div>

          <!-- 5. Network server -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Network server:</span>
            <span class="font-bold text-sky-400">
              {{ (downlinkConfirmModal.targetServer && downlinkConfirmModal.targetServer.name) ? downlinkConfirmModal.targetServer.name : ((downlinkConfirmModal.targetServer && downlinkConfirmModal.targetServer.type) ? downlinkConfirmModal.targetServer.type : 'LNS') }}
            </span>
          </div>

          <!-- 6. fPort -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">fPort:</span>
            <span class="font-mono text-white font-bold">
              {{ downlinkConfirmModal.fPort }}
            </span>
          </div>

          <!-- 7. Hex Payload -->
          <div class="flex items-center justify-between">
            <span class="text-slate-400">Hex Payload:</span>
            <span class="font-mono text-emerald-400 font-bold tracking-wider text-right max-w-[200px] truncate" :title="downlinkConfirmModal.payloadHex">
              {{ downlinkConfirmModal.payloadHex }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="downlinkConfirmModal.show = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="executeConfirmedDownlink"
            :disabled="sendingDownlink"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            <i class="fa-solid fa-spinner animate-spin" v-if="sendingDownlink"></i>
            <span>{{ sendingDownlink ? 'Dispatching...' : 'Confirm & Send' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: CONFIRM FLUSH QUEUE (D-MODULE) -->
    <div v-if="flushConfirmModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <i class="fa-solid fa-broom text-sm"></i>
            </div>
            <h3 class="text-sm font-bold text-white">Confirm Queue Flush</h3>
          </div>
          <button @click="flushConfirmModal.show = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="space-y-2.5 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Target Device:</span>
            <span class="font-bold text-white font-mono text-right truncate max-w-[200px]" :title="(flushConfirmModal.targetDevice && flushConfirmModal.targetDevice.name) ? flushConfirmModal.targetDevice.name : flushConfirmModal.devEUI">
              {{ (flushConfirmModal.targetDevice && flushConfirmModal.targetDevice.name) ? (flushConfirmModal.targetDevice.name + ' - ' + flushConfirmModal.devEUI) : flushConfirmModal.devEUI }}
            </span>
          </div>

          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span class="text-slate-400">Network Server:</span>
            <span class="font-bold text-sky-400">
              {{ (flushConfirmModal.targetServer && flushConfirmModal.targetServer.name) ? flushConfirmModal.targetServer.name : 'Default' }}
            </span>
          </div>

          <div class="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0"></i>
            <span>This will permanently delete all pending downlink frames in the Network Server queue for this device.</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="flushConfirmModal.show = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="executeConfirmedFlush"
            :disabled="flushingQueue"
            class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            <i class="fa-solid fa-broom" :class="{ 'animate-spin': flushingQueue }"></i>
            <span>{{ flushingQueue ? 'Flushing...' : 'Confirm Flush' }}</span>
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

  <!-- Vue 3 with multiple CDN failover mirrors -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.31/vue.global.prod.min.js"></script>
  <script>
    if (typeof Vue === 'undefined') {
      document.write('<script src="https://cdn.jsdelivr.net/npm/vue@3.4.31/dist/vue.global.prod.js"><\\/script>');
    }
  </script>
  <script>
    if (typeof Vue === 'undefined') {
      document.write('<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"><\\/script>');
    }
  </script>
  <script>
    // Fail-safe: remove v-cloak if error happens or Vue fails to mount within 2.5s
    window.addEventListener('error', function(e) {
      console.error('[Global Page Error]:', e.error || e.message);
      var appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        appEl.removeAttribute('v-cloak');
      }
    });
    setTimeout(function() {
      var appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        console.warn('Vue mounting safety timer triggered: removing v-cloak');
        appEl.removeAttribute('v-cloak');
      }
    }, 2500);

    const { createApp, ref, computed, onMounted, nextTick, watch } = Vue;

    const app = createApp({
      setup() {
        const currentUser = ref({});
        const accessibleFeatures = ref([]);
        const activeFeature = ref(null);
        const userMenuOpen = ref(false);
        const standaloneOpsUrl = computed(() => {
          const host = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost';
          return 'http://' + host + ':3099/manager';
        });

        const telemetryList = ref([]);
        const devicesList = ref([]);
        const networkServersList = ref([]);
        const selectedTelemetryDeviceEUI = ref('');
        const selectedTelemetryDevice = computed(() => {
          if (!selectedTelemetryDeviceEUI.value) return null;
          return devicesList.value.find(d => (d.devEUI || '').toUpperCase() === selectedTelemetryDeviceEUI.value.toUpperCase()) || null;
        });
        const loadingTelemetry = ref(false);
        const activeTelemetryPacket = ref(null);
        const telemetryViewMode = ref('tabular');

        // Advanced Filtering, Sorting & Auto-Sync state
        const telemetryTimeFilter = ref('ALL');
        const telemetryRangeStart = ref('');
        const telemetryRangeEnd = ref('');
        const telemetrySearchQuery = ref('');
        const telemetrySortKey = ref('time');
        const telemetrySortOrder = ref('desc');
        const autoSyncEnabled = ref(true);
        const autoSyncTimer = ref(null);
        const autoSyncInterval = 3000;
        const lastSyncTime = ref(null);
        const telemetryLoaded = ref(false); // table stays empty until user clicks SHOW

        // Export Dropdown state
        const exportDropdownOpen = ref(false);

        // Column visibility filter
        const columnFilterOpen = ref(false);
        const metadataColumnsList = [
          { key: 'fPort', label: 'FPORT' },
          { key: 'fCnt', label: 'FCNT' },
          { key: 'rssi', label: 'RSSI' },
          { key: 'snr', label: 'SNR' },
          { key: 'payloadHex', label: 'PAYLOAD HEX' },
        ];
        const hiddenMetadataColumns = ref(new Set());
        const hiddenSensorColumns = ref(new Set());

        const toggleMetadataColumn = (key) => {
          const s = new Set(hiddenMetadataColumns.value);
          if (s.has(key)) { s.delete(key); } else { s.add(key); }
          hiddenMetadataColumns.value = s;
        };

        const isMetadataColumnVisible = (key) => !hiddenMetadataColumns.value.has(key);

        const totalHiddenColumnsCount = computed(() => {
          return hiddenMetadataColumns.value.size + hiddenSensorColumns.value.size;
        });

        const showAllColumns = () => {
          hiddenMetadataColumns.value = new Set();
          hiddenSensorColumns.value = new Set();
        };

        const resetDefaultColumns = () => {
          hiddenMetadataColumns.value = new Set();
          hiddenSensorColumns.value = new Set();
        };

        const hideAllSensorColumns = () => {
          hiddenSensorColumns.value = new Set(dashboardSensorColumns.value);
        };

        // Pagination state
        const telemetryPage = ref(1);
        const telemetryPageSize = ref(50); // 25, 50, 100, 250, 500, 'ALL'

        // Synchronized Horizontal Scrollbars state
        const topScrollRef = ref(null);
        const tableScrollRef = ref(null);
        const telemetryTableRef = ref(null);
        const tableScrollWidth = ref(1000);
        const tableHasHorizontalOverflow = ref(false);
        let isSyncingScroll = false;

        const filteredTelemetryList = computed(() => {
          if (!telemetryLoaded.value) return [];
          let list = telemetryList.value || [];
          if (selectedTelemetryDeviceEUI.value) {
            const eui = selectedTelemetryDeviceEUI.value.toUpperCase();
            list = list.filter(t => (t.devEui || t.devEUI || '').toUpperCase() === eui);
          }
          return list;
        });

        const activeDecodedFields = computed(() => {
          if (!activeTelemetryPacket.value) return [];
          const pkt = activeTelemetryPacket.value;
          const dataObj = pkt.decodedData || pkt.object || null;
          if (!dataObj) return [];
          const res = [];
          const extractFields = (obj, prefix = '') => {
            if (!obj || typeof obj !== 'object') return;
            for (const [k, v] of Object.entries(obj)) {
              const fullKey = prefix ? prefix + '.' + k : k;
              if (v === null || v === undefined) {
                res.push({ key: fullKey, value: 'null', type: 'null' });
              } else if (typeof v === 'object' && !Array.isArray(v)) {
                extractFields(v, fullKey);
              } else if (Array.isArray(v)) {
                res.push({ key: fullKey, value: JSON.stringify(v), type: 'array' });
              } else {
                res.push({ key: fullKey, value: String(v), type: typeof v });
              }
            }
          };
          if (dataObj.data && typeof dataObj.data === 'object') {
            extractFields(dataObj.data);
          } else {
            extractFields(dataObj);
          }
          return res;
        });

        const flattenDashboardFields = (obj, prefix = '') => {
          const res = {};
          if (!obj || typeof obj !== 'object') return res;
          for (const [k, v] of Object.entries(obj)) {
            const fullKey = prefix ? prefix + '.' + k : k;
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
              Object.assign(res, flattenDashboardFields(v, fullKey));
            } else {
              res[fullKey] = v;
            }
          }
          return res;
        };

        const EXCLUDED_COLUMNS = new Set([
          'errors', 'warnings', 'fPort', 'fCnt', 'devEUI', 'deviceName', 'gatewayId',
          'rssi', 'snr', 'devEui', 'dr', 'adr', 'channel', 'frequency', 'bandwidth',
          'spreadingFactor', 'tenantId', 'applicationId', 'serverType'
        ]);

        const getFlattenedData = (pkt) => {
          if (!pkt) return {};
          if (pkt._cachedFlat) return pkt._cachedFlat;
          const decoded = pkt.decodedData || pkt.object || null;
          if (!decoded) {
            pkt._cachedFlat = {};
            return pkt._cachedFlat;
          }
          const dataObj = decoded.data && typeof decoded.data === 'object' ? decoded.data : decoded;
          pkt._cachedFlat = flattenDashboardFields(dataObj);
          return pkt._cachedFlat;
        };

        const dashboardSensorColumns = computed(() => {
          const colSet = new Set();
          const list = filteredTelemetryList.value || [];
          for (let i = 0; i < list.length; i++) {
            const flat = getFlattenedData(list[i]);
            for (const k of Object.keys(flat)) {
              if (!EXCLUDED_COLUMNS.has(k)) {
                colSet.add(k);
              }
            }
          }
          return Array.from(colSet).sort();
        });

        const dashboardMatrixRows = computed(() => {
          const list = filteredTelemetryList.value || [];
          const cols = dashboardSensorColumns.value;
          const len = list.length;
          const res = new Array(len);
          for (let i = 0; i < len; i++) {
            const pkt = list[i];
            const flat = getFlattenedData(pkt);
            const sensorValues = {};
            for (let j = 0; j < cols.length; j++) {
              const c = cols[j];
              const val = flat[c];
              if (val === undefined || val === null) {
                sensorValues[c] = '—';
              } else if (typeof val === 'object') {
                sensorValues[c] = JSON.stringify(val);
              } else if (typeof val === 'number') {
                sensorValues[c] = Number.isInteger(val) ? val : Number(val.toFixed(3));
              } else {
                sensorValues[c] = String(val);
              }
            }
            res[i] = {
              raw: pkt,
              time: pkt.timestamp || pkt.receivedAt,
              fPort: pkt.fPort || 1,
              fCnt: pkt.fCnt !== undefined && pkt.fCnt !== null ? pkt.fCnt : 0,
              rssi: pkt.rssi != null ? pkt.rssi : null,
              snr: pkt.snr != null ? pkt.snr : null,
              payloadHex: pkt.payloadHex || pkt.data || '—',
              sensorValues: sensorValues
            };
          }
          return res;
        });

        const passesTimeFilter = (timestamp, filter) => {
          if (!filter || filter === 'ALL') return true;
          if (!timestamp) return false;
          const time = new Date(timestamp).getTime();
          if (isNaN(time)) return false;
          const now = Date.now();
          const diffMs = now - time;
          if (filter === '15M') return diffMs <= 15 * 60 * 1000;
          if (filter === '1H') return diffMs <= 60 * 60 * 1000;
          if (filter === '24H') return diffMs <= 24 * 60 * 60 * 1000;
          if (filter === '7D') return diffMs <= 7 * 24 * 60 * 60 * 1000;
          return true;
        };

        const filteredDashboardMatrixRows = computed(() => {
          let rows = dashboardMatrixRows.value || [];

          // Filter by custom date range (start / end)
          const rangeStart = telemetryRangeStart.value ? new Date(telemetryRangeStart.value).getTime() : null;
          const rangeEnd = telemetryRangeEnd.value ? new Date(telemetryRangeEnd.value + ':59').getTime() : null;
          if (rangeStart || rangeEnd) {
            rows = rows.filter(r => {
              const t = r.time ? new Date(r.time).getTime() : null;
              if (!t || isNaN(t)) return false;
              if (rangeStart && t < rangeStart) return false;
              if (rangeEnd && t > rangeEnd) return false;
              return true;
            });
          }

          // Filter by search query
          const q = (telemetrySearchQuery.value || '').trim().toLowerCase();
          if (q) {
            rows = rows.filter(r => {
              if (r.time && String(r.time).toLowerCase().includes(q)) return true;
              if (formatDateTime(r.time).toLowerCase().includes(q)) return true;
              if (String(r.fPort).toLowerCase().includes(q)) return true;
              if (String(r.fCnt).toLowerCase().includes(q)) return true;
              if (r.rssi != null && String(r.rssi).includes(q)) return true;
              if (r.snr != null && String(r.snr).includes(q)) return true;
              if (r.payloadHex && r.payloadHex.toLowerCase().includes(q)) return true;
              for (const [k, v] of Object.entries(r.sensorValues)) {
                if (k.toLowerCase().includes(q)) return true;
                if (String(v).toLowerCase().includes(q)) return true;
              }
              return false;
            });
          }

          return rows;
        });

        const sortedDashboardMatrixRows = computed(() => {
          const list = [...filteredDashboardMatrixRows.value];
          const key = telemetrySortKey.value;
          const order = telemetrySortOrder.value === 'asc' ? 1 : -1;

          return list.sort((a, b) => {
            if (key === 'time') {
              const tA = a.time ? new Date(a.time).getTime() : 0;
              const tB = b.time ? new Date(b.time).getTime() : 0;
              return (tA - tB) * order;
            }
            if (key === 'fPort' || key === 'fCnt' || key === 'rssi' || key === 'snr') {
              const vA = a[key] != null ? Number(a[key]) : (order === 1 ? Infinity : -Infinity);
              const vB = b[key] != null ? Number(b[key]) : (order === 1 ? Infinity : -Infinity);
              return (vA - vB) * order;
            }
            if (key === 'payloadHex') {
              const vA = String(a.payloadHex || '');
              const vB = String(b.payloadHex || '');
              return vA.localeCompare(vB) * order;
            }
            if (key.startsWith('sensor:')) {
              const col = key.replace('sensor:', '');
              const sA = a.sensorValues[col];
              const sB = b.sensorValues[col];
              if (sA === '—' && sB === '—') return 0;
              if (sA === '—') return 1;
              if (sB === '—') return -1;
              const numA = Number(sA);
              const numB = Number(sB);
              if (!isNaN(numA) && !isNaN(numB)) {
                return (numA - numB) * order;
              }
              return String(sA).localeCompare(String(sB)) * order;
            }
            return 0;
          });
        });

        const totalTelemetryPages = computed(() => {
          if (telemetryPageSize.value === 'ALL') return 1;
          const sz = Number(telemetryPageSize.value) || 50;
          const total = sortedDashboardMatrixRows.value.length;
          return Math.max(1, Math.ceil(total / sz));
        });

        const paginatedDashboardMatrixRows = computed(() => {
          const rows = sortedDashboardMatrixRows.value || [];
          if (telemetryPageSize.value === 'ALL') return rows;
          const sz = Number(telemetryPageSize.value) || 50;
          const curPage = Math.min(Math.max(1, telemetryPage.value), totalTelemetryPages.value);
          const start = (curPage - 1) * sz;
          return rows.slice(start, start + sz);
        });

        const paginationRangeText = computed(() => {
          const total = sortedDashboardMatrixRows.value.length;
          if (total === 0) return '0';
          if (telemetryPageSize.value === 'ALL') return '1 – ' + total;
          const sz = Number(telemetryPageSize.value) || 50;
          const curPage = Math.min(Math.max(1, telemetryPage.value), totalTelemetryPages.value);
          const start = (curPage - 1) * sz + 1;
          const end = Math.min(curPage * sz, total);
          return start + ' – ' + end;
        });

        const visiblePageNumbers = computed(() => {
          const cur = telemetryPage.value;
          const total = totalTelemetryPages.value;
          if (total <= 7) {
            const pages = [];
            for (let i = 1; i <= total; i++) pages.push(i);
            return pages;
          }
          const pages = [1];
          if (cur > 3) pages.push('...');
          const start = Math.max(2, cur - 1);
          const end = Math.min(total - 1, cur + 1);
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
          if (cur < total - 2) pages.push('...');
          pages.push(total);
          return pages;
        });

        const setTelemetryPage = (p) => {
          const maxP = totalTelemetryPages.value;
          telemetryPage.value = Math.min(Math.max(1, p), maxP);
          if (tableScrollRef.value) {
            tableScrollRef.value.scrollTop = 0;
          }
        };

        const nextTelemetryPage = () => {
          if (telemetryPage.value < totalTelemetryPages.value) {
            setTelemetryPage(telemetryPage.value + 1);
          }
        };

        const prevTelemetryPage = () => {
          if (telemetryPage.value > 1) {
            setTelemetryPage(telemetryPage.value - 1);
          }
        };

        watch([telemetrySearchQuery, telemetryRangeStart, telemetryRangeEnd, telemetryTimeFilter, selectedTelemetryDeviceEUI], () => {
          telemetryPage.value = 1;
        });

        watch(totalTelemetryPages, (newTotal) => {
          if (telemetryPage.value > newTotal) {
            telemetryPage.value = Math.max(1, newTotal);
          }
        });

        const toggleTelemetrySort = (key) => {
          if (telemetrySortKey.value === key) {
            telemetrySortOrder.value = telemetrySortOrder.value === 'asc' ? 'desc' : 'asc';
          } else {
            telemetrySortKey.value = key;
            telemetrySortOrder.value = key === 'time' ? 'desc' : 'asc';
          }
        };

        const resetTelemetryFilters = () => {
          telemetryTimeFilter.value = 'ALL';
          telemetryRangeStart.value = '';
          telemetryRangeEnd.value = '';
          telemetrySearchQuery.value = '';
          telemetrySortKey.value = 'time';
          telemetrySortOrder.value = 'desc';
          telemetryPage.value = 1;
        };

        const isTelemetryFilterActive = computed(() => {
          return Boolean(telemetryRangeStart.value) ||
                 Boolean(telemetryRangeEnd.value) ||
                 Boolean((telemetrySearchQuery.value || '').trim());
        });

        const toggleSensorColumn = (col) => {
          const s = new Set(hiddenSensorColumns.value);
          if (s.has(col)) { s.delete(col); } else { s.add(col); }
          hiddenSensorColumns.value = s;
        };

        const isSensorColumnVisible = (col) => !hiddenSensorColumns.value.has(col);

        const updateScrollDimensions = () => {
          if (telemetryTableRef.value && tableScrollRef.value) {
            const tableWidth = telemetryTableRef.value.scrollWidth || 0;
            const containerWidth = tableScrollRef.value.clientWidth || 0;
            tableScrollWidth.value = tableWidth;
            tableHasHorizontalOverflow.value = tableWidth > containerWidth + 2;
            if (topScrollRef.value) {
              topScrollRef.value.scrollLeft = tableScrollRef.value.scrollLeft;
            }
          }
        };

        const handleTopScroll = () => {
          if (isSyncingScroll) return;
          isSyncingScroll = true;
          if (tableScrollRef.value && topScrollRef.value) {
            tableScrollRef.value.scrollLeft = topScrollRef.value.scrollLeft;
          }
          requestAnimationFrame(() => { isSyncingScroll = false; });
        };

        const handleTableScroll = () => {
          if (isSyncingScroll) return;
          isSyncingScroll = true;
          if (topScrollRef.value && tableScrollRef.value) {
            topScrollRef.value.scrollLeft = tableScrollRef.value.scrollLeft;
          }
          requestAnimationFrame(() => { isSyncingScroll = false; });
        };

        const downloadBlob = (blob, filename) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        const exportHtmlXlsFallback = (headers, data, filename) => {
          let tableHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
          tableHtml += '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Telemetry</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
          tableHtml += '<body><table border="1">';
          tableHtml += '<thead style="background-color:#0f172a;color:#f8fafc;font-weight:bold;"><tr>';
          for (const h of headers) {
            tableHtml += '<th style="padding:6px 12px;background:#0f172a;color:#fff;">' + h + '</th>';
          }
          tableHtml += '</tr></thead><tbody>';
          for (const row of data) {
            tableHtml += '<tr>';
            for (const cell of row) {
              tableHtml += '<td style="padding:4px 8px;">' + (cell !== undefined && cell !== null ? String(cell) : '') + '</td>';
            }
            tableHtml += '</tr>';
          }
          tableHtml += '</tbody></table></body></html>';
          const blob = new Blob(['\\uFEFF' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
          downloadBlob(blob, filename);
          showToast('Exported ' + data.length + ' rows to Excel successfully', 'success');
        };

        const exportTelemetry = (format = 'xlsx') => {
          exportDropdownOpen.value = false;
          const rows = sortedDashboardMatrixRows.value || [];
          if (rows.length === 0) {
            showToast('No telemetry data available to export', 'error');
            return;
          }

          const devEui = selectedTelemetryDeviceEUI.value || 'ALL';
          const now = new Date();
          const pad = (n) => String(n).padStart(2, '0');
          const dateStr = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
          const baseFileName = 'telemetry_' + devEui + '_' + dateStr;

          // Headers: TIME + visible metadata + visible sensor columns + payload hex
          const visibleSensors = dashboardSensorColumns.value.filter(c => isSensorColumnVisible(c));
          const headers = ['TIME'];
          if (isMetadataColumnVisible('fPort')) headers.push('FPORT');
          if (isMetadataColumnVisible('fCnt')) headers.push('FCNT');
          if (isMetadataColumnVisible('rssi')) headers.push('RSSI');
          if (isMetadataColumnVisible('snr')) headers.push('SNR');
          visibleSensors.forEach(c => headers.push(c.toUpperCase()));
          if (isMetadataColumnVisible('payloadHex') || visibleSensors.length === 0) {
            headers.push('PAYLOAD_HEX');
          }

          // Data rows
          const exportData = rows.map(r => {
            const rowItem = [formatDateTime(r.time)];
            if (isMetadataColumnVisible('fPort')) rowItem.push(r.fPort != null ? r.fPort : '');
            if (isMetadataColumnVisible('fCnt')) rowItem.push(r.fCnt != null ? r.fCnt : '');
            if (isMetadataColumnVisible('rssi')) rowItem.push(r.rssi != null ? r.rssi : '');
            if (isMetadataColumnVisible('snr')) rowItem.push(r.snr != null ? r.snr : '');
            for (const c of visibleSensors) {
              const val = r.sensorValues[c];
              rowItem.push(val !== undefined && val !== null && val !== '—' ? val : '');
            }
            if (isMetadataColumnVisible('payloadHex') || visibleSensors.length === 0) {
              rowItem.push(r.payloadHex || '');
            }
            return rowItem;
          });

          if (format === 'csv') {
            const csvLines = [];
            csvLines.push(headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(','));
            for (const r of exportData) {
              csvLines.push(r.map(v => '"' + String(v !== undefined && v !== null ? v : '').replace(/"/g, '""') + '"').join(','));
            }
            const csvContent = csvLines.join('\\r\\n');
            const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            downloadBlob(blob, baseFileName + '.csv');
            showToast('Exported ' + rows.length + ' rows to CSV successfully', 'success');
          } else if (format === 'xlsx' || format === 'xls') {
            if (typeof XLSX !== 'undefined') {
              try {
                const aoa = [headers, ...exportData];
                const ws = XLSX.utils.aoa_to_sheet(aoa);
                ws['!cols'] = headers.map((h, colIdx) => {
                  let maxLen = h.length;
                  for (let i = 0; i < Math.min(exportData.length, 200); i++) {
                    const cellVal = String(exportData[i][colIdx] || '');
                    if (cellVal.length > maxLen) maxLen = cellVal.length;
                  }
                  return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
                });
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Telemetry');
                const bookType = format === 'xls' ? 'biff8' : 'xlsx';
                XLSX.writeFile(wb, baseFileName + '.' + format, { bookType });
                showToast('Exported ' + rows.length + ' rows to ' + format.toUpperCase() + ' successfully', 'success');
              } catch(err) {
                console.error('SheetJS export error, using fallback:', err);
                exportHtmlXlsFallback(headers, exportData, baseFileName + '.' + format);
              }
            } else {
              exportHtmlXlsFallback(headers, exportData, baseFileName + '.' + format);
            }
          }
        };

        const startAutoSync = () => {
          stopAutoSync();
          autoSyncTimer.value = setInterval(() => {
            if (activeFeature.value && (activeFeature.value.id === 'telemetry-decoder' || activeFeature.value.id === 'live-telemetry')) {
              if (telemetryLoaded.value && selectedTelemetryDeviceEUI.value) {
                fetchLiveTelemetry(true);
              }
            }
          }, autoSyncInterval);
        };

        const stopAutoSync = () => {
          if (autoSyncTimer.value) {
            clearInterval(autoSyncTimer.value);
            autoSyncTimer.value = null;
          }
        };

        const toggleAutoSync = () => {
          autoSyncEnabled.value = !autoSyncEnabled.value;
          if (autoSyncEnabled.value) {
            if (telemetryLoaded.value && selectedTelemetryDeviceEUI.value) {
              startAutoSync();
              fetchLiveTelemetry(false);
            }
            showToast("Auto-sync enabled (3s live poll)", "info");
          } else {
            stopAutoSync();
            showToast("Auto-sync paused", "info");
          }
        };

        const onSelectTelemetryDevice = () => {
          // Reset data — table stays empty until user clicks SHOW
          activeTelemetryPacket.value = null;
          telemetryLoaded.value = false;
          telemetryList.value = [];
          telemetryPage.value = 1;
          stopAutoSync();
        };

        const showTelemetry = async () => {
          if (!selectedTelemetryDeviceEUI.value) {
            showToast("Please select a device first", "info");
            return;
          }
          telemetryPage.value = 1;
          await fetchLiveTelemetry(false);
          telemetryLoaded.value = true;
          nextTick(updateScrollDimensions);
          if (autoSyncEnabled.value) startAutoSync();
        };

        const clearTelemetry = () => {
          telemetryLoaded.value = false;
          telemetryList.value = [];
          telemetryRangeStart.value = '';
          telemetryRangeEnd.value = '';
          telemetrySearchQuery.value = '';
          selectedTelemetryDeviceEUI.value = '';
          telemetryPage.value = 1;
          stopAutoSync();
        };

        const deleteTelemetry = clearTelemetry;

        const inspectTelemetryPacket = (pkt) => {
          activeTelemetryPacket.value = pkt;
        };

        const closeInspectModal = () => {
          activeTelemetryPacket.value = null;
        };

        const formatDecodedSummary = (obj) => {
          if (!obj) return '—';
          try {
            const target = obj.data && typeof obj.data === 'object' ? obj.data : obj;
            const entries = Object.entries(target).slice(0, 3);
            if (entries.length === 0) return '—';
            return entries.map(([k, v]) => k + ': ' + (typeof v === 'object' ? JSON.stringify(v) : v)).join(' • ');
          } catch(e) {
            return '—';
          }
        };

        const formatDateTime = (dateStr) => {
          if (!dateStr) return '—';
          try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            const hh = String(d.getHours()).padStart(2, '0');
            const mn = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mn + ':' + ss;
          } catch(e) {
            return String(dateStr);
          }
        };

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
          sku: '',
          firmwareVersion: '',
          decoderId: '',
          appEUI: '0102030405060708',
          appKey: '0102030405060708090A0B0C0D0E0F10',
          activationType: 'OTAA',
        });

        const onDeviceSkuOrFwChange = () => {
          if (newDevice.value.firmwareVersion) {
            newDevice.value.firmwareVersion = String(newDevice.value.firmwareVersion).replace(/^[vV]/, '').trim();
          }
          const cleanSku = (newDevice.value.sku || '').trim().toUpperCase();
          const cleanFw = (newDevice.value.firmwareVersion || '').trim();
          if (cleanSku && cleanFw) {
            newDevice.value.decoderId = cleanSku + '_' + cleanFw;
          }
        };

        const formatFirmware = (fw) => {
          if (fw === undefined || fw === null || fw === '') return '—';
          return String(fw).replace(/^[vV]/, '').trim() || '—';
        };

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
            (d.sku && d.sku.toLowerCase().includes(q)) ||
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
          downlinkDeviceDropdownOpen.value = false;
        };

        // ==========================================
        // D-MODULE: HMI SCADA VIEWER STATE & METHODS
        // ==========================================
        const publishedHmiScreens = ref([]);
        const selectedHmiScreenId = ref('');
        const currentHmiScreen = ref(null);
        const hmiLoading = ref(false);
        const hmiViewerMode = ref('canvas'); // 'canvas' | 'alarms' | 'matrix'
        const hmiZoom = ref(1.0);
        const hmiCanvasViewportRef = ref(null);
        const hmiTelemetryMap = ref({}); // { 'devEUI.field': val, 'field': val }
        const hmiTrendHistory = ref([]); // array of { time, timeStr, [tag]: val }
        const trendPointsMap = ref({});
        const trendHoverState = ref({});
        const trendSeriesModal = ref(false);
        const trendTargetWidget = ref(null);
        const trendSeriesForm = ref({ devEUI: '', field: '', label: '', color: '#38bdf8', unit: '' });
        const detectedTrendFields = ref([]);
        const loadingTrendFields = ref(false);
        const hmiWidgetSwitchStates = ref({});
        const hmiRxPacketCount = ref(0);
        const hmiLastRxTime = ref(null);
        const realtimeConnected = ref(false);
        let socketClient = null;
        let sseSource = null;

        // Extract flattened key-value pairs from telemetry packet (supporting ChirpStack object, decodedData, and RF metrics)
        const extractFlattenedTelemetry = (rec) => {
          if (!rec) return { dev: '', flat: {} };
          const dev = (rec.devEUI || rec.devEui || '').trim().toUpperCase();
          const flat = {};

          // Standard RF & Network metrics
          if (rec.rssi !== undefined && rec.rssi !== null) flat['rssi'] = rec.rssi;
          if (rec.snr !== undefined && rec.snr !== null) flat['snr'] = rec.snr;
          if (rec.fCnt !== undefined && rec.fCnt !== null) flat['fCnt'] = rec.fCnt;
          if (rec.fPort !== undefined && rec.fPort !== null) flat['fPort'] = rec.fPort;
          if (rec.dr !== undefined && rec.dr !== null) flat['dr'] = rec.dr;
          if (rec.frequency !== undefined && rec.frequency !== null) flat['frequency'] = rec.frequency;
          if (rec.battery !== undefined && rec.battery !== null) flat['battery'] = rec.battery;

          // Recursively flatten decoded objects
          const flattenObject = (obj, prefix = '') => {
            if (!obj || typeof obj !== 'object') return;
            for (const [k, v] of Object.entries(obj)) {
              if (k === 'error' || k === 'errors' || k === 'warnings') continue;
              const fullKey = prefix ? prefix + '.' + k : k;
              if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                flattenObject(v, fullKey);
              } else if (v !== null && v !== undefined) {
                flat[fullKey] = v;
                // Also assign unqualified leaf name if not occupied
                if (prefix && flat[k] === undefined) {
                  flat[k] = v;
                }
                if (fullKey.startsWith('data.')) {
                  const leaf = fullKey.substring(5);
                  if (flat[leaf] === undefined) {
                    flat[leaf] = v;
                  }
                }
              }
            }
          };

          if (rec.object && typeof rec.object === 'object') {
            flattenObject(rec.object);
          }
          if (rec.decodedData && typeof rec.decodedData === 'object') {
            flattenObject(rec.decodedData);
          }

          return { dev, flat };
        };

        const updateHmiTelemetryMap = (records) => {
          if (!Array.isArray(records)) return;
          const newMap = { ...hmiTelemetryMap.value };
          
          records.forEach(rec => {
            const { dev, flat } = extractFlattenedTelemetry(rec);
            for (const [k, v] of Object.entries(flat)) {
              if (dev) {
                newMap[dev + '.' + k] = v;
              }
              newMap[k] = v;
            }
          });
          
          hmiTelemetryMap.value = newMap;

          // Build/Update Time-series Trend History Points
          if (records.length > 0) {
            const sortedAsc = [...records].reverse();
            sortedAsc.forEach(rec => {
              const { dev, flat } = extractFlattenedTelemetry(rec);
              const t = rec.timestamp ? new Date(rec.timestamp) : new Date();
              const pt = {
                timestamp: t,
                timeStr: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                ...flat
              };
              if (dev) {
                for (const [k, v] of Object.entries(flat)) {
                  pt[dev + '.' + k] = v;
                }
              }
              hmiTrendHistory.value.push(pt);
              if (hmiTrendHistory.value.length > 100) {
                hmiTrendHistory.value.shift();
              }

              // Update trendPointsMap for active trend widgets on canvas
              if (currentHmiScreen.value?.widgets) {
                currentHmiScreen.value.widgets.forEach(w => {
                  if (w.type === 'realtime-trend') {
                    if (!trendPointsMap.value[w.id]) trendPointsMap.value[w.id] = [];
                    trendPointsMap.value[w.id].push(pt);
                    if (trendPointsMap.value[w.id].length > 1000) {
                      trendPointsMap.value[w.id].shift();
                    }
                  }
                });
              }
            });
          }
        };

        const fetchPublishedHmiScreens = async () => {
          hmiLoading.value = true;
          try {
            const res = await fetch('/api/hmi/screens/published', {
              headers: authHeaders(),
              credentials: 'include',
            });
            if (res.ok) {
              const screens = await res.json();
              publishedHmiScreens.value = screens || [];
              if (publishedHmiScreens.value.length > 0) {
                if (!selectedHmiScreenId.value || !publishedHmiScreens.value.some(s => s.id === selectedHmiScreenId.value)) {
                  selectedHmiScreenId.value = publishedHmiScreens.value[0].id;
                }
                loadSelectedHmiScreen();
              } else {
                currentHmiScreen.value = null;
              }
            }
          } catch(err) {
            console.error('Failed to fetch published screens:', err);
          } finally {
            hmiLoading.value = false;
          }
        };

        const loadSelectedHmiScreen = () => {
          const found = publishedHmiScreens.value.find(s => s.id === selectedHmiScreenId.value);
          if (found) {
            currentHmiScreen.value = JSON.parse(JSON.stringify(found));
            currentHmiScreen.value.widgets?.forEach(w => {
              if (w.type === 'realtime-trend') {
                fetchTrendHistoryForWidget(w);
              }
            });
          }
        };

        const fetchHmiTelemetry = async (silent = true) => {
          if (!silent) hmiLoading.value = true;
          try {
            const res = await fetch('/lorawan/telemetry?limit=40', {
              headers: authHeaders(),
              credentials: 'include',
            });
            if (res.ok) {
              const records = await res.json();
              if (Array.isArray(records)) {
                hmiRxPacketCount.value = records.length;
                if (records.length > 0) {
                  hmiLastRxTime.value = new Date(records[0].timestamp || Date.now());
                }
                updateHmiTelemetryMap(records);
              }
            }
          } catch(e) {
            console.error('HMI Telemetry fetch error:', e);
          } finally {
            if (!silent) hmiLoading.value = false;
          }
        };

        const refreshHmiViewer = async () => {
          await Promise.all([fetchPublishedHmiScreens(), fetchHmiTelemetry(false)]);
          showToast('HMI Screen & Telemetry updated', 'success');
        };

        const fitHmiZoom = () => {
          if (!hmiCanvasViewportRef.value || !currentHmiScreen.value) {
            hmiZoom.value = 1.0;
            return;
          }
          const containerW = hmiCanvasViewportRef.value.clientWidth - 20;
          const canvasW = currentHmiScreen.value.canvasConfig?.width || 1280;
          if (containerW > 0 && canvasW > 0) {
            const scale = Math.min(1.2, Math.max(0.4, Number((containerW / canvasW).toFixed(2))));
            hmiZoom.value = scale;
          }
        };

        // Telemetry Value Resolver for Widgets
        const getWidgetTelemetryValue = (widget) => {
          if (!widget) return '--';
          const binding = widget.bindings?.value || widget.bindings?.level || widget.bindings?.status;
          let raw = undefined;

          if (binding?.devEUI && binding?.field) {
            const dev = binding.devEUI.trim().toUpperCase();
            const f = binding.field.trim();
            const key = dev + '.' + f;
            raw = hmiTelemetryMap.value[key];
            if (raw === undefined) {
              raw = hmiTelemetryMap.value[f];
            }
            if (raw === undefined && !f.startsWith('data.')) {
              raw = hmiTelemetryMap.value[dev + '.data.' + f] ?? hmiTelemetryMap.value['data.' + f];
            }
            if (raw === undefined && f.startsWith('data.')) {
              const stripped = f.substring(5);
              raw = hmiTelemetryMap.value[dev + '.' + stripped] ?? hmiTelemetryMap.value[stripped];
            }
            if (raw === undefined) {
              for (const k of Object.keys(hmiTelemetryMap.value)) {
                if (k.endsWith('.' + f) || (dev && k.startsWith(dev) && k.endsWith(f))) {
                  raw = hmiTelemetryMap.value[k];
                  break;
                }
              }
            }
          } else if (binding?.field) {
            const f = binding.field.trim();
            raw = hmiTelemetryMap.value[f];
            if (raw === undefined) {
              for (const k of Object.keys(hmiTelemetryMap.value)) {
                if (k.endsWith('.' + f)) {
                  raw = hmiTelemetryMap.value[k];
                  break;
                }
              }
            }
          }

          // Fallback defaults if no live telemetry recorded yet
          if (raw === undefined || raw === null) {
            if (widget.props?.defaultValue !== undefined) raw = widget.props.defaultValue;
            else if (widget.type === 'linear-tank') raw = 64.5;
            else if (widget.type === 'silo-vessel') raw = 82.0;
            else if (widget.type === 'dial-gauge') raw = 8.6;
            else if (widget.type === 'led-numeric') raw = 142.8;
            else if (widget.type === 'mono-box') raw = 28.4;
            else if (widget.type === 'bit-lamp') raw = 1;
            else if (widget.type === 'multi-state-lamp') raw = 1;
            else raw = 0;
          }

          let val = Number(raw);
          if (isNaN(val)) return String(raw);

          // Apply mathematical formula if defined
          if (binding?.formula && binding.formula.trim()) {
            try {
              const fn = new Function('val', 'return (' + binding.formula + ')');
              val = fn(val);
            } catch(e) {}
          }

          const dec = binding?.decimalPlaces !== undefined ? Number(binding.decimalPlaces) : 1;
          return Number(val).toFixed(dec);
        };

        const getWidgetTankHeightPercent = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          const min = widget.props?.min !== undefined ? Number(widget.props.min) : 0;
          const max = widget.props?.max !== undefined ? Number(widget.props.max) : 100;
          if (max <= min) return 0;
          const pct = ((val - min) / (max - min)) * 100;
          return Math.min(100, Math.max(0, Math.round(pct)));
        };

        const getWidgetLiquidColor = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          if (widget.states && widget.states.length > 0) {
            for (const st of widget.states) {
              if (st.condition && st.color) {
                try {
                  const fn = new Function('val', 'return (' + st.condition + ')');
                  if (fn(val)) return st.color;
                } catch(e) {}
              }
            }
          }
          return widget.props?.liquidColor || '#0284c7';
        };

        const getWidgetGaugeAngle = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          const min = widget.props?.min !== undefined ? Number(widget.props.min) : 0;
          const max = widget.props?.max !== undefined ? Number(widget.props.max) : 100;
          if (max <= min) return -135;
          const ratio = Math.min(1, Math.max(0, (val - min) / (max - min)));
          return Math.round(-135 + ratio * 270);
        };

        const isWidgetBitOn = (widget) => {
          const v = getWidgetTelemetryValue(widget);
          return v === '1' || v === 1 || String(v).toLowerCase() === 'true' || Number(v) > 0;
        };

        const getWidgetBitLampStyle = (widget) => {
          const on = isWidgetBitOn(widget);
          const colOn = widget.props?.colorOn || '#10b981';
          const colOff = widget.props?.colorOff || '#475569';
          return {
            backgroundColor: on ? colOn : colOff,
            borderColor: on ? '#ffffff' : '#334155',
            boxShadow: on ? '0 0 14px ' + colOn : 'none'
          };
        };

        const getWidgetMultiStateLabel = (widget) => {
          const v = Math.round(Number(getWidgetTelemetryValue(widget)) || 0);
          if (v === 0) return widget.props?.state0 || 'STOPPED';
          if (v === 1) return widget.props?.state1 || 'RUNNING';
          if (v === 2) return widget.props?.state2 || 'WARNING';
          return widget.props?.state3 || 'FAULT';
        };

        const getWidgetMultiStateColor = (widget) => {
          const v = Math.round(Number(getWidgetTelemetryValue(widget)) || 0);
          if (v === 0) return '#94a3b8';
          if (v === 1) return '#10b981';
          if (v === 2) return '#f59e0b';
          return '#ef4444';
        };

        const getWidgetMultiStateStyle = (widget) => {
          const c = getWidgetMultiStateColor(widget);
          return {
            backgroundColor: c + '22',
            borderColor: c,
            color: c,
            boxShadow: '0 0 10px ' + c + '44'
          };
        };

        const getWidgetMultiStateIcon = (widget) => {
          const v = Math.round(Number(getWidgetTelemetryValue(widget)) || 0);
          if (v === 0) return 'fa-solid fa-stop';
          if (v === 1) return 'fa-solid fa-play';
          if (v === 2) return 'fa-solid fa-triangle-exclamation';
          return 'fa-solid fa-radiation';
        };

        const isWidgetAlarmActive = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          if (widget.states && widget.states.length > 0) {
            for (const st of widget.states) {
              if (st.alarmText && st.condition) {
                try {
                  const fn = new Function('val', 'return (' + st.condition + ')');
                  if (fn(val)) return true;
                } catch(e) {}
              }
            }
          }
          return false;
        };

        // Active Alarms Computed across current HMI Screen
        const activeAlarmsList = computed(() => {
          if (!currentHmiScreen.value || !currentHmiScreen.value.widgets) return [];
          const alarms = [];
          for (const w of currentHmiScreen.value.widgets) {
            const val = Number(getWidgetTelemetryValue(w)) || 0;
            if (w.states && w.states.length > 0) {
              for (const st of w.states) {
                if (st.alarmText && st.condition) {
                  try {
                    const fn = new Function('val', 'return (' + st.condition + ')');
                    if (fn(val)) {
                      alarms.push({
                        widgetId: w.id,
                        title: w.props?.title || w.id,
                        text: st.alarmText,
                        condition: st.condition,
                        value: val,
                        color: st.color || '#ef4444',
                      });
                    }
                  } catch(e) {}
                }
              }
            }
          }
          return alarms;
        });

        // Downlink Actuator triggers
        const isWidgetSwitchOn = (widget) => {
          if (hmiWidgetSwitchStates.value[widget.id] !== undefined) {
            return hmiWidgetSwitchStates.value[widget.id];
          }
          return isWidgetBitOn(widget);
        };

        const triggerWidgetToggleSwitch = async (widget) => {
          const current = isWidgetSwitchOn(widget);
          const next = !current;
          const action = widget.action;

          if (action?.confirmMessage) {
            if (!confirm(action.confirmMessage)) return;
          }

          widget._sendingDownlink = true;
          hmiWidgetSwitchStates.value[widget.id] = next;

          try {
            const res = await fetch('/api/hmi/screens/downlink', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                devEUI: action?.devEUI || widget.bindings?.value?.devEUI || widget.bindings?.status?.devEUI || '',
                fPort: action?.fPort || 1,
                payloadHex: next ? (action?.payloadHex || '0101') : '0100',
                actionType: 'toggle',
                confirmed: false
              })
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
              showToast('Downlink sent: ' + (data.message || 'Actuator toggled'), 'success');
            } else {
              showToast('Downlink: ' + (data.message || 'Network Server dispatch status updated'), 'info');
            }
          } catch(err) {
            showToast('Failed to dispatch downlink command: ' + err.message, 'error');
          } finally {
            widget._sendingDownlink = false;
          }
        };

        const triggerWidgetActionButton = async (widget) => {
          const action = widget.action;
          if (action?.confirmMessage) {
            if (!confirm(action.confirmMessage)) return;
          }

          widget._sendingDownlink = true;
          try {
            const res = await fetch('/api/hmi/screens/downlink', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                devEUI: action?.devEUI || '',
                fPort: action?.fPort || 1,
                payloadHex: action?.payloadHex || '01',
                actionType: 'pushbutton',
                confirmed: false
              })
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
              showToast('Command sent: ' + (data.message || (widget.props?.label || 'Action dispatched')), 'success');
            } else {
              showToast('Downlink: ' + (data.message || 'Action executed'), 'info');
            }
          } catch(err) {
            showToast('Failed to dispatch action button command: ' + err.message, 'error');
          } finally {
            widget._sendingDownlink = false;
          }
        };

        // Realtime Trend Chart Helpers (Metabase style with multi-sensor series & timestamp X-axis)
        const getTrendSeries = (widget) => {
          if (!widget) return [];
          if (Array.isArray(widget.props?.series) && widget.props.series.length > 0) {
            return widget.props.series;
          }
          const bindDev = widget.bindings?.value?.devEUI;
          const bindField = widget.bindings?.value?.field;
          if (bindDev && bindField) {
            return [{
              id: 'ser_bind',
              devEUI: bindDev,
              field: bindField,
              label: bindField,
              color: '#38bdf8',
              unit: '',
              visible: true
            }];
          }
          if (Array.isArray(widget.props?.tags) && widget.props.tags.length > 0) {
            const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];
            return widget.props.tags.map((t, i) => ({
              id: 'ser_tag_' + i,
              devEUI: '',
              field: t,
              label: t,
              color: colors[i % colors.length],
              unit: '',
              visible: true
            }));
          }
          return [];
        };

        const getTrendYBounds = (widget) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          const series = getTrendSeries(widget).filter(s => s.visible !== false);
          const plotY0 = 16;
          const ph = 176;

          let allVals = [];
          if (points.length > 0 && series.length > 0) {
            for (const pt of points) {
              for (const s of series) {
                let v = pt[s.devEUI ? s.devEUI + '.' + s.field : s.field];
                if (v === undefined) v = pt[s.field];
                if (v === undefined) {
                  for (const k of Object.keys(pt)) {
                    if (k.endsWith('.' + s.field)) { v = pt[k]; break; }
                  }
                }
                if (v !== undefined && v !== null && !isNaN(Number(v))) {
                  allVals.push(Number(v));
                }
              }
            }
          }

          let minVal = 0;
          let maxVal = 100;
          if (allVals.length > 0) {
            minVal = Math.min(...allVals);
            maxVal = Math.max(...allVals);
            if (minVal === maxVal) {
              minVal = Math.max(0, minVal - 10);
              maxVal = maxVal + 10;
            } else {
              const pad = (maxVal - minVal) * 0.1;
              minVal = Math.floor(minVal - pad);
              maxVal = Math.ceil(maxVal + pad);
            }
          }

          const valRange = Math.max(1, maxVal - minVal);
          const ticks = [];
          const steps = 4;
          for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const y = plotY0 + ph - ratio * ph;
            const v = minVal + ratio * valRange;
            ticks.push({
              y,
              val: v,
              label: v.toFixed(v % 1 === 0 ? 0 : 1)
            });
          }

          return { minVal, maxVal, valRange, ticks, plotY0, ph };
        };

        const getTrendXTicks = (widget) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          if (points.length > 1) {
            const firstT = new Date(points[0].timestamp).getTime();
            const lastT = new Date(points[points.length - 1].timestamp).getTime();
            if (!isNaN(firstT) && !isNaN(lastT)) {
              minT = Math.min(minT, firstT);
              maxT = Math.max(maxT, lastT);
            }
          }

          const timeRange = Math.max(1000, maxT - minT);
          const plotX0 = 45;
          const pw = 440;
          const ticks = [];
          const steps = 4;

          for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const x = Math.round(plotX0 + ratio * pw);
            const tickT = new Date(minT + ratio * timeRange);
            let label = '';
            if (timeRange > 24 * 3600 * 1000) {
              label = tickT.toLocaleDateString([], { month: 'numeric', day: 'numeric' }) + ' ' +
                      tickT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
              label = tickT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            ticks.push({ x, label });
          }

          return ticks;
        };

        const getTrendSeriesPath = (widget, series) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          if (!points || points.length === 0) return '';

          const { minVal, valRange, plotY0, ph } = getTrendYBounds(widget);
          const plotX0 = 45;
          const pw = 440;

          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          const firstT = new Date(points[0].timestamp).getTime();
          const lastT = new Date(points[points.length - 1].timestamp).getTime();
          if (!isNaN(firstT) && !isNaN(lastT)) {
            minT = Math.min(minT, firstT);
            maxT = Math.max(maxT, lastT);
          }
          const timeRange = Math.max(1000, maxT - minT);

          const seriesKey = series.devEUI ? series.devEUI + '.' + series.field : series.field;
          const validPoints = [];

          for (const pt of points) {
            let v = pt[seriesKey];
            if (v === undefined) v = pt[series.field];
            if (v === undefined) {
              for (const k of Object.keys(pt)) {
                if (k.endsWith('.' + series.field)) { v = pt[k]; break; }
              }
            }
            if (v !== undefined && v !== null && !isNaN(Number(v))) {
              const t = new Date(pt.timestamp).getTime();
              const x = plotX0 + Math.max(0, Math.min(1, (t - minT) / timeRange)) * pw;
              const ratio = (Number(v) - minVal) / valRange;
              const y = plotY0 + ph - Math.max(0, Math.min(1, ratio)) * ph;
              validPoints.push({ x, y, val: Number(v), t });
            }
          }

          if (validPoints.length === 0) return '';
          if (validPoints.length === 1) {
            return 'M ' + (validPoints[0].x - 5).toFixed(1) + ' ' + validPoints[0].y.toFixed(1) + ' L ' + (validPoints[0].x + 5).toFixed(1) + ' ' + validPoints[0].y.toFixed(1);
          }

          let d = 'M ' + validPoints[0].x.toFixed(1) + ' ' + validPoints[0].y.toFixed(1);
          for (let i = 1; i < validPoints.length; i++) {
            d += ' L ' + validPoints[i].x.toFixed(1) + ' ' + validPoints[i].y.toFixed(1);
          }
          return d;
        };

        const getTrendSeriesAreaPath = (widget, series) => {
          const lineD = getTrendSeriesPath(widget, series);
          if (!lineD || !lineD.startsWith('M')) return '';
          const { plotY0, ph } = getTrendYBounds(widget);
          const bottomY = (plotY0 + ph).toFixed(1);

          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          if (!points || points.length === 0) return '';

          const plotX0 = 45;
          const pw = 440;
          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          const firstT = new Date(points[0].timestamp).getTime();
          const lastT = new Date(points[points.length - 1].timestamp).getTime();
          if (!isNaN(firstT) && !isNaN(lastT)) {
            minT = Math.min(minT, firstT);
            maxT = Math.max(maxT, lastT);
          }
          const timeRange = Math.max(1000, maxT - minT);

          const seriesKey = series.devEUI ? series.devEUI + '.' + series.field : series.field;
          const validX = [];
          for (const pt of points) {
            let v = pt[seriesKey];
            if (v === undefined) v = pt[series.field];
            if (v === undefined) {
              for (const k of Object.keys(pt)) {
                if (k.endsWith('.' + series.field)) { v = pt[k]; break; }
              }
            }
            if (v !== undefined && v !== null && !isNaN(Number(v))) {
              const t = new Date(pt.timestamp).getTime();
              const x = plotX0 + Math.max(0, Math.min(1, (t - minT) / timeRange)) * pw;
              validX.push(x);
            }
          }
          if (validX.length === 0) return '';
          const firstX = validX[0].toFixed(1);
          const lastX = validX[validX.length - 1].toFixed(1);

          return lineD + ' L ' + lastX + ' ' + bottomY + ' L ' + firstX + ' ' + bottomY + ' Z';
        };

        const getTrendLatestPoint = (widget, series) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          if (!points || points.length === 0) return null;

          const { minVal, valRange, plotY0, ph } = getTrendYBounds(widget);
          const plotX0 = 45;
          const pw = 440;

          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          const firstT = new Date(points[0].timestamp).getTime();
          const lastT = new Date(points[points.length - 1].timestamp).getTime();
          if (!isNaN(firstT) && !isNaN(lastT)) {
            minT = Math.min(minT, firstT);
            maxT = Math.max(maxT, lastT);
          }
          const timeRange = Math.max(1000, maxT - minT);

          const seriesKey = series.devEUI ? series.devEUI + '.' + series.field : series.field;
          for (let i = points.length - 1; i >= 0; i--) {
            const pt = points[i];
            let v = pt[seriesKey];
            if (v === undefined) v = pt[series.field];
            if (v === undefined) {
              for (const k of Object.keys(pt)) {
                if (k.endsWith('.' + series.field)) { v = pt[k]; break; }
              }
            }
            if (v !== undefined && v !== null && !isNaN(Number(v))) {
              const t = new Date(pt.timestamp).getTime();
              const x = plotX0 + Math.max(0, Math.min(1, (t - minT) / timeRange)) * pw;
              const ratio = (Number(v) - minVal) / valRange;
              const y = plotY0 + ph - Math.max(0, Math.min(1, ratio)) * ph;
              return { x, y, value: Number(v) };
            }
          }
          return null;
        };

        const getTrendSeriesLatestVal = (widget, series) => {
          const k1 = series.devEUI ? series.devEUI + '.' + series.field : series.field;
          if (hmiTelemetryMap.value[k1] !== undefined) {
            const v = hmiTelemetryMap.value[k1];
            return typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(2)) : v;
          }
          if (hmiTelemetryMap.value[series.field] !== undefined) {
            const v = hmiTelemetryMap.value[series.field];
            return typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(2)) : v;
          }
          const latestPt = getTrendLatestPoint(widget, series);
          if (latestPt && latestPt.value !== undefined) {
            return latestPt.value % 1 === 0 ? latestPt.value : latestPt.value.toFixed(2);
          }
          return '--';
        };

        const handleTrendMouseMove = (event, widget) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          if (points.length === 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const pixelX = event.clientX - rect.left;
          const normX = Math.max(0, Math.min(1, pixelX / rect.width));
          const svgX = normX * 500;

          if (svgX < 45 || svgX > 485) {
            trendHoverState.value[widget.id] = { visible: false };
            return;
          }

          const plotX0 = 45;
          const pw = 440;
          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          const firstT = new Date(points[0].timestamp).getTime();
          const lastT = new Date(points[points.length - 1].timestamp).getTime();
          if (!isNaN(firstT) && !isNaN(lastT)) {
            minT = Math.min(minT, firstT);
            maxT = Math.max(maxT, lastT);
          }
          const timeRange = Math.max(1000, maxT - minT);

          const hoverT = minT + ((svgX - plotX0) / pw) * timeRange;

          let closestPt = points[0];
          let minDiff = Infinity;
          for (const pt of points) {
            const diff = Math.abs(new Date(pt.timestamp).getTime() - hoverT);
            if (diff < minDiff) {
              minDiff = diff;
              closestPt = pt;
            }
          }

          if (!closestPt) return;

          const series = getTrendSeries(widget).filter(s => s.visible !== false);
          const values = series.map(s => {
            let v = closestPt[s.devEUI ? s.devEUI + '.' + s.field : s.field];
            if (v === undefined) v = closestPt[s.field];
            if (v === undefined) {
              for (const k of Object.keys(closestPt)) {
                if (k.endsWith('.' + s.field)) { v = closestPt[k]; break; }
              }
            }
            return {
              label: s.label || s.field,
              color: s.color || '#38bdf8',
              value: v !== undefined ? (typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(2)) : v) : '--',
              unit: s.unit || ''
            };
          });

          const ptT = new Date(closestPt.timestamp);
          const timeStr = ptT.toLocaleDateString([], { month: '2-digit', day: '2-digit' }) + ' ' +
                          ptT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          trendHoverState.value[widget.id] = {
            visible: true,
            x: svgX,
            pixelX,
            timeStr,
            values
          };
        };

        const handleTrendMouseLeave = (widget) => {
          trendHoverState.value[widget.id] = { visible: false };
        };

        const setTrendTimeRange = (widget, range) => {
          if (!widget) return;
          if (!widget.props) widget.props = {};
          widget.props.timeRange = range;
          fetchTrendHistoryForWidget(widget);
        };

        const fetchTrendHistoryForWidget = async (widget) => {
          if (!widget || widget.type !== 'realtime-trend') return;
          const series = getTrendSeries(widget);
          const devEUIs = [...new Set(series.map(s => s.devEUI).filter(Boolean))];

          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          const fromIso = new Date(now - durationMs).toISOString();

          let url = '/api/hmi/screens/telemetry/trend?from=' + encodeURIComponent(fromIso) + '&limit=500';
          if (devEUIs.length > 0) {
            url += '&devEUIs=' + encodeURIComponent(devEUIs.join(','));
          }

          try {
            const res = await fetch(url, { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              const records = await res.json();
              if (Array.isArray(records)) {
                const points = records.map(rec => {
                  const { dev, flat } = extractFlattenedTelemetry(rec);
                  const t = rec.timestamp ? new Date(rec.timestamp) : new Date();
                  const pt = {
                    timestamp: t,
                    timeStr: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    devEUI: dev,
                    ...flat
                  };
                  if (dev) {
                    for (const [k, v] of Object.entries(flat)) {
                      pt[dev + '.' + k] = v;
                    }
                  }
                  return pt;
                });
                trendPointsMap.value[widget.id] = points;
              }
            }
          } catch(err) {
            console.error('Failed to fetch trend history for widget:', err);
          }
        };

        const openAddTrendSeriesModal = (widget) => {
          trendTargetWidget.value = widget;
          const firstDev = (devicesList.value && devicesList.value.length > 0) ? devicesList.value[0].devEUI : '';
          const palette = ['#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#06b6d4', '#eab308'];
          const curSeriesCount = getTrendSeries(widget).length;
          const pickColor = palette[curSeriesCount % palette.length];

          trendSeriesForm.value = {
            devEUI: firstDev,
            field: '',
            label: '',
            color: pickColor,
            unit: '',
          };
          detectedTrendFields.value = [];
          if (firstDev) {
            fetchDetectedTrendFields(firstDev);
          }
          trendSeriesModal.value = true;
        };

        const fetchDetectedTrendFields = async (devEUI) => {
          if (!devEUI) return;
          loadingTrendFields.value = true;
          try {
            const res = await fetch('/api/hmi/screens/devices/' + encodeURIComponent(devEUI) + '/telemetry-fields', {
              headers: authHeaders(),
              credentials: 'include'
            });
            if (res.ok) {
              const data = await res.json();
              detectedTrendFields.value = data.fields || [];
            }
          } catch(err) {
            console.error('Failed to scan fields for trend:', err);
          } finally {
            loadingTrendFields.value = false;
          }
        };

        const selectTrendTagPill = (field) => {
          trendSeriesForm.value.field = field.key;
          if (!trendSeriesForm.value.label) {
            const devObj = devicesList.value.find(d => d.devEUI === trendSeriesForm.value.devEUI);
            const devName = devObj ? (devObj.name || devObj.devEUI.substring(devObj.devEUI.length - 4)) : '';
            trendSeriesForm.value.label = devName ? (devName + ' - ' + field.key) : field.key;
          }
          if (field.unit) {
            trendSeriesForm.value.unit = field.unit;
          }
        };

        const saveTrendSeries = () => {
          const widget = trendTargetWidget.value;
          if (!widget) return;
          if (!trendSeriesForm.value.field) {
            showToast('Vui lòng chọn hoặc nhập mã tag telemetry', 'warning');
            return;
          }
          if (!widget.props) widget.props = {};
          if (!Array.isArray(widget.props.series)) {
            widget.props.series = [];
          }
          const id = 'ser_' + Date.now().toString(36);
          const newSeries = {
            id,
            devEUI: trendSeriesForm.value.devEUI || '',
            field: trendSeriesForm.value.field.trim(),
            label: trendSeriesForm.value.label.trim() || trendSeriesForm.value.field.trim(),
            color: trendSeriesForm.value.color || '#38bdf8',
            unit: trendSeriesForm.value.unit || '',
            visible: true,
          };
          widget.props.series.push(newSeries);
          trendSeriesModal.value = false;
          fetchTrendHistoryForWidget(widget);
          showToast('Đã thêm cảm biến ' + newSeries.label + ' vào đồ thị', 'success');
        };

        const removeTrendSeries = (widget, seriesId) => {
          if (!widget || !Array.isArray(widget.props?.series)) return;
          widget.props.series = widget.props.series.filter(s => s.id !== seriesId);
          fetchTrendHistoryForWidget(widget);
        };

        const toggleTrendSeriesVisible = (widget, seriesId) => {
          const series = getTrendSeries(widget);
          const s = series.find(x => x.id === seriesId);
          if (s) {
            s.visible = s.visible === false ? true : false;
          }
        };

        const getWidgetTrendLegend = (widget) => {
          const tags = widget.props?.tags || ['water_level', 'pressure', 'flow_rate'];
          const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];
          return tags.map((t, idx) => {
            let val = hmiTelemetryMap.value[t];
            if (val === undefined) {
              for (const k of Object.keys(hmiTelemetryMap.value)) {
                if (k.endsWith('.' + t)) { val = hmiTelemetryMap.value[k]; break; }
              }
            }
            return {
              name: t,
              color: colors[idx % colors.length],
              value: val !== undefined ? val : '--'
            };
          });
        };

        const getWidgetTrendPath = (widget, tagIndex) => {
          return getTrendSeriesPath(widget, { field: (widget.props?.tags || [])[tagIndex] || 'val' });
        };

        // Realtime WebSocket & SSE Client
        const initRealtimeConnection = () => {
          if (socketClient || sseSource) return;

          // Try Socket.IO if available
          if (typeof io !== 'undefined') {
            try {
              socketClient = io('/', {
                path: '/socket.io',
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 20,
                reconnectionDelay: 2000,
              });

              socketClient.on('connect', () => {
                realtimeConnected.value = true;
                socketClient.emit('subscribe:telemetry');
                socketClient.emit('subscribe:hmi');
              });

              socketClient.on('disconnect', () => {
                realtimeConnected.value = false;
              });

              socketClient.on('telemetry:uplink', (pkt) => {
                hmiRxPacketCount.value++;
                hmiLastRxTime.value = new Date();
                
                // Prepend to telemetry table list if loaded
                if (telemetryLoaded.value) {
                  telemetryList.value.unshift(pkt);
                }

                // Update HMI tag resolution map
                updateHmiTelemetryMap([pkt]);
              });

              socketClient.on('downlink:status', (event) => {
                if (event) {
                  showToast('Downlink [' + (event.status || 'STATUS') + ']: ' + (event.message || ''), event.success ? 'success' : 'info');
                  if (event.downlinkLog) {
                    downlinkHistory.value.unshift(event.downlinkLog);
                  } else if (activeFeature.value && (activeFeature.value.id === 'lorawan-downlink' || activeFeature.value.id === 'downlink-actuator')) {
                    fetchDownlinkHistory();
                  }
                  if (downlinkForm.value.devEUI) {
                    fetchDeviceQueue(downlinkForm.value.devEUI);
                  }
                }
              });

              return;
            } catch(e) {
              console.warn('Socket.IO initialization failed, falling back to SSE:', e);
            }
          }

          // Fallback to Server-Sent Events (SSE)
          if (typeof EventSource !== 'undefined') {
            try {
              sseSource = new EventSource('/api/realtime/stream');
              sseSource.onopen = () => {
                realtimeConnected.value = true;
              };
              sseSource.onerror = () => {
                realtimeConnected.value = false;
              };
              sseSource.onmessage = (e) => {
                try {
                  const ev = JSON.parse(e.data);
                  if (ev.type === 'telemetry') {
                    hmiRxPacketCount.value++;
                    hmiLastRxTime.value = new Date();
                    if (telemetryLoaded.value) {
                      telemetryList.value.unshift(ev.data);
                    }
                    updateHmiTelemetryMap([ev.data]);
                  } else if (ev.type === 'downlink') {
                    showToast('Downlink [' + (ev.data?.status || 'STATUS') + ']: ' + (ev.data?.message || ''), ev.data?.success ? 'success' : 'info');
                    if (ev.data?.downlinkLog) {
                      downlinkHistory.value.unshift(ev.data.downlinkLog);
                    } else if (activeFeature.value && (activeFeature.value.id === 'lorawan-downlink' || activeFeature.value.id === 'downlink-actuator')) {
                      fetchDownlinkHistory();
                    }
                    if (downlinkForm.value.devEUI) {
                      fetchDeviceQueue(downlinkForm.value.devEUI);
                    }
                  }
                } catch(err) {}
              };
            } catch(err) {
              console.error('SSE initialization error:', err);
            }
          }
        };

        const returnToHome = () => {
          stopAutoSync();
          stopDeviceQueuePolling();
          activeFeature.value = null;
          telemetryLoaded.value = false;
          telemetryList.value = [];
          selectedTelemetryDeviceEUI.value = '';
          window.location.hash = '';
        };

        const openFeature = (feature) => {
          stopAutoSync();
          stopDeviceQueuePolling();
          activeFeature.value = feature;
          window.location.hash = feature.id;
          if (feature.id === 'device-manager' || feature.id === 'device-fleet') {
            fetchDevices();
            fetchNetworkServers();
          } else if (feature.id === 'telemetry-decoder' || feature.id === 'live-telemetry') {
            // Reset state — user must select device and click SHOW
            telemetryLoaded.value = false;
            telemetryList.value = [];
            selectedTelemetryDeviceEUI.value = '';
            stopAutoSync();
            fetchDevices();
          } else if (feature.id === 'hmi-scada-viewer') {
            fetchPublishedHmiScreens();
            fetchHmiTelemetry();
            initRealtimeConnection();
          } else if (feature.id === 'lorawan-downlink' || feature.id === 'downlink-actuator') {
            fetchNetworkServers();
            fetchDevices();
            fetchDownlinkHistory();
            if (downlinkForm.value.devEUI) {
              fetchDeviceQueue(downlinkForm.value.devEUI);
            }
            startDeviceQueuePolling();
            initRealtimeConnection();
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
                  } else if (found.id === 'telemetry-decoder' || found.id === 'live-telemetry') {
                    telemetryLoaded.value = false;
                    telemetryList.value = [];
                    selectedTelemetryDeviceEUI.value = '';
                    stopAutoSync();
                    fetchDevices();
                  } else if (found.id === 'hmi-scada-viewer') {
                    fetchPublishedHmiScreens();
                    fetchHmiTelemetry();
                    initRealtimeConnection();
                  } else if (found.id === 'lorawan-downlink' || found.id === 'downlink-actuator') {
                    fetchNetworkServers();
                    fetchDevices();
                    fetchDownlinkHistory();
                    if (downlinkForm.value.devEUI) {
                      fetchDeviceQueue(downlinkForm.value.devEUI);
                    }
                    startDeviceQueuePolling();
                    initRealtimeConnection();
                  }
                }
              }
            }
          } catch(e) {
            console.error(e);
          }
        };

        const fetchLiveTelemetry = async (silent = false) => {
          if (!silent) loadingTelemetry.value = true;
          try {
            const url = selectedTelemetryDeviceEUI.value
              ? '/lorawan/telemetry?devEUI=' + encodeURIComponent(selectedTelemetryDeviceEUI.value) + '&limit=0'
              : '/lorawan/telemetry?limit=0';
            const res = await fetch(url, { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              const newItems = Array.isArray(data) ? data : [];

              // Smart diffing during auto-sync: skip re-assigning if packets are identical
              const cur = telemetryList.value;
              if (silent && cur && cur.length === newItems.length && cur.length > 0) {
                const curFirst = cur[0]?.id || cur[0]?.timestamp || cur[0]?.receivedAt;
                const newFirst = newItems[0]?.id || newItems[0]?.timestamp || newItems[0]?.receivedAt;
                const curLast = cur[cur.length - 1]?.id || cur[cur.length - 1]?.timestamp;
                const newLast = newItems[newItems.length - 1]?.id || newItems[newItems.length - 1]?.timestamp;
                if (curFirst === newFirst && curLast === newLast) {
                  lastSyncTime.value = new Date();
                  return;
                }
              }

              telemetryList.value = newItems;
              lastSyncTime.value = new Date();
              nextTick(updateScrollDimensions);
            }
          } catch(e) {
          } finally {
            if (!silent) loadingTelemetry.value = false;
          }
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
            sku: '',
            firmwareVersion: '',
            decoderId: '',
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
            sku: d.sku || '',
            firmwareVersion: formatFirmware(d.firmwareVersion) === '—' ? '' : formatFirmware(d.firmwareVersion),
            decoderId: d.decoderId || '',
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
                sku: newDevice.value.sku ? newDevice.value.sku.trim().toUpperCase() : undefined,
                firmwareVersion: newDevice.value.firmwareVersion ? String(newDevice.value.firmwareVersion).replace(/^[vV]/, '').trim() : undefined,
                decoderId: newDevice.value.decoderId || undefined,
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

        // ==================== DOWNLINK ACTUATOR STATE & METHODS (D-MODULE) ====================
        const downlinkForm = ref({
          networkServerId: '',
          devEUI: '',
          fPort: 1,
          payloadHex: '',
          confirmed: false,
          flushQueue: false,
        });
        const downlinkDeviceSearch = ref('');
        const downlinkDeviceDropdownOpen = ref(false);
        const downlinkHistory = ref([]);
        const loadingDownlinkHistory = ref(false);
        const sendingDownlink = ref(false);
        const downlinkHistoryFilterDevEUI = ref('');
        const deviceQueue = ref([]);
        const loadingDeviceQueue = ref(false);
        const flushingQueue = ref(false);
        const deviceQueueServerName = ref('');
        let deviceQueueTimer = null;

        const downlinkConfirmModal = ref({
          show: false,
          targetDevice: null,
          targetServer: null,
          devEUI: '',
          fPort: 1,
          payloadHex: '',
          confirmed: false,
          flushQueue: false,
        });

        const flushConfirmModal = ref({
          show: false,
          devEUI: '',
          targetDevice: null,
          targetServer: null,
        });

        const filteredDownlinkDevices = computed(() => {
          const q = (downlinkDeviceSearch.value || '').trim().toLowerCase();
          const selectedLabel = selectedDownlinkDevice.value
            ? (selectedDownlinkDevice.value.name ? (selectedDownlinkDevice.value.name + ' - ' + selectedDownlinkDevice.value.devEUI) : selectedDownlinkDevice.value.devEUI).toLowerCase()
            : '';
          if (!q || q === selectedLabel) {
            return devicesList.value;
          }
          return devicesList.value.filter(d => {
            const label = (d.name ? d.name + ' - ' + d.devEUI : d.devEUI).toLowerCase();
            const eui = (d.devEUI || '').toLowerCase();
            const name = (d.name || '').toLowerCase();
            return label.includes(q) || eui.includes(q) || name.includes(q);
          });
        });

        const onDownlinkSearchFocus = (event) => {
          downlinkDeviceDropdownOpen.value = true;
          if (event && event.target && typeof event.target.select === 'function') {
            event.target.select();
          }
        };

        const toggleDownlinkDropdown = () => {
          downlinkDeviceDropdownOpen.value = !downlinkDeviceDropdownOpen.value;
        };

        const calculatedHexBytes = computed(() => {
          const clean = (downlinkForm.value.payloadHex || '').replace(/[^0-9a-fA-F]/g, '');
          return Math.ceil(clean.length / 2);
        });

        const calculatedConfirmBytes = computed(() => {
          const clean = (downlinkConfirmModal.value.payloadHex || '').replace(/[^0-9a-fA-F]/g, '');
          return Math.ceil(clean.length / 2);
        });

        const selectedDownlinkDevice = computed(() => {
          if (!downlinkForm.value.devEUI) return null;
          return devicesList.value.find(d => d.devEUI && d.devEUI.toUpperCase() === downlinkForm.value.devEUI.toUpperCase()) || null;
        });

        const selectedDownlinkServer = computed(() => {
          const dev = selectedDownlinkDevice.value;
          if (dev && dev.networkServerId) {
            return networkServersList.value.find(s => s.id === dev.networkServerId) || null;
          }
          if (downlinkForm.value.networkServerId) {
            return networkServersList.value.find(s => s.id === downlinkForm.value.networkServerId) || null;
          }
          return networkServersList.value.find(s => s.isDefault) || (networkServersList.value.length > 0 ? networkServersList.value[0] : null);
        });

        const selectDownlinkDevice = (d) => {
          downlinkForm.value.devEUI = d.devEUI;
          downlinkDeviceSearch.value = d.name ? d.name + ' - ' + d.devEUI : d.devEUI;
          if (d.networkServerId) {
            downlinkForm.value.networkServerId = d.networkServerId;
          }
          downlinkDeviceDropdownOpen.value = false;
          onDownlinkDeviceSelect();
        };

        const clearSelectedDownlinkDevice = () => {
          downlinkForm.value.devEUI = '';
          downlinkDeviceSearch.value = '';
          downlinkDeviceDropdownOpen.value = false;
          deviceQueue.value = [];
          deviceQueueServerName.value = '';
        };

        const onDownlinkDeviceSelect = () => {
          const dev = selectedDownlinkDevice.value;
          if (dev) {
            if (dev.networkServerId) {
              downlinkForm.value.networkServerId = dev.networkServerId;
            }
            downlinkHistoryFilterDevEUI.value = dev.devEUI;
            fetchDownlinkHistory(dev.devEUI);
            fetchDeviceQueue(dev.devEUI);
          } else {
            deviceQueue.value = [];
            deviceQueueServerName.value = '';
          }
        };

        const fetchDeviceQueue = async (devEUI = '', silent = false) => {
          const targetEUI = devEUI || downlinkForm.value.devEUI || '';
          if (!targetEUI) {
            deviceQueue.value = [];
            deviceQueueServerName.value = '';
            return;
          }
          if (!silent && deviceQueue.value.length === 0) {
            loadingDeviceQueue.value = true;
          }
          try {
            const url = '/api/network-servers/queue?devEUI=' + encodeURIComponent(targetEUI);
            const res = await fetch(url, { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              const newItems = Array.isArray(data.items) ? data.items : [];
              const curItems = deviceQueue.value;
              let hasChanged = curItems.length !== newItems.length;
              if (!hasChanged) {
                for (let i = 0; i < curItems.length; i++) {
                  if (curItems[i].id !== newItems[i].id || curItems[i].payloadHex !== newItems[i].payloadHex || curItems[i].isPending !== newItems[i].isPending) {
                    hasChanged = true;
                    break;
                  }
                }
              }
              if (hasChanged) {
                deviceQueue.value = newItems;
              }
              deviceQueueServerName.value = data.serverName || data.serverType || '';
            }
          } catch(e) {
            console.error('Error fetching device queue:', e);
          } finally {
            if (!silent) {
              loadingDeviceQueue.value = false;
            }
          }
        };

        const startDeviceQueuePolling = () => {
          stopDeviceQueuePolling();
          deviceQueueTimer = setInterval(() => {
            if (activeFeature.value && (activeFeature.value.id === 'lorawan-downlink' || activeFeature.value.id === 'downlink-actuator') && downlinkForm.value.devEUI) {
              fetchDeviceQueue(downlinkForm.value.devEUI, true);
            }
          }, 6000);
        };

        const stopDeviceQueuePolling = () => {
          if (deviceQueueTimer) {
            clearInterval(deviceQueueTimer);
            deviceQueueTimer = null;
          }
        };

        const fetchDownlinkHistory = async (devEUI = '') => {
          loadingDownlinkHistory.value = true;
          try {
            const filter = devEUI || downlinkHistoryFilterDevEUI.value || '';
            const url = filter
              ? '/api/network-servers/downlinks/history?devEUI=' + encodeURIComponent(filter) + '&limit=50'
              : '/api/network-servers/downlinks/history?limit=50';
            const res = await fetch(url, { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              downlinkHistory.value = await res.json();
            }
          } catch(e) {
            console.error('Error fetching downlink history:', e);
          } finally {
            loadingDownlinkHistory.value = false;
          }
        };

        const openDownlinkConfirm = () => {
          if (!downlinkForm.value.devEUI) {
            showToast('Please select a target device', 'error');
            return;
          }
          const cleanHex = (downlinkForm.value.payloadHex || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
          if (!cleanHex) {
            showToast('Please enter a valid Hex payload', 'error');
            return;
          }
          downlinkForm.value.payloadHex = cleanHex;

          downlinkConfirmModal.value = {
            show: true,
            targetDevice: selectedDownlinkDevice.value,
            targetServer: selectedDownlinkServer.value,
            devEUI: downlinkForm.value.devEUI,
            fPort: downlinkForm.value.fPort || 1,
            payloadHex: cleanHex,
            confirmed: Boolean(downlinkForm.value.confirmed),
            flushQueue: Boolean(downlinkForm.value.flushQueue),
          };
        };

        const executeConfirmedDownlink = async () => {
          sendingDownlink.value = true;
          try {
            const payload = {
              devEUI: downlinkConfirmModal.value.devEUI,
              fPort: downlinkConfirmModal.value.fPort,
              payloadHex: downlinkConfirmModal.value.payloadHex,
              confirmed: downlinkConfirmModal.value.confirmed,
              flushQueue: downlinkConfirmModal.value.flushQueue,
              networkServerId: downlinkForm.value.networkServerId || undefined,
            };
            const res = await fetch('/api/network-servers/downlink', {
              method: 'POST',
              headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(payload),
            });
            const result = await res.json();
            downlinkConfirmModal.value.show = false;
            if (res.ok && result.success) {
              showToast('Downlink queued successfully', 'success');
              fetchDownlinkHistory(downlinkForm.value.devEUI);
              fetchDeviceQueue(downlinkForm.value.devEUI);
            } else {
              showToast('Downlink failed: ' + (result.message || 'Transmission error'), 'error');
              fetchDownlinkHistory(downlinkForm.value.devEUI);
              fetchDeviceQueue(downlinkForm.value.devEUI);
            }
          } catch(e) {
            showToast('Connection error: ' + e.message, 'error');
          } finally {
            sendingDownlink.value = false;
          }
        };

        const openFlushConfirm = () => {
          if (!downlinkForm.value.devEUI) {
            showToast('Please select a device to flush queue', 'error');
            return;
          }
          flushConfirmModal.value = {
            show: true,
            devEUI: downlinkForm.value.devEUI,
            targetDevice: selectedDownlinkDevice.value,
            targetServer: selectedDownlinkServer.value,
          };
        };

        const executeConfirmedFlush = async () => {
          const targetEUI = flushConfirmModal.value.devEUI || downlinkForm.value.devEUI;
          const targetNsId = flushConfirmModal.value.targetServer?.id || downlinkForm.value.networkServerId || undefined;
          flushingQueue.value = true;
          try {
            const res = await fetch('/api/network-servers/flush-queue', {
              method: 'POST',
              headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                devEUI: targetEUI,
                networkServerId: targetNsId,
              }),
            });
            const result = await res.json();
            flushConfirmModal.value.show = false;
            if (res.ok && result.success) {
              showToast('Downlink queue flushed successfully', 'success');
              fetchDownlinkHistory(targetEUI);
              fetchDeviceQueue(targetEUI);
            } else {
              showToast('Failed to flush queue: ' + (result.message || 'Error'), 'error');
            }
          } catch(e) {
            showToast('Connection error: ' + e.message, 'error');
          } finally {
            flushingQueue.value = false;
          }
        };

        const flushQueueExplicitly = openFlushConfirm;

        const resendDownlink = (item) => {
          downlinkForm.value.devEUI = item.devEUI;
          const matched = devicesList.value.find(d => d.devEUI && d.devEUI.toUpperCase() === item.devEUI.toUpperCase());
          downlinkDeviceSearch.value = matched ? (matched.name ? matched.name + ' - ' + matched.devEUI : matched.devEUI) : item.devEUI;
          downlinkForm.value.fPort = item.fPort || 1;
          downlinkForm.value.payloadHex = item.payloadHex;
          downlinkForm.value.confirmed = Boolean(item.confirmed);
          downlinkForm.value.flushQueue = Boolean(item.flushQueue);
          if (item.networkServerId) {
            downlinkForm.value.networkServerId = item.networkServerId;
          }
          showToast('Loaded downlink parameters for ' + item.devEUI, 'info');
          fetchDeviceQueue(item.devEUI);
        };

        const copyText = (txt) => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(txt);
            showToast('Hex payload copied to clipboard', 'success');
          }
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
          initRealtimeConnection();
          // Close inspect modal on ESC key
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeTelemetryPacket.value) {
              closeInspectModal();
            }
          });
          // Close dropdowns when clicking outside
          document.addEventListener('click', (e) => {
            if (columnFilterOpen.value && !e.target.closest('.column-filter-container')) {
              columnFilterOpen.value = false;
            }
            if (exportDropdownOpen.value && !e.target.closest('.export-dropdown-container')) {
              exportDropdownOpen.value = false;
            }
          });
          // Setup observer and resize listeners for scrollbar synchronization
          if (typeof window !== 'undefined') {
            window.addEventListener('resize', updateScrollDimensions);
            if (window.ResizeObserver) {
              const ro = new ResizeObserver(() => {
                updateScrollDimensions();
              });
              if (tableScrollRef.value) ro.observe(tableScrollRef.value);
              if (telemetryTableRef.value) ro.observe(telemetryTableRef.value);
            }
          }
        });

        watch([paginatedDashboardMatrixRows, hiddenSensorColumns, hiddenMetadataColumns, telemetryLoaded], () => {
          nextTick(updateScrollDimensions);
        });

        window.addEventListener('pageshow', (event) => {
          // Only re-init when restored from browser back-forward cache (bfcache)
          if (event.persisted) {
            initDashboard();
          }
        });

        return {
          currentUser,
          accessibleFeatures,
          activeFeature,
          userMenuOpen,
          userInitials,
          navigateTo,
          isSuperAdmin,
          standaloneOpsUrl,
          telemetryList,
          selectedTelemetryDeviceEUI,
          selectedTelemetryDevice,
          telemetryLoaded,
          showTelemetry,
          clearTelemetry,
          deleteTelemetry,
          loadingTelemetry,
          activeTelemetryPacket,
          telemetryViewMode,
          filteredTelemetryList,
          activeDecodedFields,
          dashboardSensorColumns,
          dashboardMatrixRows,
          filteredDashboardMatrixRows,
          sortedDashboardMatrixRows,
          telemetryPage,
          telemetryPageSize,
          totalTelemetryPages,
          paginatedDashboardMatrixRows,
          paginationRangeText,
          visiblePageNumbers,
          setTelemetryPage,
          nextTelemetryPage,
          prevTelemetryPage,
          telemetryTimeFilter,
          telemetryRangeStart,
          telemetryRangeEnd,
          telemetrySearchQuery,
          telemetrySortKey,
          telemetrySortOrder,
          autoSyncEnabled,
          lastSyncTime,
          toggleTelemetrySort,
          resetTelemetryFilters,
          isTelemetryFilterActive,
          startAutoSync,
          stopAutoSync,
          toggleAutoSync,
          onSelectTelemetryDevice,
          inspectTelemetryPacket,
          closeInspectModal,
          exportDropdownOpen,
          exportTelemetry,
          columnFilterOpen,
          metadataColumnsList,
          hiddenMetadataColumns,
          toggleMetadataColumn,
          isMetadataColumnVisible,
          totalHiddenColumnsCount,
          showAllColumns,
          resetDefaultColumns,
          hideAllSensorColumns,
          hiddenSensorColumns,
          toggleSensorColumn,
          isSensorColumnVisible,
          topScrollRef,
          tableScrollRef,
          telemetryTableRef,
          tableScrollWidth,
          tableHasHorizontalOverflow,
          handleTopScroll,
          handleTableScroll,
          formatDecodedSummary,
          formatDateTime,
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
          formatTime,
          // HMI SCADA Viewer exports
          publishedHmiScreens,
          selectedHmiScreenId,
          currentHmiScreen,
          hmiLoading,
          hmiViewerMode,
          hmiZoom,
          hmiCanvasViewportRef,
          hmiTelemetryMap,
          hmiTrendHistory,
          hmiWidgetSwitchStates,
          hmiRxPacketCount,
          hmiLastRxTime,
          realtimeConnected,
          fetchPublishedHmiScreens,
          loadSelectedHmiScreen,
          fetchHmiTelemetry,
          refreshHmiViewer,
          fitHmiZoom,
          getWidgetTelemetryValue,
          getWidgetTankHeightPercent,
          getWidgetLiquidColor,
          getWidgetGaugeAngle,
          isWidgetBitOn,
          getWidgetBitLampStyle,
          getWidgetMultiStateLabel,
          getWidgetMultiStateColor,
          getWidgetMultiStateStyle,
          getWidgetMultiStateIcon,
          isWidgetAlarmActive,
          activeAlarmsList,
          isWidgetSwitchOn,
          triggerWidgetToggleSwitch,
          triggerWidgetActionButton,
          trendPointsMap,
          trendHoverState,
          trendSeriesModal,
          trendTargetWidget,
          trendSeriesForm,
          detectedTrendFields,
          loadingTrendFields,
          getTrendSeries,
          getTrendYBounds,
          getTrendXTicks,
          getTrendSeriesPath,
          getTrendSeriesAreaPath,
          getTrendLatestPoint,
          getTrendSeriesLatestVal,
          handleTrendMouseMove,
          handleTrendMouseLeave,
          setTrendTimeRange,
          fetchTrendHistoryForWidget,
          openAddTrendSeriesModal,
          fetchDetectedTrendFields,
          selectTrendTagPill,
          saveTrendSeries,
          removeTrendSeries,
          toggleTrendSeriesVisible,
          getWidgetTrendLegend,
          getWidgetTrendPath,
          initRealtimeConnection,
          downlinkForm,
          downlinkDeviceSearch,
          downlinkHistory,
          loadingDownlinkHistory,
          sendingDownlink,
          downlinkHistoryFilterDevEUI,
          downlinkConfirmModal,
          filteredDownlinkDevices,
          calculatedHexBytes,
          calculatedConfirmBytes,
          selectedDownlinkDevice,
          selectedDownlinkServer,
          downlinkDeviceDropdownOpen,
          selectDownlinkDevice,
          clearSelectedDownlinkDevice,
          onDownlinkDeviceSelect,
          onDownlinkSearchFocus,
          toggleDownlinkDropdown,
          deviceQueue,
          loadingDeviceQueue,
          flushingQueue,
          deviceQueueServerName,
          fetchDeviceQueue,
          fetchDownlinkHistory,
          openDownlinkConfirm,
          executeConfirmedDownlink,
          flushConfirmModal,
          openFlushConfirm,
          executeConfirmedFlush,
          flushQueueExplicitly,
          formatFirmware,
          onDeviceSkuOrFwChange,
          resendDownlink,
          copyText,
        };
      }
    });

    app.config.errorHandler = function(err, vm, info) {
      console.error('[Vue Error Handler]:', err, info);
      var appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        appEl.removeAttribute('v-cloak');
      }
    };

    app.mount('#app');
  </script>
</body>
</html>
`;
