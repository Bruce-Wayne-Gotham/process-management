import { query } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM process ORDER BY created_at DESC');
      return res.status(200).json(result.rows || []);
    }
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

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
        lot_id,
        status_id,
        group_by = 'date'
      } = req.query;

      let query = supabase
        .from('process')
        .select(`
          *,
          lots (
            lot_code,
            lot_date,
            total_input_weight
          ),
          process_status (
            status_code,
            label
          )
        `);

      // Apply date filters
      if (start_date) {
        query = query.gte('process_date', start_date);
      }
      if (end_date) {
        query = query.lte('process_date', end_date);
      }

      // Apply lot filter
      if (lot_id) {
        query = query.eq('lot_id', lot_id);
      }

      // Apply status filter
      if (status_id) {
        query = query.eq('status_id', status_id);
      }

      query = query.order('process_date', { ascending: true });

      const { data: processes, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Calculate summary statistics
      const totalProcesses = processes?.length || 0;
      const totalInputWeight = processes?.reduce((sum, p) => sum + parseFloat(p.input_weight), 0) || 0;
      const totalWastage = processes?.reduce((sum, p) => {
        const wastage = (parseFloat(p.kadi_mati_weight) || 0) + (parseFloat(p.dhas_weight) || 0);
        return sum + wastage;
      }, 0) || 0;
      const totalNetLoss = processes?.reduce((sum, p) => sum + parseFloat(p.net_loss_weight || 0), 0) || 0;
      const avgLossPercentage = totalInputWeight > 0 ? (totalWastage / totalInputWeight) * 100 : 0;

      // Group data based on group_by parameter
      let groupedData = {};
      
      if (group_by === 'date') {
        groupedData = processes?.reduce((acc, process) => {
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
          const wastage = (parseFloat(process.kadi_mati_weight) || 0) + (parseFloat(process.dhas_weight) || 0);
          acc[date].totalWastage += wastage;
          acc[date].totalNetLoss += parseFloat(process.net_loss_weight || 0);
          acc[date].processes.push(process);
          return acc;
        }, {});
      } else if (group_by === 'lot') {
        groupedData = processes?.reduce((acc, process) => {
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
          const wastage = (parseFloat(process.kadi_mati_weight) || 0) + (parseFloat(process.dhas_weight) || 0);
          acc[lotCode].totalWastage += wastage;
          acc[lotCode].totalNetLoss += parseFloat(process.net_loss_weight || 0);
          acc[lotCode].processes.push(process);
          return acc;
        }, {});
      } else if (group_by === 'status') {
        groupedData = processes?.reduce((acc, process) => {
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
          const wastage = (parseFloat(process.kadi_mati_weight) || 0) + (parseFloat(process.dhas_weight) || 0);
          acc[status].totalWastage += wastage;
          acc[status].totalNetLoss += parseFloat(process.net_loss_weight || 0);
          acc[status].processes.push(process);
          return acc;
        }, {});
      }

      // Calculate percentages for each group
      Object.keys(groupedData).forEach(key => {
        const group = groupedData[key];
        group.lossPercentage = group.totalInputWeight > 0 ? (group.totalWastage / group.totalInputWeight) * 100 : 0;
        group.yieldPercentage = group.totalInputWeight > 0 ? ((group.totalInputWeight - group.totalWastage) / group.totalInputWeight) * 100 : 0;
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

  return res.status(405).json({ error: 'Method not allowed' });
}
