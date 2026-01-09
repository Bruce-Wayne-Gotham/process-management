#!/usr/bin/env node

/**
 * RDS Database Initialization Script
 * Creates the tobacco_tracker database and initializes schema
 * 
 * Usage:
 *   node rds-init-database.js
 * 
 * Prerequisites:
 *   - AWS RDS instance must be running
 *   - DATABASE_URL env var set with superuser credentials
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  // Create pool with superuser credentials
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('.rds.') || dbUrl.includes('rds.amazonaws.com') 
      ? { rejectUnauthorized: false }
      : false,
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
        console.log('ℹ️  Database "tobacco_tracker" already exists');
      } else {
        throw err;
      }
    }

    client.release();

    // Step 2: Connect to the new database
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
      ssl: dbUrl.includes('.rds.') || dbUrl.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : false,
    });

    const appClient = await appPool.connect();
    console.log('✅ Connected to "tobacco_tracker" database');

    // Step 3: Read and execute schema
    const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('\n📋 Executing schema...');
    await appClient.query(schema);
    console.log('✅ Schema executed successfully');

    // Step 4: Check tables
    const result = await appClient.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
    );
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

    appClient.release();
    await appPool.end();
    console.log('\n✅ Database initialization complete!');
    
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
