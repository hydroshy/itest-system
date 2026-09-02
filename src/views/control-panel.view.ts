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
      display: flex;
      flex-direction: column;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: #0f172a;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }
    .tab-btn {
      cursor: pointer !important;
      user-select: none;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      border: 1px solid transparent;
      background: transparent;
      outline: none;
    }
    .tab-btn:hover {
      color: #f1f5f9;
      background: rgba(30, 41, 59, 0.7);
    }
    .tab-btn.active {
      background: rgba(14, 165, 233, 0.18) !important;
      color: #38bdf8 !important;
      border-color: rgba(56, 189, 248, 0.5) !important;
    }
    .modal-overlay {
      display: none !important;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background-color: rgba(3, 7, 18, 0.85);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      padding: 1rem;
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
    }
  </style>
</head>
<body class="min-h-screen text-slate-100 flex flex-col">
  <!-- Top Navigation Bar -->
  <header class="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-base shadow-inner">
          <i class="fa-solid fa-tower-broadcast"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-white text-sm tracking-tight"><span class="text-sky-400">DAVITEQ</span> LoRaWAN</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">Control Panel</span>
          </div>
          <p class="text-[11px] text-slate-400">Network & Application Server Management</p>
        </div>
      </div>

      <!-- Center Status -->
      <div class="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-slate-400 text-[11px]">System: <strong class="text-emerald-400 font-semibold" id="sysStatusText">ONLINE &bull; HEALTHY</strong></span>
      </div>

      <!-- Right User Menu -->
      <div class="flex items-center gap-3">
        <a href="/api/docs" target="_blank" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-400 bg-sky-950/50 border border-sky-500/30 hover:bg-sky-900/50 transition">
          <i class="fa-solid fa-book"></i> Swagger Docs
        </a>
        <div class="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div class="text-right">
            <div id="navFullName" class="text-xs font-semibold text-slate-200">Admin User</div>
            <div id="navRoleBadge" class="text-[10px] text-emerald-400 font-mono">SUPER_ADMIN</div>
          </div>
          <button onclick="handleLogout()" id="btn-logout" type="button" title="Sign Out" class="btn px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content Layout -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <!-- Navigation Tabs Bar -->
    <div class="flex border-b border-slate-800 gap-2 overflow-x-auto custom-scroll pb-1" id="tabsBar">
      <button onclick="switchTab('overview')" type="button" id="tabBtn-overview" class="tab-btn active">
        <i class="fa-solid fa-chart-pie"></i> Overview
      </button>
      <button onclick="switchTab('users')" type="button" id="tabBtn-users" class="tab-btn">
        <i class="fa-solid fa-users"></i> Users
      </button>
      <button onclick="switchTab('roles')" type="button" id="tabBtn-roles" class="tab-btn">
        <i class="fa-solid fa-shield-halved"></i> Role Matrix
      </button>
      <button onclick="switchTab('database')" type="button" id="tabBtn-database" class="tab-btn">
        <i class="fa-solid fa-database"></i> Database Health
      </button>
      <button onclick="switchTab('webhooks')" type="button" id="tabBtn-webhooks" class="tab-btn">
        <i class="fa-solid fa-satellite-dish"></i> Webhooks & Ingestion
      </button>
      <button onclick="switchTab('decoder')" type="button" id="tabBtn-decoder" class="tab-btn">
        <i class="fa-solid fa-code"></i> Payload Decoder Sandbox
      </button>
    </div>

    <!-- TAB 1: OVERVIEW -->
    <div id="tabContent-overview" class="space-y-6" style="display: block;">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div class="flex items-center justify-between text-slate-400 text-xs">
            <span>Server Status</span>
            <i class="fa-solid fa-server text-sky-400"></i>
          </div>
          <div class="text-xl font-bold text-white mt-2 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> ONLINE
          </div>
          <div class="text-[11px] text-slate-500 mt-1">NestJS Core Runtime</div>
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
            <span>Database Routing Pools</span>
            <i class="fa-solid fa-database text-indigo-400"></i>
          </div>
          <div class="text-xl font-bold text-white mt-2" id="metricDbPools">--</div>
          <div class="text-[11px] text-slate-500 mt-1">Dynamic Connections Active</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-bolt text-sky-400"></i> Platform Architecture
          </h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            The platform functions as a scalable LoRaWAN Application Server providing webhook ingestion for ChirpStack and ThingPark Wireless, dynamic PostgreSQL table-to-database routing, and multi-tier RBAC access control.
          </p>
          <div class="grid grid-cols-2 gap-2 pt-2 text-xs">
            <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span class="text-slate-400 text-[11px] block">Role-Based Access Control</span>
              <span class="font-semibold text-emerald-400 mt-0.5 block">5-Table RBAC Model</span>
            </div>
            <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span class="text-slate-400 text-[11px] block">Database Routing</span>
              <span class="font-semibold text-sky-400 mt-0.5 block">Multi-DB Pools Active</span>
            </div>
          </div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-link text-emerald-400"></i> Quick Integration Links
          </h3>
          <div class="space-y-2 text-xs">
            <a href="/api/docs" target="_blank" class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/40 transition">
              <span class="flex items-center gap-2 text-slate-300 font-medium"><i class="fa-solid fa-book text-sky-400"></i> Swagger REST API Documentation</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-slate-500 text-[10px]"></i>
            </a>
            <button onclick="switchTab('webhooks')" type="button" class="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 transition cursor-pointer">
              <span class="flex items-center gap-2 text-slate-300 font-medium"><i class="fa-solid fa-satellite-dish text-emerald-400"></i> Webhook Ingestion Configuration</span>
              <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
            </button>
            <button onclick="switchTab('database')" type="button" class="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 transition cursor-pointer">
              <span class="flex items-center gap-2 text-slate-300 font-medium"><i class="fa-solid fa-heart-pulse text-amber-400"></i> Visual Database Health Monitor</span>
              <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: USERS -->
    <div id="tabContent-users" class="space-y-6" style="display: none;">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-users text-sky-400"></i> User Directory
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Manage administrative and standard user accounts</p>
          </div>
          <button onclick="openCreateUserModal()" type="button" class="btn px-3.5 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 self-start sm:self-auto">
            <i class="fa-solid fa-user-plus"></i> Create User
          </button>
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

    <!-- TAB 3: ROLE MATRIX -->
    <div id="tabContent-roles" class="space-y-6" style="display: none;">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-amber-400"></i> Role & Permissions Matrix (RBAC)
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Configure role definitions and granular permission assignments. Only Super Admin has modification rights.</p>
          </div>
          <button onclick="openCreateRoleModal()" type="button" class="btn px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 self-start sm:self-auto">
            <i class="fa-solid fa-plus"></i> Create New Role
          </button>
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

    <!-- TAB 4: DATABASE HEALTH & ROUTING -->
    <div id="tabContent-database" class="space-y-6" style="display: none;">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-heart-pulse text-emerald-400"></i> Visual Database Health & Metrics
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Real-time status of multi-database connections, latency, and table routing</p>
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
            <div class="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 break-all select-all">
              POST http://&lt;host&gt;:3000/lorawan/webhook/chirpstack
            </div>
            <p class="text-[11px] text-slate-400 font-sans">Supports ChirpStack uplink events: deduplication, RSSI/SNR metrics, payload decoding.</p>
          </div>

          <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between text-emerald-400 font-bold font-sans">
              <span>ThingPark Wireless Ingestion</span>
              <span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px]">POST / JSON</span>
            </div>
            <div class="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 break-all select-all">
              POST http://&lt;host&gt;:3000/lorawan/webhook/thingpark
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
              <input type="text" id="sandboxHex" value="09C441" placeholder="Hex string e.g. 09C441" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200" />
              <button onclick="runSandboxDecode()" type="button" class="btn px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold rounded-xl transition">Decode</button>
            </div>
            <pre id="sandboxResult" class="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 overflow-auto text-xs">{ "ready": true }</pre>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- MODAL: CREATE USER -->
  <div id="createUserModal" class="modal-overlay" onclick="handleModalBackdropClick(event, 'createUserModal')">
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
          <input type="text" id="newUsername" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Full Name</label>
          <input type="text" id="newFullName" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Email Address</label>
          <input type="email" id="newEmail" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Password</label>
          <input type="password" id="newPassword" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">User Type</label>
          <select id="newUserType" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white">
            <option value="USER">Standard User (USER)</option>
            <option value="SUB_ADMIN">Sub-Administrator (SUB_ADMIN)</option>
            <option value="ADMIN">Super Administrator (ADMIN)</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Assign Role</label>
          <select id="newUserRoleId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white">
            <option value="">Select role...</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeCreateUserModal()" class="btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300">Cancel</button>
          <button type="submit" class="btn px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white">Save User</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: CREATE ROLE -->
  <div id="createRoleModal" class="modal-overlay" onclick="handleModalBackdropClick(event, 'createRoleModal')">
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
          <input type="text" id="newRoleCode" required placeholder="e.g. AUDITOR or FIELD_TECH" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white uppercase font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Display Name</label>
          <input type="text" id="newRoleName" required placeholder="e.g. Field Technician" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Description</label>
          <input type="text" id="newRoleDescription" placeholder="Description of role privileges" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
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
  <div id="editRoleModal" class="modal-overlay" onclick="handleModalBackdropClick(event, 'editRoleModal')">
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
          <input type="text" id="editRoleName" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Description</label>
          <input type="text" id="editRoleDescription" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
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

  <script>
    var allAvailablePermissions = [];
    var allAvailableRoles = [];

    function getAuthToken() {
      var token = localStorage.getItem("lorawan_token");
      if (!token) {
        var match = document.cookie.match(new RegExp("(^| )access_token=([^;]+)"));
        if (match) token = match[2];
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
      
      var isSuper = user.userType === "ADMIN" || (user.roles && user.roles.some(function(r) { return r === "SUPER_ADMIN" || (r && r.code === "SUPER_ADMIN"); }));
      var badgeEl = document.getElementById("navRoleBadge");
      if (badgeEl) {
        badgeEl.textContent = isSuper ? "SUPER_ADMIN" : (user.roles && user.roles[0] ? (user.roles[0].name || user.roles[0]) : (user.userType || "USER"));
      }
    }

    function switchTab(tabId) {
      var tabList = ["overview", "users", "roles", "database", "webhooks", "decoder"];
      for (var i = 0; i < tabList.length; i++) {
        var t = tabList[i];
        var btn = document.getElementById("tabBtn-" + t);
        var content = document.getElementById("tabContent-" + t);
        
        if (btn) {
          if (t === tabId) {
            btn.classList.add("active");
            btn.style.backgroundColor = "rgba(14, 165, 233, 0.18)";
            btn.style.color = "#38bdf8";
            btn.style.borderColor = "rgba(56, 189, 248, 0.5)";
          } else {
            btn.classList.remove("active");
            btn.style.backgroundColor = "transparent";
            btn.style.color = "#94a3b8";
            btn.style.borderColor = "transparent";
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

      if (tabId === "users") loadUsers();
      if (tabId === "roles") loadRoles();
      if (tabId === "database") loadDatabaseHealth();
    }
    window.switchTab = switchTab;

    async function handleLogout() {
      try {
        await fetch("/auth/logout", { method: "POST", credentials: "same-origin" });
      } catch (e) {}
      localStorage.removeItem("lorawan_token");
      localStorage.removeItem("lorawan_user");
      document.cookie = "access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      window.location.href = "/login";
    }
    window.handleLogout = handleLogout;

    async function loadUsers() {
      try {
        var res = await fetch("/users", { headers: authHeaders(), credentials: "same-origin" });
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }
        var users = await res.json();
        if (!Array.isArray(users)) throw new Error("Invalid response format");
        
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
          var isSuper = u.userType === "ADMIN" || (u.roles && u.roles.some(function(r) { return r.code === "SUPER_ADMIN"; }));
          var typeBadge = isSuper
            ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">ADMIN</span>'
            : '<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">' + u.userType + '</span>';
          
          var rolesBadges = u.roles && u.roles.length > 0
            ? u.roles.map(function(r) { return '<span class="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono mr-1">' + r.name + '</span>'; }).join("")
            : '<span class="text-slate-500 text-[10px]">None</span>';

          var deleteBtn = !isSuper 
            ? '<button onclick="deleteUser(\'' + u.id + '\')" type="button" class="btn text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/10 border border-red-500/20"><i class="fa-solid fa-trash"></i></button>'
            : '<span class="text-slate-600 text-[11px]"><i class="fa-solid fa-lock"></i> Protected</span>';

          var tr = document.createElement("tr");
          tr.className = "hover:bg-slate-950/40 transition";
          tr.innerHTML = '<td class="py-3 px-4 font-semibold text-white">' + u.username + '</td>' +
            '<td class="py-3 px-4 text-slate-300">' + (u.fullName || "--") + '</td>' +
            '<td class="py-3 px-4 text-slate-400">' + u.email + '</td>' +
            '<td class="py-3 px-4">' + typeBadge + '</td>' +
            '<td class="py-3 px-4">' + rolesBadges + '</td>' +
            '<td class="py-3 px-4"><span class="inline-flex items-center gap-1.5 ' + (u.isActive ? "text-emerald-400" : "text-red-400") + '"><span class="w-1.5 h-1.5 rounded-full ' + (u.isActive ? "bg-emerald-500" : "bg-red-500") + '"></span>' + (u.isActive ? "Active" : "Suspended") + '</span></td>' +
            '<td class="py-3 px-4 text-right">' + deleteBtn + '</td>';
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
          fetch("/roles", { headers: authHeaders(), credentials: "same-origin" }),
          fetch("/roles/permissions", { headers: authHeaders(), credentials: "same-origin" })
        ]);

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
          : '<button onclick="openEditRoleModal(\'' + r.id + '\')" type="button" class="btn text-sky-400 hover:text-sky-300 font-medium">Edit</button>';

        var card = document.createElement("div");
        card.className = "bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2";
        card.innerHTML = '<div class="flex items-center justify-between">' +
          '<span class="font-bold ' + (isSuper ? "text-emerald-400" : "text-sky-400") + ' flex items-center gap-1.5"><i class="fa-solid ' + (isSuper ? "fa-crown" : "fa-user-shield") + '"></i> ' + r.name + '</span>' +
          '<span class="px-2 py-0.5 rounded text-[10px] font-mono ' + (isSuper ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-slate-800 text-slate-400") + '">' + r.code + '</span>' +
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
        var res = await fetch("/database/health", { headers: authHeaders(), credentials: "same-origin" });
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

    async function reloadDbConfig() {
      try {
        var res = await fetch("/database/reload", {
          method: "POST",
          headers: authHeaders(),
          credentials: "same-origin"
        });
        var data = await res.json();
        alert(data.message || "Database configuration reloaded");
        loadDatabaseHealth();
      } catch (err) {
        alert("Failed to reload database config: " + err.message);
      }
    }
    window.reloadDbConfig = reloadDbConfig;

    function handleModalBackdropClick(event, modalId) {
      if (event.target.id === modalId) {
        var modal = document.getElementById(modalId);
        if (modal) {
          modal.style.setProperty("display", "none", "important");
        }
      }
    }
    window.handleModalBackdropClick = handleModalBackdropClick;

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
      if (modal) {
        modal.style.setProperty("display", "flex", "important");
      }
    }
    window.openCreateUserModal = openCreateUserModal;

    function closeCreateUserModal() {
      var modal = document.getElementById("createUserModal");
      if (modal) {
        modal.style.setProperty("display", "none", "important");
      }
    }
    window.closeCreateUserModal = closeCreateUserModal;

    document.getElementById("createUserForm").addEventListener("submit", async function(e) {
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
          credentials: "same-origin",
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
        closeCreateUserModal();
        loadUsers();
      } catch (err) {
        alert(err.message);
      }
    });

    async function deleteUser(id) {
      if (!confirm("Are you sure you want to delete this user?")) return;
      try {
        var res = await fetch("/users/" + id, {
          method: "DELETE",
          headers: authHeaders(),
          credentials: "same-origin"
        });
        if (!res.ok) {
          var data = await res.json();
          throw new Error(data.message || "Delete failed");
        }
        loadUsers();
      } catch (err) {
        alert(err.message);
      }
    }
    window.deleteUser = deleteUser;

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
      if (modal) {
        modal.style.setProperty("display", "flex", "important");
      }
    }
    window.openCreateRoleModal = openCreateRoleModal;

    function closeCreateRoleModal() {
      var modal = document.getElementById("createRoleModal");
      if (modal) {
        modal.style.setProperty("display", "none", "important");
      }
    }
    window.closeCreateRoleModal = closeCreateRoleModal;

    document.getElementById("createRoleForm").addEventListener("submit", async function(e) {
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
          credentials: "same-origin",
          body: JSON.stringify({ code: code, name: name, description: description, permissionIds: checkedPerms })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create role");
        closeCreateRoleModal();
        loadRoles();
      } catch (err) {
        alert(err.message);
      }
    });

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
      if (modal) {
        modal.style.setProperty("display", "flex", "important");
      }
    }
    window.openEditRoleModal = openEditRoleModal;

    function closeEditRoleModal() {
      var modal = document.getElementById("editRoleModal");
      if (modal) {
        modal.style.setProperty("display", "none", "important");
      }
    }
    window.closeEditRoleModal = closeEditRoleModal;

    document.getElementById("editRoleForm").addEventListener("submit", async function(e) {
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
          credentials: "same-origin",
          body: JSON.stringify({ name: name, description: description, permissionIds: checkedPerms })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update role");
        closeEditRoleModal();
        loadRoles();
      } catch (err) {
        alert(err.message);
      }
    });

    async function deleteRole(id) {
      if (!confirm("Are you sure you want to delete this role?")) return;
      try {
        var res = await fetch("/roles/" + id, {
          method: "DELETE",
          headers: authHeaders(),
          credentials: "same-origin"
        });
        if (!res.ok) {
          var data = await res.json();
          throw new Error(data.message || "Delete role failed");
        }
        loadRoles();
      } catch (err) {
        alert(err.message);
      }
    }
    window.deleteRole = deleteRole;

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
      } catch (err) {
        resultArea.textContent = "Decoder Error: " + err.message;
      }
    }
    window.runSandboxDecode = runSandboxDecode;

    // Attach click listeners to all tab buttons to ensure 100% click reliability
    function bindTabListeners() {
      var tabList = ["overview", "users", "roles", "database", "webhooks", "decoder"];
      for (var i = 0; i < tabList.length; i++) {
        (function(id) {
          var btn = document.getElementById("tabBtn-" + id);
          if (btn) {
            btn.onclick = function(e) {
              e.preventDefault();
              switchTab(id);
            };
          }
        })(tabList[i]);
      }
    }

    // Check active session on load
    async function initPage() {
      bindTabListeners();

      try {
        var rawUser = localStorage.getItem("lorawan_user");
        if (rawUser && rawUser.startsWith("{")) {
          var storedUser = JSON.parse(rawUser);
          if (storedUser) updateUserNav(storedUser);
        }

        var res = await fetch("/auth/session", { headers: authHeaders(), credentials: "same-origin" });
        if (res.ok) {
          var user = await res.json();
          localStorage.setItem("lorawan_user", JSON.stringify(user));
          updateUserNav(user);
        }
      } catch (err) {
        console.warn("Session check notice:", err);
      }

      loadUsers();
      loadRoles();
      loadDatabaseHealth();
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
