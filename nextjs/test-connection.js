const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('URL:', supabaseUrl);
// console.log('Key:', supabaseKey); // Don't log full key for security

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  
  // Try to read from farmers table
  const { data, error } = await supabase
    .from('farmers')
    .select('count', { count: 'exact', head: true });

  if (error) {
    console.error('Connection Error:', error.message);
    if (error.code === 'PGRST116') {
        console.log('Note: This error often means the table does not exist.');
    }
  } else {
    console.log('Connection Successful!');
    console.log('Farmers count:', data); // data might be null if head:true, check count
    // Actually with head:true, data is null, count is in the response object wrapper usually, 
    // but supabase-js v2 returns { count, data, error }
  }
  
  // Let's try a simple select to be sure
  const { data: farmers, error: selectError } = await supabase
    .from('farmers')
    .select('*')
    .limit(1);
    
  if (selectError) {
      console.log('Select Error:', selectError.message);
  } else {
      console.log('Select Success. Rows found:', farmers.length);
  }
}

testConnection();
