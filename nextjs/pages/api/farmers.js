import dbService from '../../lib/dbService';

export default async function handler(req, res) {
  try {
    await dbService.initialize();
    
    if (req.method === 'GET') {
      const result = await dbService.query('SELECT * FROM farmers ORDER BY created_at DESC');
      return res.status(200).json(result.rows || []);
    }

    if (req.method === 'POST') {
      const {
        farmer_code, name, village, contact_number, aadhaar_no, dob,
        account_holder_name, bank_name, branch_name, account_number,
        ifsc_code, upi_id, efficacy_score, efficacy_notes
      } = req.body;

      if (!farmer_code || !name) {
        return res.status(400).json({ error: 'farmer_code and name are required' });
      }

      const result = await dbService.query(`
        INSERT INTO farmers (
          farmer_code, name, village, contact_number, aadhaar_no, dob,
          account_holder_name, bank_name, branch_name, account_number,
          ifsc_code, upi_id, efficacy_score, efficacy_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        farmer_code, name, village || null, contact_number || null,
        aadhaar_no || null, dob || null, account_holder_name || null,
        bank_name || null, branch_name || null, account_number || null,
        ifsc_code || null, upi_id || null,
        efficacy_score !== undefined && efficacy_score !== null && efficacy_score !== '' ? Number(efficacy_score) : null,
        efficacy_notes || null
      ]);
      return res.status(201).json(result.rows?.[0]);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'farmer_code already exists' });
    }
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
