const dbService = require('../../lib/dbService');

export default async function handler(req, res) {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const hasDatabaseUrl = !!dbUrl;

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: hasDatabaseUrl
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
      try {
        const result = await dbService.query('SELECT NOW() as current_time');
        response.database = {
          connected: true,
          serverTime: result.rows[0]?.current_time,
          initialized: dbService.initialized
        };
      } catch (dbError) {
        response.database = {
          connected: false,
          error: dbError.message
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
      message: error.message
    });
  }
}
