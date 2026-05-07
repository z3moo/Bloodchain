PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS NHOM_MAU (
  MaNhomMau TEXT PRIMARY KEY,
  TenNhomMau TEXT
);

CREATE TABLE IF NOT EXISTS CHIEN_DICH (
  MaChienDich TEXT PRIMARY KEY,
  TenChienDich TEXT,
  DiaDiem TEXT,
  ThoiGian TEXT,
  SoLuongDuKien INTEGER,
  SoLuongThucTe INTEGER
);

CREATE TABLE IF NOT EXISTS BENH_VIEN (
  MaBV TEXT PRIMARY KEY,
  TenBV TEXT,
  DiaChi TEXT,
  SDT TEXT
);

CREATE TABLE IF NOT EXISTS NHAN_VIEN (
  MaNV TEXT PRIMARY KEY,
  HoTen TEXT,
  ChucVu TEXT,
  Email TEXT
);

CREATE TABLE IF NOT EXISTS NGUOI_HIEN (
  MaNguoiHien TEXT PRIMARY KEY,
  HoTen TEXT,
  NgaySinh TEXT,
  GioiTinh TEXT,
  CCCD TEXT,
  SDT TEXT,
  BenhLy TEXT,
  DiemTichLuy INTEGER,
  HangThanhVien TEXT,
  MaNhomMau TEXT REFERENCES NHOM_MAU(MaNhomMau)
);

CREATE TABLE IF NOT EXISTS QUY_DOI_DIEM (
  MaDoiQua TEXT PRIMARY KEY,
  TenQua TEXT,
  NgayDoi TEXT,
  DiemDoi INTEGER,
  MaNguoiHien TEXT REFERENCES NGUOI_HIEN(MaNguoiHien)
);

CREATE TABLE IF NOT EXISTS VI_TRI_KHO (
  MaViTri TEXT PRIMARY KEY,
  TenTu TEXT,
  Ngan INTEGER
);

CREATE TABLE IF NOT EXISTS GOI_MAU_TOAN_PHAN (
  MaGoiMau TEXT PRIMARY KEY,
  NgayHien TEXT,
  TheTich INTEGER,
  TrangThaiKiemDinh TEXT,
  MaNguoiHien TEXT REFERENCES NGUOI_HIEN(MaNguoiHien),
  MaNhomMau TEXT REFERENCES NHOM_MAU(MaNhomMau),
  MaChienDich TEXT REFERENCES CHIEN_DICH(MaChienDich),
  MaNV_ThuNhan TEXT REFERENCES NHAN_VIEN(MaNV)
);

CREATE TABLE IF NOT EXISTS KET_QUA_XET_NGHIEM (
  MaXetNghiem TEXT PRIMARY KEY,
  LoaiXetNghiem TEXT,
  KetQua TEXT,
  NgayXetNghiem TEXT,
  MaGoiMau TEXT REFERENCES GOI_MAU_TOAN_PHAN(MaGoiMau),
  MaNV_ThucHien TEXT REFERENCES NHAN_VIEN(MaNV)
);

CREATE TABLE IF NOT EXISTS THANH_PHAN_MAU (
  MaThanhPhan TEXT PRIMARY KEY,
  LoaiThanhPhan TEXT,
  TheTichThucTe INTEGER,
  HanSuDung TEXT,
  TrangThai TEXT,
  MaGoiMau TEXT REFERENCES GOI_MAU_TOAN_PHAN(MaGoiMau),
  MaViTri TEXT REFERENCES VI_TRI_KHO(MaViTri)
);

CREATE TABLE IF NOT EXISTS BENH_NHAN (
  MaBenhNhan TEXT PRIMARY KEY,
  HoTen TEXT,
  NgaySinh TEXT,
  BenhAn TEXT,
  MaNhomMau TEXT REFERENCES NHOM_MAU(MaNhomMau),
  MaBV TEXT REFERENCES BENH_VIEN(MaBV)
);

CREATE TABLE IF NOT EXISTS PHIEU_YEU_CAU (
  MaPhieuYC TEXT PRIMARY KEY,
  NgayYeuCau TEXT,
  LoaiThanhPhanCan TEXT,
  SoLuongML INTEGER,
  TrangThaiDuyet TEXT,
  MaBV TEXT REFERENCES BENH_VIEN(MaBV),
  MaBenhNhan TEXT REFERENCES BENH_NHAN(MaBenhNhan),
  MaNhomMau TEXT REFERENCES NHOM_MAU(MaNhomMau),
  MaNV_Duyet TEXT REFERENCES NHAN_VIEN(MaNV)
);

CREATE TABLE IF NOT EXISTS PHIEU_XUAT (
  MaPhieuXuat TEXT PRIMARY KEY,
  NgayXuat TEXT,
  TongTheTich INTEGER,
  MaPhieuYC TEXT REFERENCES PHIEU_YEU_CAU(MaPhieuYC),
  MaNV_Xuat TEXT REFERENCES NHAN_VIEN(MaNV)
);

CREATE TABLE IF NOT EXISTS CHI_TIET_XUAT (
  MaPhieuXuat TEXT REFERENCES PHIEU_XUAT(MaPhieuXuat),
  MaThanhPhan TEXT REFERENCES THANH_PHAN_MAU(MaThanhPhan),
  KetQuaPhanUngCheo TEXT,
  PRIMARY KEY (MaPhieuXuat, MaThanhPhan)
);

CREATE TABLE IF NOT EXISTS VAI_TRO (
  MaVaiTro TEXT PRIMARY KEY,
  TenVaiTro TEXT
);

