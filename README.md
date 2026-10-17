# ITEST Micro-kernel Core Backbone & Application Server

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![NestJS Framework](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**ITEST Core System** là lõi ứng dụng trung tâm (Micro-kernel Core Backbone) thuộc hệ sinh thái **ITEST Universal IoT & Industrial Communication Platform**. Hệ thống được thiết kế theo nguyên lý **Micro-kernel Tối Giản** và **Backbone Stability Rule**, đảm bảo lõi hệ thống ổn định lâu dài, không phụ thuộc vào bất kỳ giao thức hay nghiệp vụ phần cứng đơn lẻ nào.

Toàn bộ các giao thức công nghiệp (Modbus RTU/TCP, MQTT, LoRaWAN, v.v.) và tiện ích nghiệp vụ viễn trắc đều được tách biệt hoàn toàn thành các plugin độc lập tại kho lưu trữ `itest-plugins`.

---

## 🏛️ Kiến Trúc Hệ Thống (Architecture Overview)

```
+-------------------------------------------------------------------------------+
|                           ITEST ECOSYSTEM ARCHITECTURE                        |
+-------------------------------------------------------------------------------+
                                        |
    +-----------------------------------+-----------------------------------+
    |                                   |                                   |
+-------------------+           +-------------------+               +-------------------+
|   itest-system    |           |   itest-plugins   |               |  itest-database   |
| (Micro-kernel &   |           | (Industrial & IoT |               |  (PostgreSQL 17   |
|   App Shell)      |<--Dynamic-|   Plugins Engine) |               |  Multi-Schema)    |
+-------------------+  Plugins  +-------------------+               +-------------------+
    |           |                                                             ^
    |           +---------------------- Database Connection ------------------+
    v                                  (system_schema & itest_system_user)
+-------------------+
|     ops-agent     |
| (Health & Metrics)|
+-------------------+
```

### Trách Nhiệm Của Lõi Micro-kernel (`itest-system`)
1. **Quản Lý Định Danh & Phân Quyền (RBAC)**: Quản lý người dùng (`User`), vai trò (`Role`), quyền hạn (`Permission`), cấp phát và xác thực JWT token.
2. **Cơ Chế Định Tuyến Đa Cơ Sở Dữ Liệu (Dynamic Table-to-DB Routing)**: Hỗ trợ ánh xạ động bảng cơ sở dữ liệu dựa trên cấu hình `db-routing.config.json`.
3. **Đăng Ký & Quản Lý Vòng Đời Plugin (Plugin Manager & Sandbox)**:
   - Quản lý metadata plugin (`core_plugins`), kiểm tra schema manifest, xác thực mã băm toàn vẹn (SRI sha256).
   - Kiểm soát trạng thái vòng đời: `INSTALL`, `ENABLE`, `DISABLE`, `UNINSTALL`, `CONFIG_CHANGE`.
   - Ghi nhật ký kiểm toán vòng đời (`plugin_audit_logs`).
   - Cung cấp REST API và WebSocket Event Bus (`plugin:installed`, `plugin:status_changed`, v.v.).
4. **Quản Trị Thiết Bị Hợp Nhất (Unified Device Model)**: Registry quản lý thông tin thiết bị chuẩn hóa không phụ thuộc giao thức (`unified_devices`).
5. **Frontend Host Shell (`frontend/`)**: Ứng dụng Vue 3 SPA đóng vai trò Host Shell, cung cấp các `ExtensionSlot` để nạp dynamic micro-frontend plugins.

---

## 📂 Cấu Trúc Thư Mục (Project Structure)

```
itest-system/
├── config/                          # File cấu hình định tuyến động
│   └── db-routing.config.json       # Table-to-DB routing rules
├── frontend/                        # Frontend Host Shell (Vue 3 + Vite + TypeScript)
│   ├── src/                         # Plugin Registry, Dynamic Loader, Extension Slots
│   ├── tests/                       # Unit & integration tests (Vitest)
│   ├── Dockerfile                   # Dockerfile triển khai Nginx Frontend
│   └── README.md                    # Tài liệu chi tiết Frontend Shell
├── packages/                        # Shared SDK packages
│   └── frontend-sdk/                # SDK dành cho Frontend Plugins (@itest/frontend-sdk)
├── src/                             # Backend Core Source Code (NestJS)
│   ├── backend/
│   │   ├── auth/                    # Module xác thực JWT & Guard RBAC
│   │   ├── config/                  # Quản lý cấu hình môi trường
│   │   ├── database/                # TypeORM DataSource & Dynamic DB Router
│   │   ├── entities/                # Thực thể lõi (User, Role, Plugin, AuditLog, Device)
│   │   ├── ops/                     # Tích hợp giám sát Ops Agent Sidecar
│   │   ├── plugins/                 # Plugin Storage, Manager & Sandbox APIs
│   │   └── user/                    # Quản lý tài khoản người dùng
│   ├── common/                      # Guards, Interceptors, Filters dùng chung
│   ├── app.module.ts                # Root Application Module
│   └── main.ts                      # Điểm khởi động ứng dụng NestJS
├── storage/                         # Lưu trữ cục bộ các bundle plugin tải lên
├── test/                            # Bộ kiểm thử tích hợp (Integration Tests)
│   ├── plugin-management-api.spec.ts
│   └── entity-metadata-verification.spec.ts
├── .env.example                     # Mẫu cấu hình môi trường chuẩn
├── .env.docker                      # Mẫu cấu hình chạy với Docker Compose
├── docker-compose.yml               # File cấu hình Docker Compose triển khai
├── package.json                     # Thông tin package & scripts (@itest/core-system)
└── README.md                        # Tài liệu hướng dẫn này
```

---

## ⚙️ Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: Phiên bản 20.x trở lên
- **npm**: Phiên bản 9.x hoặc 10.x
- **PostgreSQL**: Phiên bản 17 (khuyến nghị chạy từ cụm `itest-database`)
- **Docker & Docker Compose**: Nếu triển khai bằng container

---

## 🚀 Cài Đặt & Khởi Chạy (Installation & Setup)

### 1. Cài đặt Dependencies

Tại thư mục gốc `itest-system/`:
```bash
# Cài đặt dependencies cho Backend Core
npm install

# Cài đặt dependencies cho Frontend Host Shell
cd frontend
npm install
cd ..
```

### 2. Cấu Hình Biến Môi Trường (.env)

Sao chép file mẫu `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Thiết lập các thông số kết nối cơ sở dữ liệu (tương thích với `itest-database`):
```env
PORT=3000
NODE_ENV=development
PAYLOAD_LIMIT=50mb

JWT_SECRET=Your_Super_Secret_Key_Change_In_Production!

# Kết nối PostgreSQL 17 itest-database (schema: system_schema)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=itest_system_user
DB_PASSWORD=system_secret_2026
DB_NAME=itest_platform
DB_SYNCHRONIZE=false
DB_LOGGING=false

DB_ROUTING_CONFIG_PATH=./config/db-routing.config.json

# Tích hợp Ops Agent Sidecar
OPS_AGENT_URL=http://localhost:3099
OPS_AGENT_PORT=3099
```

### 3. Khởi Chạy Ứng Dụng Chế Độ Phát Triển (Development)

**Khởi chạy Backend Core**:
```bash
npm run start:dev
```
Backend sẽ lắng nghe tại cổng `http://localhost:3000`.

**Khởi chạy Frontend Host Shell**:
```bash
cd frontend
npm run dev
```
Giao diện Host Shell sẽ lắng nghe tại cổng `http://localhost:5173`.

---

## 🧪 Kỷ Luật Kiểm Thử (Testing & Quality Assurance)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **100% Tests Pass** trước khi bàn giao và đẩy mã nguồn.

### Kiểm Thử Backend Core
```bash
# Chạy toàn bộ kiểm thử Plugin Management Subsystem (SRI, Sandbox, Lifecycle)
npm test

# Chạy kiểm tra tính toàn vẹn TypeORM Entities & Database Metadata
npm run test:entities

# Kiểm tra biên dịch TypeScript
npm run build
```

### Kiểm Thử Frontend Host Shell
```bash
cd frontend
# Chạy Vitest test suites (Plugin Registry, Loader, RBAC Guard)
npm test

# Kiểm tra biên dịch TypeScript & Vite production build
npm run build
cd ..
```

---

## 🐳 Triển Khai Với Docker Compose (Deployment)

Khởi động hệ thống Backend và cơ sở dữ liệu đi kèm:
```bash
# Triển khai backend và cơ sở dữ liệu
docker compose --env-file .env.docker up -d --build

# Xem nhật ký logs
docker compose logs -f backend
```

Để triển khai kết nối trực tiếp vào mạng chung của `itest-database`, sử dụng external network `itest_net`:
```yaml
networks:
  itest_net:
    external: true
```

---

## 🔌 Tích Hợp Với Hệ Sinh Thái ITEST (Ecosystem Integration)

1. **Kho Plugins (`itest-plugins`)**: Các plugin giao thức (Modbus, MQTT, LoRaWAN) sau khi đóng gói bundle JS kèm `manifest.json` và mã băm SRI sẽ được đăng ký vào Core qua API `POST /api/plugins/register`.
2. **Cơ Sở Dữ Liệu (`itest-database`)**: Core giao tiếp với PostgreSQL 17 thông qua user `itest_system_user` bị cô lập đặc quyền trong `system_schema`.
3. **Giám Sát Vận Hành (`ops-agent`)**: Core định kỳ phát tín hiệu heartbeat và metrics hiệu năng sang Ops Agent Sidecar tại cổng `3099`.

---

## 📄 Bản Quyền & Giấy Phép (License)

Dự án phát hành dưới giấy phép [MIT License](LICENSE).
Thuộc quyền phát triển của **ITEST Platform Engineering Team**.
