const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth.middleware');

/* =========================
   GET: Courses by term (WITH OWNER)
========================= */
router.get('/courses-by-term', async (req, res) => {
  const { year, semester, userId } = req.query;
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        ci.id,
        c.code_th,
        c.name_th,

        -- ✅ OWNER
        u.id AS owner_id,
        u.name_th AS owner_name_th,

        -- ✅ OPTIONAL: บอกเลยว่า user เป็น owner ไหม
        (ci.owner_id = $3) AS is_owner

      FROM course_instances ci
      JOIN courses c ON ci.course_id = c.id

      -- ✅ JOIN OWNER
      LEFT JOIN users u ON ci.owner_id = u.id

      WHERE ci.year = $1
      AND ci.semester = $2
      AND (
        ci.owner_id = $3
        
        OR
        EXISTS (
          SELECT 1
          FROM course_instructors ci2
          WHERE ci2.course_instance_id = ci.id
          AND ci2.user_id = $3
        )

        OR
        EXISTS (
          SELECT 1
          FROM course_contents cc
          WHERE cc.course_instance_id = ci.id
          AND cc.instructor_id = $3
        )
      )
      ORDER BY c.code_th
    `, [year, semester, userId]);

    // ✅ FORMAT RESPONSE
    const data = result.rows.map(r => ({
      id: r.id,
      code_th: r.code_th,
      name_th: r.name_th,

      owner: r.owner_id
        ? {
            id: r.owner_id,
            name_th: r.owner_name_th
          }
        : null,

      is_owner: r.is_owner   // ✅ เอาไปใช้ตรง ๆ ได้
    }));

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

/* =========================
   GET: Students in course
========================= */
router.get('/course-students', async (req, res) => {
  const { course_instance_id } = req.query;

  try {
    const result = await pool.query(`
      SELECT u.id, u.user_code, u.name_th
      FROM course_students cs
      JOIN users u ON cs.student_id = u.id
      WHERE cs.course_instance_id=$1
    `, [course_instance_id]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

/* =========================
   GET: find student by code
========================= */
router.get('/student-by-code', async (req, res) => {
  const { code } = req.query;

  try {
    const result = await pool.query(`
      SELECT id, user_code, name_th
      FROM users
      WHERE user_code=$1
      AND role='student'
    `, [code]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

/* =========================
   POST: Add students
========================= */
router.post('/course-students', async (req, res) => {

  const { course_instance_id, studentIds } = req.body;

  try {
    for (const id of studentIds) {
      await pool.query(`
        INSERT INTO course_students (course_instance_id, student_id)
        VALUES ($1,$2)
        ON CONFLICT DO NOTHING
      `, [course_instance_id, id]);
    }

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

/* =========================
   DELETE students
========================= */
router.delete('/course-students', async (req, res) => {

  const { course_instance_id, studentIds } = req.body;

  try {

    await pool.query(`
      DELETE FROM course_students
      WHERE course_instance_id=$1
      AND student_id = ANY($2)
    `, [course_instance_id, studentIds]);

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

router.get('/search-student', async (req, res) => {
  const { keyword } = req.query;
  try {
    const result = await pool.query(`
      SELECT id, user_code, name_th
      FROM users
      WHERE role = 'student'
      AND (
        user_code ILIKE $1
        OR name_th ILIKE $1
      )
      LIMIT 10
    `, [`%${keyword}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

router.get('/all', async (req, res) => {
  const data = await pool.query(`
    SELECT id, user_code, name_th
    FROM users
    WHERE role = 'student'
    ORDER BY user_code ASC
  `);
  res.json(data.rows);
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_code, name_th
      FROM users
      WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send('Student error');
  }
});

module.exports = router;
