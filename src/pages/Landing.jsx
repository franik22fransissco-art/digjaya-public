import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, CheckCircle, Phone, Clock, Star, ChevronRight, Bike } from 'lucide-react';
import { getUnits, getUnitPhotos } from '../utils/api';

const STATUS_LABEL = {
  READY:   { label: 'Tersedia',   cls: 'bg-green-100 text-green-700' },
  BOOKING: { label: 'Dibooking', cls: 'bg-yellow-100 text-yellow-700' },
  JALAN:   { label: 'Disewa',    cls: 'bg-blue-100 text-blue-700' },
  SERVIS:  { label: 'Servis',    cls: 'bg-red-100 text-red-700' },
};

function UnitCard({ unit, onClick }) {
  const [photo, setPhoto] = useState(null);
  const available = unit.status === 'READY';
  const st = STATUS_LABEL[unit.status] || STATUS_LABEL.READY;

  useEffect(() => {
    getUnitPhotos(unit.id).then((urls) => { if (urls[0]) setPhoto(urls[0]); });
  }, [unit.id]);

  return (
    <div
      onClick={() => available && onClick(unit)}
      className={`bg-white rounded-2xl shadow-sm overflow-hidden transition active:scale-95 ${
        available ? 'cursor-pointer hover:shadow-md' : 'opacity-70 cursor-not-allowed'
      }`}
    >
      {/* Foto */}
      <div className="relative h-36 bg-gray-100">
        {photo ? (
          <img src={photo} alt={unit.nama} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {unit.tipe === 'Motor' || unit.tipe === 'Lainnya'
              ? <Bike className="w-12 h-12 text-gray-300" />
              : <Car  className="w-12 h-12 text-gray-300" />
            }
          </div>
        )}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
          {st.label}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-bold text-gray-800 text-sm">{unit.nama}</p>
        <p className="text-xs text-gray-400">{unit.tipe}</p>
        {available && (
          <button className="mt-2 w-full py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold">
            Pesan Unit Ini
          </button>
        )}
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [units, setUnits]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('semua'); // semua | motor | mobil

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
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-5 pt-14 pb-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 -left-10 w-64 h-64 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-orange-500" />
            </div>
            <p className="font-bold text-lg tracking-wide">DIGJAYA RENTAL</p>
          </div>
          <h1 className="text-2xl font-extrabold leading-tight mb-2">
            Sewa Kendaraan<br />Praktis & Terpercaya
          </h1>
          <p className="text-sm opacity-80 mb-6">Motor dan mobil siap antar ke lokasi Anda</p>
          <div className="flex gap-3">
            <button
              onClick={() => document.getElementById('katalog').scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 bg-white text-orange-600 font-bold py-3 rounded-xl text-sm shadow active:scale-95 transition"
            >
              Lihat Armada
            </button>
            <button
              onClick={() => navigate('/cek-status')}
              className="flex-1 border-2 border-white/60 text-white font-semibold py-3 rounded-xl text-sm active:scale-95 transition"
            >
              Cek Pesanan
            </button>
          </div>
        </div>
      </div>

      {/* Keunggulan */}
      <div className="grid grid-cols-3 gap-2 px-4 py-4 bg-white shadow-sm">
        {[
          { icon: CheckCircle, label: 'Unit Terawat', color: 'text-green-500' },
          { icon: Phone,       label: 'Respon Cepat', color: 'text-blue-500' },
          { icon: Clock,       label: 'Siap 24 Jam',  color: 'text-orange-500' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-1 py-1">
            <Icon className={`w-6 h-6 ${color}`} />
            <p className="text-[11px] font-medium text-gray-600 text-center">{label}</p>
          </div>
        ))}
      </div>

      {/* Katalog */}
      <div id="katalog" className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">Armada Kami</h2>
          <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
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
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500'
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
              <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Tidak ada unit tersedia</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((u) => (
              <UnitCard key={u.id} unit={u} onClick={handlePesan} />
            ))}
          </div>
        )}
      </div>

      {/* Cara Pesan */}
      <div className="px-4 py-5 bg-white mx-4 rounded-2xl shadow-sm mb-4">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-orange-500" /> Cara Pesan
        </h2>
        {[
          { step: '1', title: 'Pilih Unit',       desc: 'Pilih kendaraan yang tersedia dari katalog' },
          { step: '2', title: 'Isi Form',          desc: 'Masukkan nama, WhatsApp, tanggal, dan durasi sewa' },
          { step: '3', title: 'Tunggu Konfirmasi', desc: 'Tim kami hubungi via WhatsApp dalam 15 menit' },
        ].map((s) => (
          <div key={s.step} className="flex gap-3 mb-3 last:mb-0">
            <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-bold text-sm flex items-center justify-center shrink-0">
              {s.step}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{s.title}</p>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA pesan */}
      <div className="px-4 pb-8">
        <button
          onClick={() => navigate('/booking')}
          className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition"
        >
          Pesan Sekarang <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* WA floating */}
      <a
        href="https://wa.me/62"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-4 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 z-50 active:scale-95 transition"
      >
        <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.116 1.519 5.851L.057 23.982l6.261-1.44A11.941 11.941 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.784a9.752 9.752 0 01-5.025-1.393l-.36-.214-3.733.859.893-3.622-.235-.373A9.75 9.75 0 012.25 12C2.25 6.589 6.589 2.25 12 2.25S21.75 6.589 21.75 12 17.411 21.75 12 21.784z" />
        </svg>
      </a>
    </div>
  );
}
