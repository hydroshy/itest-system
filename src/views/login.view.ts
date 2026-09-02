export const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Sign In - Daviteq LoRaWAN Platform</title>
  <!-- Material Design Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" />
  <!-- Vuetify 3 CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vuetify@3.6.14/dist/vuetify.min.css" />
  <style>
    body {
      background: radial-gradient(circle at 50% 10%, #0f172a 0%, #030712 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
    }
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .glow-card {
      box-shadow: 0 0 35px -5px rgba(14, 165, 233, 0.25) !important;
      border: 1px solid rgba(56, 189, 248, 0.2) !important;
    }
  </style>
</head>
<body>
  <div id="app">
    <v-app theme="dark" style="background: transparent;">
      <v-main class="login-container">
        <v-card width="100%" max-width="440" rounded="xl" color="#0f172a" class="pa-8 glow-card">
          <!-- Logo & Header -->
          <div class="text-center mb-6">
            <v-avatar color="primary" variant="tonal" size="56" class="mb-3">
              <v-icon icon="mdi-transmission-tower" size="32" color="cyan-lighten-2"></v-icon>
            </v-avatar>
            <h1 class="text-h5 font-weight-bold text-white mb-1">
              <span class="text-cyan-lighten-2">DAVITEQ</span> LoRaWAN
            </h1>
            <p class="text-caption text-medium-emphasis">Application & Network Server Platform</p>
          </div>

          <!-- Alert notification -->
          <v-alert
            v-if="alert.show"
            :type="alert.type"
            :text="alert.msg"
            variant="tonal"
            density="compact"
            class="mb-4"
            closable
            @click:close="alert.show = false"
          ></v-alert>

          <!-- Login Form -->
          <v-form @submit.prevent="handleLogin" v-model="formValid">
            <v-text-field
              v-model="username"
              label="Username or Email"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="comfortable"
              color="cyan-lighten-2"
              class="mb-3"
              required
              :disabled="loading"
            ></v-text-field>

            <v-text-field
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              label="Password"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              variant="outlined"
              density="comfortable"
              color="cyan-lighten-2"
              class="mb-2"
              required
              :disabled="loading"
            ></v-text-field>

            <div class="d-flex align-center justify-space-between mb-4">
              <v-checkbox
                v-model="rememberMe"
                label="Remember session"
                color="cyan-lighten-2"
                density="compact"
                hide-details
              ></v-checkbox>
              <a href="/api/docs" target="_blank" class="text-caption text-cyan-lighten-2 text-decoration-none font-weight-medium">
                <v-icon icon="mdi-book-open-outline" size="small" class="mr-1"></v-icon>Swagger API
              </a>
            </div>

            <v-btn
              type="submit"
              color="cyan-darken-1"
              size="large"
              block
              rounded="lg"
              class="font-weight-bold"
              :loading="loading"
            >
              Sign In <v-icon icon="mdi-arrow-right" end></v-icon>
            </v-btn>
          </v-form>

          <!-- Footer Actions -->
          <v-divider class="my-4"></v-divider>
          <div class="d-flex align-center justify-space-between text-caption text-medium-emphasis">
            <v-btn
              variant="text"
              size="small"
              color="error"
              density="compact"
              @click="clearSession"
            >
              <v-icon icon="mdi-trash-can-outline" start size="small"></v-icon>
              Clear Session
            </v-btn>
            <div class="d-flex align-center gap-1">
              <v-badge dot color="success" inline class="mr-1"></v-badge>
              <span>PostgreSQL &bull; NestJS</span>
            </div>
          </div>
        </v-card>
      </v-main>
    </v-app>
  </div>

  <!-- Vue 3 and Vuetify 3 Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/vue@3.4.31/dist/vue.global.prod.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/vuetify@3.6.14/dist/vuetify.min.js"></script>
  <script>
    const { createApp, ref, onMounted } = Vue;
    const { createVuetify } = Vuetify;

    const vuetify = createVuetify({
      theme: { defaultTheme: 'dark' }
    });

    const app = createApp({
      setup() {
        const username = ref('admin');
        const password = ref('Dvt@123');
        const showPassword = ref(false);
        const rememberMe = ref(true);
        const loading = ref(false);
        const formValid = ref(true);
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
          showAlert("Session cleared successfully. Please log in.", "success");
        };

        const handleLogin = async () => {
          if (!username.value || !password.value) {
            showAlert("Please enter username and password.", "error");
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
            if (!res.ok) {
              throw new Error(data.message || "Invalid username or password");
            }
            if (data.access_token) {
              localStorage.setItem('lorawan_token', data.access_token);
            }
            if (data.user) {
              localStorage.setItem('lorawan_user', JSON.stringify(data.user));
            }
            showAlert("Login successful! Redirecting to Control Panel...", "success");
            setTimeout(() => {
              window.location.replace('/control-panel');
            }, 300);
          } catch (err) {
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
          formValid,
          alert,
          handleLogin,
          clearSession
        };
      }
    });

    app.use(vuetify).mount('#app');
  </script>
</body>
</html>
`;
