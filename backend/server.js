import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
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
  duplicateUsername: 'T\u00ean \u0111\u0103ng nh\u1eadp \u0111\u00e3 t\u1ed3n t\u1ea1i.',
  serverError: 'H\u1ec7 th\u1ed1ng \u0111ang b\u1eadn, vui l\u00f2ng th\u1eed l\u1ea1i sau.',
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

function safeError(res, error, status = 500) {
  console.error('[bloodchain]', error)
  const message = String(error?.originalError?.message || error?.message || '')
  if (error?.number === 547 || /FOREIGN KEY|REFERENCE constraint/i.test(message)) {
    return res.status(409).json({ message: 'Dữ liệu đang được dùng ở nơi khác, không thể xóa.' })
  }
  if (error?.number === 2627 || /UNIQUE KEY|duplicate key/i.test(message)) {
    return res.status(409).json({ message: 'Giá trị đã tồn tại, vui lòng dùng giá trị khác.' })
  }
  res.status(status).json({ message: T.serverError })
}

async function deleteRow(pool, table, idColumn, idValue) {
  await pool.request().input('_id', sql.VarChar(20), idValue).query(`DELETE FROM ${table} WHERE ${idColumn} = @_id`)
}

async function updateRow(pool, table, idColumn, idValue, updates) {
  const setClauses = []
  const request = pool.request().input('_id', sql.VarChar(20), idValue)
  for (const [col, spec] of Object.entries(updates)) {
    if (spec.raw !== undefined) {
      setClauses.push(`${col} = ${spec.raw}`)
    } else {
      request.input(col, spec.type, spec.value)
      setClauses.push(`${col} = @${col}`)
    }
  }
  await request.query(`UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${idColumn} = @_id`)
}

app.use(cors())
app.use(express.json())

// Sprint 1 identity bridge: trust-on-faith headers from the SPA's localStorage.
// Real JWT/session comes in Sprint 3. Until then this is enough for the UI to
// scope requests; curl-with-spoofed-headers can still bypass and that's known.
app.use((req, _res, next) => {
  const username = req.get('X-User')
  const role = String(req.get('X-Role') || '').toLowerCase()
  if (!username || !role) {
    req.user = null
  } else {
    req.user = {
      username,
      role,
      donorId: req.get('X-Donor-Id') || null,
      hospitalId: req.get('X-Hospital-Id') || null,
      staffId: req.get('X-Staff-Id') || null,
    }
  }
  next()
})

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Vui lòng đăng nhập.' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' })
    }
    return next()
  }
}

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
    IF OBJECT_ID('dbo.sp_TuChoiTaiKhoan', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_TuChoiTaiKhoan;
    IF OBJECT_ID('dbo.sp_DuyetTaiKhoan', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DuyetTaiKhoan;
    IF OBJECT_ID('dbo.sp_DangKyTaiKhoanChoDuyet', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DangKyTaiKhoanChoDuyet;
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
async function nextId(pool, table, column, prefix, width = 3) {
  // SUBSTRING reads the whole numeric tail (up to 18 chars — column is VARCHAR(20)
  // minus a short prefix), not just `width`, so codes don't collide once they
  // pass 999. padStart(width) keeps them zero-padded and tidy up to 999, then
  // they naturally grow to NH1000, NH1001, ...
  //
  // Only count codes whose tail is purely numeric: the LIKE '<prefix>[0-9]%'
  // skips foreign-shaped ids in the same column (e.g. demo accounts use
  // MaTaiKhoan = 'TK_BV002'/'TK_NH0413', which must NOT be parsed as int), and
  // TRY_CAST returns NULL instead of throwing on any odd tail that slips through.
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(TRY_CAST(SUBSTRING(${column}, ${prefix.length + 1}, 18) AS INT)), 0) AS maxId FROM ${table} WHERE ${column} LIKE '${prefix}[0-9]%'`,
  )
  return `${prefix}${String(Number(result.recordset[0].maxId) + 1).padStart(width, '0')}`
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
    staffId: row.MaNV || null,
    donorId: row.MaNguoiHien || null,
    hospitalId: row.MaBV || null,
  }
}

app.get('/api/health', async (_req, res) => {
  try { await getPool(); res.json({ ok: true }) }
  catch (error) { console.error('[bloodchain]', error); res.status(500).json({ ok: false, message: T.serverError }) }
})

app.post('/api/admin/reset-database', requireRole('admin'), async (_req, res) => {
  try {
    await resetDatabase()
    res.json({ ok: true, message: 'Đã khôi phục dữ liệu mẫu.' })
  } catch (error) {
    console.error('[bloodchain]', error)
    res.status(500).json({ ok: false, message: T.serverError })
  }
})

// Cost factor 10 = ~10ms per hash on a modern laptop. Plenty for the lab demo
// without making the login spinner feel laggy.
const BCRYPT_ROUNDS = 10

// Detect a stored value that looks like a bcrypt hash. Defensive guard so a
// fresh DB-reset doesn't lock everyone out if a row was somehow seeded with
// plaintext.
function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$/.test(value)
}

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ message: T.missingLogin })
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('TenDangNhap', sql.VarChar(50), username)
      .execute('sp_DangNhap')
    const user = result.recordset[0]
    if (!user) return res.status(401).json({ message: T.badLogin })
    const stored = user.MatKhau || ''
    const ok = isBcryptHash(stored)
      ? await bcrypt.compare(password, stored)
      : stored === password // legacy plaintext fallback for un-migrated rows
    if (!ok) return res.status(401).json({ message: T.badLogin })
    res.json(mapAccount(user))
  } catch (error) { safeError(res, error) }
})

app.post('/api/auth/register', async (req, res) => {
  const { username, password, displayName, email, birthDate, gender, phone, bloodGroup } = req.body || {}
  if (!username || !password || !displayName) return res.status(400).json({ message: T.missingRegister })
  try {
    const pool = await getPool()
    const existing = await pool.request()
      .input('TenDangNhap', sql.VarChar(50), username)
      .query('SELECT 1 AS hit FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap')
    if (existing.recordset.length) return res.status(409).json({ message: T.duplicateUsername })
    const accountId = await nextId(pool, 'TAI_KHOAN', 'MaTaiKhoan', 'TK')
    const donorId = await nextId(pool, 'NGUOI_HIEN', 'MaNguoiHien', 'NH')
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    await pool.request()
      .input('MaTaiKhoan', sql.VarChar(20), accountId)
      .input('MaNguoiHien', sql.VarChar(20), donorId)
      .input('TenDangNhap', sql.VarChar(50), username)
      .input('MatKhau', sql.VarChar(255), passwordHash)
      .input('HoTen', sql.NVarChar(120), displayName)
      .input('Email', sql.VarChar(120), email || '')
      .input('NgaySinh', sql.Date, birthDate ? new Date(birthDate) : new Date('2000-01-01'))
      .input('GioiTinh', sql.NVarChar(10), gender || T.other)
      .input('SDT', sql.VarChar(15), phone || '')
      .input('MaNhomMau', sql.VarChar(5), bloodGroup || 'O+')
      .execute('sp_DangKyNguoiHien')
    const result = await pool.request().input('TenDangNhap', sql.VarChar(50), username).query('SELECT * FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap')
    res.status(201).json(mapAccount(result.recordset[0]))
  } catch (error) { safeError(res, error) }
})

// Public registration for hospital/staff accounts. Creates a "Chờ duyệt" row;
// admin must approve, which is when the BENH_VIEN/NHAN_VIEN profile is created.
app.post('/api/auth/register-staff', async (req, res) => {
  const { username, password, displayName, email, role, orgName, address, phone, position } = req.body || {}
  const requestedRole = String(role || '').toUpperCase()
  if (!username || !password || !displayName) return res.status(400).json({ message: T.missingRegister })
  if (requestedRole !== 'HOSPITAL' && requestedRole !== 'STAFF') {
    return res.status(400).json({ message: 'Loại tài khoản không hợp lệ.' })
  }
  try {
    const pool = await getPool()
    const existing = await pool.request()
      .input('TenDangNhap', sql.VarChar(50), username)
      .query('SELECT 1 AS hit FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap')
    if (existing.recordset.length) return res.status(409).json({ message: T.duplicateUsername })
    const accountId = await nextId(pool, 'TAI_KHOAN', 'MaTaiKhoan', 'TK')
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    await pool.request()
      .input('MaTaiKhoan', sql.VarChar(20), accountId)
      .input('TenDangNhap', sql.VarChar(50), username)
      .input('MatKhau', sql.VarChar(255), passwordHash)
      .input('HoTen', sql.NVarChar(120), displayName)
      .input('Email', sql.VarChar(120), email || '')
      .input('VaiTroYeuCau', sql.VarChar(20), requestedRole)
      .input('TenDonVi', sql.NVarChar(200), orgName || displayName)
      .input('DiaChi', sql.NVarChar(250), address || '')
      .input('SDT', sql.VarChar(15), phone || '')
      .input('ChucVu', sql.NVarChar(100), position || '')
      .execute('sp_DangKyTaiKhoanChoDuyet')
    res.status(201).json({ ok: true, message: 'Đã gửi yêu cầu. Vui lòng chờ quản trị duyệt tài khoản.' })
  } catch (error) { safeError(res, error) }
})

app.get('/api/accounts', requireRole('admin'), async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT * FROM vw_TaiKhoan ORDER BY MaTaiKhoan'); res.json(result.recordset.map(mapAccount)) }
  catch (error) { safeError(res, error) }
})
app.patch('/api/accounts/:username/revoke', requireRole('admin'), async (req, res) => {
  const nextRole = req.body?.role === 'hospital' ? 'HOSPITAL' : 'DONOR'
  try { const pool = await getPool(); await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).input('VaiTroMoi', sql.VarChar(20), nextRole).execute('sp_ThuHoiStaff'); const result = await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).query('SELECT * FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap'); res.json(mapAccount(result.recordset[0])) }
  catch (error) { safeError(res, error) }
})
app.delete('/api/accounts/:username', requireRole('admin'), async (req, res) => {
  if (req.params.username === req.user.username) return res.status(400).json({ message: 'Không thể tự xóa tài khoản đang đăng nhập.' })
  try { const pool = await getPool(); await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).execute('sp_XoaTaiKhoan'); res.status(204).end() }
  catch (error) { safeError(res, error) }
})

// Pending hospital/staff registration requests awaiting admin approval.
app.get('/api/accounts/pending', requireRole('admin'), async (_req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT MaTaiKhoan AS id, TenDangNhap AS username, HoTen AS displayName, Email AS email,
             VaiTroYeuCau AS requestedRole, TenDonVi AS orgName, DiaChi AS address,
             SDT AS phone, ChucVu AS position
      FROM TAI_KHOAN
      WHERE TrangThai = ${nText('Chờ duyệt')}
      ORDER BY MaTaiKhoan
    `)
    res.json(result.recordset)
  } catch (error) { safeError(res, error) }
})
app.patch('/api/accounts/:username/approve', requireRole('admin'), async (req, res) => {
  try {
    const pool = await getPool()
    const found = await pool.request()
      .input('TenDangNhap', sql.VarChar(50), req.params.username)
      .query(`SELECT VaiTroYeuCau, HoTen, Email, TenDonVi, DiaChi, SDT, ChucVu FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap AND TrangThai = ${nText('Chờ duyệt')}`)
    if (!found.recordset.length) return res.status(404).json({ message: 'Không tìm thấy yêu cầu chờ duyệt.' })
    const row = found.recordset[0]
    const requestedRole = String(row.VaiTroYeuCau || '').toUpperCase()

    const tx = new sql.Transaction(pool)
    await tx.begin()
    try {
      let maBV = null
      let maNV = null
      if (requestedRole === 'HOSPITAL') {
        maBV = await nextId(pool, 'BENH_VIEN', 'MaBV', 'BV')
        await new sql.Request(tx)
          .input('MaBV', sql.VarChar(20), maBV)
          .input('SDT', sql.VarChar(15), row.SDT || '')
          .query(`INSERT INTO BENH_VIEN VALUES (@MaBV, ${nText(row.TenDonVi, T.newHospital)}, ${nText(row.DiaChi)}, @SDT)`)
      } else if (requestedRole === 'STAFF') {
        maNV = await nextId(pool, 'NHAN_VIEN', 'MaNV', 'NV')
        await new sql.Request(tx)
          .input('MaNV', sql.VarChar(20), maNV)
          .input('Email', sql.VarChar(120), row.Email || '')
          .query(`INSERT INTO NHAN_VIEN VALUES (@MaNV, ${nText(row.HoTen)}, ${nText(row.ChucVu, 'Nhân viên')}, @Email)`)
      } else {
        await tx.rollback().catch(() => {})
        return res.status(400).json({ message: 'Vai trò yêu cầu không hợp lệ.' })
      }
      const approveReq = new sql.Request(tx).input('TenDangNhap', sql.VarChar(50), req.params.username)
      approveReq.input('MaBV', sql.VarChar(20), maBV)
      approveReq.input('MaNV', sql.VarChar(20), maNV)
      await approveReq.execute('sp_DuyetTaiKhoan')
      await tx.commit()
    } catch (err) {
      await tx.rollback().catch(() => {})
      throw err
    }
    const result = await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).query('SELECT * FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap')
    res.json(mapAccount(result.recordset[0]))
  } catch (error) { safeError(res, error) }
})
app.delete('/api/accounts/:username/reject', requireRole('admin'), async (req, res) => {
  try { const pool = await getPool(); await pool.request().input('TenDangNhap', sql.VarChar(50), req.params.username).execute('sp_TuChoiTaiKhoan'); res.status(204).end() }
  catch (error) { safeError(res, error) }
})

