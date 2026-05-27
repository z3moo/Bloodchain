# BLOODCHAIN — Tài liệu chi tiết

---

## 1. Mô hình dữ liệu

### 1.1 Bảng nghiệp vụ (file `database/00_schema.sql`)

| Bảng                | Mô tả                                              | Khóa chính       |
|---------------------|----------------------------------------------------|------------------|
| `NHOM_MAU`          | Danh mục nhóm máu (O+, O-, A+, ...)                | `MaNhomMau`      |
| `CHIEN_DICH`        | Chiến dịch tiếp nhận máu                           | `MaChienDich`    |
| `BENH_VIEN`         | Bệnh viện đối tác                                  | `MaBV`           |
| `NHAN_VIEN`         | Nhân viên trung tâm                                | `MaNV`           |
| `NGUOI_HIEN`        | Người hiến máu                                     | `MaNguoiHien`    |
| `QUY_DOI_DIEM`      | Lịch sử đổi điểm thưởng                            | `MaDoiQua`       |
| `VI_TRI_KHO`        | Tủ và ngăn lưu trữ                                 | `MaViTri`        |
| `GOI_MAU_TOAN_PHAN` | Gói máu thu được trong chiến dịch                  | `MaGoiMau`       |
| `KET_QUA_XET_NGHIEM`| Kết quả xét nghiệm cho từng gói máu                | `MaXetNghiem`    |
| `THANH_PHAN_MAU`    | Thành phần tách ra (hồng cầu, huyết tương, tiểu cầu)| `MaThanhPhan`    |
| `BENH_NHAN`         | Bệnh nhân nhận máu                                 | `MaBenhNhan`     |
| `PHIEU_YEU_CAU`     | Phiếu yêu cầu máu từ bệnh viện                     | `MaPhieuYC`      |
| `PHIEU_XUAT`        | Phiếu xuất kho                                     | `MaPhieuXuat`    |
| `CHI_TIET_XUAT`     | Chi tiết thành phần xuất theo từng phiếu xuất      | `(MaPhieuXuat, MaThanhPhan)` |

### 1.2 Bảng tài khoản (file `database/02_auth_permissions.sql`)

| Bảng        | Mô tả                                | Ghi chú                                 |
|-------------|--------------------------------------|------------------------------------------|
| `VAI_TRO`   | Bốn vai trò: ADMIN, STAFF, HOSPITAL, DONOR | Mã vai trò là VARCHAR                    |
| `TAI_KHOAN` | Một dòng cho mỗi tài khoản           | `TenDangNhap` có `UNIQUE`, mật khẩu lưu plaintext cho mục đích học tập |

Bảng `TAI_KHOAN` tham chiếu sang `NHAN_VIEN`, `NGUOI_HIEN`, `BENH_VIEN` để biết tài khoản nào ứng với nhân viên, người hiến, bệnh viện cụ thể.

### 1.3 Stored procedure đáng chú ý

| Procedure              | Tác dụng                                                                |
|------------------------|-------------------------------------------------------------------------|
| `sp_DangNhap`          | Trả về dòng tài khoản nếu khớp tên đăng nhập, mật khẩu, và `TrangThai = 'Hoạt động'` |
| `sp_DangKyNguoiHien`   | Thêm tài khoản mới với vai trò `DONOR` và trạng thái `Hoạt động`        |
| `sp_ChuyenThanhStaff`  | Đổi vai trò sang `STAFF` (không tác động đến `ADMIN`)                   |
| `sp_ThuHoiStaff`       | Đổi vai trò từ `STAFF` về `DONOR` hoặc `HOSPITAL`                       |
| `sp_XoaTaiKhoan`       | Xóa tài khoản (không xóa được `ADMIN`)                                  |

### 1.4 Sơ đồ quan hệ tóm tắt

```
NHOM_MAU ─┬─< NGUOI_HIEN ─< GOI_MAU_TOAN_PHAN ─< THANH_PHAN_MAU >─ VI_TRI_KHO
          │                                       │
          │                                       └─< CHI_TIET_XUAT >─ PHIEU_XUAT >─ PHIEU_YEU_CAU
          │                                                                          │
          └─< BENH_NHAN >─ BENH_VIEN                                                  │
                            └────────────── PHIEU_YEU_CAU ───────────────────────────┘

NHAN_VIEN ─< (MaNV_ThuNhan, MaNV_ThucHien, MaNV_Duyet, MaNV_Xuat) trong các bảng nghiệp vụ
CHIEN_DICH ─< GOI_MAU_TOAN_PHAN
NGUOI_HIEN ─< QUY_DOI_DIEM

VAI_TRO ─< TAI_KHOAN ─> NHAN_VIEN, NGUOI_HIEN, BENH_VIEN
```

