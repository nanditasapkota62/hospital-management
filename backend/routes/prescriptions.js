const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Create a prescription (doctor only, for their own appointment)
router.post('/', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { appointment_id, medicines, dosage_instructions, notes } = req.body;
    if (!appointment_id || !medicines) {
      return res.status(400).json({ message: 'Appointment and medicines are required' });
    }

    const [doc] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [req.user.user_id]);
    const doctorId = doc[0].doctor_id;

    const [appt] = await pool.query(
      'SELECT patient_id FROM appointments WHERE appointment_id = ? AND doctor_id = ?',
      [appointment_id, doctorId]
    );
    if (!appt.length) {
      return res.status(404).json({ message: 'Appointment not found for this doctor' });
    }

    await pool.query(
      'INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, medicines, dosage_instructions, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [appointment_id, doctorId, appt[0].patient_id, medicines, dosage_instructions || null, notes || null]
    );

    res.status(201).json({ message: 'Prescription created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List prescriptions (patient sees own, doctor sees ones they wrote, admin sees all)
router.get('/', authenticate, async (req, res) => {
  try {
    let where = '';
    let params = [];

    if (req.user.role === 'patient') {
      const [p] = await pool.query('SELECT patient_id FROM patients WHERE user_id = ?', [req.user.user_id]);
      where = 'WHERE pr.patient_id = ?';
      params = [p[0].patient_id];
    } else if (req.user.role === 'doctor') {
      const [d] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [req.user.user_id]);
      where = 'WHERE pr.doctor_id = ?';
      params = [d[0].doctor_id];
    }

    const [rows] = await pool.query(
      `SELECT pr.prescription_id, pr.appointment_id, pr.medicines, pr.dosage_instructions, pr.notes, pr.created_at,
              pu.name AS patient_name, du.name AS doctor_name
       FROM prescriptions pr
       JOIN patients p ON pr.patient_id = p.patient_id
       JOIN users pu ON p.user_id = pu.user_id
       JOIN doctors d ON pr.doctor_id = d.doctor_id
       JOIN users du ON d.user_id = du.user_id
       ${where}
       ORDER BY pr.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;