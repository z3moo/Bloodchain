# BLOODCHAIN

Ứng dụng quản lý kho máu trung tâm. Bao gồm:

- `frontend/` — Vue 3 + Vite, giao diện vận hành
- `backend/` — Express API, kết nối SQL Server
- `database/` — script tạo bảng, dữ liệu mẫu, view, stored procedure

## Tính năng chính

- Đăng nhập theo bốn vai trò: Quản trị (admin), Nhân viên (staff), Bệnh viện (hospital), Người hiến (donor). Mật khẩu được băm bằng **bcrypt**.
- Đăng ký tài khoản ngay từ màn hình đăng nhập:
  - **Người hiến**: tạo xong dùng được ngay, đồng thời sinh hồ sơ người hiến.
  - **Bệnh viện / Nhân viên**: gửi yêu cầu ở trạng thái *Chờ duyệt*; chỉ đăng nhập được sau khi quản trị duyệt (lúc duyệt mới tạo hồ sơ bệnh viện/nhân viên tương ứng).
- Phân quyền theo vai trò: mỗi vai trò chỉ thấy khu vực được phép, và backend giới hạn dữ liệu theo phạm vi (bệnh viện chỉ thấy bệnh nhân/phiếu của mình, người hiến chỉ thấy hồ sơ của mình).
- Trang riêng cho người hiến: Hồ sơ của tôi, Lịch sử hiến máu, Chiến dịch sắp tới (đăng ký tham gia), Điểm thưởng.
- Trang riêng cho bệnh viện: Tổng quan bệnh viện, Bệnh nhân, Phiếu yêu cầu (theo dõi trạng thái duyệt và phiếu xuất).
- Quản trị tài khoản: duyệt/từ chối tài khoản chờ duyệt, cấp quyền nhân viên, thu hồi quyền nhân viên, xóa tài khoản, khôi phục dữ liệu mẫu.
- Tab **Dữ liệu người hiến**: xem chi tiết và tìm kiếm (theo tên, SĐT, nhóm máu, mã) cho admin và nhân viên.
- Quy trình nghiệp vụ có kiểm soát:
  - Tách thành phần máu chỉ khi gói máu đã *Đạt* xét nghiệm và không có kết quả dương tính.
  - Hạn sử dụng thành phần tự tính theo loại (hồng cầu 42 ngày, huyết tương 365 ngày, tiểu cầu 5 ngày).
  - Xuất kho kiểm tra: phiếu đã duyệt, đúng nhóm máu, phản ứng chéo hòa hợp, thành phần còn hạn và sẵn sàng, không vượt thể tích yêu cầu.
  - Phiếu yêu cầu của bệnh viện do nhân viên/quản trị duyệt; bệnh viện không tự duyệt được.
