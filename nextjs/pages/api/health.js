import dbService from '../../lib/dbService';

let initAttempted = false;

export default async function handler(req, res) {
  try {
    // Auto-initialize database on first health check
    if (!initAttempted) {
      initAttempted = true;
      console.log('[Health] Initializing database...');
      await dbService.initialize();
    }

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

    if (hasDatabaseUrl) {
      const dbUrlMasked = dbUrl.replace(/:([^:@]+)@/, ':****@');
      response.environment.databaseUrlMasked = dbUrlMasked;

      try {
        console.log('[Health] Testing database connection...');
        const result = await dbService.query('SELECT NOW() as current_time');
        response.database = {
          connected: true,
          serverTime: result.rows[0]?.current_time,
          status: 'connected'
        };
      } catch (dbError) {
        console.error('[Health] Database error:', dbError.message);
        response.database = {
          connected: false,
          error: dbError.message,
          code: dbError.code
        };
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
