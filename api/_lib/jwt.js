// utils/jwt.js
const jwt = require('jsonwebtoken');

function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

module.exports = generateToken;
