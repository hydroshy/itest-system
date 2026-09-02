# D-Modules (Dashboard Feature Modules)

Thư mục này chứa toàn bộ các **Module tính năng dành cho User trên Dashboard (`/dashboard`)**.

---

## 🎯 Quy chuẩn đặt tên & Cấu trúc (D-Module Standard):
- **Tiền tố:** `d-` (viết tắt của **Dashboard Module**) hoặc `D_MOD_` cho mã code.
- **Mục đích:** Cung cấp giao diện và tính năng độc lập cho người dùng cuối (User Portal), chịu sự kiểm soát phân quyền (RBAC) theo Role.

### Danh sách D-Modules tiêu chuẩn:
| Tên thư mục | Mã Code D-Module | Tên hiển thị | Vai trò & Khả năng hoạt động |
| :--- | :--- | :--- | :--- |
| **`device-manager/`** | `D_MOD_DEVICE_MANAGER` | **DEVICE MANAGER** | Quản lý thiết bị LoRaWAN dạng thẻ Card, giới hạn phạm vi sở hữu của User (User-Scoped Ownership). |
| **`telemetry-monitor/`** | `D_MOD_TELEMETRY` | **Live Telemetry Monitor** | Giám sát luồng gói tin LoRaWAN uplink theo thời gian thực (RSSI, SNR, Decoded JSON). |
| **`sensor-analytics/`** | `D_MOD_ANALYTICS` | **Sensor Data Analytics** | Biểu đồ trực quan, xu hướng lịch sử nhiệt độ, độ ẩm, áp suất,... |
| **`alarm-events/`** | `D_MOD_ALARMS` | **Alarms & Event Log** | Cảnh báo ngưỡng cảm biến, pin yếu, thiết bị mất kết nối. |
| **`report-generator/`** | `D_MOD_REPORTS` | **Report Generator** | Xuất báo cáo dữ liệu định dạng CSV/Excel. |
| **`gateway-status/`** | `D_MOD_GATEWAYS` | **Gateway Network Status** | Theo dõi trạng thái trạm thu phát Gateway. |
| **`payload-decoder/`** | `D_MOD_DECODER` | **Payload Formatter Sandbox** | Trình kiểm thử giải mã payload hex bằng JavaScript. |
| **`webhook-integrations/`** | `D_MOD_WEBHOOKS` | **Webhook Integrations** | Điểm cuối nhận webhook từ ChirpStack & ThingPark. |

---

## 🔄 Tính độc lập & Đan xen với C-Modules:
1. **Độc lập:** Mỗi D-Module có thể được bật/tắt, gán quyền riêng cho từng Role người dùng thông qua **C-Module `d-module-manager`**.
2. **Đan xen hỗ trợ C-Module:**
   - Ví dụ: D-Module **`device-manager`** tự động liên kết dữ liệu với C-Module **`network-servers`** để lấy danh sách Network Server & Region Profiles khi người dùng tạo thiết bị mới.
