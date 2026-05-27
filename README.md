# BLOODCHAIN

Ứng dụng quản lý kho máu trung tâm. Bao gồm:

- `frontend/` — Vue 3 + Vite, giao diện vận hành
- `backend/` — Express API, kết nối SQL Server
- `database/` — script tạo bảng, dữ liệu mẫu, view, stored procedure

## Tính năng chính

- Đăng nhập theo bốn vai trò: Quản trị, Nhân viên, Bệnh viện, Người hiến
- Đăng ký tài khoản người hiến mới ngay từ màn hình đăng nhập
- Phân quyền menu: mỗi vai trò chỉ thấy các khu vực được phép
- Quản trị tài khoản: cấp quyền nhân viên, thu hồi quyền nhân viên, xóa tài khoản
- Đầy đủ thao tác Thêm, Sửa, Xóa cho mọi đối tượng nghiệp vụ
- Báo cáo nhanh: tồn kho theo nhóm máu, gói sắp hết hạn, hiệu quả chiến dịch
- Tổng quan trực quan trên trang Dashboard
- Xuất kho theo phương pháp FIFO, ghi nhận phản ứng chéo

## Cấu trúc thư mục

```
bloodchain-local/
├── package.json              Script tổng (install, dev, build)
├── README.md                 File này
├── DETAILS.md                Tài liệu chi tiết
│
├── frontend/                 Giao diện người dùng
│   ├── index.html
│   ├── vite.config.js        Cấu hình proxy /api sang backend
│   ├── package.json
│   └── src/
│       ├── main.js
│       ├── App.vue           Bộ khung, đăng nhập, điều hướng
│       ├── api.js            Lớp gọi API
│       ├── style.css
│       └── views/            Các trang nghiệp vụ
│           ├── Dashboard.vue
│           ├── Donors.vue
│           ├── Campaigns.vue
│           ├── BloodBags.vue
│           ├── LabTests.vue
│           ├── Components.vue
│           ├── Hospitals.vue
│           ├── Patients.vue
│           ├── Requests.vue
│           ├── Exports.vue
│           ├── Reports.vue
│           ├── Accounts.vue
│           └── CrudPage.vue  Trang dùng chung cho thêm/sửa/xóa
│
├── backend/                  API
│   ├── server.js             Toàn bộ endpoint
│   ├── db.js                 Kết nối SQL Server (Windows Auth hoặc SQL Auth)
│   ├── package.json
│   ├── .env.example
│   └── .env                  Cấu hình kết nối thực tế (không commit)
│
└── database/                 Script SQL
    ├── 00_schema.sql         Bảng nghiệp vụ và dữ liệu mẫu
    └── 02_auth_permissions.sql  Bảng tài khoản, vai trò, stored procedure đăng nhập
```

## Yêu cầu môi trường

- Node.js phiên bản 20 trở lên
- SQL Server (bản Express hoặc Developer đều được)
- SQL Server Management Studio để chạy script và xem dữ liệu
- ODBC Driver 18 for SQL Server (chỉ cần khi dùng Windows Authentication)

## Cài đặt và chạy

### 1. Cài package

```bash
npm run install:all
```

### 2. Cấu hình kết nối

Sao chép `backend/.env.example` thành `backend/.env`, chỉnh thông tin cho phù hợp:

```env
PORT=3000
DB_SERVER=localhost\MSSQLSERVER01
DB_NAME=BloodChainDB
DB_ODBC_DRIVER=ODBC Driver 18 for SQL Server
DB_USER=
DB_PASSWORD=
DB_TRUST_SERVER_CERTIFICATE=true
DB_ENCRYPT=true
DB_USE_WINDOWS_AUTH=true
```

Nếu dùng SQL Authentication, đặt `DB_USE_WINDOWS_AUTH=false` rồi điền `DB_USER` và `DB_PASSWORD`.

### 3. Tạo database và nạp dữ liệu

Mở SSMS, kết nối tới instance đã chọn rồi chạy:

```sql
CREATE DATABASE BloodChainDB;
```

Đặt database hiện tại sang `BloodChainDB`, sau đó chạy theo thứ tự:

1. `database/00_schema.sql`
2. `database/02_auth_permissions.sql`

### 4. Chạy backend

```bash
npm run dev:backend
```

Backend lắng nghe ở `http://localhost:3000`.

### 5. Chạy frontend

Mở terminal khác:

```bash
npm run dev:frontend
```

Frontend chạy ở `http://localhost:5173`, tự proxy `/api` sang backend.

### 6. Build cho môi trường preview

```bash
npm run build
npm run preview:frontend
```

## Tài khoản mẫu

| Vai trò    | Tên đăng nhập | Mật khẩu        |
|------------|---------------|-----------------|
| Quản trị   | `admin`       | `Admin@123`     |
| Nhân viên  | `nhanvien01`  | `Nhanvien@123`  |
| Bệnh viện  | `benhvien01`  | `Benhvien@123`  |
| Người hiến | `nguoihien01` | `Nguoihien@123` |

