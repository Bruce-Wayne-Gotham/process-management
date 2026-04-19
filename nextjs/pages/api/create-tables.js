export const runtime = 'edge';

export default async function handler(req, res) {
  return res.status(410).json({
    error: 'Database setup endpoint is deprecated',
    message: 'Apply sql/schema.d1.sql to your D1 database: npm run d1:init',
    status: 'discontinued'
  });
}
