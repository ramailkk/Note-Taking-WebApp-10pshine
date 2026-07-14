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

  const { username, email } = req.body;
  const userId = user.userId;

  try {
    if (!username && !email) {
      return res.status(400).json({ error: 'Username or email is required.' });
    }

    if (username) {
      const existingUsername = await userModel.findUserByUsername(username);
      if (existingUsername) {
        const currentUser = await userModel.findUserByUserId(userId);
        if (currentUser && currentUser.username !== username) {
          return res.status(409).json({ error: 'Username is already taken.' });
        }
      }
      await userModel.updateUsername(userId, username);
      logger.info({ userId, username }, 'Username updated');
    }

    if (email) {
      const existingEmail = await userModel.findUserByEmail(email);
      if (existingEmail) {
        const currentUser = await userModel.findUserByUserId(userId);
        if (currentUser && currentUser.email !== email) {
          return res.status(409).json({ error: 'Email is already registered.' });
        }
      }
      await userModel.updateEmail(userId, email);
      logger.info({ userId, email }, 'Email updated');
    }

    return res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (err) {
    logger.error({ err, userId }, 'Error updating profile');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
