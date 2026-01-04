/**
 * DEPRECATED: Oracle integration has been removed.
 * Use /api/farmers endpoint instead (Postgres-based).
 */

export default async function handler(req, res) {
  return res.status(410).json({
    error: 'Oracle endpoint deprecated',
    message: 'Use /api/farmers endpoint instead',
    status: 'discontinued'
  });
}
