import { query } from '../../lib/db-init';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const [
        farmersCountRes,
        purchasesCountRes,
        lotsCountRes,
        processesCountRes,
        jardiCountRes,
        paymentsCountRes,
        purchaseSumRes,
        paymentSumRes,
        inputWeightRes,
        jardiWeightRes,
        statusBreakdownRes,
        recentFarmersRes,
        recentPurchasesRes,
        recentProcessesRes,
        recentPaymentsRes
      ] = await Promise.all([
        query('SELECT COUNT(*)::int AS count FROM farmers'),
        query('SELECT COUNT(*)::int AS count FROM purchases'),
        query('SELECT COUNT(*)::int AS count FROM lots'),
        query('SELECT COUNT(*)::int AS count FROM process'),
        query('SELECT COUNT(*)::int AS count FROM jardi_output'),
        query('SELECT COUNT(*)::int AS count FROM payments'),
        query('SELECT COALESCE(SUM(total_amount), 0)::numeric AS sum FROM purchases'),
        query('SELECT COALESCE(SUM(amount_paid), 0)::numeric AS sum FROM payments'),
        query('SELECT COALESCE(SUM(input_weight), 0)::numeric AS sum FROM process'),
        query('SELECT COALESCE(SUM(jardi_weight), 0)::numeric AS sum FROM jardi_output'),
        query(`
          SELECT COALESCE(ps.label, 'Unknown') AS label, COUNT(*)::int AS count
          FROM process p
          LEFT JOIN process_status ps ON ps.id = p.status_id
          GROUP BY COALESCE(ps.label, 'Unknown')
        `),
        query('SELECT id, farmer_code, name, village, created_at FROM farmers ORDER BY created_at DESC LIMIT 5'),
        query(`
          SELECT
            p.id,
            p.purchase_date,
            p.total_amount,
            json_build_object('farmer_code', f.farmer_code, 'name', f.name) AS farmers
          FROM purchases p
          LEFT JOIN farmers f ON f.id = p.farmer_id
          ORDER BY p.purchase_date DESC, p.created_at DESC
          LIMIT 5
        `),
        query(`
          SELECT
            pr.id,
            pr.process_code,
            pr.process_date,
            pr.input_weight,
            json_build_object('status_code', ps.status_code, 'label', ps.label) AS process_status,
            json_build_object('lot_code', l.lot_code) AS lots
          FROM process pr
          LEFT JOIN process_status ps ON ps.id = pr.status_id
          LEFT JOIN lots l ON l.id = pr.lot_id
          ORDER BY pr.created_at DESC
          LIMIT 5
        `),
        query(`
          SELECT
            pay.id,
            pay.payment_date,
            pay.amount_paid,
            pay.payment_mode,
            json_build_object(
              'id', pur.id,
              'farmers', json_build_object('farmer_code', f.farmer_code, 'name', f.name)
            ) AS purchases
          FROM payments pay
          LEFT JOIN purchases pur ON pur.id = pay.purchase_id
          LEFT JOIN farmers f ON f.id = pur.farmer_id
          ORDER BY pay.payment_date DESC, pay.created_at DESC
          LIMIT 5
        `)
      ]);

      const totalFarmers = farmersCountRes.rows?.[0]?.count || 0;
      const totalPurchases = purchasesCountRes.rows?.[0]?.count || 0;
      const totalLots = lotsCountRes.rows?.[0]?.count || 0;
      const totalProcesses = processesCountRes.rows?.[0]?.count || 0;
      const totalJardiOutputs = jardiCountRes.rows?.[0]?.count || 0;
      const totalPayments = paymentsCountRes.rows?.[0]?.count || 0;

      const purchaseSum = Number(purchaseSumRes.rows?.[0]?.sum || 0);
      const paymentSum = Number(paymentSumRes.rows?.[0]?.sum || 0);
      const totalInputWeight = Number(inputWeightRes.rows?.[0]?.sum || 0);
      const totalJardiWeight = Number(jardiWeightRes.rows?.[0]?.sum || 0);

      const processStatusBreakdown = (statusBreakdownRes.rows || []).reduce((acc, row) => {
        acc[row.label] = row.count;
        return acc;
      }, {});

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
          farmers: recentFarmersRes.rows || [],
          purchases: recentPurchasesRes.rows || [],
          processes: recentProcessesRes.rows || [],
          payments: recentPaymentsRes.rows || []
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
