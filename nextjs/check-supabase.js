// Check Supabase Database Status
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wueblvkoukloirisuoju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZWJsdmtvdWtsb2lyaXN1b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNzUxNTksImV4cCI6MjA3NzY1MTE1OX0.JEK4cptATUMXtFZaYadlVr2o1oqoMbB9grhMFOnw8jU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabaseStatus() {
  console.log('🔍 Checking Supabase Database Status...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing connection to Supabase...');
    const { data, error } = await supabase
      .from('farmers')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Connection Error:', error.message);
      
      if (error.code === 'PGRST116') {
        console.log('📋 Table "farmers" does not exist - needs setup');
      } else if (error.message.includes('JWT')) {
        console.log('🔑 Authentication issue - check API keys');
      } else {
        console.log('🔧 Other error - check project configuration');
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Farmers count:', data || 0);
    }
    
    // Check what tables exist
    console.log('\n2. Checking table structure...');
    const tablesToCheck = ['farmers', 'purchases', 'lots', 'process', 'payments', 'jardi_output'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true });
        
        if (tableError) {
          console.log(`❌ ${tableName}: ${tableError.code === 'PGRST116' ? 'Not found' : 'Error - ' + tableError.message}`);
        } else {
          console.log(`✅ ${tableName}: ${tableData || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Connection error`);
      }
    }
    
    // Try to get sample data if farmers exist
    console.log('\n3. Testing data access...');
    try {
      const { data: farmers, error: farmersError } = await supabase
        .from('farmers')
        .select('*')
        .limit(3);
      
      if (farmersError) {
        console.log('❌ Cannot access farmers data:', farmersError.message);
      } else if (farmers && farmers.length > 0) {
        console.log('✅ Sample farmer data:');
        farmers.forEach(farmer => {
          console.log(`   - ${farmer.farmer_code}: ${farmer.name} (${farmer.village || 'No village'})`);
        });
      } else {
        console.log('📋 Farmers table exists but is empty');
      }
    } catch (err) {
      console.log('❌ Error accessing farmers data:', err.message);
    }
    
    console.log('\n🎯 Summary:');
    console.log('   - Supabase URL:', supabaseUrl);
    console.log('   - Project ID: wueblvkoukloirisuoju');
    console.log('   - Authentication: Using anon key');
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
  }
}

checkSupabaseStatus();
