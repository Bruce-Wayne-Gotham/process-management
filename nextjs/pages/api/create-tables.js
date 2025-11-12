import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to create tables.' });
  }

  const { setupKey } = req.body;
  if (setupKey !== 'tobacco-tracker-setup-2024') {
    return res.status(401).json({ error: 'Invalid setup key' });
  }

  console.log('🚀 Creating tables using direct SQL execution...');
  const setupLog = [];
  const startTime = Date.now();

  try {
    // First, let's try to create a simple SQL function to execute our table creation
    setupLog.push('🔧 Creating SQL execution function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_text text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `;

    // Try to create the function using a direct query
    const { data: funcResult, error: funcError } = await supabase.rpc('execute_sql', { sql_text: createFunctionSQL });
    
    if (funcError) {
      // If that fails, let's try a different approach - create tables one by one
      setupLog.push('⚠️ Function creation failed, trying direct table creation...');
      
      // Create farmers table
      setupLog.push('👥 Creating farmers table...');
      const farmersSQL = `
        CREATE TABLE IF NOT EXISTS farmers (
          id SERIAL PRIMARY KEY,
          farmer_code VARCHAR(20) UNIQUE,
          name VARCHAR(100) NOT NULL,
          village VARCHAR(100),
          contact_number VARCHAR(20),
          aadhaar_no VARCHAR(20),
          dob DATE,
          account_holder_name VARCHAR(100),
          bank_name VARCHAR(100),
          branch_name VARCHAR(100),
          account_number VARCHAR(30),
          ifsc_code VARCHAR(15),
          upi_id VARCHAR(50),
          efficacy_score DECIMAL(5,2) DEFAULT 0,
          efficacy_notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `;

      // Try using the sql query directly
      const { error: farmersError } = await supabase.from('_sql').select().eq('query', farmersSQL);
      
      if (farmersError) {
        setupLog.push('❌ Direct SQL approach failed, need manual setup');
        
        return res.status(200).json({
          success: false,
          message: 'Automatic table creation not supported. Manual setup required.',
          instructions: [
            '1. Go to Supabase Dashboard: https://supabase.com/dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy and run the SQL from the response below',
            '4. Then try adding farmers through the UI'
          ],
          sqlScript: `
-- Run this in Supabase SQL Editor:

-- farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  farmer_code VARCHAR(20) UNIQUE,
  name VARCHAR(100) NOT NULL,
  village VARCHAR(100),
  contact_number VARCHAR(20),
  aadhaar_no VARCHAR(20),
  dob DATE,
  account_holder_name VARCHAR(100),
  bank_name VARCHAR(100),
  branch_name VARCHAR(100),
  account_number VARCHAR(30),
  ifsc_code VARCHAR(15),
  upi_id VARCHAR(50),
  efficacy_score DECIMAL(5,2) DEFAULT 0,
  efficacy_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  farmer_id INT REFERENCES farmers(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL,
  packaging_type VARCHAR(10) CHECK (packaging_type IN ('BODH','BAG')),
  process_weight DECIMAL(10,2) NOT NULL,
  packaging_weight DECIMAL(10,2) DEFAULT 0,
  total_weight DECIMAL(10,2) GENERATED ALWAYS AS (process_weight + packaging_weight) STORED,
  rate_per_kg DECIMAL(10,2),
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (process_weight * rate_per_kg) STORED,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on farmers" ON farmers FOR ALL USING (true);
CREATE POLICY "Allow all operations on purchases" ON purchases FOR ALL USING (true);

-- Insert sample data
INSERT INTO farmers (farmer_code, name, village, contact_number, efficacy_score) VALUES
('F001', 'Rajesh Kumar', 'Khandwa', '9876543210', 8.5),
('F002', 'Suresh Patel', 'Dewas', '9876543211', 7.2),
('F003', 'Mahesh Singh', 'Ujjain', '9876543212', 9.1)
ON CONFLICT (farmer_code) DO NOTHING;
          `,
          log: setupLog
        });
      }
    }

    // If we get here, try to test if tables exist by querying them
    setupLog.push('🔍 Testing if tables exist...');
    
    const { data: farmers, error: testError } = await supabase
      .from('farmers')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      if (testError.code === 'PGRST116') {
        setupLog.push('❌ Tables do not exist - manual setup required');
        
        return res.status(200).json({
          success: false,
          message: 'Tables do not exist. Please run the SQL script manually.',
          manualSetupRequired: true,
          log: setupLog
        });
      } else {
        setupLog.push(`❌ Database error: ${testError.message}`);
        return res.status(500).json({ error: testError.message, log: setupLog });
      }
    }

    // Tables exist! Let's add sample data
    setupLog.push('✅ Tables exist! Adding sample data...');
    
    const sampleFarmers = [
      { farmer_code: 'F001', name: 'Rajesh Kumar', village: 'Khandwa', contact_number: '9876543210', efficacy_score: 8.5 },
      { farmer_code: 'F002', name: 'Suresh Patel', village: 'Dewas', contact_number: '9876543211', efficacy_score: 7.2 },
      { farmer_code: 'F003', name: 'Mahesh Singh', village: 'Ujjain', contact_number: '9876543212', efficacy_score: 9.1 }
    ];

    const { data: insertedFarmers, error: farmersError } = await supabase
      .from('farmers')
      .upsert(sampleFarmers, { onConflict: 'farmer_code' })
      .select();

    if (farmersError) {
      setupLog.push(`❌ Error inserting farmers: ${farmersError.message}`);
      return res.status(500).json({ error: farmersError.message, log: setupLog });
    }

    setupLog.push(`✅ Inserted ${insertedFarmers.length} sample farmers!`);

    // Add sample purchases
    if (insertedFarmers.length > 0) {
      const samplePurchases = [
        { farmer_id: insertedFarmers[0].id, purchase_date: '2024-11-01', packaging_type: 'BODH', process_weight: 50.5, packaging_weight: 2.0, rate_per_kg: 150.00, remarks: 'Good quality' },
        { farmer_id: insertedFarmers[1].id, purchase_date: '2024-11-02', packaging_type: 'BAG', process_weight: 75.2, packaging_weight: 3.5, rate_per_kg: 145.00, remarks: 'Premium grade' }
      ];

      const { data: insertedPurchases, error: purchasesError } = await supabase
        .from('purchases')
        .insert(samplePurchases)
        .select();

      if (purchasesError) {
        setupLog.push(`⚠️ Warning - purchases error: ${purchasesError.message}`);
      } else {
        setupLog.push(`✅ Inserted ${insertedPurchases.length} sample purchases!`);
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    setupLog.push(`🎉 Setup completed in ${duration} seconds!`);

    return res.status(200).json({
      success: true,
      message: 'Database setup completed successfully!',
      statistics: {
        farmers: insertedFarmers.length,
        duration: `${duration} seconds`
      },
      log: setupLog,
      nextSteps: [
        'Visit /farmers to see the sample farmers',
        'Visit /purchases to see the sample purchases',
        'Try adding new farmers through the UI'
      ]
    });

  } catch (error) {
    setupLog.push(`❌ Unexpected error: ${error.message}`);
    console.error('Setup failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      log: setupLog
    });
  }
}
