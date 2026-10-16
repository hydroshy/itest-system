# ITEST Universal IoT & Industrial Communication Platform - Micro-kernel Core Backbone

Nền tảng lõi tối giản (**Micro-kernel Core Backbone**) xây dựng trên **NestJS Framework** (Backend) và **Vue 3 + Vite App Shell** (Frontend), thiết kế theo triết lý Micro-kernel:
- **Lõi hệ thống (itest-system)** chỉ duy trì hạ tầng thiết yếu: Dynamic Database Router, Granular Multi-tenant RBAC, Event Bus, Plugin Manager & Dynamic Loader, Hardware Bus Lock và Web Shell.
- **Hệ sinh thái Plugin (itest-plugins)**: Toàn bộ giao thức công nghiệp (LoRaWAN, Modbus RTU/TCP, MQTT), bộ giải mã codec payload, adapter phần cứng, và giao diện mở rộng được đóng gói thành các plugin độc lập tuân thủ chuẩn vòng đời `IPluginLifecycle`.

---

## 🌟 Tính Năng Cốt Lõi (Core Backbone Capabilities)

### 1. 🗄️ Dynamic Database Routing (Định tuyến CSDL động theo bảng & tenant)
* Hỗ trợ cấu hình linh hoạt để từng bảng (Table/Entity) hoặc từng Tenant có thể nằm ở các **PostgreSQL Database khác nhau** (hoặc khác Host/IP/Port/Schema).
* Quản lý kết nối tập trung qua `DynamicDatabaseService`, hỗ trợ hot-reload cấu hình mà không cần khởi động lại toàn bộ tiến trình.
* Phân lập dữ liệu triệt để, không thiết lập quan hệ cứng hoặc ràng buộc CASCADE xuyên schema/database.

### 2. 🔐 Hệ Thống Phân Quyền Hạn Đa Cấp (Granular RBAC & Multi-tenant)
* **Super Admin**: Quản trị cấu hình hệ thống, quản lý plugin registry, quản trị database router và phân bổ tài nguyên.
* **Tenant Admin / Sub-Admin**: Quản lý người dùng, ứng dụng, thiết bị và cấu hình plugin trong phạm vi tenant.
* **Standard User / Operator**: Vận hành thiết bị, giám sát telemetry, xem dashboard và gửi lệnh điều khiển trong phạm vi quyền hạn.
* **Ma trận Roles & Permissions**: Định nghĩa quyền hạn chi tiết theo dạng `<module>:<action>` (ví dụ: `devices:read`, `plugins:manage`, `telemetry:export`).

### 3. 🔌 Plugin Management & Runtime Sandbox (Quản trị & Nạp Plugin Động)
* **Plugin Registry & Manifest Verification**: Quản lý metadata, versioning, permissions, dependencies và kiểm tra tính toàn vẹn (SRI hash).
* **Chuẩn hóa vòng đời IPluginLifecycle**: Bắt buộc các plugin triển khai đầy đủ các hook vòng đời: `init()`, `mount()`, `unmount()`, `dispose()`.
* **Dynamic Loader & Sandbox Execution**: Nạp và thực thi plugin an toàn, có cô lập tài nguyên, timeout và kiểm soát quyền truy cập hệ thống.
* **Extension Points & UI Slots**: Cung cấp các điểm gắn kết trên App Shell (Navigation, Dashboard, Device Details, Settings) để plugin frontend tự động đăng ký giao diện.