app.get('/api/blood-groups', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaNhomMau AS id, TenNhomMau AS name FROM NHOM_MAU ORDER BY MaNhomMau'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})

app.get('/api/staff', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaNV AS id, HoTen AS name, ChucVu AS role FROM NHAN_VIEN ORDER BY MaNV'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})

app.get('/api/storages', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaViTri AS id, TenTu + N\' - Ngăn \' + CAST(Ngan AS NVARCHAR(10)) AS name FROM VI_TRI_KHO ORDER BY MaViTri'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})

app.get('/api/donors', async (req, res) => {
  if (req.user?.role === 'donor') return res.status(403).json({ message: 'Bạn chỉ có thể xem hồ sơ của mình.' })
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaNguoiHien AS id, HoTen AS name, NgaySinh AS birthDate, GioiTinh AS gender, CCCD AS cccd, SDT AS phone, MaNhomMau AS bloodGroup, BenhLy AS medicalHistory, DiemTichLuy AS points, HangThanhVien AS memberRank FROM NGUOI_HIEN ORDER BY MaNguoiHien'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})
app.post('/api/donors', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool(); const id = await nextId(pool, 'NGUOI_HIEN', 'MaNguoiHien', 'NH')
    await pool.request()
      .input('MaNguoiHien', sql.VarChar(20), id)
      .input('NgaySinh', sql.Date, body.birthDate ? new Date(body.birthDate) : new Date('2000-01-01'))
      .input('CCCD', sql.VarChar(20), body.cccd || id)
      .input('SDT', sql.VarChar(15), body.phone || '')
      .input('DiemTichLuy', sql.Int, asInt(body.points, 0))
      .input('MaNhomMau', sql.VarChar(5), body.bloodGroup || 'O+')
      .query(`INSERT INTO NGUOI_HIEN VALUES (@MaNguoiHien, ${nText(body.name || body.hoTen, T.newDonor)}, @NgaySinh, ${nText(body.gender, T.other)}, @CCCD, @SDT, ${nText(body.medicalHistory, T.no)}, @DiemTichLuy, ${nText(body.memberRank, T.bronze)}, @MaNhomMau)`)
    // trg_UpdateHang derives HangThanhVien from DiemTichLuy, so report the
    // stored rank rather than whatever the client sent.
    const stored = await pool.request().input('MaNguoiHien', sql.VarChar(20), id).query('SELECT DiemTichLuy AS points, HangThanhVien AS memberRank FROM NGUOI_HIEN WHERE MaNguoiHien = @MaNguoiHien')
    res.status(201).json({ id, ...body, ...(stored.recordset[0] || {}) })
  } catch (error) { safeError(res, error) }
})
app.put('/api/donors/:id', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    await updateRow(pool, 'NGUOI_HIEN', 'MaNguoiHien', req.params.id, {
      HoTen: { raw: nText(body.name, T.newDonor) },
      NgaySinh: { type: sql.Date, value: body.birthDate ? new Date(body.birthDate) : new Date('2000-01-01') },
      GioiTinh: { raw: nText(body.gender, T.other) },
      CCCD: { type: sql.VarChar(20), value: body.cccd || req.params.id },
      SDT: { type: sql.VarChar(15), value: body.phone || '' },
      BenhLy: { raw: nText(body.medicalHistory, T.no) },
      DiemTichLuy: { type: sql.Int, value: asInt(body.points, 0) },
      HangThanhVien: { raw: nText(body.memberRank, T.bronze) },
      MaNhomMau: { type: sql.VarChar(5), value: body.bloodGroup || 'O+' },
    })
    // trg_UpdateHang may overwrite HangThanhVien from DiemTichLuy; report stored.
    const stored = await pool.request().input('MaNguoiHien', sql.VarChar(20), req.params.id).query('SELECT DiemTichLuy AS points, HangThanhVien AS memberRank FROM NGUOI_HIEN WHERE MaNguoiHien = @MaNguoiHien')
    res.json({ id: req.params.id, ...body, ...(stored.recordset[0] || {}) })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/donors/:id', requireRole('admin', 'staff'), async (req, res) => {
  try { const pool = await getPool(); await deleteRow(pool, 'NGUOI_HIEN', 'MaNguoiHien', req.params.id); res.status(204).end() }
  catch (error) { safeError(res, error) }
})

