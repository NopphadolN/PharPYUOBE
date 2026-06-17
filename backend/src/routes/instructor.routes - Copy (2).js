const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth.middleware');
const PDFDocument = require('pdfkit');
require('pdfkit-table'); 

const checkOwner = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId =
      req.body.course_instance_id ||
      req.body.instanceId ||
      req.query.course_instance_id ||
      req.query.instanceId ||
      req.params.id;
    if (!courseId) {
      return res.status(400).json({ error: "course_instance_id required" });
    }
    const result = await pool.query(`
      SELECT owner_id
      FROM course_instances
      WHERE id = $1
    `, [courseId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    const ownerId = result.rows[0].owner_id;

    // ✅ ถ้ายังไม่มี owner → block
    if (!ownerId) {
      return next(); 
    }
    if (ownerId !== userId) {
      return res.status(403).json({
        error: "You are not the owner"
      });
    }
    req.instanceId = courseId;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("owner check error");
  }
};

/* =============================
   GET: Instructors
============================= */
router.get('/users', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name_th
      FROM users
      WHERE role = 'instructor'
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Load users error');
  }
});

/* =============================
   GET: Courses
============================= */
router.get('/courses', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        code_en,
        code_th,
        name_th,
        name_en,
        credits,
        credit_format,
        description
      FROM courses
      ORDER BY code_en
    `);

    return res.json(result.rows);

  } catch (err) {
    console.error(err);
    return res.status(500).send('Load courses error');
  }
});

/* =============================
   GET: Course Instance
============================= */
router.get('/instance', verifyToken, async (req, res) => {
const { course_id, year, semester } = req.query;

try {
const instanceRes = await pool.query(`
  SELECT ci.*, u.id as owner_id, u.name_th as owner_name
  FROM course_instances ci
  LEFT JOIN users u ON ci.owner_id = u.id
  WHERE ci.course_id=$1 AND ci.year=$2 AND ci.semester=$3
`, [course_id, year, semester]);

// ✅ ต้องเช็คก่อน
if (instanceRes.rows.length === 0) {
  return res.json(null);
}

// ✅ ✅ ✅ ประกาศก่อนใช้
const instance = instanceRes.rows[0];
const instanceId = instance.id;

// ✅ instructors
const insRes = await pool.query(`
  SELECT u.id, u.name_th
  FROM course_instructors ci
  JOIN users u ON ci.user_id = u.id
  WHERE ci.course_instance_id=$1
  ORDER BY ci.id ASC
`, [instanceId]);

// ✅ contents
const contentRes = await pool.query(`
  SELECT *
  FROM course_contents
  WHERE course_instance_id=$1
`, [instanceId]);

// ✅ ✅ parse clo_ids
const contents = contentRes.rows.map(c => ({
  ...c,
  clo_ids:
    typeof c.clo_ids === 'string'
      ? JSON.parse(c.clo_ids)
      : (c.clo_ids || [])
}));

// ✅ evaluations
const evalRes = await pool.query(`
      SELECT * FROM course_evaluations
      WHERE course_instance_id=$1
    `, [instanceId]);

const evaluations = evalRes.rows.map(e => ({
  ...e,
  // ✅ parse JSON จริง
  content_ids_lecture:
    typeof e.content_ids_lecture === 'string'
      ? JSON.parse(e.content_ids_lecture)
      : (e.content_ids_lecture || []),
  content_ids_lab:
    typeof e.content_ids_lab === 'string'
      ? JSON.parse(e.content_ids_lab)
      : (e.content_ids_lab || [])
  }));

// ✅ FIX OWNER
const ownerRes = await pool.query(`
  SELECT id, name_th
  FROM users
  WHERE id = $1
`, [instance.owner_id]);
const owner = ownerRes.rows[0] || null;

  // ✅ ✅ ✅ RETURN ต้องอยู่หลังสุด
return res.json({
  ...instance,
  guestTeachers: instance.guest_teachers || [],
  instructors: insRes.rows,
  owner: owner,
  contents,
  evaluations
});

  } catch (err) {
    console.error(err);
    return res.status(500).send('Load error');
  }
});

/* =============================
   POST: Save CLO
============================= */
router.post('/clos', verifyToken, async (req, res) => {
  const { course_instance_id, clos } = req.body;

  try {

    // 🔒 check owner
    const result = await pool.query(`
      SELECT owner_id FROM course_instances
      WHERE id = $1
    `, [course_instance_id]);

    const ownerId = result.rows[0]?.owner_id;

    if (!ownerId || ownerId !== req.user.id) {
      return res.status(403).json({ error: "No permission" });
    }

// ==============================
// ✅ UPSERT CLO
// ==============================

// ✅ 1. ดึง CLO เดิม
const existingRes = await pool.query(
  `SELECT id FROM clos WHERE course_instance_id = $1`,
  [course_instance_id]
);

const existingIds = existingRes.rows.map(r => r.id);

// ✅ 2. แยก id ที่ส่งมา
const sentIds = clos
  .filter(c => c.id && typeof c.id === 'number')
  .map(c => c.id);

// ==============================
// ✅ 3. DELETE เฉพาะที่ user ลบจริง
// ==============================
const idsToDelete = existingIds.filter(id => !sentIds.includes(id));

if (idsToDelete.length > 0) {

  // ✅ ลบ mapping ก่อน (สำคัญ)
  await pool.query(
    `DELETE FROM clo_subplo_mapping WHERE clo_id = ANY($1::int[])`,
    [idsToDelete]
  );

  // ✅ ลบ indicators
  await pool.query(
    `DELETE FROM clo_indicators WHERE clo_id = ANY($1::int[])`,
    [idsToDelete]
  );

  // ✅ ลบ clo
  await pool.query(
    `DELETE FROM clos WHERE id = ANY($1::int[])`,
    [idsToDelete]
  );
}

// ==============================
// ✅ 4. UPDATE + INSERT
// ==============================
for (const c of clos) {

  // ✅ UPDATE
  if (c.id && existingIds.includes(c.id)) {

    await pool.query(`
      UPDATE clos
      SET code = $1,
          description = $2
      WHERE id = $3
    `, [
      c.code,
      c.description,
      c.id
    ]);

    // ✅ indicators → clear แล้ว insert ใหม่ (ง่ายสุด)
    await pool.query(
      `DELETE FROM clo_indicators WHERE clo_id = $1`,
      [c.id]
    );

    for (const ind of (c.indicators || [])) {
      await pool.query(`
        INSERT INTO clo_indicators (clo_id, description, target)
        VALUES ($1,$2,$3)
      `, [
        c.id,
        ind.description,
        ind.target
      ]);
    }

  }

  // ✅ INSERT
  else {

    const insert = await pool.query(`
      INSERT INTO clos (course_instance_id, code, description)
      VALUES ($1,$2,$3)
      RETURNING id
    `, [
      course_instance_id,
      c.code,
      c.description
    ]);

    const newId = insert.rows[0].id;

    // ✅ indicators
    for (const ind of (c.indicators || [])) {
      await pool.query(`
        INSERT INTO clo_indicators (clo_id, description, target)
        VALUES ($1,$2,$3)
      `, [
        newId,
        ind.description,
        ind.target
      ]);
    }

  }

}

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('save clo error');
  }
});

/* =============================
   POST: Save Course Instance
============================= */
router.post('/instance', verifyToken, async (req, res) => {

  const {
    course_id,
    year,
    semester,
    owner_id,
    prerequisite,
    course_type,
    instructors,
    contents,
    evaluations,
    guestTeachers,
    books,
    grading
  } = req.body;

  try {

    const existing = await pool.query(`
      SELECT id FROM course_instances
      WHERE course_id=$1 AND year=$2 AND semester=$3
    `, [course_id, year, semester]);

    let instanceId;

  if (existing.rows.length > 0) {
  instanceId = existing.rows[0].id;

  // ✅ 🔒 check owner

  // ✅ dynamic update
  const fields = [];
  const values = [];
  let idx = 1;

  if (prerequisite !== undefined) {
    fields.push(`prerequisite=$${idx++}`);
    values.push(prerequisite);
  }

  if (course_type !== undefined) {
    fields.push(`course_type=$${idx++}`);
    values.push(course_type);
  }

  const isValid =
  !owner_id ||
  !instructors || 
  (Array.isArray(instructors) &&
    instructors.some(i => i.id === owner_id));
  if (!isValid) {
  return res.status(400).json({
    error: "Owner must be one of instructors"
  });
  }

  if (owner_id !== undefined) {
    fields.push(`owner_id=$${idx++}`);
    values.push(owner_id);
  }

  if (guestTeachers !== undefined) {
    fields.push(`guest_teachers=$${idx++}`);
    values.push(JSON.stringify(guestTeachers || []));
  }

  if (books !== undefined) {
    fields.push(`books=$${idx++}`);
    values.push(JSON.stringify(books || []));
  }

  if (grading !== undefined) {
    fields.push(`grading=$${idx++}`);
    values.push(JSON.stringify(grading || []));
  }

  await pool.query(
    `UPDATE course_instances 
    SET ${fields.join(', ')} WHERE id=$${idx}`,
    [...values, instanceId]
  );
} else {
      const insert = await pool.query(`
        INSERT INTO course_instances        
        (course_id, year, semester, owner_id, prerequisite, course_type, guest_teachers, books, grading)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id

      `, [
        course_id,
        year,
        semester,
        owner_id || null,
        prerequisite,
        course_type,
        JSON.stringify(guestTeachers || []),        
        JSON.stringify(books || []),     
        JSON.stringify(grading || []) 
      ]);

      instanceId = insert.rows[0].id;
    }

    // ✅ instructors
if (instructors !== undefined) {
  await pool.query(
    `DELETE FROM course_instructors WHERE course_instance_id=$1`,
    [instanceId]
  );
  for (const t of (instructors || [])) {
    if (!t.id) continue;
    await pool.query(`
      INSERT INTO course_instructors (course_instance_id, user_id)
      VALUES ($1,$2)
    `, [instanceId, t.id]);
  }
}

// ========================
// ✅ UPSERT contents
// ========================
if (contents !== undefined) {
const existingContentsRes = await pool.query(
  `SELECT id FROM course_contents WHERE course_instance_id=$1`,
  [instanceId]
);

const existingIds = existingContentsRes.rows.map(r => r.id);
const safeContents = contents || [];
const sentIds = safeContents
  .filter(c => c.id && typeof c.id === 'number')
  .map(c => c.id);

// ✅ delete เฉพาะตัวที่ user ลบ
const idsToDelete = existingIds.filter(id => !sentIds.includes(id));

if (idsToDelete.length > 0) {
  await pool.query(
    `DELETE FROM course_contents WHERE id = ANY($1::int[])`,
    [idsToDelete]
  );
}

// ✅ UPDATE + INSERT
for (const c of (contents || [])) {
  let instructorId = null;
  let guestName = null;

  if (typeof c.instructor === 'number') {
    instructorId = c.instructor;
  } else if (typeof c.instructor === 'string') {
    guestName = c.instructor;
  }

  // ✅ UPDATE
  if (c.id && existingIds.includes(c.id)) {

    await pool.query(`
      UPDATE course_contents SET
        type=$1,
        date=$2,
        topic=$3,
        hours=$4,
        instructor_id=$5,
        guest_teacher_name=$6,
        "order"=$7,
        exam_score=$8,
        work_score=$9,
        clo_ids=$10
      WHERE id=$11
    `, [
      c.type,
      c.date || null,
      c.topic || '',
      Number(c.hours || 0),
      instructorId,
      guestName,
      Number(c.order || 0),
      Number(c.examScore || 0),
      Number(c.workScore || 0),
      JSON.stringify(c.cloIds || []),
      c.id
    ]);

  } 
  // ✅ INSERT
  else {

    await pool.query(`
      INSERT INTO course_contents (
        course_instance_id,
        type,
        date,
        topic,
        hours,
        instructor_id,
        guest_teacher_name,
        "order",
        exam_score,
        work_score,
        clo_ids
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      instanceId,
      c.type,
      c.date || null,
      c.topic || '',
      Number(c.hours || 0),
      instructorId,
      guestName,
      Number(c.order || 0),
      Number(c.examScore || 0),
      Number(c.workScore || 0),
      JSON.stringify(c.cloIds || [])
    ]);

  }
}
}
// ========================
// ✅ UPSERT evaluations
// ========================
if (evaluations !== undefined) {
const existingEvalRes = await pool.query(
  `SELECT id FROM course_evaluations WHERE course_instance_id=$1`,
  [instanceId]
);

const existingEvalIds = existingEvalRes.rows.map(r => r.id);
const safeEvaluations = evaluations || [];
const sentEvalIds = safeEvaluations
  .filter(e => e.id && typeof e.id === 'number')
  .map(e => e.id);

// ✅ delete เฉพาะตัวที่ลบ
const evalToDelete = existingEvalIds.filter(id => !sentEvalIds.includes(id));

if (evalToDelete.length > 0) {
  await pool.query(
    `DELETE FROM course_evaluations WHERE id = ANY($1::int[])`,
    [evalToDelete]
  );
}

// ✅ UPDATE + INSERT
for (const e of (evaluations || [])) {

  // ✅ UPDATE
  if (e.id && existingEvalIds.includes(e.id)) {

    await pool.query(`
      UPDATE course_evaluations SET
        name=$1,
        type=$2,
        tool=$3,
        week=$4,
        content_ids_lecture=$5,
        content_ids_lab=$6,
        total=$7
      WHERE id=$8
    `, [
      e.name,
      e.type,
      e.tool,
      e.week,
      JSON.stringify(e.content_ids_lecture || []),
      JSON.stringify(e.content_ids_lab || []),
      e.total,
      e.id
    ]);

  } 
  // ✅ INSERT
  else {

    await pool.query(`
      INSERT INTO course_evaluations (
        course_instance_id,
        name,
        type,
        tool,
        week,
        content_ids_lecture,
        content_ids_lab,
        total
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [
      instanceId,
      e.name,
      e.type,
      e.tool,
      e.week,
      JSON.stringify(e.content_ids_lecture || []),
      JSON.stringify(e.content_ids_lab || []),
      e.total
    ]);

  }
}
}
    return res.json({ ok: true });

  } catch (err) {
    console.error("SAVE ERROR:", err);
    return res.status(500).send('Save error');
  }
});

/* =============================
   POST: Save Books + Grading
============================= */
router.post('/instance/book', verifyToken, checkOwner, async (req, res) => {
  const { course_id, year, semester, books, grading } = req.body;
  try {
    // ✅ หา instance
    const existing = await pool.query(`
      SELECT id FROM course_instances
      WHERE course_id=$1 AND year=$2 AND semester=$3
    `, [course_id, year, semester]);

    if (existing.rows.length === 0) {
      return res.status(400).json({ error: 'Instance not found' });
    }
    const instanceId = existing.rows[0].id;
    
  // ✅ 🔒 check owner

    // ✅ update เฉพาะ books + grading
    await pool.query(`
      UPDATE course_instances
      SET books = $1,
          grading = $2
      WHERE id = $3
    `, [
      JSON.stringify(books || []),
      JSON.stringify(grading || []),
      instanceId
    ]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('BOOK SAVE ERROR:', err);
    return res.status(500).send('Save book error');
  }

});

/* =============================
   GET: Load CLO
============================= */
router.get('/clos', verifyToken, async (req, res) => {
  const { course_instance_id } = req.query;

  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.code,
        c.description,
        COALESCE(
          json_agg(
            json_build_object(
              'description', ci.description,
              'target', ci.target
            )
          ) FILTER (WHERE ci.id IS NOT NULL),
          '[]'
        ) AS indicators
      FROM clos c
      LEFT JOIN clo_indicators ci ON ci.clo_id = c.id
      WHERE c.course_instance_id = $1
      GROUP BY c.id
    `, [course_instance_id]);

    return res.json(result.rows); 

  } catch (err) {
    console.error(err);
    return res.status(500).send('Error loading CLO');
  }
});

