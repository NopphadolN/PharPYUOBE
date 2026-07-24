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
        m.plo_indicator_id,
        m.sub_plo_id,
        pi.code AS indicator_code,
        sp.code AS subplo_code,
        p.code AS plo_code
      FROM plo_indicator_subplo_mapping m
      JOIN plo_indicators pi
        ON pi.id = m.plo_indicator_id
      JOIN sub_plos sp
        ON sp.id = m.sub_plo_id
      JOIN plos p
        ON p.id = pi.plo_id
      ORDER BY pi.code
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

router.post('/', verifyToken, async (req, res) => {
  const {
    plo_indicator_id,
    sub_plo_id
  } = req.body;
  try {
    await pool.query(`
      INSERT INTO
      plo_indicator_subplo_mapping
      (
        plo_indicator_id,
        sub_plo_id
      )
      VALUES ($1,$2)
      ON CONFLICT DO NOTHING
    `,
    [
      plo_indicator_id,
      sub_plo_id
    ]);
    res.json({
      success: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

router.delete('/', verifyToken, async (req, res) => {
  const {
    plo_indicator_id,
    sub_plo_id
  } = req.body;
  try {
    await pool.query(`
      DELETE
      FROM plo_indicator_subplo_mapping
      WHERE
      plo_indicator_id = $1
      AND sub_plo_id = $2
    `,
    [
      plo_indicator_id,
      sub_plo_id
    ]);
    res.json({
      success: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

module.exports = router;