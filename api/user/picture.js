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

  const { profilePicture } = req.body;
  const userId = user.userId;

  try {
    if (!profilePicture) {
      return res.status(400).json({ error: 'Profile picture is required.' });
    }
    await userModel.updateProfilePicture(userId, profilePicture);
    logger.info({ userId }, 'Profile picture updated');
    return res.status(200).json({ message: 'Profile picture updated successfully.' });
  } catch (err) {
    logger.error({ err, userId }, 'Error updating profile picture');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
