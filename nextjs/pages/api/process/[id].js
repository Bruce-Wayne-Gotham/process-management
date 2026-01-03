export default async function handler(req, res) {
  const { id } = req.query;
  const { query } = await import('../../../lib/db');

  function normalizeProcessRow(row) {
    return {
      ...row,
      id: row.id !== null ? Number(row.id) : null,
      lot_id: row.lot_id !== null ? Number(row.lot_id) : null,
      status_id: row.status_id !== null ? Number(row.status_id) : null,
      input_weight: row.input_weight !== null ? Number(row.input_weight) : null,
      kadi_mati_weight: row.kadi_mati_weight !== null ? Number(row.kadi_mati_weight) : null,
      dhas_weight: row.dhas_weight !== null ? Number(row.dhas_weight) : null,
      total_wastage_weight: row.total_wastage_weight !== null ? Number(row.total_wastage_weight) : null,
      net_loss_weight: row.net_loss_weight !== null ? Number(row.net_loss_weight) : null,
      lots: row.lots || null,
      process_status: row.process_status || null
    };
  }

  if (req.method === 'GET') {
    try {
      const sql = `
        SELECT
          p.*,
          json_build_object(
            'lot_code', l.lot_code,
            'lot_date', l.lot_date,
            'total_input_weight', l.total_input_weight
          ) AS lots,
          json_build_object(
            'status_code', ps.status_code,
            'label', ps.label,
            'description', ps.description
          ) AS process_status
        FROM process p
        LEFT JOIN lots l ON l.id = p.lot_id
        LEFT JOIN process_status ps ON ps.id = p.status_id
        WHERE p.id = $1
      `;

      const result = await query(sql, [Number(id)]);
      const row = result.rows?.[0];
      if (!row) return res.status(404).json({ error: 'Process not found' });
      return res.status(200).json(normalizeProcessRow(row));
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { status_id, kadi_mati_weight, dhas_weight, remarks } = req.body;

      const existing = await query('SELECT status_id FROM process WHERE id = $1', [Number(id)]);
      const existingRow = existing.rows?.[0];
      if (!existingRow) return res.status(404).json({ error: 'Process not found' });

      // Validate status_id
      if (status_id) {
        const statusCheck = await query('SELECT id FROM process_status WHERE id = $1', [Number(status_id)]);
        if (!statusCheck.rows?.[0]) {
          return res.status(400).json({ error: 'Invalid status' });
        }
      }

      const sets = ['updated_at = now()'];
      const values = [];
      let idx = 1;

      if (status_id !== undefined) {
        sets.push(`status_id = $${++idx}`);
        values.push(Number(status_id));
      }
      if (kadi_mati_weight !== undefined) {
        sets.push(`kadi_mati_weight = $${++idx}`);
        values.push(Number(kadi_mati_weight) || 0);
      }
      if (dhas_weight !== undefined) {
        sets.push(`dhas_weight = $${++idx}`);
        values.push(Number(dhas_weight) || 0);
      }

      if (sets.length === 1) {
        // Only updated_at would change; still proceed to return current row
      } else {
        const updateSql = `UPDATE process SET ${sets.join(', ')} WHERE id = $1 RETURNING id`;
        await query(updateSql, [Number(id), ...values]);
      }

      if (status_id !== undefined) {
        await query(
          `
            INSERT INTO process_status_history (
              process_id, from_status_id, to_status_id, changed_by, notes
            ) VALUES ($1, $2, $3, $4, $5)
          `,
          [
            Number(id),
            existingRow.status_id !== null ? Number(existingRow.status_id) : null,
            Number(status_id),
            'System',
            remarks || `Status updated to ${status_id}`
          ]
        );
      }

      const result = await query(
        `
          SELECT
            p.*,
            json_build_object(
              'lot_code', l.lot_code,
              'lot_date', l.lot_date,
              'total_input_weight', l.total_input_weight
            ) AS lots,
            json_build_object(
              'status_code', ps.status_code,
              'label', ps.label,
              'description', ps.description
            ) AS process_status
          FROM process p
          LEFT JOIN lots l ON l.id = p.lot_id
          LEFT JOIN process_status ps ON ps.id = p.status_id
          WHERE p.id = $1
        `,
        [Number(id)]
      );

      return res.status(200).json(normalizeProcessRow(result.rows?.[0]));
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await query('DELETE FROM process WHERE id = $1', [Number(id)]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Process not found' });
      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