### 4. ⚡ Event Bus & Realtime Communication
* Event Bus bất đồng bộ nội bộ kết nối lõi với các plugin giao thức và connector.
* WebSocket Gateway phân phối sự kiện và dữ liệu thời gian thực tới frontend theo các kênh đăng ký (Topic/Room).
* Half-duplex Bus Lock: Cơ chế khóa điều phối tuần tự kèm độ trễ an toàn dành cho các giao tiếp phần cứng nửa song công (RS485, Serial Bus).

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture Overview)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ITEST APP SHELL (UI)                          │
│     (Vue 3, Pinia, Dynamic Plugin Loader, Extension Slot Registry)      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / WebSocket
┌────────────────────────────────────▼────────────────────────────────────┐
│                    ITEST-SYSTEM (MICRO-KERNEL CORE)                     │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Identity & RBAC Engine  │  │ Dynamic Database Router (PostgreSQL) │  │
│  └─────────────────────────┘  └──────────────────────────────────────┘  │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Plugin Manager & Loader │  │ Unified Event Bus & Realtime Engine  │  │
│  └─────────────────────────┘  └──────────────────────────────────────┘  │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ HalfDuplex HardwareLock │  │ Subsystem Diagnostics & Audit Log    │  │
│  └─────────────────────────┘  └──────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Plugin SDK / Event Bus / Contracts
┌────────────────────────────────────▼────────────────────────────────────┐
│                    ITEST-PLUGINS (STANDALONE PLUGINS)                   │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Protocol & Connectors   │  │ Hardware & Serial Adapters           │  │
│  │ (Modbus, MQTT, LoRaWAN) │  │ (Web Serial, USB-UART, RS485)        │  │
│  └─────────────────────────┘  └──────────────────────────────────────┘  │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Payload Codecs          │  │ Application Extensions               │  │
│  │ (Decoders, Encoders)    │  │ (Telemetry, Alarms, Device Manager)  │  │
│  └─────────────────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Cấu Trúc Thư Mục (Directory Structure)

```
itest-system/
├── frontend/                     # Vue 3 App Shell & Micro-Frontend Host
│   ├── src/
│   │   ├── api/                  # Core API clients
│   │   ├── components/           # Core layout & ExtensionSlot components
│   │   ├── plugins/              # Dynamic plugin runtime loader
│   │   ├── router/               # Dynamic routes
│   │   └── views/                # Core platform views (Login, System Admin, Plugins)
│   └── package.json
├── src/
│   ├── backend/
│   │   ├── common/               # Subsystem logging, interceptors, base types
│   │   ├── core-models/          # Core entity definitions (Plugins, Audit, Unified Device)
│   │   ├── database/             # Dynamic Database Router & In-memory cache
│   │   ├── identity/             # Auth, User, Role, Permission & RBAC
│   │   ├── plugins/              # Plugin Registry, Sandbox Manager, Lifecycle Hooks
│   │   ├── backend-diagnostics.controller.ts
│   │   ├── backend.module.ts     # Core backend root aggregator
│   │   └── index.ts
│   ├── app.module.ts             # NestJS root application module
│   └── main.ts                   # Entry point (Bootstrap, Swagger, CORS, Validation)
├── package.json
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start)

### Yêu Cầu Môi Trường
* Node.js: >= 20.x
* pnpm: >= 9.x
* PostgreSQL: >= 15.x

### 1. Cài đặt Dependencies
```bash
# Cài đặt dependencies cho backend và frontend
pnpm install
```

### 2. Cấu hình Môi trường (.env)
Tạo file `.env` dựa trên `.env.example`:
```env
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Database Configuration (Master / Routing)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=itest_core_db
```

### 3. Khởi chạy Hệ thống
```bash
# Chạy NestJS Backend chế độ Development
pnpm run start:dev

# Chạy App Shell Frontend (trong thư mục frontend)
cd frontend
pnpm run dev
```

* API Backend & Swagger Docs: `http://localhost:3000/api/docs`
* Frontend App Shell: `http://localhost:5173`

---

## 🧪 Kiểm Thử (Testing & Quality Gate)

Mọi thay đổi trên Core Backbone phải vượt qua 100% các bài kiểm thử đơn vị và tích hợp:

```bash
# Chạy unit tests
pnpm run test

# Kiểm tra linting và formatting
pnpm run lint

# Build production artifacts
pnpm run build
```

---

## 📜 Giấy Phép (License)
Phát triển bởi đội ngũ kỹ thuật ITEST. Bản quyền thuộc về ITEST Platform.
