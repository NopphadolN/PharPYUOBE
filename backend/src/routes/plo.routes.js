const express = require('express');
const router = express.Router();
const pool = require('../db');

const { verifyToken } = require('../middleware/auth.middleware');


// ✅ GET ALL PLOs (with sub_plos + indicators)
router.get('/', verifyToken, async (req, res) => {
  try {
    const plos = await pool.query(`SELECT * FROM plos ORDER BY id`);

    const result = [];

    for (let plo of plos.rows) {

      // ✅ sub PLOs
      const sub = await pool.query(
        `SELECT * FROM sub_plos WHERE plo_id=$1 ORDER BY id`,
        [plo.id]
      );

      // ✅ indicators (อยู่ใต้ PLO)
      const indicators = await pool.query(
        `SELECT * FROM plo_indicators WHERE plo_id=$1 ORDER BY id`,
        [plo.id]
      );

      result.push({
        ...plo,
        sub_plos: sub.rows,
        indicators: indicators.rows
      });
    }

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Load PLO failed' });
  }
});


// ✅ CREATE / UPDATE PLO (รวมทุกอย่างในครั้งเดียว)
router.post('/', verifyToken, async (req, res) => {
  const { id, code, description, sub_plos, indicators } = req.body;

  try {
    let ploId = id;

    // ✅ CREATE
    if (!id) {
      const result = await pool.query(
        `INSERT INTO plos (code, description)
         VALUES ($1,$2)
         RETURNING *`,
        [code, description]
      );

      ploId = result.rows[0].id;

    } else {
      // ✅ UPDATE
      await pool.query(
        `UPDATE plos
         SET code=$1, description=$2
         WHERE id=$3`,
        [code, description, id]
      );

      // ❗ ลบของเก่า (sub + indicators)
      await pool.query(`DELETE FROM sub_plos WHERE plo_id=$1`, [ploId]);
      await pool.query(`DELETE FROM plo_indicators WHERE plo_id=$1`, [ploId]);
    }

    // ✅ insert sub PLOs
    if (sub_plos && sub_plos.length > 0) {
      for (let sub of sub_plos) {
        await pool.query(
          `INSERT INTO sub_plos (plo_id, code, description)
VALUES ($1, $2, $3)`,
          [ploId, sub.code, sub.description]
        );
      }
    }

    // ✅ insert indicators (ใต้ PLO)
    if (indicators && indicators.length > 0) {
      for (let ind of indicators) {
        await pool.query(  
      `INSERT INTO plo_indicators (plo_id, code, description)
       VALUES ($1,$2,$3)`,
      [ploId, ind.code, ind.description]
        );
      }
    }

    res.json({ message: 'PLO saved successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Save failed' });
  }
});


// ✅ DELETE PLO
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query(`DELETE FROM plos WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;