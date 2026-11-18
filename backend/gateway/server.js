const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

const AUTH = process.env.AUTH_URL || 'http://localhost:5001';
const DOCTOR = process.env.DOCTOR_URL || 'http://localhost:5002';
const APPOINTMENT = process.env.APPOINTMENT_URL || 'http://localhost:5003';
const PATIENT = process.env.PATIENT_URL || 'http://localhost:5004';

const route = (path, target) =>
  app.use(createProxyMiddleware({ pathFilter: path, target, changeOrigin: true }));

route('/api/auth', AUTH);
route('/api/doctors', DOCTOR);
route('/api/appointments', APPOINTMENT);
route('/api/patients', PATIENT);
route('/api/prescriptions', PATIENT);
route('/api/records', PATIENT);
route('/api/ai', PATIENT);

app.listen(5000, () => console.log('Gateway running on port 5000'));