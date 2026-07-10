import { Component } from 'react';

/**
 * Reusable Error Boundary — menangkap runtime error di render/effect anak-anaknya
 * dan menampilkan fallback, bukan membiarkan seluruh aplikasi jadi blank.
 *
 * Props:
 * - resetKey  : nilai apa pun; saat berubah, boundary otomatis reset (mis. path route
 *               aktif) supaya navigasi menjauh dari halaman yang crash langsung pulih.
 * - homeHref  : href tombol "kembali" di fallback.
 * - homeLabel : label tujuan tombol "kembali", mis. "Beranda".
 * - fallback  : komponen fallback kustom (opsional). Default: DefaultFallback di bawah.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultFallback;
      return <Fallback homeHref={this.props.homeHref} homeLabel={this.props.homeLabel} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ homeHref, homeLabel }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-10">
      <p className="text-4xl mb-3">⚠️</p>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Terjadi kesalahan</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        Halaman ini mengalami masalah tak terduga. Coba muat ulang{homeLabel ? `, atau kembali ke ${homeLabel}` : ''}.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
        >
          Muat Ulang
        </button>
        {homeHref && (
          <a
            href={homeHref}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            Kembali ke {homeLabel || 'Beranda'}
          </a>
        )}
      </div>
    </div>
  );
}
