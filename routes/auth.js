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

// 🔒 Change Password
router.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2',
      [hashedNew, username]
    );

    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while changing password' });
  }
});

module.exports = router;
