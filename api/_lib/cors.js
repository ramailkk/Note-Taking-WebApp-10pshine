// api/_lib/cors.js
//
// Shared CORS + preflight handling for Vercel serverless functions.
// The old Express backend used the `cors` npm package (app.use(cors(...))).
// Serverless functions each run in isolation, so every handler needs to
// call this at the top before doing anything else.
//
// Usage:
//   const applyCors = require('../_lib/cors'); // adjust relative depth
//   export default async function handler(req, res) {
//     if (applyCors(req, res)) return; // OPTIONS preflight already answered
//     ...
//   }

function applyCors(req, res) {
  // If you only ever serve one frontend origin, set APP_URL in Vercel's
  // env vars and it'll be reflected back here. Falls back to "*" so local
  // dev / previews don't break, but you can lock this down once things work.
  const allowedOrigin = process.env.APP_URL || '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // cache preflight for a day

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // caller should `return` immediately
  }

  return false;
}

module.exports = applyCors;
