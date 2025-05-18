const express = require('express');
const router = express.Router();
const pool = require('../db/database');

// ----------------------------
// Master Routes (Design, Company, Courier)
// ----------------------------
const createMasterRoutes = (tableName) => {
  const table = tableName.toLowerCase();

  // GET All
  router.get(`/${table}`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT ${table} FROM ${table}`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST
  router.post(`/${table}`, async (req, res) => {
    const value = req.body[table];
    if (!value) return res.status(400).json({ error: `${table} is required` });

    try {
      const result = await pool.query(
        `INSERT INTO ${table} (${table}) VALUES ($1) RETURNING *`,
        [value]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete(`/${table}/:value`, async (req, res) => {
    const value = req.params.value;
    try {
      const result = await pool.query(
        `DELETE FROM ${table} WHERE ${table} = $1`,
        [value]
      );
      if (result.rowCount === 0) return res.status(404).json({ message: "Not found" });
      res.json({ message: `${value} deleted` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

['design', 'company', 'courier'].forEach(createMasterRoutes);

// ----------------------------
// ReturnMaster routes
// ----------------------------

router.post('/return-master', async (req, res) => {
  const { user_id, company, courier, date, no_return } = req.body;
  if (!user_id || !company || !courier || !date || no_return === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO returnmaster (user_id, company, courier, date, no_return)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, company, courier, date, no_return]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/return-master', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM returnmaster`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/report/return-master', async (req, res) => {
  const { company, courier, date } = req.query;
  let sql = `
    SELECT company, courier, DATE(date) as date, SUM(no_return) AS no_return
    FROM returnmaster
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

router.post('/return-detailed-entry', async (req, res) => {
  const { user_id, company, courier, date, design, quantity } = req.body;
  if (!user_id || !company || !courier || !date || !design || quantity === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO returndetailedentry (user_id, company, courier, date, design, quantity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, company, courier, date, design, quantity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/return-detailed-entry', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM returndetailedentry`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/report/return-detailed-entry', async (req, res) => {
  const { company, courier, date } = req.query;
  let sql = `
    SELECT company, courier, DATE(date) as date, design, SUM(quantity) AS quantity
    FROM returndetailedentry
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


router.post('/billing', async (req, res) => {
  try {
    const billingEntries = req.body; // expects array of entries

    if (!Array.isArray(billingEntries)) {
      return res.status(400).json({ error: 'Expected an array of billing entries.' });
    }

    const insertQuery = `
      INSERT INTO billing (user_id, company, portal, date, design, quantity)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const entry of billingEntries) {
      const { user_id, company, portal, date, design, quantity } = entry;

      if (!user_id || !company || !portal || !date || !design || !quantity) {
        return res.status(400).json({ error: 'Missing fields in some billing entries.' });
      }

      await pool.query(insertQuery, [user_id, company, portal, date, design, quantity]);
    }

    res.status(200).json({ message: 'Billing data inserted successfully.' });
  } catch (error) {
    console.error('Error inserting billing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/billing', async (req, res) => {
  const { date, company, portal } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required.' });
  }

  try {
    if (!company) {
      // 1. Get distinct companies billed on the given date (optionally filter by portal)
      const query = portal
        ? `SELECT DISTINCT company FROM billing WHERE date = $1 AND portal = $2`
        : `SELECT DISTINCT company FROM billing WHERE date = $1`;
      const values = portal ? [date, portal] : [date];

      const result = await pool.query(query, values);
      const companies = result.rows.map(row => row.company);
      return res.status(200).json({ companies });
    } else {
      // 2. Get all billing entries for that company on the given date (optionally filter by portal)
      const query = portal
        ? `SELECT * FROM billing WHERE date = $1 AND company = $2 AND portal = $3 ORDER BY design`
        : `SELECT * FROM billing WHERE date = $1 AND company = $2 ORDER BY design`;
      const values = portal ? [date, company, portal] : [date, company];

      const result = await pool.query(query, values);
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching billing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




router.get('/portal', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM portal_master');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST a new portal
router.post('/portal', async (req, res) => {
  const { portal } = req.body;
  try {
    await pool.query('INSERT INTO portal_master (portal) VALUES ($1) ON CONFLICT DO NOTHING', [portal]);
    res.send('Portal added');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});





router.delete('/portal/:portal', async (req, res) => {
  const { portal } = req.params;
  try {
    await pool.query('DELETE FROM portal_master WHERE portal = $1', [portal]);
    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Deletion failed' });
  }
});


// Node/Express route example
router.get("/billing/distinct-companies", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Date is required" });

  const result = await db.query(
    `SELECT DISTINCT company FROM billing WHERE date = $1`,
    [date]
  );
  res.json(result.rows); // Or map to result.rows.map(r => r.company)
});



module.exports = router;
