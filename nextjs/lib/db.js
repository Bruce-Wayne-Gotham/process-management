import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let pool;
let initialized = false;

export async function query(text, params) {
  // Auto-initialize on first query
  if (!initialized) {
    await initializeDatabase();
  }
  
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

  console.log('[DB] Creating connection pool for', connectionString.split('@')[1] || 'URL');

  return new Pool({
    connectionString,
    ssl: false, // Disabled SSL for RDS connection
    connectionTimeoutMillis: 7000,
    idleTimeoutMillis: 30000,
    query_timeout: 20000,
    max: 5,
    min: 0,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
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
    return { success: true, message: 'Already initialized' };
  }

  try {
    console.log('[DB] Initializing database schema...');
    const client = await getPool().connect();

    try {
      // Read and execute initialization SQL
      const initPath = path.join(process.cwd(), 'INITIALIZE_DATABASE.sql');
      
      if (!fs.existsSync(initPath)) {
        console.log('[DB] INITIALIZE_DATABASE.sql not found, skipping');
        initialized = true;
        return { success: true, message: 'No initialization file found' };
      }

      const sql = fs.readFileSync(initPath, 'utf-8');
      await client.query(sql);
      
      console.log('[DB] ✅ Database schema initialized successfully');
      initialized = true;
      
      return {
        success: true,
        message: 'Database initialized successfully'
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[DB] ❌ Error initializing database:', err.message);
    // Don't fail - tables might already exist
    initialized = true;
    return {
      success: false,
      message: err.message,
      error: err
    };
  }
}
