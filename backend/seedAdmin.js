const bcrypt = require('bcrypt');
const pool = require('./db');

(async () => {
  const [rows] = await pool.query('SELECT user_id FROM users WHERE email = ?', ['admin@hospital.com']);
  if (rows.length) {
    console.log('Admin already exists');
    process.exit();
  }
  const hash = await bcrypt.hash('Admin@123', 10);
  await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Admin', 'admin@hospital.com', hash, 'admin']
  );
  console.log('Admin created');
  process.exit();
})();