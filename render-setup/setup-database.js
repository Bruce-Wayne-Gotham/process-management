#!/usr/bin/env node

/**
 * Render-based Database Setup Script for Tobacco Tracker
 * This script runs as a one-time job on Render to set up the Postgres database
 */

const { Pool } = require('pg');

// Postgres connection via DATABASE_URL (provided by Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('🚀 Render Job: Tobacco Tracker Database Setup');
console.log('============================================');
console.log(`🔗 Connecting to Postgres via DATABASE_URL`);
console.log('');

async function executeSQL(sql, description) {
  console.log(`📋 ${description}...`);
  try {
    const result = await pool.query(sql);
    console.log(`✅ ${description} completed successfully!`);
    return true;
  } catch (err) {
    console.error(`❌ Error in ${description}:`, err.message);
    return false;
  }
}

async function setupDatabase() {
  const startTime = Date.now();
  
  try {
    console.log('🏗️  Step 1: Creating database tables...');
    
    // Create all tables in one transaction
    const createTablesSQL = `
      BEGIN;
      
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
      
      COMMIT;
    `;

    if (!await executeSQL(createTablesSQL, 'Creating all database tables')) {
      process.exit(1);
    }

    console.log('\n🌱 Step 2: Setting up indexes, security, and seed data...');
    
    const setupSQL = `
      BEGIN;
      
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

      -- Enable Row Level Security
      ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
      ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
      ALTER TABLE lot_purchases ENABLE ROW LEVEL SECURITY;
      ALTER TABLE process ENABLE ROW LEVEL SECURITY;
      ALTER TABLE jardi_output ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE farmer_efficacy ENABLE ROW LEVEL SECURITY;
      ALTER TABLE process_status ENABLE ROW LEVEL SECURITY;
      ALTER TABLE process_status_history ENABLE ROW LEVEL SECURITY;
      
      COMMIT;
    `;

    if (!await executeSQL(setupSQL, 'Setting up indexes and security')) {
      process.exit(1);
    }

    console.log('\n🔐 Step 3: Creating RLS policies...');
    
    const rlsPoliciesSQL = `
      -- Create RLS policies (allow all operations for now)
      DO $$ 
      BEGIN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow all operations on farmers" ON farmers;
        DROP POLICY IF EXISTS "Allow all operations on purchases" ON purchases;
        DROP POLICY IF EXISTS "Allow all operations on lots" ON lots;
        DROP POLICY IF EXISTS "Allow all operations on lot_purchases" ON lot_purchases;
        DROP POLICY IF EXISTS "Allow all operations on process" ON process;
        DROP POLICY IF EXISTS "Allow all operations on jardi_output" ON jardi_output;
        DROP POLICY IF EXISTS "Allow all operations on payments" ON payments;
        DROP POLICY IF EXISTS "Allow all operations on farmer_efficacy" ON farmer_efficacy;
        DROP POLICY IF EXISTS "Allow all operations on process_status" ON process_status;
        DROP POLICY IF EXISTS "Allow all operations on process_status_history" ON process_status_history;

        -- Create new policies
        CREATE POLICY "Allow all operations on farmers" ON farmers FOR ALL USING (true);
        CREATE POLICY "Allow all operations on purchases" ON purchases FOR ALL USING (true);
        CREATE POLICY "Allow all operations on lots" ON lots FOR ALL USING (true);
        CREATE POLICY "Allow all operations on lot_purchases" ON lot_purchases FOR ALL USING (true);
        CREATE POLICY "Allow all operations on process" ON process FOR ALL USING (true);
        CREATE POLICY "Allow all operations on jardi_output" ON jardi_output FOR ALL USING (true);
        CREATE POLICY "Allow all operations on payments" ON payments FOR ALL USING (true);
        CREATE POLICY "Allow all operations on farmer_efficacy" ON farmer_efficacy FOR ALL USING (true);
        CREATE POLICY "Allow all operations on process_status" ON process_status FOR ALL USING (true);
        CREATE POLICY "Allow all operations on process_status_history" ON process_status_history FOR ALL USING (true);
      END $$;
    `;

    if (!await executeSQL(rlsPoliciesSQL, 'Creating RLS policies')) {
      process.exit(1);
    }

    console.log('\n👥 Step 4: Creating sample farmers...');
    
    const farmersSQL = `
      INSERT INTO farmers (farmer_code, name, village, contact_number, efficacy_score)
      VALUES
        ('F001', 'Rajesh Kumar', 'Khandwa', '9876543210', 8.5),
        ('F002', 'Suresh Patel', 'Dewas', '9876543211', 7.2),
        ('F003', 'Mahesh Singh', 'Ujjain', '9876543212', 9.1),
        ('F004', 'Ramesh Sharma', 'Indore', '9876543213', 6.8),
        ('F005', 'Dinesh Verma', 'Bhopal', '9876543214', 8.9)
      ON CONFLICT (farmer_code) DO NOTHING
      RETURNING id;
    `;
    
    const farmerResult = await pool.query(farmersSQL);
    const farmerIds = farmerResult.rows.map(r => r.id);
    console.log(`✅ Created ${farmerIds.length} sample farmers!`);

    console.log('\n🧾 Step 5: Creating sample purchases...');
    
    const purchasesSQL = `
      INSERT INTO purchases (farmer_id, purchase_date, packaging_type, process_weight, packaging_weight, rate_per_kg, remarks)
      VALUES
        ($1, '2024-11-01', 'BODH', 50.5, 2.0, 150.00, 'Good quality tobacco'),
        ($2, '2024-11-02', 'BAG', 75.2, 3.5, 145.00, 'Premium grade'),
        ($1, '2024-11-03', 'BODH', 60.0, 2.5, 150.00, 'Regular quality'),
        ($3, '2024-11-04', 'BAG', 80.5, 4.0, 155.00, 'Excellent quality'),
        ($4, '2024-11-05', 'BODH', 45.0, 1.8, 140.00, 'Average quality');
    `;
    
    try {
      await pool.query(purchasesSQL, farmerIds);
      console.log(`✅ Created 5 sample purchases!`);
    } catch (err) {
      console.error('❌ Error creating sample purchases:', err.message);
      process.exit(1);
    }

    console.log('\n🔍 Step 6: Verifying setup...');
    
    try {
      const farmerCountResult = await pool.query('SELECT COUNT(*) FROM farmers');
      const farmerCount = parseInt(farmerCountResult.rows[0].count, 10);
      
      const purchaseCountResult = await pool.query('SELECT COUNT(*) FROM purchases');
      const purchaseCount = parseInt(purchaseCountResult.rows[0].count, 10);

      const statusCountResult = await pool.query('SELECT COUNT(*) FROM process_status');
      const statusCount = parseInt(statusCountResult.rows[0].count, 10);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log('\n' + '='.repeat(60));
      console.log('🎉 RENDER JOB COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log(`📊 Database Statistics:`);
      console.log(`   ✅ Farmers: ${farmerCount}`);
      console.log(`   ✅ Purchases: ${purchaseCount}`);
      console.log(`   ✅ Process Statuses: ${statusCount}`);
      console.log(`⏱️  Setup Duration: ${duration} seconds`);
      console.log('='.repeat(60));
      console.log('');
      console.log('🚀 Your Tobacco Tracker application is now fully functional!');
      console.log('📱 Application URL: https://process-management-4t4o.onrender.com');
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('   1. Visit /farmers to see the 5 sample farmers');
      console.log('   2. Visit /purchases to see the 5 sample purchases');
      console.log('   3. Try adding new farmers and purchases through the UI');
      console.log('   4. Dashboard will now show real statistics instead of zeros');
      console.log('');
      console.log('✅ Render job completed successfully!');
      
      await pool.end();
    } catch (err) {
      console.error('❌ Error verifying setup:', err.message);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Render job failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
