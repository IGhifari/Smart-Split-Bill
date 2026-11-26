import { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ConfirmModal({
  isOpen,
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus data ini?',
  confirmText = 'Hapus',
  cancelText = 'Batal',
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    openerRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Pindahkan fokus ke tombol Batal saat modal terbuka (aman untuk aksi destruktif)
    cancelBtnRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isLoading) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (openerRef.current instanceof HTMLElement && openerRef.current.isConnected) {
        openerRef.current.focus();
      }
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="animate-fade-in w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3
              id="confirm-modal-title"
              className="text-base font-bold text-slate-900"
            >
              {title}
            </h3>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            aria-label="Tutup modal"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 sm:min-h-9 sm:min-w-9"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <p
          id="confirm-modal-desc"
          className="mt-3 text-sm leading-relaxed text-slate-600"
        >
          {message}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50 sm:min-h-10"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10"
          >
            {isLoading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
