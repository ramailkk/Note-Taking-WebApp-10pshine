// api/_lib/mail.js
const sendMail = async ({ from, to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is missing.');
  }

  // Resend free tier sends from onboarding@resend.dev by default
  const sender = from || 'onboarding@resend.dev';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: sender,
      to: [to],
      subject: subject,
      html: html
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Resend API failed: ${JSON.stringify(errorData)}`);
  }

  return response.json();
};

module.exports = { sendMail };
