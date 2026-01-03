export default async function handler(req, res) {
  const { query } = await import('../../../lib/db');

  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM process_status ORDER BY id ASC');
      return res.status(200).json(result.rows || []);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Process status API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
