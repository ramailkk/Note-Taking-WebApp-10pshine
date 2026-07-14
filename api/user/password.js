const bcrypt = require('bcryptjs');
const userModel = require('../_lib/userModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const logger = require('../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { currentPassword, newPassword } = req.body;
  const userId = user.userId;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const storedHash = await userModel.getUserPasswordHash(userId);
    if (!storedHash) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, hashedPassword);

    logger.info({ userId }, 'Password updated successfully');
    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    logger.error({ err, userId }, 'Error updating password');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
