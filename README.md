# LoRaWAN Network & IoT Platform - NestJS Backend (Dynamic PostgreSQL & RBAC)

Hệ thống Backend chuẩn doanh nghiệp xây dựng trên **NestJS Framework**, thiết kế chuyên biệt cho hệ sinh thái **LoRaWAN Network Server & Application Server** (tương tự như Datacake, The Things Network - TTN, ThingPark).

---

## 🌟 Tính Năng Cốt Lõi (Key Features)

### 1. 🗄️ Dynamic Database Routing (Cấu hình PostgreSQL động theo từng Bảng)
* Cho phép định cấu hình linh hoạt file JSON/environment để **từng bảng (Table/Entity)** có thể nằm ở các **PostgreSQL Database khác nhau** (hoặc khác Host/IP).
* Ví dụ:
  * Bảng `users`, `roles`, `permissions`, `applications`, `devices` nằm ở `core_db`.
  * Bảng `gateways` nằm ở `gateway_db` (Dedicated Gateway Server).
  * Bảng `uplink_telemetry` (chứa triệu records dữ liệu cảm biến) nằm ở `lorawan_telemetry_db` (Dedicated Time-Series/High-Write DB).
* Quản lý kết nối tập trung qua `DynamicDatabaseService` và tự động khôi phục / nạp lại cấu hình hot-reload.

### 2. 🔐 Hệ Thống Phân Quyền Hạn Đa Cấp (Granular RBAC & Sub-Admin Management)
* **Super Admin (Admin chính)**: Toàn quyền cấu hình hệ thống, nạp lại cấu hình Database, tạo Admin phụ, set Role và gán quyền trực tiếp cho từng user.
* **Sub-Admin (Admin phụ)**: Quản lý tập khách hàng/User, thiết bị LoRaWAN và Gateway được phân công, không được sửa các quyền hệ thống cao cấp.
* **User / Tenant User**: Quản lý Application, Device, Gateway của chính mình và xem telemetry dữ liệu đo đạc.
* **Roles & Permissions Matrix**: Phân quyền chi tiết dạng `<module>:<action>` (Ví dụ: `users:create`, `lorawan:device:manage`, `lorawan:telemetry:read`).

### 3. 📡 LoRaWAN Application Server & JavaScript Payload Formatter (Datacake / TTN Model)
* Quản lý **Applications**, **Devices** (DevEUI, JoinEUI, AppKey, NwkSKey, AppSKey, OTAA / ABP, Class A/B/C).
* Quản lý **Gateways** (GatewayEUI, GPS Latitude/Longitude/Altitude, Trạng thái Online/Offline).
* **Payload Formatter JS Engine**: Tích hợp trình thực thi JavaScript trong sandbox (Node.js `vm`) hỗ trợ viết script giải mã gói tin thô Hex (uplink hex) sang JSON chuẩn Datacake/TTN:
  ```javascript
  function decodeUplink(input) {
    var bytes = input.bytes;
    var temp = ((bytes[0] << 8) | bytes[1]) / 10.0;
    var humidity = bytes[2];
    return {
      data: { temperature: temp, humidity: humidity }
    };
  }
  ```

### 4. 🎛️ Control Panel Admin & User
* **Admin Control Panel**: Thống kê tổng quan toàn hệ thống, danh sách Sub-Admin/Users, theo dõi trạng thái các kết nối Database Node (core_db, telemetry_db, gateway_db).
* **User Control Panel**: Dashboard cá nhân cho End-User theo dõi số lượng thiết bị, Application và biểu đồ telemetry.

---

## 📁 Cấu Trúc Dự Án (Project Architecture)

```text
Daviteq/
├── config/
│   └── db-routing.config.json   # File cấu hình động Router Database theo từng bảng
├── src/
│   ├── common/
│   │   ├── decorators/          # @CurrentUser(), @Roles(), @RequirePermissions()
│   │   └── guards/              # JwtAuthGuard, PermissionsGuard
│   ├── modules/
│   │   ├── database/            # DynamicDatabaseModule & DynamicDatabaseService
│   │   ├── auth/                # AuthModule, JWT Strategy, Login/Register
│   │   ├── users/               # UsersModule (Admin, Sub-Admin, Users management)
│   │   ├── roles-permissions/   # RolesModule & Permissions Matrix
│   │   ├── lorawan/             # Application, Device, Gateway, Telemetry, JS Decoder
│   │   │   ├── applications/
│   │   │   ├── devices/
│   │   │   ├── gateways/
│   │   │   ├── telemetry/
│   │   │   └── payload-formatters/
│   │   ├── admin-panel/         # Admin System Dashboard & Connection Inspector
│   │   └── user-panel/          # User Dashboard & Device Monitoring
│   ├── app.module.ts
│   └── main.ts
├── package.json
└── README.md
```

