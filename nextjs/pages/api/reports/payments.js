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
        payment_mode,
        farmer_id,
        group_by = 'date'
      } = req.query;

      let query = supabase
        .from('payments')
        .select(`
          *,
          purchases (
            id,
            total_amount,
            farmers (
              farmer_code,
              name,
              village
            )
          )
        `);

      // Apply date filters
      if (start_date) {
        query = query.gte('payment_date', start_date);
      }
      if (end_date) {
        query = query.lte('payment_date', end_date);
      }

      // Apply payment mode filter
      if (payment_mode) {
        query = query.eq('payment_mode', payment_mode);
      }

      // Apply farmer filter (through purchases)
      if (farmer_id) {
        query = query.eq('purchases.farmer_id', farmer_id);
      }

      query = query.order('payment_date', { ascending: true });

      const { data: payments, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Calculate summary statistics
      const totalPayments = payments?.length || 0;
      const totalAmountPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0) || 0;
      const totalPurchaseAmount = payments?.reduce((sum, p) => sum + parseFloat(p.purchases?.total_amount || 0), 0) || 0;
      const pendingAmount = totalPurchaseAmount - totalAmountPaid;

      // Payment mode breakdown
      const paymentModeBreakdown = payments?.reduce((acc, payment) => {
        const mode = payment.payment_mode || 'Unknown';
        if (!acc[mode]) {
          acc[mode] = {
            mode,
            count: 0,
            totalAmount: 0
          };
        }
        acc[mode].count++;
        acc[mode].totalAmount += parseFloat(payment.amount_paid);
        return acc;
      }, {});

      // Group data based on group_by parameter
      let groupedData = {};
      
      if (group_by === 'date') {
        groupedData = payments?.reduce((acc, payment) => {
          const date = payment.payment_date;
          if (!acc[date]) {
            acc[date] = {
              date,
              count: 0,
              totalAmountPaid: 0,
              totalPurchaseAmount: 0,
              payments: []
            };
          }
          acc[date].count++;
          acc[date].totalAmountPaid += parseFloat(payment.amount_paid);
          acc[date].totalPurchaseAmount += parseFloat(payment.purchases?.total_amount || 0);
          acc[date].payments.push(payment);
          return acc;
        }, {});
      } else if (group_by === 'farmer') {
        groupedData = payments?.reduce((acc, payment) => {
          const farmerName = payment.purchases?.farmers?.name || 'Unknown';
          if (!acc[farmerName]) {
            acc[farmerName] = {
              farmerName,
              farmerCode: payment.purchases?.farmers?.farmer_code,
              village: payment.purchases?.farmers?.village,
              count: 0,
              totalAmountPaid: 0,
              totalPurchaseAmount: 0,
              payments: []
            };
          }
          acc[farmerName].count++;
          acc[farmerName].totalAmountPaid += parseFloat(payment.amount_paid);
          acc[farmerName].totalPurchaseAmount += parseFloat(payment.purchases?.total_amount || 0);
          acc[farmerName].payments.push(payment);
          return acc;
        }, {});
      } else if (group_by === 'mode') {
        groupedData = payments?.reduce((acc, payment) => {
          const mode = payment.payment_mode || 'Unknown';
          if (!acc[mode]) {
            acc[mode] = {
              mode,
              count: 0,
              totalAmountPaid: 0,
              totalPurchaseAmount: 0,
              payments: []
            };
          }
          acc[mode].count++;
          acc[mode].totalAmountPaid += parseFloat(payment.amount_paid);
          acc[mode].totalPurchaseAmount += parseFloat(payment.purchases?.total_amount || 0);
          acc[mode].payments.push(payment);
          return acc;
        }, {});
      }

      // Calculate pending amounts for each group
      Object.keys(groupedData).forEach(key => {
        const group = groupedData[key];
        group.pendingAmount = group.totalPurchaseAmount - group.totalAmountPaid;
        group.paymentPercentage = group.totalPurchaseAmount > 0 ? (group.totalAmountPaid / group.totalPurchaseAmount) * 100 : 0;
      });

      const reportData = {
        summary: {
          totalPayments,
          totalAmountPaid,
          totalPurchaseAmount,
          pendingAmount,
          paymentPercentage: totalPurchaseAmount > 0 ? (totalAmountPaid / totalPurchaseAmount) * 100 : 0,
          paymentModeBreakdown: Object.values(paymentModeBreakdown || {}),
          dateRange: {
            start: start_date || 'All time',
            end: end_date || 'All time'
          }
        },
        groupBy: group_by,
        data: Object.values(groupedData),
        rawData: payments
      };

      return res.status(200).json(reportData);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
