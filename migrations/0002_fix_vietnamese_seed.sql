-- Repair Vietnamese seed text that was corrupted in the first D1 migration.

UPDATE CHIEN_DICH SET TenChienDich = 'Chủ nhật Đỏ 2026', DiaDiem = 'Hà Nội' WHERE MaChienDich = 'CD001';
UPDATE CHIEN_DICH SET TenChienDich = 'Giọt hồng mùa hè', DiaDiem = 'Học viện Tài chính' WHERE MaChienDich = 'CD002';

UPDATE BENH_VIEN SET TenBV = 'Bệnh viện Bạch Mai', DiaChi = '78 Giải Phóng, Hà Nội' WHERE MaBV = 'BV001';
UPDATE BENH_VIEN SET TenBV = 'Bệnh viện Việt Đức', DiaChi = '40 Tràng Thi, Hà Nội' WHERE MaBV = 'BV002';

UPDATE NHAN_VIEN SET HoTen = 'Nguyễn Danh Quân', ChucVu = 'Quản trị hệ thống' WHERE MaNV = 'NV001';
UPDATE NHAN_VIEN SET HoTen = 'Hoàng Ngọc Thịnh', ChucVu = 'Nhân viên xét nghiệm' WHERE MaNV = 'NV002';
UPDATE NHAN_VIEN SET HoTen = 'Ngô Thị Phương Uyên', ChucVu = 'Điều phối kho máu' WHERE MaNV = 'NV003';
UPDATE NHAN_VIEN SET HoTen = 'Nguyễn Thị Hải Yến', ChucVu = 'Nhân viên tiếp nhận' WHERE MaNV = 'NV004';

UPDATE NGUOI_HIEN SET HoTen = 'Nguyễn Minh Anh', GioiTinh = 'Nữ', BenhLy = 'Không', HangThanhVien = 'Bạc' WHERE MaNguoiHien = 'NH001';
UPDATE NGUOI_HIEN SET HoTen = 'Trần Quang Huy', GioiTinh = 'Nam', BenhLy = 'Không', HangThanhVien = 'Vàng' WHERE MaNguoiHien = 'NH002';

UPDATE QUY_DOI_DIEM SET TenQua = 'Áo thun tri ân' WHERE MaDoiQua = 'DQ001';
UPDATE VI_TRI_KHO SET TenTu = 'Tủ lạnh A' WHERE MaViTri IN ('VT001', 'VT002');

UPDATE GOI_MAU_TOAN_PHAN SET TrangThaiKiemDinh = 'Đạt' WHERE MaGoiMau IN ('GM001', 'GM002');

UPDATE KET_QUA_XET_NGHIEM SET KetQua = 'Âm tính' WHERE MaXetNghiem = 'XN001';
UPDATE KET_QUA_XET_NGHIEM SET LoaiXetNghiem = 'Viêm gan B', KetQua = 'Âm tính' WHERE MaXetNghiem = 'XN002';

UPDATE THANH_PHAN_MAU SET LoaiThanhPhan = 'Hồng cầu', TrangThai = 'Sẵn sàng' WHERE MaThanhPhan = 'TP001';
UPDATE THANH_PHAN_MAU SET LoaiThanhPhan = 'Huyết tương', TrangThai = 'Sẵn sàng' WHERE MaThanhPhan = 'TP002';

UPDATE BENH_NHAN SET HoTen = 'Nguyễn Văn A', BenhAn = 'Xuất huyết giảm tiểu cầu' WHERE MaBenhNhan = 'BN001';

UPDATE PHIEU_YEU_CAU SET LoaiThanhPhanCan = 'Tiểu cầu', TrangThaiDuyet = 'Đã duyệt' WHERE MaPhieuYC = 'YC001';
UPDATE CHI_TIET_XUAT SET KetQuaPhanUngCheo = 'Hòa hợp' WHERE MaPhieuXuat = 'PX001' AND MaThanhPhan = 'TP001';

UPDATE VAI_TRO SET TenVaiTro = 'Quản trị' WHERE MaVaiTro = 'ADMIN';
UPDATE VAI_TRO SET TenVaiTro = 'Nhân viên' WHERE MaVaiTro = 'STAFF';
UPDATE VAI_TRO SET TenVaiTro = 'Người hiến' WHERE MaVaiTro = 'DONOR';
UPDATE VAI_TRO SET TenVaiTro = 'Bệnh viện' WHERE MaVaiTro = 'HOSPITAL';

UPDATE TAI_KHOAN SET HoTen = 'BLOODCHAIN', TrangThai = 'Hoạt động' WHERE MaTaiKhoan = 'TK001';
UPDATE TAI_KHOAN SET HoTen = 'Hoàng Ngọc Thịnh', TrangThai = 'Hoạt động' WHERE MaTaiKhoan = 'TK002';
UPDATE TAI_KHOAN SET HoTen = 'Bệnh viện Bạch Mai', TrangThai = 'Hoạt động' WHERE MaTaiKhoan = 'TK003';
UPDATE TAI_KHOAN SET HoTen = 'Nguyễn Minh Anh', TrangThai = 'Hoạt động' WHERE MaTaiKhoan = 'TK004';
