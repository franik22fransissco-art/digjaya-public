import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertCircle, Car,
  Loader, Upload, UserCheck, UserPlus, ChevronRight,
} from 'lucide-react';
import { getUnits, checkAvailability, checkPelanggan, uploadDokumen, submitBooking } from '../utils/api';

const DURASI_OPTIONS = [
  '6 Jam', '12 Jam', '24 Jam (1 Hari)',
  '2 Hari', '3 Hari', '4 Hari',
  '5 Hari', '6 Hari', '1 Minggu',
  'Lainnya...',
];
const METODE_OPTIONS = ['Antar ke Lokasi', 'Ambil Sendiri', 'With Driver'];

const DOKUMEN_LIST = [
  { key: 'ktp',    label: 'Foto KTP',             required: true  },
  { key: 'kk',     label: 'Foto Kartu Keluarga',  required: true  },
  { key: 'sim',    label: 'Foto SIM',              required: true  },
  { key: 'sosmed', label: 'Screenshot Media Sosial', required: true },
];

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 bg-white';

function Field({ label, children, hint, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function UploadBox({ label, required, value, onChange, loading }) {
  const ref = useRef();
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </p>
      <div
        onClick={() => ref.current?.click()}
        className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition ${
          value ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50 hover:border-orange-300'
        }`}
      >
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onChange} />
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <p className="text-white text-xs font-bold">Ganti Foto</p>
            </div>
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center gap-2">
            {loading
              ? <Loader className="w-6 h-6 text-orange-400 animate-spin" />
              : <Upload className="w-6 h-6 text-gray-300" />
            }
            <p className="text-xs text-gray-400">{loading ? 'Mengupload...' : 'Ketuk untuk ambil/pilih foto'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Booking() {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const [step, setStep] = useState(1); // 1=form, 2=dokumen, 3=sukses

  const [units, setUnits] = useState([]);
  const [form, setForm]   = useState({
    nama:     '',
    noWA:     '',
    unitId:   params.get('unitId') || '',
    tglMulai: '',
    jamMulai: '',
    durasi:   '24 Jam (1 Hari)',
    metode:   'Antar ke Lokasi',
    catatan:  '',
  });

  // Info pelanggan (null = belum dicek, false = baru, object = lama)
  const [pelanggan, setPelanggan]   = useState(null);
  const [checkingWA, setCheckingWA] = useState(false);

  // Availability
  const [avail, setAvail]       = useState(null);
  const [checking, setChecking] = useState(false);

  // Dokumen (step 2)
  const [dokPrev,    setDokPrev]    = useState({ ktp: '', kk: '', sim: '', sosmed: '' });
  const [dokPath,    setDokPath]    = useState({ ktp: '', kk: '', sim: '', sosmed: '' });
  const [dokLoading, setDokLoading] = useState({ ktp: false, kk: false, sim: false, sosmed: false });

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    getUnits().then((r) => { if (r.success) setUnits(r.data); });
  }, []);

  const unitNama = params.get('unitNama')
    || units.find((u) => u.id === form.unitId)?.nama || '';

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); setAvail(null); setError(''); }

  // Cek pelanggan saat WA di-blur
  async function handleWABlur() {
    const wa = form.noWA.trim().replace(/\D/g, '');
    if (wa.length < 8) return;
    setCheckingWA(true);
    const result = await checkPelanggan(form.noWA);
    setPelanggan(result); // null = baru, object = lama
    setCheckingWA(false);
  }

  async function handleCekAvail() {
    if (!form.unitId || !form.tglMulai) { setError('Pilih unit dan tanggal'); return; }
    setChecking(true);
    const ok = await checkAvailability(form.unitId, form.tglMulai, form.tglMulai);
    setAvail(ok);
    setChecking(false);
  }

  // Step 1 → next
  async function handleStep1() {
    const { nama, noWA, unitId, tglMulai, durasi, metode } = form;
    if (!nama || !noWA || !unitId || !tglMulai || !durasi || !metode) {
      setError('Semua field wajib diisi'); return;
    }
    if (form.noWA.replace(/\D/g,'').length < 8) { setError('Nomor WA tidak valid'); return; }
    setError('');

    // Kalau pelanggan baru → minta dokumen
    if (pelanggan === null) await handleWABlur();
    const isNew = pelanggan === null || pelanggan === false || !pelanggan?.id;

    if (isNew && !pelanggan?.id) {
      setStep(2);
    } else {
      await doSubmit(false, {});
    }
  }

  // Upload 1 dokumen
  async function handleUploadDok(key, file) {
    if (!file) return;
    setDokLoading((p) => ({ ...p, [key]: true }));
    const preview = URL.createObjectURL(file);
    setDokPrev((p) => ({ ...p, [key]: preview }));
    const res = await uploadDokumen(form.noWA, key, file);
    if (res.success) setDokPath((p) => ({ ...p, [key]: res.path }));
    else setError(`Gagal upload ${key.toUpperCase()}: ${res.message}`);
    setDokLoading((p) => ({ ...p, [key]: false }));
  }

  // Step 2 → submit
  async function handleStep2() {
    const missing = DOKUMEN_LIST.filter((d) => d.required && !dokPath[d.key]).map((d) => d.label);
    if (missing.length) { setError(`Wajib upload: ${missing.join(', ')}`); return; }
    setError('');
    await doSubmit(true, dokPath);
  }

  async function doSubmit(isBaru, dok) {
    setSubmitting(true);
    const res = await submitBooking({
      ...form,
      isBaru,
      doKtp:    dok.ktp    || null,
      doKk:     dok.kk     || null,
      doSim:    dok.sim    || null,
      doSosmed: dok.sosmed || null,
    });
    setSubmitting(false);
    if (res.success) setStep(3);
    else setError(res.message || 'Terjadi kesalahan');
  }

  // ── STEP 3: Sukses ──────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Pesanan Terkirim!</h1>
        <p className="text-sm text-gray-500 mb-1">
          Tim DIGJAYA akan menghubungi <strong>{form.noWA}</strong> dalam 15 menit.
        </p>
        <p className="text-xs text-gray-400 mb-8">Simpan nomor WA untuk cek status pesanan.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(`/cek-status?wa=${encodeURIComponent(form.noWA)}`)}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl"
          >
            Cek Status Pesanan
          </button>
          <button onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2: Upload Dokumen ──────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="bg-orange-500 text-white px-4 pt-10 pb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(1)}><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <p className="text-xs opacity-75">Langkah 2 dari 2</p>
              <h1 className="font-bold text-lg">Verifikasi Identitas</h1>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2">
            <UserPlus className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-700">Pelanggan Baru</p>
              <p className="text-xs text-blue-600">
                Untuk keamanan, kami memerlukan verifikasi identitas untuk penyewaan pertama.
                Data hanya digunakan untuk keperluan administrasi.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
            {DOKUMEN_LIST.map((d) => (
              <UploadBox
                key={d.key}
                label={d.label}
                required={d.required}
                value={dokPrev[d.key]}
                loading={dokLoading[d.key]}
                onChange={(e) => handleUploadDok(d.key, e.target.files[0])}
              />
            ))}
          </div>

          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleStep2}
            disabled={submitting}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting
              ? <><Loader className="w-5 h-5 animate-spin" /> Mengirim...</>
              : <>Kirim Pesanan <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 1: Form Pemesanan ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-orange-500 text-white px-4 pt-10 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <p className="text-xs opacity-75">DIGJAYA RENTAL</p>
            <h1 className="font-bold text-lg">Form Pemesanan</h1>
          </div>
        </div>
        {unitNama && (
          <div className="mt-2 bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <Car className="w-4 h-4" /><p className="text-sm font-semibold">{unitNama}</p>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleStep1(); }} className="px-4 pt-5 space-y-4">

        {/* Data Pemesan */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
          <p className="font-bold text-gray-700 text-sm border-b pb-2">Data Pemesan</p>

          <Field label="Nama Lengkap" required>
            <input className={inputCls} placeholder="Nama sesuai KTP"
              value={form.nama} onChange={(e) => set('nama', e.target.value)} />
          </Field>

          <Field label="Nomor WhatsApp" required hint="Format: 08xxxxxxxxxx">
            <div className="relative">
              <input className={inputCls} type="tel" placeholder="08xxxxxxxxxx"
                value={form.noWA}
                onChange={(e) => { set('noWA', e.target.value); setPelanggan(null); }}
                onBlur={handleWABlur}
              />
              {checkingWA && (
                <Loader className="absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
            {/* Badge status pelanggan */}
            {!checkingWA && pelanggan?.id && (
              <div className="flex items-center gap-1.5 mt-1.5 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                <UserCheck className="w-3.5 h-3.5 text-green-600" />
                <p className="text-[11px] text-green-700 font-medium">
                  Pelanggan lama — tidak perlu upload dokumen ulang
                </p>
              </div>
            )}
            {!checkingWA && pelanggan !== null && !pelanggan?.id && (
              <div className="flex items-center gap-1.5 mt-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-[11px] text-blue-700 font-medium">
                  Pelanggan baru — akan diminta upload identitas di langkah berikutnya
                </p>
              </div>
            )}
          </Field>
        </div>

        {/* Detail Sewa */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
          <p className="font-bold text-gray-700 text-sm border-b pb-2">Detail Sewa</p>

          {!params.get('unitId') && (
            <Field label="Pilih Unit" required>
              <select className={inputCls} value={form.unitId} onChange={(e) => set('unitId', e.target.value)}>
                <option value="">-- Pilih Kendaraan --</option>
                {units.filter((u) => u.status === 'READY').map((u) => (
                  <option key={u.id} value={u.id}>{u.nama} ({u.tipe})</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Tanggal Mulai" required>
            <input className={inputCls} type="date"
              min={new Date().toISOString().split('T')[0]}
              value={form.tglMulai} onChange={(e) => set('tglMulai', e.target.value)} />
          </Field>

          <Field label="Jam Mulai (opsional)">
            <input className={inputCls} type="time"
              value={form.jamMulai} onChange={(e) => set('jamMulai', e.target.value)} />
          </Field>

          {/* Cek ketersediaan */}
          {form.unitId && form.tglMulai && (
            <button type="button" onClick={handleCekAvail} disabled={checking}
              className="w-full py-2 rounded-xl border-2 border-orange-300 text-orange-600 text-sm font-semibold flex items-center justify-center gap-2">
              {checking ? <><Loader className="w-4 h-4 animate-spin" /> Mengecek...</> : '🔍 Cek Ketersediaan'}
            </button>
          )}
          {avail === true  && <p className="text-green-600 text-sm font-semibold text-center">✅ Unit tersedia!</p>}
          {avail === false && <p className="text-red-500 text-sm font-semibold text-center">❌ Unit sudah dipesan, coba tanggal lain.</p>}

          <Field label="Durasi Sewa" required>
            <div className="grid grid-cols-2 gap-2">
              {DURASI_OPTIONS.map((d) => (
                <button key={d} type="button"
                  onClick={() => set('durasi', d === 'Lainnya...' ? '' : d)}
                  className={`py-2 rounded-xl text-sm font-medium border-2 transition ${
                    (d === 'Lainnya...' && !DURASI_OPTIONS.slice(0,-1).includes(form.durasi) && form.durasi !== '')
                    || form.durasi === d
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >{d}</button>
              ))}
            </div>
            {!DURASI_OPTIONS.slice(0, -1).includes(form.durasi) && (
              <input className={inputCls + ' mt-2'} placeholder="Ketik durasi, cth: 8 Hari..."
                value={form.durasi} onChange={(e) => set('durasi', e.target.value)} autoFocus />
            )}
          </Field>

          <Field label="Metode Pengambilan" required>
            {METODE_OPTIONS.map((m) => (
              <button key={m} type="button" onClick={() => set('metode', m)}
                className={`w-full mb-2 last:mb-0 py-2.5 rounded-xl text-sm font-medium border-2 transition text-left px-3 ${
                  form.metode === m
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-600'
                }`}>
                {form.metode === m ? '● ' : '○ '}{m}
              </button>
            ))}
          </Field>

          <Field label="Catatan (opsional)">
            <textarea className={inputCls + ' resize-none'} rows={3}
              placeholder="Misal: antar ke alamat, jemput di bandara, dll."
              value={form.catatan} onChange={(e) => set('catatan', e.target.value)} />
          </Field>
        </div>

        {error && (
          <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting
            ? <><Loader className="w-5 h-5 animate-spin" /> Memproses...</>
            : pelanggan?.id
              ? <>Kirim Pesanan <ChevronRight className="w-4 h-4" /></>
              : <>Lanjut <ChevronRight className="w-4 h-4" /></>}
        </button>
        <p className="text-xs text-center text-gray-400">
          Dengan memesan, Anda menyetujui ketentuan sewa DIGJAYA
        </p>
      </form>
    </div>
  );
}
