import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { getPool, sql } from './db.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3000)
const __dirname = dirname(fileURLToPath(import.meta.url))
const databaseDir = resolve(__dirname, '../database')
const T = {
  active: 'Ho\u1ea1t \u0111\u1ed9ng',
  missingLogin: 'Thi\u1ebfu t\u00ean \u0111\u0103ng nh\u1eadp ho\u1eb7c m\u1eadt kh\u1ea9u.',
  badLogin: 'T\u00ean \u0111\u0103ng nh\u1eadp ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.',
  missingRegister: 'Thi\u1ebfu th\u00f4ng tin \u0111\u0103ng k\u00fd.',
  other: 'Kh\u00e1c',
  bronze: '\u0110\u1ed3ng',
  no: 'Kh\u00f4ng',
  newDonor: 'Ng\u01b0\u1eddi hi\u1ebfn m\u1edbi',
  newCampaign: 'Chi\u1ebfn d\u1ecbch m\u1edbi',
  newHospital: 'B\u1ec7nh vi\u1ec7n m\u1edbi',
  newPatient: 'B\u1ec7nh nh\u00e2n m\u1edbi',
  waitingTest: 'Ch\u1edd x\u00e9t nghi\u1ec7m',
  negative: '\u00c2m t\u00ednh',
  redCells: 'H\u1ed3ng c\u1ea7u',
  ready: 'S\u1eb5n s\u00e0ng',
  waitingApproval: 'Ch\u1edd duy\u1ec7t',
  exported: '\u0110\u00e3 xu\u1ea5t',
  compatible: 'H\u00f2a h\u1ee3p',
  plasmaWord: 'Huy\u1ebft',
  plateletWord: 'Ti\u1ec3u',
}

app.use(cors())
app.use(express.json())

function asInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}
function asDateTime(value) {
  return value ? new Date(value) : new Date()
}
function nText(value, fallback = '') {
  const text = String(value ?? fallback)
  if (!text) return "N''"
  return Array.from(text).map((char) => `NCHAR(${char.codePointAt(0)})`).join(' + ')
}
function nLike(value) {
  return nText(`%${value}%`)
}

async function runSqlText(pool, text) {
  const batches = text
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean)
  for (const batch of batches) {
    await pool.request().batch(batch)
  }
}

async function runSqlFile(pool, fileName) {
  const text = await readFile(resolve(databaseDir, fileName), 'utf8')
  await runSqlText(pool, text)
}

async function resetDatabase() {
  const pool = await getPool()
  await runSqlText(pool, `
    IF OBJECT_ID('dbo.vw_TaiKhoan', 'V') IS NOT NULL DROP VIEW dbo.vw_TaiKhoan;
    IF OBJECT_ID('dbo.sp_XoaTaiKhoan', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_XoaTaiKhoan;
    IF OBJECT_ID('dbo.sp_ThuHoiStaff', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ThuHoiStaff;
    IF OBJECT_ID('dbo.sp_ChuyenThanhStaff', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ChuyenThanhStaff;
    IF OBJECT_ID('dbo.sp_DangKyNguoiHien', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DangKyNguoiHien;
    IF OBJECT_ID('dbo.sp_DangNhap', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DangNhap;
    IF OBJECT_ID('dbo.TAI_KHOAN', 'U') IS NOT NULL DROP TABLE dbo.TAI_KHOAN;
    IF OBJECT_ID('dbo.VAI_TRO', 'U') IS NOT NULL DROP TABLE dbo.VAI_TRO;
  `)
  await runSqlFile(pool, '00_schema.sql')
  await runSqlFile(pool, '02_auth_permissions.sql')
}
async function nextId(pool, table, _column, prefix, width = 3) {
  const result = await pool.request().query(`SELECT COUNT(*) AS total FROM ${table}`)
  return `${prefix}${String(Number(result.recordset[0].total) + 1).padStart(width, '0')}`
}
async function firstValue(pool, query, fallback) {
  const result = await pool.request().query(query)
  return result.recordset[0]?.value || fallback
}
function mapAccount(row) {
  return {
    id: row.MaTaiKhoan,
    username: row.TenDangNhap,
    displayName: row.HoTen,
    email: row.Email,
    role: String(row.VaiTro || '').toLowerCase(),
    status: row.TrangThai,
  }
}

