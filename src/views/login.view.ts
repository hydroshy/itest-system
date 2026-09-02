export const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Sign In - Daviteq LoRaWAN Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      background: radial-gradient(circle at 50% -20%, #0c4a6e 0%, #020617 70%);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f8fafc;
      margin: 0;
      padding: 1rem;
    }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glass-card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(56, 189, 248, 0.2);
      box-shadow: 0 0 50px -10px rgba(14, 165, 233, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .input-focus:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    }
  </style>
</head>
<body>
  <div id="app" class="w-full max-w-md">
    <div class="glass-card rounded-2xl p-8 space-y-6">
      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-2xl shadow-inner mb-1">
          <i class="fa-solid fa-tower-broadcast"></i>
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span class="text-sky-400">DAVITEQ</span> LoRaWAN
        </h1>
        <p class="text-xs text-slate-400 font-medium">Enterprise Network & Application Server</p>
      </div>

      <!-- Alert -->
      <div v-if="alert.show" :class="alert.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'" class="p-3 rounded-xl border text-xs font-medium flex items-center gap-2">
        <i :class="alert.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'"></i>
        <span>{{ alert.msg }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Username or Email</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <i class="fa-solid fa-user text-xs"></i>
            </div>
            <input
              v-model="username"
              type="text"
              required
              placeholder="admin or user@domain.com"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none input-focus transition"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Password</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <i class="fa-solid fa-lock text-xs"></i>
            </div>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="••••••••"
              class="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none input-focus transition"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-xs"></i>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs pt-1">
          <label class="flex items-center text-slate-400 cursor-pointer select-none">
            <input type="checkbox" v-model="rememberMe" class="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 mr-2" />
            Remember session
          </label>
          <a href="/api/docs" target="_blank" class="text-sky-400 hover:text-sky-300 transition flex items-center gap-1 font-semibold">
            <i class="fa-solid fa-book-open"></i> Swagger API
          </a>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 px-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 active:from-sky-600 active:to-cyan-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-sky-500/25 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span v-if="loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Signing in...</span>
          <span v-else class="flex items-center gap-2">Sign In <i class="fa-solid fa-arrow-right text-xs"></i></span>
        </button>
      </form>

      <!-- Footer -->
      <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <button @click="clearSession" type="button" class="text-slate-400 hover:text-red-400 transition cursor-pointer flex items-center gap-1 text-[11px]">
          <i class="fa-solid fa-trash-can"></i> Clear Session
        </button>
        <span class="inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          PostgreSQL &bull; NestJS
        </span>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/vue@3.4.31/dist/vue.global.prod.js"></script>
  <script>
    const { createApp, ref, onMounted } = Vue;

    createApp({
      setup() {
        const username = ref('admin');
        const password = ref('Dvt@123');
        const showPassword = ref(false);
        const rememberMe = ref(true);
        const loading = ref(false);
        const alert = ref({ show: false, type: 'info', msg: '' });

        const showAlert = (msg, type = 'info') => {
          alert.value = { show: true, type, msg };
        };

        const clearSession = () => {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch(e) {}
          const cookies = ["access_token", "lorawan_token", "session_id", "connect.sid"];
          cookies.forEach(c => {
            document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;";
            document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
          });
          showAlert("Session reset successfully. Please log in.", "success");
        };

        const handleLogin = async () => {
          loading.value = true;
          try {
            const res = await fetch('/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                usernameOrEmail: username.value.trim(),
                password: password.value
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Invalid credentials");

            if (data.access_token) localStorage.setItem('lorawan_token', data.access_token);
            if (data.user) localStorage.setItem('lorawan_user', JSON.stringify(data.user));

            showAlert("Login successful! Opening Control Panel...", "success");
            setTimeout(() => {
              window.location.replace('/control-panel');
            }, 250);
          } catch(err) {
            showAlert(err.message, "error");
            loading.value = false;
          }
        };

        onMounted(() => {
          const params = new URLSearchParams(window.location.search);
          if (params.get('cleared') === '1' || params.get('logout') === '1') {
            clearSession();
          }
        });

        return {
          username,
          password,
          showPassword,
          rememberMe,
          loading,
          alert,
          handleLogin,
          clearSession
        };
      }
    }).mount('#app');
  </script>
</body>
</html>
`;
