// db/database.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'akash',         // from Render PostgreSQL
  host: 'dpg-d0jj4memcj7s7382sc0g-a.render.com',         // e.g., your-db-name.render.com
  database: 'returnprocessorapp', // database name from Render
  password: 'apBWDLvPq0kax79uXEkbRdiD3WcQGGyq', // your Render PostgreSQL password
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL database.'))
  .catch((err) => console.error('Connection error:', err.stack));

module.exports = pool;
