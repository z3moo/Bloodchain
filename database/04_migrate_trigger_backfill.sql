/*
  BLOODCHAIN - Migration cho database DA TON TAI (khong can rebuild tu 00).
  Chay sau khi da co 00/01/02 va du lieu thuc te.

  Muc dich:
  1. Tao 2 trigger moi neu DB cu chua co:
     - trg_TinhSoLuongThucTe: SoLuongThucTe = COUNT goi mau theo chien dich.
     - trg_GhiBenhLyDuongTinh: ghi benh ly vao NGUOI_HIEN khi xet nghiem duong tinh.
  2. Tinh lai SoLuongThucTe cho moi chien dich theo so goi mau thuc te.
  3. Backfill BenhLy cho cac nguoi hien da co goi mau xet nghiem duong tinh TU TRUOC
     (trigger chi chay cho DML moi nen du lieu cu phai backfill mot lan).

  An toan chay lai nhieu lan (idempotent):
  - DROP IF EXISTS truoc khi CREATE trigger.
  - Backfill chi them ghi chu chua ton tai (CHARINDEX dedup), khong ghi trung.

  Dung NCHAR(<codepoint>) cho moi chu tieng Viet de khong phu thuoc encoding file.
*/
USE BloodChainDB;
GO

-- Cac trigger/backfill dung XML method (.value) nen bat buoc QUOTED_IDENTIFIER ON.
-- Set tuong minh vi mot so phien ban sqlcmd connect voi setting nay OFF, khien
-- CREATE TRIGGER luu sai setting va loi luc chay.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID('dbo.trg_TinhSoLuongThucTe', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_TinhSoLuongThucTe;
GO

CREATE TRIGGER trg_TinhSoLuongThucTe
ON GOI_MAU_TOAN_PHAN
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE cd
  SET SoLuongThucTe = (
    SELECT COUNT(*)
    FROM GOI_MAU_TOAN_PHAN gm
    WHERE gm.MaChienDich = cd.MaChienDich
  )
  FROM CHIEN_DICH cd
  WHERE cd.MaChienDich IN (
    SELECT MaChienDich FROM inserted WHERE MaChienDich IS NOT NULL
    UNION
    SELECT MaChienDich FROM deleted WHERE MaChienDich IS NOT NULL
  );
END;
GO

-- Tinh lai SoLuongThucTe cho TAT CA chien dich theo so goi mau thuc te hien co.
UPDATE cd
SET SoLuongThucTe = (
  SELECT COUNT(*)
  FROM GOI_MAU_TOAN_PHAN gm
  WHERE gm.MaChienDich = cd.MaChienDich
)
FROM CHIEN_DICH cd;
GO

IF OBJECT_ID('dbo.trg_GhiBenhLyDuongTinh', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_GhiBenhLyDuongTinh;
GO

CREATE TRIGGER trg_GhiBenhLyDuongTinh
ON KET_QUA_XET_NGHIEM
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE nh
  SET BenhLy = LEFT(
    CASE
      WHEN nh.BenhLy IS NULL OR LTRIM(RTRIM(nh.BenhLy)) = N''
           OR nh.BenhLy = NCHAR(75) + NCHAR(104) + NCHAR(244) + NCHAR(110) + NCHAR(103)
        THEN N''
      ELSE nh.BenhLy + N'; '
    END
    + STUFF((
        SELECT N'; ' + x.GhiChu
        FROM (
          SELECT DISTINCT N'[' + i.MaGoiMau + N'] '
                 + ISNULL(i.LoaiXetNghiem, NCHAR(88) + NCHAR(233) + NCHAR(116) + NCHAR(32) + NCHAR(110) + NCHAR(103) + NCHAR(104) + NCHAR(105) + NCHAR(7879) + NCHAR(109))
                 + NCHAR(32) + NCHAR(100) + NCHAR(432) + NCHAR(417) + NCHAR(110) + NCHAR(103) + NCHAR(32) + NCHAR(116) + NCHAR(237) + NCHAR(110) + NCHAR(104) AS GhiChu
          FROM inserted i
          JOIN GOI_MAU_TOAN_PHAN gm ON gm.MaGoiMau = i.MaGoiMau
          WHERE i.KetQua = NCHAR(68) + NCHAR(432) + NCHAR(417) + NCHAR(110) + NCHAR(103) + NCHAR(32) + NCHAR(116) + NCHAR(237) + NCHAR(110) + NCHAR(104)
            AND gm.MaNguoiHien = nh.MaNguoiHien
        ) x
        WHERE CHARINDEX(x.GhiChu, ISNULL(nh.BenhLy, N'')) = 0
        FOR XML PATH(''), TYPE
      ).value('.', 'NVARCHAR(MAX)'), 1, 2, N''),
    500)
  FROM NGUOI_HIEN nh
  WHERE EXISTS (
    SELECT 1
    FROM inserted i
    JOIN GOI_MAU_TOAN_PHAN gm ON gm.MaGoiMau = i.MaGoiMau
    WHERE gm.MaNguoiHien = nh.MaNguoiHien
      AND i.KetQua = NCHAR(68) + NCHAR(432) + NCHAR(417) + NCHAR(110) + NCHAR(103) + NCHAR(32) + NCHAR(116) + NCHAR(237) + NCHAR(110) + NCHAR(104)
      AND CHARINDEX(
            N'[' + i.MaGoiMau + N'] '
              + ISNULL(i.LoaiXetNghiem, NCHAR(88) + NCHAR(233) + NCHAR(116) + NCHAR(32) + NCHAR(110) + NCHAR(103) + NCHAR(104) + NCHAR(105) + NCHAR(7879) + NCHAR(109))
              + NCHAR(32) + NCHAR(100) + NCHAR(432) + NCHAR(417) + NCHAR(110) + NCHAR(103) + NCHAR(32) + NCHAR(116) + NCHAR(237) + NCHAR(110) + NCHAR(104),
            ISNULL(nh.BenhLy, N'')
          ) = 0
  );
END;
GO

-- BACKFILL: ghi benh ly cho nguoi hien co goi mau xet nghiem duong tinh tu truoc.
-- Logic giong het trigger (giu BenhLy that neu co, them ghi chu chua ton tai),
-- nen chay lai khong ghi trung.
UPDATE nh
SET BenhLy = LEFT(
  CASE
    WHEN nh.BenhLy IS NULL OR LTRIM(RTRIM(nh.BenhLy)) = N''
         OR nh.BenhLy = NCHAR(75) + NCHAR(104) + NCHAR(244) + NCHAR(110) + NCHAR(103)
      THEN N''
    ELSE nh.BenhLy + N'; '
  END
  + STUFF((
      SELECT N'; ' + x.GhiChu
      FROM (
        SELECT DISTINCT N'[' + xn.MaGoiMau + N'] '
               + ISNULL(xn.LoaiXetNghiem, NCHAR(88) + NCHAR(233) + NCHAR(116) + NCHAR(32) + NCHAR(110) + NCHAR(103) + NCHAR(104) + NCHAR(105) + NCHAR(7879) + NCHAR(109))
               + NCHAR(32) + NCHAR(100) + NCHAR(432) + NCHAR(417) + NCHAR(110) + NCHAR(103) + NCHAR(32) + NCHAR(116) + NCHAR(237) + NCHAR(110) + NCHAR(104) AS GhiChu
        FROM KET_QUA_XET_NGHIEM xn
        JOIN GOI_MAU_TOAN_PHAN gm ON gm.MaGoiMau = xn.MaGoiMau
        WHERE xn.KetQua = NCHAR(68) + NCHAR(432) + NCHAR(417) + NCHAR(110) + NCHAR(103) + NCHAR(32) + NCHAR(116) + NCHAR(237) + NCHAR(110) + NCHAR(104)
          AND gm.MaNguoiHien = nh.MaNguoiHien
      ) x
      WHERE CHARINDEX(x.GhiChu, ISNULL(nh.BenhLy, N'')) = 0
      FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 2, N''),
  500)
FROM NGUOI_HIEN nh
WHERE EXISTS (
  SELECT 1
  FROM KET_QUA_XET_NGHIEM xn
  JOIN GOI_MAU_TOAN_PHAN gm ON gm.MaGoiMau = xn.MaGoiMau
  WHERE gm.MaNguoiHien = nh.MaNguoiHien
    AND xn.KetQua = NCHAR(68) + NCHAR(432) + NCHAR(417) + NCHAR(110) + NCHAR(103) + NCHAR(32) + NCHAR(116) + NCHAR(237) + NCHAR(110) + NCHAR(104)
    AND CHARINDEX(
          N'[' + xn.MaGoiMau + N'] '
            + ISNULL(xn.LoaiXetNghiem, NCHAR(88) + NCHAR(233) + NCHAR(116) + NCHAR(32) + NCHAR(110) + NCHAR(103) + NCHAR(104) + NCHAR(105) + NCHAR(7879) + NCHAR(109))
            + NCHAR(32) + NCHAR(100) + NCHAR(432) + NCHAR(417) + NCHAR(110) + NCHAR(103) + NCHAR(32) + NCHAR(116) + NCHAR(237) + NCHAR(110) + NCHAR(104),
          ISNULL(nh.BenhLy, N'')
        ) = 0
);
GO
