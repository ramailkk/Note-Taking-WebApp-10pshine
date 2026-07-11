const { Pool } = require('pg');

// Supabase provides a connection string — use the "Transaction" pooler (port 6543)
// for serverless environments to avoid connection exhaustion.
// Set DATABASE_URL in your Vercel project environment variables.

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required for Supabase
      max: 1,                              // keep connections low in serverless
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

module.exports = getPool;
