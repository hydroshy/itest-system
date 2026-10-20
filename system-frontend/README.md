# @itest/frontend-shell

**ITEST Micro-kernel Frontend Application Shell & Dynamic Plugin Host**

Kiến trúc Frontend App Shell chuẩn công nghiệp xây dựng trên nền tảng **Vue 3**, **Vite** và **Element Plus**, hoạt động như một máy chủ giao diện (Shell Host) tải động các module mở rộng từ hệ sinh thái độc lập (`itest-plugins`).

---

## 🌟 Kiến Trúc Nền Tảng (Architecture)

1. **Pure Micro-kernel App Shell**:
   - Tối giản hóa tối đa, không chứa mã nguồn nghiệp vụ hoặc driver giao thức cụ thể.
   - Quản trị định danh tập trung, điều hướng (`Vue Router 4`), kiểm soát phân quyền (`Pinia` + `PermissionGuard`).
   - Tích hợp chuẩn **ExtensionSlot** cho phép các standalone plugin cắm các giao diện (Widget, Device Details tab, Dashboard cards, Action buttons) vào Shell mà không cần rebuild lại mã nguồn App Shell.

2. **Cơ Chế Nạp Động An Toàn (Secure Dynamic Plugin Loader)**:
   - Nạp bundle JavaScript của plugin trực tiếp qua URL hoặc từ Core Plugin Storage (`/api/v1/plugins/:id/bundle`).
   - Kiểm duyệt tính toàn vẹn thông qua mã băm **SRI (Subresource Integrity)** trước khi thực thi.
   - Vận hành trong Sandbox bảo vệ tài nguyên trình duyệt, cách ly ngữ cảnh và giao tiếp liên plugin thông qua Event Bus tiêu chuẩn của `@platform/frontend-sdk`.

3. **Giao Diện Chuẩn Công Nghiệp (Industrial UI)**:
   - Bộ component sẵn sàng cho SCADA / IoT: `StatusBadge`, `ConnectionIndicator`, `MetricCard`.
   - `PermissionGuard`: Kiểm soát phân quyền khai báo (declarative RBAC) bảo vệ các nút bấm và view chức năng.

---

## 📂 Cấu Trúc Thư Mục (Directory Structure)

```text
itest-system/system-frontend/
├── dist/                      # Thư mục build production sẵn sàng triển khai
├── src/
│   ├── assets/                # CSS, logo, styles chuẩn công nghiệp
│   ├── components/            # Shared components (ExtensionSlot, PermissionGuard, ...)
│   ├── plugins/               # Dynamic Plugin Loader, SRI Verifier & Registry
│   ├── router/                # Vue Router 4 cấu hình routes lõi và dynamic injection
│   ├── stores/                # Pinia store (Auth, Plugins, Telemetry state)
│   ├── views/                 # Core Shell views (Dashboard, Devices, Plugin Manager, Login)
│   ├── __tests__/             # Vitest test suite xác thực Plugin Registry & RBAC Guards
│   ├── App.vue                # Root App component
│   └── main.ts                # Entrypoint khởi tạo Vue 3 Shell
├── index.html                 # HTML template
├── nginx.conf                 # Cấu hình máy chủ web production (Reverse Proxy & Cache)
├── Dockerfile                 # Multi-stage Docker build cho Frontend Shell
├── package.json               # Khai báo metadata @itest/frontend-shell và dependencies
├── tsconfig.json              # Cấu hình TypeScript nghiêm ngặt
├── vite.config.ts             # Cấu hình Vite bundler & vendor chunking
└── vitest.config.ts           # Cấu hình Vitest runner
```

---

## 🚀 Hướng Dẫn Phát Triển & Khởi Chạy (Getting Started)

### 1. Cài đặt Dependencies

Sử dụng `npm`:
```bash
npm install
```

### 2. Khởi chạy Môi trường Phát triển (Development)

```bash
npm run dev
```
Truy cập giao diện tại: `http://localhost:5173` (mặc định trỏ API backend tới `http://localhost:3000`).

### 3. Kiểm Thử Đơn Vị (Vitest Unit Tests)

Chạy bộ test suite xác thực Plugin Registry, Dynamic Loader và Permission Guard:
```bash
npm test
```
*Yêu cầu tiêu chuẩn: 100% tests PASS (3/3 test suites, 11/11 tests).*

### 4. Đóng Gói Triển Khai (Production Build)

Kiểm tra kiểu dữ liệu (TypeScript typecheck) và đóng gói bundle tối ưu:
```bash
npm run build
```
Artifacts sản phẩm hoàn tất sẽ được đặt trong thư mục `dist/`.

---

## 🐳 Triển Khai với Docker & Nginx

Build image Docker tối ưu multi-stage:
```bash
docker build -t itest-frontend-shell:latest .
```

Khởi chạy container phục vụ giao diện trên cổng `80`:
```bash
docker run -d -p 80:80 --name itest_frontend itest-frontend-shell:latest
```
Nginx đã được cấu hình tự động xử lý route SPA (`try_files $uri $uri/ /index.html;`) và reverse proxy các API call `/api/` về Backend Core.
