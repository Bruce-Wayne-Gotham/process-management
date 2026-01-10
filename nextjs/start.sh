#!/bin/sh
set -e

echo "🔄 Initializing database schema..."

# Run database initialization - only creates tables if they don't exist
node -e "
const { Client } = require('pg');
const fs = require('fs');

async function init() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Run initialization SQL (uses CREATE TABLE IF NOT EXISTS)
    const sql = fs.readFileSync('./INITIALIZE_DATABASE.sql', 'utf8');
    await client.query(sql);
    console.log('✅ Database schema verified');
    
    await client.end();
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    await client.end();
    process.exit(1);
  }
}

init();
"

echo "🚀 Starting application..."
exec npm start
