export const CONTROL_PANEL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Control Panel - Daviteq LoRaWAN Platform</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    :root {
      --bg-dark: #080d1a;
      --bg-card: #0f172a;
      --bg-surface: #1e293b;
      --border: #334155;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #0ea5e9;
      --primary-hover: #38bdf8;
      --primary-glow: rgba(14, 165, 233, 0.15);
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }
    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: row;
      overflow-x: hidden;
    }
    .hidden { display: none !important; }
    
    /* Layout */
    #sidebar {
      width: 260px;
      min-width: 260px;
      background: #090f1f;
      border-right: 1px solid rgba(51, 65, 85, 0.6);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      z-index: 50;
      transition: transform 0.2s ease-in-out;
    }
    #main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 100vh;
      background: #080d1a;
    }
    header {
      height: 60px;
      min-height: 60px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(51, 65, 85, 0.6);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    main {
      flex: 1;
      padding: 1.5rem;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }

    /* Navigation */
    .nav-group-title {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      padding: 0.75rem 0.75rem 0.25rem;
    }
    .nav-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #94a3b8;
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer !important;
      text-align: left;
      transition: all 0.15s ease;
      outline: none;
    }
    .nav-btn:hover {
      color: #f8fafc;
      background: rgba(30, 41, 59, 0.6);
    }
    .nav-btn.active {
      color: #38bdf8 !important;
      background: rgba(14, 165, 233, 0.15) !important;
      border-color: rgba(56, 189, 248, 0.4) !important;
      font-weight: 600;
    }
    .nav-icon {
      width: 18px;
      text-align: center;
      font-size: 0.9375rem;
    }

    /* Cards & Grids */
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.25rem;
    }
    .card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 1rem;
      padding: 1.25rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.5rem 0.875rem;
      border-radius: 0.625rem;
      border: 1px solid transparent;
      cursor: pointer !important;
      transition: all 0.15s ease;
      outline: none;
      text-decoration: none;
    }
    .btn-primary {
      background: #0ea5e9;
      color: #ffffff;
      border-color: #0284c7;
    }
    .btn-primary:hover {
      background: #38bdf8;
    }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border-color: #334155;
    }
    .btn-secondary:hover {
      background: #334155;
      color: #ffffff;
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.25);
    }
    .btn-amber {
      background: #f59e0b;
      color: #090f1f;
      border-color: #d97706;
      font-weight: 700;
    }
    .btn-amber:hover {
      background: #fbbf24;
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 0.75rem;
      background: rgba(15, 23, 42, 0.6);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
      text-align: left;
    }
    th {
      background: rgba(2, 6, 23, 0.7);
      color: #94a3b8;
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #1e293b;
    }
    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(30, 41, 59, 0.6);
      color: #cbd5e1;
    }
    tr:hover td {
      background: rgba(30, 41, 59, 0.4);
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
      font-family: monospace;
    }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-primary { background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3); }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

    /* Modals */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.85);
      backdrop-filter: blur(4px);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-backdrop.active {
      display: flex !important;
    }
    .modal-window {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      padding: 1.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .form-group {
      margin-bottom: 0.875rem;
    }
    .form-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.25rem;
    }
    .form-control {
      width: 100%;
      padding: 0.55rem 0.75rem;
      background: #020617;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      color: #f8fafc;
      font-size: 0.75rem;
      outline: none;
    }
    .form-control:focus {
      border-color: #0ea5e9;
    }

    /* Toast */
    #toast-wrap {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    }
    .toast-box {
      pointer-events: auto;
      padding: 0.75rem 1rem;
      border-radius: 0.625rem;
      font-size: 0.75rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
      transition: all 0.2s ease;
    }

    /* Mobile Drawer */
    #mobile-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.8);
      z-index: 45;
    }
    @media (max-width: 1024px) {
      #sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
      }
      #sidebar.open {
        transform: translateX(0);
      }
      #mobile-backdrop.open {
        display: block;
      }
    }
  </style>
