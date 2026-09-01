import { Controller, Get, Redirect, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  @Redirect('/login', 302)
  redirectToLogin() {
    return { url: '/login' };
  }

  @Get('login')
  @ApiExcludeEndpoint()
  getLoginPage(@Res() res: Response) {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đăng nhập - Daviteq LoRaWAN Platform Control Panel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    body {
      background: radial-gradient(circle at 20% 20%, #1e293b 0%, #0f172a 100%);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .glow-box {
      box-shadow: 0 0 25px -5px rgba(56, 189, 248, 0.25);
    }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 text-slate-100">
  <div class="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl glow-box">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-3xl mb-4 shadow-inner">
        <i class="fa-solid fa-tower-broadcast"></i>
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
        <span class="text-sky-400">DAVITEQ</span> LoRaWAN
      </h1>
      <p class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Network & Application Server Platform</p>
      <div class="mt-2 text-xs text-slate-400">
        Webhook Ingestion &bull; Dynamic PostgreSQL &bull; RBAC Control
      </div>
    </div>

    <!-- Alert Box -->
    <div id="alertBox" class="hidden mb-5 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2"></div>

    <!-- Quick Credentials Helper -->
    <div class="mb-6 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
      <div class="flex items-center justify-between text-xs">
        <span class="text-slate-400 font-medium"><i class="fa-solid fa-key text-amber-400 mr-1.5"></i>Tài khoản khởi tạo:</span>
        <button type="button" onclick="fillAdminCredentials()" class="text-sky-400 hover:text-sky-300 font-semibold text-xs flex items-center gap-1 bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-500/30 transition">
          <i class="fa-solid fa-bolt"></i> Điền nhanh
        </button>
      </div>
      <div class="mt-1.5 font-mono text-xs text-slate-300 flex items-center gap-3">
        <span>User: <strong class="text-emerald-400">admin</strong></span>
        <span>Pass: <strong class="text-emerald-400">Dvt@123</strong></span>
      </div>
    </div>

    <!-- Login Form -->
    <form id="loginForm" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Tên đăng nhập hoặc Email</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <i class="fa-solid fa-user text-sm"></i>
          </div>
          <input
            type="text"
            id="usernameInput"
            required
            placeholder="admin hoặc email@domain.com"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <i class="fa-solid fa-lock text-sm"></i>
          </div>
          <input
            type="password"
            id="passwordInput"
            required
            placeholder="••••••••"
            class="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
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
        <label class="flex items-center text-slate-400 cursor-pointer">
          <input type="checkbox" checked class="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-400 focus:ring-offset-slate-900 mr-2" />
          Ghi nhớ phiên đăng nhập
        </label>
        <a href="/api/docs" target="_blank" class="text-sky-400 hover:text-sky-300 transition flex items-center gap-1">
          <i class="fa-solid fa-book"></i> Swagger API
        </a>
      </div>

      <button
        type="submit"
        id="submitBtn"
        class="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-500/25 transition duration-200 flex items-center justify-center gap-2 mt-2"
      >
        <span>Đăng nhập Control Panel</span>
        <i class="fa-solid fa-arrow-right text-xs"></i>
      </button>
    </form>

    <!-- Footer -->
    <div class="mt-8 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400 flex items-center justify-between">
      <span>Daviteq IoT Platform</span>
      <span class="inline-flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        NestJS v10 &bull; PostgreSQL
      </span>
    </div>
  </div>

  <script>
    function fillAdminCredentials() {
      document.getElementById('usernameInput').value = 'admin';
      document.getElementById('passwordInput').value = 'Dvt@123';
      showAlert('Đã điền tài khoản: admin / Dvt@123', 'info');
    }

    function togglePasswordVisibility() {
      const passInput = document.getElementById('passwordInput');
      const eyeIcon = document.getElementById('eyeIcon');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
      } else {
        passInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
      }
    }

    function showAlert(msg, type) {
      const alertBox = document.getElementById('alertBox');
      alertBox.classList.remove('hidden', 'bg-red-500/10', 'border-red-500/30', 'text-red-400', 'bg-emerald-500/10', 'border-emerald-500/30', 'text-emerald-400', 'bg-sky-500/10', 'border-sky-500/30', 'text-sky-400');
      
      let icon = '<i class="fa-solid fa-circle-info"></i>';
      if (type === 'error') {
        alertBox.classList.add('bg-red-500/10', 'border', 'border-red-500/30', 'text-red-400');
        icon = '<i class="fa-solid fa-circle-exclamation"></i>';
      } else if (type === 'success') {
        alertBox.classList.add('bg-emerald-500/10', 'border', 'border-emerald-500/30', 'text-emerald-400');
        icon = '<i class="fa-solid fa-circle-check"></i>';
      } else {
        alertBox.classList.add('bg-sky-500/10', 'border', 'border-sky-500/30', 'text-sky-400');
      }
      alertBox.innerHTML = icon + ' <span>' + msg + '</span>';
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameOrEmail = document.getElementById('usernameInput').value.trim();
      const password = document.getElementById('passwordInput').value;
      const submitBtn = document.getElementById('submitBtn');

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xác thực...';

      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernameOrEmail, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.');
        }

        showAlert('Đăng nhập thành công! Đang chuyển hướng vào Control Panel...', 'success');
        localStorage.setItem('lorawan_token', data.access_token);
        localStorage.setItem('lorawan_user', JSON.stringify(data.user));

        setTimeout(() => {
          window.location.href = '/control-panel';
        }, 600);
      } catch (err) {
        showAlert(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Đăng nhập Control Panel</span> <i class="fa-solid fa-arrow-right text-xs"></i>';
      }
    });

    const token = localStorage.getItem('lorawan_token');
    if (token) {
      fetch('/auth/profile', {
        headers: { 'Authorization': 'Bearer ' + token }
      }).then(res => {
        if (res.ok) {
          window.location.href = '/control-panel';
        } else {
          localStorage.removeItem('lorawan_token');
          localStorage.removeItem('lorawan_user');
        }
      }).catch(() => {});
    }
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('control-panel')
  @ApiExcludeEndpoint()
  getControlPanelPage(@Res() res: Response) {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daviteq LoRaWAN Network Platform - Control Panel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    body {
      background: #0b1120;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: #1e293b;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 3px;
    }
  </style>
</head>
<body class="min-h-screen text-slate-100 flex flex-col">
  <!-- Top Navbar -->
  <header class="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg shadow-inner">
          <i class="fa-solid fa-tower-broadcast"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-white tracking-wide"><span class="text-sky-400">DAVITEQ</span> LoRaWAN</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">Control Panel</span>
          </div>
          <p class="text-[11px] text-slate-400">Network & Application Server Management</p>
        </div>
      </div>

      <!-- Center System Status Indicator -->
      <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-slate-300 font-medium">PostgreSQL Dynamic Routing: <span class="text-emerald-400 font-semibold" id="sysStatusText">CONNECTED</span></span>
      </div>

      <!-- Right User Menu -->
      <div class="flex items-center gap-3">
        <a href="/api/docs" target="_blank" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 bg-sky-950/60 border border-sky-500/30 hover:bg-sky-900/60 transition">
          <i class="fa-solid fa-book"></i> Swagger Docs
        </a>
        <div class="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div class="text-right">
            <div id="navFullName" class="text-xs font-bold text-slate-200">Daviteq Admin</div>
            <div id="navRoleBadge" class="text-[10px] text-emerald-400 font-mono">SUPER_ADMIN</div>
          </div>
          <button onclick="handleLogout()" title="Đăng xuất" class="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center text-xs transition">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-800 gap-2 overflow-x-auto custom-scroll pb-1">
      <button onclick="switchTab('overview')" id="tabBtn-overview" class="tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 bg-sky-500/10 text-sky-400 border border-sky-500/30">
        <i class="fa-solid fa-chart-pie"></i> Tổng quan & DB Routing
      </button>
      <button onclick="switchTab('rbac')" id="tabBtn-rbac" class="tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800">
        <i class="fa-solid fa-users-gear"></i> Quản lý Tài khoản & Phân quyền
      </button>
      <button onclick="switchTab('webhooks')" id="tabBtn-webhooks" class="tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800">
        <i class="fa-solid fa-satellite-dish"></i> Webhook Ingestion (ChirpStack / ThingPark)
      </button>
      <button onclick="switchTab('decoder')" id="tabBtn-decoder" class="tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800">
        <i class="fa-solid fa-code"></i> Payload Formatter Sandbox
      </button>
    </div>

    <!-- TAB 1: OVERVIEW & DB ROUTING -->
    <div id="tabContent-overview" class="space-y-6">
      <!-- Quick Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div class="flex items-center justify-between text-slate-400 text-xs">
            <span>Hệ thống Server</span>
            <i class="fa-solid fa-server text-sky-400"></i>
          </div>
          <div class="text-xl font-bold text-white mt-2 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> ONLINE
          </div>
          <div class="text-[11px] text-slate-400 mt-1" id="serverUptime">Uptime: Đang tính...</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div class="flex items-center justify-between text-slate-400 text-xs">
            <span>Tổng số Người dùng</span>
            <i class="fa-solid fa-users text-emerald-400"></i>
          </div>
          <div class="text-xl font-bold text-white mt-2" id="metricTotalUsers">--</div>
          <div class="text-[11px] text-slate-400 mt-1">Admin, Sub-Admin & End-Users</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div class="flex items-center justify-between text-slate-400 text-xs">
            <span>Thiết bị LoRaWAN</span>
            <i class="fa-solid fa-microchip text-indigo-400"></i>
          </div>
          <div class="text-xl font-bold text-white mt-2" id="metricTotalDevices">--</div>
          <div class="text-[11px] text-slate-400 mt-1">OTAA & ABP Sensors</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div class="flex items-center justify-between text-slate-400 text-xs">
            <span>PostgreSQL Table Routes</span>
            <i class="fa-solid fa-database text-amber-400"></i>
          </div>
          <div class="text-xl font-bold text-white mt-2" id="metricTotalRoutes">--</div>
          <div class="text-[11px] text-slate-400 mt-1">Dynamic Routing Mapping</div>
        </div>
      </div>

      <!-- DB Pools and Table Routes section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- DB Connections Status -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-network-wired text-sky-400"></i> Trạng thái Kết nối Database Pools
            </h3>
            <button onclick="reloadDbConfig()" class="px-3 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 transition flex items-center gap-1">
              <i class="fa-solid fa-arrows-rotate"></i> Reload Config
            </button>
          </div>
          <div id="dbPoolsContainer" class="space-y-2.5">
            <div class="text-xs text-slate-400 animate-pulse">Đang tải trạng thái Database...</div>
          </div>
        </div>

        <!-- Table Routes Matrix -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-map-location-dot text-emerald-400"></i> Bảng Ánh Xạ Table -> Database
            </h3>
            <span class="text-xs text-slate-400">config/db-routing.config.json</span>
          </div>
          <div class="overflow-x-auto custom-scroll">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th class="py-2.5 px-3">Tên Bảng / Entity</th>
                  <th class="py-2.5 px-3">Database Target</th>
                  <th class="py-2.5 px-3">Mô tả dữ liệu</th>
                </tr>
              </thead>
              <tbody id="tableRoutesBody" class="divide-y divide-slate-800/60 font-mono">
                <tr><td colspan="3" class="py-3 text-center text-slate-500">Đang tải bảng định tuyến...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: RBAC & USER MANAGEMENT -->
    <div id="tabContent-rbac" class="hidden space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-users-gear text-sky-400"></i> Quản lý Tài khoản & Phân quyền Đa cấp
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Phân cấp Super Admin, Sub-Admin và User kèm ma trận quyền Granular RBAC</p>
          </div>
          <button onclick="openCreateUserModal()" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5 self-start sm:self-auto">
            <i class="fa-solid fa-user-plus"></i> Tạo Tài khoản Mới
          </button>
        </div>

        <!-- Users Table -->
        <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/60">
              <tr>
                <th class="py-3 px-4">Tên đăng nhập</th>
                <th class="py-3 px-4">Họ và Tên</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">Loại User</th>
                <th class="py-3 px-4">Vai trò (Roles)</th>
                <th class="py-3 px-4">Trạng thái</th>
                <th class="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody id="usersTableBody" class="divide-y divide-slate-800/60">
              <tr><td colspan="7" class="py-4 text-center text-slate-500">Đang tải danh sách người dùng...</td></tr>
            </tbody>
          </table>
        </div>

        <!-- RBAC Roles & Permissions Matrix Reference -->
        <div class="mt-6 pt-6 border-t border-slate-800">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            <i class="fa-solid fa-shield-halved text-amber-400 mr-1"></i> Ma Trận Vai Trò & Quyền Hạn Hệ Thống
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div class="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                <i class="fa-solid fa-crown"></i> SUPER_ADMIN
              </div>
              <p class="text-slate-400 text-[11px] mb-2">Toàn quyền hệ thống, quản lý DB routing, tạo Sub-Admin, cấp mọi quyền.</p>
              <div class="flex flex-wrap gap-1">
                <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">users:*</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">lorawan:*</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">admin:*</span>
              </div>
            </div>

            <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div class="font-bold text-sky-400 flex items-center gap-1.5 mb-1">
                <i class="fa-solid fa-user-shield"></i> SUB_ADMIN
              </div>
              <p class="text-slate-400 text-[11px] mb-2">Quản lý khách hàng, thiết bị LoRaWAN, xem telemetry được giao.</p>
              <div class="flex flex-wrap gap-1">
                <span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px]">users:read</span>
                <span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px]">lorawan:device:*</span>
                <span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px]">lorawan:telemetry:read</span>
              </div>
            </div>

            <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div class="font-bold text-indigo-400 flex items-center gap-1.5 mb-1">
                <i class="fa-solid fa-tower-cell"></i> LORAWAN_OPERATOR
              </div>
              <p class="text-slate-400 text-[11px] mb-2">Chuyên trách quản lý thiết bị, cấu hình JS Payload Formatter và giám sát dữ liệu.</p>
              <div class="flex flex-wrap gap-1">
                <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px]">lorawan:device:manage</span>
                <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px]">lorawan:gateway:manage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: WEBHOOK INGESTION -->
    <div id="tabContent-webhooks" class="hidden space-y-6">
      <!-- Webhook integration endpoints card -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 class="text-base font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-satellite-dish text-sky-400"></i> Cổng Tiếp Nhận Webhook LoRaWAN Network Server
        </h2>
        <p class="text-xs text-slate-400">
          Cấu hình Webhook URL này trên các hệ thống ChirpStack, ThingPark hoặc The Things Network (TTN) để tự động đẩy dữ liệu uplink về Database:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between text-sky-400 font-bold font-sans">
              <span><i class="fa-solid fa-cloud-arrow-down mr-1"></i> ChirpStack v3 / v4 Webhook</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">POST JSON</span>
            </div>
            <div class="bg-slate-900 p-2.5 rounded-lg text-slate-300 select-all break-all border border-slate-800">
              POST http://localhost:3000/lorawan/webhook/chirpstack
            </div>
            <p class="font-sans text-[11px] text-slate-400">Tự động nhận diện DevEUI, base64 payload data, port, fCnt và giải mã.</p>
          </div>

          <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between text-emerald-400 font-bold font-sans">
              <span><i class="fa-solid fa-tower-cell mr-1"></i> ThingPark Wireless Webhook</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">POST JSON</span>
            </div>
            <div class="bg-slate-900 p-2.5 rounded-lg text-slate-300 select-all break-all border border-slate-800">
              POST http://localhost:3000/lorawan/webhook/thingpark
            </div>
            <p class="font-sans text-[11px] text-slate-400">Tương thích định dạng DevEUI_uplink, hex payload và DriverCfg.</p>
          </div>
        </div>

        <!-- Quick Simulator Buttons -->
        <div class="mt-4 p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div class="text-xs">
            <span class="font-bold text-white">Kiểm thử Webhook Trực tiếp:</span>
            <span class="text-slate-400 ml-1">Mô phỏng gửi gói tin từ ChirpStack hoặc ThingPark</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="simulateChirpstackWebhook()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition flex items-center gap-1.5">
              <i class="fa-solid fa-paper-plane"></i> Gửi thử ChirpStack Webhook
            </button>
            <button onclick="simulateThingparkWebhook()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1.5">
              <i class="fa-solid fa-paper-plane"></i> Gửi thử ThingPark Webhook
            </button>
          </div>
        </div>
      </div>

      <!-- Telemetry Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-amber-400"></i> Nhật Ký Dữ Liệu Sensor Telemetry (PostgreSQL Database)
          </h3>
          <button onclick="loadTelemetryLogs()" class="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1">
            <i class="fa-solid fa-arrows-rotate"></i> Làm mới
          </button>
        </div>

        <div class="overflow-x-auto custom-scroll border border-slate-800 rounded-xl">
          <table class="w-full text-left text-xs font-mono">
            <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/60 font-sans">
              <tr>
                <th class="py-2.5 px-3">Thời gian nhận</th>
                <th class="py-2.5 px-3">DevEUI</th>
                <th class="py-2.5 px-3">Port</th>
                <th class="py-2.5 px-3">FCnt</th>
                <th class="py-2.5 px-3">Gói tin Hex thô</th>
                <th class="py-2.5 px-3">Dữ liệu đã giải mã (Decoded JSON)</th>
              </tr>
            </thead>
            <tbody id="telemetryTableBody" class="divide-y divide-slate-800/60">
              <tr><td colspan="6" class="py-3 text-center text-slate-500 font-sans">Đang tải dữ liệu telemetry...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: PAYLOAD FORMATTER SANDBOX -->
    <div id="tabContent-decoder" class="hidden space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-code text-sky-400"></i> Trình Thực Thi & Kiểm Thử JavaScript Payload Formatter
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Viết hàm giải mã gói tin Hex thành đối tượng JSON chuẩn Datacake / TTN (Thực thi an toàn trong Sandbox Node.js VM)</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Chuỗi Hex Byte gói tin thô (Hex Bytes)</label>
              <input
                type="text"
                id="testHexInput"
                value="010a00fa"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                placeholder="Ví dụ: 010a00fa"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">LoRaWAN fPort</label>
              <input
                type="number"
                id="testFPortInput"
                value="1"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Mã nguồn JS Formatter Function</label>
              <textarea
                id="testScriptInput"
                rows="12"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-sky-500 custom-scroll"
              >function decodeUplink(input) {
  var bytes = input.bytes;
  var fPort = input.fPort;
  
  // Giải mã ví dụ: 2 byte đầu là nhiệt độ x10, 2 byte sau là độ ẩm
  var temp = ((bytes[0] << 8) | bytes[1]) / 10.0;
  var humidity = (bytes[2] << 8) | bytes[3];
  
  return {
    data: {
      temperature: temp,
      humidity: humidity,
      unit: "Celsius"
    }
  };
}</textarea>
            </div>
            <button onclick="runPayloadFormatterTest()" class="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-xs shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-play text-xs"></i> Chạy Kiểm Thử Sandbox
            </button>
          </div>

          <div class="space-y-3">
            <label class="block text-xs font-semibold text-slate-300">Kết quả JSON Giải mã</label>
            <div id="decoderOutputBox" class="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-sky-300 overflow-auto custom-scroll whitespace-pre">
