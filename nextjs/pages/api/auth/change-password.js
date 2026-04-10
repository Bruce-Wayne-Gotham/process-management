export const runtime = 'edge';

import { updateUserPassword } from '../../../lib/mongoDb';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { currentUserRole, targetUsername, newPassword } = await req.json();

  if (currentUserRole !== 'owner') {
    return res.status(403).json({ error: 'Only owner can change passwords' });
  }

  if (!targetUsername || !newPassword) {
    return res.status(400).json({ error: 'Username and new password required' });
  }

  try {
    const result = await updateUserPassword(targetUsername, newPassword);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
