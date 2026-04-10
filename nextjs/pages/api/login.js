export const runtime = 'edge';

import { findUser, updateUserLastLogin } from '../../lib/mongoDb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, role } = await req.json();

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role required' });
  }

  try {
    const user = await findUser({ username, role, is_active: true });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await updateUserLastLogin(user.id);

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
}
