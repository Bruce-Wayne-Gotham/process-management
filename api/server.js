import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/farmers', async (req, res) => {
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/farmers', async (req, res) => {
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

  res.status(201).json(data);
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  // no-op
});
