import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Save,
  Trash2,
  UserPlus,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createBill } from '../api/billApi';
import LiveSummaryCard from '../components/LiveSummaryCard';
import { calculateSplit } from '../utils/calculateSplit';
import { formatCurrency } from '../utils/formatCurrency';

const TAX_PRESETS = [0, 10, 11];
const SERVICE_PRESETS = [0, 5];

function createEmptyItem() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    price: '',
    quantity: 1,
    sharedBy: [],
  };
}

export default function CreateBill({ showToast }) {
  const navigate = useNavigate();
  const errorSummaryRef = useRef(null);

  // Bagian 1: Info Tagihan
  const [title, setTitle] = useState('');
  const [taxPercent, setTaxPercent] = useState(10);
  const [servicePercent, setServicePercent] = useState(5);
  const [discountAmount, setDiscountAmount] = useState('');

  // Bagian 2: Peserta Patungan
  const [participants, setParticipants] = useState([]);
  const [participantInput, setParticipantInput] = useState('');
  const [participantError, setParticipantError] = useState('');

  // Bagian 3: Daftar Menu/Item
  const [items, setItems] = useState([createEmptyItem()]);

  // Validasi terstruktur (inline + focusable error summary)
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorSummary, setErrorSummary] = useState([]);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live Preview kalkulasi proporsional
  const preview = useMemo(
    () =>
      calculateSplit({
        tax_percent: Number(taxPercent) || 0,
        service_percent: Number(servicePercent) || 0,
        discount_amount: Number(discountAmount) || 0,
        participants,
        items,
      }),
    [taxPercent, servicePercent, discountAmount, participants, items]
  );

  function clearFieldError(key) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setServerError('');
  }

  function clearItemError(itemId, field) {
    setFieldErrors((prev) => {
      if (!prev.items?.[itemId]?.[field]) return prev;
      const nextItemErrors = { ...prev.items[itemId] };
      delete nextItemErrors[field];
      const nextItems = { ...prev.items };
      if (Object.keys(nextItemErrors).length === 0) {
        delete nextItems[itemId];
      } else {
        nextItems[itemId] = nextItemErrors;
      }
      return { ...prev, items: nextItems };
    });
    setServerError('');
  }

  function handleAddParticipant() {
    const cleanName = participantInput.trim();
    if (!cleanName) {
      setParticipantError('Nama peserta tidak boleh kosong.');
      return;
    }
    const exists = participants.some(
      (name) => name.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      setParticipantError(`Peserta "${cleanName}" sudah ada di daftar.`);
      return;
    }

    setParticipants((prev) => [...prev, cleanName]);
    setParticipantInput('');
    setParticipantError('');
    clearFieldError('participants');
  }

  function handleParticipantKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddParticipant();
    }
  }

  function handleRemoveParticipant(nameToRemove) {
    setParticipants((prev) => prev.filter((name) => name !== nameToRemove));
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        sharedBy: item.sharedBy.filter((name) => name !== nameToRemove),
      }))
    );
  }

  function handleAddItem() {
    setItems((prev) => [...prev, createEmptyItem()]);
  }

  function handleRemoveItem(itemId) {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== itemId);
    });
  }

  function handleItemFieldChange(itemId, field, value) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
    clearItemError(itemId, field);
  }

  function handleToggleParticipantOnItem(itemId, participantName) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const alreadySelected = item.sharedBy.includes(participantName);
        return {
          ...item,
          sharedBy: alreadySelected
            ? item.sharedBy.filter((name) => name !== participantName)
            : [...item.sharedBy, participantName],
        };
      })
    );
    clearItemError(itemId, 'sharedBy');
  }

  function handleToggleSelectAllOnItem(itemId) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const isAllSelected =
          participants.length > 0 && item.sharedBy.length === participants.length;
        return {
          ...item,
          sharedBy: isAllSelected ? [] : [...participants],
        };
      })
    );
    clearItemError(itemId, 'sharedBy');
  }

  function validateForm() {
    const errors = {};
    const summary = [];

    if (!title.trim()) {
      errors.title = 'Judul tagihan atau nama tempat wajib diisi.';
      summary.push({ targetId: 'bill-title', message: errors.title });
    }

    const parsedTax = Number(taxPercent) || 0;
    const parsedService = Number(servicePercent) || 0;
    const parsedDiscount = Number(discountAmount) || 0;

    if (parsedTax < 0 || parsedTax > 100) {
      errors.taxPercent = 'Pajak (%) harus antara 0 sampai 100.';
      summary.push({ targetId: 'tax-percent', message: errors.taxPercent });
    }
    if (parsedService < 0 || parsedService > 100) {
      errors.servicePercent = 'Service (%) harus antara 0 sampai 100.';
      summary.push({ targetId: 'service-percent', message: errors.servicePercent });
    }
    if (parsedDiscount < 0) {
      errors.discountAmount = 'Diskon tidak boleh bernilai negatif.';
      summary.push({ targetId: 'discount-amount', message: errors.discountAmount });
    }

    if (participants.length === 0) {
      errors.participants = 'Tambahkan minimal 1 peserta patungan.';
      summary.push({
        targetId: 'participant-input',
        message: errors.participants,
      });
    }

    const itemErrors = {};
    items.forEach((item, i) => {
      const num = i + 1;
      const label = item.name.trim() ? `"${item.name.trim()}"` : `#${num}`;
      const rowErrors = {};

      if (!item.name.trim()) {
        rowErrors.name = `Nama item #${num} wajib diisi.`;
        summary.push({
          targetId: `item-name-${item.id}`,
          message: rowErrors.name,
        });
      }

      const price = Number(item.price);
      if (item.price === '' || !Number.isFinite(price) || price < 0) {
        rowErrors.price = `Harga item ${label} harus angka >= 0.`;
        summary.push({
          targetId: `item-price-${item.id}`,
          message: rowErrors.price,
        });
      }

      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        rowErrors.quantity = `Qty item ${label} minimal 1.`;
        summary.push({
          targetId: `item-qty-${item.id}`,
          message: rowErrors.quantity,
        });
      }

      if (item.sharedBy.length === 0) {
        rowErrors.sharedBy = `Pilih minimal 1 peserta untuk item ${label}.`;
        summary.push({
          targetId: `item-share-${item.id}`,
          message: rowErrors.sharedBy,
        });
      }

      if (Object.keys(rowErrors).length > 0) {
        itemErrors[item.id] = rowErrors;
      }
    });

    if (Object.keys(itemErrors).length > 0) {
      errors.items = itemErrors;
    }

    return { errors, summary };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { errors, summary } = validateForm();

    if (summary.length > 0) {
      setFieldErrors(errors);
      setErrorSummary(summary);
      setServerError('');
      requestAnimationFrame(() => {
        errorSummaryRef.current?.focus();
      });
      return;
    }

    setFieldErrors({});
    setErrorSummary([]);
    setServerError('');
    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        tax_percent: Number(taxPercent) || 0,
        service_percent: Number(servicePercent) || 0,
        discount_amount: Number(discountAmount) || 0,
        participants,
        items: items.map((item) => ({
          name: item.name.trim(),
          price: Number(item.price),
          quantity: Number(item.quantity),
          sharedBy: item.sharedBy,
        })),
      };

      const created = await createBill(payload);
      showToast('Tagihan berhasil disimpan.', 'success');
      navigate(`/bills/${created.id}`);
    } catch (err) {
      setServerError(err.message || 'Gagal menyimpan tagihan.');
      showToast(err.message || 'Gagal menyimpan tagihan.', 'error');
      requestAnimationFrame(() => {
        errorSummaryRef.current?.focus();
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 sm:h-9 sm:w-9"
          aria-label="Kembali ke Dashboard"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Buat Tagihan Baru
          </h1>
          <p className="text-sm text-slate-600">
            Isi info tagihan, peserta, dan daftar menu untuk menghitung patungan otomatis.
          </p>
        </div>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-12"
      >
        {/* Kolom Kiri: Form 3 Langkah */}
        <div className="space-y-6 lg:col-span-7">
          {/* Focusable Error Summary */}
          {(errorSummary.length > 0 || serverError) && (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              role="alert"
              aria-labelledby="form-error-heading"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-900 focus:outline-none"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                />
                <div className="flex-1">
                  <h2
                    id="form-error-heading"
                    className="font-semibold text-rose-900"
                  >
                    {serverError
                      ? 'Gagal menyimpan tagihan'
                      : 'Periksa kembali isian berikut:'}
                  </h2>
                  {serverError ? (
                    <p className="mt-1 text-rose-800">{serverError}</p>
                  ) : (
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-rose-800">
                      {errorSummary.map((item) => (
                        <li key={`${item.targetId}-${item.message}`}>
                          <a
                            href={`#${item.targetId}`}
                            className="underline decoration-rose-400 underline-offset-2 hover:text-rose-950"
                          >
                            {item.message}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bagian 1: Info Tagihan */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white"
              >
                1
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Info Tagihan
                </h2>
                <p className="text-xs text-slate-500">
                  Nama tempat serta pengaturan pajak, service, dan diskon.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="bill-title"
                  className="block text-sm font-medium text-slate-700"
                >
                  Judul / Nama Tempat <span className="text-rose-600">*</span>
                </label>
                <input
                  id="bill-title"
                  type="text"
                  value={title}
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={fieldErrors.title ? 'bill-title-err' : undefined}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearFieldError('title');
                  }}
                  placeholder="Contoh: Makan Malam Tim di Sate Khas"
                  maxLength={150}
                  className={`mt-1.5 min-h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:outline-none ${
                    fieldErrors.title
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                {fieldErrors.title && (
                  <p
                    id="bill-title-err"
                    className="mt-1.5 text-xs font-medium text-rose-600"
                  >
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Pajak */}
                <div>
                  <label
                    htmlFor="tax-percent"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Pajak (%)
                  </label>
                  <input
                    id="tax-percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={taxPercent}
                    aria-invalid={Boolean(fieldErrors.taxPercent)}
                    aria-describedby={
                      fieldErrors.taxPercent ? 'tax-percent-err' : undefined
                    }
                    onChange={(e) => {
                      setTaxPercent(e.target.value);
                      clearFieldError('taxPercent');
                    }}
                    className={`mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 tabular-nums focus:ring-2 focus:outline-none sm:min-h-10 ${
                      fieldErrors.taxPercent
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TAX_PRESETS.map((preset) => {
                      const active = Number(taxPercent) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setTaxPercent(preset);
                            clearFieldError('taxPercent');
                          }}
                          className={`min-h-9 rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums transition-colors duration-150 sm:min-h-7 ${
                            active
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {preset}%
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.taxPercent && (
                    <p
                      id="tax-percent-err"
                      className="mt-1.5 text-xs font-medium text-rose-600"
                    >
                      {fieldErrors.taxPercent}
                    </p>
                  )}
                </div>

                {/* Service */}
                <div>
                  <label
                    htmlFor="service-percent"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Service (%)
                  </label>
                  <input
                    id="service-percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={servicePercent}
                    aria-invalid={Boolean(fieldErrors.servicePercent)}
                    aria-describedby={
                      fieldErrors.servicePercent ? 'service-percent-err' : undefined
                    }
                    onChange={(e) => {
                      setServicePercent(e.target.value);
                      clearFieldError('servicePercent');
                    }}
                    className={`mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 tabular-nums focus:ring-2 focus:outline-none sm:min-h-10 ${
                      fieldErrors.servicePercent
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SERVICE_PRESETS.map((preset) => {
                      const active = Number(servicePercent) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setServicePercent(preset);
                            clearFieldError('servicePercent');
                          }}
                          className={`min-h-9 rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums transition-colors duration-150 sm:min-h-7 ${
                            active
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {preset}%
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.servicePercent && (
                    <p
                      id="service-percent-err"
                      className="mt-1.5 text-xs font-medium text-rose-600"
                    >
                      {fieldErrors.servicePercent}
                    </p>
                  )}
                </div>

                {/* Diskon */}
                <div>
                  <label
                    htmlFor="discount-amount"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Diskon (Rp)
                  </label>
                  <input
                    id="discount-amount"
                    type="number"
                    min="0"
                    step="500"
                    value={discountAmount}
                    aria-invalid={Boolean(fieldErrors.discountAmount)}
                    aria-describedby={
                      fieldErrors.discountAmount
                        ? 'discount-amount-err'
                        : 'discount-amount-help'
                    }
                    onChange={(e) => {
                      setDiscountAmount(e.target.value);
                      clearFieldError('discountAmount');
                    }}
                    placeholder="0"
                    className={`mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 tabular-nums placeholder:text-slate-500 focus:ring-2 focus:outline-none sm:min-h-10 ${
                      fieldErrors.discountAmount
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {fieldErrors.discountAmount ? (
                    <p
                      id="discount-amount-err"
                      className="mt-1.5 text-xs font-medium text-rose-600"
                    >
                      {fieldErrors.discountAmount}
                    </p>
                  ) : (
                    <p
                      id="discount-amount-help"
                      className="mt-2 text-xs text-slate-500"
                    >
                      Dibagi proporsional
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Bagian 2: Peserta Patungan */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white"
              >
                2
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Peserta Patungan
                </h2>
                <p className="text-xs text-slate-500">
                  Tambahkan semua orang yang ikut makan atau patungan.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="participant-input" className="sr-only">
                Nama peserta
              </label>
              <div className="flex gap-2">
                <input
                  id="participant-input"
                  type="text"
                  value={participantInput}
                  aria-invalid={Boolean(participantError || fieldErrors.participants)}
                  aria-describedby={
                    participantError || fieldErrors.participants
                      ? 'participant-err'
                      : undefined
                  }
                  onChange={(e) => {
                    setParticipantInput(e.target.value);
                    setParticipantError('');
                  }}
                  onKeyDown={handleParticipantKeyDown}
                  placeholder="Ketik nama peserta lalu tekan Enter..."
                  maxLength={100}
                  className={`min-h-11 flex-1 rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:outline-none ${
                    participantError || fieldErrors.participants
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-slate-800 active:scale-[0.98]"
                >
                  <UserPlus aria-hidden="true" className="h-4 w-4" />
                  <span>Tambah</span>
                </button>
              </div>

              {(participantError || fieldErrors.participants) && (
                <p
                  id="participant-err"
                  className="mt-2 text-xs font-medium text-rose-600"
                >
                  {participantError || fieldErrors.participants}
                </p>
              )}

              {participants.length === 0 ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
                  <Users aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>Belum ada peserta. Tambahkan minimal 1 nama peserta.</span>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {participants.map((name) => (
                    <span
                      key={name}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 py-1 pr-1.5 pl-3 text-sm font-medium text-blue-900"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(name)}
                        aria-label={`Hapus peserta ${name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-blue-700 transition-colors hover:bg-blue-200/80 hover:text-blue-950"
                      >
                        <X aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Bagian 3: Daftar Menu / Item */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white"
                >
                  3
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Daftar Menu / Item
                  </h2>
                  <p className="text-xs text-slate-500">
                    Masukkan item lalu pilih peserta yang ikut patungan di item tersebut.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 sm:min-h-8"
              >
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Tambah Item</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {items.map((item, index) => {
                const rowErr = fieldErrors.items?.[item.id] || {};
                const itemTotal =
                  Math.max(0, Number(item.price) || 0) *
                  Math.max(0, Number(item.quantity) || 0);
                const isAllSelected =
                  participants.length > 0 &&
                  item.sharedBy.length === participants.length;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 ${
                      Object.keys(rowErr).length > 0
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Utensils aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />
                        Item #{index + 1}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 tabular-nums">
                          Total: {formatCurrency(itemTotal)}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label={`Hapus item ${index + 1}`}
                            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:min-h-8 sm:min-w-8"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-6">
                        <label
                          htmlFor={`item-name-${item.id}`}
                          className="block text-xs font-medium text-slate-700"
                        >
                          Nama Item
                        </label>
                        <input
                          id={`item-name-${item.id}`}
                          type="text"
                          value={item.name}
                          aria-invalid={Boolean(rowErr.name)}
                          aria-describedby={
                            rowErr.name ? `item-name-err-${item.id}` : undefined
                          }
                          onChange={(e) =>
                            handleItemFieldChange(item.id, 'name', e.target.value)
                          }
                          placeholder="Contoh: Nasi Goreng"
                          maxLength={150}
                          className={`mt-1 min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:outline-none sm:min-h-10 ${
                            rowErr.name
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                        />
                        {rowErr.name && (
                          <p
                            id={`item-name-err-${item.id}`}
                            className="mt-1 text-xs font-medium text-rose-600"
                          >
                            {rowErr.name}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-4">
                        <label
                          htmlFor={`item-price-${item.id}`}
                          className="block text-xs font-medium text-slate-700"
                        >
                          Harga Satuan (Rp)
                        </label>
                        <input
                          id={`item-price-${item.id}`}
                          type="number"
                          min="0"
                          step="500"
                          value={item.price}
                          aria-invalid={Boolean(rowErr.price)}
                          aria-describedby={
                            rowErr.price ? `item-price-err-${item.id}` : undefined
                          }
                          onChange={(e) =>
                            handleItemFieldChange(item.id, 'price', e.target.value)
                          }
                          placeholder="25000"
                          className={`mt-1 min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 tabular-nums placeholder:text-slate-500 focus:ring-2 focus:outline-none sm:min-h-10 ${
                            rowErr.price
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                        />
                        {rowErr.price && (
                          <p
                            id={`item-price-err-${item.id}`}
                            className="mt-1 text-xs font-medium text-rose-600"
                          >
                            {rowErr.price}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`item-qty-${item.id}`}
                          className="block text-xs font-medium text-slate-700"
                        >
                          Qty
                        </label>
                        <input
                          id={`item-qty-${item.id}`}
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          aria-invalid={Boolean(rowErr.quantity)}
                          aria-describedby={
                            rowErr.quantity ? `item-qty-err-${item.id}` : undefined
                          }
                          onChange={(e) =>
                            handleItemFieldChange(
                              item.id,
                              'quantity',
                              e.target.value === ''
                                ? ''
                                : Math.max(1, parseInt(e.target.value, 10) || 1)
                            )
                          }
                          className={`mt-1 min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 tabular-nums focus:ring-2 focus:outline-none sm:min-h-10 ${
                            rowErr.quantity
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                        />
                        {rowErr.quantity && (
                          <p
                            id={`item-qty-err-${item.id}`}
                            className="mt-1 text-xs font-medium text-rose-600"
                          >
                            {rowErr.quantity}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pilih Peserta Item */}
                    <div
                      id={`item-share-${item.id}`}
                      tabIndex={-1}
                      className="mt-3 border-t border-slate-200/70 pt-3 outline-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-700">
                          Dibagi ke siapa?
                        </span>
                        {participants.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleToggleSelectAllOnItem(item.id)}
                            className="min-h-8 rounded-lg px-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                          >
                            {isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
                          </button>
                        )}
                      </div>

                      {participants.length === 0 ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Tambahkan peserta di Bagian 2 terlebih dahulu.
                        </p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {participants.map((pName) => {
                            const selected = item.sharedBy.includes(pName);
                            return (
                              <button
                                key={pName}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                  handleToggleParticipantOnItem(item.id, pName)
                                }
                                className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 sm:min-h-8 ${
                                  selected
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {selected && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                                <span>{pName}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {rowErr.sharedBy && (
                        <p className="mt-2 text-xs font-medium text-rose-600">
                          {rowErr.sharedBy}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddItem}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                <span>Tambah Menu Lainnya</span>
              </button>
            </div>
          </section>

          {/* Tombol Simpan */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="h-4 w-4" />
              )}
              <span>{submitting ? 'Menyimpan...' : 'Simpan Tagihan'}</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Live Summary Sticky */}
        <div className="lg:col-span-5">
          <LiveSummaryCard
            title={title}
            taxPercent={taxPercent}
            servicePercent={servicePercent}
            preview={preview}
          />
        </div>
      </form>
    </div>
  );
}
