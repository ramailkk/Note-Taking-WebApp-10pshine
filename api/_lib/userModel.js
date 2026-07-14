const { getPool } = require('./db');

const findUserByUserId = async (userId) => {
  const { rows } = await getPool().query(
    'SELECT username, email, joined_at, profile_picture FROM users WHERE id = $1',
    [userId]
  );
  return rows[0];
};

const findUserByUsername = async (username) => {
  const { rows } = await getPool().query(
    'SELECT 1 AS found FROM users WHERE username = $1',
    [username]
  );
  return rows[0];
};

const findUserByEmail = async (email) => {
  const { rows } = await getPool().query(
    'SELECT 1 AS found FROM users WHERE email = $1',
    [email]
  );
  return rows[0];
};

const findUserByUsernameOrEmail = async (usernameOrEmail) => {
  const { rows } = await getPool().query(
    'SELECT * FROM users WHERE username = $1 OR email = $1',
    [usernameOrEmail]
  );
  return rows[0];
};

const createUser = async (username, email, hashedPassword, token) => {
  const { rows } = await getPool().query(
    `INSERT INTO users (username, email, password_hash, verification_token)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email`,
    [username, email, hashedPassword, token]
  );
  return rows[0];
};

const findUserByVerificationToken = async (token) => {
  const { rows } = await getPool().query(
    'SELECT * FROM users WHERE verification_token = $1',
    [token]
  );
  return rows[0];
};

const markUserAsVerified = async (userId) => {
  await getPool().query(
    'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1',
    [userId]
  );
};

const updateLastLogin = async (userId) => {
  await getPool().query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [userId]
  );
};

const saveGraphMetadata = async (userId, graphData) => {
  const graphJson = JSON.stringify(graphData);
  await getPool().query(
    'UPDATE users SET graph_meta_data = $1 WHERE id = $2',
    [graphJson, userId]
  );
};

const getGraphMetadata = async (userId) => {
  const { rows } = await getPool().query(
    'SELECT graph_meta_data FROM users WHERE id = $1',
    [userId]
  );
  const metadata = rows[0]?.graph_meta_data;
  return metadata ? JSON.parse(metadata) : null;
};

const clearGraphMetadata = async (userId) => {
  await getPool().query(
    'UPDATE users SET graph_meta_data = NULL WHERE id = $1',
    [userId]
  );
};

const getUserPasswordHash = async (userId) => {
  const { rows } = await getPool().query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );
  return rows[0]?.password_hash;
};

const updateUsername = async (userId, username) => {
  await getPool().query(
    'UPDATE users SET username = $1 WHERE id = $2',
    [username, userId]
  );
};

const updateEmail = async (userId, email) => {
  await getPool().query(
    'UPDATE users SET email = $1 WHERE id = $2',
    [email, userId]
  );
};

const updatePassword = async (userId, hashedPassword) => {
  await getPool().query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [hashedPassword, userId]
  );
};

const updateProfilePicture = async (userId, pictureUrl) => {
  await getPool().query(
    'UPDATE users SET profile_picture = $1 WHERE id = $2',
    [pictureUrl, userId]
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
  saveGraphMetadata,
  getGraphMetadata,
  clearGraphMetadata,
  getUserPasswordHash,
  updateUsername,
  updateEmail,
  updatePassword,
  updateProfilePicture,
};
