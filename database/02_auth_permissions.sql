/*
  BLOODCHAIN - Dang nhap va phan quyen don gian
  Chay sau 00_schema.sql

  Luu y:
  - Mat khau duoc bam bcrypt o backend (bcryptjs, salt 10).
  - Cot MatKhau du rong cho hash 60 ky tu, du an toan cho mai sau.
  - sp_DangNhap chi tra ve dong tai khoan theo username + active; viec so
    sanh hash do backend lam (bcrypt.compare). De code minh bach hon va
    khong nho mat khau plaintext trong server side.
*/

IF OBJECT_ID('dbo.vw_TaiKhoan', 'V') IS NOT NULL DROP VIEW dbo.vw_TaiKhoan;
GO
IF OBJECT_ID('dbo.sp_TuChoiTaiKhoan', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_TuChoiTaiKhoan;
GO
IF OBJECT_ID('dbo.sp_DuyetTaiKhoan', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DuyetTaiKhoan;
GO
IF OBJECT_ID('dbo.sp_DangKyTaiKhoanChoDuyet', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DangKyTaiKhoanChoDuyet;
GO
IF OBJECT_ID('dbo.sp_XoaTaiKhoan', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_XoaTaiKhoan;
GO
IF OBJECT_ID('dbo.sp_ThuHoiStaff', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ThuHoiStaff;
GO
IF OBJECT_ID('dbo.sp_ChuyenThanhStaff', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ChuyenThanhStaff;
GO
IF OBJECT_ID('dbo.sp_DangKyNguoiHien', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DangKyNguoiHien;
GO
IF OBJECT_ID('dbo.sp_DangNhap', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DangNhap;
GO
IF OBJECT_ID('dbo.TAI_KHOAN', 'U') IS NOT NULL DROP TABLE dbo.TAI_KHOAN;
IF OBJECT_ID('dbo.VAI_TRO', 'U') IS NOT NULL DROP TABLE dbo.VAI_TRO;
GO

CREATE TABLE VAI_TRO (
  MaVaiTro VARCHAR(20) PRIMARY KEY,
  TenVaiTro NVARCHAR(100)
);
GO

CREATE TABLE TAI_KHOAN (
  MaTaiKhoan VARCHAR(20) PRIMARY KEY,
  TenDangNhap VARCHAR(50) UNIQUE,
  MatKhau VARCHAR(255),
  HoTen NVARCHAR(120),
  Email VARCHAR(120),
  VaiTro VARCHAR(20),
  MaNV VARCHAR(20),
  MaNguoiHien VARCHAR(20),
  MaBV VARCHAR(20),
  TrangThai NVARCHAR(20),
  -- Ho so tam cho tai khoan benh vien/nhan vien dang cho admin duyet.
  -- Khi duyet, backend tao dong BENH_VIEN/NHAN_VIEN tu cac cot nay roi link lai.
  VaiTroYeuCau VARCHAR(20),
  TenDonVi NVARCHAR(200),
  DiaChi NVARCHAR(250),
  SDT VARCHAR(15),
  ChucVu NVARCHAR(100),
  FOREIGN KEY (VaiTro) REFERENCES VAI_TRO(MaVaiTro),
  FOREIGN KEY (MaNV) REFERENCES NHAN_VIEN(MaNV),
  FOREIGN KEY (MaNguoiHien) REFERENCES NGUOI_HIEN(MaNguoiHien),
  FOREIGN KEY (MaBV) REFERENCES BENH_VIEN(MaBV)
);
GO

INSERT INTO VAI_TRO VALUES ('ADMIN', NCHAR(81) + NCHAR(117) + NCHAR(7843) + NCHAR(110) + NCHAR(32) + NCHAR(116) + NCHAR(114) + NCHAR(7883));
INSERT INTO VAI_TRO VALUES ('STAFF', NCHAR(78) + NCHAR(104) + NCHAR(226) + NCHAR(110) + NCHAR(32) + NCHAR(118) + NCHAR(105) + NCHAR(234) + NCHAR(110));
INSERT INTO VAI_TRO VALUES ('DONOR', NCHAR(78) + NCHAR(103) + NCHAR(432) + NCHAR(7901) + NCHAR(105) + NCHAR(32) + NCHAR(104) + NCHAR(105) + NCHAR(7871) + NCHAR(110));
INSERT INTO VAI_TRO VALUES ('HOSPITAL', NCHAR(66) + NCHAR(7879) + NCHAR(110) + NCHAR(104) + NCHAR(32) + NCHAR(118) + NCHAR(105) + NCHAR(7879) + NCHAR(110));
GO

INSERT INTO TAI_KHOAN VALUES ('TK001', 'admin', '$2b$10$.QMfHd8kIhM1ZI4gRqkD0e5Cl2mHqvzAOSWBRGs6pIgxnvqU2XUma', N'BLOODCHAIN', 'admin@bloodchain.local', 'ADMIN', 'NV001', NULL, NULL, NCHAR(72) + NCHAR(111) + NCHAR(7841) + NCHAR(116) + NCHAR(32) + NCHAR(273) + NCHAR(7897) + NCHAR(110) + NCHAR(103), NULL, NULL, NULL, NULL, NULL);
INSERT INTO TAI_KHOAN VALUES ('TK002', 'nhanvien01', '$2b$10$bUNNwVANk9MsE3bqLrPpR.aBqNHxsFVx48EHvavLaycd1VdKrrCrG', NCHAR(72) + NCHAR(111) + NCHAR(224) + NCHAR(110) + NCHAR(103) + NCHAR(32) + NCHAR(78) + NCHAR(103) + NCHAR(7885) + NCHAR(99) + NCHAR(32) + NCHAR(84) + NCHAR(104) + NCHAR(7883) + NCHAR(110) + NCHAR(104), 'thinh@bloodchain.local', 'STAFF', 'NV002', NULL, NULL, NCHAR(72) + NCHAR(111) + NCHAR(7841) + NCHAR(116) + NCHAR(32) + NCHAR(273) + NCHAR(7897) + NCHAR(110) + NCHAR(103), NULL, NULL, NULL, NULL, NULL);
INSERT INTO TAI_KHOAN VALUES ('TK003', 'benhvien01', '$2b$10$sO2Qj04iTcQyf2xtH0gp5eb0DfXTIxa.IxBMp7.wrNblXDmbrqXAK', NCHAR(66) + NCHAR(7879) + NCHAR(110) + NCHAR(104) + NCHAR(32) + NCHAR(118) + NCHAR(105) + NCHAR(7879) + NCHAR(110) + NCHAR(32) + NCHAR(66) + NCHAR(7841) + NCHAR(99) + NCHAR(104) + NCHAR(32) + NCHAR(77) + NCHAR(97) + NCHAR(105), 'bachmai@bloodchain.local', 'HOSPITAL', NULL, NULL, 'BV001', NCHAR(72) + NCHAR(111) + NCHAR(7841) + NCHAR(116) + NCHAR(32) + NCHAR(273) + NCHAR(7897) + NCHAR(110) + NCHAR(103), NULL, NULL, NULL, NULL, NULL);
INSERT INTO TAI_KHOAN VALUES ('TK004', 'nguoihien01', '$2b$10$U7eSvYizEjV8Gseb5HcSfePZutXSVxhOnUuhKThccIlU7gmPjCkpi', NCHAR(78) + NCHAR(103) + NCHAR(117) + NCHAR(121) + NCHAR(7877) + NCHAR(110) + NCHAR(32) + NCHAR(77) + NCHAR(105) + NCHAR(110) + NCHAR(104) + NCHAR(32) + NCHAR(65) + NCHAR(110) + NCHAR(104), 'minhanh@bloodchain.local', 'DONOR', NULL, 'NH001', NULL, NCHAR(72) + NCHAR(111) + NCHAR(7841) + NCHAR(116) + NCHAR(32) + NCHAR(273) + NCHAR(7897) + NCHAR(110) + NCHAR(103), NULL, NULL, NULL, NULL, NULL);
GO

CREATE PROCEDURE sp_DangNhap
  @TenDangNhap VARCHAR(50)
AS
BEGIN
  -- Lookup-only. Backend so sanh bcrypt hash sau khi nhan ket qua.
  SELECT *
  FROM TAI_KHOAN
  WHERE TenDangNhap = @TenDangNhap
    AND TrangThai = NCHAR(72) + NCHAR(111) + NCHAR(7841) + NCHAR(116) + NCHAR(32) + NCHAR(273) + NCHAR(7897) + NCHAR(110) + NCHAR(103);
END;
GO

CREATE PROCEDURE sp_DangKyNguoiHien
  @MaTaiKhoan VARCHAR(20),
  @MaNguoiHien VARCHAR(20),
  @TenDangNhap VARCHAR(50),
  @MatKhau VARCHAR(255),
  @HoTen NVARCHAR(120),
  @Email VARCHAR(120),
  @NgaySinh DATE,
  @GioiTinh NVARCHAR(10),
  @SDT VARCHAR(15),
  @MaNhomMau VARCHAR(5)
AS
BEGIN
  -- @MatKhau da duoc bam bcrypt o tang backend truoc khi goi proc nay.
  INSERT INTO NGUOI_HIEN
  VALUES (
    @MaNguoiHien,
    @HoTen,
    @NgaySinh,
    @GioiTinh,
    NULL,
    @SDT,
    NCHAR(75) + NCHAR(104) + NCHAR(244) + NCHAR(110) + NCHAR(103),
    0,
    NCHAR(272) + NCHAR(7891) + NCHAR(110) + NCHAR(103),
    @MaNhomMau
  );

  INSERT INTO TAI_KHOAN
  VALUES (
    @MaTaiKhoan,
    @TenDangNhap,
    @MatKhau,
    @HoTen,
    @Email,
    'DONOR',
    NULL,
    @MaNguoiHien,
    NULL,
    NCHAR(72) + NCHAR(111) + NCHAR(7841) + NCHAR(116) + NCHAR(32) + NCHAR(273) + NCHAR(7897) + NCHAR(110) + NCHAR(103),
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  );
END;
GO

-- Dang ky tai khoan benh vien/nhan vien o trang thai "Cho duyet".
-- @MatKhau da bcrypt o backend. @VaiTroYeuCau = 'HOSPITAL' hoac 'STAFF'.
-- Tai khoan luu VaiTro = 'DONOR' tam thoi (placeholder de qua FK VAI_TRO);
-- khi admin duyet se doi sang VaiTroYeuCau. sp_DangNhap loc 'Hoat dong' nen
-- tai khoan nay chua dang nhap duoc.
CREATE PROCEDURE sp_DangKyTaiKhoanChoDuyet
  @MaTaiKhoan VARCHAR(20),
  @TenDangNhap VARCHAR(50),
  @MatKhau VARCHAR(255),
  @HoTen NVARCHAR(120),
  @Email VARCHAR(120),
  @VaiTroYeuCau VARCHAR(20),
  @TenDonVi NVARCHAR(200),
  @DiaChi NVARCHAR(250),
  @SDT VARCHAR(15),
  @ChucVu NVARCHAR(100)
AS
BEGIN
  INSERT INTO TAI_KHOAN
  VALUES (
    @MaTaiKhoan,
    @TenDangNhap,
    @MatKhau,
    @HoTen,
    @Email,
    'DONOR',
    NULL,
    NULL,
    NULL,
    NCHAR(67) + NCHAR(104) + NCHAR(7901) + NCHAR(32) + NCHAR(100) + NCHAR(117) + NCHAR(121) + NCHAR(7879) + NCHAR(116),
    @VaiTroYeuCau,
    @TenDonVi,
    @DiaChi,
    @SDT,
    @ChucVu
  );
END;
GO

-- Duyet tai khoan: doi VaiTro sang VaiTroYeuCau, link don vi vua tao, kich hoat.
-- @MaBV / @MaNV: dong BENH_VIEN/NHAN_VIEN backend vua tao (mot trong hai NULL).
CREATE PROCEDURE sp_DuyetTaiKhoan
  @TenDangNhap VARCHAR(50),
  @MaBV VARCHAR(20),
  @MaNV VARCHAR(20)
AS
BEGIN
  UPDATE TAI_KHOAN
  SET VaiTro = VaiTroYeuCau,
      MaBV = @MaBV,
      MaNV = @MaNV,
      TrangThai = NCHAR(72) + NCHAR(111) + NCHAR(7841) + NCHAR(116) + NCHAR(32) + NCHAR(273) + NCHAR(7897) + NCHAR(110) + NCHAR(103)
  WHERE TenDangNhap = @TenDangNhap
    AND TrangThai = NCHAR(67) + NCHAR(104) + NCHAR(7901) + NCHAR(32) + NCHAR(100) + NCHAR(117) + NCHAR(121) + NCHAR(7879) + NCHAR(116);
END;
GO

-- Tu choi tai khoan cho duyet: xoa han cho gon (tranh rac).
CREATE PROCEDURE sp_TuChoiTaiKhoan
  @TenDangNhap VARCHAR(50)
AS
BEGIN
  DELETE FROM TAI_KHOAN
  WHERE TenDangNhap = @TenDangNhap
    AND TrangThai = NCHAR(67) + NCHAR(104) + NCHAR(7901) + NCHAR(32) + NCHAR(100) + NCHAR(117) + NCHAR(121) + NCHAR(7879) + NCHAR(116);
END;
GO

CREATE PROCEDURE sp_ChuyenThanhStaff
  @TenDangNhap VARCHAR(50)
AS
BEGIN
  UPDATE TAI_KHOAN
  SET VaiTro = 'STAFF'
  WHERE TenDangNhap = @TenDangNhap
    AND VaiTro <> 'ADMIN';
END;
GO

CREATE PROCEDURE sp_ThuHoiStaff
  @TenDangNhap VARCHAR(50),
  @VaiTroMoi VARCHAR(20)
AS
BEGIN
  UPDATE TAI_KHOAN
  SET VaiTro = @VaiTroMoi
  WHERE TenDangNhap = @TenDangNhap
    AND VaiTro = 'STAFF';
END;
GO

CREATE PROCEDURE sp_XoaTaiKhoan
  @TenDangNhap VARCHAR(50)
AS
BEGIN
  DELETE FROM TAI_KHOAN
  WHERE TenDangNhap = @TenDangNhap
    AND VaiTro <> 'ADMIN';
END;
GO

-- View an toan: tat ca cot tai khoan TRU MatKhau (hash). Backend dung view nay
-- de liet ke tai khoan, dam bao khong bao gio keo cot mat khau ra khoi DB.
CREATE VIEW vw_TaiKhoan AS
SELECT MaTaiKhoan, TenDangNhap, HoTen, Email, VaiTro,
       MaNV, MaNguoiHien, MaBV, TrangThai,
       VaiTroYeuCau, TenDonVi, DiaChi, SDT, ChucVu
FROM TAI_KHOAN;
GO

-- Vi du:
-- EXEC sp_DangNhap 'admin';  -- backend so sanh bcrypt hash sau
-- EXEC sp_DangKyNguoiHien 'TK005', 'NH010', 'nguoihien02', '<bcrypt-hash>', N'Nguyen Hien 02', 'nh02@mail.com', '2000-01-01', N'Khac', '0900000000', 'O+';
-- EXEC sp_ChuyenThanhStaff 'benhvien01';
-- EXEC sp_ThuHoiStaff 'benhvien01', 'HOSPITAL';
-- EXEC sp_XoaTaiKhoan 'nguoihien01';



