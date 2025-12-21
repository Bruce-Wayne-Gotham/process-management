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
      const { data: statusHistory, error } = await supabase
        .from('process_status_history')
        .select(`
          *,
          processes (
            process_code,
            process_date,
            input_weight,
            lots (
              lot_code,
              lot_date
            )
          ),
          from_status (
            status_code,
            label,
            description
          ),
          to_status (
            status_code,
            label,
            description
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Status history record not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(statusHistory);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { 
        changed_by,
        changed_at,
        notes
      } = req.body;

      const updateData = {};
      if (changed_by !== undefined) updateData.changed_by = changed_by;
      if (changed_at !== undefined) updateData.changed_at = changed_at;
      if (notes !== undefined) updateData.notes = notes || null;

      const { data: statusHistory, error } = await supabase
        .from('process_status_history')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          processes (
            process_code,
            process_date
          ),
          from_status (
            status_code,
            label
          ),
          to_status (
            status_code,
            label
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Status history record not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(statusHistory);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('process_status_history')
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
