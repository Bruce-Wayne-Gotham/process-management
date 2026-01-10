import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { currentUserId, currentUserRole, targetUsername, newPassword } = req.body;

  if (currentUserRole !== 'owner') {
    return res.status(403).json({ error: 'Only owner can change passwords' });
  }

  if (!targetUsername || !newPassword) {
    return res.status(400).json({ error: 'Username and new password required' });
  }

  try {
    // For simplicity, storing plain password (in production, use bcrypt)
    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
      [newPassword, targetUsername]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
