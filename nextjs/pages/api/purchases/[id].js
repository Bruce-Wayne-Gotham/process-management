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
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select(`
          *,
          farmers (
            id,
            farmer_code,
            name,
            village,
            contact_number,
            efficacy_score
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Purchase not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(purchase);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        farmer_id,
        purchase_date,
        packaging_type,
        process_weight,
        packaging_weight,
        rate_per_kg,
        remarks
      } = req.body;

      const updateData = {};
      if (farmer_id !== undefined) updateData.farmer_id = farmer_id;
      if (purchase_date !== undefined) updateData.purchase_date = purchase_date;
      if (packaging_type !== undefined) updateData.packaging_type = packaging_type;
      if (process_weight !== undefined) updateData.process_weight = parseFloat(process_weight);
      if (packaging_weight !== undefined) updateData.packaging_weight = parseFloat(packaging_weight) || 0;
      if (rate_per_kg !== undefined) updateData.rate_per_kg = parseFloat(rate_per_kg);
      if (remarks !== undefined) updateData.remarks = remarks || null;

      // Recalculate computed fields if weights or rate changed
      if (process_weight !== undefined || packaging_weight !== undefined || rate_per_kg !== undefined) {
        const processWeightNum = process_weight !== undefined ? parseFloat(process_weight) : null;
        const packagingWeightNum = packaging_weight !== undefined ? parseFloat(packaging_weight) || 0 : null;
        const ratePerKgNum = rate_per_kg !== undefined ? parseFloat(rate_per_kg) : null;

        if (processWeightNum !== null && packagingWeightNum !== null) {
          updateData.total_weight = processWeightNum + packagingWeightNum;
        }
        if (processWeightNum !== null && ratePerKgNum !== null) {
          updateData.total_amount = processWeightNum * ratePerKgNum;
        }
      }

      const { data: purchase, error } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          farmers (
            farmer_code,
            name,
            village
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Purchase not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(purchase);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('purchases')
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