/* =============================
   GET: Instructor Dashboard
============================= */
router.get('/dashboard', verifyToken, async (req, res) => {

  try {

    const userId = req.user.id;

    const now = new Date();
    const month = now.getMonth() + 1;

    const year = month >= 6
      ? now.getFullYear()
      : now.getFullYear() - 1;

    // ✅ ดึง course + ชั่วโมงรวม
const result = await pool.query(`
  SELECT 
    ci.id,
    c.code_en,
    c.name_th,
    -- ✅ รวมชั่วโมงเฉพาะที่ user สอน
    SUM(
      CASE 
        WHEN cc.instructor_id = $1 THEN cc.hours 
        ELSE 0 
      END
    ) AS total_hours
  FROM course_instances ci
  JOIN courses c ON ci.course_id = c.id

  LEFT JOIN course_contents cc 
    ON cc.course_instance_id = ci.id
  WHERE ci.year = $2
    -- ✅ เอาเฉพาะวิชาที่ user เกี่ยวข้อง
    AND (
      EXISTS (
        SELECT 1 FROM course_instructors ci2
        WHERE ci2.course_instance_id = ci.id
        AND ci2.user_id = $1
      )
      OR
      EXISTS (
        SELECT 1 FROM course_contents cc2
        WHERE cc2.course_instance_id = ci.id
        AND cc2.instructor_id = $1
      )
    )
  GROUP BY ci.id, c.code_en, c.name_th
  ORDER BY c.code_en
`, [userId, year]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('Dashboard error');
  }
});

// dashboard-by-term
router.get('/dashboard-by-term', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, semester } = req.query;
    if (!year || !semester) {
      return res.json([]);
    }
    const result = await pool.query(`
      SELECT 
        ci.id,
        c.code_en,
        c.name_th
      FROM course_instances ci
      JOIN courses c ON ci.course_id = c.id
      WHERE ci.year = $1
        AND ci.semester = $2
        AND (
          EXISTS (
            SELECT 1 FROM course_instructors ci2
            WHERE ci2.course_instance_id = ci.id
            AND ci2.user_id = $3
          )
          OR
          EXISTS (
            SELECT 1 FROM course_contents cc2
            WHERE cc2.course_instance_id = ci.id
            AND cc2.instructor_id = $3
          )
        )
      ORDER BY c.code_en
    `, [year, semester, userId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

/* =============================
   GET: Current User
============================= */
router.get('/me', verifyToken, async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT id, name_th
      FROM users
      WHERE id = $1
    `, [req.user.id]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send('User error');
  }
});

// ✅ save mapping (VERSION ถูกต้อง)
router.post('/clo-mapping', verifyToken, async (req, res) => {
  const checkCloOwner = async (cloId, userId) => {
  const result = await pool.query(`
    SELECT ci.id
    FROM clos c
    JOIN course_instances ci ON c.course_instance_id = ci.id
    WHERE c.id = $1
  `, [cloId]);
  const instanceId = result.rows[0]?.id;
  if (!instanceId) return false;
  return await checkOwner(instanceId, userId);
};
  const { cloMappings } = req.body;
  try {
    for (let m of cloMappings) {
      const cloId = m.cloId;
      // ✅ ✅ ✅ ลบเฉพาะ CLO นี้ (ไม่ลบทั้ง table)
      await pool.query(
        `DELETE FROM clo_subplo_mapping WHERE clo_id = $1`,
        [cloId]
      );
      // ✅ ✅ ✅ insert ใหม่
      for (let subId of m.subPloIds) {
        await pool.query(
          `INSERT INTO clo_subplo_mapping (clo_id, sub_plo_id)
           VALUES ($1, $2)`,
          [cloId, subId]
        );
      }
    }
    res.json({ message: '✅ mapping saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'save error' });
  }
});

// load mapping
router.get('/clo-mapping', async (req, res) => {
  const { course_instance_id } = req.query;
  try {
    const result = await pool.query(`
      SELECT m.clo_id, m.sub_plo_id
      FROM clo_subplo_mapping m
      JOIN clos c ON m.clo_id = c.id
      WHERE c.course_instance_id = $1
    `, [course_instance_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'load error' });
  }
});

/* =============================
   GET: Students
============================= */
router.get('/students', verifyToken, async (req, res) => {
  const { course_instance_id } = req.query;

  try {
    const result = await pool.query(`
      SELECT id, student_code, name
      FROM students
      WHERE course_instance_id = $1
      ORDER BY student_code
    `, [course_instance_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Load students error');
  }
});


// SAVE CLO scores
router.post('/clo-scores', verifyToken, checkOwner, async (req, res) => {
const { course_instance_id, scores } = req.body;
  try {
    for (const studentId in scores) {
      for (const cloId in scores[studentId]) {
        for (const evalId in scores[studentId][cloId]) {
          const value = scores[studentId][cloId][evalId];
          await pool.query(`
            INSERT INTO clo_scores
            (course_instance_id, student_id, clo_id, evaluation_id, score)
            VALUES ($1,$2,$3,$4,$5)

            ON CONFLICT (course_instance_id, student_id, clo_id, evaluation_id)
            DO UPDATE SET score = EXCLUDED.score
          `, [
            course_instance_id,
            studentId,
            cloId,
            evalId,
            value
          ]);

        }
      }
    }
    res.json({ message: '✅ saved' });
  } catch (err) {
    console.error(err);
    res.status(500).send('save error');
  }
});

// Save course-results
router.post('/save-course-results', verifyToken, checkOwner, async (req, res) => {
  const { results } = req.body;
  try {
  for (const r of results) {
      await pool.query(`
        INSERT INTO course_results
        (course_instance_id, student_id, course_id, year, semester, is_pass)

        VALUES ($1,$2,$3,$4,$5,$6)

        ON CONFLICT (course_instance_id, student_id)
        DO UPDATE SET
          is_pass = EXCLUDED.is_pass,
          year = EXCLUDED.year,
          semester = EXCLUDED.semester
      `, [
        r.course_instance_id,
        r.student_id,
        r.course_id,
        r.year,
        r.semester,
        r.is_pass
      ]);

    }

    res.json({ message: "Course result saved ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }

});

// LOAD CLO Scores
router.get('/clo-scores', async (req, res) => {
  const { course_instance_id } = req.query;
  try {
    const result = await pool.query(`
      SELECT student_id, clo_id, evaluation_id, score
      FROM clo_scores
      WHERE course_instance_id = $1
    `, [course_instance_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('load error');
  }
});

// clo-results
router.get('/clo-results', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        cr.student_id,
        cr.course_id,
        cr.course_instance_id,
        c.code AS clo_code,
        cr.percent,
        cr.is_pass
      FROM clo_results cr
      JOIN clos c ON cr.clo_id = c.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching CLO results');
  }
});

// plo-results
router.post('/plo-result', async (req, res) => {
  try {
    const { year, data } = req.body;
    console.log("PLO SAVE:", year, data);
    // ✅ TODO: insert DB หรือ update
    res.json({ message: "saved" });
  } catch (err) {
    console.error(err);
    res.status(500).send("error save");
  }
});

// save-clo-detail
router.post('/save-clo-results', verifyToken, checkOwner, async (req, res) => {
  const { data } = req.body;
  try {
    for (const r of data) {
      await pool.query(`
        INSERT INTO clo_results
        (course_instance_id, student_id, course_id, clo_id, percent, is_pass)

        VALUES ($1,$2,$3,$4,$5,$6)

        ON CONFLICT (course_instance_id, student_id, clo_id)
        DO UPDATE SET
          percent = EXCLUDED.percent,
          is_pass = EXCLUDED.is_pass
      `, [
        r.course_instance_id,
        r.student_id,
        r.course_id,
        r.clo_id,
        r.percent,
        r.is_pass
      ]);

    }
    res.json({ message: "CLO saved ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

router.get('/course-results', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM course_results
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

/* ================= YLO AVG ================= */
router.get('/ylo-results', async (req, res) => {
  const { student_id } = req.query;
  const result = await pool.query(`
    SELECT yr.student_id, yr.percent, yr.year, y.code
    FROM ylo_results yr
    JOIN ylos y ON yr.ylo_id = y.id
    WHERE ($1::int IS NULL OR yr.student_id = $1)
  `, [student_id || null]);
  res.json(result.rows);
});

// printแผนการสอน
const { generatePlanPDF } = require('../services/pdf/plan');
const { getCourseData } = require('../services/data/courseData');

router.get('/print-plan/:id', async (req, res) => {
  try {
    const data = await getCourseData(req.params.id);
    await generatePlanPDF(data, res);
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

router.get('/print-mko3/:id', async (req, res) => {
  const data = await getCourseData(req.params.id);
  await generateMKO3PDF(data, res);
});

router.get('/print-mko5/:id', async (req, res) => {
  const data = await getCourseData(req.params.id);
  await generateMKO3PDF(data, res);
});

//dashboard-full
router.get('/dashboard-full', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, semester } = req.query;
    if (!year || !semester) {
      return res.json({
        teaching: [],
        responsible: []
      });
    }
    // =========================
    // ✅ 1. วิชาที่ "สอน"
    // =========================
    const teaching = await pool.query(`
      SELECT 
        ci.id AS instance_id,
        ci.course_id,
        c.code_en,
        c.name_th,
        SUM(cc.hours) AS total_hours
      FROM course_instances ci
      JOIN courses c ON ci.course_id = c.id
      JOIN course_contents cc 
        ON cc.course_instance_id = ci.id
      WHERE ci.year = $1
        AND ci.semester = $2
        AND cc.instructor_id = $3
      GROUP BY ci.id, c.code_en, c.name_th
      ORDER BY c.code_en
    `, [year, semester, userId]);

    // =========================
    // ✅ 2. วิชาที่ "รับผิดชอบ" 
    // =========================
const responsible = await pool.query(`
  SELECT 
    ci.id AS instance_id,
    ci.course_id,
    c.code_en,
    c.name_th,
    COUNT(cr.student_id) AS total_students,
    COUNT(CASE WHEN cr.is_pass = true THEN 1 END) AS pass_students
  FROM course_instances ci
  JOIN courses c ON ci.course_id = c.id
  LEFT JOIN course_results cr 
    ON cr.course_instance_id = ci.id
  WHERE ci.year = $1
    AND ci.semester = $2
    -- ✅ ✅ ✅ ใช้ owner จริงเท่านั้น
    AND ci.owner_id = $3
  GROUP BY ci.id, ci.course_id, c.code_en, c.name_th
  ORDER BY c.code_en
`, [year, semester, userId]);

    res.json({
      teaching: teaching.rows,
      responsible: responsible.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('dashboard error');
  }
});

/* =============================
   IMPORT: Clone Instance
============================= */
router.post('/instance/import', verifyToken, async (req, res) => {

  const {
    course_id,
    from_year,
    from_semester,
    to_year,
    to_semester
  } = req.body;

  try {

    // =========================
    // ✅ 1. หา instance ต้นทาง
    // =========================
    const oldRes = await pool.query(`
      SELECT * FROM course_instances
      WHERE course_id=$1 AND year=$2 AND semester=$3
    `, [course_id, from_year, from_semester]);

    if (oldRes.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลต้นทาง' });
    }

    const oldInstance = oldRes.rows[0];
    const oldId = oldInstance.id;

    // =========================
    // ✅ 2. สร้าง instance ใหม่
    // =========================
    let newRes = await pool.query(`
      SELECT * FROM course_instances
      WHERE course_id=$1 AND year=$2 AND semester=$3
    `, [course_id, to_year, to_semester]);

    let newId;

if (newRes.rows.length > 0) {
  newId = newRes.rows[0].id;

      // ✅ clear เดิมก่อน
      await pool.query(`DELETE FROM course_contents WHERE course_instance_id=$1`, [newId]);
      await pool.query(`DELETE FROM course_evaluations WHERE course_instance_id=$1`, [newId]);
      await pool.query(`DELETE FROM course_instructors WHERE course_instance_id=$1`, [newId]);     
await pool.query(`
  DELETE FROM clo_subplo_mapping
  WHERE clo_id IN (
    SELECT id FROM clos WHERE course_instance_id=$1
  )
`, [newId]);
await pool.query(`
  DELETE FROM clos WHERE course_instance_id=$1
`, [newId]);

    } else {
const safeJSON = (data) => {
  if (!data) return [];
  try {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  } catch {
    return [];
  }
};

      const insert = await pool.query(`
        INSERT INTO course_instances
        (course_id, year, semester, owner_id, prerequisite, course_type, guest_teachers, books, grading)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id
      `, [
        course_id,
        to_year,
        to_semester,
        req.user.id,
        oldInstance.prerequisite,
        oldInstance.course_type,
JSON.stringify(safeJSON(oldInstance.guest_teachers)),
JSON.stringify(safeJSON(oldInstance.books)),
JSON.stringify(safeJSON(oldInstance.grading))
      ]);

      newId = insert.rows[0].id;
    }

// =========================
// ✅ COPY INSTRUCTORS (FIX)
// =========================
// ✅ copy instructor ทั้งหมดจาก old
const oldIns = await pool.query(`
  SELECT user_id
  FROM course_instructors
  WHERE course_instance_id = $1
`, [oldId]);

// ✅ clear ก่อน
await pool.query(`
  DELETE FROM course_instructors
  WHERE course_instance_id = $1
`, [newId]);

// ✅ insert ทุกคน (ไม่ skip)
for (const i of oldIns.rows) {
  await pool.query(`
    INSERT INTO course_instructors (course_instance_id, user_id)
    VALUES ($1,$2)
  `, [newId, i.user_id]);
}
// ✅ หา instructor ที่ถูก refer ใน contents
const usedInstructors = await pool.query(`
  SELECT DISTINCT instructor_id
  FROM course_contents
  WHERE course_instance_id = $1
  AND instructor_id IS NOT NULL
`, [newId]);

for (const ins of usedInstructors.rows) {
  const exists = oldIns.rows.find(i => i.user_id === ins.instructor_id);

  if (!exists) {
    await pool.query(`
      INSERT INTO course_instructors (course_instance_id, user_id)
      VALUES ($1,$2)
    `, [newId, ins.instructor_id]);
  }
}
    // =========================
    // ✅ 4. COPY CLO + INDICATOR
    // =========================
    const cloRes = await pool.query(`
      SELECT * FROM clos WHERE course_instance_id=$1
    `, [oldId]);

    const cloMap = {}; // old -> new

    for (const clo of cloRes.rows) {
      const insertClo = await pool.query(`
        INSERT INTO clos (course_instance_id, code, description)
        VALUES ($1,$2,$3)
        RETURNING id
      `, [newId, clo.code, clo.description]);

      const newCloId = insertClo.rows[0].id;
      cloMap[clo.id] = newCloId;

      // ✅ indicators
      const indRes = await pool.query(`
        SELECT * FROM clo_indicators WHERE clo_id=$1
      `, [clo.id]);

      for (const ind of indRes.rows) {
        await pool.query(`
          INSERT INTO clo_indicators (clo_id, description, target)
          VALUES ($1,$2,$3)
        `, [newCloId, ind.description, ind.target]);
      }
    }

    // =========================
    // ✅ 5. COPY CONTENTS
    // =========================
const contentRes = await pool.query(`
  SELECT * FROM course_contents WHERE course_instance_id=$1
`, [oldId]);

const contentMap = {};

for (const c of contentRes.rows) {

  // ✅ parse clo_ids
  let oldCloIds = [];
  try {
    oldCloIds = typeof c.clo_ids === 'string'
      ? JSON.parse(c.clo_ids)
      : (c.clo_ids || []);
  } catch {
    oldCloIds = [];
  }

  const newCloIds = oldCloIds
    .map(id => cloMap[id])
    .filter(Boolean);

  const insert = await pool.query(`
    INSERT INTO course_contents (
      course_instance_id,
      type,
      date,
      topic,
      hours,
      instructor_id,
      guest_teacher_name,
      "order",
      exam_score,
      work_score,
      clo_ids
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING id
  `, [
    newId,
    c.type,
    c.date,
    c.topic,
    c.hours,
    c.instructor_id,
    c.guest_teacher_name,
    c.order,
    c.exam_score,
    c.work_score,
    JSON.stringify(newCloIds)
  ]);

  contentMap[c.id] = insert.rows[0].id;
}

    // =========================
    // ✅ 6. COPY EVALUATIONS
    // =========================

    // =========================
    // ✅ 7. COPY CLO MAPPING
    // =========================
    const mapRes = await pool.query(`
      SELECT * FROM clo_subplo_mapping
      WHERE clo_id IN (
        SELECT id FROM clos WHERE course_instance_id=$1
      )
    `, [oldId]);

    for (const m of mapRes.rows) {
      await pool.query(`
        INSERT INTO clo_subplo_mapping (clo_id, sub_plo_id)
        VALUES ($1,$2)
      `, [cloMap[m.clo_id], m.sub_plo_id]);
    }

    return res.json({ ok: true });

  } catch (err) {
    console.error("IMPORT ERROR:", err);
    return res.status(500).send('Import error');
  }

});

module.exports = router;