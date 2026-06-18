-- Tambahan kolom dokumen pada booking_request
ALTER TABLE booking_request
  ADD COLUMN IF NOT EXISTS is_baru       BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS dokumen_ktp   TEXT,
  ADD COLUMN IF NOT EXISTS dokumen_kk    TEXT,
  ADD COLUMN IF NOT EXISTS dokumen_sim   TEXT,
  ADD COLUMN IF NOT EXISTS dokumen_sosmed TEXT;