app.get('/api/health', async (_req, res) => {
  try { await getPool(); res.json({ ok: true }) }
  catch (error) { res.status(500).json({ ok: false, message: error.message }) }
})

app.post('/api/admin/reset-database', async (_req, res) => {
  try {
    await resetDatabase()
    res.json({ ok: true, message: 'Đã reset database về dữ liệu mẫu.' })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ message: T.missingLogin })
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('TenDangNhap', sql.VarChar(50), username)
      .input('MatKhau', sql.VarChar(50), password)
      .execute('sp_DangNhap')
    const user = result.recordset[0]
    if (!user) return res.status(401).json({ message: T.badLogin })
    res.json(mapAccount(user))
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.post('/api/auth/register', async (req, res) => {
  const { username, password, displayName, email } = req.body || {}
  if (!username || !password || !displayName) return res.status(400).json({ message: T.missingRegister })
  try {
    const pool = await getPool()
    const accountId = await nextId(pool, 'TAI_KHOAN', 'MaTaiKhoan', 'TK')
    await pool.request()
      .input('MaTaiKhoan', sql.VarChar(20), accountId)
      .input('TenDangNhap', sql.VarChar(50), username)
      .input('MatKhau', sql.VarChar(50), password)
      .input('Email', sql.VarChar(120), email || '')
      .query(`INSERT INTO TAI_KHOAN VALUES (@MaTaiKhoan, @TenDangNhap, @MatKhau, ${nText(displayName)}, @Email, 'DONOR', NULL, NULL, NULL, ${nText(T.active)})`)
    const result = await pool.request().input('TenDangNhap', sql.VarChar(50), username).query('SELECT * FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap')
    res.status(201).json(mapAccount(result.recordset[0]))
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/accounts', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT * FROM TAI_KHOAN ORDER BY MaTaiKhoan'); res.json(result.recordset.map(mapAccount)) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.patch('/api/accounts/:username/promote', async (req, res) => {
  try { const pool = await getPool(); await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).execute('sp_ChuyenThanhStaff'); const result = await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).query('SELECT * FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap'); res.json(mapAccount(result.recordset[0])) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.patch('/api/accounts/:username/revoke', async (req, res) => {
  const nextRole = req.body?.role === 'hospital' ? 'HOSPITAL' : 'DONOR'
  try { const pool = await getPool(); await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).input('VaiTroMoi', sql.VarChar(20), nextRole).execute('sp_ThuHoiStaff'); const result = await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).query('SELECT * FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap'); res.json(mapAccount(result.recordset[0])) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.delete('/api/accounts/:username', async (req, res) => {
  try { const pool = await getPool(); await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).execute('sp_XoaTaiKhoan'); res.status(204).end() }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/blood-groups', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaNhomMau AS id, TenNhomMau AS name FROM NHOM_MAU ORDER BY MaNhomMau'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/donors', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaNguoiHien AS id, HoTen AS name, NgaySinh AS birthDate, SDT AS phone, MaNhomMau AS bloodGroup, BenhLy AS medicalHistory, DiemTichLuy AS points, HangThanhVien AS memberRank FROM NGUOI_HIEN ORDER BY MaNguoiHien'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/api/donors', async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool(); const id = await nextId(pool, 'NGUOI_HIEN', 'MaNguoiHien', 'NH')
    await pool.request()
      .input('MaNguoiHien', sql.VarChar(20), id)
      .input('NgaySinh', sql.Date, body.birthDate ? new Date(body.birthDate) : new Date('2000-01-01'))
      .input('CCCD', sql.VarChar(20), body.cccd || `${Date.now()}`.slice(-12))
      .input('SDT', sql.VarChar(15), body.phone || '')
      .input('DiemTichLuy', sql.Int, asInt(body.points, 0))
      .input('MaNhomMau', sql.VarChar(5), body.bloodGroup || 'O+')
      .query(`INSERT INTO NGUOI_HIEN VALUES (@MaNguoiHien, ${nText(body.name || body.hoTen, T.newDonor)}, @NgaySinh, ${nText(body.gender, T.other)}, @CCCD, @SDT, ${nText(body.medicalHistory, T.no)}, @DiemTichLuy, ${nText(body.memberRank, T.bronze)}, @MaNhomMau)`)
    res.status(201).json({ id, ...body })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/campaigns', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaChienDich AS id, TenChienDich AS name, DiaDiem AS location, ThoiGian AS time, SoLuongDuKien AS expected, SoLuongThucTe AS actual FROM CHIEN_DICH ORDER BY MaChienDich'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/api/campaigns', async (req, res) => {
  const body = req.body || {}
  try { const pool = await getPool(); const id = await nextId(pool, 'CHIEN_DICH', 'MaChienDich', 'CD'); await pool.request().input('MaChienDich', sql.VarChar(20), id).input('ThoiGian', sql.DateTime, asDateTime(body.time)).input('SoLuongDuKien', sql.Int, asInt(body.expected, 0)).input('SoLuongThucTe', sql.Int, asInt(body.actual, 0)).query(`INSERT INTO CHIEN_DICH VALUES (@MaChienDich, ${nText(body.name, T.newCampaign)}, ${nText(body.location)}, @ThoiGian, @SoLuongDuKien, @SoLuongThucTe)`); res.status(201).json({ id, ...body }) }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/hospitals', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaBV AS id, TenBV AS name, DiaChi AS address, SDT AS phone FROM BENH_VIEN ORDER BY MaBV'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/api/hospitals', async (req, res) => {
  const body = req.body || {}
  try { const pool = await getPool(); const id = await nextId(pool, 'BENH_VIEN', 'MaBV', 'BV'); await pool.request().input('MaBV', sql.VarChar(20), id).input('SDT', sql.VarChar(15), body.phone || '').query(`INSERT INTO BENH_VIEN VALUES (@MaBV, ${nText(body.name, T.newHospital)}, ${nText(body.address)}, @SDT)`); res.status(201).json({ id, ...body }) }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/patients', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaBenhNhan AS id, HoTen AS name, NgaySinh AS birthDate, MaNhomMau AS bloodGroup, BenhAn AS medicalRecord, MaBV AS hospitalId FROM BENH_NHAN ORDER BY MaBenhNhan'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/api/patients', async (req, res) => {
  const body = req.body || {}
  try { const pool = await getPool(); const id = await nextId(pool, 'BENH_NHAN', 'MaBenhNhan', 'BN'); const hospitalId = body.hospitalId || await firstValue(pool, 'SELECT TOP 1 MaBV AS value FROM BENH_VIEN ORDER BY MaBV', 'BV001'); await pool.request().input('MaBenhNhan', sql.VarChar(20), id).input('NgaySinh', sql.Date, body.birthDate ? new Date(body.birthDate) : new Date('1990-01-01')).input('MaNhomMau', sql.VarChar(5), body.bloodGroup || 'O+').input('MaBV', sql.VarChar(20), hospitalId).query(`INSERT INTO BENH_NHAN VALUES (@MaBenhNhan, ${nText(body.name, T.newPatient)}, @NgaySinh, ${nText(body.medicalRecord)}, @MaNhomMau, @MaBV)`); res.status(201).json({ id, ...body, hospitalId }) }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/blood-bags', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaGoiMau AS id, NgayHien AS donatedAt, TheTich AS volume, TrangThaiKiemDinh AS testStatus, MaNguoiHien AS donorId, MaNhomMau AS bloodGroup, MaChienDich AS campaignId, MaNV_ThuNhan AS staffId FROM GOI_MAU_TOAN_PHAN ORDER BY MaGoiMau'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/api/blood-bags', async (req, res) => {
  const body = req.body || {}
  try { const pool = await getPool(); const id = await nextId(pool, 'GOI_MAU_TOAN_PHAN', 'MaGoiMau', 'GM'); const donorId = body.donorId || await firstValue(pool, 'SELECT TOP 1 MaNguoiHien AS value FROM NGUOI_HIEN ORDER BY MaNguoiHien', 'NH001'); const campaignId = body.campaignId || await firstValue(pool, 'SELECT TOP 1 MaChienDich AS value FROM CHIEN_DICH ORDER BY MaChienDich', 'CD001'); const staffId = body.staffId || await firstValue(pool, 'SELECT TOP 1 MaNV AS value FROM NHAN_VIEN ORDER BY MaNV', 'NV001'); await pool.request().input('MaGoiMau', sql.VarChar(20), id).input('NgayHien', sql.DateTime, asDateTime(body.donatedAt)).input('TheTich', sql.Int, asInt(body.volume, 350)).input('MaNguoiHien', sql.VarChar(20), donorId).input('MaNhomMau', sql.VarChar(5), body.bloodGroup || 'O+').input('MaChienDich', sql.VarChar(20), campaignId).input('MaNV_ThuNhan', sql.VarChar(20), staffId).query(`INSERT INTO GOI_MAU_TOAN_PHAN VALUES (@MaGoiMau, @NgayHien, @TheTich, ${nText(body.testStatus, T.waitingTest)}, @MaNguoiHien, @MaNhomMau, @MaChienDich, @MaNV_ThuNhan)`); res.status(201).json({ id, ...body, donorId, campaignId, staffId }) }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/lab-tests', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaXetNghiem AS id, LoaiXetNghiem AS type, KetQua AS result, NgayXetNghiem AS testedAt, MaGoiMau AS bloodBagId, MaNV_ThucHien AS staffId FROM KET_QUA_XET_NGHIEM ORDER BY MaXetNghiem'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/api/lab-tests', async (req, res) => {
  const body = req.body || {}
  try { const pool = await getPool(); const id = await nextId(pool, 'KET_QUA_XET_NGHIEM', 'MaXetNghiem', 'XN'); const bloodBagId = body.bloodBagId || await firstValue(pool, 'SELECT TOP 1 MaGoiMau AS value FROM GOI_MAU_TOAN_PHAN ORDER BY MaGoiMau', 'GM001'); const staffId = body.staffId || await firstValue(pool, 'SELECT TOP 1 MaNV AS value FROM NHAN_VIEN ORDER BY MaNV', 'NV001'); await pool.request().input('MaXetNghiem', sql.VarChar(20), id).input('NgayXetNghiem', sql.DateTime, asDateTime(body.testedAt)).input('MaGoiMau', sql.VarChar(20), bloodBagId).input('MaNV_ThucHien', sql.VarChar(20), staffId).query(`INSERT INTO KET_QUA_XET_NGHIEM VALUES (@MaXetNghiem, ${nText(body.type, 'HIV')}, ${nText(body.result, T.negative)}, @NgayXetNghiem, @MaGoiMau, @MaNV_ThucHien)`); res.status(201).json({ id, ...body, bloodBagId, staffId }) }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/components', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaThanhPhan AS id, LoaiThanhPhan AS type, TheTichThucTe AS volume, HanSuDung AS expiresAt, TrangThai AS status, MaGoiMau AS bloodBagId, MaViTri AS storageId FROM THANH_PHAN_MAU ORDER BY MaThanhPhan'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/api/components', async (req, res) => {
  const body = req.body || {}
  try { const pool = await getPool(); const id = await nextId(pool, 'THANH_PHAN_MAU', 'MaThanhPhan', 'TP'); const bloodBagId = body.bloodBagId || await firstValue(pool, 'SELECT TOP 1 MaGoiMau AS value FROM GOI_MAU_TOAN_PHAN ORDER BY MaGoiMau', 'GM001'); const storageId = body.storageId || await firstValue(pool, 'SELECT TOP 1 MaViTri AS value FROM VI_TRI_KHO ORDER BY MaViTri', 'VT001'); const expiresAt = body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 35 * 24 * 60 * 60 * 1000); await pool.request().input('MaThanhPhan', sql.VarChar(20), id).input('TheTichThucTe', sql.Int, asInt(body.volume, 250)).input('HanSuDung', sql.Date, expiresAt).input('MaGoiMau', sql.VarChar(20), bloodBagId).input('MaViTri', sql.VarChar(20), storageId).query(`INSERT INTO THANH_PHAN_MAU VALUES (@MaThanhPhan, ${nText(body.type, T.redCells)}, @TheTichThucTe, @HanSuDung, ${nText(body.status, T.ready)}, @MaGoiMau, @MaViTri)`); res.status(201).json({ id, ...body, bloodBagId, storageId }) }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/requests', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaPhieuYC AS id, NgayYeuCau AS requestedAt, LoaiThanhPhanCan AS componentType, SoLuongML AS volume, TrangThaiDuyet AS status, MaBV AS hospitalId, MaBenhNhan AS patientId, MaNhomMau AS bloodGroup, MaNV_Duyet AS approverId FROM PHIEU_YEU_CAU ORDER BY MaPhieuYC'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/api/requests', async (req, res) => {
  const body = req.body || {}
  try { const pool = await getPool(); const id = await nextId(pool, 'PHIEU_YEU_CAU', 'MaPhieuYC', 'YC'); const hospitalId = body.hospitalId || await firstValue(pool, 'SELECT TOP 1 MaBV AS value FROM BENH_VIEN ORDER BY MaBV', 'BV001'); const patientId = body.patientId || await firstValue(pool, 'SELECT TOP 1 MaBenhNhan AS value FROM BENH_NHAN ORDER BY MaBenhNhan', 'BN001'); const approverId = body.approverId || await firstValue(pool, 'SELECT TOP 1 MaNV AS value FROM NHAN_VIEN ORDER BY MaNV', 'NV001'); await pool.request().input('MaPhieuYC', sql.VarChar(20), id).input('NgayYeuCau', sql.DateTime, asDateTime(body.requestedAt)).input('SoLuongML', sql.Int, asInt(body.volume, 250)).input('MaBV', sql.VarChar(20), hospitalId).input('MaBenhNhan', sql.VarChar(20), patientId).input('MaNhomMau', sql.VarChar(5), body.bloodGroup || 'O+').input('MaNV_Duyet', sql.VarChar(20), approverId).query(`INSERT INTO PHIEU_YEU_CAU VALUES (@MaPhieuYC, @NgayYeuCau, ${nText(body.componentType, T.redCells)}, @SoLuongML, ${nText(body.status, T.waitingApproval)}, @MaBV, @MaBenhNhan, @MaNhomMau, @MaNV_Duyet)`); res.status(201).json({ id, ...body, hospitalId, patientId, approverId }) }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/exports', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query(`SELECT px.MaPhieuXuat AS id, px.NgayXuat AS exportedAt, px.TongTheTich AS totalVolume, px.MaPhieuYC AS requestId, px.MaNV_Xuat AS staffId, ctx.MaThanhPhan AS componentId, ctx.KetQuaPhanUngCheo AS crossMatch FROM PHIEU_XUAT px LEFT JOIN CHI_TIET_XUAT ctx ON ctx.MaPhieuXuat = px.MaPhieuXuat ORDER BY px.MaPhieuXuat`); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/api/exports', async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool(); const id = await nextId(pool, 'PHIEU_XUAT', 'MaPhieuXuat', 'PX')
    const requestId = body.requestId || await firstValue(pool, 'SELECT TOP 1 MaPhieuYC AS value FROM PHIEU_YEU_CAU ORDER BY MaPhieuYC', 'YC001')
    const staffId = body.staffId || await firstValue(pool, 'SELECT TOP 1 MaNV AS value FROM NHAN_VIEN ORDER BY MaNV', 'NV001')
    const componentId = body.componentId || await firstValue(pool, `SELECT TOP 1 MaThanhPhan AS value FROM THANH_PHAN_MAU WHERE TrangThai <> ${nText(T.exported)} ORDER BY HanSuDung, MaThanhPhan`, 'TP001')
    const totalVolume = asInt(body.totalVolume || body.volume, 250)
    await pool.request().input('MaPhieuXuat', sql.VarChar(20), id).input('NgayXuat', sql.DateTime, asDateTime(body.exportedAt)).input('TongTheTich', sql.Int, totalVolume).input('MaPhieuYC', sql.VarChar(20), requestId).input('MaNV_Xuat', sql.VarChar(20), staffId).query('INSERT INTO PHIEU_XUAT VALUES (@MaPhieuXuat, @NgayXuat, @TongTheTich, @MaPhieuYC, @MaNV_Xuat)')
    await pool.request().input('MaPhieuXuat', sql.VarChar(20), id).input('MaThanhPhan', sql.VarChar(20), componentId).query(`INSERT INTO CHI_TIET_XUAT VALUES (@MaPhieuXuat, @MaThanhPhan, ${nText(body.crossMatch, T.compatible)})`)
    await pool.request().input('MaThanhPhan', sql.VarChar(20), componentId).query(`UPDATE THANH_PHAN_MAU SET TrangThai = ${nText(T.exported)} WHERE MaThanhPhan = @MaThanhPhan`)
    res.status(201).json({ id, ...body, requestId, staffId, componentId, totalVolume })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/api/reports/inventory', async (_req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT g.MaNhomMau AS bloodGroup,
             SUM(CASE WHEN tp.LoaiThanhPhan LIKE ${nLike(T.redCells)} THEN 1 ELSE 0 END) AS redCells,
             SUM(CASE WHEN tp.LoaiThanhPhan LIKE ${nLike(T.plasmaWord)} THEN 1 ELSE 0 END) AS plasma,
             SUM(CASE WHEN tp.LoaiThanhPhan LIKE ${nLike(T.plateletWord)} THEN 1 ELSE 0 END) AS platelets,
             COUNT(tp.MaThanhPhan) AS total
      FROM NHOM_MAU g
      LEFT JOIN GOI_MAU_TOAN_PHAN gm ON gm.MaNhomMau = g.MaNhomMau
      LEFT JOIN THANH_PHAN_MAU tp ON tp.MaGoiMau = gm.MaGoiMau AND tp.TrangThai <> ${nText(T.exported)}
      GROUP BY g.MaNhomMau
      ORDER BY g.MaNhomMau
    `)
    res.json(result.recordset)
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.get('/api/reports/expiring', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaThanhPhan AS id, LoaiThanhPhan AS type, HanSuDung AS expiresAt, TrangThai AS status FROM THANH_PHAN_MAU WHERE HanSuDung <= DATEADD(day, 30, GETDATE()) ORDER BY HanSuDung'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})
app.get('/api/reports/campaigns', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaChienDich AS id, TenChienDich AS name, SoLuongDuKien AS expected, SoLuongThucTe AS actual FROM CHIEN_DICH ORDER BY MaChienDich'); res.json(result.recordset) }
  catch (error) { res.status(500).json({ message: error.message }) }
})

app.listen(port, () => {
  console.log(`Bloodchain backend running at http://localhost:${port}`)
})
