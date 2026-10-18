const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const { authenticate } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/records', require('./routes/records'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/ai', require('./routes/ai'));
app.get('/api/health', async (req, res) => {
  const [rows] = await pool.query('SELECT NOW() AS time');
  res.json({ status: 'ok', time: rows[0].time });
});

app.get('/api/me', authenticate, (req, res) => {
  res.json({ message: 'You are logged in', user: req.user });
});

const initDb = require('./initDb');

initDb()
  .then(() =>
    app.listen(process.env.PORT, () =>
      console.log('Server running on port ' + process.env.PORT)
    )
  )
  .catch((err) => {
    console.error('Database setup failed', err);
    process.exit(1);
  });
  ;