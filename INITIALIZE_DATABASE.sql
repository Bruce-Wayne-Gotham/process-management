-- =============================================
-- TOBACCO TRACKER - AWS RDS INITIALIZATION SCRIPT
-- =============================================
-- This script performs a complete setup of the PostgreSQL database:
-- 1. Creates all necessary tables if they don't exist.
-- 2. Configures default values and constraints.
-- 3. Inserts master data (Process Statuses).
-- 4. Sets up performance indexes.
-- 5. Configures Row Level Security (RLS) policies.
-- =============================================

BEGIN;

-- 🛠️ STEP 1: CREATE TABLES

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
  purchase_code VARCHAR(20) UNIQUE,
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

-- Set default purchase code if not provided
ALTER TABLE purchases ALTER COLUMN purchase_code SET DEFAULT 'PUR-' || LPAD(nextval('purchases_id_seq'::regclass)::text, 6, '0');

-- lots
CREATE TABLE IF NOT EXISTS lots (
  id SERIAL PRIMARY KEY,
  lot_code VARCHAR(20) UNIQUE NOT NULL,
  lot_date DATE NOT NULL,
  total_input_weight DECIMAL(10,2) DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- lot_purchases (junction table)
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

-- process (one process per lot)
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

-- jardi_output (final product)
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

-- payments
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

-- farmer_efficacy
CREATE TABLE IF NOT EXISTS farmer_efficacy (
  id SERIAL PRIMARY KEY,
  farmer_id INT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  efficacy_score DECIMAL(5,2) NOT NULL,
  remarks TEXT,
  evaluator VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- users and authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager')),
  full_name VARCHAR(100),
  email VARCHAR(100),
  permissions TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- process_status_history
CREATE TABLE IF NOT EXISTS process_status_history (
  id SERIAL PRIMARY KEY,
  process_id INT NOT NULL REFERENCES process(id) ON DELETE CASCADE,
  from_status_id INT REFERENCES process_status(id) ON DELETE SET NULL,
  to_status_id INT REFERENCES process_status(id) ON DELETE SET NULL,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- 🏗️ STEP 2: MASTER DATA

INSERT INTO process_status (status_code, label, description) VALUES
('PENDING', 'Pending', 'Process not yet started'),
('IN_PROGRESS', 'In Progress', 'Process is currently running'),
('COMPLETED', 'Completed', 'Process has been completed'),
('ON_HOLD', 'On Hold', 'Process is temporarily paused'),
('CANCELLED', 'Cancelled', 'Process has been cancelled')
ON CONFLICT (status_code) DO NOTHING;

-- Insert default users (password: admin123)
INSERT INTO users (username, password_hash, role, full_name) VALUES
('owner', 'admin123', 'owner', 'Owner Admin'),
('manager', 'admin123', 'manager', 'Manager User')
ON CONFLICT (username) DO NOTHING;

-- 📈 STEP 3: INDEXES

CREATE INDEX IF NOT EXISTS idx_purchases_farmer_id ON purchases(farmer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_lots_lot_code ON lots(lot_code);
CREATE INDEX IF NOT EXISTS idx_lot_purchases_lot_id ON lot_purchases(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_purchases_purchase_id ON lot_purchases(purchase_id);
CREATE INDEX IF NOT EXISTS idx_process_lot_id ON process(lot_id);
CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_farmer_efficacy_farmer_id ON farmer_efficacy(farmer_id);

-- 🔐 STEP 4: SECURITY (RLS)

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE process ENABLE ROW LEVEL SECURITY;
ALTER TABLE jardi_output ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_efficacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_status_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations (default for management app)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on farmers') THEN
        CREATE POLICY "Allow all operations on farmers" ON farmers FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on purchases') THEN
        CREATE POLICY "Allow all operations on purchases" ON purchases FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on lots') THEN
        CREATE POLICY "Allow all operations on lots" ON lots FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on lot_purchases') THEN
        CREATE POLICY "Allow all operations on lot_purchases" ON lot_purchases FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on process') THEN
        CREATE POLICY "Allow all operations on process" ON process FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on jardi_output') THEN
        CREATE POLICY "Allow all operations on jardi_output" ON jardi_output FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on payments') THEN
        CREATE POLICY "Allow all operations on payments" ON payments FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on farmer_efficacy') THEN
        CREATE POLICY "Allow all operations on farmer_efficacy" ON farmer_efficacy FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on users') THEN
        CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on process_status') THEN
        CREATE POLICY "Allow all operations on process_status" ON process_status FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on process_status_history') THEN
        CREATE POLICY "Allow all operations on process_status_history" ON process_status_history FOR ALL USING (true);
    END IF;
END $$;

COMMIT;

-- 🏁 SUCCESS
SELECT 'Database initialized successfully!' as result;
