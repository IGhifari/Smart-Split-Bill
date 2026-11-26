import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const STYLES = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  error: {
    container: 'border-rose-200 bg-rose-50 text-rose-950',
    icon: AlertCircle,
    iconColor: 'text-rose-600',
  },
  info: {
    container: 'border-blue-200 bg-blue-50 text-blue-950',
    icon: Info,
    iconColor: 'text-blue-600',
  },
};

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => {
      onClose();
    }, 3400);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const variant = STYLES[toast.type] || STYLES.info;
  const Icon = variant.icon;

  return (
    <div
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 flex justify-end sm:left-auto"
    >
      <div
        role="status"
        className={`animate-fade-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg ${variant.container}`}
      >
        <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${variant.iconColor}`} />
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg opacity-75 transition-opacity hover:opacity-100"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
