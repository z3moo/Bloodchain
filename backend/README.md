# BloodChain Backend

Backend cho:
- đăng nhập
- đăng ký tài khoản người hiến
- xem danh sách tài khoản
- chuyển thành staff
- thu hồi staff
- xóa tài khoản
- reset database về dữ liệu mẫu

## 1. Cài package

```bash
npm install
```

## 2. Tạo file môi trường

Sao chép `.env.example` thành `.env` rồi sửa thông tin database.

Ví dụ:

```env
PORT=3000
DB_SERVER=localhost
DB_NAME=BloodChainDB
DB_ODBC_DRIVER=ODBC Driver 18 for SQL Server
DB_USER=
DB_PASSWORD=
DB_TRUST_SERVER_CERTIFICATE=true
DB_ENCRYPT=true
DB_USE_WINDOWS_AUTH=true
```

## 3. Khởi tạo database

Bạn tự tạo database trước, sau đó chạy file theo thứ tự:

1. `../database/00_schema.sql` - tạo bảng và dữ liệu mẫu
2. `../database/02_auth_permissions.sql` - tạo tài khoản, phân quyền và stored procedure đăng nhập

## 4. Chạy backend

```bash
npm run dev
```

Backend mặc định chạy ở `http://localhost:3000`.

## 5. Chạy cùng frontend local

Từ thư mục gốc `bloodchain-local`, mở thêm terminal khác và chạy:

```bash
npm run dev:frontend
```

Frontend Vite sẽ chạy ở `http://localhost:5173` và proxy API sang backend local.

## API chính

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/accounts`
- `PATCH /api/accounts/:username/promote`
- `PATCH /api/accounts/:username/revoke`
- `DELETE /api/accounts/:username`
- `POST /api/admin/reset-database`
