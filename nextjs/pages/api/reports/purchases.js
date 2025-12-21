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
      const { 
        start_date, 
        end_date, 
        farmer_id,
        village,
        group_by = 'date'
      } = req.query;

      let query = supabase
        .from('purchases')
        .select(`
          *,
          farmers (
            farmer_code,
            name,
            village,
            efficacy_score
          )
        `);

      // Apply date filters
      if (start_date) {
        query = query.gte('purchase_date', start_date);
      }
      if (end_date) {
        query = query.lte('purchase_date', end_date);
      }

      // Apply farmer filter
      if (farmer_id) {
        query = query.eq('farmer_id', farmer_id);
      }

      // Apply village filter
      if (village) {
        query = query.ilike('farmers.village', `%${village}%`);
      }

      query = query.order('purchase_date', { ascending: true });

      const { data: purchases, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Generate summary statistics
      const totalPurchases = purchases?.length || 0;
      const totalAmount = purchases?.reduce((sum, p) => sum + parseFloat(p.total_amount), 0) || 0;
      const totalWeight = purchases?.reduce((sum, p) => sum + parseFloat(p.process_weight), 0) || 0;
      const avgRatePerKg = totalWeight > 0 ? totalAmount / totalWeight : 0;

      // Group data based on group_by parameter
      let groupedData = {};
      
      if (group_by === 'date') {
        groupedData = purchases?.reduce((acc, purchase) => {
          const date = purchase.purchase_date;
          if (!acc[date]) {
            acc[date] = {
              date,
              count: 0,
              totalAmount: 0,
              totalWeight: 0,
              purchases: []
            };
          }
          acc[date].count++;
          acc[date].totalAmount += parseFloat(purchase.total_amount);
          acc[date].totalWeight += parseFloat(purchase.process_weight);
          acc[date].purchases.push(purchase);
          return acc;
        }, {});
      } else if (group_by === 'farmer') {
        groupedData = purchases?.reduce((acc, purchase) => {
          const farmerName = purchase.farmers?.name || 'Unknown';
          if (!acc[farmerName]) {
            acc[farmerName] = {
              farmerName,
              farmerCode: purchase.farmers?.farmer_code,
              village: purchase.farmers?.village,
              efficacyScore: purchase.farmers?.efficacy_score,
              count: 0,
              totalAmount: 0,
              totalWeight: 0,
              purchases: []
            };
          }
          acc[farmerName].count++;
          acc[farmerName].totalAmount += parseFloat(purchase.total_amount);
          acc[farmerName].totalWeight += parseFloat(purchase.process_weight);
          acc[farmerName].purchases.push(purchase);
          return acc;
        }, {});
      } else if (group_by === 'village') {
        groupedData = purchases?.reduce((acc, purchase) => {
          const village = purchase.farmers?.village || 'Unknown';
          if (!acc[village]) {
            acc[village] = {
              village,
              count: 0,
              totalAmount: 0,
              totalWeight: 0,
              farmers: new Set(),
              purchases: []
            };
          }
          acc[village].count++;
          acc[village].totalAmount += parseFloat(purchase.total_amount);
          acc[village].totalWeight += parseFloat(purchase.process_weight);
          acc[village].farmers.add(purchase.farmers?.name);
          acc[village].purchases.push(purchase);
          return acc;
        }, {});

        // Convert Set to count
        Object.keys(groupedData).forEach(village => {
          groupedData[village].uniqueFarmers = groupedData[village].farmers.size;
          delete groupedData[village].farmers;
        });
      }

      const reportData = {
        summary: {
          totalPurchases,
          totalAmount,
          totalWeight,
          avgRatePerKg,
          dateRange: {
            start: start_date || 'All time',
            end: end_date || 'All time'
          }
        },
        groupBy: group_by,
        data: Object.values(groupedData),
        rawData: purchases
      };

      return res.status(200).json(reportData);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
