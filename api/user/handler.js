const bcrypt = require('bcryptjs');
const userModel = require('../_lib/userModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const getSlug = require('../_lib/getSlug');
const logger = require('../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const slug = getSlug(req);
  const [action] = slug;
  const method = req.method;

  const user = verifyToken(req, res);
  if (!user) return;

  if (action === 'info' && method === 'GET') return info(req, res, user);
  if (action === 'profile' && method === 'PUT') return profile(req, res, user);
  if (action === 'password' && method === 'PUT') return password(req, res, user);
  if (action === 'picture' && method === 'PUT') return picture(req, res, user);

  return res.status(404).json({ error: 'Not found' });
}

async function info(req, res, user) {
  try {
    const getUser = await userModel.findUserByUserId(user.userId);
    if (!getUser) return res.status(404).json({ error: 'User not found' });
    logger.info({ userId: user.userId }, 'Fetched user info successfully');
    return res.status(200).json(getUser);
  } catch (err) {
    logger.error({ err, userId: user.userId }, 'Error fetching user info');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function profile(req, res, user) {
  const { username, email } = req.body;
  const userId = user.userId;
  try {
    if (!username && !email) return res.status(400).json({ error: 'Username or email is required.' });

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

async function password(req, res, user) {
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
    if (!storedHash) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, hashedPassword);
    logger.info({ userId }, 'Password updated successfully');
    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    logger.error({ err, userId }, 'Error updating password');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function picture(req, res, user) {
  const { profilePicture } = req.body;
  const userId = user.userId;
  try {
    if (!profilePicture) return res.status(400).json({ error: 'Profile picture is required.' });
    await userModel.updateProfilePicture(userId, profilePicture);
    logger.info({ userId }, 'Profile picture updated');
    return res.status(200).json({ message: 'Profile picture updated successfully.' });
  } catch (err) {
    logger.error({ err, userId }, 'Error updating profile picture');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
