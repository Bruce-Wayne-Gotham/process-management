import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      start_date,
      end_date,
      farmer_id,
      village,
      group_by = 'date'
    } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (start_date) {
      conditions.push(`p.purchase_date >= $${idx++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`p.purchase_date <= $${idx++}`);
      params.push(end_date);
    }

    if (farmer_id) {
      conditions.push(`p.farmer_id = $${idx++}`);
      params.push(farmer_id);
    }

    if (village) {
      conditions.push(`f.village ILIKE $${idx++}`);
      params.push(`%${village}%`);
    }

    let sql = `
      SELECT
        p.*,
        json_build_object(
          'farmer_code', f.farmer_code,
          'name', f.name,
          'village', f.village,
          'efficacy_score', f.efficacy_score
        ) AS farmers
      FROM purchases p
      LEFT JOIN farmers f ON f.id = p.farmer_id
    `;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY p.purchase_date ASC';

    const result = await query(sql, params);
    const purchases = result.rows || [];

    const totalPurchases = purchases.length;
    const totalAmount =
      purchases.reduce((sum, p) => sum + parseFloat(p.total_amount), 0) || 0;
    const totalWeight =
      purchases.reduce((sum, p) => sum + parseFloat(p.process_weight), 0) || 0;
    const avgRatePerKg = totalWeight > 0 ? totalAmount / totalWeight : 0;

    let groupedData = {};

    if (group_by === 'date') {
      groupedData = purchases.reduce((acc, purchase) => {
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
      groupedData = purchases.reduce((acc, purchase) => {
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
      groupedData = purchases.reduce((acc, purchase) => {
        const villageKey = purchase.farmers?.village || 'Unknown';
        if (!acc[villageKey]) {
          acc[villageKey] = {
            village: villageKey,
            count: 0,
            totalAmount: 0,
            totalWeight: 0,
            farmers: new Set(),
            purchases: []
          };
        }
        acc[villageKey].count++;
        acc[villageKey].totalAmount += parseFloat(purchase.total_amount);
        acc[villageKey].totalWeight += parseFloat(purchase.process_weight);
        acc[villageKey].farmers.add(purchase.farmers?.name);
        acc[villageKey].purchases.push(purchase);
        return acc;
      }, {});

      Object.keys(groupedData).forEach(key => {
        groupedData[key].uniqueFarmers = groupedData[key].farmers.size;
        delete groupedData[key].farmers;
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
