# Daviteq Image & Icon Asset Guide

Thư mục này chứa toàn bộ hình ảnh và icon đại diện cho hệ thống Daviteq LoRaWAN Platform.
Bạn chỉ cần upload file hình ảnh đè lên các tên file tương ứng bên dưới.

---

## 📋 Danh sách Icon & Quy cách kích thước:

| Tên File | Vị trí hiển thị | Kích thước khuyên dùng | Tỷ lệ | Định dạng hỗ trợ | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`favicon.png`** (hoặc `favicon.ico`) | **Icon trên tab trình duyệt (Title Bar)** | `32x32 px` hoặc `64x64 px` | 1:1 (Vuông) | `.png`, `.ico`, `.svg` | Icon nhỏ hiển thị trên tab của trình duyệt web |
| **`logo-navbar.png`** (hoặc `logo-navbar.svg`) | **Icon góc trái trên thanh Navbar** (thay cho icon trụ sóng) | `64x64 px` hoặc `128x128 px` | 1:1 (Vuông) | `.png`, `.svg`, `.webp` | Logo đại diện thương hiệu Daviteq góc trên bên trái |
| **`logo-login.png`** (hoặc `logo-login.svg`) | **Icon / Logo chính tại trang Đăng nhập** | `128x128 px` hoặc `256x256 px` | 1:1 (Vuông) | `.png`, `.svg`, `.webp` | Logo lớn nổi bật ở đầu khung Login |
| **`logo-full.png`** *(Tùy chọn)* | Banner Logo đầy đủ (Bao gồm hình + chữ Daviteq) | `400x100 px` | 4:1 (Ngang) | `.png`, `.svg` | Dùng cho trường hợp muốn hiển thị logo thương hiệu dạng ngang |
| **`login-bg.png`** *(Tùy chọn)* | Hình nền trang đăng nhập | `1920x1080 px` | 16:9 | `.jpg`, `.png`, `.webp` | Hình nền công nghệ / IoT mờ phía sau |

---

## 💡 Lưu ý khi chuẩn bị hình ảnh:
1. **Nền trong suốt (Transparent Background):** Nên sử dụng file `.png` hoặc `.svg` có nền trong suốt (không có nền trắng) để hiển thị đẹp nhất trên giao diện Dark Mode / Glassmorphism.
2. **Tự động Fallback:** Hệ thống đã được lập trình sẵn cơ chế tự động:
   - Nếu bạn upload file `.png`, hệ thống sẽ ưu tiên tải `.png`.
   - Nếu chưa có file `.png`, hệ thống sẽ tự động hiển thị file `.svg` mặc định mà không bao giờ bị lỗi icon vỡ.
3. **Đường dẫn truy cập trực tiếp:** Toàn bộ file trong thư mục này có thể truy cập qua URL:
   - `http://<IP_HOST>:3000/images/favicon.png`
   - `http://<IP_HOST>:3000/images/logo-navbar.png`
   - `http://<IP_HOST>:3000/images/logo-login.png`