// Donor self-service: read/update own NGUOI_HIEN row.
app.get('/api/donors/me', requireRole('donor'), async (req, res) => {
  if (!req.user.donorId) return res.json(null)
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('MaNguoiHien', sql.VarChar(20), req.user.donorId)
      .query('SELECT MaNguoiHien AS id, HoTen AS name, NgaySinh AS birthDate, GioiTinh AS gender, SDT AS phone, MaNhomMau AS bloodGroup, BenhLy AS medicalHistory, DiemTichLuy AS points, HangThanhVien AS memberRank FROM NGUOI_HIEN WHERE MaNguoiHien = @MaNguoiHien')
    res.json(result.recordset[0] || null)
  } catch (error) { safeError(res, error) }
})
app.put('/api/donors/me', requireRole('donor'), async (req, res) => {
  if (!req.user.donorId) return res.status(400).json({ message: 'Tài khoản chưa có hồ sơ người hiến.' })
  const body = req.body || {}
  try {
    const pool = await getPool()
    // points + memberRank are not user-editable (they are system-managed)
    await updateRow(pool, 'NGUOI_HIEN', 'MaNguoiHien', req.user.donorId, {
      HoTen: { raw: nText(body.name, T.newDonor) },
      NgaySinh: { type: sql.Date, value: body.birthDate ? new Date(body.birthDate) : new Date('2000-01-01') },
      GioiTinh: { raw: nText(body.gender, T.other) },
      SDT: { type: sql.VarChar(15), value: body.phone || '' },
      BenhLy: { raw: nText(body.medicalHistory, T.no) },
      MaNhomMau: { type: sql.VarChar(5), value: body.bloodGroup || 'O+' },
    })
    res.json({ id: req.user.donorId, ...body })
  } catch (error) { safeError(res, error) }
})
app.get('/api/donors/me/donations', requireRole('donor'), async (req, res) => {
  if (!req.user.donorId) return res.json([])
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('MaNguoiHien', sql.VarChar(20), req.user.donorId)
      .query('SELECT MaGoiMau AS id, NgayHien AS donatedAt, TheTich AS volume, TrangThaiKiemDinh AS testStatus, MaNhomMau AS bloodGroup, MaChienDich AS campaignId FROM GOI_MAU_TOAN_PHAN WHERE MaNguoiHien = @MaNguoiHien ORDER BY NgayHien DESC')
    res.json(result.recordset)
  } catch (error) { safeError(res, error) }
})
app.get('/api/donors/me/points', requireRole('donor'), async (req, res) => {
  if (!req.user.donorId) return res.json({ points: 0, memberRank: '', redemptions: [] })
  try {
    const pool = await getPool()
    const profile = await pool.request()
      .input('MaNguoiHien', sql.VarChar(20), req.user.donorId)
      .query('SELECT DiemTichLuy AS points, HangThanhVien AS memberRank FROM NGUOI_HIEN WHERE MaNguoiHien = @MaNguoiHien')
    const redemptions = await pool.request()
      .input('MaNguoiHien', sql.VarChar(20), req.user.donorId)
      .query('SELECT MaDoiQua AS id, TenQua AS name, NgayDoi AS redeemedAt, DiemDoi AS pointsSpent FROM QUY_DOI_DIEM WHERE MaNguoiHien = @MaNguoiHien ORDER BY NgayDoi DESC')
    res.json({
      points: profile.recordset[0]?.points ?? 0,
      memberRank: profile.recordset[0]?.memberRank ?? '',
      redemptions: redemptions.recordset,
    })
  } catch (error) { safeError(res, error) }
})
app.get('/api/donors/me/campaigns', requireRole('donor'), async (req, res) => {
  if (!req.user.donorId) return res.json([])
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('MaNguoiHien', sql.VarChar(20), req.user.donorId)
      .query(`
        SELECT cd.MaChienDich AS id,
               cd.TenChienDich AS name,
               cd.DiaDiem AS location,
               cd.ThoiGian AS time,
               dk.NgayDangKy AS registeredAt
        FROM DANG_KY_CHIEN_DICH dk
        JOIN CHIEN_DICH cd ON cd.MaChienDich = dk.MaChienDich
        WHERE dk.MaNguoiHien = @MaNguoiHien
        ORDER BY cd.ThoiGian DESC
      `)
    res.json(result.recordset)
  } catch (error) { safeError(res, error) }
})

app.get('/api/campaigns', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaChienDich AS id, TenChienDich AS name, DiaDiem AS location, ThoiGian AS time, SoLuongDuKien AS expected, SoLuongThucTe AS actual FROM CHIEN_DICH ORDER BY MaChienDich'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})
app.post('/api/campaigns', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  // SoLuongThucTe is system-managed (auto +/- on blood-bag insert/delete), so
  // a new campaign always starts at 0 — we ignore any client-supplied actual.
  try { const pool = await getPool(); const id = await nextId(pool, 'CHIEN_DICH', 'MaChienDich', 'CD'); await pool.request().input('MaChienDich', sql.VarChar(20), id).input('ThoiGian', sql.DateTime, asDateTime(body.time)).input('SoLuongDuKien', sql.Int, asInt(body.expected, 0)).query(`INSERT INTO CHIEN_DICH VALUES (@MaChienDich, ${nText(body.name, T.newCampaign)}, ${nText(body.location)}, @ThoiGian, @SoLuongDuKien, 0)`); res.status(201).json({ id, ...body, actual: 0 }) }
  catch (error) { safeError(res, error) }
})
app.put('/api/campaigns/:id', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    // SoLuongThucTe intentionally omitted — it's derived from blood bags and
    // must not be overwritten by an edit form.
    await updateRow(pool, 'CHIEN_DICH', 'MaChienDich', req.params.id, {
      TenChienDich: { raw: nText(body.name, T.newCampaign) },
      DiaDiem: { raw: nText(body.location) },
      ThoiGian: { type: sql.DateTime, value: asDateTime(body.time) },
      SoLuongDuKien: { type: sql.Int, value: asInt(body.expected, 0) },
    })
    res.json({ id: req.params.id, ...body })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/campaigns/:id', requireRole('admin', 'staff'), async (req, res) => {
  try { const pool = await getPool(); await deleteRow(pool, 'CHIEN_DICH', 'MaChienDich', req.params.id); res.status(204).end() }
  catch (error) { safeError(res, error) }
})

// Donor self-service: register for a campaign. Donor identity is taken from
// the session — never from the body — so a donor can never sign someone else up.
app.post('/api/campaigns/:id/register', requireRole('donor'), async (req, res) => {
  if (!req.user.donorId) return res.status(400).json({ message: 'Tài khoản chưa có hồ sơ người hiến.' })
  try {
    const pool = await getPool()
    const exists = await pool.request()
      .input('MaChienDich', sql.VarChar(20), req.params.id)
      .query('SELECT 1 AS hit FROM CHIEN_DICH WHERE MaChienDich = @MaChienDich')
    if (!exists.recordset.length) return res.status(404).json({ message: 'Không tìm thấy chiến dịch.' })
    await pool.request()
      .input('MaChienDich', sql.VarChar(20), req.params.id)
      .input('MaNguoiHien', sql.VarChar(20), req.user.donorId)
      .input('NgayDangKy', sql.DateTime, new Date())
      .query('INSERT INTO DANG_KY_CHIEN_DICH VALUES (@MaChienDich, @MaNguoiHien, @NgayDangKy)')
    res.status(201).json({ campaignId: req.params.id, donorId: req.user.donorId })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/campaigns/:id/register', requireRole('donor'), async (req, res) => {
  if (!req.user.donorId) return res.status(400).json({ message: 'Tài khoản chưa có hồ sơ người hiến.' })
  try {
    const pool = await getPool()
    await pool.request()
      .input('MaChienDich', sql.VarChar(20), req.params.id)
      .input('MaNguoiHien', sql.VarChar(20), req.user.donorId)
      .query('DELETE FROM DANG_KY_CHIEN_DICH WHERE MaChienDich = @MaChienDich AND MaNguoiHien = @MaNguoiHien')
    res.status(204).end()
  } catch (error) { safeError(res, error) }
})
app.get('/api/campaigns/:id/registrations', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('MaChienDich', sql.VarChar(20), req.params.id)
      .query(`
        SELECT nh.MaNguoiHien AS donorId,
               nh.HoTen AS donorName,
               nh.MaNhomMau AS bloodGroup,
               dk.NgayDangKy AS registeredAt
        FROM DANG_KY_CHIEN_DICH dk
        JOIN NGUOI_HIEN nh ON nh.MaNguoiHien = dk.MaNguoiHien
        WHERE dk.MaChienDich = @MaChienDich
        ORDER BY dk.NgayDangKy
      `)
    res.json(result.recordset)
  } catch (error) { safeError(res, error) }
})

