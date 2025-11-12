# Supabase Database Setup Guide

## 🎯 Quick Setup Instructions

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Navigate to your project: `wueblvkoukloirisuoju`
4. Go to **SQL Editor** in the left sidebar

### Step 2: Create Database Tables
Copy and paste the following SQL scripts in order:

#### Script 1: Create All Tables
```sql
-- PostgreSQL schema for Tobacco Processing App
-- Run in Supabase SQL editor

-- farmers
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

-- purchases
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

-- lots
CREATE TABLE IF NOT EXISTS lots (
  id SERIAL PRIMARY KEY,
  lot_code VARCHAR(20) UNIQUE NOT NULL,
  lot_date DATE NOT NULL,
  total_input_weight DECIMAL(10,2) DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- junction table: which purchases contribute what weight to a lot
CREATE TABLE IF NOT EXISTS lot_purchases (
  id SERIAL PRIMARY KEY,
  lot_id INT NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  purchase_id INT NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  used_weight DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (lot_id, purchase_id)
);

-- process_status master
CREATE TABLE IF NOT EXISTS process_status (
  id SERIAL PRIMARY KEY,
  status_code VARCHAR(40) UNIQUE NOT NULL,
  label VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- process table (one process per lot)
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

-- final product (jardi)
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

-- payments (for purchases)
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

-- farmer_efficacy history
CREATE TABLE IF NOT EXISTS farmer_efficacy (
  id SERIAL PRIMARY KEY,
  farmer_id INT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  efficacy_score DECIMAL(5,2) NOT NULL,
  remarks TEXT,
  evaluator VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- process_status_history for audit (optional)
CREATE TABLE IF NOT EXISTS process_status_history (
  id SERIAL PRIMARY KEY,
  process_id INT NOT NULL REFERENCES process(id) ON DELETE CASCADE,
  from_status_id INT REFERENCES process_status(id) ON DELETE SET NULL,
  to_status_id INT REFERENCES process_status(id) ON DELETE SET NULL,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);
```

#### Script 2: Insert Seed Data and Setup Security
```sql
-- Insert default process statuses
INSERT INTO process_status (status_code, label, description) VALUES
('PENDING', 'Pending', 'Process not yet started'),
('IN_PROGRESS', 'In Progress', 'Process is currently running'),
('COMPLETED', 'Completed', 'Process has been completed'),
('ON_HOLD', 'On Hold', 'Process is temporarily paused'),
('CANCELLED', 'Cancelled', 'Process has been cancelled')
ON CONFLICT (status_code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_farmer_id ON purchases(farmer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_lot_purchases_lot_id ON lot_purchases(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_purchases_purchase_id ON lot_purchases(purchase_id);
CREATE INDEX IF NOT EXISTS idx_process_lot_id ON process(lot_id);
CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_farmer_efficacy_farmer_id ON farmer_efficacy(farmer_id);

-- Enable Row Level Security (RLS) for Supabase
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

-- Create policies to allow all operations (adjust as needed for your security requirements)
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
```

#### Script 3: Insert Sample Data (Optional)
```sql
-- Insert sample farmers for testing
INSERT INTO farmers (farmer_code, name, village, contact_number, efficacy_score) VALUES
('F001', 'Rajesh Kumar', 'Khandwa', '9876543210', 8.5),
('F002', 'Suresh Patel', 'Dewas', '9876543211', 7.2),
('F003', 'Mahesh Singh', 'Ujjain', '9876543212', 9.1),
('F004', 'Ramesh Sharma', 'Indore', '9876543213', 6.8),
('F005', 'Dinesh Verma', 'Bhopal', '9876543214', 8.9)
ON CONFLICT (farmer_code) DO NOTHING;

-- Insert sample purchases for testing
INSERT INTO purchases (farmer_id, purchase_date, packaging_type, process_weight, packaging_weight, rate_per_kg, remarks) VALUES
(1, '2024-11-01', 'BODH', 50.5, 2.0, 150.00, 'Good quality tobacco'),
(2, '2024-11-02', 'BAG', 75.2, 3.5, 145.00, 'Premium grade'),
(1, '2024-11-03', 'BODH', 60.0, 2.5, 150.00, 'Regular quality'),
(3, '2024-11-04', 'BAG', 80.5, 4.0, 155.00, 'Excellent quality'),
(4, '2024-11-05', 'BODH', 45.0, 1.8, 140.00, 'Average quality');
```

### Step 3: Verify Setup
After running the scripts, verify the setup by running:
```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check sample data
SELECT COUNT(*) as farmer_count FROM farmers;
SELECT COUNT(*) as purchase_count FROM purchases;
SELECT COUNT(*) as status_count FROM process_status;
```

### Step 4: Test Your Application
1. Go back to your application: https://process-management-4t4o.onrender.com
2. Navigate to the Farmers page - you should now see the sample farmers
3. Try adding a new farmer
4. Navigate to Purchases page - you should see the sample purchases
5. Try recording a new purchase

## 🔧 Troubleshooting

### If you get permission errors:
1. Make sure you're using the **service_role** key (not anon key)
2. Check that RLS policies are created correctly

### If tables don't appear:
1. Refresh your Supabase dashboard
2. Check the **Table Editor** tab to see your tables
3. Verify the SQL ran without errors

### If the app still shows loading:
1. Check browser console for errors
2. Verify environment variables are set in Render
3. Wait a few minutes for deployment to propagate

## 📊 Expected Result
After setup, your application will have:
- ✅ 5 sample farmers with different efficacy scores
- ✅ 5 sample purchases with calculated totals
- ✅ All database tables ready for full functionality
- ✅ Working farmers and purchases modules
- ✅ Foundation ready for lots, process, and payments modules

## 🚀 Next Steps
Once the database is set up:
1. Test the existing farmers and purchases functionality
2. Add more farmers and purchases through the UI
3. Ready to build the remaining modules (Lots, Process, Jardi Output, Payments)