CREATE TABLE IF NOT EXISTS TAI_KHOAN (
  MaTaiKhoan TEXT PRIMARY KEY,
  TenDangNhap TEXT UNIQUE,
  MatKhau TEXT,
  HoTen TEXT,
  Email TEXT,
  VaiTro TEXT REFERENCES VAI_TRO(MaVaiTro),
  MaNV TEXT REFERENCES NHAN_VIEN(MaNV),
  MaNguoiHien TEXT REFERENCES NGUOI_HIEN(MaNguoiHien),
  MaBV TEXT REFERENCES BENH_VIEN(MaBV),
  TrangThai TEXT
);

INSERT INTO NHOM_MAU VALUES
  ('O+', 'O+'), ('O-', 'O-'), ('A+', 'A+'), ('A-', 'A-'),
  ('B+', 'B+'), ('B-', 'B-'), ('AB+', 'AB+'), ('AB-', 'AB-');
INSERT INTO CHIEN_DICH VALUES
  ('CD001', 'Chủ nhật Đỏ 2026', 'Hà Nội', '2026-02-15T08:00:00.000Z', 300, 248),
  ('CD002', 'Giọt hồng mùa hè', 'Học viện Tài chính', '2026-05-10T07:30:00.000Z', 200, 126);
INSERT INTO BENH_VIEN VALUES
  ('BV001', 'Bệnh viện Bạch Mai', '78 Giải Phóng, Hà Nội', '02438693731'),
  ('BV002', 'Bệnh viện Việt Đức', '40 Tràng Thi, Hà Nội', '02438253531');
INSERT INTO NHAN_VIEN VALUES
  ('NV001', 'Nguyễn Danh Quân', 'Quản trị hệ thống', 'admin@bloodchain.local'),
  ('NV002', 'Hoàng Ngọc Thịnh', 'Nhân viên xét nghiệm', 'thinh@bloodchain.local'),
  ('NV003', 'Ngô Thị Phương Uyên', 'Điều phối kho máu', 'uyen@bloodchain.local'),
  ('NV004', 'Nguyễn Thị Hải Yến', 'Nhân viên tiếp nhận', 'yen@bloodchain.local');
INSERT INTO NGUOI_HIEN VALUES
  ('NH001', 'Nguyễn Minh Anh', '1998-03-12', 'Nữ', '001098000111', '0912345678', 'Không', 120, 'Bạc', 'A+'),
  ('NH002', 'Trần Quang Huy', '1995-08-21', 'Nam', '001095000222', '0988123456', 'Không', 240, 'Vàng', 'O+');
INSERT INTO QUY_DOI_DIEM VALUES ('DQ001', 'Áo thun tri ân', '2026-03-01T09:15:00.000Z', 50, 'NH001');
INSERT INTO VI_TRI_KHO VALUES ('VT001', 'Tủ lạnh A', 1), ('VT002', 'Tủ lạnh A', 2);
INSERT INTO GOI_MAU_TOAN_PHAN VALUES
  ('GM001', '2026-02-15T09:10:00.000Z', 350, 'Đạt', 'NH001', 'A+', 'CD001', 'NV004'),
  ('GM002', '2026-02-15T09:45:00.000Z', 450, 'Đạt', 'NH002', 'O+', 'CD001', 'NV004');
INSERT INTO KET_QUA_XET_NGHIEM VALUES
  ('XN001', 'HIV', 'Âm tính', '2026-02-15T13:30:00.000Z', 'GM001', 'NV002'),
  ('XN002', 'Viêm gan B', 'Âm tính', '2026-02-15T13:45:00.000Z', 'GM001', 'NV002');
INSERT INTO THANH_PHAN_MAU VALUES
  ('TP001', 'Hồng cầu', 250, '2026-03-22', 'Sẵn sàng', 'GM001', 'VT001'),
  ('TP002', 'Huyết tương', 100, '2026-08-15', 'Sẵn sàng', 'GM001', 'VT002');
INSERT INTO BENH_NHAN VALUES ('BN001', 'Nguyễn Văn A', '1987-01-17', 'Xuất huyết giảm tiểu cầu', 'A+', 'BV001');
INSERT INTO PHIEU_YEU_CAU VALUES ('YC001', '2026-02-20T08:00:00.000Z', 'Tiểu cầu', 50, 'Đã duyệt', 'BV001', 'BN001', 'A+', 'NV003');
INSERT INTO PHIEU_XUAT VALUES ('PX001', '2026-02-20T10:00:00.000Z', 50, 'YC001', 'NV003');
INSERT INTO CHI_TIET_XUAT VALUES ('PX001', 'TP001', 'Hòa hợp');
INSERT INTO VAI_TRO VALUES
  ('ADMIN', 'Quản trị'), ('STAFF', 'Nhân viên'), ('DONOR', 'Người hiến'), ('HOSPITAL', 'Bệnh viện');
INSERT INTO TAI_KHOAN VALUES
  ('TK001', 'admin', 'Admin@123', 'BLOODCHAIN', 'admin@bloodchain.local', 'ADMIN', 'NV001', NULL, NULL, 'Hoạt động'),
  ('TK002', 'nhanvien01', 'Nhanvien@123', 'Hoàng Ngọc Thịnh', 'thinh@bloodchain.local', 'STAFF', 'NV002', NULL, NULL, 'Hoạt động'),
  ('TK003', 'benhvien01', 'Benhvien@123', 'Bệnh viện Bạch Mai', 'bachmai@bloodchain.local', 'HOSPITAL', NULL, NULL, 'BV001', 'Hoạt động'),
  ('TK004', 'nguoihien01', 'Nguoihien@123', 'Nguyễn Minh Anh', 'minhanh@bloodchain.local', 'DONOR', NULL, 'NH001', NULL, 'Hoạt động');
