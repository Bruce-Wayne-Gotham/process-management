import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      start_date,
      end_date,
      payment_mode,
      farmer_id,
      group_by = 'date'
    } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (start_date) {
      conditions.push(`pay.payment_date >= $${idx++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`pay.payment_date <= $${idx++}`);
      params.push(end_date);
    }

    if (payment_mode) {
      conditions.push(`pay.payment_mode = $${idx++}`);
      params.push(payment_mode);
    }

    if (farmer_id) {
      conditions.push(`p.farmer_id = $${idx++}`);
      params.push(farmer_id);
    }

    let sql = `
      SELECT
        pay.*,
        json_build_object(
          'id', p.id,
          'total_amount', p.total_amount,
          'farmers', json_build_object(
            'farmer_code', f.farmer_code,
            'name', f.name,
            'village', f.village
          )
        ) AS purchases
      FROM payments pay
      LEFT JOIN purchases p ON p.id = pay.purchase_id
      LEFT JOIN farmers f ON f.id = p.farmer_id
    `;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY pay.payment_date ASC';

    const result = await query(sql, params);
    const payments = result.rows || [];

    const totalPayments = payments.length;
    const totalAmountPaid =
      payments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0) || 0;
    const totalPurchaseAmount =
      payments.reduce(
        (sum, p) => sum + parseFloat(p.purchases?.total_amount || 0),
        0
      ) || 0;
    const pendingAmount = totalPurchaseAmount - totalAmountPaid;

    const paymentModeBreakdown = payments.reduce((acc, payment) => {
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

    let groupedData = {};

    if (group_by === 'date') {
      groupedData = payments.reduce((acc, payment) => {
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
        acc[date].totalPurchaseAmount += parseFloat(
          payment.purchases?.total_amount || 0
        );
        acc[date].payments.push(payment);
        return acc;
      }, {});
    } else if (group_by === 'farmer') {
      groupedData = payments.reduce((acc, payment) => {
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
        acc[farmerName].totalPurchaseAmount += parseFloat(
          payment.purchases?.total_amount || 0
        );
        acc[farmerName].payments.push(payment);
        return acc;
      }, {});
    } else if (group_by === 'mode') {
      groupedData = payments.reduce((acc, payment) => {
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
        acc[mode].totalPurchaseAmount += parseFloat(
          payment.purchases?.total_amount || 0
        );
        acc[mode].payments.push(payment);
        return acc;
      }, {});
    }

    Object.keys(groupedData).forEach(key => {
      const group = groupedData[key];
      group.pendingAmount = group.totalPurchaseAmount - group.totalAmountPaid;
      group.paymentPercentage =
        group.totalPurchaseAmount > 0
          ? (group.totalAmountPaid / group.totalPurchaseAmount) * 100
          : 0;
    });

    const reportData = {
      summary: {
        totalPayments,
        totalAmountPaid,
        totalPurchaseAmount,
        pendingAmount,
        paymentPercentage:
          totalPurchaseAmount > 0
            ? (totalAmountPaid / totalPurchaseAmount) * 100
            : 0,
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
