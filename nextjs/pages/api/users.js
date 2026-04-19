export const runtime = 'edge';

import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT id, username, role, full_name, email, is_active, permissions, created_at, last_login FROM users ORDER BY created_at DESC'
      );
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'POST') {
    const { username, password, fullName, email, role, permissions } = await req.json();

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role required' });
    }

    try {
      const permissionsJson = permissions && permissions.length > 0
        ? JSON.stringify(permissions)
        : null;

      const result = await query(
        'INSERT INTO users (username, password_hash, role, full_name, email, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role',
        [username, password, role, fullName || null, email || null, permissionsJson]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.message?.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'PATCH') {
    const { userId, isActive } = await req.json();

    try {
      await query(
        'UPDATE users SET is_active = $1 WHERE id = $2',
        [isActive ? 1 : 0, userId]
      );
      res.status(200).json({ message: 'User updated' });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
