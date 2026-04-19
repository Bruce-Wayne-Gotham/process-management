export const runtime = 'edge';

import { query } from '../../lib/db';

export default async function handler(req, res) {
  function normalizeRow(row) {
    return {
      ...row,
      farmer_id: row.farmer_id !== null ? Number(row.farmer_id) : null,
      process_weight: row.process_weight !== null ? Number(row.process_weight) : null,
      packaging_weight: row.packaging_weight !== null ? Number(row.packaging_weight) : null,
      total_weight: row.total_weight !== null ? Number(row.total_weight) : null,
      rate_per_kg: row.rate_per_kg !== null ? Number(row.rate_per_kg) : null,
      total_amount: row.total_amount !== null ? Number(row.total_amount) : null,
      farmers: row.farmers || null
    };
  }

  const joinSql = (whereClause = '') => `
    SELECT
      p.*,
      json_object(
        'farmer_code', f.farmer_code,
        'name', f.name,
        'village', f.village
      ) AS farmers
    FROM purchases p
    LEFT JOIN farmers f ON f.id = p.farmer_id
    ${whereClause}
    ORDER BY p.purchase_date DESC, p.created_at DESC
  `;

  try {
    if (req.method === 'GET') {
      const result = await query(joinSql());
      return res.status(200).json((result.rows || []).map(normalizeRow));
    }

    if (req.method === 'POST') {
      const {
        farmer_id, purchase_date, packaging_type,
        process_weight, packaging_weight, rate_per_kg, remarks
      } = await req.json();

      if (!farmer_id || !purchase_date || !packaging_type || !process_weight || !rate_per_kg) {
        return res.status(400).json({
          error: 'farmer_id, purchase_date, packaging_type, process_weight, and rate_per_kg are required'
        });
      }

      if (!['BODH', 'BAG'].includes(packaging_type)) {
        return res.status(400).json({ error: 'packaging_type must be either BODH or BAG' });
      }

      const inserted = await query(
        `INSERT INTO purchases (
          farmer_id, purchase_date, packaging_type,
          process_weight, packaging_weight, rate_per_kg, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          Number(farmer_id), purchase_date, packaging_type,
          Number(process_weight), Number(packaging_weight) || 0,
          Number(rate_per_kg), remarks || null
        ]
      );

      const row = inserted.rows?.[0];
      const result = await query(joinSql('WHERE p.id = $1'), [row.id]);
      return res.status(201).json(normalizeRow(result.rows?.[0]));
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('Purchases API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
