const express = require('express');
const router = express.Router();
const pool = require('../db/database'); // your PostgreSQL connection

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



router.get('/party', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM party ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch parties' });
  }
});

// POST a new party
router.post('/party', async (req, res) => {
  const { party_name, party_address, mobile_number } = req.body;
  if (!party_name || !party_address || !mobile_number) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO party (party_name, party_address, mobile_number) VALUES ($1, $2, $3) RETURNING *',
      [party_name, party_address, mobile_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add party' });
  }
});

// PUT (update) a party
router.put('/party/:id', async (req, res) => {
  const { id } = req.params;
  const { party_name, party_address, mobile_number } = req.body;

  try {
    const result = await pool.query(
      'UPDATE party SET party_name = $1, party_address = $2, mobile_number = $3 WHERE id = $4 RETURNING *',
      [party_name, party_address, mobile_number, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update party' });
  }
});

// DELETE a party
router.delete('/party/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM party WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete party' });
  }
});










router.get('/category', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM category ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new category
router.post('/category', async (req, res) => {
  const { category } = req.body;
  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO category (category) VALUES ($1) RETURNING *',
      [category.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Category already exists' });
    } else {
      console.error('Error adding category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// DELETE category by ID
router.delete('/category/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM category WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





router.get('/item', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM item ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new item
router.post('/item', async (req, res) => {
  const { category, item_name, unit } = req.body;

  if (!category || !item_name || !unit) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO item (category, item_name, unit) VALUES ($1, $2, $3) RETURNING *',
      [category, item_name, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting item:', err);
    res.status(500).json({ error: 'Failed to insert item' });
  }
});

// DELETE item (optional)
router.delete('/item/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM item WHERE id = $1', [id]);
    res.status(200).json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});




router.put('/purchase/data/item/:id', async (req, res) => {
  const { id } = req.params;
  const { category, item_name, unit } = req.body;

  if (!category || !item_name || !unit) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE item
       SET category = $1, item_name = $2, unit = $3
       WHERE id = $4
       RETURNING *`,
      [category, item_name, unit, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Error updating item:', error.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
});




module.exports = router;
