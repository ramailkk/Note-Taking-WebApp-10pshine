const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userModel = require('../_lib/userModel');
const generateToken = require('../_lib/jwt');
const { sendMail } = require('../_lib/mail');
const applyCors = require('../_lib/cors');
const logger = require('../_lib/logger');

// Consolidated router for /api/auth/*.
// Combines what used to be auth/login.js, auth/signup.js, and
// auth/verify/[token].js into a single serverless function so the
// deployment stays under Vercel's Hobby-plan function limit.

async function login(req, res) {
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

    logger.info({ userId: user.id }, 'Login successful');

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function signup(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const token = crypto.randomBytes(32).toString('hex');

    const newUser = await userModel.createUser(username, email, hashedPassword, token);

    // IMPORTANT: set APP_URL in Vercel's env vars (Production AND Preview)
    // to your stable domain. VERCEL_URL is only a fallback — it's the
    // per-deployment URL and changes every deploy.
    const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;
    const verificationUrl = `${appUrl}/api/auth/verify/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      html: `
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <h2 style="color: #333; text-align: center;">Welcome to Note Taker Prototype! </h2>
    <p style="font-size: 16px; color: #555;">
      Thank you for signing up! Please verify your email address to activate your account.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="padding: 12px 24px; background-color: #FFBF00; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Verify Email
      </a>
    </div>
    <p style="font-size: 14px; color: #999;">
      If the button above doesn't work, copy and paste this link into your browser:
    </p>
    <p style="word-break: break-all; font-size: 14px; color: #555;">
      <a href="${verificationUrl}" style="color: #0066cc;">${verificationUrl}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
    <p style="font-size: 12px; color: #999; text-align: center;">
      This email was sent by Note Taker Prototype. If you did not sign up, you can ignore this email.
    </p>
  </div>
`,
    };

    await sendMail(mailOptions);

    logger.info({ userId: newUser.id, email }, 'New user signed up and verification email sent');

    return res.status(201).json({
      message: 'User created, Verify email now',
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
    });
  } catch (error) {
    logger.error({ err: error }, 'Signup error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function verify(req, res, token) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await userModel.findUserByVerificationToken(token);

    if (!user) {
      return res.status(400).send('<h2>Invalid or expired verification link.</h2>');
    }

    await userModel.markUserAsVerified(user.id);
    logger.info({ userId: user.id }, 'Email verified successfully');

    return res.status(200).send('<h2>Email verified successfully! You can now log in.</h2>');
  } catch (err) {
    logger.error({ err }, 'Email verification error');
    return res.status(500).send('<h2>Something went wrong. Please try again.</h2>');
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const rawSlug = req.query.slug;
  const slug = rawSlug == null ? [] : Array.isArray(rawSlug) ? rawSlug : [rawSlug];
  const [first, second] = slug;

  if (first === 'login') return login(req, res);
  if (first === 'signup') return signup(req, res);
  if (first === 'verify' && second) return verify(req, res, second);

  return res.status(404).json({ error: 'Not found' });
}
