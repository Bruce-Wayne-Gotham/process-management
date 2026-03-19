const { query } = require('../../lib/mongoDb');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role required' });
  }

  try {
    const user = await query('users', 'findOne', { username, role, is_active: true });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple password check (in production, use bcrypt)
    if (password !== 'admin123') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query('users', 'updateOne', {
      filter: { _id: user._id },
      update: { last_login: new Date() }
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
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
