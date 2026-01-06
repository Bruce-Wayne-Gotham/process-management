import { query } from '../../../lib/db';

function normalizePaymentRow(row) {
  if (!row) return null;
  return {
    ...row,
    purchase_id: row.purchase_id !== null ? Number(row.purchase_id) : null,
    amount_paid: row.amount_paid !== null ? Number(row.amount_paid) : null,
    purchases: row.purchases || null
  };
}

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const sql = `
        SELECT
          pay.*,
          json_build_object(
            'id', p.id,
            'purchase_date', p.purchase_date,
            'total_amount', p.total_amount,
            'process_weight', p.process_weight,
            'rate_per_kg', p.rate_per_kg,
            'farmers', json_build_object(
              'id', f.id,
              'name', f.name,
              'farmer_code', f.farmer_code,
              'village', f.village,
              'contact_number', f.contact_number
            )
          ) AS purchases
        FROM payments pay
        LEFT JOIN purchases p ON p.id = pay.purchase_id
        LEFT JOIN farmers f ON f.id = p.farmer_id
        WHERE pay.id = $1
      `;
      const result = await query(sql, [id]);
      const row = result.rows?.[0];
      if (!row) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      return res.status(200).json(normalizePaymentRow(row));
    }

    if (req.method === 'PUT') {
      const { payment_date, amount_paid, payment_mode, transaction_ref, remarks } = req.body;

      const updated = await query(
        `
        UPDATE payments
        SET payment_date = $1,
            amount_paid = $2,
            payment_mode = $3,
            transaction_ref = $4,
            remarks = $5
        WHERE id = $6
        RETURNING *
      `,
        [
          payment_date,
          amount_paid !== undefined && amount_paid !== null ? Number(amount_paid) : null,
          payment_mode || null,
          transaction_ref || null,
          remarks || null,
          id
        ]
      );

      const updatedRow = updated.rows?.[0];
      if (!updatedRow) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const selectSql = `
        SELECT
          pay.*,
          json_build_object(
            'id', p.id,
            'purchase_date', p.purchase_date,
            'total_amount', p.total_amount,
            'process_weight', p.process_weight,
            'rate_per_kg', p.rate_per_kg,
            'farmers', json_build_object(
              'id', f.id,
              'name', f.name,
              'farmer_code', f.farmer_code,
              'village', f.village,
              'contact_number', f.contact_number
            )
          ) AS purchases
        FROM payments pay
        LEFT JOIN purchases p ON p.id = pay.purchase_id
        LEFT JOIN farmers f ON f.id = p.farmer_id
        WHERE pay.id = $1
      `;
      const selectResult = await query(selectSql, [id]);
      return res.status(200).json(normalizePaymentRow(selectResult.rows?.[0]));
    }

    if (req.method === 'DELETE') {
      const result = await query('DELETE FROM payments WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      return res.status(204).send();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Payments detail API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
