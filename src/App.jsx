import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Landing   from './pages/Landing';
import Booking   from './pages/Booking';
import CekStatus from './pages/CekStatus';
import SK        from './pages/SK';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const location = useLocation();
  return (
    <>
      <ErrorBoundary resetKey={location.pathname} homeHref="/" homeLabel="Beranda">
        <Routes>
          <Route path="/"           element={<Landing />} />
          <Route path="/booking"    element={<Booking />} />
          <Route path="/cek-status" element={<CekStatus />} />
          <Route path="/sk"         element={<SK />} />
          <Route path="*"           element={<Landing />} />
        </Routes>
      </ErrorBoundary>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
