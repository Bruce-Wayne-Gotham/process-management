import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql, description) {
  console.log(`📋 ${description}...`);
  try {
    // For tables creation, we'll use individual operations since rpc might not be available
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error(`❌ Error in ${description}:`, error);
      return { success: false, error: error.message };
    }
    console.log(`✅ ${description} completed successfully!`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Exception in ${description}:`, err.message);
    return { success: false, error: err.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to trigger setup.' });
  }

  // Simple authentication check
  const { setupKey } = req.body;
  if (setupKey !== 'tobacco-tracker-setup-2024') {
    return res.status(401).json({ error: 'Invalid setup key' });
  }

  console.log('🚀 Starting Tobacco Tracker Database Setup via API...');
  const startTime = Date.now();
  const setupLog = [];

  try {
    // Step 1: Create tables using direct SQL
    setupLog.push('🏗️ Creating database tables...');
    
    const createTablesSQL = `
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

      -- lots table
      CREATE TABLE IF NOT EXISTS lots (
        id SERIAL PRIMARY KEY,
        lot_code VARCHAR(20) UNIQUE NOT NULL,
        lot_date DATE NOT NULL,
        total_input_weight DECIMAL(10,2) DEFAULT 0,
        remarks TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- lot_purchases junction table
      CREATE TABLE IF NOT EXISTS lot_purchases (
        id SERIAL PRIMARY KEY,
        lot_id INT NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
        purchase_id INT NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
        used_weight DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE (lot_id, purchase_id)
      );

      -- process_status master table
      CREATE TABLE IF NOT EXISTS process_status (
        id SERIAL PRIMARY KEY,
        status_code VARCHAR(40) UNIQUE NOT NULL,
        label VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- process table
      CREATE TABLE IF NOT EXISTS process (
        id SERIAL PRIMARY KEY,
        process_code VARCHAR(20) UNIQUE NOT NULL,
        lot_id INT NOT NULL UNIQUE REFERENCES lots(id) ON DELETE CASCADE,
        status_id INT REFERENCES process_status(id) ON DELETE RESTRICT DEFAULT 1,
        process_date DATE NOT NULL,
        input_weight DECIMAL(10,2) NOT NULL,
        kadi_mati_weight DECIMAL(10,2) DEFAULT 0,
        dhas_weight DECIMAL(10,2) DEFAULT 0,
        total_wastage_weight DECIMAL(10,2) GENERATED ALWAYS AS (kadi_mati_weight + dhas_weight) STORED,
        net_loss_weight DECIMAL(10,2) GENERATED ALWAYS AS (input_weight - total_wastage_weight) STORED,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- jardi_output table
      CREATE TABLE IF NOT EXISTS jardi_output (
        id SERIAL PRIMARY KEY,
        process_id INT NOT NULL UNIQUE REFERENCES process(id) ON DELETE CASCADE,
        jardi_weight DECIMAL(10,2) NOT NULL,
        grade VARCHAR(20),
        packaging_type VARCHAR(20),
        num_packages INT,
        avg_package_weight DECIMAL(10,2),
        total_packed_weight DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(num_packages,0) * COALESCE(avg_package_weight,0)) STORED,
        remarks TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- payments table
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        purchase_id INT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
        payment_date DATE NOT NULL,
        amount_paid DECIMAL(12,2) NOT NULL,
        payment_mode VARCHAR(20),
        transaction_ref VARCHAR(50),
        remarks TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- farmer_efficacy table
      CREATE TABLE IF NOT EXISTS farmer_efficacy (
        id SERIAL PRIMARY KEY,
        farmer_id INT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
        evaluation_date DATE NOT NULL,
        efficacy_score DECIMAL(5,2) NOT NULL,
        remarks TEXT,
        evaluator VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- process_status_history table
      CREATE TABLE IF NOT EXISTS process_status_history (
        id SERIAL PRIMARY KEY,
        process_id INT NOT NULL REFERENCES process(id) ON DELETE CASCADE,
        from_status_id INT REFERENCES process_status(id) ON DELETE SET NULL,
        to_status_id INT REFERENCES process_status(id) ON DELETE SET NULL,
        changed_by VARCHAR(100),
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        notes TEXT
      );
    `;

    const tablesResult = await executeSQL(createTablesSQL, 'Creating all database tables');
    if (!tablesResult.success) {
      setupLog.push(`❌ Failed to create tables: ${tablesResult.error}`);
      return res.status(500).json({ error: 'Failed to create tables', log: setupLog });
    }
    setupLog.push('✅ Database tables created successfully!');

    // Step 2: Insert process statuses and create indexes
    setupLog.push('🌱 Setting up seed data and indexes...');
    
    const seedDataSQL = `
      -- Insert process statuses
      INSERT INTO process_status (status_code, label, description) VALUES
      ('PENDING', 'Pending', 'Process not yet started'),
      ('IN_PROGRESS', 'In Progress', 'Process is currently running'),
      ('COMPLETED', 'Completed', 'Process has been completed'),
      ('ON_HOLD', 'On Hold', 'Process is temporarily paused'),
      ('CANCELLED', 'Cancelled', 'Process has been cancelled')
      ON CONFLICT (status_code) DO NOTHING;

      -- Create performance indexes
      CREATE INDEX IF NOT EXISTS idx_purchases_farmer_id ON purchases(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
      CREATE INDEX IF NOT EXISTS idx_lot_purchases_lot_id ON lot_purchases(lot_id);
      CREATE INDEX IF NOT EXISTS idx_lot_purchases_purchase_id ON lot_purchases(purchase_id);
      CREATE INDEX IF NOT EXISTS idx_process_lot_id ON process(lot_id);
      CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);
      CREATE INDEX IF NOT EXISTS idx_farmer_efficacy_farmer_id ON farmer_efficacy(farmer_id);
    `;

    const seedResult = await executeSQL(seedDataSQL, 'Setting up seed data and indexes');
    if (!seedResult.success) {
      setupLog.push(`❌ Failed to setup seed data: ${seedResult.error}`);
      return res.status(500).json({ error: 'Failed to setup seed data', log: setupLog });
    }
    setupLog.push('✅ Seed data and indexes created successfully!');

    // Step 3: Create sample farmers using Supabase client
    setupLog.push('👥 Creating sample farmers...');
    
    const sampleFarmers = [
      { farmer_code: 'F001', name: 'Rajesh Kumar', village: 'Khandwa', contact_number: '9876543210', efficacy_score: 8.5 },
      { farmer_code: 'F002', name: 'Suresh Patel', village: 'Dewas', contact_number: '9876543211', efficacy_score: 7.2 },
      { farmer_code: 'F003', name: 'Mahesh Singh', village: 'Ujjain', contact_number: '9876543212', efficacy_score: 9.1 },
      { farmer_code: 'F004', name: 'Ramesh Sharma', village: 'Indore', contact_number: '9876543213', efficacy_score: 6.8 },
      { farmer_code: 'F005', name: 'Dinesh Verma', village: 'Bhopal', contact_number: '9876543214', efficacy_score: 8.9 }
    ];

    const { data: farmers, error: farmersError } = await supabase
      .from('farmers')
      .upsert(sampleFarmers, { onConflict: 'farmer_code' })
      .select();

    if (farmersError) {
      setupLog.push(`❌ Error creating sample farmers: ${farmersError.message}`);
      return res.status(500).json({ error: 'Failed to create sample farmers', log: setupLog });
    }
    setupLog.push(`✅ Created ${farmers.length} sample farmers!`);

    // Step 4: Create sample purchases
    setupLog.push('🧾 Creating sample purchases...');
    
    const samplePurchases = [
      { farmer_id: farmers[0].id, purchase_date: '2024-11-01', packaging_type: 'BODH', process_weight: 50.5, packaging_weight: 2.0, rate_per_kg: 150.00, remarks: 'Good quality tobacco' },
      { farmer_id: farmers[1].id, purchase_date: '2024-11-02', packaging_type: 'BAG', process_weight: 75.2, packaging_weight: 3.5, rate_per_kg: 145.00, remarks: 'Premium grade' },
      { farmer_id: farmers[0].id, purchase_date: '2024-11-03', packaging_type: 'BODH', process_weight: 60.0, packaging_weight: 2.5, rate_per_kg: 150.00, remarks: 'Regular quality' },
      { farmer_id: farmers[2].id, purchase_date: '2024-11-04', packaging_type: 'BAG', process_weight: 80.5, packaging_weight: 4.0, rate_per_kg: 155.00, remarks: 'Excellent quality' },
      { farmer_id: farmers[3].id, purchase_date: '2024-11-05', packaging_type: 'BODH', process_weight: 45.0, packaging_weight: 1.8, rate_per_kg: 140.00, remarks: 'Average quality' }
    ];

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .insert(samplePurchases)
      .select();

    if (purchasesError) {
      setupLog.push(`❌ Error creating sample purchases: ${purchasesError.message}`);
      return res.status(500).json({ error: 'Failed to create sample purchases', log: setupLog });
    }
    setupLog.push(`✅ Created ${purchases.length} sample purchases!`);

    // Step 5: Verify setup
    setupLog.push('🔍 Verifying setup...');
    
    const { count: farmerCount } = await supabase
      .from('farmers')
      .select('*', { count: 'exact', head: true });
    
    const { count: purchaseCount } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true });

    const { count: statusCount } = await supabase
      .from('process_status')
      .select('*', { count: 'exact', head: true });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    setupLog.push('🎉 Database setup completed successfully!');
    setupLog.push(`📊 Final counts: ${farmerCount} farmers, ${purchaseCount} purchases, ${statusCount} statuses`);
    setupLog.push(`⏱️ Setup completed in ${duration} seconds`);

    return res.status(200).json({
      success: true,
      message: 'Database setup completed successfully!',
      statistics: {
        farmers: farmerCount,
        purchases: purchaseCount,
        processStatuses: statusCount,
        duration: `${duration} seconds`
      },
      log: setupLog,
      nextSteps: [
        'Visit /farmers to see the sample farmers',
        'Visit /purchases to see the sample purchases',
        'Try adding new farmers and purchases through the UI',
        'Dashboard will now show real statistics'
      ]
    });

  } catch (error) {
    setupLog.push(`❌ Setup failed: ${error.message}`);
    console.error('Database setup failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      log: setupLog
    });
  }
}
