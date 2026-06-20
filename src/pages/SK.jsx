import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '📋 Persyaratan Penyewa',
    items: [
      'Fotokopi KTP yang masih berlaku',
      'Fotokopi Kartu Keluarga (KK)',
      'Fotokopi SIM aktif sesuai jenis kendaraan yang disewa',
      'Screenshot media sosial aktif (Instagram / Facebook)',
      'Kendaraan + STNK sebagai jaminan, atau uang deposit tunai',
      'Penyewa baru wajib mengupload dokumen identitas saat pemesanan pertama',
      'Penyewa luar kota minimal sewa 3 hari',
    ],
  },
  {
    title: '🤝 Serah Terima Kendaraan',
    items: [
      'Penyewa wajib foto bersama kendaraan pada saat pengambilan',
      'Penyewa wajib memiliki SIM yang sesuai dan masih berlaku',
      'Perpanjangan waktu sewa wajib dikonfirmasi minimal 6 jam sebelum waktu kembali',
      'Kendaraan dikembalikan tepat waktu sesuai kesepakatan',
      'Kendaraan dikembalikan dalam kondisi bersih dan BBM sesuai saat pengambilan',
      'Keterlambatan pengembalian dikenakan biaya tambahan 10% per jam dari harga sewa',
    ],
  },
  {
    title: '⚠️ Tanggung Jawab Penyewa',
    items: [
      'Penyewa bertanggung jawab penuh atas semua kerusakan yang terjadi selama masa sewa',
      'Dilarang keras menyewakan kembali kendaraan kepada pihak lain',
      'Dilarang menggunakan kendaraan untuk kegiatan ilegal atau berbahaya',
      'Dilarang membawa kendaraan ke luar kota tanpa izin tertulis dari DIGJAYA',
      'Kehilangan kendaraan menjadi tanggung jawab penyewa sepenuhnya',
      'DIGJAYA tidak bertanggung jawab atas kerugian yang timbul akibat kecelakaan',
    ],
  },
  {
    title: '💳 Pembayaran & Deposit',
    items: [
      'Pembayaran dapat dilakukan secara tunai atau transfer bank',
      'Deposit dikembalikan setelah kendaraan diperiksa dan dinyatakan kondisinya sesuai',
      'Pembatalan kurang dari 24 jam sebelum waktu sewa dikenakan biaya administrasi',
      'Biaya sewa tidak termasuk bahan bakar kecuali ada perjanjian khusus',
      'Harga With Driver ditentukan berdasarkan rute dan jarak tempuh',
    ],
  },
];

function Accordion({ title, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white rounded-2xl overflow-hidden border transition-all ${
      open ? 'border-orange-200 shadow-sm shadow-orange-100' : 'border-gray-100 shadow-sm'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <span className={`font-bold text-sm transition-colors ${open ? 'text-orange-600' : 'text-gray-800'}`}>
          {title}
        </span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-orange-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-0 border-t border-orange-50">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 pt-3">
              <span className="w-5 h-5 rounded-full bg-orange-50 text-orange-500 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-600 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SK() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gray-900 px-4 pt-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
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
              <h1 className="font-black text-white text-lg mt-0.5">Syarat & Ketentuan</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 text-center">
          <p className="text-xs text-orange-600 leading-relaxed">
            Dengan melakukan pemesanan, Anda dianggap telah membaca dan menyetujui seluruh syarat & ketentuan berikut.
          </p>
        </div>

        {SECTIONS.map((s) => (
          <Accordion key={s.title} title={s.title} items={s.items} />
        ))}

        {/* Kontak */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm font-black text-gray-800 mb-1">Ada pertanyaan?</p>
          <p className="text-xs text-gray-400 mb-4">Hubungi kami langsung via WhatsApp</p>
          <a
            href="https://wa.me/6285862177805"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold px-7 py-3 rounded-2xl shadow-sm shadow-emerald-500/25 active:scale-95 transition"
          >
            Chat WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
