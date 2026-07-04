import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertCircle, Car,
  Loader, Upload, UserCheck, UserPlus, ChevronRight, Camera,
} from 'lucide-react';
import { getUnits, checkAvailability, checkPelanggan, checkBlacklist, uploadDokumen, submitBooking } from '../utils/api';
import { compressImage } from '../utils/compressImage';

const DURASI_OPTIONS = [
  '6 Jam', '12 Jam', '24 Jam (1 Hari)',
  '2 Hari', '3 Hari', '4 Hari',
  '5 Hari', '6 Hari', '1 Minggu',
  'Lainnya...',
];
const METODE_OPTIONS_BARU = ['Antar ke Lokasi', 'With Driver'];
const METODE_OPTIONS_LAMA = ['Antar ke Lokasi', 'Ambil Sendiri', 'With Driver'];

const DOKUMEN_LIST = [
  { key: 'ktp',    label: 'Foto KTP',             required: true  },
  { key: 'kk',     label: 'Foto Kartu Keluarga',  required: true  },
  { key: 'sim',    label: 'Foto SIM',              required: true  },
  { key: 'sosmed', label: 'Screenshot Media Sosial', required: true },
];

const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 bg-white text-gray-800 placeholder-gray-400 transition-all';

function Field({ label, children, hint, required }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function UploadBox({ label, required, value, onChange, loading }) {
  const camRef = useRef();
  const galRef = useRef();
  const [showOptions, setShowOptions] = useState(!value);

  useEffect(() => { if (value) setShowOptions(false); }, [value]);

  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </p>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />
      <input ref={galRef} type="file" accept="image/*" className="hidden" onChange={onChange} />

      {loading ? (
        <div className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl">
          <Loader className="w-6 h-6 text-orange-400 animate-spin" />
          <p className="text-xs text-gray-400">Mengupload...</p>
        </div>
      ) : value && !showOptions ? (
        <div
          onClick={() => setShowOptions(true)}
          className="relative border-2 border-dashed border-orange-400 bg-orange-50 rounded-xl overflow-hidden cursor-pointer transition"
        >
          <img src={value} alt={label} className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <p className="text-white text-xs font-bold">Ganti Foto</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => camRef.current?.click()}
            className="flex flex-col items-center gap-1.5 border-2 border-dashed border-orange-300 rounded-xl py-3.5 hover:border-orange-500 bg-orange-50 transition"
          >
            <Camera className="w-5 h-5 text-orange-500" />
            <span className="text-xs text-orange-600 font-medium">Kamera</span>
          </button>
          <button
            type="button"
            onClick={() => galRef.current?.click()}
            className="flex flex-col items-center gap-1.5 border-2 border-dashed border-orange-300 rounded-xl py-3.5 hover:border-orange-500 bg-orange-50 transition"
          >
            <Upload className="w-5 h-5 text-orange-500" />
            <span className="text-xs text-orange-600 font-medium">Galeri</span>
          </button>
        </div>
      )}
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
    tujuan:   '',
    unitId:   params.get('unitId') || '',
    tglMulai: '',
    jamMulai: '',
    durasi:   '24 Jam (1 Hari)',
    metode:   'Antar ke Lokasi',
    jaminan:  '',
    catatan:  '',
  });

  // Info pelanggan (null = belum dicek/baru, object = lama)
  const [pelanggan,  setPelanggan]  = useState(null);
  const [riskInfo,   setRiskInfo]   = useState({ status: 'OK', catatan: '' });
  const [checkingWA, setCheckingWA] = useState(false);
  const [waChecked,  setWaChecked]  = useState(false);

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

  const unitNama    = params.get('unitNama') || units.find((u) => u.id === form.unitId)?.nama || '';
  const selectedUnit = units.find((u) => u.id === form.unitId);
  const isMotor     = (selectedUnit?.tipe || '').toLowerCase() === 'motor';

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); setAvail(null); setError(''); }

  const prevTipeRef = useRef('');

  // Auto-set jaminan sesuai tipe unit; hanya reset saat tipe BERUBAH (motor↔mobil)
  useEffect(() => {
    if (!form.unitId || units.length === 0) return;
    const unit = units.find((u) => u.id === form.unitId);
    const tipe = (unit?.tipe || '').toLowerCase();
    if (tipe === 'motor') {
      setForm((f) => ({ ...f, jaminan: 'Deposit' }));
    } else if (prevTipeRef.current === 'motor') {
      // Baru pindah dari motor ke non-motor: hapus jaminan yang tadi auto-set
      setForm((f) => ({ ...f, jaminan: '' }));
    }
    // Ganti unit dalam tipe yang sama: jaminan tidak diubah
    prevTipeRef.current = tipe;
  }, [form.unitId, units]);

  // Cek pelanggan + blacklist saat WA di-blur
  async function handleWABlur() {
    const wa = form.noWA.trim().replace(/\D/g, '');
    if (wa.length < 8) return;
    setCheckingWA(true);
    const [result, risk] = await Promise.all([
      checkPelanggan(form.noWA),
      checkBlacklist(form.noWA),
    ]);
    setPelanggan(result);
    setRiskInfo(risk);
    setCheckingWA(false);
    setWaChecked(true);
    // Auto-fill nama jika pelanggan lama dan field nama masih kosong
    if (result?.nama && !form.nama.trim()) {
      setForm((f) => ({ ...f, nama: result.nama }));
    }
    // Reset metode jika customer baru dan sudah pilih Ambil Sendiri
    if (!result && form.metode === 'Ambil Sendiri') set('metode', 'Antar ke Lokasi');
  }

  function parseDurasiToDays(durasi) {
    const str = (durasi || '').toLowerCase();
    const m = str.match(/(\d+)\s*(jam|hari|minggu)/);
    if (!m) return 0;
    const n = parseInt(m[1]);
    if (m[2] === 'jam')    return n / 24;
    if (m[2] === 'minggu') return n * 7;
    return n;
  }

  async function handleCekAvail() {
    if (!form.unitId || !form.tglMulai) { setError('Pilih unit dan tanggal'); return; }
    const days = parseDurasiToDays(form.durasi);
    const end  = new Date(form.tglMulai);
    if (days >= 1) end.setDate(end.getDate() + Math.floor(days));
    const tglSelesai = end.toISOString().split('T')[0];
    setChecking(true);
    const ok = await checkAvailability(form.unitId, form.tglMulai, tglSelesai);
    setAvail(ok);
    setChecking(false);
  }

  // Step 1 → next
  async function handleStep1() {
    const { nama, noWA, unitId, tglMulai, durasi, metode, tujuan, jaminan } = form;
    if (!nama || !noWA || !unitId || !tglMulai || !durasi || !metode) {
      setError('Semua field wajib diisi'); return;
    }
    if (form.noWA.replace(/\D/g,'').length < 8) { setError('Nomor WA tidak valid'); return; }
    if (metode === 'With Driver' && !tujuan.trim()) {
      setError('Tujuan/rute wajib diisi untuk layanan With Driver'); return;
    }
    if (!jaminan) { setError('Pilih jenis jaminan'); return; }
    setError('');

    // Langsung await hasil check — jangan andalkan state React yang async
    let resolved = pelanggan;
    let risk = riskInfo;
    if (resolved === null) {
      setCheckingWA(true);
      [resolved, risk] = await Promise.all([
        checkPelanggan(form.noWA),
        checkBlacklist(form.noWA),
      ]);
      setPelanggan(resolved);
      setRiskInfo(risk);
      setCheckingWA(false);
      if (resolved?.nama && !form.nama.trim()) {
        setForm((f) => ({ ...f, nama: resolved.nama }));
      }
    }

    if (risk.status === 'REJECT') {
      setError(`Nomor ini tidak dapat melakukan pemesanan${risk.catatan ? ': ' + risk.catatan : ''}. Hubungi kami untuk info lebih lanjut.`);
      return;
    }

    const isNew = !resolved?.id;

    if (isNew) {
      setStep(2);
    } else {
      await doSubmit(false, {});
    }
  }

  // Upload 1 dokumen
  async function handleUploadDok(key, file) {
    if (!file) return;
    setDokLoading((p) => ({ ...p, [key]: true }));
    file = await compressImage(file, { maxWidth: 1600, quality: 0.85 });
    const res = await uploadDokumen(form.noWA, key, file);
    if (res.success) {
      setDokPath((p) => ({ ...p, [key]: res.path }));
      setDokPrev((p) => ({ ...p, [key]: URL.createObjectURL(file) }));
    } else {
      setError(`Gagal upload ${key.toUpperCase()}: ${res.message}`);
    }
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
    const catatanFinal = form.metode === 'With Driver'
      ? `[Tujuan] ${form.tujuan}${form.catatan ? '\n' + form.catatan : ''}`
      : form.catatan;
    const refMarketing = new URLSearchParams(window.location.search).get('ref')
      || sessionStorage.getItem('ref_marketing')
      || 'franik';
    const res = await submitBooking({
      ...form,
      catatan: catatanFinal,
      jaminan:  form.jaminan || null,
      isBaru,
      refMarketing,
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center pb-20">
        <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-100 rounded-full flex items-center justify-center mb-5">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Pesanan Terkirim!</h1>
        <p className="text-sm text-gray-500 mb-1">
          Tim DIGJAYA akan menghubungi <strong className="text-gray-700">{form.noWA}</strong> dalam 15 menit.
        </p>
        <p className="text-xs text-gray-400 mb-8">Simpan nomor WA untuk cek status pesanan.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(`/cek-status?wa=${encodeURIComponent(form.noWA)}`)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-2xl shadow-sm shadow-orange-500/25"
          >
            Cek Status Pesanan
          </button>
          <button onClick={() => navigate('/')}
            className="w-full border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl bg-white">
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
        <div className="bg-gray-900 px-4 pt-10 pb-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/8 text-white active:scale-95 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest">Langkah 2 dari 2</p>
              <h1 className="font-black text-white text-lg mt-0.5">Verifikasi Identitas</h1>
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
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-orange-500/25"
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
      <div className="bg-gray-900 px-4 pt-10 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/8 text-white active:scale-95 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="DIGJAYA" className="h-8 w-8 object-contain rounded-xl" />
            <div className="leading-none">
              <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest">DIGJAYA RENTAL</p>
              <h1 className="font-black text-white text-lg mt-0.5">Form Pemesanan</h1>
            </div>
          </div>
        </div>
        {unitNama && (
          <div className="mt-3 bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Car className="w-4 h-4 text-orange-400" />
            <p className="text-sm font-bold text-white">{unitNama}</p>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleStep1(); }} className="px-4 pt-5 space-y-4">

        {/* Data Pemesan */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
            <div className="w-1 h-4 bg-orange-500 rounded-full" />
            <p className="font-black text-gray-800 text-sm">Data Pemesan</p>
          </div>

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
            {!checkingWA && waChecked && !pelanggan && riskInfo.status !== 'REJECT' && (
              <div className="flex items-center gap-1.5 mt-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-[11px] text-blue-700 font-medium">
                  Pelanggan baru — akan diminta upload identitas di langkah berikutnya
                </p>
              </div>
            )}
            {!checkingWA && riskInfo.status === 'REJECT' && (
              <div className="flex items-start gap-1.5 mt-1.5 bg-red-50 border border-red-300 rounded-lg px-2 py-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-700 font-medium">
                  Nomor ini tidak dapat melakukan pemesanan{riskInfo.catatan ? ` — ${riskInfo.catatan}` : ''}
                </p>
              </div>
            )}
            {!checkingWA && riskInfo.status === 'WARNING' && (
              <div className="flex items-start gap-1.5 mt-1.5 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 font-medium">
                  ⚠ Nomor ini tercatat pernah bermasalah — tim kami akan memverifikasi pesanan Anda
                </p>
              </div>
            )}
          </Field>

          <Field label="Nama Lengkap" required>
            <input className={inputCls} placeholder="Nama sesuai KTP"
              value={form.nama} onChange={(e) => set('nama', e.target.value)} />
          </Field>
        </div>

        {/* Detail Sewa */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
            <div className="w-1 h-4 bg-orange-500 rounded-full" />
            <p className="font-black text-gray-800 text-sm">Detail Sewa</p>
          </div>

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
            {(pelanggan ? METODE_OPTIONS_LAMA : METODE_OPTIONS_BARU).map((m) => (
              <button key={m} type="button" onClick={() => set('metode', m)}
                className={`w-full mb-2 last:mb-0 py-2.5 rounded-xl text-sm font-medium border-2 transition text-left px-3 ${
                  form.metode === m
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-600'
                }`}>
                {form.metode === m ? '● ' : '○ '}{m}
              </button>
            ))}
            {!pelanggan && (
              <p className="text-[11px] text-gray-400 mt-1">
                ℹ Opsi "Ambil Sendiri" tersedia setelah verifikasi domisili (rental kedua dst.)
              </p>
            )}
          </Field>

          {form.metode === 'With Driver' && (
            <Field label="Tujuan / Rute" required hint="Misal: Jemput Kalijati → Pasar Subang, dari Bandara ke Hotel X">
              <textarea
                className={inputCls + ' resize-none border-orange-300 focus:border-orange-500'}
                rows={3}
                placeholder="Tulis titik jemput dan tujuan secara jelas..."
                value={form.tujuan}
                onChange={(e) => set('tujuan', e.target.value)}
                autoFocus
              />
              <p className="text-[11px] text-orange-500 font-medium mt-1">
                ⚠ Harga With Driver ditentukan berdasarkan rute — tulis sejelas mungkin
              </p>
            </Field>
          )}

          {/* Jaminan — muncul setelah unit dipilih */}
          {form.unitId && (
            <Field label="Jaminan" required>
              {isMotor ? (
                <div className="flex items-center gap-3 border-2 border-orange-200 bg-orange-50 rounded-xl px-4 py-3">
                  <span className="text-xl">💵</span>
                  <div>
                    <p className="text-sm font-semibold text-orange-700">Deposit (uang tunai)</p>
                    <p className="text-[11px] text-orange-500 mt-0.5">Sewa motor wajib deposit uang tunai</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { val: 'Deposit',    label: 'Deposit (uang tunai)',             icon: '💵' },
                    { val: 'Kendaraan',  label: 'Kendaraan (Motor/Mobil + STNK)',   icon: '🏍' },
                    { val: 'Lainnya',    label: 'Lainnya',                           icon: '📋' },
                  ].map(({ val, label, icon }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => set('jaminan', val)}
                      className={`w-full py-3 rounded-xl text-sm font-medium border-2 transition text-left px-4 flex items-center gap-3 ${
                        form.jaminan === val
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <span className="text-base">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </Field>
          )}

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

        <button type="submit" disabled={submitting || riskInfo.status === 'REJECT'}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-orange-500/25">
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
