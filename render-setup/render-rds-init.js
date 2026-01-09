#!/usr/bin/env node

/**
 * AWS RDS Database Initialization for Render Deployment
 * This script initializes the RDS database on first deployment to Render
 * 
 * Usage: NODE_ENV=production DATABASE_URL=... node render-rds-init.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeAWSRDS() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  // SSL configuration for RDS
  let sslConfig = { rejectUnauthorized: false };
  const awsRdsCertPath = process.env.AWS_RDS_CA_CERT_PATH;
  if (awsRdsCertPath && fs.existsSync(awsRdsCertPath)) {
    sslConfig = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(awsRdsCertPath).toString(),
    };
  }

  // Create pool with RDS connection
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: sslConfig,
    max: 5,
  });

  try {
    console.log('🔄 Connecting to AWS RDS...');
    const client = await pool.connect();
    console.log('✅ Connected to AWS RDS');

    // Step 1: Create database if not exists
    console.log('\n📦 Creating database "tobacco_tracker"...');
    try {
      await client.query('CREATE DATABASE tobacco_tracker;');
      console.log('✅ Database "tobacco_tracker" created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Database "tobacco_tracker" already exists, skipping creation');
      } else {
        throw err;
      }
    }

    client.release();

    // Step 2: Connect to the application database
    const appDbUrl = dbUrl.replace(
      /\/[^\/]*\?/,
      '/tobacco_tracker?'
    ).replace(
      /\/[^\/]*$/,
      '/tobacco_tracker'
    );

    console.log('\n🔄 Connecting to "tobacco_tracker" database...');
    const appPool = new Pool({
      connectionString: appDbUrl,
      ssl: sslConfig,
      max: 5,
    });

    const appClient = await appPool.connect();
    console.log('✅ Connected to "tobacco_tracker" database');

    // Step 3: Check if schema is already applied
    const tableCheck = await appClient.query(
      "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
    );
    
    const tableCount = parseInt(tableCheck.rows[0].table_count);
    
    if (tableCount > 0) {
      console.log(`\n✅ Schema already initialized (${tableCount} tables found), skipping schema setup`);
      appClient.release();
      await appPool.end();
      await pool.end();
      console.log('\n✅ Database initialization complete!');
      process.exit(0);
    }

    // Step 4: Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('\n📋 Executing schema...');
    await appClient.query(schema);
    console.log('✅ Schema executed successfully');

    // Step 5: List created tables
    const result = await appClient.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    );
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

    appClient.release();
    await appPool.end();
    console.log('\n✅ Database initialization complete!');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeAWSRDS();
