const express = require('express');
const router = express.Router();
const pool = require('../db/database'); // PostgreSQL connection pool

// Helper to generate endpoints for a table
const createMasterRoutes = (tableName) => {
  // Get all items
  router.get(`/${tableName}`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT ${tableName} FROM "${tableName}"`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add item
  router.post(`/${tableName}`, async (req, res) => {
    const value = req.body[tableName];
    if (!value) return res.status(400).json({ error: `${tableName} is required` });

    try {
      const result = await pool.query(
        `INSERT INTO "${tableName}" (${tableName}) VALUES ($1) RETURNING *`,
        [value]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete item
  router.delete(`/${tableName}/:value`, async (req, res) => {
    const value = req.params.value;

    try {
      const result = await pool.query(
        `DELETE FROM "${tableName}" WHERE ${tableName} = $1`,
        [value]
      );
      if (result.rowCount === 0) return res.status(404).json({ message: "Not found" });
      res.json({ message: `${value} deleted` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

// Register all 3 master tables
['Design', 'Company', 'Courier'].forEach(createMasterRoutes);

module.exports = router;
