import { executeQuery, executeInsert, booleanToNumber, formatJsDate } from '../../../lib/oracleClient';

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
    console.error('Farmers API error:', error);
    res.status(500).json({ error: 'Database operation failed', details: error.message });
  }
}

async function handleGet(req, res) {
  const { id, search } = req.query;
  
  let sql = `
    SELECT id, farmer_code, name, village, contact_number, 
           aadhaar_no, dob, account_holder_name, bank_name, 
           branch_name, account_number, ifsc_code, upi_id, 
           efficacy_score, efficacy_notes, is_active, 
           TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
    FROM farmers 
    WHERE is_active = 1
  `;
  
  const params = [];
  
  if (id) {
    sql += ' AND id = :id';
    params.push(id);
  } else if (search) {
    sql += ' AND (LOWER(name) LIKE LOWER(:search) OR LOWER(farmer_code) LIKE LOWER(:search))';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  sql += ' ORDER BY name';
  
  const farmers = await executeQuery(sql, params);
  
  // Format data for frontend
  const formattedFarmers = farmers.map(farmer => ({
    ...farmer,
    is_active: farmer.is_active === 1,
    dob: farmer.dob ? farmer.dob.split('T')[0] : null
  }));
  
  res.status(200).json(id ? formattedFarmers[0] : formattedFarmers);
}

async function handlePost(req, res) {
  const {
    farmer_code, name, village, contact_number, aadhaar_no, dob,
    account_holder_name, bank_name, branch_name, account_number,
    ifsc_code, upi_id, efficacy_score, efficacy_notes
  } = req.body;
  
  // Validate required fields
  if (!farmer_code || !name) {
    return res.status(400).json({ error: 'Farmer code and name are required' });
  }
  
  const sql = `
    INSERT INTO farmers (
      farmer_code, name, village, contact_number, aadhaar_no, dob,
      account_holder_name, bank_name, branch_name, account_number,
      ifsc_code, upi_id, efficacy_score, efficacy_notes
    ) VALUES (
      :farmer_code, :name, :village, :contact_number, :aadhaar_no, 
      CASE WHEN :dob IS NOT NULL THEN TO_DATE(:dob, 'YYYY-MM-DD') ELSE NULL END,
      :account_holder_name, :bank_name, :branch_name, :account_number,
      :ifsc_code, :upi_id, :efficacy_score, :efficacy_notes
    )
  `;
  
  const params = {
    farmer_code,
    name,
    village: village || null,
    contact_number: contact_number || null,
    aadhaar_no: aadhaar_no || null,
    dob: dob || null,
    account_holder_name: account_holder_name || null,
    bank_name: bank_name || null,
    branch_name: branch_name || null,
    account_number: account_number || null,
    ifsc_code: ifsc_code || null,
    upi_id: upi_id || null,
    efficacy_score: efficacy_score || 0,
    efficacy_notes: efficacy_notes || null
  };
  
  await executeInsert(sql, params);
  res.status(201).json({ message: 'Farmer created successfully' });
}

async function handlePut(req, res) {
  const { id } = req.query;
  const {
    farmer_code, name, village, contact_number, aadhaar_no, dob,
    account_holder_name, bank_name, branch_name, account_number,
    ifsc_code, upi_id, efficacy_score, efficacy_notes, is_active
  } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Farmer ID is required' });
  }
  
  const sql = `
    UPDATE farmers SET
      farmer_code = :farmer_code,
      name = :name,
      village = :village,
      contact_number = :contact_number,
      aadhaar_no = :aadhaar_no,
      dob = CASE WHEN :dob IS NOT NULL THEN TO_DATE(:dob, 'YYYY-MM-DD') ELSE NULL END,
      account_holder_name = :account_holder_name,
      bank_name = :bank_name,
      branch_name = :branch_name,
      account_number = :account_number,
      ifsc_code = :ifsc_code,
      upi_id = :upi_id,
      efficacy_score = :efficacy_score,
      efficacy_notes = :efficacy_notes,
      is_active = :is_active
    WHERE id = :id
  `;
  
  const params = {
    id,
    farmer_code,
    name,
    village: village || null,
    contact_number: contact_number || null,
    aadhaar_no: aadhaar_no || null,
    dob: dob || null,
    account_holder_name: account_holder_name || null,
    bank_name: bank_name || null,
    branch_name: branch_name || null,
    account_number: account_number || null,
    ifsc_code: ifsc_code || null,
    upi_id: upi_id || null,
    efficacy_score: efficacy_score || 0,
    efficacy_notes: efficacy_notes || null,
    is_active: booleanToNumber(is_active !== false)
  };
  
  await executeInsert(sql, params);
  res.status(200).json({ message: 'Farmer updated successfully' });
}

async function handleDelete(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Farmer ID is required' });
  }
  
  // Soft delete by setting is_active to 0
  const sql = 'UPDATE farmers SET is_active = 0 WHERE id = :id';
  const params = { id };
  
  await executeInsert(sql, params);
  res.status(200).json({ message: 'Farmer deleted successfully' });
}
