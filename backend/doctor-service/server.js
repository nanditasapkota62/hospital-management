const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/doctors', require('./routes/doctors'));

app.listen(process.env.PORT, () =>
  console.log('Doctor service running on port ' + process.env.PORT)
);