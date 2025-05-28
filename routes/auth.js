const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/database'); // PostgreSQL pool
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (username, password)
      VALUES ($1, $2)
      RETURNING id, username
    `;

    const result = await pool.query(insertQuery, [username, hashed]);
    const user = result.rows[0];

    res.json(user);

  } catch (err) {
    if (err.code === '23505') {
      // PostgreSQL unique_violation error code
      return res.status(500).json({ error: 'Username already taken' });
    }

    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Include 'access' in the response
    res.json({
      id: user.id,
      username: user.username,
      access: user.access
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
