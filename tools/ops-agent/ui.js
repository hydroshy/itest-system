/**
 * Standalone Ops Manager HTML Template
 * Serves on http://<host>:3099/ and http://<host>:3099/manager
 * 100% independent of NestJS - runs even when NestJS backend crashes.
 * Integrated Database Super-Admin Login System.
 */
const MANAGER_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daviteq Ops Manager | Super-Admin Console</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">
  
  <!-- Tailwind CSS with multiple fallbacks -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    if (window.tailwind) {
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              brand: { 50: '#f0f9ff', 500: '#0284c7', 600: '#0369a1', 700: '#075985', 900: '#0c4a6e' },
              slate: { 850: '#0f172a', 900: '#090d16', 950: '#030712' }
            },
            fontFamily: {
              mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace']
            }
          }
        }
      };
    }
  </script>

  <!-- FontAwesome Icons with fallbacks -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <!-- Vue 3 with multiple CDN failover mirrors -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.21/vue.global.prod.min.js"></script>
  <script>
    if (typeof Vue === 'undefined') {
      document.write('<script src="https://cdn.jsdelivr.net/npm/vue@3.4.21/dist/vue.global.prod.js"><\\/script>');
    }
  </script>
  <script>
    if (typeof Vue === 'undefined') {
      document.write('<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"><\\/script>');
    }
  </script>

  <style>
    /* Robust base styling ensuring no blank/black screen even before CSS/Vue hydration */
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background-color: #030712;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #030712; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }
    .log-line:hover { background-color: rgba(255, 255, 255, 0.03); }
    @keyframes pulse-slow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .animate-pulse-slow { animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-sky-500 selection:text-white">
  
  <div id="app" class="flex flex-col min-h-screen">
    
    <!-- ==================== VIEW 1: SUPER-ADMIN LOGIN ==================== -->
    <div v-if="!isAuthenticated" class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      
      <!-- Background glow & grid -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-md w-full relative z-10 space-y-6">
        
        <!-- Brand & Logo -->
        <div class="text-center space-y-2">
          <div class="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center shadow-2xl shadow-orange-500/30 text-white font-black text-2xl mb-1">
            ⚡
          </div>
          <h1 class="text-2xl font-black tracking-tight text-white">Daviteq Ops Manager</h1>
          <p class="text-xs text-slate-400 font-medium">Standalone System Lifecycle & Recovery Console</p>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider mt-1">
            <i class="fa-solid fa-shield-halved"></i> Super-Admin Access Only
          </div>
        </div>

        <!-- Login Card -->
        <div class="bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          <div v-if="loginError" class="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
            <i class="fa-solid fa-circle-exclamation text-red-400 mt-0.5 flex-shrink-0"></i>
            <span class="leading-relaxed">{{ loginError }}</span>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                <i class="fa-regular fa-user text-slate-400 mr-1"></i> Username
              </label>
              <input
                v-model="loginForm.username"
                type="text"
                required
                autocomplete="username"
                placeholder="Username"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-mono"
              >
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span><i class="fa-solid fa-lock text-slate-400 mr-1"></i> Password</span>
              </label>
              <div class="relative">
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  placeholder="Password"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-mono"
                >
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs"
                >
                  <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="loggingIn"
              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <i v-if="loggingIn" class="fa-solid fa-circle-notch animate-spin text-sm"></i>
              <i v-else class="fa-solid fa-right-to-bracket text-sm"></i>
              <span>{{ loggingIn ? 'Authenticating with Database...' : 'Sign In as Super Admin' }}</span>
            </button>
          </form>

          <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :class="dbConnected ? 'bg-emerald-400' : 'bg-amber-400'"></span>
              <span>DB Auth: {{ dbConnected ? 'Connected' : 'Ready' }}</span>
            </span>
            <a :href="backendAppUrl" target="_blank" class="text-sky-400 hover:text-sky-300 transition">
              Main App <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
        </div>

        <p class="text-center text-[11px] text-slate-600">
          Daviteq Ops Agent Microservice • Direct PostgreSQL Authentication
        </p>
      </div>
    </div>

    <!-- ==================== VIEW 2: AUTHENTICATED OPS DASHBOARD ==================== -->
    <div v-else class="flex flex-col min-h-screen">
      
      <!-- TOP NAVIGATION -->
      <header class="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-lg">
              ⚡
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-base tracking-tight text-white">Daviteq Ops Manager</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">Standalone v1.0</span>
                <span v-if="containerStatus === 'running'" class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Backend Online
                </span>
                <span v-else-if="containerStatus === 'restarting'" class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin"></span> Restarting...
                </span>
                <span v-else class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span> Backend Offline
                </span>
              </div>
              <div class="text-xs text-slate-400 flex items-center gap-2">
                <span>Isolated Microservice</span>
                <span>•</span>
                <span class="text-slate-500">Port 3099</span>
              </div>
            </div>
          </div>

          <!-- RIGHT TOOLBAR -->
          <div class="flex items-center gap-3">
            
            <!-- Polling interval switch -->
            <div class="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 text-xs">
              <span class="text-[11px] text-slate-400 px-2 flex items-center gap-1">
                <i class="fa-solid fa-rotate text-sky-400 text-[10px]" :class="{ 'animate-spin': refreshing }"></i> Poll:
              </span>
              <button @click="setRefreshInterval(0)" class="px-2 py-0.5 rounded text-[11px] font-medium transition" :class="refreshInterval === 0 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'">Off</button>
              <button @click="setRefreshInterval(3000)" class="px-2 py-0.5 rounded text-[11px] font-medium transition" :class="refreshInterval === 3000 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'">3s</button>
              <button @click="setRefreshInterval(5000)" class="px-2 py-0.5 rounded text-[11px] font-medium transition" :class="refreshInterval === 5000 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'">5s</button>
            </div>

            <!-- Current User Badge -->
            <div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
              <div class="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] border border-amber-500/40">
                <i class="fa-solid fa-user-shield"></i>
              </div>
              <div class="text-left">
                <span class="font-bold text-white block text-[11px] leading-tight">{{ currentUser.fullName || currentUser.username }}</span>
                <span class="text-[9px] text-amber-400 font-bold uppercase tracking-wider block">SUPER_ADMIN</span>
              </div>
            </div>

            <!-- Open App Link -->
            <a :href="backendAppUrl" target="_blank" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition flex items-center gap-1.5">
              <span class="hidden md:inline">Open App</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            </a>

            <!-- Logout Button -->
            <button @click="handleLogout" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 hover:text-red-300 border border-slate-700 text-xs font-semibold text-slate-300 transition flex items-center gap-1.5 cursor-pointer" title="Log Out">
              <i class="fa-solid fa-right-from-bracket"></i>
              <span class="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <!-- MAIN BODY CONTENT -->
      <main class="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">

        <!-- SYSTEM METRICS & STATUS GRID -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <!-- CARD 1: TARGET CONTAINER -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition">
            <div class="absolute -right-6 -bottom-6 text-slate-800/40 text-7xl font-mono pointer-events-none select-none">
              <i class="fa-brands fa-docker"></i>
            </div>
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i class="fa-brands fa-docker text-sky-400"></i> Target Container
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide"
                  :class="containerStatus === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : (containerStatus === 'restarting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30')">
                  {{ containerStatus }}
                </span>
              </div>
              <div class="text-lg font-mono font-bold text-white tracking-tight flex items-center gap-2">
                <span>{{ targetContainerName }}</span>
              </div>
              <div class="text-xs text-slate-400 mt-2 space-y-1 font-mono">
                <div class="flex justify-between">
                  <span class="text-slate-500">Docker Socket:</span>
                  <span :class="dockerAvailable ? 'text-emerald-400' : 'text-red-400'">{{ dockerAvailable ? 'Active Socket' : 'Unmounted' }}</span>
                </div>
                <div v-if="containerInfo && containerInfo.created" class="flex justify-between">
                  <span class="text-slate-500">Created:</span>
                  <span class="text-slate-300">{{ formatRelativeTime(containerInfo.created) }}</span>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
              <button @click="triggerRestart" :disabled="restarting" class="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                <i class="fa-solid fa-rotate" :class="{ 'animate-spin': restarting }"></i>
                <span>{{ restarting ? 'Restarting...' : 'Restart & Rebuild' }}</span>
              </button>
              <button v-if="containerStatus === 'running'" @click="triggerContainerAction('stop')" :disabled="restarting" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-red-900/50 hover:text-red-300 text-slate-400 font-semibold text-xs border border-slate-700 transition cursor-pointer" title="Stop Container">
                <i class="fa-solid fa-stop"></i>
              </button>
              <button v-else @click="triggerContainerAction('start')" :disabled="restarting" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-900/50 hover:text-emerald-300 text-slate-400 font-semibold text-xs border border-slate-700 transition cursor-pointer" title="Start Container">
                <i class="fa-solid fa-play"></i>
              </button>
            </div>
          </div>

          <!-- CARD 2: GIT LIFECYCLE & VERSION -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition">
            <div class="absolute -right-6 -bottom-6 text-slate-800/40 text-7xl font-mono pointer-events-none select-none">
              <i class="fa-solid fa-code-commit"></i>
            </div>
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i class="fa-solid fa-code-branch text-emerald-400"></i> Git Lifecycle
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  branch: {{ gitInfo.branch || 'main' }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs tracking-wider">
                  #{{ gitInfo.shortHash || 'HEAD' }}
                </span>
                <button @click="copyCommitHash" title="Copy Full Hash" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition cursor-pointer">
                  <i class="fa-regular fa-copy"></i>
                </button>
              </div>
              <div class="mt-2.5">
                <p class="text-xs text-slate-200 line-clamp-2 font-medium" :title="gitInfo.commitMessage">
                  {{ gitInfo.commitMessage || 'No commit message available' }}
                </p>
                <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                  <span><i class="fa-regular fa-user text-[10px]"></i> {{ gitInfo.author || 'Author' }}</span>
                  <span>•</span>
                  <span>{{ formatTime(gitInfo.commitDate) }}</span>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center font-mono">
              <span class="text-slate-500">Source: {{ gitInfo.source || 'repository' }}</span>
              <button @click="fetchStatus" class="text-sky-400 hover:text-sky-300 text-xs font-sans font-semibold cursor-pointer">
                <i class="fa-solid fa-arrows-rotate mr-1 text-[10px]"></i> Refresh Git
              </button>
            </div>
          </div>

          <!-- CARD 3: DATABASE & OPS METRICS -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition">
            <div class="absolute -right-6 -bottom-6 text-slate-800/40 text-7xl font-mono pointer-events-none select-none">
              <i class="fa-solid fa-server"></i>
            </div>
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i class="fa-solid fa-database text-amber-400"></i> Database & Metrics
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DB Ready
                </span>
              </div>
              <div class="grid grid-cols-2 gap-3 text-xs font-mono">
                <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span class="text-[10px] text-slate-500 uppercase block">Agent Uptime</span>
                  <span class="text-sm font-bold text-white">{{ formatUptime(systemMetrics.uptimeSeconds) }}</span>
                </div>
                <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span class="text-[10px] text-slate-500 uppercase block">Memory RSS</span>
                  <span class="text-sm font-bold text-sky-400">{{ formatMemory(systemMetrics.memoryUsage?.rss) }}</span>
                </div>
              </div>
              <div class="text-[11px] text-slate-400 mt-3 font-mono flex justify-between">
                <span class="text-slate-500">Auth Method:</span>
                <span class="text-emerald-400 font-bold">PostgreSQL DB RBAC</span>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center font-mono">
              <span class="text-slate-500">DB Host: {{ dbHost || 'PostgreSQL' }}</span>
              <span class="text-emerald-400 font-bold">ONLINE</span>
            </div>
          </div>
        </div>

        <!-- LIVE CONTAINER LOGS VIEWER CONSOLE -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          
          <!-- LOGS HEADER BAR -->
          <div class="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <span class="text-xs font-mono font-bold text-slate-200 ml-2 flex items-center gap-1.5">
                <i class="fa-solid fa-terminal text-sky-400"></i> Container Logs: <span class="text-amber-400">{{ targetContainerName }}</span>
              </span>
            </div>

            <!-- LOG CONTROLS -->
            <div class="flex items-center flex-wrap gap-2 text-xs">
              <!-- Search Bar -->
              <div class="relative">
                <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-500 text-[10px]"></i>
                <input v-model="logSearchQuery" type="text" placeholder="Filter logs..." class="bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 w-36 sm:w-48 font-mono">
              </div>

              <!-- Tail line selector -->
              <select v-model="logTail" @change="fetchLogs" class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-mono">
                <option :value="50">Tail 50</option>
                <option :value="100">Tail 100</option>
                <option :value="250">Tail 250</option>
                <option :value="500">Tail 500</option>
              </select>

              <!-- Auto-scroll switch -->
              <button @click="autoScroll = !autoScroll" class="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 font-mono cursor-pointer"
                :class="autoScroll ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'">
                <i class="fa-solid fa-angles-down text-[10px]"></i> Auto-scroll
              </button>

              <!-- Refresh logs button -->
              <button @click="fetchLogs" :disabled="loadingLogs" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition flex items-center gap-1 cursor-pointer">
                <i class="fa-solid fa-rotate text-[10px]" :class="{ 'animate-spin': loadingLogs }"></i>
                <span>Refresh</span>
              </button>

              <!-- Copy logs button -->
              <button @click="copyLogs" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition cursor-pointer" title="Copy Raw Logs">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>

          <!-- LOG CONSOLE BODY -->
          <div ref="logContainer" class="p-4 bg-slate-950 font-mono text-xs text-slate-300 h-[480px] overflow-y-auto space-y-1 select-text leading-relaxed">
            <div v-if="loadingLogs && !filteredLogs.length" class="text-slate-500 flex items-center justify-center h-full gap-2">
              <i class="fa-solid fa-circle-notch animate-spin text-sky-400"></i> Loading container logs...
            </div>
            <div v-else-if="!filteredLogs.length" class="text-slate-600 italic p-4 text-center">
              No log entries match your filter or container has no output yet.
            </div>
            <div v-for="(line, idx) in filteredLogs" :key="idx" class="log-line px-2 py-0.5 rounded flex items-start gap-3">
              <span class="text-slate-600 select-none text-[10px] w-8 text-right flex-shrink-0">{{ idx + 1 }}</span>
              <span class="break-all whitespace-pre-wrap flex-1" :class="getLogLineClass(line)">{{ line }}</span>
            </div>
          </div>

          <!-- LOGS FOOTER -->
          <div class="px-5 py-2.5 bg-slate-900/60 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between items-center font-mono">
            <span>Showing {{ filteredLogs.length }} lines (Tail: {{ logTail }})</span>
            <span>Target: {{ targetContainerName }} | Updated: {{ lastLogFetchTime }}</span>
          </div>
        </div>
      </main>

      <!-- RESTART CONFIRMATION MODAL -->
      <div v-if="showRestartConfirm" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-orange-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-lg flex-shrink-0">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Restart Backend Container?</h3>
              <p class="text-xs text-slate-400">Trigger <code class="text-orange-300">docker restart {{ targetContainerName }}</code></p>
            </div>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
            Container restart triggers <code class="text-orange-300">docker restart</code> on the existing container instance. Note that restarting does not pull Git or rebuild the image. To deploy the latest Git commits, run <code class="text-sky-300">./update.sh</code> (or <code class="text-sky-300">git pull && docker compose up -d --build app</code>).
          </p>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button @click="showRestartConfirm = false" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer">Cancel</button>
            <button @click="confirmRestart" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/20 flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-rotate"></i> Confirm Restart
            </button>
          </div>
        </div>
      </div>

      <!-- RESTART FLOATING PROGRESS MODAL -->
      <div v-if="restarting" class="fixed bottom-6 right-6 z-50 bg-slate-900 border border-sky-500/40 rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm w-full">
        <div class="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 text-base">
          <i class="fa-solid fa-circle-notch animate-spin"></i>
        </div>
        <div class="flex-1">
          <div class="text-xs font-bold text-white">Restarting NestJS Container...</div>
          <div class="text-[11px] text-slate-400">Polling health check (Attempt {{ restartAttempt }}s)...</div>
        </div>
      </div>

      <!-- TOAST NOTIFICATIONS -->
      <div v-if="toast.show" class="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold"
        :class="toast.type === 'error' ? 'bg-red-950 border border-red-500 text-red-200' : (toast.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-200' : 'bg-sky-950 border border-sky-500 text-sky-200')">
        <i :class="toast.type === 'error' ? 'fa-solid fa-circle-exclamation text-red-400' : (toast.type === 'success' ? 'fa-solid fa-circle-check text-emerald-400' : 'fa-solid fa-circle-info text-sky-400')"></i>
        <span>{{ toast.message }}</span>
      </div>

    </div>

  </div>

  <script>
    (function() {
      // Fallback check if Vue exists
      if (typeof Vue === 'undefined') {
        console.error('Vue 3 library failed to load from CDNs. Please check internet connection.');
        document.body.innerHTML = '<div style="padding: 40px; text-align: center; color: #f87171; font-family: sans-serif;"><h2>Ops Manager Initialization Error</h2><p>Vue 3 runtime could not be loaded from CDN mirrors. Please ensure server has network access or refresh the page.</p></div>';
        return;
      }

      const { createApp, ref, computed, onMounted, onUnmounted, nextTick } = Vue;

      const app = createApp({
        setup() {
          const isAuthenticated = ref(false);
          const currentUser = ref({});
          const dbConnected = ref(true);
          const dbHost = ref('');
          
          const loginForm = ref({ username: '', password: '' });
          const loggingIn = ref(false);
          const loginError = ref('');
          const showPassword = ref(false);

          const targetContainerName = ref('nestjs_api');
          const containerStatus = ref('running');
          const dockerAvailable = ref(true);
          const containerInfo = ref({});
          const gitInfo = ref({ commitHash: '', shortHash: '', branch: 'main', commitMessage: '', author: '', commitDate: '', source: '' });
          const systemMetrics = ref({ uptimeSeconds: 0, memoryUsage: {}, nodeVersion: '', platform: '' });
          
          const logsRaw = ref('');
          const logTail = ref(100);
          const logSearchQuery = ref('');
          const autoScroll = ref(true);
          const loadingLogs = ref(false);
          const logContainer = ref(null);
          const lastLogFetchTime = ref('Never');
          
          const refreshing = ref(false);
          const refreshInterval = ref(3000);
          let pollTimer = null;

          const showRestartConfirm = ref(false);
          const sessionToken = ref(localStorage.getItem('ops_session_token') || '');

          const restarting = ref(false);
          const restartAttempt = ref(0);

          const toast = ref({ show: false, message: '', type: 'info' });
          const showToast = (message, type = 'info') => {
            toast.value = { show: true, message, type };
            setTimeout(() => { toast.value.show = false; }, 4000);
          };

          const backendAppUrl = computed(() => {
            return 'http://' + window.location.hostname + ':3000';
          });

          const filteredLogs = computed(() => {
            if (!logsRaw.value) return [];
            const lines = logsRaw.value.split('\\n').filter(l => l.trim().length > 0);
            if (!logSearchQuery.value.trim()) return lines;
            const q = logSearchQuery.value.toLowerCase();
            return lines.filter(l => l.toLowerCase().includes(q));
          });

          const getLogLineClass = (line) => {
            const l = line.toLowerCase();
            if (l.includes('error') || l.includes('fail') || l.includes('fatal') || l.includes('exception')) return 'text-red-400 font-bold';
            if (l.includes('warn')) return 'text-amber-300';
            if (l.includes('nest') || l.includes('bootstrap') || l.includes('online') || l.includes('ready') || l.includes('success')) return 'text-emerald-300';
            if (l.includes('>>>') || l.includes('clone') || l.includes('pull') || l.includes('build')) return 'text-sky-300';
            return 'text-slate-300';
          };

          const authHeaders = () => {
            const headers = { 'Content-Type': 'application/json' };
            if (sessionToken.value) {
              headers['Authorization'] = 'Bearer ' + sessionToken.value;
            }
            return headers;
          };

          const checkAuth = async () => {
            if (!sessionToken.value) {
              isAuthenticated.value = false;
              return false;
            }
            try {
              const res = await fetch('/api/auth/me?_t=' + Date.now(), {
                headers: authHeaders()
              });
              if (res.ok) {
                const data = await res.json();
                if (data && data.success && data.user) {
                  currentUser.value = data.user;
                  isAuthenticated.value = true;
                  dbConnected.value = true;
                  dbHost.value = data.dbHost || '';
                  fetchStatus();
                  fetchLogs();
                  setRefreshInterval(refreshInterval.value);
                  return true;
                }
              }
            } catch(e) {}
            sessionToken.value = '';
            localStorage.removeItem('ops_session_token');
            isAuthenticated.value = false;
            return false;
          };

          const handleLogin = async () => {
            loggingIn.value = true;
            loginError.value = '';
            try {
              const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  username: loginForm.value.username,
                  password: loginForm.value.password
                })
              });
              const data = await res.json();
              if (res.ok && data.success) {
                sessionToken.value = data.token;
                localStorage.setItem('ops_session_token', data.token);
                currentUser.value = data.user;
                isAuthenticated.value = true;
                showToast('Super Admin authenticated successfully!', 'success');
                loginForm.value.password = '';
                fetchStatus();
                fetchLogs();
                setRefreshInterval(refreshInterval.value);
              } else {
                loginError.value = data.error || data.message || 'Authentication failed. Please verify Super-Admin credentials.';
              }
            } catch(e) {
              loginError.value = 'Network or server error during login: ' + e.message;
            } finally {
              loggingIn.value = false;
            }
          };

          const handleLogout = () => {
            sessionToken.value = '';
            localStorage.removeItem('ops_session_token');
            isAuthenticated.value = false;
            currentUser.value = {};
            if (pollTimer) clearInterval(pollTimer);
            showToast('Logged out of Ops Manager', 'info');
          };

          const fetchStatus = async () => {
            if (!isAuthenticated.value) return;
            refreshing.value = true;
            try {
              const res = await fetch('/api/status?_t=' + Date.now(), {
                headers: authHeaders()
              });
              if (res.status === 401 || res.status === 403) {
                handleLogout();
                return;
              }
              if (res.ok) {
                const data = await res.json();
                if (data && data.success) {
                  targetContainerName.value = data.targetContainer || targetContainerName.value;
                  gitInfo.value = data.git || gitInfo.value;
                  containerInfo.value = data.container || {};
                  containerStatus.value = data.container?.status || 'running';
                  dockerAvailable.value = data.container?.dockerAvailable ?? true;
                  systemMetrics.value = data.system || systemMetrics.value;
                  dbHost.value = data.dbHost || dbHost.value;
                }
              }
            } catch(e) {
              console.warn('Ops Agent fetchStatus error:', e);
            } finally {
              refreshing.value = false;
            }
          };

          const fetchLogs = async () => {
            if (!isAuthenticated.value) return;
            loadingLogs.value = true;
            try {
              const res = await fetch('/api/logs?tail=' + logTail.value + '&_t=' + Date.now(), {
                headers: authHeaders()
              });
              if (res.ok) {
                const data = await res.json();
                logsRaw.value = data.logs || 'No log output returned from container.';
                lastLogFetchTime.value = new Date().toLocaleTimeString();
                if (autoScroll.value) {
                  nextTick(() => {
                    if (logContainer.value) {
                      logContainer.value.scrollTop = logContainer.value.scrollHeight;
                    }
                  });
                }
              }
            } catch(e) {
              logsRaw.value = 'Failed to fetch logs: ' + e.message;
            } finally {
              loadingLogs.value = false;
            }
          };

          const setRefreshInterval = (ms) => {
            refreshInterval.value = ms;
            if (pollTimer) clearInterval(pollTimer);
            if (ms > 0 && isAuthenticated.value) {
              pollTimer = setInterval(() => {
                fetchStatus();
                fetchLogs();
              }, ms);
            }
          };

          const triggerRestart = () => {
            showRestartConfirm.value = true;
          };

          const confirmRestart = async () => {
            showRestartConfirm.value = false;
            restarting.value = true;
            restartAttempt.value = 1;

            try {
              const res = await fetch('/api/restart-backend', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ container: targetContainerName.value })
              });
              const data = await res.json();
              if (data.success) {
                showToast('Restart signal sent to ' + targetContainerName.value, 'success');
                containerStatus.value = 'restarting';
                
                let attempts = 0;
                const checkTimer = setInterval(async () => {
                  attempts++;
                  restartAttempt.value = attempts * 2;
                  fetchLogs();
                  fetchStatus();

                  try {
                    const check = await fetch(backendAppUrl.value + '/health?_t=' + Date.now());
                    if (check.ok) {
                      clearInterval(checkTimer);
                      restarting.value = false;
                      containerStatus.value = 'running';
                      showToast('Backend is back ONLINE and ready!', 'success');
                    }
                  } catch(e) {}

                  if (attempts > 30) {
                    clearInterval(checkTimer);
                    restarting.value = false;
                    showToast('Restart sequence finished. Check logs above.', 'info');
                  }
                }, 2000);
              } else {
                showToast(data.error || data.message || 'Restart failed', 'error');
                restarting.value = false;
              }
            } catch(e) {
              showToast('Error sending restart: ' + e.message, 'error');
              restarting.value = false;
            }
          };

          const triggerContainerAction = async (action) => {
            try {
              const res = await fetch('/api/container-action', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ container: targetContainerName.value, action })
              });
              const data = await res.json();
              if (data.success) {
                showToast('Container ' + action + ' command executed successfully', 'success');
                fetchStatus();
                fetchLogs();
              } else {
                showToast(data.error || 'Action failed', 'error');
              }
            } catch(e) {
              showToast('Action failed: ' + e.message, 'error');
            }
          };

          const copyCommitHash = () => {
            if (gitInfo.value.commitHash && navigator.clipboard) {
              navigator.clipboard.writeText(gitInfo.value.commitHash);
              showToast('Git commit hash copied to clipboard!', 'success');
            }
          };

          const copyLogs = () => {
            if (logsRaw.value && navigator.clipboard) {
              navigator.clipboard.writeText(logsRaw.value);
              showToast('Container logs copied to clipboard!', 'success');
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

          const formatMemory = (bytes) => {
            if (!bytes) return '0 MB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
          };

          const formatTime = (iso) => {
            if (!iso) return '';
            try { return new Date(iso).toLocaleString(); } catch(e) { return iso; }
          };

          const formatRelativeTime = (iso) => {
            if (!iso) return '';
            try {
              const diff = Date.now() - new Date(iso).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 60) return mins + ' mins ago';
              const hrs = Math.floor(mins / 60);
              return hrs + ' hours ago';
            } catch(e) { return iso; }
          };

          onMounted(async () => {
            await checkAuth();
          });

          onUnmounted(() => {
            if (pollTimer) clearInterval(pollTimer);
          });

          return {
            isAuthenticated,
            currentUser,
            dbConnected,
            dbHost,
            loginForm,
            loggingIn,
            loginError,
            showPassword,
            targetContainerName,
            containerStatus,
            dockerAvailable,
            containerInfo,
            gitInfo,
            systemMetrics,
            logsRaw,
            logTail,
            logSearchQuery,
            autoScroll,
            loadingLogs,
            logContainer,
            lastLogFetchTime,
            refreshing,
            refreshInterval,
            showRestartConfirm,
            restarting,
            restartAttempt,
            toast,
            backendAppUrl,
            filteredLogs,
            getLogLineClass,
            handleLogin,
            handleLogout,
            fetchStatus,
            fetchLogs,
            setRefreshInterval,
            triggerRestart,
            confirmRestart,
            triggerContainerAction,
            copyCommitHash,
            copyLogs,
            formatUptime,
            formatMemory,
            formatTime,
            formatRelativeTime
          };
        }
      });

      app.mount('#app');
    })();
  </script>
</body>
</html>`;

module.exports = { MANAGER_HTML };
