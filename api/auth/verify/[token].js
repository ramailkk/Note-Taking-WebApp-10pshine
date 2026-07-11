const userModel = require('../../_lib/userModel');

export default async function handler(req, res) {
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

    // Redirect to the frontend login page after successful verification
    const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;
    return res.redirect(`${appUrl}/login?verified=true`);
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).send('<h2>Something went wrong. Please try again.</h2>');
  }
}