app.get('/api/hospitals', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaBV AS id, TenBV AS name, DiaChi AS address, SDT AS phone FROM BENH_VIEN ORDER BY MaBV'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})
app.post('/api/hospitals', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try { const pool = await getPool(); const id = await nextId(pool, 'BENH_VIEN', 'MaBV', 'BV'); await pool.request().input('MaBV', sql.VarChar(20), id).input('SDT', sql.VarChar(15), body.phone || '').query(`INSERT INTO BENH_VIEN VALUES (@MaBV, ${nText(body.name, T.newHospital)}, ${nText(body.address)}, @SDT)`); res.status(201).json({ id, ...body }) }
  catch (error) { safeError(res, error) }
})
app.put('/api/hospitals/:id', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    await updateRow(pool, 'BENH_VIEN', 'MaBV', req.params.id, {
      TenBV: { raw: nText(body.name, T.newHospital) },
      DiaChi: { raw: nText(body.address) },
      SDT: { type: sql.VarChar(15), value: body.phone || '' },
    })
    res.json({ id: req.params.id, ...body })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/hospitals/:id', requireRole('admin', 'staff'), async (req, res) => {
  try { const pool = await getPool(); await deleteRow(pool, 'BENH_VIEN', 'MaBV', req.params.id); res.status(204).end() }
  catch (error) { safeError(res, error) }
})

app.get('/api/patients', async (req, res) => {
  if (req.user?.role === 'donor') return res.status(403).json({ message: 'Không có quyền xem danh sách bệnh nhân.' })
  try {
    const pool = await getPool()
    const request = pool.request()
    let where = ''
    if (req.user?.role === 'hospital' && req.user.hospitalId) {
      request.input('MaBV', sql.VarChar(20), req.user.hospitalId)
      where = 'WHERE MaBV = @MaBV'
    }
    const result = await request.query(`SELECT MaBenhNhan AS id, HoTen AS name, NgaySinh AS birthDate, MaNhomMau AS bloodGroup, BenhAn AS medicalRecord, MaBV AS hospitalId FROM BENH_NHAN ${where} ORDER BY MaBenhNhan`)
    res.json(result.recordset)
  } catch (error) { safeError(res, error) }
})
app.post('/api/patients', requireRole('admin', 'staff', 'hospital'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool(); const id = await nextId(pool, 'BENH_NHAN', 'MaBenhNhan', 'BN')
    const hospitalId = req.user.role === 'hospital'
      ? (req.user.hospitalId || 'BV001')
      : (body.hospitalId || await firstValue(pool, 'SELECT TOP 1 MaBV AS value FROM BENH_VIEN ORDER BY MaBV', 'BV001'))
    await pool.request().input('MaBenhNhan', sql.VarChar(20), id).input('NgaySinh', sql.Date, body.birthDate ? new Date(body.birthDate) : new Date('1990-01-01')).input('MaNhomMau', sql.VarChar(5), body.bloodGroup || 'O+').input('MaBV', sql.VarChar(20), hospitalId).query(`INSERT INTO BENH_NHAN VALUES (@MaBenhNhan, ${nText(body.name, T.newPatient)}, @NgaySinh, ${nText(body.medicalRecord)}, @MaNhomMau, @MaBV)`)
    res.status(201).json({ id, ...body, hospitalId })
  } catch (error) { safeError(res, error) }
})
app.put('/api/patients/:id', requireRole('admin', 'staff', 'hospital'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    if (req.user.role === 'hospital') {
      const owned = await pool.request().input('_id', sql.VarChar(20), req.params.id).query('SELECT MaBV FROM BENH_NHAN WHERE MaBenhNhan = @_id')
      if (!owned.recordset.length) return res.status(404).json({ message: 'Không tìm thấy bệnh nhân.' })
      if (owned.recordset[0].MaBV !== req.user.hospitalId) {
        return res.status(403).json({ message: 'Bệnh nhân không thuộc bệnh viện của bạn.' })
      }
    }
    const targetHospitalId = req.user.role === 'hospital' ? req.user.hospitalId : (body.hospitalId || 'BV001')
    await updateRow(pool, 'BENH_NHAN', 'MaBenhNhan', req.params.id, {
      HoTen: { raw: nText(body.name, T.newPatient) },
      NgaySinh: { type: sql.Date, value: body.birthDate ? new Date(body.birthDate) : new Date('1990-01-01') },
      BenhAn: { raw: nText(body.medicalRecord) },
      MaNhomMau: { type: sql.VarChar(5), value: body.bloodGroup || 'O+' },
      MaBV: { type: sql.VarChar(20), value: targetHospitalId },
    })
    res.json({ id: req.params.id, ...body, hospitalId: targetHospitalId })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/patients/:id', requireRole('admin', 'staff', 'hospital'), async (req, res) => {
  try {
    const pool = await getPool()
    if (req.user.role === 'hospital') {
      const owned = await pool.request().input('_id', sql.VarChar(20), req.params.id).query('SELECT MaBV FROM BENH_NHAN WHERE MaBenhNhan = @_id')
      if (!owned.recordset.length) return res.status(404).json({ message: 'Không tìm thấy bệnh nhân.' })
      if (owned.recordset[0].MaBV !== req.user.hospitalId) {
        return res.status(403).json({ message: 'Bệnh nhân không thuộc bệnh viện của bạn.' })
      }
    }
    await deleteRow(pool, 'BENH_NHAN', 'MaBenhNhan', req.params.id)
    res.status(204).end()
  } catch (error) { safeError(res, error) }
})

app.get('/api/blood-bags', requireRole('admin', 'staff'), async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaGoiMau AS id, NgayHien AS donatedAt, TheTich AS volume, TrangThaiKiemDinh AS testStatus, MaNguoiHien AS donorId, MaNhomMau AS bloodGroup, MaChienDich AS campaignId, MaNV_ThuNhan AS staffId FROM GOI_MAU_TOAN_PHAN ORDER BY MaGoiMau'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})
app.post('/api/blood-bags', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool(); const id = await nextId(pool, 'GOI_MAU_TOAN_PHAN', 'MaGoiMau', 'GM')
    const donorId = body.donorId || await firstValue(pool, 'SELECT TOP 1 MaNguoiHien AS value FROM NGUOI_HIEN ORDER BY MaNguoiHien', 'NH001')
    const campaignId = body.campaignId || await firstValue(pool, 'SELECT TOP 1 MaChienDich AS value FROM CHIEN_DICH ORDER BY MaChienDich', 'CD001')
    const staffId = body.staffId || await firstValue(pool, 'SELECT TOP 1 MaNV AS value FROM NHAN_VIEN ORDER BY MaNV', 'NV001')
    // A brand-new bag has no lab results yet, so it can't be created already
    // "Đạt" — the guard rejects that (forces the test-then-pass workflow).
    const statusBlocker = await checkTestStatusAllowed(pool, id, body.testStatus)
    if (statusBlocker) return res.status(400).json({ message: statusBlocker })
    await pool.request().input('MaGoiMau', sql.VarChar(20), id).input('NgayHien', sql.DateTime, asDateTime(body.donatedAt)).input('TheTich', sql.Int, asInt(body.volume, 350)).input('MaNguoiHien', sql.VarChar(20), donorId).input('MaNhomMau', sql.VarChar(5), body.bloodGroup || 'O+').input('MaChienDich', sql.VarChar(20), campaignId).input('MaNV_ThuNhan', sql.VarChar(20), staffId).query(`INSERT INTO GOI_MAU_TOAN_PHAN VALUES (@MaGoiMau, @NgayHien, @TheTich, ${nText(body.testStatus, T.waitingTest)}, @MaNguoiHien, @MaNhomMau, @MaChienDich, @MaNV_ThuNhan)`)
    // SoLuongThucTe (campaign actual count) is recomputed by trg_TinhSoLuongThucTe
    // as COUNT of real bags per campaign. Donor points + member rank are owned by
    // the DB too (trg_CongDiem on INSERT, trg_UpdateHang recomputes the rank), so
    // the backend no longer touches either counter here.
    res.status(201).json({ id, ...body, donorId, campaignId, staffId })
  } catch (error) { safeError(res, error) }
})
app.put('/api/blood-bags/:id', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    // Can only flip to "Đạt" when real negative tests exist for this bag.
    const statusBlocker = await checkTestStatusAllowed(pool, req.params.id, body.testStatus)
    if (statusBlocker) return res.status(400).json({ message: statusBlocker })
    await updateRow(pool, 'GOI_MAU_TOAN_PHAN', 'MaGoiMau', req.params.id, {
      NgayHien: { type: sql.DateTime, value: asDateTime(body.donatedAt) },
      TheTich: { type: sql.Int, value: asInt(body.volume, 350) },
      TrangThaiKiemDinh: { raw: nText(body.testStatus, T.waitingTest) },
      MaNguoiHien: { type: sql.VarChar(20), value: body.donorId || 'NH001' },
      MaNhomMau: { type: sql.VarChar(5), value: body.bloodGroup || 'O+' },
      MaChienDich: { type: sql.VarChar(20), value: body.campaignId || 'CD001' },
      MaNV_ThuNhan: { type: sql.VarChar(20), value: body.staffId || 'NV001' },
    })
    res.json({ id: req.params.id, ...body })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/blood-bags/:id', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const pool = await getPool()
    // Campaign count + donor points are reversed by DB triggers
    // (trg_TinhSoLuongThucTe recomputes the campaign actual on DELETE,
    // trg_TruDiem reverses the donor points), so the backend just deletes the
    // row; safeError catches any FK conflict.
    await deleteRow(pool, 'GOI_MAU_TOAN_PHAN', 'MaGoiMau', req.params.id)
    res.status(204).end()
  } catch (error) { safeError(res, error) }
})

