import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM farmers WHERE id = $1', [id]);
      return res.status(200).json(result.rows[0] || null);
    }

    if (req.method === 'PUT') {
      const { efficacy_score, efficacy_notes } = req.body;
      const result = await query(
        'UPDATE farmers SET efficacy_score = $1, efficacy_notes = $2 WHERE id = $3 RETURNING *',
        [efficacy_score || null, efficacy_notes || null, id]
      );
      return res.status(200).json(result.rows[0] || null);
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM farmers WHERE id = $1', [id]);
      return res.status(204).send();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

