-- PostgreSQL schema for Tobacco Processing App
-- Run in Supabase SQL editor or psql

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
  purchase_code VARCHAR(20) UNIQUE NOT NULL,
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
