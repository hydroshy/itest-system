# C-Modules (Control Panel Governance Modules)

Thư mục này chứa toàn bộ các **Module quản trị, hạ tầng và giám sát dành cho Super Admin trên Control Panel (`/control-panel`)**.

---

## 🎯 Quy chuẩn đặt tên & Cấu trúc (C-Module Standard):
- **Tiền tố:** `c-` (viết tắt của **Control Panel Module**) hoặc `C_MOD_` cho mã code.
- **Mục đích:** Cung cấp khả năng cấu hình hạ tầng, quản trị người dùng, phân quyền RBAC và quản lý các D-Module trên toàn hệ thống.

### Danh sách 15 C-Modules tiêu chuẩn:
| Nhóm chức năng | Tên thư mục | Mã Code | Tên hiển thị | Vai trò & Khả năng hoạt động |
| :--- | :--- | :--- | :--- | :--- |
| **I. Quản trị lõi** | **`overview-hub/`** | `C_MOD_OVERVIEW` | **Overview Hub** | Trung tâm thống kê số liệu toàn hệ thống, DevOps container runtime, và điều hướng nhanh 1-click. |
| | **`d-module-manager/`** | `C_MOD_D_MODULES` | **D-Modules Management** | Bật/tắt, tạo mới, chỉnh sửa icon, màu sắc và gán quyền Role cho các D-Module Dashboard. |
| | **`roles-rbac/`** | `C_MOD_ROLES_RBAC` | **Roles & RBAC Matrix** | Quản lý vai trò (Role), ma trận phân quyền hệ thống (User, Database, Fleet, Server, QA). |
| | **`user-directory/`** | `C_MOD_USERS` | **User Directory** | Quản lý danh sách tài khoản người dùng, gán quyền và trạng thái Active/Suspended. |
| | **`database-routing/`** | `C_MOD_DATABASE` | **Database Health & Routing** | Giám sát kết nối PostgreSQL và định tuyến đa cơ sở dữ liệu động theo bảng. |
| **II. Hạ tầng LoRaWAN** | **`network-servers/`** | `C_MOD_NETWORK_SERVERS` | **Network Servers** | Quản lý hạ tầng Actility ThingPark Wireless & ChirpStack v4, RouteRef, Region Profiles. |
| | **`device-fleet-admin/`** | `C_MOD_DEVICE_FLEET` | **Device Fleet Oversight** | Giám sát toàn bộ thiết bị trong hệ thống, liên kết Item Code, Sales Order, DevEUI, keys. |
| | **`webhook-admin/`** | `C_MOD_WEBHOOKS` | **Webhook Manager** | Quản lý và kiểm tra các endpoint nhận webhook từ Network Servers, retention log. |
| | **`downlink-admin/`** | `C_MOD_DOWNLINK_CONTROLLER`| **Downlink Actuator** | Truyền lệnh downlink Hex/Preset xuống thiết bị, quản lý hàng đợi và audit log. |
| **III. R&D & Giao diện** | **`decoder-admin/`** | `C_MOD_DECODER` | **Decoder Manager** | Quản lý decoder JavaScript theo SKU & Firmware version, sandbox test và AST field analysis. |
| | **`hmi-studio/`** | `C_MOD_HMI_STUDIO` | **HMI SCADA Studio** | Thiết kế giao diện SCADA công nghiệp Wecon, gắn Tag cảm biến telemetry, runtime view. |
| | **`modbus-presets/`** | `C_MOD_MODBUS_PRESETS` | **Modbus Presets** | Quản lý thanh ghi Modbus, import cấu hình template từ Excel (RD1, Engineering, Full...). |
| **IV. Sản xuất & QA** | **`item-codes/`** | `C_MOD_ITEM_CODES` | **Item Code Catalog** | Danh mục mã sản phẩm thương mại Daviteq, ánh xạ SKU, FW, Test Template mặc định. |
| | **`sales-orders/`** | `C_MOD_SALES_ORDERS` | **Sales Orders & Items** | Quản lý đơn hàng sản xuất, đồng bộ Odoo ERP, import CSV, gắn Item Codes và Test Template. |
| | **`test-builder/`** | `C_MOD_TEST_BUILDER` | **Test Automation Builder** | Thiết kế kịch bản test LoRaWAN kéo thả (Flow Canvas), Assertion Rules theo SKU/FW. |

---

## 🔄 Mạng lưới liên kết (Inter-Module Workflows):
1. **Sales Orders ↔ Item Codes ↔ Test Builder ↔ Decoder Manager**:
   - Sales Order liên kết dòng đơn hàng với Item Code Catalog.
   - Item Code tự động liên kết Test Template mặc định và khớp Payload Decoder JavaScript theo `(SKU, FirmwareVersion)`.
   - AST Parser trích xuất trường dữ liệu thực từ Decoder cho Flow Canvas trong Test Builder.
2. **Device Fleet ↔ Item Codes & Sales Orders**:
   - Thiết bị được gán Item Code và Sales Order trực tiếp, tự động nhận diện SKU, FW và Decoder tương ứng.
3. **Downlink Actuator ↔ Modbus Presets & Device Fleet**:
   - 1-click kích hoạt truyền lệnh downlink từ Device Fleet, hỗ trợ lệnh cấu hình mẫu (Reporting Interval, Reset, Status).
