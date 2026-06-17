const express = require('express');
const router = express.Router();
const pool = require('../db');

const { verifyToken } = require('../middleware/auth.middleware');


// ✅ GET mapping ทั้งหมด
router.get('/', verifyToken, async (req, res) => {
  try {
  const result = await pool.query(`
    SELECT m.id,
         m.plo_indicator_id,
         m.course_id,
         c.code_en,
         c.code_th,
         c.name_th,

         pi.code AS indicator_code,
         p.code AS plo_code

    FROM plo_course_mapping m
    JOIN courses c ON m.course_id = c.id
    JOIN plo_indicators pi ON m.plo_indicator_id = pi.id
    JOIN plos p ON pi.plo_id = p.id
  `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

// ✅ GET courses ทั้งหมด (ใช้ใน popup)
router.get('/courses', verifyToken, async (req, res) => {
  const result = await pool.query(`SELECT id, code_en FROM courses`);
  res.json(result.rows);
});

// ✅ ADD mapping
router.post('/', verifyToken, async (req, res) => {
  const { plo_indicator_id, course_id } = req.body;

  try {
    await pool.query(`
      INSERT INTO plo_course_mapping (plo_indicator_id, course_id)
      VALUES ($1,$2)
      ON CONFLICT DO NOTHING
    `, [plo_indicator_id, course_id]);

    res.json({ message: 'Added' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error add');
  }
});


// ✅ DELETE mapping
router.delete('/', verifyToken, async (req, res) => {
  const { plo_indicator_id, course_id } = req.body;

  try {
    await pool.query(`
      DELETE FROM plo_course_mapping
      WHERE plo_indicator_id=$1 AND course_id=$2
    `, [plo_indicator_id, course_id]);

    res.json({ message: 'Deleted' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error delete');
  }
});


module.exports = router;