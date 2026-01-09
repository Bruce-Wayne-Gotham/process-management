import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const sql = `
        SELECT
          jo.*,
          json_build_object(
            'process_code', p.process_code,
            'process_date', p.process_date,
            'input_weight', p.input_weight,
            'kadi_mati_weight', p.kadi_mati_weight,
            'dhas_weight', p.dhas_weight,
            'net_loss_weight', p.net_loss_weight,
            'lots', json_build_object(
              'lot_code', l.lot_code,
              'lot_date', l.lot_date
            ),
            'process_status', json_build_object(
              'status_code', ps.status_code,
              'label', ps.label
            )
          ) AS process
        FROM jardi_output jo
        LEFT JOIN process p ON p.id = jo.process_id
        LEFT JOIN lots l ON l.id = p.lot_id
        LEFT JOIN process_status ps ON ps.id = p.status_id
        WHERE jo.id = $1
      `;
      const result = await query(sql, [id]);
      const row = result.rows?.[0];
      if (!row) {
        return res.status(404).json({ error: 'Jardi output not found' });
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
        jardi_weight,
        grade,
        packaging_type,
        num_packages,
        avg_package_weight,
        remarks
      } = req.body;

      const updateData = {};
      if (jardi_weight !== undefined) updateData.jardi_weight = parseFloat(jardi_weight);
      if (grade !== undefined) updateData.grade = grade || null;
      if (packaging_type !== undefined) updateData.packaging_type = packaging_type || null;
      if (num_packages !== undefined) updateData.num_packages = num_packages ? parseInt(num_packages) : null;
      if (avg_package_weight !== undefined) updateData.avg_package_weight = avg_package_weight ? parseFloat(avg_package_weight) : null;
      if (remarks !== undefined) updateData.remarks = remarks || null;

      const sql = `
        UPDATE jardi_output
        SET
          jardi_weight = COALESCE($1, jardi_weight),
          grade = COALESCE($2, grade),
          packaging_type = COALESCE($3, packaging_type),
          num_packages = COALESCE($4, num_packages),
          avg_package_weight = COALESCE($5, avg_package_weight),
          remarks = COALESCE($6, remarks),
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `;
      const result = await query(sql, [
        updateData.jardi_weight,
        updateData.grade,
        updateData.packaging_type,
        updateData.num_packages,
        updateData.avg_package_weight,
        updateData.remarks,
        id
      ]);
      const row = result.rows?.[0];
      if (!row) {
        return res.status(404).json({ error: 'Jardi output not found' });
      }
      return res.status(200).json(row);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await query('DELETE FROM jardi_output WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Jardi output not found' });
      }
      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}