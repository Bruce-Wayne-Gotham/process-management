import { query } from '../../../lib/db';

function normalizeLotRow(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id !== null ? Number(row.id) : null,
    total_input_weight: row.total_input_weight !== null ? Number(row.total_input_weight) : null,
    lot_purchases: row.lot_purchases || []
  };
}

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

async function generateEwayBillForLot(lotId, extraPayload) {
  const lotResult = await query(
    `
      SELECT
        l.id,
        l.lot_code,
        l.lot_date,
        l.total_input_weight,
        COALESCE(SUM(p.total_amount), 0) AS total_value
      FROM lots l
      LEFT JOIN lot_purchases lp ON lp.lot_id = l.id
      LEFT JOIN purchases p ON p.id = lp.purchase_id
      WHERE l.id = $1
      GROUP BY l.id, l.lot_code, l.lot_date, l.total_input_weight
    `,
    [lotId]
  );

  const lot = lotResult.rows?.[0];
  if (!lot) {
    return { notFound: true };
  }

  const totalValueNumber =
    lot.total_value !== null && lot.total_value !== undefined
      ? Number(lot.total_value)
      : 0;
  const totalWeightNumber =
    lot.total_input_weight !== null && lot.total_input_weight !== undefined
      ? Number(lot.total_input_weight)
      : 0;

  const payload = {
    ...extraPayload,
    docNo: extraPayload.docNo || lot.lot_code,
    docDate: extraPayload.docDate || formatDateDDMMYYYY(lot.lot_date),
    totalQty:
      extraPayload.totalQty !== undefined
        ? extraPayload.totalQty
        : totalWeightNumber,
    totalValue:
      extraPayload.totalValue !== undefined
        ? extraPayload.totalValue
        : totalValueNumber,
    totInvValue:
      extraPayload.totInvValue !== undefined
        ? extraPayload.totInvValue
        : totalValueNumber
  };

  const baseUrl = process.env.EWB_API_BASE_URL;
  const token = process.env.EWB_API_AUTH_TOKEN;

  if (!baseUrl || !token) {
    return { error: 'EWB API configuration missing' };
  }

  const response = await fetch(`${baseUrl}/ewaybill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    return {
      error: 'Failed to generate e-way bill',
      status: response.status,
      details: data
    };
  }

  return { data };
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const sql = `
        SELECT
          l.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', lp.id,
                'purchase_id', lp.purchase_id,
                'used_weight', lp.used_weight,
                'purchases', json_build_object(
                  'id', p.id,
                  'farmer_id', p.farmer_id,
                  'purchase_date', p.purchase_date,
                  'process_weight', p.process_weight,
                  'total_amount', p.total_amount,
                  'farmers', json_build_object(
                    'farmer_code', f.farmer_code,
                    'name', f.name,
                    'village', f.village
                  )
                )
              )
            ) FILTER (WHERE lp.id IS NOT NULL),
            '[]'::json
          ) AS lot_purchases
        FROM lots l
        LEFT JOIN lot_purchases lp ON lp.lot_id = l.id
        LEFT JOIN purchases p ON p.id = lp.purchase_id
        LEFT JOIN farmers f ON f.id = p.farmer_id
        WHERE l.id = $1
        GROUP BY l.id
      `;
      const result = await query(sql, [id]);
      const row = result.rows?.[0];

      if (!row) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      return res.status(200).json(normalizeLotRow(row));
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { lot_code, lot_date, total_input_weight, remarks } = req.body;

      const updated = await query(
        `
        UPDATE lots
        SET
          lot_code = COALESCE($1, lot_code),
          lot_date = COALESCE($2, lot_date),
          total_input_weight = COALESCE($3, total_input_weight),
          remarks = COALESCE($4, remarks)
        WHERE id = $5
        RETURNING *
      `,
        [
          lot_code !== undefined ? lot_code : null,
          lot_date !== undefined ? lot_date : null,
          total_input_weight !== undefined ? parseFloat(total_input_weight) : null,
          remarks !== undefined ? remarks || null : null,
          id
        ]
      );

      const row = updated.rows?.[0];
      if (!row) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      return res.status(200).json(row);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const extraPayload = body.payload || {};
      const result = await generateEwayBillForLot(id, extraPayload);

      if (result.notFound) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      if (result.error) {
        const status =
          result.status && Number.isInteger(result.status) ? result.status : 500;
        return res
          .status(status)
          .json({ error: result.error, details: result.details || null });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await query('DELETE FROM lots WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Lot not found' });
      }
      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
