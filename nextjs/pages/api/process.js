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
      const { data: processes, error } = await supabase
        .from('process')
        .select(`
          *,
          lots (lot_code, lot_date),
          process_status (status_code, label)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(processes || []);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        process_code, 
        lot_id, 
        process_date, 
        input_weight,
        kadi_mati_weight = 0,
        dhas_weight = 0
      } = req.body;

      // Validation
      if (!process_code || !lot_id || !process_date || !input_weight) {
        return res.status(400).json({ 
          error: 'Process code, lot ID, date, and input weight are required' 
        });
      }

      const { data: process, error } = await supabase
        .from('process')
        .insert([{
          process_code,
          lot_id,
          process_date,
          input_weight: parseFloat(input_weight),
          kadi_mati_weight: parseFloat(kadi_mati_weight),
          dhas_weight: parseFloat(dhas_weight),
          status_id: 1 // Default to PENDING
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Process code already exists' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(process);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
