import { useCallback, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import BillDetail from './pages/BillDetail';
import CreateBill from './pages/CreateBill';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-blue-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Lewati ke konten utama
        </a>

        <Navbar />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8"
        >
          <Routes>
            <Route path="/" element={<Dashboard showToast={showToast} />} />
            <Route
              path="/create"
              element={<CreateBill showToast={showToast} />}
            />
            <Route
              path="/bills/:id"
              element={<BillDetail showToast={showToast} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Toast toast={toast} onClose={clearToast} />
      </div>
    </BrowserRouter>
  );
}
