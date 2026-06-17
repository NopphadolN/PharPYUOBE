const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'obe',
  password: '12345',
  port: 5432,
});

module.exports = pool;