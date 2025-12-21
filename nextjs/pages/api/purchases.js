import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        farmers (
          farmer_code,
          name,
          village
        )
      `)
      .order('purchase_date', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST') {
    const {
      farmer_id,
      purchase_date,
      packaging_type,
      process_weight,
      packaging_weight,
      rate_per_kg,
      remarks
    } = req.body;

    // Validation
    if (!farmer_id || !purchase_date || !packaging_type || !process_weight || !rate_per_kg) {
      return res.status(400).json({ 
        error: 'farmer_id, purchase_date, packaging_type, process_weight, and rate_per_kg are required' 
      });
    }

    if (!['BODH', 'BAG'].includes(packaging_type)) {
      return res.status(400).json({ 
        error: 'packaging_type must be either BODH or BAG' 
      });
    }

    // Parse numeric fields
    const processWeightNum = Number(process_weight);
    const packagingWeightNum = Number(packaging_weight) || 0;
    const ratePerKgNum = Number(rate_per_kg);

    const { data, error } = await supabase
      .from('purchases')
      .insert({
        farmer_id,
        purchase_date,
        packaging_type,
        process_weight: processWeightNum,
        packaging_weight: packagingWeightNum,
        rate_per_kg: ratePerKgNum,
        remarks: remarks || null
      })
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
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
