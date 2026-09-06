require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabaseAdmin = require('./config/supabaseAdmin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HireIQ Backend is running!' });
});

// Example route using Supabase Admin
app.get('/api/test-db', async (req, res) => {
  try {
    // Just a connection check - change 'users' to whatever table you create later
    const { data, error } = await supabaseAdmin.from('users').select('*').limit(1);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    // If table doesn't exist yet, it will throw an error, which is expected
    res.json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
