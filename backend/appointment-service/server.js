const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/appointments', require('./routes/appointments'));

app.listen(process.env.PORT, () =>
  console.log('Appointment service running on port ' + process.env.PORT)
);