import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let pool;
let initialized = false;

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log('[DB] Query executed', { text, duration: `${duration}ms`, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('[DB] Query error', { text, message: err.message, code: err.code });
    throw err;
  }
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Basic SSL config - disabled strict checking to avoid common RDS/Render handshake issues
  const sslConfig = { rejectUnauthorized: false };

  console.log('[DB] Creating connection pool for', connectionString.split('@')[1] || 'URL');

  return new Pool({
    connectionString,
    ssl: sslConfig,
    connectionTimeoutMillis: 5000, // 5 seconds to connect or fail
    idleTimeoutMillis: 10000,
    max: 10
  });
}

export function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function initializeDatabase() {
  if (initialized) {
    console.log('[DB] Database already initialized, skipping');
    return { success: true, message: 'Already initialized' };
  }

  try {
    console.log('[DB] Starting database initialization...');
    const client = await getPool().connect();

    try {
      // Check if tables exist
      const tableCheck = await client.query(
        "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
      );

      const tableCount = parseInt(tableCheck.rows[0].table_count);

      if (tableCount > 0) {
        console.log(`[DB] Database already has tables (${tableCount} found), skipping initialization`);
        initialized = true;
        return { success: true, message: `Database already initialized with ${tableCount} tables` };
      }

      // Read schema file
      const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at ${schemaPath}`);
      }

      const schema = fs.readFileSync(schemaPath, 'utf-8');
      console.log('[DB] Executing schema...');

      await client.query(schema);
      console.log('[DB] Schema executed successfully');

      // Get list of created tables
      const result = await client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
      );

      const tables = result.rows.map(r => r.tablename);
      console.log(`[DB] Created ${tables.length} tables:`, tables);

      initialized = true;
      return {
        success: true,
        message: 'Database initialized successfully',
        tables
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[DB] Error initializing database:', err.message);
    return {
      success: false,
      message: err.message,
      error: err
    };
  }
}
