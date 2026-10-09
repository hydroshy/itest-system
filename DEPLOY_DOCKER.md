# HƯỚNG DẪN TRIỂN KHAI VÀ VẬN HÀNH DOCKER CONTAINER
# DAVITEQ LORAWAN IOT PLATFORM

> **Tài liệu:** Hướng dẫn đóng gói Multi-Stage Build, cấu hình Docker Compose, khởi tạo cơ sở dữ liệu và vận hành hệ thống container.  
> **Dự án:** Daviteq LoRaWAN Platform & Final Config Station  
> **Phiên bản:** 1.0.0 (Production-Ready)  
> **Nguyên tắc cốt lõi:** Zero Code Diff đối với mã nguồn nghiệp vụ `dvt/src/`, TypeORM `synchronize: false`.

---

## 1. TỔNG QUAN KIẾN TRÚC ĐÓNG GÓI (ARCHITECTURE OVERVIEW)

Hệ thống được đóng gói thành mô hình đa dịch vụ (multi-service stack) được điều phối thông qua Docker Compose:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      DOCKER NETWORK: lorawan_net                       │
│                                                                        │
│   ┌────────────────────┐   HTTP :3000   ┌──────────────────────────┐   │
│   │   Host / Ingress   ├───────────────►│     nest_lorawan_app     │   │
│   │     (Browser/UI)   │                │     (NestJS Backend)     │   │
│   └────────────────────┘                └─────────────┬────────────┘   │
│                                                       │                │
│                                                  TCP  │ :5432          │
│                                                       ▼                │
│   ┌────────────────────┐   HTTP :3099   ┌──────────────────────────┐   │
│   │  daviteq_ops_agent ├───────────────►│       postgres_db        │   │
│   │  (Management Tool) │                │  (PostgreSQL 15 Alpine)  │   │
│   └─────────┬──────────┘                └─────────────┬────────────┘   │
│             │                                         │                │
│      Docker Socket                              Docker Volume          │
│  /var/run/docker.sock                          postgres_data           │
└────────────────────────────────────────────────────────────────────────┘
```

### Thành phần các Container:
1. **`nest_lorawan_app` (NestJS Backend Service)**:
   - Base image: `node:20-alpine`.
   - Cơ chế đóng gói: **Multi-stage build** tối ưu dung lượng và bảo mật.
   - Stage 1 (`builder`): Cài đặt công cụ C++ (`python3`, `make`, `g++`), cài đặt toàn bộ `npm ci` và biên dịch TypeScript sang JavaScript (`npm run build`).
   - Stage 2 (`runner`): Cài đặt `curl` cho healthcheck, chỉ cài đặt production dependencies (`npm ci --only=production`), sao chép artifacts (`dist/`), file cấu hình (`config/`) và static assets (`public/`).
   - Cổng giao tiếp: `3000:3000`.
   - Healthcheck tích hợp: `curl -f http://localhost:3000/login`.

2. **`postgres_db` (Database Service)**:
   - Image: `postgres:15-alpine`.
   - Cổng giao tiếp: `5432:5432`.
   - Lưu trữ dữ liệu: Docker volume `postgres_data` gắn vào `/var/lib/postgresql/data`.
   - Tự động nạp DDL khởi tạo: Mount thư mục `deploy/database/init/` vào `/docker-entrypoint-initdb.d:ro`. Khi container khởi chạy lần đầu, PostgreSQL tự động thực thi `01_init_schema.sql` (34 bảng) theo đúng thứ tự.
   - Healthcheck: `pg_isready -U admin -d dvt`.

3. **`daviteq_ops_agent` (Operational Management Tool)**:
   - Tool giám sát, theo dõi trạng thái container và database schema.
   - Cổng giao tiếp: `3099:3099`.
   - Phụ thuộc: Khởi động sau khi `postgres_db` đã ở trạng thái `healthy`.

---

## 2. YÊU CẦU TIÊN QUYẾT (PREREQUISITES)

- **Docker Engine**: Phiên bản `>= 20.10.0`
- **Docker Compose**: Phiên bản `>= 2.0.0` (Docker Compose V2)
- **Cổng mạng khả dụng trên máy chủ**:
  - `3000`: Ứng dụng NestJS Web & REST API
  - `5432`: PostgreSQL Database
  - `3099`: Daviteq Ops Agent

---

## 3. CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV.DOCKER)

Hệ thống sử dụng file `.env.docker` để quản lý tập trung toàn bộ tham số môi trường:

