const pool = require('../db2');

/**
 * Find a user by username and email
 * Returns user row if found, or undefined if not.
 */
const findUserByUsername = async (username) => {
  const result = await pool.query(
    'SELECT 1 FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT 1 FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

const findUserByUsernameOrEmail = async (usernameOrEmail) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1 OR email = $1',
    [usernameOrEmail]
  );
  return result.rows[0];
};


/**
 * Create a new user.
 * Returns the newly created user row (id and username).
 */
const createUser = async (username, email, hashedPassword) => {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash) 
     VALUES ($1, $2, $3) 
     RETURNING id, username, email`,
    [username, email, hashedPassword]
  );
  return result.rows[0];
};

const updateLastLogin = async (userId) => {
  await pool.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );
};



module.exports = {
  findUserByUsername,
  findUserByEmail,
  findUserByUsernameOrEmail,
  createUser,
  updateLastLogin
};
