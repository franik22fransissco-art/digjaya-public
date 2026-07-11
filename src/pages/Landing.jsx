import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Bike, ChevronDown, MessageCircle, MapPin, Clock, Phone } from 'lucide-react';
import { getUnits, getUnitPhotos } from '../utils/api';
import { ADMIN_WA_NUMBER } from '../utils/constants';

const FALLBACK_MOTOR = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80';
const FALLBACK_MOBIL = 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80';

// Dekorasi latar Hero — garis "circuit" + titik koneksi tipis, menggemakan
// motif node-dan-garis pada logo DIGJAYA. Murni tekstur, opacity sangat rendah.
// preserveAspectRatio="xMidYMid slice" (bukan "none") supaya garis tegak-lurus
// tidak ikut ter-skew jadi diagonal saat rasio Hero jauh dari rasio viewBox.
function CircuitLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
    >
      <g stroke="#f97316" strokeOpacity="0.12" strokeWidth="1" fill="none">
        <path d="M0 90 H170 V150 H330" />
        <path d="M0 360 H130 V420 H270 V470" />
        <path d="M800 110 H630 V50" />
        <path d="M800 390 H650 V330 H520" />
      </g>
      <g fill="#f97316" fillOpacity="0.3">
        <circle cx="170" cy="90" r="2.5" />
        <circle cx="330" cy="150" r="2.5" />
        <circle cx="130" cy="360" r="2.5" />
        <circle cx="270" cy="470" r="2.5" />
        <circle cx="630" cy="110" r="2.5" />
        <circle cx="520" cy="390" r="2.5" />
      </g>
    </svg>
  );
}

// Ilustrasi siluet kendaraan — geometris/abstrak (bukan foto, bukan render
// presisi model tertentu), gaya minimal ala Linear/Vercel: fill gelap, garis
// tepi oranye tipis sebagai "rim light", glow lantai hangat di bawah roda,
// tanpa detail berlebihan. 2 motor di depan (lebih besar, terpisah jelas
// supaya roda tidak bertumpuk), 1 mobil di belakang (lebih kecil, lebih samar).
const MOTOR_PATH = 'M85 228 C80 195 105 165 145 158 C175 153 195 150 210 130 C218 120 232 116 245 122 C258 128 262 145 253 158 C245 168 240 180 240 195 L240 228 Z';

function VehicleSilhouettes({ className }) {
  return (
    <svg viewBox="0 0 520 280" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="heroFloorGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Glow lantai — kesan cahaya hangat di bawah kendaraan */}
      <ellipse cx="270" cy="250" rx="230" ry="28" fill="url(#heroFloorGlow)" />

      {/* Mobil — paling belakang, kecil, samar, tidak tumpang tindih dengan motor */}
      <g opacity="0.35" style={{ filter: 'blur(0.5px)' }}>
        <path
          d="M40 150 C40 130 56 117 76 115 L138 115 C156 116 169 127 173 144 L173 152 L40 152 Z"
          fill="#050505" stroke="#f97316" strokeOpacity="0.25" strokeWidth="1.5"
        />
        <circle cx="70" cy="153" r="12" fill="#050505" stroke="#f97316" strokeOpacity="0.25" strokeWidth="1.5" />
        <circle cx="150" cy="153" r="12" fill="#050505" stroke="#f97316" strokeOpacity="0.25" strokeWidth="1.5" />
      </g>

      {/* Motor 1 — depan, paling besar */}
      <g style={{ filter: 'drop-shadow(0 0 10px rgba(249,115,22,0.35))' }}>
        <path d={MOTOR_PATH} fill="#050505" stroke="#f97316" strokeOpacity="0.55" strokeWidth="2" />
        <circle cx="110" cy="230" r="27" fill="#050505" stroke="#f97316" strokeOpacity="0.55" strokeWidth="2" />
        <circle cx="255" cy="230" r="27" fill="#050505" stroke="#f97316" strokeOpacity="0.55" strokeWidth="2" />
      </g>

      {/* Motor 2 — digeser cukup jauh ke kanan (bukan sekadar diperkecil di
          tempat) supaya rodanya tidak bertumpuk dengan roda depan Motor 1 */}
      <g
        transform="translate(228 10) scale(0.75)"
        opacity="0.85"
        style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.25))' }}
      >
        <path d={MOTOR_PATH} fill="#050505" stroke="#f97316" strokeOpacity="0.45" strokeWidth="2" />
        <circle cx="110" cy="230" r="27" fill="#050505" stroke="#f97316" strokeOpacity="0.45" strokeWidth="2" />
        <circle cx="255" cy="230" r="27" fill="#050505" stroke="#f97316" strokeOpacity="0.45" strokeWidth="2" />
      </g>
    </svg>
  );
}

