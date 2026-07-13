import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Bike, ChevronDown, MessageCircle, MapPin, Clock, Phone } from 'lucide-react';
import { getUnits, getUnitPhotos, getUnitsEstimasiFinish } from '../utils/api';
import { ADMIN_WA_NUMBER } from '../utils/constants';

// Reveal — wrapper murni visual untuk micro-interaction "scroll reveal".
// Terisolasi total dari logic booking: state/observer miliknya sendiri,
// tidak pernah membaca/menulis state di Landing(). Hanya opacity+transform
// (GPU-friendly), sekali trigger lalu observer di-disconnect.
function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}
    >
      {children}
    </div>
  );
}

const FALLBACK_MOTOR = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80';
const FALLBACK_MOBIL = 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80';

function getDefaultPhoto(unit) {
  if (unit.foto_url) return unit.foto_url;
  return unit.tipe === 'Motor' ? FALLBACK_MOTOR : FALLBACK_MOBIL;
}

const STATUS_LABEL = {
  READY:   { label: 'Tersedia', cls: 'bg-white/90 backdrop-blur-sm text-emerald-600 border border-emerald-100' },
  BOOKING: { label: 'Dipesan',  cls: 'bg-white/90 backdrop-blur-sm text-amber-600 border border-amber-100'     },
  JALAN:   { label: 'Disewa',   cls: 'bg-white/90 backdrop-blur-sm text-sky-600 border border-sky-100'         },
  SERVIS:  { label: 'Servis',   cls: 'bg-white/90 backdrop-blur-sm text-rose-600 border border-rose-100'       },
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
    <div className={`bg-white rounded-2xl border shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] transition-colors duration-200 ${
      open ? 'border-orange-200' : 'border-gray-100'
    }`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left rounded-2xl hover:bg-gray-50 transition-colors duration-200"
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
    <footer className="bg-gray-900 text-gray-400 px-5 pt-10 pb-8 md:px-6">
      <div className="md:max-w-3xl md:mx-auto">
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
            <MapPin className="w-4 h-4" /> Lihat di Google Maps
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
      </div>
    </footer>
  );
}

