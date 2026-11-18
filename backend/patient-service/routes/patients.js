const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// List all patients (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.patient_id, u.name, u.email, u.phone, p.gender, p.blood_group
       FROM patients p JOIN users u ON p.user_id = u.user_id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a patient and their data (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT user_id FROM patients WHERE patient_id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    await pool.query('DELETE FROM prescriptions WHERE patient_id = ?', [id]);
    await pool.query('DELETE FROM medical_records WHERE patient_id = ?', [id]);
    await pool.query('DELETE FROM appointments WHERE patient_id = ?', [id]);
    await pool.query('DELETE FROM users WHERE user_id = ?', [rows[0].user_id]);
    res.json({ message: 'Patient removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;