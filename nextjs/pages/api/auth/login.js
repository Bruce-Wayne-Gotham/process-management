export const runtime = 'edge';

import { findUser, updateUserLastLogin } from '../../../lib/mongoDb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = await req.json();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await findUser({ username, is_active: true });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await updateUserLastLogin(user.id);

    const permissions = user.permissions
      ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions)
      : [];

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
