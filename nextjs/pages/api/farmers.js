import { query } from '../../lib/db-init';

export default async function handler(req, res) {
  try {
    console.log('[farmers.js] Incoming request:', { method: req.method, url: req.url });
    
    if (req.method === 'GET') {
      console.log('[farmers.js] Processing GET request...');
      try {
        const result = await query('SELECT * FROM farmers ORDER BY created_at DESC');
        console.log('[farmers.js] Query successful, rows:', result.rows?.length || 0);
        return res.status(200).json(result.rows || []);
      } catch (dbError) {
        console.error('[farmers.js] Database query failed:', {
          message: dbError.message,
          code: dbError.code,
          detail: dbError.detail,
          stack: dbError.stack
        });
        throw dbError;
      }
    }

    if (req.method === 'POST') {
      const {
        farmer_code,
        name,
        village,
        contact_number,
        aadhaar_no,
        dob,
        account_holder_name,
        bank_name,
        branch_name,
        account_number,
        ifsc_code,
        upi_id,
        efficacy_score,
        efficacy_notes
      } = req.body;

      if (!farmer_code || !name) {
        return res.status(400).json({ error: 'farmer_code and name are required' });
      }

      const insertSql = `
        INSERT INTO farmers (
          farmer_code, name, village, contact_number, aadhaar_no, dob,
          account_holder_name, bank_name, branch_name, account_number,
          ifsc_code, upi_id, efficacy_score, efficacy_notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14
        )
        RETURNING *
      `;

      const values = [
        farmer_code,
        name,
        village || null,
        contact_number || null,
        aadhaar_no || null,
        dob || null,
        account_holder_name || null,
        bank_name || null,
        branch_name || null,
        account_number || null,
        ifsc_code || null,
        upi_id || null,
        efficacy_score !== undefined && efficacy_score !== null && efficacy_score !== '' ? Number(efficacy_score) : null,
        efficacy_notes || null
      ];

      const result = await query(insertSql, values);
      return res.status(201).json(result.rows?.[0]);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('[farmers.js] API error caught:', {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      stack: err?.stack,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    });
    
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'farmer_code already exists' });
    }
    
    return res.status(500).json({ 
      error: err?.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? {
        code: err?.code,
        detail: err?.detail
      } : undefined
    });
  }
}
