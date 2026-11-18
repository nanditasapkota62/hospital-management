const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) =>
      cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase())),
});

async function getPatientId(userId) {
  const [r] = await pool.query('SELECT patient_id FROM patients WHERE user_id = ?', [userId]);
  return r.length ? r[0].patient_id : null;
}

async function getDoctorId(userId) {
  const [r] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
  return r.length ? r[0].doctor_id : null;
}

// Upload a document for a patient (doctor only)
router.post('/', authenticate, authorize('doctor'), upload.single('file'), async (req, res) => {
  try {
    const { patient_id } = req.body;
        console.log('content-type:', req.headers['content-type']);
    console.log('file:', req.file);
    console.log('body:', req.body);
        if (!req.file) {
      return res.status(400).json({ message: 'A valid file (pdf, png, jpg, max 5 MB) is required' });
    }
    if (!patient_id) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'patient_id is required' });
    }

    const doctorId = await getDoctorId(req.user.user_id);
    const [link] = await pool.query(
      'SELECT appointment_id FROM appointments WHERE doctor_id = ? AND patient_id = ? LIMIT 1',
      [doctorId, patient_id]
    );
    if (!link.length) {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ message: 'You have no appointment with this patient' });
    }

    await pool.query(
      'INSERT INTO medical_records (patient_id, doctor_id, file_name, file_path) VALUES (?, ?, ?, ?)',
      [patient_id, doctorId, req.file.originalname, req.file.filename]
    );
    res.status(201).json({ message: 'Document uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List documents (patient sees own, doctor sees ones they uploaded, admin sees all)
router.get('/', authenticate, async (req, res) => {
  try {
    let where = '';
    let params = [];

    if (req.user.role === 'patient') {
      where = 'WHERE r.patient_id = ?';
      params = [await getPatientId(req.user.user_id)];
    } else if (req.user.role === 'doctor') {
      where = 'WHERE r.doctor_id = ?';
      params = [await getDoctorId(req.user.user_id)];
    }

    const [rows] = await pool.query(
      `SELECT r.record_id, r.file_name, r.uploaded_at, pu.name AS patient_name, du.name AS doctor_name
       FROM medical_records r
       JOIN patients p ON r.patient_id = p.patient_id
       JOIN users pu ON p.user_id = pu.user_id
       JOIN doctors d ON r.doctor_id = d.doctor_id
       JOIN users du ON d.user_id = du.user_id
       ${where}
       ORDER BY r.uploaded_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download a document (only the people it belongs to)
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medical_records WHERE record_id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Document not found' });
    }
    const rec = rows[0];

    if (req.user.role === 'patient') {
      if (rec.patient_id !== (await getPatientId(req.user.user_id))) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'doctor') {
      if (rec.doctor_id !== (await getDoctorId(req.user.user_id))) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.download(path.join(uploadDir, rec.file_path), rec.file_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;