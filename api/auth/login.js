const bcrypt = require('bcrypt');
const userModel = require('../_lib/userModel');
const generateToken = require('../_lib/jwt');
const applyCors = require('../_lib/cors');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }

  try {
    const user = await userModel.findUserByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Email not verified.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Wrong Password' });
    }

    await userModel.updateLastLogin(user.id);

    const token = generateToken(user.id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
