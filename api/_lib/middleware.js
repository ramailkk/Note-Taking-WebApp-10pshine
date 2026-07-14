const jwt = require('jsonwebtoken');
const logger = require('./logger');

// Plain-function version of the old Express verifyToken middleware.
// No next() — returns the decoded user on success, or writes the error
// response itself and returns null/undefined on failure. Callers must
// check the return value and `return` immediately if it's falsy.
function verifyToken(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn({ path: req.url, method: req.method }, 'Access denied. No token provided.');
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info({ userId: decoded.userId, path: req.url, method: req.method }, 'Token verified successfully');
    return decoded;
  } catch (err) {
    logger.error({ path: req.url, method: req.method, error: err.message }, 'Invalid or expired token.');
    res.status(403).json({ error: 'Invalid or expired token.' });
    return null;
  }
}

module.exports = verifyToken;
