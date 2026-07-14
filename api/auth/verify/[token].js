const userModel = require('../../_lib/userModel');
const applyCors = require('../../_lib/cors');
const logger = require('../../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  try {
    const user = await userModel.findUserByVerificationToken(token);

    if (!user) {
      return res.status(400).send('<h2>Invalid or expired verification link.</h2>');
    }

    await userModel.markUserAsVerified(user.id);
    logger.info({ userId: user.id }, 'Email verified successfully');

    return res.status(200).send('<h2>Email verified successfully! You can now log in.</h2>');
  } catch (err) {
    logger.error({ err }, 'Email verification error');
    return res.status(500).send('<h2>Something went wrong. Please try again.</h2>');
  }
}
