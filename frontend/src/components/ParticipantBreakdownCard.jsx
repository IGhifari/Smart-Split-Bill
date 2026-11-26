import { CheckCircle2, Clock, Loader2, Share2, User } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export default function ParticipantBreakdownCard({
  participant,
  isUpdating,
  onTogglePaid,
}) {
  const isPaid = Boolean(participant.is_paid);

  return (
    <article
      className={`rounded-2xl border bg-white p-5 transition-colors duration-150 ${
        isPaid ? 'border-emerald-200' : 'border-slate-200'
      }`}
    >
      {/* Header Peserta */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {participant.name?.charAt(0)?.toUpperCase() || (
              <User className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {participant.name}
            </h3>
            <p className="text-xs text-slate-500 tabular-nums">
              {participant.items.length} item pesanan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-xs font-medium text-slate-500">
              Total Bayar
            </span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {formatCurrency(participant.total_due)}
            </span>
          </div>

          <button
            type="button"
            disabled={isUpdating}
            aria-pressed={isPaid}
            aria-label={`Ubah status pembayaran ${participant.name}, saat ini ${
              isPaid ? 'Lunas' : 'Belum Lunas'
            }`}
            onClick={() => onTogglePaid(participant)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-9 ${
              isPaid
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            {isUpdating ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : isPaid ? (
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span>{isPaid ? 'Lunas' : 'Belum Lunas'}</span>
          </button>
        </div>
      </div>

      {/* Daftar Item Peserta */}
      <div className="mt-4">
        {participant.items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
            Peserta ini tidak memiliki item pesanan.
          </p>
        ) : (
          <ul className="space-y-2">
            {participant.items.map((item) => {
              const isShared = item.share_count > 1;
              return (
                <li
                  key={`${participant.id}-${item.item_id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/90 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-slate-900">
                        {item.name}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                          isShared
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {isShared && <Share2 aria-hidden="true" className="h-3 w-3" />}
                        {isShared ? `Sharing 1/${item.share_count}` : 'Pribadi'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                      {item.quantity} &times; {formatCurrency(item.price)}
                      {isShared ? ` (total ${formatCurrency(item.item_total)})` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(item.share_amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Rincian Proporsional */}
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <dt className="text-slate-500">Subtotal</dt>
          <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums">
            {formatCurrency(participant.subtotal)}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <dt className="text-slate-500">Porsi Pajak</dt>
          <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums">
            +{formatCurrency(participant.tax_share)}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <dt className="text-slate-500">Porsi Service</dt>
          <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums">
            +{formatCurrency(participant.service_share)}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <dt className="text-slate-500">Porsi Diskon</dt>
          <dd className="mt-0.5 font-semibold text-emerald-700 tabular-nums">
            -{formatCurrency(participant.discount_share)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
