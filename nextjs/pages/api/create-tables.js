/**
 * This endpoint is deprecated.
 * Database setup is now handled via render-setup/setup-database.js
 * which runs as a one-off job on Render during initial deployment.
 */

export default async function handler(req, res) {
  return res.status(410).json({
    error: 'Database setup endpoint is deprecated',
    message: 'Use render-setup/setup-database.js for database initialization',
    status: 'discontinued'
  });
}
