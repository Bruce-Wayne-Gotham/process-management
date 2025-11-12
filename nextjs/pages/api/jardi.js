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
      const { data: jardiOutputs, error } = await supabase
        .from('jardi_output')
        .select(`
          *,
          process (
            process_code,
            process_date,
            input_weight,
            lots (
              lot_code
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(jardiOutputs || []);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        process_id, 
        jardi_weight, 
        grade,
        packaging_type,
        num_packages,
        avg_package_weight,
        remarks
      } = req.body;

      // Validation
      if (!process_id || !jardi_weight) {
        return res.status(400).json({ 
          error: 'Process ID and jardi weight are required' 
        });
      }

      const { data: jardiOutput, error } = await supabase
        .from('jardi_output')
        .insert([{
          process_id: parseInt(process_id),
          jardi_weight: parseFloat(jardi_weight),
          grade: grade || null,
          packaging_type: packaging_type || null,
          num_packages: num_packages ? parseInt(num_packages) : null,
          avg_package_weight: avg_package_weight ? parseFloat(avg_package_weight) : null,
          remarks: remarks || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Output already exists for this process' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(jardiOutput);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
