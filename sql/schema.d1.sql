-- =============================================
-- TOBACCO TRACKER - CLOUDFLARE D1 SCHEMA
-- SQLite-compatible version of the PostgreSQL schema
-- Run with: npx wrangler d1 execute tobacco-tracker --file=sql/schema.d1.sql
-- =============================================

-- Enable foreign keys (required per connection in SQLite/D1)
PRAGMA foreign_keys = ON;

-- farmers
CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_code TEXT UNIQUE,
  name TEXT NOT NULL,
  village TEXT,
  contact_number TEXT,
  aadhaar_no TEXT,
  dob TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  branch_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  efficacy_score REAL DEFAULT 0,
  efficacy_notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- purchases
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_code TEXT UNIQUE,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE SET NULL,
  purchase_date TEXT NOT NULL,
  packaging_type TEXT CHECK (packaging_type IN ('BODH','BAG')),
  process_weight REAL NOT NULL,
  packaging_weight REAL DEFAULT 0,
  total_weight REAL GENERATED ALWAYS AS (process_weight + packaging_weight) STORED,
  rate_per_kg REAL,
  total_amount REAL GENERATED ALWAYS AS (process_weight * rate_per_kg) STORED,
  remarks TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- lots
CREATE TABLE IF NOT EXISTS lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_code TEXT UNIQUE NOT NULL,
  lot_date TEXT NOT NULL,
  total_input_weight REAL DEFAULT 0,
  remarks TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- lot_purchases (junction table)
CREATE TABLE IF NOT EXISTS lot_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_id INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  used_weight REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (lot_id, purchase_id)
);

-- process_status master
CREATE TABLE IF NOT EXISTS process_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status_code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- process (one process per lot)
CREATE TABLE IF NOT EXISTS process (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  process_code TEXT UNIQUE NOT NULL,
  lot_id INTEGER NOT NULL UNIQUE REFERENCES lots(id) ON DELETE CASCADE,
  status_id INTEGER DEFAULT 1 REFERENCES process_status(id) ON DELETE RESTRICT,
  process_date TEXT NOT NULL,
  input_weight REAL NOT NULL,
  kadi_mati_weight REAL DEFAULT 0,
  dhas_weight REAL DEFAULT 0,
  total_wastage_weight REAL GENERATED ALWAYS AS (kadi_mati_weight + dhas_weight) STORED,
  net_loss_weight REAL GENERATED ALWAYS AS (input_weight - (kadi_mati_weight + dhas_weight)) STORED,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- jardi_output (final product)
CREATE TABLE IF NOT EXISTS jardi_output (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  process_id INTEGER NOT NULL UNIQUE REFERENCES process(id) ON DELETE CASCADE,
  jardi_weight REAL NOT NULL,
  grade TEXT,
  packaging_type TEXT,
  num_packages INTEGER,
  avg_package_weight REAL,
  total_packed_weight REAL GENERATED ALWAYS AS (COALESCE(num_packages,0) * COALESCE(avg_package_weight,0)) STORED,
  remarks TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  payment_date TEXT NOT NULL,
  amount_paid REAL NOT NULL,
  payment_mode TEXT,
  transaction_ref TEXT,
  remarks TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- farmer_efficacy
CREATE TABLE IF NOT EXISTS farmer_efficacy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  evaluation_date TEXT NOT NULL,
  efficacy_score REAL NOT NULL,
  remarks TEXT,
  evaluator TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- users and authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager')),
  full_name TEXT,
  email TEXT,
  permissions TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT
);

-- process_status_history
CREATE TABLE IF NOT EXISTS process_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  process_id INTEGER NOT NULL REFERENCES process(id) ON DELETE CASCADE,
  from_status_id INTEGER REFERENCES process_status(id) ON DELETE SET NULL,
  to_status_id INTEGER REFERENCES process_status(id) ON DELETE SET NULL,
  changed_by TEXT,
  changed_at TEXT DEFAULT (datetime('now')),
  notes TEXT
);

-- MASTER DATA

INSERT OR IGNORE INTO process_status (status_code, label, description) VALUES
('PENDING', 'Pending', 'Process not yet started'),
('IN_PROGRESS', 'In Progress', 'Process is currently running'),
('COMPLETED', 'Completed', 'Process has been completed'),
('ON_HOLD', 'On Hold', 'Process is temporarily paused'),
('CANCELLED', 'Cancelled', 'Process has been cancelled');

-- Default users (password: admin123)
INSERT OR IGNORE INTO users (username, password_hash, role, full_name) VALUES
('owner', 'admin123', 'owner', 'Owner Admin'),
('manager', 'admin123', 'manager', 'Manager User');

-- INDEXES

CREATE INDEX IF NOT EXISTS idx_purchases_farmer_id ON purchases(farmer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_lots_lot_code ON lots(lot_code);
CREATE INDEX IF NOT EXISTS idx_lot_purchases_lot_id ON lot_purchases(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_purchases_purchase_id ON lot_purchases(purchase_id);
CREATE INDEX IF NOT EXISTS idx_process_lot_id ON process(lot_id);
CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_farmer_efficacy_farmer_id ON farmer_efficacy(farmer_id);