- Tự cập nhật số liệu: số gói máu thực tế của chiến dịch và điểm tích lũy của người hiến thay đổi theo mỗi lần thêm/xóa gói máu.
- Báo cáo nhanh: tồn kho theo nhóm máu (chỉ tính thành phần sẵn sàng còn hạn), gói sắp hết hạn, hiệu quả chiến dịch.

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
│       ├── App.vue           Bộ khung, đăng nhập/đăng ký, điều hướng, phân quyền
│       ├── api.js            Lớp gọi API (gắn định danh người dùng vào header)
│       ├── style.css
│       └── views/            Các trang nghiệp vụ
│           ├── Dashboard.vue            Tổng quan (admin/staff)
│           ├── HospitalDashboard.vue    Tổng quan bệnh viện (hospital)
│           ├── Donors.vue               Quản lý người hiến (admin/staff)
│           ├── DonorData.vue            Tra cứu + tìm kiếm người hiến (admin/staff)
│           ├── Campaigns.vue            Chiến dịch
│           ├── BloodBags.vue            Gói máu toàn phần
│           ├── LabTests.vue             Xét nghiệm
│           ├── Components.vue           Kho máu / thành phần
│           ├── Hospitals.vue            Bệnh viện
│           ├── Patients.vue             Bệnh nhân
│           ├── Requests.vue             Phiếu yêu cầu + duyệt/từ chối
│           ├── Exports.vue              Xuất kho
│           ├── Reports.vue              Báo cáo
│           ├── Accounts.vue             Tài khoản + duyệt tài khoản chờ
│           ├── MyProfile.vue            Hồ sơ của tôi (donor)
│           ├── MyDonations.vue          Lịch sử hiến máu (donor)
│           ├── DonorCampaigns.vue       Chiến dịch sắp tới + đăng ký (donor)
│           ├── MyPoints.vue             Điểm thưởng (donor)
│           └── CrudPage.vue             Trang dùng chung cho thêm/sửa/xóa
│
├── backend/                  API
│   ├── server.js             Toàn bộ endpoint + phân quyền + nghiệp vụ
│   ├── db.js                 Kết nối SQL Server (Windows Auth hoặc SQL Auth)
│   ├── package.json
│   ├── .env.example
│   └── .env                  Cấu hình kết nối thực tế (không commit)
│
└── database/                 Script SQL
    ├── 00_schema.sql              Bảng nghiệp vụ và dữ liệu mẫu
    └── 02_auth_permissions.sql    Bảng tài khoản, vai trò, view, stored procedure
```

## Yêu cầu môi trường

- Node.js phiên bản 20 trở lên
- SQL Server (bản Express hoặc Developer đều được)
- SQL Server Management Studio (SSMS) hoặc `sqlcmd` để chạy script
- ODBC Driver 18 for SQL Server (cần khi dùng Windows Authentication)

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

Mở SSMS, kết nối tới instance đã chọn rồi tạo database:

```sql
CREATE DATABASE BloodChainDB;
```

Đặt database hiện tại sang `BloodChainDB`, sau đó chạy **theo đúng thứ tự**:

1. `database/00_schema.sql`
2. `database/02_auth_permissions.sql`

Hoặc nạp bằng dòng lệnh (thay server name cho đúng máy của bạn; `-C` để tin tưởng chứng chỉ của ODBC Driver 18, `-E` cho Windows Authentication):

```powershell
sqlcmd -S "localhost\MSSQLSERVER01" -d BloodChainDB -E -C -i "database\00_schema.sql"
sqlcmd -S "localhost\MSSQLSERVER01" -d BloodChainDB -E -C -i "database\02_auth_permissions.sql"
```

### 4. Chạy backend

```bash
npm run dev:backend
```

Backend lắng nghe ở `http://localhost:3000`. Lệnh này chạy từ thư mục `backend/` nên `.env` được nạp đúng.

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

Mật khẩu lưu trong DB dưới dạng băm bcrypt; bảng trên là mật khẩu gốc để đăng nhập thử.

## Quy ước mã (ID)

Mỗi đối tượng có mã dạng `TIỀN TỐ` + số thứ tự đệm 0 ba chữ số, tự tăng theo giá trị lớn nhất hiện có (và tự nới rộng khi vượt 999, ví dụ `NH1000`):

| Tiền tố | Đối tượng        | Ví dụ   |
|---------|------------------|---------|
| `NH`    | Người hiến       | `NH001` |
| `BV`    | Bệnh viện        | `BV001` |
| `NV`    | Nhân viên        | `NV001` |
| `CD`    | Chiến dịch       | `CD001` |
| `GM`    | Gói máu          | `GM001` |
| `BN`    | Bệnh nhân        | `BN001` |
| `XN`    | Xét nghiệm       | `XN001` |
| `TP`    | Thành phần máu   | `TP001` |
| `YC`    | Phiếu yêu cầu    | `YC001` |
| `PX`    | Phiếu xuất       | `PX001` |
| `TK`    | Tài khoản        | `TK001` |

