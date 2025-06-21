const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;

// Test the connection
pool.connect()
  .then(client => {
    return client
      .query('SELECT NOW()')
      .then(res => {
        console.log('PostgreSQL connected. Time:', res.rows[0]);
        client.release();
      })
      .catch(err => {
        client.release();
        console.error('Error during connection test:', err.stack);
      });
  })
  .catch(err => {
    console.error('PostgreSQL connection failed:', err.stack);
  });

module.exports = pool;