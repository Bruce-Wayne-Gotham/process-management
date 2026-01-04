import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM jardi_output WHERE id = $1', [id]);
      return res.status(200).json(result.rows[0] || null);
    }
    if (req.method === 'PUT') {
      const { jardi_weight, grade, remarks } = req.body;
      const result = await query('UPDATE jardi_output SET jardi_weight = $1, grade = $2, remarks = $3 WHERE id = $4 RETURNING *', [jardi_weight, grade || null, remarks || null, id]);
      return res.status(200).json(result.rows[0] || null);
    }
    if (req.method === 'DELETE') {
      await query('DELETE FROM jardi_output WHERE id = $1', [id]);
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
      const { data: jardiOutput, error } = await supabase
        .from('jardi_output')
        .select(`
          *,
          process (
            process_code,
            process_date,
            input_weight,
            kadi_mati_weight,
            dhas_weight,
            net_loss_weight,
            lots (
              lot_code,
              lot_date
            ),
            process_status (
              status_code,
              label
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Jardi output not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(jardiOutput);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { 
        jardi_weight, 
        grade,
        packaging_type,
        num_packages,
        avg_package_weight,
        remarks
      } = req.body;

      const updateData = {};
      if (jardi_weight !== undefined) updateData.jardi_weight = parseFloat(jardi_weight);
      if (grade !== undefined) updateData.grade = grade || null;
      if (packaging_type !== undefined) updateData.packaging_type = packaging_type || null;
      if (num_packages !== undefined) updateData.num_packages = num_packages ? parseInt(num_packages) : null;
      if (avg_package_weight !== undefined) updateData.avg_package_weight = avg_package_weight ? parseFloat(avg_package_weight) : null;
      if (remarks !== undefined) updateData.remarks = remarks || null;

      const { data: jardiOutput, error } = await supabase
        .from('jardi_output')
        .update(updateData)
        .eq('id', id)
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
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Jardi output not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(jardiOutput);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('jardi_output')
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
