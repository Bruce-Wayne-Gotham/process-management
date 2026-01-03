// Supabase integration removed.
// This API endpoint previously performed Supabase-based DB setup. It now directs
// callers to apply the canonical SQL schema manually.

export default async function handler(req, res) {
  res.status(410).json({
    error: 'Supabase integration removed',
    message: 'This endpoint no longer performs automated setup. Apply `sql/schema.sql` manually to your Postgres database and remove this endpoint if unnecessary.'
  });
}