app.get('/api/lab-tests', requireRole('admin', 'staff'), async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaXetNghiem AS id, LoaiXetNghiem AS type, KetQua AS result, NgayXetNghiem AS testedAt, MaGoiMau AS bloodBagId, MaNV_ThucHien AS staffId FROM KET_QUA_XET_NGHIEM ORDER BY MaXetNghiem'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})
app.post('/api/lab-tests', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try { const pool = await getPool(); const id = await nextId(pool, 'KET_QUA_XET_NGHIEM', 'MaXetNghiem', 'XN'); const bloodBagId = body.bloodBagId || await firstValue(pool, 'SELECT TOP 1 MaGoiMau AS value FROM GOI_MAU_TOAN_PHAN ORDER BY MaGoiMau', 'GM001'); const staffId = body.staffId || await firstValue(pool, 'SELECT TOP 1 MaNV AS value FROM NHAN_VIEN ORDER BY MaNV', 'NV001'); await pool.request().input('MaXetNghiem', sql.VarChar(20), id).input('NgayXetNghiem', sql.DateTime, asDateTime(body.testedAt)).input('MaGoiMau', sql.VarChar(20), bloodBagId).input('MaNV_ThucHien', sql.VarChar(20), staffId).query(`INSERT INTO KET_QUA_XET_NGHIEM VALUES (@MaXetNghiem, ${nText(body.type, 'HIV')}, ${nText(body.result, T.negative)}, @NgayXetNghiem, @MaGoiMau, @MaNV_ThucHien)`); res.status(201).json({ id, ...body, bloodBagId, staffId }) }
  catch (error) { safeError(res, error) }
})
app.put('/api/lab-tests/:id', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    await updateRow(pool, 'KET_QUA_XET_NGHIEM', 'MaXetNghiem', req.params.id, {
      LoaiXetNghiem: { raw: nText(body.type, 'HIV') },
      KetQua: { raw: nText(body.result, T.negative) },
      NgayXetNghiem: { type: sql.DateTime, value: asDateTime(body.testedAt) },
      MaGoiMau: { type: sql.VarChar(20), value: body.bloodBagId || 'GM001' },
      MaNV_ThucHien: { type: sql.VarChar(20), value: body.staffId || 'NV001' },
    })
    res.json({ id: req.params.id, ...body })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/lab-tests/:id', requireRole('admin', 'staff'), async (req, res) => {
  try { const pool = await getPool(); await deleteRow(pool, 'KET_QUA_XET_NGHIEM', 'MaXetNghiem', req.params.id); res.status(204).end() }
  catch (error) { safeError(res, error) }
})

// Workflow guard: a bag can be split into components only if its kiểm định is
// "Đạt" AND no lab test for it returned "Dương tính". Returns null when OK,
// otherwise an error message describing the block.
async function checkBagReadyForComponents(pool, bagId) {
  const bag = await pool.request().input('MaGoiMau', sql.VarChar(20), bagId).query('SELECT TrangThaiKiemDinh FROM GOI_MAU_TOAN_PHAN WHERE MaGoiMau = @MaGoiMau')
  if (!bag.recordset.length) return 'Không tìm thấy gói máu.'
  const status = String(bag.recordset[0].TrangThaiKiemDinh || '').trim()
  if (status !== 'Đạt') return 'Gói máu chưa đạt xét nghiệm, không thể tách thành phần.'
  const reactive = await pool.request().input('MaGoiMau', sql.VarChar(20), bagId).query("SELECT 1 AS hit FROM KET_QUA_XET_NGHIEM WHERE MaGoiMau = @MaGoiMau AND (KetQua LIKE N'%Dương%' OR KetQua LIKE N'%Reactive%')")
  if (reactive.recordset.length) return 'Gói máu có kết quả xét nghiệm dương tính, không thể tách thành phần.'
  return null
}

// Workflow guard: a bag holds TheTich ml total, so the sum of all component
// volumes split from it must not exceed that. Returns null when OK, otherwise an
// error message. `excludeComponentId` lets an UPDATE ignore the row being edited
// so re-saving the same component doesn't count its old volume twice.
async function checkBagVolumeCapacity(pool, bagId, newVolume, excludeComponentId = null) {
  const bag = await pool.request().input('MaGoiMau', sql.VarChar(20), bagId).query('SELECT TheTich FROM GOI_MAU_TOAN_PHAN WHERE MaGoiMau = @MaGoiMau')
  if (!bag.recordset.length) return 'Không tìm thấy gói máu.'
  const capacity = Number(bag.recordset[0].TheTich || 0)
  const used = await pool.request()
    .input('MaGoiMau', sql.VarChar(20), bagId)
    .input('excludeId', sql.VarChar(20), excludeComponentId || '')
    .query('SELECT ISNULL(SUM(TheTichThucTe), 0) AS used FROM THANH_PHAN_MAU WHERE MaGoiMau = @MaGoiMau AND MaThanhPhan <> @excludeId')
  const alreadyUsed = Number(used.recordset[0].used || 0)
  const total = alreadyUsed + Number(newVolume || 0)
  if (total > capacity) {
    return `Tổng thể tích thành phần (${total} ml) vượt quá thể tích gói máu (${capacity} ml). Đã tách ${alreadyUsed} ml, còn lại ${Math.max(capacity - alreadyUsed, 0)} ml.`
  }
  return null
}

