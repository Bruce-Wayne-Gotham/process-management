// Previously connected to MongoDB for user auth.
// Now delegates to Cloudflare D1 (users table).
import { query } from './db.js';

export async function findUser({ username, role, is_active } = {}) {
  const conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (username !== undefined) { conditions.push(`username = $${idx++}`); params.push(username); }
  if (role !== undefined) { conditions.push(`role = $${idx++}`); params.push(role); }
  if (is_active !== undefined) { conditions.push(`is_active = $${idx++}`); params.push(is_active ? 1 : 0); }

  const result = await query(
    `SELECT * FROM users WHERE ${conditions.join(' AND ')} LIMIT 1`,
    params
  );
  return result.rows?.[0] || null;
}

export async function updateUserLastLogin(userId) {
  return query(
    `UPDATE users SET last_login = datetime('now') WHERE id = $1`,
    [userId]
  );
}

export async function updateUserPassword(username, newPasswordHash) {
  return query(
    `UPDATE users SET password_hash = $1 WHERE username = $2`,
    [newPasswordHash, username]
  );
}
