export const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign In - Daviteq LoRaWAN Platform</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: radial-gradient(circle at 50% 10%, #0f172a 0%, #030712 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: #f1f5f9;
    }
    .card-login {
      width: 100%;
      max-width: 420px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(51, 65, 85, 0.8);
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 0 35px -5px rgba(56, 189, 248, 0.15);
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.35rem;
    }
    .form-input {
      width: 100%;
      padding: 0.65rem 0.85rem;
      background: rgba(2, 6, 23, 0.8);
      border: 1px solid #334155;
      border-radius: 0.625rem;
      color: #ffffff;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .form-input:focus {
      border-color: #0ea5e9;
    }
    .btn-submit {
      width: 100%;
      padding: 0.7rem;
      background: #0ea5e9;
      color: #ffffff;
      border: 1px solid #0284c7;
      border-radius: 0.625rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.25rem;
    }
    .btn-submit:hover {
      background: #38bdf8;
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .alert {
      display: none;
      padding: 0.75rem 1rem;
      border-radius: 0.625rem;
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 1rem;
    }
    .alert.show {
      display: block !important;
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .alert-success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
  </style>
</head>
<body>
  <div class="card-login">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 1rem; background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.3); color: #38bdf8; font-size: 1.5rem; margin-bottom: 0.75rem;">
        &#128225;
      </div>
      <h1 style="font-size: 1.35rem; font-weight: 700; color: #ffffff;">
        <span style="color: #38bdf8;">DAVITEQ</span> LoRaWAN
      </h1>
      <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">Network & Application Server Platform</p>
    </div>

    <!-- Alert Box -->
    <div id="alertBox" class="alert"></div>

    <!-- Form -->
    <form id="loginForm">
      <div class="form-group">
        <label class="form-label">Username or Email</label>
        <input type="text" id="usernameInput" required value="admin" class="form-input" placeholder="admin or user@domain.com" />
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="passwordInput" required value="Dvt@123" class="form-input" placeholder="••••••••" />
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem;">
        <label style="display: flex; align-items: center; gap: 0.35rem; color: #94a3b8; cursor: pointer;">
          <input type="checkbox" id="rememberMe" checked style="accent-color: #0ea5e9;" /> Remember session
        </label>
        <a href="/api/docs" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 500;">API Docs &rarr;</a>
      </div>

      <button type="submit" id="submitBtn" class="btn-submit">
        <span>Sign In</span> &rarr;
      </button>
    </form>

    <!-- Footer Controls -->
    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(51, 65, 85, 0.6); display: flex; align-items: center; justify-content: space-between; font-size: 0.6875rem; color: #64748b;">
      <button onclick="forceCleanSession()" type="button" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; text-decoration: underline; font-size: 0.6875rem;">
        Clear Stale Session
      </button>
      <span style="color: #34d399; display: flex; align-items: center; gap: 0.35rem;">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
        NestJS Engine
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

    function showAlert(msg, type) {
      var box = document.getElementById("alertBox");
      box.className = "alert show " + (type === "error" ? "alert-error" : "alert-success");
      box.textContent = msg;
    }
    window.showAlert = showAlert;

    document.getElementById("loginForm").addEventListener("submit", async function(e) {
      e.preventDefault();
      var usernameOrEmail = document.getElementById("usernameInput").value.trim();
      var password = document.getElementById("passwordInput").value;
      var submitBtn = document.getElementById("submitBtn");

      submitBtn.disabled = true;
      submitBtn.innerHTML = "Signing in...";

      try {
        var response = await fetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ usernameOrEmail: usernameOrEmail, password: password })
        });

        var data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Authentication failed.");
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
        submitBtn.innerHTML = "<span>Sign In</span> &rarr;";
      }
    });

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