function getDefaultPhoto(unit) {
  if (unit.foto_url) return unit.foto_url;
  return unit.tipe === 'Motor' ? FALLBACK_MOTOR : FALLBACK_MOBIL;
}

const STATUS_LABEL = {
  READY:   { label: 'Tersedia', cls: 'bg-emerald-500 text-white' },
  BOOKING: { label: 'Dipesan',  cls: 'bg-amber-400 text-white'   },
  JALAN:   { label: 'Disewa',   cls: 'bg-sky-500 text-white'     },
  SERVIS:  { label: 'Servis',   cls: 'bg-rose-500 text-white'    },
};

function fmtRp(n) {
  if (!n) return null;
  if (n >= 1000000) return `${(n / 1000000).toLocaleString('id-ID')}jt`;
  return `${Math.round(n / 1000)}rb`;
}

// FAQ — jawaban mengikuti aturan yang sama persis dengan halaman Syarat & Ketentuan.
const FAQ = [
  {
    q: 'Apa saja syarat untuk menyewa kendaraan?',
    a: 'Fotokopi KTP dan KK yang masih berlaku, SIM aktif sesuai jenis kendaraan, screenshot media sosial aktif, serta jaminan berupa kendaraan+STNK atau deposit tunai. Penyewa baru wajib mengupload dokumen saat pemesanan pertama.',
  },
  {
    q: 'Apakah unit bisa diantar ke lokasi saya?',
    a: 'Bisa. Pilih metode "Antar ke Lokasi" saat mengisi form booking, tim kami akan mengantarkan unit langsung ke alamat Anda.',
  },
  {
    q: 'Bagaimana jika saya ingin memperpanjang masa sewa?',
    a: 'Hubungi tim kami minimal 6 jam sebelum waktu pengembalian agar durasi sewa bisa diperpanjang.',
  },
  {
    q: 'Apa yang terjadi jika terlambat mengembalikan kendaraan?',
    a: 'Keterlambatan pengembalian dikenakan biaya tambahan 10% per jam dari harga sewa.',
  },
  {
    q: 'Metode pembayaran apa saja yang tersedia?',
    a: 'Tunai saat pengambilan kendaraan, atau transfer bank/DANA sesuai rekening yang ditampilkan setelah pesanan disetujui.',
  },
  {
    q: 'Bagaimana cara mengecek status pesanan saya?',
    a: 'Buka menu "Status" di aplikasi ini dan masukkan nomor WhatsApp yang Anda gunakan saat memesan.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white rounded-2xl border transition-colors duration-200 ${
      open ? 'border-orange-200' : 'border-gray-100'
    }`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <span className={`font-semibold text-sm ${open ? 'text-orange-600' : 'text-gray-800'}`}>{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-orange-500' : 'text-gray-300'}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-orange-50">
          <p className="text-sm text-gray-500 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

function Footer() {
  const mapsQuery = encodeURIComponent('GP26+M34, Ciruluk, Kalijati, Subang');
  return (
    <footer className="bg-gray-900 text-gray-400 px-5 pt-10 pb-8">
      <div className="flex items-center gap-2.5 mb-6">
        <img src="/logo.png" alt="DIGJAYA" className="h-9 w-9 object-contain rounded-xl" />
        <div className="leading-none">
          <p className="text-white font-bold text-sm tracking-wide">DIGJAYA</p>
          <p className="text-orange-400 text-xs font-semibold tracking-[0.2em] mt-1">RENTAL</p>
        </div>
      </div>

      <div className="space-y-3.5 text-sm mb-6">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">GP26+M34, Ciruluk, Kec. Kalijati, Kabupaten Subang, Jawa Barat 41271</p>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-orange-400 shrink-0" />
          <p>Buka 24 Jam, Setiap Hari</p>
        </div>
        <a
          href={`https://wa.me/${ADMIN_WA_NUMBER}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 hover:text-orange-400 transition-colors duration-200 w-fit"
        >
          <Phone className="w-4 h-4 text-orange-400 shrink-0" />
          <p>+62 858-6217-7805</p>
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-orange-400 font-semibold text-xs bg-orange-500/10 border border-orange-500/20 px-3.5 py-2 rounded-xl active:scale-95 transition-transform duration-200"
        >
          <MapPin className="w-3.5 h-3.5" /> Lihat di Google Maps
        </a>
      </div>

      <div className="border-t border-white/10 pt-5 flex flex-col gap-2.5">
        <Link to="/sk" className="text-xs text-gray-400 hover:text-orange-400 transition-colors duration-200 w-fit">
          Syarat &amp; Ketentuan
        </Link>
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} DIGJAYA Rental. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}

