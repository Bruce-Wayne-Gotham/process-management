import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      start_date,
      end_date,
      lot_id,
      status_id,
      group_by = 'date'
    } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (start_date) {
      conditions.push(`pr.process_date >= $${idx++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`pr.process_date <= $${idx++}`);
      params.push(end_date);
    }

    if (lot_id) {
      conditions.push(`pr.lot_id = $${idx++}`);
      params.push(lot_id);
    }

    if (status_id) {
      conditions.push(`pr.status_id = $${idx++}`);
      params.push(status_id);
    }

    let sql = `
      SELECT
        pr.*,
        json_build_object(
          'lot_code', l.lot_code,
          'lot_date', l.lot_date,
          'total_input_weight', l.total_input_weight
        ) AS lots,
        json_build_object(
          'status_code', ps.status_code,
          'label', ps.label
        ) AS process_status
      FROM process pr
      LEFT JOIN lots l ON l.id = pr.lot_id
      LEFT JOIN process_status ps ON ps.id = pr.status_id
    `;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY pr.process_date ASC';

    const result = await query(sql, params);
    const processes = result.rows || [];

    const totalProcesses = processes.length;
    const totalInputWeight =
      processes.reduce((sum, p) => sum + parseFloat(p.input_weight), 0) || 0;
    const totalWastage =
      processes.reduce((sum, p) => {
        const wastage =
          (parseFloat(p.kadi_mati_weight) || 0) +
          (parseFloat(p.dhas_weight) || 0);
        return sum + wastage;
      }, 0) || 0;
    const totalNetLoss =
      processes.reduce(
        (sum, p) => sum + parseFloat(p.net_loss_weight || 0),
        0
      ) || 0;
    const avgLossPercentage =
      totalInputWeight > 0 ? (totalWastage / totalInputWeight) * 100 : 0;

    let groupedData = {};

    if (group_by === 'date') {
      groupedData = processes.reduce((acc, process) => {
        const date = process.process_date;
        if (!acc[date]) {
          acc[date] = {
            date,
            count: 0,
            totalInputWeight: 0,
            totalWastage: 0,
            totalNetLoss: 0,
            processes: []
          };
        }
        acc[date].count++;
        acc[date].totalInputWeight += parseFloat(process.input_weight);
        const wastage =
          (parseFloat(process.kadi_mati_weight) || 0) +
          (parseFloat(process.dhas_weight) || 0);
        acc[date].totalWastage += wastage;
        acc[date].totalNetLoss += parseFloat(process.net_loss_weight || 0);
        acc[date].processes.push(process);
        return acc;
      }, {});
    } else if (group_by === 'lot') {
      groupedData = processes.reduce((acc, process) => {
        const lotCode = process.lots?.lot_code || 'Unknown';
        if (!acc[lotCode]) {
          acc[lotCode] = {
            lotCode,
            lotDate: process.lots?.lot_date,
            lotTotalWeight: process.lots?.total_input_weight,
            count: 0,
            totalInputWeight: 0,
            totalWastage: 0,
            totalNetLoss: 0,
            processes: []
          };
        }
        acc[lotCode].count++;
        acc[lotCode].totalInputWeight += parseFloat(process.input_weight);
        const wastage =
          (parseFloat(process.kadi_mati_weight) || 0) +
          (parseFloat(process.dhas_weight) || 0);
        acc[lotCode].totalWastage += wastage;
        acc[lotCode].totalNetLoss += parseFloat(
          process.net_loss_weight || 0
        );
        acc[lotCode].processes.push(process);
        return acc;
      }, {});
    } else if (group_by === 'status') {
      groupedData = processes.reduce((acc, process) => {
        const status = process.process_status?.label || 'Unknown';
        if (!acc[status]) {
          acc[status] = {
            status,
            statusCode: process.process_status?.status_code,
            count: 0,
            totalInputWeight: 0,
            totalWastage: 0,
            totalNetLoss: 0,
            processes: []
          };
        }
        acc[status].count++;
        acc[status].totalInputWeight += parseFloat(process.input_weight);
        const wastage =
          (parseFloat(process.kadi_mati_weight) || 0) +
          (parseFloat(process.dhas_weight) || 0);
        acc[status].totalWastage += wastage;
        acc[status].totalNetLoss += parseFloat(
          process.net_loss_weight || 0
        );
        acc[status].processes.push(process);
        return acc;
      }, {});
    }

    Object.keys(groupedData).forEach(key => {
      const group = groupedData[key];
      group.lossPercentage =
        group.totalInputWeight > 0
          ? (group.totalWastage / group.totalInputWeight) * 100
          : 0;
      group.yieldPercentage =
        group.totalInputWeight > 0
          ? ((group.totalInputWeight - group.totalWastage) /
              group.totalInputWeight) *
            100
          : 0;
    });

    const reportData = {
      summary: {
        totalProcesses,
        totalInputWeight,
        totalWastage,
        totalNetLoss,
        avgLossPercentage,
        dateRange: {
          start: start_date || 'All time',
          end: end_date || 'All time'
        }
      },
      groupBy: group_by,
      data: Object.values(groupedData),
      rawData: processes
    };

    return res.status(200).json(reportData);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