---

## ⚙️ Cấu Hình File Database Động (`config/db-routing.config.json`)

Bạn có thể thêm bớt kết nối DB hoặc chuyển bảng sang DB khác chỉ bằng cách chỉnh sửa file cấu hình:

```json
{
  "default_connection": "core_db",
  "connections": {
    "core_db": {
      "host": "localhost",
      "port": 5432,
      "username": "postgres",
      "password": "postgres_password",
      "database": "lorawan_core",
      "poolSize": 10
    },
    "lorawan_telemetry_db": {
      "host": "telemetry-db-host",
      "port": 5432,
      "username": "postgres",
      "password": "postgres_password",
      "database": "lorawan_telemetry",
      "poolSize": 20
    },
    "gateway_db": {
      "host": "gateway-db-host",
      "port": 5432,
      "username": "postgres",
      "password": "postgres_password",
      "database": "lorawan_gateways",
      "poolSize": 10
    }
  },
  "table_routes": {
    "users": "core_db",
    "roles": "core_db",
    "permissions": "core_db",
    "applications": "core_db",
    "devices": "core_db",
    "gateways": "gateway_db",
    "uplink_telemetry": "lorawan_telemetry_db"
  }
}
```

---

## 🚀 Hướng Dẫn Khởi Chạy (Getting Started)

### 1. Cài đặt các gói phụ thuộc (Dependencies)
```bash
npm install
```

### 2. Chuẩn bị PostgreSQL Database
Tạo các cơ sở dữ liệu tương ứng trong PostgreSQL (ví dụ `lorawan_core`, `lorawan_telemetry`, `lorawan_gateways`) hoặc chỉ định chung 1 DB nếu khởi tạo thử nghiệm ban đầu.

### 3. Khởi chạy ở môi trường Development
```bash
npm run start:dev
```

### 4. Khởi tạo tài khoản Super Admin ban đầu
Gửi request HTTP POST đến API `/auth/init-superadmin`:
```bash
curl -X POST http://localhost:3000/auth/init-superadmin \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "email": "admin@lora.com", "pass": "AdminSecret123!"}'
```

### 5. Truy cập Swagger UI Documents
Mở trình duyệt: `http://localhost:3000/api/docs`

---

## 📌 Các Route API Quan Trọng (Primary API Endpoints)

| Module | Method | Endpoint | Mô tả |
|---|---|---|---|
| **Auth** | POST | `/auth/login` | Đăng nhập lấy JWT Bearer Token |
| **Auth** | GET | `/auth/profile` | Xem thông tin User đăng nhập & danh sách quyền |
| **Admin** | GET | `/admin-panel/dashboard` | Thống kê Admin & trạng thái kết nối các DB pool |
| **Admin** | POST | `/admin-panel/reload-db-config` | Reload cấu hình DB động không cần restart server |
| **Users** | POST | `/users` | Tạo mới User / Admin phụ (Sub-Admin) |
| **Users** | PUT | `/users/:id/permissions` | Set vai trò (Roles) và cấp quyền riêng (Direct Permissions) |
| **LoRaWAN** | POST | `/lorawan/devices` | Đăng ký thiết bị LoRaWAN (DevEUI, OTAA/ABP) |
| **LoRaWAN** | PUT | `/lorawan/devices/:devEUI/payload-formatter` | Cập nhật script JS Decode payload cho thiết bị |
| **LoRaWAN** | POST | `/lorawan/uplink` | Webhook nhận gói tin thô Uplink Hex & tự giải mã |
| **LoRaWAN** | POST | `/lorawan/payload-formatter/test` | Test nhanh script Javascript Decoder (Datacake style) |

---

## 🛡️ License
Dự án được bảo hộ theo giấy phép MIT.
