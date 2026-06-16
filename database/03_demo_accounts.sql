/*
  BLOODCHAIN - Tai khoan demo cho toan bo nguoi hien & benh vien
  Chay sau 00_schema.sql, 01_demo_data.sql, 02_auth_permissions.sql.

  Luu y:
  - File luu UTF-8 co BOM de sqlcmd doc dung tieng Viet.
  - Tao 1 tai khoan dang nhap cho MOI nguoi hien (DONOR) va benh vien (HOSPITAL)
    chua co tai khoan. Bo qua NH001/BV001... da co tai khoan mau trong 02.
  - Mat khau dung chung: demo123  (luu duoi dang bcrypt hash, backend so sanh bcrypt).
  - Ten dang nhap = ma nguoi hien / ma benh vien (vd: NH0413, BV003).
  - TrangThai dung NCHAR de khop chinh xac voi sp_DangNhap (loc 'Hoat dong').
  - NOT EXISTS giup chay lai nhieu lan ma khong tao trung.
*/
USE BloodChainDB;
GO

DECLARE @pw VARCHAR(255) = '$2b$10$grFbZYtT7WsllRGP3EBoBufej3kDj27flaW4eJtAwiUF0k2Dk1CBG';
DECLARE @HoatDong NVARCHAR(20) = NCHAR(72)+NCHAR(111)+NCHAR(7841)+NCHAR(116)+NCHAR(32)+NCHAR(273)+NCHAR(7897)+NCHAR(110)+NCHAR(103);

-- Tai khoan cho nguoi hien
INSERT INTO TAI_KHOAN
  (MaTaiKhoan, TenDangNhap, MatKhau, HoTen, Email, VaiTro, MaNV, MaNguoiHien, MaBV, TrangThai,
   VaiTroYeuCau, TenDonVi, DiaChi, SDT, ChucVu)
SELECT 'TK_' + nh.MaNguoiHien, nh.MaNguoiHien, @pw, nh.HoTen,
       LOWER(nh.MaNguoiHien) + '@demo.local', 'DONOR', NULL, nh.MaNguoiHien, NULL, @HoatDong,
       NULL, NULL, NULL, NULL, NULL
FROM NGUOI_HIEN nh
WHERE NOT EXISTS (SELECT 1 FROM TAI_KHOAN t WHERE t.MaNguoiHien = nh.MaNguoiHien);

-- Tai khoan cho benh vien
INSERT INTO TAI_KHOAN
  (MaTaiKhoan, TenDangNhap, MatKhau, HoTen, Email, VaiTro, MaNV, MaNguoiHien, MaBV, TrangThai,
   VaiTroYeuCau, TenDonVi, DiaChi, SDT, ChucVu)
SELECT 'TK_' + bv.MaBV, bv.MaBV, @pw, bv.TenBV,
       LOWER(bv.MaBV) + '@demo.local', 'HOSPITAL', NULL, NULL, bv.MaBV, @HoatDong,
       NULL, NULL, NULL, NULL, NULL
FROM BENH_VIEN bv
WHERE NOT EXISTS (SELECT 1 FROM TAI_KHOAN t WHERE t.MaBV = bv.MaBV);

-- Tai khoan cho nhan vien (STAFF)
-- Co nhieu nhan vien (vd: nhan vien xet nghiem trong cac tui mau / ket qua xet
-- nghiem) chua co tai khoan dang nhap. Tao 1 tai khoan STAFF cho moi NHAN_VIEN
-- chua co tai khoan. Ten dang nhap = ma nhan vien (vd: NV003, NV004).
INSERT INTO TAI_KHOAN
  (MaTaiKhoan, TenDangNhap, MatKhau, HoTen, Email, VaiTro, MaNV, MaNguoiHien, MaBV, TrangThai,
   VaiTroYeuCau, TenDonVi, DiaChi, SDT, ChucVu)
SELECT 'TK_' + nv.MaNV, nv.MaNV, @pw, nv.HoTen,
       ISNULL(nv.Email, LOWER(nv.MaNV) + '@demo.local'), 'STAFF', nv.MaNV, NULL, NULL, @HoatDong,
       NULL, NULL, NULL, NULL, nv.ChucVu
FROM NHAN_VIEN nv
WHERE NOT EXISTS (SELECT 1 FROM TAI_KHOAN t WHERE t.MaNV = nv.MaNV);
GO
