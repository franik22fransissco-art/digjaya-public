import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Bike, ChevronDown, MessageCircle, MapPin, Clock, Phone } from 'lucide-react';
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

      {/* Hero — dua kolom TETAP (mobile & desktop, tidak pernah ditumpuk):
          kolom kiri 45% teks rata-kiri, kolom kanan 55% artwork foto asli
          (public/hero-vehicles.png + public/brand-wall.png). Tinggi tetap
          (bukan vh): 400px mobile, 560px desktop. Outer overflow-hidden jadi
          satu-satunya batas crop — kolom artwork boleh membiarkan gambar
          "keluar" dari lebar 55%-nya sendiri untuk kesan besar/premium,
          selama masih terpotong rapi oleh tepi Hero. */}
      <div className="relative overflow-hidden bg-slate-900 h-[400px] md:h-[560px] flex items-center">
        {/* Layer dasar — gradient navy halus */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 pointer-events-none" />

        {/* Kolom kanan — artwork, absolute penuh tinggi, ~55% lebar */}
        <div className="absolute inset-y-0 right-0 w-[55%] pointer-events-none">
          {/* Background artwork — brand-wall.png (logo + motif circuit asli),
              layer paling belakang: opacity rendah, blur ringan, di-mask ke
              kiri supaya membaur ke gradient, tidak mengganggu teks. */}
          <img
            src="/brand-wall.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-right opacity-20 blur-[2px] select-none"
            style={{
              maskImage: 'linear-gradient(to left, black 35%, transparent 90%)',
              WebkitMaskImage: 'linear-gradient(to left, black 35%, transparent 90%)',
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
              pelengkap), sengaja diperbesar melebihi kolom & di-mask ke kiri
              supaya seolah "meluber" dari sisi kanan Hero. */}
          <img
            src="/hero-vehicles.png"
            alt="Motor PCX, NMAX, dan mobil armada DIGJAYA Rental"
            className="absolute right-[-6%] bottom-0 w-[150%] max-w-none object-contain object-right
                       md:right-[-3%] md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:w-[120%]
                       drop-shadow-[0_25px_35px_rgba(0,0,0,0.45)]
                       animate-[silhouette-float_7s_ease-in-out_infinite]"
            style={{
              maskImage: 'linear-gradient(to left, black 62%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 62%, transparent 100%)',
            }}
          />
        </div>

        {/* Kolom kiri — konten, rata kiri, ~45% lebar, selalu di atas artwork */}
        <div className="relative z-10 w-[45%] flex flex-col justify-center px-4 sm:px-6 md:px-16">
          <p className="text-orange-400 text-[0.65rem] md:text-xs font-semibold tracking-[0.18em] md:tracking-[0.2em] uppercase mb-2 md:mb-3">
            Kalijati &bull; Subang
          </p>
          <h1 className="text-xl sm:text-2xl md:text-5xl font-bold text-white leading-[1.2] md:leading-tight">
            Sewa Motor di Kalijati &amp; Subang
          </h1>
          <p className="text-gray-300 text-[0.7rem] sm:text-sm md:text-base leading-relaxed mt-2 md:mt-3">
            Booking online. Motor diantar langsung ke lokasi. Mobil juga tersedia.
          </p>

          <div className="mt-4 md:mt-5 flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => navigate('/booking')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 md:px-6 md:py-3.5 rounded-2xl text-xs md:text-sm transition-colors duration-200 active:scale-[0.98] w-fit"
            >
              Pesan Sekarang
            </button>
            <a
              href={`https://wa.me/${ADMIN_WA_NUMBER}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-white/15 hover:border-white/25 text-white font-semibold px-4 py-2.5 md:px-6 md:py-3.5 rounded-2xl text-xs md:text-sm transition-colors duration-200 active:scale-[0.98] w-fit"
            >
              <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> Chat WhatsApp
            </a>
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
