import { query } from '../../../lib/mongoDb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await query('users', 'findOne', { username, is_active: true });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple password check
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query('users', 'updateOne', {
      filter: { _id: user._id },
      update: { last_login: new Date() }
    });

    res.status(200).json({
      user: {
        id: user._id.toString(),
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