</head>
<body>
  <!-- Toast Container -->
  <div id="toast-wrap"></div>

  <!-- Mobile Backdrop -->
  <div id="mobile-backdrop" onclick="toggleNav(false)"></div>

  <!-- Left Sidebar Navigation -->
  <aside id="sidebar">
    <!-- Brand -->
    <div style="padding: 1.25rem; border-bottom: 1px solid rgba(51, 65, 85, 0.6); display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <div style="width: 36px; height: 36px; border-radius: 0.625rem; background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.3); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-weight: bold; font-size: 1.125rem;">
          &#128225;
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 0.375rem;">
            <span style="font-weight: 700; font-size: 0.875rem; color: #ffffff;"><span style="color: #38bdf8;">DAVITEQ</span> IoT</span>
            <span class="badge badge-primary" style="padding: 0.1rem 0.35rem; font-size: 0.5625rem;">v1.0</span>
          </div>
          <div style="font-size: 0.6875rem; color: #94a3b8;">LoRaWAN Application Server</div>
        </div>
      </div>
      <button onclick="toggleNav(false)" type="button" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; display: none;" id="mobileCloseBtn">
        &#10005;
      </button>
    </div>

    <!-- Links List -->
    <div style="flex: 1; overflow-y: auto; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;" class="custom-scroll">
      <!-- Section 1 -->
      <div class="nav-group-title">Monitoring</div>
      <button onclick="switchTab('overview')" type="button" id="nav-overview" class="nav-btn active">
        <span class="nav-icon">&#128202;</span>
        <span>Overview</span>
      </button>
      <button onclick="switchTab('telemetry')" type="button" id="nav-telemetry" class="nav-btn">
        <span class="nav-icon">&#9889;</span>
        <span>Live Telemetry</span>
      </button>
      <button onclick="switchTab('database')" type="button" id="nav-database" class="nav-btn">
        <span class="nav-icon">&#128452;</span>
        <span>Database Health</span>
      </button>

      <!-- Section 2 -->
      <div class="nav-group-title" style="margin-top: 0.5rem;">LoRaWAN Network</div>
      <button onclick="switchTab('devices')" type="button" id="nav-devices" class="nav-btn">
        <span class="nav-icon">&#128223;</span>
        <span>Device Fleet</span>
      </button>
      <button onclick="switchTab('webhooks')" type="button" id="nav-webhooks" class="nav-btn">
        <span class="nav-icon">&#128225;</span>
        <span>Webhook Ingest</span>
      </button>
      <button onclick="switchTab('decoder')" type="button" id="nav-decoder" class="nav-btn">
        <span class="nav-icon">&#128295;</span>
        <span>Decoder Sandbox</span>
      </button>

      <!-- Section 3 -->
      <div class="nav-group-title" style="margin-top: 0.5rem;">Access Control</div>
      <button onclick="switchTab('users')" type="button" id="nav-users" class="nav-btn">
        <span class="nav-icon">&#128101;</span>
        <span>User Directory</span>
      </button>
      <button onclick="switchTab('roles')" type="button" id="nav-roles" class="nav-btn">
        <span class="nav-icon">&#128737;</span>
        <span>Role Matrix</span>
      </button>
    </div>

    <!-- Bottom Account Panel -->
    <div style="padding: 0.875rem; border-top: 1px solid rgba(51, 65, 85, 0.6); background: rgba(2, 6, 23, 0.6);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.625rem; font-size: 0.6875rem;">
        <span style="color: #34d399; font-weight: 600; display: flex; align-items: center; gap: 0.375rem;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
          core_db : ONLINE
        </span>
        <a href="/api/docs" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 500;">API Docs &rarr;</a>
      </div>
      
      <div style="padding: 0.625rem; border-radius: 0.625rem; background: #0f172a; border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between;">
        <div style="min-width: 0; padding-right: 0.5rem;">
          <div id="navFullName" style="font-size: 0.75rem; font-weight: 600; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Admin User</div>
          <div id="navRoleBadge" class="badge badge-success" style="font-size: 0.5625rem; margin-top: 0.15rem;">SUPER_ADMIN</div>
        </div>
        <button onclick="handleLogout()" type="button" title="Logout" class="btn btn-danger" style="padding: 0.35rem 0.6rem;">
          &#9211;
        </button>
      </div>
    </div>
  </aside>

  <!-- Main Content Container -->
  <div id="main-content">
    <!-- Header -->
    <header>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button onclick="toggleNav(true)" type="button" class="btn btn-secondary" style="padding: 0.4rem 0.65rem;" id="mobileOpenBtn">
          &#9776;
        </button>
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span id="pageTitle" style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">Overview Dashboard</span>
            <span id="pageCategory" class="badge badge-primary">Real-time</span>
          </div>
          <div id="pageSubtitle" style="font-size: 0.6875rem; color: #94a3b8;">Runtime metrics and platform overview</div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button onclick="forceCleanSession()" type="button" class="btn btn-secondary" title="Purge browser tokens & cache">
          &#8635; Clear Session
        </button>
        <a href="/api/docs" target="_blank" class="btn btn-primary">
          Swagger API
        </a>
        <button onclick="handleLogout()" type="button" class="btn btn-danger">
          Logout
        </button>
      </div>
    </header>

    <!-- Body Views -->
    <main>
      <!-- TAB 1: OVERVIEW -->
      <section id="view-overview" style="display: block;">
        <div class="grid-4">
          <div class="card">
            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 0.75rem;">
              <span>System Runtime</span>
              <span style="color: #38bdf8;">&#128421;</span>
            </div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.375rem;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
              ONLINE
            </div>
            <div style="font-size: 0.6875rem; color: #64748b; margin-top: 0.25rem;">NestJS Core Engine</div>
          </div>

          <div class="card">
            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 0.75rem;">
              <span>Total Users</span>
              <span style="color: #34d399;">&#128101;</span>
            </div>
            <div id="metricTotalUsers" style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-top: 0.5rem;">--</div>
            <div style="font-size: 0.6875rem; color: #64748b; margin-top: 0.25rem;">Super Admins & Operators</div>
          </div>

          <div class="card">
            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 0.75rem;">
              <span>Configured Roles</span>
              <span style="color: #fbbf24;">&#128737;</span>
            </div>
            <div id="metricTotalRoles" style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-top: 0.5rem;">--</div>
            <div style="font-size: 0.6875rem; color: #64748b; margin-top: 0.25rem;">RBAC Role Matrix</div>
          </div>

          <div class="card">
            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 0.75rem;">
              <span>Database Pool</span>
              <span style="color: #818cf8;">&#128452;</span>
            </div>
            <div id="metricDbPools" style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-top: 0.5rem;">--</div>
            <div style="font-size: 0.6875rem; color: #64748b; margin-top: 0.25rem;">PostgreSQL Routing Pool</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3 style="font-size: 0.875rem; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem;">&#9889; System Architecture</h3>
            <p style="font-size: 0.75rem; color: #94a3b8; line-height: 1.5;">
              Daviteq LoRaWAN Application Server provides enterprise-grade telemetry ingestion, dynamic database routing, and granular role-based access control.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1rem;">
              <div style="padding: 0.75rem; background: #020617; border: 1px solid #1e293b; border-radius: 0.625rem;">
                <div style="font-size: 0.6875rem; color: #64748b;">Access Control</div>
                <div style="font-size: 0.75rem; font-weight: 600; color: #34d399; margin-top: 0.25rem;">5-Table RBAC Model</div>
              </div>
              <div style="padding: 0.75rem; background: #020617; border: 1px solid #1e293b; border-radius: 0.625rem;">
                <div style="font-size: 0.6875rem; color: #64748b;">Database Routing</div>
                <div style="font-size: 0.75rem; font-weight: 600; color: #38bdf8; margin-top: 0.25rem;">core_db (dvt) Active</div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 style="font-size: 0.875rem; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem;">&#128279; Quick Action Shortcuts</h3>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <button onclick="switchTab('devices')" type="button" class="nav-btn" style="background: #020617; border: 1px solid #1e293b; padding: 0.6rem 0.85rem;">
                <span>&#128223; Manage LoRaWAN Device Fleet</span>
              </button>
              <button onclick="switchTab('telemetry')" type="button" class="nav-btn" style="background: #020617; border: 1px solid #1e293b; padding: 0.6rem 0.85rem;">
                <span>&#9889; Inspect Incoming Telemetry Stream</span>
              </button>
              <button onclick="switchTab('database')" type="button" class="nav-btn" style="background: #020617; border: 1px solid #1e293b; padding: 0.6rem 0.85rem;">
                <span>&#128452; Visual Database Health & Metrics</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 2: TELEMETRY -->
      <section id="view-telemetry" style="display: none;">
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div>
              <h2 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">&#9889; Live Telemetry Uplinks</h2>
              <p style="font-size: 0.6875rem; color: #94a3b8; margin-top: 0.15rem;">Real-time stream of incoming LoRaWAN packets</p>
            </div>
            <button onclick="loadTelemetry()" type="button" class="btn btn-secondary">
              &#8635; Refresh
            </button>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>DevEUI</th>
                  <th>Port / FCnt</th>
                  <th>Raw Hex</th>
                  <th>Decoded Payload</th>
                  <th>RSSI / SNR</th>
                </tr>
              </thead>
              <tbody id="telemetryBody">
                <tr><td colspan="6" style="text-align: center; color: #64748b; padding: 2rem;">Loading telemetry...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 3: DATABASE HEALTH -->
      <section id="view-database" style="display: none;">
        <div class="card" style="margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div>
              <h2 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">&#128452; Visual Database Health</h2>
              <p style="font-size: 0.6875rem; color: #94a3b8; margin-top: 0.15rem;">Connection pool latency and status</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="loadDatabaseHealth()" type="button" class="btn btn-secondary">&#8635; Refresh</button>
              <button onclick="reloadDbConfig()" type="button" class="btn btn-primary">&#9881; Hot-Reload Config</button>
            </div>
          </div>

          <div id="dbPoolsGrid" class="grid-4" style="margin-bottom: 0;">
            <div style="padding: 1rem; text-align: center; color: #64748b;">Checking database health...</div>
          </div>
        </div>

        <div class="card">
          <h3 style="font-size: 0.8125rem; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem;">Active Table Routing & Records</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Table / Entity</th>
                  <th>Assigned Pool</th>
                  <th>Record Count</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="tableStatsBody">
                <tr><td colspan="4" style="text-align: center; color: #64748b; padding: 2rem;">Loading table stats...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 4: DEVICES -->
      <section id="view-devices" style="display: none;">
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div>
              <h2 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">&#128223; LoRaWAN Device Fleet</h2>
              <p style="font-size: 0.6875rem; color: #94a3b8; margin-top: 0.15rem;">Registered OTAA / ABP End Devices</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="loadDevices()" type="button" class="btn btn-secondary">&#8635; Refresh</button>
              <button onclick="openRegisterDeviceModal()" type="button" class="btn btn-primary">+ Register Device</button>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>DevEUI</th>
                  <th>Device Name</th>
                  <th>Activation</th>
                  <th>Decoder</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="devicesBody">
                <tr><td colspan="6" style="text-align: center; color: #64748b; padding: 2rem;">Loading devices...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 5: WEBHOOKS -->
      <section id="view-webhooks" style="display: none;">
        <div class="card">
          <h2 style="font-size: 0.875rem; font-weight: 700; color: #ffffff; margin-bottom: 0.25rem;">&#128225; Network Server Webhooks</h2>
          <p style="font-size: 0.6875rem; color: #94a3b8; margin-bottom: 1rem;">Configure these HTTP endpoints on your Network Server:</p>

          <div class="grid-2">
            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 0.75rem; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.75rem; font-weight: 700; color: #38bdf8;">ChirpStack v4 Ingestion</span>
                <span class="badge badge-primary">POST / JSON</span>
              </div>
              <div style="padding: 0.5rem; background: #0f172a; border: 1px solid #334155; border-radius: 0.375rem; font-family: monospace; font-size: 0.6875rem; color: #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                <span>POST /lorawan/webhook/chirpstack</span>
                <button onclick="copyToClipboard(window.location.origin + '/lorawan/webhook/chirpstack')" type="button" class="btn btn-secondary" style="padding: 0.2rem 0.4rem; font-size: 0.625rem;">Copy</button>
              </div>
              <p style="font-size: 0.6875rem; color: #64748b; margin-top: 0.5rem;">Supports ChirpStack uplink events and payload decoding.</p>
            </div>

            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 0.75rem; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.75rem; font-weight: 700; color: #34d399;">ThingPark Wireless Ingestion</span>
                <span class="badge badge-success">POST / JSON</span>
              </div>
              <div style="padding: 0.5rem; background: #0f172a; border: 1px solid #334155; border-radius: 0.375rem; font-family: monospace; font-size: 0.6875rem; color: #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                <span>POST /lorawan/webhook/thingpark</span>
                <button onclick="copyToClipboard(window.location.origin + '/lorawan/webhook/thingpark')" type="button" class="btn btn-secondary" style="padding: 0.2rem 0.4rem; font-size: 0.625rem;">Copy</button>
              </div>
              <p style="font-size: 0.6875rem; color: #64748b; margin-top: 0.5rem;">Supports Actility ThingPark Wireless DX packets.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 6: DECODER SANDBOX -->
      <section id="view-decoder" style="display: none;">
        <div class="card">
          <h2 style="font-size: 0.875rem; font-weight: 700; color: #ffffff; margin-bottom: 0.25rem;">&#128295; Payload Formatter Sandbox</h2>
          <p style="font-size: 0.6875rem; color: #94a3b8; margin-bottom: 1rem;">Test JavaScript decoder scripts on raw hex bytes:</p>

          <div class="grid-2">
            <div>
              <label class="form-label">JavaScript Decoder Function</label>
              <textarea id="sandboxCode" class="form-control" style="height: 180px; font-family: monospace;">function decodeUplink(bytes, fPort) {
  var temperature = ((bytes[0] << 8) | bytes[1]) / 100;
  var humidity = bytes[2];
  return {
    temperature: temperature,
    humidity: humidity
  };
}</textarea>
            </div>

            <div>
              <label class="form-label">Test Hex String</label>
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                <input type="text" id="sandboxHex" value="09C441" class="form-control" style="font-family: monospace;" />
                <button onclick="runSandboxDecode()" type="button" class="btn btn-primary">Decode</button>
              </div>
              <label class="form-label">Decoded Output</label>
              <pre id="sandboxResult" style="padding: 0.75rem; background: #020617; border: 1px solid #1e293b; border-radius: 0.5rem; color: #34d399; font-family: monospace; font-size: 0.6875rem; height: 130px; overflow: auto;">{ "ready": true }</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 7: USERS DIRECTORY -->
      <section id="view-users" style="display: none;">
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div>
              <h2 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">&#128101; User Directory</h2>
              <p style="font-size: 0.6875rem; color: #94a3b8; margin-top: 0.15rem;">Manage user credentials and role assignments</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="loadUsers()" type="button" class="btn btn-secondary">&#8635; Refresh</button>
              <button onclick="openCreateUserModal()" type="button" class="btn btn-primary">+ Create User</button>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="usersBody">
                <tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2rem;">Loading users...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TAB 8: ROLE MATRIX -->
      <section id="view-roles" style="display: none;">
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div>
              <h2 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">&#128737; Role Matrix (RBAC)</h2>
              <p style="font-size: 0.6875rem; color: #94a3b8; margin-top: 0.15rem;">Configure roles and granular permissions</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="loadRoles()" type="button" class="btn btn-secondary">&#8635; Refresh</button>
              <button onclick="openCreateRoleModal()" type="button" class="btn btn-amber">+ Create Role</button>
            </div>
          </div>

          <div id="rolesCardsGrid" class="grid-4" style="margin-bottom: 1rem;">
            <div style="padding: 1rem; text-align: center; color: #64748b;">Loading roles...</div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="rolesBody">
                <tr><td colspan="5" style="text-align: center; color: #64748b; padding: 2rem;">Loading role matrix...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  </div>

  <!-- MODAL: CREATE USER -->
  <div id="modal-createUser" class="modal-backdrop" onclick="closeModal('modal-createUser')">
    <div class="modal-window" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">Create User Account</h3>
        <button onclick="closeModal('modal-createUser')" type="button" class="btn btn-secondary" style="padding: 0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-createUser">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" id="newUsername" required class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="newFullName" required class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="newEmail" required class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="newPassword" required minlength="6" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select id="newUserType" class="form-control">
            <option value="USER">Standard User (USER)</option>
            <option value="SUB_ADMIN">Sub-Administrator (SUB_ADMIN)</option>
            <option value="ADMIN">Super Administrator (ADMIN)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Assign Role</label>
          <select id="newUserRoleId" class="form-control">
            <option value="">Select a role...</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
          <button type="button" onclick="closeModal('modal-createUser')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Save User</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: EDIT USER -->
  <div id="modal-editUser" class="modal-backdrop" onclick="closeModal('modal-editUser')">
    <div class="modal-window" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">Edit User Status & Role</h3>
        <button onclick="closeModal('modal-editUser')" type="button" class="btn btn-secondary" style="padding: 0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-editUser">
        <input type="hidden" id="editUserId" />
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" id="editUserDisplay" disabled class="form-control" style="color: #94a3b8;" />
        </div>
        <div class="form-group">
          <label class="form-label">Assign Role</label>
          <select id="editUserRoleId" class="form-control">
            <option value="">No role assigned</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Account Status</label>
          <select id="editUserActive" class="form-control">
            <option value="true">Active</option>
            <option value="false">Suspended</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
          <button type="button" onclick="closeModal('modal-editUser')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Update User</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: CREATE ROLE -->
  <div id="modal-createRole" class="modal-backdrop" onclick="closeModal('modal-createRole')">
    <div class="modal-window" style="max-width: 550px;" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">Create New Role</h3>
        <button onclick="closeModal('modal-createRole')" type="button" class="btn btn-secondary" style="padding: 0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-createRole">
        <div class="form-group">
          <label class="form-label">Role Code (Uppercase)</label>
          <input type="text" id="newRoleCode" required placeholder="e.g. AUDITOR" class="form-control" style="font-family: monospace; text-transform: uppercase;" />
        </div>
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" id="newRoleName" required class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input type="text" id="newRoleDescription" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Assign Permissions</label>
          <div id="newRolePermsContainer" style="max-height: 160px; overflow-y: auto; padding: 0.5rem; background: #020617; border: 1px solid #334155; border-radius: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;" class="custom-scroll">
            <span style="color: #64748b; font-size: 0.6875rem;">Loading permissions...</span>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
          <button type="button" onclick="closeModal('modal-createRole')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-amber">Create Role</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: EDIT ROLE -->
  <div id="modal-editRole" class="modal-backdrop" onclick="closeModal('modal-editRole')">
    <div class="modal-window" style="max-width: 550px;" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">Edit Role Definition</h3>
        <button onclick="closeModal('modal-editRole')" type="button" class="btn btn-secondary" style="padding: 0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-editRole">
        <input type="hidden" id="editRoleId" />
        <div class="form-group">
          <label class="form-label">Role Code</label>
          <input type="text" id="editRoleCode" disabled class="form-control" style="font-family: monospace; color: #94a3b8;" />
        </div>
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" id="editRoleName" required class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input type="text" id="editRoleDescription" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Permissions Matrix</label>
          <div id="editRolePermsContainer" style="max-height: 160px; overflow-y: auto; padding: 0.5rem; background: #020617; border: 1px solid #334155; border-radius: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;" class="custom-scroll">
            <span style="color: #64748b; font-size: 0.6875rem;">Loading permissions...</span>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
          <button type="button" onclick="closeModal('modal-editRole')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Role</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: REGISTER DEVICE -->
  <div id="modal-registerDevice" class="modal-backdrop" onclick="closeModal('modal-registerDevice')">
    <div class="modal-window" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">Register LoRaWAN Device</h3>
        <button onclick="closeModal('modal-registerDevice')" type="button" class="btn btn-secondary" style="padding: 0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-registerDevice">
        <div class="form-group">
          <label class="form-label">DevEUI (16 Hex)</label>
          <input type="text" id="newDevEUI" required placeholder="0018B20000000001" maxlength="16" class="form-control" style="font-family: monospace; text-transform: uppercase;" />
        </div>
        <div class="form-group">
          <label class="form-label">Device Name</label>
          <input type="text" id="newDeviceName" required placeholder="e.g. Temperature Sensor 01" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Activation Mode</label>
          <select id="newActivationType" class="form-control">
            <option value="OTAA">OTAA (Over-The-Air Activation)</option>
            <option value="ABP">ABP (Activation By Personalization)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">AppKey (Optional)</label>
          <input type="text" id="newAppKey" placeholder="32 Hex AppKey (if OTAA)" class="form-control" style="font-family: monospace;" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
          <button type="button" onclick="closeModal('modal-registerDevice')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Register Device</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    var allAvailablePermissions = [];
    var allAvailableRoles = [];
    var allLoadedUsers = [];
    var allLoadedDevices = [];

    var tabMeta = {
      overview: { title: "Overview Dashboard", category: "Real-time", subtitle: "Runtime metrics and platform overview" },
      telemetry: { title: "Live Telemetry Uplinks", category: "Uplink Stream", subtitle: "Real-time stream of incoming LoRaWAN packets and decoded values" },
      database: { title: "Database Health & Routing", category: "Infrastructure", subtitle: "PostgreSQL multi-pool latency, table routing, and config reload" },
      devices: { title: "LoRaWAN Device Fleet", category: "Fleet Management", subtitle: "Registered OTAA/ABP sensors and payload decoder scripts" },
      webhooks: { title: "Webhook Ingestion Endpoints", category: "Integration", subtitle: "ChirpStack v4 and Actility ThingPark Wireless URLs" },
      decoder: { title: "Payload Formatter Sandbox", category: "JS Engine", subtitle: "Test JavaScript payload decoders before saving to devices" },
      users: { title: "User Directory", category: "RBAC Security", subtitle: "Manage Super Admin, Sub-Admin, and standard user accounts" },
      roles: { title: "Role Matrix & Permissions", category: "RBAC Matrix", subtitle: "Role definitions and granular system permission mapping" }
    };

    function toggleNav(open) {
      var sidebar = document.getElementById("sidebar");
      var backdrop = document.getElementById("mobile-backdrop");
      if (open) {
        sidebar.classList.add("open");
        backdrop.classList.add("open");
      } else {
        sidebar.classList.remove("open");
        backdrop.classList.remove("open");
      }
    }
    window.toggleNav = toggleNav;

    function showToast(msg, type) {
      var wrap = document.getElementById("toast-wrap");
      if (!wrap) return;
      var isError = type === "error";
      var isSuccess = type === "success";
      var bg = isError ? "background:#450a0a;color:#fca5a5;border:1px solid #ef4444;" : (isSuccess ? "background:#022c22;color:#6ee7b7;border:1px solid #10b981;" : "background:#082f49;color:#7dd3fc;border:1px solid #0ea5e9;");
      var icon = isError ? "&#9888;" : (isSuccess ? "&#10004;" : "&#9432;");

      var el = document.createElement("div");
      el.className = "toast-box";
      el.style.cssText = bg;
      el.innerHTML = '<span>' + icon + '</span><span>' + msg + '</span>';
      wrap.appendChild(el);
      setTimeout(function() {
        el.style.opacity = "0";
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
      }, 3500);
    }
    window.showToast = showToast;

    function copyToClipboard(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          showToast("Copied to clipboard!", "success");
        }).catch(function() {
          showToast("Copy failed", "error");
        });
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Copied to clipboard!", "success");
      }
    }
    window.copyToClipboard = copyToClipboard;

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
      window.location.replace("/login?cleared=1");
    }
    window.forceCleanSession = forceCleanSession;

    function getAuthToken() {
      var token = null;
      try {
        token = localStorage.getItem("lorawan_token");
      } catch(e) {}
      if (!token || token === "undefined" || token === "null") {
        var match = document.cookie.match(/(?:^|;\\s*)access_token=([^;]*)/);
        if (match && match[1] && match[1] !== "undefined" && match[1] !== "null") {
          token = decodeURIComponent(match[1]);
        } else {
          token = null;
        }
      }
      return token;
    }

    function authHeaders() {
      var headers = { "Content-Type": "application/json" };
      var token = getAuthToken();
      if (token) headers["Authorization"] = "Bearer " + token;
      return headers;
    }

    function updateUserNav(user) {
      if (!user) return;
      var nameEl = document.getElementById("navFullName");
      if (nameEl) nameEl.textContent = user.fullName || user.username || "Admin User";
      
      var isSuper = user.userType === "ADMIN" || 
                    String(user.userType).toUpperCase() === "ADMIN" ||
                    user.username === "admin" ||
                    (user.roles && user.roles.some(function(r) { return r === "SUPER_ADMIN" || (r && r.code === "SUPER_ADMIN"); }));
      var badgeEl = document.getElementById("navRoleBadge");
      if (badgeEl) {
        badgeEl.textContent = isSuper ? "SUPER_ADMIN" : (user.roles && user.roles[0] ? (user.roles[0].name || user.roles[0].code || user.roles[0]) : (user.userType || "USER"));
        badgeEl.className = isSuper ? "badge badge-success" : "badge badge-primary";
      }
    }

    function switchTab(tabId) {
      var tabList = ["overview", "telemetry", "database", "devices", "webhooks", "decoder", "users", "roles"];
      if (tabList.indexOf(tabId) === -1) tabId = "overview";

      for (var i = 0; i < tabList.length; i++) {
        var t = tabList[i];
        var btn = document.getElementById("nav-" + t);
        var sec = document.getElementById("view-" + t);
        if (btn) {
          if (t === tabId) btn.classList.add("active");
          else btn.classList.remove("active");
        }
        if (sec) {
          if (t === tabId) sec.style.display = "block";
          else sec.style.display = "none";
        }
      }

      var meta = tabMeta[tabId] || tabMeta.overview;
      var titleEl = document.getElementById("pageTitle");
      var badgeEl = document.getElementById("pageCategory");
      var subEl = document.getElementById("pageSubtitle");
      if (titleEl) titleEl.textContent = meta.title;
      if (badgeEl) badgeEl.textContent = meta.category;
      if (subEl) subEl.textContent = meta.subtitle;

      toggleNav(false);

      try {
        window.history.replaceState(null, null, "#" + tabId);
      } catch(e) {}

      if (tabId === "users") loadUsers();
      if (tabId === "roles") loadRoles();
      if (tabId === "database") loadDatabaseHealth();
      if (tabId === "devices") loadDevices();
      if (tabId === "telemetry") loadTelemetry();
    }
    window.switchTab = switchTab;

    async function handleLogout() {
      try {
        await fetch("/auth/logout", { method: "POST", headers: authHeaders(), credentials: "include" });
      } catch (e) {}
      try {
        await fetch("/reset-session", { method: "POST", credentials: "include" });
      } catch (e) {}
      forceCleanSession();
    }
    window.handleLogout = handleLogout;

    function openModal(id) {
      var modal = document.getElementById(id);
      if (modal) modal.classList.add("active");
    }
    window.openModal = openModal;

    function closeModal(id) {
      var modal = document.getElementById(id);
      if (modal) modal.classList.remove("active");
    }
    window.closeModal = closeModal;

    function openCreateUserModal() {
      var select = document.getElementById("newUserRoleId");
      select.innerHTML = '<option value="">Select a role...</option>';
      if (Array.isArray(allAvailableRoles)) {
        for (var i = 0; i < allAvailableRoles.length; i++) {
          var r = allAvailableRoles[i];
          select.innerHTML += '<option value="' + r.id + '">' + r.name + ' (' + r.code + ')</option>';
        }
      }
      openModal("modal-createUser");
    }
    window.openCreateUserModal = openCreateUserModal;

    function openEditUserModal(userId) {
      var user = (allLoadedUsers || []).find(function(u) { return u.id === userId; });
      if (!user) return;

      document.getElementById("editUserId").value = user.id;
      document.getElementById("editUserDisplay").value = user.username + " (" + (user.email || "") + ")";
      document.getElementById("editUserActive").value = user.isActive ? "true" : "false";

      var select = document.getElementById("editUserRoleId");
      select.innerHTML = '<option value="">No role assigned</option>';
      var currentRoleId = user.roles && user.roles[0] ? user.roles[0].id : "";

      if (Array.isArray(allAvailableRoles)) {
        for (var i = 0; i < allAvailableRoles.length; i++) {
          var r = allAvailableRoles[i];
          var isSelected = r.id === currentRoleId ? " selected" : "";
          select.innerHTML += '<option value="' + r.id + '"' + isSelected + '>' + r.name + ' (' + r.code + ')</option>';
        }
      }
      openModal("modal-editUser");
    }
    window.openEditUserModal = openEditUserModal;

    function openCreateRoleModal() {
      var container = document.getElementById("newRolePermsContainer");
      container.innerHTML = "";
      if (Array.isArray(allAvailablePermissions)) {
        for (var i = 0; i < allAvailablePermissions.length; i++) {
          var p = allAvailablePermissions[i];
          container.innerHTML += '<label style="display:flex;align-items:center;gap:0.5rem;font-size:0.6875rem;color:#cbd5e1;cursor:pointer;">' +
            '<input type="checkbox" value="' + p.id + '" class="new-role-perm" />' +
            '<span style="font-family:monospace;color:#fbbf24;">' + p.name + '</span>' +
            '<span style="color:#64748b;">(' + (p.description || p.module) + ')</span>' +
            '</label>';
        }
      }
      openModal("modal-createRole");
    }
    window.openCreateRoleModal = openCreateRoleModal;

    function openEditRoleModal(roleId) {
      var role = (allAvailableRoles || []).find(function(r) { return r.id === roleId; });
      if (!role) return;

      document.getElementById("editRoleId").value = role.id;
      document.getElementById("editRoleCode").value = role.code;
      document.getElementById("editRoleName").value = role.name;
      document.getElementById("editRoleDescription").value = role.description || "";

      var container = document.getElementById("editRolePermsContainer");
      container.innerHTML = "";
      var assignedIds = (role.permissions || []).map(function(p) { return p.id; });

      if (Array.isArray(allAvailablePermissions)) {
        for (var j = 0; j < allAvailablePermissions.length; j++) {
          var p = allAvailablePermissions[j];
          var isChecked = assignedIds.indexOf(p.id) !== -1;
          container.innerHTML += '<label style="display:flex;align-items:center;gap:0.5rem;font-size:0.6875rem;color:#cbd5e1;cursor:pointer;">' +
            '<input type="checkbox" value="' + p.id + '" ' + (isChecked ? "checked" : "") + ' class="edit-role-perm" />' +
            '<span style="font-family:monospace;color:#38bdf8;">' + p.name + '</span>' +
            '<span style="color:#64748b;">(' + (p.description || p.module) + ')</span>' +
            '</label>';
        }
      }
      openModal("modal-editRole");
    }
    window.openEditRoleModal = openEditRoleModal;

    function openRegisterDeviceModal() {
      openModal("modal-registerDevice");
    }
    window.openRegisterDeviceModal = openRegisterDeviceModal;

    async function loadUsers() {
      try {
        var res = await fetch("/users", { headers: authHeaders(), credentials: "include" });
        if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
        if (!res.ok) throw new Error("HTTP " + res.status);
        var users = await res.json();
        allLoadedUsers = users;
        
        var totalEl = document.getElementById("metricTotalUsers");
        if (totalEl) totalEl.textContent = users.length;
        var tbody = document.getElementById("usersBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:2rem;">No user accounts found.</td></tr>';
          return;
        }

        for (var i = 0; i < users.length; i++) {
          var u = users[i];
          var isSuper = u.userType === "ADMIN" || String(u.userType).toUpperCase() === "ADMIN" || u.username === "admin" || (u.roles && u.roles.some(function(r) { return r.code === "SUPER_ADMIN"; }));
          var typeBadge = isSuper ? '<span class="badge badge-success">ADMIN</span>' : '<span class="badge badge-primary">' + u.userType + '</span>';
          var rolesBadges = u.roles && u.roles.length > 0 ? u.roles.map(function(r) { return '<span class="badge badge-primary" style="margin-right:0.25rem;">' + (r.name || r.code) + '</span>'; }).join("") : '<span style="color:#64748b;">None</span>';
          var actions = isSuper ? '<span style="color:#64748b;font-size:0.6875rem;">Protected</span>' : '<div style="display:flex;gap:0.35rem;justify-content:flex-end;"><button onclick="openEditUserModal(\'' + u.id + '\')" type="button" class="btn btn-secondary" style="padding:0.25rem 0.5rem;">Edit</button><button onclick="deleteUser(\'' + u.id + '\')" type="button" class="btn btn-danger" style="padding:0.25rem 0.5rem;">Delete</button></div>';

          var tr = document.createElement("tr");
          tr.innerHTML = '<td style="font-weight:600;color:#ffffff;font-family:monospace;">' + u.username + '</td>' +
            '<td>' + (u.fullName || "--") + '</td>' +
            '<td style="color:#94a3b8;">' + u.email + '</td>' +
            '<td>' + typeBadge + '</td>' +
            '<td>' + rolesBadges + '</td>' +
            '<td><span class="' + (u.isActive ? "badge badge-success" : "badge badge-danger") + '">' + (u.isActive ? "Active" : "Suspended") + '</span></td>' +
            '<td style="text-align:right;">' + actions + '</td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        var tbody = document.getElementById("usersBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#f87171;padding:2rem;">Could not load users (' + err.message + ')</td></tr>';
      }
    }
    window.loadUsers = loadUsers;

    async function loadRoles() {
      try {
        var results = await Promise.all([
          fetch("/roles", { headers: authHeaders(), credentials: "include" }),
          fetch("/roles/permissions", { headers: authHeaders(), credentials: "include" })
        ]);

        if (results[0].status === 401 || results[1].status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }

        allAvailableRoles = await results[0].json();
        allAvailablePermissions = await results[1].json();

        var totalEl = document.getElementById("metricTotalRoles");
        if (totalEl) totalEl.textContent = allAvailableRoles.length;

        var grid = document.getElementById("rolesCardsGrid");
        if (grid) {
          grid.innerHTML = "";
          for (var i = 0; i < allAvailableRoles.length; i++) {
            var r = allAvailableRoles[i];
            var isSuper = r.code === "SUPER_ADMIN";
            var card = document.createElement("div");
            card.style.cssText = "background:#020617;border:1px solid #1e293b;border-radius:0.75rem;padding:0.875rem;";
            card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<span style="font-weight:700;color:' + (isSuper ? "#34d399" : "#38bdf8") + ';font-size:0.8125rem;">' + r.name + '</span>' +
              '<span class="' + (isSuper ? "badge badge-success" : "badge badge-primary") + '">' + r.code + '</span>' +
              '</div>' +
              '<div style="font-size:0.6875rem;color:#94a3b8;margin:0.35rem 0;">' + (r.description || "No description") + '</div>' +
              '<div style="font-size:0.6875rem;color:#64748b;">' + (r.permissions ? r.permissions.length : 0) + ' permissions assigned</div>';
            grid.appendChild(card);
          }
        }

        var tbody = document.getElementById("rolesBody");
        if (tbody) {
          tbody.innerHTML = "";
          for (var j = 0; j < allAvailableRoles.length; j++) {
            var r = allAvailableRoles[j];
            var isSuper = r.code === "SUPER_ADMIN";
            var perms = r.permissions && r.permissions.length > 0 ? r.permissions.map(function(p) { return '<span class="badge badge-primary" style="margin-right:0.2rem;margin-bottom:0.2rem;">' + p.name + '</span>'; }).join("") : '<span style="color:#64748b;">None</span>';
            var action = isSuper ? '<span style="color:#64748b;font-size:0.6875rem;">Immutable</span>' : '<div style="display:flex;gap:0.35rem;justify-content:flex-end;"><button onclick="openEditRoleModal(\'' + r.id + '\')" type="button" class="btn btn-secondary" style="padding:0.25rem 0.5rem;">Edit</button><button onclick="deleteRole(\'' + r.id + '\')" type="button" class="btn btn-danger" style="padding:0.25rem 0.5rem;">Delete</button></div>';

            var tr = document.createElement("tr");
            tr.innerHTML = '<td style="font-family:monospace;font-weight:700;color:' + (isSuper ? "#34d399" : "#38bdf8") + ';">' + r.code + '</td>' +
              '<td style="font-weight:600;color:#ffffff;">' + r.name + '</td>' +
              '<td style="color:#94a3b8;">' + (r.description || "--") + '</td>' +
              '<td>' + perms + '</td>' +
              '<td style="text-align:right;">' + action + '</td>';
            tbody.appendChild(tr);
          }
        }
      } catch (err) {
        var tbody = document.getElementById("rolesBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#f87171;padding:2rem;">Could not load roles (' + err.message + ')</td></tr>';
      }
    }
    window.loadRoles = loadRoles;

    async function loadDatabaseHealth() {
      try {
        var res = await fetch("/database/health", { headers: authHeaders(), credentials: "include" });
        if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
        var data = await res.json();
        var poolsEl = document.getElementById("metricDbPools");
        if (poolsEl) poolsEl.textContent = data.totalConnections;

        var grid = document.getElementById("dbPoolsGrid");
        if (grid && data.connections) {
          grid.innerHTML = "";
          var conns = Object.values(data.connections);
          for (var i = 0; i < conns.length; i++) {
            var c = conns[i];
            var card = document.createElement("div");
            card.style.cssText = "background:#020617;border:1px solid #1e293b;border-radius:0.75rem;padding:0.875rem;";
            card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">' +
              '<span style="font-weight:700;color:#ffffff;font-family:monospace;">' + c.name + '</span>' +
              '<span class="' + (c.isAlive ? "badge badge-success" : "badge badge-danger") + '">' + (c.isAlive ? "CONNECTED" : "OFFLINE") + '</span>' +
              '</div>' +
              '<div style="font-size:0.6875rem;color:#94a3b8;line-height:1.6;font-family:monospace;">' +
              '<div>Host: <strong style="color:#ffffff;">' + c.host + ':' + c.port + '</strong></div>' +
              '<div>Database: <strong style="color:#ffffff;">' + c.database + '</strong></div>' +
              '<div>Ping Latency: <strong style="color:' + (c.latencyMs < 50 ? "#34d399" : "#fbbf24") + ';">' + (c.latencyMs !== null ? c.latencyMs + ' ms' : 'N/A') + '</strong></div>' +
              '<div>Pool Size: <strong style="color:#cbd5e1;">' + c.poolSize + ' connections</strong></div>' +
              '</div>';
            grid.appendChild(card);
          }
        }

        var tbody = document.getElementById("tableStatsBody");
        if (tbody && data.tableStats) {
          tbody.innerHTML = "";
          var entries = Object.entries(data.tableStats);
          for (var j = 0; j < entries.length; j++) {
            var table = entries[j][0];
            var stat = entries[j][1];
            var tr = document.createElement("tr");
            tr.innerHTML = '<td style="font-weight:700;color:#ffffff;font-family:monospace;">' + table + '</td>' +
              '<td style="color:#38bdf8;font-family:monospace;">' + stat.routedTo + '</td>' +
              '<td style="color:#34d399;font-weight:600;">' + Number(stat.recordCount).toLocaleString() + ' rows</td>' +
              '<td><span class="badge badge-success">' + stat.status + '</span></td>';
            tbody.appendChild(tr);
          }
        }
      } catch (err) {
        var grid = document.getElementById("dbPoolsGrid");
        if (grid) grid.innerHTML = '<div style="padding:1rem;color:#f87171;text-align:center;">Could not load database health (' + err.message + ')</div>';
      }
    }
    window.loadDatabaseHealth = loadDatabaseHealth;

    async function loadDevices() {
      try {
        var res = await fetch("/lorawan/devices", { headers: authHeaders(), credentials: "include" });
        if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
        var devices = await res.json();
        allLoadedDevices = devices;
        var tbody = document.getElementById("devicesBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!Array.isArray(devices) || devices.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2rem;">No LoRaWAN devices registered. Click "+ Register Device" to add one.</td></tr>';
          return;
        }

        for (var i = 0; i < devices.length; i++) {
          var d = devices[i];
          var tr = document.createElement("tr");
          tr.innerHTML = '<td style="font-weight:700;color:#38bdf8;font-family:monospace;">' + d.devEUI + '</td>' +
            '<td style="color:#ffffff;font-weight:600;">' + (d.name || "--") + '</td>' +
            '<td><span class="badge badge-warning">' + (d.activationType || "OTAA") + '</span></td>' +
            '<td>' + (d.payloadFormatterScript ? '<span style="color:#34d399;">&#10004; Configured</span>' : '<span style="color:#64748b;">None</span>') + '</td>' +
            '<td><span class="' + (d.isActive ? "badge badge-success" : "badge badge-danger") + '">' + (d.isActive ? "ACTIVE" : "INACTIVE") + '</span></td>' +
            '<td style="text-align:right;"><button onclick="testDeviceDecoder(\'' + d.devEUI + '\')" type="button" class="btn btn-secondary" style="padding:0.25rem 0.5rem;">Test Payload</button></td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        var tbody = document.getElementById("devicesBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f87171;padding:2rem;">Could not load devices (' + err.message + ')</td></tr>';
      }
    }
    window.loadDevices = loadDevices;

    async function loadTelemetry() {
      try {
        var res = await fetch("/lorawan/telemetry?limit=25", { headers: authHeaders(), credentials: "include" });
        if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
        var logs = await res.json();
        var tbody = document.getElementById("telemetryBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!Array.isArray(logs) || logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2rem;">No incoming telemetry packets yet. Send a webhook to see live data.</td></tr>';
          return;
        }

        for (var i = 0; i < logs.length; i++) {
          var t = logs[i];
          var decodedStr = typeof t.decodedPayload === "object" ? JSON.stringify(t.decodedPayload) : (t.decodedPayload || "--");
          var tr = document.createElement("tr");
          tr.innerHTML = '<td style="color:#94a3b8;font-size:0.6875rem;">' + new Date(t.timestamp || t.createdAt).toLocaleTimeString() + '</td>' +
            '<td style="font-weight:700;color:#38bdf8;font-family:monospace;">' + (t.devEUI || "--") + '</td>' +
            '<td style="color:#fbbf24;font-family:monospace;">p:' + (t.fPort || 1) + ' / c:' + (t.fCnt || 0) + '</td>' +
            '<td style="color:#cbd5e1;font-family:monospace;">' + (t.payloadHex || "--") + '</td>' +
            '<td style="color:#34d399;font-family:monospace;">' + decodedStr + '</td>' +
            '<td style="color:#94a3b8;">' + (t.rssi !== undefined ? t.rssi + ' dBm' : '--') + ' / ' + (t.snr !== undefined ? t.snr + ' dB' : '--') + '</td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        var tbody = document.getElementById("telemetryBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f87171;padding:2rem;">Could not load telemetry (' + err.message + ')</td></tr>';
      }
    }
    window.loadTelemetry = loadTelemetry;

    async function reloadDbConfig() {
      try {
        var res = await fetch("/database/reload", { method: "POST", headers: authHeaders(), credentials: "include" });
        var data = await res.json();
        showToast(data.message || "Configuration reloaded successfully", "success");
        loadDatabaseHealth();
      } catch (err) {
        showToast("Reload failed: " + err.message, "error");
      }
    }
    window.reloadDbConfig = reloadDbConfig;

    async function deleteUser(id) {
      if (!confirm("Are you sure you want to delete this user?")) return;
      try {
        var res = await fetch("/users/" + id, { method: "DELETE", headers: authHeaders(), credentials: "include" });
        if (!res.ok) throw new Error("Delete failed");
        showToast("User removed successfully", "success");
        loadUsers();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
    window.deleteUser = deleteUser;

    async function deleteRole(id) {
      if (!confirm("Are you sure you want to delete this role?")) return;
      try {
        var res = await fetch("/roles/" + id, { method: "DELETE", headers: authHeaders(), credentials: "include" });
        if (!res.ok) throw new Error("Delete role failed");
        showToast("Role deleted successfully", "success");
        loadRoles();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
    window.deleteRole = deleteRole;

    function testDeviceDecoder(devEUI) {
      switchTab("decoder");
      var hexInput = document.getElementById("sandboxHex");
      if (hexInput) hexInput.focus();
    }
    window.testDeviceDecoder = testDeviceDecoder;

    function runSandboxDecode() {
      var code = document.getElementById("sandboxCode").value;
      var hex = document.getElementById("sandboxHex").value.trim().replace(/\\s+/g, "");
      var resultArea = document.getElementById("sandboxResult");

      try {
        var bytes = [];
        for (var c = 0; c < hex.length; c += 2) {
          bytes.push(parseInt(hex.substr(c, 2), 16));
        }
        var fn = new Function("bytes", "fPort", code + "; return decodeUplink(bytes, fPort);");
        var output = fn(bytes, 1);
        resultArea.textContent = JSON.stringify(output, null, 2);
        showToast("Decoder executed successfully", "success");
      } catch (err) {
        resultArea.textContent = "Decoder Error: " + err.message;
        showToast("Decoder Error: " + err.message, "error");
      }
    }
    window.runSandboxDecode = runSandboxDecode;

    // Attach form submit handlers
    function bindForms() {
      var fCreateUser = document.getElementById("form-createUser");
      if (fCreateUser) {
        fCreateUser.onsubmit = async function(e) {
          e.preventDefault();
          var username = document.getElementById("newUsername").value.trim();
          var fullName = document.getElementById("newFullName").value.trim();
          var email = document.getElementById("newEmail").value.trim();
          var password = document.getElementById("newPassword").value;
          var userType = document.getElementById("newUserType").value;
          var roleId = document.getElementById("newUserRoleId").value;

          try {
            var res = await fetch("/users", {
              method: "POST",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({ username: username, fullName: fullName, email: email, password: password, userType: userType, roleIds: roleId ? [roleId] : [] })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create user");
            showToast("User '" + username + "' created successfully", "success");
            closeModal("modal-createUser");
            fCreateUser.reset();
            loadUsers();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }

      var fEditUser = document.getElementById("form-editUser");
      if (fEditUser) {
        fEditUser.onsubmit = async function(e) {
          e.preventDefault();
          var id = document.getElementById("editUserId").value;
          var roleId = document.getElementById("editUserRoleId").value;
          var isActive = document.getElementById("editUserActive").value === "true";

          try {
            var res = await fetch("/users/" + id + "/permissions", {
              method: "PUT",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({ isActive: isActive, roleIds: roleId ? [roleId] : [] })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update user");
            showToast("User updated successfully", "success");
            closeModal("modal-editUser");
            loadUsers();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }

      var fCreateRole = document.getElementById("form-createRole");
      if (fCreateRole) {
        fCreateRole.onsubmit = async function(e) {
          e.preventDefault();
          var code = document.getElementById("newRoleCode").value.trim().toUpperCase();
          var name = document.getElementById("newRoleName").value.trim();
          var description = document.getElementById("newRoleDescription").value.trim();
          var checkBoxes = document.querySelectorAll(".new-role-perm:checked");
          var perms = [];
          for (var i = 0; i < checkBoxes.length; i++) perms.push(checkBoxes[i].value);

          try {
            var res = await fetch("/roles", {
              method: "POST",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({ code: code, name: name, description: description, permissionIds: perms })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create role");
            showToast("Role '" + name + "' created successfully", "success");
            closeModal("modal-createRole");
            fCreateRole.reset();
            loadRoles();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }

      var fEditRole = document.getElementById("form-editRole");
      if (fEditRole) {
        fEditRole.onsubmit = async function(e) {
          e.preventDefault();
          var id = document.getElementById("editRoleId").value;
          var name = document.getElementById("editRoleName").value.trim();
          var description = document.getElementById("editRoleDescription").value.trim();
          var checkBoxes = document.querySelectorAll(".edit-role-perm:checked");
          var perms = [];
          for (var i = 0; i < checkBoxes.length; i++) perms.push(checkBoxes[i].value);

          try {
            var res = await fetch("/roles/" + id, {
              method: "PUT",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({ name: name, description: description, permissionIds: perms })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update role");
            showToast("Role updated successfully", "success");
            closeModal("modal-editRole");
            loadRoles();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }

      var fRegisterDevice = document.getElementById("form-registerDevice");
      if (fRegisterDevice) {
        fRegisterDevice.onsubmit = async function(e) {
          e.preventDefault();
          var devEUI = document.getElementById("newDevEUI").value.trim().toUpperCase();
          var name = document.getElementById("newDeviceName").value.trim();
          var activationType = document.getElementById("newActivationType").value;
          var appKey = document.getElementById("newAppKey").value.trim();

          try {
            var res = await fetch("/lorawan/devices", {
              method: "POST",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({ devEUI: devEUI, name: name, activationType: activationType, appKey: appKey || undefined })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to register device");
            showToast("Device '" + name + "' registered successfully", "success");
            closeModal("modal-registerDevice");
            fRegisterDevice.reset();
            loadDevices();
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }
    }

    // Startup
    async function initPage() {
      bindForms();

      var token = getAuthToken();
      if (!token) {
        window.location.replace("/login?cleared=1");
        return;
      }

      try {
        var rawUser = localStorage.getItem("lorawan_user");
        if (rawUser && rawUser.startsWith("{")) {
          var storedUser = JSON.parse(rawUser);
          if (storedUser) updateUserNav(storedUser);
        }

        var res = await fetch("/auth/session", { headers: authHeaders(), credentials: "include" });
        if (res.ok) {
          var user = await res.json();
          try { localStorage.setItem("lorawan_user", JSON.stringify(user)); } catch(e) {}
          updateUserNav(user);
        } else if (res.status === 401) {
          showToast("Session expired. Redirecting to login...", "error");
          setTimeout(handleLogout, 800);
          return;
        }
      } catch (err) {
        console.warn("Session check notice:", err);
      }

      var hash = window.location.hash.replace("#", "").trim();
      if (hash && tabMeta[hash]) {
        switchTab(hash);
      } else {
        switchTab("overview");
      }

      loadUsers();
      loadRoles();
      loadDatabaseHealth();
      loadDevices();
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initPage);
    } else {
      initPage();
    }
  </script>
</body>
</html>
`;
