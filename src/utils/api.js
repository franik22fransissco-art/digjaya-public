import { supabase } from '../lib/supabase';

// ─── Unit Catalog ─────────────────────────────────────────────────────────────

export async function getUnits() {
  const { data, error } = await supabase
    .from('units')
    .select('id, nama, tipe, status, foto_url, harga_per_hari, harga_12jam, harga_24jam')
    .eq('aktif', true)
    .order('tipe')
    .order('nama');
  if (error) return { success: false, data: [] };
  return { success: true, data: data || [] };
}

export async function getUnitPhotos(unitId) {
  const { data, error } = await supabase.storage
    .from('unit-photos')
    .list(`units/${unitId}`, { limit: 3, sortBy: { column: 'updated_at', order: 'desc' } });
  if (error || !data?.length) return [];
  return data
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const { data: url } = supabase.storage
        .from('unit-photos')
        .getPublicUrl(`units/${unitId}/${f.name}`);
      const ts = new Date(f.updated_at || f.created_at).getTime() || Date.now();
      return url?.publicUrl ? `${url.publicUrl}?t=${ts}` : null;
    })
    .filter(Boolean);
}

// ─── Availability ─────────────────────────────────────────────────────────────

// Operational Time Logic Tahap 2 — SATU-SATUNYA rumus overlap tanggal di
// website (SSOT), dipakai apa adanya oleh Booking.jsx. Rumus overlap-nya
// SENDIRI tidak berubah dari sebelumnya — hanya bentuk return value yang
// diperluas dari boolean mentah menjadi { available, warning? } supaya bisa
// membawa peringatan jadwal mepet (aturan #4) tanpa mengubah semantik
// available (true/false) sama sekali.
export async function checkAvailability(unitId, tglMulai, tglSelesai) {
  // Bug fix M1 (audit Concurrency & Data Integrity Hardening): cek status
  // SERVIS dulu sebelum overlap — sebelumnya fungsi ini murni cek `transaksi`,
  // tidak pernah membaca `units.status`, jadi unit SERVIS tanpa transaksi
  // aktif yang tumpang tindih bisa lolos "tersedia". Landing.jsx (Rule 6)
  // sudah benar memblokir SERVIS di level kartu, tapi itu cuma gerbang MASUK
  // ke halaman booking, bukan gerbang di titik cek tanggal ini — pelanggan
  // yang mengakses /booking?unitId=X langsung (bypass kartu) tetap bisa lolos
  // sampai di sini. Reuse pola yang sama dengan SSOT admin
  // (apiGetBookingConflict, apiTransaksi.js) yang SENGAJA hanya memblokir
  // SERVIS (bukan status lain) karena periode SERVIS tidak selalu punya
  // rentang tanggal yang bisa dibandingkan seperti transaksi biasa.
  const { data: unitRow, error: unitErr } = await supabase
    .from('units').select('status').eq('id', unitId).maybeSingle();
  if (unitErr) return { available: false };
  if (unitRow?.status === 'SERVIS') return { available: false };

  const { data, error } = await supabase
    .from('transaksi')
    .select('id')
    .eq('unit_id', unitId)
    .in('status', ['BOOKING', 'JALAN'])
    .lte('tgl_mulai', tglSelesai)
    .gte('tgl_selesai', tglMulai);
  if (error) return { available: false }; // gagal cek → jangan anggap tersedia
  if (data?.length) return { available: false };

  // Aturan #4 — Warning Jadwal Mepet: query TERPISAH (jendela H-1/H+1),
  // murni mendeteksi booking lain yang PERSIS berbatasan dengan tanggal yang
  // diminta (tgl_selesai == tglMulai atau tgl_mulai == tglSelesai) — kasus
  // ini TIDAK PERNAH tertangkap query overlap di atas karena memang tidak
  // overlap. Murni informasi, TIDAK PERNAH mengubah available (tetap true).
  const oneDayMs = 24 * 60 * 60 * 1000;
  const windowStart = new Date(new Date(tglMulai).getTime()   - oneDayMs).toISOString().split('T')[0];
  const windowEnd   = new Date(new Date(tglSelesai).getTime() + oneDayMs).toISOString().split('T')[0];
  const { data: nearby } = await supabase
    .from('transaksi')
    .select('tgl_mulai, tgl_selesai')
    .eq('unit_id', unitId)
    .in('status', ['BOOKING', 'JALAN'])
    .lte('tgl_mulai', windowEnd)
    .gte('tgl_selesai', windowStart);
  const mepet = (nearby || []).some((t) => t.tgl_selesai === tglMulai || t.tgl_mulai === tglSelesai);

  return mepet
    ? { available: true, warning: 'Jadwal berdekatan dengan sewa lain untuk unit ini — unit mungkin belum sempat diperiksa/dibersihkan.' }
    : { available: true };
}

