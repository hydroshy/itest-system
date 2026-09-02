export const CONTROL_PANEL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Control Panel - Daviteq LoRaWAN Platform</title>
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
    }
    .glass-card:hover {
      border-color: rgba(56, 189, 248, 0.3);
    }
    .tab-btn {
      padding: 0.45rem 0.85rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.8125rem;
      color: #94a3b8;
      transition: all 0.15s ease;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      user-select: none;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: #ffffff;
      background: rgba(30, 41, 59, 0.6);
    }
    .tab-btn.active {
      color: #38bdf8 !important;
      background: rgba(14, 165, 233, 0.12) !important;
      border: 1px solid rgba(56, 189, 248, 0.35) !important;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
    }
    [v-cloak] { display: none !important; }
    .modal-backdrop {
      background: rgba(2, 6, 23, 0.85);
      backdrop-filter: blur(6px);
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased">
  <div id="app" v-cloak class="flex-1 flex flex-col">
    
    <!-- TOP APP BAR -->
    <header class="glass-header sticky top-0 z-40 px-4 sm:px-6 h-14 flex items-center justify-between">
      <!-- Left Brand -->
      <div class="flex items-center gap-4">
        <a href="/control-panel" class="flex items-center gap-2.5 text-white font-extrabold text-sm tracking-tight text-decoration-none">
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center p-0.5 shadow-inner overflow-hidden">
            <img src="/images/logo-navbar.png" onerror="this.onerror=null; this.src='/images/logo-full.png'; this.onerror=function(){this.src='/images/favicon.png';};" class="w-full h-full object-contain rounded-md" alt="Daviteq Logo" />
          </div>
          <div class="leading-none">
            <div class="flex items-center gap-1.5">
              <span><span class="text-sky-400">DAVITEQ</span> IoT</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">Admin</span>
            </div>
            <span class="text-[10px] text-slate-400 font-normal">Control Panel</span>
          </div>
        </a>
      </div>

      <!-- Center / Horizontal Pill Tabs (All Admin Tabs including Network Servers & Feature Modules) -->
      <nav class="hidden md:flex items-center gap-1 overflow-x-auto custom-scroll py-1">
        <button @click="activeTab = 'overview'" :class="{ active: activeTab === 'overview' }" class="tab-btn">
          <i class="fa-solid fa-chart-pie text-xs"></i> <span>Overview</span>
        </button>

        <button @click="activeTab = 'network-servers'" :class="{ active: activeTab === 'network-servers' }" class="tab-btn">
          <i class="fa-solid fa-tower-broadcast text-xs text-sky-400"></i> <span>Network Servers</span>
          <span v-if="networkServersList.length" class="ml-1 px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono">{{ networkServersList.length }}</span>
        </button>

        <button @click="activeTab = 'modules'" :class="{ active: activeTab === 'modules' }" class="tab-btn">
          <i class="fa-solid fa-cubes text-xs"></i> <span>Modules</span>
          <span v-if="modulesList.length" class="ml-1 px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono">{{ modulesList.length }}</span>
        </button>

        <button @click="activeTab = 'roles'" :class="{ active: activeTab === 'roles' }" class="tab-btn">
          <i class="fa-solid fa-shield-halved text-xs"></i> <span>Roles</span>
        </button>

        <button @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }" class="tab-btn">
          <i class="fa-solid fa-users text-xs"></i> <span>Users</span>
        </button>

        <button @click="activeTab = 'database'" :class="{ active: activeTab === 'database' }" class="tab-btn">
          <i class="fa-solid fa-database text-xs"></i> <span>Database</span>
        </button>

        <button @click="activeTab = 'devices'" :class="{ active: activeTab === 'devices' }" class="tab-btn">
          <i class="fa-solid fa-microchip text-xs"></i> <span>Devices</span>
        </button>

        <button @click="activeTab = 'telemetry'" :class="{ active: activeTab === 'telemetry' }" class="tab-btn">
          <i class="fa-solid fa-wave-square text-xs"></i> <span>Telemetry</span>
          <span v-if="telemetryList.length" class="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">{{ telemetryList.length }}</span>
        </button>

        <button @click="activeTab = 'webhooks'" :class="{ active: activeTab === 'webhooks' }" class="tab-btn">
          <i class="fa-solid fa-satellite-dish text-xs"></i> <span>Webhooks</span>
        </button>

        <button @click="activeTab = 'decoder'" :class="{ active: activeTab === 'decoder' }" class="tab-btn">
          <i class="fa-solid fa-code text-xs"></i> <span>Decoder</span>
        </button>
      </nav>

      <!-- Right User Profile & Switch to Dashboard & Logout -->
      <div class="flex items-center gap-3">
        <a href="/dashboard" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/20 transition flex items-center gap-1.5 text-decoration-none">
          <i class="fa-solid fa-layer-group text-xs"></i>
          <span>Dashboard</span>
        </a>

        <div class="hidden sm:block text-right leading-tight">
          <div class="text-xs font-bold text-slate-200">{{ currentUser.fullName || currentUser.username || 'Administrator' }}</div>
          <div class="text-[10px] font-mono font-bold text-emerald-400">
            {{ isSuperAdmin ? 'SUPER_ADMIN' : (currentUser.userType || 'ADMIN') }}
          </div>
        </div>

        <button @click="handleLogout" title="Logout" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-right-from-bracket text-xs"></i>
          <span>Logout</span>
        </button>
      </div>
    </header>

    <!-- MOBILE NAVIGATION TABS -->
    <div class="md:hidden flex items-center gap-1 overflow-x-auto custom-scroll p-2 bg-slate-950/80 border-b border-slate-800">
      <button @click="activeTab = 'overview'" :class="{ active: activeTab === 'overview' }" class="tab-btn text-xs py-1 px-2.5">Overview</button>
      <button @click="activeTab = 'network-servers'" :class="{ active: activeTab === 'network-servers' }" class="tab-btn text-xs py-1 px-2.5">Network Servers</button>
      <button @click="activeTab = 'modules'" :class="{ active: activeTab === 'modules' }" class="tab-btn text-xs py-1 px-2.5">Modules</button>
      <button @click="activeTab = 'roles'" :class="{ active: activeTab === 'roles' }" class="tab-btn text-xs py-1 px-2.5">Roles</button>
      <button @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }" class="tab-btn text-xs py-1 px-2.5">Users</button>
      <button @click="activeTab = 'database'" :class="{ active: activeTab === 'database' }" class="tab-btn text-xs py-1 px-2.5">Database</button>
      <button @click="activeTab = 'devices'" :class="{ active: activeTab === 'devices' }" class="tab-btn text-xs py-1 px-2.5">Devices</button>
      <button @click="activeTab = 'telemetry'" :class="{ active: activeTab === 'telemetry' }" class="tab-btn text-xs py-1 px-2.5">Telemetry</button>
      <button @click="activeTab = 'webhooks'" :class="{ active: activeTab === 'webhooks' }" class="tab-btn text-xs py-1 px-2.5">Webhooks</button>
      <button @click="activeTab = 'decoder'" :class="{ active: activeTab === 'decoder' }" class="tab-btn text-xs py-1 px-2.5">Decoder</button>
    </div>

    <!-- MAIN BODY CONTAINER -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      <!-- TAB 1: OVERVIEW -->
      <div v-show="activeTab === 'overview'" class="space-y-6">
        <!-- Metric Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div class="glass-card rounded-xl p-4 space-y-1">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Platform Runtime</span>
              <i class="fa-solid fa-server text-sky-400 text-sm"></i>
            </div>
            <div class="text-xl font-extrabold text-white flex items-center gap-2 pt-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
            </div>
            <div class="text-[11px] text-slate-500">NestJS Core Engine</div>
          </div>

          <div class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-sky-500/40 transition" @click="activeTab = 'network-servers'">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Network Servers</span>
              <i class="fa-solid fa-tower-broadcast text-sky-400 text-sm"></i>
            </div>
            <div class="text-xl font-extrabold text-white pt-1">{{ networkServersList.length || '--' }}</div>
            <div class="text-[11px] text-slate-500">
              TP: {{ networkServersList.filter(s => s.type === 'THINGPARK').length }} | CS: {{ networkServersList.filter(s => s.type === 'CHIRPSTACK').length }}
            </div>
          </div>

          <div class="glass-card rounded-xl p-4 space-y-1">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Dashboard Modules</span>
              <i class="fa-solid fa-cubes text-sky-400 text-sm"></i>
            </div>
            <div class="text-xl font-extrabold text-white pt-1">{{ modulesList.length || '--' }}</div>
            <div class="text-[11px] text-slate-500">{{ modulesList.filter(m => m.isActive !== false).length }} Active on User Portal</div>
          </div>

          <div class="glass-card rounded-xl p-4 space-y-1">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Configured Roles</span>
              <i class="fa-solid fa-shield-halved text-amber-400 text-sm"></i>
            </div>
            <div class="text-xl font-extrabold text-white pt-1">{{ rolesList.length || '--' }}</div>
            <div class="text-[11px] text-slate-500">RBAC Role Definitions</div>
          </div>

          <div class="glass-card rounded-xl p-4 space-y-1">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Database Pool</span>
              <i class="fa-solid fa-database text-indigo-400 text-sm"></i>
            </div>
            <div class="text-xl font-extrabold text-white pt-1">{{ dbHealth.totalConnections || 1 }}</div>
            <div class="text-[11px] text-slate-500 font-mono">core_db (dvt)</div>
          </div>
        </div>

        <!-- Architecture & Navigation Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="glass-card rounded-xl p-5 space-y-3">
            <div class="flex items-center gap-2 text-sm font-bold text-white">
              <i class="fa-solid fa-bolt text-sky-400"></i> Platform Architecture &amp; Connectivity
            </div>
            <p class="text-xs text-slate-400 leading-relaxed">
              Daviteq LoRaWAN Application Server provides enterprise-grade telemetry ingestion, dynamic PostgreSQL table routing, and seamless integration with ThingPark Wireless and ChirpStack Network Servers.
            </p>
            <div class="grid grid-cols-2 gap-2.5 pt-2">
              <div class="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                <span class="text-[11px] text-slate-500 block">Network Servers</span>
                <span class="text-xs font-bold text-sky-400 mt-0.5 block">ThingPark &amp; ChirpStack</span>
              </div>
              <div class="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                <span class="text-[11px] text-slate-500 block">Access Control</span>
                <span class="text-xs font-bold text-emerald-400 mt-0.5 block">5-Table RBAC Model</span>
              </div>
            </div>
          </div>

          <div class="glass-card rounded-xl p-5 space-y-3">
            <div class="flex items-center gap-2 text-sm font-bold text-white">
              <i class="fa-solid fa-link text-emerald-400"></i> Quick Admin Actions
            </div>
            <div class="space-y-2 text-xs">
              <button @click="activeTab = 'network-servers'" class="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-sky-500/40 transition cursor-pointer text-slate-300 font-medium">
                <span class="flex items-center gap-2"><i class="fa-solid fa-tower-broadcast text-sky-400"></i> Manage Network Servers &amp; Region Profiles (ThingPark / ChirpStack)</span>
                <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
              </button>
              <button @click="activeTab = 'modules'" class="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-sky-500/40 transition cursor-pointer text-slate-300 font-medium">
                <span class="flex items-center gap-2"><i class="fa-solid fa-cubes text-sky-400"></i> Manage Dashboard Modules &amp; Role Access</span>
                <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
              </button>
              <button @click="activeTab = 'roles'" class="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer text-slate-300 font-medium">
                <span class="flex items-center gap-2"><i class="fa-solid fa-shield-halved text-amber-400"></i> Role &amp; Permissions Matrix (RBAC)</span>
                <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
              </button>
              <button @click="activeTab = 'users'" class="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer text-slate-300 font-medium">
                <span class="flex items-center gap-2"><i class="fa-solid fa-users text-emerald-400"></i> User Accounts &amp; Role Assignment</span>
                <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: NETWORK SERVERS MANAGEMENT (ThingPark & ChirpStack) -->
      <div v-show="activeTab === 'network-servers'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-tower-broadcast text-sky-400"></i> LoRaWAN Network Server Management
                </h2>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/25">
                  {{ networkServersList.length }} Configured
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Configure ThingPark Wireless and ChirpStack Network Servers with API endpoints, Route References, and Region Profiles.
              </p>
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

          <!-- Filters & Search Bar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
            <div class="flex items-center gap-1.5 w-full sm:w-auto">
              <span class="text-xs text-slate-400 mr-1">Filter Type:</span>
              <button @click="filterServerType = 'ALL'" :class="filterServerType === 'ALL' ? 'bg-sky-500 text-white font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'" class="px-2.5 py-1 rounded-md text-xs transition cursor-pointer">
                All ({{ networkServersList.length }})
              </button>
              <button @click="filterServerType = 'THINGPARK'" :class="filterServerType === 'THINGPARK' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'" class="px-2.5 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1">
                <i class="fa-solid fa-satellite text-[10px]"></i> ThingPark ({{ networkServersList.filter(s => s.type === 'THINGPARK').length }})
              </button>
              <button @click="filterServerType = 'CHIRPSTACK'" :class="filterServerType === 'CHIRPSTACK' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'" class="px-2.5 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1">
                <i class="fa-solid fa-signal text-[10px]"></i> ChirpStack ({{ networkServersList.filter(s => s.type === 'CHIRPSTACK').length }})
              </button>
            </div>

            <div class="w-full sm:w-64">
              <input v-model="searchServerQuery" type="text" placeholder="Search servers or regions..." class="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500" />
            </div>
          </div>
        </div>

        <!-- Network Server Cards Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div v-if="filteredNetworkServers.length === 0" class="col-span-full p-8 text-center glass-card rounded-xl text-slate-500 space-y-2">
            <i class="fa-solid fa-tower-broadcast text-3xl text-slate-600"></i>
            <div class="text-sm font-semibold text-slate-400">No Network Servers Found</div>
            <div class="text-xs">Click "Add Network Server" above to configure your first ThingPark or ChirpStack server.</div>
          </div>

          <div v-for="srv in filteredNetworkServers" :key="srv.id" class="glass-card rounded-xl p-5 space-y-4 border transition hover:border-slate-700">
            <!-- Header of Card -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-inner" :class="srv.type === 'THINGPARK' ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'">
                  <i :class="srv.type === 'THINGPARK' ? 'fa-solid fa-satellite' : 'fa-solid fa-signal'"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-white text-sm">{{ srv.name }}</h3>
                    <span v-if="srv.isDefault" class="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">DEFAULT</span>
                  </div>
                  <div class="text-xs text-slate-400 mt-0.5">{{ srv.description || (srv.type === 'THINGPARK' ? 'Actility ThingPark Wireless Integration' : 'ChirpStack v4 LNS Integration') }}</div>
                </div>
              </div>

              <div class="flex flex-col items-end gap-1">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" :class="srv.type === 'THINGPARK' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'">
                  {{ srv.type === 'THINGPARK' ? 'ThingPark' : 'ChirpStack' }}
                </span>
                <span class="text-[10px] font-mono" :class="srv.status === 'ONLINE' ? 'text-emerald-400' : 'text-slate-400'">
                  <span class="inline-block w-1.5 h-1.5 rounded-full mr-1" :class="srv.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-500'"></span>{{ srv.status || 'ONLINE' }}
                </span>
              </div>
            </div>

            <!-- Server Details Grid -->
            <div class="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">API Endpoint:</span>
                <span class="font-mono text-slate-200 truncate max-w-[220px]" :title="srv.apiUrl">{{ srv.apiUrl || '(None / Webhook-only)' }}</span>
              </div>

              <!-- Specific ThingPark vs ChirpStack Routing Details -->
              <div v-if="srv.type === 'THINGPARK'" class="flex items-center justify-between">
                <span class="text-slate-400">Default RouteRef:</span>
                <span class="font-mono text-cyan-400 font-bold">{{ srv.routeRef || 'DAVITEQ_TP_DEFAULT' }}</span>
              </div>
              <div v-else class="flex items-center justify-between">
                <span class="text-slate-400">API Token:</span>
                <span class="font-mono text-emerald-400">{{ srv.apiKey ? '••••••••••••• (Configured)' : '(Not set)' }}</span>
              </div>

              <!-- Connected Fleet Stats -->
              <div class="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span class="text-slate-400">Linked Fleet:</span>
                <div class="flex items-center gap-2 font-mono text-[11px]">
                  <span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20"><i class="fa-solid fa-microchip mr-1"></i>{{ srv.deviceCount || 0 }} Devices</span>
                  <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"><i class="fa-solid fa-tower-cell mr-1"></i>{{ srv.gatewayCount || 0 }} Gateways</span>
                </div>
              </div>

              <!-- Webhook Receiver URL -->
              <div class="pt-1 border-t border-slate-800/60">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-slate-400">Ingestion Webhook:</span>
                  <button @click="copyUrl(srv.type === 'THINGPARK' ? '/lorawan/webhook/thingpark' : '/lorawan/webhook/chirpstack')" class="text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1">
                    <i class="fa-solid fa-copy text-[10px]"></i> Copy Ingestion URL
                  </button>
                </div>
                <div class="mt-1 px-2.5 py-1 bg-slate-900 rounded font-mono text-[10px] text-slate-300 flex items-center justify-between">
                  <span>POST {{ srv.type === 'THINGPARK' ? '/lorawan/webhook/thingpark' : '/lorawan/webhook/chirpstack' }}</span>
                </div>
              </div>
            </div>

            <!-- Region Profiles Section -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <i class="fa-solid fa-globe text-sky-400 text-xs"></i>
                  <span>Region Profiles ({{ srv.regionProfiles?.length || 0 }}):</span>
                </div>
              </div>

              <div class="space-y-1.5 max-h-40 overflow-y-auto custom-scroll pr-1">
                <div v-if="!srv.regionProfiles || srv.regionProfiles.length === 0" class="text-[11px] text-slate-500 italic p-2 text-center bg-slate-950/40 rounded-lg">
                  No region profiles configured. Click Edit to add region profiles.
                </div>
                <div v-for="rp in srv.regionProfiles" :key="rp.id" class="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono text-[10px] font-bold">{{ rp.region }}</span>
                    <div class="leading-tight">
                      <div class="font-semibold text-slate-200 text-xs">{{ rp.name }}</div>
                      <div class="text-[10px] text-slate-400 font-mono">
                        <span v-if="srv.type === 'THINGPARK'" class="text-cyan-400">RouteRef: {{ rp.routeRef || srv.routeRef || 'N/A' }}</span>
                        <span v-else class="text-emerald-400">Profile ID: {{ rp.profileId || 'N/A' }}</span>
                        <span v-if="rp.frequencyBand" class="text-slate-500 ml-1.5">({{ rp.frequencyBand }})</span>
                      </div>
                    </div>
                  </div>
                  <span class="w-2 h-2 rounded-full" :class="rp.isActive !== false ? 'bg-emerald-500' : 'bg-slate-600'" :title="rp.isActive !== false ? 'Active' : 'Disabled'"></span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-800">
              <button @click="testNetworkServerConnection(srv)" :disabled="testingServerId === srv.id" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50">
                <i :class="testingServerId === srv.id ? 'fa-solid fa-spinner fa-spin text-sky-400' : 'fa-solid fa-plug-circle-check text-sky-400'"></i>
                <span>{{ testingServerId === srv.id ? 'Testing...' : 'Test Connection' }}</span>
              </button>

              <div class="flex items-center gap-2">
                <button @click="openEditNetworkServerDialog(srv)" class="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button @click="deleteNetworkServer(srv.id)" class="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1 cursor-pointer transition" title="Delete Network Server">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: MODULES MANAGEMENT (New Feature Module Management for Admin) -->
      <div v-show="activeTab === 'modules'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-cubes text-sky-400"></i> Dashboard Feature Modules Management
                </h2>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/25">
                  {{ modulesList.length }} Modules
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Add, customize, and configure role-based access for modules appearing on User Dashboard</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="fetchModules" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
              <button @click="resetModulesDefaults" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-rotate-left"></i> Reset Defaults
              </button>
              <button @click="openCreateModuleDialog" class="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-plus"></i> Add Module
              </button>
            </div>
          </div>

          <!-- Module Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="mod in modulesList"
              :key="mod.id"
              class="p-4 bg-slate-950/75 rounded-2xl border transition duration-150 flex flex-col justify-between space-y-3 group"
              :class="mod.isActive !== false ? 'border-slate-800 hover:border-sky-500/40' : 'border-red-500/20 opacity-60 bg-red-950/10'"
            >
              <div class="space-y-3">
                <!-- Header Icon & Status Switch -->
                <div class="flex items-center justify-between">
                  <div :class="'bg-gradient-to-br ' + mod.color" class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md text-base">
                    <i :class="mod.icon"></i>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {{ mod.category }}
                    </span>
                    <button
                      @click="toggleModuleActive(mod)"
                      :title="mod.isActive !== false ? 'Active (Click to disable)' : 'Inactive (Click to enable)'"
                      :class="mod.isActive !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'"
                      class="px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition"
                    >
                      {{ mod.isActive !== false ? 'ACTIVE' : 'OFF' }}
                    </button>
                  </div>
                </div>

                <!-- Title & Slug -->
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-sky-400 transition">{{ mod.title }}</h3>
                  <div class="text-[10px] font-mono text-slate-500 mt-0.5">ID: {{ mod.id }}</div>
                  <p class="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{{ mod.description }}</p>
                </div>

                <!-- Role Access Badges -->
                <div class="pt-2 border-t border-slate-800/80 space-y-1">
                  <div class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Permitted Roles:</div>
                  <div class="flex flex-wrap gap-1">
                    <template v-if="mod.allowedRoleCodes && mod.allowedRoleCodes.length">
                      <span v-for="rc in mod.allowedRoleCodes" :key="rc" class="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono font-bold">
                        {{ rc }}
                      </span>
                    </template>
                    <template v-else-if="mod.requiredPermission">
                      <span class="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono">
                        {{ mod.requiredPermission }}
                      </span>
                    </template>
                    <span v-else class="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                      All Users
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span class="text-[11px] font-mono text-slate-500">{{ mod.badge || mod.status }}</span>
                <div class="flex items-center gap-1.5">
                  <button @click="openEditModuleDialog(mod)" class="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 text-xs font-semibold cursor-pointer">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                  </button>
                  <button @click="deleteModule(mod.id)" class="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 text-xs font-semibold cursor-pointer">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: ROLES & RBAC MATRIX (Visual & Intuitive Redesign) -->
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

                <!-- Privilege Counter & Unlocked Modules -->
                <div class="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                  <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Privileges Enabled:</span>
                    <strong class="text-white font-mono">{{ r.permissions ? r.permissions.length : 0 }} / {{ allPermissions.length }}</strong>
                  </div>
                  <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-gradient-to-r from-amber-500 to-sky-500 h-1.5 rounded-full" :style="{ width: ((r.permissions ? r.permissions.length : 0) / (allPermissions.length || 1) * 100) + '%' }"></div>
                  </div>
                </div>

                <!-- Unlocked Dashboard Modules Tag Chips -->
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

              <!-- Card Action Footer -->
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

          <!-- Detailed Role Table -->
          <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg mt-4">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3.5">Role Code</th>
                  <th class="py-2.5 px-3.5">Display Name</th>
                  <th class="py-2.5 px-3.5">Description</th>
                  <th class="py-2.5 px-3.5">Assigned Permissions</th>
                  <th class="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-for="r in rolesList" :key="r.id" class="hover:bg-slate-800/30 transition">
                  <td :class="r.code === 'SUPER_ADMIN' ? 'text-emerald-400' : 'text-amber-400'" class="py-2.5 px-3.5 font-mono font-bold">{{ r.code }}</td>
                  <td class="py-2.5 px-3.5 font-bold text-white">{{ r.name }}</td>
                  <td class="py-2.5 px-3.5 text-slate-400">{{ r.description || '--' }}</td>
                  <td class="py-2.5 px-3.5">
                    <span v-for="p in (r.permissions || []).slice(0, 6)" :key="p.id" class="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] mr-1 mb-1 border border-slate-700">
                      {{ p.name }}
                    </span>
                    <span v-if="(r.permissions || []).length > 6" class="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[10px] border border-amber-500/20 font-bold">
                      +{{ (r.permissions || []).length - 6 }} more
                    </span>
                  </td>
                  <td class="py-2.5 px-3.5 text-right space-x-1">
                    <template v-if="r.code !== 'SUPER_ADMIN'">
                      <button @click="openEditRoleDialog(r)" class="px-2 py-0.8 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[11px] font-semibold cursor-pointer">Edit</button>
                      <button @click="deleteRole(r.id)" class="px-2 py-0.8 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-semibold cursor-pointer">Delete</button>
                    </template>
                    <span v-else class="text-slate-600 font-mono text-[10px]">Immutable</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: USERS -->
      <div v-show="activeTab === 'users'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-users text-sky-400"></i> User Directory
              </h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Manage administrative and operator accounts</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="fetchUsers" :disabled="loadingUsers" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <i :class="loadingUsers ? 'fa-spin' : ''" class="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
              <button @click="openCreateUserDialog" class="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer">
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

      <!-- TAB 5: DATABASE HEALTH -->
      <div v-show="activeTab === 'database'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-heart-pulse text-emerald-400"></i> Visual Database Health & Metrics
                </h2>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono font-medium">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  core_db &bull; ONLINE
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Real-time status of PostgreSQL connection pool and latency</p>
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
            <div v-for="(conn, key) in dbHealth.connections" :key="key" class="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
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
                <tr v-for="(stat, tableName) in dbHealth.tableStats" :key="tableName" class="hover:bg-slate-800/30 transition">
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

      <!-- TAB 6: DEVICES -->
      <div v-show="activeTab === 'devices'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-microchip text-sky-400"></i> LoRaWAN Device Fleet
              </h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Registered End Devices and decoder script assignments</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="fetchDevices" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
              <button @click="openRegisterDeviceDialog" class="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer">
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
                  <th class="py-2.5 px-3.5">Network Server</th>
                  <th class="py-2.5 px-3.5">Activation</th>
                  <th class="py-2.5 px-3.5">Decoder Script</th>
                  <th class="py-2.5 px-3.5">Status</th>
                  <th class="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-if="devicesList.length === 0">
                  <td colspan="7" class="py-6 text-center text-slate-500">No LoRaWAN devices registered.</td>
                </tr>
                <tr v-for="d in devicesList" :key="d.id || d.devEUI" class="hover:bg-slate-800/30 transition">
                  <td class="py-2.5 px-3.5 font-mono font-bold text-sky-400">{{ d.devEUI }}</td>
                  <td class="py-2.5 px-3.5 font-bold text-white">{{ d.name || '--' }}</td>
                  <td class="py-2.5 px-3.5">
                    <span v-if="d.networkServer" class="px-2 py-0.5 rounded text-[10px] font-bold" :class="d.networkServer.type === 'THINGPARK' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'">
                      {{ d.networkServer.name }}
                    </span>
                    <span v-else class="text-slate-500 text-[11px]">Unassigned</span>
                  </td>
                  <td class="py-2.5 px-3.5"><span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">{{ d.activationMode || d.activationType || 'OTAA' }}</span></td>
                  <td class="py-2.5 px-3.5">
                    <span :class="d.payloadFormatterScript ? 'text-emerald-400' : 'text-slate-500'" class="text-[11px] font-medium">
                      <i :class="d.payloadFormatterScript ? 'fa-code' : 'fa-minus'" class="fa-solid mr-1"></i>
                      {{ d.payloadFormatterScript ? 'Configured' : 'None' }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3.5">
                    <span :class="d.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'" class="px-2 py-0.5 rounded-full text-[10px] font-bold border">
                      {{ d.isActive ? 'ACTIVE' : 'INACTIVE' }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3.5 text-right">
                    <button @click="testDevice(d)" class="px-2.5 py-0.8 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[11px] font-semibold cursor-pointer">Test Payload</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 7: TELEMETRY -->
      <div v-show="activeTab === 'telemetry'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-wave-square text-indigo-400"></i> Live Telemetry Stream
              </h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Real-time incoming packets from ChirpStack, ThingPark, and Webhooks</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="fetchTelemetry" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-arrows-rotate"></i> Refresh Telemetry
              </button>
            </div>
          </div>

          <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-950/80 text-slate-400 font-sans font-semibold border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3.5">Timestamp</th>
                  <th class="py-2.5 px-3.5">DevEUI</th>
                  <th class="py-2.5 px-3.5">Port / FCnt</th>
                  <th class="py-2.5 px-3.5">Raw Hex</th>
                  <th class="py-2.5 px-3.5">Decoded JSON</th>
                  <th class="py-2.5 px-3.5">RSSI / SNR</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-if="telemetryList.length === 0">
                  <td colspan="6" class="py-6 text-center text-slate-500 font-sans">No incoming telemetry packets yet. Send a webhook to see live data.</td>
                </tr>
                <tr v-for="t in telemetryList" :key="t.id" class="hover:bg-slate-800/30 transition">
                  <td class="py-2.5 px-3.5 text-slate-400 text-[11px] font-sans">{{ formatTime(t.timestamp || t.createdAt) }}</td>
                  <td class="py-2.5 px-3.5 font-bold text-sky-400">{{ t.devEUI }}</td>
                  <td class="py-2.5 px-3.5 text-amber-400">p:{{ t.fPort || 1 }} / c:{{ t.fCnt || 0 }}</td>
                  <td class="py-2.5 px-3.5 text-slate-300 max-w-xs truncate">{{ t.payloadHex || '--' }}</td>
                  <td class="py-2.5 px-3.5 text-emerald-400 max-w-sm truncate">{{ formatDecoded(t.decodedPayload) }}</td>
                  <td class="py-2.5 px-3.5 text-slate-400 font-sans">{{ t.rssi !== undefined ? t.rssi + ' dBm' : '--' }} / {{ t.snr !== undefined ? t.snr + ' dB' : '--' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 8: WEBHOOKS -->
      <div v-show="activeTab === 'webhooks'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div>
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-satellite-dish text-sky-400"></i> Network Server Webhook Ingestion
            </h2>
            <p class="text-[11px] text-slate-400 mt-0.5">Configure these HTTP endpoints on your Network Server (ChirpStack v4 or ThingPark Wireless):</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <div class="flex items-center justify-between text-sky-400 font-bold font-sans">
                <span>ChirpStack v4 Ingestion</span>
                <span class="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px]">POST / JSON</span>
              </div>
              <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 flex items-center justify-between">
                <span>POST /lorawan/webhook/chirpstack</span>
                <button @click="copyUrl('/lorawan/webhook/chirpstack')" class="text-sky-400 hover:text-sky-300 ml-2 cursor-pointer font-sans text-xs">Copy</button>
              </div>
              <p class="text-[11px] text-slate-400 font-sans">Supports ChirpStack uplink events, deduplication, and payload parsing.</p>
            </div>

            <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <div class="flex items-center justify-between text-emerald-400 font-bold font-sans">
                <span>ThingPark Wireless Ingestion</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px]">POST / JSON</span>
              </div>
              <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 flex items-center justify-between">
                <span>POST /lorawan/webhook/thingpark</span>
                <button @click="copyUrl('/lorawan/webhook/thingpark')" class="text-emerald-400 hover:text-emerald-300 ml-2 cursor-pointer font-sans text-xs">Copy</button>
              </div>
              <p class="text-[11px] text-slate-400 font-sans">Supports Actility ThingPark Wireless DX packets and hex payloads.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 9: DECODER SANDBOX -->
      <div v-show="activeTab === 'decoder'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div>
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-code text-purple-400"></i> Payload Formatter Sandbox
            </h2>
            <p class="text-[11px] text-slate-400 mt-0.5">Test JavaScript decoder functions on raw hex bytes:</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
            <div class="space-y-1.5">
              <label class="block text-xs font-sans font-semibold text-slate-300">JavaScript Decoder Function</label>
              <textarea v-model="sandboxCode" rows="9" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-sans font-semibold text-slate-300">Test Hex String</label>
              <div class="flex gap-2">
                <input v-model="sandboxHex" type="text" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs" />
                <button @click="runSandboxDecode" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-sans font-bold rounded-xl transition cursor-pointer">Decode</button>
              </div>
              <label class="block text-xs font-sans font-semibold text-slate-300 pt-1">Decoded JSON Output</label>
              <pre class="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 overflow-auto text-xs">{{ sandboxResult }}</pre>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- MODAL: ADD / EDIT NETWORK SERVER (ThingPark & ChirpStack) -->
    <div v-if="networkServerDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-tower-broadcast text-sky-400"></i>
            {{ isEditingNetworkServer ? 'Configure Network Server' : 'Add New LoRaWAN Network Server' }}
          </h3>
          <button @click="networkServerDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="submitNetworkServerForm" class="space-y-4 text-xs">
          <!-- Step 1: Name & Type Selector -->
          <div class="space-y-2">
            <label class="block font-semibold text-slate-200">Network Server Type</label>
            <div class="grid grid-cols-2 gap-3">
              <!-- ThingPark Option Card -->
              <div @click="setServerType('THINGPARK')" :class="currentNetworkServer.type === 'THINGPARK' ? 'border-cyan-500 bg-cyan-950/30 shadow-lg shadow-cyan-500/10' : 'border-slate-800 bg-slate-950/60 opacity-70 hover:opacity-100'" class="p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg">
                  <i class="fa-solid fa-satellite"></i>
                </div>
                <div>
                  <div class="font-bold text-white text-xs">ThingPark Wireless</div>
                  <div class="text-[10px] text-slate-400">Actility Connector &amp; RouteRef</div>
                </div>
              </div>

              <!-- ChirpStack Option Card -->
              <div @click="setServerType('CHIRPSTACK')" :class="currentNetworkServer.type === 'CHIRPSTACK' ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/10' : 'border-slate-800 bg-slate-950/60 opacity-70 hover:opacity-100'" class="p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                  <i class="fa-solid fa-signal"></i>
                </div>
                <div>
                  <div class="font-bold text-white text-xs">ChirpStack LNS</div>
                  <div class="text-[10px] text-slate-400">v3 / v4 Device Profiles</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Server Display Name <span class="text-red-400">*</span></label>
              <input v-model="currentNetworkServer.name" type="text" required placeholder="e.g. ThingPark Production EU868" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Server Status</label>
              <select v-model="currentNetworkServer.status" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
                <option value="ONLINE">ONLINE (Active)</option>
                <option value="CONFIGURED">CONFIGURED (Standby)</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input v-model="currentNetworkServer.description" type="text" placeholder="Detailed notes regarding this network server deployment..." class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
          </div>

          <!-- Step 2: API & Routing Settings -->
          <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div class="font-bold text-slate-200 text-xs flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <i class="fa-solid fa-gear text-sky-400"></i> API &amp; Routing Configuration
              </span>
              <span class="text-[10px] font-mono" :class="currentNetworkServer.type === 'THINGPARK' ? 'text-cyan-400' : 'text-emerald-400'">
                Mode: {{ currentNetworkServer.type }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">API Base URL</label>
                <input v-model="currentNetworkServer.apiUrl" type="text" :placeholder="currentNetworkServer.type === 'THINGPARK' ? 'https://community.thingpark.io/thingpark/wireless/rest/v1' : 'http://chirpstack.mas.local:8080'" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500" />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">API Key / Token / Secret</label>
                <input v-model="currentNetworkServer.apiKey" type="password" placeholder="API Key or Bearer Token..." class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500" />
              </div>
            </div>

            <!-- Conditional RouteRef field for ThingPark -->
            <div v-if="currentNetworkServer.type === 'THINGPARK'">
              <label class="block font-semibold text-cyan-300 mb-1">
                Default Route Reference (<span class="font-mono">routeRef</span>)
              </label>
              <input v-model="currentNetworkServer.routeRef" type="text" placeholder="e.g. DAVITEQ_TP_EU868_ROUTE" class="w-full px-3 py-2 bg-slate-900 border border-cyan-500/40 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400" />
              <p class="text-[10px] text-slate-400 mt-1">
                ThingPark routes uplink payloads matching this RouteRef to endpoint: <span class="font-mono text-cyan-300">POST /lorawan/webhook/thingpark</span>
              </p>
            </div>

            <!-- Helpful Webhook Ingestion tip for ChirpStack -->
            <div v-if="currentNetworkServer.type === 'CHIRPSTACK'" class="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-[11px] text-slate-300 space-y-1">
              <div class="font-semibold text-emerald-400">ChirpStack Integration Note:</div>
              <div>Configure HTTP Integration in ChirpStack Application pointing to: <span class="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded">POST /lorawan/webhook/chirpstack</span></div>
            </div>
          </div>

          <!-- Step 3: Dynamic Region Profiles Table -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200 flex items-center gap-1.5">
                <i class="fa-solid fa-globe text-sky-400"></i>
                <span>Region Profiles</span>
                <span class="text-[10px] text-slate-400">({{ currentNetworkServer.regionProfiles.length }} profiles)</span>
              </label>
              <button type="button" @click="addRegionRow" class="px-2.5 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 text-xs font-semibold cursor-pointer flex items-center gap-1">
                <i class="fa-solid fa-plus text-[10px]"></i> Add Region Profile
              </button>
            </div>

            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 max-h-56 overflow-y-auto custom-scroll">
              <div v-if="currentNetworkServer.regionProfiles.length === 0" class="text-center py-4 text-slate-500 text-xs">
                No region profiles added yet. Click "Add Region Profile" to configure frequency regions.
              </div>

              <div v-for="(rp, idx) in currentNetworkServer.regionProfiles" :key="rp.id || idx" class="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <div class="grid grid-cols-12 gap-2 items-center">
                  <!-- Region Select -->
                  <div class="col-span-3">
                    <label class="block text-[10px] text-slate-400 mb-0.5">Region</label>
                    <select v-model="rp.region" class="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs focus:outline-none focus:border-sky-500">
                      <option value="AS923-1">AS923-1 (VN/SG/MY)</option>
                      <option value="AS923-2">AS923-2 (ID/BN)</option>
                      <option value="AS923-3">AS923-3</option>
                      <option value="AS923-4">AS923-4</option>
                      <option value="EU868">EU868 (Europe)</option>
                      <option value="US915">US915 (USA)</option>
                      <option value="AU915">AU915 (Australia)</option>
                      <option value="IN865">IN865 (India)</option>
                      <option value="KR920">KR920 (Korea)</option>
                      <option value="VN920">VN920 (Vietnam)</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>

                  <!-- Profile Name -->
                  <div class="col-span-4">
                    <label class="block text-[10px] text-slate-400 mb-0.5">Profile Name</label>
                    <input v-model="rp.name" type="text" placeholder="e.g. Vietnam Standard" class="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-sky-500" />
                  </div>

                  <!-- Specific field: RouteRef for ThingPark vs Profile ID for ChirpStack -->
                  <div class="col-span-4">
                    <label class="block text-[10px] font-bold mb-0.5" :class="currentNetworkServer.type === 'THINGPARK' ? 'text-cyan-400' : 'text-emerald-400'">
                      {{ currentNetworkServer.type === 'THINGPARK' ? 'Route Ref' : 'Device Profile ID' }}
                    </label>
                    <input v-if="currentNetworkServer.type === 'THINGPARK'" v-model="rp.routeRef" type="text" placeholder="TP_VN_AS923_01" class="w-full px-2 py-1.5 bg-slate-950 border border-cyan-500/30 rounded text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400" />
                    <input v-else v-model="rp.profileId" type="text" placeholder="dp_as923_001" class="w-full px-2 py-1.5 bg-slate-950 border border-emerald-500/30 rounded text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400" />
                  </div>

                  <!-- Delete Row Button -->
                  <div class="col-span-1 text-right pt-3">
                    <button type="button" @click="removeRegionRow(idx)" class="text-red-400 hover:text-red-300 p-1 cursor-pointer" title="Remove Profile">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>

                <!-- Frequency band metadata -->
                <div class="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <input v-model="rp.frequencyBand" type="text" placeholder="Frequency Plan (e.g. 920-925 MHz)" class="w-full px-2 py-1 bg-slate-950/60 border border-slate-800 rounded text-slate-300 font-mono focus:outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <input v-model="rp.description" type="text" placeholder="Optional notes for this region" class="w-full px-2 py-1 bg-slate-950/60 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-sky-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Default Toggle -->
          <div class="flex items-center justify-between pt-1">
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input type="checkbox" v-model="currentNetworkServer.isDefault" class="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0" />
              <span>Set as Default Network Server for new devices</span>
            </label>

            <div class="flex gap-2">
              <button type="button" @click="networkServerDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
              <button type="submit" :disabled="savingNetworkServer" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer transition disabled:opacity-50">
                {{ savingNetworkServer ? 'Saving...' : (isEditingNetworkServer ? 'Update Server' : 'Create Server') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: TEST CONNECTION RESULT -->
    <div v-if="testResultDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-plug-circle-check text-sky-400"></i> Connection Diagnostic Result
          </h3>
          <button @click="testResultDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div v-if="testResult" class="space-y-3 text-xs font-mono">
          <div class="p-3 rounded-xl border flex items-center justify-between" :class="testResult.success ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'">
            <span class="font-bold font-sans">{{ testResult.success ? '✓ Diagnostic Passed' : '⚠️ Verified for Webhooks' }}</span>
            <span>{{ testResult.latencyMs }} ms</span>
          </div>

          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
            <div>Server: <strong class="text-white">{{ testResult.serverName }}</strong> ({{ testResult.serverType }})</div>
            <div class="text-[11px] text-slate-400 font-sans mt-1">{{ testResult.message }}</div>
          </div>

          <div v-if="testResult.details" class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-400">
            <div class="text-slate-200 font-bold font-sans mb-1">Configuration Summary:</div>
            <pre class="text-emerald-400 text-[10px] overflow-x-auto">{{ JSON.stringify(testResult.details, null, 2) }}</pre>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button @click="testResultDialog = false" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer text-xs">Close</button>
        </div>
      </div>
    </div>

    <!-- MODAL: CREATE / EDIT FEATURE MODULE -->
    <div v-if="moduleDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-cubes text-sky-400"></i> {{ isEditingModule ? 'Edit Dashboard Feature Module' : 'Create New Feature Module' }}
          </h3>
          <button @click="moduleDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitModuleForm" class="space-y-3.5 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Module Title</label>
              <input v-model="currentModule.title" type="text" required placeholder="e.g. Water Level Sensor" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Module Slug / ID</label>
              <input v-model="currentModule.id" :disabled="isEditingModule" type="text" required placeholder="e.g. water-level" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono lowercase focus:outline-none focus:border-sky-500 disabled:opacity-50" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Category</label>
              <select v-model="currentModule.category" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
                <option value="Monitoring">Monitoring (Live Data)</option>
                <option value="Fleet">Fleet (Devices & Gateways)</option>
                <option value="Analytics">Analytics (Charts & Reports)</option>
                <option value="System">System (Decoders & Webhooks)</option>
                <option value="Reports">Reports & Exports</option>
                <option value="Custom">Custom Feature</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Status Badge</label>
              <input v-model="currentModule.badge" type="text" placeholder="e.g. Real-time, Beta, New" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Icon (FontAwesome Class)</label>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center text-sky-400 text-sm">
                  <i :class="currentModule.icon || 'fa-solid fa-cube'"></i>
                </div>
                <input v-model="currentModule.icon" type="text" placeholder="fa-solid fa-wave-square" class="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Gradient Theme</label>
              <select v-model="currentModule.color" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500">
                <option value="from-cyan-500 to-blue-600">Cyan to Blue</option>
                <option value="from-emerald-500 to-teal-600">Emerald to Teal</option>
                <option value="from-indigo-500 to-purple-600">Indigo to Purple</option>
                <option value="from-amber-500 to-orange-600">Amber to Orange</option>
                <option value="from-rose-500 to-pink-600">Rose to Pink</option>
                <option value="from-sky-500 to-cyan-600">Sky to Cyan</option>
                <option value="from-fuchsia-500 to-purple-600">Fuchsia to Purple</option>
                <option value="from-teal-500 to-emerald-600">Teal to Emerald</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <textarea v-model="currentModule.description" rows="2" placeholder="Summary of what this module does..." class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"></textarea>
          </div>

          <!-- Role Assignment for this Module -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200">Permitted Roles for this Module:</label>
              <span class="text-[11px] text-slate-500">(Leave empty to allow all logged in users)</span>
            </div>
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto custom-scroll grid grid-cols-2 gap-2">
              <label v-for="r in rolesList" :key="r.id" class="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 cursor-pointer select-none">
                <input type="checkbox" :value="r.code" v-model="currentModule.allowedRoleCodes" class="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0" />
                <span class="font-bold text-xs" :class="r.code === 'SUPER_ADMIN' ? 'text-emerald-400' : 'text-slate-300'">{{ r.name }} ({{ r.code }})</span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input type="checkbox" v-model="currentModule.isActive" class="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0" />
              <span>Enable module on User Dashboard (Active)</span>
            </label>
            <div class="flex gap-2">
              <button type="button" @click="moduleDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
              <button type="submit" :disabled="savingModule" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer">Save Module</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CREATE / EDIT ROLE (Upgraded Visual Modal with Module Assignment) -->
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
            <i class="fa-solid fa-user-plus text-sky-400"></i> Create User Account
          </h3>
          <button @click="createUserDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitCreateUser" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Username</label>
            <input v-model="newUser.username" type="text" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Full Name <span class="text-slate-500 font-normal">(Optional)</span></label>
            <input v-model="newUser.fullName" type="text" placeholder="Optional" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Email <span class="text-slate-500 font-normal">(Optional)</span></label>
            <input v-model="newUser.email" type="email" placeholder="Optional - Not required for login" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Password</label>
            <input v-model="newUser.password" type="password" required minlength="6" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">User Type</label>
            <select v-model="newUser.userType" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
              <option value="USER">Standard User (USER)</option>
              <option value="SUB_ADMIN">Sub-Administrator (SUB_ADMIN)</option>
              <option value="ADMIN">Super Administrator (ADMIN)</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Assign Role</label>
            <select v-model="newUser.roleId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
              <option value="">No role assigned</option>
              <option v-for="r in rolesList" :key="r.id" :value="r.id">{{ r.name }} ({{ r.code }})</option>
            </select>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="createUserDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingUser" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer">Save User</button>
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

    <!-- MODAL: REGISTER DEVICE (Upgraded with Network Server & Region Profile selection) -->
    <div v-if="registerDeviceDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-microchip text-sky-400"></i> Register LoRaWAN Device
          </h3>
          <button @click="registerDeviceDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitRegisterDevice" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">DevEUI (16 Hex Characters) <span class="text-red-400">*</span></label>
            <input v-model="newDevice.devEUI" type="text" required placeholder="0018B20000000001" maxlength="16" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Device Name <span class="text-red-400">*</span></label>
            <input v-model="newDevice.name" type="text" required placeholder="e.g. Temperature Sensor 01" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
          </div>

          <!-- Network Server Selection -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Network Server</label>
            <select v-model="newDevice.networkServerId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
              <option value="">-- Standalone / Unassigned --</option>
              <option v-for="ns in networkServersList" :key="ns.id" :value="ns.id">
                [{{ ns.type }}] {{ ns.name }}
              </option>
            </select>
          </div>

          <!-- Dynamic Region Profile Selection for Selected Network Server -->
          <div v-if="selectedServerRegionProfiles.length > 0">
            <label class="block font-semibold text-slate-300 mb-1">Region Profile</label>
            <select v-model="newDevice.regionProfileId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
              <option value="">-- Default Profile --</option>
              <option v-for="rp in selectedServerRegionProfiles" :key="rp.id" :value="rp.id">
                {{ rp.name }} ({{ rp.region }}) {{ rp.routeRef ? '- RouteRef: ' + rp.routeRef : (rp.profileId ? '- Profile ID: ' + rp.profileId : '') }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Activation Mode</label>
            <select v-model="newDevice.activationType" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
              <option value="OTAA">OTAA (Over-The-Air Activation)</option>
              <option value="ABP">ABP (Activation By Personalization)</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">AppKey (Optional)</label>
            <input v-model="newDevice.appKey" type="text" placeholder="32 Hex AppKey (if OTAA)" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-sky-500" />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="registerDeviceDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingDevice" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer">Register Device</button>
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
    const { createApp, ref, computed, onMounted, watch } = Vue;

    const getStoredUser = () => {
      try {
        const u = localStorage.getItem('lorawan_user');
        return u ? JSON.parse(u) : {};
      } catch(e) {
        return {};
      }
    };

    createApp({
      setup() {
        const activeTab = ref('overview');
        const currentUser = ref(getStoredUser());
        const modulesList = ref([]);
        const networkServersList = ref([]);
        const usersList = ref([]);
        const rolesList = ref([]);
        const allPermissions = ref([]);
        const dbHealth = ref({ totalConnections: 1, connections: {}, tableStats: {} });
        const devicesList = ref([]);
        const telemetryList = ref([]);

        const loadingUsers = ref(false);
        const loadingRoles = ref(false);
        const savingModule = ref(false);
        const savingRole = ref(false);
        const savingUser = ref(false);
        const savingDevice = ref(false);
        const savingNetworkServer = ref(false);
        const testingServerId = ref(null);

        // Modals
        const moduleDialog = ref(false);
        const isEditingModule = ref(false);
        const networkServerDialog = ref(false);
        const isEditingNetworkServer = ref(false);
        const testResultDialog = ref(false);
        const testResult = ref(null);
        const roleDialog = ref(false);
        const isEditingRole = ref(false);
        const createUserDialog = ref(false);
        const editUserDialog = ref(false);
        const registerDeviceDialog = ref(false);

        // Filters
        const filterServerType = ref('ALL');
        const searchServerQuery = ref('');

        // Form Models
        const currentNetworkServer = ref({
          id: '',
          name: '',
          type: 'THINGPARK',
          description: '',
          apiUrl: '',
          apiKey: '',
          routeRef: '',
          regionProfiles: [],
          status: 'ONLINE',
          isDefault: false,
          metadata: {}
        });

        const currentModule = ref({
          id: '',
          code: '',
          title: '',
          description: '',
          icon: 'fa-solid fa-layer-group',
          color: 'from-sky-500 to-cyan-600',
          badge: '',
          category: 'Monitoring',
          allowedRoleCodes: [],
          requiredPermission: '',
          status: 'active',
          isActive: true
        });

        const currentRole = ref({
          id: '',
          code: '',
          name: '',
          description: '',
          permissions: []
        });

        const newUser = ref({ username: '', fullName: '', email: '', password: '', userType: 'USER', roleId: '' });
        const editUser = ref({ id: '', username: '', roleId: '', isActive: true });
        const newDevice = ref({ devEUI: '', name: '', activationType: 'OTAA', appKey: '', networkServerId: '', regionProfileId: '' });

        // Decoder Sandbox
        const sandboxCode = ref("function decodeUplink(bytes, fPort) {\\n  var temperature = ((bytes[0] << 8) | bytes[1]) / 100;\\n  var humidity = bytes[2];\\n  return { temperature, humidity };\\n}");
        const sandboxHex = ref("09C441");
        const sandboxResult = ref('{\\n  "ready": true\\n}');

        // Toast
        const toast = ref({ show: false, text: '', type: 'info' });
        const showToast = (text, type = 'info') => {
          toast.value = { show: true, text, type };
          setTimeout(() => { toast.value.show = false; }, 3500);
        };

        const isSuperAdmin = computed(() => {
          const user = currentUser.value;
          if (!user || !user.username) return true;
          if (user.username === 'admin') return true;
          if (user.userType === 'ADMIN' || String(user.userType).toUpperCase() === 'ADMIN') return true;
          if (user.roles && Array.isArray(user.roles)) {
            return user.roles.some(r => {
              const code = (typeof r === 'string' ? r : (r.code || r.name || '')).toUpperCase();
              return code === 'SUPER_ADMIN' || code === 'SUPER ADMINISTRATOR' || code === 'ADMIN';
            });
          }
          return true;
        });

        const filteredNetworkServers = computed(() => {
          let list = networkServersList.value;
          if (filterServerType.value !== 'ALL') {
            list = list.filter(s => s.type === filterServerType.value);
          }
          if (searchServerQuery.value.trim()) {
            const q = searchServerQuery.value.toLowerCase().trim();
            list = list.filter(s => {
              const nameMatch = s.name?.toLowerCase().includes(q);
              const descMatch = s.description?.toLowerCase().includes(q);
              const typeMatch = s.type?.toLowerCase().includes(q);
              const routeMatch = s.routeRef?.toLowerCase().includes(q);
              const regionMatch = s.regionProfiles?.some(rp => rp.name?.toLowerCase().includes(q) || rp.region?.toLowerCase().includes(q) || rp.routeRef?.toLowerCase().includes(q) || rp.profileId?.toLowerCase().includes(q));
              return nameMatch || descMatch || typeMatch || routeMatch || regionMatch;
            });
          }
          return list;
        });

        const selectedServerRegionProfiles = computed(() => {
          if (!newDevice.value.networkServerId) return [];
          const srv = networkServersList.value.find(s => s.id === newDevice.value.networkServerId);
          return srv && Array.isArray(srv.regionProfiles) ? srv.regionProfiles : [];
        });

        const groupedPermissions = computed(() => {
          const groups = {
            '🌐 Network Server Management': [],
            '👥 User Management': [],
            '🛡️ RBAC Role Management': [],
            '🗄️ Database Operations': [],
            '📡 LoRaWAN Fleet & Gateways': [],
            '📊 Live Telemetry Stream': [],
            '🔌 Webhook Ingestion': [],
            '💻 Payload Decoder Sandbox': []
          };
          allPermissions.value.forEach(p => {
            if (p.name.startsWith('network_server:')) groups['🌐 Network Server Management'].push(p);
            else if (p.name.startsWith('users:')) groups['👥 User Management'].push(p);
            else if (p.name.startsWith('roles:')) groups['🛡️ RBAC Role Management'].push(p);
            else if (p.name.startsWith('database:')) groups['🗄️ Database Operations'].push(p);
            else if (p.name.startsWith('lorawan:device:') || p.name.startsWith('lorawan:app:') || p.name.startsWith('lorawan:gateway:')) groups['📡 LoRaWAN Fleet & Gateways'].push(p);
            else if (p.name.startsWith('lorawan:telemetry:')) groups['📊 Live Telemetry Stream'].push(p);
            else if (p.name.startsWith('lorawan:webhooks:')) groups['🔌 Webhook Ingestion'].push(p);
            else if (p.name.startsWith('lorawan:decoder:')) groups['💻 Payload Decoder Sandbox'].push(p);
            else groups['📡 LoRaWAN Fleet & Gateways'].push(p);
          });
          return groups;
        });

        const getModulesForRole = (roleCode) => {
          if (roleCode === 'SUPER_ADMIN') return modulesList.value;
          return modulesList.value.filter(m => {
            if (!m.allowedRoleCodes || !m.allowedRoleCodes.length) return true;
            return m.allowedRoleCodes.includes(roleCode);
          });
        };

        const toggleSelectAllRolePermissions = () => {
          if (currentRole.value.permissions.length === allPermissions.value.length) {
            currentRole.value.permissions = [];
          } else {
            currentRole.value.permissions = allPermissions.value.map(p => p.id);
          }
        };

        const toggleGroupPermissions = (groupPerms) => {
          const groupIds = groupPerms.map(p => p.id);
          const hasAll = groupIds.every(id => currentRole.value.permissions.includes(id));
          if (hasAll) {
            currentRole.value.permissions = currentRole.value.permissions.filter(id => !groupIds.includes(id));
          } else {
            const set = new Set([...currentRole.value.permissions, ...groupIds]);
            currentRole.value.permissions = Array.from(set);
          }
        };

        const getAuthToken = () => {
          let token = localStorage.getItem('lorawan_token');
          if (!token || token === 'undefined' || token === 'null') {
            const match = document.cookie.match(/(?:^|;\\s*)access_token=([^;]*)/);
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

        const copyUrl = (path) => {
          const full = window.location.origin + path;
          navigator.clipboard.writeText(full).then(() => {
            showToast("Copied endpoint URL to clipboard!", "success");
          });
        };

        const formatTime = (ts) => {
          if (!ts) return '--';
          return new Date(ts).toLocaleTimeString();
        };

        const formatDecoded = (payload) => {
          if (!payload) return '--';
          if (typeof payload === 'object') return JSON.stringify(payload);
          return String(payload);
        };

        // Fetchers
        const fetchNetworkServers = async () => {
          try {
            const res = await fetch('/api/network-servers', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              networkServersList.value = await res.json();
            }
          } catch(e) {
            console.error('Failed to fetch network servers', e);
          }
        };

        const fetchModules = async () => {
          try {
            const res = await fetch('/api/features/all', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) modulesList.value = await res.json();
          } catch(e) {
            console.error(e);
          }
        };

        const fetchUsers = async () => {
          loadingUsers.value = true;
          try {
            const res = await fetch('/users', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) usersList.value = await res.json();
          } catch(e) {
            console.error(e);
          } finally {
            loadingUsers.value = false;
          }
        };

        const fetchRoles = async () => {
          loadingRoles.value = true;
          try {
            const [rolesRes, permsRes] = await Promise.all([
              fetch('/roles', { headers: authHeaders(), credentials: 'include' }),
              fetch('/roles/permissions', { headers: authHeaders(), credentials: 'include' })
            ]);
            if (rolesRes.ok) rolesList.value = await rolesRes.json();
            if (permsRes.ok) allPermissions.value = await permsRes.json();
          } catch(e) {
            console.error(e);
          } finally {
            loadingRoles.value = false;
          }
        };

        const fetchDbHealth = async () => {
          try {
            const res = await fetch('/database/health', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) dbHealth.value = await res.json();
          } catch(e) {
            console.error(e);
          }
        };

        const reloadDbConfig = async () => {
          try {
            const res = await fetch('/database/reload', { method: 'POST', headers: authHeaders(), credentials: 'include' });
            const data = await res.json();
            showToast(data.message || "Database configuration reloaded", "success");
            fetchDbHealth();
          } catch(e) {
            showToast("Reload failed: " + e.message, "error");
          }
        };

        const fetchDevices = async () => {
          try {
            const res = await fetch('/lorawan/devices', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) devicesList.value = await res.json();
          } catch(e) {
            console.error(e);
          }
        };

        const fetchTelemetry = async () => {
          try {
            const res = await fetch('/lorawan/telemetry?limit=25', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) telemetryList.value = await res.json();
          } catch(e) {}
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
              const user = await res.json();
              currentUser.value = user;
              const isSuper =
                user.username === 'admin' ||
                user.userType === 'ADMIN' ||
                String(user.userType).toUpperCase() === 'ADMIN' ||
                (user.roles && Array.isArray(user.roles) && user.roles.some(r => {
                  const code = (typeof r === 'string' ? r : (r.code || r.name || '')).toUpperCase();
                  return code === 'SUPER_ADMIN' || code === 'SUPER ADMINISTRATOR' || code === 'ADMIN';
                }));

              if (!isSuper) {
                window.location.replace('/dashboard');
                return false;
              }
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

        // Network Server CRUD & Region Operations
        const setServerType = (type) => {
          currentNetworkServer.value.type = type;
          if (type === 'THINGPARK' && !currentNetworkServer.value.routeRef) {
            currentNetworkServer.value.routeRef = 'DAVITEQ_TP_DEFAULT_ROUTE';
          }
        };

        const openCreateNetworkServerDialog = () => {
          isEditingNetworkServer.value = false;
          currentNetworkServer.value = {
            id: '',
            name: '',
            type: 'THINGPARK',
            description: '',
            apiUrl: 'https://community.thingpark.io/thingpark/wireless/rest/v1',
            apiKey: '',
            routeRef: 'DAVITEQ_TP_DEFAULT_ROUTE',
            regionProfiles: [
              {
                id: 'prof-vn920-' + Date.now(),
                name: 'Vietnam AS923-1 Standard Plan',
                region: 'AS923-1',
                routeRef: 'TP_VN_AS923_01',
                profileId: 'dp_as923_vn',
                frequencyBand: '920-925 MHz',
                description: 'Default frequency plan for Vietnam',
                isActive: true
              }
            ],
            status: 'ONLINE',
            isDefault: false,
            metadata: {}
          };
          networkServerDialog.value = true;
        };

        const openEditNetworkServerDialog = (srv) => {
          isEditingNetworkServer.value = true;
          currentNetworkServer.value = JSON.parse(JSON.stringify(srv));
          if (!Array.isArray(currentNetworkServer.value.regionProfiles)) {
            currentNetworkServer.value.regionProfiles = [];
          }
          networkServerDialog.value = true;
        };

        const addRegionRow = () => {
          const isTP = currentNetworkServer.value.type === 'THINGPARK';
          const defaultRegion = 'AS923-1';
          currentNetworkServer.value.regionProfiles.push({
            id: 'prof-' + Date.now(),
            name: (isTP ? 'ThingPark ' : 'ChirpStack ') + defaultRegion + ' Profile',
            region: defaultRegion,
            routeRef: isTP ? 'TP_AS923_ROUTE_' + (currentNetworkServer.value.regionProfiles.length + 1) : '',
            profileId: !isTP ? 'dp_as923_profile_' + (currentNetworkServer.value.regionProfiles.length + 1) : '',
            frequencyBand: '920-925 MHz',
            description: '',
            isActive: true
          });
        };

        const removeRegionRow = (index) => {
          currentNetworkServer.value.regionProfiles.splice(index, 1);
        };

        const submitNetworkServerForm = async () => {
          savingNetworkServer.value = true;
          try {
            const url = isEditingNetworkServer.value ? '/api/network-servers/' + currentNetworkServer.value.id : '/api/network-servers';
            const method = isEditingNetworkServer.value ? 'PUT' : 'POST';

            const payload = {
              name: currentNetworkServer.value.name.trim(),
              type: currentNetworkServer.value.type,
              description: currentNetworkServer.value.description?.trim(),
              apiUrl: currentNetworkServer.value.apiUrl?.trim(),
              apiKey: currentNetworkServer.value.apiKey?.trim(),
              routeRef: currentNetworkServer.value.routeRef?.trim(),
              regionProfiles: currentNetworkServer.value.regionProfiles,
              status: currentNetworkServer.value.status,
              isDefault: Boolean(currentNetworkServer.value.isDefault),
              metadata: currentNetworkServer.value.metadata || {}
            };

            const res = await fetch(url, {
              method,
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save network server");

            showToast(isEditingNetworkServer.value ? "Network Server updated successfully!" : "Network Server created successfully!", "success");
            networkServerDialog.value = false;
            fetchNetworkServers();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingNetworkServer.value = false;
          }
        };

        const deleteNetworkServer = async (id) => {
          if (!confirm("Are you sure you want to delete this Network Server? All associated devices will be unlinked.")) return;
          try {
            const res = await fetch('/api/network-servers/' + id, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
            if (!res.ok) throw new Error("Delete failed");
            showToast("Network Server removed successfully", "success");
            fetchNetworkServers();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        const testNetworkServerConnection = async (srv) => {
          testingServerId.value = srv.id;
          try {
            const res = await fetch('/api/network-servers/' + srv.id + '/test', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            testResult.value = data;
            testResultDialog.value = true;
          } catch(e) {
            showToast("Connection test error: " + e.message, "error");
          } finally {
            testingServerId.value = null;
          }
        };

        // Module CRUD
        const openCreateModuleDialog = () => {
          isEditingModule.value = false;
          currentModule.value = {
            id: '',
            code: '',
            title: '',
            description: '',
            icon: 'fa-solid fa-layer-group',
            color: 'from-sky-500 to-cyan-600',
            badge: 'Feature',
            category: 'Monitoring',
            allowedRoleCodes: [],
            requiredPermission: '',
            status: 'active',
            isActive: true
          };
          moduleDialog.value = true;
        };

        const openEditModuleDialog = (mod) => {
          isEditingModule.value = true;
          currentModule.value = JSON.parse(JSON.stringify(mod));
          if (!currentModule.value.allowedRoleCodes) currentModule.value.allowedRoleCodes = [];
          moduleDialog.value = true;
        };

        const submitModuleForm = async () => {
          savingModule.value = true;
          try {
            const url = isEditingModule.value ? '/api/features/' + currentModule.value.id : '/api/features';
            const method = isEditingModule.value ? 'PUT' : 'POST';
            const res = await fetch(url, {
              method,
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify(currentModule.value)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save module");
            showToast(isEditingModule.value ? "Module updated successfully!" : "Module created successfully!", "success");
            moduleDialog.value = false;
            fetchModules();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingModule.value = false;
          }
        };

        const toggleModuleActive = async (mod) => {
          const newStatus = mod.isActive === false ? true : false;
          try {
            const res = await fetch('/api/features/' + mod.id, {
              method: 'PUT',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({ isActive: newStatus })
            });
            if (!res.ok) throw new Error("Failed to toggle status");
            mod.isActive = newStatus;
            showToast("Module " + (newStatus ? "enabled" : "disabled") + " on Dashboard", "success");
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        const deleteModule = async (id) => {
          if (!confirm("Are you sure you want to delete this module from dashboard?")) return;
          try {
            const res = await fetch('/api/features/' + id, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
            if (!res.ok) throw new Error("Delete failed");
            showToast("Module removed successfully", "success");
            fetchModules();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        const resetModulesDefaults = async () => {
          if (!confirm("Reset all modules back to standard 8 default modules?")) return;
          try {
            const res = await fetch('/api/features/reset-defaults', { method: 'POST', headers: authHeaders(), credentials: 'include' });
            if (!res.ok) throw new Error("Reset failed");
            showToast("Modules restored to defaults!", "success");
            fetchModules();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        // Role CRUD
        const openCreateRoleDialog = () => {
          isEditingRole.value = false;
          currentRole.value = { id: '', code: '', name: '', description: '', permissions: [] };
          roleDialog.value = true;
        };

        const openEditRoleDialog = (r) => {
          isEditingRole.value = true;
          currentRole.value = {
            id: r.id,
            code: r.code,
            name: r.name,
            description: r.description || '',
            permissions: (r.permissions || []).map(p => p.id)
          };
          roleDialog.value = true;
        };

        const submitRoleForm = async () => {
          savingRole.value = true;
          try {
            const url = isEditingRole.value ? '/roles/' + currentRole.value.id : '/roles';
            const method = isEditingRole.value ? 'PUT' : 'POST';
            const payload = isEditingRole.value ? {
              name: currentRole.value.name.trim(),
              description: currentRole.value.description.trim(),
              permissionIds: currentRole.value.permissions
            } : {
              code: currentRole.value.code.trim().toUpperCase(),
              name: currentRole.value.name.trim(),
              description: currentRole.value.description.trim(),
              permissionIds: currentRole.value.permissions
            };
            const res = await fetch(url, {
              method,
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save role");
            showToast(isEditingRole.value ? "Role updated successfully!" : "Role created successfully!", "success");
            roleDialog.value = false;
            fetchRoles();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingRole.value = false;
          }
        };

        const deleteRole = async (id) => {
          if (!confirm("Are you sure you want to delete this role?")) return;
          try {
            const res = await fetch('/roles/' + id, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
            if (!res.ok) throw new Error("Delete failed");
            showToast("Role deleted successfully", "success");
            fetchRoles();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        // User CRUD
        const openCreateUserDialog = () => {
          newUser.value = { username: '', fullName: '', email: '', password: '', userType: 'USER', roleId: '' };
          createUserDialog.value = true;
        };

        const submitCreateUser = async () => {
          savingUser.value = true;
          try {
            const payload = {
              username: newUser.value.username.trim(),
              fullName: newUser.value.fullName?.trim() || newUser.value.username.trim(),
              password: newUser.value.password,
              userType: newUser.value.userType,
              roleIds: newUser.value.roleId ? [newUser.value.roleId] : []
            };
            if (newUser.value.email?.trim()) {
              payload.email = newUser.value.email.trim();
            }
            const res = await fetch('/users', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create user");
            showToast("User account created successfully!", "success");
            createUserDialog.value = false;
            fetchUsers();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingUser.value = false;
          }
        };

        const openEditUserDialog = (u) => {
          editUser.value = {
            id: u.id,
            username: u.username,
            roleId: u.roles && u.roles[0] ? (u.roles[0].id || u.roles[0]) : '',
            isActive: u.isActive
          };
          editUserDialog.value = true;
        };

        const submitEditUser = async () => {
          savingUser.value = true;
          try {
            const res = await fetch('/users/' + editUser.value.id + '/permissions', {
              method: 'PUT',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                isActive: editUser.value.isActive,
                roleIds: editUser.value.roleId ? [editUser.value.roleId] : []
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update user");
            showToast("User updated successfully!", "success");
            editUserDialog.value = false;
            fetchUsers();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingUser.value = false;
          }
        };

        const deleteUser = async (id) => {
          if (!confirm("Are you sure you want to delete this user?")) return;
          try {
            const res = await fetch('/users/' + id, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
            if (!res.ok) throw new Error("Delete failed");
            showToast("User removed successfully", "success");
            fetchUsers();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        // Device CRUD
        const openRegisterDeviceDialog = () => {
          const defaultServer = networkServersList.value.find(s => s.isDefault) || networkServersList.value[0];
          newDevice.value = {
            devEUI: '',
            name: '',
            activationType: 'OTAA',
            appKey: '',
            networkServerId: defaultServer ? defaultServer.id : '',
            regionProfileId: ''
          };
          registerDeviceDialog.value = true;
        };

        const submitRegisterDevice = async () => {
          savingDevice.value = true;
          try {
            const res = await fetch('/lorawan/devices', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                devEUI: newDevice.value.devEUI.trim().toUpperCase(),
                name: newDevice.value.name.trim(),
                activationType: newDevice.value.activationType,
                appKey: newDevice.value.appKey ? newDevice.value.appKey.trim() : undefined,
                networkServerId: newDevice.value.networkServerId || undefined,
                regionProfileId: newDevice.value.regionProfileId || undefined
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to register device");
            showToast("Device registered successfully!", "success");
            registerDeviceDialog.value = false;
            fetchDevices();
            fetchNetworkServers();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingDevice.value = false;
          }
        };

        const testDevice = (d) => {
          activeTab.value = 'decoder';
        };

        const runSandboxDecode = () => {
          try {
            const hex = sandboxHex.value.trim().replace(/\\s+/g, "");
            const bytes = [];
            for (let c = 0; c < hex.length; c += 2) {
              bytes.push(parseInt(hex.substr(c, 2), 16));
            }
            const fn = new Function("bytes", "fPort", sandboxCode.value + "; return decodeUplink(bytes, fPort);");
            const output = fn(bytes, 1);
            sandboxResult.value = JSON.stringify(output, null, 2);
            showToast("Decoder executed successfully!", "success");
          } catch(e) {
            sandboxResult.value = "Decoder Error: " + e.message;
            showToast("Decoder Error: " + e.message, "error");
          }
        };

        watch(activeTab, (newTab) => {
          try {
            window.history.replaceState(null, null, '#' + newTab);
          } catch(e) {}
          if (newTab === 'network-servers') fetchNetworkServers();
          if (newTab === 'modules') fetchModules();
          if (newTab === 'roles') fetchRoles();
          if (newTab === 'users') fetchUsers();
          if (newTab === 'database') fetchDbHealth();
          if (newTab === 'devices') {
            fetchDevices();
            fetchNetworkServers();
          }
          if (newTab === 'telemetry') fetchTelemetry();
        });

        const initControlPanel = async () => {
          const ok = await fetchSession();
          if (!ok) return;

          fetchNetworkServers();
          fetchModules();
          fetchRoles();
          fetchUsers();
          fetchDbHealth();
          fetchDevices();
          fetchTelemetry();
          
          const hash = window.location.hash.replace('#', '').trim();
          if (hash) {
            activeTab.value = hash;
          } else {
            activeTab.value = 'overview';
          }
        };

        onMounted(() => {
          initControlPanel();
        });

        window.addEventListener('pageshow', (event) => {
          initControlPanel();
        });

        return {
          activeTab,
          currentUser,
          isSuperAdmin,
          modulesList,
          networkServersList,
          filteredNetworkServers,
          selectedServerRegionProfiles,
          filterServerType,
          searchServerQuery,
          rolesList,
          usersList,
          allPermissions,
          groupedPermissions,
          getModulesForRole,
          toggleSelectAllRolePermissions,
          toggleGroupPermissions,
          dbHealth,
          devicesList,
          telemetryList,
          loadingUsers,
          loadingRoles,
          savingModule,
          savingRole,
          savingUser,
          savingDevice,
          savingNetworkServer,
          testingServerId,
          networkServerDialog,
          isEditingNetworkServer,
          testResultDialog,
          testResult,
          moduleDialog,
          isEditingModule,
          roleDialog,
          isEditingRole,
          createUserDialog,
          editUserDialog,
          registerDeviceDialog,
          currentNetworkServer,
          currentModule,
          currentRole,
          newUser,
          editUser,
          newDevice,
          sandboxCode,
          sandboxHex,
          sandboxResult,
          toast,
          handleLogout,
          copyUrl,
          formatTime,
          formatDecoded,
          fetchNetworkServers,
          openCreateNetworkServerDialog,
          openEditNetworkServerDialog,
          setServerType,
          addRegionRow,
          removeRegionRow,
          submitNetworkServerForm,
          deleteNetworkServer,
          testNetworkServerConnection,
          fetchModules,
          fetchRoles,
          fetchUsers,
          fetchDbHealth,
          reloadDbConfig,
          fetchDevices,
          fetchTelemetry,
          openCreateModuleDialog,
          openEditModuleDialog,
          submitModuleForm,
          toggleModuleActive,
          deleteModule,
          resetModulesDefaults,
          openCreateRoleDialog,
          openEditRoleDialog,
          submitRoleForm,
          deleteRole,
          openCreateUserDialog,
          submitCreateUser,
          openEditUserDialog,
          submitEditUser,
          deleteUser,
          openRegisterDeviceDialog,
          submitRegisterDevice,
          testDevice,
          runSandboxDecode
        };
      }
    }).mount('#app');
  </script>
</body>
</html>
`;
