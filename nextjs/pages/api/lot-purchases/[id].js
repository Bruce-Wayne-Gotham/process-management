import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const sql = `
        SELECT
          lp.*,
          json_build_object(
            'lot_code', l.lot_code,
            'lot_date', l.lot_date,
            'remarks', l.remarks,
            'total_input_weight', l.total_input_weight
          ) AS lots,
          json_build_object(
            'id', p.id,
            'purchase_date', p.purchase_date,
            'process_weight', p.process_weight,
            'total_amount', p.total_amount,
            'farmers', json_build_object(
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
        WHERE lp.id = $1
      `;
      const result = await query(sql, [id]);
      const row = result.rows?.[0];

      if (!row) {
        return res.status(404).json({ error: 'Lot purchase not found' });
      }

      return res.status(200).json(row);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { used_weight } = req.body;

      if (used_weight === undefined) {
        return res.status(400).json({ error: 'Used weight is required' });
      }

      const currentLotPurchaseResult = await query(
        'SELECT purchase_id, used_weight, lot_id FROM lot_purchases WHERE id = $1',
        [id]
      );
      const currentLotPurchase = currentLotPurchaseResult.rows?.[0];

      if (!currentLotPurchase) {
        return res.status(404).json({ error: 'Lot purchase not found' });
      }

      const purchaseResult = await query(
        'SELECT process_weight FROM purchases WHERE id = $1',
        [currentLotPurchase.purchase_id]
      );
      const purchase = purchaseResult.rows?.[0];

      if (!purchase) {
        return res.status(400).json({ error: 'Related purchase not found' });
      }

      const otherLotPurchasesResult = await query(
        'SELECT used_weight FROM lot_purchases WHERE purchase_id = $1 AND id <> $2',
        [currentLotPurchase.purchase_id, id]
      );

      const otherUsedWeight = otherLotPurchasesResult.rows.reduce(
        (sum, item) => sum + parseFloat(item.used_weight),
        0
      );
      const availableWeight = parseFloat(purchase.process_weight) - otherUsedWeight;

      if (parseFloat(used_weight) > availableWeight) {
        return res.status(400).json({ 
          error: `Cannot use ${used_weight}kg. Only ${availableWeight.toFixed(1)}kg available from this purchase` 
        });
      }

      await query(
        'UPDATE lot_purchases SET used_weight = $1 WHERE id = $2',
        [parseFloat(used_weight), id]
      );

      const lotPurchasesForLotResult = await query(
        'SELECT used_weight FROM lot_purchases WHERE lot_id = $1',
        [currentLotPurchase.lot_id]
      );

      const totalInputWeight = lotPurchasesForLotResult.rows.reduce(
        (sum, item) => sum + parseFloat(item.used_weight),
        0
      );

      await query(
        'UPDATE lots SET total_input_weight = $1 WHERE id = $2',
        [totalInputWeight, currentLotPurchase.lot_id]
      );

      const updatedResult = await query(
        `
        SELECT
          lp.*,
          json_build_object(
            'lot_code', l.lot_code,
            'lot_date', l.lot_date
          ) AS lots,
          json_build_object(
            'id', p.id,
            'purchase_date', p.purchase_date,
            'process_weight', p.process_weight,
            'total_amount', p.total_amount,
            'farmers', json_build_object(
              'farmer_code', f.farmer_code,
              'name', f.name,
              'village', f.village
            )
          ) AS purchases
        FROM lot_purchases lp
        LEFT JOIN lots l ON l.id = lp.lot_id
        LEFT JOIN purchases p ON p.id = lp.purchase_id
        LEFT JOIN farmers f ON f.id = p.farmer_id
        WHERE lp.id = $1
      `,
        [id]
      );

      return res.status(200).json(updatedResult.rows?.[0]);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const lotPurchaseResult = await query(
        'SELECT lot_id FROM lot_purchases WHERE id = $1',
        [id]
      );
      const lotPurchase = lotPurchaseResult.rows?.[0];

      if (!lotPurchase) {
        return res.status(404).json({ error: 'Lot purchase not found' });
      }

      await query('DELETE FROM lot_purchases WHERE id = $1', [id]);

      const remainingLotPurchasesResult = await query(
        'SELECT used_weight FROM lot_purchases WHERE lot_id = $1',
        [lotPurchase.lot_id]
      );

      const totalInputWeight = remainingLotPurchasesResult.rows.reduce(
        (sum, item) => sum + parseFloat(item.used_weight),
        0
      );

      await query(
        'UPDATE lots SET total_input_weight = $1 WHERE id = $2',
        [totalInputWeight, lotPurchase.lot_id]
      );

      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
