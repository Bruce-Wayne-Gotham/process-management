import { query } from '../../lib/db';

export default async function handler(req, res) {
  function normalizePaymentRow(row) {
    return {
      ...row,
      purchase_id: row.purchase_id !== null ? Number(row.purchase_id) : null,
      amount_paid: row.amount_paid !== null ? Number(row.amount_paid) : null,
      purchases: row.purchases || null
    };
  }

  try {
    if (req.method === 'GET') {
      const sql = `
        SELECT
          pay.*,
          json_build_object(
            'id', p.id,
            'purchase_date', p.purchase_date,
            'total_amount', p.total_amount,
            'farmers', json_build_object(
              'name', f.name,
              'farmer_code', f.farmer_code,
              'village', f.village
            )
          ) AS purchases
        FROM payments pay
        LEFT JOIN purchases p ON p.id = pay.purchase_id
        LEFT JOIN farmers f ON f.id = p.farmer_id
        ORDER BY pay.created_at DESC
      `;
      const result = await query(sql);
      return res.status(200).json((result.rows || []).map(normalizePaymentRow));
    }

    if (req.method === 'POST') {
      const {
        purchase_id,
        payment_date,
        amount_paid,
        payment_mode = 'CASH',
        transaction_ref,
        remarks
      } = req.body;

      if (!purchase_id || !payment_date || !amount_paid) {
        return res.status(400).json({
          error: 'Purchase ID, payment date, and amount are required'
        });
      }

      const insertSql = `
        INSERT INTO payments (
          purchase_id, payment_date, amount_paid, payment_mode, transaction_ref, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const inserted = await query(insertSql, [
        Number(purchase_id),
        payment_date,
        Number(amount_paid),
        payment_mode,
        transaction_ref || null,
        remarks || null
      ]);

      const row = inserted.rows?.[0];
      const selectSql = `
        SELECT
          pay.*,
          json_build_object(
            'id', p.id,
            'purchase_date', p.purchase_date,
            'total_amount', p.total_amount,
            'farmers', json_build_object(
              'name', f.name,
              'farmer_code', f.farmer_code,
              'village', f.village
            )
          ) AS purchases
        FROM payments pay
        LEFT JOIN purchases p ON p.id = pay.purchase_id
        LEFT JOIN farmers f ON f.id = p.farmer_id
        WHERE pay.id = $1
      `;

      const result = await query(selectSql, [row.id]);
      return res.status(201).json(normalizePaymentRow(result.rows?.[0]));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Payments API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
