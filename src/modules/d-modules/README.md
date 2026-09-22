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
| **`test-automation/`** | `D_MOD_TEST_AUTOMATION` | **PRODUCT TEST AUTOMATION** | Bàn kiểm định xuất xưởng thiết bị LoRaWAN theo SO & Item Code, lưới trạng thái DevEUI real-time, audit log gói tin và đối soát quy tắc assertion. |
| **`telemetry-decoder`** | `D_MOD_TELEMETRY_DECODER` | **LIVE TELEMETRY & DECODER** | Giám sát dữ liệu uplink thời gian thực, giải mã và hiển thị bảng thuộc tính cảm biến. |
| **`hmi-scada-viewer`** | `D_MOD_HMI_SCADA` | **HMI SCADA MONITOR** | Giám sát giao diện công nghiệp Wecon HMI, đồ họa bồn chứa, đồng hồ đo và công tắc điều khiển. |
| **`lorawan-downlink`** | `D_MOD_LORAWAN_DOWNLINK` | **LORAWAN DOWNLINK** | Truyền lệnh downlink Hex tới ChirpStack/ThingPark, quản lý hàng đợi và lịch sử thực thi. |
| **`serial-uart-monitor`**| `D_MOD_SERIAL_UART` | **SERIAL UART DIAGNOSTIC** | Kết nối Web Serial API, chẩn đoán Modbus RTU / UART, memory map dạng bảng và continuous polling. |

---

## 🔄 Tính độc lập & Đan xen với C-Modules:
1. **Độc lập:** Mỗi D-Module có thể được bật/tắt, gán quyền riêng cho từng Role người dùng thông qua **C-Module `d-module-manager`**.
2. **Đan xen hỗ trợ C-Module:**
   - D-Module **`test-automation`** liên kết chặt chẽ với C-Module **`sales-orders`** (truy vấn danh sách đơn hàng & mã thành phẩm), **`item-codes`** (tự động nhận diện SKU, FW, Test Template), và **`test-builder`** (nạp luật assertion và kịch bản đối soát).
   - D-Module **`device-manager`** tự động liên kết dữ liệu với C-Module **`network-servers`** để lấy danh sách Network Server & Region Profiles khi người dùng tạo thiết bị mới.
