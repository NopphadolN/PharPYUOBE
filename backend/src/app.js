const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const studentRoutes = require('./routes/student.routes');
app.use(cors());
app.use(express.json());
app.use('/api/student', studentRoutes);

const importRoutes = require('./routes/import.routes');
app.use('/api/import', importRoutes);

// routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// admin
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// plo
const ploRoutes = require('./routes/plo.routes');
app.use('/api/plos', ploRoutes);

// map
const mappingRoutes = require('./routes/mapping.routes');
app.use('/api/mapping', mappingRoutes);

// instructor
const instructorRoutes = require('./routes/instructor.routes');
app.use('/api/instructor', instructorRoutes);

// test
app.get('/', (req, res) => {
  res.send('API Running');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});