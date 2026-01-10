import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await query(
      'SELECT id, username, role, full_name, is_active, permissions FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Simple password check
    const passwordResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    );

    if (passwordResult.rows[0].password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query(
      'UPDATE users SET last_login = now() WHERE id = $1',
      [user.id]
    );

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        permissions: user.permissions || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
