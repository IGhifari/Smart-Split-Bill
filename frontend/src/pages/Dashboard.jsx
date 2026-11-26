import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { deleteBill, getBills } from '../api/billApi';
import BillCard from '../components/BillCard';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency } from '../utils/formatCurrency';

function DashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat daftar tagihan"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="h-5 w-2/3 rounded-lg bg-slate-200" />
          <div className="mt-2 h-3.5 w-1/3 rounded-lg bg-slate-100" />
          <div className="mt-6 h-8 w-1/2 rounded-lg bg-slate-200" />
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <div className="h-5 w-20 rounded-full bg-slate-100" />
              <div className="h-4 w-16 rounded-lg bg-slate-100" />
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ showToast }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [billToDelete, setBillToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBills() {
      try {
        const data = await getBills();
        if (!active) return;
        setBills(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Gagal memuat daftar tagihan.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBills();
    return () => {
      active = false;
    };
  }, [reloadTick]);

  function handleRetry() {
    setLoading(true);
    setError('');
    setReloadTick((prev) => prev + 1);
  }

  const stats = useMemo(() => {
    const totalBills = bills.length;
    const totalAmount = bills.reduce(
      (sum, bill) => sum + (Number(bill.grand_total) || 0),
      0
    );
    const unpaidBills = bills.filter((bill) => {
      const total = Number(bill.total_participants) || 0;
      const paid = Number(bill.paid_participants) || 0;
      return total === 0 || paid < total;
    }).length;

    return { totalBills, totalAmount, unpaidBills };
  }, [bills]);

  const filteredBills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bills;
    return bills.filter((bill) => bill.title?.toLowerCase().includes(query));
  }, [bills, searchQuery]);

  async function handleConfirmDelete() {
    if (!billToDelete) return;
    setDeleting(true);
    try {
      await deleteBill(billToDelete.id);
      setBills((prev) => prev.filter((item) => item.id !== billToDelete.id));
      showToast(`Tagihan "${billToDelete.title}" berhasil dihapus.`, 'success');
      setBillToDelete(null);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus tagihan.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Ringkasan */}
      <section aria-labelledby="dashboard-heading">
        <div>
          <h1
            id="dashboard-heading"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            Daftar Tagihan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola patungan, pantau status pelunasan, dan bagikan rincian secara adil.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Tagihan
              </span>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
              >
                <Receipt className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
              {stats.totalBills}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Tagihan tersimpan</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Nominal
              </span>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
              >
                <Wallet className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(stats.totalAmount)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Akumulasi grand total</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Belum Lunas Semua
              </span>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
              >
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
              {stats.unpaidBills}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Menunggu pelunasan</p>
          </div>
        </div>
      </section>

      {/* Pencarian */}
      {!error && bills.length > 0 && (
        <div className="relative">
          <label htmlFor="bill-search" className="sr-only">
            Cari judul tagihan
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
          />
          <input
            id="bill-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul tagihan atau nama tempat..."
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-11 pl-10 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="absolute top-1/2 right-1.5 inline-flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Konten Daftar Tagihan */}
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-8 text-center"
        >
          <span
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"
          >
            <AlertCircle className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            Gagal Memuat Tagihan
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-blue-700 active:scale-[0.98]"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : bills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
          >
            <Receipt className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Belum Ada Tagihan
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-600">
            Buat tagihan patungan pertama Anda untuk menghitung pembagian pajak, service, dan diskon secara otomatis.
          </p>
          <Link
            to="/create"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            <span>Buat Tagihan Pertama</span>
          </Link>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            Tidak ada tagihan yang cocok dengan &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onDeleteClick={(selected) => setBillToDelete(selected)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(billToDelete)}
        title="Hapus Tagihan"
        message={`Tagihan "${billToDelete?.title || ''}" beserta seluruh peserta dan itemnya akan dihapus permanen. Lanjutkan?`}
        confirmText="Ya, Hapus"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBillToDelete(null)}
      />
    </div>
  );
}
