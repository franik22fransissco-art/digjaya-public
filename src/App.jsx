import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing   from './pages/Landing';
import Booking   from './pages/Booking';
import CekStatus from './pages/CekStatus';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/booking"    element={<Booking />} />
        <Route path="/cek-status" element={<CekStatus />} />
        <Route path="*"           element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
