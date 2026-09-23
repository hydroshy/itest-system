import { DEVICE_MANAGER_TEMPLATE, DEVICE_MANAGER_MODALS } from './dashboard-modules/device-manager.module';
import { TELEMETRY_TEMPLATE } from './dashboard-modules/telemetry.module';
import { HMI_SCADA_TEMPLATE, HMI_SCADA_MODALS, HMI_SCADA_SCRIPT } from './dashboard-modules/hmi-scada.module';
import { DOWNLINK_TEMPLATE, DOWNLINK_MODALS, DOWNLINK_SCRIPT } from './dashboard-modules/downlink.module';
import { SERIAL_UART_TEMPLATE, SERIAL_UART_MODALS, SERIAL_UART_SCRIPT } from './dashboard-modules/serial-uart.module';
import { TEST_AUTOMATION_TEMPLATE, TEST_AUTOMATION_MODALS, TEST_AUTOMATION_SCRIPT } from './dashboard-modules/test-automation.module';

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Dashboard - Daviteq LoRaWAN</title>
  <link rel="icon" type="image/png" href="/images/favicon.png" />
  <link rel="shortcut icon" href="/images/favicon.png" />
  <link rel="prefetch" href="/control-panel" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <!-- Tabulator 6.x CSS & JS (Local + Multi-CDN fallbacks) -->
  <link rel="stylesheet" href="/vendor/tabulator/tabulator_midnight.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tabulator-tables/6.3.0/css/tabulator_midnight.min.css">
  <script src="/vendor/tabulator/tabulator.min.js"></script>
  <script>
    if (typeof Tabulator === 'undefined') {
      document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/tabulator-tables/6.3.0/js/tabulator.min.js"><\\/script>');
    }
  </script>
  <script>
    if (typeof Tabulator === 'undefined') {
      document.write('<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.3.0/dist/js/tabulator.min.js"><\\/script>');
    }
  </script>
  <!-- SheetJS for XLSX, XLS, and CSV export -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <!-- Socket.IO Client for Realtime Uplink & Downlink Streaming -->
  <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.7.4/dist/socket.io.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script>
    (function() {
      try {
        var saved = localStorage.getItem('dvt_theme');
        var theme = (saved === 'dark') ? 'dark' : 'light';
        document.documentElement.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
      } catch(e) {
        document.documentElement.classList.add('theme-light');
      }
    })();
  </script>
  <style>
    /* Tabulator Modern Dark Theme Customization */
    .tabulator {
      background-color: #0b1329 !important;
      border: 1px solid #1e293b !important;
      font-size: 12px !important;
      font-family: 'JetBrains Mono', monospace !important;
    }
    .tabulator .tabulator-header {
      background-color: #0f172a !important;
      border-bottom: 2px solid #1e293b !important;
      color: #94a3b8 !important;
    }
    .tabulator .tabulator-header .tabulator-col {
      background-color: #0f172a !important;
      border-right: 1px solid #1e293b80 !important;
    }
    .tabulator .tabulator-header .tabulator-col-content {
      padding: 8px 6px !important;
    }
    .tabulator .tabulator-header .tabulator-col-title {
      font-size: 10.5px !important;
      font-weight: 700 !important;
      letter-spacing: 0.05em;
    }
    .tabulator .tabulator-row {
      background-color: #0b1329 !important;
      border-bottom: 1px solid #1e293b60 !important;
      color: #cbd5e1 !important;
      min-height: 34px !important;
    }
    .tabulator .tabulator-row:hover {
      background-color: #1e293b80 !important;
    }
    .tabulator .tabulator-row.tabulator-selected {
      background-color: #1e293b !important;
      color: #fff !important;
      box-shadow: inset 0 0 0 1px rgba(6, 182, 212, 0.5) !important;
    }
    .tabulator .tabulator-row.tabulator-selected .tabulator-cell {
      background-color: rgba(6, 182, 212, 0.14) !important;
      color: #ffffff !important;
    }
    .tabulator .tabulator-row.tabulator-selected .tabulator-cell:first-child {
      background-color: #0891b2 !important;
      color: #ffffff !important;
      font-weight: 700 !important;
    }
    .tabulator .tabulator-row .tabulator-cell:first-child {
      cursor: pointer !important;
      user-select: none !important;
      font-weight: 600;
      color: #94a3b8;
      transition: background-color 0.15s, color 0.15s;
    }
    .tabulator .tabulator-row:hover .tabulator-cell:first-child {
      background-color: rgba(6, 182, 212, 0.2) !important;
      color: #38bdf8 !important;
    }
    .tabulator .tabulator-cell {
      border-right: 1px solid #1e293b60 !important;
      padding: 4px 6px !important;
      vertical-align: middle;
    }
    .tabulator .tabulator-cell:has(input[type="text"]) {
      padding: 3px 4px !important;
    }
    .tabulator .tabulator-cell input[type="text"] {
      width: 100% !important;
      box-sizing: border-box !important;
    }
    .tabulator input[type="checkbox"] {
      accent-color: #06b6d4;
      cursor: pointer;
      width: 15px;
      height: 15px;
    }
    .tabulator .tabulator-editing input,
    .tabulator .tabulator-editing select {
      background-color: #020617 !important;
      color: #38bdf8 !important;
      border: 1px solid #0284c7 !important;
      border-radius: 4px;
      padding: 2px 6px !important;
      font-size: 12px !important;
      font-family: 'JetBrains Mono', monospace !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2) !important;
    }
    .tabulator-menu {
      background-color: #0f172a !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
      color: #e2e8f0 !important;
      padding: 4px !important;
      font-size: 12px !important;
      font-family: 'JetBrains Mono', monospace !important;
    }
    .tabulator-menu .tabulator-menu-item {
      padding: 6px 12px !important;
      border-radius: 6px !important;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .tabulator-menu .tabulator-menu-item:hover {
      background-color: #1e293b !important;
      color: #38bdf8 !important;
    }
    .tabulator-edit-list {
      background-color: #0f172a !important;
      border: 1px solid #334155 !important;
      border-radius: 6px !important;
      color: #e2e8f0 !important;
      font-size: 12px !important;
      font-family: 'JetBrains Mono', monospace !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
    }
    .tabulator-edit-list .tabulator-edit-list-item {
      padding: 6px 10px !important;
      cursor: pointer;
    }
    .tabulator-edit-list .tabulator-edit-list-item:hover,
    .tabulator-edit-list .tabulator-edit-list-item.active {
      background-color: #1e293b !important;
      color: #38bdf8 !important;
    }
    @keyframes pageFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* Modern Typography with Google Inter */
    body, input, button, select, textarea, p, h1, h2, h3, h4, h5, h6, span, label, a, td, th {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .font-mono, code, pre, .mono, [class*="font-mono"] {
      font-family: 'JetBrains Mono', monospace !important;
    }
    .fa, .fas, .fa-solid, .fa-regular, .fa-brands {
      font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands" !important;
    }

    body {
      background-color: #030712;
      margin: 0;
      padding: 0;
      color: #f1f5f9;
      font-size: 13.5px;
      overflow-x: hidden;
      animation: pageFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }

    /* =========================================================================
       THEME ENGINE: WHITE MODE (DEFAULT) & DARK MODE
       Minimalist, clean, uncluttered, business-grade styling
       ========================================================================= */
    html.theme-light,
    html.theme-light body,
    body.theme-light {
      background-color: #f8fafc !important;
      color: #0f172a !important;
    }

    .theme-light .glass-header {
      background: rgba(255, 255, 255, 0.96) !important;
      border-bottom: 1px solid #e2e8f0 !important;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04) !important;
      backdrop-filter: blur(12px) !important;
    }

    .theme-light .glass-sidebar {
      background: #ffffff !important;
      border-right: 1px solid #e2e8f0 !important;
      box-shadow: 1px 0 3px 0 rgba(0, 0, 0, 0.02) !important;
    }

    .theme-light .glass-card {
      background: #ffffff !important;
      background-image: none !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04) !important;
      color: #0f172a !important;
    }
    .theme-light .glass-card:hover {
      border-color: #cbd5e1 !important;
      box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.08) !important;
    }

    /* Primary cards, containers, and dialogs */
    .theme-light .bg-slate-900,
    .theme-light [class*="bg-slate-900"] {
      background-color: #ffffff !important;
      border-color: #e2e8f0 !important;
    }

    /* Sub-panels, wells, summary boxes, badges, table headers */
    .theme-light .bg-slate-950,
    .theme-light [class*="bg-slate-950"] {
      background-color: #f8fafc !important;
      border-color: #e2e8f0 !important;
    }

    /* Secondary elements, chips, hover states */
    .theme-light .bg-slate-800,
    .theme-light .bg-slate-700,
    .theme-light [class*="bg-slate-800"],
    .theme-light [class*="bg-slate-700"] {
      background-color: #f1f5f9 !important;
      border-color: #e2e8f0 !important;
    }

    /* Dark gradient elimination on containers and banners */
    .theme-light [class*="from-slate-"],
    .theme-light [class*="via-slate-"],
    .theme-light [class*="to-slate-"],
    .theme-light [class*="from-black"],
    .theme-light [class*="to-black"],
    .theme-light [class*="from-emerald-950"],
    .theme-light [class*="to-emerald-950"],
    .theme-light [class*="from-amber-950"],
    .theme-light [class*="to-amber-950"],
    .theme-light [class*="from-cyan-950"],
    .theme-light [class*="to-cyan-950"],
    .theme-light [class*="from-sky-950"],
    .theme-light [class*="to-sky-950"],
    .theme-light [class*="from-red-950"],
    .theme-light [class*="to-red-950"],
    .theme-light [class*="from-rose-950"],
    .theme-light [class*="to-rose-950"] {
      background-image: none !important;
      background-color: #ffffff !important;
    }

    /* Colored dark accents mapped to clean light-theme tints */
    .theme-light [class*="bg-emerald-950"] {
      background-color: #ecfdf5 !important;
      border-color: #a7f3d0 !important;
      color: #065f46 !important;
    }
    .theme-light [class*="bg-red-950"],
    .theme-light [class*="bg-rose-950"] {
      background-color: #fef2f2 !important;
      border-color: #fecaca !important;
      color: #991b1b !important;
    }
    .theme-light [class*="bg-amber-950"] {
      background-color: #fffbeb !important;
      border-color: #fde68a !important;
      color: #92400e !important;
    }
    .theme-light [class*="bg-cyan-950"] {
      background-color: #ecfeff !important;
      border-color: #a5f3fc !important;
      color: #155e75 !important;
    }
    .theme-light [class*="bg-sky-950"] {
      background-color: #f0f9ff !important;
      border-color: #bae6fd !important;
      color: #075985 !important;
    }
    .theme-light [class*="bg-indigo-950"] {
      background-color: #eef2ff !important;
      border-color: #c7d2fe !important;
      color: #3730a3 !important;
    }
    .theme-light [class*="bg-purple-950"] {
      background-color: #faf5ff !important;
      border-color: #e9d5ff !important;
      color: #581c87 !important;
    }

    /* Modal Backdrop Overlays & Inner Dialog Cards */
    .theme-light .modal-backdrop,
    .theme-light .fixed.inset-0,
    .theme-light [class*="fixed"][class*="inset-0"],
    .theme-light .fixed.inset-0[class*="bg-slate-950"],
    .theme-light .fixed.inset-0[class*="bg-black"] {
      background: rgba(15, 23, 42, 0.48) !important;
      backdrop-filter: blur(4px) !important;
    }

    .theme-light .fixed.inset-0 > div,
    .theme-light .modal-backdrop > div,
    .theme-light .fixed.inset-0 .bg-slate-900,
    .theme-light .fixed.inset-0 .glass-card,
    .theme-light .modal-backdrop .bg-slate-900,
    .theme-light .modal-backdrop .glass-card {
      background-color: #ffffff !important;
      border-color: #e2e8f0 !important;
      color: #0f172a !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    }

    /* Borders & Dividers */
    .theme-light .border-slate-800,
    .theme-light .border-slate-700,
    .theme-light .border-slate-900,
    .theme-light [class*="border-slate-800"],
    .theme-light [class*="border-slate-700"],
    .theme-light [class*="border-slate-900"],
    .theme-light [class*="divide-slate-800"],
    .theme-light [class*="divide-slate-700"] {
      border-color: #e2e8f0 !important;
    }

    /* Text Colors */
    .theme-light .text-white {
      color: #0f172a !important;
    }
    .theme-light .text-slate-100,
    .theme-light .text-slate-200 {
      color: #1e293b !important;
    }
    .theme-light .text-slate-300,
    .theme-light .text-slate-400 {
      color: #475569 !important;
    }
    .theme-light .text-slate-500 {
      color: #64748b !important;
    }
    .theme-light .text-slate-600 {
      color: #94a3b8 !important;
    }

    /* Neon/Pale text enhancements for light backgrounds */
    .theme-light .text-sky-300, .theme-light .text-sky-400 { color: #0284c7 !important; }
    .theme-light .text-cyan-300, .theme-light .text-cyan-400 { color: #0891b2 !important; }
    .theme-light .text-emerald-300, .theme-light .text-emerald-400 { color: #047857 !important; }
    .theme-light .text-amber-300, .theme-light .text-amber-400 { color: #b45309 !important; }
    .theme-light .text-red-300, .theme-light .text-red-400,
    .theme-light .text-rose-300, .theme-light .text-rose-400 { color: #be123c !important; }
    .theme-light .text-purple-300, .theme-light .text-purple-400,
    .theme-light .text-violet-300, .theme-light .text-violet-400 { color: #6d28d9 !important; }
    .theme-light .text-indigo-300, .theme-light .text-indigo-400 { color: #4338ca !important; }
    .theme-light .text-teal-300, .theme-light .text-teal-400 { color: #0f766e !important; }

    /* Maintain white text on solid/gradient colored action buttons */
    .theme-light button[class*="bg-sky-600"],
    .theme-light button[class*="bg-blue-600"],
    .theme-light button[class*="bg-cyan-600"],
    .theme-light button[class*="bg-emerald-600"],
    .theme-light button[class*="bg-red-600"],
    .theme-light button[class*="bg-rose-600"],
    .theme-light button[class*="bg-indigo-600"],
    .theme-light a[class*="bg-sky-600"],
    .theme-light a[class*="bg-blue-600"],
    .theme-light a[class*="bg-cyan-600"],
    .theme-light a[class*="bg-emerald-600"],
    .theme-light a[class*="bg-red-600"],
    .theme-light [class*="bg-gradient-"] .text-white,
    .theme-light [class*="bg-gradient-"][class*="text-white"],
    .theme-light [class*="bg-sky-600"] .text-white,
    .theme-light [class*="bg-blue-600"] .text-white,
    .theme-light [class*="bg-cyan-600"] .text-white,
    .theme-light [class*="bg-emerald-600"] .text-white,
    .theme-light [class*="bg-red-600"] .text-white,
    .theme-light [class*="bg-rose-600"] .text-white,
    .theme-light [class*="bg-indigo-600"] .text-white {
      color: #ffffff !important;
    }

    /* HTML Tables & Log Viewers */
    .theme-light thead,
    .theme-light thead tr,
    .theme-light thead th,
    .theme-light thead[class*="bg-slate-"],
    .theme-light tr[class*="bg-slate-900"],
    .theme-light tr[class*="bg-slate-950"] {
      background-color: #f8fafc !important;
      color: #475569 !important;
      border-color: #e2e8f0 !important;
    }
    .theme-light tbody tr {
      background-color: #ffffff !important;
      color: #1e293b !important;
    }
    .theme-light tbody tr:hover {
      background-color: #f8fafc !important;
    }
    .theme-light td,
    .theme-light th {
      border-color: #e2e8f0 !important;
    }

    /* Pre, Code, and Monospace Logs */
    .theme-light pre,
    .theme-light code {
      background-color: #f1f5f9 !important;
      color: #0f172a !important;
      border-color: #cbd5e1 !important;
    }

    .theme-light input,
    .theme-light select,
    .theme-light textarea {
      background-color: #ffffff !important;
      color: #0f172a !important;
      border-color: #cbd5e1 !important;
    }
    .theme-light input::placeholder,
    .theme-light textarea::placeholder {
      color: #94a3b8 !important;
    }
    .theme-light input:focus,
    .theme-light select:focus,
    .theme-light textarea:focus {
      border-color: #0284c7 !important;
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15) !important;
    }

    .theme-light .nav-item {
      color: #475569 !important;
    }
    .theme-light .nav-item:hover {
      color: #0f172a !important;
      background-color: #f1f5f9 !important;
    }
    .theme-light .nav-item.active {
      color: #0284c7 !important;
      background-color: #e0f2fe !important;
      border: 1px solid #bae6fd !important;
      box-shadow: none !important;
    }

    .theme-light .tabulator {
      background-color: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      color: #0f172a !important;
    }
    .theme-light .tabulator .tabulator-header {
      background-color: #f8fafc !important;
      border-bottom: 2px solid #e2e8f0 !important;
      color: #475569 !important;
    }
    .theme-light .tabulator .tabulator-header .tabulator-col {
      background-color: #f8fafc !important;
      border-right: 1px solid #f1f5f9 !important;
    }
    .theme-light .tabulator .tabulator-row {
      background-color: #ffffff !important;
      border-bottom: 1px solid #f1f5f9 !important;
      color: #1e293b !important;
    }
    .theme-light .tabulator .tabulator-row:hover {
      background-color: #f8fafc !important;
    }
    .theme-light .tabulator .tabulator-row.tabulator-selected {
      background-color: #f0f9ff !important;
      color: #0369a1 !important;
      box-shadow: inset 0 0 0 1px rgba(2, 132, 199, 0.3) !important;
    }
    .theme-light .tabulator .tabulator-row.tabulator-selected .tabulator-cell {
      background-color: rgba(2, 132, 199, 0.06) !important;
      color: #0369a1 !important;
    }
    .theme-light .tabulator .tabulator-row.tabulator-selected .tabulator-cell:first-child {
      background-color: #0284c7 !important;
      color: #ffffff !important;
    }
    .theme-light .tabulator .tabulator-cell {
      border-right: 1px solid #f1f5f9 !important;
    }

    .theme-light .custom-scroll::-webkit-scrollbar-track {
      background: #f8fafc !important;
    }
    .theme-light .custom-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1 !important;
      border: 2px solid #f8fafc !important;
    }
    .theme-light .custom-scroll::-webkit-scrollbar-thumb:hover {
      background: #94a3b8 !important;
    }

    .theme-toggle-btn {
      transition: all 0.15s ease;
    }
    .theme-light .theme-toggle-btn {
      background-color: #ffffff !important;
      border-color: #cbd5e1 !important;
      color: #334155 !important;
    }
    .theme-light .theme-toggle-btn:hover {
      background-color: #f1f5f9 !important;
      border-color: #94a3b8 !important;
      color: #0f172a !important;
    }
    .theme-dark .theme-toggle-btn {
      background-color: rgba(15, 23, 42, 0.9) !important;
      border-color: #334155 !important;
      color: #cbd5e1 !important;
    }
    .theme-dark .theme-toggle-btn:hover {
      background-color: #1e293b !important;
      border-color: #475569 !important;
      color: #ffffff !important;
    }
    body.page-transitioning {
      opacity: 0;
      transform: translateY(-4px);
      pointer-events: none;
    }
    .font-mono { font-family: 'JetBrains Mono', monospace !important; }
    .custom-scroll::-webkit-scrollbar { width: 6px; height: 10px; }
    .custom-scroll::-webkit-scrollbar-track { background: #090d16; border-radius: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #475569; border-radius: 6px; border: 2px solid #090d16; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #64748b; }

    /* Top Horizontal Scrollbar */
    .top-horizontal-scroll {
      height: 14px;
      overflow-y: hidden;
    }
    .top-horizontal-scroll::-webkit-scrollbar {
      height: 10px;
    }
    .top-horizontal-scroll::-webkit-scrollbar-track {
      background: #090d16;
      border-radius: 6px;
    }
    .top-horizontal-scroll::-webkit-scrollbar-thumb {
      background: #7c3aed;
      border-radius: 6px;
      border: 2px solid #090d16;
    }
    .top-horizontal-scroll::-webkit-scrollbar-thumb:hover {
      background: #9333ea;
    }

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
    [v-cloak] { display: none !important; }
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
  <div id="app" v-cloak class="flex-1 flex flex-col" @click="handleGlobalClick">
    
    <!-- TOP APP BAR -->
    <header class="glass-header sticky top-0 z-40 px-4 sm:px-6 h-14 flex items-center justify-between">
      <!-- Left Logo & Menu (Click to return to Dashboard) -->
      <div class="flex items-center gap-3">
        <button
          @click="returnToHome"
          title="Return to Dashboard Home"
          class="flex items-center gap-2.5 text-white font-extrabold text-sm tracking-tight text-decoration-none hover:opacity-90 transition cursor-pointer"
        >
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center p-0.5 shadow-inner overflow-hidden">
            <img src="/images/logo-navbar.png" onerror="this.onerror=null; this.src='/images/logo-full.png'; this.onerror=function(){this.src='/images/favicon.png';};" class="w-full h-full object-contain rounded-md" alt="Daviteq Logo" />
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

      <!-- Right Actions & User Menu -->
      <div class="flex items-center gap-2.5">
        <!-- User Menu Dropdown Button -->
        <div class="relative">
          <button
            @click.stop="userMenuOpen = !userMenuOpen"
            class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer select-none"
          >
            <div class="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs">
              {{ userInitials }}
            </div>
            <span class="text-xs font-bold text-slate-200 hidden sm:inline">{{ currentUser.fullName || currentUser.username || 'User' }}</span>
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

            <!-- Theme Mode Selection: Light / Dark -->
            <div class="space-y-1.5 pb-3 border-b border-slate-800">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Theme Mode</div>
              <div class="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <button
                  type="button"
                  @click="setTheme('light')"
                  class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer select-none"
                  :class="currentTheme === 'light' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-200'"
                >
                  <i class="fa-solid fa-sun text-amber-500 text-[11px]"></i>
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  @click="setTheme('dark')"
                  class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer select-none"
                  :class="currentTheme === 'dark' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-slate-200'"
                >
                  <i class="fa-solid fa-moon text-sky-400 text-[11px]"></i>
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <!-- Portal Switch Navigation Links -->
            <div class="space-y-1 text-xs pb-3 border-b border-slate-800">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-1">Switch View</div>
              
              <div class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
                <span class="flex items-center gap-2"><i class="fa-solid fa-layer-group"></i> User Dashboard</span>
                <span class="text-[9px] font-mono font-bold uppercase bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-300">Active</span>
              </div>

              <button
                v-if="isSuperAdmin"
                @click="navigateTo('/control-panel')"
                class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition flex items-center justify-between cursor-pointer"
              >
                <span class="flex items-center gap-2"><i class="fa-solid fa-sliders text-sky-400"></i> Admin Control Panel</span>
                <i class="fa-solid fa-arrow-right text-[10px] text-slate-500"></i>
              </button>

              <a
                v-if="isSuperAdmin"
                :href="standaloneOpsUrl"
                target="_blank"
                class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition flex items-center justify-between cursor-pointer"
                title="Open DevOps & System Lifecycle Console (Port 3099)"
              >
                <span class="flex items-center gap-2"><i class="fa-solid fa-bolt text-amber-400"></i> DevOps Ops Manager</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-amber-400/80"></i>
              </a>
            </div>

            <!-- App Version -->
            <div class="space-y-1 text-xs text-slate-400 pb-3 border-b border-slate-800">
              <div class="flex items-center justify-between text-[11px]">
                <span>Platform:</span>
                <strong class="text-slate-200">Daviteq LoRaWAN</strong>
              </div>
              <div class="flex items-center justify-between text-[11px]">
                <span>Core Engine:</span>
                <strong class="text-emerald-400 font-mono">v1.0.0 (NestJS)</strong>
              </div>
            </div>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              class="w-full py-2 px-3 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <i class="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- MAIN BODY CONTAINER -->
    <main class="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
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
          </div>
        </div>

        <!-- Grid of Action Feature Buttons / Cards (12-Column Responsive Layout) -->
        <div class="grid grid-cols-12 gap-4 sm:gap-6">
          <div
            v-for="feature in accessibleFeatures"
            :key="feature.id"
            @click="openFeature(feature)"
            class="glass-card rounded-2xl p-5 sm:p-6 space-y-4 cursor-pointer group flex flex-col justify-between hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-200"
            :class="feature.span === 2 ? 'col-span-12 md:col-span-12 lg:col-span-8' : 'col-span-12 sm:col-span-6 lg:col-span-4'"
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
          <h3 class="text-sm font-bold text-white">No Assigned Dashboard Modules</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Your account currently has no dashboard modules assigned. Please contact your Super Administrator to configure role permissions.
          </p>
        </div>
      </div>

      <!-- MODE 2: ACTIVE FEATURE MODULE VIEW -->
      <div v-else class="space-y-4">
        <!-- Feature Content Container -->
        <div class="glass-card rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6">
          
          <!-- FEATURE: DEVICE MANAGER (CARD GRID) -->

          ${DEVICE_MANAGER_TEMPLATE}

          ${TELEMETRY_TEMPLATE}

          ${HMI_SCADA_TEMPLATE}

          ${DOWNLINK_TEMPLATE}

          ${SERIAL_UART_TEMPLATE}
 
          ${TEST_AUTOMATION_TEMPLATE}

          <!-- General Module Template for independent module source extension -->
          <div v-else class="text-center py-10 space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 text-2xl mx-auto shadow-inner">
              <i :class="activeFeature.icon"></i>
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-white">{{ activeFeature.title }} Module</h3>
              <p class="text-xs text-slate-400 max-w-md mx-auto">{{ activeFeature.description }}</p>
            </div>
            <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 max-w-lg mx-auto text-xs text-slate-400">
              <span class="font-bold text-slate-300">Feature Code:</span> <code class="text-sky-400 font-mono">{{ activeFeature.code }}</code>
            </div>
          </div>

        </div>
      </div>

    </main>


    <!-- MODAL POPUPS CONTAINER -->
    <div class="fixed-modals-root">

      ${DEVICE_MANAGER_MODALS}

      ${HMI_SCADA_MODALS}

      ${DOWNLINK_MODALS}

      ${SERIAL_UART_MODALS}
 
      ${TEST_AUTOMATION_MODALS}

    </div>

    <!-- TOAST NOTIFICATION -->
    <div v-if="toast.show" class="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold" :class="toast.type === 'error' ? 'bg-red-950 border border-red-500 text-red-200' : (toast.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-200' : 'bg-sky-950 border border-sky-500 text-sky-200')">
      <i :class="toast.type === 'error' ? 'fa-solid fa-circle-exclamation text-red-400' : (toast.type === 'success' ? 'fa-solid fa-circle-check text-emerald-400' : 'fa-solid fa-circle-info text-sky-400')"></i>
      <span>{{ toast.text }}</span>
    </div>

  </div>


  <!-- Vue 3 with multiple CDN failover mirrors -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.31/vue.global.prod.min.js"></script>
  <script>
    if (typeof Vue === 'undefined') {
      document.write('<script src="https://cdn.jsdelivr.net/npm/vue@3.4.31/dist/vue.global.prod.js"><\\\\/script>');
    }
  </script>
  <script>
    if (typeof Vue === 'undefined') {
      document.write('<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"><\\\\/script>');
    }
  </script>
  <script>
    // Fail-safe: remove v-cloak if error happens or Vue fails to mount within 2.5s
    window.addEventListener('error', function(e) {
      console.error('[Global Page Error]:', e.error || e.message);
      var appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        appEl.removeAttribute('v-cloak');
      }
    });
    setTimeout(function() {
      var appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        console.warn('Vue mounting safety timer triggered: removing v-cloak');
        appEl.removeAttribute('v-cloak');
      }
    }, 2500);


    ${HMI_SCADA_SCRIPT}

    ${DOWNLINK_SCRIPT}

    ${SERIAL_UART_SCRIPT}
 
    ${TEST_AUTOMATION_SCRIPT}

    const { createApp, ref, computed, onMounted, onUnmounted, nextTick, watch } = Vue;

    const app = createApp({
      setup() {
        const currentUser = ref({});
        const currentTheme = ref(typeof localStorage !== 'undefined' ? (localStorage.getItem('dvt_theme') === 'dark' ? 'dark' : 'light') : 'light');
        const setTheme = (theme) => {
          currentTheme.value = theme;
          try {
            localStorage.setItem('dvt_theme', theme);
          } catch(e) {}
          if (theme === 'dark') {
            document.documentElement.classList.remove('theme-light');
            document.documentElement.classList.add('theme-dark');
          } else {
            document.documentElement.classList.remove('theme-dark');
            document.documentElement.classList.add('theme-light');
          }
        };
        const toggleTheme = () => {
          setTheme(currentTheme.value === 'light' ? 'dark' : 'light');
        };
        const accessibleFeatures = ref([]);
        const activeFeature = ref(null);
        const userMenuOpen = ref(false);
        const standaloneOpsUrl = computed(() => {
          const host = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost';
          return 'http://' + host + ':3099/manager';
        });

        const telemetryList = ref([]);
        const devicesList = ref([]);
        const networkServersList = ref([]);
        const selectedTelemetryDeviceEUI = ref('');
        const selectedTelemetryDevice = computed(() => {
          if (!selectedTelemetryDeviceEUI.value) return null;
          return devicesList.value.find(d => (d.devEUI || '').toUpperCase() === selectedTelemetryDeviceEUI.value.toUpperCase()) || null;
        });
        const loadingTelemetry = ref(false);
        const activeTelemetryPacket = ref(null);
        const telemetryViewMode = ref('tabular');

        // Advanced Filtering, Sorting & Auto-Sync state
        const telemetryTimeFilter = ref('ALL');
        const telemetryRangeStart = ref('');
        const telemetryRangeEnd = ref('');
        const telemetrySearchQuery = ref('');
        const telemetrySortKey = ref('time');
        const telemetrySortOrder = ref('desc');
        const autoSyncEnabled = ref(true);
        const autoSyncTimer = ref(null);
        const autoSyncInterval = 3000;
        const lastSyncTime = ref(null);
        const telemetryLoaded = ref(false); // table stays empty until user clicks SHOW

        // Export Dropdown state
        const exportDropdownOpen = ref(false);

        // Column visibility filter
        const columnFilterOpen = ref(false);
        const metadataColumnsList = [
          { key: 'fPort', label: 'FPORT' },
          { key: 'fCnt', label: 'FCNT' },
          { key: 'rssi', label: 'RSSI' },
          { key: 'snr', label: 'SNR' },
          { key: 'payloadHex', label: 'PAYLOAD HEX' },
        ];
        const hiddenMetadataColumns = ref(new Set());
        const hiddenSensorColumns = ref(new Set());

        const toggleMetadataColumn = (key) => {
          const s = new Set(hiddenMetadataColumns.value);
          if (s.has(key)) { s.delete(key); } else { s.add(key); }
          hiddenMetadataColumns.value = s;
        };

        const isMetadataColumnVisible = (key) => !hiddenMetadataColumns.value.has(key);

        const totalHiddenColumnsCount = computed(() => {
          return hiddenMetadataColumns.value.size + hiddenSensorColumns.value.size;
        });

        const showAllColumns = () => {
          hiddenMetadataColumns.value = new Set();
          hiddenSensorColumns.value = new Set();
        };

        const resetDefaultColumns = () => {
          hiddenMetadataColumns.value = new Set();
          hiddenSensorColumns.value = new Set();
        };

        const hideAllSensorColumns = () => {
          hiddenSensorColumns.value = new Set(dashboardSensorColumns.value);
        };

        // Pagination state
        const telemetryPage = ref(1);
        const telemetryPageSize = ref(50); // 25, 50, 100, 250, 500, 'ALL'

        // Synchronized Horizontal Scrollbars state
        const topScrollRef = ref(null);
        const tableScrollRef = ref(null);
        const telemetryTableRef = ref(null);
        const tableScrollWidth = ref(1000);
        const tableHasHorizontalOverflow = ref(false);
        let isSyncingScroll = false;

        const filteredTelemetryList = computed(() => {
          if (!telemetryLoaded.value) return [];
          let list = telemetryList.value || [];
          if (selectedTelemetryDeviceEUI.value) {
            const eui = selectedTelemetryDeviceEUI.value.toUpperCase();
            list = list.filter(t => (t.devEui || t.devEUI || '').toUpperCase() === eui);
          }
          return list;
        });

        const activeDecodedFields = computed(() => {
          if (!activeTelemetryPacket.value) return [];
          const pkt = activeTelemetryPacket.value;
          const dataObj = pkt.decodedData || pkt.object || null;
          if (!dataObj) return [];
          const res = [];
          const extractFields = (obj, prefix = '') => {
            if (!obj || typeof obj !== 'object') return;
            for (const [k, v] of Object.entries(obj)) {
              const fullKey = prefix ? prefix + '.' + k : k;
              if (v === null || v === undefined) {
                res.push({ key: fullKey, value: 'null', type: 'null' });
              } else if (typeof v === 'object' && !Array.isArray(v)) {
                extractFields(v, fullKey);
              } else if (Array.isArray(v)) {
                res.push({ key: fullKey, value: JSON.stringify(v), type: 'array' });
              } else {
                res.push({ key: fullKey, value: String(v), type: typeof v });
              }
            }
          };
          if (dataObj.data && typeof dataObj.data === 'object') {
            extractFields(dataObj.data);
          } else {
            extractFields(dataObj);
          }
          return res;
        });

        const flattenDashboardFields = (obj, prefix = '') => {
          const res = {};
          if (!obj || typeof obj !== 'object') return res;
          for (const [k, v] of Object.entries(obj)) {
            const fullKey = prefix ? prefix + '.' + k : k;
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
              Object.assign(res, flattenDashboardFields(v, fullKey));
            } else {
              res[fullKey] = v;
            }
          }
          return res;
        };

        const EXCLUDED_COLUMNS = new Set([
          'errors', 'warnings', 'fPort', 'fCnt', 'devEUI', 'deviceName', 'gatewayId',
          'rssi', 'snr', 'devEui', 'dr', 'adr', 'channel', 'frequency', 'bandwidth',
          'spreadingFactor', 'tenantId', 'applicationId', 'serverType'
        ]);

        const getFlattenedData = (pkt) => {
          if (!pkt) return {};
          if (pkt._cachedFlat) return pkt._cachedFlat;
          const decoded = pkt.decodedData || pkt.object || null;
          if (!decoded) {
            pkt._cachedFlat = {};
            return pkt._cachedFlat;
          }
          const dataObj = decoded.data && typeof decoded.data === 'object' ? decoded.data : decoded;
          pkt._cachedFlat = flattenDashboardFields(dataObj);
          return pkt._cachedFlat;
        };

        const dashboardSensorColumns = computed(() => {
          const colSet = new Set();
          const list = filteredTelemetryList.value || [];
          for (let i = 0; i < list.length; i++) {
            const flat = getFlattenedData(list[i]);
            for (const k of Object.keys(flat)) {
              if (!EXCLUDED_COLUMNS.has(k)) {
                colSet.add(k);
              }
            }
          }
          return Array.from(colSet).sort();
        });

        const dashboardMatrixRows = computed(() => {
          const list = filteredTelemetryList.value || [];
          const cols = dashboardSensorColumns.value;
          const len = list.length;
          const res = new Array(len);
          for (let i = 0; i < len; i++) {
            const pkt = list[i];
            const flat = getFlattenedData(pkt);
            const sensorValues = {};
            for (let j = 0; j < cols.length; j++) {
              const c = cols[j];
              const val = flat[c];
              if (val === undefined || val === null) {
                sensorValues[c] = '—';
              } else if (typeof val === 'object') {
                sensorValues[c] = JSON.stringify(val);
              } else if (typeof val === 'number') {
                sensorValues[c] = Number.isInteger(val) ? val : Number(val.toFixed(3));
              } else {
                sensorValues[c] = String(val);
              }
            }
            res[i] = {
              raw: pkt,
              time: pkt.timestamp || pkt.receivedAt,
              fPort: pkt.fPort || 1,
              fCnt: pkt.fCnt !== undefined && pkt.fCnt !== null ? pkt.fCnt : 0,
              rssi: pkt.rssi != null ? pkt.rssi : null,
              snr: pkt.snr != null ? pkt.snr : null,
              payloadHex: pkt.payloadHex || pkt.data || '—',
              sensorValues: sensorValues
            };
          }
          return res;
        });

        const passesTimeFilter = (timestamp, filter) => {
          if (!filter || filter === 'ALL') return true;
          if (!timestamp) return false;
          const time = new Date(timestamp).getTime();
          if (isNaN(time)) return false;
          const now = Date.now();
          const diffMs = now - time;
          if (filter === '15M') return diffMs <= 15 * 60 * 1000;
          if (filter === '1H') return diffMs <= 60 * 60 * 1000;
          if (filter === '24H') return diffMs <= 24 * 60 * 60 * 1000;
          if (filter === '7D') return diffMs <= 7 * 24 * 60 * 60 * 1000;
          return true;
        };

        const filteredDashboardMatrixRows = computed(() => {
          let rows = dashboardMatrixRows.value || [];

          // Filter by custom date range (start / end)
          const rangeStart = telemetryRangeStart.value ? new Date(telemetryRangeStart.value).getTime() : null;
          const rangeEnd = telemetryRangeEnd.value ? new Date(telemetryRangeEnd.value + ':59').getTime() : null;
          if (rangeStart || rangeEnd) {
            rows = rows.filter(r => {
              const t = r.time ? new Date(r.time).getTime() : null;
              if (!t || isNaN(t)) return false;
              if (rangeStart && t < rangeStart) return false;
              if (rangeEnd && t > rangeEnd) return false;
              return true;
            });
          }

          // Filter by search query
          const q = (telemetrySearchQuery.value || '').trim().toLowerCase();
          if (q) {
            rows = rows.filter(r => {
              if (r.time && String(r.time).toLowerCase().includes(q)) return true;
              if (formatDateTime(r.time).toLowerCase().includes(q)) return true;
              if (String(r.fPort).toLowerCase().includes(q)) return true;
              if (String(r.fCnt).toLowerCase().includes(q)) return true;
              if (r.rssi != null && String(r.rssi).includes(q)) return true;
              if (r.snr != null && String(r.snr).includes(q)) return true;
              if (r.payloadHex && r.payloadHex.toLowerCase().includes(q)) return true;
              for (const [k, v] of Object.entries(r.sensorValues)) {
                if (k.toLowerCase().includes(q)) return true;
                if (String(v).toLowerCase().includes(q)) return true;
              }
              return false;
            });
          }

          return rows;
        });

        const sortedDashboardMatrixRows = computed(() => {
          const list = [...filteredDashboardMatrixRows.value];
          const key = telemetrySortKey.value;
          const order = telemetrySortOrder.value === 'asc' ? 1 : -1;

          return list.sort((a, b) => {
            if (key === 'time') {
              const tA = a.time ? new Date(a.time).getTime() : 0;
              const tB = b.time ? new Date(b.time).getTime() : 0;
              return (tA - tB) * order;
            }
            if (key === 'fPort' || key === 'fCnt' || key === 'rssi' || key === 'snr') {
              const vA = a[key] != null ? Number(a[key]) : (order === 1 ? Infinity : -Infinity);
              const vB = b[key] != null ? Number(b[key]) : (order === 1 ? Infinity : -Infinity);
              return (vA - vB) * order;
            }
            if (key === 'payloadHex') {
              const vA = String(a.payloadHex || '');
              const vB = String(b.payloadHex || '');
              return vA.localeCompare(vB) * order;
            }
            if (key.startsWith('sensor:')) {
              const col = key.replace('sensor:', '');
              const sA = a.sensorValues[col];
              const sB = b.sensorValues[col];
              if (sA === '—' && sB === '—') return 0;
              if (sA === '—') return 1;
              if (sB === '—') return -1;
              const numA = Number(sA);
              const numB = Number(sB);
              if (!isNaN(numA) && !isNaN(numB)) {
                return (numA - numB) * order;
              }
              return String(sA).localeCompare(String(sB)) * order;
            }
            return 0;
          });
        });

        const totalTelemetryPages = computed(() => {
          if (telemetryPageSize.value === 'ALL') return 1;
          const sz = Number(telemetryPageSize.value) || 50;
          const total = sortedDashboardMatrixRows.value.length;
          return Math.max(1, Math.ceil(total / sz));
        });

        const paginatedDashboardMatrixRows = computed(() => {
          const rows = sortedDashboardMatrixRows.value || [];
          if (telemetryPageSize.value === 'ALL') return rows;
          const sz = Number(telemetryPageSize.value) || 50;
          const curPage = Math.min(Math.max(1, telemetryPage.value), totalTelemetryPages.value);
          const start = (curPage - 1) * sz;
          return rows.slice(start, start + sz);
        });

        const paginationRangeText = computed(() => {
          const total = sortedDashboardMatrixRows.value.length;
          if (total === 0) return '0';
          if (telemetryPageSize.value === 'ALL') return '1 – ' + total;
          const sz = Number(telemetryPageSize.value) || 50;
          const curPage = Math.min(Math.max(1, telemetryPage.value), totalTelemetryPages.value);
          const start = (curPage - 1) * sz + 1;
          const end = Math.min(curPage * sz, total);
          return start + ' – ' + end;
        });

        const visiblePageNumbers = computed(() => {
          const cur = telemetryPage.value;
          const total = totalTelemetryPages.value;
          if (total <= 7) {
            const pages = [];
            for (let i = 1; i <= total; i++) pages.push(i);
            return pages;
          }
          const pages = [1];
          if (cur > 3) pages.push('...');
          const start = Math.max(2, cur - 1);
          const end = Math.min(total - 1, cur + 1);
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
          if (cur < total - 2) pages.push('...');
          pages.push(total);
          return pages;
        });

        const setTelemetryPage = (p) => {
          const maxP = totalTelemetryPages.value;
          telemetryPage.value = Math.min(Math.max(1, p), maxP);
          if (tableScrollRef.value) {
            tableScrollRef.value.scrollTop = 0;
          }
        };

        const nextTelemetryPage = () => {
          if (telemetryPage.value < totalTelemetryPages.value) {
            setTelemetryPage(telemetryPage.value + 1);
          }
        };

        const prevTelemetryPage = () => {
          if (telemetryPage.value > 1) {
            setTelemetryPage(telemetryPage.value - 1);
          }
        };

        watch([telemetrySearchQuery, telemetryRangeStart, telemetryRangeEnd, telemetryTimeFilter, selectedTelemetryDeviceEUI], () => {
          telemetryPage.value = 1;
        });

        watch(totalTelemetryPages, (newTotal) => {
          if (telemetryPage.value > newTotal) {
            telemetryPage.value = Math.max(1, newTotal);
          }
        });

        const toggleTelemetrySort = (key) => {
          if (telemetrySortKey.value === key) {
            telemetrySortOrder.value = telemetrySortOrder.value === 'asc' ? 'desc' : 'asc';
          } else {
            telemetrySortKey.value = key;
            telemetrySortOrder.value = key === 'time' ? 'desc' : 'asc';
          }
        };

        const resetTelemetryFilters = () => {
          telemetryTimeFilter.value = 'ALL';
          telemetryRangeStart.value = '';
          telemetryRangeEnd.value = '';
          telemetrySearchQuery.value = '';
          telemetrySortKey.value = 'time';
          telemetrySortOrder.value = 'desc';
          telemetryPage.value = 1;
        };

        const isTelemetryFilterActive = computed(() => {
          return Boolean(telemetryRangeStart.value) ||
                 Boolean(telemetryRangeEnd.value) ||
                 Boolean((telemetrySearchQuery.value || '').trim());
        });

        const toggleSensorColumn = (col) => {
          const s = new Set(hiddenSensorColumns.value);
          if (s.has(col)) { s.delete(col); } else { s.add(col); }
          hiddenSensorColumns.value = s;
        };

        const isSensorColumnVisible = (col) => !hiddenSensorColumns.value.has(col);

        const updateScrollDimensions = () => {
          if (telemetryTableRef.value && tableScrollRef.value) {
            const tableWidth = telemetryTableRef.value.scrollWidth || 0;
            const containerWidth = tableScrollRef.value.clientWidth || 0;
            tableScrollWidth.value = tableWidth;
            tableHasHorizontalOverflow.value = tableWidth > containerWidth + 2;
            if (topScrollRef.value) {
              topScrollRef.value.scrollLeft = tableScrollRef.value.scrollLeft;
            }
          }
        };

        const handleTopScroll = () => {
          if (isSyncingScroll) return;
          isSyncingScroll = true;
          if (tableScrollRef.value && topScrollRef.value) {
            tableScrollRef.value.scrollLeft = topScrollRef.value.scrollLeft;
          }
          requestAnimationFrame(() => { isSyncingScroll = false; });
        };

        const handleTableScroll = () => {
          if (isSyncingScroll) return;
          isSyncingScroll = true;
          if (topScrollRef.value && tableScrollRef.value) {
            topScrollRef.value.scrollLeft = tableScrollRef.value.scrollLeft;
          }
          requestAnimationFrame(() => { isSyncingScroll = false; });
        };

        const downloadBlob = (blob, filename) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        const exportHtmlXlsFallback = (headers, data, filename) => {
          let tableHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
          tableHtml += '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Telemetry</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
          tableHtml += '<body><table border="1">';
          tableHtml += '<thead style="background-color:#0f172a;color:#f8fafc;font-weight:bold;"><tr>';
          for (const h of headers) {
            tableHtml += '<th style="padding:6px 12px;background:#0f172a;color:#fff;">' + h + '</th>';
          }
          tableHtml += '</tr></thead><tbody>';
          for (const row of data) {
            tableHtml += '<tr>';
            for (const cell of row) {
              tableHtml += '<td style="padding:4px 8px;">' + (cell !== undefined && cell !== null ? String(cell) : '') + '</td>';
            }
            tableHtml += '</tr>';
          }
          tableHtml += '</tbody></table></body></html>';
          const blob = new Blob(['\\\\uFEFF' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
          downloadBlob(blob, filename);
          showToast('Exported ' + data.length + ' rows to Excel successfully', 'success');
        };

        const exportTelemetry = (format = 'xlsx') => {
          exportDropdownOpen.value = false;
          const rows = sortedDashboardMatrixRows.value || [];
          if (rows.length === 0) {
            showToast('No telemetry data available to export', 'error');
            return;
          }

          const devEui = selectedTelemetryDeviceEUI.value || 'ALL';
          const now = new Date();
          const pad = (n) => String(n).padStart(2, '0');
          const dateStr = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
          const baseFileName = 'telemetry_' + devEui + '_' + dateStr;

          // Headers: TIME + visible metadata + visible sensor columns + payload hex
          const visibleSensors = dashboardSensorColumns.value.filter(c => isSensorColumnVisible(c));
          const headers = ['TIME'];
          if (isMetadataColumnVisible('fPort')) headers.push('FPORT');
          if (isMetadataColumnVisible('fCnt')) headers.push('FCNT');
          if (isMetadataColumnVisible('rssi')) headers.push('RSSI');
          if (isMetadataColumnVisible('snr')) headers.push('SNR');
          visibleSensors.forEach(c => headers.push(c.toUpperCase()));
          if (isMetadataColumnVisible('payloadHex') || visibleSensors.length === 0) {
            headers.push('PAYLOAD_HEX');
          }

          // Data rows
          const exportData = rows.map(r => {
            const rowItem = [formatDateTime(r.time)];
            if (isMetadataColumnVisible('fPort')) rowItem.push(r.fPort != null ? r.fPort : '');
            if (isMetadataColumnVisible('fCnt')) rowItem.push(r.fCnt != null ? r.fCnt : '');
            if (isMetadataColumnVisible('rssi')) rowItem.push(r.rssi != null ? r.rssi : '');
            if (isMetadataColumnVisible('snr')) rowItem.push(r.snr != null ? r.snr : '');
            for (const c of visibleSensors) {
              const val = r.sensorValues[c];
              rowItem.push(val !== undefined && val !== null && val !== '—' ? val : '');
            }
            if (isMetadataColumnVisible('payloadHex') || visibleSensors.length === 0) {
              rowItem.push(r.payloadHex || '');
            }
            return rowItem;
          });

          if (format === 'csv') {
            const csvLines = [];
            csvLines.push(headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(','));
            for (const r of exportData) {
              csvLines.push(r.map(v => '"' + String(v !== undefined && v !== null ? v : '').replace(/"/g, '""') + '"').join(','));
            }
            const csvContent = csvLines.join('\\\\r\\\\n');
            const blob = new Blob(['\\\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            downloadBlob(blob, baseFileName + '.csv');
            showToast('Exported ' + rows.length + ' rows to CSV successfully', 'success');
          } else if (format === 'xlsx' || format === 'xls') {
            if (typeof XLSX !== 'undefined') {
              try {
                const aoa = [headers, ...exportData];
                const ws = XLSX.utils.aoa_to_sheet(aoa);
                ws['!cols'] = headers.map((h, colIdx) => {
                  let maxLen = h.length;
                  for (let i = 0; i < Math.min(exportData.length, 200); i++) {
                    const cellVal = String(exportData[i][colIdx] || '');
                    if (cellVal.length > maxLen) maxLen = cellVal.length;
                  }
                  return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
                });
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Telemetry');
                const bookType = format === 'xls' ? 'biff8' : 'xlsx';
                XLSX.writeFile(wb, baseFileName + '.' + format, { bookType });
                showToast('Exported ' + rows.length + ' rows to ' + format.toUpperCase() + ' successfully', 'success');
              } catch(err) {
                console.error('SheetJS export error, using fallback:', err);
                exportHtmlXlsFallback(headers, exportData, baseFileName + '.' + format);
              }
            } else {
              exportHtmlXlsFallback(headers, exportData, baseFileName + '.' + format);
            }
          }
        };

        const startAutoSync = () => {
          stopAutoSync();
          autoSyncTimer.value = setInterval(() => {
            if (activeFeature.value && (activeFeature.value.id === 'telemetry-decoder' || activeFeature.value.id === 'live-telemetry')) {
              if (telemetryLoaded.value && selectedTelemetryDeviceEUI.value) {
                fetchLiveTelemetry(true);
              }
            }
          }, autoSyncInterval);
        };

        const stopAutoSync = () => {
          if (autoSyncTimer.value) {
            clearInterval(autoSyncTimer.value);
            autoSyncTimer.value = null;
          }
        };

        const toggleAutoSync = () => {
          autoSyncEnabled.value = !autoSyncEnabled.value;
          if (autoSyncEnabled.value) {
            if (telemetryLoaded.value && selectedTelemetryDeviceEUI.value) {
              startAutoSync();
              fetchLiveTelemetry(false);
            }
            showToast("Auto-sync enabled (3s live poll)", "info");
          } else {
            stopAutoSync();
            showToast("Auto-sync paused", "info");
          }
        };

        const onSelectTelemetryDevice = () => {
          // Reset data — table stays empty until user clicks SHOW
          activeTelemetryPacket.value = null;
          telemetryLoaded.value = false;
          telemetryList.value = [];
          telemetryPage.value = 1;
          stopAutoSync();
        };

        const showTelemetry = async () => {
          if (!selectedTelemetryDeviceEUI.value) {
            showToast("Please select a device first", "info");
            return;
          }
          telemetryPage.value = 1;
          await fetchLiveTelemetry(false);
          telemetryLoaded.value = true;
          nextTick(updateScrollDimensions);
          if (autoSyncEnabled.value) startAutoSync();
        };

        const clearTelemetry = () => {
          telemetryLoaded.value = false;
          telemetryList.value = [];
          telemetryRangeStart.value = '';
          telemetryRangeEnd.value = '';
          telemetrySearchQuery.value = '';
          selectedTelemetryDeviceEUI.value = '';
          telemetryPage.value = 1;
          stopAutoSync();
        };

        const deleteTelemetry = clearTelemetry;

        const inspectTelemetryPacket = (pkt) => {
          activeTelemetryPacket.value = pkt;
        };

        const closeInspectModal = () => {
          activeTelemetryPacket.value = null;
        };

        const formatDecodedSummary = (obj) => {
          if (!obj) return '—';
          try {
            const target = obj.data && typeof obj.data === 'object' ? obj.data : obj;
            const entries = Object.entries(target).slice(0, 3);
            if (entries.length === 0) return '—';
            return entries.map(([k, v]) => k + ': ' + (typeof v === 'object' ? JSON.stringify(v) : v)).join(' • ');
          } catch(e) {
            return '—';
          }
        };

        const formatDateTime = (dateStr) => {
          if (!dateStr) return '—';
          try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            const hh = String(d.getHours()).padStart(2, '0');
            const mn = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mn + ':' + ss;
          } catch(e) {
            return String(dateStr);
          }
        };

        const registerDeviceDialog = ref(false);
        const isEditingDevice = ref(false);
        const savingDevice = ref(false);
        const deleteConfirmDialog = ref(false);
        const deviceToDelete = ref(null);
        const deletingDevice = ref(false);
        const toast = ref({ show: false, text: '', type: 'info' });

        const showToast = (text, type = 'info') => {
          toast.value = { show: true, text, type };
          setTimeout(() => { toast.value.show = false; }, 3500);
        };

        const newDevice = ref({
          name: '',
          devEUI: '',
          networkServerId: '',
          regionProfileId: '',
          sku: '',
          firmwareVersion: '',
          decoderId: '',
          appEUI: '0102030405060708',
          appKey: '0102030405060708090A0B0C0D0E0F10',
          activationType: 'OTAA',
        });

        const onDeviceSkuOrFwChange = () => {
          if (newDevice.value.firmwareVersion) {
            newDevice.value.firmwareVersion = String(newDevice.value.firmwareVersion).replace(/^[vV]/, '').trim();
          }
          const cleanSku = (newDevice.value.sku || '').trim().toUpperCase();
          const cleanFw = (newDevice.value.firmwareVersion || '').trim();
          if (cleanSku && cleanFw) {
            newDevice.value.decoderId = cleanSku + '_' + cleanFw;
          }
        };

        const formatFirmware = (fw) => {
          if (fw === undefined || fw === null || fw === '') return '—';
          let clean = String(fw).replace(/^[vV]/, '').trim();
          clean = clean.replace(/(\.0+)+$/, '');
          return clean || '—';
        };

        const selectedDeviceNetworkServer = computed(() => {
          if (!newDevice.value.networkServerId) return null;
          return networkServersList.value.find(ns => ns.id === newDevice.value.networkServerId) || null;
        });

        const availableDeviceRegions = computed(() => {
          const ns = selectedDeviceNetworkServer.value;
          if (!ns || !Array.isArray(ns.regionProfiles)) return [];
          return ns.regionProfiles.filter(rp => rp.isActive !== false);
        });

        const deviceSearchQuery = ref('');
        const filteredDevices = computed(() => {
          if (!deviceSearchQuery.value.trim()) return devicesList.value;
          const q = deviceSearchQuery.value.trim().toLowerCase();
          return devicesList.value.filter(d => 
            (d.name && d.name.toLowerCase().includes(q)) ||
            (d.devEUI && d.devEUI.toLowerCase().includes(q)) ||
            (d.sku && d.sku.toLowerCase().includes(q)) ||
            (d.networkServer && d.networkServer.name && d.networkServer.name.toLowerCase().includes(q)) ||
            (d.regionProfileName && d.regionProfileName.toLowerCase().includes(q))
          );
        });

        const onDeviceNetworkServerChange = () => {
          const regions = availableDeviceRegions.value;
          if (regions && regions.length > 0) {
            newDevice.value.regionProfileId = regions[0].id;
          } else {
            newDevice.value.regionProfileId = '';
          }
        };

        const userInitials = computed(() => {
          const name = currentUser.value.fullName || currentUser.value.username || 'U';
          return name.slice(0, 2).toUpperCase();
        });

        const navigateTo = (url) => {
          userMenuOpen.value = false;
          document.body.classList.add('page-transitioning');
          setTimeout(() => {
            window.location.href = url;
          }, 120);
        };

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
          downlinkDeviceDropdownOpen.value = false;
        };


        const copyText = (txt) => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(txt);
            showToast('Hex payload copied to clipboard', 'success');
          }
        };

        // ==========================================
        // D-MODULES COMPOSITIONS
        // ==========================================
        const serialModule = useSerialModule({ showToast, authHeaders, activeFeature, copyText });
        const downlinkModule = useDownlinkModule({ showToast, authHeaders, activeFeature, devicesList, networkServersList, initRealtimeConnection, copyText });
        const hmiModule = useHmiModule({ showToast, authHeaders, activeFeature, devicesList, networkServersList, currentUser, telemetryList, fetchDevices: () => fetchDevices(), fetchNetworkServers: () => fetchNetworkServers(), initRealtimeConnection });
        const testAutomationModule = useTestAutomationModule({
          showToast,
          authHeaders,
          activeFeature,
          copyText,
          devicesList,
          currentUser,
          fetchDevices: () => fetchDevices(),
          initRealtimeConnection,
        });

        // Destructure module variables for seamless template & method access
        const {
          isSerialSupported,
          serialPort,
          serialConnected,
          serialConnecting,
          serialPortInfo,
          serialConfig,
          serialSignals,
          serialStats,
          serialLogs,
          serialLogFilter,
          serialLogViewMode,
          serialPauseScroll,
          serialActiveTab,
          showSettingsDrawer,
          showAddRegisterModal,
          registerSearchQuery,
          selectedModbusPreset,
          rawTx,
          serialTerminalBoxRef,
          csvFileInputRef,
          isPolling,
          pollingIntervalMs,
          batchReading,
          batchWriting,
          modbusPresets,
          modbusRegisters,
          newRegisterForm,
          selectedRowIndices,
          isRowSelected,
          onRowHeaderMouseDown,
          onRowHeaderMouseEnter,
          onRowHeaderClick,
          selectAllRows,
          deleteSelectedRows,
          addNewRegisterRow,
          formatHexAddress,
          formatFCName,
          getFCBadgeClass,
          getLiveValueClass,
          formatLiveValue,
          formatShortTime,
          formatBytes,
          getLogTagClass,
          getLogTextClass,
          filteredSerialLogs,
          isAllRegistersChecked,
          toggleSelectAllRegisters,
          filteredModbusRegisters,
          initSerialModule,
          applySelectedPreset,
          loadModbusPresetBySku,
          selectSerialPort,
          connectSerial,
          disconnectSerial,
          toggleDTR,
          toggleRTS,
          readSingleRegister,
          writeSingleRegister,
          readAllCheckedRegisters,
          writeAllCheckedRegisters,
          toggleContinuousPolling,
          stopContinuousPolling,
          clearAllRegisterValues,
          confirmAddCustomRegister,
          deleteRegisterRow,
          exportRegistersCSV,
          handleImportCSV,
          sendRawCommand,
          copySerialTerminalLogs,
          clearSerialTerminalLogs,
        } = serialModule;

        const {
          downlinkForm,
          downlinkDeviceSearch,
          downlinkHistory,
          loadingDownlinkHistory,
          sendingDownlink,
          downlinkHistoryFilterDevEUI,
          downlinkConfirmModal,
          filteredDownlinkDevices,
          calculatedHexBytes,
          calculatedConfirmBytes,
          selectedDownlinkDevice,
          selectedDownlinkServer,
          downlinkDeviceDropdownOpen,
          selectDownlinkDevice,
          clearSelectedDownlinkDevice,
          onDownlinkDeviceSelect,
          onDownlinkSearchFocus,
          toggleDownlinkDropdown,
          deviceQueue,
          loadingDeviceQueue,
          flushingQueue,
          deviceQueueServerName,
          fetchDeviceQueue,
          startDeviceQueuePolling,
          stopDeviceQueuePolling,
          fetchDownlinkHistory,
          openDownlinkConfirm,
          executeConfirmedDownlink,
          flushConfirmModal,
          openFlushConfirm,
          executeConfirmedFlush,
          flushQueueExplicitly,
          resendDownlink
        } = downlinkModule;

        const {
          publishedHmiScreens,
          selectedHmiScreenId,
          currentHmiScreen,
          hmiLoading,
          hmiViewerMode,
          hmiZoom,
          hmiCanvasViewportRef,
          hmiTelemetryMap,
          hmiTrendHistory,
          hmiWidgetSwitchStates,
          hmiRxPacketCount,
          hmiLastRxTime,
          realtimeConnected,
          fetchPublishedHmiScreens,
          loadSelectedHmiScreen,
          fetchHmiTelemetry,
          refreshHmiViewer,
          fitHmiZoom,
          getWidgetTelemetryValue,
          getWidgetTankHeightPercent,
          getWidgetLiquidColor,
          getWidgetGaugeAngle,
          isWidgetBitOn,
          getWidgetBitLampStyle,
          getWidgetMultiStateLabel,
          getWidgetMultiStateColor,
          getWidgetMultiStateStyle,
          getWidgetMultiStateIcon,
          isWidgetAlarmActive,
          activeAlarmsList,
          isWidgetSwitchOn,
          triggerWidgetToggleSwitch,
          triggerWidgetActionButton,
          trendPointsMap,
          trendHoverState,
          trendSeriesModal,
          trendTargetWidget,
          trendSeriesForm,
          detectedTrendFields,
          loadingTrendFields,
          getTrendSeries,
          getTrendYBounds,
          getTrendXTicks,
          getTrendSeriesPath,
          getTrendSeriesAreaPath,
          getTrendLatestPoint,
          getTrendSeriesLatestVal,
          handleTrendMouseMove,
          handleTrendMouseLeave,
          setTrendTimeRange,
          fetchTrendHistoryForWidget,
          openAddTrendSeriesModal,
          fetchDetectedTrendFields,
          selectTrendTagPill,
          saveTrendSeries,
          removeTrendSeries,
          toggleTrendSeriesVisible,
          getWidgetTrendLegend,
          getWidgetTrendPath,
        } = hmiModule;

        function initRealtimeConnection() {
          if (socketClient || sseSource) return;

          // Try Socket.IO if available
          if (typeof io !== 'undefined') {
            try {
              socketClient = io('/', {
                path: '/socket.io',
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 20,
                reconnectionDelay: 2000,
              });

              socketClient.on('connect', () => {
                realtimeConnected.value = true;
                socketClient.emit('subscribe:telemetry');
                socketClient.emit('subscribe:hmi');
              });

              socketClient.on('disconnect', () => {
                realtimeConnected.value = false;
              });

              socketClient.on('telemetry:uplink', (pkt) => {
                hmiRxPacketCount.value++;
                hmiLastRxTime.value = new Date();
                
                // Prepend to telemetry table list if loaded
                if (telemetryLoaded.value) {
                  telemetryList.value.unshift(pkt);
                }

                // Update HMI tag resolution map
                updateHmiTelemetryMap([pkt]);
              });

              socketClient.on('downlink:status', (event) => {
                if (event) {
                  showToast('Downlink [' + (event.status || 'STATUS') + ']: ' + (event.message || ''), event.success ? 'success' : 'info');
                  if (event.downlinkLog) {
                    downlinkHistory.value.unshift(event.downlinkLog);
                  } else if (activeFeature.value && (activeFeature.value.id === 'lorawan-downlink' || activeFeature.value.id === 'downlink-actuator')) {
                    fetchDownlinkHistory();
                  }
                  if (downlinkForm.value.devEUI) {
                    fetchDeviceQueue(downlinkForm.value.devEUI);
                  }
                }
              });

              // Product Test Automation Realtime Events
              socketClient.on('test_device:packet_received', (data) => {
                testAutomationModule.handleTestRealtimeEvent('test_device:packet_received', data);
              });
              socketClient.on('test_device:status_changed', (data) => {
                testAutomationModule.handleTestRealtimeEvent('test_device:status_changed', data);
              });
              socketClient.on('test_session:progress', (data) => {
                testAutomationModule.handleTestRealtimeEvent('test_session:progress', data);
              });
              socketClient.on('test_session:status_changed', (data) => {
                testAutomationModule.fetchTestSessions();
              });
              socketClient.on('test_session:completed', (data) => {
                showToast('Test Session [' + (data?.sessionCode || '') + '] COMPLETED!', 'success');
                testAutomationModule.fetchTestSessions();
              });

              return;
            } catch(e) {
              console.warn('Socket.IO initialization failed, falling back to SSE:', e);
            }
          }

          // Fallback to Server-Sent Events (SSE)
          if (typeof EventSource !== 'undefined') {
            try {
              sseSource = new EventSource('/api/realtime/stream');
              sseSource.onopen = () => {
                realtimeConnected.value = true;
              };
              sseSource.onerror = () => {
                realtimeConnected.value = false;
              };
              sseSource.onmessage = (e) => {
                try {
                  const ev = JSON.parse(e.data);
                  if (ev.type === 'telemetry') {
                    hmiRxPacketCount.value++;
                    hmiLastRxTime.value = new Date();
                    if (telemetryLoaded.value) {
                      telemetryList.value.unshift(ev.data);
                    }
                    updateHmiTelemetryMap([ev.data]);
                  } else if (ev.type === 'downlink') {
                    showToast('Downlink [' + (ev.data?.status || 'STATUS') + ']: ' + (ev.data?.message || ''), ev.data?.success ? 'success' : 'info');
                    if (ev.data?.downlinkLog) {
                      downlinkHistory.value.unshift(ev.data.downlinkLog);
                    } else if (activeFeature.value && (activeFeature.value.id === 'lorawan-downlink' || activeFeature.value.id === 'downlink-actuator')) {
                      fetchDownlinkHistory();
                    }
                    if (downlinkForm.value.devEUI) {
                      fetchDeviceQueue(downlinkForm.value.devEUI);
                    }
                  }
                } catch(err) {}
              };
            } catch(err) {
              console.error('SSE initialization error:', err);
            }
          }
        };

        const returnToHome = () => {
          stopAutoSync();
          stopDeviceQueuePolling();
          activeFeature.value = null;
          telemetryLoaded.value = false;
          telemetryList.value = [];
          selectedTelemetryDeviceEUI.value = '';
          window.location.hash = '';
        };

        const openFeature = (feature) => {
          stopAutoSync();
          stopDeviceQueuePolling();
          activeFeature.value = feature;
          window.location.hash = feature.id;
          if (feature.id === 'device-manager' || feature.id === 'device-fleet') {
            fetchDevices();
            fetchNetworkServers();
          } else if (feature.id === 'telemetry-decoder' || feature.id === 'live-telemetry') {
            // Reset state — user must select device and click SHOW
            telemetryLoaded.value = false;
            telemetryList.value = [];
            selectedTelemetryDeviceEUI.value = '';
            stopAutoSync();
            fetchDevices();
          } else if (feature.id === 'hmi-scada-viewer') {
            fetchPublishedHmiScreens();
            fetchHmiTelemetry();
            initRealtimeConnection();
          } else if (feature.id === 'lorawan-downlink' || feature.id === 'downlink-actuator') {
            fetchNetworkServers();
            fetchDevices();
            fetchDownlinkHistory();
            if (downlinkForm.value.devEUI) {
              fetchDeviceQueue(downlinkForm.value.devEUI);
            }
            startDeviceQueuePolling();
            initRealtimeConnection();
          } else if (feature.id === 'serial-uart-monitor' || feature.id === 'serial-diagnostic') {
            initSerialModule();
            nextTick(() => {
              if (serialModule && serialModule.initTabulatorTable) {
                serialModule.initTabulatorTable();
              }
            });
          } else if (feature.id === 'test-automation' || feature.id === 'product-test-automation') {
            if (testAutomationModule.fetchSalesOrders) testAutomationModule.fetchSalesOrders();
            testAutomationModule.fetchTestSessions();
            fetchDevices();
            initRealtimeConnection();
          }
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
          const token = getAuthToken();
          if (!token) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('/login');
            return false;
          }
          try {
            const res = await fetch('/auth/session', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              currentUser.value = await res.json();
              return true;
            } else {
              localStorage.clear();
              sessionStorage.clear();
              window.location.replace('/login');
              return false;
            }
          } catch(e) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('/login');
            return false;
          }
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
                if (found) {
                  activeFeature.value = found;
                  if (found.id === 'device-manager' || found.id === 'device-fleet') {
                    fetchDevices();
                    fetchNetworkServers();
                  } else if (found.id === 'telemetry-decoder' || found.id === 'live-telemetry') {
                    telemetryLoaded.value = false;
                    telemetryList.value = [];
                    selectedTelemetryDeviceEUI.value = '';
                    stopAutoSync();
                    fetchDevices();
                  } else if (found.id === 'hmi-scada-viewer') {
                    fetchPublishedHmiScreens();
                    fetchHmiTelemetry();
                    initRealtimeConnection();
                  } else if (found.id === 'lorawan-downlink' || found.id === 'downlink-actuator') {
                    fetchNetworkServers();
                    fetchDevices();
                    fetchDownlinkHistory();
                    if (downlinkForm.value.devEUI) {
                      fetchDeviceQueue(downlinkForm.value.devEUI);
                    }
                    startDeviceQueuePolling();
                    initRealtimeConnection();
                  } else if (found.id === 'serial-uart-monitor' || found.id === 'serial-diagnostic') {
                    initSerialModule();
                    nextTick(() => {
                      if (serialModule && serialModule.initTabulatorTable) {
                        serialModule.initTabulatorTable();
                      }
                    });
                  } else if (found.id === 'test-automation' || found.id === 'product-test-automation') {
                    if (testAutomationModule.fetchSalesOrders) testAutomationModule.fetchSalesOrders();
                    testAutomationModule.fetchTestSessions();
                    fetchDevices();
                    initRealtimeConnection();
                  }
                }
              }
            }
          } catch(e) {
            console.error(e);
          }
        };

        const fetchLiveTelemetry = async (silent = false) => {
          if (!silent) loadingTelemetry.value = true;
          try {
            const url = selectedTelemetryDeviceEUI.value
              ? '/lorawan/telemetry?devEUI=' + encodeURIComponent(selectedTelemetryDeviceEUI.value) + '&limit=0'
              : '/lorawan/telemetry?limit=0';
            const res = await fetch(url, { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              const newItems = Array.isArray(data) ? data : [];

              // Smart diffing during auto-sync: skip re-assigning if packets are identical
              const cur = telemetryList.value;
              if (silent && cur && cur.length === newItems.length && cur.length > 0) {
                const curFirst = cur[0]?.id || cur[0]?.timestamp || cur[0]?.receivedAt;
                const newFirst = newItems[0]?.id || newItems[0]?.timestamp || newItems[0]?.receivedAt;
                const curLast = cur[cur.length - 1]?.id || cur[cur.length - 1]?.timestamp;
                const newLast = newItems[newItems.length - 1]?.id || newItems[newItems.length - 1]?.timestamp;
                if (curFirst === newFirst && curLast === newLast) {
                  lastSyncTime.value = new Date();
                  return;
                }
              }

              telemetryList.value = newItems;
              lastSyncTime.value = new Date();
              nextTick(updateScrollDimensions);
            }
          } catch(e) {
          } finally {
            if (!silent) loadingTelemetry.value = false;
          }
        };

        const fetchDevices = async () => {
          try {
            const res = await fetch('/lorawan/devices', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) devicesList.value = await res.json();
          } catch(e) {}
        };

        const fetchNetworkServers = async () => {
          try {
            const res = await fetch('/api/network-servers', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) networkServersList.value = await res.json();
          } catch(e) {}
        };

        const openRegisterDeviceDialog = () => {
          isEditingDevice.value = false;
          const defaultNs = networkServersList.value.find(ns => ns.isDefault) || networkServersList.value[0];
          const defaultNsId = defaultNs ? defaultNs.id : '';
          const defaultRegionId = defaultNs && Array.isArray(defaultNs.regionProfiles) && defaultNs.regionProfiles.length > 0
            ? defaultNs.regionProfiles[0].id
            : '';

          newDevice.value = {
            name: '',
            devEUI: '',
            networkServerId: defaultNsId,
            regionProfileId: defaultRegionId,
            sku: '',
            firmwareVersion: '',
            decoderId: '',
            appEUI: '0102030405060708',
            appKey: '0102030405060708090A0B0C0D0E0F10',
            activationType: 'OTAA',
            provisionTarget: 'SERVER',
            isActive: true,
          };
          registerDeviceDialog.value = true;
        };

        const openEditDeviceDialog = (d) => {
          isEditingDevice.value = true;
          const nsId = d.networkServerId || (d.networkServer ? d.networkServer.id : '');
          let regId = d.regionProfileId || '';
          if (!regId && nsId) {
            const ns = networkServersList.value.find(n => n.id === nsId);
            if (ns && Array.isArray(ns.regionProfiles) && ns.regionProfiles.length > 0) {
              regId = ns.regionProfiles[0].id;
            }
          }

          newDevice.value = {
            name: d.name || '',
            devEUI: d.devEUI || '',
            networkServerId: nsId,
            regionProfileId: regId,
            sku: d.sku || '',
            firmwareVersion: formatFirmware(d.firmwareVersion) === '—' ? '' : formatFirmware(d.firmwareVersion),
            decoderId: d.decoderId || '',
            appEUI: d.appEUI || '0102030405060708',
            appKey: d.appKey || '0102030405060708090A0B0C0D0E0F10',
            activationType: d.activationMode || 'OTAA',
            provisionTarget: d.syncStatus === 'LOCAL' ? 'LOCAL' : 'SERVER',
            isActive: d.isActive !== undefined ? d.isActive : true,
          };
          registerDeviceDialog.value = true;
        };

        const submitDeviceForm = async () => {
          if (!newDevice.value.name.trim()) {
            showToast("Please enter device name", "error");
            return;
          }
          if (!newDevice.value.devEUI.trim()) {
            showToast("Please enter DevEUI (16 Hex characters)", "error");
            return;
          }
          if (!isEditingDevice.value && newDevice.value.provisionTarget !== 'LOCAL' && !newDevice.value.networkServerId) {
            showToast("Please select a Network Server or switch to Local Fleet mode", "error");
            return;
          }

          savingDevice.value = true;
          try {
            const isEdit = isEditingDevice.value;
            const cleanDevEUI = newDevice.value.devEUI.trim().toUpperCase();
            const url = isEdit ? '/lorawan/devices/' + cleanDevEUI : '/lorawan/devices';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
              method,
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                name: newDevice.value.name.trim(),
                devEUI: cleanDevEUI,
                networkServerId: newDevice.value.networkServerId || undefined,
                regionProfileId: newDevice.value.regionProfileId || undefined,
                sku: newDevice.value.sku ? newDevice.value.sku.trim().toUpperCase() : undefined,
                firmwareVersion: newDevice.value.firmwareVersion ? String(newDevice.value.firmwareVersion).replace(/^[vV]/, '').trim() : undefined,
                decoderId: newDevice.value.decoderId || undefined,
                appEUI: newDevice.value.appEUI ? newDevice.value.appEUI.trim().toUpperCase() : '0102030405060708',
                appKey: newDevice.value.appKey ? newDevice.value.appKey.trim().toUpperCase() : '0102030405060708090A0B0C0D0E0F10',
                activationType: newDevice.value.activationType || 'OTAA',
                provisionTarget: newDevice.value.provisionTarget || 'SERVER',
                isActive: Boolean(newDevice.value.isActive),
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || (isEdit ? "Failed to update device" : "Failed to register device"));
            showToast(data.message || (isEdit ? "Device updated successfully!" : "Device registered successfully!"), "success");
            registerDeviceDialog.value = false;
            fetchDevices();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingDevice.value = false;
          }
        };

        const deleteDevice = (d) => {
          deviceToDelete.value = d;
          deleteConfirmDialog.value = true;
        };

        const confirmDeleteDevice = async () => {
          if (!deviceToDelete.value) return;
          deletingDevice.value = true;
          const d = deviceToDelete.value;
          try {
            const res = await fetch('/lorawan/devices/' + d.devEUI, {
              method: 'DELETE',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete device");
            showToast("Device " + (d.name || d.devEUI) + " deleted successfully", "success");
            deleteConfirmDialog.value = false;
            deviceToDelete.value = null;
            fetchDevices();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            deletingDevice.value = false;
          }
        };

        const checkingHealthDevEUI = ref(null);

        const isDeviceOnline = (d) => {
          if (!d || d.isActive === false) return false;
          const lastSeen = d.lastSeenAt || (d.syncDetails && d.syncDetails.lastSeenAt);
          if (!lastSeen) return false;
          const t = new Date(lastSeen).getTime();
          if (isNaN(t)) return false;
          return (Date.now() - t) < 24 * 60 * 60 * 1000;
        };

        const checkDeviceHealth = async (device) => {
          checkingHealthDevEUI.value = device.devEUI;
          try {
            const res = await fetch('/lorawan/devices/' + device.devEUI + '/health', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Health check failed");
            
            if (data.device) {
              Object.assign(device, data.device);
            }
            if (data.health) {
              device.lastSeenAt = data.health.lastSeenAt || null;
              if (device.syncDetails) {
                device.syncDetails.lastSeenAt = data.health.lastSeenAt || null;
              }
              device.isOnline = Boolean(data.health.isOnline);
            }
            
            showToast(data.health?.message || "Device health check completed", data.health?.isOnline ? "success" : "info");
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            checkingHealthDevEUI.value = null;
          }
        };

        const formatLastSeen = (ts) => {
          if (!ts) return 'Never joined';
          try {
            const d = new Date(ts);
            if (isNaN(d.getTime())) return 'Never joined';
            const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
            if (diffSec < 0) return 'Just now';
            if (diffSec < 60) return 'Just now';
            if (diffSec < 3600) return Math.floor(diffSec / 60) + 'm ago';
            if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          } catch(e) {
            return 'Never joined';
          }
        };

        const formatTime = (ts) => {
          if (!ts) return '--';
          return new Date(ts).toLocaleTimeString();
        };


        const initDashboard = async () => {
          const ok = await fetchSession();
          if (ok) {
            await fetchFeatures();
            fetchNetworkServers();
          }
        };

        onMounted(() => {
          initDashboard();
          initRealtimeConnection();
          // Close inspect modal on ESC key
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeTelemetryPacket.value) {
              closeInspectModal();
            }
          });
          // Close dropdowns when clicking outside
          document.addEventListener('click', (e) => {
            if (columnFilterOpen.value && !e.target.closest('.column-filter-container')) {
              columnFilterOpen.value = false;
            }
            if (exportDropdownOpen.value && !e.target.closest('.export-dropdown-container')) {
              exportDropdownOpen.value = false;
            }
          });
          // Setup observer and resize listeners for scrollbar synchronization
          if (typeof window !== 'undefined') {
            window.addEventListener('resize', updateScrollDimensions);
            if (window.ResizeObserver) {
              const ro = new ResizeObserver(() => {
                updateScrollDimensions();
              });
              if (tableScrollRef.value) ro.observe(tableScrollRef.value);
              if (telemetryTableRef.value) ro.observe(telemetryTableRef.value);
            }
          }
        });

        watch([paginatedDashboardMatrixRows, hiddenSensorColumns, hiddenMetadataColumns, telemetryLoaded], () => {
          nextTick(updateScrollDimensions);
        });

        window.addEventListener('pageshow', (event) => {
          // Only re-init when restored from browser back-forward cache (bfcache)
          if (event.persisted) {
            initDashboard();
          }
        });

        

        return {
          currentUser,
          currentTheme,
          setTheme,
          toggleTheme,
          accessibleFeatures,
          activeFeature,
          userMenuOpen,
          userInitials,
          navigateTo,
          isSuperAdmin,
          standaloneOpsUrl,
          telemetryList,
          selectedTelemetryDeviceEUI,
          selectedTelemetryDevice,
          telemetryLoaded,
          showTelemetry,
          clearTelemetry,
          deleteTelemetry,
          loadingTelemetry,
          activeTelemetryPacket,
          telemetryViewMode,
          filteredTelemetryList,
          activeDecodedFields,
          dashboardSensorColumns,
          dashboardMatrixRows,
          filteredDashboardMatrixRows,
          sortedDashboardMatrixRows,
          telemetryPage,
          telemetryPageSize,
          totalTelemetryPages,
          paginatedDashboardMatrixRows,
          paginationRangeText,
          visiblePageNumbers,
          setTelemetryPage,
          nextTelemetryPage,
          prevTelemetryPage,
          telemetryTimeFilter,
          telemetryRangeStart,
          telemetryRangeEnd,
          telemetrySearchQuery,
          telemetrySortKey,
          telemetrySortOrder,
          autoSyncEnabled,
          lastSyncTime,
          toggleTelemetrySort,
          resetTelemetryFilters,
          isTelemetryFilterActive,
          startAutoSync,
          stopAutoSync,
          toggleAutoSync,
          onSelectTelemetryDevice,
          inspectTelemetryPacket,
          closeInspectModal,
          exportDropdownOpen,
          exportTelemetry,
          columnFilterOpen,
          metadataColumnsList,
          hiddenMetadataColumns,
          toggleMetadataColumn,
          isMetadataColumnVisible,
          totalHiddenColumnsCount,
          showAllColumns,
          resetDefaultColumns,
          hideAllSensorColumns,
          hiddenSensorColumns,
          toggleSensorColumn,
          isSensorColumnVisible,
          topScrollRef,
          tableScrollRef,
          telemetryTableRef,
          tableScrollWidth,
          tableHasHorizontalOverflow,
          handleTopScroll,
          handleTableScroll,
          formatDecodedSummary,
          formatDateTime,
          devicesList,
          deviceSearchQuery,
          filteredDevices,
          networkServersList,
          registerDeviceDialog,
          isEditingDevice,
          savingDevice,
          deleteConfirmDialog,
          deviceToDelete,
          deletingDevice,
          newDevice,
          selectedDeviceNetworkServer,
          availableDeviceRegions,
          onDeviceNetworkServerChange,
          openRegisterDeviceDialog,
          openEditDeviceDialog,
          submitDeviceForm,
          deleteDevice,
          confirmDeleteDevice,
          checkingHealthDevEUI,
          checkDeviceHealth,
          formatLastSeen,
          isDeviceOnline,
          toast,
          handleGlobalClick,
          returnToHome,
          openFeature,
          handleLogout,
          fetchLiveTelemetry,
          fetchDevices,
          formatTime,
          copyText,
          initRealtimeConnection,
          formatFirmware,
          onDeviceSkuOrFwChange,

          ...hmiModule,
          ...downlinkModule,
          ...serialModule,
          ...testAutomationModule,
        };
      }
    });

    app.config.errorHandler = function(err, vm, info) {
      console.error('[Vue Error Handler]:', err, info);
      var appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        appEl.removeAttribute('v-cloak');
      }
    };

    app.mount('#app');
  </script>
</body>
</html>
`;
