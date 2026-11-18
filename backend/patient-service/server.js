const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/patients', require('./routes/patients'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/records', require('./routes/records'));
app.use('/api/ai', require('./routes/ai'));

app.listen(process.env.PORT, () =>
  console.log('Patient service running on port ' + process.env.PORT)
);