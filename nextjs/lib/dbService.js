const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.initialized = false;
    
    // Parse DATABASE_URL or use individual env vars
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      this.config = { connectionString: dbUrl, ssl: false };
    } else {
      this.config = {
        host: process.env.DB_HOST || 'tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'ganeshbagh501',
        database: process.env.DB_NAME || 'tobacco_tracker',
        ssl: false
      };
    }
  }

  async ensureDatabaseExists() {
    const config = { ...this.config };
    if (config.connectionString) {
      config.connectionString = config.connectionString.replace(/\/[^/]+(\?|$)/, '/postgres$1');
    } else {
      config.database = 'postgres';
    }

    const client = new Client(config);

    try {
      await client.connect();
      console.log('[DB] Connected to PostgreSQL server');

      const dbName = this.config.database || 'tobacco_tracker';
      const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

      if (result.rows.length === 0) {
        console.log(`[DB] Creating database ${dbName}...`);
        await client.query(`CREATE DATABASE ${dbName}`);
        console.log('[DB] ✅ Database created');
      } else {
        console.log('[DB] Database exists');
      }

      await client.end();
      return true;
    } catch (error) {
      console.error('[DB] Error ensuring database:', error.message);
      if (client) await client.end().catch(() => {});
      throw error;
    }
  }

  async ensureTablesExist() {
    const client = new Client(this.config);

    try {
      await client.connect();
      console.log('[DB] Connected to database');

      const tableCheck = await client.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
      );

      const tableCount = parseInt(tableCheck.rows[0].count);

      if (tableCount === 0) {
        console.log('[DB] Creating schema...');
        
        const schemaPath = path.join(__dirname, '../sql/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
        console.log('[DB] ✅ Schema created');

        const seedPath = path.join(__dirname, '../sql/seed_data.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');
        await client.query(seed);
        console.log('[DB] ✅ Seed data inserted');
      } else {
        console.log(`[DB] Tables exist (${tableCount} found)`);
      }

      await client.end();
      return true;
    } catch (error) {
      console.error('[DB] Error ensuring tables:', error.message);
      if (client) await client.end().catch(() => {});
      throw error;
    }
  }

  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      console.log('[DB] Starting initialization...');
      await this.ensureDatabaseExists();
      await this.ensureTablesExist();
      this.initialized = true;
      console.log('[DB] ✅ Initialization complete');
      return true;
    } catch (error) {
      console.error('[DB] Initialization failed:', error.message);
      return false;
    }
  }

  getPool() {
    if (!this.pool) {
      this.pool = new Pool({
        ...this.config,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 7000
      });
      
      this.pool.on('error', (err) => {
        console.error('[DB] Pool error:', err.message);
      });
    }
    return this.pool;
  }

  async query(text, params) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.getPool().query(text, params);
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.initialized = false;
    }
  }
}

module.exports = new DatabaseService();
