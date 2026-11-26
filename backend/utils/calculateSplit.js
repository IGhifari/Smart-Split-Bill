/**
 * Menghitung pembagian tagihan secara proporsional per peserta.
 *
 * Alur kalkulasi:
 * 1. Hitung total harga tiap item (price * quantity) lalu bagi rata ke peserta terkait.
 * 2. Akumulasi subtotal masing-masing peserta dan total subtotal keseluruhan.
 * 3. Hitung pajak, service charge, dan diskon secara proporsional berdasarkan rasio subtotal.
 * 4. Bulatkan nilai rupiah akhir dengan Math.round dan pastikan tidak negatif / NaN.
 */
function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateSplit({
  bill,
  participants = [],
  items = [],
  itemShares = [],
}) {
  const taxPercent = Math.max(0, toSafeNumber(bill?.tax_percent, 0));
  const servicePercent = Math.max(0, toSafeNumber(bill?.service_percent, 0));
  const discountAmount = Math.max(0, toSafeNumber(bill?.discount_amount, 0));

  // Siapkan peta peserta agar lookup O(1) saat memproses share setiap item
  const participantMap = new Map();
  for (const p of participants) {
    participantMap.set(p.id, {
      id: p.id,
      name: p.name,
      is_paid: Boolean(p.is_paid),
      items: [],
      rawSubtotal: 0,
    });
  }

  // Kelompokkan participant_id per item_id (hindari duplikasi & ID tidak valid)
  const sharesByItem = new Map();
  for (const share of itemShares) {
    if (!participantMap.has(share.participant_id)) continue;
    if (!sharesByItem.has(share.item_id)) {
      sharesByItem.set(share.item_id, new Set());
    }
    sharesByItem.get(share.item_id).add(share.participant_id);
  }

  // 1 & 2. Hitung total tiap item, bagi rata ke peserta yang berbagi, dan akumulasi subtotal
  let totalSubtotal = 0;

  const formattedItems = items.map((item) => {
    const price = Math.max(0, toSafeNumber(item.price, 0));
    const quantity = Math.max(0, toSafeNumber(item.quantity, 0));
    const itemTotal = price * quantity;
    const sharedParticipantIds = Array.from(sharesByItem.get(item.id) || []);
    const shareCount = sharedParticipantIds.length;

    if (shareCount > 0) {
      const shareAmount = itemTotal / shareCount;
      totalSubtotal += itemTotal;

      for (const participantId of sharedParticipantIds) {
        const person = participantMap.get(participantId);
        person.rawSubtotal += shareAmount;
        person.items.push({
          item_id: item.id,
          name: item.name,
          price,
          quantity,
          item_total: itemTotal,
          share_count: shareCount,
          share_amount: Math.round(shareAmount),
        });
      }
    }

    return {
      id: item.id,
      name: item.name,
      price,
      quantity,
      total: itemTotal,
      shared_participant_ids: sharedParticipantIds,
    };
  });

  // 3. Hitung total pajak, service, dan grand total tagihan
  const totalTax = totalSubtotal * (taxPercent / 100);
  const totalService = totalSubtotal * (servicePercent / 100);
  const grandTotal = Math.round(
    Math.max(0, totalSubtotal + totalTax + totalService - discountAmount)
  );

  // 4. Distribusikan pajak, service, dan diskon secara proporsional ke tiap peserta
  const participantBreakdown = Array.from(participantMap.values()).map((person) => {
    const ratio = totalSubtotal > 0 ? person.rawSubtotal / totalSubtotal : 0;
    const taxShare = totalTax * ratio;
    const serviceShare = totalService * ratio;
    const discountShare = discountAmount * ratio;
    const rawTotalDue =
      person.rawSubtotal + taxShare + serviceShare - discountShare;

    return {
      id: person.id,
      name: person.name,
      is_paid: person.is_paid,
      items: person.items,
      subtotal: Math.round(person.rawSubtotal),
      tax_share: Math.round(taxShare),
      service_share: Math.round(serviceShare),
      discount_share: Math.round(discountShare),
      total_due: Math.round(Math.max(0, rawTotalDue)),
    };
  });

  return {
    bill: {
      id: bill.id,
      title: bill.title,
      tax_percent: taxPercent,
      service_percent: servicePercent,
      discount_amount: discountAmount,
      created_at: bill.created_at,
    },
    summary: {
      subtotal: Math.round(totalSubtotal),
      tax_amount: Math.round(totalTax),
      service_amount: Math.round(totalService),
      discount_amount: Math.round(discountAmount),
      grand_total: grandTotal,
    },
    items: formattedItems,
    participants: participantBreakdown,
  };
}

export default calculateSplit;
