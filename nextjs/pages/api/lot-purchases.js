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
      const { data: lotPurchases, error } = await supabase
        .from('lot_purchases')
        .select(`
          *,
          lots (
            lot_code,
            lot_date,
            remarks
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(lotPurchases || []);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        lot_id, 
        purchase_id, 
        used_weight 
      } = req.body;

      // Validation
      if (!lot_id || !purchase_id || !used_weight) {
        return res.status(400).json({ 
          error: 'Lot ID, purchase ID, and used weight are required' 
        });
      }

      // Check if lot-purchase combination already exists
      const { data: existing, error: checkError } = await supabase
        .from('lot_purchases')
        .select('id')
        .eq('lot_id', lot_id)
        .eq('purchase_id', purchase_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Check error:', checkError);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing) {
        return res.status(409).json({ 
          error: 'This purchase is already added to this lot' 
        });
      }

      // Verify purchase exists and get available weight
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('process_weight, total_weight')
        .eq('id', purchase_id)
        .single();

      if (purchaseError || !purchase) {
        return res.status(400).json({ error: 'Purchase not found' });
      }

      // Check if used weight exceeds available weight
      const totalUsed = await supabase
        .from('lot_purchases')
        .select('used_weight')
        .eq('purchase_id', purchase_id);

      if (totalUsed.error) {
        return res.status(500).json({ error: 'Error checking used weight' });
      }

      const currentUsed = totalUsed.data.reduce((sum, item) => sum + parseFloat(item.used_weight), 0);
      const availableWeight = parseFloat(purchase.process_weight) - currentUsed;

      if (parseFloat(used_weight) > availableWeight) {
        return res.status(400).json({ 
          error: `Cannot use ${used_weight}kg. Only ${availableWeight.toFixed(1)}kg available from this purchase` 
        });
      }

      const { data: lotPurchase, error } = await supabase
        .from('lot_purchases')
        .insert([{
          lot_id: parseInt(lot_id),
          purchase_id: parseInt(purchase_id),
          used_weight: parseFloat(used_weight)
        }])
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
        if (error.code === '23505') {
          return res.status(409).json({ error: 'This purchase is already added to this lot' });
        }
        return res.status(500).json({ error: error.message });
      }

      // Update lot's total input weight
      const { data: lotPurchasesForLot } = await supabase
        .from('lot_purchases')
        .select('used_weight')
        .eq('lot_id', lot_id);

      if (!lotPurchasesForLot.error) {
        const totalInputWeight = lotPurchasesForLot.reduce((sum, item) => sum + parseFloat(item.used_weight), 0);
        await supabase
          .from('lots')
          .update({ total_input_weight: totalInputWeight })
          .eq('id', lot_id);
      }

      return res.status(201).json(lotPurchase);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
