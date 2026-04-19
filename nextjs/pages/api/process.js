export const runtime = 'edge';

import { query } from '../../lib/db';

export default async function handler(req, res) {
  function normalizeProcessRow(row) {
    return {
      ...row,
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

  const joinSql = (whereClause = '') => `
    SELECT
      p.*,
      json_object(
        'lot_code', l.lot_code,
        'lot_date', l.lot_date
      ) AS lots,
      json_object(
        'status_code', ps.status_code,
        'label', ps.label
      ) AS process_status
    FROM process p
    LEFT JOIN lots l ON l.id = p.lot_id
    LEFT JOIN process_status ps ON ps.id = p.status_id
    ${whereClause}
    ORDER BY p.created_at DESC
  `;

  try {
    if (req.method === 'GET') {
      const result = await query(joinSql());
      return res.status(200).json((result.rows || []).map(normalizeProcessRow));
    }

    if (req.method === 'POST') {
      const {
        process_code, lot_id, process_date, input_weight,
        kadi_mati_weight = 0, dhas_weight = 0
      } = await req.json();

      if (!process_code || !lot_id || !process_date || !input_weight) {
        return res.status(400).json({
          error: 'Process code, lot ID, date, and input weight are required'
        });
      }

      const inserted = await query(
        `INSERT INTO process (
          process_code, lot_id, process_date, input_weight,
          kadi_mati_weight, dhas_weight, status_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          process_code, Number(lot_id), process_date, Number(input_weight),
          Number(kadi_mati_weight) || 0, Number(dhas_weight) || 0, 1
        ]
      );

      const row = inserted.rows?.[0];
      const result = await query(joinSql('WHERE p.id = $1'), [row.id]);
      return res.status(201).json(normalizeProcessRow(result.rows?.[0]));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error.message?.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Process code or lot already has an active process' });
    }
    console.error('Process API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
