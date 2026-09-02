export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Dashboard - Daviteq LoRaWAN</title>
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
      transition: all 0.2s ease;
    }
    .glass-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 12px 30px -10px rgba(14, 165, 233, 0.15);
    }
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
  <div id="app" class="flex-1 flex flex-col" @click="handleGlobalClick">
    
    <!-- TOP APP BAR -->
    <header class="glass-header sticky top-0 z-40 px-4 sm:px-8 h-14 flex items-center justify-between">
      <!-- Left Logo & Menu (Click to return to Dashboard) -->
      <div class="flex items-center gap-3">
        <button
          @click="returnToHome"
          title="Return to Dashboard Home"
          class="flex items-center gap-2.5 text-white font-extrabold text-sm tracking-tight text-decoration-none hover:opacity-90 transition cursor-pointer"
        >
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm shadow-inner">
            <i class="fa-solid fa-tower-broadcast"></i>
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

      <!-- Right User Menu Dropdown -->
      <div class="relative">
        <button
          @click.stop="userMenuOpen = !userMenuOpen"
          class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer select-none"
        >
          <div class="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs">
            {{ userInitials }}
          </div>
          <span class="text-xs font-bold text-slate-200">{{ currentUser.fullName || currentUser.username || 'User' }}</span>
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

          <!-- App Version -->
          <div class="space-y-1 text-xs text-slate-400 pb-3 border-b border-slate-800">
            <div class="flex items-center justify-between text-[11px]">
              <span>Platform:</span>
              <strong class="text-slate-200">Daviteq LoRaWAN</strong>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span>System Version:</span>
              <strong class="text-emerald-400 font-mono">v1.0.0 (NestJS)</strong>
            </div>
          </div>

          <!-- Admin Control Panel Link (if admin) -->
          <div v-if="isSuperAdmin" class="pt-0.5">
            <a
              href="/control-panel"
              class="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition flex items-center justify-between cursor-pointer text-decoration-none"
            >
              <span class="flex items-center gap-2"><i class="fa-solid fa-sliders text-sky-400"></i> Control Panel</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-500"></i>
            </a>
          </div>

          <!-- Logout Button -->
          <button
            @click="handleLogout"
            class="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </div>
    </header>

    <!-- MAIN BODY CONTAINER -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
      
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
            <h2 class="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Operational Feature Modules</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">{{ accessibleFeatures.length }}</span>
          </div>
          <span class="text-xs text-slate-500 font-medium">Click any card to launch module</span>
        </div>

        <!-- Grid of Action Feature Buttons / Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="feature in accessibleFeatures"
            :key="feature.id"
            @click="openFeature(feature)"
            class="glass-card rounded-2xl p-5 space-y-3 cursor-pointer group flex flex-col justify-between"
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
          <h3 class="text-sm font-bold text-white">No Assigned Feature Modules</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Your account currently has no feature modules assigned. Please contact your Super Administrator to configure role permissions.
          </p>
        </div>
      </div>

      <!-- MODE 2: ACTIVE FEATURE MODULE VIEW -->
      <div v-else class="space-y-4">
        <!-- Feature Header Banner -->
        <div class="glass-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <button
              @click="returnToHome"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
            </button>
            <div>
              <h2 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <i :class="activeFeature.icon" class="text-sky-400"></i> {{ activeFeature.title }}
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">{{ activeFeature.description }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Module: {{ activeFeature.code }}
            </span>
          </div>
        </div>

        <!-- Feature Content Container (Ready for independent source modular development) -->
        <div class="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          
          <!-- Sample Module Preview Content based on active feature -->
          <div v-if="activeFeature.id === 'telemetry-monitor'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Ingestion Packets</h3>
              <button @click="fetchLiveTelemetry" class="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer">
                <i class="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
            </div>
            <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3">Time</th>
                    <th class="py-2.5 px-3">DevEUI</th>
                    <th class="py-2.5 px-3">Port / FCnt</th>
                    <th class="py-2.5 px-3">Raw Payload</th>
                    <th class="py-2.5 px-3">Decoded JSON</th>
                    <th class="py-2.5 px-3">Signal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-if="telemetryList.length === 0">
                    <td colspan="6" class="py-6 text-center text-slate-500 font-sans">No incoming telemetry packets yet. Send a LoRaWAN webhook to see real-time data.</td>
                  </tr>
                  <tr v-for="t in telemetryList" :key="t.id" class="hover:bg-slate-800/30">
                    <td class="py-2 px-3 text-slate-400">{{ formatTime(t.timestamp || t.createdAt) }}</td>
                    <td class="py-2 px-3 font-bold text-sky-400">{{ t.devEUI }}</td>
                    <td class="py-2 px-3 text-amber-400">p:{{ t.fPort || 1 }} / c:{{ t.fCnt || 0 }}</td>
                    <td class="py-2 px-3 text-slate-300 truncate max-w-xs">{{ t.payloadHex || '--' }}</td>
                    <td class="py-2 px-3 text-emerald-400 truncate max-w-sm">{{ JSON.stringify(t.decodedPayload) }}</td>
                    <td class="py-2 px-3 text-slate-400">{{ t.rssi !== undefined ? t.rssi + ' dBm' : '--' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="activeFeature.id === 'device-fleet'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Registered LoRaWAN End-Devices</h3>
              <button @click="fetchDevices" class="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer">
                <i class="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
            </div>
            <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-lg">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3">DevEUI</th>
                    <th class="py-2.5 px-3">Device Name</th>
                    <th class="py-2.5 px-3">Activation</th>
                    <th class="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-if="devicesList.length === 0">
                    <td colspan="4" class="py-6 text-center text-slate-500">No devices registered.</td>
                  </tr>
                  <tr v-for="d in devicesList" :key="d.id || d.devEUI" class="hover:bg-slate-800/30">
                    <td class="py-2.5 px-3 font-mono font-bold text-sky-400">{{ d.devEUI }}</td>
                    <td class="py-2.5 px-3 font-bold text-white">{{ d.name }}</td>
                    <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[10px]">{{ d.activationType || 'OTAA' }}</span></td>
                    <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="d.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'">{{ d.isActive ? 'ACTIVE' : 'INACTIVE' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- General Module Template for independent module source extension -->
          <div v-else class="text-center py-10 space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 text-2xl mx-auto shadow-inner">
              <i :class="activeFeature.icon"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-white">{{ activeFeature.title }} Module</h3>
              <p class="text-xs text-slate-400 max-w-md mx-auto">
                {{ activeFeature.description }}
              </p>
            </div>
            <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl max-w-md mx-auto text-left font-mono text-xs space-y-1">
              <div class="text-slate-500">// Module Source Directory:</div>
              <div class="text-sky-400">src/features/{{ activeFeature.id }}/</div>
              <div class="text-emerald-400">// Status: Ready for business logic development</div>
            </div>
          </div>

        </div>
      </div>

    </main>

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

        const userInitials = computed(() => {
          const name = currentUser.value.fullName || currentUser.value.username || 'U';
          return name.slice(0, 2).toUpperCase();
        });

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
          if (feature.id === 'telemetry-monitor') fetchLiveTelemetry();
          if (feature.id === 'device-fleet') fetchDevices();
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
          try {
            const res = await fetch('/auth/session', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              currentUser.value = await res.json();
            }
          } catch(e) {}
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
                if (found) activeFeature.value = found;
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

        const formatTime = (ts) => {
          if (!ts) return '--';
          return new Date(ts).toLocaleTimeString();
        };

        onMounted(async () => {
          await fetchSession();
          await fetchFeatures();
        });

        return {
          currentUser,
          accessibleFeatures,
          activeFeature,
          userMenuOpen,
          userInitials,
          isSuperAdmin,
          telemetryList,
          devicesList,
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
