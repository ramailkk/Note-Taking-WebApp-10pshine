const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

// POST /auth/signup
const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  try {
    const existingUsername = await userModel.findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const existingEmail = await userModel.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.createUser(username, email, hashedPassword);

    res.status(201).json({
      message: 'User created',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  // 1. Basic validation
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }

  // 2. Find user
  const user = await userModel.findUserByUsernameOrEmail(usernameOrEmail);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // 3. Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Wrong Password' });
  }

  await userModel.updateLastLogin(user.id);

  // 4. Login success
  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
};

module.exports = {
  signup,
  login
};
