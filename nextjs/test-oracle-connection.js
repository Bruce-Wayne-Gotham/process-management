// Test Oracle Cloud Database Connection
// Run this script to verify your Oracle database setup

import { executeQuery, testConnection, initializeOracleClient } from './lib/oracleClient.js';

async function runTests() {
  console.log('🔍 Testing Oracle Cloud Database Connection...\n');
  
  try {
    // Initialize Oracle client
    console.log('1. Initializing Oracle client...');
    await initializeOracleClient();
    console.log('✅ Oracle client initialized successfully\n');
    
    // Test basic connection
    console.log('2. Testing database connection...');
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Database connection successful\n');
    } else {
      console.log('❌ Database connection failed\n');
      return;
    }
    
    // Test table existence
    console.log('3. Checking table structure...');
    const tables = await executeQuery(`
      SELECT table_name 
      FROM user_tables 
      WHERE table_name IN ('FARMERS', 'PURCHASES', 'LOTS', 'PROCESS')
      ORDER BY table_name
    `);
    
    console.log('📋 Found tables:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    console.log('');
    
    // Test sample data
    console.log('4. Testing sample data queries...');
    
    // Test farmers table
    const farmerCount = await executeQuery('SELECT COUNT(*) as count FROM farmers WHERE is_active = 1');
    console.log(`👥 Active farmers: ${farmerCount[0].COUNT}`);
    
    // Test purchases table
    const purchaseCount = await executeQuery('SELECT COUNT(*) as count FROM purchases');
    console.log(`📦 Total purchases: ${purchaseCount[0].COUNT}`);
    
    // Test process status
    const statusCount = await executeQuery('SELECT COUNT(*) as count FROM process_status');
    console.log(`🔄 Process statuses: ${statusCount[0].COUNT}`);
    
    // Test complex query with joins
    console.log('\n5. Testing complex queries...');
    const recentPurchases = await executeQuery(`
      SELECT 
        p.id,
        f.farmer_code,
        f.name as farmer_name,
        p.purchase_date,
        p.total_weight,
        p.total_amount
      FROM purchases p
      LEFT JOIN farmers f ON p.farmer_id = f.id
      WHERE ROWNUM <= 5
      ORDER BY p.purchase_date DESC
    `);
    
    console.log('📊 Recent purchases:');
    recentPurchases.forEach(purchase => {
      console.log(`   - ${purchase.FARMER_CODE} | ${purchase.FARMER_NAME} | ${purchase.PURCHASE_DATE} | ${purchase.TOTAL_WEIGHT}kg | ₹${purchase.TOTAL_AMOUNT}`);
    });
    
    // Test view if it exists
    try {
      const viewTest = await executeQuery('SELECT COUNT(*) as count FROM v_farmers_summary');
      console.log(`\n👁️  View test (v_farmers_summary): ${viewTest[0].COUNT} records`);
    } catch (viewError) {
      console.log('\n⚠️  View v_farmers_summary not found (this is normal if views weren\'t created)');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your frontend to use Oracle API endpoints');
    console.log('   2. Test all CRUD operations through the UI');
    console.log('   3. Monitor database performance');
    console.log('   4. Set up regular backups if not already configured');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Check environment variables are set correctly');
    console.error('   2. Verify Oracle wallet files are accessible');
    console.error('   3. Ensure network allows connection to Oracle Cloud');
    console.error('   4. Check if database user has required permissions');
  }
}

// Run the tests
runTests().catch(console.error);
