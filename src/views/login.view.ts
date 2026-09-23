export const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Sign In - Daviteq LoRaWAN</title>
  <link rel="icon" type="image/png" href="/images/favicon.png" />
  <link rel="shortcut icon" href="/images/favicon.png" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      background: radial-gradient(circle at 50% 0%, #0c2d48 0%, #020617 75%);
      font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f8fafc;
      margin: 0;
      padding: 1rem;
    }
    [v-cloak] { display: none !important; }
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
  <div id="app" v-cloak class="w-full max-w-sm">
    <div class="glass-card rounded-2xl p-7 space-y-6">
      <!-- Logo Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 p-2 shadow-inner mb-1 overflow-hidden">
          <img src="/images/logo-login.png" onerror="this.onerror=null; this.src='/images/logo-full.png'; this.onerror=function(){this.src='/images/logo-navbar.png';};" class="w-full h-full object-contain rounded-xl" alt="Daviteq Logo" />
        </div>
        <h1 class="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
          <span class="text-sky-400">DAVITEQ</span> IoT
        </h1>
        <p class="text-xs text-slate-400 font-medium">LoRaWAN Platform</p>
      </div>

      <!-- Alert -->
      <div v-if="alert.show" :class="alert.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'" class="p-3 rounded-xl border text-xs font-medium flex items-center gap-2">
        <i :class="alert.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'"></i>
        <span>{{ alert.msg }}</span>
      </div>

      <!-- Minimal Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Username</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <i class="fa-solid fa-user text-xs"></i>
            </div>
            <input
              v-model="username"
              type="text"
              required
              placeholder="Username"
              autocomplete="username"
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
              placeholder="Password"
              autocomplete="current-password"
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

        <div class="flex items-center text-xs pt-1">
          <label class="flex items-center text-slate-400 cursor-pointer select-none">
            <input type="checkbox" v-model="rememberMe" class="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 mr-2" />
            Remember me
          </label>
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
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/vue@3.4.31/dist/vue.global.prod.js"></script>
  <script>
    const { createApp, ref } = Vue;

    createApp({
      setup() {
        const username = ref('');
        const password = ref('');
        const showPassword = ref(false);
        const rememberMe = ref(true);
        const loading = ref(false);
        const alert = ref({ show: false, type: 'info', msg: '' });

        const showAlert = (msg, type = 'info') => {
          alert.value = { show: true, type, msg };
        };

        const handleLogin = async () => {
          if (!username.value.trim() || !password.value) {
            showAlert("Please enter username and password", "error");
            return;
          }
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
            if (!res.ok) throw new Error(data.message || "Invalid username or password");

            if (data.access_token) {
              localStorage.setItem('lorawan_token', data.access_token);
              document.cookie = "access_token=" + encodeURIComponent(data.access_token) + "; Path=/; Max-Age=" + (30*24*3600) + "; SameSite=Lax";
            }
            if (data.user) localStorage.setItem('lorawan_user', JSON.stringify(data.user));

            showAlert("Login successful! Redirecting...", "success");
            setTimeout(() => {
              window.location.replace('/dashboard');
            }, 250);
          } catch(err) {
            showAlert(err.message, "error");
            loading.value = false;
          }
        };

        return {
          username,
          password,
          showPassword,
          rememberMe,
          loading,
          alert,
          handleLogin
        };
      }
    }).mount('#app');
  </script>
</body>
</html>
`;