// Workflow guard: a bag may only be marked "Đạt" (passed) when it actually has
// lab results AND none are positive. Stops a manual "Đạt" from substituting for
// real testing (which would let untested/infected blood be split & exported).
// Returns null when the requested status is allowed, else an error message.
async function checkTestStatusAllowed(pool, bagId, requestedStatus) {
  if (String(requestedStatus || '').trim() !== 'Đạt') return null
  const tests = await pool.request().input('MaGoiMau', sql.VarChar(20), bagId).query(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN KetQua = N'Dương tính' THEN 1 ELSE 0 END) AS positives
    FROM KET_QUA_XET_NGHIEM WHERE MaGoiMau = @MaGoiMau
  `)
  const row = tests.recordset[0] || { total: 0, positives: 0 }
  if (Number(row.total || 0) === 0) {
    return 'Gói máu chưa có kết quả xét nghiệm, không thể đặt trạng thái "Đạt".'
  }
  if (Number(row.positives || 0) > 0) {
    return 'Gói máu có kết quả xét nghiệm dương tính, không thể đặt trạng thái "Đạt".'
  }
  return null
}
const COMPONENT_SHELF_LIFE_DAYS = {
  'Hồng cầu': 42,
  'Huyết tương': 365,
  'Tiểu cầu': 5,
}
function defaultExpiry(componentType, donatedAt) {
  const days = COMPONENT_SHELF_LIFE_DAYS[String(componentType || '').trim()] ?? 35
  const base = donatedAt ? new Date(donatedAt) : new Date()
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000)
}

// Map a component-type label to a coarse category so the several concrete
// labels per kind compare correctly: "Hồng cầu"/"Khối hồng cầu" -> 'red',
// "Tiểu cầu"/"Khối tiểu cầu" -> 'platelet', "Huyết tương"/"Huyết tương tươi"
// -> 'plasma'. Used to gate exports so a platelet request can't be filled with
// red cells. Returns '' when unrecognised.
function componentCategory(text) {
  const value = String(text || '').toLowerCase()
  if (value.includes('hồng cầu')) return 'red'
  if (value.includes('tiểu cầu')) return 'platelet'
  if (value.includes('huyết tương')) return 'plasma'
  return ''
}

app.get('/api/components', requireRole('admin', 'staff'), async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaThanhPhan AS id, LoaiThanhPhan AS type, TheTichThucTe AS volume, HanSuDung AS expiresAt, TrangThai AS status, MaGoiMau AS bloodBagId, MaViTri AS storageId FROM THANH_PHAN_MAU ORDER BY MaThanhPhan'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})
app.post('/api/components', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    const id = await nextId(pool, 'THANH_PHAN_MAU', 'MaThanhPhan', 'TP')
    const bloodBagId = body.bloodBagId || await firstValue(pool, 'SELECT TOP 1 MaGoiMau AS value FROM GOI_MAU_TOAN_PHAN ORDER BY MaGoiMau', 'GM001')
    const blocker = await checkBagReadyForComponents(pool, bloodBagId)
    if (blocker) return res.status(400).json({ message: blocker })
    const overCapacity = await checkBagVolumeCapacity(pool, bloodBagId, asInt(body.volume, 250))
    if (overCapacity) return res.status(400).json({ message: overCapacity })
    const storageId = body.storageId || await firstValue(pool, 'SELECT TOP 1 MaViTri AS value FROM VI_TRI_KHO ORDER BY MaViTri', 'VT001')
    let expiresAt
    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt)
    } else {
      const bagDate = await firstValue(pool, `SELECT TOP 1 NgayHien AS value FROM GOI_MAU_TOAN_PHAN WHERE MaGoiMau = '${bloodBagId.replace(/'/g, "''")}'`, null)
      expiresAt = defaultExpiry(body.type, bagDate)
    }
    await pool.request().input('MaThanhPhan', sql.VarChar(20), id).input('TheTichThucTe', sql.Int, asInt(body.volume, 250)).input('HanSuDung', sql.Date, expiresAt).input('MaGoiMau', sql.VarChar(20), bloodBagId).input('MaViTri', sql.VarChar(20), storageId).query(`INSERT INTO THANH_PHAN_MAU VALUES (@MaThanhPhan, ${nText(body.type, T.redCells)}, @TheTichThucTe, @HanSuDung, ${nText(body.status, T.ready)}, @MaGoiMau, @MaViTri)`)
    // trg_SetHanSuDung recomputes HanSuDung from component type + NgayHien, so
    // read the stored value back instead of echoing the inserted guess.
    const stored = await pool.request().input('MaThanhPhan', sql.VarChar(20), id).query('SELECT HanSuDung FROM THANH_PHAN_MAU WHERE MaThanhPhan = @MaThanhPhan')
    const finalExpiry = stored.recordset[0]?.HanSuDung ?? expiresAt
    res.status(201).json({ id, ...body, bloodBagId, storageId, expiresAt: finalExpiry })
  } catch (error) { safeError(res, error) }
})
app.put('/api/components/:id', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    const targetBag = body.bloodBagId || 'GM001'
    // Re-check the bag if the caller is changing it.
    const blocker = await checkBagReadyForComponents(pool, targetBag)
    if (blocker) return res.status(400).json({ message: blocker })
    const overCapacity = await checkBagVolumeCapacity(pool, targetBag, asInt(body.volume, 250), req.params.id)
    if (overCapacity) return res.status(400).json({ message: overCapacity })
    let expiresAt
    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt)
    } else {
      const bagDate = await firstValue(pool, `SELECT TOP 1 NgayHien AS value FROM GOI_MAU_TOAN_PHAN WHERE MaGoiMau = '${targetBag.replace(/'/g, "''")}'`, null)
      expiresAt = defaultExpiry(body.type, bagDate)
    }
    await updateRow(pool, 'THANH_PHAN_MAU', 'MaThanhPhan', req.params.id, {
      LoaiThanhPhan: { raw: nText(body.type, T.redCells) },
      TheTichThucTe: { type: sql.Int, value: asInt(body.volume, 250) },
      HanSuDung: { type: sql.Date, value: expiresAt },
      TrangThai: { raw: nText(body.status, T.ready) },
      MaGoiMau: { type: sql.VarChar(20), value: targetBag },
      MaViTri: { type: sql.VarChar(20), value: body.storageId || 'VT001' },
    })
    // trg_SetHanSuDung may overwrite HanSuDung on UPDATE; report the stored value.
    const stored = await pool.request().input('MaThanhPhan', sql.VarChar(20), req.params.id).query('SELECT HanSuDung FROM THANH_PHAN_MAU WHERE MaThanhPhan = @MaThanhPhan')
    const finalExpiry = stored.recordset[0]?.HanSuDung ?? expiresAt
    res.json({ id: req.params.id, ...body, expiresAt: finalExpiry })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/components/:id', requireRole('admin', 'staff'), async (req, res) => {
  try { const pool = await getPool(); await deleteRow(pool, 'THANH_PHAN_MAU', 'MaThanhPhan', req.params.id); res.status(204).end() }
  catch (error) { safeError(res, error) }
})

app.get('/api/requests', async (req, res) => {
  if (req.user?.role === 'donor') return res.status(403).json({ message: 'Không có quyền xem phiếu yêu cầu.' })
  try {
    const pool = await getPool()
    const request = pool.request()
    let where = ''
    if (req.user?.role === 'hospital' && req.user.hospitalId) {
      request.input('MaBV', sql.VarChar(20), req.user.hospitalId)
      where = 'WHERE MaBV = @MaBV'
    }
    const result = await request.query(`SELECT MaPhieuYC AS id, NgayYeuCau AS requestedAt, LoaiThanhPhanCan AS componentType, SoLuongML AS volume, TrangThaiDuyet AS status, MaBV AS hospitalId, MaBenhNhan AS patientId, MaNhomMau AS bloodGroup, MaNV_Duyet AS approverId FROM PHIEU_YEU_CAU ${where} ORDER BY MaPhieuYC`)
    res.json(result.recordset)
  } catch (error) { safeError(res, error) }
})
app.post('/api/requests', requireRole('admin', 'staff', 'hospital'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool(); const id = await nextId(pool, 'PHIEU_YEU_CAU', 'MaPhieuYC', 'YC')
    // Hospital must use their own MaBV; status starts at "Chờ duyệt" and they
    // cannot self-approve. Admin/staff can supply hospitalId/status freely.
    const isHospital = req.user.role === 'hospital'
    const patientId = body.patientId || await firstValue(pool, 'SELECT TOP 1 MaBenhNhan AS value FROM BENH_NHAN ORDER BY MaBenhNhan', 'BN001')
    // The request is FOR a specific patient, so its blood group is the patient's
    // actual MaNhomMau (authoritative) — never the client-supplied bloodGroup,
    // which previously let a request store O+ for an A- patient and still clear
    // the strict blood-group check at export time.
    const patient = await pool.request().input('MaBenhNhan', sql.VarChar(20), patientId).query('SELECT MaNhomMau, MaBV FROM BENH_NHAN WHERE MaBenhNhan = @MaBenhNhan')
    if (!patient.recordset.length) return res.status(404).json({ message: 'Không tìm thấy bệnh nhân.' })
    const patientRow = patient.recordset[0]
    // A hospital can only file requests for its own patients (mirror the
    // ownership check already enforced on PUT/DELETE patients).
    if (isHospital && patientRow.MaBV !== req.user.hospitalId) {
      return res.status(403).json({ message: 'Bệnh nhân không thuộc bệnh viện của bạn.' })
    }
    const hospitalId = isHospital
      ? (req.user.hospitalId || 'BV001')
      : (body.hospitalId || patientRow.MaBV || await firstValue(pool, 'SELECT TOP 1 MaBV AS value FROM BENH_VIEN ORDER BY MaBV', 'BV001'))
    const bloodGroup = patientRow.MaNhomMau || 'O+'
    const approverId = isHospital ? null : (body.approverId || null)
    const status = isHospital ? T.waitingApproval : (body.status || T.waitingApproval)
    const insert = pool.request()
      .input('MaPhieuYC', sql.VarChar(20), id)
      .input('NgayYeuCau', sql.DateTime, asDateTime(body.requestedAt))
      .input('SoLuongML', sql.Int, asInt(body.volume, 250))
      .input('MaBV', sql.VarChar(20), hospitalId)
      .input('MaBenhNhan', sql.VarChar(20), patientId)
      .input('MaNhomMau', sql.VarChar(5), bloodGroup)
    if (approverId) insert.input('MaNV_Duyet', sql.VarChar(20), approverId)
    const approverSql = approverId ? '@MaNV_Duyet' : 'NULL'
    await insert.query(`INSERT INTO PHIEU_YEU_CAU VALUES (@MaPhieuYC, @NgayYeuCau, ${nText(body.componentType, T.redCells)}, @SoLuongML, ${nText(status, T.waitingApproval)}, @MaBV, @MaBenhNhan, @MaNhomMau, ${approverSql})`)
    res.status(201).json({ id, ...body, hospitalId, patientId, approverId, status, bloodGroup })
  } catch (error) { safeError(res, error) }
})
app.put('/api/requests/:id', requireRole('admin', 'staff', 'hospital'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    const isHospital = req.user.role === 'hospital'
    // Status + approver are owned by the /approve endpoint (which guards the
    // "Chờ duyệt"-only transition), so a plain edit must never change them — for
    // any role. Read the current row to preserve those fields.
    const existing = await pool.request().input('_id', sql.VarChar(20), req.params.id).query('SELECT MaBV, TrangThaiDuyet, MaNV_Duyet FROM PHIEU_YEU_CAU WHERE MaPhieuYC = @_id')
    if (!existing.recordset.length) return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu.' })
    const preserved = existing.recordset[0]
    if (isHospital) {
      if (preserved.MaBV !== req.user.hospitalId) {
        return res.status(403).json({ message: 'Phiếu không thuộc bệnh viện của bạn.' })
      }
      if (String(preserved.TrangThaiDuyet || '').trim() !== T.waitingApproval) {
        return res.status(409).json({ message: 'Chỉ phiếu đang chờ duyệt mới có thể chỉnh sửa.' })
      }
    }
    // The request's blood group must follow the chosen patient's actual group
    // (authoritative), not a client-picked value. Also lets us reject a hospital
    // editing a request onto another hospital's patient.
    const patientId = body.patientId || 'BN001'
    const patient = await pool.request().input('MaBenhNhan', sql.VarChar(20), patientId).query('SELECT MaNhomMau, MaBV FROM BENH_NHAN WHERE MaBenhNhan = @MaBenhNhan')
    if (!patient.recordset.length) return res.status(404).json({ message: 'Không tìm thấy bệnh nhân.' })
    const patientRow = patient.recordset[0]
    if (isHospital && patientRow.MaBV !== req.user.hospitalId) {
      return res.status(403).json({ message: 'Bệnh nhân không thuộc bệnh viện của bạn.' })
    }
    const updates = {
      NgayYeuCau: { type: sql.DateTime, value: asDateTime(body.requestedAt) },
      LoaiThanhPhanCan: { raw: nText(body.componentType, T.redCells) },
      SoLuongML: { type: sql.Int, value: asInt(body.volume, 250) },
      MaBenhNhan: { type: sql.VarChar(20), value: patientId },
      MaNhomMau: { type: sql.VarChar(5), value: patientRow.MaNhomMau || 'O+' },
    }
    if (isHospital) {
      // Lock: hospital cannot change ownership, status, or approver.
      updates.MaBV = { type: sql.VarChar(20), value: preserved.MaBV }
    } else {
      updates.MaBV = { type: sql.VarChar(20), value: body.hospitalId || preserved.MaBV || 'BV001' }
    }
    // Status + approver are preserved for ALL roles here; transitions go through
    // PATCH /api/requests/:id/approve, which enforces the "Chờ duyệt"-only guard.
    // This stops a plain edit from resurrecting a rejected/issued request.
    updates.TrangThaiDuyet = { raw: nText(preserved.TrangThaiDuyet, T.waitingApproval) }
    if (preserved.MaNV_Duyet) {
      updates.MaNV_Duyet = { type: sql.VarChar(20), value: preserved.MaNV_Duyet }
    } else {
      updates.MaNV_Duyet = { raw: 'NULL' }
    }
    await updateRow(pool, 'PHIEU_YEU_CAU', 'MaPhieuYC', req.params.id, updates)
    res.json({ id: req.params.id, ...body })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/requests/:id', requireRole('admin', 'staff', 'hospital'), async (req, res) => {
  try {
    const pool = await getPool()
    if (req.user.role === 'hospital') {
      const owned = await pool.request().input('_id', sql.VarChar(20), req.params.id).query('SELECT MaBV, TrangThaiDuyet FROM PHIEU_YEU_CAU WHERE MaPhieuYC = @_id')
      if (!owned.recordset.length) return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu.' })
      const row = owned.recordset[0]
      if (row.MaBV !== req.user.hospitalId) {
        return res.status(403).json({ message: 'Phiếu không thuộc bệnh viện của bạn.' })
      }
      if (String(row.TrangThaiDuyet || '').trim() !== T.waitingApproval) {
        return res.status(409).json({ message: 'Chỉ phiếu đang chờ duyệt mới có thể xóa.' })
      }
    }
    await deleteRow(pool, 'PHIEU_YEU_CAU', 'MaPhieuYC', req.params.id)
    res.status(204).end()
  } catch (error) { safeError(res, error) }
})

