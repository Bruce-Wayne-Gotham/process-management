-- Insert seed data for Oracle Autonomous Database
-- Run this after creating the schema

-- Insert default process statuses
INSERT INTO process_status (status_code, label, description) VALUES
('PENDING', 'Pending', 'Process not yet started'),
('IN_PROGRESS', 'In Progress', 'Process is currently running'),
('COMPLETED', 'Completed', 'Process has been completed'),
('ON_HOLD', 'On Hold', 'Process is temporarily paused'),
('CANCELLED', 'Cancelled', 'Process has been cancelled');

-- Create indexes for better performance
CREATE INDEX idx_purchases_farmer_id ON purchases(farmer_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_lot_purchases_lot_id ON lot_purchases(lot_id);
CREATE INDEX idx_lot_purchases_purchase_id ON lot_purchases(purchase_id);
CREATE INDEX idx_process_lot_id ON process(lot_id);
CREATE INDEX idx_payments_purchase_id ON payments(purchase_id);
CREATE INDEX idx_farmer_efficacy_farmer_id ON farmer_efficacy(farmer_id);
CREATE INDEX idx_process_status_code ON process_status(status_code);
CREATE INDEX idx_farmers_code ON farmers(farmer_code);
CREATE INDEX idx_farmers_active ON farmers(is_active);

-- Insert sample farmers for testing
INSERT INTO farmers (farmer_code, name, village, contact_number, efficacy_score) VALUES
('F001', 'Rajesh Kumar', 'Khandwa', '9876543210', 8.5),
('F002', 'Suresh Patel', 'Dewas', '9876543211', 7.2),
('F003', 'Mahesh Singh', 'Ujjain', '9876543212', 9.1),
('F004', 'Ramesh Sharma', 'Indore', '9876543213', 6.8),
('F005', 'Dinesh Verma', 'Bhopal', '9876543214', 8.9);

-- Insert sample purchases for testing
INSERT INTO purchases (farmer_id, purchase_date, packaging_type, process_weight, packaging_weight, rate_per_kg, remarks) VALUES
(1, TO_DATE('2024-11-01', 'YYYY-MM-DD'), 'BODH', 50.5, 2.0, 150.00, 'Good quality tobacco'),
(2, TO_DATE('2024-11-02', 'YYYY-MM-DD'), 'BAG', 75.2, 3.5, 145.00, 'Premium grade'),
(1, TO_DATE('2024-11-03', 'YYYY-MM-DD'), 'BODH', 60.0, 2.5, 150.00, 'Regular quality'),
(3, TO_DATE('2024-11-04', 'YYYY-MM-DD'), 'BAG', 80.5, 4.0, 155.00, 'Excellent quality'),
(4, TO_DATE('2024-11-05', 'YYYY-MM-DD'), 'BODH', 45.0, 1.8, 140.00, 'Average quality');

-- Insert sample lots for testing
INSERT INTO lots (lot_code, lot_date, total_input_weight, remarks) VALUES
('LOT001', TO_DATE('2024-11-10', 'YYYY-MM-DD'), 236.2, 'First lot of November'),
('LOT002', TO_DATE('2024-11-15', 'YYYY-MM-DD'), 180.5, 'Second lot of November');

-- Link purchases to lots
INSERT INTO lot_purchases (lot_id, purchase_id, used_weight) VALUES
(1, 1, 50.5),
(1, 2, 75.2),
(1, 3, 60.0),
(2, 4, 80.5),
(2, 5, 45.0);

-- Insert sample processes
INSERT INTO process (process_code, lot_id, status_id, process_date, input_weight, kadi_mati_weight, dhas_weight) VALUES
('PROC001', 1, 3, TO_DATE('2024-11-12', 'YYYY-MM-DD'), 185.7, 8.5, 12.3),
('PROC002', 2, 2, TO_DATE('2024-11-17', 'YYYY-MM-DD'), 125.5, 5.2, 8.1);

-- Insert sample jardi output
INSERT INTO jardi_output (process_id, jardi_weight, grade, packaging_type, num_packages, avg_package_weight, remarks) VALUES
(1, 164.9, 'A', 'BAG', 25, 6.596, 'High quality output'),
(2, 112.2, 'B', 'BODH', 18, 6.233, 'Standard quality output');

-- Insert sample payments
INSERT INTO payments (purchase_id, payment_date, amount_paid, payment_mode, transaction_ref, remarks) VALUES
(1, TO_DATE('2024-11-05', 'YYYY-MM-DD'), 7575.00, 'BANK_TRANSFER', 'TXN001', 'Full payment'),
(2, TO_DATE('2024-11-06', 'YYYY-MM-DD'), 10904.00, 'UPI', 'UPI002', 'Full payment'),
(3, TO_DATE('2024-11-07', 'YYYY-MM-DD'), 9000.00, 'CASH', NULL, 'Partial payment'),
(4, TO_DATE('2024-11-08', 'YYYY-MM-DD'), 12477.50, 'BANK_TRANSFER', 'TXN004', 'Full payment'),
(5, TO_DATE('2024-11-09', 'YYYY-MM-DD'), 6300.00, 'UPI', 'UPI005', 'Full payment');

-- Insert sample farmer efficacy evaluations
INSERT INTO farmer_efficacy (farmer_id, evaluation_date, efficacy_score, remarks, evaluator) VALUES
(1, TO_DATE('2024-10-15', 'YYYY-MM-DD'), 8.5, 'Consistent quality, good farming practices', 'Manager1'),
(2, TO_DATE('2024-10-20', 'YYYY-MM-DD'), 7.2, 'Average quality, needs improvement in curing', 'Manager1'),
(3, TO_DATE('2024-10-25', 'YYYY-MM-DD'), 9.1, 'Excellent quality, premium tobacco', 'Manager2'),
(4, TO_DATE('2024-10-30', 'YYYY-MM-DD'), 6.8, 'Below average, quality issues noted', 'Manager2'),
(5, TO_DATE('2024-11-05', 'YYYY-MM-DD'), 8.9, 'Very good quality, reliable supplier', 'Manager1');

-- Insert sample process status history
INSERT INTO process_status_history (process_id, from_status_id, to_status_id, changed_by, changed_at, notes) VALUES
(1, 1, 2, 'System', TO_DATE('2024-11-12 09:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'Process started'),
(1, 2, 3, 'Operator1', TO_DATE('2024-11-12 17:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'Process completed successfully'),
(2, 1, 2, 'System', TO_DATE('2024-11-17 08:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'Process started');

-- Create views for easier data access
CREATE OR REPLACE VIEW v_farmers_summary AS
SELECT 
    f.id,
    f.farmer_code,
    f.name,
    f.village,
    f.contact_number,
    f.efficacy_score,
    COUNT(p.id) as total_purchases,
    COALESCE(SUM(p.total_amount), 0) as total_purchase_amount,
    MAX(p.purchase_date) as last_purchase_date
FROM farmers f
LEFT JOIN purchases p ON f.id = p.farmer_id
WHERE f.is_active = 1
GROUP BY f.id, f.farmer_code, f.name, f.village, f.contact_number, f.efficacy_score;

CREATE OR REPLACE VIEW v_process_summary AS
SELECT 
    p.id,
    p.process_code,
    p.process_date,
    p.input_weight,
    p.total_wastage_weight,
    p.net_loss_weight,
    ps.label as status_label,
    l.lot_code,
    COUNT(jo.id) as jardi_outputs,
    COALESCE(SUM(jo.jardi_weight), 0) as total_jardi_weight
FROM process p
LEFT JOIN process_status ps ON p.status_id = ps.id
LEFT JOIN lots l ON p.lot_id = l.id
LEFT JOIN jardi_output jo ON p.id = jo.process_id
GROUP BY p.id, p.process_code, p.process_date, p.input_weight, 
         p.total_wastage_weight, p.net_loss_weight, ps.label, l.lot_code;

COMMIT;
/
