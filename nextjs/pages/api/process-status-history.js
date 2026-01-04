import { query } from '../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM process ORDER BY created_at DESC');
      return res.status(200).json(result.rows || []);
    }

    if (req.method === 'POST') {
      const { process_id, status, notes } = req.body;
      if (!process_id || !status) {
        return res.status(400).json({ error: 'process_id and status are required' });
      }
      const result = await query('SELECT * FROM process WHERE id = $1', [process_id]);
      return res.status(201).json(result.rows[0] || {});
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { process_id } = req.query;
      
      let query = supabase
        .from('process_status_history')
        .select(`
          *,
          processes (
            process_code,
            process_date
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
        .order('changed_at', { ascending: false });

      if (process_id) {
        query = query.eq('process_id', process_id);
      }

      const { data: statusHistory, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(statusHistory || []);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        process_id, 
        from_status_id,
        to_status_id,
        changed_by,
        changed_at,
        notes
      } = req.body;

      // Validation
      if (!process_id || !to_status_id) {
        return res.status(400).json({ 
          error: 'Process ID and to status ID are required' 
        });
      }

      // Verify process exists
      const { data: process, error: processError } = await supabase
        .from('process')
        .select('id, status_id')
        .eq('id', process_id)
        .single();

      if (processError || !process) {
        return res.status(400).json({ error: 'Process not found' });
      }

      // Verify status exists
      const { data: status, error: statusError } = await supabase
        .from('process_status')
        .select('id')
        .eq('id', to_status_id)
        .single();

      if (statusError || !status) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const { data: statusHistory, error } = await supabase
        .from('process_status_history')
        .insert([{
          process_id: parseInt(process_id),
          from_status_id: from_status_id || process.status_id,
          to_status_id: parseInt(to_status_id),
          changed_by: changed_by || 'System',
          changed_at: changed_at || new Date().toISOString(),
          notes: notes || null
        }])
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
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(statusHistory);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