---

## 2. Backend

File: `backend/server.js`. Toàn bộ API gói trong một file để dễ đọc.

### 2.1 Khởi động và cấu hình

- `dotenv` đọc `backend/.env`.
- `db.js` chọn driver: nếu `DB_USE_WINDOWS_AUTH=true` dùng `mssql/msnodesqlv8`, ngược lại dùng `mssql` thuần với username/password.
- Toàn bộ kết nối đi qua `getPool()` để tái sử dụng connection pool.

### 2.2 Các tiện ích trong `server.js`

| Hàm           | Tác dụng                                                                            |
|---------------|--------------------------------------------------------------------------------------|
| `T`           | Đối tượng chứa văn bản tiếng Việt (lỗi, mặc định) để dùng lại                       |
| `safeError`   | Bắt lỗi SQL và trả thông điệp tiếng Việt: 547 → khóa ngoại, 2627 → trùng UNIQUE     |
| `nText`       | Chuyển chuỗi sang dạng `NCHAR(...) + NCHAR(...)` để chắc chắn lưu đúng tiếng Việt   |
| `nLike`       | Bọc `%...%` cho `LIKE` tiếng Việt                                                  |
| `asInt`       | Chuyển sang số nguyên hoặc dùng giá trị mặc định                                    |
| `asDateTime`  | Chuyển sang `Date`, mặc định là `now`                                               |
| `nextId`      | Sinh mã kế tiếp dạng `PREFIX + số (zero-pad)`. Dùng `MAX(suffix)+1` để tránh trùng  |
| `firstValue`  | Lấy giá trị đầu tiên từ một câu SELECT, có giá trị fallback                         |
| `mapAccount`  | Chuyển dòng SQL thành object JSON cho frontend, không trả `MatKhau`                 |
| `updateRow`   | Tạo câu UPDATE từ object mô tả các trường (kèm tham số hoặc raw SQL)                |
| `deleteRow`   | Xóa một dòng theo khóa chính                                                        |
| `runSqlText`  | Chia file SQL theo `GO` và chạy từng batch — phục vụ chức năng khôi phục dữ liệu mẫu |

### 2.3 Endpoint

#### Hệ thống

- `GET /api/health` — kiểm tra kết nối SQL Server.
- `POST /api/admin/reset-database` — chạy lại `00_schema.sql` và `02_auth_permissions.sql`.

#### Đăng nhập / đăng ký

- `POST /api/auth/login` — gọi `sp_DangNhap`. Trả 401 nếu sai, 200 nếu đúng.
- `POST /api/auth/register` — kiểm tra trùng username, gọi `sp_DangKyNguoiHien`.

#### Tài khoản

- `GET /api/accounts`
- `PATCH /api/accounts/:username/promote`
- `PATCH /api/accounts/:username/revoke` — body `{ role: 'donor' | 'hospital' }`
- `DELETE /api/accounts/:username`

#### Lookup (cho dropdown)

- `GET /api/blood-groups`
- `GET /api/staff`
- `GET /api/storages`

#### CRUD nghiệp vụ

Mỗi nhóm gồm `GET`, `POST`, `PUT /:id`, `DELETE /:id`:

- `/api/donors`
- `/api/campaigns`
- `/api/hospitals`
- `/api/patients`
- `/api/blood-bags`
- `/api/lab-tests`
- `/api/components`
- `/api/requests`

`/api/exports` đặc biệt: `GET` gom `CHI_TIET_XUAT` thành chuỗi mã thành phần, `POST` ghi cùng lúc `PHIEU_XUAT` + `CHI_TIET_XUAT` rồi cập nhật trạng thái thành phần. `DELETE` đảo ngược trạng thái thành phần về `Sẵn sàng`.

#### Báo cáo

- `GET /api/reports/inventory`
- `GET /api/reports/expiring`
- `GET /api/reports/campaigns`

### 2.4 Xử lý lỗi

`safeError` xem xét hai loại lỗi quan trọng:

1. Mã 547 hoặc thông điệp `FOREIGN KEY` — trả 409 `"Dữ liệu đang được dùng ở nơi khác, không thể xóa."`
2. Mã 2627 hoặc thông điệp `UNIQUE KEY` — trả 409 `"Giá trị đã tồn tại, vui lòng dùng giá trị khác."`

