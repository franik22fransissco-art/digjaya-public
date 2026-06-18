import { supabase } from '../lib/supabase';

// ─── Unit Catalog ─────────────────────────────────────────────────────────────

export async function getUnits() {
  const { data, error } = await supabase
    .from('units')
    .select('id, nama, tipe, status')
    .eq('aktif', true)
    .order('tipe')
    .order('nama');
  if (error) return { success: false, data: [] };
  return { success: true, data: data || [] };
}

export async function getUnitPhotos(unitId) {
  const { data, error } = await supabase.storage
    .from('unit-photos')
    .list(`units/${unitId}`, { limit: 3 });
  if (error || !data?.length) return [];
  return data
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const { data: url } = supabase.storage
        .from('unit-photos')
        .getPublicUrl(`units/${unitId}/${f.name}`);
      return url.publicUrl;
    });
}

// ─── Availability ─────────────────────────────────────────────────────────────

export async function checkAvailability(unitId, tglMulai, tglSelesai) {
  const { data } = await supabase
    .from('transaksi')
    .select('id')
    .eq('unit_id', unitId)
    .in('status', ['BOOKING', 'JALAN'])
    .lte('tgl_mulai', tglSelesai)
    .gte('tgl_selesai', tglMulai);
  return !data?.length; // true = tersedia
}

// ─── Submit Booking Request ───────────────────────────────────────────────────

export async function submitBooking({ nama, noWA, unitId, tglMulai, jamMulai, durasi, metode, catatan }) {
  const { error } = await supabase.from('booking_request').insert({
    unit_id:       unitId,
    tgl_mulai:     tglMulai,
    jam_mulai:     jamMulai  || null,
    durasi:        durasi    || null,
    metode:        metode    || null,
    catatan:       catatan   || null,
    nama_pemesan:  nama,
    no_wa_pemesan: noWA,
  });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ─── Cek Status Pesanan ───────────────────────────────────────────────────────

export async function getStatusByWA(noWA) {
  const clean = noWA.replace(/\D/g, '').replace(/^0/, '62');
  const { data, error } = await supabase
    .from('booking_request')
    .select('*, unit:unit_id(nama, tipe)')
    .or(`no_wa_pemesan.eq.${noWA},no_wa_pemesan.eq.${clean}`)
    .order('created_at', { ascending: false });
  if (error) return { success: false, data: [] };
  return { success: true, data: data || [] };
}
