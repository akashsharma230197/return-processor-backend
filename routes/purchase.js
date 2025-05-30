const express = require('express');
const router = express.Router();
const pool = require('../db'); // your PostgreSQL connection

// GET all units
router.get('/Units', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Units ORDER BY unit_name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching units:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new unit
router.post('/Units', async (req, res) => {
  const { unit_name } = req.body;

  if (!unit_name || unit_name.trim() === '') {
    return res.status(400).json({ error: 'unit_name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO Units (unit_name) VALUES ($1) RETURNING *',
      [unit_name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding unit:', err);
    res.status(500).json({ error: 'Could not add unit' });
  }
});

// DELETE unit by id
router.delete('/Units/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Units WHERE id = $1', [id]);
    res.sendStatus(204); // No Content
  } catch (err) {
    console.error('Error deleting unit:', err);
    res.status(500).json({ error: 'Could not delete unit' });
  }
});

module.exports = router;