// Aturan #6 — format tanggal lokal ringkas untuk info "Disewa sampai ...".
// Mengikuti pola fmtDate yang sudah ada di CekStatus.jsx (belum ada modul
// date-utility bersama di repo ini untuk website).
function fmtEstimasi(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// Bug fix R1 (audit Concurrency & Data Integrity Hardening, Phase 3): foto
// unit SEKARANG diambil sekali secara batch oleh Landing() (Promise.all,
// lihat useEffect di bawah), bukan lagi per-kartu lewat useEffect masing-
// masing UnitCard — pola lama menghasilkan N query Storage `.list()`
// terpisah untuk N unit (N+1). Logika pemilihan foto ITU SENDIRI TIDAK
// BERUBAH SAMA SEKALI (tetap `urls[0] || getDefaultPhoto(unit)`, tetap
// query per-unit yang sama di getUnitPhotos — Supabase Storage tidak
// punya API untuk "list foto pertama dari N folder" dalam satu panggilan,
// jadi jumlah query tidak berkurang, tapi paralel via Promise.all &
// terpusat, bukan lagi tersebar per komponen). `photoResolved`/`photoUrl`
// dikirim sebagai prop; UnitCard hanya menyimpan state lokal untuk
// fallback error gambar (handleImgError), bukan untuk fetching.
function UnitCard({ unit, onClick, estimasiFinish, photoUrl, photoResolved }) {
  const [photo, setPhoto] = useState(null);
  const [imgErr, setImgErr] = useState(false);
  const photoLoading = !photoResolved;
  // Aturan #6 — Availability berbasis jadwal, bukan status unit. Status
  // hanya informasi visual; satu-satunya gerbang nyata adalah jadwal, yang
  // dicek oleh checkAvailability() (SSOT) saat pelanggan memilih tanggal di
  // halaman Booking. SERVIS adalah SATU-SATUNYA pengecualian yang tetap
  // hard-block di sini — bukan aturan baru, tapi mencerminkan business rule
  // yang sudah ada di apiGetBookingConflict (admin, Sprint 8.5.5): periode
  // SERVIS tidak selalu punya tgl_selesai (bisa NULL), jadi tidak ada
  // rentang tanggal yang bisa dibandingkan seperti transaksi biasa.
  const available = unit.status !== 'SERVIS';
  const st = STATUS_LABEL[unit.status] || STATUS_LABEL.READY;

  useEffect(() => {
    if (photoResolved) setPhoto(photoUrl || getDefaultPhoto(unit));
  }, [photoResolved, photoUrl, unit]);

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
      className={`rounded-2xl overflow-hidden bg-white border transition-all duration-200 ${
        available
          ? 'border-gray-100 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] cursor-pointer active:scale-[0.97] hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.14)] hover:border-orange-200'
          : 'border-gray-100 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] opacity-55 cursor-not-allowed'
      }`}
    >
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {photoLoading ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
        ) : photo && !imgErr ? (
          <img
            src={photo} alt={unit.nama}
            className="w-full h-full object-cover animate-[fade-in_250ms_ease-out]"
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
        <div className="absolute bottom-0 inset-x-0 px-4 pb-3 pt-6">
          <p className="text-white font-semibold text-sm truncate leading-snug">{unit.nama}</p>
          <p className="text-white/60 text-xs">{unit.tipe}</p>
        </div>
      </div>

      <div className="p-4">
        {harga12 && (
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 leading-none">mulai dari</p>
              <p className="text-base font-extrabold text-orange-500 mt-1">
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
        {unit.status === 'JALAN' && estimasiFinish && (
          <p className="flex items-center gap-1 text-[11px] text-sky-600 mb-2">
            <Clock className="w-3 h-3 shrink-0" />
            Disewa sampai {fmtEstimasi(estimasiFinish)}
          </p>
        )}
        {available ? (
          <button className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 hover:shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-200 text-white text-xs font-semibold tracking-wide">
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
  const [estimasiFinishMap, setEstimasiFinishMap] = useState({});
  const [photosMap, setPhotosMap] = useState({});

  useEffect(() => {
    // Simpan kode referral dari URL ke sessionStorage
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) sessionStorage.setItem('ref_marketing', ref);

    getUnits().then((res) => {
      if (res.success) setUnits(res.data);
      setLoading(false);
    });
    // Aturan #6 — estimasi tanggal selesai unit yang sedang JALAN, dipakai
    // UnitCard untuk info "Disewa sampai ...".
    getUnitsEstimasiFinish().then(setEstimasiFinishMap);
  }, []);

  // Bug fix R1 — batch fetch SELURUH foto unit lewat Promise.all sekali,
  // dipicu setelah daftar unit didapat (butuh unit.id). Jumlah query ke
  // Storage TIDAK berkurang (tetap 1 per unit — keterbatasan API Storage,
  // lihat komentar di UnitCard), tapi sekarang paralel & terpusat, bukan
  // lagi N useEffect terpisah yang tersebar per kartu.
  useEffect(() => {
    if (!units.length) return;
    let active = true;
    Promise.all(
      units.map((u) => getUnitPhotos(u.id).then((urls) => [u.id, urls[0] || null]))
    ).then((pairs) => {
      if (!active) return;
      setPhotosMap(Object.fromEntries(pairs));
    });
    return () => { active = false; };
  }, [units]);

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

      {/* Header — inner content dibatasi max-w-3xl & di-center di md+ supaya
          sejajar dengan seluruh section di bawahnya pada layar desktop
          (768/1024/1280px), bar gelapnya sendiri tetap full-bleed. */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3.5 md:max-w-3xl md:mx-auto md:px-6">
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
      </div>

      {/* Hero — dua kolom TETAP (mobile & desktop, tidak pernah ditumpuk):
          kolom kiri ~45% teks rata-kiri (Display headline fluid: aman dari
          320px sampai 44px penuh di desktop), kolom kanan ~55% artwork foto
          asli (public/hero-vehicles.png + public/brand-wall.png). Tinggi
          tetap: 420px mobile, 560px desktop. Outer overflow-hidden jadi
          satu-satunya batas crop — vehicle artwork sengaja lebih besar dari
          kolomnya sendiri (bottom:0 right:-40px height:105%) agar sebagian
          "keluar" dan terlihat besar/premium, tetap terpotong rapi oleh
          tepi Hero. Inset kiri di desktop (md:pl-[calc(...)]) dihitung agar
          persis sejajar dengan max-w-3xl mx-auto milik section di bawahnya. */}
      <div className="relative overflow-hidden bg-slate-900 h-[420px] md:h-[560px] flex items-center">
        {/* Layer dasar — gradient navy halus */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 pointer-events-none" />

        {/* Highlight halus di belakang teks — supaya area headline tidak
            terasa gelap datar, tanpa mengubah palet warna. */}
        <div className="absolute -left-16 top-0 w-72 h-72 md:w-[26rem] md:h-[26rem] bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* Kolom kanan — artwork, absolute penuh tinggi, ~55% lebar */}
        <div className="absolute inset-y-0 right-0 w-[55%] pointer-events-none">
          {/* Background artwork — brand-wall.png (logo + motif circuit asli),
              layer paling belakang: opacity sangat rendah, blur ringan,
              mix-blend-overlay supaya jadi tekstur yang menyatu ke gradient
              navy, bukan terlihat sebagai foto yang ditempel. */}
          <img
            src="/brand-wall.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-right opacity-[0.12] blur-sm mix-blend-overlay select-none"
            style={{
              maskImage: 'linear-gradient(to left, black 30%, transparent 85%)',
              WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 85%)',
            }}
          />

          {/* Radial glow oranye, sangat tipis, floating pelan */}
          <div className="absolute top-1/3 right-[8%] w-72 h-72 md:w-[28rem] md:h-[28rem] bg-orange-500/8 rounded-full blur-3xl animate-[hero-float_26s_ease-in-out_infinite]" />

          {/* Vignette halus supaya tepi artwork menyatu, bukan terlihat ditempel */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at right, transparent 45%, rgba(2,6,23,0.55) 100%)' }}
          />

          {/* Foreground artwork — hero-vehicles.png (motor jadi fokus, mobil
              pelengkap): bottom:0, right:-40px, height:105%, object-contain,
              sengaja "meluber" keluar kolom untuk kesan besar & premium.
              brightness/contrast sangat ringan supaya motor tetap jelas
              terlihat, tidak tenggelam gelap. */}
          <img
            src="/hero-vehicles.png"
            alt="Motor PCX, NMAX, dan mobil armada DIGJAYA Rental"
            className="absolute bottom-0 right-[-40px] h-[105%] w-auto max-w-none object-contain object-bottom
                       brightness-105 contrast-105
                       drop-shadow-[0_25px_35px_rgba(0,0,0,0.45)]
                       animate-[silhouette-float_7s_ease-in-out_infinite]"
            style={{
              maskImage: 'linear-gradient(to left, black 55%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 55%, transparent 100%)',
            }}
          />
        </div>

        {/* Kolom kiri — konten, rata kiri, selalu di atas artwork. Hierarchy
            tetap: eyebrow → headline → subheadline → CTA, tanpa elemen lain.
            Fade-up sekali saat mount (300ms, Hero selalu above-the-fold).
            Headline pakai clamp() fluid supaya tetap satu baris wajar &
            tidak overflow container di layar sekecil 320px.

            Alignment desktop: wrapper luar dipusatkan lewat md:max-w-3xl
            md:mx-auto (persis mekanisme yang dipakai Header/Katalog/dst di
            bawahnya) alih-alih calc(100vw...) — 100vw ikut menghitung lebar
            scrollbar sehingga bisa meleset beberapa px dari lebar sebenarnya;
            mx-auto tidak punya masalah itu dan otomatis presisi sejajar. */}
        <div className="relative z-10 h-full flex items-center md:max-w-3xl md:mx-auto md:w-full animate-[fade-up_300ms_ease-out_both]">
          <div className="w-[45%] px-4 md:w-auto md:max-w-md md:px-6">
            <p className="text-orange-400 text-xs font-semibold tracking-[0.2em] uppercase mb-2 md:mb-3">
              Kalijati &bull; Subang
            </p>
            <h1 className="text-[clamp(1.375rem,6vw,2rem)] md:text-[2.75rem] font-bold text-white leading-[1.15] md:leading-[1.1]">
              Sewa Motor di Kalijati &amp; Subang
            </h1>
            <p className="text-gray-300 text-xs md:text-base leading-relaxed mt-3 md:mt-4">
              Motor diantar langsung ke lokasi Anda.
            </p>

            <div className="mt-5 md:mt-7 flex flex-col md:flex-row gap-2 md:gap-3">
              <button
                onClick={() => navigate('/booking')}
                className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-3.5 rounded-2xl text-xs md:text-sm leading-snug transition-all duration-200 active:scale-[0.97] text-center"
              >
                Pesan Sekarang
              </button>
              <a
                href={`https://wa.me/${ADMIN_WA_NUMBER}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full md:w-auto flex items-center justify-center gap-2 border border-white/15 hover:border-white/25 text-white font-semibold px-4 py-3.5 rounded-2xl text-xs md:text-sm leading-snug transition-all duration-200 active:scale-[0.97]"
              >
                <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Transisi premium — sheet melengkung menutupi ujung Hero supaya
          menyatu ke konten, bukan potongan tegas gelap→putih. Membungkus
          Katalog + Cara Pesan + FAQ dalam satu latar konsisten. */}
      <div className="relative -mt-5 rounded-t-3xl bg-gray-50 shadow-[0_-12px_24px_-16px_rgba(0,0,0,0.15)]">

      {/* Katalog — fokus utama halaman, langsung setelah Hero. Header
          section memakai accent-bar yang sama dengan Cara Pesan & FAQ
          supaya seluruh halaman terasa satu design system. md:max-w-3xl
          md:mx-auto menyelaraskan inset kiri dengan Header & Hero di
          desktop (768/1024/1280px), grid naik ke 3 kolom di md+ supaya
          rasio foto unit tidak melebar aneh di layar lebar. */}
      <div id="katalog" className="px-4 pt-10 md:max-w-3xl md:mx-auto md:px-6">
        <Reveal>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-1 h-5 bg-orange-500 rounded-full" />
                <h2 className="font-bold text-gray-900 text-lg leading-tight">Armada Kami</h2>
              </div>
              {!loading && (
                <p className="text-xs text-gray-500 ml-3.5">{readyCount} unit siap disewa</p>
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
                    filter === f.key ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                <div className="h-44 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-2/3 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-3 w-1/3 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-8 rounded-xl bg-gray-200 animate-pulse mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Reveal>
            <div className="py-14 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 flex items-center justify-center">
                <Car className="w-7 h-7 text-orange-300" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Tidak ada unit tersedia</p>
              <p className="text-gray-400 text-xs mt-1">Coba pilih kategori lain</p>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
              {(showAll ? filtered : filtered.slice(0, 6)).map((u) => (
                <UnitCard
                  key={u.id} unit={u} onClick={handlePesan}
                  estimasiFinish={estimasiFinishMap[u.id]}
                  photoUrl={photosMap[u.id]}
                  photoResolved={Object.prototype.hasOwnProperty.call(photosMap, u.id)}
                />
              ))}
            </div>
            {!showAll && filtered.length > 6 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-4 py-3 rounded-xl border border-orange-200 text-orange-500 text-sm font-semibold hover:bg-orange-50 active:scale-[0.98] transition-all duration-200"
              >
                Lihat {filtered.length - 6} Unit Lainnya ↓
              </button>
            )}
          </Reveal>
        )}
      </div>

      {/* Cara Pesan — inset selaras md:max-w-3xl md:mx-auto, dibungkus
          Reveal untuk scroll-reveal saat section ini masuk viewport. */}
      <div className="px-4 pt-12 md:max-w-3xl md:mx-auto md:px-6">
        <Reveal>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] p-5">
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
        </Reveal>
      </div>

      {/* FAQ — inset & Reveal sama dengan Cara Pesan untuk konsistensi. */}
      <div className="px-4 pt-12 md:max-w-3xl md:mx-auto md:px-6">
        <Reveal>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1 h-5 bg-orange-500 rounded-full" />
            <h2 className="font-bold text-gray-900 text-lg">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-2.5">
            {FAQ.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </Reveal>
      </div>
      </div>
      {/* — akhir sheet transisi Hero → konten */}

      <div className="pt-12">
        <Reveal>
          <Footer />
        </Reveal>
      </div>
    </div>
  );
}
