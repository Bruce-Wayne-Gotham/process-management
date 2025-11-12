-- Seed data for Tobacco Processing App
-- Run after schema.sql

-- Insert default process statuses
INSERT INTO process_status (status_code, label, description) VALUES
('PENDING', 'Pending', 'Process not yet started'),
('IN_PROGRESS', 'In Progress', 'Process is currently running'),
('COMPLETED', 'Completed', 'Process has been completed'),
('ON_HOLD', 'On Hold', 'Process is temporarily paused'),
('CANCELLED', 'Cancelled', 'Process has been cancelled')
ON CONFLICT (status_code) DO NOTHING;

-- Update purchases table to make purchase_code optional and auto-generated
ALTER TABLE purchases ALTER COLUMN purchase_code DROP NOT NULL;
ALTER TABLE purchases ALTER COLUMN purchase_code SET DEFAULT 'PUR-' || LPAD(nextval('purchases_id_seq')::text, 6, '0');

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
