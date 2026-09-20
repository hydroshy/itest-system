import { OVERVIEW_TEMPLATE, OVERVIEW_MODALS } from './control-panel-modules/overview.module';
import { NETWORK_SERVERS_TEMPLATE, NETWORK_SERVERS_MODALS } from './control-panel-modules/network-servers.module';
import { SYSTEM_MODULES_TEMPLATE, SYSTEM_MODULES_MODALS } from './control-panel-modules/system-modules.module';
import { DEVICES_TEMPLATE, DEVICES_MODALS } from './control-panel-modules/devices.module';
import { WEBHOOKS_TEMPLATE, WEBHOOKS_MODALS } from './control-panel-modules/webhooks.module';
import { DECODER_TEMPLATE, DECODER_MODALS } from './control-panel-modules/decoder.module';
import { HMI_STUDIO_TEMPLATE, HMI_STUDIO_MODALS } from './control-panel-modules/hmi-studio.module';
import { DOWNLINK_TEMPLATE, DOWNLINK_MODALS } from './control-panel-modules/downlink.module';
import {
  MODBUS_PRESETS_TEMPLATE,
  MODBUS_PRESETS_MODALS,
  MODBUS_PRESETS_SCRIPT,
} from './control-panel-modules/modbus-presets.module';
import {
  TEST_BUILDER_TEMPLATE,
  TEST_BUILDER_MODALS,
  TEST_BUILDER_SCRIPT,
} from './control-panel-modules/test-builder.module';

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
  <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.7.4/dist/socket.io.min.js"></script>
  <!-- Tabulator 6.3.0 & SheetJS (XLSX) -->
  <link rel="stylesheet" href="/vendor/tabulator/tabulator_midnight.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tabulator-tables/6.3.0/css/tabulator_midnight.min.css">
  <script src="/vendor/tabulator/tabulator.min.js"></script>
  <script src="/vendor/xlsx/xlsx.full.min.js"></script>
  <script>
    if (typeof Tabulator === 'undefined') {
      document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/tabulator-tables/6.3.0/js/tabulator.min.js"><\\/script>');
    }
    if (typeof XLSX === 'undefined') {
      document.write('<script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"><\\/script>');
    }
  </script>
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
    .hmi-grid-bg {
      background-size: 20px 20px;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    }
    .hmi-glow-text {
      text-shadow: 0 0 10px rgba(56, 189, 248, 0.6), 0 0 20px rgba(56, 189, 248, 0.2);
    }
    .hmi-needle {
      transform-origin: 50% 50%;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes hmi-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.25; }
    }
    .hmi-blink-anim {
      animation: hmi-blink 1s infinite;
    }
    /* When in design/editing mode, stop/pause all live animations and transitions */
    .hmi-design-paused,
    .hmi-design-paused * {
      animation: none !important;
      transition: none !important;
    }
    .hmi-resize-handle {
      position: absolute;
      width: 10px;
      height: 10px;
      background-color: #ffffff;
      border: 2px solid #0284c7;
      border-radius: 2px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.6);
      z-index: 50;
      transition: transform 0.1s ease, background-color 0.1s ease;
    }
    .hmi-resize-handle:hover {
      background-color: #38bdf8;
      border-color: #ffffff;
      transform: scale(1.3);
    }
    /* Tabulator Modern Dark Theme Customization */
    .tabulator {
      background-color: #0b1329 !important;
      border: 1px solid #1e293b !important;
      font-size: 12px !important;
      font-family: 'JetBrains Mono', monospace !important;
    }
    .tabulator .tabulator-header {
      background-color: #0f172a !important;
      border-bottom: 2px solid #1e293b !important;
      color: #94a3b8 !important;
    }
    .tabulator .tabulator-header .tabulator-col {
      background-color: #0f172a !important;
      border-right: 1px solid #1e293b80 !important;
    }
    .tabulator .tabulator-header .tabulator-col-content {
      padding: 8px 6px !important;
    }
    .tabulator .tabulator-header .tabulator-col-title {
      font-size: 10.5px !important;
      font-weight: 700 !important;
      letter-spacing: 0.05em;
    }
    .tabulator .tabulator-row {
      background-color: #0b1329 !important;
      border-bottom: 1px solid #1e293b60 !important;
      color: #cbd5e1 !important;
      min-height: 34px !important;
    }
    .tabulator .tabulator-row:hover {
      background-color: #1e293b80 !important;
    }
    .tabulator .tabulator-row.tabulator-selected {
      background-color: #1e293b !important;
      color: #fff !important;
      box-shadow: inset 0 0 0 1px rgba(6, 182, 212, 0.5) !important;
    }
    .tabulator .tabulator-row.tabulator-selected .tabulator-cell {
      background-color: rgba(6, 182, 212, 0.14) !important;
      color: #ffffff !important;
    }
    .tabulator .tabulator-row.tabulator-selected .tabulator-cell:first-child {
      background-color: #0891b2 !important;
      color: #ffffff !important;
      font-weight: 700 !important;
    }
    .tabulator .tabulator-row .tabulator-cell:first-child {
      cursor: pointer !important;
      user-select: none !important;
      font-weight: 600;
      color: #94a3b8;
      transition: background-color 0.15s, color 0.15s;
    }
    .tabulator .tabulator-row:hover .tabulator-cell:first-child {
      background-color: rgba(6, 182, 212, 0.2) !important;
      color: #38bdf8 !important;
    }
    .tabulator .tabulator-cell {
      border-right: 1px solid #1e293b60 !important;
      padding: 4px 6px !important;
      vertical-align: middle;
      display: inline-flex !important;
      align-items: center !important;
    }
    .tabulator .tabulator-cell:has(input[type="text"]) {
      padding: 3px 4px !important;
    }
    .tabulator .tabulator-cell input[type="text"] {
      width: 100% !important;
      box-sizing: border-box !important;
    }
    .tabulator input[type="checkbox"] {
      accent-color: #06b6d4;
      cursor: pointer;
      width: 15px;
      height: 15px;
    }
    .tabulator .tabulator-editing input,
    .tabulator .tabulator-editing select {
      background-color: #020617 !important;
      color: #38bdf8 !important;
      border: 1px solid #0284c7 !important;
      border-radius: 4px;
      padding: 2px 6px !important;
      font-size: 12px !important;
      font-family: 'JetBrains Mono', monospace !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2) !important;
    }
    .tabulator-menu {
      background-color: #0f172a !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
      color: #e2e8f0 !important;
      padding: 4px !important;
      font-size: 12px !important;
      font-family: 'JetBrains Mono', monospace !important;
    }
    .tabulator-menu .tabulator-menu-item {
      padding: 6px 12px !important;
      border-radius: 6px !important;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .tabulator-menu .tabulator-menu-item:hover {
      background-color: #1e293b !important;
      color: #38bdf8 !important;
    }
    .tabulator-edit-list {
      background-color: #0f172a !important;
      border: 1px solid #334155 !important;
      border-radius: 6px !important;
      color: #e2e8f0 !important;
      font-size: 12px !important;
      font-family: 'JetBrains Mono', monospace !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
    }
    .tabulator-edit-list .tabulator-edit-list-item {
      padding: 6px 10px !important;
      cursor: pointer;
    }
    .tabulator-edit-list .tabulator-edit-list-item:hover,
    .tabulator-edit-list .tabulator-edit-list-item.active {
      background-color: #1e293b !important;
      color: #38bdf8 !important;
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
                <span>Dashboard module Manager</span>
              </span>
            </button>

            <button @click="switchTab('database')" :class="{ active: activeTab === 'database' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-database w-4 text-center text-xs text-indigo-400"></i>
                <span>Database Manager</span>
              </span>
            </button>

            <button @click="switchTab('roles')" :class="{ active: activeTab === 'roles' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-shield-halved w-4 text-center text-xs text-amber-400"></i>
                <span>Roles & RBAC</span>
              </span>
            </button>

            <button @click="switchTab('users')" :class="{ active: activeTab === 'users' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-users w-4 text-center text-xs text-emerald-400"></i>
                <span>User Accounts</span>
              </span>
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
            </button>

            <button @click="switchTab('devices')" :class="{ active: activeTab === 'devices' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-microchip w-4 text-center text-xs text-teal-400"></i>
                <span>Device Fleet</span>
              </span>
            </button>

            <button @click="switchTab('webhooks')" :class="{ active: activeTab === 'webhooks' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-satellite-dish w-4 text-center text-xs text-sky-400"></i>
                <span>Webhook Manager</span>
              </span>
            </button>

            <button @click="switchTab('decoder')" :class="{ active: activeTab === 'decoder' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-code w-4 text-center text-xs text-purple-400"></i>
                <span>Decoder Manager</span>
              </span>
            </button>

            <button @click="switchTab('hmi-studio')" :class="{ active: activeTab === 'hmi-studio' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-palette w-4 text-center text-xs text-amber-400"></i>
                <span>HMI SCADA Studio</span>
              </span>
            </button>

            <button @click="switchTab('downlink')" :class="{ active: activeTab === 'downlink' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-paper-plane w-4 text-center text-xs text-indigo-400"></i>
                <span>Downlink Actuator</span>
              </span>
            </button>

            <button @click="switchTab('modbus-presets')" :class="{ active: activeTab === 'modbus-presets' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-file-excel w-4 text-center text-xs text-emerald-400"></i>
                <span>Modbus Presets</span>
              </span>
            </button>

            <button @click="switchTab('test-builder')" :class="{ active: activeTab === 'test-builder' }" class="nav-item">
              <span class="flex items-center gap-2.5">
                <i class="fa-solid fa-vial-circle-check w-4 text-center text-xs text-indigo-400"></i>
                <span>Test Automation</span>
              </span>
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT AREA -->
      <main class="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 space-y-6">
        

        ${OVERVIEW_TEMPLATE}

        ${NETWORK_SERVERS_TEMPLATE}

        ${SYSTEM_MODULES_TEMPLATE}

        ${DEVICES_TEMPLATE}

        ${WEBHOOKS_TEMPLATE}

        ${DECODER_TEMPLATE}

        ${HMI_STUDIO_TEMPLATE}

        ${DOWNLINK_TEMPLATE}

        <!-- TAB 12: MODBUS PRESETS & TEMPLATES MANAGER -->
        <div v-show="activeTab === 'modbus-presets'" class="space-y-6">
          ${MODBUS_PRESETS_TEMPLATE}
        </div>

        <!-- TAB 13: LORAWAN TEST AUTOMATION & SCENARIO BUILDER -->
        <div v-show="activeTab === 'test-builder'" class="space-y-6">
          ${TEST_BUILDER_TEMPLATE}
        </div>

      </main>
    </div>


    ${OVERVIEW_MODALS}
    ${NETWORK_SERVERS_MODALS}
    ${SYSTEM_MODULES_MODALS}
    ${DEVICES_MODALS}
    ${WEBHOOKS_MODALS}
    ${DECODER_MODALS}
    ${HMI_STUDIO_MODALS}
    ${DOWNLINK_MODALS}
    ${MODBUS_PRESETS_MODALS}
    ${TEST_BUILDER_MODALS}

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

    ${MODBUS_PRESETS_SCRIPT}
    ${TEST_BUILDER_SCRIPT}

    const { createApp, ref, computed, onMounted, watch } = Vue;

    const getStoredUser = () => {
      try {
        const u = localStorage.getItem('lorawan_user');
        return u ? JSON.parse(u) : {};
      } catch(e) {
        return {};
      }
    };

    const app = createApp({
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
          downlinkDeviceDropdownOpen.value = false;
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

        // System Ops & Git Lifecycle State
        const systemVersionInfo = ref({
          version: '1.0.0',
          git: { commitHash: '', shortHash: '', branch: 'main', commitMessage: '', author: '', commitDate: '' },
          opsAgent: { online: false, url: '', containerStatus: '', dockerAvailable: false },
          server: { uptimeSeconds: 0, nodeVersion: '', platform: '', environment: '' }
        });
        const loadingSystemVersion = ref(false);
        const restartingServer = ref(false);
        const restartConfirmDialog = ref(false);
        const serverLogsDialog = ref(false);
        const serverLogs = ref('');
        const loadingServerLogs = ref(false);
        const restartProgress = ref({ active: false, countdown: 0, message: '' });

        // Dashboard Module Manager State
        const moduleManagerSubTab = ref('layout'); // 'layout' | 'catalog'
        const selectedLayoutRole = ref('SUPER_ADMIN');
        const isEditingRoleLayout = ref(false);
        const savingRoleLayout = ref(false);
        const roleLayouts = ref({});
        const currentRoleModuleList = ref([]);
        const draggedModuleIndex = ref(null);
        const dragOverModuleIndex = ref(null);

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
        const addModuleToLayoutModal = ref(false);
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
        const selectedSandboxDeviceEUI = ref('');
        const selectedSandboxDevice = computed(() => {
          if (!selectedSandboxDeviceEUI.value) return null;
          return devicesList.value.find(d => d.devEUI === selectedSandboxDeviceEUI.value) || null;
        });
        const selectedSandboxDecoderId = ref('');
        const sandboxFPort = ref(1);
        const sandboxCode = ref("function parseTemperature(raw) {\\n  return raw / 100;\\n}\\n\\nfunction decodeUplink(input) {\\n  var bytes = input.bytes || input;\\n  var temp = parseTemperature((bytes[0] << 8) | bytes[1]);\\n  var hum = bytes[2];\\n  return {\\n    data: {\\n      temperature: temp,\\n      humidity: hum\\n    }\\n  };\\n}");
        const sandboxHex = ref("09C441");
        const sandboxResult = ref('{\\n  "ready": true\\n}');
        const sandboxDecodedObject = ref(null);
        const sandboxViewMode = ref('tabular');
        const loadingDeviceTelemetry = ref(false);
        const sandboxTelemetryList = ref([]);
        const sandboxActiveMetadata = ref(null);
        const sandboxDisplayOutput = computed(() => sandboxResult.value || '{\\n  // Decoded JSON output will appear here\\n}');

        const decodedFieldsList = computed(() => {
          if (!sandboxDecodedObject.value) return [];
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

          if (typeof sandboxDecodedObject.value === 'object') {
            if (sandboxDecodedObject.value.data && typeof sandboxDecodedObject.value.data === 'object') {
              extractFields(sandboxDecodedObject.value.data);
              if (sandboxDecodedObject.value.errors) {
                extractFields({ errors: sandboxDecodedObject.value.errors });
              }
              if (sandboxDecodedObject.value.warnings) {
                extractFields({ warnings: sandboxDecodedObject.value.warnings });
              }
            } else {
              extractFields(sandboxDecodedObject.value);
            }
          }
          return res;
        });

        const decodeHexPayload = (hex, fPort, code) => {
          if (!hex) return null;
          try {
            const cleanHex = String(hex).trim().replace(/\\s+/g, '');
            if (!cleanHex || cleanHex.length % 2 !== 0) return null;
            const bytes = [];
            for (let c = 0; c < cleanHex.length; c += 2) {
              bytes.push(parseInt(cleanHex.substr(c, 2), 16));
            }
            const port = Number(fPort) || 1;
            const fullCode = (code || '') + "\\nif (typeof decodeUplink === 'function') { return decodeUplink({ bytes: bytes, fPort: fPort }); } else if (typeof Decoder === 'function') { return Decoder(bytes, fPort); } else { return null; }";
            const fn = new Function('bytes', 'fPort', fullCode);
            return fn(bytes, port);
          } catch(e) {
            return null;
          }
        };

        const flattenFields = (obj, prefix = '') => {
          const res = {};
          if (!obj || typeof obj !== 'object') return res;
          for (const [k, v] of Object.entries(obj)) {
            const fullKey = prefix ? prefix + '.' + k : k;
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
              Object.assign(res, flattenFields(v, fullKey));
            } else {
              res[fullKey] = v;
            }
          }
          return res;
        };

        const matrixSensorColumns = computed(() => {
          const colSet = new Set();
          const list = sandboxTelemetryList.value || [];
          for (const pkt of list) {
            let decoded = pkt.decodedData || pkt.object || null;
            if (!decoded && (pkt.payloadHex || pkt.data) && sandboxCode.value) {
              decoded = decodeHexPayload(pkt.payloadHex || pkt.data, pkt.fPort, sandboxCode.value);
            }
            if (decoded) {
              const dataObj = decoded.data && typeof decoded.data === 'object' ? decoded.data : decoded;
              const flat = flattenFields(dataObj);
              for (const k of Object.keys(flat)) {
                if (!['errors', 'warnings', 'fPort', 'fCnt', 'devEUI', 'deviceName', 'gatewayId', 'rssi', 'snr', 'devEui', 'dr', 'adr', 'channel', 'frequency', 'bandwidth', 'spreadingFactor', 'tenantId', 'applicationId', 'serverType'].includes(k)) {
                  colSet.add(k);
                }
              }
            }
          }
          return Array.from(colSet);
        });

        const matrixRows = computed(() => {
          const list = sandboxTelemetryList.value || [];
          const cols = matrixSensorColumns.value;
          return list.map(pkt => {
            let decoded = pkt.decodedData || pkt.object || null;
            if (!decoded && (pkt.payloadHex || pkt.data) && sandboxCode.value) {
              decoded = decodeHexPayload(pkt.payloadHex || pkt.data, pkt.fPort, sandboxCode.value);
            }
            const flat = decoded ? flattenFields(decoded.data && typeof decoded.data === 'object' ? decoded.data : decoded) : {};
            const sensorValues = {};
            for (const c of cols) {
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
            return {
              raw: pkt,
              time: pkt.timestamp || pkt.receivedAt,
              fPort: pkt.fPort || 1,
              fCnt: pkt.fCnt !== undefined && pkt.fCnt !== null ? pkt.fCnt : 0,
              rssi: pkt.rssi != null ? pkt.rssi : null,
              snr: pkt.snr != null ? pkt.snr : null,
              payloadHex: pkt.payloadHex || pkt.data || '—',
              sensorValues: sensorValues
            };
          });
        });

        const sandboxTimeFilter = ref('ALL');
        const sandboxSearchQuery = ref('');
        const sandboxSortKey = ref('time');
        const sandboxSortOrder = ref('desc');
        const sandboxAutoSync = ref(false);
        const sandboxAutoSyncTimer = ref(null);

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

        const filteredMatrixRows = computed(() => {
          let rows = matrixRows.value || [];
          if (sandboxTimeFilter.value && sandboxTimeFilter.value !== 'ALL') {
            rows = rows.filter(r => passesTimeFilter(r.time, sandboxTimeFilter.value));
          }
          const q = (sandboxSearchQuery.value || '').trim().toLowerCase();
          if (q) {
            rows = rows.filter(r => {
              if (r.time && String(r.time).toLowerCase().includes(q)) return true;
              if (formatDateTime(r.time).toLowerCase().includes(q)) return true;
              if (String(r.fPort).toLowerCase().includes(q)) return true;
              if (String(r.fCnt).toLowerCase().includes(q) || ('#' + r.fCnt).includes(q)) return true;
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

        const sortedMatrixRows = computed(() => {
          const list = [...filteredMatrixRows.value];
          const key = sandboxSortKey.value;
          const order = sandboxSortOrder.value === 'asc' ? 1 : -1;
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
              return String(a.payloadHex || '').localeCompare(String(b.payloadHex || '')) * order;
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

        const toggleSandboxSort = (key) => {
          if (sandboxSortKey.value === key) {
            sandboxSortOrder.value = sandboxSortOrder.value === 'asc' ? 'desc' : 'asc';
          } else {
            sandboxSortKey.value = key;
            sandboxSortOrder.value = key === 'time' ? 'desc' : 'asc';
          }
        };

        const resetSandboxFilters = () => {
          sandboxTimeFilter.value = 'ALL';
          sandboxSearchQuery.value = '';
          sandboxSortKey.value = 'time';
          sandboxSortOrder.value = 'desc';
        };

        const isSandboxFilterActive = computed(() => {
          return (sandboxTimeFilter.value && sandboxTimeFilter.value !== 'ALL') ||
                 Boolean((sandboxSearchQuery.value || '').trim());
        });

        const startSandboxAutoSync = () => {
          stopSandboxAutoSync();
          sandboxAutoSyncTimer.value = setInterval(() => {
            if (activeTab.value === 'decoder' && sandboxAutoSync.value) {
              fetchSandboxTelemetry(true);
            }
          }, 3000);
        };

        const stopSandboxAutoSync = () => {
          if (sandboxAutoSyncTimer.value) {
            clearInterval(sandboxAutoSyncTimer.value);
            sandboxAutoSyncTimer.value = null;
          }
        };

        const toggleSandboxAutoSync = () => {
          sandboxAutoSync.value = !sandboxAutoSync.value;
          if (sandboxAutoSync.value) {
            startSandboxAutoSync();
            fetchSandboxTelemetry(false);
            showToast("Sandbox auto-sync enabled (3s live poll)", "info");
          } else {
            stopSandboxAutoSync();
            showToast("Sandbox auto-sync paused", "info");
          }
        };

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
            case 'modules': return 'Dashboard module Manager';
            case 'roles': return 'Roles & RBAC';
            case 'users': return 'User Directory';
            case 'database': return 'Database Manager';
            case 'devices': return 'Device Fleet';
            case 'webhooks': return 'Webhook Manager';
            case 'decoder': return 'Decoder Manager';
            case 'hmi-studio': return 'HMI SCADA Studio';
            case 'downlink': return 'Downlink Actuator & Queue';
            case 'modbus-presets': return 'Modbus Presets & Templates';
            case 'test-builder': return 'LoRaWAN Test Automation';
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

        const fetchRoleLayouts = async () => {
          try {
            const res = await fetch('/api/d-modules/layouts', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              roleLayouts.value = await res.json();
            }
          } catch(e) {
            console.error('Error fetching role layouts:', e);
          }
        };

        const computeRoleModules = () => {
          const roleCode = (selectedLayoutRole.value || 'SUPER_ADMIN').toUpperCase();
          const rawLayout = roleLayouts.value[roleCode];

          let layoutOrder = null;
          let layoutSpans = {};
          let disabledIds = [];
          if (Array.isArray(rawLayout)) {
            layoutOrder = rawLayout;
          } else if (rawLayout && typeof rawLayout === 'object') {
            layoutOrder = rawLayout.moduleOrder || rawLayout.moduleIds || null;
            layoutSpans = rawLayout.moduleSpans || {};
            disabledIds = rawLayout.disabledModuleIds || [];
          }

          if (layoutOrder && Array.isArray(layoutOrder) && layoutOrder.length > 0) {
            const modulesMap = new Map();
            modulesList.value.forEach(m => modulesMap.set(m.id, m));

            const orderedList = [];
            const disabledSet = new Set(disabledIds);
            layoutOrder.forEach(id => {
              if (modulesMap.has(id) && !disabledSet.has(id)) {
                const mod = modulesMap.get(id);
                orderedList.push({
                  ...mod,
                  span: layoutSpans[id] || mod.span || 1
                });
              }
            });
            currentRoleModuleList.value = orderedList;
          } else {
            let filtered = [];
            if (roleCode === 'SUPER_ADMIN') {
              filtered = [...modulesList.value];
            } else {
              filtered = modulesList.value.filter(m => {
                if (m.allowedRoleCodes && m.allowedRoleCodes.length > 0) {
                  return m.allowedRoleCodes.some(c => c.toUpperCase() === roleCode);
                }
                if (m.requiredPermission) {
                  const roleObj = rolesList.value.find(r => (r.code || r.name || '').toUpperCase() === roleCode);
                  return roleObj && roleObj.permissions && roleObj.permissions.some(p => p.name === m.requiredPermission);
                }
                return true;
              });
            }
            currentRoleModuleList.value = filtered.map(m => ({
              ...m,
              span: 1
            }));
          }
        };

        const onLayoutRoleChange = () => {
          if (isEditingRoleLayout.value) {
            isEditingRoleLayout.value = false;
          }
          computeRoleModules();
        };

        const startEditRoleLayout = () => {
          isEditingRoleLayout.value = true;
          showToast("Drag & drop layout edit mode enabled for '" + selectedLayoutRole.value + "'", 'info');
        };

        const cancelEditRoleLayout = () => {
          isEditingRoleLayout.value = false;
          draggedModuleIndex.value = null;
          dragOverModuleIndex.value = null;
          computeRoleModules();
          showToast('Layout changes cancelled', 'info');
        };

        const isModuleInCurrentLayout = (moduleId) => {
          if (!moduleId || !currentRoleModuleList.value) return false;
          return currentRoleModuleList.value.some(m => m.id === moduleId);
        };

        const openAddModuleToLayoutModal = () => {
          addModuleToLayoutModal.value = true;
        };

        const closeAddModuleToLayoutModal = () => {
          addModuleToLayoutModal.value = false;
        };

        const addModuleToCurrentRoleLayout = (mod) => {
          if (!mod || !mod.id) return;
          if (isModuleInCurrentLayout(mod.id)) {
            showToast("Module '" + mod.title + "' is already in this role layout!", "info");
            return;
          }
          const cloned = { ...mod, span: 1 };
          currentRoleModuleList.value.push(cloned);
          if (!isEditingRoleLayout.value) {
            isEditingRoleLayout.value = true;
          }
          showToast("Added '" + mod.title + "' to layout. Click 'Save' to persist changes.", "success");
        };

        const removeModuleFromCurrentRoleLayout = (index) => {
          if (index < 0 || index >= currentRoleModuleList.value.length) return;
          const removed = currentRoleModuleList.value.splice(index, 1);
          if (removed && removed[0]) {
            showToast("Removed '" + removed[0].title + "' from layout. Click 'Save' to persist.", "info");
          }
        };

        const toggleModuleSpan = (index) => {
          if (index < 0 || index >= currentRoleModuleList.value.length) return;
          const currentSpan = currentRoleModuleList.value[index].span || 1;
          currentRoleModuleList.value[index].span = currentSpan === 2 ? 1 : 2;
        };

        const saveRoleLayoutOrder = async () => {
          savingRoleLayout.value = true;
          const roleCode = (selectedLayoutRole.value || 'SUPER_ADMIN').toUpperCase();
          const moduleOrder = currentRoleModuleList.value.map(m => m.id);
          const moduleSpans = {};
          currentRoleModuleList.value.forEach(m => {
            if (m.span && m.span > 1) {
              moduleSpans[m.id] = m.span;
            }
          });

          try {
            const res = await fetch('/api/d-modules/layouts/' + encodeURIComponent(roleCode), {
              method: 'PUT',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({ moduleOrder, moduleIds: moduleOrder, moduleSpans })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save layout');
            roleLayouts.value[roleCode] = { roleCode, moduleOrder, moduleSpans, disabledModuleIds: [] };
            isEditingRoleLayout.value = false;
            showToast("Dashboard layout for role '" + roleCode + "' saved successfully!", 'success');
          } catch(e) {
            showToast(e.message, 'error');
          } finally {
            savingRoleLayout.value = false;
          }
        };

        const onDragStart = (index, event) => {
          if (!isEditingRoleLayout.value) return;
          draggedModuleIndex.value = index;
          if (event && event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(index));
          }
        };

        const onDragOver = (index, event) => {
          if (!isEditingRoleLayout.value) return;
          if (event) {
            event.preventDefault();
            if (event.dataTransfer) {
              event.dataTransfer.dropEffect = 'move';
            }
          }
          dragOverModuleIndex.value = index;
        };

        const onDrop = (targetIndex, event) => {
          if (!isEditingRoleLayout.value) return;
          if (event) event.preventDefault();
          const fromIndex = draggedModuleIndex.value;
          if (fromIndex !== null && fromIndex !== undefined && fromIndex !== targetIndex) {
            const list = [...currentRoleModuleList.value];
            const [movedItem] = list.splice(fromIndex, 1);
            list.splice(targetIndex, 0, movedItem);
            currentRoleModuleList.value = list;
          }
          draggedModuleIndex.value = null;
          dragOverModuleIndex.value = null;
        };

        const onDragEnd = () => {
          draggedModuleIndex.value = null;
          dragOverModuleIndex.value = null;
        };

        const moveModuleOrder = (index, direction) => {
          if (!isEditingRoleLayout.value) return;
          const targetIndex = index + direction;
          if (targetIndex < 0 || targetIndex >= currentRoleModuleList.value.length) return;
          const list = [...currentRoleModuleList.value];
          const temp = list[index];
          list[index] = list[targetIndex];
          list[targetIndex] = temp;
          currentRoleModuleList.value = list;
        };

        const fetchModules = async () => {
          try {
            const [modRes, layoutRes] = await Promise.all([
              fetch('/api/features/all', { headers: authHeaders(), credentials: 'include' }),
              fetch('/api/d-modules/layouts', { headers: authHeaders(), credentials: 'include' })
            ]);
            if (modRes.ok) modulesList.value = await modRes.json();
            if (layoutRes.ok) roleLayouts.value = await layoutRes.json();
            computeRoleModules();
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
          selectedSandboxDeviceEUI.value = d.devEUI;
          onSelectSandboxDevice();
          switchTab('decoder');
          setTimeout(() => {
            const el = document.getElementById('decoder-sandbox-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
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

        const fetchSandboxTelemetry = async (silent = false) => {
          if (!silent) loadingDeviceTelemetry.value = true;
          try {
            const url = selectedSandboxDeviceEUI.value
              ? '/lorawan/telemetry?devEUI=' + encodeURIComponent(selectedSandboxDeviceEUI.value) + '&limit=50'
              : '/lorawan/telemetry?limit=50';
            const res = await fetch(url, { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              sandboxTelemetryList.value = Array.isArray(data) ? data : [];
              if (sandboxTelemetryList.value.length > 0 && !sandboxHex.value) {
                const latest = sandboxTelemetryList.value[0];
                sandboxHex.value = latest.payloadHex || latest.data || '09C441';
                sandboxFPort.value = latest.fPort || 1;
              }
            }
          } catch(err) {
            if (!silent) showToast('Failed to fetch telemetry: ' + err.message, 'error');
          } finally {
            if (!silent) loadingDeviceTelemetry.value = false;
          }
        };

        const onSelectSandboxDevice = async () => {
          if (!selectedSandboxDeviceEUI.value) {
            sandboxActiveMetadata.value = null;
            await fetchSandboxTelemetry(false);
            return;
          }
          const dev = devicesList.value.find(d => d.devEUI === selectedSandboxDeviceEUI.value);
          if (!dev) return;

          if (dev.decoderId) {
            selectedSandboxDecoderId.value = dev.decoderId;
            const found = decodersList.value.find(d => d.id === dev.decoderId);
            if (found && found.decoderCode) {
              sandboxCode.value = found.decoderCode;
            }
          } else if (dev.payloadFormatterScript) {
            sandboxCode.value = dev.payloadFormatterScript;
          }

          await fetchSandboxTelemetry(false);
          if (sandboxTelemetryList.value.length > 0) {
            const latest = sandboxTelemetryList.value[0];
            sandboxHex.value = latest.payloadHex || latest.data || '09C441';
            sandboxFPort.value = latest.fPort || 1;
            sandboxActiveMetadata.value = {
              deviceName: dev.name || latest.deviceName || dev.devEUI,
              devEui: dev.devEUI,
              fPort: latest.fPort || 1,
              fCnt: latest.fCnt || 0,
              rssi: latest.rssi,
              snr: latest.snr,
              gatewayId: latest.gatewayId,
              timestamp: latest.timestamp || latest.receivedAt
            };
            if (sandboxHex.value) {
              runSandboxDecode();
            }
          } else {
            sandboxActiveMetadata.value = {
              deviceName: dev.name,
              devEui: dev.devEUI,
              fPort: 1,
              fCnt: 0,
              rssi: null,
              snr: null,
              gatewayId: null,
              timestamp: null
            };
          }
        };

        const loadHistoricalTelemetryPacket = (pkt) => {
          if (!pkt) return;
          sandboxHex.value = pkt.payloadHex || pkt.data || '';
          sandboxFPort.value = pkt.fPort || 1;
          if (sandboxActiveMetadata.value) {
            sandboxActiveMetadata.value = {
              ...sandboxActiveMetadata.value,
              fPort: pkt.fPort || 1,
              fCnt: pkt.fCnt || 0,
              rssi: pkt.rssi,
              snr: pkt.snr,
              gatewayId: pkt.gatewayId,
              timestamp: pkt.timestamp || pkt.receivedAt
            };
          }
          runSandboxDecode();
          showToast('Loaded packet from ' + formatDateTime(pkt.timestamp || pkt.receivedAt), 'info');
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
            if (!hex) {
              sandboxDecodedObject.value = null;
              sandboxResult.value = '';
              throw new Error("Hex payload is empty");
            }
            if (hex.length % 2 !== 0) throw new Error("Hex payload length must be even");
            const bytes = [];
            for (let c = 0; c < hex.length; c += 2) {
              bytes.push(parseInt(hex.substr(c, 2), 16));
            }
            const fPort = sandboxFPort.value || 1;
            const fullCode = sandboxCode.value + "\\nif (typeof decodeUplink === 'function') { return decodeUplink({ bytes: bytes, fPort: fPort }); } else if (typeof Decoder === 'function') { return Decoder(bytes, fPort); } else { throw new Error('No entry function found. Please define decodeUplink(input) or Decoder(bytes, fPort)'); }";
            const fn = new Function("bytes", "fPort", fullCode);
            const output = fn(bytes, fPort);
            sandboxDecodedObject.value = output;
            sandboxResult.value = JSON.stringify(output, null, 2);
            showToast("Decoder executed successfully!", "success");
          } catch(e) {
            sandboxDecodedObject.value = null;
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

        const standaloneOpsUrl = computed(() => {
          const host = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost';
          return 'http://' + host + ':3099/manager';
        });

        const formatLogTime = (ts) => {
          if (!ts) return '--';
          try {
            const d = new Date(ts);
            return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
          } catch(e) {
            return String(ts);
          }
        };

        const formatUptime = (sec) => {
          if (!sec || isNaN(sec)) return '0m';
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = Math.floor(sec % 60);
          if (h > 0) return h + 'h ' + m + 'm ' + s + 's';
          if (m > 0) return m + 'm ' + s + 's';
          return s + 's';
        };

        const copyCommitHash = (hash) => {
          if (!hash) return;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(hash);
            showToast('Git commit hash copied to clipboard!', 'success');
          } else {
            showToast('Commit: ' + hash, 'info');
          }
        };

        const fetchSystemVersion = async () => {
          loadingSystemVersion.value = true;
          try {
            const res = await fetch('/api/system/version', { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              if (data && data.success) {
                systemVersionInfo.value = data;
              }
            }
          } catch(e) {
            console.warn('Could not fetch system version:', e);
          } finally {
            loadingSystemVersion.value = false;
          }
        };

        const openRestartConfirmDialog = () => {
          restartConfirmDialog.value = true;
        };

        const openServerLogsDialog = async () => {
          serverLogsDialog.value = true;
          loadingServerLogs.value = true;
          try {
            const res = await fetch('/api/system/logs?tail=80', {
              headers: authHeaders(),
              credentials: 'include'
            });
            if (res.ok) {
              const data = await res.json();
              serverLogs.value = data.logs || 'No log output returned from container.';
            } else {
              serverLogs.value = 'Failed to fetch logs: HTTP ' + res.status;
            }
          } catch(e) {
            serverLogs.value = 'Error fetching container logs: ' + e.message;
          } finally {
            loadingServerLogs.value = false;
          }
        };

        // --- C-MODULE: HMI SCADA STUDIO STATE & METHODS ---
        const hmiScreensList = ref([]);
        const selectedHmiScreenId = ref('');
        const currentHmiScreen = ref(null);
        const savingHmiScreen = ref(false);
        const hmiEditorMode = ref('design'); // 'design' | 'run'
        const selectedWidgetId = ref(null);
        const hmiZoom = ref(100);
        const hmiGridSize = ref(10);
        const canvasPreset = ref('1280x720');
        const hmiTelemetryMap = ref({});
        const hmiTrendHistory = ref([]);
        const trendPointsMap = ref({});
        const trendHoverState = ref({});
        const trendSeriesModal = ref(false);
        const trendTargetWidget = ref(null);
        const trendSeriesForm = ref({ devEUI: '', field: '', label: '', color: '#38bdf8', unit: '' });
        const detectedTrendFields = ref([]);
        const loadingTrendFields = ref(false);
        const hmiTelemetryTimer = ref(null);
        const createHmiModal = ref(false);
        const newHmiScreenForm = ref({
          name: '',
          description: '',
          width: 1280,
          height: 720,
          background: '#0b0f19'
        });
        const hmiRbacModal = ref(false);
        const selectedScreenRoles = ref([]);
        const widgetSwitchStates = ref({});

        const selectedWidget = computed(() => {
          if (!currentHmiScreen.value || !selectedWidgetId.value) return null;
          return currentHmiScreen.value.widgets?.find(w => w.id === selectedWidgetId.value) || null;
        });

        const selectedWidgetBinding = computed(() => {
          if (!selectedWidget.value) return { devEUI: '', field: '', formula: 'val * 1.0', decimalPlaces: 1 };
          if (!selectedWidget.value.bindings) selectedWidget.value.bindings = {};
          if (!selectedWidget.value.bindings.value) {
            selectedWidget.value.bindings.value = { devEUI: '', field: '', formula: 'val * 1.0', decimalPlaces: 1 };
          }
          return selectedWidget.value.bindings.value;
        });

        const selectedWidgetAction = computed(() => {
          if (!selectedWidget.value) return { type: 'downlink', fPort: 1, payloadHex: '01' };
          if (!selectedWidget.value.action) {
            selectedWidget.value.action = { type: 'downlink', fPort: 1, payloadHex: '01', confirmMessage: '' };
          }
          return selectedWidget.value.action;
        });

        const fetchHmiScreens = async () => {
          try {
            const res = await fetch('/api/hmi/screens', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              hmiScreensList.value = Array.isArray(data) ? data : [];
              if (hmiScreensList.value.length > 0) {
                if (!selectedHmiScreenId.value || !hmiScreensList.value.some(s => s.id === selectedHmiScreenId.value)) {
                  selectedHmiScreenId.value = hmiScreensList.value[0].id;
                  onSelectHmiScreen();
                }
              }
            }
          } catch(e) {
            console.error('Error fetching HMI screens:', e);
          }
        };

        const onSelectHmiScreen = () => {
          const found = hmiScreensList.value.find(s => s.id === selectedHmiScreenId.value);
          if (found) {
            currentHmiScreen.value = JSON.parse(JSON.stringify(found));
            selectedWidgetId.value = null;
            canvasPreset.value = (currentHmiScreen.value.canvasConfig?.width || 1280) + 'x' + (currentHmiScreen.value.canvasConfig?.height || 720);
            currentHmiScreen.value.widgets?.forEach(w => {
              if (w.type === 'realtime-trend') {
                fetchTrendHistoryForWidget(w);
              }
            });
          }
        };

        const saveCurrentHmiScreen = async () => {
          if (!currentHmiScreen.value) return;
          savingHmiScreen.value = true;
          try {
            const payload = {
              name: currentHmiScreen.value.name,
              description: currentHmiScreen.value.description,
              canvasConfig: currentHmiScreen.value.canvasConfig,
              widgets: currentHmiScreen.value.widgets,
              isPublished: currentHmiScreen.value.isPublished,
              allowedRoles: currentHmiScreen.value.allowedRoles
            };
            const res = await fetch('/api/hmi/screens/' + encodeURIComponent(currentHmiScreen.value.id), {
              method: 'PUT',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(payload)
            });
            if (res.ok) {
              const updated = await res.json();
              const idx = hmiScreensList.value.findIndex(s => s.id === updated.id);
              if (idx !== -1) hmiScreensList.value[idx] = updated;
              showToast('HMI Screen saved successfully', 'success');
            } else {
              const err = await res.json();
              showToast('Save failed: ' + (err.message || 'Unknown error'), 'error');
            }
          } catch(e) {
            showToast('Network error saving screen: ' + e.message, 'error');
          } finally {
            savingHmiScreen.value = false;
          }
        };

        const openCreateHmiScreenModal = () => {
          newHmiScreenForm.value = {
            name: 'New HMI Screen',
            description: 'Industrial SCADA monitoring screen',
            width: 1280,
            height: 720,
            background: '#0b0f19'
          };
          createHmiModal.value = true;
        };

        const submitCreateHmiScreen = async () => {
          if (!newHmiScreenForm.value.name) return;
          try {
            const payload = {
              name: newHmiScreenForm.value.name,
              description: newHmiScreenForm.value.description,
              canvasConfig: {
                width: Number(newHmiScreenForm.value.width) || 1280,
                height: Number(newHmiScreenForm.value.height) || 720,
                background: newHmiScreenForm.value.background || '#0b0f19',
                grid: 10,
                showGrid: true
              },
              widgets: [],
              isPublished: false,
              allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'OPERATOR', 'VIEWER']
            };
            const res = await fetch('/api/hmi/screens', {
              method: 'POST',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(payload)
            });
            if (res.ok) {
              const created = await res.json();
              hmiScreensList.value.unshift(created);
              selectedHmiScreenId.value = created.id;
              currentHmiScreen.value = JSON.parse(JSON.stringify(created));
              createHmiModal.value = false;
              showToast('Screen ' + created.name + ' created', 'success');
            } else {
              const err = await res.json();
              showToast('Create failed: ' + (err.message || 'Error'), 'error');
            }
          } catch(e) {
            showToast('Failed to create screen: ' + e.message, 'error');
          }
        };

        const cloneCurrentHmiScreen = async () => {
          if (!currentHmiScreen.value) return;
          try {
            const res = await fetch('/api/hmi/screens/' + encodeURIComponent(currentHmiScreen.value.id) + '/clone', {
              method: 'POST',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ name: currentHmiScreen.value.name + ' (Copy)' })
            });
            if (res.ok) {
              const cloned = await res.json();
              hmiScreensList.value.unshift(cloned);
              selectedHmiScreenId.value = cloned.id;
              currentHmiScreen.value = JSON.parse(JSON.stringify(cloned));
              showToast('Duplicated as ' + cloned.name, 'success');
            }
          } catch(e) {
            showToast('Failed to duplicate screen', 'error');
          }
        };

        const togglePublishHmiScreen = async () => {
          if (!currentHmiScreen.value) return;
          const nextState = !currentHmiScreen.value.isPublished;
          try {
            const res = await fetch('/api/hmi/screens/' + encodeURIComponent(currentHmiScreen.value.id) + '/publish', {
              method: 'POST',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ isPublished: nextState })
            });
            if (res.ok) {
              const updated = await res.json();
              currentHmiScreen.value.isPublished = updated.isPublished;
              const idx = hmiScreensList.value.findIndex(s => s.id === updated.id);
              if (idx !== -1) hmiScreensList.value[idx].isPublished = updated.isPublished;
              showToast(updated.isPublished ? 'Screen published to Operators' : 'Screen moved to Draft', 'success');
            }
          } catch(e) {
            showToast('Failed to toggle publish status', 'error');
          }
        };

        const deleteCurrentHmiScreen = async () => {
          if (!currentHmiScreen.value) return;
          if (!confirm('Are you sure you want to permanently delete ' + currentHmiScreen.value.name + '?')) return;
          try {
            const res = await fetch('/api/hmi/screens/' + encodeURIComponent(currentHmiScreen.value.id), {
              method: 'DELETE',
              headers: authHeaders(),
              credentials: 'include'
            });
            if (res.ok) {
              hmiScreensList.value = hmiScreensList.value.filter(s => s.id !== currentHmiScreen.value.id);
              if (hmiScreensList.value.length > 0) {
                selectedHmiScreenId.value = hmiScreensList.value[0].id;
                onSelectHmiScreen();
              } else {
                currentHmiScreen.value = null;
                selectedHmiScreenId.value = '';
              }
              showToast('Screen deleted', 'success');
            }
          } catch(e) {
            showToast('Failed to delete screen', 'error');
          }
        };

        const openHmiRbacModal = () => {
          if (!currentHmiScreen.value) return;
          selectedScreenRoles.value = [...(currentHmiScreen.value.allowedRoles || ['ADMIN'])];
          hmiRbacModal.value = true;
        };

        const saveHmiRbac = () => {
          if (!currentHmiScreen.value) return;
          currentHmiScreen.value.allowedRoles = [...selectedScreenRoles.value];
          hmiRbacModal.value = false;
          saveCurrentHmiScreen();
        };

        const onCanvasPresetChange = () => {
          if (!currentHmiScreen.value) return;
          const parts = canvasPreset.value.split('x');
          if (parts.length === 2) {
            currentHmiScreen.value.canvasConfig.width = Number(parts[0]);
            currentHmiScreen.value.canvasConfig.height = Number(parts[1]);
          }
        };

        const addWidgetToCanvas = (type) => {
          if (!currentHmiScreen.value) return;
          if (!currentHmiScreen.value.widgets) currentHmiScreen.value.widgets = [];

          const id = 'w-' + type + '-' + Date.now().toString(36);
          let defaultProps = {};
          let defaultW = 160;
          let defaultH = 80;
          let bindings = { value: { devEUI: '', field: '', formula: 'val * 1.0', decimalPlaces: 1 } };
          let states = [];
          let action = null;

          switch (type) {
            case 'bit-lamp':
              defaultW = 140;
              defaultH = 40;
              defaultProps = { title: 'MOTOR STATUS', labelOn: 'RUNNING', labelOff: 'STOPPED', colorOn: '#10b981', colorOff: '#475569' };
              bindings.value.field = 'relay_1';
              break;
            case 'multi-state-lamp':
              defaultW = 160;
              defaultH = 46;
              defaultProps = { title: 'CHILLER PUMP', state0: 'OFF', state1: 'RUN', state2: 'WARN', state3: 'FAULT' };
              bindings.value.field = 'status';
              break;
            case 'alarm-banner':
              defaultW = 420;
              defaultH = 40;
              defaultProps = { title: 'PROCESS ALARMS', idleMessage: 'All systems operating within nominal parameters.' };
              states = [{ condition: 'val > 80', alarmText: 'CRITICAL HIGH THRESHOLD EXCEEDED!' }];
              break;
            case 'linear-tank':
              defaultW = 200;
              defaultH = 300;
              defaultProps = { title: 'STORAGE TANK', min: 0, max: 100, unit: 'm³', liquidColor: '#0284c7' };
              bindings.value.field = 'water_level';
              states = [
                { condition: 'val < 20', color: '#ef4444', alarmText: 'Tank Level Critical Low' },
                { condition: 'val >= 20 && val <= 80', color: '#0284c7' },
                { condition: 'val > 80', color: '#f59e0b', alarmText: 'Tank Level High Alert' }
              ];
              break;
            case 'silo-vessel':
              defaultW = 180;
              defaultH = 260;
              defaultProps = { title: 'SILO HOPPER', min: 0, max: 100, unit: '%', liquidColor: '#6366f1' };
              bindings.value.field = 'silo_fill';
              break;
            case 'dial-gauge':
              defaultW = 240;
              defaultH = 240;
              defaultProps = { title: 'LINE PRESSURE', min: 0, max: 16, unit: 'Bar' };
              bindings.value.field = 'pressure';
              break;
            case 'led-numeric':
              defaultW = 220;
              defaultH = 70;
              defaultProps = { title: 'FLOW RATE', unit: 'm³/h', color: '#38bdf8' };
              bindings.value.field = 'flow_rate';
              break;
            case 'mono-box':
              defaultW = 180;
              defaultH = 76;
              defaultProps = { title: 'TEMPERATURE', unit: '°C', icon: 'fa-solid fa-temperature-half' };
              bindings.value.field = 'temperature';
              break;
            case 'static-label':
              defaultW = 320;
              defaultH = 40;
              defaultProps = { text: 'SECTION HEADER TITLE', subText: 'Operational Substation 01', fontSize: 16, textColor: '#38bdf8' };
              break;
            case 'toggle-switch':
              defaultW = 180;
              defaultH = 64;
              defaultProps = { title: 'VALVE 01 ACTUATOR', labelOn: 'OPEN', labelOff: 'CLOSED' };
              action = { type: 'downlink', fPort: 1, payloadHex: '0101', confirmMessage: 'Toggle Valve Actuator state?' };
              break;
            case 'action-button':
              defaultW = 160;
              defaultH = 50;
              defaultProps = { label: 'EMERGENCY SHUTDOWN', buttonColor: '#e11d48', icon: 'fa-solid fa-power-off' };
              action = { type: 'downlink', fPort: 1, payloadHex: 'FFFF', confirmMessage: 'Trigger emergency shutdown command?' };
              break;
            case 'realtime-trend':
              defaultW = 500;
              defaultH = 260;
              const seedDev = (devicesList.value && devicesList.value.length > 0) ? devicesList.value[0].devEUI : '';
              defaultProps = {
                title: 'REALTIME TELEMETRY TREND',
                timeRange: '1h',
                series: seedDev ? [{
                  id: 'ser_' + Date.now().toString(36),
                  devEUI: seedDev,
                  field: 'HUMIDITY',
                  label: (devicesList.value[0].name || seedDev) + ' - HUMIDITY',
                  color: '#38bdf8',
                  unit: '%RH',
                  visible: true
                }] : []
              };
              break;
          }

          const maxW = currentHmiScreen.value.canvasConfig?.width || 1280;
          const maxH = currentHmiScreen.value.canvasConfig?.height || 720;
          const x = Math.min(80 + (currentHmiScreen.value.widgets.length % 5) * 30, maxW - defaultW);
          const y = Math.min(80 + (currentHmiScreen.value.widgets.length % 5) * 30, maxH - defaultH);
          const grid = hmiGridSize.value || 10;

          const newWidget = {
            id,
            type,
            x: Math.round(x / grid) * grid,
            y: Math.round(y / grid) * grid,
            w: defaultW,
            h: defaultH,
            zIndex: currentHmiScreen.value.widgets.length + 1,
            props: defaultProps,
            bindings,
            states,
            action
          };

          currentHmiScreen.value.widgets.push(newWidget);
          selectedWidgetId.value = id;
        };

        const removeSelectedWidget = () => {
          if (!currentHmiScreen.value || !selectedWidgetId.value) return;
          currentHmiScreen.value.widgets = currentHmiScreen.value.widgets.filter(w => w.id !== selectedWidgetId.value);
          selectedWidgetId.value = null;
        };

        const duplicateSelectedWidget = () => {
          if (!currentHmiScreen.value || !selectedWidget.value) return;
          const copy = JSON.parse(JSON.stringify(selectedWidget.value));
          copy.id = 'w-' + copy.type + '-' + Date.now().toString(36);
          copy.x += 20;
          copy.y += 20;
          copy.zIndex = (currentHmiScreen.value.widgets.length || 1) + 1;
          currentHmiScreen.value.widgets.push(copy);
          selectedWidgetId.value = copy.id;
        };

        const moveWidgetLayer = (dir) => {
          if (!selectedWidget.value) return;
          selectedWidget.value.zIndex = Math.max(1, (selectedWidget.value.zIndex || 1) + dir);
        };

        const onWidgetMouseDown = (e, widget) => {
          if (hmiEditorMode.value !== 'design') return;
          selectedWidgetId.value = widget.id;
          const startMouseX = e.clientX;
          const startMouseY = e.clientY;
          const startX = widget.x;
          const startY = widget.y;
          const grid = hmiGridSize.value || 1;

          const onMouseMove = (moveEvent) => {
            const scale = (hmiZoom.value || 100) / 100;
            const dx = (moveEvent.clientX - startMouseX) / scale;
            const dy = (moveEvent.clientY - startMouseY) / scale;
            let newX = Math.round((startX + dx) / grid) * grid;
            let newY = Math.round((startY + dy) / grid) * grid;
            const maxW = currentHmiScreen.value?.canvasConfig?.width || 1920;
            const maxH = currentHmiScreen.value?.canvasConfig?.height || 1080;
            widget.x = Math.max(0, Math.min(newX, maxW - widget.w));
            widget.y = Math.max(0, Math.min(newY, maxH - widget.h));
          };

          const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          };

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        };

        const detectedTelemetryFields = ref([]);
        const loadingDetectedFields = ref(false);
        const hmiTagFilterQuery = ref('');

        const filteredDetectedTelemetryFields = computed(() => {
          if (!hmiTagFilterQuery.value || !hmiTagFilterQuery.value.trim()) {
            return detectedTelemetryFields.value;
          }
          const q = hmiTagFilterQuery.value.trim().toLowerCase();
          return detectedTelemetryFields.value.filter(f =>
            (f.key && f.key.toLowerCase().includes(q)) ||
            (f.label && f.label.toLowerCase().includes(q))
          );
        });

        const fetchDetectedFieldsForSelectedDevice = async () => {
          const devEUI = selectedWidgetBinding.value?.devEUI;
          if (!devEUI) {
            detectedTelemetryFields.value = [];
            return;
          }
          loadingDetectedFields.value = true;
          try {
            const res = await fetch('/lorawan/devices/' + encodeURIComponent(devEUI) + '/telemetry-fields', {
              headers: authHeaders(),
              credentials: 'include',
            });
            if (res.ok) {
              const data = await res.json();
              detectedTelemetryFields.value = Array.isArray(data?.fields) ? data.fields : [];
            } else {
              detectedTelemetryFields.value = [];
            }
          } catch (e) {
            detectedTelemetryFields.value = [];
          } finally {
            loadingDetectedFields.value = false;
          }
        };

        const applyDetectedField = (fieldObj) => {
          if (!selectedWidgetBinding.value || !fieldObj) return;
          selectedWidgetBinding.value.field = fieldObj.key;
          if (selectedWidget.value?.props) {
            if (fieldObj.unit && selectedWidget.value.props.unit !== undefined && !selectedWidget.value.props.unit) {
              selectedWidget.value.props.unit = fieldObj.unit;
            }
            if (selectedWidget.value.props.title !== undefined && (!selectedWidget.value.props.title || selectedWidget.value.props.title === 'Lamp' || selectedWidget.value.props.title === 'Storage Tank' || selectedWidget.value.props.title === 'Sensor' || selectedWidget.value.props.title === 'TEMPERATURE' || selectedWidget.value.props.title === 'FLOW RATE')) {
              selectedWidget.value.props.title = fieldObj.label;
            }
          }
          showToast('Selected Tag: ' + fieldObj.key + ' (' + fieldObj.latestValue + (fieldObj.unit ? ' ' + fieldObj.unit : '') + ')', 'info');
        };

        const getTagTooltip = (f) => {
          if (!f) return '';
          return ['Field: ' + (f.key || ''), 'Label: ' + (f.label || ''), 'Latest Value: ' + (f.latestValue ?? '') + (f.unit ? ' ' + f.unit : ''), 'Type: ' + (f.dataType || '')].join(String.fromCharCode(10));
        };

        watch(() => selectedWidgetId.value, () => {
          if (selectedWidgetBinding.value?.devEUI) {
            fetchDetectedFieldsForSelectedDevice();
          } else {
            detectedTelemetryFields.value = [];
          }
        });

        const stretchWidgetWidth = (widget, amount) => {
          if (!widget) return;
          const maxW = currentHmiScreen.value?.canvasConfig?.width || 1920;
          if (amount === 'full') {
            widget.x = 0;
            widget.w = maxW;
          } else {
            widget.w = Math.max(40, Math.min(maxW - widget.x, (widget.w || 100) + amount));
          }
        };

        const stretchWidgetHeight = (widget, amount) => {
          if (!widget) return;
          const maxH = currentHmiScreen.value?.canvasConfig?.height || 1080;
          widget.h = Math.max(30, Math.min(maxH - widget.y, (widget.h || 60) + amount));
        };

        const setWidgetPresetSize = (widget, w, h) => {
          if (!widget) return;
          const maxW = currentHmiScreen.value?.canvasConfig?.width || 1920;
          const maxH = currentHmiScreen.value?.canvasConfig?.height || 1080;
          widget.w = Math.min(w, maxW - widget.x);
          widget.h = Math.min(h, maxH - widget.y);
        };

        const setHmiEditorMode = (mode) => {
          hmiEditorMode.value = mode;
          if (mode === 'design') {
            stopHmiTelemetryPolling();
            showToast('Design Mode: live simulation paused for precise editing', 'info');
          } else {
            selectedWidgetId.value = null;
            startHmiTelemetryPolling();
            showToast('Runtime View: live telemetry streaming active', 'success');
          }
        };

        const handleHmiKeydown = (e) => {
          if (activeTab.value !== 'hmi-studio' || hmiEditorMode.value !== 'design') return;
          const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
          if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) {
            return;
          }

          if (!selectedWidget.value) return;

          if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            removeSelectedWidget();
            showToast('Widget deleted', 'info');
          } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            duplicateSelectedWidget();
            showToast('Widget duplicated', 'info');
          } else if (e.key === 'Escape') {
            selectedWidgetId.value = null;
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const step = e.shiftKey ? 10 : (hmiGridSize.value || 1);
            selectedWidget.value.x = Math.max(0, selectedWidget.value.x - step);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const step = e.shiftKey ? 10 : (hmiGridSize.value || 1);
            const maxW = currentHmiScreen.value?.canvasConfig?.width || 1920;
            selectedWidget.value.x = Math.min(maxW - selectedWidget.value.w, selectedWidget.value.x + step);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const step = e.shiftKey ? 10 : (hmiGridSize.value || 1);
            selectedWidget.value.y = Math.max(0, selectedWidget.value.y - step);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const step = e.shiftKey ? 10 : (hmiGridSize.value || 1);
            const maxH = currentHmiScreen.value?.canvasConfig?.height || 1080;
            selectedWidget.value.y = Math.min(maxH - selectedWidget.value.h, selectedWidget.value.y + step);
          }
        };

        const onResizeMouseDown = (e, widget, handle = 'se') => {
          if (hmiEditorMode.value !== 'design') return;
          const startMouseX = e.clientX;
          const startMouseY = e.clientY;
          const startX = widget.x;
          const startY = widget.y;
          const startW = widget.w;
          const startH = widget.h;
          const grid = hmiGridSize.value || 1;
          const maxCanvasW = currentHmiScreen.value?.canvasConfig?.width || 1920;
          const maxCanvasH = currentHmiScreen.value?.canvasConfig?.height || 1080;

          const onMouseMove = (moveEvent) => {
            const scale = (hmiZoom.value || 100) / 100;
            const dx = (moveEvent.clientX - startMouseX) / scale;
            const dy = (moveEvent.clientY - startMouseY) / scale;

            let newX = startX;
            let newY = startY;
            let newW = startW;
            let newH = startH;

            // Width & X adjustments
            if (handle.includes('e')) {
              newW = Math.max(40, Math.round((startW + dx) / grid) * grid);
              newW = Math.min(newW, maxCanvasW - startX);
            } else if (handle.includes('w')) {
              const snappedDx = Math.round(dx / grid) * grid;
              const proposedW = startW - snappedDx;
              if (proposedW >= 40) {
                newX = Math.max(0, startX + snappedDx);
                newW = proposedW;
              }
            }

            // Height & Y adjustments
            if (handle.includes('s')) {
              newH = Math.max(30, Math.round((startH + dy) / grid) * grid);
              newH = Math.min(newH, maxCanvasH - startY);
            } else if (handle.includes('n')) {
              const snappedDy = Math.round(dy / grid) * grid;
              const proposedH = startH - snappedDy;
              if (proposedH >= 30) {
                newY = Math.max(0, startY + snappedDy);
                newH = proposedH;
              }
            }

            widget.x = newX;
            widget.y = newY;
            widget.w = newW;
            widget.h = newH;
          };

          const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          };

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        };


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

          if (raw === undefined || raw === null) {
            if (widget.type === 'linear-tank') raw = 64.5;
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

          if (binding?.formula && binding.formula.trim()) {
            try {
              const fn = new Function('val', 'return (' + binding.formula + ')');
              val = fn(val);
            } catch(e) {}
          }

          const dec = binding?.decimalPlaces !== undefined ? binding.decimalPlaces : 1;
          return Number(val).toFixed(dec);
        };

        const getWidgetTankHeightPercent = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          const min = widget.props?.min !== undefined ? widget.props.min : 0;
          const max = widget.props?.max !== undefined ? widget.props.max : 100;
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
          const min = widget.props?.min !== undefined ? widget.props.min : 0;
          const max = widget.props?.max !== undefined ? widget.props.max : 100;
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

        const getWidgetAlarmText = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          if (widget.states && widget.states.length > 0) {
            for (const st of widget.states) {
              if (st.alarmText && st.condition) {
                try {
                  const fn = new Function('val', 'return (' + st.condition + ')');
                  if (fn(val)) return st.alarmText;
                } catch(e) {}
              }
            }
          }
          return '';
        };

        const getWidgetAlarmClass = (widget) => {
          if (isWidgetAlarmActive(widget)) {
            return 'bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse';
          }
          return 'bg-slate-900/90 border-slate-700/80 shadow-inner';
        };

        const isWidgetSwitchOn = (widget) => {
          if (widgetSwitchStates.value[widget.id] !== undefined) {
            return widgetSwitchStates.value[widget.id];
          }
          return isWidgetBitOn(widget);
        };

        const triggerWidgetToggleSwitch = async (widget) => {
          if (hmiEditorMode.value === 'design') return;
          const current = isWidgetSwitchOn(widget);
          const next = !current;
          const action = widget.action;

          if (action?.confirmMessage) {
            if (!confirm(action.confirmMessage)) return;
          }

          widgetSwitchStates.value[widget.id] = next;
          try {
            const res = await fetch('/api/hmi/screens/downlink', {
              method: 'POST',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                devEUI: action?.devEUI || widget.bindings?.value?.devEUI || '',
                fPort: action?.fPort || 1,
                payloadHex: next ? (action?.payloadHex || '0101') : '0100',
                actionType: 'toggle'
              })
            });
            if (res.ok) {
              showToast('Switch ' + (next ? 'ON' : 'OFF') + ' command sent', 'success');
            }
          } catch(e) {
            showToast('Failed to send switch command', 'error');
          }
        };

        const triggerWidgetActionButton = async (widget) => {
          if (hmiEditorMode.value === 'design') return;
          const action = widget.action;
          if (action?.confirmMessage) {
            if (!confirm(action.confirmMessage)) return;
          }
          try {
            const res = await fetch('/api/hmi/screens/downlink', {
              method: 'POST',
              headers: { ...authHeaders(), 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                devEUI: action?.devEUI || '',
                fPort: action?.fPort || 1,
                payloadHex: action?.payloadHex || '01',
                actionType: 'pushbutton'
              })
            });
            if (res.ok) {
              showToast('Action ' + (widget.props.label || 'COMMAND') + ' dispatched', 'success');
            }
          } catch(e) {
            showToast('Failed to dispatch action command', 'error');
          }
        };

        // REALTIME TREND FUNCTIONS (Metabase style with multi-sensor series & timestamp X-axis)
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

        const getWidgetTrendPath = (widget, tagIndex) => {
          const series = getTrendSeries(widget);
          if (series && series.length > 0) {
            const s = series[tagIndex || 0] || series[0];
            return getTrendSeriesPath(widget, s);
          }
          return '';
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
                  const { dev, flat } = extractFlattenedTelemetryHmi(rec);
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

        const extractFlattenedTelemetryHmi = (rec) => {
          if (!rec) return { dev: '', flat: {} };
          const dev = (rec.devEUI || rec.devEui || '').trim().toUpperCase();
          const flat = {};

          if (rec.rssi !== undefined && rec.rssi !== null) flat['rssi'] = rec.rssi;
          if (rec.snr !== undefined && rec.snr !== null) flat['snr'] = rec.snr;
          if (rec.fCnt !== undefined && rec.fCnt !== null) flat['fCnt'] = rec.fCnt;
          if (rec.fPort !== undefined && rec.fPort !== null) flat['fPort'] = rec.fPort;
          if (rec.dr !== undefined && rec.dr !== null) flat['dr'] = rec.dr;
          if (rec.frequency !== undefined && rec.frequency !== null) flat['frequency'] = rec.frequency;
          if (rec.battery !== undefined && rec.battery !== null) flat['battery'] = rec.battery;

          const flattenObject = (obj, prefix = '') => {
            if (!obj || typeof obj !== 'object') return;
            for (const [k, v] of Object.entries(obj)) {
              if (k === 'error' || k === 'errors' || k === 'warnings') continue;
              const fullKey = prefix ? prefix + '.' + k : k;
              if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                flattenObject(v, fullKey);
              } else if (v !== null && v !== undefined) {
                flat[fullKey] = v;
                if (prefix && flat[k] === undefined) flat[k] = v;
                if (fullKey.startsWith('data.')) {
                  const leaf = fullKey.substring(5);
                  if (flat[leaf] === undefined) flat[leaf] = v;
                }
              }
            }
          };

          if (rec.object && typeof rec.object === 'object') flattenObject(rec.object);
          if (rec.decodedData && typeof rec.decodedData === 'object') flattenObject(rec.decodedData);

          return { dev, flat };
        };

        const updateHmiTelemetryFromData = (records) => {
          if (!Array.isArray(records)) return;
          const newMap = { ...hmiTelemetryMap.value };
          records.forEach(rec => {
            const { dev, flat } = extractFlattenedTelemetryHmi(rec);
            for (const [k, v] of Object.entries(flat)) {
              if (dev) newMap[dev + '.' + k] = v;
              newMap[k] = v;
            }
          });
          hmiTelemetryMap.value = newMap;

          if (records.length > 0) {
            const sortedAsc = [...records].reverse();
            sortedAsc.forEach(rec => {
              const { dev, flat } = extractFlattenedTelemetryHmi(rec);
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

              // Update trendPointsMap for active trend widgets
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

        let hmiSocketClient = null;
        let hmiSseSource = null;

        const initHmiRealtimeStream = () => {
          if (hmiSocketClient || hmiSseSource) return;
          if (typeof io !== 'undefined') {
            try {
              hmiSocketClient = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });
              hmiSocketClient.on('connect', () => {
                hmiSocketClient.emit('subscribe:telemetry');
                hmiSocketClient.emit('subscribe:hmi');
              });
              hmiSocketClient.on('telemetry:uplink', (pkt) => {
                updateHmiTelemetryFromData([pkt]);
              });
              hmiSocketClient.on('downlink:status', (ev) => {
                if (ev?.downlinkLog) {
                  downlinkHistory.value.unshift(ev.downlinkLog);
                } else if (activeTab.value === 'downlink') {
                  fetchDownlinkHistory();
                }
                if (downlinkForm.value.devEUI) {
                  fetchDeviceQueue(downlinkForm.value.devEUI);
                }
              });
              return;
            } catch(e) {}
          }
          if (typeof EventSource !== 'undefined') {
            try {
              hmiSseSource = new EventSource('/api/realtime/stream');
              hmiSseSource.onmessage = (e) => {
                try {
                  const ev = JSON.parse(e.data);
                  if (ev.type === 'telemetry') updateHmiTelemetryFromData([ev.data]);
                  else if (ev.type === 'downlink') {
                    if (ev.data?.downlinkLog) {
                      downlinkHistory.value.unshift(ev.data.downlinkLog);
                    } else if (activeTab.value === 'downlink') {
                      fetchDownlinkHistory();
                    }
                    if (downlinkForm.value.devEUI) {
                      fetchDeviceQueue(downlinkForm.value.devEUI);
                    }
                  }
                } catch(err) {}
              };
            } catch(e) {}
          }
        };

        const fetchHmiTelemetryOnce = async () => {
          try {
            const res = await fetch('/lorawan/telemetry?limit=50', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              updateHmiTelemetryFromData(data);
            }
          } catch(e) {}
        };

        const startHmiTelemetryPolling = () => {
          initHmiRealtimeStream();
          fetchHmiTelemetryOnce();
          if (!hmiTelemetryTimer.value) {
            hmiTelemetryTimer.value = setInterval(fetchHmiTelemetryOnce, 4000);
          }
        };

        const stopHmiTelemetryPolling = () => {
          if (hmiTelemetryTimer.value) {
            clearInterval(hmiTelemetryTimer.value);
            hmiTelemetryTimer.value = null;
          }
        };

        // ==================== DOWNLINK CONTROLLER & ACTUATOR ====================
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
          const devNsId = dev ? (dev.networkServerId || (dev.networkServer ? dev.networkServer.id : '')) : '';
          if (devNsId) {
            return networkServersList.value.find(s => s.id === devNsId) || null;
          }
          if (downlinkForm.value.networkServerId) {
            return networkServersList.value.find(s => s.id === downlinkForm.value.networkServerId) || null;
          }
          return networkServersList.value.find(s => s.isDefault) || (networkServersList.value.length > 0 ? networkServersList.value[0] : null);
        });

        const selectDownlinkDevice = (d) => {
          downlinkForm.value.devEUI = d.devEUI;
          downlinkDeviceSearch.value = d.name ? d.name + ' - ' + d.devEUI : d.devEUI;
          const nsId = d.networkServerId || (d.networkServer ? d.networkServer.id : '');
          if (nsId) {
            downlinkForm.value.networkServerId = nsId;
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
            const nsId = dev.networkServerId || (dev.networkServer ? dev.networkServer.id : '');
            if (nsId) {
              downlinkForm.value.networkServerId = nsId;
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
            if (activeTab.value === 'downlink' && downlinkForm.value.devEUI) {
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


        const confirmRestartServer = async () => {
          restartingServer.value = true;
          try {
            const res = await fetch('/api/system/restart', {
              method: 'POST',
              headers: {
                ...authHeaders(),
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });
            const data = await res.json();
            restartConfirmDialog.value = false;
            
            if (data && data.success) {
              showToast('Restart signal sent to NestJS server container!', 'info');
              restartProgress.value = { active: true, countdown: 1, message: 'Restarting NestJS Backend...' };
              
              let attempts = 0;
              const pollInterval = setInterval(async () => {
                attempts++;
                restartProgress.value.countdown = attempts * 2;
                try {
                  const check = await fetch('/health?_t=' + Date.now());
                  if (check.ok) {
                    clearInterval(pollInterval);
                    restartProgress.value.active = false;
                    restartingServer.value = false;
                    showToast('Backend server restarted successfully and is back ONLINE!', 'success');
                    fetchSystemVersion();
                    initControlPanel();
                  }
                } catch(e) {}
                if (attempts > 30) {
                  clearInterval(pollInterval);
                  restartProgress.value.active = false;
                  restartingServer.value = false;
                  showToast('Restart completed. Please refresh the page.', 'info');
                }
              }, 2000);
            } else {
              showToast(data.message || 'Restart failed: Ops Agent unavailable.', 'error');
              restartingServer.value = false;
            }
          } catch(e) {
            showToast('Server is restarting...', 'info');
            restartConfirmDialog.value = false;
            restartProgress.value = { active: true, countdown: 1, message: 'Restarting...' };
            setTimeout(() => {
              window.location.reload();
            }, 6000);
          }
        };

        const modbusPresetsModule = useModbusPresetsModule({
          showToast,
          authHeaders,
          currentUser,
          activeTab,
        });

        const testBuilderModule = useTestBuilderModule({
          showToast,
          authHeaders,
          currentUser,
          activeTab,
        });

        watch(activeTab, (newTab) => {
          try {
            window.history.replaceState(null, null, '#' + newTab);
          } catch(e) {}
          if (newTab === 'overview') fetchSystemVersion();
          if (newTab === 'network-servers') fetchNetworkServers();
          if (newTab === 'modules') fetchModules();
          if (newTab === 'roles') fetchRoles();
          if (newTab === 'users') fetchUsers();
          if (newTab === 'database') fetchDbHealth();
          if (newTab === 'devices') fetchDevices();
          if (newTab === 'decoder') {
            fetchDecoders();
            fetchDevices();
            fetchSandboxTelemetry(false);
            if (sandboxAutoSync.value) {
              startSandboxAutoSync();
            }
          } else {
            stopSandboxAutoSync();
          }
          if (newTab === 'webhooks') {
            startWebhookPolling();
          } else {
            stopWebhookPolling();
          }
          if (newTab === 'hmi-studio') {
            fetchHmiScreens();
            fetchDevices();
            if (hmiEditorMode.value === 'run') {
              startHmiTelemetryPolling();
            } else {
              stopHmiTelemetryPolling();
            }
          } else {
            stopHmiTelemetryPolling();
          }
          if (newTab === 'downlink') {
            fetchNetworkServers();
            fetchDevices();
            fetchDownlinkHistory();
            if (downlinkForm.value.devEUI) {
              fetchDeviceQueue(downlinkForm.value.devEUI);
            }
            startDeviceQueuePolling();
            initHmiRealtimeStream();
          } else {
            stopDeviceQueuePolling();
          }
          if (newTab === 'modbus-presets') {
            modbusPresetsModule.fetchPresets();
            setTimeout(() => {
              modbusPresetsModule.initPresetsTabulator();
            }, 120);
          }
        });

        const initControlPanel = async () => {
          const ok = await fetchSession();
          if (!ok) return;

          fetchSystemVersion();
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
            if (hash === 'hmi-studio') {
              fetchHmiScreens();
              fetchDevices();
              if (hmiEditorMode.value === 'run') {
                startHmiTelemetryPolling();
              } else {
                stopHmiTelemetryPolling();
              }
            }
            if (hash === 'downlink') {
              fetchNetworkServers();
              fetchDevices();
              fetchDownlinkHistory();
              startDeviceQueuePolling();
              initHmiRealtimeStream();
            }
            if (hash === 'modbus-presets') {
              modbusPresetsModule.fetchPresets();
              setTimeout(() => {
                modbusPresetsModule.initPresetsTabulator();
              }, 150);
            }
          } else {
            activeTab.value = 'overview';
          }
        };

        onMounted(() => {
          initControlPanel();
          window.addEventListener('keydown', handleHmiKeydown);
        });

        window.addEventListener('pageshow', (event) => {
          initControlPanel();
        });

        return {
          ...modbusPresetsModule,
          ...testBuilderModule,
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
          addModuleToLayoutModal,
          isModuleInCurrentLayout,
          openAddModuleToLayoutModal,
          closeAddModuleToLayoutModal,
          addModuleToCurrentRoleLayout,
          removeModuleFromCurrentRoleLayout,
          toggleModuleSpan,
          moduleManagerSubTab,
          selectedLayoutRole,
          isEditingRoleLayout,
          savingRoleLayout,
          roleLayouts,
          currentRoleModuleList,
          draggedModuleIndex,
          dragOverModuleIndex,
          fetchRoleLayouts,
          computeRoleModules,
          onLayoutRoleChange,
          startEditRoleLayout,
          cancelEditRoleLayout,
          saveRoleLayoutOrder,
          onDragStart,
          onDragOver,
          onDrop,
          onDragEnd,
          moveModuleOrder,
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
          selectedSandboxDeviceEUI,
          selectedSandboxDevice,
          sandboxTelemetryList,
          sandboxActiveMetadata,
          sandboxDecodedObject,
          sandboxViewMode,
          loadingDeviceTelemetry,
          decodedFieldsList,
          matrixSensorColumns,
          matrixRows,
          filteredMatrixRows,
          sortedMatrixRows,
          sandboxTimeFilter,
          sandboxSearchQuery,
          sandboxSortKey,
          sandboxSortOrder,
          sandboxAutoSync,
          toggleSandboxSort,
          resetSandboxFilters,
          isSandboxFilterActive,
          toggleSandboxAutoSync,
          fetchSandboxTelemetry,
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
          onSelectSandboxDevice,
          loadHistoricalTelemetryPacket,
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
          formatLogTime,
          systemVersionInfo,
          loadingSystemVersion,
          restartingServer,
          restartConfirmDialog,
          serverLogsDialog,
          serverLogs,
          loadingServerLogs,
          restartProgress,
          formatUptime,
          copyCommitHash,
          fetchSystemVersion,
          openRestartConfirmDialog,
          openServerLogsDialog,
          confirmRestartServer,
          standaloneOpsUrl,
          hmiScreensList,
          selectedHmiScreenId,
          currentHmiScreen,
          savingHmiScreen,
          hmiEditorMode,
          selectedWidgetId,
          selectedWidget,
          selectedWidgetBinding,
          selectedWidgetAction,
          hmiZoom,
          hmiGridSize,
          canvasPreset,
          createHmiModal,
          newHmiScreenForm,
          hmiRbacModal,
          selectedScreenRoles,
          fetchHmiScreens,
          onSelectHmiScreen,
          saveCurrentHmiScreen,
          openCreateHmiScreenModal,
          submitCreateHmiScreen,
          cloneCurrentHmiScreen,
          togglePublishHmiScreen,
          deleteCurrentHmiScreen,
          openHmiRbacModal,
          saveHmiRbac,
          onCanvasPresetChange,
          addWidgetToCanvas,
          removeSelectedWidget,
          duplicateSelectedWidget,
          moveWidgetLayer,
          onWidgetMouseDown,
          onResizeMouseDown,
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
          getWidgetAlarmText,
          getWidgetAlarmClass,
          isWidgetSwitchOn,
          triggerWidgetToggleSwitch,
          triggerWidgetActionButton,
          getWidgetTrendPath,
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
          detectedTelemetryFields,
          loadingDetectedFields,
          hmiTagFilterQuery,
          filteredDetectedTelemetryFields,
          fetchDetectedFieldsForSelectedDevice,
          applyDetectedField,
          stretchWidgetWidth,
          stretchWidgetHeight,
          setWidgetPresetSize,
          setHmiEditorMode,
          handleHmiKeydown,
          getTagTooltip,
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
