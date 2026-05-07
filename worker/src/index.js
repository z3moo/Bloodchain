const T = {
  active: 'Hoạt động',
  missingLogin: 'Thiếu tên đăng nhập hoặc mật khẩu.',
  badLogin: 'Tên đăng nhập hoặc mật khẩu không đúng.',
  missingRegister: 'Thiếu thông tin đăng ký.',
  other: 'Khác',
  bronze: 'Đồng',
  no: 'Không',
  newDonor: 'Người hiến mới',
  newCampaign: 'Chiến dịch mới',
  newHospital: 'Bệnh viện mới',
  newPatient: 'Bệnh nhân mới',
  waitingTest: 'Chờ xét nghiệm',
  negative: 'Âm tính',
  redCells: 'Hồng cầu',
  ready: 'Sẵn sàng',
  waitingApproval: 'Chờ duyệt',
  exported: 'Đã xuất',
  compatible: 'Hòa hợp',
}

const RESET_SQL = `
DELETE FROM CHI_TIET_XUAT;
DELETE FROM PHIEU_XUAT;
DELETE FROM PHIEU_YEU_CAU;
DELETE FROM THANH_PHAN_MAU;
DELETE FROM KET_QUA_XET_NGHIEM;
DELETE FROM GOI_MAU_TOAN_PHAN;
DELETE FROM QUY_DOI_DIEM;
DELETE FROM BENH_NHAN;
DELETE FROM VI_TRI_KHO;
DELETE FROM CHIEN_DICH;
`

const SEED_SQL = `
INSERT OR IGNORE INTO NHOM_MAU VALUES
  ('O+', 'O+'), ('O-', 'O-'), ('A+', 'A+'), ('A-', 'A-'),
  ('B+', 'B+'), ('B-', 'B-'), ('AB+', 'AB+'), ('AB-', 'AB-');
INSERT OR IGNORE INTO CHIEN_DICH VALUES
  ('CD001', 'Chủ nhật Đỏ 2026', 'Hà Nội', '2026-02-15T08:00:00.000Z', 300, 248),
  ('CD002', 'Giọt hồng mùa hè', 'Học viện Tài chính', '2026-05-10T07:30:00.000Z', 200, 126);
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
INSERT OR IGNORE INTO QUY_DOI_DIEM VALUES ('DQ001', 'Áo thun tri ân', '2026-03-01T09:15:00.000Z', 50, 'NH001');
INSERT OR IGNORE INTO VI_TRI_KHO VALUES ('VT001', 'Tủ lạnh A', 1), ('VT002', 'Tủ lạnh A', 2);
INSERT OR IGNORE INTO GOI_MAU_TOAN_PHAN VALUES
  ('GM001', '2026-02-15T09:10:00.000Z', 350, 'Đạt', 'NH001', 'A+', 'CD001', 'NV004'),
  ('GM002', '2026-02-15T09:45:00.000Z', 450, 'Đạt', 'NH002', 'O+', 'CD001', 'NV004');
INSERT OR IGNORE INTO KET_QUA_XET_NGHIEM VALUES
  ('XN001', 'HIV', 'Âm tính', '2026-02-15T13:30:00.000Z', 'GM001', 'NV002'),
  ('XN002', 'Viêm gan B', 'Âm tính', '2026-02-15T13:45:00.000Z', 'GM001', 'NV002');
INSERT OR IGNORE INTO THANH_PHAN_MAU VALUES
  ('TP001', 'Hồng cầu', 250, '2026-03-22', 'Sẵn sàng', 'GM001', 'VT001'),
  ('TP002', 'Huyết tương', 100, '2026-08-15', 'Sẵn sàng', 'GM001', 'VT002');
INSERT OR IGNORE INTO BENH_NHAN VALUES ('BN001', 'Nguyễn Văn A', '1987-01-17', 'Xuất huyết giảm tiểu cầu', 'A+', 'BV001');
INSERT OR IGNORE INTO PHIEU_YEU_CAU VALUES ('YC001', '2026-02-20T08:00:00.000Z', 'Tiểu cầu', 50, 'Đã duyệt', 'BV001', 'BN001', 'A+', 'NV003');
INSERT OR IGNORE INTO PHIEU_XUAT VALUES ('PX001', '2026-02-20T10:00:00.000Z', 50, 'YC001', 'NV003');
INSERT OR IGNORE INTO CHI_TIET_XUAT VALUES ('PX001', 'TP001', 'Hòa hợp');
INSERT OR IGNORE INTO VAI_TRO VALUES
  ('ADMIN', 'Quản trị'), ('STAFF', 'Nhân viên'), ('DONOR', 'Người hiến'), ('HOSPITAL', 'Bệnh viện');
INSERT OR IGNORE INTO TAI_KHOAN VALUES
  ('TK001', 'admin', 'Admin@123', 'BLOODCHAIN', 'admin@bloodchain.local', 'ADMIN', 'NV001', NULL, NULL, 'Hoạt động'),
  ('TK002', 'nhanvien01', 'Nhanvien@123', 'Hoàng Ngọc Thịnh', 'thinh@bloodchain.local', 'STAFF', 'NV002', NULL, NULL, 'Hoạt động'),
  ('TK003', 'benhvien01', 'Benhvien@123', 'Bệnh viện Bạch Mai', 'bachmai@bloodchain.local', 'HOSPITAL', NULL, NULL, 'BV001', 'Hoạt động'),
  ('TK004', 'nguoihien01', 'Nguoihien@123', 'Nguyễn Minh Anh', 'minhanh@bloodchain.local', 'DONOR', NULL, 'NH001', NULL, 'Hoạt động');
`

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url).catch((error) => json({ message: error.message }, 500))
    }

    if (env.ASSETS) return env.ASSETS.fetch(request)

    return new Response('BloodChain Worker is running. Build frontend assets before serving the app.', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  },
}

