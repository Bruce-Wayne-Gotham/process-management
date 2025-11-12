-- Verification script for Supabase setup
-- Run this after creating all tables to verify everything is working

-- 1. Check all tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('farmers', 'purchases', 'lots', 'lot_purchases', 'process', 'jardi_output', 'payments', 'farmer_efficacy', 'process_status', 'process_status_history') 
    THEN '✅ Required'
    ELSE '❓ Extra'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check data counts
SELECT 
  'farmers' as table_name, 
  COUNT(*) as record_count 
FROM farmers
UNION ALL
SELECT 
  'purchases' as table_name, 
  COUNT(*) as record_count 
FROM purchases
UNION ALL
SELECT 
  'process_status' as table_name, 
  COUNT(*) as record_count 
FROM process_status
UNION ALL
SELECT 
  'lots' as table_name, 
  COUNT(*) as record_count 
FROM lots
UNION ALL
SELECT 
  'payments' as table_name, 
  COUNT(*) as record_count 
FROM payments;

-- 3. Test computed columns in purchases
SELECT 
  id,
  process_weight,
  packaging_weight,
  total_weight,
  rate_per_kg,
  total_amount,
  CASE 
    WHEN total_weight = (process_weight + packaging_weight) THEN '✅ Correct'
    ELSE '❌ Wrong'
  END as total_weight_check,
  CASE 
    WHEN total_amount = (process_weight * rate_per_kg) THEN '✅ Correct'
    ELSE '❌ Wrong'
  END as total_amount_check
FROM purchases
LIMIT 5;

-- 4. Test foreign key relationships
SELECT 
  p.id as purchase_id,
  p.farmer_id,
  f.farmer_code,
  f.name as farmer_name,
  p.total_amount
FROM purchases p
LEFT JOIN farmers f ON p.farmer_id = f.id
LIMIT 5;

-- 5. Check process statuses
SELECT 
  id,
  status_code,
  label,
  description
FROM process_status
ORDER BY id;

-- 6. Verify RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
