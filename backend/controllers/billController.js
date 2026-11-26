import pool from '../config/db.js';
import { calculateSplit } from '../utils/calculateSplit.js';

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseNonNegativeNumber(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export async function healthCheck(req, res, next) {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'OK',
      database: 'Connected',
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAllBills(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        b.id,
        b.title,
        b.tax_percent,
        b.service_percent,
        b.discount_amount,
        b.created_at,
        COALESCE(p.total_participants, 0) AS total_participants,
        COALESCE(p.paid_participants, 0) AS paid_participants,
        COALESCE(i.subtotal, 0) AS subtotal
      FROM bills b
      LEFT JOIN (
        SELECT
          bill_id,
          COUNT(*) AS total_participants,
          SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) AS paid_participants
        FROM participants
        GROUP BY bill_id
      ) p ON p.bill_id = b.id
      LEFT JOIN (
        SELECT
          it.bill_id,
          SUM(it.price * it.quantity) AS subtotal
        FROM items it
        WHERE EXISTS (
          SELECT 1 FROM item_shares sh WHERE sh.item_id = it.id
        )
        GROUP BY it.bill_id
      ) i ON i.bill_id = b.id
      ORDER BY b.created_at DESC, b.id DESC
    `);

    const bills = rows.map((row) => {
      const subtotal = Number(row.subtotal) || 0;
      const taxPercent = Number(row.tax_percent) || 0;
      const servicePercent = Number(row.service_percent) || 0;
      const discountAmount = Number(row.discount_amount) || 0;

      const totalTax = subtotal * (taxPercent / 100);
      const totalService = subtotal * (servicePercent / 100);
      const grandTotal = Math.round(
        Math.max(0, subtotal + totalTax + totalService - discountAmount)
      );

      return {
        id: row.id,
        title: row.title,
        tax_percent: taxPercent,
        service_percent: servicePercent,
        discount_amount: discountAmount,
        created_at: row.created_at,
        total_participants: Number(row.total_participants) || 0,
        paid_participants: Number(row.paid_participants) || 0,
        subtotal: Math.round(subtotal),
        grand_total: grandTotal,
      };
    });

    return res.status(200).json(bills);
  } catch (error) {
    return next(error);
  }
}

export async function createBill(req, res, next) {
  const {
    title,
    tax_percent = 0,
    service_percent = 0,
    discount_amount = 0,
    participants,
    items,
  } = req.body || {};

  // Validasi judul tagihan
  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Judul tagihan (title) wajib diisi.' });
  }
  const cleanTitle = title.trim();
  if (cleanTitle.length > 150) {
    return res.status(400).json({ error: 'Judul tagihan maksimal 150 karakter.' });
  }

  // Validasi komponen pajak, service, dan diskon
  const taxPercent = parseNonNegativeNumber(tax_percent, 0);
  const servicePercent = parseNonNegativeNumber(service_percent, 0);
  const discountAmount = parseNonNegativeNumber(discount_amount, 0);

  if (taxPercent === null || taxPercent > 100) {
    return res
      .status(400)
      .json({ error: 'tax_percent harus berupa angka antara 0 dan 100.' });
  }
  if (servicePercent === null || servicePercent > 100) {
    return res
      .status(400)
      .json({ error: 'service_percent harus berupa angka antara 0 dan 100.' });
  }
  if (discountAmount === null) {
    return res
      .status(400)
      .json({ error: 'discount_amount harus berupa angka >= 0.' });
  }

  // Validasi daftar peserta (non-kosong, tanpa spasi kosong & tanpa duplikat)
  if (!Array.isArray(participants) || participants.length === 0) {
    return res
      .status(400)
      .json({ error: 'participants wajib berupa array non-kosong.' });
  }

  const cleanParticipants = [];
  const seenParticipants = new Set();

  for (let idx = 0; idx < participants.length; idx++) {
    const rawName = participants[idx];
    if (typeof rawName !== 'string' || rawName.trim().length === 0) {
      return res.status(400).json({
        error: `Nama peserta pada indeks ${idx} tidak boleh kosong.`,
      });
    }
    const cleanName = rawName.trim();
    if (cleanName.length > 100) {
      return res.status(400).json({
        error: `Nama peserta "${cleanName}" melebihi 100 karakter.`,
      });
    }
    const normalizedKey = cleanName.toLowerCase();
    if (seenParticipants.has(normalizedKey)) {
      return res.status(400).json({
        error: `Nama peserta duplikat ditemukan: "${cleanName}".`,
      });
    }
    seenParticipants.add(normalizedKey);
    cleanParticipants.push(cleanName);
  }

  // Validasi daftar item
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items wajib berupa array non-kosong.' });
  }

  const cleanItems = [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    if (!item || typeof item !== 'object') {
      return res.status(400).json({ error: `Item pada indeks ${idx} tidak valid.` });
    }

    if (typeof item.name !== 'string' || item.name.trim().length === 0) {
      return res
        .status(400)
        .json({ error: `Nama item pada indeks ${idx} wajib diisi.` });
    }
    const cleanItemName = item.name.trim();
    if (cleanItemName.length > 150) {
      return res.status(400).json({
        error: `Nama item "${cleanItemName}" melebihi 150 karakter.`,
      });
    }

    const price = Number(item.price);
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        error: `Harga item "${cleanItemName}" harus berupa angka >= 0.`,
      });
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        error: `Jumlah (quantity) item "${cleanItemName}" harus berupa bilangan bulat >= 1.`,
      });
    }

    if (!Array.isArray(item.sharedBy)) {
      return res.status(400).json({
        error: `sharedBy pada item "${cleanItemName}" harus berupa array nama peserta.`,
      });
    }

    const uniqueSharedKeys = new Set();
    for (const rawParticipant of item.sharedBy) {
      if (typeof rawParticipant !== 'string' || rawParticipant.trim().length === 0) {
        return res.status(400).json({
          error: `sharedBy pada item "${cleanItemName}" mengandung nama peserta tidak valid.`,
        });
      }
      const key = rawParticipant.trim().toLowerCase();
      if (!seenParticipants.has(key)) {
        return res.status(400).json({
          error: `Peserta "${rawParticipant.trim()}" pada item "${cleanItemName}" tidak ada di daftar participants.`,
        });
      }
      uniqueSharedKeys.add(key);
    }

    cleanItems.push({
      name: cleanItemName,
      price,
      quantity,
      sharedKeys: Array.from(uniqueSharedKeys),
    });
  }

  // Simpan seluruh data menggunakan MySQL Transaction
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [billResult] = await connection.query(
      `INSERT INTO bills (title, tax_percent, service_percent, discount_amount)
       VALUES (?, ?, ?, ?)`,
      [cleanTitle, taxPercent, servicePercent, discountAmount]
    );
    const billId = billResult.insertId;

    const participantIdByKey = new Map();
    for (const participantName of cleanParticipants) {
      const [participantResult] = await connection.query(
        `INSERT INTO participants (bill_id, name, is_paid) VALUES (?, ?, FALSE)`,
        [billId, participantName]
      );
      participantIdByKey.set(
        participantName.toLowerCase(),
        participantResult.insertId
      );
    }

    for (const item of cleanItems) {
      const [itemResult] = await connection.query(
        `INSERT INTO items (bill_id, name, price, quantity) VALUES (?, ?, ?, ?)`,
        [billId, item.name, item.price, item.quantity]
      );
      const itemId = itemResult.insertId;

      for (const participantKey of item.sharedKeys) {
        const participantId = participantIdByKey.get(participantKey);
        await connection.query(
          `INSERT INTO item_shares (item_id, participant_id) VALUES (?, ?)`,
          [itemId, participantId]
        );
      }
    }

    await connection.commit();
    return res.status(201).json({
      id: billId,
      message: 'Tagihan berhasil dibuat.',
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function getBillById(req, res, next) {
  try {
    const billId = parsePositiveInt(req.params.id);
    if (!billId) {
      return res.status(400).json({ error: 'ID tagihan tidak valid.' });
    }

    const [billRows] = await pool.query(
      `SELECT id, title, tax_percent, service_percent, discount_amount, created_at
       FROM bills
       WHERE id = ?`,
      [billId]
    );

    if (billRows.length === 0) {
      return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });
    }

    const bill = billRows[0];

    const [participants] = await pool.query(
      `SELECT id, bill_id, name, is_paid
       FROM participants
       WHERE bill_id = ?
       ORDER BY id ASC`,
      [billId]
    );

    const [items] = await pool.query(
      `SELECT id, bill_id, name, price, quantity
       FROM items
       WHERE bill_id = ?
       ORDER BY id ASC`,
      [billId]
    );

    const [itemShares] = await pool.query(
      `SELECT sh.id, sh.item_id, sh.participant_id
       FROM item_shares sh
       INNER JOIN items it ON it.id = sh.item_id
       WHERE it.bill_id = ?`,
      [billId]
    );

    const result = calculateSplit({
      bill,
      participants,
      items,
      itemShares,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateParticipantStatus(req, res, next) {
  try {
    const participantId = parsePositiveInt(req.params.id);
    if (!participantId) {
      return res.status(400).json({ error: 'ID peserta tidak valid.' });
    }

    const { is_paid } = req.body || {};
    if (typeof is_paid !== 'boolean') {
      return res
        .status(400)
        .json({ error: 'is_paid wajib berupa nilai boolean (true/false).' });
    }

    const [result] = await pool.query(
      `UPDATE participants SET is_paid = ? WHERE id = ?`,
      [is_paid, participantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Peserta tidak ditemukan.' });
    }

    return res.status(200).json({
      id: participantId,
      is_paid,
      message: 'Status pembayaran peserta berhasil diperbarui.',
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteBill(req, res, next) {
  try {
    const billId = parsePositiveInt(req.params.id);
    if (!billId) {
      return res.status(400).json({ error: 'ID tagihan tidak valid.' });
    }

    const [result] = await pool.query(`DELETE FROM bills WHERE id = ?`, [billId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });
    }

    return res.status(200).json({
      id: billId,
      message: 'Tagihan berhasil dihapus.',
    });
  } catch (error) {
    return next(error);
  }
}
