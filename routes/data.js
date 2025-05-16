const express = require('express');
const router = express.Router();
const pool = require('../db/database'); // PostgreSQL pool

// ----------------------------
// Master Routes (Design, Company, Courier)
// ----------------------------
const createMasterRoutes = (tableName) => {
  // GET All
  router.get(`/${tableName}`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT ${tableName} FROM "${tableName}"`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST
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

  // DELETE
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

['Design', 'Company', 'Courier'].forEach(createMasterRoutes);

// ----------------------------
// ReturnMaster routes
// ----------------------------

// Insert
router.post('/return-master', async (req, res) => {
  const { user_id, company, courier, date, no_return } = req.body;
  if (!user_id || !company || !courier || !date || no_return === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO "ReturnMaster" (user_id, company, courier, date, no_return)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, company, courier, date, no_return]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All
router.get('/return-master', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "ReturnMaster"`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Grouped Report
router.get('/report/return-master', async (req, res) => {
  const { company, courier, date } = req.query;
  let sql = `
    SELECT company, courier, DATE(date) as date, SUM(no_return) AS no_return
    FROM "ReturnMaster"
    WHERE 1=1
  `;
  const params = [];
  let index = 1;

  if (company) {
    sql += ` AND company = $${index++}`;
    params.push(company);
  }
  if (courier) {
    sql += ` AND courier = $${index++}`;
    params.push(courier);
  }
  if (date) {
    sql += ` AND DATE(date) = $${index++}`;
    params.push(date);
  }

  sql += ` GROUP BY company, courier, DATE(date)`;

  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------
// ReturnDetailedEntry routes
// ----------------------------

// Insert
router.post('/return-detailed-entry', async (req, res) => {
  const { user_id, company, courier, date, design, quantity } = req.body;
  if (!user_id || !company || !courier || !date || !design || quantity === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO "ReturnDetailedEntry" (user_id, company, courier, date, design, quantity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, company, courier, date, design, quantity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All
router.get('/return-detailed-entry', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "ReturnDetailedEntry"`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Grouped Report
router.get('/report/return-detailed-entry', async (req, res) => {
  const { company, courier, date } = req.query;
  let sql = `
    SELECT company, courier, DATE(date) as date, design, SUM(quantity) AS quantity
    FROM "ReturnDetailedEntry"
    WHERE 1=1
  `;
  const params = [];
  let index = 1;

  if (company) {
    sql += ` AND company = $${index++}`;
    params.push(company);
  }
  if (courier) {
    sql += ` AND courier = $${index++}`;
    params.push(courier);
  }
  if (date) {
    sql += ` AND DATE(date) = $${index++}`;
    params.push(date);
  }

  sql += ` GROUP BY company, courier, DATE(date), design`;

  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
