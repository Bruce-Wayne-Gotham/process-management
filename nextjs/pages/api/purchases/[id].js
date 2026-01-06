import { query } from '../../../lib/db';

function normalizePurchaseRow(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id !== null ? Number(row.id) : null,
    farmer_id: row.farmer_id !== null ? Number(row.farmer_id) : null,
    process_weight: row.process_weight !== null ? Number(row.process_weight) : null,
    packaging_weight: row.packaging_weight !== null ? Number(row.packaging_weight) : null,
    total_weight: row.total_weight !== null ? Number(row.total_weight) : null,
    rate_per_kg: row.rate_per_kg !== null ? Number(row.rate_per_kg) : null,
    total_amount: row.total_amount !== null ? Number(row.total_amount) : null,
    farmers: row.farmers || null
  };
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const sql = `
        SELECT
          p.*,
          json_build_object(
            'id', f.id,
            'farmer_code', f.farmer_code,
            'name', f.name,
            'village', f.village,
            'contact_number', f.contact_number,
            'efficacy_score', f.efficacy_score
          ) AS farmers
        FROM purchases p
        LEFT JOIN farmers f ON f.id = p.farmer_id
        WHERE p.id = $1
      `;
      const result = await query(sql, [id]);
      const row = result.rows?.[0];
      if (!row) {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      return res.status(200).json(normalizePurchaseRow(row));
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        farmer_id,
        purchase_date,
        packaging_type,
        process_weight,
        packaging_weight,
        rate_per_kg,
        remarks
      } = req.body;

      const processWeightNum = process_weight !== undefined ? parseFloat(process_weight) : null;
      const packagingWeightNum = packaging_weight !== undefined ? parseFloat(packaging_weight) || 0 : null;
      const ratePerKgNum = rate_per_kg !== undefined ? parseFloat(rate_per_kg) : null;

      let totalWeight = null;
      let totalAmount = null;

      if (processWeightNum !== null && packagingWeightNum !== null) {
        totalWeight = processWeightNum + packagingWeightNum;
      }
      if (processWeightNum !== null && ratePerKgNum !== null) {
        totalAmount = processWeightNum * ratePerKgNum;
      }

      const updated = await query(
        `
        UPDATE purchases
        SET
          farmer_id = COALESCE($1, farmer_id),
          purchase_date = COALESCE($2, purchase_date),
          packaging_type = COALESCE($3, packaging_type),
          process_weight = COALESCE($4, process_weight),
          packaging_weight = COALESCE($5, packaging_weight),
          rate_per_kg = COALESCE($6, rate_per_kg),
          remarks = COALESCE($7, remarks),
          total_weight = COALESCE($8, total_weight),
          total_amount = COALESCE($9, total_amount)
        WHERE id = $10
        RETURNING *
      `,
        [
          farmer_id !== undefined ? Number(farmer_id) : null,
          purchase_date !== undefined ? purchase_date : null,
          packaging_type !== undefined ? packaging_type : null,
          processWeightNum,
          packagingWeightNum,
          ratePerKgNum,
          remarks !== undefined ? remarks || null : null,
          totalWeight,
          totalAmount,
          id
        ]
      );

      const updatedRow = updated.rows?.[0];
      if (!updatedRow) {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      const selectSql = `
        SELECT
          p.*,
          json_build_object(
            'id', f.id,
            'farmer_code', f.farmer_code,
            'name', f.name,
            'village', f.village
          ) AS farmers
        FROM purchases p
        LEFT JOIN farmers f ON f.id = p.farmer_id
        WHERE p.id = $1
      `;

      const result = await query(selectSql, [id]);
      return res.status(200).json(normalizePurchaseRow(result.rows?.[0]));
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await query('DELETE FROM purchases WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Purchase not found' });
      }
      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
