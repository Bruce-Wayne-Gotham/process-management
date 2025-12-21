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
      // Get all counts and sums in parallel
      const [
        farmersResult,
        purchasesResult,
        lotsResult,
        processesResult,
        jardiResult,
        paymentsResult
      ] = await Promise.all([
        // Farmers count
        supabase
          .from('farmers')
          .select('id', { count: 'exact', head: true }),
        
        // Purchases count and total amount
        supabase
          .from('purchases')
          .select('total_amount', { count: 'exact', head: true }),
        
        // Lots count
        supabase
          .from('lots')
          .select('id', { count: 'exact', head: true }),
        
        // Processes count by status
        supabase
          .from('process')
          .select('status_id', { count: 'exact', head: true }),
        
        // Jardi outputs count and total weight
        supabase
          .from('jardi_output')
          .select('jardi_weight', { count: 'exact', head: true }),
        
        // Payments count and total amount
        supabase
          .from('payments')
          .select('amount_paid', { count: 'exact', head: true })
      ]);

      // Get detailed data for recent activities
      const [
        recentFarmers,
        recentPurchases,
        recentProcesses,
        recentPayments
      ] = await Promise.all([
        supabase
          .from('farmers')
          .select('id, farmer_code, name, village, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('purchases')
          .select(`
            id,
            purchase_date,
            total_amount,
            farmers (
              farmer_code,
              name
            )
          `)
          .order('purchase_date', { ascending: false })
          .limit(5),
        
        supabase
          .from('process')
          .select(`
            id,
            process_code,
            process_date,
            input_weight,
            process_status (
              status_code,
              label
            ),
            lots (
              lot_code
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('payments')
          .select(`
            id,
            payment_date,
            amount_paid,
            payment_mode,
            purchases (
              id,
              farmers (
                farmer_code,
                name
              )
            )
          `)
          .order('payment_date', { ascending: false })
          .limit(5)
      ]);

      // Calculate detailed stats
      const totalFarmers = farmersResult.count || 0;
      const totalPurchases = purchasesResult.count || 0;
      const totalLots = lotsResult.count || 0;
      const totalProcesses = processesResult.count || 0;
      const totalJardiOutputs = jardiResult.count || 0;
      const totalPayments = paymentsResult.count || 0;

      // Get process status breakdown
      const processStatusData = await supabase
        .from('process')
        .select(`
          status_id,
          process_status (
            status_code,
            label
          )
        `);

      const processStatusBreakdown = processStatusData.data?.reduce((acc, process) => {
        const status = process.process_status?.label || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get financial summaries
      const [purchaseSum, paymentSum] = await Promise.all([
        supabase
          .from('purchases')
          .select('total_amount')
          .then(({ data, error }) => {
            if (error) throw error;
            return data?.reduce((sum, p) => sum + parseFloat(p.total_amount), 0) || 0;
          }),
        
        supabase
          .from('payments')
          .select('amount_paid')
          .then(({ data, error }) => {
            if (error) throw error;
            return data?.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0) || 0;
          })
      ]);

      // Get weight summaries
      const [totalInputWeight, totalJardiWeight] = await Promise.all([
        supabase
          .from('process')
          .select('input_weight')
          .then(({ data, error }) => {
            if (error) throw error;
            return data?.reduce((sum, p) => sum + parseFloat(p.input_weight), 0) || 0;
          }),
        
        supabase
          .from('jardi_output')
          .select('jardi_weight')
          .then(({ data, error }) => {
            if (error) throw error;
            return data?.reduce((sum, j) => sum + parseFloat(j.jardi_weight), 0) || 0;
          })
      ]);

      const dashboardData = {
        counts: {
          farmers: totalFarmers,
          purchases: totalPurchases,
          lots: totalLots,
          processes: totalProcesses,
          jardiOutputs: totalJardiOutputs,
          payments: totalPayments
        },
        financial: {
          totalPurchaseAmount: purchaseSum,
          totalPaymentAmount: paymentSum,
          pendingPayments: purchaseSum - paymentSum
        },
        weights: {
          totalInputWeight,
          totalJardiWeight,
          overallYield: totalInputWeight > 0 ? (totalJardiWeight / totalInputWeight) * 100 : 0
        },
        processStatusBreakdown,
        recentActivities: {
          farmers: recentFarmers.data || [],
          purchases: recentPurchases.data || [],
          processes: recentProcesses.data || [],
          payments: recentPayments.data || []
        }
      };

      return res.status(200).json(dashboardData);
    } catch (error) {
      console.error('Dashboard API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
