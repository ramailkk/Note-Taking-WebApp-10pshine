const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userModel = require('../_lib/userModel');
const generateToken = require('../_lib/jwt');
const transporter = require('../_lib/mail');

export default async function handler(req, res) {
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
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await userModel.createUser(username, email, hashedPassword, verificationToken);

    // Build verification URL — uses APP_URL env var set in Vercel (your deployment domain)
    const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;
    const verificationUrl = `${appUrl}/api/auth/verify/${verificationToken}`;

    const mailOptions = {
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your email',
      html: `
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <h2 style="color: #333; text-align: center;">Welcome to Note Taker Prototype!</h2>
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

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: 'User created. Please verify your email.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
