import { query } from '../../lib/db';
import { initializeDatabase } from '../../lib/initDb';

let dbInitialized = false;

export default async function handler(req, res) {
  try {
    // Check if DATABASE_URL is set
    const dbUrl = process.env.DATABASE_URL;
    const hasDatabaseUrl = !!dbUrl;

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: hasDatabaseUrl,
        databaseUrlLength: hasDatabaseUrl ? dbUrl.length : 0
      },
      endpoints: {
        farmers: '/api/farmers',
        purchases: '/api/purchases',
        lots: '/api/lots',
        process: '/api/process',
        payments: '/api/payments'
      }
    };

    // Try to query the database
    if (hasDatabaseUrl) {
      const dbUrlMasked = dbUrl.replace(/:([^:@]+)@/, ':****@');
      response.environment.databaseUrlMasked = dbUrlMasked;

      try {
        console.log('[Health] Attempting database ping...');
        const result = await query('SELECT NOW() as current_time');
        response.database = {
          connected: true,
          serverTime: result.rows[0]?.current_time,
          status: 'reachable'
        };
      } catch (dbError) {
        console.error('[Health] Database ping failed:', dbError.message);
        
        // Auto-initialize database if it doesn't exist
        if (!dbInitialized && (dbError.message.includes('does not exist') || dbError.code === '3D000')) {
          console.log('[Health] Attempting to initialize database...');
          dbInitialized = await initializeDatabase();
          
          if (dbInitialized) {
            const retryResult = await query('SELECT NOW() as current_time');
            response.database = {
              connected: true,
              serverTime: retryResult.rows[0]?.current_time,
              status: 'initialized and connected'
            };
          } else {
            response.database = {
              connected: false,
              error: 'Failed to initialize database',
              originalError: dbError.message
            };
          }
        } else {
          response.database = {
            connected: false,
            error: dbError.message,
            code: dbError.code,
            hint: 'Check AWS RDS Security Group inbound rules and sslmode'
          };
        }
      }
    } else {
      response.database = {
        connected: false,
        error: 'DATABASE_URL is missing'
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
