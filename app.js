const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection test
const pool = require('./db/database');
pool.connect()
  .then(() => console.log('Connected to PostgreSQL database.'))
  .catch(err => console.error('Error connecting to PostgreSQL:', err));

// Routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const masterRoutes = require('./routes/master'); // if you use master.js

app.use('/api/auth', authRoutes);    // For login/register
app.use('/api/data', dataRoutes);    // For return/report routes
app.use('/api/master', masterRoutes); // For design/company/courier masters

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
