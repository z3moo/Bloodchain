-- Restore baseline auth/permission rows after an accidental destructive reset.
-- Safe to run multiple times: existing rows are preserved.

INSERT OR IGNORE INTO NHOM_MAU VALUES
  ('O+', 'O+'), ('O-', 'O-'), ('A+', 'A+'), ('A-', 'A-'),
  ('B+', 'B+'), ('B-', 'B-'), ('AB+', 'AB+'), ('AB-', 'AB-');

INSERT OR IGNORE INTO BENH_VIEN VALUES
  ('BV001', 'Bệnh viện Bạch Mai', '78 Giải Phóng, Hà Nội', '02438693731'),
  ('BV002', 'Bệnh viện Việt Đức', '40 Tràng Thi, Hà Nội', '02438253531');

INSERT OR IGNORE INTO NHAN_VIEN VALUES
  ('NV001', 'Nguyễn Danh Quân', 'Quản trị hệ thống', 'admin@bloodchain.local'),
  ('NV002', 'Hoàng Ngọc Thịnh', 'Nhân viên xét nghiệm', 'thinh@bloodchain.local'),
  ('NV003', 'Ngô Thị Phương Uyên', 'Điều phối kho máu', 'uyen@bloodchain.local'),
  ('NV004', 'Nguyễn Thị Hải Yến', 'Nhân viên tiếp nhận', 'yen@bloodchain.local');

INSERT OR IGNORE INTO NGUOI_HIEN VALUES
  ('NH001', 'Nguyễn Minh Anh', '1998-03-12', 'Nữ', '001098000111', '0912345678', 'Không', 120, 'Bạc', 'A+'),
  ('NH002', 'Trần Quang Huy', '1995-08-21', 'Nam', '001095000222', '0988123456', 'Không', 240, 'Vàng', 'O+');

INSERT OR IGNORE INTO VAI_TRO VALUES
  ('ADMIN', 'Quản trị'),
  ('STAFF', 'Nhân viên'),
  ('DONOR', 'Người hiến'),
  ('HOSPITAL', 'Bệnh viện');

INSERT OR IGNORE INTO TAI_KHOAN VALUES
  ('TK001', 'admin', 'Admin@123', 'BLOODCHAIN', 'admin@bloodchain.local', 'ADMIN', 'NV001', NULL, NULL, 'Hoạt động'),
  ('TK002', 'nhanvien01', 'Nhanvien@123', 'Hoàng Ngọc Thịnh', 'thinh@bloodchain.local', 'STAFF', 'NV002', NULL, NULL, 'Hoạt động'),
  ('TK003', 'benhvien01', 'Benhvien@123', 'Bệnh viện Bạch Mai', 'bachmai@bloodchain.local', 'HOSPITAL', NULL, NULL, 'BV001', 'Hoạt động'),
  ('TK004', 'nguoihien01', 'Nguoihien@123', 'Nguyễn Minh Anh', 'minhanh@bloodchain.local', 'DONOR', NULL, 'NH001', NULL, 'Hoạt động');
