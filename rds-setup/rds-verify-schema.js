#!/usr/bin/env node

/**
 * RDS Schema Verification Script
 * Checks that all required tables exist and have correct structure
 */

import { Pool } from 'pg';

async function verifySchema() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('.rds.') || dbUrl.includes('rds.amazonaws.com')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    console.log('🔄 Verifying RDS database schema...\n');
    
    const client = await pool.connect();

    // Get all tables
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    );

    if (tables.rows.length === 0) {
      console.error('❌ No tables found in database');
      process.exit(1);
    }

    console.log('✅ Found tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

    // Check specific expected tables
    const expectedTables = ['farmers', 'purchases', 'lots', 'payments', 'process'];
    const foundTables = new Set(tables.rows.map(t => t.tablename));
    
    console.log('\n📋 Verifying expected tables:');
    let allFound = true;
    expectedTables.forEach(table => {
      if (foundTables.has(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ⚠️  ${table} (not found)`);
        allFound = false;
      }
    });

    // Test connection
    const connectionTest = await client.query('SELECT NOW() as current_time;');
    console.log(`\n✅ Connection test: ${connectionTest.rows[0].current_time}`);

    client.release();

    if (allFound) {
      console.log('\n✅ All expected tables found - schema is valid!');
    } else {
      console.log('\n⚠️  Some expected tables are missing - please run initialization script');
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Error verifying schema:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySchema();
