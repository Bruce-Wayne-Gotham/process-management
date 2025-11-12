import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
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

    const { data, error } = await supabase
      .from('farmers')
      .insert({
        farmer_code,
        name,
        village: village || null,
        contact_number: contact_number || null,
        aadhaar_no: aadhaar_no || null,
        dob: dob || null,
        account_holder_name: account_holder_name || null,
        bank_name: bank_name || null,
        branch_name: branch_name || null,
        account_number: account_number || null,
        ifsc_code: ifsc_code || null,
        upi_id: upi_id || null,
        efficacy_score: efficacy_score ? Number(efficacy_score) : null,
        efficacy_notes: efficacy_notes || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'farmer_code already exists' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
