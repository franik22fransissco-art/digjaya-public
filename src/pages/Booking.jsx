import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Car, Loader } from 'lucide-react';
import { getUnits, checkAvailability, submitBooking } from '../utils/api';

const DURASI_OPTIONS = [
  '6 Jam', '12 Jam', '24 Jam (1 Hari)',
  '2 Hari', '3 Hari', '4 Hari',
  '5 Hari', '6 Hari', '1 Minggu',
];
const METODE_OPTIONS = ['Antar ke Lokasi', 'Ambil Sendiri', 'With Driver'];

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 bg-white';

export default function Booking() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [units, setUnits]           = useState([]);
  const [form, setForm]             = useState({
    nama:     '',
    noWA:     '',
    unitId:   params.get('unitId')   || '',
    tglMulai: '',
    jamMulai: '',
    durasi:   '1 Hari',
    metode:   'Antar ke Lokasi',
    catatan:  '',
  });
  const [avail, setAvail]           = useState(null); // null | true | false
  const [checking, setChecking]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    getUnits().then((res) => { if (res.success) setUnits(res.data); });
  }, []);

  const unitNama = params.get('unitNama')
    || units.find((u) => u.id === form.unitId)?.nama
    || '';

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setAvail(null);
    setError('');
  }

  async function handleCekAvail() {
    if (!form.unitId || !form.tglMulai) {
      setError('Pilih unit dan tanggal terlebih dahulu');
      return;
    }
    setChecking(true);
    const ok = await checkAvailability(form.unitId, form.tglMulai, form.tglMulai);
    setAvail(ok);
    setChecking(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { nama, noWA, unitId, tglMulai, durasi, metode } = form;
    if (!nama || !noWA || !unitId || !tglMulai || !durasi || !metode) {
      setError('Semua field wajib diisi');
      return;
    }
    if (!/^[0-9]{8,15}$/.test(noWA.replace(/\D/g, ''))) {
      setError('Nomor WhatsApp tidak valid');
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await submitBooking(form);
    setSubmitting(false);
    if (res.success) {
      setDone(true);
    } else {
      setError(res.message || 'Terjadi kesalahan, coba lagi');
    }
  }

  // Success screen
  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Pesanan Terkirim!</h1>
        <p className="text-sm text-gray-500 mb-1">
          Tim DIGJAYA akan menghubungi kamu melalui WhatsApp
          <strong> {form.noWA}</strong> dalam 15 menit.
        </p>
        <p className="text-xs text-gray-400 mb-8">
          Simpan nomor WA kamu untuk mengecek status pesanan.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(`/cek-status?wa=${encodeURIComponent(form.noWA)}`)}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl"
          >
            Cek Status Pesanan
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-orange-500 text-white px-4 pt-10 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs opacity-75">DIGJAYA RENTAL</p>
            <h1 className="font-bold text-lg leading-tight">Form Pemesanan</h1>
          </div>
        </div>
        {unitNama && (
          <div className="mt-2 bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <Car className="w-4 h-4" />
            <p className="text-sm font-semibold">{unitNama}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-4">

        {/* Data Pemesan */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
          <p className="font-bold text-gray-700 text-sm border-b pb-2">Data Pemesan</p>

          <Field label="Nama Lengkap">
            <input
              className={inputCls}
              placeholder="Nama sesuai KTP"
              value={form.nama}
              onChange={(e) => set('nama', e.target.value)}
            />
          </Field>

          <Field label="Nomor WhatsApp" hint="Gunakan format: 081234567890">
            <input
              className={inputCls}
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={form.noWA}
              onChange={(e) => set('noWA', e.target.value)}
            />
          </Field>
        </div>

        {/* Detail Sewa */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
          <p className="font-bold text-gray-700 text-sm border-b pb-2">Detail Sewa</p>

          {!params.get('unitId') && (
            <Field label="Pilih Unit">
              <select
                className={inputCls}
                value={form.unitId}
                onChange={(e) => set('unitId', e.target.value)}
              >
                <option value="">-- Pilih Kendaraan --</option>
                {units.filter((u) => u.status === 'READY').map((u) => (
                  <option key={u.id} value={u.id}>{u.nama} ({u.tipe})</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Tanggal Mulai">
            <input
              className={inputCls}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={form.tglMulai}
              onChange={(e) => set('tglMulai', e.target.value)}
            />
          </Field>

          <Field label="Jam Mulai (opsional)">
            <input
              className={inputCls}
              type="time"
              value={form.jamMulai}
              onChange={(e) => set('jamMulai', e.target.value)}
            />
          </Field>

          {/* Cek ketersediaan */}
          {form.unitId && form.tglMulai && (
            <button
              type="button"
              onClick={handleCekAvail}
              disabled={checking}
              className="w-full py-2 rounded-xl border-2 border-orange-300 text-orange-600 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              {checking
                ? <><Loader className="w-4 h-4 animate-spin" /> Mengecek...</>
                : '🔍 Cek Ketersediaan'}
            </button>
          )}
          {avail === true  && <p className="text-green-600 text-sm font-semibold text-center">✅ Unit tersedia pada tanggal ini!</p>}
          {avail === false && <p className="text-red-500 text-sm font-semibold text-center">❌ Unit sudah dipesan pada tanggal ini. Coba tanggal lain.</p>}

          <Field label="Durasi Sewa">
            <div className="grid grid-cols-2 gap-2">
              {DURASI_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('durasi', d)}
                  className={`py-2 rounded-xl text-sm font-medium border-2 transition ${
                    form.durasi === d
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Metode Pengambilan">
            {METODE_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set('metode', m)}
                className={`w-full mb-2 last:mb-0 py-2.5 rounded-xl text-sm font-medium border-2 transition text-left px-3 ${
                  form.metode === m
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {form.metode === m ? '● ' : '○ '}{m}
              </button>
            ))}
          </Field>

          <Field label="Catatan (opsional)">
            <textarea
              className={inputCls + ' resize-none'}
              rows={3}
              placeholder="Misal: antar ke alamat, jemput di bandara, dll."
              value={form.catatan}
              onChange={(e) => set('catatan', e.target.value)}
            />
          </Field>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60"
        >
          {submitting
            ? <><Loader className="w-5 h-5 animate-spin" /> Mengirim...</>
            : 'Kirim Pesanan'}
        </button>

        <p className="text-xs text-center text-gray-400">
          Dengan memesan, Anda menyetujui ketentuan sewa DIGJAYA
        </p>
      </form>
    </div>
  );
}
