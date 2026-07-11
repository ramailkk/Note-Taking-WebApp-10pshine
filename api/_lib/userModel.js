const getPool = require('./db');

const findUserByUserId = async (userId) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT username, email, joined_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
};

const findUserByUsername = async (username) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT 1 FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT 1 FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

const findUserByUsernameOrEmail = async (usernameOrEmail) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1 OR email = $1',
    [usernameOrEmail]
  );
  return result.rows[0];
};

const createUser = async (username, email, hashedPassword, token) => {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, verification_token)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email`,
    [username, email, hashedPassword, token]
  );
  return result.rows[0];
};

const findUserByVerificationToken = async (token) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM users WHERE verification_token = $1',
    [token]
  );
  return result.rows[0];
};

const markUserAsVerified = async (userId) => {
  const pool = getPool();
  await pool.query(
    `UPDATE users SET is_verified = TRUE, verification_token = NULL
     WHERE id = $1`,
    [userId]
  );
};

const updateLastLogin = async (userId) => {
  const pool = getPool();
  await pool.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );
};

module.exports = {
  findUserByUserId,
  findUserByUsername,
  findUserByEmail,
  findUserByUsernameOrEmail,
  findUserByVerificationToken,
  createUser,
  updateLastLogin,
  markUserAsVerified,
};
