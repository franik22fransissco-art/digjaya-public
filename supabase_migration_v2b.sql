-- Jalankan ini di Supabase SQL Editor (tambahan dari v2)
-- Kolom untuk menyimpan data pemesan dari web publik

ALTER TABLE booking_request
  ADD COLUMN IF NOT EXISTS nama_pemesan  TEXT,
  ADD COLUMN IF NOT EXISTS no_wa_pemesan TEXT;