| Tên biến | Mặc định | Mô tả |
| :--- | :--- | :--- |
| `PORT` | `3000` | Cổng HTTP lắng nghe của ứng dụng NestJS |
| `NODE_ENV` | `production` | Chế độ thực thi ứng dụng (production/development) |
| `PAYLOAD_LIMIT` | `50mb` | Giới hạn kích thước payload Express (phục vụ upload CSV / Memmap lớn) |
| `JWT_SECRET` | `Production_Super_Secret_...` | Khóa bí mật ký mã token định danh xác thực JWT |
| `DB_HOST` | `postgres_db` | Địa chỉ host của cơ sở dữ liệu (tên service trong Docker network) |
| `DB_PORT` | `5432` | Cổng kết nối PostgreSQL |
| `DB_USERNAME` | `admin` | Tên người dùng quản trị PostgreSQL |
| `DB_PASSWORD` | `mason` | Mật khẩu truy cập PostgreSQL |
| `DB_NAME` | `dvt` | Tên cơ sở dữ liệu chính |
| `DB_SYNCHRONIZE` | `false` | Bắt buộc `false` để ngăn chặn TypeORM tự động sửa schema |
| `DB_LOGGING` | `false` | Bật/tắt ghi log các câu truy vấn SQL chi tiết ra stdout |
| `DB_ROUTING_CONFIG_PATH` | `/app/config/db-routing.config.json` | Đường dẫn file định tuyến bảng động trong container |
| `OPS_AGENT_URL` | `http://ops_agent:3099` | Địa chỉ URL kết nối đến Ops Agent nội bộ |

---

## 4. QUY TRÌNH KHỞI CHẠY NHANH (QUICK START)

### Cách 1: Sử dụng Helper Script (`deploy/docker-run.sh`) - KHUYÊN DÙNG

Thư mục `deploy/` cung cấp script quản trị `docker-run.sh` tích hợp đầy đủ lệnh vận hành:

```bash
# 1. Cấp quyền thực thi script (nếu chưa có)
chmod +x deploy/docker-run.sh deploy/apply-migrations.sh

# 2. Biên dịch Docker image
./deploy/docker-run.sh build

# 3. Khởi chạy toàn bộ stack container ở chế độ nền (detached mode)
./deploy/docker-run.sh up

# 4. Kiểm tra trạng thái và sức khỏe của các container
./deploy/docker-run.sh status
./deploy/docker-run.sh health

# 5. Xem log trực tiếp của hệ thống
./deploy/docker-run.sh logs

# 6. Xem log riêng của ứng dụng backend
./deploy/docker-run.sh logs app
```

### Cách 2: Sử dụng lệnh Docker Compose trực tiếp

```bash
# Khởi chạy toàn bộ stack với cấu hình .env.docker
docker compose --env-file .env.docker up -d --build

# Kiểm tra trạng thái container
docker compose ps

# Dừng hệ thống
docker compose down
```

---

## 5. CƠ CHẾ KHỞI TẠO CƠ SỞ DỮ LIỆU & MIGRATION

### 5.1. Khởi tạo Database tự động lần đầu (First-run Auto-Init)
- File `docker-compose.yml` cấu hình volume mount:
  ```yaml
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./deploy/database/init:/docker-entrypoint-initdb.d:ro
  ```
- Khi container `postgres_db` khởi động lần đầu (khi volume `postgres_data` chưa có dữ liệu), PostgreSQL tự động quét thư mục `/docker-entrypoint-initdb.d` và nạp toàn bộ DDL từ `01_init_schema.sql`.
- Bộ schema chuẩn bao gồm **34 bảng**, các chỉ mục (indexes), ràng buộc duy nhất (unique constraints), sequences và dữ liệu mẫu khởi tạo.

### 5.2. Chạy cập nhật DDL gia tăng (Incremental Migrations)
Để áp dụng các file SQL cập nhật mới nhất từ `deploy/database/updates/` vào container đang chạy:

```bash
# Sử dụng script quản trị tích hợp
./deploy/docker-run.sh migrate

# Hoặc thực thi trực tiếp runner
./deploy/apply-migrations.sh
```

Script sẽ tự động duyệt tuần tự tất cả các file migration trong `deploy/database/updates/*.sql`, thực thi an toàn trong các khối giao dịch và kiểm tra tổng số lượng bảng sau khi hoàn tất.

---

## 6. KIỂM THỬ XÁC THỰC DỊCH VỤ & HEALTHCHECK

Sau khi khởi chạy thành công, kiểm tra các điểm truy cập sau:

