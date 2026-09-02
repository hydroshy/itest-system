export const CONTROL_PANEL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Control Panel - Daviteq LoRaWAN Platform</title>
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
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm shadow-inner">
            <i class="fa-solid fa-tower-broadcast"></i>
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

      <!-- Center / Horizontal Pill Tabs (All 8 Admin Management Tabs) -->
      <nav class="hidden md:flex items-center gap-1 overflow-x-auto custom-scroll py-1">
        <button @click="activeTab = 'overview'" :class="{ active: activeTab === 'overview' }" class="tab-btn">
          <i class="fa-solid fa-chart-pie text-xs"></i> <span>Overview</span>
        </button>

        <button @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }" class="tab-btn">
          <i class="fa-solid fa-users text-xs"></i> <span>Users</span>
        </button>

        <button @click="activeTab = 'roles'" :class="{ active: activeTab === 'roles' }" class="tab-btn">
          <i class="fa-solid fa-shield-halved text-xs"></i> <span>Roles</span>
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

    <!-- MOBILE NAVIGATION TABS (Visible only on small screens) -->
    <div class="md:hidden flex items-center gap-1 overflow-x-auto custom-scroll p-2 bg-slate-950/80 border-b border-slate-800">
      <button @click="activeTab = 'overview'" :class="{ active: activeTab === 'overview' }" class="tab-btn text-xs py-1 px-2.5">Overview</button>
      <button @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }" class="tab-btn text-xs py-1 px-2.5">Users</button>
      <button @click="activeTab = 'roles'" :class="{ active: activeTab === 'roles' }" class="tab-btn text-xs py-1 px-2.5">Roles</button>
      <button @click="activeTab = 'database'" :class="{ active: activeTab === 'database' }" class="tab-btn text-xs py-1 px-2.5">Database</button>
      <button @click="activeTab = 'devices'" :class="{ active: activeTab === 'devices' }" class="tab-btn text-xs py-1 px-2.5">Devices</button>
      <button @click="activeTab = 'telemetry'" :class="{ active: activeTab === 'telemetry' }" class="tab-btn text-xs py-1 px-2.5">Telemetry</button>
      <button @click="activeTab = 'webhooks'" :class="{ active: activeTab === 'webhooks' }" class="tab-btn text-xs py-1 px-2.5">Webhooks</button>
      <button @click="activeTab = 'decoder'" :class="{ active: activeTab === 'decoder' }" class="tab-btn text-xs py-1 px-2.5">Decoder</button>
    </div>

    <!-- MAIN BODY CONTAINER (Instant Tab Switching via v-show) -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      <!-- TAB 1: OVERVIEW -->
      <div v-show="activeTab === 'overview'" class="space-y-6">
        <!-- Metric Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

          <div class="glass-card rounded-xl p-4 space-y-1">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Total Accounts</span>
              <i class="fa-solid fa-users text-emerald-400 text-sm"></i>
            </div>
            <div class="text-xl font-extrabold text-white pt-1">{{ usersList.length || '--' }}</div>
            <div class="text-[11px] text-slate-500">Super Admins & Operators</div>
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
              <i class="fa-solid fa-bolt text-sky-400"></i> Platform Architecture
            </div>
            <p class="text-xs text-slate-400 leading-relaxed">
              Daviteq LoRaWAN Application Server provides enterprise-grade telemetry ingestion, dynamic PostgreSQL table routing, and granular 5-table role-based access control.
            </p>
            <div class="grid grid-cols-2 gap-2.5 pt-2">
              <div class="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                <span class="text-[11px] text-slate-500 block">Access Control</span>
                <span class="text-xs font-bold text-emerald-400 mt-0.5 block">5-Table RBAC Model</span>
              </div>
              <div class="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                <span class="text-[11px] text-slate-500 block">Database Status</span>
                <span class="text-xs font-bold text-sky-400 mt-0.5 block">core_db (dvt) Active</span>
              </div>
            </div>
          </div>

          <div class="glass-card rounded-xl p-5 space-y-3">
            <div class="flex items-center gap-2 text-sm font-bold text-white">
              <i class="fa-solid fa-link text-emerald-400"></i> Quick Navigation Shortcuts
            </div>
            <div class="space-y-2 text-xs">
              <button @click="activeTab = 'users'" class="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-sky-500/40 transition cursor-pointer text-slate-300 font-medium">
                <span class="flex items-center gap-2"><i class="fa-solid fa-users text-sky-400"></i> User Directory & Permissions</span>
                <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
              </button>
              <button @click="activeTab = 'roles'" class="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer text-slate-300 font-medium">
                <span class="flex items-center gap-2"><i class="fa-solid fa-shield-halved text-amber-400"></i> Role Matrix & View Access Matrix</span>
                <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
              </button>
              <button @click="activeTab = 'database'" class="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer text-slate-300 font-medium">
                <span class="flex items-center gap-2"><i class="fa-solid fa-database text-emerald-400"></i> Database Health & Table Counts</span>
                <i class="fa-solid fa-arrow-right text-slate-500 text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: USERS -->
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

      <!-- TAB 3: ROLES -->
      <div v-show="activeTab === 'roles'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-shield-halved text-amber-400"></i> Role & Permissions Matrix (RBAC)
              </h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Admin controls which views & parameters are accessible to each role</p>
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

          <!-- Role Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div v-for="r in rolesList" :key="r.id" class="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span :class="r.code === 'SUPER_ADMIN' ? 'text-emerald-400' : 'text-sky-400'" class="font-bold text-xs flex items-center gap-1.5">
                  <i :class="r.code === 'SUPER_ADMIN' ? 'fa-crown' : 'fa-user-shield'" class="fa-solid"></i> {{ r.name }}
                </span>
                <span :class="r.code === 'SUPER_ADMIN' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-slate-800 text-slate-400 border-slate-700'" class="px-2 py-0.5 rounded text-[10px] font-mono border">
                  {{ r.code }}
                </span>
              </div>
              <p class="text-[11px] text-slate-400">{{ r.description || 'No description provided' }}</p>
              <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>{{ r.permissions ? r.permissions.length : 0 }} privileges enabled</span>
                <button v-if="r.code !== 'SUPER_ADMIN'" @click="openEditRoleDialog(r)" class="text-sky-400 hover:text-sky-300 font-medium cursor-pointer">Edit Permissions</button>
                <span v-else class="text-slate-600 font-mono text-[10px]">Protected</span>
              </div>
            </div>
          </div>

          <!-- Roles Table Details -->
          <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3.5">Role Code</th>
                  <th class="py-2.5 px-3.5">Display Name</th>
                  <th class="py-2.5 px-3.5">Description</th>
                  <th class="py-2.5 px-3.5">Enabled Views & Privileges</th>
                  <th class="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-for="r in rolesList" :key="r.id" class="hover:bg-slate-800/30 transition">
                  <td :class="r.code === 'SUPER_ADMIN' ? 'text-emerald-400' : 'text-sky-400'" class="py-2.5 px-3.5 font-mono font-bold">{{ r.code }}</td>
                  <td class="py-2.5 px-3.5 font-bold text-white">{{ r.name }}</td>
                  <td class="py-2.5 px-3.5 text-slate-400">{{ r.description || '--' }}</td>
                  <td class="py-2.5 px-3.5">
                    <span v-for="p in (r.permissions || [])" :key="p.id" class="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] mr-1 mb-1 border border-slate-700">
                      {{ p.name }}
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

      <!-- TAB 4: DATABASE HEALTH (Shows core_db • ONLINE here) -->
      <div v-show="activeTab === 'database'" class="space-y-4">
        <div class="glass-card rounded-xl p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-heart-pulse text-emerald-400"></i> Visual Database Health & Metrics
                </h2>
                <!-- core_db • ONLINE status badge displayed HERE in Database tab -->
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

      <!-- TAB 5: DEVICES -->
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
                  <th class="py-2.5 px-3.5">Activation</th>
                  <th class="py-2.5 px-3.5">Decoder Script</th>
                  <th class="py-2.5 px-3.5">Status</th>
                  <th class="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr v-if="devicesList.length === 0">
                  <td colspan="6" class="py-6 text-center text-slate-500">No LoRaWAN devices registered.</td>
                </tr>
                <tr v-for="d in devicesList" :key="d.id || d.devEUI" class="hover:bg-slate-800/30 transition">
                  <td class="py-2.5 px-3.5 font-mono font-bold text-sky-400">{{ d.devEUI }}</td>
                  <td class="py-2.5 px-3.5 font-bold text-white">{{ d.name || '--' }}</td>
                  <td class="py-2.5 px-3.5"><span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">{{ d.activationType || 'OTAA' }}</span></td>
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

      <!-- TAB 6: TELEMETRY -->
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

      <!-- TAB 7: WEBHOOKS -->
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

      <!-- TAB 8: DECODER SANDBOX -->
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

    <!-- MODAL: CREATE ROLE -->
    <div v-if="createRoleDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-amber-400"></i> Create New Role
          </h3>
          <button @click="createRoleDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitCreateRole" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Role Code (Uppercase)</label>
              <input v-model="newRole.code" type="text" required placeholder="e.g. AUDITOR" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Display Name</label>
              <input v-model="newRole.name" type="text" required placeholder="e.g. System Auditor" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input v-model="newRole.description" type="text" placeholder="Description of role permissions" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="font-bold text-slate-200">Assign Permissions & Views:</label>
              <button type="button" @click="toggleSelectAllPermissions(newRole)" class="text-amber-400 hover:text-amber-300 text-[11px] font-semibold cursor-pointer">Toggle All</button>
            </div>
            <div class="max-h-52 overflow-y-auto custom-scroll p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div v-for="(perms, groupName) in groupedPermissions" :key="groupName" class="space-y-1">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-0.5">{{ groupName }}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  <label v-for="p in perms" :key="p.id" class="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 text-slate-300 hover:text-white cursor-pointer select-none">
                    <input type="checkbox" :value="p.id" v-model="newRole.permissions" class="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0" />
                    <div>
                      <div class="font-mono text-[11px] text-amber-400 font-semibold">{{ p.name }}</div>
                      <div class="text-[10px] text-slate-500">{{ p.description }}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="createRoleDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingRole" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer">Create Role</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: EDIT ROLE -->
    <div v-if="editRoleDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-pen-to-square text-sky-400"></i> Edit Role Definition
          </h3>
          <button @click="editRoleDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitEditRole" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Role Code</label>
              <input v-model="editingRole.code" type="text" disabled class="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-400 font-mono" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Display Name</label>
              <input v-model="editingRole.name" type="text" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input v-model="editingRole.description" type="text" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="font-bold text-slate-200">Assign Permissions & Views:</label>
              <button type="button" @click="toggleSelectAllPermissions(editingRole)" class="text-sky-400 hover:text-sky-300 text-[11px] font-semibold cursor-pointer">Toggle All</button>
            </div>
            <div class="max-h-52 overflow-y-auto custom-scroll p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div v-for="(perms, groupName) in groupedPermissions" :key="groupName" class="space-y-1">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-0.5">{{ groupName }}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  <label v-for="p in perms" :key="p.id" class="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 text-slate-300 hover:text-white cursor-pointer select-none">
                    <input type="checkbox" :value="p.id" v-model="editingRole.permissions" class="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0" />
                    <div>
                      <div class="font-mono text-[11px] text-sky-400 font-semibold">{{ p.name }}</div>
                      <div class="text-[10px] text-slate-500">{{ p.description }}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="editRoleDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingRole" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer">Update Role</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: REGISTER DEVICE -->
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
            <label class="block font-semibold text-slate-300 mb-1">DevEUI (16 Hex Characters)</label>
            <input v-model="newDevice.devEUI" type="text" required placeholder="0018B20000000001" maxlength="16" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Device Name</label>
            <input v-model="newDevice.name" type="text" required placeholder="e.g. Temperature Sensor 01" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
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
        const usersList = ref([]);
        const rolesList = ref([]);
        const allPermissions = ref([]);
        const dbHealth = ref({ totalConnections: 1, connections: {}, tableStats: {} });
        const devicesList = ref([]);
        const telemetryList = ref([]);

        const loadingUsers = ref(false);
        const loadingRoles = ref(false);

        // Modals
        const createUserDialog = ref(false);
        const editUserDialog = ref(false);
        const createRoleDialog = ref(false);
        const editRoleDialog = ref(false);
        const registerDeviceDialog = ref(false);

        const savingUser = ref(false);
        const savingRole = ref(false);
        const savingDevice = ref(false);

        const newUser = ref({ username: '', fullName: '', email: '', password: '', userType: 'USER', roleId: '' });
        const editUser = ref({ id: '', username: '', roleId: '', isActive: true });
        const newRole = ref({ code: '', name: '', description: '', permissions: [] });
        const editingRole = ref({ id: '', code: '', name: '', description: '', permissions: [] });
        const newDevice = ref({ devEUI: '', name: '', activationType: 'OTAA', appKey: '' });

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
          if (!user || !user.username) return true; // Default admin view in control panel
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

        const groupedPermissions = computed(() => {
          const groups = {
            'Module: User Accounts': [],
            'Module: RBAC Roles': [],
            'Module: Database Health': [],
            'Module: LoRaWAN Fleet & Devices': [],
            'Module: Telemetry Stream': [],
            'Module: Webhook Endpoints': [],
            'Module: Decoder Sandbox': []
          };
          allPermissions.value.forEach(p => {
            if (p.name.startsWith('users:')) groups['Module: User Accounts'].push(p);
            else if (p.name.startsWith('roles:')) groups['Module: RBAC Roles'].push(p);
            else if (p.name.startsWith('database:')) groups['Module: Database Health'].push(p);
            else if (p.name.startsWith('lorawan:device:')) groups['Module: LoRaWAN Fleet & Devices'].push(p);
            else if (p.name.startsWith('lorawan:telemetry:')) groups['Module: Telemetry Stream'].push(p);
            else if (p.name.startsWith('lorawan:webhooks:')) groups['Module: Webhook Endpoints'].push(p);
            else if (p.name.startsWith('lorawan:decoder:')) groups['Module: Decoder Sandbox'].push(p);
            else groups['Module: LoRaWAN Fleet & Devices'].push(p);
          });
          return groups;
        });

        const toggleSelectAllPermissions = (targetRole) => {
          if (targetRole.permissions.length === allPermissions.value.length) {
            targetRole.permissions = [];
          } else {
            targetRole.permissions = allPermissions.value.map(p => p.id);
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
          } catch(e) {
            console.error(e);
          }
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

        // Role CRUD
        const openCreateRoleDialog = () => {
          newRole.value = { code: '', name: '', description: '', permissions: [] };
          createRoleDialog.value = true;
        };

        const submitCreateRole = async () => {
          savingRole.value = true;
          try {
            const res = await fetch('/roles', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                code: newRole.value.code.trim().toUpperCase(),
                name: newRole.value.name.trim(),
                description: newRole.value.description.trim(),
                permissionIds: newRole.value.permissions
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create role");
            showToast("Role created successfully!", "success");
            createRoleDialog.value = false;
            fetchRoles();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingRole.value = false;
          }
        };

        const openEditRoleDialog = (r) => {
          editingRole.value = {
            id: r.id,
            code: r.code,
            name: r.name,
            description: r.description || '',
            permissions: (r.permissions || []).map(p => p.id)
          };
          editRoleDialog.value = true;
        };

        const submitEditRole = async () => {
          savingRole.value = true;
          try {
            const res = await fetch('/roles/' + editingRole.value.id, {
              method: 'PUT',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                name: editingRole.value.name.trim(),
                description: editingRole.value.description.trim(),
                permissionIds: editingRole.value.permissions
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update role");
            showToast("Role updated successfully!", "success");
            editRoleDialog.value = false;
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

        // Device CRUD
        const openRegisterDeviceDialog = () => {
          newDevice.value = { devEUI: '', name: '', activationType: 'OTAA', appKey: '' };
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
                appKey: newDevice.value.appKey ? newDevice.value.appKey.trim() : undefined
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to register device");
            showToast("Device registered successfully!", "success");
            registerDeviceDialog.value = false;
            fetchDevices();
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
          if (newTab === 'users') fetchUsers();
          if (newTab === 'roles') fetchRoles();
          if (newTab === 'database') fetchDbHealth();
          if (newTab === 'devices') fetchDevices();
          if (newTab === 'telemetry') fetchTelemetry();
        });

        const initControlPanel = async () => {
          const ok = await fetchSession();
          if (!ok) return;

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
          groupedPermissions,
          toggleSelectAllPermissions,
          usersList,
          rolesList,
          allPermissions,
          dbHealth,
          devicesList,
          telemetryList,
          loadingUsers,
          loadingRoles,
          createUserDialog,
          editUserDialog,
          createRoleDialog,
          editRoleDialog,
          registerDeviceDialog,
          savingUser,
          savingRole,
          savingDevice,
          newUser,
          editUser,
          newRole,
          editingRole,
          newDevice,
          sandboxCode,
          sandboxHex,
          sandboxResult,
          toast,
          handleLogout,
          copyUrl,
          formatTime,
          formatDecoded,
          fetchUsers,
          fetchRoles,
          fetchDbHealth,
          reloadDbConfig,
          fetchDevices,
          fetchTelemetry,
          openCreateUserDialog,
          submitCreateUser,
          openEditUserDialog,
          submitEditUser,
          deleteUser,
          openCreateRoleDialog,
          submitCreateRole,
          openEditRoleDialog,
          submitEditRole,
          deleteRole,
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
