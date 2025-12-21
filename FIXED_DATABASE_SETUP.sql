-- FIXED DATABASE SETUP FOR TOBACCO TRACKER
-- Run this entire script in Supabase SQL Editor

-- 1. FARMERS TABLE
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

-- 2. PURCHASES TABLE
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

-- 3. LOTS TABLE
CREATE TABLE IF NOT EXISTS lots (
  id SERIAL PRIMARY KEY,
  lot_code VARCHAR(20) UNIQUE NOT NULL,
  lot_date DATE NOT NULL,
  total_input_weight DECIMAL(10,2) DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. LOT_PURCHASES JUNCTION TABLE
CREATE TABLE IF NOT EXISTS lot_purchases (
  id SERIAL PRIMARY KEY,
  lot_id INT NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  purchase_id INT NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  used_weight DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (lot_id, purchase_id)
);

-- 5. PROCESS_STATUS MASTER TABLE
CREATE TABLE IF NOT EXISTS process_status (
  id SERIAL PRIMARY KEY,
  status_code VARCHAR(40) UNIQUE NOT NULL,
  label VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. PROCESS TABLE (FIXED - removed generated column references)
CREATE TABLE IF NOT EXISTS process (
  id SERIAL PRIMARY KEY,
  process_code VARCHAR(20) UNIQUE NOT NULL,
  lot_id INT NOT NULL UNIQUE REFERENCES lots(id) ON DELETE CASCADE,
  status_id INT REFERENCES process_status(id) ON DELETE RESTRICT DEFAULT 1,
  process_date DATE NOT NULL,
  input_weight DECIMAL(10,2) NOT NULL,
  kadi_mati_weight DECIMAL(10,2) DEFAULT 0,
  dhas_weight DECIMAL(10,2) DEFAULT 0,
  -- Fixed: Calculate total_wastage_weight directly instead of referencing another generated column
  total_wastage_weight DECIMAL(10,2) GENERATED ALWAYS AS (kadi_mati_weight + dhas_weight) STORED,
  -- Fixed: Calculate net_loss_weight directly from base columns
  net_loss_weight DECIMAL(10,2) GENERATED ALWAYS AS (input_weight - (kadi_mati_weight + dhas_weight)) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. JARDI_OUTPUT TABLE
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

-- 8. PAYMENTS TABLE
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

-- 9. FARMER_EFFICACY TABLE
CREATE TABLE IF NOT EXISTS farmer_efficacy (
  id SERIAL PRIMARY KEY,
  farmer_id INT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  efficacy_score DECIMAL(5,2) NOT NULL,
  remarks TEXT,
  evaluator VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. PROCESS_STATUS_HISTORY TABLE
CREATE TABLE IF NOT EXISTS process_status_history (
  id SERIAL PRIMARY KEY,
  process_id INT NOT NULL REFERENCES process(id) ON DELETE CASCADE,
  from_status_id INT REFERENCES process_status(id) ON DELETE SET NULL,
  to_status_id INT REFERENCES process_status(id) ON DELETE SET NULL,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- INSERT PROCESS STATUS SEED DATA
INSERT INTO process_status (status_code, label, description) VALUES
('PENDING', 'Pending', 'Process not yet started'),
('IN_PROGRESS', 'In Progress', 'Process is currently running'),
('COMPLETED', 'Completed', 'Process has been completed'),
('ON_HOLD', 'On Hold', 'Process is temporarily paused'),
('CANCELLED', 'Cancelled', 'Process has been cancelled')
ON CONFLICT (status_code) DO NOTHING;

-- CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_purchases_farmer_id ON purchases(farmer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_lot_purchases_lot_id ON lot_purchases(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_purchases_purchase_id ON lot_purchases(purchase_id);
CREATE INDEX IF NOT EXISTS idx_process_lot_id ON process(lot_id);
CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_farmer_efficacy_farmer_id ON farmer_efficacy(farmer_id);
CREATE INDEX IF NOT EXISTS idx_jardi_output_process_id ON jardi_output(process_id);
CREATE INDEX IF NOT EXISTS idx_process_status_history_process_id ON process_status_history(process_id);

-- ENABLE ROW LEVEL SECURITY
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

-- CREATE RLS POLICIES (ALLOW ALL FOR NOW)
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

-- INSERT SAMPLE DATA
INSERT INTO farmers (farmer_code, name, village, contact_number, efficacy_score) VALUES
('F001', 'Rajesh Kumar', 'Khandwa', '9876543210', 8.5),
('F002', 'Suresh Patel', 'Dewas', '9876543211', 7.2),
('F003', 'Mahesh Singh', 'Ujjain', '9876543212', 9.1),
('F004', 'Ramesh Sharma', 'Indore', '9876543213', 6.8),
('F005', 'Dinesh Verma', 'Bhopal', '9876543214', 8.9)
ON CONFLICT (farmer_code) DO NOTHING;

-- INSERT SAMPLE LOTS
INSERT INTO lots (lot_code, lot_date, remarks) VALUES
('LOT001', '2024-11-01', 'First batch of November'),
('LOT002', '2024-11-05', 'Premium quality batch'),
('LOT003', '2024-11-10', 'Mixed grade batch')
ON CONFLICT (lot_code) DO NOTHING;

-- SUCCESS MESSAGE
SELECT 'Database setup completed successfully! All tables, indexes, policies, and sample data have been created.' as status;
