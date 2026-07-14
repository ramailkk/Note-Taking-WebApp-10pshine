const { Pool } = require('pg');

// Reuse the pool across warm serverless invocations. Point DATABASE_URL at
// Supabase's transaction pooler (port 6543), not the direct connection —
// serverless functions open a connection per invocation and will exhaust a
// direct-connection limit fast.
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
  }
  return pool;
}

module.exports = { getPool };
