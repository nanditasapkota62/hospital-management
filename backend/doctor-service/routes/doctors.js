const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// List all doctors (any logged-in user)
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.doctor_id, u.name, u.email, u.phone, d.specialization, d.qualification, d.available_days
       FROM doctors d JOIN users u ON d.user_id = u.user_id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a doctor (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, specialization, qualification, available_days } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, phone || null, 'doctor']
    );
    await pool.query(
      'INSERT INTO doctors (user_id, specialization, qualification, available_days) VALUES (?, ?, ?, ?)',
      [result.insertId, specialization || null, qualification || null, available_days || null]
    );

    res.status(201).json({ message: 'Doctor added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a doctor (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id FROM doctors WHERE doctor_id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    await pool.query('DELETE FROM users WHERE user_id = ?', [rows[0].user_id]);
    res.json({ message: 'Doctor removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Cannot remove doctor (they may have appointments)' });
  }
});

module.exports = router;