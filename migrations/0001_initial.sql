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

INSERT OR IGNORE INTO NHOM_MAU VALUES
  ('O+', 'O+'), ('O-', 'O-'), ('A+', 'A+'), ('A-', 'A-'),
  ('B+', 'B+'), ('B-', 'B-'), ('AB+', 'AB+'), ('AB-', 'AB-');

INSERT OR IGNORE INTO CHIEN_DICH VALUES
  ('CD001', 'Ch? nh?t ?? 2026', 'H? N?i', '2026-02-15T08:00:00.000Z', 300, 248),
  ('CD002', 'Gi?t h?ng m?a h?', 'H?c vi?n T?i ch?nh', '2026-05-10T07:30:00.000Z', 200, 126);

INSERT OR IGNORE INTO BENH_VIEN VALUES
  ('BV001', 'B?nh vi?n B?ch Mai', '78 Gi?i Ph?ng, H? N?i', '02438693731'),
  ('BV002', 'B?nh vi?n Vi?t ??c', '40 Tr?ng Thi, H? N?i', '02438253531');

INSERT OR IGNORE INTO NHAN_VIEN VALUES
  ('NV001', 'Nguy?n Danh Qu?n', 'Qu?n tr? h? th?ng', 'admin@bloodchain.local'),
  ('NV002', 'Ho?ng Ng?c Th?nh', 'Nh?n vi?n x?t nghi?m', 'thinh@bloodchain.local'),
  ('NV003', 'Ng? Th? Ph??ng Uy?n', '?i?u ph?i kho m?u', 'uyen@bloodchain.local'),
  ('NV004', 'Nguy?n Th? H?i Y?n', 'Nh?n vi?n ti?p nh?n', 'yen@bloodchain.local');

INSERT OR IGNORE INTO NGUOI_HIEN VALUES
  ('NH001', 'Nguy?n Minh Anh', '1998-03-12', 'N?', '001098000111', '0912345678', 'Kh?ng', 120, 'B?c', 'A+'),
  ('NH002', 'Tr?n Quang Huy', '1995-08-21', 'Nam', '001095000222', '0988123456', 'Kh?ng', 240, 'V?ng', 'O+');

INSERT OR IGNORE INTO QUY_DOI_DIEM VALUES
  ('DQ001', '?o thun tri ?n', '2026-03-01T09:15:00.000Z', 50, 'NH001');

INSERT OR IGNORE INTO VI_TRI_KHO VALUES
  ('VT001', 'T? l?nh A', 1),
  ('VT002', 'T? l?nh A', 2);

INSERT OR IGNORE INTO GOI_MAU_TOAN_PHAN VALUES
  ('GM001', '2026-02-15T09:10:00.000Z', 350, '??t', 'NH001', 'A+', 'CD001', 'NV004'),
  ('GM002', '2026-02-15T09:45:00.000Z', 450, '??t', 'NH002', 'O+', 'CD001', 'NV004');

INSERT OR IGNORE INTO KET_QUA_XET_NGHIEM VALUES
  ('XN001', 'HIV', '?m t?nh', '2026-02-15T13:30:00.000Z', 'GM001', 'NV002'),
  ('XN002', 'Vi?m gan B', '?m t?nh', '2026-02-15T13:45:00.000Z', 'GM001', 'NV002');

INSERT OR IGNORE INTO THANH_PHAN_MAU VALUES
  ('TP001', 'H?ng c?u', 250, '2026-03-22', 'S?n s?ng', 'GM001', 'VT001'),
  ('TP002', 'Huy?t t??ng', 100, '2026-08-15', 'S?n s?ng', 'GM001', 'VT002');

INSERT OR IGNORE INTO BENH_NHAN VALUES
  ('BN001', 'Nguy?n V?n A', '1987-01-17', 'Xu?t huy?t gi?m ti?u c?u', 'A+', 'BV001');

INSERT OR IGNORE INTO PHIEU_YEU_CAU VALUES
  ('YC001', '2026-02-20T08:00:00.000Z', 'Ti?u c?u', 50, '?? duy?t', 'BV001', 'BN001', 'A+', 'NV003');

INSERT OR IGNORE INTO PHIEU_XUAT VALUES
  ('PX001', '2026-02-20T10:00:00.000Z', 50, 'YC001', 'NV003');

INSERT OR IGNORE INTO CHI_TIET_XUAT VALUES
  ('PX001', 'TP001', 'H?a h?p');

INSERT OR IGNORE INTO VAI_TRO VALUES
  ('ADMIN', 'Qu?n tr?'),
  ('STAFF', 'Nh?n vi?n'),
  ('DONOR', 'Ng??i hi?n'),
  ('HOSPITAL', 'B?nh vi?n');

INSERT OR IGNORE INTO TAI_KHOAN VALUES
  ('TK001', 'admin', 'Admin@123', 'BLOODCHAIN', 'admin@bloodchain.local', 'ADMIN', 'NV001', NULL, NULL, 'Ho?t ??ng'),
  ('TK002', 'nhanvien01', 'Nhanvien@123', 'Ho?ng Ng?c Th?nh', 'thinh@bloodchain.local', 'STAFF', 'NV002', NULL, NULL, 'Ho?t ??ng'),
  ('TK003', 'benhvien01', 'Benhvien@123', 'B?nh vi?n B?ch Mai', 'bachmai@bloodchain.local', 'HOSPITAL', NULL, NULL, 'BV001', 'Ho?t ??ng'),
  ('TK004', 'nguoihien01', 'Nguoihien@123', 'Nguy?n Minh Anh', 'minhanh@bloodchain.local', 'DONOR', NULL, 'NH001', NULL, 'Ho?t ??ng');
