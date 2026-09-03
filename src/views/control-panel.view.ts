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
  <link rel="prefetch" href="/dashboard" />
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
    .glass-sidebar {
      background: rgba(10, 15, 30, 0.95);
      backdrop-filter: blur(16px);
      border-right: 1px solid rgba(30, 41, 59, 0.8);
    }
    .glass-card {
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(30, 41, 59, 0.8);
      transition: border-color 0.15s ease;
    }
    .nav-item {
      padding: 0.55rem 0.85rem;
      border-radius: 0.625rem;
      font-weight: 600;
      font-size: 0.8125rem;
      color: #94a3b8;
      transition: all 0.15s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
      width: 100%;
      text-align: left;
    }
    .nav-item:hover {
      color: #ffffff;
      background: rgba(30, 41, 59, 0.6);
    }
    .nav-item.active {
      color: #38bdf8 !important;
      background: rgba(14, 165, 233, 0.12) !important;
      border: 1px solid rgba(56, 189, 248, 0.35) !important;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.12);
    }
    [v-cloak] { display: none !important; }
    .modal-backdrop {
      background: rgba(2, 6, 23, 0.85);
      backdrop-filter: blur(6px);
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased">
  <div id="app" v-cloak class="flex-1 flex flex-col min-h-screen" @click="handleGlobalClick">
    
    <!-- TOP APP BAR -->
    <header class="glass-header sticky top-0 z-40 px-4 sm:px-6 h-14 flex items-center justify-between">
      <!-- Left Brand & Navigation -->
      <div class="flex items-center gap-3">
        <!-- Logo Button (Locked at identical position with Dashboard) -->
        <button
          @click="switchTab('overview')"
          title="Return to Overview Home"
          class="flex items-center gap-2.5 text-white font-extrabold text-sm tracking-tight text-decoration-none hover:opacity-90 transition cursor-pointer"
        >
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center p-0.5 shadow-inner overflow-hidden">
            <img src="/images/logo-navbar.png" onerror="this.onerror=null; this.src='/images/logo-full.png'; this.onerror=function(){this.src='/images/favicon.png';};" class="w-full h-full object-contain rounded-md" alt="Daviteq Logo" />
          </div>
          <div class="leading-none text-left">
            <div class="flex items-center gap-1.5">
              <span><span class="text-sky-400">DAVITEQ</span> IoT</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">Admin</span>
            </div>
            <span class="text-[10px] text-slate-400 font-normal">Control Panel</span>
          </div>
        </button>

        <!-- Mobile Sidebar Toggle Button -->
        <button @click="sidebarOpen = !sidebarOpen" class="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer" title="Toggle Sidebar">
          <i class="fa-solid fa-bars text-sm"></i>
        </button>

        <!-- Breadcrumb Active Section Indicator -->
        <div v-if="activeTab !== 'overview'" class="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-400">
          <button @click="switchTab('overview')" class="hover:text-white transition flex items-center gap-1 font-medium cursor-pointer">
            <i class="fa-solid fa-chart-pie text-[11px] text-sky-400"></i> Overview
          </button>
          <span class="text-slate-500">/</span>
          <span class="text-sky-400 font-semibold capitalize">{{ activeTabLabel }}</span>
        </div>
      </div>

      <!-- Right Actions & User Menu Dropdown -->
      <div class="flex items-center gap-2.5">
        <div class="relative">
          <button
            @click.stop="userMenuOpen = !userMenuOpen"
            class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer select-none"
          >
            <div class="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs">
              {{ userInitials }}
            </div>
            <span class="text-xs font-bold text-slate-200 hidden sm:inline">{{ currentUser.fullName || currentUser.username || 'Administrator' }}</span>
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
              <div class="text-xs font-bold text-white">{{ currentUser.fullName || currentUser.username || 'Administrator' }}</div>
              <div class="text-[11px] font-mono text-slate-400">@{{ currentUser.username || 'admin' }}</div>
              <div class="pt-1">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {{ isSuperAdmin ? 'SUPER_ADMIN' : (currentUser.userType || 'ADMIN') }}
                </span>
              </div>
            </div>

            <!-- Portal Switch Navigation Links -->
            <div class="space-y-1 text-xs pb-3 border-b border-slate-800">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-1">Switch View</div>
              
              <button
                @click="navigateTo('/dashboard')"
                class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition flex items-center justify-between cursor-pointer"
              >
                <span class="flex items-center gap-2"><i class="fa-solid fa-layer-group text-sky-400"></i> User Dashboard</span>
                <i class="fa-solid fa-arrow-right text-[10px] text-slate-500"></i>
              </button>

              <div class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
                <span class="flex items-center gap-2"><i class="fa-solid fa-sliders"></i> Control Panel</span>
                <span class="text-[9px] font-mono font-bold uppercase bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-300">Active</span>
              </div>
            </div>

            <!-- Platform Info -->
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

    <!-- WORKSPACE: LEFT SIDEBAR + MAIN CONTENT AREA -->
    <div class="flex-1 flex overflow-hidden">
      
      <!-- MOBILE BACKDROP OVERLAY -->
      <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-slate-950/80 z-30 md:hidden backdrop-blur-sm"></div>

      <!-- LEFT SIDEBAR NAVIGATION -->
      <aside
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
        class="fixed md:static inset-y-0 left-0 z-30 w-60 glass-sidebar flex flex-col justify-between p-3.5 transition-transform duration-200 ease-in-out md:flex-shrink-0 mt-14 md:mt-0"
      >
        <div class="space-y-5 custom-scroll overflow-y-auto flex-1 pr-1">
          <!-- GROUP 1: CORE GOVERNANCE -->
          <div class="space-y-1">
            <div class="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Core Governance</div>
            
            <button @click="switchTab('overview')" :class="{ active: activeTab === 'overview' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-chart-pie w-4 text-center text-xs text-sky-400"></i>
                <span>Overview Hub</span>
              </span>
            </button>

            <button @click="switchTab('modules')" :class="{ active: activeTab === 'modules' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-cubes w-4 text-center text-xs text-cyan-400"></i>
                <span>Feature Modules</span>
              </span>
              <span v-if="modulesList.length" class="px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-mono">{{ modulesList.length }}</span>
            </button>

            <button @click="switchTab('roles')" :class="{ active: activeTab === 'roles' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-shield-halved w-4 text-center text-xs text-amber-400"></i>
                <span>Roles & RBAC</span>
              </span>
              <span v-if="rolesList.length" class="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-mono">{{ rolesList.length }}</span>
            </button>

            <button @click="switchTab('users')" :class="{ active: activeTab === 'users' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-users w-4 text-center text-xs text-emerald-400"></i>
                <span>User Accounts</span>
              </span>
              <span v-if="usersList.length" class="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-mono">{{ usersList.length }}</span>
            </button>
          </div>

          <!-- GROUP 2: INFRASTRUCTURE & IOT -->
          <div class="space-y-1">
            <div class="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Infrastructure & IoT</div>

            <button @click="switchTab('network-servers')" :class="{ active: activeTab === 'network-servers' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-tower-broadcast w-4 text-center text-xs text-sky-400"></i>
                <span>Network Servers</span>
              </span>
              <span v-if="networkServersList.length" class="px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-mono">{{ networkServersList.length }}</span>
            </button>

            <button @click="switchTab('database')" :class="{ active: activeTab === 'database' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-database w-4 text-center text-xs text-indigo-400"></i>
                <span>Database Health</span>
              </span>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            <button @click="switchTab('devices')" :class="{ active: activeTab === 'devices' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-microchip w-4 text-center text-xs text-teal-400"></i>
                <span>Device Fleet</span>
              </span>
              <span v-if="devicesList.length" class="px-1.5 py-0.2 rounded-full bg-teal-500/15 text-teal-300 text-[10px] font-mono">{{ devicesList.length }}</span>
            </button>

            <button @click="switchTab('webhooks')" :class="{ active: activeTab === 'webhooks' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-satellite-dish w-4 text-center text-xs text-sky-400"></i>
                <span>Webhook Manager</span>
              </span>
              <span v-if="webhookStats.totalCount" class="px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-mono">{{ webhookStats.totalCount }}</span>
            </button>

            <button @click="switchTab('decoder')" :class="{ active: activeTab === 'decoder' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-code w-4 text-center text-xs text-purple-400"></i>
                <span>Decoder Manager</span>
              </span>
              <span v-if="decodersList.length" class="px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-mono">{{ decodersList.length }}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT AREA -->
      <main class="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 space-y-6">
        
        <!-- TAB 1: OVERVIEW & CENTRAL MANAGEMENT HUB -->
        <div v-show="activeTab === 'overview'" class="space-y-6">
          <!-- Top Stat Metrics -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div class="glass-card rounded-xl p-4 space-y-1">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Platform Engine</span>
                <i class="fa-solid fa-server text-sky-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white flex items-center gap-2 pt-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
              </div>
              <div class="text-[11px] text-slate-500">NestJS Core Runtime</div>
            </div>

            <div @click="switchTab('network-servers')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-sky-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Network Servers</span>
                <i class="fa-solid fa-tower-broadcast text-sky-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ networkServersList.length || '--' }}</div>
              <div class="text-[11px] text-slate-500">ThingPark & ChirpStack v4</div>
            </div>

            <div @click="switchTab('modules')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-cyan-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Dashboard Modules</span>
                <i class="fa-solid fa-cubes text-cyan-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ modulesList.length || '--' }}</div>
              <div class="text-[11px] text-slate-500">{{ modulesList.filter(m => m.isActive !== false).length }} Active on User Portal</div>
            </div>

            <div @click="switchTab('roles')" class="glass-card rounded-xl p-4 space-y-1 cursor-pointer hover:border-amber-500/40 transition">
              <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>System Roles</span>
                <i class="fa-solid fa-shield-halved text-amber-400 text-sm"></i>
              </div>
              <div class="text-xl font-extrabold text-white pt-1">{{ rolesList.length || '--' }}</div>
              <div class="text-[11px] text-slate-500">RBAC Role Definitions</div>
            </div>
          </div>

          <!-- INTERACTIVE MANAGEMENT HUB GRID (Direct access to all sections) -->
          <div class="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <h2 class="text-base font-extrabold text-white flex items-center gap-2">
                <i class="fa-solid fa-grid-2 text-sky-400"></i> Admin Management Hub
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Quickly jump into any administrative module or system governance function</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              
              <!-- Card: Network Servers -->
              <div @click="switchTab('network-servers')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-sky-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-tower-broadcast"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {{ networkServersList.length }} Configured
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-sky-400 transition">Network Servers Management</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Manage ThingPark Wireless and ChirpStack v4 connections, Route References, API keys, and Region profiles.</p>
                </div>
                <div class="text-xs text-sky-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Servers</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Modules -->
              <div @click="switchTab('modules')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-cubes"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {{ modulesList.length }} Modules
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-cyan-400 transition">Feature Modules Management</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Configure feature cards, customize categories, and assign role visibility for User Dashboard.</p>
                </div>
                <div class="text-xs text-cyan-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Modules</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Roles -->
              <div @click="switchTab('roles')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-amber-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-shield-halved"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {{ rolesList.length }} Roles
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-amber-400 transition">Roles & Permissions (RBAC)</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Define system roles, group privileges by functional area, and control operational capabilities.</p>
                </div>
                <div class="text-xs text-amber-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Configure Roles</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Users -->
              <div @click="switchTab('users')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-users"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {{ usersList.length }} Users
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-emerald-400 transition">User Directory</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Create and manage accounts, assign roles, toggle account status, and configure credentials.</p>
                </div>
                <div class="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Users</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Database -->
              <div @click="switchTab('database')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-database"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    ONLINE
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-indigo-400 transition">Database Health & Routing</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Real-time PostgreSQL connection latency, live table statistics, and dynamic multi-DB pool routing.</p>
                </div>
                <div class="text-xs text-indigo-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>View Database</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

              <!-- Card: Devices -->
              <div @click="switchTab('devices')" class="p-4 bg-slate-950/80 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-teal-500/40 transition cursor-pointer space-y-3 group">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-base shadow-inner group-hover:scale-105 transition">
                    <i class="fa-solid fa-microchip"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {{ devicesList.length }} Devices
                  </span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white group-hover:text-teal-400 transition">LoRaWAN Device Fleet</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">Register End-Devices, manage DevEUIs, configure OTAA/ABP keys, and link payload decoders.</p>
                </div>
                <div class="text-xs text-teal-400 font-semibold flex items-center gap-1.5 pt-1">
                  <span>Manage Fleet</span> <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition"></i>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- TAB 2: NETWORK SERVERS (ThingPark & ChirpStack v4 Management) -->
        <div v-show="activeTab === 'network-servers'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-tower-broadcast text-sky-400"></i> Network Servers Management
                  </h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/25">
                    {{ networkServersList.length }} Servers
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Configure Actility ThingPark Wireless and ChirpStack v4 instances, Route References, and Region Profiles</p>
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

            <!-- Server Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="networkServersList.length === 0" class="col-span-2 py-10 text-center text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800">
                <i class="fa-solid fa-tower-broadcast text-3xl text-slate-700 mb-2"></i>
                <div class="text-sm font-bold text-slate-400">No Network Servers Configured</div>
                <p class="text-xs text-slate-500 mt-1">Add your ThingPark or ChirpStack server to start routing LoRaWAN traffic.</p>
                <button @click="openCreateNetworkServerDialog" class="mt-4 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg cursor-pointer">
                  + Add Network Server Now
                </button>
              </div>

              <div
                v-for="ns in networkServersList"
                :key="ns.id"
                class="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition duration-150 space-y-4 flex flex-col justify-between"
              >
                <div class="space-y-3">
                  <!-- Header -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div :class="ns.type === 'THINGPARK' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-sky-500/10 border-sky-500/30 text-sky-400'" class="w-10 h-10 rounded-xl border flex items-center justify-center text-lg shadow-inner">
                        <i :class="ns.type === 'THINGPARK' ? 'fa-solid fa-satellite-dish' : 'fa-solid fa-tower-cell'"></i>
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <h3 class="text-sm font-bold text-white">{{ ns.name }}</h3>
                          <span v-if="ns.isDefault" class="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-bold">DEFAULT</span>
                        </div>
                        <div class="text-[10px] font-mono text-slate-400 mt-0.5">Type: <strong class="text-sky-400">{{ ns.type }}</strong></div>
                      </div>
                    </div>
                    <span :class="ns.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border">
                      {{ ns.status || 'CONFIGURED' }}
                    </span>
                  </div>

                  <p class="text-xs text-slate-400 leading-relaxed">{{ ns.description || 'Enterprise LoRaWAN Network Server instance' }}</p>

                  <!-- API & Routing Details -->
                  <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                    <div class="flex items-center justify-between">
                      <span class="text-slate-500 text-[11px]">API Base URL:</span>
                      <span class="text-slate-200 truncate max-w-xs">{{ ns.apiUrl || '--' }}</span>
                    </div>
                    <div v-if="ns.routeRef" class="flex items-center justify-between">
                      <span class="text-slate-500 text-[11px]">Default RouteRef:</span>
                      <span class="text-emerald-400 font-bold">{{ ns.routeRef }}</span>
                    </div>
                    <div v-if="ns.applicationId" class="flex items-center justify-between">
                      <span class="text-slate-500 text-[11px]">Application ID:</span>
                      <span class="text-cyan-400 font-mono text-[11px] truncate max-w-xs">{{ ns.applicationId }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-slate-500 text-[11px]">Webhook Endpoint:</span>
                      <button @click="copyUrl(ns.type === 'THINGPARK' ? '/lorawan/webhook/thingpark' : '/lorawan/webhook/chirpstack')" class="text-sky-400 hover:text-sky-300 text-[11px] font-sans font-semibold cursor-pointer">
                        <i class="fa-solid fa-copy mr-1"></i> Copy Ingestion URL
                      </button>
                    </div>
                  </div>

                  <!-- Region Profiles List -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>Region Profiles:</span>
                      <span class="text-slate-500 font-mono">{{ (ns.regionProfiles || []).length }} Regions</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      <span v-for="rp in (ns.regionProfiles || [])" :key="rp.id || rp.region" class="px-2 py-0.8 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono flex items-center gap-1.5">
                        <span class="text-sky-400 font-bold">{{ rp.region }}</span>
                        <span class="text-slate-500">&bull;</span>
                        <span class="text-slate-400">{{ rp.routeRef || rp.profileId || rp.name }}</span>
                      </span>
                      <span v-if="!(ns.regionProfiles || []).length" class="text-[11px] text-slate-500 italic">No region profiles configured</span>
                    </div>
                  </div>
                </div>

                <!-- Footer Actions -->
                <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button @click="testNetworkServer(ns)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer">
                    <i class="fa-solid fa-bolt text-amber-400"></i> Test Connection
                  </button>
                  <div class="flex items-center gap-1.5">
                    <button @click="openEditNetworkServerDialog(ns)" class="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 font-semibold cursor-pointer">
                      <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button @click="deleteNetworkServer(ns.id)" class="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-semibold cursor-pointer">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: MODULES MANAGEMENT -->
        <div v-show="activeTab === 'modules'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-cubes text-cyan-400"></i> Dashboard Feature Modules Management
                  </h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
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
                <button @click="openCreateModuleDialog" class="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-plus"></i> Add Module
                </button>
              </div>
            </div>

            <!-- Module Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div
                v-for="mod in modulesList"
                :key="mod.id"
                class="p-4 bg-slate-950/75 rounded-2xl border transition duration-150 flex flex-col justify-between space-y-3 group"
                :class="mod.isActive !== false ? 'border-slate-800 hover:border-cyan-500/40' : 'border-red-500/20 opacity-60 bg-red-950/10'"
              >
                <div class="space-y-3">
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

                  <div>
                    <h3 class="text-sm font-bold text-white group-hover:text-cyan-400 transition">{{ mod.title }}</h3>
                    <div class="text-[10px] font-mono text-slate-500 mt-0.5">ID: {{ mod.id }}</div>
                    <p class="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{{ mod.description }}</p>
                  </div>

                  <div class="pt-2 border-t border-slate-800/80 space-y-1">
                    <div class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Permitted Roles:</div>
                    <div class="flex flex-wrap gap-1">
                      <template v-if="mod.allowedRoleCodes && mod.allowedRoleCodes.length">
                        <span v-for="rc in mod.allowedRoleCodes" :key="rc" class="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold">
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

        <!-- TAB 4: ROLES & RBAC MATRIX -->
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

                  <div class="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                    <div class="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Privileges Enabled:</span>
                      <strong class="text-white font-mono">{{ r.permissions ? r.permissions.length : 0 }} / {{ allPermissions.length }}</strong>
                    </div>
                    <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div class="bg-gradient-to-r from-amber-500 to-sky-500 h-1.5 rounded-full" :style="{ width: ((r.permissions ? r.permissions.length : 0) / (allPermissions.length || 1) * 100) + '%' }"></div>
                    </div>
                  </div>

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
          </div>
        </div>

        <!-- TAB 5: USERS -->
        <div v-show="activeTab === 'users'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-users text-emerald-400"></i> User Directory
                </h2>
                <p class="text-[11px] text-slate-400 mt-0.5">Manage administrative and operator accounts</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="fetchUsers" :disabled="loadingUsers" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i :class="loadingUsers ? 'fa-spin' : ''" class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
                <button @click="openCreateUserDialog" class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer">
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

        <!-- TAB 6: DATABASE HEALTH -->
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
                    <td colspan="9" class="py-6 text-center text-slate-500">No LoRaWAN devices registered. Click "Register Device" to provision a device.</td>
                  </tr>
                  <tr v-for="d in devicesList" :key="d.id || d.devEUI" class="hover:bg-slate-800/30 transition">
                    <td class="py-2.5 px-3.5 font-mono font-bold text-sky-400">{{ d.devEUI }}</td>
                    <td class="py-2.5 px-3.5 font-bold text-white">{{ d.name || '--' }}</td>
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

        <!-- TAB 9: DECODER MANAGER -->
        <div v-show="activeTab === 'decoder'" class="space-y-4">
          <div class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-code text-purple-400"></i> LoRaWAN Decoder Manager
                </h2>
                <p class="text-[11px] text-slate-400 mt-0.5">Manage JavaScript decoders by Product SKU & Firmware Version (1 - 32)</p>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="relative">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    v-model="decoderSearchQuery"
                    type="text"
                    placeholder="Search SKU or ID..."
                    class="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono w-40 sm:w-52"
                  />
                </div>
                <button @click="fetchDecoders" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': loadingDecoders }"></i> Refresh
                </button>
                <button @click="openAddDecoderModal" class="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-plus"></i> Add Decoder
                </button>
              </div>
            </div>

            <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3.5">Decoder ID</th>
                    <th class="py-2.5 px-3.5">Product SKU</th>
                    <th class="py-2.5 px-3.5">Firmware</th>
                    <th class="py-2.5 px-3.5">Description</th>
                    <th class="py-2.5 px-3.5">Updated At</th>
                    <th class="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-if="filteredDecoders.length === 0">
                    <td colspan="6" class="py-6 text-center text-slate-500">
                      {{ loadingDecoders ? 'Loading decoders...' : 'No decoders registered. Click "Add Decoder" to create one.' }}
                    </td>
                  </tr>
                  <tr v-for="dec in filteredDecoders" :key="dec.id" class="hover:bg-slate-800/30 transition">
                    <td class="py-2.5 px-3.5 font-mono font-bold text-purple-300">{{ dec.id }}</td>
                    <td class="py-2.5 px-3.5 font-bold text-white">{{ dec.sku }}</td>
                    <td class="py-2.5 px-3.5">
                      <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono font-bold">{{ dec.firmwareVersion }}</span>
                    </td>
                    <td class="py-2.5 px-3.5 text-slate-400 max-w-xs truncate" :title="dec.description || ''">
                      {{ dec.description || '—' }}
                    </td>
                    <td class="py-2.5 px-3.5 text-slate-500 font-mono text-[11px]">
                      {{ formatDateTime(dec.updatedAt) }}
                    </td>
                    <td class="py-2.5 px-3.5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          @click="loadDecoderIntoSandbox(dec)"
                          title="Test in JavaScript Sandbox"
                          class="p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs cursor-pointer"
                        >
                          <i class="fa-solid fa-play"></i>
                        </button>
                        <button
                          @click="openEditDecoderModal(dec)"
                          title="Edit Decoder"
                          class="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs cursor-pointer"
                        >
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          @click="confirmDeleteDecoder(dec)"
                          title="Delete Decoder"
                          class="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs cursor-pointer"
                        >
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- JavaScript Decoder Sandbox & Debugger -->
          <div id="decoder-sandbox-section" class="glass-card rounded-xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <i class="fa-solid fa-terminal text-purple-400"></i> Interactive Payload Sandbox & Debugger
                </h3>
                <p class="text-[11px] text-slate-400 mt-0.5">Test decoder JavaScript against hex payloads with sub-function support.</p>
              </div>

              <div class="flex items-center gap-2">
                <label class="text-[11px] text-slate-400">Quick load:</label>
                <select
                  v-model="selectedSandboxDecoderId"
                  @change="onSelectSandboxDecoder"
                  class="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose saved decoder --</option>
                  <option v-for="d in decodersList" :key="d.id" :value="d.id">{{ d.id }} (FW: {{ d.firmwareVersion }})</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-sans font-semibold text-slate-300">JavaScript Decoder Function</label>
                  <span class="text-[10px] font-sans text-slate-400">Entry: <code class="text-purple-300">decodeUplink(input)</code> or <code class="text-purple-300">Decoder(bytes, fPort)</code></span>
                </div>
                <textarea
                  v-model="sandboxCode"
                  rows="10"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs leading-relaxed"
                ></textarea>
              </div>

              <div class="space-y-2 font-sans">
                <div class="space-y-1">
                  <label class="block text-xs font-semibold text-slate-300">Test Hex String Payload</label>
                  <div class="flex gap-2 font-mono text-xs">
                    <input
                      v-model="sandboxHex"
                      type="text"
                      placeholder="e.g. 09C441"
                      class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                    />
                    <button
                      @click="runSandboxDecode"
                      class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-sans font-bold rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20"
                    >
                      Decode
                    </button>
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-semibold text-slate-300 pt-1">Decoded Output (JSON)</label>
                    <button
                      v-if="sandboxResult"
                      @click="sandboxResult = ''"
                      class="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <pre class="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 overflow-auto text-xs font-mono">{{ sandboxDisplayOutput }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- MODAL: CREATE / EDIT NETWORK SERVER -->
    <div v-if="networkServerDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-tower-broadcast text-sky-400"></i> {{ isEditingNetworkServer ? 'Edit Network Server' : 'Add Network Server Instance' }}
          </h3>
          <button @click="networkServerDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitNetworkServerForm" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Server Name</label>
              <input v-model="currentNetworkServer.name" type="text" required placeholder="e.g. ThingPark Production EU868" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Server Type</label>
              <select v-model="currentNetworkServer.type" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
                <option value="THINGPARK">Actility ThingPark Wireless</option>
                <option value="CHIRPSTACK">ChirpStack v4 Server</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Base API URL</label>
              <input v-model="currentNetworkServer.apiUrl" type="text" placeholder="e.g. http://mas.local:8080 or https://api.thingpark.com" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">API Key / Token (Bearer Token)</label>
              <input v-model="currentNetworkServer.apiKey" type="password" placeholder="Enter API Bearer Token" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500" />
            </div>
          </div>

          <div v-if="currentNetworkServer.type === 'THINGPARK'">
            <label class="block font-semibold text-slate-300 mb-1">Default Route Reference (ThingPark)</label>
            <input v-model="currentNetworkServer.routeRef" type="text" placeholder="e.g. DAVITEQ_DEFAULT_ROUTE" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-sky-500" />
          </div>

          <div v-if="currentNetworkServer.type === 'CHIRPSTACK'">
            <label class="block font-semibold text-slate-300 mb-1">ChirpStack Application ID / UUID (Optional)</label>
            <input v-model="currentNetworkServer.applicationId" type="text" placeholder="e.g. 018e69d7-8947-79b8-a764-96d552bd3b8e" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-sky-500" />
            <p class="text-[10px] text-slate-500 mt-0.5">Leave blank to test using /api/tenants, or provide Application UUID to target a specific ChirpStack application.</p>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input v-model="currentNetworkServer.description" type="text" placeholder="e.g. Primary network server for industrial sensors" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500" />
          </div>

          <!-- Region Profiles Builder -->
          <div class="space-y-2 pt-2 border-t border-slate-800">
            <div class="flex items-center justify-between">
              <div>
                <label class="font-bold text-slate-200">Region Profiles & Frequency Bands</label>
                <p class="text-[11px] text-slate-500">Add frequency regions and routeRef (ThingPark) or profileId (ChirpStack)</p>
              </div>
              <button type="button" @click="addRegionRow" class="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 font-bold cursor-pointer">
                <i class="fa-solid fa-plus mr-1"></i> Add Region
              </button>
            </div>

            <div class="space-y-2 max-h-48 overflow-y-auto custom-scroll p-2 bg-slate-950 border border-slate-800 rounded-xl">
              <div v-if="!(currentNetworkServer.regionProfiles && currentNetworkServer.regionProfiles.length)" class="py-4 text-center text-slate-600 italic">
                No region profiles added. Click "+ Add Region" to configure frequency plans.
              </div>
              <div v-for="(rp, idx) in currentNetworkServer.regionProfiles" :key="idx" class="p-2 bg-slate-900 rounded-lg border border-slate-800 grid grid-cols-12 gap-2 items-center">
                <div class="col-span-3">
                  <select v-model="rp.region" class="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-sky-400 font-mono text-xs">
                    <option value="AS923-1">AS923-1</option>
                    <option value="AS923-2">AS923-2</option>
                    <option value="AS923-3">AS923-3</option>
                    <option value="AS923-4">AS923-4</option>
                    <option value="VN920">VN920</option>
                    <option value="EU868">EU868</option>
                    <option value="US915">US915</option>
                    <option value="AU915">AU915</option>
                    <option value="KR920">KR920</option>
                    <option value="IN865">IN865</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
                <div class="col-span-4">
                  <input v-model="rp.name" type="text" placeholder="Profile Name" class="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white text-xs" />
                </div>
                <div class="col-span-4">
                  <input v-if="currentNetworkServer.type === 'THINGPARK'" v-model="rp.routeRef" type="text" placeholder="RouteRef" class="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono text-xs" />
                  <input v-else v-model="rp.profileId" type="text" placeholder="Profile ID" class="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-cyan-400 font-mono text-xs" />
                </div>
                <div class="col-span-1 text-right">
                  <button type="button" @click="removeRegionRow(idx)" class="text-red-400 hover:text-red-300 p-1 cursor-pointer"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input type="checkbox" v-model="currentNetworkServer.isDefault" class="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0" />
              <span>Set as default Network Server for new devices</span>
            </label>
            <div class="flex gap-2">
              <button type="button" @click="networkServerDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
              <button type="submit" :disabled="savingNetworkServer" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer">Save Server</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CREATE / EDIT FEATURE MODULE -->
    <div v-if="moduleDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-cubes text-cyan-400"></i> {{ isEditingModule ? 'Edit Dashboard Feature Module' : 'Create New Feature Module' }}
          </h3>
          <button @click="moduleDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitModuleForm" class="space-y-3.5 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Module Title</label>
              <input v-model="currentModule.title" type="text" required placeholder="e.g. Water Level Sensor" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Module Slug / ID</label>
              <input v-model="currentModule.id" :disabled="isEditingModule" type="text" required placeholder="e.g. water-level" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono lowercase focus:outline-none focus:border-cyan-500 disabled:opacity-50" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Category</label>
              <select v-model="currentModule.category" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500">
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
              <input v-model="currentModule.badge" type="text" placeholder="e.g. Real-time, Beta, New" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Icon (FontAwesome Class)</label>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center text-cyan-400 text-sm">
                  <i :class="currentModule.icon || 'fa-solid fa-cube'"></i>
                </div>
                <input v-model="currentModule.icon" type="text" placeholder="fa-solid fa-wave-square" class="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500" />
              </div>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Gradient Theme</label>
              <select v-model="currentModule.color" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500">
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
            <textarea v-model="currentModule.description" rows="2" placeholder="Summary of what this module does..." class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"></textarea>
          </div>

          <!-- Role Assignment for this Module -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-200">Permitted Roles for this Module:</label>
              <span class="text-[11px] text-slate-500">(Leave empty to allow all logged in users)</span>
            </div>
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto custom-scroll grid grid-cols-2 gap-2">
              <label v-for="r in rolesList" :key="r.id" class="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 cursor-pointer select-none">
                <input type="checkbox" :value="r.code" v-model="currentModule.allowedRoleCodes" class="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0" />
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
              <button type="submit" :disabled="savingModule" class="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer">Save Module</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CREATE / EDIT ROLE -->
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
            <i class="fa-solid fa-user-plus text-emerald-400"></i> Create User Account
          </h3>
          <button @click="createUserDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitCreateUser" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Username</label>
            <input v-model="newUser.username" type="text" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Full Name <span class="text-slate-500 font-normal">(Optional)</span></label>
            <input v-model="newUser.fullName" type="text" placeholder="Optional" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Email <span class="text-slate-500 font-normal">(Optional)</span></label>
            <input v-model="newUser.email" type="email" placeholder="Optional - Not required for login" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Password</label>
            <input v-model="newUser.password" type="password" required minlength="6" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">User Type</label>
            <select v-model="newUser.userType" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
              <option value="USER">Standard User (USER)</option>
              <option value="SUB_ADMIN">Sub-Administrator (SUB_ADMIN)</option>
              <option value="ADMIN">Super Administrator (ADMIN)</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Assign Role</label>
            <select v-model="newUser.roleId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
              <option value="">No role assigned</option>
              <option v-for="r in rolesList" :key="r.id" :value="r.id">{{ r.name }} ({{ r.code }})</option>
            </select>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="createUserDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" :disabled="savingUser" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer">Save User</button>
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

          <!-- Payload Decoder Selection (SKU_ID) -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Payload Decoder (SKU_ID)</span>
              <span v-if="newDevice.decoderId" class="text-purple-400 font-mono text-[10px]">Selected: {{ newDevice.decoderId }}</span>
            </label>
            <select v-model="newDevice.decoderId" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500">
              <option value="">-- None (No Decoder) --</option>
              <option v-for="dec in decodersList" :key="dec.id" :value="dec.id">
                {{ dec.id }} (SKU: {{ dec.sku }}, FW: {{ dec.firmwareVersion }})
              </option>
            </select>
            <p class="text-[10px] text-slate-500 mt-1">Assign a registered LoRaWAN payload decoder to this device by SKU_ID (e.g. WSLRW-V1A_9)</p>
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

    <!-- MODAL: ADD DECODER -->
    <div v-if="addDecoderDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto custom-scroll">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <i class="fa-solid fa-code text-sm"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                Add New Decoder
                <span v-if="newDecoder.sku && newDecoder.firmwareVersion" class="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/30">
                  ID: {{ newDecoder.sku.trim() }}_{{ newDecoder.firmwareVersion }}
                </span>
              </h3>
              <p class="text-[11px] text-slate-400">Register a LoRaWAN payload decoder by Product SKU and Firmware Version (1 - 32)</p>
            </div>
          </div>
          <button @click="closeAddDecoderModal" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="promptSubmitAddDecoder" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <!-- SKU Input (Empty by default) -->
            <div>
              <label class="block font-semibold text-slate-300 mb-1">
                Product SKU <span class="text-red-400">*</span>
              </label>
              <input
                v-model="newDecoder.sku"
                type="text"
                required
                placeholder="e.g. WSLRW-V1A"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              />
              <p class="text-[10px] text-slate-500 mt-1">Hardware model identifier (Product SKU)</p>
            </div>

            <!-- Firmware Version Dropdown (1 - 32, Empty by default) -->
            <div>
              <label class="block font-semibold text-slate-300 mb-1">
                Firmware Version (1 - 32) <span class="text-red-400">*</span>
              </label>
              <select
                v-model="newDecoder.firmwareVersion"
                required
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="" disabled selected>-- Select Firmware (1 - 32) --</option>
                <option v-for="v in 32" :key="v" :value="v">{{ v }}</option>
              </select>
              <p class="text-[10px] text-slate-500 mt-1">Device firmware version number from 1 to 32</p>
            </div>
          </div>

          <!-- Description (Optional, Empty by default) -->
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input
              v-model="newDecoder.description"
              type="text"
              placeholder="e.g. Decoder for WSLRW-V1A Ambient Temperature & Humidity Sensor"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <!-- Decoder JavaScript Code (Empty by default) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block font-semibold text-slate-300">
                Decoder JavaScript Code <span class="text-red-400">*</span>
              </label>
              <button
                type="button"
                @click="loadSampleDecoderTemplate"
                class="text-[11px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
              >
                Insert Sample Template (Sub-functions & Main)
              </button>
            </div>
            <textarea
              v-model="newDecoder.decoderCode"
              rows="12"
              required
              placeholder="// Enter JavaScript decoder code here...
// Supports helper sub-functions alongside main entry function (decodeUplink or Decoder)
// Example:
// function parseTemp(raw) { return raw / 100; }
// function decodeUplink(input) {
//   var bytes = input.bytes;
//   return { data: { temp: parseTemp((bytes[0] << 8) | bytes[1]) } };
// }"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-purple-500"
            ></textarea>
            <p class="text-[10px] text-slate-500 mt-1">Supports modular sub-functions alongside main entry function <code class="text-purple-300">decodeUplink(input)</code> or <code class="text-purple-300">Decoder(bytes, fPort)</code>.</p>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="closeAddDecoderModal"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition"
            >
              <i class="fa-solid fa-check"></i>
              <span>Submit</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CONFIRM ADD DECODER TO DATABASE -->
    <div v-if="addDecoderConfirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center text-lg flex-shrink-0">
            <i class="fa-solid fa-circle-question"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Confirm Adding Decoder to Database</h3>
            <p class="text-xs text-slate-400 mt-0.5">Please review decoder configuration before committing</p>
          </div>
        </div>

        <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
          <p class="text-slate-300 font-medium">Are you sure you want to add this decoder to the database?</p>
          <div class="space-y-1 font-mono text-[11px] pt-1">
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-500">Product SKU:</span>
              <span class="text-white font-bold">{{ newDecoder.sku }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-500">Firmware Version:</span>
              <span class="text-indigo-300 font-bold">{{ newDecoder.firmwareVersion }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-500">Composite ID:</span>
              <span class="text-purple-400 font-bold">{{ newDecoder.sku ? newDecoder.sku.trim() : '' }}_{{ newDecoder.firmwareVersion }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-500">Database Table:</span>
              <span class="text-emerald-400 font-bold">decoder</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="addDecoderConfirmDialog = false"
            :disabled="savingDecoder"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitAddDecoder"
            :disabled="savingDecoder"
            class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition"
          >
            <i v-if="savingDecoder" class="fa-solid fa-circle-notch fa-spin"></i>
            <i v-else class="fa-solid fa-cloud-arrow-up"></i>
            <span>{{ savingDecoder ? 'Saving...' : 'Yes, Add to Database' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: EDIT DECODER -->
    <div v-if="editDecoderDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto custom-scroll">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-pen-to-square text-purple-400"></i> Edit Decoder: {{ currentDecoder.id }}
            </h3>
            <p class="text-[11px] text-slate-400">SKU: {{ currentDecoder.sku }} | Firmware: {{ currentDecoder.firmwareVersion }}</p>
          </div>
          <button @click="editDecoderDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="submitEditDecoder" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Description</label>
            <input
              v-model="currentDecoder.description"
              type="text"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">JavaScript Decoder Function</label>
            <textarea
              v-model="currentDecoder.decoderCode"
              rows="12"
              required
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-purple-500"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="editDecoderDialog = false"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="savingDecoder"
              class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition"
            >
              <i v-if="savingDecoder" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ savingDecoder ? 'Updating...' : 'Save Changes' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: DELETE DECODER CONFIRM -->
    <div v-if="deleteDecoderConfirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center text-lg flex-shrink-0">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Delete Decoder Confirmation</h3>
            <p class="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          Are you sure you want to permanently delete decoder <code class="font-mono text-purple-300 font-bold">{{ decoderToDelete?.id }}</code> from the database?
        </p>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="deleteDecoderConfirmDialog = false"
            :disabled="savingDecoder"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitDeleteDecoder"
            :disabled="savingDecoder"
            class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer transition"
          >
            <i v-if="savingDecoder" class="fa-solid fa-circle-notch fa-spin"></i>
            <i v-else class="fa-solid fa-trash-can"></i>
            <span>{{ savingDecoder ? 'Deleting...' : 'Delete Decoder' }}</span>
          </button>
        </div>
      </div>
    </div>

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
        const sidebarOpen = ref(false);
        const userMenuOpen = ref(false);
        const currentUser = ref(getStoredUser());

        const userInitials = computed(() => {
          const user = currentUser.value;
          const name = user.fullName || user.username || 'Admin';
          return name.substring(0, 2).toUpperCase();
        });

        const handleGlobalClick = () => {
          userMenuOpen.value = false;
        };

        const navigateTo = (url) => {
          userMenuOpen.value = false;
          document.body.classList.add('page-transitioning');
          setTimeout(() => {
            window.location.href = url;
          }, 120);
        };
        const networkServersList = ref([]);
        const modulesList = ref([]);
        const usersList = ref([]);
        const rolesList = ref([]);
        const allPermissions = ref([]);
        const dbHealth = ref({ totalConnections: 1, connections: {}, tableStats: {} });
        const devicesList = ref([]);

        const loadingUsers = ref(false);
        const loadingRoles = ref(false);
        const savingNetworkServer = ref(false);
        const savingModule = ref(false);
        const savingRole = ref(false);
        const savingUser = ref(false);
        const savingDevice = ref(false);

        // Modals
        const networkServerDialog = ref(false);
        const isEditingNetworkServer = ref(false);
        const moduleDialog = ref(false);
        const isEditingModule = ref(false);
        const roleDialog = ref(false);
        const isEditingRole = ref(false);
        const createUserDialog = ref(false);
        const editUserDialog = ref(false);
        const registerDeviceDialog = ref(false);
        const isEditingDevice = ref(false);
        const deleteConfirmDialog = ref(false);
        const deviceToDelete = ref(null);
        const deletingDevice = ref(false);

        // Form Models
        const currentNetworkServer = ref({
          id: '',
          name: '',
          type: 'THINGPARK',
          apiUrl: '',
          apiKey: '',
          routeRef: '',
          description: '',
          isDefault: false,
          regionProfiles: []
        });

        const currentModule = ref({
          id: '',
          code: '',
          title: '',
          description: '',
          icon: 'fa-solid fa-layer-group',
          color: 'from-cyan-500 to-blue-600',
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

        // Decoder Manager & Sandbox State
        const decodersList = ref([]);
        const loadingDecoders = ref(false);
        const savingDecoder = ref(false);
        const decoderSearchQuery = ref('');
        const addDecoderDialog = ref(false);
        const addDecoderConfirmDialog = ref(false);
        const editDecoderDialog = ref(false);
        const deleteDecoderConfirmDialog = ref(false);
        const decoderToDelete = ref(null);
        const currentDecoder = ref({ id: '', sku: '', firmwareVersion: 1, decoderCode: '', description: '' });
        const newDecoder = ref({ sku: '', firmwareVersion: '', decoderCode: '', description: '' });
        const selectedSandboxDecoderId = ref('');
        const sandboxFPort = ref(1);
        const sandboxCode = ref("function parseTemperature(raw) {\\n  return raw / 100;\\n}\\n\\nfunction decodeUplink(input) {\\n  var bytes = input.bytes || input;\\n  var temp = parseTemperature((bytes[0] << 8) | bytes[1]);\\n  var hum = bytes[2];\\n  return {\\n    data: {\\n      temperature: temp,\\n      humidity: hum\\n    }\\n  };\\n}");
        const sandboxHex = ref("09C441");
        const sandboxResult = ref('{\\n  "ready": true\\n}');
        const sandboxDisplayOutput = computed(() => sandboxResult.value || '{\\n  // Decoded JSON output will appear here\\n}');

        const formatDateTime = (dateStr) => {
          if (!dateStr) return '—';
          try {
            const d = new Date(dateStr);
            return d.toLocaleString();
          } catch(e) {
            return String(dateStr);
          }
        };

        const getSubfunctionCount = (code) => {
          if (!code) return 0;
          const matches = code.match(/function\\s+[a-zA-Z0-9_$]+\\s*\\(/g);
          if (!matches) return 0;
          return Math.max(0, matches.length - 1);
        };

        const filteredDecoders = computed(() => {
          const q = (decoderSearchQuery.value || '').trim().toLowerCase();
          if (!q) return decodersList.value;
          return decodersList.value.filter(d =>
            (d.id && d.id.toLowerCase().includes(q)) ||
            (d.sku && d.sku.toLowerCase().includes(q)) ||
            (d.description && d.description.toLowerCase().includes(q))
          );
        });

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

        const activeTabLabel = computed(() => {
          switch(activeTab.value) {
            case 'overview': return 'Overview Hub';
            case 'network-servers': return 'Network Servers';
            case 'modules': return 'Feature Modules';
            case 'roles': return 'Roles & RBAC';
            case 'users': return 'User Directory';
            case 'database': return 'Database Health';
            case 'devices': return 'Device Fleet';
            case 'webhooks': return 'Webhook Manager';
            case 'decoder': return 'Decoder Manager';
            default: return activeTab.value;
          }
        });

        const switchTab = (tab) => {
          activeTab.value = tab;
          sidebarOpen.value = false;
        };

        const groupedPermissions = computed(() => {
          const groups = {
            '📡 Network Server Management': [],
            '👥 User Management': [],
            '🛡️ RBAC Role Management': [],
            '🗄️ Database Operations': [],
            '📡 LoRaWAN Fleet & Gateways': [],
            '🔌 Webhook Manager': [],
            '💻 Decoder Manager & Sandbox': []
          };
          allPermissions.value.forEach(p => {
            if (p.name.startsWith('network_server:')) groups['📡 Network Server Management'].push(p);
            else if (p.name.startsWith('users:')) groups['👥 User Management'].push(p);
            else if (p.name.startsWith('roles:')) groups['🛡️ RBAC Role Management'].push(p);
            else if (p.name.startsWith('database:')) groups['🗄️ Database Operations'].push(p);
            else if (p.name.startsWith('lorawan:device:') || p.name.startsWith('lorawan:app:') || p.name.startsWith('lorawan:gateway:')) groups['📡 LoRaWAN Fleet & Gateways'].push(p);
            else if (p.name.startsWith('lorawan:webhooks:')) groups['🔌 Webhook Manager'].push(p);
            else if (p.name.startsWith('lorawan:decoder:')) groups['💻 Decoder Manager & Sandbox'].push(p);
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

        // Fetchers
        const fetchNetworkServers = async () => {
          try {
            const res = await fetch('/api/network-servers', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) networkServersList.value = await res.json();
          } catch(e) {
            console.error(e);
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

        // Network Server CRUD
        const openCreateNetworkServerDialog = () => {
          isEditingNetworkServer.value = false;
          currentNetworkServer.value = {
            id: '',
            name: '',
            type: 'THINGPARK',
            apiUrl: '',
            apiKey: '',
            routeRef: '',
            applicationId: '',
            description: '',
            isDefault: false,
            regionProfiles: [
              { id: 'prof-as923-1', name: 'AS923-1 Regional Plan', region: 'AS923-1', routeRef: 'TP_AS923_1', frequencyBand: '920-925 MHz' }
            ]
          };
          networkServerDialog.value = true;
        };

        const openEditNetworkServerDialog = (ns) => {
          isEditingNetworkServer.value = true;
          currentNetworkServer.value = JSON.parse(JSON.stringify(ns));
          if (!currentNetworkServer.value.regionProfiles) currentNetworkServer.value.regionProfiles = [];
          networkServerDialog.value = true;
        };

        const addRegionRow = () => {
          const count = (currentNetworkServer.value.regionProfiles || []).length + 1;
          currentNetworkServer.value.regionProfiles.push({
            id: 'prof-reg-' + count,
            name: 'Region Plan ' + count,
            region: 'AS923-1',
            routeRef: currentNetworkServer.value.type === 'THINGPARK' ? 'TP_ROUTE_' + count : undefined,
            profileId: currentNetworkServer.value.type === 'CHIRPSTACK' ? 'cs_profile_' + count : undefined,
            frequencyBand: '920-925 MHz'
          });
        };

        const removeRegionRow = (idx) => {
          currentNetworkServer.value.regionProfiles.splice(idx, 1);
        };

        const submitNetworkServerForm = async () => {
          savingNetworkServer.value = true;
          try {
            const url = isEditingNetworkServer.value ? '/api/network-servers/' + currentNetworkServer.value.id : '/api/network-servers';
            const method = isEditingNetworkServer.value ? 'PUT' : 'POST';
            const payload = {
              name: (currentNetworkServer.value.name || '').trim(),
              type: currentNetworkServer.value.type || 'THINGPARK',
              description: (currentNetworkServer.value.description || '').trim(),
              apiUrl: (currentNetworkServer.value.apiUrl || '').trim(),
              apiKey: (currentNetworkServer.value.apiKey || '').trim(),
              routeRef: (currentNetworkServer.value.routeRef || '').trim(),
              applicationId: (currentNetworkServer.value.applicationId || '').trim(),
              isDefault: Boolean(currentNetworkServer.value.isDefault),
              status: currentNetworkServer.value.status || 'ONLINE',
              regionProfiles: (currentNetworkServer.value.regionProfiles || []).map((rp, idx) => ({
                id: rp.id || ('prof-' + Date.now() + '-' + (idx + 1)),
                name: (rp.name || '').trim() || ('Region ' + (idx + 1)),
                region: (rp.region || '').trim() || 'AS923-1',
                routeRef: rp.routeRef ? String(rp.routeRef).trim() : undefined,
                profileId: rp.profileId ? String(rp.profileId).trim() : undefined,
                frequencyBand: rp.frequencyBand ? String(rp.frequencyBand).trim() : '',
                description: rp.description ? String(rp.description).trim() : '',
                isActive: rp.isActive !== false
              }))
            };
            const res = await fetch(url, {
              method,
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save network server");
            showToast(isEditingNetworkServer.value ? "Network Server updated!" : "Network Server created!", "success");
            networkServerDialog.value = false;
            fetchNetworkServers();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingNetworkServer.value = false;
          }
        };

        const testNetworkServer = async (ns) => {
          try {
            showToast("Testing connection to " + ns.name + "...", "info");
            const res = await fetch('/api/network-servers/' + ns.id + '/test', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (data.success && (data.details?.httpStatus === undefined || data.details?.httpStatus < 400)) {
              showToast("✅ " + data.message, "success");
            } else {
              showToast("❌ " + (data.message || "Connection test failed (Offline)"), "error");
            }
            fetchNetworkServers();
          } catch(e) {
            showToast("Connection test error: " + e.message, "error");
          }
        };

        const deleteNetworkServer = async (id) => {
          if (!confirm("Are you sure you want to delete this network server?")) return;
          try {
            const res = await fetch('/api/network-servers/' + id, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
            if (!res.ok) throw new Error("Delete failed");
            showToast("Network server removed", "success");
            fetchNetworkServers();
          } catch(e) {
            showToast(e.message, "error");
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
            color: 'from-cyan-500 to-blue-600',
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
          try {
            const res = await fetch('/lorawan/devices/' + deviceToDelete.value.devEUI, {
              method: 'DELETE',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete device");
            showToast(data.message || "Device deleted successfully", "success");
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

        const testDevice = (d) => {
          sandboxHex.value = "09C441";
          if (d.decoderId) {
            selectedSandboxDecoderId.value = d.decoderId;
            const found = decodersList.value.find(item => item.id === d.decoderId);
            if (found && found.decoderCode) {
              sandboxCode.value = found.decoderCode;
            }
          } else if (d.payloadFormatterScript) {
            sandboxCode.value = d.payloadFormatterScript;
          }
          switchTab('decoder');
        };

        const fetchDecoders = async () => {
          loadingDecoders.value = true;
          try {
            const res = await fetch('/api/decoders', {
              headers: authHeaders(),
              credentials: 'include'
            });
            if (res.ok) {
              decodersList.value = await res.json();
            } else {
              const err = await res.json().catch(() => ({}));
              console.warn("Could not fetch decoders:", err.message);
            }
          } catch(e) {
            console.warn("fetchDecoders error:", e.message);
          } finally {
            loadingDecoders.value = false;
          }
        };

        const openAddDecoderModal = () => {
          newDecoder.value = {
            sku: '',
            firmwareVersion: '',
            decoderCode: '',
            description: ''
          };
          addDecoderDialog.value = true;
        };

        const closeAddDecoderModal = () => {
          addDecoderDialog.value = false;
          addDecoderConfirmDialog.value = false;
          newDecoder.value = {
            sku: '',
            firmwareVersion: '',
            decoderCode: '',
            description: ''
          };
        };

        const loadSampleDecoderTemplate = () => {
          newDecoder.value.decoderCode = [
            "// Sub-functions helper",
            "function parseTemperature(raw) {",
            "  return ((raw << 16) >> 16) / 100;",
            "}",
            "",
            "function parseHumidity(raw) {",
            "  return raw / 2;",
            "}",
            "",
            "function parseBattery(raw) {",
            "  return raw / 10;",
            "}",
            "",
            "// Main decoder entry function",
            "function decodeUplink(input) {",
            "  var bytes = input.bytes || input;",
            "  var fPort = input.fPort || 1;",
            "  if (bytes.length < 3) {",
            "    return { errors: ['Payload too short'] };",
            "  }",
            "  var tempRaw = (bytes[0] << 8) | bytes[1];",
            "  var humRaw = bytes[2];",
            "  var batRaw = bytes.length > 3 ? bytes[3] : 30;",
            "  return {",
            "    data: {",
            "      temperature: parseTemperature(tempRaw),",
            "      humidity: parseHumidity(humRaw),",
            "      battery: parseBattery(batRaw)",
            "    }",
            "  };",
            "}"
          ].join("\\n");
          showToast("Sample decoder template loaded!", "info");
        };

        const validateDecoderCode = (code) => {
          const trimmed = (code || '').trim();
          if (!trimmed) {
            return { valid: false, message: 'Please enter JavaScript code for the Decoder!' };
          }
          try {
            new Function(trimmed);
            return { valid: true };
          } catch(e) {
            return { valid: false, message: 'JavaScript syntax error in decoder code: ' + e.message };
          }
        };

        const promptSubmitAddDecoder = () => {
          const sku = (newDecoder.value.sku || '').trim();
          if (!sku) {
            showToast("Please enter Product SKU!", "error");
            return;
          }
          const fw = parseInt(newDecoder.value.firmwareVersion, 10);
          if (isNaN(fw) || fw < 1 || fw > 32) {
            showToast("Please select Firmware Version from 1 to 32!", "error");
            return;
          }
          const val = validateDecoderCode(newDecoder.value.decoderCode);
          if (!val.valid) {
            showToast(val.message, "error");
            return;
          }

          // Open confirmation dialog asking user to confirm adding to DB
          addDecoderConfirmDialog.value = true;
        };

        const submitAddDecoder = async () => {
          savingDecoder.value = true;
          try {
            const sku = newDecoder.value.sku.trim();
            const firmwareVersion = parseInt(newDecoder.value.firmwareVersion, 10);
            const decoderCode = newDecoder.value.decoderCode;
            const description = (newDecoder.value.description || '').trim() || undefined;

            const res = await fetch('/api/decoders', {
              method: 'POST',
              headers: {
                ...authHeaders(),
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                sku,
                firmwareVersion,
                decoderCode,
                description
              })
            });

            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.message || 'Failed to create decoder');
            }

            showToast('Decoder ' + data.id + ' was added successfully to database!', 'success');
            addDecoderConfirmDialog.value = false;
            addDecoderDialog.value = false;
            newDecoder.value = { sku: '', firmwareVersion: '', decoderCode: '', description: '' };
            fetchDecoders();
          } catch(err) {
            showToast(err.message, 'error');
          } finally {
            savingDecoder.value = false;
          }
        };

        const openEditDecoderModal = (dec) => {
          currentDecoder.value = {
            id: dec.id,
            sku: dec.sku,
            firmwareVersion: dec.firmwareVersion,
            decoderCode: dec.decoderCode,
            description: dec.description || ''
          };
          editDecoderDialog.value = true;
        };

        const submitEditDecoder = async () => {
          const val = validateDecoderCode(currentDecoder.value.decoderCode);
          if (!val.valid) {
            showToast(val.message, "error");
            return;
          }
          savingDecoder.value = true;
          try {
            const res = await fetch('/api/decoders/' + encodeURIComponent(currentDecoder.value.id), {
              method: 'PUT',
              headers: {
                ...authHeaders(),
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                decoderCode: currentDecoder.value.decoderCode,
                description: currentDecoder.value.description
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update decoder');
            showToast('Decoder ' + currentDecoder.value.id + ' updated successfully!', 'success');
            editDecoderDialog.value = false;
            fetchDecoders();
          } catch(err) {
            showToast(err.message, 'error');
          } finally {
            savingDecoder.value = false;
          }
        };

        const confirmDeleteDecoder = (dec) => {
          decoderToDelete.value = dec;
          deleteDecoderConfirmDialog.value = true;
        };

        const submitDeleteDecoder = async () => {
          if (!decoderToDelete.value) return;
          savingDecoder.value = true;
          try {
            const res = await fetch('/api/decoders/' + encodeURIComponent(decoderToDelete.value.id), {
              method: 'DELETE',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to delete decoder');
            showToast('Decoder ' + decoderToDelete.value.id + ' was deleted successfully!', 'success');
            deleteDecoderConfirmDialog.value = false;
            decoderToDelete.value = null;
            fetchDecoders();
          } catch(err) {
            showToast(err.message, 'error');
          } finally {
            savingDecoder.value = false;
          }
        };

        const loadDecoderIntoSandbox = (dec) => {
          sandboxCode.value = dec.decoderCode;
          selectedSandboxDecoderId.value = dec.id;
          showToast('Loaded decoder ' + dec.id + ' into Sandbox!', 'info');
          const el = document.getElementById('decoder-sandbox-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        };

        const onSelectSandboxDecoder = () => {
          if (!selectedSandboxDecoderId.value) return;
          const found = decodersList.value.find(d => d.id === selectedSandboxDecoderId.value);
          if (found) {
            sandboxCode.value = found.decoderCode;
            showToast('Loaded ' + found.id + ' code into sandbox', 'info');
          }
        };

        const runSandboxDecode = () => {
          try {
            const hex = sandboxHex.value.trim().replace(/\\s+/g, "");
            if (!hex) throw new Error("Hex payload is empty");
            if (hex.length % 2 !== 0) throw new Error("Hex payload length must be even");
            const bytes = [];
            for (let c = 0; c < hex.length; c += 2) {
              bytes.push(parseInt(hex.substr(c, 2), 16));
            }
            const fPort = 1;
            const fullCode = sandboxCode.value + "\\nif (typeof decodeUplink === 'function') { return decodeUplink({ bytes: bytes, fPort: fPort }); } else if (typeof Decoder === 'function') { return Decoder(bytes, fPort); } else { throw new Error('No entry function found. Please define decodeUplink(input) or Decoder(bytes, fPort)'); }";
            const fn = new Function("bytes", "fPort", fullCode);
            const output = fn(bytes, fPort);
            sandboxResult.value = JSON.stringify(output, null, 2);
            showToast("Decoder executed successfully!", "success");
          } catch(e) {
            sandboxResult.value = "Decoder Error: " + e.message;
            showToast("Decoder Error: " + e.message, "error");
          }
        };

        // ==================== WEBHOOK MANAGER LOGIC ====================
        const webhookLogs = ref([]);
        const webhookStats = ref({
          totalCount: 0,
          chirpstackCount: 0,
          thingparkCount: 0,
          genericCount: 0,
          retentionLimit: 200
        });
        const loadingWebhookLogs = ref(false);
        const webhookServerFilter = ref('ALL');
        const webhookSearchQuery = ref('');
        let webhookPollingTimer = null;

        const rawPayloadModal = ref(false);
        const inspectedWebhookLog = ref(null);
        const simulatePacketModal = ref(false);
        const simulatingPacket = ref(false);
        const simulatePacketForm = ref({
          serverType: 'CHIRPSTACK',
          devEUI: '0018B20000000001',
          payloadHex: '09C441',
          fPort: 1,
          fCnt: 1
        });
        const retentionModal = ref(false);
        const savingRetention = ref(false);
        const newRetentionLimit = ref(200);
        const clearLogsConfirmModal = ref(false);

        const filteredWebhookLogs = computed(() => {
          let list = webhookLogs.value || [];
          if (webhookServerFilter.value && webhookServerFilter.value !== 'ALL') {
            list = list.filter(l => (l.serverType || '').toUpperCase() === webhookServerFilter.value.toUpperCase());
          }
          if (webhookSearchQuery.value && webhookSearchQuery.value.trim()) {
            const q = webhookSearchQuery.value.trim().toLowerCase();
            list = list.filter(l => 
              (l.devEUI && l.devEUI.toLowerCase().includes(q)) ||
              (l.payloadHex && l.payloadHex.toLowerCase().includes(q)) ||
              (l.rawPayload && JSON.stringify(l.rawPayload).toLowerCase().includes(q))
            );
          }
          return list;
        });

        const fetchWebhookLogs = async (silent = false) => {
          if (!silent) loadingWebhookLogs.value = true;
          try {
            const res = await fetch('/api/webhooks/logs?limit=200', {
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data.logs)) {
              webhookLogs.value = data.logs;
              webhookStats.value.totalCount = data.total || data.logs.length;
              webhookStats.value.chirpstackCount = data.chirpstackCount || 0;
              webhookStats.value.thingparkCount = data.thingparkCount || 0;
              webhookStats.value.genericCount = data.genericCount || 0;
              if (data.retentionLimit) webhookStats.value.retentionLimit = data.retentionLimit;
            }
          } catch(e) {
            // silent during background AJAX polling
          } finally {
            if (!silent) loadingWebhookLogs.value = false;
          }
        };

        const fetchWebhookStats = async () => {
          try {
            const res = await fetch('/api/webhooks/stats', {
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
              webhookStats.value = { ...webhookStats.value, ...data };
              if (data.retentionLimit) newRetentionLimit.value = data.retentionLimit;
            }
          } catch(e) {}
        };

        const startWebhookPolling = () => {
          stopWebhookPolling();
          fetchWebhookLogs(false);
          fetchWebhookStats();
          webhookPollingTimer = setInterval(() => {
            if (activeTab.value === 'webhooks') {
              fetchWebhookLogs(true);
              fetchWebhookStats();
            } else {
              stopWebhookPolling();
            }
          }, 2500);
        };

        const stopWebhookPolling = () => {
          if (webhookPollingTimer) {
            clearInterval(webhookPollingTimer);
            webhookPollingTimer = null;
          }
        };

        const inspectWebhookLog = (log) => {
          inspectedWebhookLog.value = log;
          rawPayloadModal.value = true;
        };

        const copyJson = async (payload) => {
          try {
            const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(text);
            } else {
              const ta = document.createElement('textarea');
              ta.value = text;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            }
            showToast("JSON copied to clipboard!", "success");
          } catch(e) {
            showToast("Failed to copy JSON", "error");
          }
        };

        const formatRawJson = (payload) => {
          if (!payload) return '{}';
          if (typeof payload === 'string') return payload;
          try {
            return JSON.stringify(payload, null, 2);
          } catch(e) {
            return String(payload);
          }
        };

        const openSimulatePacketModal = () => {
          simulatePacketModal.value = true;
        };

        const submitSimulatePacket = async () => {
          simulatingPacket.value = true;
          try {
            const res = await fetch('/api/webhooks/simulate', {
              method: 'POST',
              headers: {
                ...authHeaders(),
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify(simulatePacketForm.value)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to simulate packet");
            
            showToast(data.message || "Simulated packet logged successfully!", "success");
            simulatePacketModal.value = false;
            await fetchWebhookLogs(false);
            await fetchWebhookStats();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            simulatingPacket.value = false;
          }
        };

        const openRetentionModal = () => {
          newRetentionLimit.value = webhookStats.value.retentionLimit || 200;
          retentionModal.value = true;
        };

        const submitUpdateRetention = async () => {
          savingRetention.value = true;
          try {
            const res = await fetch('/api/webhooks/retention', {
              method: 'PUT',
              headers: {
                ...authHeaders(),
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ limit: newRetentionLimit.value })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update retention limit");
            
            showToast(data.message || "Retention limit updated", "success");
            webhookStats.value.retentionLimit = data.retentionLimit;
            retentionModal.value = false;
            await fetchWebhookLogs(false);
            await fetchWebhookStats();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingRetention.value = false;
          }
        };

        const openClearLogsModal = () => {
          clearLogsConfirmModal.value = true;
        };

        const submitClearLogs = async () => {
          try {
            const target = webhookServerFilter.value && webhookServerFilter.value !== 'ALL' ? webhookServerFilter.value : 'ALL';
            const res = await fetch('/api/webhooks/logs?serverType=' + target, {
              method: 'DELETE',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to clear logs");
            
            showToast(data.message || "Logs cleared", "success");
            clearLogsConfirmModal.value = false;
            await fetchWebhookLogs(false);
            await fetchWebhookStats();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        const formatLogTime = (ts) => {
          if (!ts) return '--';
          try {
            const d = new Date(ts);
            return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
          } catch(e) {
            return String(ts);
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
          if (newTab === 'devices') fetchDevices();
          if (newTab === 'decoder') fetchDecoders();
          if (newTab === 'webhooks') {
            startWebhookPolling();
          } else {
            stopWebhookPolling();
          }
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
          fetchDecoders();
          fetchWebhookStats();
          
          const hash = window.location.hash.replace('#', '').trim();
          if (hash && hash !== 'telemetry') {
            activeTab.value = hash;
            if (hash === 'webhooks') {
              startWebhookPolling();
            }
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
          sidebarOpen,
          userMenuOpen,
          userInitials,
          handleGlobalClick,
          navigateTo,
          activeTabLabel,
          currentUser,
          isSuperAdmin,
          networkServersList,
          modulesList,
          rolesList,
          usersList,
          allPermissions,
          groupedPermissions,
          getModulesForRole,
          toggleSelectAllRolePermissions,
          toggleGroupPermissions,
          dbHealth,
          devicesList,
          loadingUsers,
          loadingRoles,
          savingNetworkServer,
          savingModule,
          savingRole,
          savingUser,
          savingDevice,
          networkServerDialog,
          isEditingNetworkServer,
          moduleDialog,
          isEditingModule,
          roleDialog,
          isEditingRole,
          createUserDialog,
          editUserDialog,
          registerDeviceDialog,
          isEditingDevice,
          currentNetworkServer,
          currentModule,
          currentRole,
          newUser,
          editUser,
          newDevice,
          selectedDeviceNetworkServer,
          availableDeviceRegions,
          onDeviceNetworkServerChange,
          sandboxCode,
          sandboxHex,
          sandboxResult,
          toast,
          handleLogout,
          copyUrl,
          switchTab,
          fetchNetworkServers,
          openCreateNetworkServerDialog,
          openEditNetworkServerDialog,
          addRegionRow,
          removeRegionRow,
          submitNetworkServerForm,
          testNetworkServer,
          deleteNetworkServer,
          fetchModules,
          fetchRoles,
          fetchUsers,
          fetchDbHealth,
          reloadDbConfig,
          fetchDevices,
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
          openEditDeviceDialog,
          submitDeviceForm,
          deleteConfirmDialog,
          deviceToDelete,
          deletingDevice,
          deleteDevice,
          confirmDeleteDevice,
          checkingHealthDevEUI,
          checkDeviceHealth,
          formatLastSeen,
          isDeviceOnline,
          syncDevice,
          testDevice,
          runSandboxDecode,
          decodersList,
          loadingDecoders,
          savingDecoder,
          decoderSearchQuery,
          filteredDecoders,
          addDecoderDialog,
          addDecoderConfirmDialog,
          editDecoderDialog,
          deleteDecoderConfirmDialog,
          decoderToDelete,
          currentDecoder,
          newDecoder,
          selectedSandboxDecoderId,
          sandboxFPort,
          formatDateTime,
          getSubfunctionCount,
          fetchDecoders,
          openAddDecoderModal,
          closeAddDecoderModal,
          loadSampleDecoderTemplate,
          promptSubmitAddDecoder,
          submitAddDecoder,
          openEditDecoderModal,
          submitEditDecoder,
          confirmDeleteDecoder,
          submitDeleteDecoder,
          loadDecoderIntoSandbox,
          onSelectSandboxDecoder,
          sandboxDisplayOutput,
          webhookLogs,
          webhookStats,
          loadingWebhookLogs,
          webhookServerFilter,
          webhookSearchQuery,
          filteredWebhookLogs,
          rawPayloadModal,
          inspectedWebhookLog,
          simulatePacketModal,
          simulatingPacket,
          simulatePacketForm,
          retentionModal,
          savingRetention,
          newRetentionLimit,
          clearLogsConfirmModal,
          fetchWebhookLogs,
          fetchWebhookStats,
          inspectWebhookLog,
          copyJson,
          formatRawJson,
          openSimulatePacketModal,
          submitSimulatePacket,
          openRetentionModal,
          submitUpdateRetention,
          openClearLogsModal,
          submitClearLogs,
          formatLogTime
        };
      }
    }).mount('#app');
  </script>
</body>
</html>
`;
