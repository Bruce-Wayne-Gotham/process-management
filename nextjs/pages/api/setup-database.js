import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesDirectly() {
  console.log('📋 Creating database tables using direct Supabase client...');
  
  try {
    // Since exec_sql RPC doesn't exist, we'll create tables using individual operations
    // First, let's try to create the farmers table to test connectivity
    const { error: testError } = await supabase
      .from('farmers')
      .select('count', { count: 'exact', head: true });
    
    if (testError && testError.code === 'PGRST116') {
      // Table doesn't exist, which is expected for first run
      console.log('✅ Database connection successful, tables need to be created');
    } else if (!testError) {
      console.log('✅ Tables already exist, skipping creation');
      return { success: true, message: 'Tables already exist' };
    }
    
    // For now, we'll return success and let the user know to run the SQL manually
    return { 
      success: true, 
      message: 'Database connection successful. Please run the SQL setup manually in Supabase dashboard.',
      needsManualSetup: true
    };
    
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    return { success: false, error: err.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to trigger setup.' });
  }

  // Simple authentication check
  const { setupKey } = req.body;
  if (setupKey !== 'tobacco-tracker-setup-2024') {
    return res.status(401).json({ error: 'Invalid setup key' });
  }

  console.log('🚀 Starting Tobacco Tracker Database Setup via API...');
  const startTime = Date.now();
  const setupLog = [];

  try {
    // Step 1: Test database connection and check if tables exist
    setupLog.push('🔗 Testing database connection...');
    
    const connectionResult = await createTablesDirectly();
    if (!connectionResult.success) {
      setupLog.push(`❌ Database connection failed: ${connectionResult.error}`);
      return res.status(500).json({ error: 'Database connection failed', log: setupLog });
    }
    
    if (connectionResult.needsManualSetup) {
      setupLog.push('⚠️ Tables need to be created manually in Supabase dashboard');
      setupLog.push('📋 Please run the SQL scripts from SUPABASE_SETUP.md');
      
      return res.status(200).json({
        success: false,
        message: 'Database connection successful, but tables need manual setup',
        instructions: [
          '1. Go to your Supabase dashboard: https://supabase.com/dashboard',
          '2. Navigate to SQL Editor',
          '3. Run the SQL scripts from SUPABASE_SETUP.md in your project',
          '4. Come back and try the setup again'
        ],
        log: setupLog,
        setupGuideUrl: 'https://process-management-4t4o.onrender.com/SUPABASE_SETUP.md'
      });
    }
    
    setupLog.push('✅ Database connection successful, tables exist!');

    // Step 3: Create sample farmers using Supabase client
    setupLog.push('👥 Creating sample farmers...');
    
    const sampleFarmers = [
      { farmer_code: 'F001', name: 'Rajesh Kumar', village: 'Khandwa', contact_number: '9876543210', efficacy_score: 8.5 },
      { farmer_code: 'F002', name: 'Suresh Patel', village: 'Dewas', contact_number: '9876543211', efficacy_score: 7.2 },
      { farmer_code: 'F003', name: 'Mahesh Singh', village: 'Ujjain', contact_number: '9876543212', efficacy_score: 9.1 },
      { farmer_code: 'F004', name: 'Ramesh Sharma', village: 'Indore', contact_number: '9876543213', efficacy_score: 6.8 },
      { farmer_code: 'F005', name: 'Dinesh Verma', village: 'Bhopal', contact_number: '9876543214', efficacy_score: 8.9 }
    ];

    const { data: farmers, error: farmersError } = await supabase
      .from('farmers')
      .upsert(sampleFarmers, { onConflict: 'farmer_code' })
      .select();

    if (farmersError) {
      setupLog.push(`❌ Error creating sample farmers: ${farmersError.message}`);
      return res.status(500).json({ error: 'Failed to create sample farmers', log: setupLog });
    }
    setupLog.push(`✅ Created ${farmers.length} sample farmers!`);

    // Step 4: Create sample purchases
    setupLog.push('🧾 Creating sample purchases...');
    
    const samplePurchases = [
      { farmer_id: farmers[0].id, purchase_date: '2024-11-01', packaging_type: 'BODH', process_weight: 50.5, packaging_weight: 2.0, rate_per_kg: 150.00, remarks: 'Good quality tobacco' },
      { farmer_id: farmers[1].id, purchase_date: '2024-11-02', packaging_type: 'BAG', process_weight: 75.2, packaging_weight: 3.5, rate_per_kg: 145.00, remarks: 'Premium grade' },
      { farmer_id: farmers[0].id, purchase_date: '2024-11-03', packaging_type: 'BODH', process_weight: 60.0, packaging_weight: 2.5, rate_per_kg: 150.00, remarks: 'Regular quality' },
      { farmer_id: farmers[2].id, purchase_date: '2024-11-04', packaging_type: 'BAG', process_weight: 80.5, packaging_weight: 4.0, rate_per_kg: 155.00, remarks: 'Excellent quality' },
      { farmer_id: farmers[3].id, purchase_date: '2024-11-05', packaging_type: 'BODH', process_weight: 45.0, packaging_weight: 1.8, rate_per_kg: 140.00, remarks: 'Average quality' }
    ];

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .insert(samplePurchases)
      .select();

    if (purchasesError) {
      setupLog.push(`❌ Error creating sample purchases: ${purchasesError.message}`);
      return res.status(500).json({ error: 'Failed to create sample purchases', log: setupLog });
    }
    setupLog.push(`✅ Created ${purchases.length} sample purchases!`);

    // Step 5: Verify setup
    setupLog.push('🔍 Verifying setup...');
    
    const { count: farmerCount } = await supabase
      .from('farmers')
      .select('*', { count: 'exact', head: true });
    
    const { count: purchaseCount } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true });

    const { count: statusCount } = await supabase
      .from('process_status')
      .select('*', { count: 'exact', head: true });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    setupLog.push('🎉 Database setup completed successfully!');
    setupLog.push(`📊 Final counts: ${farmerCount} farmers, ${purchaseCount} purchases, ${statusCount} statuses`);
    setupLog.push(`⏱️ Setup completed in ${duration} seconds`);

    return res.status(200).json({
      success: true,
      message: 'Database setup completed successfully!',
      statistics: {
        farmers: farmerCount,
        purchases: purchaseCount,
        processStatuses: statusCount,
        duration: `${duration} seconds`
      },
      log: setupLog,
      nextSteps: [
        'Visit /farmers to see the sample farmers',
        'Visit /purchases to see the sample purchases',
        'Try adding new farmers and purchases through the UI',
        'Dashboard will now show real statistics'
      ]
    });

  } catch (error) {
    setupLog.push(`❌ Setup failed: ${error.message}`);
    console.error('Database setup failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      log: setupLog
    });
  }
}
