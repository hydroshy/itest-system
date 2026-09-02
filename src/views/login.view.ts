export const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign In - Daviteq LoRaWAN Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    body {
      background: radial-gradient(circle at 50% 10%, #0f172a 0%, #030712 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: #f1f5f9;
    }
    .glow-card {
      box-shadow: 0 0 35px -5px rgba(56, 189, 248, 0.15);
    }
  </style>
</head>
<body>
  <div class="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl glow-card">
    <!-- Header -->
    <div class="text-center mb-6">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-2xl mb-3 shadow-inner">
        <i class="fa-solid fa-tower-broadcast"></i>
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
        <span class="text-sky-400">DAVITEQ</span> LoRaWAN
      </h1>
      <p class="text-xs text-slate-400 mt-1 font-medium tracking-wide">Network & Application Server Platform</p>
    </div>

    <!-- Alert Box -->
    <div id="alertBox" class="hidden mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2"></div>

    <!-- Login Form -->
    <form id="loginForm" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Username or Email</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <i class="fa-solid fa-user text-sm"></i>
          </div>
          <input
            type="text"
            id="usernameInput"
            required
            value="admin"
            placeholder="admin or user@domain.com"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <i class="fa-solid fa-lock text-sm"></i>
          </div>
          <input
            type="password"
            id="passwordInput"
            required
            value="Dvt@123"
            placeholder="••••••••"
            class="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
          />
          <button
            type="button"
            onclick="togglePasswordVisibility()"
            class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
          >
            <i id="eyeIcon" class="fa-solid fa-eye text-sm"></i>
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs pt-1">
        <label class="flex items-center text-slate-400 cursor-pointer select-none">
          <input type="checkbox" id="rememberMe" checked class="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-400 focus:ring-offset-slate-900 mr-2" />
          Remember session
        </label>
        <a href="/api/docs" target="_blank" class="text-sky-400 hover:text-sky-300 transition flex items-center gap-1 font-medium">
          <i class="fa-solid fa-book"></i> Swagger API
        </a>
      </div>

      <button
        type="submit"
        id="submitBtn"
        class="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-500/20 transition duration-150 flex items-center justify-center gap-2 mt-4 cursor-pointer"
      >
        <span>Sign In</span>
        <i class="fa-solid fa-arrow-right text-xs"></i>
      </button>
    </form>

    <!-- Session Reset Helper -->
    <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
      <button onclick="forceCleanSession()" type="button" class="text-[11px] text-slate-400 hover:text-red-400 transition cursor-pointer flex items-center gap-1">
        <i class="fa-solid fa-trash-can"></i> Clear Stale Session
      </button>
      <span class="inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        PostgreSQL &bull; NestJS
      </span>
    </div>
  </div>

  <script>
    function forceCleanSession() {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch(e) {}
      var cookies = ["access_token", "lorawan_token", "session_id", "connect.sid"];
      for (var i = 0; i < cookies.length; i++) {
        var c = cookies[i];
        document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;";
        document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
      }
      window.location.href = "/login?cleared=1";
    }
    window.forceCleanSession = forceCleanSession;

    window.togglePasswordVisibility = function() {
      var passInput = document.getElementById("passwordInput");
      var eyeIcon = document.getElementById("eyeIcon");
      if (passInput.type === "password") {
        passInput.type = "text";
        eyeIcon.className = "fa-solid fa-eye-slash text-sm";
      } else {
        passInput.type = "password";
        eyeIcon.className = "fa-solid fa-eye text-sm";
      }
    };

    window.showAlert = function(msg, type) {
      var alertBox = document.getElementById("alertBox");
      alertBox.className = "mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2";
      var icon = '<i class="fa-solid fa-circle-info"></i>';
      if (type === "error") {
        alertBox.className += " bg-red-500/10 border border-red-500/30 text-red-400";
        icon = '<i class="fa-solid fa-circle-exclamation"></i>';
      } else if (type === "success") {
        alertBox.className += " bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
        icon = '<i class="fa-solid fa-circle-check"></i>';
      } else {
        alertBox.className += " bg-sky-500/10 border border-sky-500/30 text-sky-400";
      }
      alertBox.innerHTML = icon + " <span>" + msg + "</span>";
    };

    document.getElementById("loginForm").addEventListener("submit", async function(e) {
      e.preventDefault();
      var usernameOrEmail = document.getElementById("usernameInput").value.trim();
      var password = document.getElementById("passwordInput").value;
      var submitBtn = document.getElementById("submitBtn");

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing in...';

      try {
        var response = await fetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ usernameOrEmail: usernameOrEmail, password: password })
        });

        var data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Authentication failed. Please verify credentials.");
        }

        showAlert("Sign in successful. Opening Control Panel...", "success");
        if (data.access_token) {
          localStorage.setItem("lorawan_token", data.access_token);
        }
        if (data.user) {
          localStorage.setItem("lorawan_user", JSON.stringify(data.user));
        }

        setTimeout(function() {
          window.location.replace("/control-panel");
        }, 200);
      } catch (err) {
        showAlert(err.message, "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In</span> <i class="fa-solid fa-arrow-right text-xs"></i>';
      }
    });

    // Check query params
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("cleared") === "1" || urlParams.get("logout") === "1") {
      try {
        localStorage.removeItem("lorawan_token");
        localStorage.removeItem("lorawan_user");
        sessionStorage.clear();
      } catch(e) {}
      showAlert("Session cleared. Please sign in with your credentials.", "success");
    }
  </script>
</body>
</html>
`;
