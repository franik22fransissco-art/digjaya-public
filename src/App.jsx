import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing   from './pages/Landing';
import Booking   from './pages/Booking';
import CekStatus from './pages/CekStatus';
import SK        from './pages/SK';
import BottomNav from './components/BottomNav';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/booking"    element={<Booking />} />
        <Route path="/cek-status" element={<CekStatus />} />
        <Route path="/sk"         element={<SK />} />
        <Route path="*"           element={<Landing />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
