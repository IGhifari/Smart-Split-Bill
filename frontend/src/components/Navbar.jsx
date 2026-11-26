import { LayoutDashboard, Plus, ReceiptText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/';
  const isCreate = pathname === '/create';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="group flex min-h-11 items-center gap-2.5 rounded-xl text-slate-900 transition-opacity duration-150 hover:opacity-90"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition-transform duration-150 group-hover:scale-[1.03]"
          >
            <ReceiptText className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-slate-900">
              Smart Split Bill
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              Patungan Adil &amp; Proporsional
            </span>
          </div>
        </Link>

        <nav aria-label="Navigasi utama" className="flex items-center gap-2 sm:gap-3">
          {!isDashboard && (
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:min-h-10"
            >
              <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-slate-500" />
              <span>Dashboard</span>
            </Link>
          )}

          {!isCreate && (
            <Link
              to="/create"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition-all duration-150 hover:bg-blue-700 active:scale-[0.98] sm:min-h-10"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              <span>Buat Tagihan</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
