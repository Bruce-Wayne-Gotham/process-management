export const runtime = 'edge';

import { query } from '../../lib/db';

export default async function handler(req, res) {
  try {
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV
      },
      endpoints: {
        farmers: '/api/farmers',
        purchases: '/api/purchases',
        lots: '/api/lots',
        process: '/api/process',
        payments: '/api/payments'
      }
    };

    try {
      const result = await query("SELECT datetime('now') as current_time");
      response.database = {
        connected: true,
        serverTime: result.rows[0]?.current_time,
        engine: 'Cloudflare D1 (SQLite)'
      };
    } catch (dbError) {
      response.database = {
        connected: false,
        error: dbError.message
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
