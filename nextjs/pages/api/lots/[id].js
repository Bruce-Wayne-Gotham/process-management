import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM lots WHERE id = $1', [id]);
      return res.status(200).json(result.rows[0] || null);
    }
    if (req.method === 'PUT') {
      const { lot_code, lot_date, total_input_weight, remarks } = req.body;
      const result = await query('UPDATE lots SET lot_code = $1, lot_date = $2, total_input_weight = $3, remarks = $4 WHERE id = $5 RETURNING *', [lot_code, lot_date, total_input_weight, remarks || null, id]);
      return res.status(200).json(result.rows[0] || null);
    }
    if (req.method === 'DELETE') {
      await query('DELETE FROM lots WHERE id = $1', [id]);
      return res.status(204).send();
    }
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

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
      const { data: lot, error } = await supabase
        .from('lots')
        .select(`
          *,
          lot_purchases (
            id,
            purchase_id,
            used_weight,
            purchases (
              id,
              farmer_id,
              purchase_date,
              process_weight,
              total_amount,
              farmers (
                farmer_code,
                name,
                village
              )
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Lot not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(lot);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { lot_code, lot_date, total_input_weight, remarks } = req.body;

      const updateData = {};
      if (lot_code !== undefined) updateData.lot_code = lot_code;
      if (lot_date !== undefined) updateData.lot_date = lot_date;
      if (total_input_weight !== undefined) updateData.total_input_weight = parseFloat(total_input_weight);
      if (remarks !== undefined) updateData.remarks = remarks || null;

      const { data: lot, error } = await supabase
        .from('lots')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Lot not found' });
        }
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Lot code already exists' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(lot);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('lots')
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
