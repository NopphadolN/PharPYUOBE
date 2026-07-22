const express = require('express');
const router = express.Router();
const pool = require('../db');
const {
  verifyToken
} = require('../middleware/auth.middleware');
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id,
        m.sub_plo_id,
        m.course_id,
        c.code_en,
        c.code_th,
        c.name_th,
        sp.code AS subplo_code,
        p.code AS plo_code
      FROM course_subplo_mapping m
      JOIN courses c
        ON c.id = m.course_id
      JOIN sub_plos sp
        ON sp.id = m.sub_plo_id
      JOIN plos p
        ON p.id = sp.plo_id
      ORDER BY c.code_en
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

router.post('/', verifyToken, async (req, res) => {
  const {
    course_id,
    sub_plo_id
  } = req.body;
  try {
    await pool.query(`
      INSERT INTO
      course_subplo_mapping
      (
        course_id,
        sub_plo_id
      )
      VALUES ($1,$2)
      ON CONFLICT DO NOTHING
    `,
    [
      course_id,
      sub_plo_id
    ]);
    res.json({
      message: 'added'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

router.delete('/', verifyToken, async (req, res) => {
  const {
    course_id,
    sub_plo_id
  } = req.body;
  try {
    await pool.query(`
      DELETE
      FROM course_subplo_mapping
      WHERE
      course_id = $1
      AND sub_plo_id = $2
    `,
    [
      course_id,
      sub_plo_id
    ]);
    res.json({
      message: 'deleted'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

module.exports = router;