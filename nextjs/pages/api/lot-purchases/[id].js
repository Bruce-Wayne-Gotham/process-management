export const runtime = 'edge';

import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  const joinSql = (whereClause) => `
    SELECT
      lp.*,
      json_object(
        'lot_code', l.lot_code,
        'lot_date', l.lot_date,
        'remarks', l.remarks,
        'total_input_weight', l.total_input_weight
      ) AS lots,
      json_object(
        'id', p.id,
        'purchase_date', p.purchase_date,
        'process_weight', p.process_weight,
        'total_amount', p.total_amount,
        'farmers', json_object(
          'farmer_code', f.farmer_code,
          'name', f.name,
          'village', f.village,
          'contact_number', f.contact_number
        )
      ) AS purchases
    FROM lot_purchases lp
    LEFT JOIN lots l ON l.id = lp.lot_id
    LEFT JOIN purchases p ON p.id = lp.purchase_id
    LEFT JOIN farmers f ON f.id = p.farmer_id
    ${whereClause}
  `;

  if (req.method === 'GET') {
    try {
      const result = await query(joinSql('WHERE lp.id = $1'), [id]);
      const row = result.rows?.[0];
      if (!row) return res.status(404).json({ error: 'Lot purchase not found' });
      return res.status(200).json(row);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { used_weight } = await req.json();

      if (used_weight === undefined) {
        return res.status(400).json({ error: 'Used weight is required' });
      }

      const currentRes = await query(
        'SELECT purchase_id, used_weight, lot_id FROM lot_purchases WHERE id = $1',
        [id]
      );
      const current = currentRes.rows?.[0];
      if (!current) return res.status(404).json({ error: 'Lot purchase not found' });

      const purchaseRes = await query('SELECT process_weight FROM purchases WHERE id = $1', [current.purchase_id]);
      const purchase = purchaseRes.rows?.[0];
      if (!purchase) return res.status(400).json({ error: 'Related purchase not found' });

      const otherRes = await query(
        'SELECT used_weight FROM lot_purchases WHERE purchase_id = $1 AND id <> $2',
        [current.purchase_id, id]
      );
      const otherUsed = otherRes.rows.reduce((sum, r) => sum + parseFloat(r.used_weight), 0);
      const available = parseFloat(purchase.process_weight) - otherUsed;

      if (parseFloat(used_weight) > available) {
        return res.status(400).json({
          error: `Cannot use ${used_weight}kg. Only ${available.toFixed(1)}kg available from this purchase`
        });
      }

      await query('UPDATE lot_purchases SET used_weight = $1 WHERE id = $2', [parseFloat(used_weight), id]);

      const allForLot = await query('SELECT used_weight FROM lot_purchases WHERE lot_id = $1', [current.lot_id]);
      const totalInputWeight = allForLot.rows.reduce((sum, r) => sum + parseFloat(r.used_weight), 0);
      await query('UPDATE lots SET total_input_weight = $1 WHERE id = $2', [totalInputWeight, current.lot_id]);

      const result = await query(joinSql('WHERE lp.id = $1'), [id]);
      return res.status(200).json(result.rows?.[0]);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const lpRes = await query('SELECT lot_id FROM lot_purchases WHERE id = $1', [id]);
      const lp = lpRes.rows?.[0];
      if (!lp) return res.status(404).json({ error: 'Lot purchase not found' });

      await query('DELETE FROM lot_purchases WHERE id = $1', [id]);

      const remaining = await query('SELECT used_weight FROM lot_purchases WHERE lot_id = $1', [lp.lot_id]);
      const total = remaining.rows.reduce((sum, r) => sum + parseFloat(r.used_weight), 0);
      await query('UPDATE lots SET total_input_weight = $1 WHERE id = $2', [total, lp.lot_id]);

      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
