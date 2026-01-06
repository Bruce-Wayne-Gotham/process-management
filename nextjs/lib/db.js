import { Pool } from 'pg';
import fs from 'fs';

let pool;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  // Determine database type and SSL requirements
  const isRenderDatabase = connectionString.includes('render.com');
  const isAWSRDS = connectionString.includes('.rds.amazonaws.com') || 
                   connectionString.includes('.rds.') ||
                   process.env.DB_HOST?.includes('rds.amazonaws.com');
  
  // SSL configuration
  let sslConfig = false;
  
  if (isAWSRDS) {
    // AWS RDS requires SSL connections
    // Option 1: Use AWS RDS CA certificate bundle (recommended for production)
    const awsRdsCertPath = process.env.AWS_RDS_CA_CERT_PATH;
    if (awsRdsCertPath && fs.existsSync(awsRdsCertPath)) {
      sslConfig = {
        rejectUnauthorized: true,
        ca: fs.readFileSync(awsRdsCertPath).toString(),
      };
    } else {
      // Option 2: Accept self-signed certificates (for development/testing)
      // For production, download AWS RDS CA bundle from:
      // https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
      sslConfig = process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: true }  // Production should use proper CA cert
        : { rejectUnauthorized: false }; // Development
    }
  } else if (isRenderDatabase) {
    // Render Postgres databases require SSL
    sslConfig = { rejectUnauthorized: false };
  } else if (process.env.NODE_ENV === 'production') {
    // Other production databases should use SSL
    sslConfig = { rejectUnauthorized: false };
  }

  const poolConfig = {
    connectionString,
    ssl: sslConfig,
    // Connection pool configuration for reliability
    max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum number of clients in the pool
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10), // Close idle clients after 30 seconds
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '10000', 10), // Connection timeout
    // Additional AWS RDS optimizations
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };

  return new Pool(poolConfig);
}

export function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}
