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
      const { data: process, error } = await supabase
        .from('process')
        .select(`
          *,
          lots (lot_code, lot_date, total_input_weight),
          process_status (status_code, label, description)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Process not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(process);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { status_id, kadi_mati_weight, dhas_weight, remarks } = req.body;

      // Validate status_id
      if (status_id) {
        const { data: status, error: statusError } = await supabase
          .from('process_status')
          .select('id')
          .eq('id', status_id)
          .single();

        if (statusError || !status) {
          return res.status(400).json({ error: 'Invalid status' });
        }
      }

      const updateData = {};
      if (status_id !== undefined) updateData.status_id = status_id;
      if (kadi_mati_weight !== undefined) updateData.kadi_mati_weight = parseFloat(kadi_mati_weight);
      if (dhas_weight !== undefined) updateData.dhas_weight = parseFloat(dhas_weight);
      if (remarks !== undefined) updateData.remarks = remarks;

      const { data: process, error } = await supabase
        .from('process')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Process not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      // Record status change history
      if (status_id !== undefined) {
        await supabase
          .from('process_status_history')
          .insert([{
            process_id: parseInt(id),
            to_status_id: status_id,
            changed_by: 'System', // You can make this dynamic with user auth
            changed_at: new Date().toISOString(),
            notes: remarks || `Status updated to ${status_id}`
          }]);
      }

      return res.status(200).json(process);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('process')
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
