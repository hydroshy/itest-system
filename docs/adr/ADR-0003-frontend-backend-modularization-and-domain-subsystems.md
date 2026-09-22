# ADR-0003: Frontend & Backend Separation, Domain Subsystems Modularization, and Error Isolation

## Status
**ACCEPTED & IMPLEMENTED** (2026-09-22)

## Context
In earlier iterations of the Daviteq IoT platform, the codebase accumulated several structural issues:
1. **Frontend / Backend Coupling**: Massive Vue 3 single-file string templates and client-side scripts (`DASHBOARD_HTML`, `CONTROL_PANEL_HTML`, modules) were stored directly under `src/views/` and served via `src/app.controller.ts`, intermingling presentation logic with application root concerns.
2. **Backend Domain Fragmentation**: Business logic was organized into artificial administrative categories (`c-modules/`, `d-modules/`, flat `modules/`) rather than cohesive business domains. Closely related features (e.g. Sales Orders and Item Codes/SKU catalog; Test Builder and D-Module Test Automation workbench) were split across separate folder hierarchies.
3. **Debugging Difficulty**: When an error occurred in production or staging, determining whether the failure originated in the Frontend Vue client, the Database connection pool, the LoRaWAN Network Server protocol adapter, the Order Management SKU matching rule, or the Test Automation runner required manual log parsing and code traversal.

## Architectural Decision

### 1. High-Level Folder Structure
The source code under `src/` is now strictly separated into two first-class architectural layers:
```
src/
├── app.module.ts            # Clean root module importing FrontendModule & BackendModule
├── main.ts                  # Application bootstrap & Swagger documentation
├── common/                  # Shared cross-cutting decorators, guards, and utilities
├── frontend/                # Presentation Layer (Pages, Vue templates, modules)
│   ├── pages/               # Login, Dashboard, Control Panel SPA pages
│   ├── modules/             # UI modules for Control Panel and Dashboard
│   ├── frontend.controller.ts # Serves HTML pages and handles cookie/session clearing
│   ├── frontend.module.ts   # Encapsulates frontend routing
│   └── index.ts             # Central presentation barrel export
└── backend/                 # Domain Subsystems Layer (Business Logic & APIs)
    ├── database/            # Dynamic DB connection routing, pool lifecycle, health
    ├── lorawan/             # LoRaWAN core, ChirpStack/TTN connectors, gateways, downlinks
    ├── order-management/    # Sales Orders (SO), Item Codes / SKU catalog, Sensor Types
    ├── test-automation/     # D-Module workbench, C-Module test builder, decoders
    ├── identity/            # JWT authentication, RBAC roles & permissions, users
    ├── industrial-iot/      # Modbus presets, HMI Studio SCADA, overview hub
    ├── realtime/            # WebSocket streaming gateways
    ├── common/              # Domain classifications, SubsystemLogger, SubsystemDebugInterceptor
    ├── backend.module.ts    # Aggregator module for all 7 subsystems
    ├── backend-diagnostics.controller.ts # /api/backend/diagnostics & /api/backend/subsystems
    └── index.ts             # Central backend barrel export
```

### 2. Domain Subsystems Breakdown

