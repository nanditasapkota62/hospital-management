const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

async function getPatientId(userId) {
  const [r] = await pool.query('SELECT patient_id FROM patients WHERE user_id = ?', [userId]);
  return r.length ? r[0].patient_id : null;
}

async function getDoctorId(userId) {
  const [r] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
  return r.length ? r[0].doctor_id : null;
}

// Book an appointment (patient only)
router.post('/', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;
    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'Doctor, date and time are required' });
    }

    const [doc] = await pool.query('SELECT doctor_id FROM doctors WHERE doctor_id = ?', [doctor_id]);
    if (!doc.length) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const [taken] = await pool.query(
      "SELECT appointment_id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status = 'booked'",
      [doctor_id, appointment_date, appointment_time]
    );
    if (taken.length) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    const patientId = await getPatientId(req.user.user_id);
    await pool.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES (?, ?, ?, ?, ?)',
      [patientId, doctor_id, appointment_date, appointment_time, reason || null]
    );

    res.status(201).json({ message: 'Appointment booked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List appointments (each role sees what it should)
router.get('/', authenticate, async (req, res) => {
  try {
    let where = '';
    let params = [];

    if (req.user.role === 'patient') {
      where = 'WHERE a.patient_id = ?';
      params = [await getPatientId(req.user.user_id)];
    } else if (req.user.role === 'doctor') {
      where = 'WHERE a.doctor_id = ?';
      params = [await getDoctorId(req.user.user_id)];
    }

       const [rows] = await pool.query(
      `SELECT a.appointment_id, a.patient_id, a.appointment_date, a.appointment_time, a.status, a.reason,
              pu.name AS patient_name, du.name AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN users pu ON p.user_id = pu.user_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       JOIN users du ON d.user_id = du.user_id
       ${where}
       ORDER BY a.appointment_date, a.appointment_time`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change status: patient can cancel own, doctor can update own, admin can update any
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Status must be completed or cancelled' });
    }

    const [rows] = await pool.query('SELECT * FROM appointments WHERE appointment_id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    const appt = rows[0];

    if (req.user.role === 'patient') {
      const pid = await getPatientId(req.user.user_id);
      if (appt.patient_id !== pid || status !== 'cancelled') {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'doctor') {
      const did = await getDoctorId(req.user.user_id);
      if (appt.doctor_id !== did) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await pool.query('UPDATE appointments SET status = ? WHERE appointment_id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;