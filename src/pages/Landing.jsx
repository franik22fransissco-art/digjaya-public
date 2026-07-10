import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Car, ChevronRight, ChevronDown, Bike, Shield, Zap, MessageCircle,
  Wallet, Headset, ClipboardCheck, Truck, CalendarDays, UserCheck,
  Star, MapPin, Clock, Phone, Users, CheckCircle2, Check,
} from 'lucide-react';
import { getUnits, getUnitPhotos } from '../utils/api';
import { ADMIN_WA_NUMBER } from '../utils/constants';

const FALLBACK_MOTOR = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80';
const FALLBACK_MOBIL = 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80';

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

// ─── Data statis section marketing (bukan business logic — aman diubah kapan saja) ──

const KEUNGGULAN = [
  { icon: Shield,         label: 'Unit Terawat',      desc: 'Servis rutin berkala' },
  { icon: Zap,            label: 'Respon Cepat',      desc: 'Balasan < 15 menit' },
  { icon: ClipboardCheck, label: 'Booking Mudah',     desc: 'Isi form, langsung diproses' },
  { icon: Wallet,         label: 'Harga Transparan',  desc: 'Tanpa biaya tersembunyi' },
  { icon: Truck,          label: 'Antar Jemput',      desc: 'Diantar ke lokasi Anda' },
  { icon: Headset,        label: 'Customer Support',  desc: 'Siap bantu 24 jam' },
];

const LAYANAN = [
  { icon: Bike,        title: 'Rental Motor',    desc: 'Matic & manual, harian atau mingguan' },
  { icon: Car,         title: 'Rental Mobil',    desc: 'MPV & city car untuk keluarga atau kerja' },
  { icon: Truck,       title: 'Antar ke Lokasi', desc: 'Unit diantar langsung ke alamat Anda' },
  { icon: CalendarDays,title: 'Carter Harian',   desc: 'Sewa jangka panjang, harga lebih hemat' },
  { icon: UserCheck,   title: 'Driver',          desc: 'Sewa lengkap dengan sopir berpengalaman' },
];

// Placeholder — ganti dengan testimoni pelanggan asli begitu tersedia.
// Struktur (nama, unit, rating, quote) sudah final, tinggal ganti isinya.
const testimonials = [
  { nama: 'Budi S.', unit: 'Honda Beat',    rating: 5, quote: 'Prosesnya cepat, unitnya bersih dan terawat. Diantar tepat waktu ke rumah.' },
  { nama: 'Rina A.', unit: 'Toyota Avanza', rating: 5, quote: 'Harga sesuai yang di web, tidak ada biaya tambahan mendadak. Recommended untuk sewa mobil keluarga.' },
  { nama: 'Dedi P.', unit: 'Yamaha NMAX',   rating: 5, quote: 'Admin fast response, tanya-tanya langsung dibalas. Motornya juga wangi dan kondisinya bagus.' },
];

// Badge trust singkat, ditampilkan tepat di bawah hero.
const TRUST_BADGES = [
  { icon: Clock,          label: 'Buka 24 Jam' },
  { icon: Truck,          label: 'Antar ke Lokasi' },
  { icon: ClipboardCheck, label: 'Booking Mudah' },
  { icon: Wallet,         label: 'Harga Transparan' },
];

