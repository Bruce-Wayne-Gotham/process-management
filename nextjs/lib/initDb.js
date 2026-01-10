const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('[DB Init] Starting database initialization...');
  
  const config = {
    host: process.env.DB_HOST || 'tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'ganeshbagh501',
    database: 'postgres',
    ssl: false
  };

  let client = new Client(config);
  
  try {
    await client.connect();
    console.log('[DB Init] Connected to PostgreSQL server');
    
    // Check if database exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'tobacco_tracker'"
    );
    
    if (dbCheck.rows.length === 0) {
      console.log('[DB Init] Creating database tobacco_tracker...');
      await client.query('CREATE DATABASE tobacco_tracker');
      console.log('[DB Init] ✅ Database created');
    } else {
      console.log('[DB Init] Database tobacco_tracker already exists');
    }
    
    await client.end();
    
    // Connect to tobacco_tracker database
    config.database = 'tobacco_tracker';
    client = new Client(config);
    await client.connect();
    console.log('[DB Init] Connected to tobacco_tracker database');
    
    // Check if tables exist
    const tableCheck = await client.query(
      "SELECT 1 FROM information_schema.tables WHERE table_name = 'farmers' LIMIT 1"
    );
    
    if (tableCheck.rows.length === 0) {
      console.log('[DB Init] Running schema.sql...');
      const schemaPath = path.join(__dirname, '../sql/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);
      console.log('[DB Init] ✅ Schema created');
      
      console.log('[DB Init] Running seed_data.sql...');
      const seedPath = path.join(__dirname, '../sql/seed_data.sql');
      const seed = fs.readFileSync(seedPath, 'utf8');
      await client.query(seed);
      console.log('[DB Init] ✅ Seed data inserted');
    } else {
      console.log('[DB Init] Tables already exist, skipping initialization');
    }
    
    await client.end();
    console.log('[DB Init] ✅ Database initialization complete!');
    return true;
    
  } catch (error) {
    console.error('[DB Init] ❌ Error:', error.message);
    if (client) {
      try { await client.end(); } catch (e) {}
    }
    return false;
  }
}

module.exports = { initializeDatabase };
