/**
 * DEPRECATED: Oracle integration has been removed.
 * Use /api/purchases endpoint instead (Postgres-based).
 */

export default async function handler(req, res) {
  return res.status(410).json({
    error: 'Oracle endpoint deprecated',
    message: 'Use /api/purchases endpoint instead',
    status: 'discontinued'
  });
}
