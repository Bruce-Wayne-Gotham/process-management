import { executeQuery, executeInsert, formatJsDate } from '../../../lib/oracleClient';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res);
        break;
      case 'PUT':
        await handlePut(req, res);
        break;
      case 'DELETE':
        await handleDelete(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Purchases API error:', error);
    res.status(500).json({ error: 'Database operation failed', details: error.message });
  }
}

async function handleGet(req, res) {
  const { id, farmer_id, start_date, end_date } = req.query;
  
  let sql = `
    SELECT p.id, p.farmer_id, p.purchase_date, p.packaging_type,
           p.process_weight, p.packaging_weight, p.total_weight,
           p.rate_per_kg, p.total_amount, p.remarks,
           TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
           f.farmer_code, f.name as farmer_name, f.village
    FROM purchases p
    LEFT JOIN farmers f ON p.farmer_id = f.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (id) {
    sql += ' AND p.id = :id';
    params.push(id);
  }
  
  if (farmer_id) {
    sql += ' AND p.farmer_id = :farmer_id';
    params.push(farmer_id);
  }
  
  if (start_date) {
    sql += ' AND p.purchase_date >= TO_DATE(:start_date, \'YYYY-MM-DD\')';
    params.push(start_date);
  }
  
  if (end_date) {
    sql += ' AND p.purchase_date <= TO_DATE(:end_date, \'YYYY-MM-DD\')';
    params.push(end_date);
  }
  
  sql += ' ORDER BY p.purchase_date DESC, p.created_at DESC';
  
  const purchases = await executeQuery(sql, params);
  
  // Format data for frontend
  const formattedPurchases = purchases.map(purchase => ({
    ...purchase,
    purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : null,
    created_at: purchase.created_at
  }));
  
  res.status(200).json(id ? formattedPurchases[0] : formattedPurchases);
}

async function handlePost(req, res) {
  const {
    farmer_id, purchase_date, packaging_type, process_weight,
    packaging_weight, rate_per_kg, remarks
  } = req.body;
  
  // Validate required fields
  if (!farmer_id || !purchase_date || !process_weight) {
    return res.status(400).json({ 
      error: 'Farmer ID, purchase date, and process weight are required' 
    });
  }
  
  // Validate packaging type
  if (packaging_type && !['BODH', 'BAG'].includes(packaging_type)) {
    return res.status(400).json({ error: 'Packaging type must be BODH or BAG' });
  }
  
  const sql = `
    INSERT INTO purchases (
      farmer_id, purchase_date, packaging_type, process_weight,
      packaging_weight, rate_per_kg, remarks
    ) VALUES (
      :farmer_id, TO_DATE(:purchase_date, 'YYYY-MM-DD'), :packaging_type,
      :process_weight, :packaging_weight, :rate_per_kg, :remarks
    )
  `;
  
  const params = {
    farmer_id,
    purchase_date,
    packaging_type: packaging_type || 'BODH',
    process_weight,
    packaging_weight: packaging_weight || 0,
    rate_per_kg: rate_per_kg || 0,
    remarks: remarks || null
  };
  
  const result = await executeInsert(sql, params);
  res.status(201).json({ 
    message: 'Purchase created successfully',
    id: result.insertId
  });
}

async function handlePut(req, res) {
  const { id } = req.query;
  const {
    farmer_id, purchase_date, packaging_type, process_weight,
    packaging_weight, rate_per_kg, remarks
  } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Purchase ID is required' });
  }
  
  // Validate packaging type
  if (packaging_type && !['BODH', 'BAG'].includes(packaging_type)) {
    return res.status(400).json({ error: 'Packaging type must be BODH or BAG' });
  }
  
  const sql = `
    UPDATE purchases SET
      farmer_id = :farmer_id,
      purchase_date = TO_DATE(:purchase_date, 'YYYY-MM-DD'),
      packaging_type = :packaging_type,
      process_weight = :process_weight,
      packaging_weight = :packaging_weight,
      rate_per_kg = :rate_per_kg,
      remarks = :remarks
    WHERE id = :id
  `;
  
  const params = {
    id,
    farmer_id,
    purchase_date,
    packaging_type: packaging_type || 'BODH',
    process_weight,
    packaging_weight: packaging_weight || 0,
    rate_per_kg: rate_per_kg || 0,
    remarks: remarks || null
  };
  
  await executeInsert(sql, params);
  res.status(200).json({ message: 'Purchase updated successfully' });
}

async function handleDelete(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Purchase ID is required' });
  }
  
  // Check if purchase is referenced in lot_purchases
  const checkSql = 'SELECT COUNT(*) as count FROM lot_purchases WHERE purchase_id = :id';
  const checkResult = await executeQuery(checkSql, [id]);
  
  if (checkResult[0].COUNT > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete purchase: it is referenced in lots' 
    });
  }
  
  const sql = 'DELETE FROM purchases WHERE id = :id';
  const params = { id };
  
  await executeInsert(sql, params);
  res.status(200).json({ message: 'Purchase deleted successfully' });
}

// Helper function to get purchase statistics
export async function getPurchaseStatistics(farmerId = null, startDate = null, endDate = null) {
  let sql = `
    SELECT 
      COUNT(*) as total_purchases,
      SUM(process_weight) as total_process_weight,
      SUM(packaging_weight) as total_packaging_weight,
      SUM(total_weight) as total_weight,
      SUM(total_amount) as total_amount,
      AVG(rate_per_kg) as avg_rate_per_kg
    FROM purchases
    WHERE 1=1
  `;
  
  const params = [];
  
  if (farmerId) {
    sql += ' AND farmer_id = :farmerId';
    params.push(farmerId);
  }
  
  if (startDate) {
    sql += ' AND purchase_date >= TO_DATE(:startDate, \'YYYY-MM-DD\')';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND purchase_date <= TO_DATE(:endDate, \'YYYY-MM-DD\')';
    params.push(endDate);
  }
  
  const result = await executeQuery(sql, params);
  return result[0];
}
