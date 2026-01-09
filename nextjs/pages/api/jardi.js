import { query } from '../../lib/db-init';

export default async function handler(req, res) {
  function normalizeJardiRow(row) {
    return {
      ...row,
      process_id: row.process_id !== null ? Number(row.process_id) : null,
      jardi_weight: row.jardi_weight !== null ? Number(row.jardi_weight) : null,
      num_packages: row.num_packages !== null ? Number(row.num_packages) : null,
      avg_package_weight: row.avg_package_weight !== null ? Number(row.avg_package_weight) : null,
      total_packed_weight: row.total_packed_weight !== null ? Number(row.total_packed_weight) : null,
      process: row.process || null
    };
  }

  try {
    if (req.method === 'GET') {
      const sql = `
        SELECT
          jo.*,
          json_build_object(
            'process_code', p.process_code,
            'process_date', p.process_date,
            'input_weight', p.input_weight,
            'lots', json_build_object(
              'lot_code', l.lot_code
            )
          ) AS process
        FROM jardi_output jo
        LEFT JOIN process p ON p.id = jo.process_id
        LEFT JOIN lots l ON l.id = p.lot_id
        ORDER BY jo.created_at DESC
      `;

      const result = await query(sql);
      return res.status(200).json((result.rows || []).map(normalizeJardiRow));
    }

    if (req.method === 'POST') {
      const {
        process_id,
        jardi_weight,
        grade,
        packaging_type,
        num_packages,
        avg_package_weight,
        remarks
      } = req.body;

      if (!process_id || !jardi_weight) {
        return res.status(400).json({
          error: 'Process ID and jardi weight are required'
        });
      }

      const insertSql = `
        INSERT INTO jardi_output (
          process_id, jardi_weight, grade, packaging_type, num_packages, avg_package_weight, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const inserted = await query(insertSql, [
        Number(process_id),
        Number(jardi_weight),
        grade || null,
        packaging_type || null,
        num_packages !== undefined && num_packages !== null && num_packages !== '' ? Number(num_packages) : null,
        avg_package_weight !== undefined && avg_package_weight !== null && avg_package_weight !== '' ? Number(avg_package_weight) : null,
        remarks || null
      ]);

      const row = inserted.rows?.[0];

      const selectSql = `
        SELECT
          jo.*,
          json_build_object(
            'process_code', p.process_code,
            'process_date', p.process_date,
            'input_weight', p.input_weight,
            'lots', json_build_object(
              'lot_code', l.lot_code
            )
          ) AS process
        FROM jardi_output jo
        LEFT JOIN process p ON p.id = jo.process_id
        LEFT JOIN lots l ON l.id = p.lot_id
        WHERE jo.id = $1
      `;

      const result = await query(selectSql, [row.id]);
      return res.status(201).json(normalizeJardiRow(result.rows?.[0]));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(400).json({ error: 'Output already exists for this process' });
    }
    console.error('Jardi API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
