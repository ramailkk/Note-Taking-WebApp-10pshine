const userModel = require('../_lib/userModel');
const verifyToken = require('../_lib/middleware');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const userId = user.userId;

  try {
    const userInfo = await userModel.findUserByUserId(userId);

    if (!userInfo) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(userInfo);
  } catch (err) {
    console.error('Error fetching user info:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
