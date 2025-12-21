import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: farmer, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Farmer not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(farmer);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
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
        efficacy_notes,
        is_active
      } = req.body;

      const updateData = {};
      if (farmer_code !== undefined) updateData.farmer_code = farmer_code;
      if (name !== undefined) updateData.name = name;
      if (village !== undefined) updateData.village = village || null;
      if (contact_number !== undefined) updateData.contact_number = contact_number || null;
      if (aadhaar_no !== undefined) updateData.aadhaar_no = aadhaar_no || null;
      if (dob !== undefined) updateData.dob = dob || null;
      if (account_holder_name !== undefined) updateData.account_holder_name = account_holder_name || null;
      if (bank_name !== undefined) updateData.bank_name = bank_name || null;
      if (branch_name !== undefined) updateData.branch_name = branch_name || null;
      if (account_number !== undefined) updateData.account_number = account_number || null;
      if (ifsc_code !== undefined) updateData.ifsc_code = ifsc_code || null;
      if (upi_id !== undefined) updateData.upi_id = upi_id || null;
      if (efficacy_score !== undefined) updateData.efficacy_score = efficacy_score ? parseFloat(efficacy_score) : null;
      if (efficacy_notes !== undefined) updateData.efficacy_notes = efficacy_notes || null;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: farmer, error } = await supabase
        .from('farmers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Farmer not found' });
        }
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Farmer code already exists' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(farmer);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
