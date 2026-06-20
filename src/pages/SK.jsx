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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <span className="font-bold text-gray-800 text-sm">{title}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-orange-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-50">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 pt-2">
              <span className="text-orange-400 font-bold text-xs mt-0.5 shrink-0">{i + 1}.</span>
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
      <div className="bg-orange-500 text-white px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="DIGJAYA" className="h-6 w-6 object-contain rounded" />
            <div>
              <p className="text-xs opacity-75">DIGJAYA RENTAL</p>
              <h1 className="font-bold text-lg">Syarat & Ketentuan</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-3">
        <p className="text-xs text-gray-500 text-center pb-1">
          Dengan melakukan pemesanan, Anda dianggap telah membaca dan menyetujui seluruh syarat & ketentuan berikut.
        </p>
        {SECTIONS.map((s) => (
          <Accordion key={s.title} title={s.title} items={s.items} />
        ))}

        {/* Kontak */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center space-y-2">
          <p className="text-sm font-bold text-orange-700">Ada pertanyaan?</p>
          <p className="text-xs text-orange-600">Hubungi kami langsung via WhatsApp</p>
          <a
            href="https://wa.me/6285862177805"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 bg-green-500 text-white text-sm font-bold px-6 py-2 rounded-xl"
          >
            Chat WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
