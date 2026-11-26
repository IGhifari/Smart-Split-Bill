import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Trash2,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatShortDate } from '../utils/formatCurrency';

export default function BillCard({ bill, onDeleteClick }) {
  const totalParticipants = Number(bill.total_participants) || 0;
  const paidParticipants = Number(bill.paid_participants) || 0;
  const progress =
    totalParticipants > 0
      ? Math.round((paidParticipants / totalParticipants) * 100)
      : 0;
  const isAllPaid =
    totalParticipants > 0 && paidParticipants >= totalParticipants;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-150 hover:border-blue-300 hover:shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900">
              <Link
                to={`/bills/${bill.id}`}
                className="block truncate rounded-md transition-colors duration-150 after:absolute after:inset-0 after:rounded-2xl group-hover:text-blue-600 focus-visible:outline-none"
              >
                {bill.title}
              </Link>
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span>{formatShortDate(bill.created_at)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onDeleteClick(bill)}
            title="Hapus tagihan"
            aria-label={`Hapus tagihan ${bill.title}`}
            className="relative z-10 -mt-1 -mr-1 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-600 sm:min-h-9 sm:min-w-9"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Grand Total
          </span>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(bill.grand_total)}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
              isAllPaid
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            {isAllPaid ? (
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span className="tabular-nums">
              {paidParticipants}/{totalParticipants} Lunas
            </span>
          </span>

          <span className="inline-flex items-center gap-1 text-slate-600">
            <Users aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />
            <span className="tabular-nums">{totalParticipants} orang</span>
            <ChevronRight
              aria-hidden="true"
              className="ml-0.5 h-4 w-4 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-blue-600"
            />
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress pelunasan ${bill.title}`}
          className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isAllPaid ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </article>
  );
}
