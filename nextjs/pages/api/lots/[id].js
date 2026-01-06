import { query } from '../../../lib/db';

function normalizeLotRow(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id !== null ? Number(row.id) : null,
    total_input_weight: row.total_input_weight !== null ? Number(row.total_input_weight) : null,
    lot_purchases: row.lot_purchases || []
  };
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const sql = `
        SELECT
          l.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', lp.id,
                'purchase_id', lp.purchase_id,
                'used_weight', lp.used_weight,
                'purchases', json_build_object(
                  'id', p.id,
                  'farmer_id', p.farmer_id,
                  'purchase_date', p.purchase_date,
                  'process_weight', p.process_weight,
                  'total_amount', p.total_amount,
                  'farmers', json_build_object(
                    'farmer_code', f.farmer_code,
                    'name', f.name,
                    'village', f.village
                  )
                )
              )
            ) FILTER (WHERE lp.id IS NOT NULL),
            '[]'::json
          ) AS lot_purchases
        FROM lots l
        LEFT JOIN lot_purchases lp ON lp.lot_id = l.id
        LEFT JOIN purchases p ON p.id = lp.purchase_id
        LEFT JOIN farmers f ON f.id = p.farmer_id
        WHERE l.id = $1
        GROUP BY l.id
      `;
      const result = await query(sql, [id]);
      const row = result.rows?.[0];

      if (!row) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      return res.status(200).json(normalizeLotRow(row));
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { lot_code, lot_date, total_input_weight, remarks } = req.body;

      const updated = await query(
        `
        UPDATE lots
        SET
          lot_code = COALESCE($1, lot_code),
          lot_date = COALESCE($2, lot_date),
          total_input_weight = COALESCE($3, total_input_weight),
          remarks = COALESCE($4, remarks)
        WHERE id = $5
        RETURNING *
      `,
        [
          lot_code !== undefined ? lot_code : null,
          lot_date !== undefined ? lot_date : null,
          total_input_weight !== undefined ? parseFloat(total_input_weight) : null,
          remarks !== undefined ? remarks || null : null,
          id
        ]
      );

      const row = updated.rows?.[0];
      if (!row) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      return res.status(200).json(row);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await query('DELETE FROM lots WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Lot not found' });
      }
      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