function UnitCard({ unit, onClick }) {
  const [photo, setPhoto] = useState(null);
  const [imgErr, setImgErr] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(true);
  const available = unit.status === 'READY';
  const st = STATUS_LABEL[unit.status] || STATUS_LABEL.READY;

  useEffect(() => {
    getUnitPhotos(unit.id).then((urls) => {
      setPhoto(urls[0] || getDefaultPhoto(unit));
      setPhotoLoading(false);
    });
  }, [unit.id]);

  function handleImgError() {
    const fallback = unit.tipe === 'Motor' ? FALLBACK_MOTOR : FALLBACK_MOBIL;
    if (photo !== fallback) setPhoto(fallback);
    else setImgErr(true);
  }

  const harga12  = fmtRp(unit.harga_12jam);
  const hargaDay = unit.tipe === 'Motor' ? fmtRp(unit.harga_per_hari) : fmtRp(unit.harga_24jam);
  const dayLabel = unit.tipe === 'Motor' ? '1 hari' : '24 jam';

  return (
    <div
      onClick={() => available && onClick(unit)}
      className={`rounded-2xl overflow-hidden bg-white shadow-sm border transition-all duration-200 ${
        available
          ? 'border-gray-100 cursor-pointer active:scale-[0.97] hover:shadow-md hover:border-orange-200'
          : 'border-gray-100 opacity-55 cursor-not-allowed'
      }`}
    >
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        {photoLoading ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
        ) : photo && !imgErr ? (
          <img
            src={photo} alt={unit.nama}
            className="w-full h-full object-cover"
            onError={handleImgError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            {unit.tipe === 'Motor'
              ? <Bike className="w-12 h-12 text-gray-300" />
              : <Car  className="w-12 h-12 text-gray-300" />
            }
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className={`absolute top-2.5 left-2.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>
          {st.label}
        </span>
        <div className="absolute bottom-0 inset-x-0 px-3.5 pb-3 pt-6">
          <p className="text-white font-semibold text-sm truncate leading-snug">{unit.nama}</p>
          <p className="text-white/60 text-xs">{unit.tipe}</p>
        </div>
      </div>

      <div className="p-3.5">
        {harga12 && (
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 leading-none">mulai dari</p>
              <p className="text-sm font-bold text-orange-500 mt-1">
                Rp {harga12}<span className="text-xs font-medium text-gray-400"> /12jam</span>
              </p>
            </div>
            {hargaDay && (
              <p className="text-xs font-semibold text-gray-500">
                Rp {hargaDay}<span className="text-xs font-normal text-gray-400">/{dayLabel}</span>
              </p>
            )}
          </div>
        )}
        {available ? (
          <button className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 transition-colors duration-200 text-white text-xs font-semibold tracking-wide">
            Pesan Sekarang
          </button>
        ) : (
          <div className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium text-center border border-gray-100">
            Tidak Tersedia
          </div>
        )}
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [units, setUnits]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('semua');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Simpan kode referral dari URL ke sessionStorage
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) sessionStorage.setItem('ref_marketing', ref);

    getUnits().then((res) => {
      if (res.success) setUnits(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = units.filter((u) => {
    if (filter === 'motor') return u.tipe === 'Motor';
    if (filter === 'mobil') return u.tipe !== 'Motor';
    return true;
  });

  function handlePesan(unit) {
    navigate(`/booking?unitId=${unit.id}&unitNama=${encodeURIComponent(unit.nama)}&tipe=${unit.tipe}`);
  }

  const readyCount = units.filter((u) => u.status === 'READY').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-white/5 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="DIGJAYA" className="h-8 w-8 object-contain rounded-xl" />
          <div className="leading-none">
            <p className="text-white font-bold text-sm tracking-wide">DIGJAYA</p>
            <p className="text-orange-400 text-xs font-semibold tracking-[0.2em] mt-1">RENTAL</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/cek-status')}
          className="text-xs text-orange-400 font-semibold bg-orange-500/10 border border-orange-500/20 px-3.5 py-2 rounded-xl active:scale-95 transition-transform duration-200"
        >
          Cek Pesanan
        </button>
      </div>

      {/* Hero — dua kolom di desktop (kiri teks 45% / kanan ilustrasi 55%),
          satu kolom di mobile dengan tinggi dibatasi ~58vh supaya katalog mulai
          terlihat tanpa scroll penuh. Lapisan dekoratif (grid, circuit+dot,
          watermark logo, glow) murni tekstur — pointer-events-none, di belakang
          konten (z-10). */}
      <div className="relative overflow-hidden bg-gray-900 min-h-[58vh] flex flex-col justify-center px-5 py-8 md:py-20">
        <div className="absolute inset-0 hero-grid pointer-events-none" />
        <CircuitLines />
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="absolute -left-40 top-1/2 -translate-y-1/2 w-[600px] h-[600px] object-contain opacity-[0.06] blur-[1px] pointer-events-none select-none"
        />
        <div className="absolute top-1/4 right-0 md:right-[8%] w-80 h-80 bg-orange-500/8 rounded-full blur-3xl pointer-events-none animate-[hero-float_26s_ease-in-out_infinite]" />

        <div className="relative z-10 max-w-6xl mx-auto w-full md:grid md:grid-cols-[45%_55%] md:gap-10 md:items-center">
          {/* Kolom kiri — headline, subheadline, CTA */}
          <div className="max-w-xs mx-auto md:max-w-md md:mx-0 text-center md:text-left">
            <p className="text-orange-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Kalijati &amp; Subang
            </p>
            <h1 className="text-[2rem] md:text-4xl font-bold text-white leading-tight">
              Sewa Motor di Kalijati &amp; Subang
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed mt-3">
              Booking online. Motor diantar langsung ke lokasi Anda. Mobil juga tersedia.
            </p>

            <div className="mt-5 flex gap-3 md:max-w-sm">
              <button
                onClick={() => navigate('/booking')}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors duration-200 active:scale-[0.98]"
              >
                Pesan Sekarang
              </button>
              <a
                href={`https://wa.me/${ADMIN_WA_NUMBER}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 border border-white/15 hover:border-white/25 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors duration-200 active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" /> Chat WhatsApp
              </a>
            </div>

            {/* Ilustrasi versi ringkas — mobile saja, versi penuh ada di kolom kanan (desktop) */}
            <div className="mt-6 md:hidden">
              <VehicleSilhouettes className="w-full h-48" />
            </div>
          </div>

          {/* Kolom kanan — ilustrasi siluet, desktop saja */}
          <div className="hidden md:block relative h-80">
            <VehicleSilhouettes className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Katalog — fokus utama halaman, langsung setelah Hero */}
      <div id="katalog" className="px-4 pt-12 pb-2">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight">Armada Kami</h2>
            {!loading && (
              <p className="text-xs text-gray-500 mt-1">{readyCount} unit siap disewa</p>
            )}
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {[
              { key: 'semua', label: 'Semua' },
              { key: 'motor', label: 'Motor' },
              { key: 'mobil', label: 'Mobil' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setShowAll(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                  filter === f.key ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-white h-60 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-4xl mb-3">🚗</p>
            <p className="text-gray-500 text-sm font-medium">Tidak ada unit tersedia</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {(showAll ? filtered : filtered.slice(0, 6)).map((u) => (
                <UnitCard key={u.id} unit={u} onClick={handlePesan} />
              ))}
            </div>
            {!showAll && filtered.length > 6 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-4 py-3 rounded-xl border border-orange-200 text-orange-500 text-sm font-semibold active:scale-[0.98] transition-transform duration-200"
              >
                Lihat {filtered.length - 6} Unit Lainnya ↓
              </button>
            )}
          </>
        )}
      </div>

      {/* Cara Pesan */}
      <div className="px-4 pt-12 pb-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1 h-5 bg-orange-500 rounded-full" />
            <h2 className="font-bold text-gray-900 text-lg">Cara Pesan</h2>
          </div>
          <div className="relative pl-8">
            <div className="absolute left-3 top-3 bottom-3 w-px bg-orange-100" />
            {[
              { num: '1', title: 'Pilih Kendaraan',        desc: 'Pilih unit yang tersedia dari katalog kami' },
              { num: '2', title: 'Isi Form Pemesanan',      desc: 'Nama, nomor WA, tanggal & durasi sewa' },
              { num: '3', title: 'Konfirmasi via WhatsApp', desc: 'Tim kami menghubungi dalam 15 menit' },
            ].map((s, i) => (
              <div key={s.num} className={`relative ${i < 2 ? 'mb-6' : ''}`}>
                <div className="absolute -left-8 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{s.num}</span>
                </div>
                <p className="font-semibold text-gray-800 text-sm">{s.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 pt-12">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-5 bg-orange-500 rounded-full" />
          <h2 className="font-bold text-gray-900 text-lg">Pertanyaan Umum</h2>
        </div>
        <div className="space-y-2.5">
          {FAQ.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </div>

      <div className="pt-12">
        <Footer />
      </div>
    </div>
  );
}
