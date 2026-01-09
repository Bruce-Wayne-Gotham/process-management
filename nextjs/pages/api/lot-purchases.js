import { query } from '../../lib/db-init';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM lots ORDER BY created_at DESC');
      return res.status(200).json(result.rows || []);
    }

    if (req.method === 'POST') {
      const { lot_id, purchase_id, used_weight } = req.body;

      if (!lot_id || !purchase_id || !used_weight) {
        return res.status(400).json({ error: 'Lot ID, purchase ID, and used weight are required' });
      }

      const result = await query(
        'SELECT * FROM purchases WHERE id = $1',
        [purchase_id]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Purchase not found' });
      }

      return res.status(201).json(result.rows[0]);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
