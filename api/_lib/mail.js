const nodemailer = require('nodemailer');

// Reuse the transporter across warm invocations. Uses EMAIL_USER/EMAIL_PASS
// (an app password, not the account password) to match this project's
// existing Vercel env var naming.
let transporter;
function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw new Error('EMAIL_USER / EMAIL_PASS environment variables are missing.');
  }
  transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: { user, pass },
  });
  return transporter;
}

const sendMail = async (mailOptions) => getTransporter().sendMail(mailOptions);

module.exports = { sendMail };