async function handleApi(request, env, url) {
  const db = env.DB
  if (!db) return json({ ok: false, message: 'D1 binding DB is not configured.' }, 503)

  const method = request.method.toUpperCase()
  const path = url.pathname.replace(/^\/api/, '') || '/'
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readJson(request) : {}

  if (method === 'GET' && path === '/health') {
    await first(db, 'SELECT 1 AS ok')
    return json({ ok: true, database: 'd1' })
  }
  if (method === 'POST' && path === '/admin/reset-database') {
    await db.exec(RESET_SQL)
    await db.exec(SEED_SQL)
    return json({ ok: true, message: 'Đã reset dữ liệu vận hành. Tài khoản và quyền được giữ nguyên.' })
  }

  if (method === 'POST' && path === '/auth/login') return login(db, body)
  if (method === 'POST' && path === '/auth/register') return registerDonor(db, body)
  if (method === 'GET' && path === '/accounts') return listAccounts(db)

  let match = path.match(/^\/accounts\/([^/]+)\/promote$/)
  if (method === 'PATCH' && match) return promoteAccount(db, decodeURIComponent(match[1]))
  match = path.match(/^\/accounts\/([^/]+)\/revoke$/)
  if (method === 'PATCH' && match) return revokeAccount(db, decodeURIComponent(match[1]), body)
  match = path.match(/^\/accounts\/([^/]+)$/)
  if (method === 'DELETE' && match) return deleteAccount(db, decodeURIComponent(match[1]))

  if (method === 'GET' && path === '/blood-groups') return rows(db, 'SELECT MaNhomMau AS id, TenNhomMau AS name FROM NHOM_MAU ORDER BY MaNhomMau')
  if (method === 'GET' && path === '/donors') return rows(db, 'SELECT MaNguoiHien AS id, HoTen AS name, NgaySinh AS birthDate, SDT AS phone, MaNhomMau AS bloodGroup, BenhLy AS medicalHistory, DiemTichLuy AS points, HangThanhVien AS memberRank FROM NGUOI_HIEN ORDER BY MaNguoiHien')
  if (method === 'POST' && path === '/donors') return createDonor(db, body)
  if (method === 'GET' && path === '/campaigns') return rows(db, 'SELECT MaChienDich AS id, TenChienDich AS name, DiaDiem AS location, ThoiGian AS time, SoLuongDuKien AS expected, SoLuongThucTe AS actual FROM CHIEN_DICH ORDER BY MaChienDich')
  if (method === 'POST' && path === '/campaigns') return createCampaign(db, body)
  if (method === 'GET' && path === '/hospitals') return rows(db, 'SELECT MaBV AS id, TenBV AS name, DiaChi AS address, SDT AS phone FROM BENH_VIEN ORDER BY MaBV')
  if (method === 'POST' && path === '/hospitals') return createHospital(db, body)
  if (method === 'GET' && path === '/patients') return rows(db, 'SELECT MaBenhNhan AS id, HoTen AS name, NgaySinh AS birthDate, MaNhomMau AS bloodGroup, BenhAn AS medicalRecord, MaBV AS hospitalId FROM BENH_NHAN ORDER BY MaBenhNhan')
  if (method === 'POST' && path === '/patients') return createPatient(db, body)
  if (method === 'GET' && path === '/blood-bags') return rows(db, 'SELECT MaGoiMau AS id, NgayHien AS donatedAt, TheTich AS volume, TrangThaiKiemDinh AS testStatus, MaNguoiHien AS donorId, MaNhomMau AS bloodGroup, MaChienDich AS campaignId, MaNV_ThuNhan AS staffId FROM GOI_MAU_TOAN_PHAN ORDER BY MaGoiMau')
  if (method === 'POST' && path === '/blood-bags') return createBloodBag(db, body)
  if (method === 'GET' && path === '/lab-tests') return rows(db, 'SELECT MaXetNghiem AS id, LoaiXetNghiem AS type, KetQua AS result, NgayXetNghiem AS testedAt, MaGoiMau AS bloodBagId, MaNV_ThucHien AS staffId FROM KET_QUA_XET_NGHIEM ORDER BY MaXetNghiem')
  if (method === 'POST' && path === '/lab-tests') return createLabTest(db, body)
  if (method === 'GET' && path === '/components') return rows(db, 'SELECT MaThanhPhan AS id, LoaiThanhPhan AS type, TheTichThucTe AS volume, HanSuDung AS expiresAt, TrangThai AS status, MaGoiMau AS bloodBagId, MaViTri AS storageId FROM THANH_PHAN_MAU ORDER BY MaThanhPhan')
  if (method === 'POST' && path === '/components') return createComponent(db, body)
  if (method === 'GET' && path === '/requests') return rows(db, 'SELECT MaPhieuYC AS id, NgayYeuCau AS requestedAt, LoaiThanhPhanCan AS componentType, SoLuongML AS volume, TrangThaiDuyet AS status, MaBV AS hospitalId, MaBenhNhan AS patientId, MaNhomMau AS bloodGroup, MaNV_Duyet AS approverId FROM PHIEU_YEU_CAU ORDER BY MaPhieuYC')
  if (method === 'POST' && path === '/requests') return createRequest(db, body)
  if (method === 'GET' && path === '/exports') return rows(db, 'SELECT px.MaPhieuXuat AS id, px.NgayXuat AS exportedAt, px.TongTheTich AS totalVolume, px.MaPhieuYC AS requestId, px.MaNV_Xuat AS staffId, ctx.MaThanhPhan AS componentId, ctx.KetQuaPhanUngCheo AS crossMatch FROM PHIEU_XUAT px LEFT JOIN CHI_TIET_XUAT ctx ON ctx.MaPhieuXuat = px.MaPhieuXuat ORDER BY px.MaPhieuXuat')
  if (method === 'POST' && path === '/exports') return createExport(db, body)

  if (method === 'GET' && path === '/reports/inventory') return inventoryReport(db)
  if (method === 'GET' && path === '/reports/expiring') return rows(db, "SELECT MaThanhPhan AS id, LoaiThanhPhan AS type, HanSuDung AS expiresAt, TrangThai AS status FROM THANH_PHAN_MAU WHERE HanSuDung <= date('now', '+30 day') ORDER BY HanSuDung")
  if (method === 'GET' && path === '/reports/campaigns') return rows(db, 'SELECT MaChienDich AS id, TenChienDich AS name, SoLuongDuKien AS expected, SoLuongThucTe AS actual FROM CHIEN_DICH ORDER BY MaChienDich')

  return json({ message: `No route for ${method} ${path}` }, 404)
}