Mọi lỗi khác trả 500 với thông điệp chung. Chi tiết được log ra console của backend.

---

## 3. Frontend

### 3.1 `App.vue`

- Đăng nhập / đăng ký, lưu phiên trong `localStorage` với khóa `bloodchain.currentUser`.
- Cấu hình `modules` mô tả trang nào hiển thị cho vai trò nào (`access: ['admin', 'staff']`).
- `groupedModules` chia menu theo nhóm: Điều hành, Người hiến, Tiếp nhận, Y khoa, Kho, Cung ứng, Tổng hợp.
- Dùng `pushState/replaceState` cho điều hướng, không cần Vue Router.
- Khi vai trò không cho phép trang đang đứng, tự chuyển về trang đầu tiên hợp lệ.

### 3.2 `api.js`

Lớp gọi API gọn:

```js
api.list('/donors')                  // GET
api.create('/donors', payload)       // POST
api.update('/donors', id, payload)   // PUT
api.patch('/accounts', `${u}/promote`, {})
api.remove('/donors', id)            // DELETE
api.reports.inventory()              // GET /reports/inventory
```

Lỗi không 2xx → ném `Error` với thông điệp lấy từ body trả về.

### 3.3 `CrudPage.vue` — trang dùng chung

Toàn bộ các trang nghiệp vụ chỉ cần khai báo `fields` và `columns`, sau đó truyền cho `CrudPage`. Trang này tự xử lý:

- Tải danh sách qua `api.list(endpoint)`
- Hiển thị form Thêm với nút **Lưu thông tin** và **Làm mới**
- Chuyển sang chế độ Sửa khi bấm **Sửa** trên hàng — nút trở thành **Cập nhật** và **Hủy chỉnh sửa**
- Xác nhận trước khi **Xóa**, gọi `api.remove`, hiển thị lỗi 409 nếu vướng khóa ngoại
- Tải danh sách lookup (`optionsFrom`) song song khi mount

#### Cấu trúc một field

```js
{
  key: 'donorId',                 // tên thuộc tính trong payload
  label: 'Người hiến',            // nhãn hiển thị
  type: 'text' | 'number' | 'date' | 'datetime-local',
  default: 'NH001',               // giá trị mặc định
  placeholder: '...',
  options: [{ id, name }, ...],   // dropdown tĩnh
  optionsFrom: '/donors',         // dropdown lấy từ API (nhận về [{id, name}, ...])
}
```

#### Cấu trúc một column

```js
{
  key: 'donorId',
  label: 'Người hiến',
  type: 'date' | 'datetime',  // định dạng vi-VN
  lookup: 'donorId',           // dùng dữ liệu của field optionsFrom để hiển thị "name (id)"
}
```

### 3.4 `Accounts.vue`

Bảng tài khoản với các thao tác:

- **Chuyển thành Staff** — gọi `PATCH /accounts/:u/promote`
- **Không cho làm Staff** — gọi `PATCH /accounts/:u/revoke` (vai trò mới được suy ra từ `hospitalId`)
- **Xóa** — gọi `DELETE /accounts/:u`
- Vùng nguy hiểm: nút **Khôi phục dữ liệu mẫu** chạy `POST /admin/reset-database`

### 3.5 `Dashboard.vue` và `Reports.vue`

Cả hai gọi đồng thời các endpoint báo cáo, hiển thị thẻ thống kê và bảng:

- Tổng túi máu sẵn sàng theo nhóm máu
- Số túi sắp hết hạn (≤ 30 ngày)
- Số phiếu chờ duyệt (lọc tại frontend bằng `status.includes('Chờ')`)
- Đăng ký hiến máu (số lượng người hiến)
- Hiệu quả chiến dịch (so sánh dự kiến / thực tế)

---

## 4. Quy trình nghiệp vụ trong giao diện

```
1. Tiếp nhận
   - Đăng ký người hiến  (Donors)
   - Tạo chiến dịch       (Campaigns)
   - Lập gói máu          (BloodBags)

2. Y khoa
   - Xét nghiệm           (LabTests)

3. Kho
   - Tách thành phần,
     xếp vị trí           (Components)

4. Cung ứng
   - Tạo phiếu yêu cầu    (Requests)
   - Lập phiếu xuất FIFO  (Exports)

5. Tổng hợp
   - Báo cáo              (Reports)
   - Tài khoản            (Accounts)
```

