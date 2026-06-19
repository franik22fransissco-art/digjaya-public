import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, CheckCircle, Phone, Clock, Star, ChevronRight, Bike } from 'lucide-react';
import { getUnits, getUnitPhotos } from '../utils/api';

// Foto fallback jika unit.foto_url kosong dan belum ada foto custom dari admin
const FALLBACK_MOTOR = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80';
const FALLBACK_MOBIL = 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80';

function getDefaultPhoto(unit) {
  // Prioritas 1: foto_url yang disimpan di DB (per unit)
  if (unit.foto_url) return unit.foto_url;
  // Prioritas 2: fallback generik berdasarkan tipe
  return unit.tipe === 'Motor' ? FALLBACK_MOTOR : FALLBACK_MOBIL;
}

const STATUS_LABEL = {
  READY:   { label: 'Tersedia',  cls: 'bg-orange-100 text-orange-600' },
  BOOKING: { label: 'Dibooking', cls: 'bg-yellow-100 text-yellow-700' },
  JALAN:   { label: 'Disewa',   cls: 'bg-blue-100 text-blue-600' },
  SERVIS:  { label: 'Servis',   cls: 'bg-red-100 text-red-500' },
};

function UnitCard({ unit, onClick }) {
  const [photo, setPhoto] = useState(getDefaultPhoto(unit));
  const [imgErr, setImgErr] = useState(false);
  const available = unit.status === 'READY';
  const st = STATUS_LABEL[unit.status] || STATUS_LABEL.READY;

  useEffect(() => {
    getUnitPhotos(unit.id).then((urls) => { if (urls[0]) setPhoto(urls[0]); });
  }, [unit.id]);

  return (
    <div
      onClick={() => available && onClick(unit)}
      className={`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition active:scale-95 ${
        available ? 'cursor-pointer hover:shadow-md hover:border-orange-200' : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="relative h-36 bg-gray-100">
        {photo && !imgErr ? (
          <img
            src={photo} alt={unit.nama}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            {unit.tipe === 'Motor'
              ? <Bike className="w-12 h-12 text-gray-300" />
              : <Car  className="w-12 h-12 text-gray-300" />
            }
          </div>
        )}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
          {st.label}
        </span>
      </div>
      <div className="p-3">
        <p className="font-bold text-gray-800 text-sm truncate">{unit.nama}</p>
        <p className="text-xs text-gray-400 mb-2">{unit.tipe}</p>
        {available && (
          <button className="w-full py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold">
            Pesan Unit Ini
          </button>
        )}
        {!available && (
          <div className="w-full py-1.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-medium text-center">
            Tidak tersedia
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

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="DIGJAYA" className="h-7 w-7 object-contain rounded" />
          <p className="font-bold text-white tracking-wide text-sm">DIGJAYA RENTAL</p>
        </div>
        <button
          onClick={() => navigate('/cek-status')}
          className="text-xs text-orange-400 font-semibold border border-orange-400/40 px-3 py-1.5 rounded-xl"
        >
          Cek Pesanan
        </button>
      </div>

      {/* Hero */}
      <div className="bg-gray-800 px-5 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <span className="inline-block bg-orange-500/20 text-orange-400 text-[10px] font-bold px-3 py-1 rounded-full mb-3 tracking-wider">
            RENTAL KENDARAAN
          </span>
          <h1 className="text-2xl font-extrabold text-white leading-tight mb-2">
            Sewa Kendaraan<br />
            <span className="text-orange-400">Praktis & Terpercaya</span>
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Motor dan mobil siap antar ke lokasi Anda
          </p>
          <button
            onClick={() => document.getElementById('katalog').scrollIntoView({ behavior: 'smooth' })}
            className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-orange-500/20"
          >
            Lihat Armada <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Keunggulan */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
        {[
          { icon: CheckCircle, label: 'Unit Terawat', color: 'text-orange-500' },
          { icon: Phone,       label: 'Respon Cepat', color: 'text-orange-500' },
          { icon: Clock,       label: 'Siap 24 Jam',  color: 'text-orange-500' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 py-3 px-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <p className="text-[10px] font-semibold text-gray-500 text-center leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Katalog */}
      <div id="katalog" className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 text-base">Armada Kami</h2>
          <div className="flex bg-white border border-gray-200 rounded-xl p-0.5 gap-0.5">
            {[
              { key: 'semua', label: 'Semua' },
              { key: 'motor', label: 'Motor' },
              { key: 'mobil', label: 'Mobil' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === f.key
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400'
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
              <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">Tidak ada unit tersedia</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((u) => (
              <UnitCard key={u.id} unit={u} onClick={handlePesan} />
            ))}
          </div>
        )}
      </div>

      {/* Cara Pesan */}
      <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-orange-500 fill-orange-500" /> Cara Pesan
        </h2>
        {[
          { step: '1', title: 'Pilih Unit',        desc: 'Pilih kendaraan yang tersedia dari katalog' },
          { step: '2', title: 'Isi Form',           desc: 'Masukkan nama, WhatsApp, tanggal, dan durasi sewa' },
          { step: '3', title: 'Tunggu Konfirmasi',  desc: 'Tim kami hubungi via WhatsApp dalam 15 menit' },
        ].map((s, i) => (
          <div key={s.step} className={`flex gap-3 ${i < 2 ? 'mb-3' : ''}`}>
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              {s.step}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{s.title}</p>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4 pb-24">
        <button
          onClick={() => navigate('/booking')}
          className="w-full bg-gray-800 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition border-2 border-orange-500"
        >
          <span className="text-orange-400">Pesan Sekarang</span>
          <ChevronRight className="w-4 h-4 text-orange-400" />
        </button>
      </div>

      {/* WA floating */}
      <a
        href="https://wa.me/6285862177805"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-4 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 z-50 active:scale-95 transition"
      >
        <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.116 1.519 5.851L.057 23.982l6.261-1.44A11.941 11.941 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.784a9.752 9.752 0 01-5.025-1.393l-.36-.214-3.733.859.893-3.622-.235-.373A9.75 9.75 0 012.25 12C2.25 6.589 6.589 2.25 12 2.25S21.75 6.589 21.75 12 17.411 21.75 12 21.784z" />
        </svg>
      </a>
    </div>
  );
}
