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
const sub = await pool.query(`
SELECT
sp.*,

COALESCE(
json_agg(
json_build_object(
'id',k.id,
'code',k.code,
'type',k.type,
'description',k.description
)
)
FILTER (WHERE k.id IS NOT NULL),
'[]'
) AS ksecs

FROM sub_plos sp

LEFT JOIN sub_plo_ksec_mapping sk
ON sk.sub_plo_id = sp.id

LEFT JOIN ksec_master k
ON k.id = sk.ksec_id

WHERE sp.plo_id = $1
GROUP BY sp.id
ORDER BY sp.id

`,[plo.id]);

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
  const {
    id,
    code,
    description,
    sub_plos = [],
    indicators = []
  } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let ploId = id;

    // ==========================
    // CREATE NEW PLO
    // ==========================
    if (!id) {
      const ploResult = await client.query(`
        INSERT INTO plos
        (
          code,
          description
        )
        VALUES ($1,$2)
        RETURNING id
      `, [
        code,
        description
      ]);
      ploId = ploResult.rows[0].id;
    } else {
      await client.query(`
        UPDATE plos
        SET
          code = $1,
          description = $2
        WHERE id = $3
      `, [
        code,
        description,
        id
      ]);
    }

    // ==========================
    // SUB PLO
    // ==========================
    const oldSubs = await client.query(`
      SELECT id
      FROM sub_plos
      WHERE plo_id = $1
    `, [ploId]);
    const oldSubIds = oldSubs.rows.map(r => r.id);
    const newSubIds = [];
    for (const sub of sub_plos) {
      let subPloId;

      // UPDATE
      if (sub.id) {
        await client.query(`
          UPDATE sub_plos
          SET
            code = $1,
            description = $2
          WHERE id = $3
        `, [
          sub.code,
          sub.description,
          sub.id
        ]);
        subPloId = sub.id;

      }
      // INSERT
      else {
        const result = await client.query(`
          INSERT INTO sub_plos
          (
            plo_id,
            code,
            description
          )
          VALUES ($1,$2,$3)
          RETURNING id
        `, [
          ploId,
          sub.code,
          sub.description
        ]);
        subPloId = result.rows[0].id;
      }
      newSubIds.push(subPloId);

      // --------------------
      // KSEC Mapping
      // --------------------
      await client.query(`
        DELETE
        FROM sub_plo_ksec_mapping
        WHERE sub_plo_id = $1
      `, [subPloId]);
      for (const ksecId of (sub.ksecs || [])) {
        await client.query(`
          INSERT INTO
          sub_plo_ksec_mapping
          (
            sub_plo_id,
            ksec_id
          )
          VALUES ($1,$2)
        `, [
          subPloId,
          ksecId
        ]);
      }
    }

    // DELETE SUBPLO ที่ถูกลบออกจากหน้า
    for (const oldId of oldSubIds) {
      if (!newSubIds.includes(oldId)) {
        await client.query(`
          DELETE
          FROM sub_plos
          WHERE id = $1
        `, [oldId]);
      }
    }

    // ==========================
    // INDICATORS
    // ==========================
    const oldIndicators = await client.query(`
      SELECT id
      FROM plo_indicators
      WHERE plo_id = $1
    `, [ploId]);

    const oldIndicatorIds = oldIndicators.rows.map(r => r.id);
    const newIndicatorIds = [];
    for (const ind of indicators) {
      let indicatorId;

      // UPDATE
      if (ind.id) {
        await client.query(`
          UPDATE plo_indicators
          SET
            code = $1,
            description = $2
          WHERE id = $3
        `, [
          ind.code,
          ind.description,
          ind.id
        ]);
        indicatorId = ind.id;
      }
      // INSERT
      else {
        const result = await client.query(`
          INSERT INTO plo_indicators
          (
            plo_id,
            code,
            description
          )
          VALUES ($1,$2,$3)
          RETURNING id
        `, [
          ploId,
          ind.code,
          ind.description
        ]);
        indicatorId = result.rows[0].id;
      }
      newIndicatorIds.push(
        indicatorId
      );
    }

    // DELETE INDICATOR ที่ถูกลบออกจากหน้า
    for (const oldId of oldIndicatorIds) {
      if (!newIndicatorIds.includes(oldId)) {
        await client.query(`
          DELETE
          FROM plo_indicators
          WHERE id = $1
        `, [oldId]);
      }
    }

    await client.query('COMMIT');
    res.json({
      success: true
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({
      message: err.message
    });
  } finally {
    client.release();
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