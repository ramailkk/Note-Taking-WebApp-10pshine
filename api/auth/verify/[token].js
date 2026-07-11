const userModel = require('../../_lib/userModel');
const applyCors = require('../../_lib/cors');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  console.log('[verify] incoming token:', token);

  try {
    const user = await userModel.findUserByVerificationToken(token);
    console.log('[verify] matching user:', user ? user.id : null);

    if (!user) {
      // Token not found — either already used (it gets cleared to NULL on
      // success) or invalid/expired. Logged so you can tell "double click"
      // apart from a real bug in Vercel's Function Logs.
      return res.status(400).send('<h2>Invalid or expired verification link.</h2>');
    }

    await userModel.markUserAsVerified(user.id);
    console.log('[verify] marked verified:', user.id);

    // Redirect to the frontend login page after successful verification.
    // IMPORTANT: set APP_URL in Vercel's Environment Variables (Production
    // AND Preview) to your stable domain — VERCEL_URL is only a fallback
    // and points at this specific deployment's unique URL, which changes
    // every deploy.
    const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;
    const redirectUrl = `${appUrl}/login?verified=true`;

    // Use writeHead directly instead of res.redirect() — more predictable
    // across @vercel/node runtime versions.
    res.writeHead(302, { Location: redirectUrl });
    return res.end();
  } catch (error) {
    console.error('[verify] Email verification error:', error);
    return res.status(500).send('<h2>Something went wrong. Please try again.</h2>');
  }
}
