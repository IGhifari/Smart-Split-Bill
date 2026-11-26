import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  deleteBill,
  getBillById,
  updateParticipantStatus,
} from '../api/billApi';
import ConfirmModal from '../components/ConfirmModal';
import ParticipantBreakdownCard from '../components/ParticipantBreakdownCard';
import { formatCurrency, formatDate } from '../utils/formatCurrency';
import { formatWhatsAppSummary } from '../utils/whatsappFormat';

function DetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat detail tagihan"
      className="animate-pulse space-y-6"
    >
      <div className="h-10 w-1/2 rounded-xl bg-slate-200" />
      <div className="h-44 rounded-2xl border border-slate-200 bg-white p-6" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-52 rounded-2xl border border-slate-200 bg-white p-5" />
        <div className="h-52 rounded-2xl border border-slate-200 bg-white p-5" />
      </div>
    </div>
  );
}

export default function BillDetail({ showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [showFormula, setShowFormula] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      try {
        const data = await getBillById(id);
        if (!active) return;
        setDetail(data);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Gagal memuat detail tagihan.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      active = false;
    };
  }, [id, reloadTick]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  function handleRetry() {
    setLoading(true);
    setError('');
    setReloadTick((prev) => prev + 1);
  }

  const paymentStats = useMemo(() => {
    const participants = detail?.participants || [];
    const total = participants.length;
    const paid = participants.filter((p) => p.is_paid).length;
    const progress = total > 0 ? Math.round((paid / total) * 100) : 0;
    return {
      total,
      paid,
      progress,
      isAllPaid: total > 0 && paid >= total,
    };
  }, [detail]);

  async function handleCopyWhatsApp() {
    if (!detail) return;
    const text = formatWhatsAppSummary(detail);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast('Ringkasan berhasil disalin. Siap ditempel ke WhatsApp!', 'success');
    } catch {
      showToast('Gagal menyalin teks ke clipboard.', 'error');
    }
  }

  async function handleTogglePaid(participant) {
    const nextPaid = !participant.is_paid;
    setUpdatingIds((prev) => new Set(prev).add(participant.id));

    try {
      await updateParticipantStatus(participant.id, nextPaid);
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map((item) =>
            item.id === participant.id ? { ...item, is_paid: nextPaid } : item
          ),
        };
      });
      showToast(
        `${participant.name} ditandai ${nextPaid ? 'Lunas' : 'Belum Lunas'}.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status pembayaran.', 'error');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(participant.id);
        return next;
      });
    }
  }

  async function handleConfirmDelete() {
    if (!detail?.bill) return;
    setDeleting(true);
    try {
      await deleteBill(detail.bill.id);
      showToast(`Tagihan "${detail.bill.title}" berhasil dihapus.`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      showToast(err.message || 'Gagal menghapus tagihan.', 'error');
      setDeleting(false);
    }
  }

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !detail) {
    return (
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
        <h1 className="mt-4 text-lg font-bold text-slate-900">
          Tagihan Tidak Dapat Dimuat
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
          {error || 'Data tagihan tidak ditemukan.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            <span>Coba Lagi</span>
          </button>
        </div>
      </div>
    );
  }

  const { bill, summary, participants } = detail;

  return (
    <div className="space-y-6">
      {/* Header Detail */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/"
            aria-label="Kembali ke Dashboard"
            className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 sm:h-9 sm:w-9"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {bill.title}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <Calendar aria-hidden="true" className="h-4 w-4 text-slate-500" />
              <span>{formatDate(bill.created_at)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-[0.98] sm:min-h-10"
          >
            {copied ? (
              <Check aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" />
            )}
            <span>{copied ? 'Tersalin!' : 'Salin ke WhatsApp'}</span>
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors duration-150 hover:bg-rose-50 sm:min-h-10"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            <span>Hapus Tagihan</span>
          </button>
        </div>
      </header>

      {/* Kartu Ringkasan Tagihan */}
      <section
        aria-label="Ringkasan total tagihan"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Grand Total Tagihan
            </span>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {formatCurrency(summary.grand_total)}
            </p>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span
                  className={`inline-flex items-center gap-1 ${
                    paymentStats.isAllPaid ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  {paymentStats.isAllPaid && (
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  Status Pelunasan
                </span>
                <span className="text-slate-900 tabular-nums">
                  {paymentStats.paid}/{paymentStats.total} Lunas ({paymentStats.progress}%)
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={paymentStats.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress pelunasan tagihan"
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    paymentStats.isAllPaid ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${paymentStats.progress}%` }}
                />
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-8">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <dt className="text-xs text-slate-500">Subtotal Item</dt>
              <dd className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                {formatCurrency(summary.subtotal)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <dt className="text-xs text-slate-500">
                Pajak ({bill.tax_percent}%)
              </dt>
              <dd className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                +{formatCurrency(summary.tax_amount)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <dt className="text-xs text-slate-500">
                Service ({bill.service_percent}%)
              </dt>
              <dd className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                +{formatCurrency(summary.service_amount)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <dt className="text-xs text-slate-500">Diskon</dt>
              <dd className="mt-1 text-base font-bold text-emerald-700 tabular-nums">
                -{formatCurrency(summary.discount_amount)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Accordion Cara Perhitungan */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setShowFormula((prev) => !prev)}
          aria-expanded={showFormula}
          aria-controls="formula-panel"
          className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors duration-150 hover:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
            >
              <Calculator className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Cara Perhitungan Proporsional
              </h2>
              <p className="text-xs text-slate-500">
                Lihat rumus pembagian adil untuk pajak, service, dan diskon
              </p>
            </div>
          </div>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
              showFormula ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showFormula && (
          <div
            id="formula-panel"
            className="animate-fade-in border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-sm leading-relaxed text-slate-700"
          >
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <span className="font-semibold text-slate-900">Subtotal Item:</span>{' '}
                Setiap item dihitung dari{' '}
                <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-900">
                  harga &times; qty
                </code>{' '}
                lalu dibagi rata ke jumlah peserta yang ikut item tersebut (
                <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-900">
                  Sharing 1/n
                </code>
                ).
              </li>
              <li>
                <span className="font-semibold text-slate-900">Rasio Proporsi:</span>{' '}
                Tiap peserta mendapat bobot{' '}
                <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-900">
                  rasio = subtotal peserta / total subtotal
                </code>{' '}
                sehingga yang memesan lebih besar menanggung porsi tambahan secara adil.
              </li>
              <li>
                <span className="font-semibold text-slate-900">
                  Pajak, Service &amp; Diskon:
                </span>{' '}
                Total pajak (<span className="tabular-nums">{bill.tax_percent}%</span>),
                service (<span className="tabular-nums">{bill.service_percent}%</span>),
                dan diskon (
                <span className="tabular-nums">
                  {formatCurrency(summary.discount_amount)}
                </span>
                ) dikalikan dengan{' '}
                <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-900">
                  rasio
                </code>{' '}
                masing-masing peserta.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Total Bayar Akhir:</span>{' '}
                <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-900">
                  Math.round(Math.max(0, subtotal + pajak + service - diskon))
                </code>
                .
              </li>
            </ol>
          </div>
        )}
      </section>

      {/* Daftar Rincian Per Peserta */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            Rincian Per Peserta ({participants.length})
          </h2>
          <span className="text-xs text-slate-600">
            Klik status untuk menandai lunas / belum lunas
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {participants.map((participant) => (
            <ParticipantBreakdownCard
              key={participant.id}
              participant={participant}
              isUpdating={updatingIds.has(participant.id)}
              onTogglePaid={handleTogglePaid}
            />
          ))}
        </div>
      </section>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Hapus Tagihan"
        message={`Tagihan "${bill.title}" beserta seluruh rincian peserta dan item akan dihapus permanen. Lanjutkan?`}
        confirmText="Ya, Hapus"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
