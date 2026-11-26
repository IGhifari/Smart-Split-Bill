/**
 * Logika kalkulasi proporsional sisi client untuk Live Preview.
 * Rumus identik dengan backend/utils/calculateSplit.js:
 * 1. itemTotal = price * quantity, dibagi rata ke shareCount peserta yang terlibat.
 * 2. Akumulasi subtotal per peserta dan totalSubtotal keseluruhan.
 * 3. Pajak, service, dan diskon dibagi proporsional dengan ratio = person.subtotal / totalSubtotal.
 * 4. total_due = Math.round(Math.max(0, subtotal + taxShare + serviceShare - discountShare)).
 */
function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateSplit({
  tax_percent = 0,
  service_percent = 0,
  discount_amount = 0,
  participants = [],
  items = [],
}) {
  const taxPercent = Math.max(0, toSafeNumber(tax_percent, 0));
  const servicePercent = Math.max(0, toSafeNumber(service_percent, 0));
  const discountAmount = Math.max(0, toSafeNumber(discount_amount, 0));

  const participantMap = new Map();
  for (const rawName of participants) {
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (!name) continue;
    const key = name.toLowerCase();
    if (!participantMap.has(key)) {
      participantMap.set(key, {
        name,
        items: [],
        rawSubtotal: 0,
      });
    }
  }

  let totalSubtotal = 0;

  for (const item of items) {
    const price = Math.max(0, toSafeNumber(item?.price, 0));
    const quantity = Math.max(0, toSafeNumber(item?.quantity, 0));
    const itemTotal = price * quantity;

    const rawShared = Array.isArray(item?.sharedBy) ? item.sharedBy : [];
    const validKeys = [];
    const seen = new Set();
    for (const pName of rawShared) {
      if (typeof pName !== 'string') continue;
      const key = pName.trim().toLowerCase();
      if (participantMap.has(key) && !seen.has(key)) {
        seen.add(key);
        validKeys.push(key);
      }
    }

    const shareCount = validKeys.length;
    if (shareCount > 0) {
      const shareAmount = itemTotal / shareCount;
      totalSubtotal += itemTotal;

      for (const key of validKeys) {
        const person = participantMap.get(key);
        person.rawSubtotal += shareAmount;
        person.items.push({
          name: item?.name?.trim() || 'Item',
          price,
          quantity,
          item_total: itemTotal,
          share_count: shareCount,
          share_amount: Math.round(shareAmount),
        });
      }
    }
  }

  const totalTax = totalSubtotal * (taxPercent / 100);
  const totalService = totalSubtotal * (servicePercent / 100);
  const grandTotal = Math.round(
    Math.max(0, totalSubtotal + totalTax + totalService - discountAmount)
  );

  const participantBreakdown = Array.from(participantMap.values()).map((person) => {
    const ratio = totalSubtotal > 0 ? person.rawSubtotal / totalSubtotal : 0;
    const taxShare = totalTax * ratio;
    const serviceShare = totalService * ratio;
    const discountShare = discountAmount * ratio;
    const rawTotalDue =
      person.rawSubtotal + taxShare + serviceShare - discountShare;

    return {
      name: person.name,
      items: person.items,
      ratio,
      subtotal: Math.round(person.rawSubtotal),
      tax_share: Math.round(taxShare),
      service_share: Math.round(serviceShare),
      discount_share: Math.round(discountShare),
      total_due: Math.round(Math.max(0, rawTotalDue)),
    };
  });

  return {
    summary: {
      subtotal: Math.round(totalSubtotal),
      tax_amount: Math.round(totalTax),
      service_amount: Math.round(totalService),
      discount_amount: Math.round(discountAmount),
      grand_total: grandTotal,
    },
    participants: participantBreakdown,
  };
}

export default calculateSplit;
