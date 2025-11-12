-- Seed data for quick demo (run after schema)

INSERT INTO process_status (status_code, label) VALUES
('PROC_PENDING','Pending'),
('PROC_IN_PROGRESS','In Progress'),
('PROC_COMPLETED','Completed')
ON CONFLICT DO NOTHING;

INSERT INTO farmers (farmer_code, name, village, contact_number, dob, account_holder_name)
VALUES
('FARM0001','Ramesh Patil','Dighori','9876543210','1978-05-10','Ramesh Patil'),
('FARM0002','Dinesh More','Karanja','9876501234','1983-09-14','Dinesh More')
ON CONFLICT DO NOTHING;

INSERT INTO purchases (purchase_code, farmer_id, purchase_date, packaging_type, process_weight, packaging_weight, rate_per_kg)
VALUES
('PUR0001',1,'2025-10-28','BODH',240,12,190),
('PUR0002',1,'2025-10-29','BAG',260,15,188),
('PUR0003',2,'2025-10-30','BODH',185,15,190)
ON CONFLICT DO NOTHING;

-- create a lot and link purchases
INSERT INTO lots (lot_code, lot_date, total_input_weight) VALUES ('LOT0001','2025-10-31',500) ON CONFLICT DO NOTHING;
INSERT INTO lot_purchases (lot_id, purchase_id, used_weight) VALUES
(1,1,240),
(1,2,260)
ON CONFLICT DO NOTHING;