async function login(db, body) {
  const { username, password } = body || {}
  if (!username || !password) return json({ message: T.missingLogin }, 400)
  const user = await first(db, 'SELECT * FROM TAI_KHOAN WHERE TenDangNhap = ? AND MatKhau = ?', [username, password])
  if (!user) return json({ message: T.badLogin }, 401)
  return json(mapAccount(user))
}

async function registerDonor(db, body) {
  const { username, password, displayName, email } = body || {}
  if (!username || !password || !displayName) return json({ message: T.missingRegister }, 400)
  const existing = await first(db, 'SELECT MaTaiKhoan FROM TAI_KHOAN WHERE lower(TenDangNhap) = lower(?)', [username])
  if (existing) return json({ message: 'Tên đăng nhập đã tồn tại.' }, 409)
  const accountId = await nextId(db, 'TAI_KHOAN', 'TK')
  const donorId = await nextId(db, 'NGUOI_HIEN', 'NH')
  await run(db, 'INSERT INTO NGUOI_HIEN VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [donorId, displayName, '2000-01-01', T.other, `${Date.now()}`.slice(-12), '', '', 0, T.bronze, 'O+'])
  await run(db, 'INSERT INTO TAI_KHOAN VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [accountId, username, password, displayName, email || '', 'DONOR', null, donorId, null, T.active])
  const user = await first(db, 'SELECT * FROM TAI_KHOAN WHERE TenDangNhap = ?', [username])
  return json(mapAccount(user), 201)
}

async function listAccounts(db) {
  const result = await all(db, 'SELECT * FROM TAI_KHOAN ORDER BY MaTaiKhoan')
  return json(result.map(mapAccount))
}

async function promoteAccount(db, username) {
  await run(db, "UPDATE TAI_KHOAN SET VaiTro = 'STAFF' WHERE TenDangNhap = ? AND VaiTro <> 'ADMIN'", [username])
  const user = await first(db, 'SELECT * FROM TAI_KHOAN WHERE TenDangNhap = ?', [username])
  return json(mapAccount(user))
}

async function revokeAccount(db, username, body) {
  const nextRole = body?.role === 'hospital' ? 'HOSPITAL' : 'DONOR'
  await run(db, "UPDATE TAI_KHOAN SET VaiTro = ? WHERE TenDangNhap = ? AND VaiTro = 'STAFF'", [nextRole, username])
  const user = await first(db, 'SELECT * FROM TAI_KHOAN WHERE TenDangNhap = ?', [username])
  return json(mapAccount(user))
}

async function deleteAccount(db, username) {
  await run(db, "DELETE FROM TAI_KHOAN WHERE TenDangNhap = ? AND VaiTro <> 'ADMIN'", [username])
  return new Response(null, { status: 204 })
}

async function createDonor(db, body) {
  const id = await nextId(db, 'NGUOI_HIEN', 'NH')
  await run(db, 'INSERT INTO NGUOI_HIEN VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, body.name || body.hoTen || T.newDonor, asDate(body.birthDate, '2000-01-01'), body.gender || T.other, body.cccd || `${Date.now()}`.slice(-12), body.phone || '', body.medicalHistory || T.no, asInt(body.points), body.memberRank || T.bronze, body.bloodGroup || 'O+'])
  return json({ id, ...body }, 201)
}

async function createCampaign(db, body) {
  const id = await nextId(db, 'CHIEN_DICH', 'CD')
  await run(db, 'INSERT INTO CHIEN_DICH VALUES (?, ?, ?, ?, ?, ?)', [id, body.name || T.newCampaign, body.location || '', asDateTime(body.time), asInt(body.expected), asInt(body.actual)])
  return json({ id, ...body }, 201)
}

async function createHospital(db, body) {
  const id = await nextId(db, 'BENH_VIEN', 'BV')
  await run(db, 'INSERT INTO BENH_VIEN VALUES (?, ?, ?, ?)', [id, body.name || T.newHospital, body.address || '', body.phone || ''])
  return json({ id, ...body }, 201)
}

async function createPatient(db, body) {
  const id = await nextId(db, 'BENH_NHAN', 'BN')
  const hospitalId = body.hospitalId || await firstValue(db, 'SELECT MaBV AS value FROM BENH_VIEN ORDER BY MaBV LIMIT 1', 'BV001')
  await run(db, 'INSERT INTO BENH_NHAN VALUES (?, ?, ?, ?, ?, ?)', [id, body.name || T.newPatient, asDate(body.birthDate, '1990-01-01'), body.medicalRecord || '', body.bloodGroup || 'O+', hospitalId])
  return json({ id, ...body, hospitalId }, 201)
}

async function createBloodBag(db, body) {
  const id = await nextId(db, 'GOI_MAU_TOAN_PHAN', 'GM')
  const donorId = body.donorId || await firstValue(db, 'SELECT MaNguoiHien AS value FROM NGUOI_HIEN ORDER BY MaNguoiHien LIMIT 1', 'NH001')
  const campaignId = body.campaignId || await firstValue(db, 'SELECT MaChienDich AS value FROM CHIEN_DICH ORDER BY MaChienDich LIMIT 1', 'CD001')
  const staffId = body.staffId || await firstValue(db, 'SELECT MaNV AS value FROM NHAN_VIEN ORDER BY MaNV LIMIT 1', 'NV001')
  await run(db, 'INSERT INTO GOI_MAU_TOAN_PHAN VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, asDateTime(body.donatedAt), asInt(body.volume, 350), body.testStatus || T.waitingTest, donorId, body.bloodGroup || 'O+', campaignId, staffId])
  return json({ id, ...body, donorId, campaignId, staffId }, 201)
}

async function createLabTest(db, body) {
  const id = await nextId(db, 'KET_QUA_XET_NGHIEM', 'XN')
  const bloodBagId = body.bloodBagId || await firstValue(db, 'SELECT MaGoiMau AS value FROM GOI_MAU_TOAN_PHAN ORDER BY MaGoiMau LIMIT 1', 'GM001')
  const staffId = body.staffId || await firstValue(db, 'SELECT MaNV AS value FROM NHAN_VIEN ORDER BY MaNV LIMIT 1', 'NV001')
  await run(db, 'INSERT INTO KET_QUA_XET_NGHIEM VALUES (?, ?, ?, ?, ?, ?)', [id, body.type || 'HIV', body.result || T.negative, asDateTime(body.testedAt), bloodBagId, staffId])
  return json({ id, ...body, bloodBagId, staffId }, 201)
}

async function createComponent(db, body) {
  const id = await nextId(db, 'THANH_PHAN_MAU', 'TP')
  const bloodBagId = body.bloodBagId || await firstValue(db, 'SELECT MaGoiMau AS value FROM GOI_MAU_TOAN_PHAN ORDER BY MaGoiMau LIMIT 1', 'GM001')
  const storageId = body.storageId || await firstValue(db, 'SELECT MaViTri AS value FROM VI_TRI_KHO ORDER BY MaViTri LIMIT 1', 'VT001')
  const expiresAt = asDate(body.expiresAt, new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  await run(db, 'INSERT INTO THANH_PHAN_MAU VALUES (?, ?, ?, ?, ?, ?, ?)', [id, body.type || T.redCells, asInt(body.volume, 250), expiresAt, body.status || T.ready, bloodBagId, storageId])
  return json({ id, ...body, bloodBagId, storageId }, 201)
}

async function createRequest(db, body) {
  const id = await nextId(db, 'PHIEU_YEU_CAU', 'YC')
  const hospitalId = body.hospitalId || await firstValue(db, 'SELECT MaBV AS value FROM BENH_VIEN ORDER BY MaBV LIMIT 1', 'BV001')
  const patientId = body.patientId || await firstValue(db, 'SELECT MaBenhNhan AS value FROM BENH_NHAN ORDER BY MaBenhNhan LIMIT 1', 'BN001')
  const approverId = body.approverId || await firstValue(db, 'SELECT MaNV AS value FROM NHAN_VIEN ORDER BY MaNV LIMIT 1', 'NV001')
  await run(db, 'INSERT INTO PHIEU_YEU_CAU VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, asDateTime(body.requestedAt), body.componentType || T.redCells, asInt(body.volume, 250), body.status || T.waitingApproval, hospitalId, patientId, body.bloodGroup || 'O+', approverId])
  return json({ id, ...body, hospitalId, patientId, approverId }, 201)
}

async function createExport(db, body) {
  const id = await nextId(db, 'PHIEU_XUAT', 'PX')
  const requestId = body.requestId || await firstValue(db, 'SELECT MaPhieuYC AS value FROM PHIEU_YEU_CAU ORDER BY MaPhieuYC LIMIT 1', 'YC001')
  const staffId = body.staffId || await firstValue(db, 'SELECT MaNV AS value FROM NHAN_VIEN ORDER BY MaNV LIMIT 1', 'NV001')
  const componentId = body.componentId || await firstValue(db, "SELECT MaThanhPhan AS value FROM THANH_PHAN_MAU WHERE TrangThai <> ? ORDER BY HanSuDung, MaThanhPhan LIMIT 1", 'TP001', [T.exported])
  const totalVolume = asInt(body.totalVolume || body.volume, 250)
  await run(db, 'INSERT INTO PHIEU_XUAT VALUES (?, ?, ?, ?, ?)', [id, asDateTime(body.exportedAt), totalVolume, requestId, staffId])
  await run(db, 'INSERT INTO CHI_TIET_XUAT VALUES (?, ?, ?)', [id, componentId, body.crossMatch || T.compatible])
  await run(db, 'UPDATE THANH_PHAN_MAU SET TrangThai = ? WHERE MaThanhPhan = ?', [T.exported, componentId])
  return json({ id, ...body, requestId, staffId, componentId, totalVolume }, 201)
}

async function inventoryReport(db) {
  return rows(db, `
    SELECT g.MaNhomMau AS bloodGroup,
           SUM(CASE WHEN tp.LoaiThanhPhan LIKE ? THEN 1 ELSE 0 END) AS redCells,
           SUM(CASE WHEN tp.LoaiThanhPhan LIKE ? THEN 1 ELSE 0 END) AS plasma,
           SUM(CASE WHEN tp.LoaiThanhPhan LIKE ? THEN 1 ELSE 0 END) AS platelets,
           COUNT(tp.MaThanhPhan) AS total
    FROM NHOM_MAU g
    LEFT JOIN GOI_MAU_TOAN_PHAN gm ON gm.MaNhomMau = g.MaNhomMau
    LEFT JOIN THANH_PHAN_MAU tp ON tp.MaGoiMau = gm.MaGoiMau AND tp.TrangThai <> ?
    GROUP BY g.MaNhomMau
    ORDER BY g.MaNhomMau`, [`%${T.redCells}%`, '%Huyết%', '%Tiểu%', T.exported])
}

async function readJson(request) {
  try { return await request.json() } catch { return {} }
}
function json(value, status = 200) {
  return Response.json(value, { status, headers: { 'cache-control': 'no-store' } })
}
async function rows(db, sql, params = []) { return json(await all(db, sql, params)) }
async function all(db, sql, params = []) {
  const result = await db.prepare(sql).bind(...params).all()
  return result.results || []
}
async function first(db, sql, params = []) { return db.prepare(sql).bind(...params).first() }
async function run(db, sql, params = []) { return db.prepare(sql).bind(...params).run() }
async function firstValue(db, sql, fallback, params = []) {
  const row = await first(db, sql, params)
  return row?.value ?? fallback
}
async function nextId(db, table, prefix, width = 3) {
  const row = await first(db, `SELECT COUNT(*) AS total FROM ${table}`)
  return `${prefix}${String(Number(row?.total || 0) + 1).padStart(width, '0')}`
}
function mapAccount(row) {
  if (!row) return null
  return {
    id: row.MaTaiKhoan,
    username: row.TenDangNhap,
    displayName: row.HoTen,
    email: row.Email,
    role: String(row.VaiTro || '').toLowerCase(),
    status: row.TrangThai,
  }
}
function asInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}
function asDateTime(value) { return value ? new Date(value).toISOString() : new Date().toISOString() }
function asDate(value, fallback) { return value ? new Date(value).toISOString().slice(0, 10) : fallback }