// Statistik untuk section "Mengapa Memilih DIGJAYA?". "Pelanggan Dilayani" dan
// "Booking Selesai" masih placeholder — beri komentar TODO supaya gampang
// ditemukan begitu ada agregat data asli dari backend. "Respon Cepat" memakai
// klaim SLA yang sama dengan section Keunggulan (bukan angka dinamis, jadi
// aman sebagai teks tetap). "Unit Tersedia" TIDAK placeholder — dihitung dari
// `readyCount` yang sudah nyata diambil dari database (lihat komponen Landing).
const STATS_PLACEHOLDER = [
  { icon: Users,        value: '500+',        label: 'Pelanggan Dilayani' }, // TODO: hubungkan ke agregat asli
  { icon: CheckCircle2, value: '1.200+',      label: 'Booking Selesai' },    // TODO: hubungkan ke agregat asli
  { icon: Zap,          value: '< 15 menit',  label: 'Respon Cepat' },
];

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
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      open ? 'border-orange-200 shadow-sm shadow-orange-100' : 'border-gray-100 shadow-sm'
    }`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <span className={`font-bold text-sm ${open ? 'text-orange-600' : 'text-gray-800'}`}>{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180 text-orange-500' : 'text-gray-300'}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-orange-50">
          <p className="text-sm text-gray-600 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

function Footer() {
  const mapsQuery = encodeURIComponent('GP26+M34, Ciruluk, Kalijati, Subang');
  return (
    <footer className="bg-gray-900 text-gray-400 px-5 pt-10 pb-8 mt-8">
      <div className="flex items-center gap-2.5 mb-5">
        <img src="/logo.png" alt="DIGJAYA" className="h-9 w-9 object-contain rounded-xl" />
        <div className="leading-none">
          <p className="text-white font-black text-sm tracking-wide">DIGJAYA</p>
          <p className="text-orange-400 text-[10px] font-bold tracking-[0.2em] mt-0.5">RENTAL</p>
        </div>
      </div>

      <div className="space-y-3 text-sm mb-6">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p>GP26+M34, Ciruluk, Kec. Kalijati, Kabupaten Subang, Jawa Barat 41271</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-orange-400 shrink-0" />
          <p>Buka 24 Jam, Setiap Hari</p>
        </div>
        <a
          href={`https://wa.me/${ADMIN_WA_NUMBER}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2.5 hover:text-orange-400 transition w-fit"
        >
          <Phone className="w-4 h-4 text-orange-400 shrink-0" />
          <p>+62 858-6217-7805</p>
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-orange-400 font-semibold text-xs bg-orange-500/10 border border-orange-500/20 px-3.5 py-2 rounded-xl active:scale-95 transition"
        >
          <MapPin className="w-3.5 h-3.5" /> Lihat di Google Maps
        </a>
      </div>

      <div className="border-t border-white/10 pt-5 flex flex-col gap-2">
        <Link to="/sk" className="text-xs text-gray-400 hover:text-orange-400 transition w-fit">
          Syarat &amp; Ketentuan
        </Link>
        <p className="text-[11px] text-gray-500">
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
        <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
          {st.label}
        </span>
        <div className="absolute bottom-0 inset-x-0 px-3 pb-2.5 pt-6">
          <p className="text-white font-bold text-sm truncate leading-snug">{unit.nama}</p>
          <p className="text-white/55 text-[10px] font-medium">{unit.tipe}</p>
        </div>
      </div>

      <div className="p-3">
        {harga12 && (
          <div className="flex items-baseline justify-between mb-2.5">
            <div>
              <p className="text-[10px] text-gray-400 leading-none">mulai dari</p>
              <p className="text-sm font-black text-orange-500 mt-0.5">
                Rp {harga12}<span className="text-[10px] font-medium text-gray-400"> /12jam</span>
              </p>
            </div>
            {hargaDay && (
              <p className="text-xs font-bold text-gray-500">
                Rp {hargaDay}<span className="text-[10px] font-normal text-gray-400">/{dayLabel}</span>
              </p>
            )}
          </div>
        )}
        {available ? (
          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold tracking-wide shadow-sm shadow-orange-500/25">
            Pesan Sekarang
          </button>
        ) : (
          <div className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-400 text-xs font-semibold text-center border border-gray-100">
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

  // Galeri memakai foto unit yang sudah ada di data `units` (field foto_url) —
  // tidak ada fetch baru, tidak ada aset baru. Kosong secara wajar kalau belum
  // ada unit yang punya foto_url terisi.
  const galeriFotos = units.filter((u) => u.foto_url).slice(0, 8);

  // "Unit Tersedia" di section statistik memakai data asli (readyCount di atas),
  // bukan placeholder — digabung dengan 3 statistik lain yang masih placeholder.
  const stats = [
    { icon: Car, value: `${readyCount}+`, label: 'Unit Tersedia' },
    ...STATS_PLACEHOLDER,
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="DIGJAYA" className="h-8 w-8 object-contain rounded-xl" />
          <div className="leading-none">
            <p className="text-white font-black text-sm tracking-wide">DIGJAYA</p>
            <p className="text-orange-400 text-[10px] font-bold tracking-[0.2em] mt-0.5">RENTAL</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/cek-status')}
          className="text-xs text-orange-400 font-semibold bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-xl active:scale-95 transition"
        >
          Cek Pesanan
        </button>
      </div>

      {/* Hero */}
      <div className="bg-gray-900 relative overflow-hidden px-5 pt-10 pb-12">
        <div className="absolute -top-10 right-0 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-10 w-56 h-56 bg-orange-600/8 rounded-full blur-3xl pointer-events-none" />
        {/* Visual armada — samar, membaur ke background, memakai foto yang sama dengan fallback katalog */}
        <div
          className="absolute inset-y-0 right-0 w-1/2 opacity-25 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${FALLBACK_MOBIL})`,
            maskImage: 'linear-gradient(to left, black 15%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to left, black 15%, transparent 85%)',
          }}
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-orange-400/90 text-[10px] font-bold tracking-[0.15em] uppercase">Rental Kendaraan Kalijati Subang</span>
          </div>

          <h1 className="text-[2rem] font-black text-white leading-[1.15] mb-3">
            Sewa Motor & Mobil,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Diantar ke Lokasi Anda
            </span>
          </h1>
          <p className="text-gray-300 text-sm mb-7 leading-relaxed max-w-[88%]">
            Booking online, respon cepat, harga transparan. Armada terawat siap sewa{' '}
            <strong className="text-white font-semibold">24 jam</strong> di Kalijati &amp; Subang.
          </p>

          <div className="flex gap-2.5">
            <button
              onClick={() => document.getElementById('katalog').scrollIntoView({ behavior: 'smooth' })}
              className="flex-[2] bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-xl shadow-orange-600/25"
            >
              Lihat Armada <ChevronRight className="w-4 h-4" />
            </button>
            <a
              href={`https://wa.me/${ADMIN_WA_NUMBER}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 border border-white/15 text-white font-bold py-4 rounded-2xl text-sm active:scale-[0.98] transition backdrop-blur-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" /> Chat WA
            </a>
          </div>
        </div>
      </div>

      {/* Trust badges — tepat di bawah hero */}
      <div className="px-4 pt-5">
        <div className="flex flex-wrap gap-2">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white border border-gray-100 shadow-sm rounded-full pl-2 pr-3 py-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
              </span>
              <Icon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-[11px] font-bold text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Statistik — Mengapa Memilih DIGJAYA? */}
      <div className="px-4 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-orange-500 rounded-full" />
          <h2 className="font-black text-gray-900 text-lg">Mengapa Memilih DIGJAYA?</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-gray-900 text-lg leading-none truncate">{value}</p>
                <p className="text-[11px] text-gray-400 font-medium mt-1 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Layanan */}
      <div className="px-4 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-orange-500 rounded-full" />
          <h2 className="font-black text-gray-900 text-lg">Layanan Kami</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {LAYANAN.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 shadow-sm shadow-orange-500/25">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-gray-800 text-sm mb-0.5">{title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Keunggulan */}
      <div className="px-4 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-orange-500 rounded-full" />
          <h2 className="font-black text-gray-900 text-lg">Kenapa Pilih DIGJAYA?</h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {KEUNGGULAN.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col items-center text-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-[11px] font-bold text-gray-800 leading-tight">{label}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Katalog */}
      <div id="katalog" className="px-4 pt-8 pb-2">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-black text-gray-900 text-lg leading-tight">Armada Kami</h2>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">{readyCount} unit siap disewa</p>
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
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
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
            <p className="text-gray-400 text-sm font-medium">Tidak ada unit tersedia</p>
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
                className="w-full mt-4 py-3 rounded-xl border-2 border-orange-200 text-orange-500 text-sm font-bold active:scale-[0.98] transition"
              >
                Lihat {filtered.length - 6} Unit Lainnya ↓
              </button>
            )}
          </>
        )}
      </div>

      {/* Galeri Armada — pakai foto unit yang sudah ada (unit.foto_url), tanpa fetch/aset baru */}
      {!loading && galeriFotos.length > 0 && (
        <div className="px-4 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-orange-500 rounded-full" />
            <h2 className="font-black text-gray-900 text-lg">Galeri Armada</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {galeriFotos.map((u) => (
              <div key={u.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                <img
                  src={u.foto_url}
                  alt={u.nama}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-white text-[10px] font-bold truncate">{u.nama}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cara Pesan */}
      <div className="px-4 pt-8 pb-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-orange-500 rounded-full" />
            <h2 className="font-black text-gray-900 text-base">Cara Pesan</h2>
          </div>
          <div className="relative pl-8">
            <div className="absolute left-3 top-3 bottom-3 w-px bg-gradient-to-b from-orange-400 to-orange-100" />
            {[
              { num: '1', title: 'Pilih Kendaraan',        desc: 'Pilih unit yang tersedia dari katalog kami' },
              { num: '2', title: 'Isi Form Pemesanan',      desc: 'Nama, nomor WA, tanggal & durasi sewa' },
              { num: '3', title: 'Konfirmasi via WhatsApp', desc: 'Tim kami menghubungi dalam 15 menit' },
            ].map((s, i) => (
              <div key={s.num} className={`relative ${i < 2 ? 'mb-6' : ''}`}>
                <div className="absolute -left-8 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-400/40">
                  <span className="text-white font-black text-[11px]">{s.num}</span>
                </div>
                <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimoni */}
      <div className="px-4 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-orange-500 rounded-full" />
          <h2 className="font-black text-gray-900 text-lg">Kata Pelanggan Kami</h2>
        </div>
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div key={t.nama} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                  {t.nama.charAt(0)}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-gray-800">{t.nama}</p>
                  <p className="text-[11px] text-gray-400">Penyewa {t.unit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-orange-500 rounded-full" />
          <h2 className="font-black text-gray-900 text-lg">Pertanyaan Umum</h2>
        </div>
        <div className="space-y-2.5">
          {FAQ.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </div>

      {/* CTA kecil setelah FAQ */}
      <div className="px-4 pt-8">
        <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-5 text-center">
          <p className="font-bold text-gray-800 text-sm mb-1">Masih ada pertanyaan?</p>
          <p className="text-xs text-gray-400 mb-4">Tim kami siap membantu lewat WhatsApp</p>
          <a
            href={`https://wa.me/${ADMIN_WA_NUMBER}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl active:scale-95 transition"
          >
            <MessageCircle className="w-4 h-4" /> Chat WhatsApp
          </a>
        </div>
      </div>

      {/* CTA Besar */}
      <div className="px-4 pt-8 pb-2">
        <div className="bg-gray-900 rounded-2xl p-6 text-center relative overflow-hidden border border-white/5">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
          <p className="text-orange-400 text-[11px] font-bold tracking-[0.15em] uppercase mb-2 relative">Siap Berangkat?</p>
          <h2 className="text-white font-black text-xl mb-2 relative">Pesan Kendaraan Anda Sekarang</h2>
          <p className="text-gray-400 text-sm mb-5 relative">Proses cepat, tim kami siap membantu 24 jam.</p>
          <div className="flex gap-2.5 relative">
            <button
              onClick={() => navigate('/booking')}
              className="flex-[2] bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-xl shadow-orange-600/25"
            >
              Pesan Sekarang <ChevronRight className="w-4 h-4" />
            </button>
            <a
              href={`https://wa.me/${ADMIN_WA_NUMBER}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 border border-white/15 text-white font-bold py-4 rounded-2xl text-sm active:scale-[0.98] transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
            </a>
          </div>
        </div>
      </div>

      <Footer />

      {/* Floating WhatsApp — selalu terlihat, diposisikan di atas Bottom Navigation
          (bottom-20 = clear dari nav fixed di bawahnya), tidak mengubah tombol WA lain. */}
      <a
        href={`https://wa.me/${ADMIN_WA_NUMBER}`}
        target="_blank" rel="noopener noreferrer"
        aria-label="Chat WhatsApp"
        className="fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}
