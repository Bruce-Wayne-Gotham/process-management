import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM payments WHERE id = $1', [id]);
      return res.status(200).json(result.rows[0] || null);
    }
    if (req.method === 'DELETE') {
      await query('DELETE FROM payments WHERE id = $1', [id]);
      return res.status(204).send();
    }
    res.setHeader('Allow', ['GET', 'DELETE']);
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
      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          *,
          purchases (
            id,
            purchase_date,
            total_amount,
            process_weight,
            rate_per_kg,
            farmers (
              id,
              name,
              farmer_code,
              village,
              contact_number
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Payment not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(payment);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { 
        payment_date, 
        amount_paid,
        payment_mode,
        transaction_ref,
        remarks
      } = req.body;

      const updateData = {};
      if (payment_date !== undefined) updateData.payment_date = payment_date;
      if (amount_paid !== undefined) updateData.amount_paid = parseFloat(amount_paid);
      if (payment_mode !== undefined) updateData.payment_mode = payment_mode;
      if (transaction_ref !== undefined) updateData.transaction_ref = transaction_ref || null;
      if (remarks !== undefined) updateData.remarks = remarks || null;

      const { data: payment, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Payment not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(payment);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('payments')
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
