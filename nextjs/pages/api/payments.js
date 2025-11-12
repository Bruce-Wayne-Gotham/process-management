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
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          purchases (
            id,
            purchase_date,
            total_amount,
            farmers (
              name,
              farmer_code,
              village
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(payments || []);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        purchase_id, 
        payment_date, 
        amount_paid,
        payment_mode = 'CASH',
        transaction_ref,
        remarks
      } = req.body;

      // Validation
      if (!purchase_id || !payment_date || !amount_paid) {
        return res.status(400).json({ 
          error: 'Purchase ID, payment date, and amount are required' 
        });
      }

      const { data: payment, error } = await supabase
        .from('payments')
        .insert([{
          purchase_id: parseInt(purchase_id),
          payment_date,
          amount_paid: parseFloat(amount_paid),
          payment_mode,
          transaction_ref: transaction_ref || null,
          remarks: remarks || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(payment);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
