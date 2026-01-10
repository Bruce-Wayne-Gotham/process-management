const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.initialized = false;
    this.config = {
      host: process.env.DB_HOST || 'tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'ganeshbagh501',
      database: process.env.DB_NAME || 'tobacco_tracker',
      ssl: false,
      connectionTimeoutMillis: 7000,
      idleTimeoutMillis: 30000,
      max: 5,
      min: 0
    };
  }

  async ensureDatabaseExists() {
    const client = new Client({
      ...this.config,
      database: 'postgres'
    });

    try {
      await client.connect();
      console.log('[DB Service] Connected to PostgreSQL server');

      const result = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [this.config.database]
      );

      if (result.rows.length === 0) {
        console.log(`[DB Service] Creating database ${this.config.database}...`);
        await client.query(`CREATE DATABASE ${this.config.database}`);
        console.log('[DB Service] ✅ Database created');
      } else {
        console.log('[DB Service] Database already exists');
      }

      await client.end();
      return true;
    } catch (error) {
      console.error('[DB Service] Error ensuring database exists:', error.message);
      if (client) await client.end().catch(() => {});
      throw error;
    }
  }

  async ensureTablesExist() {
    const client = new Client(this.config);

    try {
      await client.connect();
      console.log('[DB Service] Connected to database');

      const tableCheck = await client.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
      );

      const tableCount = parseInt(tableCheck.rows[0].count);

      if (tableCount === 0) {
        console.log('[DB Service] No tables found, running schema...');
        
        const schemaPath = path.join(__dirname, '../sql/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
        console.log('[DB Service] ✅ Schema created');

        const seedPath = path.join(__dirname, '../sql/seed_data.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');
        await client.query(seed);
        console.log('[DB Service] ✅ Seed data inserted');
      } else {
        console.log(`[DB Service] Found ${tableCount} tables, skipping initialization`);
      }

      await client.end();
      return true;
    } catch (error) {
      console.error('[DB Service] Error ensuring tables exist:', error.message);
      if (client) await client.end().catch(() => {});
      throw error;
    }
  }

  async initialize() {
    if (this.initialized) {
      console.log('[DB Service] Already initialized');
      return true;
    }

    try {
      await this.ensureDatabaseExists();
      await this.ensureTablesExist();
      this.initialized = true;
      console.log('[DB Service] ✅ Initialization complete');
      return true;
    } catch (error) {
      console.error('[DB Service] Initialization failed:', error.message);
      return false;
    }
  }

  getPool() {
    if (!this.pool) {
      this.pool = new Pool(this.config);
      this.pool.on('error', (err) => {
        console.error('[DB Service] Pool error:', err.message);
      });
    }
    return this.pool;
  }

  async query(text, params) {
    try {
      const result = await this.getPool().query(text, params);
      return result;
    } catch (error) {
      console.error('[DB Service] Query error:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.initialized = false;
      console.log('[DB Service] Connection pool closed');
    }
  }
}

const dbService = new DatabaseService();

module.exports = dbService;
