// utils/jwt.js
const jwt = require('jsonwebtoken');

function generateToken(userId, TOKEN_TYPE, EXPIRE_TIME) {
  return jwt.sign(
    { userId },
    TOKEN_TYPE,
    { expiresIn: EXPIRE_TIME }
  );
}

module.exports = generateToken;