// Aturan #6 — Availability Website: unit yang sedang JALAN tidak lagi
// otomatis "Tidak Tersedia" (lihat Landing.jsx) — untuk itu Landing perlu
// tahu estimasi tanggal selesai sewa SAAT INI per unit. Ini BUKAN rumus
// overlap (tidak ada perbandingan tanggal apa pun di sini, murni ambil
// tgl_selesai transaksi JALAN apa adanya) — checkAvailability() di atas
// TETAP SSOT satu-satunya untuk pertanyaan "apakah tanggal X tersedia".
export async function getUnitsEstimasiFinish() {
  const { data, error } = await supabase
    .from('transaksi')
    .select('unit_id, tgl_selesai')
    .eq('status', 'JALAN');
  if (error) return {};
  const map = {};
  (data || []).forEach((t) => { map[t.unit_id] = t.tgl_selesai; });
  return map;
}

// ─── Cek pelanggan lama / baru ───────────────────────────────────────────────

export async function checkPelanggan(noWA) {
  const { fmt0, fmt62, fmtPlus, raw } = waFormats(noWA);
  const { data: rows } = await supabase
    .from('pelanggan')
    .select('id, nama, status_verif')
    .or(`no_wa.eq.${fmt0},no_wa.eq.${fmt62},no_wa.eq.${fmtPlus},no_wa.eq.${raw}`)
    .limit(1);
  const pel = rows?.[0] || null;

  if (!pel) return null; // benar-benar belum pernah daftar

  // Pelanggan "lama" hanya jika sudah ada transaksi SELESAI minimal 1x
  const { count } = await supabase
    .from('transaksi')
    .select('id', { count: 'exact', head: true })
    .eq('pelanggan_id', pel.id)
    .eq('status', 'SELESAI');

  if (!count || count === 0) return null; // ada di DB tapi belum pernah selesai sewa

  return pel; // benar-benar pelanggan lama
}

// ─── Cek blacklist / risk status pelanggan ───────────────────────────────────

export async function checkBlacklist(noWA) {
  const { fmt0, fmt62, fmtPlus, raw } = waFormats(noWA);
  const { data: rows } = await supabase
    .from('pelanggan')
    .select('risk_status, risk_catatan')
    .or(`no_wa.eq.${fmt0},no_wa.eq.${fmt62},no_wa.eq.${fmtPlus},no_wa.eq.${raw}`)
    .limit(1);
  const data = rows?.[0] || null;
  if (!data) return { status: 'OK', catatan: '' };
  return { status: data.risk_status || 'OK', catatan: data.risk_catatan || '' };
}

// ─── Upload dokumen identitas ─────────────────────────────────────────────────

export async function uploadDokumen(noWA, jenis, file) {
  const ext  = file.name.split('.').pop();
  const path = `temp/${noWA.replace(/\D/g,'')}/${jenis}.${ext}`;
  const { error } = await supabase.storage
    .from('identitas-photos')
    .upload(path, file, { upsert: true });
  if (error) return { success: false, message: error.message };
  const { data: url } = supabase.storage.from('identitas-photos').getPublicUrl(path);
  return { success: true, path, url: url.publicUrl };
}

// ─── Submit Booking Request ───────────────────────────────────────────────────

export async function submitBooking({
  nama, noWA, unitId, tglMulai, jamMulai, durasi, metode, catatan, jaminan,
  isBaru, doKtp, doKk, doSim, doSosmed, refMarketing,
}) {
  const { error } = await supabase.from('booking_request').insert({
    unit_id:        unitId,
    tgl_mulai:      tglMulai,
    jam_mulai:      jamMulai      || null,
    durasi:         durasi        || null,
    metode:         metode        || null,
    catatan:        catatan       || null,
    jaminan:        jaminan       || null,
    nama_pemesan:   nama,
    no_wa_pemesan:  waFormats(noWA).fmt62,
    is_baru:        isBaru,
    ref_marketing:  refMarketing  || 'franik',
    dokumen_ktp:    doKtp         || null,
    dokumen_kk:     doKk          || null,
    dokumen_sim:    doSim         || null,
    dokumen_sosmed: doSosmed      || null,
  });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ─── Normalisasi nomor WA ke semua format yang mungkin tersimpan ─────────────

function waFormats(noWA) {
  const digits = noWA.replace(/\D/g, '');
  const fmt62  = digits.startsWith('62') ? digits : '62' + digits.replace(/^0+/, '');
  const fmt0   = '0' + fmt62.slice(2);
  const fmtPlus = '+' + fmt62;
  return { fmt0, fmt62, fmtPlus, raw: noWA };
}

// ─── Cek Status Pesanan ───────────────────────────────────────────────────────

export async function getStatusByWA(noWA) {
  const { fmt0, fmt62, fmtPlus, raw } = waFormats(noWA);
  const { data, error } = await supabase
    .from('booking_request')
    .select('*, unit:unit_id(nama, tipe)')
    .or(`no_wa_pemesan.eq.${fmt0},no_wa_pemesan.eq.${fmt62},no_wa_pemesan.eq.${fmtPlus},no_wa_pemesan.eq.${raw}`)
    .order('created_at', { ascending: false });
  if (error) return { success: false, data: [] };
  return { success: true, data: data || [] };
}

export async function cancelBookingRequest(id) {
  const { error } = await supabase
    .from('booking_request')
    .delete()
    .eq('id', id)
    .eq('status', 'PENDING');
  if (error) return { success: false, message: error.message };
  return { success: true };
}
