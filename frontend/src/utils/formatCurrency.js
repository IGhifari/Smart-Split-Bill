const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 'Rp 0';
  }
  const rounded = Math.round(num);
  if (rounded < 0) {
    return `-Rp ${rupiahFormatter.format(Math.abs(rounded))}`;
  }
  return `Rp ${rupiahFormatter.format(rounded)}`;
}

export function formatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return dateTimeFormatter.format(date);
}

export function formatShortDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return shortDateFormatter.format(date);
}
