import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM lots WHERE id = $1', [id]);
      return res.status(200).json(result.rows[0] || null);
    }
    if (req.method === 'DELETE') {
      await query('DELETE FROM lots WHERE id = $1', [id]);
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
      const { data: lotPurchase, error } = await supabase
        .from('lot_purchases')
        .select(`
          *,
          lots (
            lot_code,
            lot_date,
            remarks,
            total_input_weight
          ),
          purchases (
            id,
            purchase_date,
            process_weight,
            total_amount,
            farmers (
              farmer_code,
              name,
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
          return res.status(404).json({ error: 'Lot purchase not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(lotPurchase);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { used_weight } = req.body;

      if (used_weight === undefined) {
        return res.status(400).json({ error: 'Used weight is required' });
      }

      // Get current lot purchase to check available weight
      const { data: currentLotPurchase, error: currentError } = await supabase
        .from('lot_purchases')
        .select('purchase_id, used_weight')
        .eq('id', id)
        .single();

      if (currentError || !currentLotPurchase) {
        return res.status(404).json({ error: 'Lot purchase not found' });
      }

      // Check purchase availability
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('process_weight')
        .eq('id', currentLotPurchase.purchase_id)
        .single();

      if (purchaseError || !purchase) {
        return res.status(400).json({ error: 'Related purchase not found' });
      }

      // Calculate total used weight from other lot purchases
      const { data: otherLotPurchases, error: otherError } = await supabase
        .from('lot_purchases')
        .select('used_weight')
        .eq('purchase_id', currentLotPurchase.purchase_id)
        .neq('id', id);

      if (otherError) {
        return res.status(500).json({ error: 'Error checking other lot purchases' });
      }

      const otherUsedWeight = otherLotPurchases.reduce((sum, item) => sum + parseFloat(item.used_weight), 0);
      const availableWeight = parseFloat(purchase.process_weight) - otherUsedWeight;

      if (parseFloat(used_weight) > availableWeight) {
        return res.status(400).json({ 
          error: `Cannot use ${used_weight}kg. Only ${availableWeight.toFixed(1)}kg available from this purchase` 
        });
      }

      const { data: lotPurchase, error } = await supabase
        .from('lot_purchases')
        .update({ used_weight: parseFloat(used_weight) })
        .eq('id', id)
        .select(`
          *,
          lots (
            lot_code,
            lot_date
          ),
          purchases (
            id,
            purchase_date,
            process_weight,
            total_amount,
            farmers (
              farmer_code,
              name,
              village
            )
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Update lot's total input weight
      const { data: lotPurchasesForLot } = await supabase
        .from('lot_purchases')
        .select('used_weight')
        .eq('lot_id', lotPurchase.lot_id);

      if (!lotPurchasesForLot.error) {
        const totalInputWeight = lotPurchasesForLot.reduce((sum, item) => sum + parseFloat(item.used_weight), 0);
        await supabase
          .from('lots')
          .update({ total_input_weight: totalInputWeight })
          .eq('id', lotPurchase.lot_id);
      }

      return res.status(200).json(lotPurchase);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Get lot purchase info before deletion for lot weight update
      const { data: lotPurchase, error: fetchError } = await supabase
        .from('lot_purchases')
        .select('lot_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: 'Lot purchase not found' });
      }

      const { error } = await supabase
        .from('lot_purchases')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Update lot's total input weight
      const { data: remainingLotPurchases } = await supabase
        .from('lot_purchases')
        .select('used_weight')
        .eq('lot_id', lotPurchase.lot_id);

      if (!remainingLotPurchases.error) {
        const totalInputWeight = remainingLotPurchases.reduce((sum, item) => sum + parseFloat(item.used_weight), 0);
        await supabase
          .from('lots')
          .update({ total_input_weight: totalInputWeight })
          .eq('id', lotPurchase.lot_id);
      }

      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
