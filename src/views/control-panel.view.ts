export const CONTROL_PANEL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Control Panel - Daviteq LoRaWAN Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    *, ::before, ::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #080d1a;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: #0f172a;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }
    .nav-item {
      cursor: pointer !important;
      user-select: none;
      transition: all 0.15s ease-in-out;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.9rem;
      border-radius: 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #94a3b8;
      border: 1px solid transparent;
      background: transparent;
      outline: none;
      width: 100%;
      text-align: left;
    }
    .nav-item:hover {
      color: #f8fafc;
      background: rgba(30, 41, 59, 0.6);
      border-color: rgba(51, 65, 85, 0.4);
    }
    .nav-item.active {
      background: rgba(14, 165, 233, 0.15) !important;
      color: #38bdf8 !important;
      border-color: rgba(56, 189, 248, 0.4) !important;
      font-weight: 600;
      box-shadow: inset 0 0 12px rgba(56, 189, 248, 0.08);
    }
    .nav-item.active .nav-icon {
      color: #38bdf8 !important;
    }
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background-color: rgba(3, 7, 18, 0.85);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-overlay.active {
      display: flex !important;
    }
    .btn {
      cursor: pointer !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      font-weight: 600;
      border-radius: 0.75rem;
      transition: all 0.15s ease;
      outline: none;
      border: none;
      user-select: none;
    }
    #toastContainer {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 24rem;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      animation: toastIn 0.2s ease-out;
      transition: all 0.2s ease-in-out;
    }
    @keyframes toastIn {
      from { transform: translateY(-0.5rem); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>
<body class="min-h-screen text-slate-100 flex flex-col antialiased">
  <!-- Toast Container -->
  <div id="toastContainer"></div>

  <!-- Mobile Overlay Backdrop -->
  <div id="mobileSidebarBackdrop" onclick="toggleSidebar(false)" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 hidden lg:hidden"></div>

  <div class="flex flex-1 min-h-screen">
    <!-- Left Navigation Sidebar -->
    <aside id="mainSidebar" class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out backdrop-blur-xl">
      <!-- Sidebar Header / Brand -->
      <div class="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg shadow-inner">
            <i class="fa-solid fa-tower-broadcast"></i>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-white text-sm tracking-tight"><span class="text-sky-400">DAVITEQ</span> IoT</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">v1.0</span>
            </div>
            <p class="text-[11px] text-slate-400 font-medium">LoRaWAN Platform</p>
          </div>
        </div>
        <button onclick="toggleSidebar(false)" type="button" class="lg:hidden text-slate-400 hover:text-white p-1">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto custom-scroll p-3.5 space-y-6">
        <!-- Section 1: Dashboard -->
        <div class="space-y-1">
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Monitoring</div>
          <button onclick="switchTab('overview')" type="button" id="navItem-overview" class="nav-item active">
            <i class="fa-solid fa-chart-pie w-4 text-center nav-icon text-sky-400"></i>
            <span>Overview</span>
          </button>
          <button onclick="switchTab('telemetry')" type="button" id="navItem-telemetry" class="nav-item">
            <i class="fa-solid fa-wave-square w-4 text-center nav-icon text-indigo-400"></i>
            <span>Live Telemetry</span>
          </button>
          <button onclick="switchTab('database')" type="button" id="navItem-database" class="nav-item">
            <i class="fa-solid fa-database w-4 text-center nav-icon text-amber-400"></i>
            <span>Database Health</span>
          </button>
        </div>

        <!-- Section 2: LoRaWAN Network -->
        <div class="space-y-1">
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">LoRaWAN Network</div>
          <button onclick="switchTab('devices')" type="button" id="navItem-devices" class="nav-item">
            <i class="fa-solid fa-microchip w-4 text-center nav-icon text-sky-400"></i>
            <span>Device Fleet</span>
          </button>
          <button onclick="switchTab('webhooks')" type="button" id="navItem-webhooks" class="nav-item">
            <i class="fa-solid fa-satellite-dish w-4 text-center nav-icon text-emerald-400"></i>
            <span>Webhooks</span>
          </button>
          <button onclick="switchTab('decoder')" type="button" id="navItem-decoder" class="nav-item">
            <i class="fa-solid fa-code w-4 text-center nav-icon text-purple-400"></i>
            <span>Decoder Sandbox</span>
          </button>
        </div>

        <!-- Section 3: Administration -->
        <div class="space-y-1">
          <div class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Access Control</div>
          <button onclick="switchTab('users')" type="button" id="navItem-users" class="nav-item">
            <i class="fa-solid fa-users w-4 text-center nav-icon text-cyan-400"></i>
            <span>User Directory</span>
          </button>
          <button onclick="switchTab('roles')" type="button" id="navItem-roles" class="nav-item">
            <i class="fa-solid fa-shield-halved w-4 text-center nav-icon text-yellow-400"></i>
            <span>Role Matrix</span>
          </button>
        </div>
      </div>

      <!-- Sidebar Footer / Account Details -->
      <div class="p-3.5 border-t border-slate-800/80 bg-slate-950/50 space-y-3">
        <div class="flex items-center justify-between px-2 text-xs">
          <span class="inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            core_db &bull; ONLINE
          </span>
          <a href="/api/docs" target="_blank" class="text-sky-400 hover:text-sky-300 text-[11px] font-medium flex items-center gap-1">
            <i class="fa-solid fa-book"></i> Swagger
          </a>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div class="min-w-0 pr-2">
            <div id="navFullName" class="text-xs font-semibold text-white truncate">Admin User</div>
            <div id="navRoleBadge" class="text-[10px] text-emerald-400 font-mono font-bold">SUPER_ADMIN</div>
          </div>
          <button onclick="handleLogout()" type="button" title="Sign Out & Clear Session" class="btn px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs cursor-pointer">
            <i class="fa-solid fa-power-off"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Viewport Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Bar Header -->
      <header class="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md h-16 flex items-center justify-between px-4 sm:px-6">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar(true)" type="button" class="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <div class="flex items-center gap-2">
              <h1 id="pageTitleText" class="text-sm font-bold text-white tracking-tight">Overview Dashboard</h1>
              <span id="pageCategoryBadge" class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">Real-time</span>
            </div>
            <p id="pageSubtitleText" class="text-[11px] text-slate-400 hidden sm:block">LoRaWAN Platform runtime metrics and status</p>
          </div>
        </div>

        <!-- Top Right Actions -->
        <div class="flex items-center gap-2">
          <button onclick="forceCleanSession()" type="button" title="Clean stale browser cache & session" class="btn px-2.5 py-1.5 text-xs text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition">
            <i class="fa-solid fa-arrows-rotate"></i>
            <span class="hidden md:inline text-[11px]">Clear Session</span>
          </button>
          <a href="/api/docs" target="_blank" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-400 bg-sky-950/50 border border-sky-500/30 hover:bg-sky-900/50 transition">
            <i class="fa-solid fa-book"></i> REST API
          </a>
          <button onclick="handleLogout()" type="button" class="btn px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <!-- Main Body Container -->
      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        <!-- TAB 1: OVERVIEW -->
        <div id="tabContent-overview" class="space-y-6" style="display: block;">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Server Runtime</span>
                <i class="fa-solid fa-server text-sky-400"></i>
              </div>
              <div class="text-xl font-bold text-white mt-2 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
              </div>
              <div class="text-[11px] text-slate-500 mt-1">NestJS Core Engine</div>
            </div>

            <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Users</span>
                <i class="fa-solid fa-users text-emerald-400"></i>
              </div>
              <div class="text-xl font-bold text-white mt-2" id="metricTotalUsers">--</div>
              <div class="text-[11px] text-slate-500 mt-1">Super Admins & Operators</div>
            </div>

            <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Configured Roles</span>
                <i class="fa-solid fa-shield-halved text-amber-400"></i>
              </div>
              <div class="text-xl font-bold text-white mt-2" id="metricTotalRoles">--</div>
              <div class="text-[11px] text-slate-500 mt-1">RBAC Role Definitions</div>
            </div>

            <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Database Pools</span>
                <i class="fa-solid fa-database text-indigo-400"></i>
              </div>
              <div class="text-xl font-bold text-white mt-2" id="metricDbPools">--</div>
              <div class="text-[11px] text-slate-500 mt-1">Dynamic Routing Active</div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-bolt text-sky-400"></i> Platform Architecture
              </h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                The platform functions as a high-performance LoRaWAN Application Server providing webhook ingestion for ChirpStack and ThingPark Wireless, dynamic PostgreSQL table routing, and multi-tier RBAC access control.
              </p>
              <div class="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span class="text-slate-400 text-[11px] block">Role-Based Access Control</span>
                  <span class="font-semibold text-emerald-400 mt-0.5 block">5-Table RBAC Model</span>
                </div>
                <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span class="text-slate-400 text-[11px] block">Database Routing</span>
                  <span class="font-semibold text-sky-400 mt-0.5 block">Single/Multi DB Active</span>
                </div>
              </div>
            </div>

            <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-link text-emerald-400"></i> Quick Navigation
              </h3>
              <div class="space-y-2 text-xs">
                <button onclick="switchTab('devices')" type="button" class="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/40 transition cursor-pointer">
                  <span class="flex items-center gap-2 text-slate-300 font-medium"><i class="fa-solid fa-microchip text-sky-400"></i> LoRaWAN Devices Fleet</span>
                  <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
                </button>
                <button onclick="switchTab('telemetry')" type="button" class="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition cursor-pointer">
                  <span class="flex items-center gap-2 text-slate-300 font-medium"><i class="fa-solid fa-wave-square text-indigo-400"></i> Live Telemetry Packets</span>
                  <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
                </button>
                <button onclick="switchTab('database')" type="button" class="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 transition cursor-pointer">
                  <span class="flex items-center gap-2 text-slate-300 font-medium"><i class="fa-solid fa-heart-pulse text-amber-400"></i> Database Health Monitor</span>
                  <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: LIVE TELEMETRY -->
        <div id="tabContent-telemetry" class="space-y-6" style="display: none;">
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-wave-square text-indigo-400"></i> Live Telemetry Uplinks
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">Real-time incoming packets from ChirpStack, ThingPark, and Generic Webhooks</p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="loadTelemetry()" type="button" class="btn px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh Telemetry
                </button>
              </div>
            </div>

            <div class="overflow-x-auto custom-scroll border border-slate-800/80 rounded-xl">
              <table class="w-full text-left text-xs">
                <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th class="py-3 px-4">Time</th>
                    <th class="py-3 px-4">DevEUI</th>
                    <th class="py-3 px-4">Port / FCnt</th>
                    <th class="py-3 px-4">Raw Hex</th>
                    <th class="py-3 px-4">Decoded Data</th>
                    <th class="py-3 px-4">RSSI / SNR</th>
                  </tr>
                </thead>
                <tbody id="telemetryTableBody" class="divide-y divide-slate-800/60 font-mono">
                  <tr><td colspan="6" class="py-4 text-center text-slate-500 font-sans">Loading telemetry...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: DATABASE HEALTH & ROUTING -->
        <div id="tabContent-database" class="space-y-6" style="display: none;">
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-heart-pulse text-emerald-400"></i> Visual Database Health & Metrics
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">Real-time status of PostgreSQL connections, latency, and table routing</p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="loadDatabaseHealth()" type="button" class="btn px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh Health
                </button>
                <button onclick="reloadDbConfig()" type="button" class="btn px-3 py-1.5 text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20">
                  <i class="fa-solid fa-gear"></i> Hot-Reload Config
                </button>
              </div>
            </div>

            <div id="dbHealthPoolsGrid" class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div class="p-4 text-center text-slate-500 text-xs">Checking database health...</div>
            </div>
          </div>

          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-map-location-dot text-sky-400"></i> Active Table Routing & Record Counts
              </h3>
              <span class="text-xs text-slate-400 font-mono">config/db-routing.config.json</span>
            </div>
            <div class="overflow-x-auto custom-scroll border border-slate-800/80 rounded-xl">
              <table class="w-full text-left text-xs">
                <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th class="py-3 px-4">Table / Entity</th>
                    <th class="py-3 px-4">Target Database Pool</th>
                    <th class="py-3 px-4">Live Record Count</th>
                    <th class="py-3 px-4">Table Status</th>
                  </tr>
                </thead>
                <tbody id="tableStatsBody" class="divide-y divide-slate-800/60 font-mono">
                  <tr><td colspan="4" class="py-4 text-center text-slate-500">Loading table statistics...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 4: LORAWAN DEVICES -->
        <div id="tabContent-devices" class="space-y-6" style="display: none;">
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-microchip text-sky-400"></i> LoRaWAN Device Fleet
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">Manage registered End Devices and decoder scripts</p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="loadDevices()" type="button" class="btn px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button onclick="openRegisterDeviceModal()" type="button" class="btn px-3.5 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20">
                  <i class="fa-solid fa-plus"></i> Register Device
                </button>
              </div>
            </div>

            <div class="overflow-x-auto custom-scroll border border-slate-800/80 rounded-xl">
              <table class="w-full text-left text-xs">
                <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th class="py-3 px-4">DevEUI</th>
                    <th class="py-3 px-4">Device Name</th>
                    <th class="py-3 px-4">Activation</th>
                    <th class="py-3 px-4">Decoder Script</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="devicesTableBody" class="divide-y divide-slate-800/60 font-mono">
                  <tr><td colspan="6" class="py-4 text-center text-slate-500 font-sans">Loading device fleet...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 5: WEBHOOKS -->
        <div id="tabContent-webhooks" class="space-y-6" style="display: none;">
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-satellite-dish text-sky-400"></i> LoRaWAN Network Server Webhook Endpoints
            </h2>
            <p class="text-xs text-slate-400">
              Configure these webhook URLs on ChirpStack or ThingPark Wireless Network Servers to ingest uplink telemetry:
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <div class="flex items-center justify-between text-sky-400 font-bold font-sans">
                  <span>ChirpStack v4 Ingestion</span>
                  <span class="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px]">POST / JSON</span>
                </div>
                <div class="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 break-all select-all flex items-center justify-between">
                  <span id="chirpstackWebhookUrl">POST /lorawan/webhook/chirpstack</span>
                  <button onclick="copyToClipboard(window.location.origin + '/lorawan/webhook/chirpstack')" type="button" class="text-slate-400 hover:text-sky-400 text-xs ml-2 cursor-pointer" title="Copy"><i class="fa-solid fa-copy"></i></button>
                </div>
                <p class="text-[11px] text-slate-400 font-sans">Supports ChirpStack uplink events: deduplication, RSSI/SNR metrics, payload decoding.</p>
              </div>

              <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <div class="flex items-center justify-between text-emerald-400 font-bold font-sans">
                  <span>ThingPark Wireless Ingestion</span>
                  <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px]">POST / JSON</span>
                </div>
                <div class="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 break-all select-all flex items-center justify-between">
                  <span id="thingparkWebhookUrl">POST /lorawan/webhook/thingpark</span>
                  <button onclick="copyToClipboard(window.location.origin + '/lorawan/webhook/thingpark')" type="button" class="text-slate-400 hover:text-emerald-400 text-xs ml-2 cursor-pointer" title="Copy"><i class="fa-solid fa-copy"></i></button>
                </div>
                <p class="text-[11px] text-slate-400 font-sans">Supports Actility ThingPark Wireless DX packets and hex payloads.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 6: DECODER SANDBOX -->
        <div id="tabContent-decoder" class="space-y-6" style="display: none;">
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-code text-indigo-400"></i> Payload Formatter Sandbox
            </h2>
            <p class="text-xs text-slate-400">Test and evaluate JavaScript payload decoders before saving them to devices.</p>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
              <div class="space-y-2">
                <label class="block text-xs font-sans font-semibold text-slate-300">JavaScript Decoder Function</label>
                <textarea id="sandboxCode" class="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs">function decodeUplink(bytes, fPort) {
  var temperature = ((bytes[0] << 8) | bytes[1]) / 100;
  var humidity = bytes[2];
  return {
    temperature: temperature,
    humidity: humidity
  };
}</textarea>
              </div>

              <div class="space-y-2">
                <label class="block text-xs font-sans font-semibold text-slate-300">Test Hex Bytes & Output</label>
                <div class="flex gap-2">
                  <input type="text" id="sandboxHex" value="09C441" placeholder="Hex string e.g. 09C441" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono" />
                  <button onclick="runSandboxDecode()" type="button" class="btn px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold rounded-xl transition">Decode</button>
                </div>
                <pre id="sandboxResult" class="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 overflow-auto text-xs">{ "ready": true }</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 7: USERS DIRECTORY -->
        <div id="tabContent-users" class="space-y-6" style="display: none;">
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-users text-cyan-400"></i> User Directory
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">Manage administrative and standard user accounts</p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="loadUsers()" type="button" class="btn px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button onclick="openCreateUserModal()" type="button" class="btn px-3.5 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20">
                  <i class="fa-solid fa-user-plus"></i> Create User
                </button>
              </div>
            </div>

            <div class="overflow-x-auto custom-scroll border border-slate-800/80 rounded-xl">
              <table class="w-full text-left text-xs">
                <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th class="py-3 px-4">Username</th>
                    <th class="py-3 px-4">Full Name</th>
                    <th class="py-3 px-4">Email</th>
                    <th class="py-3 px-4">Type</th>
                    <th class="py-3 px-4">Roles</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="usersTableBody" class="divide-y divide-slate-800/60">
                  <tr><td colspan="7" class="py-4 text-center text-slate-500">Loading user accounts...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 8: ROLE MATRIX -->
        <div id="tabContent-roles" class="space-y-6" style="display: none;">
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-shield-halved text-yellow-400"></i> Role & Permissions Matrix (RBAC)
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">Configure role definitions and granular permission assignments</p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="loadRoles()" type="button" class="btn px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                  <i class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button onclick="openCreateRoleModal()" type="button" class="btn px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                  <i class="fa-solid fa-plus"></i> Create New Role
                </button>
              </div>
            </div>

            <!-- Role Cards Grid -->
            <div id="rolesCardsContainer" class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 text-center text-slate-500 text-xs">Loading roles...</div>
            </div>

            <!-- Role Table Details -->
            <div class="overflow-x-auto custom-scroll border border-slate-800/80 rounded-xl mt-4">
              <table class="w-full text-left text-xs">
                <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th class="py-3 px-4">Role Code</th>
                    <th class="py-3 px-4">Display Name</th>
                    <th class="py-3 px-4">Description</th>
                    <th class="py-3 px-4">Assigned Permissions</th>
                    <th class="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="rolesTableBody" class="divide-y divide-slate-800/60">
                  <tr><td colspan="5" class="py-4 text-center text-slate-500">Loading roles list...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- MODAL: CREATE USER -->
  <div id="createUserModal" class="modal-overlay" onclick="closeCreateUserModal()">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-user-plus text-sky-400"></i> Create User Account
        </h3>
        <button onclick="closeCreateUserModal()" type="button" class="text-slate-500 hover:text-slate-300 cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="createUserForm" class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Username</label>
          <input type="text" id="newUsername" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Full Name</label>
          <input type="text" id="newFullName" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Email Address</label>
          <input type="email" id="newEmail" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Password</label>
          <input type="password" id="newPassword" required minlength="6" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">User Type</label>
          <select id="newUserType" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
            <option value="USER">Standard User (USER)</option>
            <option value="SUB_ADMIN">Sub-Administrator (SUB_ADMIN)</option>
            <option value="ADMIN">Super Administrator (ADMIN)</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Assign Role</label>
          <select id="newUserRoleId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
            <option value="">Select role...</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeCreateUserModal()" class="btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300">Cancel</button>
          <button type="submit" class="btn px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold">Save User</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: EDIT USER -->
  <div id="editUserModal" class="modal-overlay" onclick="closeEditUserModal()">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-user-gear text-sky-400"></i> Edit User & Role Assignment
        </h3>
        <button onclick="closeEditUserModal()" type="button" class="text-slate-500 hover:text-slate-300 cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="editUserForm" class="space-y-3 text-xs">
        <input type="hidden" id="editUserId" />
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Username</label>
          <input type="text" id="editUsernameDisplay" disabled class="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-400 font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Assign Role</label>
          <select id="editUserRoleId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
            <option value="">No role assigned</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Account Status</label>
          <select id="editUserActive" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
            <option value="true">Active</option>
            <option value="false">Suspended</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeEditUserModal()" class="btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300">Cancel</button>
          <button type="submit" class="btn px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold">Update User</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: CREATE ROLE -->
  <div id="createRoleModal" class="modal-overlay" onclick="closeCreateRoleModal()">
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-shield-halved text-amber-400"></i> Create New Role
        </h3>
        <button onclick="closeCreateRoleModal()" type="button" class="text-slate-500 hover:text-slate-300 cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="createRoleForm" class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Role Code (Uppercase Identifier)</label>
          <input type="text" id="newRoleCode" required placeholder="e.g. AUDITOR or FIELD_TECH" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white uppercase font-mono focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Display Name</label>
          <input type="text" id="newRoleName" required placeholder="e.g. Field Technician" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Description</label>
          <input type="text" id="newRoleDescription" placeholder="Description of role privileges" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Assign Permissions</label>
          <div id="newRolePermissionsContainer" class="max-h-48 overflow-y-auto custom-scroll p-2 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <span class="text-slate-500">Loading permissions...</span>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeCreateRoleModal()" class="btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300">Cancel</button>
          <button type="submit" class="btn px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">Create Role</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: EDIT ROLE -->
  <div id="editRoleModal" class="modal-overlay" onclick="closeEditRoleModal()">
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-pen-to-square text-sky-400"></i> Edit Role Definition
        </h3>
        <button onclick="closeEditRoleModal()" type="button" class="text-slate-500 hover:text-slate-300 cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="editRoleForm" class="space-y-3 text-xs">
        <input type="hidden" id="editRoleId" />
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Role Code</label>
          <input type="text" id="editRoleCode" disabled class="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-400 font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Display Name</label>
          <input type="text" id="editRoleName" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Description</label>
          <input type="text" id="editRoleDescription" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Permissions Matrix</label>
          <div id="editRolePermissionsContainer" class="max-h-48 overflow-y-auto custom-scroll p-2 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <span class="text-slate-500">Loading permissions...</span>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeEditRoleModal()" class="btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300">Cancel</button>
          <button type="submit" class="btn px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold">Update Role</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: REGISTER DEVICE -->
  <div id="registerDeviceModal" class="modal-overlay" onclick="closeRegisterDeviceModal()">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-microchip text-sky-400"></i> Register LoRaWAN Device
        </h3>
        <button onclick="closeRegisterDeviceModal()" type="button" class="text-slate-500 hover:text-slate-300 cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="registerDeviceForm" class="space-y-3 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1">DevEUI (16 Hex Characters)</label>
          <input type="text" id="newDevEUI" required placeholder="0018B20000000001" maxlength="16" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Device Name</label>
          <input type="text" id="newDeviceName" required placeholder="e.g. Temperature Sensor 01" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Activation Type</label>
          <select id="newActivationType" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
            <option value="OTAA">OTAA (Over-The-Air Activation)</option>
            <option value="ABP">ABP (Activation By Personalization)</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">AppKey (Optional)</label>
          <input type="text" id="newAppKey" placeholder="32 Hex AppKey (if OTAA)" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-sky-500" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeRegisterDeviceModal()" class="btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300">Cancel</button>
          <button type="submit" class="btn px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold">Register Device</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    var allAvailablePermissions = [];
    var allAvailableRoles = [];
    var allLoadedUsers = [];
    var allLoadedDevices = [];

    var tabMetadata = {
      overview: { title: "Overview Dashboard", category: "Real-time", subtitle: "LoRaWAN Platform runtime metrics and status" },
      telemetry: { title: "Live Telemetry Packets", category: "Uplink Monitor", subtitle: "Real-time stream of incoming LoRaWAN packets and decoded values" },
      database: { title: "Database Health & Routing", category: "Infrastructure", subtitle: "PostgreSQL multi-pool latency, table routing, and config reload" },
      devices: { title: "LoRaWAN Device Fleet", category: "Fleet Management", subtitle: "Registered OTAA/ABP sensors and payload decoder script status" },
      webhooks: { title: "Webhook Ingestion Endpoints", category: "Integration", subtitle: "ChirpStack v4 and Actility ThingPark Wireless ingest URLs" },
      decoder: { title: "Payload Formatter Sandbox", category: "JS Engine", subtitle: "Test JavaScript payload decoders before saving to devices" },
      users: { title: "User Directory", category: "RBAC Security", subtitle: "Manage Super Admin, Sub-Admin, and standard user accounts" },
      roles: { title: "Role Matrix & Permissions", category: "RBAC Matrix", subtitle: "Role definitions and granular system permission mapping" }
    };

    function toggleSidebar(open) {
      var sidebar = document.getElementById("mainSidebar");
      var backdrop = document.getElementById("mobileSidebarBackdrop");
      if (open) {
        sidebar.classList.remove("-translate-x-full");
        backdrop.classList.remove("hidden");
      } else {
        sidebar.classList.add("-translate-x-full");
        backdrop.classList.add("hidden");
      }
    }
    window.toggleSidebar = toggleSidebar;

    function showToast(msg, type) {
      var container = document.getElementById("toastContainer");
      if (!container) return;
      var el = document.createElement("div");
      var isError = type === "error";
      var isSuccess = type === "success";
      var bgClass = isError ? "bg-red-950 border border-red-500/50 text-red-200" : (isSuccess ? "bg-emerald-950 border border-emerald-500/50 text-emerald-200" : "bg-sky-950 border border-sky-500/50 text-sky-200");
      var icon = isError ? '<i class="fa-solid fa-circle-exclamation text-red-400"></i>' : (isSuccess ? '<i class="fa-solid fa-circle-check text-emerald-400"></i>' : '<i class="fa-solid fa-circle-info text-sky-400"></i>');
      
      el.className = "toast-item " + bgClass;
      el.innerHTML = icon + '<span class="flex-1">' + msg + '</span>';
      container.appendChild(el);
      setTimeout(function() {
        el.style.opacity = "0";
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
      }, 3500);
    }
    window.showToast = showToast;

    function copyToClipboard(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          showToast("Copied to clipboard!", "success");
        }).catch(function() {
          showToast("Copy failed", "error");
        });
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Copied to clipboard!", "success");
      }
    }
    window.copyToClipboard = copyToClipboard;

    function forceCleanSession() {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch(e) {}
      var cookies = ["access_token", "lorawan_token", "session_id", "connect.sid"];
      for (var i = 0; i < cookies.length; i++) {
        var c = cookies[i];
        document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;";
        document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
      }
      window.location.replace("/login?cleared=1");
    }
    window.forceCleanSession = forceCleanSession;

    function getAuthToken() {
      var token = null;
      try {
        token = localStorage.getItem("lorawan_token");
      } catch(e) {}
      if (!token || token === "undefined" || token === "null") {
        var match = document.cookie.match(/(?:^|;\\s*)access_token=([^;]*)/);
        if (match && match[1] && match[1] !== "undefined" && match[1] !== "null") {
          token = decodeURIComponent(match[1]);
        } else {
          token = null;
        }
      }
      return token;
    }

    function authHeaders() {
      var headers = {
        "Content-Type": "application/json"
      };
      var token = getAuthToken();
      if (token) {
        headers["Authorization"] = "Bearer " + token;
      }
      return headers;
    }

    function updateUserNav(user) {
      if (!user) return;
      var nameEl = document.getElementById("navFullName");
      if (nameEl) nameEl.textContent = user.fullName || user.username || "Admin User";
      
      var isSuper = user.userType === "ADMIN" || 
                    String(user.userType).toUpperCase() === "ADMIN" ||
                    user.username === "admin" ||
                    (user.roles && user.roles.some(function(r) { return r === "SUPER_ADMIN" || (r && r.code === "SUPER_ADMIN"); }));
      var badgeEl = document.getElementById("navRoleBadge");
      if (badgeEl) {
        badgeEl.textContent = isSuper ? "SUPER_ADMIN" : (user.roles && user.roles[0] ? (user.roles[0].name || user.roles[0].code || user.roles[0]) : (user.userType || "USER"));
        badgeEl.className = isSuper ? "text-[10px] text-emerald-400 font-mono font-bold" : "text-[10px] text-sky-400 font-mono font-medium";
      }
    }

    function switchTab(tabId) {
      var tabList = ["overview", "telemetry", "database", "devices", "webhooks", "decoder", "users", "roles"];
      if (tabList.indexOf(tabId) === -1) tabId = "overview";

      for (var i = 0; i < tabList.length; i++) {
        var t = tabList[i];
        var navItem = document.getElementById("navItem-" + t);
        var content = document.getElementById("tabContent-" + t);
        
        if (navItem) {
          if (t === tabId) {
            navItem.classList.add("active");
          } else {
            navItem.classList.remove("active");
          }
        }
        
        if (content) {
          if (t === tabId) {
            content.style.setProperty("display", "block", "important");
          } else {
            content.style.setProperty("display", "none", "important");
          }
        }
      }

      // Update Header Titles
      var meta = tabMetadata[tabId] || tabMetadata.overview;
      var titleEl = document.getElementById("pageTitleText");
      var badgeEl = document.getElementById("pageCategoryBadge");
      var subEl = document.getElementById("pageSubtitleText");
      if (titleEl) titleEl.textContent = meta.title;
      if (badgeEl) badgeEl.textContent = meta.category;
      if (subEl) subEl.textContent = meta.subtitle;

      // Close mobile drawer if open
      if (window.innerWidth < 1024) {
        toggleSidebar(false);
      }

      // Set URL hash for easy bookmarking / refresh
      try {
        window.history.replaceState(null, null, "#" + tabId);
      } catch(e) {}

      // Lazy load tab data
      if (tabId === "users") loadUsers();
      if (tabId === "roles") loadRoles();
      if (tabId === "database") loadDatabaseHealth();
      if (tabId === "devices") loadDevices();
      if (tabId === "telemetry") loadTelemetry();
    }
    window.switchTab = switchTab;

    async function handleLogout() {
      try {
        await fetch("/auth/logout", { method: "POST", headers: authHeaders(), credentials: "include" });
      } catch (e) {}
      try {
        await fetch("/reset-session", { method: "POST", credentials: "include" });
      } catch (e) {}
      forceCleanSession();
    }
    window.handleLogout = handleLogout;

    async function loadUsers() {
      try {
        var res = await fetch("/users", { headers: authHeaders(), credentials: "include" });
        if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
        if (!res.ok) throw new Error("HTTP " + res.status);
        var users = await res.json();
        if (!Array.isArray(users)) throw new Error("Invalid response format");
        allLoadedUsers = users;
        
        var totalEl = document.getElementById("metricTotalUsers");
        if (totalEl) totalEl.textContent = users.length;
        var tbody = document.getElementById("usersTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-slate-500">No user accounts found.</td></tr>';
          return;
        }

        for (var i = 0; i < users.length; i++) {
          var u = users[i];
          var isSuper = u.userType === "ADMIN" || 
                        String(u.userType).toUpperCase() === "ADMIN" ||
                        u.username === "admin" ||
                        (u.roles && u.roles.some(function(r) { return r.code === "SUPER_ADMIN"; }));
          var typeBadge = isSuper
            ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">ADMIN</span>'
            : '<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">' + u.userType + '</span>';
          
          var rolesBadges = u.roles && u.roles.length > 0
            ? u.roles.map(function(r) { return '<span class="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono mr-1">' + (r.name || r.code) + '</span>'; }).join("")
            : '<span class="text-slate-500 text-[10px]">None</span>';

          var actions = isSuper 
            ? '<span class="text-slate-600 text-[11px]"><i class="fa-solid fa-lock"></i> Protected</span>'
            : '<div class="flex items-center justify-end gap-1.5"><button onclick="openEditUserModal(\'' + u.id + '\')" type="button" class="btn text-sky-400 hover:text-sky-300 text-xs px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20">Edit</button><button onclick="deleteUser(\'' + u.id + '\')" type="button" class="btn text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/10 border border-red-500/20" title="Delete User"><i class="fa-solid fa-trash"></i></button></div>';

          var tr = document.createElement("tr");
          tr.className = "hover:bg-slate-950/40 transition";
          tr.innerHTML = '<td class="py-3 px-4 font-semibold text-white font-mono">' + u.username + '</td>' +
            '<td class="py-3 px-4 text-slate-300">' + (u.fullName || "--") + '</td>' +
            '<td class="py-3 px-4 text-slate-400">' + u.email + '</td>' +
            '<td class="py-3 px-4">' + typeBadge + '</td>' +
            '<td class="py-3 px-4">' + rolesBadges + '</td>' +
            '<td class="py-3 px-4"><span class="inline-flex items-center gap-1.5 ' + (u.isActive ? "text-emerald-400" : "text-red-400") + '"><span class="w-1.5 h-1.5 rounded-full ' + (u.isActive ? "bg-emerald-500" : "bg-red-500") + '"></span>' + (u.isActive ? "Active" : "Suspended") + '</span></td>' +
            '<td class="py-3 px-4 text-right">' + actions + '</td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        console.error("loadUsers error:", err);
        var tbody = document.getElementById("usersTableBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-amber-400">Could not load users (' + err.message + '). <button onclick="loadUsers()" type="button" class="btn underline text-sky-400 ml-2">Retry</button></td></tr>';
      }
    }
    window.loadUsers = loadUsers;

    async function loadRoles() {
      try {
        var results = await Promise.all([
          fetch("/roles", { headers: authHeaders(), credentials: "include" }),
          fetch("/roles/permissions", { headers: authHeaders(), credentials: "include" })
        ]);

        if (results[0].status === 401 || results[1].status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }

        if (!results[0].ok || !results[1].ok) {
          throw new Error("HTTP " + results[0].status + " / " + results[1].status);
        }

        allAvailableRoles = await results[0].json();
        allAvailablePermissions = await results[1].json();

        if (Array.isArray(allAvailableRoles)) {
          var totalRolesEl = document.getElementById("metricTotalRoles");
          if (totalRolesEl) totalRolesEl.textContent = allAvailableRoles.length;
          renderRolesCards(allAvailableRoles);
          renderRolesTable(allAvailableRoles);
        }
      } catch (err) {
        console.error("loadRoles error:", err);
        var tbody = document.getElementById("rolesTableBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-amber-400">Could not load roles (' + err.message + '). <button onclick="loadRoles()" type="button" class="btn underline text-sky-400 ml-2">Retry</button></td></tr>';
      }
    }
    window.loadRoles = loadRoles;

    function renderRolesCards(roles) {
      var container = document.getElementById("rolesCardsContainer");
      if (!container) return;
      container.innerHTML = "";

      if (!Array.isArray(roles) || roles.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-slate-500 text-xs">No roles found</div>';
        return;
      }

      for (var i = 0; i < roles.length; i++) {
        var r = roles[i];
        var isSuper = r.code === "SUPER_ADMIN";
        var editBtn = isSuper 
          ? '<span class="text-emerald-400/80 font-mono text-[10px]"><i class="fa-solid fa-lock"></i> Core System Role</span>'
          : '<button onclick="openEditRoleModal(\'' + r.id + '\')" type="button" class="btn text-sky-400 hover:text-sky-300 font-medium text-xs">Edit</button>';

        var card = document.createElement("div");
        card.className = "bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2";
        card.innerHTML = '<div class="flex items-center justify-between">' +
          '<span class="font-bold ' + (isSuper ? "text-emerald-400" : "text-sky-400") + ' flex items-center gap-1.5"><i class="fa-solid ' + (isSuper ? "fa-crown" : "fa-user-shield") + '"></i> ' + r.name + '</span>' +
          '<span class="px-2 py-0.5 rounded text-[10px] font-mono ' + (isSuper ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold" : "bg-slate-800 text-slate-400") + '">' + r.code + '</span>' +
          '</div>' +
          '<p class="text-slate-400 text-[11px]">' + (r.description || "No description provided") + '</p>' +
          '<div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">' +
          '<span>' + (r.permissions ? r.permissions.length : 0) + ' permissions assigned</span>' +
          editBtn +
          '</div>';
        container.appendChild(card);
      }
    }

    function renderRolesTable(roles) {
      var tbody = document.getElementById("rolesTableBody");
      if (!tbody) return;
      tbody.innerHTML = "";

      if (!Array.isArray(roles) || roles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-500">No roles configured</td></tr>';
        return;
      }

      for (var i = 0; i < roles.length; i++) {
        var r = roles[i];
        var isSuper = r.code === "SUPER_ADMIN";
        var permsList = r.permissions && r.permissions.length > 0
          ? r.permissions.map(function(p) { return '<span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] mr-1 mb-1 inline-block">' + p.name + '</span>'; }).join("")
          : '<span class="text-slate-500">None</span>';
        
        var actions = isSuper 
          ? '<span class="text-slate-600 text-[11px]"><i class="fa-solid fa-lock"></i> Immutable</span>'
          : '<div class="flex items-center justify-end gap-1.5"><button onclick="openEditRoleModal(\'' + r.id + '\')" type="button" class="btn text-sky-400 hover:text-sky-300 text-xs px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20">Edit</button><button onclick="deleteRole(\'' + r.id + '\')" type="button" class="btn text-red-400 hover:text-red-300 text-xs px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20"><i class="fa-solid fa-trash"></i></button></div>';

        var tr = document.createElement("tr");
        tr.className = "hover:bg-slate-950/40 transition";
        tr.innerHTML = '<td class="py-3 px-4 font-mono font-bold ' + (isSuper ? "text-emerald-400" : "text-sky-400") + '">' + r.code + '</td>' +
          '<td class="py-3 px-4 font-semibold text-white">' + r.name + '</td>' +
          '<td class="py-3 px-4 text-slate-400 max-w-xs truncate">' + (r.description || "--") + '</td>' +
          '<td class="py-3 px-4 max-w-md">' + permsList + '</td>' +
          '<td class="py-3 px-4 text-right">' + actions + '</td>';
        tbody.appendChild(tr);
      }
    }

    async function loadDatabaseHealth() {
      try {
        var res = await fetch("/database/health", { headers: authHeaders(), credentials: "include" });
        if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
        if (!res.ok) throw new Error("HTTP " + res.status);
        var data = await res.json();

        var dbPoolsEl = document.getElementById("metricDbPools");
        if (dbPoolsEl) dbPoolsEl.textContent = data.totalConnections;
        var poolsGrid = document.getElementById("dbHealthPoolsGrid");
        if (poolsGrid && data.connections) {
          poolsGrid.innerHTML = "";
          var conns = Object.values(data.connections);
          for (var i = 0; i < conns.length; i++) {
            var c = conns[i];
            var poolCard = document.createElement("div");
            poolCard.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3";
            poolCard.innerHTML = '<div class="flex items-center justify-between">' +
              '<span class="font-bold text-white text-xs font-mono">' + c.name + '</span>' +
              '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ' + (c.isAlive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20") + '">' +
              (c.isAlive ? "CONNECTED" : "OFFLINE") +
              '</span>' +
              '</div>' +
              '<div class="text-[11px] text-slate-400 space-y-1 font-mono">' +
              '<div>Host: <strong class="text-slate-200">' + c.host + ':' + c.port + '</strong></div>' +
              '<div>Database: <strong class="text-slate-200">' + c.database + '</strong></div>' +
              '<div>Ping Latency: <strong class="' + (c.latencyMs < 50 ? "text-emerald-400" : "text-amber-400") + '">' + (c.latencyMs !== null ? c.latencyMs + ' ms (' + c.status + ')' : 'N/A') + '</strong></div>' +
              '<div>Pool Size: <strong class="text-slate-300">' + c.poolSize + ' max connections</strong></div>' +
              '</div>';
            poolsGrid.appendChild(poolCard);
          }
        }

        var statsBody = document.getElementById("tableStatsBody");
        if (statsBody && data.tableStats) {
          statsBody.innerHTML = "";
          var entries = Object.entries(data.tableStats);
          for (var j = 0; j < entries.length; j++) {
            var table = entries[j][0];
            var stat = entries[j][1];
            var tr = document.createElement("tr");
            tr.className = "hover:bg-slate-950/40 transition";
            tr.innerHTML = '<td class="py-3 px-4 font-bold text-white">' + table + '</td>' +
              '<td class="py-3 px-4 text-sky-400">' + stat.routedTo + '</td>' +
              '<td class="py-3 px-4 font-semibold text-emerald-400">' + Number(stat.recordCount).toLocaleString() + ' rows</td>' +
              '<td class="py-3 px-4"><span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">' + stat.status + '</span></td>';
            statsBody.appendChild(tr);
          }
        }
      } catch (err) {
        console.error("loadDatabaseHealth error:", err);
        var poolsGrid = document.getElementById("dbHealthPoolsGrid");
        if (poolsGrid) poolsGrid.innerHTML = '<div class="p-4 text-center text-amber-400 text-xs">Could not fetch database health metrics (' + err.message + ')</div>';
      }
    }
    window.loadDatabaseHealth = loadDatabaseHealth;

    async function loadDevices() {
      try {
        var res = await fetch("/lorawan/devices", { headers: authHeaders(), credentials: "include" });
        if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
        if (!res.ok) throw new Error("HTTP " + res.status);
        var devices = await res.json();
        allLoadedDevices = devices;
        var tbody = document.getElementById("devicesTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!Array.isArray(devices) || devices.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-slate-500 font-sans">No LoRaWAN devices registered. Click "Register Device" to add one.</td></tr>';
          return;
        }

        for (var i = 0; i < devices.length; i++) {
          var d = devices[i];
          var tr = document.createElement("tr");
          tr.className = "hover:bg-slate-950/40 transition";
          tr.innerHTML = '<td class="py-3 px-4 font-bold text-sky-400">' + d.devEUI + '</td>' +
            '<td class="py-3 px-4 font-sans text-white">' + (d.name || "--") + '</td>' +
            '<td class="py-3 px-4 text-amber-400">' + (d.activationType || "OTAA") + '</td>' +
            '<td class="py-3 px-4 text-slate-400 font-sans">' + (d.payloadFormatterScript ? '<span class="text-emerald-400"><i class="fa-solid fa-code"></i> Configured</span>' : '<span class="text-slate-500">None</span>') + '</td>' +
            '<td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] ' + (d.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20") + '">' + (d.isActive ? "ACTIVE" : "INACTIVE") + '</span></td>' +
            '<td class="py-3 px-4 text-right font-sans"><button onclick="testDeviceDecoder(\'' + d.devEUI + '\')" type="button" class="btn text-sky-400 hover:text-sky-300 text-xs px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20">Test Payload</button></td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        console.error("loadDevices error:", err);
        var tbody = document.getElementById("devicesTableBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-amber-400 font-sans">Could not load devices (' + err.message + ')</td></tr>';
      }
    }
    window.loadDevices = loadDevices;

    async function loadTelemetry() {
      try {
        var res = await fetch("/lorawan/telemetry?limit=25", { headers: authHeaders(), credentials: "include" });
        if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
        if (!res.ok) throw new Error("HTTP " + res.status);
        var logs = await res.json();
        var tbody = document.getElementById("telemetryTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!Array.isArray(logs) || logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-slate-500 font-sans">No incoming telemetry packets yet. Send a webhook to see live data.</td></tr>';
          return;
        }

        for (var i = 0; i < logs.length; i++) {
          var t = logs[i];
          var decodedStr = typeof t.decodedPayload === "object" ? JSON.stringify(t.decodedPayload) : (t.decodedPayload || "--");
          var tr = document.createElement("tr");
          tr.className = "hover:bg-slate-950/40 transition";
          tr.innerHTML = '<td class="py-3 px-4 text-slate-400 text-[11px]">' + new Date(t.timestamp || t.createdAt).toLocaleTimeString() + '</td>' +
            '<td class="py-3 px-4 font-bold text-sky-400">' + (t.devEUI || "--") + '</td>' +
            '<td class="py-3 px-4 text-amber-400">p:' + (t.fPort || 1) + ' / c:' + (t.fCnt || 0) + '</td>' +
            '<td class="py-3 px-4 text-slate-300 max-w-xs truncate">' + (t.payloadHex || "--") + '</td>' +
            '<td class="py-3 px-4 text-emerald-400 max-w-sm truncate">' + decodedStr + '</td>' +
            '<td class="py-3 px-4 text-slate-400">' + (t.rssi !== undefined ? t.rssi + ' dBm' : '--') + ' / ' + (t.snr !== undefined ? t.snr + ' dB' : '--') + '</td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        console.error("loadTelemetry error:", err);
        var tbody = document.getElementById("telemetryTableBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-amber-400 font-sans">Could not load telemetry (' + err.message + ')</td></tr>';
      }
    }
    window.loadTelemetry = loadTelemetry;

    async function reloadDbConfig() {
      try {
        var res = await fetch("/database/reload", {
          method: "POST",
          headers: authHeaders(),
          credentials: "include"
        });
        var data = await res.json();
        showToast(data.message || "Database configuration reloaded successfully", "success");
        loadDatabaseHealth();
      } catch (err) {
        showToast("Failed to reload database config: " + err.message, "error");
      }
    }
    window.reloadDbConfig = reloadDbConfig;

    function openCreateUserModal() {
      var select = document.getElementById("newUserRoleId");
      select.innerHTML = '<option value="">Select a role...</option>';
      if (Array.isArray(allAvailableRoles)) {
        for (var i = 0; i < allAvailableRoles.length; i++) {
          var r = allAvailableRoles[i];
          select.innerHTML += '<option value="' + r.id + '">' + r.name + ' (' + r.code + ')</option>';
        }
      }
      var modal = document.getElementById("createUserModal");
      if (modal) modal.classList.add("active");
    }
    window.openCreateUserModal = openCreateUserModal;

    function closeCreateUserModal() {
      var modal = document.getElementById("createUserModal");
      if (modal) modal.classList.remove("active");
    }
    window.closeCreateUserModal = closeCreateUserModal;

    function openEditUserModal(userId) {
      var user = (allLoadedUsers || []).find(function(u) { return u.id === userId; });
      if (!user) return;

      document.getElementById("editUserId").value = user.id;
      document.getElementById("editUsernameDisplay").value = user.username + " (" + (user.email || "") + ")";
      document.getElementById("editUserActive").value = user.isActive ? "true" : "false";

      var select = document.getElementById("editUserRoleId");
      select.innerHTML = '<option value="">No role assigned</option>';
      var currentRoleId = user.roles && user.roles[0] ? user.roles[0].id : "";

      if (Array.isArray(allAvailableRoles)) {
        for (var i = 0; i < allAvailableRoles.length; i++) {
          var r = allAvailableRoles[i];
          var isSelected = r.id === currentRoleId ? " selected" : "";
          select.innerHTML += '<option value="' + r.id + '"' + isSelected + '>' + r.name + ' (' + r.code + ')</option>';
        }
      }

      var modal = document.getElementById("editUserModal");
      if (modal) modal.classList.add("active");
    }
    window.openEditUserModal = openEditUserModal;

    function closeEditUserModal() {
      var modal = document.getElementById("editUserModal");
      if (modal) modal.classList.remove("active");
    }
    window.closeEditUserModal = closeEditUserModal;

    function openCreateRoleModal() {
      var container = document.getElementById("newRolePermissionsContainer");
      container.innerHTML = "";
      if (Array.isArray(allAvailablePermissions)) {
        for (var i = 0; i < allAvailablePermissions.length; i++) {
          var p = allAvailablePermissions[i];
          container.innerHTML += '<label class="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">' +
            '<input type="checkbox" value="' + p.id + '" class="new-role-perm rounded border-slate-700 bg-slate-800 text-amber-500" />' +
            '<span class="font-mono text-[11px] text-amber-400/90">' + p.name + '</span>' +
            '<span class="text-slate-500 text-[10px]">(' + (p.description || p.module) + ')</span>' +
            '</label>';
        }
      }
      var modal = document.getElementById("createRoleModal");
      if (modal) modal.classList.add("active");
    }
    window.openCreateRoleModal = openCreateRoleModal;

    function closeCreateRoleModal() {
      var modal = document.getElementById("createRoleModal");
      if (modal) modal.classList.remove("active");
    }
    window.closeCreateRoleModal = closeCreateRoleModal;

    function openEditRoleModal(roleId) {
      var role = null;
      if (Array.isArray(allAvailableRoles)) {
        for (var i = 0; i < allAvailableRoles.length; i++) {
          if (allAvailableRoles[i].id === roleId) {
            role = allAvailableRoles[i];
            break;
          }
        }
      }
      if (!role) return;

      document.getElementById("editRoleId").value = role.id;
      document.getElementById("editRoleCode").value = role.code;
      document.getElementById("editRoleName").value = role.name;
      document.getElementById("editRoleDescription").value = role.description || "";

      var container = document.getElementById("editRolePermissionsContainer");
      container.innerHTML = "";
      var assignedIds = (role.permissions || []).map(function(p) { return p.id; });

      if (Array.isArray(allAvailablePermissions)) {
        for (var j = 0; j < allAvailablePermissions.length; j++) {
          var p = allAvailablePermissions[j];
          var isChecked = assignedIds.indexOf(p.id) !== -1;
          container.innerHTML += '<label class="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">' +
            '<input type="checkbox" value="' + p.id + '" ' + (isChecked ? "checked" : "") + ' class="edit-role-perm rounded border-slate-700 bg-slate-800 text-sky-500" />' +
            '<span class="font-mono text-[11px] text-sky-400/90">' + p.name + '</span>' +
            '<span class="text-slate-500 text-[10px]">(' + (p.description || p.module) + ')</span>' +
            '</label>';
        }
      }

      var modal = document.getElementById("editRoleModal");
      if (modal) modal.classList.add("active");
    }
    window.openEditRoleModal = openEditRoleModal;

    function closeEditRoleModal() {
      var modal = document.getElementById("editRoleModal");
      if (modal) modal.classList.remove("active");
    }
    window.closeEditRoleModal = closeEditRoleModal;

    function openRegisterDeviceModal() {
      var modal = document.getElementById("registerDeviceModal");
      if (modal) modal.classList.add("active");
    }
    window.openRegisterDeviceModal = openRegisterDeviceModal;

    function closeRegisterDeviceModal() {
      var modal = document.getElementById("registerDeviceModal");
      if (modal) modal.classList.remove("active");
    }
    window.closeRegisterDeviceModal = closeRegisterDeviceModal;

    async function deleteUser(id) {
      if (!confirm("Are you sure you want to delete this user?")) return;
      try {
        var res = await fetch("/users/" + id, {
          method: "DELETE",
          headers: authHeaders(),
          credentials: "include"
        });
        if (!res.ok) {
          var data = await res.json();
          throw new Error(data.message || "Delete failed");
        }
        showToast("User removed successfully", "success");
        loadUsers();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
    window.deleteUser = deleteUser;

    async function deleteRole(id) {
      if (!confirm("Are you sure you want to delete this role?")) return;
      try {
        var res = await fetch("/roles/" + id, {
          method: "DELETE",
          headers: authHeaders(),
          credentials: "include"
        });
        if (!res.ok) {
          var data = await res.json();
          throw new Error(data.message || "Delete role failed");
        }
        showToast("Role deleted successfully", "success");
        loadRoles();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
    window.deleteRole = deleteRole;

    function testDeviceDecoder(devEUI) {
      switchTab('decoder');
      var hexInput = document.getElementById("sandboxHex");
      if (hexInput) hexInput.focus();
    }
    window.testDeviceDecoder = testDeviceDecoder;

    function runSandboxDecode() {
      var code = document.getElementById("sandboxCode").value;
      var hex = document.getElementById("sandboxHex").value.trim().replace(/\\s+/g, "");
      var resultArea = document.getElementById("sandboxResult");

      try {
        var bytes = [];
        for (var c = 0; c < hex.length; c += 2) {
          bytes.push(parseInt(hex.substr(c, 2), 16));
        }

        var fn = new Function("bytes", "fPort", code + "; return decodeUplink(bytes, fPort);");
        var output = fn(bytes, 1);
        resultArea.textContent = JSON.stringify(output, null, 2);
        showToast("Decoder executed successfully", "success");
      } catch (err) {
        resultArea.textContent = "Decoder Error: " + err.message;
        showToast("Decoder Error: " + err.message, "error");
      }
    }
    window.runSandboxDecode = runSandboxDecode;

    // Attach form submit handlers
    function bindFormHandlers() {
      var createUserForm = document.getElementById("createUserForm");
      if (createUserForm) {
        createUserForm.onsubmit = async function(e) {
          e.preventDefault();
          var username = document.getElementById("newUsername").value.trim();
          var fullName = document.getElementById("newFullName").value.trim();
          var email = document.getElementById("newEmail").value.trim();
          var password = document.getElementById("newPassword").value;
          var userType = document.getElementById("newUserType").value;
          var roleId = document.getElementById("newUserRoleId").value;

          try {
            var res = await fetch("/users", {
              method: "POST",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({
                username: username,
                fullName: fullName,
                email: email,
                password: password,
                userType: userType,
                roleIds: roleId ? [roleId] : []
              })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create user");
            showToast("User account '" + username + "' created successfully", "success");
            closeCreateUserModal();
            createUserForm.reset();
            loadUsers();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }

      var editUserForm = document.getElementById("editUserForm");
      if (editUserForm) {
        editUserForm.onsubmit = async function(e) {
          e.preventDefault();
          var id = document.getElementById("editUserId").value;
          var roleId = document.getElementById("editUserRoleId").value;
          var isActive = document.getElementById("editUserActive").value === "true";

          try {
            var res = await fetch("/users/" + id + "/permissions", {
              method: "PUT",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({
                isActive: isActive,
                roleIds: roleId ? [roleId] : []
              })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update user");
            showToast("User updated successfully", "success");
            closeEditUserModal();
            loadUsers();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }

      var createRoleForm = document.getElementById("createRoleForm");
      if (createRoleForm) {
        createRoleForm.onsubmit = async function(e) {
          e.preventDefault();
          var code = document.getElementById("newRoleCode").value.trim().toUpperCase();
          var name = document.getElementById("newRoleName").value.trim();
          var description = document.getElementById("newRoleDescription").value.trim();
          var checkBoxes = document.querySelectorAll(".new-role-perm:checked");
          var checkedPerms = [];
          for (var i = 0; i < checkBoxes.length; i++) {
            checkedPerms.push(checkBoxes[i].value);
          }

          try {
            var res = await fetch("/roles", {
              method: "POST",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({ code: code, name: name, description: description, permissionIds: checkedPerms })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create role");
            showToast("Role '" + name + "' created successfully", "success");
            closeCreateRoleModal();
            createRoleForm.reset();
            loadRoles();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }

      var editRoleForm = document.getElementById("editRoleForm");
      if (editRoleForm) {
        editRoleForm.onsubmit = async function(e) {
          e.preventDefault();
          var id = document.getElementById("editRoleId").value;
          var name = document.getElementById("editRoleName").value.trim();
          var description = document.getElementById("editRoleDescription").value.trim();
          var checkBoxes = document.querySelectorAll(".edit-role-perm:checked");
          var checkedPerms = [];
          for (var i = 0; i < checkBoxes.length; i++) {
            checkedPerms.push(checkBoxes[i].value);
          }

          try {
            var res = await fetch("/roles/" + id, {
              method: "PUT",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({ name: name, description: description, permissionIds: checkedPerms })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update role");
            showToast("Role '" + name + "' updated successfully", "success");
            closeEditRoleModal();
            loadRoles();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }

      var registerDeviceForm = document.getElementById("registerDeviceForm");
      if (registerDeviceForm) {
        registerDeviceForm.onsubmit = async function(e) {
          e.preventDefault();
          var devEUI = document.getElementById("newDevEUI").value.trim().toUpperCase();
          var name = document.getElementById("newDeviceName").value.trim();
          var activationType = document.getElementById("newActivationType").value;
          var appKey = document.getElementById("newAppKey").value.trim();

          try {
            var res = await fetch("/lorawan/devices", {
              method: "POST",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({ devEUI: devEUI, name: name, activationType: activationType, appKey: appKey || undefined })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to register device");
            showToast("Device '" + name + "' registered successfully", "success");
            closeRegisterDeviceModal();
            registerDeviceForm.reset();
            loadDevices();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }
    }

    // Check active session on load
    async function initPage() {
      bindFormHandlers();

      var token = getAuthToken();
      if (!token) {
        window.location.replace("/login?cleared=1");
        return;
      }

      try {
        var rawUser = localStorage.getItem("lorawan_user");
        if (rawUser && rawUser.startsWith("{")) {
          var storedUser = JSON.parse(rawUser);
          if (storedUser) updateUserNav(storedUser);
        }

        var res = await fetch("/auth/session", { headers: authHeaders(), credentials: "include" });
        if (res.ok) {
          var user = await res.json();
          try {
            localStorage.setItem("lorawan_user", JSON.stringify(user));
          } catch(e) {}
          updateUserNav(user);
        } else if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
      } catch (err) {
        console.warn("Session check notice:", err);
      }

      // Check URL Hash to restore active tab
      var hash = window.location.hash.replace("#", "").trim();
      if (hash && tabMetadata[hash]) {
        switchTab(hash);
      } else {
        switchTab("overview");
      }

      loadUsers();
      loadRoles();
      loadDatabaseHealth();
      loadDevices();
    }

    // Run after DOM content is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initPage);
    } else {
      initPage();
    }
  </script>
</body>
</html>
`;