// Staff/admin approve or reject a pending request. Body: { approve: boolean, reason? }
app.patch('/api/requests/:id/approve', requireRole('admin', 'staff'), async (req, res) => {
  const approve = req.body?.approve !== false
  const newStatus = approve ? 'Đã duyệt' : 'Từ chối'
  try {
    const pool = await getPool()
    const found = await pool.request().input('_id', sql.VarChar(20), req.params.id).query('SELECT TrangThaiDuyet FROM PHIEU_YEU_CAU WHERE MaPhieuYC = @_id')
    if (!found.recordset.length) return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu.' })
    if (String(found.recordset[0].TrangThaiDuyet || '').trim() !== T.waitingApproval) {
      return res.status(409).json({ message: 'Phiếu này đã được xử lý.' })
    }
    const approverId = req.user.staffId || await firstValue(pool, 'SELECT TOP 1 MaNV AS value FROM NHAN_VIEN ORDER BY MaNV', 'NV001')
    await updateRow(pool, 'PHIEU_YEU_CAU', 'MaPhieuYC', req.params.id, {
      TrangThaiDuyet: { raw: nText(newStatus) },
      MaNV_Duyet: { type: sql.VarChar(20), value: approverId },
    })
    res.json({ id: req.params.id, status: newStatus, approverId })
  } catch (error) { safeError(res, error) }
})

