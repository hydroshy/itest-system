export const CONTROL_PANEL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Control Panel - Daviteq LoRaWAN Platform</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    :root {
      --bg: #0b132b;
      --card-bg: #1c2541;
      --border: #3a506b;
      --text: #f0f4f8;
      --text-dim: #9baec8;
      --accent: #00b4d8;
      --accent-hover: #90e0ef;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    /* Top Bar */
    .topbar {
      background: #070d1e;
      border-bottom: 1px solid var(--border);
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.125rem;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      background: rgba(0, 180, 216, 0.15);
      border: 1px solid rgba(0, 180, 216, 0.4);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .top-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Tab Navbar */
    .navbar {
      background: #111a36;
      border-bottom: 1px solid var(--border);
      padding: 0.5rem 1.5rem;
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      white-space: nowrap;
      position: sticky;
      top: 57px;
      z-index: 90;
    }
    .nav-tab {
      padding: 0.6rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-dim);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer !important;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      user-select: none;
      transition: all 0.15s ease;
    }
    .nav-tab:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }
    .nav-tab.active {
      color: #ffffff !important;
      background: #00b4d8 !important;
      border-color: #0096c7 !important;
      box-shadow: 0 2px 8px rgba(0, 180, 216, 0.4);
    }

    /* Content Area */
    .main-wrap {
      flex: 1;
      padding: 1.5rem;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }
    .tab-pane {
      display: none;
    }
    .tab-pane.active {
      display: block !important;
    }

    /* Cards & Layout */
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.25rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .card-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer !important;
      outline: none;
      text-decoration: none;
      user-select: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #00b4d8;
      color: #ffffff;
      border-color: #0096c7;
    }
    .btn-primary:hover {
      background: #48cae4;
    }
    .btn-secondary {
      background: #243356;
      color: #e0e6ed;
      border-color: #3a506b;
    }
    .btn-secondary:hover {
      background: #3a506b;
      color: #ffffff;
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      border-color: rgba(239, 68, 68, 0.4);
    }
    .btn-danger:hover {
      background: #ef4444;
      color: #ffffff;
    }
    .btn-warning {
      background: #f59e0b;
      color: #000000;
      border-color: #d97706;
      font-weight: 700;
    }
    .btn-warning:hover {
      background: #fbbf24;
    }

    /* Tables */
    .table-responsive {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: rgba(11, 19, 43, 0.5);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
      text-align: left;
    }
    th {
      background: #0f1830;
      color: var(--text-dim);
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(58, 80, 107, 0.4);
      color: var(--text);
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.03);
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
    .badge-primary { background: rgba(0, 180, 216, 0.15); color: #00b4d8; border: 1px solid rgba(0, 180, 216, 0.3); }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

    /* Modals */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(5, 10, 25, 0.85);
      backdrop-filter: blur(4px);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-overlay.open {
      display: flex !important;
    }
    .modal-box {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      padding: 1.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
    }
    .form-group {
      margin-bottom: 0.875rem;
    }
    .form-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-dim);
      margin-bottom: 0.25rem;
    }
    .form-input {
      width: 100%;
      padding: 0.55rem 0.75rem;
      background: #0b132b;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: #ffffff;
      font-size: 0.75rem;
      outline: none;
    }
    .form-input:focus {
      border-color: var(--accent);
    }

    /* Toast */
    #toastWrap {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    }
    .toast-msg {
      pointer-events: auto;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div id="toastWrap"></div>

  <!-- TOPBAR -->
  <header class="topbar">
    <a href="/control-panel" class="brand">
      <div class="brand-icon">&#128225;</div>
      <div>
        <div><span style="color:#00b4d8;">DAVITEQ</span> LoRaWAN</div>
        <div style="font-size:0.625rem; color:var(--text-dim); font-weight:normal;">Application & Network Server</div>
      </div>
    </a>

    <div class="top-actions">
      <div style="padding:0.35rem 0.6rem; background:#111a36; border:1px solid var(--border); border-radius:6px; font-size:0.6875rem; display:flex; align-items:center; gap:0.4rem;">
        <span style="width:6px; height:6px; border-radius:50%; background:#10b981; display:inline-block;"></span>
        <span id="navUserBadge" style="color:#34d399; font-weight:700;">ADMIN</span>
      </div>

      <a href="/api/docs" target="_blank" class="btn btn-secondary">
        API Docs
      </a>

      <button onclick="window.forceCleanSession()" type="button" class="btn btn-secondary" title="Reset all cookies & session">
        &#8635; Reset Session
      </button>

      <button onclick="window.handleLogout()" type="button" class="btn btn-danger">
        Logout
      </button>
    </div>
  </header>

  <!-- NAVBAR TABS -->
  <nav class="navbar" id="tabNavBar">
    <button onclick="window.switchTab('overview')" type="button" id="tabBtn-overview" class="nav-tab active">
      <span>&#128202;</span> <span>Overview</span>
    </button>
    <button onclick="window.switchTab('users')" type="button" id="tabBtn-users" class="nav-tab">
      <span>&#128101;</span> <span>User Directory</span>
    </button>
    <button onclick="window.switchTab('roles')" type="button" id="tabBtn-roles" class="nav-tab">
      <span>&#128737;</span> <span>Role Matrix</span>
    </button>
    <button onclick="window.switchTab('database')" type="button" id="tabBtn-database" class="nav-tab">
      <span>&#128452;</span> <span>Database Health</span>
    </button>
    <button onclick="window.switchTab('devices')" type="button" id="tabBtn-devices" class="nav-tab">
      <span>&#128223;</span> <span>LoRaWAN Devices</span>
    </button>
    <button onclick="window.switchTab('telemetry')" type="button" id="tabBtn-telemetry" class="nav-tab">
      <span>&#9889;</span> <span>Live Telemetry</span>
    </button>
    <button onclick="window.switchTab('webhooks')" type="button" id="tabBtn-webhooks" class="nav-tab">
      <span>&#128225;</span> <span>Webhooks</span>
    </button>
    <button onclick="window.switchTab('decoder')" type="button" id="tabBtn-decoder" class="nav-tab">
      <span>&#128295;</span> <span>Decoder Sandbox</span>
    </button>
  </nav>

  <!-- MAIN WRAPPER -->
  <div class="main-wrap">
    
    <!-- PANE 1: OVERVIEW -->
    <section id="pane-overview" class="tab-pane active">
      <div class="grid-4">
        <div class="card">
          <div style="font-size:0.75rem; color:var(--text-dim); display:flex; justify-content:space-between;">
            <span>System Status</span> <span>&#128421;</span>
          </div>
          <div style="font-size:1.25rem; font-weight:700; color:#ffffff; margin-top:0.5rem; display:flex; align-items:center; gap:0.4rem;">
            <span style="width:8px; height:8px; border-radius:50%; background:#10b981; display:inline-block;"></span> ONLINE
          </div>
          <div style="font-size:0.6875rem; color:#64748b; margin-top:0.25rem;">NestJS Core Platform</div>
        </div>

        <div class="card">
          <div style="font-size:0.75rem; color:var(--text-dim); display:flex; justify-content:space-between;">
            <span>Total Accounts</span> <span>&#128101;</span>
          </div>
          <div id="metricUsers" style="font-size:1.25rem; font-weight:700; color:#ffffff; margin-top:0.5rem;">--</div>
          <div style="font-size:0.6875rem; color:#64748b; margin-top:0.25rem;">Super Admins & Users</div>
        </div>

        <div class="card">
          <div style="font-size:0.75rem; color:var(--text-dim); display:flex; justify-content:space-between;">
            <span>RBAC Roles</span> <span>&#128737;</span>
          </div>
          <div id="metricRoles" style="font-size:1.25rem; font-weight:700; color:#ffffff; margin-top:0.5rem;">--</div>
          <div style="font-size:0.6875rem; color:#64748b; margin-top:0.25rem;">Configured Role Definitions</div>
        </div>

        <div class="card">
          <div style="font-size:0.75rem; color:var(--text-dim); display:flex; justify-content:space-between;">
            <span>Database Pools</span> <span>&#128452;</span>
          </div>
          <div id="metricDb" style="font-size:1.25rem; font-weight:700; color:#ffffff; margin-top:0.5rem;">--</div>
          <div style="font-size:0.6875rem; color:#64748b; margin-top:0.25rem;">PostgreSQL Core Pool (dvt)</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">&#9889; Platform Overview</div>
          <p style="font-size:0.75rem; color:var(--text-dim); line-height:1.5;">
            Daviteq LoRaWAN Network & Application Server is running with single-pool PostgreSQL routing, 5-table granular RBAC, and payload decoding engine.
          </p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-top:1rem;">
            <div style="padding:0.75rem; background:#0b132b; border:1px solid var(--border); border-radius:8px;">
              <div style="font-size:0.6875rem; color:var(--text-dim);">Database Routing</div>
              <div style="font-size:0.75rem; font-weight:700; color:#00b4d8; margin-top:0.25rem;">core_db (dvt)</div>
            </div>
            <div style="padding:0.75rem; background:#0b132b; border:1px solid var(--border); border-radius:8px;">
              <div style="font-size:0.6875rem; color:var(--text-dim);">Access Control</div>
              <div style="font-size:0.75rem; font-weight:700; color:#34d399; margin-top:0.25rem;">SUPER_ADMIN Active</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">&#128279; Quick Action Shortcuts</div>
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            <button onclick="window.switchTab('devices')" type="button" class="btn btn-secondary" style="justify-content:flex-start; padding:0.6rem 0.85rem;">
              <span>&#128223;</span> <span>Manage LoRaWAN Device Fleet</span>
            </button>
            <button onclick="window.switchTab('telemetry')" type="button" class="btn btn-secondary" style="justify-content:flex-start; padding:0.6rem 0.85rem;">
              <span>&#9889;</span> <span>Inspect Live Incoming Telemetry</span>
            </button>
            <button onclick="window.switchTab('database')" type="button" class="btn btn-secondary" style="justify-content:flex-start; padding:0.6rem 0.85rem;">
              <span>&#128452;</span> <span>Check Database Health & Table Records</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- PANE 2: USERS -->
    <section id="pane-users" class="tab-pane">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div>
            <div class="card-title">&#128101; User Directory</div>
            <p style="font-size:0.6875rem; color:var(--text-dim);">Manage administrative and operator accounts</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button onclick="window.loadUsers()" type="button" class="btn btn-secondary">&#8635; Refresh</button>
            <button onclick="window.openCreateUserModal()" type="button" class="btn btn-primary">+ Create User</button>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Roles</th>
                <th>Status</th>
                <th style="text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              <tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-dim);">Loading users...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- PANE 3: ROLES -->
    <section id="pane-roles" class="tab-pane">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div>
            <div class="card-title">&#128737; Role Matrix & Permissions</div>
            <p style="font-size:0.6875rem; color:var(--text-dim);">Configure RBAC roles and granular privileges</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button onclick="window.loadRoles()" type="button" class="btn btn-secondary">&#8635; Refresh</button>
            <button onclick="window.openCreateRoleModal()" type="button" class="btn btn-warning">+ Create Role</button>
          </div>
        </div>

        <div id="rolesCardsGrid" class="grid-4" style="margin-bottom:1rem;">
          <div style="padding:1rem; text-align:center; color:var(--text-dim);">Loading roles...</div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Role Code</th>
                <th>Name</th>
                <th>Description</th>
                <th>Permissions</th>
                <th style="text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="rolesTableBody">
              <tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-dim);">Loading role matrix...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- PANE 4: DATABASE HEALTH -->
    <section id="pane-database" class="tab-pane">
      <div class="card" style="margin-bottom:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div>
            <div class="card-title">&#128452; Visual Database Health & Metrics</div>
            <p style="font-size:0.6875rem; color:var(--text-dim);">Real-time status of PostgreSQL connection pool</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button onclick="window.loadDatabaseHealth()" type="button" class="btn btn-secondary">&#8635; Refresh</button>
            <button onclick="window.reloadDbConfig()" type="button" class="btn btn-primary">&#9881; Hot-Reload Config</button>
          </div>
        </div>

        <div id="dbPoolsGrid" class="grid-4" style="margin-bottom:0;">
          <div style="padding:1rem; text-align:center; color:var(--text-dim);">Checking database health...</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Active Table Routing & Record Counts</div>
        <div class="table-responsive">
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
              <tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-dim);">Loading table stats...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- PANE 5: DEVICES -->
    <section id="pane-devices" class="tab-pane">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div>
            <div class="card-title">&#128223; LoRaWAN Device Fleet</div>
            <p style="font-size:0.6875rem; color:var(--text-dim);">Registered OTAA / ABP End Devices</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button onclick="window.loadDevices()" type="button" class="btn btn-secondary">&#8635; Refresh</button>
            <button onclick="window.openRegisterDeviceModal()" type="button" class="btn btn-primary">+ Register Device</button>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>DevEUI</th>
                <th>Device Name</th>
                <th>Activation</th>
                <th>Decoder</th>
                <th>Status</th>
                <th style="text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="devicesTableBody">
              <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-dim);">Loading devices...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- PANE 6: TELEMETRY -->
    <section id="pane-telemetry" class="tab-pane">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div>
            <div class="card-title">&#9889; Live Telemetry Uplinks</div>
            <p style="font-size:0.6875rem; color:var(--text-dim);">Real-time stream of incoming LoRaWAN packets</p>
          </div>
          <button onclick="window.loadTelemetry()" type="button" class="btn btn-secondary">&#8635; Refresh</button>
        </div>

        <div class="table-responsive">
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
            <tbody id="telemetryTableBody">
              <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-dim);">Loading telemetry...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- PANE 7: WEBHOOKS -->
    <section id="pane-webhooks" class="tab-pane">
      <div class="card">
        <div class="card-title">&#128225; Network Server Webhook Endpoints</div>
        <p style="font-size:0.75rem; color:var(--text-dim); margin-bottom:1rem;">Configure these HTTP endpoints on your Network Server:</p>

        <div class="grid-2">
          <div style="background:#0b132b; border:1px solid var(--border); border-radius:8px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-weight:700; color:#00b4d8; font-size:0.8125rem;">ChirpStack v4 Ingestion</span>
              <span class="badge badge-primary">POST / JSON</span>
            </div>
            <div style="padding:0.5rem; background:#1c2541; border:1px solid var(--border); border-radius:6px; font-family:monospace; font-size:0.6875rem; display:flex; justify-content:space-between; align-items:center;">
              <span>POST /lorawan/webhook/chirpstack</span>
              <button onclick="window.copyToClipboard(window.location.origin + '/lorawan/webhook/chirpstack')" type="button" class="btn btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.625rem;">Copy</button>
            </div>
            <p style="font-size:0.6875rem; color:var(--text-dim); margin-top:0.5rem;">Supports ChirpStack uplink events and payload decoding.</p>
          </div>

          <div style="background:#0b132b; border:1px solid var(--border); border-radius:8px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-weight:700; color:#34d399; font-size:0.8125rem;">ThingPark Wireless Ingestion</span>
              <span class="badge badge-success">POST / JSON</span>
            </div>
            <div style="padding:0.5rem; background:#1c2541; border:1px solid var(--border); border-radius:6px; font-family:monospace; font-size:0.6875rem; display:flex; justify-content:space-between; align-items:center;">
              <span>POST /lorawan/webhook/thingpark</span>
              <button onclick="window.copyToClipboard(window.location.origin + '/lorawan/webhook/thingpark')" type="button" class="btn btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.625rem;">Copy</button>
            </div>
            <p style="font-size:0.6875rem; color:var(--text-dim); margin-top:0.5rem;">Supports Actility ThingPark Wireless DX packets.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PANE 8: DECODER SANDBOX -->
    <section id="pane-decoder" class="tab-pane">
      <div class="card">
        <div class="card-title">&#128295; Payload Formatter Sandbox</div>
        <p style="font-size:0.75rem; color:var(--text-dim); margin-bottom:1rem;">Test JavaScript decoder scripts on raw hex bytes:</p>

        <div class="grid-2">
          <div>
            <label class="form-label">JavaScript Decoder Function</label>
            <textarea id="sandboxCode" class="form-input" style="height:180px; font-family:monospace;">function decodeUplink(bytes, fPort) {
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
            <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem;">
              <input type="text" id="sandboxHex" value="09C441" class="form-input" style="font-family:monospace;" />
              <button onclick="window.runSandboxDecode()" type="button" class="btn btn-primary">Decode</button>
            </div>
            <label class="form-label">Decoded Output</label>
            <pre id="sandboxResult" style="padding:0.75rem; background:#0b132b; border:1px solid var(--border); border-radius:6px; color:#34d399; font-family:monospace; font-size:0.6875rem; height:130px; overflow:auto;">{ "ready": true }</pre>
          </div>
        </div>
      </div>
    </section>

  </div>

  <!-- MODAL: CREATE USER -->
  <div id="modal-createUser" class="modal-overlay" onclick="window.closeModal('modal-createUser')">
    <div class="modal-box" onclick="event.stopPropagation()">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="font-size:0.875rem; font-weight:700; color:#ffffff;">Create User Account</h3>
        <button onclick="window.closeModal('modal-createUser')" type="button" class="btn btn-secondary" style="padding:0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-createUser">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" id="newUsername" required class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="newFullName" required class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="newEmail" required class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="newPassword" required minlength="6" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select id="newUserType" class="form-input">
            <option value="USER">Standard User (USER)</option>
            <option value="SUB_ADMIN">Sub-Administrator (SUB_ADMIN)</option>
            <option value="ADMIN">Super Administrator (ADMIN)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Assign Role</label>
          <select id="newUserRoleId" class="form-input">
            <option value="">Select a role...</option>
          </select>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
          <button type="button" onclick="window.closeModal('modal-createUser')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Save User</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: EDIT USER -->
  <div id="modal-editUser" class="modal-overlay" onclick="window.closeModal('modal-editUser')">
    <div class="modal-box" onclick="event.stopPropagation()">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="font-size:0.875rem; font-weight:700; color:#ffffff;">Edit User Status & Role</h3>
        <button onclick="window.closeModal('modal-editUser')" type="button" class="btn btn-secondary" style="padding:0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-editUser">
        <input type="hidden" id="editUserId" />
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" id="editUserDisplay" disabled class="form-input" style="color:var(--text-dim);" />
        </div>
        <div class="form-group">
          <label class="form-label">Assign Role</label>
          <select id="editUserRoleId" class="form-input">
            <option value="">No role assigned</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Account Status</label>
          <select id="editUserActive" class="form-input">
            <option value="true">Active</option>
            <option value="false">Suspended</option>
          </select>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
          <button type="button" onclick="window.closeModal('modal-editUser')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Update User</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: CREATE ROLE -->
  <div id="modal-createRole" class="modal-overlay" onclick="window.closeModal('modal-createRole')">
    <div class="modal-box" style="max-width:550px;" onclick="event.stopPropagation()">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="font-size:0.875rem; font-weight:700; color:#ffffff;">Create New Role</h3>
        <button onclick="window.closeModal('modal-createRole')" type="button" class="btn btn-secondary" style="padding:0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-createRole">
        <div class="form-group">
          <label class="form-label">Role Code (Uppercase)</label>
          <input type="text" id="newRoleCode" required placeholder="e.g. AUDITOR" class="form-input" style="font-family:monospace; text-transform:uppercase;" />
        </div>
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" id="newRoleName" required class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input type="text" id="newRoleDescription" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Assign Permissions</label>
          <div id="newRolePermsContainer" style="max-height:160px; overflow-y:auto; padding:0.5rem; background:#0b132b; border:1px solid var(--border); border-radius:6px; display:flex; flex-direction:column; gap:0.35rem;">
            <span style="color:var(--text-dim); font-size:0.6875rem;">Loading permissions...</span>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
          <button type="button" onclick="window.closeModal('modal-createRole')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-warning">Create Role</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: EDIT ROLE -->
  <div id="modal-editRole" class="modal-overlay" onclick="window.closeModal('modal-editRole')">
    <div class="modal-box" style="max-width:550px;" onclick="event.stopPropagation()">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="font-size:0.875rem; font-weight:700; color:#ffffff;">Edit Role Definition</h3>
        <button onclick="window.closeModal('modal-editRole')" type="button" class="btn btn-secondary" style="padding:0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-editRole">
        <input type="hidden" id="editRoleId" />
        <div class="form-group">
          <label class="form-label">Role Code</label>
          <input type="text" id="editRoleCode" disabled class="form-input" style="font-family:monospace; color:var(--text-dim);" />
        </div>
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" id="editRoleName" required class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input type="text" id="editRoleDescription" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Permissions Matrix</label>
          <div id="editRolePermsContainer" style="max-height:160px; overflow-y:auto; padding:0.5rem; background:#0b132b; border:1px solid var(--border); border-radius:6px; display:flex; flex-direction:column; gap:0.35rem;">
            <span style="color:var(--text-dim); font-size:0.6875rem;">Loading permissions...</span>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
          <button type="button" onclick="window.closeModal('modal-editRole')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Role</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: REGISTER DEVICE -->
  <div id="modal-registerDevice" class="modal-overlay" onclick="window.closeModal('modal-registerDevice')">
    <div class="modal-box" onclick="event.stopPropagation()">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="font-size:0.875rem; font-weight:700; color:#ffffff;">Register LoRaWAN Device</h3>
        <button onclick="window.closeModal('modal-registerDevice')" type="button" class="btn btn-secondary" style="padding:0.2rem 0.4rem;">&#10005;</button>
      </div>
      <form id="form-registerDevice">
        <div class="form-group">
          <label class="form-label">DevEUI (16 Hex Characters)</label>
          <input type="text" id="newDevEUI" required placeholder="0018B20000000001" maxlength="16" class="form-input" style="font-family:monospace; text-transform:uppercase;" />
        </div>
        <div class="form-group">
          <label class="form-label">Device Name</label>
          <input type="text" id="newDeviceName" required placeholder="e.g. Temperature Sensor 01" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Activation Mode</label>
          <select id="newActivationType" class="form-input">
            <option value="OTAA">OTAA (Over-The-Air Activation)</option>
            <option value="ABP">ABP (Activation By Personalization)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">AppKey (Optional)</label>
          <input type="text" id="newAppKey" placeholder="32 Hex AppKey (if OTAA)" class="form-input" style="font-family:monospace;" />
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
          <button type="button" onclick="window.closeModal('modal-registerDevice')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Register Device</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // DEFINE ALL FUNCTIONS GLOBALLY FIRST
    window.allAvailablePermissions = [];
    window.allAvailableRoles = [];
    window.allLoadedUsers = [];
    window.allLoadedDevices = [];

    window.showToast = function(msg, type) {
      var wrap = document.getElementById("toastWrap");
      if (!wrap) return;
      var el = document.createElement("div");
      el.className = "toast-msg";
      if (type === "error") {
        el.style.cssText = "background:#450a0a; color:#fca5a5; border:1px solid #ef4444;";
        el.innerHTML = "<span>&#9888;</span> <span>" + msg + "</span>";
      } else if (type === "success") {
        el.style.cssText = "background:#022c22; color:#6ee7b7; border:1px solid #10b981;";
        el.innerHTML = "<span>&#10004;</span> <span>" + msg + "</span>";
      } else {
        el.style.cssText = "background:#082f49; color:#7dd3fc; border:1px solid #00b4d8;";
        el.innerHTML = "<span>&#9432;</span> <span>" + msg + "</span>";
      }
      wrap.appendChild(el);
      setTimeout(function() {
        el.style.opacity = "0";
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
      }, 3500);
    };

    window.copyToClipboard = function(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          window.showToast("Copied to clipboard!", "success");
        }).catch(function() {
          window.showToast("Copy failed", "error");
        });
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        window.showToast("Copied to clipboard!", "success");
      }
    };

    window.forceCleanSession = function() {
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
    };

    window.getAuthToken = function() {
      var token = null;
      try {
        token = localStorage.getItem("lorawan_token");
      } catch(e) {}
      if (!token || token === "undefined" || token === "null") {
        var match = document.cookie.match(/(?:^|;\\s*)access_token=([^;]*)/);
        if (match && match[1] && match[1] !== "undefined" && match[1] !== "null") {
          token = decodeURIComponent(match[1]);
        }
      }
      return token;
    };

    window.authHeaders = function() {
      var headers = { "Content-Type": "application/json" };
      var token = window.getAuthToken();
      if (token) headers["Authorization"] = "Bearer " + token;
      return headers;
    };

    window.switchTab = function(tabId) {
      var tabs = ["overview", "users", "roles", "database", "devices", "telemetry", "webhooks", "decoder"];
      if (tabs.indexOf(tabId) === -1) tabId = "overview";

      for (var i = 0; i < tabs.length; i++) {
        var t = tabs[i];
        var btn = document.getElementById("tabBtn-" + t);
        var pane = document.getElementById("pane-" + t);
        if (btn) {
          if (t === tabId) btn.classList.add("active");
          else btn.classList.remove("active");
        }
        if (pane) {
          if (t === tabId) pane.classList.add("active");
          else pane.classList.remove("active");
        }
      }

      try {
        window.history.replaceState(null, null, "#" + tabId);
      } catch(e) {}

      if (tabId === "users") window.loadUsers();
      if (tabId === "roles") window.loadRoles();
      if (tabId === "database") window.loadDatabaseHealth();
      if (tabId === "devices") window.loadDevices();
      if (tabId === "telemetry") window.loadTelemetry();
    };

    window.handleLogout = async function() {
      try {
        await fetch("/auth/logout", { method: "POST", headers: window.authHeaders(), credentials: "include" });
      } catch(e) {}
      try {
        await fetch("/reset-session", { method: "POST", credentials: "include" });
      } catch(e) {}
      window.forceCleanSession();
    };

    window.openModal = function(id) {
      var modal = document.getElementById(id);
      if (modal) modal.classList.add("open");
    };

    window.closeModal = function(id) {
      var modal = document.getElementById(id);
      if (modal) modal.classList.remove("open");
    };

    window.openCreateUserModal = function() {
      var select = document.getElementById("newUserRoleId");
      if (select) {
        select.innerHTML = '<option value="">Select a role...</option>';
        if (Array.isArray(window.allAvailableRoles)) {
          for (var i = 0; i < window.allAvailableRoles.length; i++) {
            var r = window.allAvailableRoles[i];
            select.innerHTML += '<option value="' + r.id + '">' + r.name + ' (' + r.code + ')</option>';
          }
        }
      }
      window.openModal("modal-createUser");
    };

    window.openEditUserModal = function(userId) {
      var user = (window.allLoadedUsers || []).find(function(u) { return u.id === userId; });
      if (!user) return;

      document.getElementById("editUserId").value = user.id;
      document.getElementById("editUserDisplay").value = user.username + " (" + (user.email || "") + ")";
      document.getElementById("editUserActive").value = user.isActive ? "true" : "false";

      var select = document.getElementById("editUserRoleId");
      select.innerHTML = '<option value="">No role assigned</option>';
      var currentRoleId = user.roles && user.roles[0] ? user.roles[0].id : "";

      if (Array.isArray(window.allAvailableRoles)) {
        for (var i = 0; i < window.allAvailableRoles.length; i++) {
          var r = window.allAvailableRoles[i];
          var isSelected = r.id === currentRoleId ? " selected" : "";
          select.innerHTML += '<option value="' + r.id + '"' + isSelected + '>' + r.name + ' (' + r.code + ')</option>';
        }
      }
      window.openModal("modal-editUser");
    };

    window.openCreateRoleModal = function() {
      var container = document.getElementById("newRolePermsContainer");
      if (container) {
        container.innerHTML = "";
        if (Array.isArray(window.allAvailablePermissions)) {
          for (var i = 0; i < window.allAvailablePermissions.length; i++) {
            var p = window.allAvailablePermissions[i];
            container.innerHTML += '<label style="display:flex;align-items:center;gap:0.5rem;font-size:0.6875rem;color:var(--text-dim);cursor:pointer;">' +
              '<input type="checkbox" value="' + p.id + '" class="new-role-perm" />' +
              '<span style="font-family:monospace;color:#fbbf24;">' + p.name + '</span>' +
              '<span style="color:#64748b;">(' + (p.description || p.module) + ')</span>' +
              '</label>';
          }
        }
      }
      window.openModal("modal-createRole");
    };

    window.openEditRoleModal = function(roleId) {
      var role = (window.allAvailableRoles || []).find(function(r) { return r.id === roleId; });
      if (!role) return;

      document.getElementById("editRoleId").value = role.id;
      document.getElementById("editRoleCode").value = role.code;
      document.getElementById("editRoleName").value = role.name;
      document.getElementById("editRoleDescription").value = role.description || "";

      var container = document.getElementById("editRolePermsContainer");
      container.innerHTML = "";
      var assignedIds = (role.permissions || []).map(function(p) { return p.id; });

      if (Array.isArray(window.allAvailablePermissions)) {
        for (var j = 0; j < window.allAvailablePermissions.length; j++) {
          var p = window.allAvailablePermissions[j];
          var isChecked = assignedIds.indexOf(p.id) !== -1;
          container.innerHTML += '<label style="display:flex;align-items:center;gap:0.5rem;font-size:0.6875rem;color:var(--text-dim);cursor:pointer;">' +
            '<input type="checkbox" value="' + p.id + '" ' + (isChecked ? "checked" : "") + ' class="edit-role-perm" />' +
            '<span style="font-family:monospace;color:#00b4d8;">' + p.name + '</span>' +
            '<span style="color:#64748b;">(' + (p.description || p.module) + ')</span>' +
            '</label>';
        }
      }
      window.openModal("modal-editRole");
    };

    window.openRegisterDeviceModal = function() {
      window.openModal("modal-registerDevice");
    };

    window.loadUsers = async function() {
      try {
        var res = await fetch("/users", { headers: window.authHeaders(), credentials: "include" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        var users = await res.json();
        window.allLoadedUsers = users;
        
        var totalEl = document.getElementById("metricUsers");
        if (totalEl) totalEl.textContent = users.length;
        var tbody = document.getElementById("usersTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:2rem;">No user accounts found.</td></tr>';
          return;
        }

        for (var i = 0; i < users.length; i++) {
          var u = users[i];
          var isSuper = u.userType === "ADMIN" || String(u.userType).toUpperCase() === "ADMIN" || u.username === "admin" || (u.roles && u.roles.some(function(r) { return r.code === "SUPER_ADMIN"; }));
          var typeBadge = isSuper ? '<span class="badge badge-success">ADMIN</span>' : '<span class="badge badge-primary">' + u.userType + '</span>';
          var rolesBadges = u.roles && u.roles.length > 0 ? u.roles.map(function(r) { return '<span class="badge badge-primary" style="margin-right:0.25rem;">' + (r.name || r.code) + '</span>'; }).join("") : '<span style="color:#64748b;">None</span>';
          var actions = isSuper ? '<span style="color:#64748b;font-size:0.6875rem;">Protected</span>' : '<div style="display:flex;gap:0.35rem;justify-content:flex-end;"><button onclick="window.openEditUserModal(\'' + u.id + '\')" type="button" class="btn btn-secondary" style="padding:0.25rem 0.5rem;">Edit</button><button onclick="window.deleteUser(\'' + u.id + '\')" type="button" class="btn btn-danger" style="padding:0.25rem 0.5rem;">Delete</button></div>';

          var tr = document.createElement("tr");
          tr.innerHTML = '<td style="font-weight:600;color:#ffffff;font-family:monospace;">' + u.username + '</td>' +
            '<td>' + (u.fullName || "--") + '</td>' +
            '<td style="color:var(--text-dim);">' + u.email + '</td>' +
            '<td>' + typeBadge + '</td>' +
            '<td>' + rolesBadges + '</td>' +
            '<td><span class="' + (u.isActive ? "badge badge-success" : "badge badge-danger") + '">' + (u.isActive ? "Active" : "Suspended") + '</span></td>' +
            '<td style="text-align:right;">' + actions + '</td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        var tbody = document.getElementById("usersTableBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#f87171;padding:2rem;">Notice: ' + err.message + '</td></tr>';
      }
    };

    window.loadRoles = async function() {
      try {
        var results = await Promise.all([
          fetch("/roles", { headers: window.authHeaders(), credentials: "include" }),
          fetch("/roles/permissions", { headers: window.authHeaders(), credentials: "include" })
        ]);

        window.allAvailableRoles = await results[0].json();
        window.allAvailablePermissions = await results[1].json();

        var totalEl = document.getElementById("metricRoles");
        if (totalEl) totalEl.textContent = window.allAvailableRoles.length;

        var grid = document.getElementById("rolesCardsGrid");
        if (grid) {
          grid.innerHTML = "";
          for (var i = 0; i < window.allAvailableRoles.length; i++) {
            var r = window.allAvailableRoles[i];
            var isSuper = r.code === "SUPER_ADMIN";
            var card = document.createElement("div");
            card.style.cssText = "background:#0b132b;border:1px solid var(--border);border-radius:8px;padding:0.875rem;";
            card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<span style="font-weight:700;color:' + (isSuper ? "#34d399" : "#00b4d8") + ';font-size:0.8125rem;">' + r.name + '</span>' +
              '<span class="' + (isSuper ? "badge badge-success" : "badge badge-primary") + '">' + r.code + '</span>' +
              '</div>' +
              '<div style="font-size:0.6875rem;color:var(--text-dim);margin:0.35rem 0;">' + (r.description || "No description") + '</div>' +
              '<div style="font-size:0.6875rem;color:#64748b;">' + (r.permissions ? r.permissions.length : 0) + ' permissions assigned</div>';
            grid.appendChild(card);
          }
        }

        var tbody = document.getElementById("rolesTableBody");
        if (tbody) {
          tbody.innerHTML = "";
          for (var j = 0; j < window.allAvailableRoles.length; j++) {
            var r = window.allAvailableRoles[j];
            var isSuper = r.code === "SUPER_ADMIN";
            var perms = r.permissions && r.permissions.length > 0 ? r.permissions.map(function(p) { return '<span class="badge badge-primary" style="margin-right:0.2rem;margin-bottom:0.2rem;">' + p.name + '</span>'; }).join("") : '<span style="color:#64748b;">None</span>';
            var action = isSuper ? '<span style="color:#64748b;font-size:0.6875rem;">Immutable</span>' : '<div style="display:flex;gap:0.35rem;justify-content:flex-end;"><button onclick="window.openEditRoleModal(\'' + r.id + '\')" type="button" class="btn btn-secondary" style="padding:0.25rem 0.5rem;">Edit</button><button onclick="window.deleteRole(\'' + r.id + '\')" type="button" class="btn btn-danger" style="padding:0.25rem 0.5rem;">Delete</button></div>';

            var tr = document.createElement("tr");
            tr.innerHTML = '<td style="font-family:monospace;font-weight:700;color:' + (isSuper ? "#34d399" : "#00b4d8") + ';">' + r.code + '</td>' +
              '<td style="font-weight:600;color:#ffffff;">' + r.name + '</td>' +
              '<td style="color:var(--text-dim);">' + (r.description || "--") + '</td>' +
              '<td>' + perms + '</td>' +
              '<td style="text-align:right;">' + action + '</td>';
            tbody.appendChild(tr);
          }
        }
      } catch (err) {
        var tbody = document.getElementById("rolesTableBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#f87171;padding:2rem;">Notice: ' + err.message + '</td></tr>';
      }
    };

    window.loadDatabaseHealth = async function() {
      try {
        var res = await fetch("/database/health", { headers: window.authHeaders(), credentials: "include" });
        var data = await res.json();
        var poolsEl = document.getElementById("metricDb");
        if (poolsEl) poolsEl.textContent = data.totalConnections;

        var grid = document.getElementById("dbPoolsGrid");
        if (grid && data.connections) {
          grid.innerHTML = "";
          var conns = Object.values(data.connections);
          for (var i = 0; i < conns.length; i++) {
            var c = conns[i];
            var card = document.createElement("div");
            card.style.cssText = "background:#0b132b;border:1px solid var(--border);border-radius:8px;padding:0.875rem;";
            card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">' +
              '<span style="font-weight:700;color:#ffffff;font-family:monospace;">' + c.name + '</span>' +
              '<span class="' + (c.isAlive ? "badge badge-success" : "badge badge-danger") + '">' + (c.isAlive ? "CONNECTED" : "OFFLINE") + '</span>' +
              '</div>' +
              '<div style="font-size:0.6875rem;color:var(--text-dim);line-height:1.6;font-family:monospace;">' +
              '<div>Host: <strong style="color:#ffffff;">' + c.host + ':' + c.port + '</strong></div>' +
              '<div>Database: <strong style="color:#ffffff;">' + c.database + '</strong></div>' +
              '<div>Ping Latency: <strong style="color:' + (c.latencyMs < 50 ? "#34d399" : "#fbbf24") + ';">' + (c.latencyMs !== null ? c.latencyMs + ' ms' : 'N/A') + '</strong></div>' +
              '<div>Pool Size: <strong style="color:#ffffff;">' + c.poolSize + ' connections</strong></div>' +
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
              '<td style="color:#00b4d8;font-family:monospace;">' + stat.routedTo + '</td>' +
              '<td style="color:#34d399;font-weight:600;">' + Number(stat.recordCount).toLocaleString() + ' rows</td>' +
              '<td><span class="badge badge-success">' + stat.status + '</span></td>';
            tbody.appendChild(tr);
          }
        }
      } catch (err) {
        var grid = document.getElementById("dbPoolsGrid");
        if (grid) grid.innerHTML = '<div style="padding:1rem;color:#f87171;text-align:center;">Could not load database health (' + err.message + ')</div>';
      }
    };

    window.loadDevices = async function() {
      try {
        var res = await fetch("/lorawan/devices", { headers: window.authHeaders(), credentials: "include" });
        var devices = await res.json();
        window.allLoadedDevices = devices;
        var tbody = document.getElementById("devicesTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!Array.isArray(devices) || devices.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:2rem;">No LoRaWAN devices registered. Click "+ Register Device" to add one.</td></tr>';
          return;
        }

        for (var i = 0; i < devices.length; i++) {
          var d = devices[i];
          var tr = document.createElement("tr");
          tr.innerHTML = '<td style="font-weight:700;color:#00b4d8;font-family:monospace;">' + d.devEUI + '</td>' +
            '<td style="color:#ffffff;font-weight:600;">' + (d.name || "--") + '</td>' +
            '<td><span class="badge badge-warning">' + (d.activationType || "OTAA") + '</span></td>' +
            '<td>' + (d.payloadFormatterScript ? '<span style="color:#34d399;">&#10004; Configured</span>' : '<span style="color:#64748b;">None</span>') + '</td>' +
            '<td><span class="' + (d.isActive ? "badge badge-success" : "badge badge-danger") + '">' + (d.isActive ? "ACTIVE" : "INACTIVE") + '</span></td>' +
            '<td style="text-align:right;"><button onclick="window.testDeviceDecoder(\'' + d.devEUI + '\')" type="button" class="btn btn-secondary" style="padding:0.25rem 0.5rem;">Test Payload</button></td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        var tbody = document.getElementById("devicesTableBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f87171;padding:2rem;">Could not load devices (' + err.message + ')</td></tr>';
      }
    };

    window.loadTelemetry = async function() {
      try {
        var res = await fetch("/lorawan/telemetry?limit=25", { headers: window.authHeaders(), credentials: "include" });
        var logs = await res.json();
        var tbody = document.getElementById("telemetryTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!Array.isArray(logs) || logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:2rem;">No incoming telemetry packets yet. Send a webhook to see live data.</td></tr>';
          return;
        }

        for (var i = 0; i < logs.length; i++) {
          var t = logs[i];
          var decodedStr = typeof t.decodedPayload === "object" ? JSON.stringify(t.decodedPayload) : (t.decodedPayload || "--");
          var tr = document.createElement("tr");
          tr.innerHTML = '<td style="color:var(--text-dim);font-size:0.6875rem;">' + new Date(t.timestamp || t.createdAt).toLocaleTimeString() + '</td>' +
            '<td style="font-weight:700;color:#00b4d8;font-family:monospace;">' + (t.devEUI || "--") + '</td>' +
            '<td style="color:#fbbf24;font-family:monospace;">p:' + (t.fPort || 1) + ' / c:' + (t.fCnt || 0) + '</td>' +
            '<td style="color:#ffffff;font-family:monospace;">' + (t.payloadHex || "--") + '</td>' +
            '<td style="color:#34d399;font-family:monospace;">' + decodedStr + '</td>' +
            '<td style="color:var(--text-dim);">' + (t.rssi !== undefined ? t.rssi + ' dBm' : '--') + ' / ' + (t.snr !== undefined ? t.snr + ' dB' : '--') + '</td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        var tbody = document.getElementById("telemetryTableBody");
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#f87171;padding:2rem;">Could not load telemetry (' + err.message + ')</td></tr>';
      }
    };

    window.reloadDbConfig = async function() {
      try {
        var res = await fetch("/database/reload", { method: "POST", headers: window.authHeaders(), credentials: "include" });
        var data = await res.json();
        window.showToast(data.message || "Configuration reloaded successfully", "success");
        window.loadDatabaseHealth();
      } catch (err) {
        window.showToast("Reload failed: " + err.message, "error");
      }
    };

    window.deleteUser = async function(id) {
      if (!confirm("Are you sure you want to delete this user?")) return;
      try {
        var res = await fetch("/users/" + id, { method: "DELETE", headers: window.authHeaders(), credentials: "include" });
        if (!res.ok) throw new Error("Delete failed");
        window.showToast("User removed successfully", "success");
        window.loadUsers();
      } catch (err) {
        window.showToast(err.message, "error");
      }
    };

    window.deleteRole = async function(id) {
      if (!confirm("Are you sure you want to delete this role?")) return;
      try {
        var res = await fetch("/roles/" + id, { method: "DELETE", headers: window.authHeaders(), credentials: "include" });
        if (!res.ok) throw new Error("Delete role failed");
        window.showToast("Role deleted successfully", "success");
        window.loadRoles();
      } catch (err) {
        window.showToast(err.message, "error");
      }
    };

    window.testDeviceDecoder = function(devEUI) {
      window.switchTab("decoder");
      var hexInput = document.getElementById("sandboxHex");
      if (hexInput) hexInput.focus();
    };

    window.runSandboxDecode = function() {
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
        window.showToast("Decoder executed successfully", "success");
      } catch (err) {
        resultArea.textContent = "Decoder Error: " + err.message;
        window.showToast("Decoder Error: " + err.message, "error");
      }
    };

    // FORM BINDINGS
    window.bindForms = function() {
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
              headers: window.authHeaders(),
              credentials: "include",
              body: JSON.stringify({ username: username, fullName: fullName, email: email, password: password, userType: userType, roleIds: roleId ? [roleId] : [] })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create user");
            window.showToast("User '" + username + "' created successfully", "success");
            window.closeModal("modal-createUser");
            fCreateUser.reset();
            window.loadUsers();
          } catch (err) {
            window.showToast(err.message, "error");
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
              headers: window.authHeaders(),
              credentials: "include",
              body: JSON.stringify({ isActive: isActive, roleIds: roleId ? [roleId] : [] })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update user");
            window.showToast("User updated successfully", "success");
            window.closeModal("modal-editUser");
            window.loadUsers();
          } catch (err) {
            window.showToast(err.message, "error");
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
              headers: window.authHeaders(),
              credentials: "include",
              body: JSON.stringify({ code: code, name: name, description: description, permissionIds: perms })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create role");
            window.showToast("Role '" + name + "' created successfully", "success");
            window.closeModal("modal-createRole");
            fCreateRole.reset();
            window.loadRoles();
          } catch (err) {
            window.showToast(err.message, "error");
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
              headers: window.authHeaders(),
              credentials: "include",
              body: JSON.stringify({ name: name, description: description, permissionIds: perms })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update role");
            window.showToast("Role updated successfully", "success");
            window.closeModal("modal-editRole");
            window.loadRoles();
          } catch (err) {
            window.showToast(err.message, "error");
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
              headers: window.authHeaders(),
              credentials: "include",
              body: JSON.stringify({ devEUI: devEUI, name: name, activationType: activationType, appKey: appKey || undefined })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to register device");
            window.showToast("Device '" + name + "' registered successfully", "success");
            window.closeModal("modal-registerDevice");
            fRegisterDevice.reset();
            window.loadDevices();
          } catch (err) {
            window.showToast(err.message, "error");
          }
        };
      }
    };

    // INIT
    window.onload = function() {
      window.bindForms();

      var hash = window.location.hash.replace("#", "").trim();
      if (hash) {
        window.switchTab(hash);
      } else {
        window.switchTab("overview");
      }

      // Fetch initial data
      window.loadUsers();
      window.loadRoles();
      window.loadDatabaseHealth();
      window.loadDevices();
    };
  </script>
</body>
</html>
`;
