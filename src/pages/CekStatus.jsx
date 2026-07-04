import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Clock, CheckCircle, XCircle, Loader, Copy, Check, AlertTriangle } from 'lucide-react';
import { getStatusByWA, cancelBookingRequest } from '../utils/api';
import { ADMIN_WA_NUMBER } from '../utils/constants';

const STATUS_CONFIG = {
  PENDING:  { label: 'Menunggu Konfirmasi', icon: Clock,          cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', iconCls: 'text-yellow-500' },
  APPROVED: { label: 'Disetujui!',          icon: CheckCircle,    cls: 'bg-green-50  text-green-700  border-green-200',  iconCls: 'text-green-500'  },
  REJECTED: { label: 'Tidak Disetujui',     icon: XCircle,        cls: 'bg-red-50    text-red-700    border-red-200',    iconCls: 'text-red-500'    },
  CANCEL:   { label: 'Dibatalkan',          icon: AlertTriangle,  cls: 'bg-gray-50   text-gray-500   border-gray-200',   iconCls: 'text-gray-400'   },
};

const REKENING = [
  { id: 'bca',  icon: '🏦', label: 'Transfer Bank BCA', no: '0551941000',   nama: 'Franik Fransissco', warna: 'border-blue-200 bg-blue-50' },
  { id: 'dana', icon: '💙', logoUrl: '/dana-logo.png', label: 'DANA', no: '085703622538', nama: 'Franik Fransissco', warna: 'border-blue-100 bg-sky-50' },
];

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtDateTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
        copied ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-blue-600 border-blue-200'
      }`}
    >
      {copied ? <><Check className="w-3 h-3" /> Disalin</> : <><Copy className="w-3 h-3" /> Salin</>}
    </button>
  );
}

export default function CekStatus() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [noWA, setNoWA]           = useState(params.get('wa') || '');
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [error, setError]         = useState('');
  const [cancelId, setCancelId]   = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (params.get('wa')) handleCari();
  }, []); // eslint-disable-line

  async function handleCancel(id) {
    setCancelling(true);
    const res = await cancelBookingRequest(id);
    setCancelling(false);
    setCancelId(null);
    if (res.success) {
      setResults((prev) => prev.filter((r) => r.id !== id));
    } else {
      setError('Gagal membatalkan pesanan. Coba lagi.');
    }
  }

  async function handleCari(e) {
    e?.preventDefault();
    const wa = noWA.trim();
    if (!wa) { setError('Masukkan nomor WhatsApp'); return; }
    if (wa.replace(/\D/g, '').length < 8) { setError('Nomor tidak valid'); return; }
    setError('');
    setLoading(true);
    setSearched(false);
    const res = await getStatusByWA(wa);
    setResults(res.data);
    setLoading(false);
    setSearched(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
              <h1 className="font-black text-white text-lg mt-0.5">Cek Status Pesanan</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Form cari */}
        <form onSubmit={handleCari} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <p className="text-sm text-gray-600 font-medium">Masukkan nomor WhatsApp yang digunakan saat memesan:</p>
          <input
            type="tel"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-gray-800 placeholder-gray-400 transition-all"
            placeholder="08xxxxxxxxxx"
            value={noWA}
            onChange={(e) => { setNoWA(e.target.value); setError(''); }}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60 shadow-sm shadow-orange-500/20"
          >
            {loading
              ? <><Loader className="w-4 h-4 animate-spin" /> Mencari...</>
              : <><Search className="w-4 h-4" /> Cari Pesanan</>}
          </button>
        </form>

        {/* Hasil tidak ditemukan */}
        {searched && results.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-2xl mb-2">🔍</p>
            <p className="font-semibold text-gray-700">Pesanan Tidak Ditemukan</p>
            <p className="text-sm text-gray-400 mt-1">
              Pastikan nomor WhatsApp yang dimasukkan sama dengan saat memesan
            </p>
          </div>
        )}

        {results.map((r) => {
          const cfg  = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
          const Icon = cfg.icon;
          const ada_harga = r.status === 'APPROVED' && r.nominal > 0;

          return (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Status bar */}
              <div className={`px-4 py-3 border flex items-center gap-2 ${cfg.cls}`}>
                <Icon className={`w-5 h-5 ${cfg.iconCls}`} />
                <p className="font-bold text-sm">{cfg.label}</p>
                {r.inv && (
                  <span className="ml-auto text-[10px] font-mono font-semibold opacity-70">{r.inv}</span>
                )}
              </div>

              {/* Detail */}
              <div className="px-4 py-4 space-y-2">
                <div className="flex justify-between">
                  <p className="text-xs text-gray-400">Kendaraan</p>
                  <p className="text-sm font-bold text-gray-800">
                    {r.unit?.nama || '—'} {r.unit?.tipe && <span className="font-normal text-gray-500">({r.unit.tipe})</span>}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-xs text-gray-400">Tanggal Mulai</p>
                  <p className="text-sm text-gray-700">{r.tgl_mulai ? fmtDate(r.tgl_mulai) : '—'}</p>
                </div>
                {r.jam_mulai && (
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-400">Jam</p>
                    <p className="text-sm text-gray-700">{r.jam_mulai?.slice(0, 5)}</p>
                  </div>
                )}
                {r.durasi && (
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-400">Durasi</p>
                    <p className="text-sm text-gray-700">{r.durasi}</p>
                  </div>
                )}
                {r.metode && (
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-400">Metode</p>
                    <p className="text-sm text-gray-700">{r.metode}</p>
                  </div>
                )}
                {r.catatan && (
                  <div className="pt-1 border-t border-gray-50">
                    <p className="text-xs text-gray-400">Catatan</p>
                    <p className="text-sm text-gray-600 mt-0.5">{r.catatan}</p>
                  </div>
                )}

                {/* Harga + Pembayaran (jika sudah disetujui dan ada nominal) */}
                {ada_harga && (() => {
                  const metodeLower  = (r.metode || '').toLowerCase();
                  const isDelivery   = metodeLower.includes('antar');
                  const isDriver     = metodeLower.includes('driver');
                  const sewa         = Number(r.nominal) || 0;
                  const delivery     = Number(r.biaya_delivery) || 0;
                  const dep          = Number(r.deposit) || 0;
                  const total        = sewa + delivery + dep;
                  return (
                  <div className="pt-2 space-y-3 border-t border-gray-100 mt-2">
                    {/* Rincian biaya */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-1.5">
                      <p className="text-xs text-orange-600 font-semibold mb-1">Rincian Biaya</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isDriver ? 'Harga All-in' : 'Harga Sewa'}</span>
                        <span className="font-semibold text-gray-800">Rp {sewa.toLocaleString('id-ID')}</span>
                      </div>
                      {isDelivery && delivery > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Biaya Delivery</span>
                          <span className="font-semibold text-gray-800">Rp {delivery.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {!isDriver && dep > 0 && (
                        <div className="flex justify-between text-sm border-t border-orange-200 pt-1.5">
                          <span className="text-purple-600">Deposit <span className="text-[10px] font-normal">(dikembalikan)</span></span>
                          <span className="font-semibold text-purple-700">Rp {dep.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-orange-300 pt-1.5 mt-0.5">
                        <span className="font-bold text-orange-700">Total Pembayaran</span>
                        <span className="text-xl font-bold text-orange-700">Rp {total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Opsi bayar */}
                    <p className="text-xs font-bold text-gray-600">Pilih Metode Pembayaran:</p>

                    {/* Cash */}
                    <div className="flex items-center gap-3 border border-gray-200 rounded-xl p-3">
                      <span className="text-2xl">💵</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">Tunai / Cash</p>
                        <p className="text-xs text-gray-400">Bayar langsung saat pengambilan kendaraan</p>
                      </div>
                    </div>

                    {/* Transfer & Dana */}
                    {REKENING.map((rek) => (
                      <div key={rek.id} className={`flex items-center gap-3 border rounded-xl p-3 ${rek.warna}`}>
                        {rek.logoUrl
                          ? <img src={rek.logoUrl} alt={rek.label} className="w-10 h-10 object-contain rounded-xl" />
                          : <span className="text-2xl">{rek.icon}</span>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800">{rek.label}</p>
                          <p className="text-base font-bold font-mono text-gray-900 tracking-wide">{rek.no}</p>
                          <p className="text-xs text-gray-500">a.n. {rek.nama}</p>
                        </div>
                        <CopyBtn text={rek.no} />
                      </div>
                    ))}

                    <p className="text-[11px] text-gray-400 text-center">
                      Setelah transfer, simpan bukti pembayaran dan tunjukkan saat pengambilan
                    </p>
                  </div>
                  );
                })()}

                <p className="text-[11px] text-gray-300 pt-1">
                  Dipesan: {fmtDateTime(r.created_at)}
                </p>

                {/* Pesan status */}
                {r.status === 'APPROVED' && !ada_harga && (
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-green-700 font-medium">
                      Pesanan disetujui! Tim kami akan menghubungi kamu segera.
                    </p>
                  </div>
                )}
                {r.status === 'PENDING' && (
                  <div className="space-y-2">
                    <div className="bg-yellow-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-yellow-700">
                        Sedang diproses. Estimasi konfirmasi: <strong>15 menit</strong>
                      </p>
                    </div>
                    {cancelId === r.id ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs text-red-700 font-semibold text-center">Yakin ingin membatalkan pesanan ini?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCancelId(null)}
                            className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold"
                          >
                            Tidak
                          </button>
                          <button
                            onClick={() => handleCancel(r.id)}
                            disabled={cancelling}
                            className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1"
                          >
                            {cancelling ? <Loader className="w-3 h-3 animate-spin" /> : null}
                            Ya, Batalkan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancelId(r.id)}
                        className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-semibold active:scale-[0.98] transition"
                      >
                        Batalkan Pesanan
                      </button>
                    )}
                  </div>
                )}
                {r.status === 'REJECTED' && (
                  <div className="pt-1">
                    <a
                      href={`https://wa.me/${ADMIN_WA_NUMBER}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-green-500 text-white text-center text-sm font-bold py-2.5 rounded-xl"
                    >
                      Hubungi Kami via WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {searched && (
          <button
            onClick={() => navigate('/booking')}
            className="w-full border-2 border-orange-200 text-orange-500 font-bold py-3.5 rounded-xl text-sm active:scale-[0.98] transition"
          >
            + Buat Pesanan Baru
          </button>
        )}
      </div>
    </div>
  );
}
