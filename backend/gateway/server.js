const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

const route = (path, target) =>
  app.use(createProxyMiddleware({ pathFilter: path, target, changeOrigin: true }));

route('/api/auth', 'http://localhost:5001');
route('/api/doctors', 'http://localhost:5002');
route('/api/appointments', 'http://localhost:5003');
route('/api/patients', 'http://localhost:5004');
route('/api/prescriptions', 'http://localhost:5004');
route('/api/records', 'http://localhost:5004');
route('/api/ai', 'http://localhost:5004');

app.listen(5000, () => console.log('Gateway running on port 5000'));