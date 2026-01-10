#!/bin/sh
set -e

echo "Starting database initialization check..."

# Wait for database to be ready
sleep 2

# Run initialization script
node << 'EOF'
const { Client } = require('pg');
const fs = require('fs');

async function init() {
  const client = new Client({
    host: 'tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'ganeshbagh501',
    database: 'postgres',
    ssl: false
  });
  
  try {
    await client.connect();
    console.log('[Init] Connected to RDS');
    
    const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname = 'tobacco_tracker'");
    
    if (dbCheck.rows.length === 0) {
      await client.query('CREATE DATABASE tobacco_tracker');
      console.log('[Init] ✅ Database created');
    } else {
      console.log('[Init] Database already exists');
    }
    
    await client.end();
    
    const dbClient = new Client({
      host: 'tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com',
      port: 5432,
      user: 'postgres',
      password: 'ganeshbagh501',
      database: 'tobacco_tracker',
      ssl: false
    });
    
    await dbClient.connect();
    
    const tableCheck = await dbClient.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'farmers' LIMIT 1");
    
    if (tableCheck.rows.length === 0) {
      console.log('[Init] Running schema...');
      const schema = fs.readFileSync('/app/sql/schema.sql', 'utf8');
      await dbClient.query(schema);
      console.log('[Init] ✅ Schema created');
      
      console.log('[Init] Running seed data...');
      const seed = fs.readFileSync('/app/sql/seed_data.sql', 'utf8');
      await dbClient.query(seed);
      console.log('[Init] ✅ Seed data inserted');
    } else {
      console.log('[Init] Tables already exist');
    }
    
    await dbClient.end();
    console.log('[Init] ✅ Database ready!');
    process.exit(0);
  } catch (error) {
    console.error('[Init] Error:', error.message);
    process.exit(1);
  }
}

init();
EOF

echo "Database initialization complete. Starting Next.js..."
exec npm start
