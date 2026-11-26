import { formatCurrency, formatShortDate } from './formatCurrency.js';

export function formatWhatsAppSummary({ bill, summary, participants = [] }) {
  const paidCount = participants.filter((p) => p.is_paid).length;
  const totalCount = participants.length;

  const lines = [
    `*Smart Split Bill — ${bill?.title || 'Tagihan'}*`,
    `Tanggal: ${formatShortDate(bill?.created_at)}`,
    '',
    '*Rincian Per Peserta:*',
  ];

  participants.forEach((person, index) => {
    const statusLabel = person.is_paid ? 'Lunas' : 'Belum Lunas';
    lines.push(
      `${index + 1}. ${person.name} — ${formatCurrency(person.total_due)} (${statusLabel})`
    );
  });

  lines.push('', '*Ringkasan Tagihan:*');
  lines.push(`- Subtotal: ${formatCurrency(summary?.subtotal || 0)}`);

  if ((bill?.tax_percent || 0) > 0 || (summary?.tax_amount || 0) > 0) {
    lines.push(
      `- Pajak (${bill?.tax_percent || 0}%): ${formatCurrency(summary?.tax_amount || 0)}`
    );
  }
  if ((bill?.service_percent || 0) > 0 || (summary?.service_amount || 0) > 0) {
    lines.push(
      `- Service (${bill?.service_percent || 0}%): ${formatCurrency(summary?.service_amount || 0)}`
    );
  }
  if ((summary?.discount_amount || 0) > 0) {
    lines.push(`- Diskon: -${formatCurrency(summary.discount_amount)}`);
  }

  lines.push(`*Grand Total: ${formatCurrency(summary?.grand_total || 0)}*`);
  lines.push('');
  lines.push(`Status pelunasan: ${paidCount}/${totalCount} peserta lunas.`);

  return lines.join('\n');
}
