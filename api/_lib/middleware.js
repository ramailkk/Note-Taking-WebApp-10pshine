const jwt = require('jsonwebtoken');

/**
 * Serverless-compatible JWT middleware.
 *
 * Usage in a Vercel API route:
 *   const user = verifyToken(req, res);
 *   if (!user) return; // response already sent
 *
 * Returns the decoded token payload ({ userId, ... }) on success,
 * or null if it already sent a 401/403 response.
 */
function verifyToken(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
    return null;
  }
}

module.exports = verifyToken;
