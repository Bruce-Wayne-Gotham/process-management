const dbService = require('../../lib/dbService');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role required' });
  }

  try {
    const result = await dbService.query(
      'SELECT * FROM users WHERE username = $1 AND role = $2 AND is_active = true',
      [username, role]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Simple password check (in production, use bcrypt)
    if (password !== 'admin123') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await dbService.query(
      'UPDATE users SET last_login = now() WHERE id = $1',
      [user.id]
    );

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('[API] Login error:', error);
    return res.status(500).json({ error: error.message });
  }
};
