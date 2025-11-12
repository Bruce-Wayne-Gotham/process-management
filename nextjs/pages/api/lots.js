import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data: lots, error } = await supabase
        .from('lots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(lots || []);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { lot_code, lot_date, remarks } = req.body;

      // Validation
      if (!lot_code || !lot_date) {
        return res.status(400).json({ error: 'Lot code and date are required' });
      }

      const { data: lot, error } = await supabase
        .from('lots')
        .insert([{
          lot_code,
          lot_date,
          remarks: remarks || null,
          total_input_weight: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Lot code already exists' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(lot);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
