# D-Modules (Dashboard Feature Modules)

Thư mục này chứa toàn bộ các **Module tính năng dành cho User trên Dashboard (`/dashboard`)**.

---

## 🎯 Quy chuẩn đặt tên & Cấu trúc (D-Module Standard):
- **Tiền tố:** `d-` (viết tắt của **Dashboard Module**) hoặc `D_MOD_` cho mã code.
- **Mục đích:** Cung cấp giao diện và tính năng độc lập cho người dùng cuối (User Portal), chịu sự kiểm soát phân quyền (RBAC) theo Role.

### Danh sách D-Modules:
| Tên thư mục | Mã Code D-Module | Tên hiển thị | Vai trò & Khả năng hoạt động |
| :--- | :--- | :--- | :--- |
| **`device-manager/`** | `D_MOD_DEVICE_MANAGER` | **DEVICE MANAGER** | Quản lý thiết bị LoRaWAN dạng thẻ Card, giới hạn phạm vi sở hữu của User (User-Scoped Ownership). |

---

## 🔄 Tính độc lập & Đan xen với C-Modules:
1. **Độc lập:** Mỗi D-Module có thể được bật/tắt, gán quyền riêng cho từng Role người dùng thông qua **C-Module `d-module-manager`**.
2. **Đan xen hỗ trợ C-Module:**
   - Ví dụ: D-Module **`device-manager`** tự động liên kết dữ liệu với C-Module **`network-servers`** để lấy danh sách Network Server & Region Profiles khi người dùng tạo thiết bị mới.
