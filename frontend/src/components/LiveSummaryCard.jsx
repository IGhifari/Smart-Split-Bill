import { Calculator, Users } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export default function LiveSummaryCard({
  title,
  taxPercent,
  servicePercent,
  preview,
}) {
  const { summary, participants } = preview;

  return (
    <aside
      aria-label="Ringkasan live preview tagihan"
      className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
          >
            <Calculator className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">
              Live Preview Tagihan
            </h2>
            <p className="truncate text-xs text-slate-500">
              {title?.trim() || 'Hitung otomatis saat form diisi'}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          Real-time
        </span>
      </div>

      {/* Estimasi Grand Total */}
      <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
        <span className="text-xs font-medium text-slate-300">
          Estimasi Grand Total
        </span>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
          {formatCurrency(summary.grand_total)}
        </p>
      </div>

      {/* Rincian Biaya */}
      <dl className="mt-4 space-y-2 border-b border-slate-100 pb-4 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <dt>Subtotal Item</dt>
          <dd className="font-medium text-slate-900 tabular-nums">
            {formatCurrency(summary.subtotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <dt>Pajak ({Number(taxPercent) || 0}%)</dt>
          <dd className="font-medium text-slate-900 tabular-nums">
            +{formatCurrency(summary.tax_amount)}
          </dd>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <dt>Service ({Number(servicePercent) || 0}%)</dt>
          <dd className="font-medium text-slate-900 tabular-nums">
            +{formatCurrency(summary.service_amount)}
          </dd>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <dt>Diskon</dt>
          <dd className="font-medium text-emerald-700 tabular-nums">
            -{formatCurrency(summary.discount_amount)}
          </dd>
        </div>
      </dl>

      {/* Estimasi Per Peserta */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Users aria-hidden="true" className="h-3.5 w-3.5" />
            Rincian Per Peserta
          </span>
          <span className="tabular-nums">{participants.length} orang</span>
        </div>

        {participants.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
            Tambahkan peserta dan pilih menu untuk melihat estimasi bayar per orang.
          </p>
        ) : (
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {participants.map((person) => {
              const percent = Math.round((person.ratio || 0) * 100);
              return (
                <li
                  key={person.name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {person.name}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {person.items.length} item &middot; porsi {percent}%
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-blue-700 tabular-nums">
                    {formatCurrency(person.total_due)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
