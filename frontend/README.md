# Universal IoT Platform - Vue 3 Application Shell & Frontend Plugin System

Industrial-grade Vue 3 Frontend Shell featuring dynamic micro-frontend plugin architecture, multi-tenant switching, RBAC permission guards, and integrated Web Serial hardware communication.

## Key Features

1. **Micro-Frontend Plugin Architecture (`@platform/frontend-sdk`)**:
   - Zero-reload dynamic route injection into Vue Router 4.
   - Dynamic navigation menu injection into Sidebar with automatic order sorting and permission filtering.
   - Dynamic dashboard widget registry supporting ECharts charts and telemetry cards.
   - UI Extension Slots (`<ExtensionSlot name="..." />`) allowing plugins to inject panels into Device Details and Dashboard views.
   - Scoped lifecycle hooks (`activate`, `deactivate`) and typed inter-plugin event bus.

2. **Industrial UI & Component System**:
   - Element Plus with responsive layout and industrial dark/light accents.
   - `StatusBadge`: Industrial state indicators (Online, Offline, Warning, Error) with pulsating animations.
   - `ConnectionIndicator`: Real-time hardware/protocol connection status monitor.
   - `MetricCard`: Industrial KPI telemetry cards with quality tags and trend analytics.
   - `PermissionGuard`: Declarative RBAC security wrapper with fallback slots.
   - `ExtensionSlot`: Standardized slot component for plug-and-play UI hooks.

3. **Core Platform Views**:
   - **Dashboard**: Real-time telemetry summary, status indicators, and active plugin widgets grid.
   - **Device Explorer**: Multi-protocol device fleet management (LoRaWAN, Modbus RTU/TCP, MQTT) with inspection modal and plugin extension points.
   - **Plugin Manager**: Centralized catalog showing installed plugins, runtime status toggles, capabilities breakdown (routes, menus, widgets, extensions), and JSON manifest inspector.
   - **Login & Tenant Switcher**: Multi-tenant authentication with instant role switching (Admin vs. Operator).

4. **Reference Plugins Included**:
   - `plugin-hello-world`: Minimal reference implementation covering routes, menus, widgets, and device inspector extensions.
   - `plugin-serial-terminal`: Industrial Web Serial API configurator with port scanning, baud rate selection, ASCII/HEX logging, and export capabilities.
   - `plugin-telemetry-monitor`: Real-time ECharts telemetry trend visualization with multi-device metrics.

## Project Structure

```text
frontend/
├── src/
│   ├── assets/             # Global CSS and themes
│   ├── components/
│   │   └── shared/         # Reusable industrial components (MetricCard, StatusBadge, etc.)
│   ├── composables/        # useAuth, usePermissions, useTenant, usePlugins
│   ├── layouts/            # AppLayout, TopNavbar, SidebarNav, BreadcrumbBar
│   ├── plugins/            # Sample plugins (hello-world, serial-terminal, telemetry-monitor)
│   ├── router/             # Vue Router with dynamic route management & navigation guards
│   ├── stores/             # Pinia stores (auth, plugins)
│   ├── views/              # Core views (Dashboard, Devices, PluginManager, Login, NotFound)
│   ├── __tests__/          # Vitest unit test suite (plugin-registry, permission-guard)
│   ├── App.vue             # Root component
│   └── main.ts             # App bootstrap & plugin registration
└── package.json
```

## Getting Started

### Prerequisites

Node.js >= 18, npm or pnpm.

### 1. Build Frontend SDK

```bash
cd plugin/packages/frontend-sdk
pnpm install
pnpm run build
```

### 2. Install & Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The application will start on `http://localhost:5173`.

### 3. Run Tests

```bash
npm run test
```

### 4. Build for Production

```bash
npm run build
```
Generates optimized production assets in `dist/` with full TypeScript verification (`vue-tsc`).