// Nhấn "Chạy Kiểm Thử Sandbox" để xem kết quả giải mã...
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Modal Tạo User Mới -->
  <div id="createUserModal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-user-plus text-sky-400"></i> Tạo Tài Khoản Mới
        </h3>
        <button onclick="closeCreateUserModal()" class="text-slate-500 hover:text-slate-300 text-sm"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <form id="createUserForm" class="space-y-3">
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Tên đăng nhập (Username)</label>
          <input type="text" id="newUsername" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email</label>
          <input type="email" id="newEmail" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Mật khẩu</label>
          <input type="password" id="newPassword" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Họ và Tên</label>
          <input type="text" id="newFullName" required class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Phân cấp UserType</label>
          <select id="newUserType" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white">
            <option value="USER">USER (Người dùng thiết bị / Tenant)</option>
            <option value="SUB_ADMIN">SUB_ADMIN (Quản trị viên phụ)</option>
          </select>
        </div>

        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="closeCreateUserModal()" class="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800">Hủy</button>
          <button type="submit" class="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-xs">Tạo mới</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const token = localStorage.getItem('lorawan_token');
    const userStr = localStorage.getItem('lorawan_user');

    if (!token) {
      window.location.href = '/login';
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        document.getElementById('navFullName').textContent = user.fullName || user.username;
        document.getElementById('navRoleBadge').textContent = user.userType || 'USER';
      } catch (e) {}
    }

    function handleLogout() {
      localStorage.removeItem('lorawan_token');
      localStorage.removeItem('lorawan_user');
      window.location.href = '/login';
    }

    function switchTab(tab) {
      ['overview', 'rbac', 'webhooks', 'decoder'].forEach(t => {
        document.getElementById('tabContent-' + t).classList.add('hidden');
        document.getElementById('tabBtn-' + t).className = 'tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800';
      });
      document.getElementById('tabContent-' + tab).classList.remove('hidden');
      document.getElementById('tabBtn-' + tab).className = 'tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 bg-sky-500/10 text-sky-400 border border-sky-500/30';

      if (tab === 'rbac') loadUsersList();
      if (tab === 'webhooks') loadTelemetryLogs();
    }

    async function loadOverview() {
      try {
        const res = await fetch('/admin-panel/dashboard', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.status === 401) return handleLogout();
        const data = await res.json();

        // Uptime
        const upSec = Math.floor(data.uptime || 0);
        document.getElementById('serverUptime').textContent = 'Uptime: ' + upSec + 's (' + (upSec / 60).toFixed(1) + ' phút)';

        // DB Status render
        const poolsContainer = document.getElementById('dbPoolsContainer');
        poolsContainer.innerHTML = '';

        const dbStatus = data.dbConnections?.connections_status || {};
        const tableRoutes = data.dbConnections?.table_routes || {};

        document.getElementById('metricTotalRoutes').textContent = Object.keys(tableRoutes).length + ' Tables';

        Object.entries(dbStatus).forEach(([connKey, details]) => {
          const poolCard = document.createElement('div');
          poolCard.className = 'p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs';
          poolCard.innerHTML = \`
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full \${details.initialized ? 'bg-emerald-500' : 'bg-red-500'}"></span>
              <div>
                <div class="font-bold text-slate-200 font-mono">\${connKey}</div>
                <div class="text-[11px] text-slate-400">\${details.host || 'localhost'}:\${details.port || 5432} / <strong class="text-sky-400">\${details.database}</strong></div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold \${details.initialized ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'}">
              \${details.initialized ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          \`;
          poolsContainer.appendChild(poolCard);
        });

        // Table Routes render
        const routesTbody = document.getElementById('tableRoutesBody');
        routesTbody.innerHTML = '';
        Object.entries(tableRoutes).forEach(([tbl, conn]) => {
          const row = document.createElement('tr');
          row.className = 'hover:bg-slate-800/30 transition';
          row.innerHTML = \`
            <td class="py-2.5 px-3 font-semibold text-slate-200">\${tbl}</td>
            <td class="py-2.5 px-3 text-sky-400">\${conn}</td>
            <td class="py-2.5 px-3 text-slate-400 font-sans">\${getRouteDescription(tbl)}</td>
          \`;
          routesTbody.appendChild(row);
        });

      } catch (err) {
        console.error('Error loading overview:', err);
      }
    }

    function getRouteDescription(tbl) {
      const map = {
        users: 'Quản lý tài khoản Admin & User',
        roles: 'Bảng vai trò phân quyền RBAC',
        permissions: 'Bảng chi tiết các quyền hệ thống',
        user_roles: 'Bảng liên kết quan hệ User - Role',
        role_permissions: 'Bảng liên kết quan hệ Role - Permission',
        applications: 'Quản lý Application LoRaWAN',
        devices: 'Danh mục thiết bị cảm biến & JS Decoder',
        gateways: 'Quản lý Gateway LoRaWAN thu phát',
        uplink_telemetry: 'Lưu trữ hàng triệu gói tin Telemetry đo đạc',
      };
      return map[tbl] || 'Dữ liệu chuyên biệt';
    }

    async function reloadDbConfig() {
      try {
        const res = await fetch('/admin-panel/reload-db-config', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        alert('✅ ' + (data.message || 'Reload database routing config thành công!'));
        loadOverview();
      } catch (err) {
        alert('Lỗi reload DB config: ' + err.message);
      }
    }

    async function loadUsersList() {
      try {
        const res = await fetch('/users', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.status === 401) return handleLogout();
        const users = await res.json();
        document.getElementById('metricTotalUsers').textContent = users.length + ' Users';

        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        users.forEach(u => {
          const row = document.createElement('tr');
          row.className = 'hover:bg-slate-800/30 transition';
          const roleNames = u.roles?.map(r => r.code || r.name).join(', ') || 'USER';
          row.innerHTML = \`
            <td class="py-3 px-4 font-semibold text-white font-mono">\${u.username}</td>
            <td class="py-3 px-4 text-slate-300">\${u.fullName || '--'}</td>
            <td class="py-3 px-4 text-slate-400">\${u.email}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold \${u.userType === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : u.userType === 'SUB_ADMIN' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-slate-800 text-slate-400'}">
                \${u.userType}
              </span>
            </td>
            <td class="py-3 px-4 text-slate-300 font-mono text-[11px]">\${roleNames}</td>
            <td class="py-3 px-4">
              <span class="inline-flex items-center gap-1.5 \${u.isActive ? 'text-emerald-400' : 'text-red-400'}">
                <span class="w-1.5 h-1.5 rounded-full \${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}"></span>
                \${u.isActive ? 'Active' : 'Disabled'}
              </span>
            </td>
            <td class="py-3 px-4 text-right space-x-2">
              \${u.userType !== 'ADMIN' ? \`<button onclick="deleteUser('\${u.id}')" class="text-red-400 hover:text-red-300 text-xs"><i class="fa-solid fa-trash"></i></button>\` : '<span class="text-slate-600 text-xs">Khóa</span>'}
            </td>
          \`;
          tbody.appendChild(row);
        });
      } catch (err) {
        console.error('Error loading users:', err);
      }
    }

    function openCreateUserModal() {
      document.getElementById('createUserModal').classList.remove('hidden');
    }

    function closeCreateUserModal() {
      document.getElementById('createUserModal').classList.add('hidden');
    }

    document.getElementById('createUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('newUsername').value.trim();
      const email = document.getElementById('newEmail').value.trim();
      const password = document.getElementById('newPassword').value;
      const fullName = document.getElementById('newFullName').value.trim();
      const userType = document.getElementById('newUserType').value;

      try {
        const res = await fetch('/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ username, email, password, fullName, userType })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không thể tạo user');
        alert('✅ Đã tạo tài khoản ' + username + ' thành công!');
        closeCreateUserModal();
        loadUsersList();
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    });

    async function deleteUser(id) {
      if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
      try {
        const res = await fetch('/users/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không thể xóa user');
        loadUsersList();
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    }

    async function loadTelemetryLogs() {
      try {
        const res = await fetch('/lorawan/telemetry?limit=25', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.status === 401) return handleLogout();
        const logs = await res.json();

        const tbody = document.getElementById('telemetryTableBody');
        tbody.innerHTML = '';

        if (!logs || logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-slate-500 font-sans">Chưa có bản ghi telemetry nào từ Webhook. Hãy nhấn nút gửi thử bên trên!</td></tr>';
          return;
        }

        logs.forEach(l => {
          const row = document.createElement('tr');
          row.className = 'hover:bg-slate-800/30 transition text-xs';
          row.innerHTML = \`
            <td class="py-2.5 px-3 text-slate-400 font-sans">\${new Date(l.receivedAt).toLocaleString()}</td>
            <td class="py-2.5 px-3 text-sky-400 font-bold">\${l.devEUI}</td>
            <td class="py-2.5 px-3 text-slate-300">\${l.fPort}</td>
            <td class="py-2.5 px-3 text-slate-300">\${l.fCnt}</td>
            <td class="py-2.5 px-3 text-amber-400 font-semibold">\${l.payloadHex}</td>
            <td class="py-2.5 px-3 text-emerald-400 font-sans whitespace-pre max-w-xs truncate">\${JSON.stringify(l.decodedData || {})}</td>
          \`;
          tbody.appendChild(row);
        });
      } catch (err) {
        console.error('Error loading telemetry:', err);
      }
    }

    async function simulateChirpstackWebhook() {
      const samplePayload = {
        deviceInfo: {
          tenantName: "Daviteq Tenant",
          applicationName: "LoRaWAN Sensor App",
          deviceName: "Temperature-Sensor-01",
          devEui: "0102030405060708"
        },
        devAddr: "01020304",
        fCnt: Math.floor(Math.random() * 100),
        fPort: 1,
        data: "AQoA+g==", // Base64 for 010a00fa (Temp 26.6, Humidity 250)
        object: {
          temperature: 26.6,
          humidity: 65,
          batteryVoltage: 3.6
        }
      };

      try {
        const res = await fetch('/lorawan/webhook/chirpstack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(samplePayload)
        });
        const data = await res.json();
        alert('✅ Webhook ChirpStack đã tiếp nhận thành công! Dữ liệu đã lưu vào database.');
        loadTelemetryLogs();
      } catch (err) {
        alert('Lỗi test webhook: ' + err.message);
      }
    }

    async function simulateThingparkWebhook() {
      const samplePayload = {
        DevEUI_uplink: {
          Time: new Date().toISOString(),
          DevEUI: "1122334455667788",
          FPort: 2,
          FCntUp: Math.floor(Math.random() * 100),
          payload_hex: "021b03e8",
          LrrRSSI: -72,
          LrrSNR: 10.2,
          DriverCfg: {
            co2_ppm: 550,
            pressure_hpa: 1013
          }
        }
      };

      try {
        const res = await fetch('/lorawan/webhook/thingpark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(samplePayload)
        });
        const data = await res.json();
        alert('✅ Webhook ThingPark Wireless đã tiếp nhận thành công! Dữ liệu đã lưu vào database.');
        loadTelemetryLogs();
      } catch (err) {
        alert('Lỗi test webhook: ' + err.message);
      }
    }

    async function runPayloadFormatterTest() {
      const bytesHex = document.getElementById('testHexInput').value.trim();
      const fPort = Number(document.getElementById('testFPortInput').value);
      const script = document.getElementById('testScriptInput').value;
      const outputBox = document.getElementById('decoderOutputBox');

      outputBox.textContent = '// Đang chạy VM sandbox...';

      try {
        const res = await fetch('/lorawan/payload-formatter/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bytesHex, fPort, script })
        });
        const data = await res.json();
        outputBox.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        outputBox.textContent = '// Lỗi giải mã: ' + err.message;
      }
    }

    // Initial overview load
    loadOverview();
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
