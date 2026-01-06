import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const sql = `
        SELECT
          psh.*,
          json_build_object(
            'process_code', p.process_code,
            'process_date', p.process_date,
            'input_weight', p.input_weight,
            'lots', json_build_object(
              'lot_code', l.lot_code,
              'lot_date', l.lot_date
            )
          ) AS processes,
          json_build_object(
            'status_code', fs.status_code,
            'label', fs.label,
            'description', fs.description
          ) AS from_status,
          json_build_object(
            'status_code', ts.status_code,
            'label', ts.label,
            'description', ts.description
          ) AS to_status
        FROM process_status_history psh
        LEFT JOIN process p ON p.id = psh.process_id
        LEFT JOIN lots l ON l.id = p.lot_id
        LEFT JOIN process_status fs ON fs.id = psh.from_status_id
        LEFT JOIN process_status ts ON ts.id = psh.to_status_id
        WHERE psh.id = $1
      `;
      const result = await query(sql, [id]);
      const row = result.rows?.[0];

      if (!row) {
        return res.status(404).json({ error: 'Status history record not found' });
      }

      return res.status(200).json(row);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { 
        changed_by,
        changed_at,
        notes
      } = req.body;

      const updated = await query(
        `
        UPDATE process_status_history
        SET
          changed_by = COALESCE($1, changed_by),
          changed_at = COALESCE($2, changed_at),
          notes = COALESCE($3, notes)
        WHERE id = $4
        RETURNING *
      `,
        [
          changed_by !== undefined ? changed_by : null,
          changed_at !== undefined ? changed_at : null,
          notes !== undefined ? notes || null : null,
          id
        ]
      );

      const row = updated.rows?.[0];
      if (!row) {
        return res.status(404).json({ error: 'Status history record not found' });
      }

      return res.status(200).json(row);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await query(
        'DELETE FROM process_status_history WHERE id = $1',
        [id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Status history record not found' });
      }
      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