Trang **Dashboard** liên kết nhanh sang **Phiếu yêu cầu** và **Báo cáo**.

---

## 5. Phân quyền menu

| Trang             | admin | staff | hospital | donor |
|-------------------|:-----:|:-----:|:--------:|:-----:|
| Dashboard         |  X    |  X    |          |       |
| Donors            |  X    |  X    |          |  X    |
| Campaigns         |  X    |  X    |          |       |
| BloodBags         |  X    |  X    |          |       |
| LabTests          |  X    |  X    |          |       |
| Components        |  X    |  X    |          |       |
| Hospitals         |  X    |  X    |          |       |
| Patients          |  X    |  X    |   X      |       |
| Requests          |  X    |  X    |   X      |       |
| Exports           |  X    |  X    |          |       |
| Reports           |  X    |       |          |       |
| Accounts          |  X    |       |          |       |

Quy ước về vai trò sau khi thu hồi quyền Staff: nếu tài khoản còn liên kết `MaBV` thì trở về `HOSPITAL`, ngược lại trở về `DONOR`.

---

## 6. Khôi phục dữ liệu mẫu

Khi ở trang **Tài khoản**, quản trị viên có thể bấm **Khôi phục dữ liệu mẫu**. Backend thực hiện:

1. Drop view, procedure, bảng `TAI_KHOAN`, `VAI_TRO` (giữ thứ tự ngược chiều phụ thuộc).
2. Chạy lại `database/00_schema.sql` — drop và tạo lại toàn bộ bảng nghiệp vụ + dữ liệu mẫu.
3. Chạy lại `database/02_auth_permissions.sql` — tạo lại bốn tài khoản mẫu và stored procedure.

Như vậy mọi thay đổi nghiệp vụ và tài khoản đều quay về trạng thái khởi tạo. Đây là thao tác phá hủy, đã có hộp thoại xác nhận trước khi gọi API.

---

## 7. Cách thêm một đối tượng mới

Giả sử bạn muốn thêm trang quản lý **Tủ lạnh kho**. Các bước:

1. **Database** — bảng `VI_TRI_KHO` đã có sẵn (ví dụ minh họa). Nếu là bảng mới, thêm `CREATE TABLE` và dữ liệu mẫu vào `00_schema.sql`.
2. **Backend** — trong `server.js` thêm bốn endpoint:
   ```js
   app.get('/api/storages', ...)
   app.post('/api/storages', ...)
   app.put('/api/storages/:id', ...)   // dùng updateRow
   app.delete('/api/storages/:id', ...) // dùng deleteRow
   ```
3. **Frontend** — tạo `frontend/src/views/Storages.vue`:
   ```vue
   <script setup>
   import CrudPage from './CrudPage.vue'
   const fields = [
     { key: 'name', label: 'Tên tủ' },
     { key: 'shelf', label: 'Ngăn', type: 'number', default: 1 },
   ]
   const columns = [
     { key: 'id', label: 'Mã' },
     { key: 'name', label: 'Tên tủ' },
     { key: 'shelf', label: 'Ngăn' },
   ]
   </script>
   <template>
     <CrudPage title="Tủ lạnh kho" description="..." form-title="..."
               endpoint="/storages" :fields="fields" :columns="columns" />
   </template>
   ```
4. **App.vue** — import `Storages.vue` và thêm vào mảng `modules` với `access` mong muốn.
5. Reload, vai trò được cấp sẽ thấy menu mới với đầy đủ Thêm/Sửa/Xóa.

---

## 8. Một số quyết định thiết kế

### 8.1 Vì sao dùng `NCHAR(...)` thay vì `N'...'`?

Khi chạy script qua sqlcmd, encoding UTF-16 BOM của file đôi lúc bị driver đọc sai dẫn đến chữ tiếng Việt vỡ. Dùng `NCHAR(<code-point>)` đảm bảo cùng kết quả ở mọi môi trường, dù chậm gõ hơn.

### 8.2 Vì sao `nextId` lại dùng `MAX(suffix)+1`?

Cách cũ `COUNT(*)+1` sẽ trùng khóa khi có hàng bị xóa giữa chừng. `MAX(suffix)+1` tránh trùng nhưng vẫn giữ mã ngắn dễ đọc (`NH005`, `BV007`). Đây không phải giải pháp an toàn cho hệ thống đa luồng tốc độ cao, vì mục đích học tập là đủ.

