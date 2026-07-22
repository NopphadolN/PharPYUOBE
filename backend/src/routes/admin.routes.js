const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth.middleware');


router.get('/subplos', async (req, res) => {
  try {
    const plos = await pool.query(`
      SELECT *
      FROM plos
      ORDER BY id
    `);
    const result = [];
    for (const plo of plos.rows) {
      const subPlos = await pool.query(`
        SELECT *
        FROM sub_plos
        WHERE plo_id = $1
        ORDER BY id
      `, [plo.id]);
      result.push({
        id: plo.id,
        code: plo.code,
        description: plo.description,
        children: subPlos.rows
      });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'load subplo error'
    });
  }
});

router.get('/summary', verifyToken, async (req, res) => {
  const pool = require('../db');

  try {
    // users
    const users = await pool.query(`
      SELECT role, COUNT(*) FROM users GROUP BY role
    `);

    // courses
    const courses = await pool.query(`
      SELECT year, COUNT(*) FROM course_instances GROUP BY year
    `).catch(() => ({ rows: [] }));

    // PLOs
    const plos = await pool.query(`SELECT COUNT(*) FROM plos`)
      .catch(() => ({ rows: [{ count: 0 }] }));

    const subplos = await pool.query(`SELECT COUNT(*) FROM sub_plos`)
      .catch(() => ({ rows: [{ count: 0 }] }));

    const indicators = await pool.query(`SELECT COUNT(*) FROM plo_indicators`)
      .catch(() => ({ rows: [{ count: 0 }] }));

    const mapping = await pool.query(`SELECT COUNT(*) FROM plo_course_mapping`)
      .catch(() => ({ rows: [{ count: 0 }] }));

    // YLOs
    const ylos = await pool.query(`SELECT COUNT(*) FROM ylos`)
      .catch(() => ({ rows: [{ count: 0 }] }));

    const yloIndicators = await pool.query(`SELECT COUNT(*) FROM ylo_indicators`)
      .catch(() => ({ rows: [{ count: 0 }] }));

    res.json({
      users: users.rows,
      courses: courses.rows,
      plos: plos.rows[0].count,
      subplos: subplos.rows[0].count,
      indicators: indicators.rows[0].count,
      mapping: mapping.rows[0].count,
      ylos: ylos.rows[0].count,
      yloIndicators: yloIndicators.rows[0].count
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading dashboard');
  }
});

router.post('/plo-manual', verifyToken, async (req, res) => {
  const { year, data } = req.body;

  try {
    for (const studentId in data) {
      for (const indicatorId in data[studentId]) {

        const isPass = data[studentId][indicatorId];

        await pool.query(`
          INSERT INTO plo_manual_results
          (student_id, indicator_id, is_pass, year)
          VALUES ($1,$2,$3,$4)

          ON CONFLICT (student_id, indicator_id, year)
          DO UPDATE SET is_pass = EXCLUDED.is_pass
        `, [
          studentId,
          indicatorId,
          isPass,
          year
        ]);
      }
    }

    res.json({ message: '✅ saved' });

  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

router.get('/plo-manual', verifyToken, async (req, res) => {
  const { year } = req.query;

  try {
    const result = await pool.query(`
      SELECT student_id, indicator_id, is_pass
      FROM plo_manual_results
      WHERE year = $1
    `, [year]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('load error');
  }
});

router.get('/ylo-results', verifyToken, async (req, res) => {
  const { year } = req.query;
  try {
    const result = await pool.query(`
      SELECT 
        yr.student_id,
        yr.ylo_id,        -- ✅ สำคัญมาก
        yr.percent,
        yr.year,
        y.code
      FROM ylo_results yr
      JOIN ylos y ON yr.ylo_id = y.id

      WHERE ($1::int IS NULL OR yr.year = $1)
    `, [year || null]);

    res.json(result.rows);

  } catch (err) {
    console.error('GET YLO ERROR:', err);
    res.status(500).send('error');
  }
});

router.post('/ylo-results', async (req, res) => {
  const { year, data, rawData } = req.body;

  try {

    /* ✅ 1. save raw input */
    for (const studentId in rawData) {
      for (const indicatorId in rawData[studentId]) {

        const val = rawData[studentId][indicatorId];

        await pool.query(`
          INSERT INTO ylo_indicator_results
          (student_id, indicator_id, value, year)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (student_id, indicator_id, year)
          DO UPDATE SET value = EXCLUDED.value
        `, [studentId, indicatorId, val, year]);
      }
    }

    /* ✅ 2. save percent */
    for (const studentId in data) {
      for (const yloId in data[studentId]) {

        const percent = data[studentId][yloId];

        await pool.query(`
          INSERT INTO ylo_results
          (student_id, ylo_id, percent, year)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (student_id, ylo_id, year)
          DO UPDATE SET percent = EXCLUDED.percent
        `, [studentId, yloId, percent, year]);
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get('/ylo-indicator-results', async (req, res) => {
  const { year } = req.query;

  const result = await pool.query(`
    SELECT student_id, indicator_id, value
    FROM ylo_indicator_results
    WHERE year = $1
  `, [year]);

  res.json(result.rows);
});

router.get('/ylos', async (req, res) => {
  const { year } = req.query;
  try {
    const ylos = await pool.query(`
      SELECT * FROM ylos
      WHERE ($1::int IS NULL OR year = $1)
      ORDER BY id
    `, [year || null]);
    const indicators = await pool.query(`
      SELECT * FROM ylo_indicators
    `);
    const result = ylos.rows.map(y => ({
      ...y,
      indicators: indicators.rows.filter(
        i => i.ylo_id === y.id
      )
    }));
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/ylos', async (req, res) => {
  const { year, ylos } = req.body;
  try {
    // ✅ ลบของเก่าก่อน (กันซ้ำ)
    await pool.query(`
      DELETE FROM ylo_indicators
      WHERE ylo_id IN (
        SELECT id FROM ylos WHERE year = $1
      )
    `, [year]);
    await pool.query(`
      DELETE FROM ylos WHERE year = $1
    `, [year]);
    // ✅ insert ใหม่
    for (const y of ylos) {
      if (!y.code || y.code.trim() === '') continue;
      const yRes = await pool.query(`
        INSERT INTO ylos (year, code, description)
        VALUES ($1,$2,$3)
        RETURNING id
      `, [year, y.code, y.description]);
      const yloId = yRes.rows[0].id;
      for (const ind of y.indicators || []) {
        await pool.query(`
          INSERT INTO ylo_indicators
          (ylo_id, description, target, type)
          VALUES ($1,$2,$3,$4)
        `, [
          yloId,
          ind.description,
          ind.target,
          ind.type
        ]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// search user
router.get('/users', async (req, res) => {
  try {
    const { username } = req.query;
    const result = await pool.query(`
      SELECT id, username
      FROM users
      WHERE username ILIKE $1
      ORDER BY username
    `, [`%${username}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'search error' });
  }
});

// delete user
router.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`
      DELETE FROM users WHERE id = $1
    `, [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'delete error' });
  }
});

// SAVE ALL RESULTS
router.post('/save-all-results', async (req, res) => {
  const { year } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');  // 🔥 START TRANSACTION

    /* ================= 1. LOAD CLO ================= */
    const cloRes = await client.query(`
    SELECT DISTINCT ON (student_id, course_id, clo_code)
      student_id,
      course_id,
      clo_code,
      percent
    FROM clo_results
    ORDER BY student_id, course_id, clo_code, year DESC
    `);
    const cloData = cloRes.rows;

    /* ================= 2. LOAD MAPPING ================= */
    const mapRes = await client.query(`
      SELECT * FROM clo_plo_mapping
    `);
    const mappings = mapRes.rows;

    /* ================= 3. LOAD PLO ================= */
    const ploRes = await client.query(`
      SELECT * FROM plos
    `);
    const plos = ploRes.rows;

    /* ================= 4. CALCULATE PLO ================= */
    const ploResults = {};
    cloData.forEach(r => {
      const maps = mappings.filter(m =>
        String(m.clo_code) === String(r.clo_code)
      );
      maps.forEach(m => {
        if (!ploResults[r.student_id]) {
          ploResults[r.student_id] = {};
        }
        if (!ploResults[r.student_id][m.plo_id]) {
          ploResults[r.student_id][m.plo_id] = [];
        }
        ploResults[r.student_id][m.plo_id].push(r.percent);
      });
    });

    /* ================= 5. SAVE PLO ================= */
    for (const studentId in ploResults) {
      for (const ploId in ploResults[studentId]) {
        const arr = ploResults[studentId][ploId];
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        await client.query(`
          INSERT INTO plo_results
          (student_id, plo_id, percent, year)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (student_id, plo_id, year)
          DO UPDATE SET percent = EXCLUDED.percent
        `, [studentId, ploId, avg, year]);
      }
    }

    /* ================= 6. LOAD YLO ================= */
    const yloRes = await client.query(`
      SELECT * FROM ylos WHERE year = $1
    `, [year]);
    const ylos = yloRes.rows;
    const indicatorRes = await client.query(`
      SELECT * FROM ylo_indicators
    `);
    const indicators = indicatorRes.rows;
    const inputRes = await client.query(`
      SELECT * FROM ylo_indicator_results
      WHERE year = $1
    `, [year]);
    const inputData = inputRes.rows;

    /* ================= 7. CALCULATE YLO ================= */
    const yloResults = {};
    ylos.forEach(ylo => {
      const inds = indicators.filter(i => i.ylo_id === ylo.id);
      Object.values(
        inputData.reduce((acc, r) => {
          acc[r.student_id] = true;
          return acc;
        }, {})
      );
      const studentIds = [...new Set(inputData.map(r => r.student_id))];
      studentIds.forEach(studentId => {
        const vals = inds.map(ind => {
          const val = inputData.find(r =>
            r.student_id == studentId &&
            r.indicator_id == ind.id
          )?.value;
          if (ind.type === 'boolean') {
            return val ? 100 : 0;
          }
          if (ind.type === 'number') {
            return Number(val) >= Number(ind.target) ? 100 : 0;
          }
          if (ind.type === 'percent') {
            return Number(val || 0);
          }
          return 0;
        });
        const avg = vals.length
          ? vals.reduce((a,b)=>a+b,0)/vals.length
          : 0;
        if (!yloResults[studentId]) {
          yloResults[studentId] = {};
        }
        yloResults[studentId][ylo.id] = avg;
      });
    });

    /* ================= 8. SAVE YLO ================= */
    for (const studentId in yloResults) {
      for (const yloId in yloResults[studentId]) {
        await client.query(`
          INSERT INTO ylo_results
          (student_id, ylo_id, percent, year)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (student_id, ylo_id, year)
          DO UPDATE SET percent = EXCLUDED.percent
        `, [
          studentId,
          yloId,
          yloResults[studentId][yloId],
          year
        ]);
      }
    }

    /* ✅ END */
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');  // 🔥 rollback
    console.error(err);
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

module.exports = router;