| Subsystem | Responsibility | Key Endpoints / Routes | Diagnostics Service |
| :--- | :--- | :--- | :--- |
| **DATABASE** | Dynamic multi-tenant database connection pooling, schema synchronization, health monitoring. | `/api/database/health`<br>`/api/database/status`<br>`/api/database/reload` | `DatabaseDiagnosticService` |
| **LORAWAN** | ChirpStack v3/v4 & TTN connectors, OTAA/ABP device onboarding, gateways, downlink scheduler, webhooks. | `/api/lorawan/*`<br>`/api/network-servers/*`<br>`/api/webhook/*` | `LorawanDiagnosticService` |
| **ORDER_MANAGEMENT** | Sales Orders (SO) lifecycle, Item Codes / SKU specifications, firmware constraints, and Sensor Types. | `/api/sales-orders/*`<br>`/api/item-codes/*`<br>`/api/sensor-types/*` | `OrderManagementDiagnosticService` |
| **TEST_AUTOMATION** | D-Module Product QA workbench, C-Module visual Test Builder flow engine, payload decoder tests. | `/api/d-modules/test-run/*`<br>`/api/test-builder/*`<br>`/api/decoder/*` | `TestAutomationDiagnosticService` |
| **IDENTITY** | JWT token authentication, user administration, and granular RBAC permission matrix. | `/auth/*`<br>`/api/users/*`<br>`/api/roles/*` | `IdentityDiagnosticService` |
| **INDUSTRIAL_IOT** | Modbus RTU/TCP register presets, HMI Studio canvas screens & widgets, system overview metrics. | `/api/c-modules/modbus-presets/*`<br>`/api/c-modules/hmi-studio/*`<br>`/api/c-modules/overview-hub/*` | `IndustrialIotDiagnosticService` |
| **REALTIME** | WebSocket gateways for real-time telemetry, downlink status updates, and test packet log streaming. | `/realtime/*`<br>`ws://*` | `RealtimeDiagnosticService` |

### 3. Rapid Error Debugging & Domain Isolation Mechanism

To immediately identify and isolate the exact source of any error:
1. **Response Header `X-Daviteq-Subsystem`**:
   The `SubsystemDebugInterceptor` automatically inspects incoming requests and tags every HTTP response with the handling subsystem (e.g. `X-Daviteq-Subsystem: ORDER_MANAGEMENT`). Frontend developers can immediately see in browser DevTools Network tab which subsystem processed the request.
2. **Domain-Prefixed Structured Logging**:
   All log messages emitted by subsystem services use domain tags:
   - `[DATABASE]`
   - `[LORAWAN_NETWORK_SERVER]`
   - `[ORDER_MANAGEMENT]`
   - `[TEST_AUTOMATION]`
   - `[IDENTITY_AUTH]`
   - `[INDUSTRIAL_IOT]`
   - `[REALTIME_STREAM]`
   Any unhandled exception is highlighted with `[ERROR IN DOMAIN: <SUBSYSTEM>] <METHOD> <URL> -> Status <CODE>: <MESSAGE>`.
3. **Enriched Error Payloads**:
   When an API throws an HTTP exception, `SubsystemDebugInterceptor` enriches the JSON response with:
   ```json
   {
     "statusCode": 400,
     "message": "Item code SKU WS433-CL-01 does not match firmware v1.2.3",
     "subsystem": "ORDER_MANAGEMENT",
     "debugOrigin": "Daviteq/Backend/ORDER_MANAGEMENT"
   }
   ```
4. **Live Diagnostics Endpoint (`/api/backend/diagnostics`)**:
   Provides an on-demand snapshot of all 7 subsystems, testing database connectivity, active sessions, and catalog readiness in a single request.

### 4. Backward Compatibility Strategy
To ensure existing tests, scripts, and imports are 100% preserved without breakage:
- `src/views/` and `src/views/*-modules/` are maintained and synchronized with `src/frontend/`.
- `src/modules/` is maintained alongside `src/backend/` as the underlying implementation and re-export layer.
- All existing route paths (`/api/sales-orders`, `/api/item-codes`, `/api/lorawan`, `/api/d-modules/test-run`, etc.) remain identical.

## Consequences & Benefits
- **Separation of Concerns**: Frontend presentation code is completely decoupled from backend services and database entities.
- **Fast Bug Pinpointing**: Developers can pinpoint the exact origin of bugs within seconds by checking the `X-Daviteq-Subsystem` header or log domain prefix.
- **Maintainability & Team Autonomy**: Subsystems can be refactored, extended, or scaled independently without risk of cross-domain side effects.
- **Zero Regression**: 100% of test suites continue to pass without modifications.
