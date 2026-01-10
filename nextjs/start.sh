#!/bin/sh
set -e

echo "🔄 Checking database..."

# Run database initialization
node -e "
const { Client } = require('pg');
const fs = require('fs');

async function init() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check if users table exists
    const check = await client.query(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')\");
    
    if (!check.rows[0].exists) {
      console.log('📦 Initializing database...');
      const sql = fs.readFileSync('./INITIALIZE_DATABASE.sql', 'utf8');
      await client.query(sql);
      console.log('✅ Database initialized');
    } else {
      console.log('✅ Database already initialized');
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Database error:', err.message);
    await client.end();
  }
}

init();
"

echo "🚀 Starting application..."
exec npm start
