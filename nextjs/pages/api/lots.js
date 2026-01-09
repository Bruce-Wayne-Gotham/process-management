import { query } from '../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM lots ORDER BY created_at DESC');
      return res.status(200).json(result.rows || []);
    }

    if (req.method === 'POST') {
      const { lot_code, lot_date, remarks } = req.body;

      if (!lot_code || !lot_date) {
        return res.status(400).json({ error: 'Lot code and date are required' });
      }

      const insertSql = `
        INSERT INTO lots (lot_code, lot_date, remarks, total_input_weight)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await query(insertSql, [
        lot_code,
        lot_date,
        remarks || null,
        0
      ]);

      return res.status(201).json(result.rows?.[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(400).json({ error: 'Lot code already exists' });
    }
    console.error('Lots API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