app.get('/api/exports', async (req, res) => {
  if (req.user?.role === 'donor') return res.status(403).json({ message: 'Không có quyền xem phiếu xuất.' })
  try {
    const pool = await getPool()
    const request = pool.request()
    let where = ''
    if (req.user?.role === 'hospital' && req.user.hospitalId) {
      request.input('MaBV', sql.VarChar(20), req.user.hospitalId)
      where = 'WHERE pyc.MaBV = @MaBV'
    }
    const result = await request.query(`
      SELECT px.MaPhieuXuat AS id,
             px.NgayXuat AS exportedAt,
             px.TongTheTich AS totalVolume,
             px.MaPhieuYC AS requestId,
             px.MaNV_Xuat AS staffId,
             STUFF((SELECT ', ' + ctx2.MaThanhPhan
                    FROM CHI_TIET_XUAT ctx2
                    WHERE ctx2.MaPhieuXuat = px.MaPhieuXuat
                    FOR XML PATH('')), 1, 2, '') AS componentId,
             (SELECT TOP 1 ctx3.KetQuaPhanUngCheo
              FROM CHI_TIET_XUAT ctx3
              WHERE ctx3.MaPhieuXuat = px.MaPhieuXuat) AS crossMatch
      FROM PHIEU_XUAT px
      LEFT JOIN PHIEU_YEU_CAU pyc ON pyc.MaPhieuYC = px.MaPhieuYC
      ${where}
      ORDER BY px.MaPhieuXuat
    `)
    res.json(result.recordset)
  } catch (error) { safeError(res, error) }
})
app.post('/api/exports', requireRole('admin', 'staff'), async (req, res) => {
  const body = req.body || {}
  try {
    const pool = await getPool()
    const id = await nextId(pool, 'PHIEU_XUAT', 'MaPhieuXuat', 'PX')
    const requestId = body.requestId || await firstValue(pool, 'SELECT TOP 1 MaPhieuYC AS value FROM PHIEU_YEU_CAU ORDER BY MaPhieuYC', 'YC001')
    const staffId = req.user?.staffId || body.staffId || await firstValue(pool, 'SELECT TOP 1 MaNV AS value FROM NHAN_VIEN ORDER BY MaNV', 'NV001')
    const totalVolume = asInt(body.totalVolume || body.volume, 250)
    const crossMatch = String(body.crossMatch || T.compatible)

    // Workflow gate: validate request approval, blood-group match, component
    // type match, cross-match, component status, expiry, and requested-volume
    // cap before any write.
    const reqRow = await pool.request().input('MaPhieuYC', sql.VarChar(20), requestId).query('SELECT TrangThaiDuyet, MaNhomMau, SoLuongML, LoaiThanhPhanCan FROM PHIEU_YEU_CAU WHERE MaPhieuYC = @MaPhieuYC')
    if (!reqRow.recordset.length) return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu.' })
    const requestRow = reqRow.recordset[0]
    if (String(requestRow.TrangThaiDuyet || '').trim() !== 'Đã duyệt') {
      return res.status(400).json({ message: 'Phiếu yêu cầu chưa được duyệt, không thể xuất kho.' })
    }
    // FIFO auto-pick: when no component is named, choose the earliest-expiring
    // READY, not-expired component whose source bag matches the request's blood
    // group AND requested component category — so the picked unit already passes
    // the downstream group/type checks instead of being a near-random miss.
    const categoryKeyword = { red: T.redCells, platelet: T.plateletWord, plasma: T.plasmaWord }[componentCategory(requestRow.LoaiThanhPhanCan)] || ''
    let componentId = body.componentId
    if (!componentId) {
      const pick = await pool.request()
        .input('grp', sql.VarChar(5), requestRow.MaNhomMau || '')
        .query(`
          SELECT TOP 1 tp.MaThanhPhan AS value
          FROM THANH_PHAN_MAU tp
          JOIN GOI_MAU_TOAN_PHAN gm ON gm.MaGoiMau = tp.MaGoiMau
          WHERE tp.TrangThai = ${nText(T.ready)}
            AND tp.HanSuDung > GETDATE()
            AND gm.MaNhomMau = @grp
            ${categoryKeyword ? `AND tp.LoaiThanhPhan LIKE ${nLike(categoryKeyword)}` : ''}
          ORDER BY tp.HanSuDung, tp.MaThanhPhan
        `)
      componentId = pick.recordset[0]?.value
      if (!componentId) {
        return res.status(404).json({ message: `Không còn thành phần phù hợp để xuất (nhóm máu ${requestRow.MaNhomMau}, loại "${requestRow.LoaiThanhPhanCan}").` })
      }
    }
    const compRow = await pool.request().input('MaThanhPhan', sql.VarChar(20), componentId).query(`
      SELECT tp.TrangThai AS TrangThai, tp.HanSuDung AS HanSuDung, tp.LoaiThanhPhan AS LoaiThanhPhan,
             tp.TheTichThucTe AS TheTichThucTe, tp.MaGoiMau AS MaGoiMau,
             gm.MaNhomMau AS MaNhomMau, gm.TrangThaiKiemDinh AS TrangThaiKiemDinh
      FROM THANH_PHAN_MAU tp
      LEFT JOIN GOI_MAU_TOAN_PHAN gm ON gm.MaGoiMau = tp.MaGoiMau
      WHERE tp.MaThanhPhan = @MaThanhPhan
    `)
    if (!compRow.recordset.length) return res.status(404).json({ message: 'Không tìm thấy thành phần máu.' })
    const componentRow = compRow.recordset[0]
    if (String(componentRow.TrangThai || '').trim() !== T.ready) {
      return res.status(400).json({ message: 'Thành phần đã xuất hoặc không sẵn sàng.' })
    }
    // Re-validate the SOURCE BAG's lab safety at export time. A bag can pass
    // testing when a component is created, then later get a positive result —
    // the component status doesn't change, so without this check an already-split
    // unit from a now-reactive bag could still be issued. Block if the bag isn't
    // "Đạt" or has any positive test.
    if (componentRow.MaGoiMau) {
      const bagBlocker = await checkBagReadyForComponents(pool, componentRow.MaGoiMau)
      if (bagBlocker) {
        return res.status(400).json({ message: `Gói máu nguồn không đủ điều kiện xuất: ${bagBlocker}` })
      }
    }
    if (componentRow.HanSuDung && new Date(componentRow.HanSuDung) < new Date()) {
      return res.status(400).json({ message: 'Thành phần đã hết hạn sử dụng.' })
    }
    if (componentRow.MaNhomMau && requestRow.MaNhomMau && componentRow.MaNhomMau !== requestRow.MaNhomMau) {
      return res.status(400).json({ message: `Nhóm máu không khớp (yêu cầu ${requestRow.MaNhomMau}, thành phần ${componentRow.MaNhomMau}).` })
    }
    // Component type must match the request's requested kind by category, so a
    // platelet request can't be filled with red cells. Categories cover the
    // several concrete labels per kind (e.g. "Hồng cầu"/"Khối hồng cầu").
    const wantCategory = componentCategory(requestRow.LoaiThanhPhanCan)
    const gotCategory = componentCategory(componentRow.LoaiThanhPhan)
    if (wantCategory && gotCategory && wantCategory !== gotCategory) {
      return res.status(400).json({ message: `Loại thành phần không khớp (yêu cầu "${requestRow.LoaiThanhPhanCan}", thành phần "${componentRow.LoaiThanhPhan}").` })
    }
    if (crossMatch.includes('Không')) {
      return res.status(400).json({ message: 'Phản ứng chéo không hòa hợp, không thể xuất kho.' })
    }
    // Recorded export volume can't exceed what the component physically holds,
    // and also can't exceed what the request asked for.
    const componentVolume = Number(componentRow.TheTichThucTe || 0)
    if (componentVolume > 0 && totalVolume > componentVolume) {
      return res.status(400).json({ message: `Vượt quá thể tích thành phần (${componentVolume} ml).` })
    }
    if (totalVolume > Number(requestRow.SoLuongML || 0)) {
      return res.status(400).json({ message: `Vượt quá thể tích yêu cầu (${requestRow.SoLuongML} ml).` })
    }

    // The detail INSERT and the request both live in one transaction so a
    // failure can't leave a half-issued export. The component's status flip to
    // "Đã xuất" is owned by trg_UpdateTrangThaiSauXuat (AFTER INSERT on
    // CHI_TIET_XUAT), which runs in this same transaction.
    const tx = new sql.Transaction(pool)
    await tx.begin()
    try {
      await new sql.Request(tx)
        .input('MaPhieuXuat', sql.VarChar(20), id)
        .input('NgayXuat', sql.DateTime, asDateTime(body.exportedAt))
        .input('TongTheTich', sql.Int, totalVolume)
        .input('MaPhieuYC', sql.VarChar(20), requestId)
        .input('MaNV_Xuat', sql.VarChar(20), staffId)
        .query('INSERT INTO PHIEU_XUAT VALUES (@MaPhieuXuat, @NgayXuat, @TongTheTich, @MaPhieuYC, @MaNV_Xuat)')
      await new sql.Request(tx)
        .input('MaPhieuXuat', sql.VarChar(20), id)
        .input('MaThanhPhan', sql.VarChar(20), componentId)
        .query(`INSERT INTO CHI_TIET_XUAT VALUES (@MaPhieuXuat, @MaThanhPhan, ${nText(crossMatch, T.compatible)})`)
      await tx.commit()
    } catch (err) {
      await tx.rollback().catch(() => {})
      throw err
    }
    res.status(201).json({ id, ...body, requestId, staffId, componentId, totalVolume, crossMatch })
  } catch (error) { safeError(res, error) }
})
app.delete('/api/exports/:id', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const pool = await getPool()
    const components = await pool.request().input('_id', sql.VarChar(20), req.params.id).query('SELECT MaThanhPhan FROM CHI_TIET_XUAT WHERE MaPhieuXuat = @_id')
    await pool.request().input('_id', sql.VarChar(20), req.params.id).query('DELETE FROM CHI_TIET_XUAT WHERE MaPhieuXuat = @_id')
    await pool.request().input('_id', sql.VarChar(20), req.params.id).query('DELETE FROM PHIEU_XUAT WHERE MaPhieuXuat = @_id')
    for (const row of components.recordset) {
      await pool.request().input('mtp', sql.VarChar(20), row.MaThanhPhan).query(`UPDATE THANH_PHAN_MAU SET TrangThai = ${nText(T.ready)} WHERE MaThanhPhan = @mtp`)
    }
    res.status(204).end()
  } catch (error) { safeError(res, error) }
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
      LEFT JOIN THANH_PHAN_MAU tp
             ON tp.MaGoiMau = gm.MaGoiMau
            AND tp.TrangThai = ${nText(T.ready)}
            AND tp.HanSuDung > GETDATE()
      GROUP BY g.MaNhomMau
      ORDER BY g.MaNhomMau
    `)
    res.json(result.recordset)
  } catch (error) { safeError(res, error) }
})
app.get('/api/reports/expiring', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaThanhPhan AS id, LoaiThanhPhan AS type, HanSuDung AS expiresAt, TrangThai AS status FROM THANH_PHAN_MAU WHERE HanSuDung >= GETDATE() AND HanSuDung <= DATEADD(day, 30, GETDATE()) ORDER BY HanSuDung'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})
app.get('/api/reports/campaigns', async (_req, res) => {
  try { const pool = await getPool(); const result = await pool.request().query('SELECT MaChienDich AS id, TenChienDich AS name, SoLuongDuKien AS expected, SoLuongThucTe AS actual FROM CHIEN_DICH ORDER BY MaChienDich'); res.json(result.recordset) }
  catch (error) { safeError(res, error) }
})
// So luong tui mau tiep nhan theo ngay (cho bieu do cot o Dashboard).
// Mac dinh 14 ngay gan nhat; tra ve ca so tui (bags) va tong the tich (volume).
app.get('/api/reports/intake-by-day', async (req, res) => {
  try {
    const pool = await getPool()
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90)
    const result = await pool.request()
      .input('days', sql.Int, days)
      .query(`
        SELECT CONVERT(varchar(10), CAST(NgayHien AS DATE), 23) AS day,
               COUNT(*) AS bags,
               ISNULL(SUM(TheTich), 0) AS volume
        FROM GOI_MAU_TOAN_PHAN
        WHERE NgayHien >= DATEADD(day, -(@days - 1), CAST(GETDATE() AS DATE))
        GROUP BY CAST(NgayHien AS DATE)
        ORDER BY CAST(NgayHien AS DATE)
      `)
    res.json(result.recordset)
  } catch (error) { safeError(res, error) }
})

app.listen(port, () => {
  console.log(`Bloodchain API ready at http://localhost:${port}`)
})
