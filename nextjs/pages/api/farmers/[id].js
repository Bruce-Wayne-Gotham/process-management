import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM farmers WHERE id = $1', [id]);
      return res.status(200).json(result.rows[0] || null);
    }

    if (req.method === 'PUT') {
      const { name, village, contact_number, farmer_code, aadhaar_no, dob, account_holder_name, bank_name, branch_name, account_number, ifsc_code, upi_id, efficacy_score, efficacy_notes, is_active } = req.body;
      const result = await query(
        'UPDATE farmers SET name = $1, village = $2, contact_number = $3, farmer_code = $4, aadhaar_no = $5, dob = $6, account_holder_name = $7, bank_name = $8, branch_name = $9, account_number = $10, ifsc_code = $11, upi_id = $12, efficacy_score = $13, efficacy_notes = $14, is_active = $15 WHERE id = $16 RETURNING *',
        [name, village || null, contact_number || null, farmer_code, aadhaar_no || null, dob || null, account_holder_name || null, bank_name || null, branch_name || null, account_number || null, ifsc_code || null, upi_id || null, efficacy_score || null, efficacy_notes || null, is_active !== false, id]
      );
      return res.status(200).json(result.rows[0] || null);
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM farmers WHERE id = $1', [id]);
      return res.status(204).send();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
