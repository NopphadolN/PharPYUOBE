const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT *
      FROM ksec_master
      ORDER BY code
    `);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Load KSEC failed'
    });

  }
});

module.exports = router;