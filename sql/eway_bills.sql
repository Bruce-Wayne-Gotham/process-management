-- Add e-Way Bill tracking table
CREATE TABLE IF NOT EXISTS eway_bills (
  id SERIAL PRIMARY KEY,
  lot_id INT NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  eway_bill_no VARCHAR(20) UNIQUE NOT NULL,
  eway_bill_date DATE NOT NULL,
  valid_upto TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  details JSONB,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eway_bills_lot_id ON eway_bills(lot_id);
CREATE INDEX IF NOT EXISTS idx_eway_bills_status ON eway_bills(status);
