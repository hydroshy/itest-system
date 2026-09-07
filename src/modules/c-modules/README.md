# C-Modules (Control Panel Governance Modules)

Thư mục này chứa toàn bộ các **Module quản trị, hạ tầng và giám sát dành cho Super Admin trên Control Panel (`/control-panel`)**.

---

## 🎯 Quy chuẩn đặt tên & Cấu trúc (C-Module Standard):
- **Tiền tố:** `c-` (viết tắt của **Control Panel Module**) hoặc `C_MOD_` cho mã code.
- **Mục đích:** Cung cấp khả năng cấu hình hạ tầng, quản trị người dùng, phân quyền RBAC và quản lý các D-Module trên toàn hệ thống.

### Danh sách C-Modules tiêu chuẩn:
| Tên thư mục | Mã Code C-Module | Tên hiển thị | Vai trò & Khả năng hoạt động |
| :--- | :--- | :--- | :--- |
| **`overview-hub/`** | `C_MOD_OVERVIEW` | **Overview Hub** | Trung tâm thống kê số liệu toàn hệ thống và điều hướng nhanh 1-click. |
| **`d-module-manager/`** | `C_MOD_D_MODULES` | **D-Modules Management** | Bật/tắt, tạo mới, chỉnh sửa icon, màu sắc và gán quyền Role cho các D-Module Dashboard. |
| **`roles-rbac/`** | `C_MOD_ROLES_RBAC` | **Roles & RBAC Matrix** | Quản lý vai trò (Role), ma trận phân quyền hệ thống (User, Database, Fleet, Server). |
| **`user-directory/`** | `C_MOD_USERS` | **User Directory** | Quản lý danh sách tài khoản người dùng, gán quyền và trạng thái Active/Suspended. |
| **`network-servers/`** | `C_MOD_NETWORK_SERVERS` | **Network Servers** | Quản lý hạ tầng Actility ThingPark Wireless & ChirpStack v4, RouteRef, Region Profiles. |
| **`database-routing/`** | `C_MOD_DATABASE` | **Database Health & Routing** | Giám sát kết nối PostgreSQL và định tuyến đa cơ sở dữ liệu động theo bảng. |
| **`device-fleet-admin/`** | `C_MOD_DEVICE_FLEET` | **Device Fleet Oversight** | Giám sát toàn bộ thiết bị trong hệ thống, xem thông tin người tạo (`Created By`). |
| **`webhook-admin/`** | `C_MOD_WEBHOOKS` | **Webhook Endpoints** | Quản lý và kiểm tra các endpoint nhận webhook từ Network Servers. |
| **`decoder-admin/`** | `C_MOD_DECODER` | **Decoder Manager** | Quản lý decoder theo SKU & Firmware version (1-32), lưu trữ code JavaScript và kiểm thử sandbox. |
| **`hmi-studio/`** | `C_MOD_HMI_STUDIO` | **HMI SCADA Studio** | Công cụ thiết kế trực quan HMI SCADA chuẩn công nghiệp Wecon, gắn Tag dữ liệu LoRaWAN, kéo thả canvas và phân quyền hiển thị màn hình giám sát. |

---

## 🔄 Tính độc lập & Đan xen với D-Modules:
1. **Độc lập:** Super Admin có thể cấu hình toàn bộ hạ tầng (PostgreSQL, Network Servers, Roles, Decoders) mà không ảnh hưởng tới các luồng nghiệp vụ cá nhân của người dùng.
2. **Đan xen hỗ trợ D-Module:**
   - **`d-module-manager` (C-Module)** định nghĩa module nào được xuất hiện trên Dashboard của user.
   - **`network-servers` (C-Module)** cung cấp hạ tầng kết nối cho **`device-manager` (D-Module)** tạo thiết bị lên ThingPark hoặc ChirpStack.