| Dịch vụ / Tính năng | Địa chỉ truy cập | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Giao diện Đăng nhập** | `http://localhost:3000/login` | HTTP `200 OK`, render giao diện đăng nhập đầy đủ logo/favicon |
| **Tài liệu Swagger API** | `http://localhost:3000/api/docs` | HTTP `200 OK`, hiển thị tài liệu đặc tả OpenAPI/Swagger |
| **Static Assets (Logo)** | `http://localhost:3000/images/logo-full.png` | HTTP `200 OK`, ảnh hiển thị chuẩn, không lỗi 404 |
| **PostgreSQL Database** | `localhost:5432` | Chấp nhận kết nối với user `admin`, database `dvt` |
| **Daviteq Ops Agent** | `http://localhost:3099` | HTTP `200 OK`, giao diện quản trị Ops Agent hoạt động |

Kiểm tra nhanh bằng curl:
```bash
curl -I http://localhost:3000/login
curl -I http://localhost:3000/images/logo-full.png
curl -I http://localhost:3099/health
```

---

## 7. CẨM NANG VẬN HÀNH & BẢO TRÌ (OPERATIONS MANUAL)

### 7.1. Quản lý vòng đời Container
```bash
# Khởi động lại riêng ứng dụng backend (không làm gián đoạn DB)
docker compose restart app

# Dừng stack tạm thời
docker compose stop

# Tiếp tục chạy stack
docker compose start

# Tắt và xóa containers (dữ liệu DB trên volume vẫn an toàn)
docker compose down
```

### 7.2. Sao lưu và Khôi phục Dữ liệu (Backup & Restore)
```bash
# Sao lưu cơ sở dữ liệu ra file SQL trên máy host
docker exec -t postgres_db pg_dump -U admin -d dvt > backup_$(date +%Y%m%d_%H%M%S).sql

# Khôi phục dữ liệu từ file backup SQL
cat backup_file.sql | docker exec -i postgres_db psql -U admin -d dvt
```

### 7.3. Xóa sạch dữ liệu và khởi tạo lại từ đầu (Factory Reset)
```bash
# CẢNH BÁO: Thao tác này sẽ xóa toàn bộ dữ liệu PostgreSQL trong volume!
./deploy/docker-run.sh clean
# Hoặc:
docker compose down -v
```

---

## 8. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

### 1. Lỗi xung đột cổng `5432` hoặc `3000` (`bind: address already in use`):
- **Nguyên nhân**: Máy host đã có dịch vụ PostgreSQL hoặc tiến trình Node.js đang chạy trên các cổng này.
- **Khắc phục**: Dừng dịch vụ trên máy host (`sudo systemctl stop postgresql`) hoặc đổi cổng mapping trong `docker-compose.yml` (ví dụ `"5433:5432"`, `"3001:3000"`).

### 2. Backend báo lỗi `ECONNREFUSED` khi kết nối PostgreSQL:
- **Nguyên nhân**: Container ứng dụng khởi động trước khi PostgreSQL hoàn tất khởi tạo.
- **Khắc phục**: `docker-compose.yml` đã được cấu hình cơ chế `condition: service_healthy` với `depends_on`. Ứng dụng chỉ được khởi động khi `pg_isready` trả về thành công.

### 3. Thiếu ảnh tĩnh hoặc lỗi 404 cho `/images/` và `/public/`:
- **Nguyên nhân**: Quá trình build Docker không copy thư mục `public/`.
- **Khắc phục**: `Dockerfile` đã chuẩn hóa lệnh `COPY --from=builder /app/public ./public` ở Stage 2 runner, đảm bảo đầy đủ tài nguyên tĩnh.

### 4. Lỗi biên dịch `bcrypt` native module trên Alpine:
- **Nguyên nhân**: Thiếu C++ build tools trên Alpine Linux (`musl` libc).
- **Khắc phục**: `Dockerfile` đã cài đặt `python3 make g++` trong cả Stage 1 và Stage 2, sau đó tự động xóa sau khi biên dịch xong để giữ image nhẹ nhất.

---

## 9. QUY CHUẨN TUÂN THỦ KIẾN TRÚC (ARCHITECTURAL COMPLIANCE)

- **Zero Backend Code Diff**: Quá trình đóng gói hoàn toàn không can thiệp, không sửa đổi bất kỳ tệp tin nào trong thư mục `dvt/src/`. Kết quả kiểm tra `git diff dvt/src/` luôn trả về 0 dòng thay đổi.
- **No Automatic Schema Sync**: Thuộc tính `DB_SYNCHRONIZE=false` được áp dụng mặc định ở cả cấp độ biến môi trường và mã nguồn NestJS TypeORM, đảm bảo việc kiểm soát toàn vẹn DDL thuộc về bộ script SQL độc lập.