### 8.3 Vì sao xuất kho lại có một thành phần duy nhất?

Bảng `CHI_TIET_XUAT` cho phép một phiếu xuất chứa nhiều thành phần, nhưng giao diện chỉ hỗ trợ chọn một để đơn giản. Khi cần mở rộng, chỉ cần đổi field `componentId` thành mảng và cho phép thêm nhiều dòng.


---

## 9 Lệnh và đường dẫn nhanh

```bash
# Cài
npm run install:all

# Chạy backend
npm run dev:backend                 # http://localhost:3000

# Chạy frontend
npm run dev:frontend                # http://localhost:5173

# Build + xem thử bản build
npm run build
npm run preview:frontend

# Health check
curl http://localhost:3000/api/health

# Đăng nhập admin nhanh
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Admin@123"}'
```

| Đường dẫn                                | Mô tả                                |
|-------------------------------------------|--------------------------------------|
| `database/00_schema.sql`                  | Bảng nghiệp vụ + dữ liệu mẫu          |
| `database/02_auth_permissions.sql`        | Tài khoản, vai trò, stored procedure  |
| `backend/server.js`                       | Toàn bộ API                           |
| `backend/db.js`                           | Kết nối SQL Server                    |
| `frontend/src/App.vue`                    | Đăng nhập, điều hướng, phân quyền     |
| `frontend/src/views/CrudPage.vue`         | Trang Thêm/Sửa/Xóa dùng chung         |
| `frontend/src/api.js`                     | Lớp gọi API                           |

---

## 11. Tham chiếu nhanh các bảng

| Bảng                | Trường quan trọng                                                                     |
|---------------------|---------------------------------------------------------------------------------------|
| `NHOM_MAU`          | `MaNhomMau`, `TenNhomMau`                                                              |
| `CHIEN_DICH`        | `MaChienDich`, `TenChienDich`, `DiaDiem`, `ThoiGian`, `SoLuongDuKien`, `SoLuongThucTe` |
| `BENH_VIEN`         | `MaBV`, `TenBV`, `DiaChi`, `SDT`                                                       |
| `NHAN_VIEN`         | `MaNV`, `HoTen`, `ChucVu`, `Email`                                                     |
| `NGUOI_HIEN`        | `MaNguoiHien`, `HoTen`, `NgaySinh`, `GioiTinh`, `CCCD`, `SDT`, `BenhLy`, `DiemTichLuy`, `HangThanhVien`, `MaNhomMau` |
| `VI_TRI_KHO`        | `MaViTri`, `TenTu`, `Ngan`                                                             |
| `GOI_MAU_TOAN_PHAN` | `MaGoiMau`, `NgayHien`, `TheTich`, `TrangThaiKiemDinh`, `MaNguoiHien`, `MaNhomMau`, `MaChienDich`, `MaNV_ThuNhan` |
| `KET_QUA_XET_NGHIEM`| `MaXetNghiem`, `LoaiXetNghiem`, `KetQua`, `NgayXetNghiem`, `MaGoiMau`, `MaNV_ThucHien` |
| `THANH_PHAN_MAU`    | `MaThanhPhan`, `LoaiThanhPhan`, `TheTichThucTe`, `HanSuDung`, `TrangThai`, `MaGoiMau`, `MaViTri` |
| `BENH_NHAN`         | `MaBenhNhan`, `HoTen`, `NgaySinh`, `BenhAn`, `MaNhomMau`, `MaBV`                       |
| `PHIEU_YEU_CAU`     | `MaPhieuYC`, `NgayYeuCau`, `LoaiThanhPhanCan`, `SoLuongML`, `TrangThaiDuyet`, `MaBV`, `MaBenhNhan`, `MaNhomMau`, `MaNV_Duyet` |
| `PHIEU_XUAT`        | `MaPhieuXuat`, `NgayXuat`, `TongTheTich`, `MaPhieuYC`, `MaNV_Xuat`                     |
| `CHI_TIET_XUAT`     | `MaPhieuXuat`, `MaThanhPhan`, `KetQuaPhanUngCheo`                                      |
| `VAI_TRO`           | `MaVaiTro`, `TenVaiTro`                                                                |
| `TAI_KHOAN`         | `MaTaiKhoan`, `TenDangNhap` (UNIQUE), `MatKhau`, `HoTen`, `Email`, `VaiTro`, `MaNV`, `MaNguoiHien`, `MaBV`, `TrangThai` |
