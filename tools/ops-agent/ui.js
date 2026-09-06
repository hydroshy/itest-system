/**
 * Standalone Ops Manager HTML Template
 * Serves on http://<host>:3099/ and http://<host>:3099/manager
 * 100% independent of NestJS - runs even when NestJS backend crashes.
 */
const MANAGER_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daviteq Ops Manager | Independent System Console</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
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
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
  <style>
    [v-cloak] { display: none !important; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #030712; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }
    .log-line:hover { background-color: rgba(255, 255, 255, 0.03); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-sky-500 selection:text-white">
  <div id="app" v-cloak class="flex flex-col min-h-screen">
    
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
              <span>Isolated Management Microservice</span>
              <span>•</span>
              <span class="text-slate-500">Port 3099</span>
            </div>
          </div>
        </div>

        <!-- RIGHT TOOLBAR -->
        <div class="flex items-center gap-3">
          <div class="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 text-xs">
            <span class="text-[11px] text-slate-400 px-2 flex items-center gap-1">
              <i class="fa-solid fa-rotate text-sky-400 text-[10px]" :class="{ 'animate-spin': refreshing }"></i> Poll:
            </span>
            <button @click="setRefreshInterval(0)" class="px-2 py-0.5 rounded text-[11px] font-medium transition" :class="refreshInterval === 0 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'">Off</button>
            <button @click="setRefreshInterval(3000)" class="px-2 py-0.5 rounded text-[11px] font-medium transition" :class="refreshInterval === 3000 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'">3s</button>
            <button @click="setRefreshInterval(5000)" class="px-2 py-0.5 rounded text-[11px] font-medium transition" :class="refreshInterval === 5000 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'">5s</button>
          </div>

          <button @click="openTokenModal" title="Security Token Settings" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition flex items-center gap-1.5">
            <i class="fa-solid fa-key text-amber-400"></i>
            <span class="hidden sm:inline">Token Auth</span>
          </button>

          <a :href="backendAppUrl" target="_blank" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition flex items-center gap-1.5">
            <span>Open App</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </a>
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
                <span class="text-slate-500">Docker API:</span>
                <span :class="dockerAvailable ? 'text-emerald-400' : 'text-red-400'">{{ dockerAvailable ? 'Active Socket' : 'Unmounted' }}</span>
              </div>
              <div v-if="containerInfo && containerInfo.created" class="flex justify-between">
                <span class="text-slate-500">Created:</span>
                <span class="text-slate-300">{{ formatRelativeTime(containerInfo.created) }}</span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
            <button @click="triggerRestart" :disabled="restarting" class="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50">
              <i class="fa-solid fa-rotate" :class="{ 'animate-spin': restarting }"></i>
              <span>{{ restarting ? 'Restarting...' : 'Restart & Rebuild' }}</span>
            </button>
            <button v-if="containerStatus === 'running'" @click="triggerContainerAction('stop')" :disabled="restarting" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-red-900/50 hover:text-red-300 text-slate-400 font-semibold text-xs border border-slate-700 transition" title="Stop Container">
              <i class="fa-solid fa-stop"></i>
            </button>
            <button v-else @click="triggerContainerAction('start')" :disabled="restarting" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-900/50 hover:text-emerald-300 text-slate-400 font-semibold text-xs border border-slate-700 transition" title="Start Container">
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
              <button @click="copyCommitHash" title="Copy Full Hash" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition">
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
            <button @click="fetchStatus" class="text-sky-400 hover:text-sky-300 text-xs font-sans font-semibold">
              <i class="fa-solid fa-arrows-rotate mr-1 text-[10px]"></i> Refresh Git
            </button>
          </div>
        </div>

        <!-- CARD 3: OPS AGENT METRICS -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition">
          <div class="absolute -right-6 -bottom-6 text-slate-800/40 text-7xl font-mono pointer-events-none select-none">
            <i class="fa-solid fa-server"></i>
          </div>
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <i class="fa-solid fa-microchip text-amber-400"></i> Microservice Metrics
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Pure Node.js
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
              <span class="text-slate-500">Node / Platform:</span>
              <span class="text-slate-300">{{ systemMetrics.nodeVersion }} ({{ systemMetrics.platform }})</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center font-mono">
            <span class="text-slate-500">Socket: /var/run/docker.sock</span>
            <span class="text-emerald-400 font-bold">READY</span>
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
              <i class="fa-solid fa-terminal text-sky-400"></i> Container Output Logs: <span class="text-amber-400">{{ targetContainerName }}</span>
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
            <button @click="autoScroll = !autoScroll" class="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 font-mono"
              :class="autoScroll ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'">
              <i class="fa-solid fa-angles-down text-[10px]"></i> Auto-scroll
            </button>

            <!-- Refresh logs button -->
            <button @click="fetchLogs" :disabled="loadingLogs" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition flex items-center gap-1">
              <i class="fa-solid fa-rotate text-[10px]" :class="{ 'animate-spin': loadingLogs }"></i>
              <span>Refresh</span>
            </button>

            <!-- Copy logs button -->
            <button @click="copyLogs" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition" title="Copy Raw Logs">
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

    <!-- TOKEN CONFIG MODAL -->
    <div v-if="showTokenModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-amber-400"></i> Ops Security Authentication
          </h3>
          <button @click="showTokenModal = false" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-xs text-slate-400">
          Specify the <code class="text-amber-300">OPS_SECRET_TOKEN</code> required to execute privileged Docker container actions (Restart, Stop, Start).
        </p>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">X-Ops-Token / Passcode</label>
          <input v-model="tempToken" type="password" placeholder="daviteq_ops_secret_token_2026" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono">
        </div>
        <div class="flex items-center justify-end gap-2 pt-2">
          <button @click="showTokenModal = false" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300">Cancel</button>
          <button @click="saveToken" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/20">Save Token</button>
        </div>
      </div>
    </div>

    <!-- RESTART CONFIRMATION MODAL -->
    <div v-if="showRestartConfirm" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-orange-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-lg flex-shrink-0">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Restart Backend Container?</h3>
            <p class="text-xs text-slate-400">This will trigger <code class="text-orange-300">docker restart {{ targetContainerName }}</code></p>
          </div>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
          In your Dockge entrypoint, container restart will automatically pull the newest Git commit (<code class="text-sky-300">git fetch && git reset --hard</code>), rebuild dependencies, and restart the NestJS server.
        </p>
        <div class="flex items-center justify-end gap-2 pt-2">
          <button @click="showRestartConfirm = false" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300">Cancel</button>
          <button @click="confirmRestart" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/20 flex items-center gap-1.5">
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

  <script>
    const { createApp, ref, computed, onMounted, onUnmounted, nextTick } = Vue;

    createApp({
      setup() {
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

        const showTokenModal = ref(false);
        const showRestartConfirm = ref(false);
        const opsToken = ref(localStorage.getItem('daviteq_ops_token') || 'daviteq_ops_secret_token_2026');
        const tempToken = ref(opsToken.value);

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
          const lines = logsRaw.value.split('\n').filter(l => l.trim().length > 0);
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
          return {
            'Content-Type': 'application/json',
            'X-Ops-Token': opsToken.value
          };
        };

        const fetchStatus = async () => {
          refreshing.value = true;
          try {
            const res = await fetch('/api/status?_t=' + Date.now());
            if (res.ok) {
              const data = await res.json();
              if (data && data.success) {
                targetContainerName.value = data.targetContainer || targetContainerName.value;
                gitInfo.value = data.git || gitInfo.value;
                containerInfo.value = data.container || {};
                containerStatus.value = data.container?.status || 'running';
                dockerAvailable.value = data.container?.dockerAvailable ?? true;
                systemMetrics.value = data.system || systemMetrics.value;
              }
            }
          } catch(e) {
            console.warn('Ops Agent fetchStatus error:', e);
          } finally {
            refreshing.value = false;
          }
        };

        const fetchLogs = async () => {
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
          if (ms > 0) {
            pollTimer = setInterval(() => {
              fetchStatus();
              fetchLogs();
            }, ms);
          }
        };

        const openTokenModal = () => {
          tempToken.value = opsToken.value;
          showTokenModal.value = true;
        };

        const saveToken = () => {
          opsToken.value = tempToken.value;
          localStorage.setItem('daviteq_ops_token', tempToken.value);
          showTokenModal.value = false;
          showToast('Security token saved successfully!', 'success');
          fetchLogs();
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

        onMounted(() => {
          fetchStatus();
          fetchLogs();
          setRefreshInterval(refreshInterval.value);
        });

        onUnmounted(() => {
          if (pollTimer) clearInterval(pollTimer);
        });

        return {
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
          showTokenModal,
          showRestartConfirm,
          opsToken,
          tempToken,
          restarting,
          restartAttempt,
          toast,
          backendAppUrl,
          filteredLogs,
          getLogLineClass,
          fetchStatus,
          fetchLogs,
          setRefreshInterval,
          openTokenModal,
          saveToken,
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
    }).mount('#app');
  </script>
</body>
</html>`;

module.exports = { MANAGER_HTML };
