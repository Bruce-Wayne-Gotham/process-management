export const runtime = 'edge';

import { query } from '../../lib/db';

const joinSql = (whereClause = '') => `
  SELECT
    psh.*,
    json_object(
      'process_code', p.process_code,
      'process_date', p.process_date
    ) AS processes,
    json_object(
      'status_code', fs.status_code,
      'label', fs.label,
      'description', fs.description
    ) AS from_status,
    json_object(
      'status_code', ts.status_code,
      'label', ts.label,
      'description', ts.description
    ) AS to_status
  FROM process_status_history psh
  LEFT JOIN process p ON p.id = psh.process_id
  LEFT JOIN process_status fs ON fs.id = psh.from_status_id
  LEFT JOIN process_status ts ON ts.id = psh.to_status_id
  ${whereClause}
  ORDER BY psh.changed_at DESC
`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { process_id } = req.query;
      const result = process_id
        ? await query(joinSql('WHERE psh.process_id = $1'), [process_id])
        : await query(joinSql());
      return res.status(200).json(result.rows || []);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        process_id, from_status_id, to_status_id,
        changed_by, changed_at, notes
      } = await req.json();

      if (!process_id || !to_status_id) {
        return res.status(400).json({ error: 'Process ID and to status ID are required' });
      }

      const processRes = await query('SELECT id, status_id FROM process WHERE id = $1', [process_id]);
      if (processRes.rows.length === 0) return res.status(400).json({ error: 'Process not found' });
      const proc = processRes.rows[0];

      const statusRes = await query('SELECT id FROM process_status WHERE id = $1', [to_status_id]);
      if (statusRes.rows.length === 0) return res.status(400).json({ error: 'Invalid status' });

      const inserted = await query(
        `INSERT INTO process_status_history (
          process_id, from_status_id, to_status_id, changed_by, changed_at, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          Number(process_id),
          from_status_id || proc.status_id,
          Number(to_status_id),
          changed_by || 'System',
          changed_at || new Date().toISOString(),
          notes || null
        ]
      );

      const result = await query(joinSql('WHERE psh.id = $1'), [inserted.rows[0].id]);
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
