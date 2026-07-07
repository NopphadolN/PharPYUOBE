const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth.middleware');
const PDFDocument = require('pdfkit');
require('pdfkit-table'); 
const controller = require('../controllers/instructor.controller');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = multer.diskStorage({
  destination: 'uploads/',   // ✅ สร้างโฟลเดอร์นี้
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const checkOwner = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const instanceId =
      req.body?.course_instance_id ||    
      req.body.results?.[0]?.course_instance_id ||
      req.body.data?.[0]?.course_instance_id ||
      req.body.instanceId ||
      req.query?.course_instance_id ||
      req.query.instanceId ||
      req.params?.id;
    if (!instanceId) {
      return res.status(400).json({ error: "course_instance_id required" });
    }
    const result = await pool.query(`
      SELECT owner_id
      FROM course_instances
      WHERE id = $1
    `, [instanceId]);
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
        next();
  } catch (err) {
    console.error(err);
    res.status(500).send("owner check error");
  }
};

/* =============================
   GET: Instructors
============================= */
router.get('/users', verifyToken, controller.getUsers);

/* =============================
   GET: Courses
============================= */
router.get('/courses', verifyToken, controller.getCourses); 

/* =============================
   GET: Current User
============================= */
router.get('/me', verifyToken, controller.getMe);

/* =============================
   GET: Students
============================= */
router.get('/students', verifyToken, controller.getStudents);

/* =============================
   GET: Instructor Dashboard
============================= */
router.get('/dashboard', verifyToken, controller.getDashboard);

// dashboard-by-term
router.get('/dashboard-by-term', verifyToken, controller.getDashboardByTerm);

//dashboard-full
router.get('/dashboard-full', verifyToken, controller.getDashboardFull);

/* =============================
   CLO
============================= */
router.post('/clos', verifyToken, controller.saveClos);
router.get('/clos', verifyToken, controller.getClos);

/* =============================
   GET: Course Instance
============================= */
router.get('/instance', verifyToken, controller.getInstance);

/* =============================
   POST: Save Course Instance
============================= */
router.post('/instance', verifyToken, controller.saveInstance);
router.post('/instance/instructors', verifyToken, checkOwner, controller.saveInstructors);
router.get('/instance/instructors', verifyToken, controller.getInstructors);
router.post('/instance/contents', verifyToken, checkOwner, controller.saveContents);

// ========================
// evaluations
// ========================
router.post('/evaluations', verifyToken, checkOwner, controller.saveEvaluations);
router.get('/evaluations', verifyToken, controller.getEvaluations);

// GET profile //
router.get('/profile', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query(`
    SELECT * FROM instructor_profiles
    WHERE user_id = $1
  `, [userId]);
  res.json(result.rows[0] || null);
});
// POST save/update profile //
router.post('/profile', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { office, email, consultation_day, consultation_time } = req.body;
  await pool.query(`
    INSERT INTO instructor_profiles 
    (user_id, office, email, consultation_day, consultation_time)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id)
    DO UPDATE SET
      office = EXCLUDED.office,
      email = EXCLUDED.email,
      consultation_day = EXCLUDED.consultation_day,
      consultation_time = EXCLUDED.consultation_time,
      updated_at = CURRENT_TIMESTAMP
  `, [userId, office, email, consultation_day, consultation_time]);
  res.json({ success: true });
});

/* =============================
   POST: Save Books + Grading + PDF
============================= */
router.post(
  '/instance/book',
  verifyToken,
  checkOwner, // ✅ เพิ่มตรงนี้
  async (req, res) => {
    const {
      course_instance_id,
      books,
      grading,
      note,
      revision_note
    } = req.body;
    try {
      if (!course_instance_id) {
        return res.status(400).json({ error: 'course_instance_id required' });
      }
      // ✅ path ไฟล์ (ถ้ามี)
      await pool.query(`
        UPDATE course_instances
        SET books = $1,
            grading = $2,
            note = $3,
            revision_note = $4
        WHERE id = $5
      `, [
        JSON.stringify(books || []),
        JSON.stringify(grading || []),
        note || '',
        revision_note || '',
        course_instance_id
      ]);
      return res.json({ ok: true });
    } catch (err) {
      console.error('BOOK SAVE ERROR:', err);
      return res.status(500).send('Save book error');
    }
});

// ✅ save mapping (VERSION ถูกต้อง)
router.post('/clo-mapping', verifyToken, checkOwner, async (req, res) => {
  const { course_instance_id, cloMappings } = req.body;
  if (!course_instance_id) {
    return res.status(400).json({ error: 'course_instance_id required' });
  }
  try {
    for (const m of cloMappings) {
      const cloId = m.cloId;
      // ✅ validate clo belongs to instance
      const cloCheck = await pool.query(`
        SELECT id
        FROM clos
        WHERE id = $1 AND course_instance_id = $2
      `, [cloId, course_instance_id]);
      if (cloCheck.rows.length === 0) {
        return res.status(400).json({ error: 'invalid clo id' });
      }
      // ✅ delete old
      await pool.query(`
        DELETE FROM clo_subplo_mapping
        WHERE clo_id = $1
      `, [cloId]);
      // ✅ insert new
      for (const subId of m.subPloIds) {
        await pool.query(`
          INSERT INTO clo_subplo_mapping (clo_id, sub_plo_id)
          VALUES ($1, $2)
        `, [cloId, subId]);
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

// SAVE CLO scores //
router.post('/clo-scores', verifyToken, checkOwner, controller.saveCloScores);
router.get('/clo-scores', controller.getCloScores);

// Save course-results
router.post('/save-course-results', verifyToken, checkOwner, async (req, res) => {
  const { results } = req.body;
  try {
    const values = [];
    const params = [];
    let idx = 1;
    for (const r of results) {
      values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(
        Number(r.course_instance_id),
        Number(r.student_id),
        Number(r.course_id),
        r.year,
        r.semester,
        !!r.is_pass
      );
    }
    if (values.length === 0) {
    console.log("⚠️ NO COURSE RESULT TO SAVE");
    return res.json({
    message: "No course result"
    });
    }
    await pool.query(`
      INSERT INTO course_results
      (course_instance_id, student_id, course_id, year, semester, is_pass)
      VALUES ${values.join(', ')}
      ON CONFLICT (course_instance_id, student_id)
      DO UPDATE SET
        is_pass = EXCLUDED.is_pass,
        year = EXCLUDED.year,
        semester = EXCLUDED.semester
    `, params);
    res.json({ message: "Course result saved ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
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
  const client = await pool.connect();
  try {
    if (!data || data.length === 0) {
      return res.json({ message: "no data" });
    }
    await client.query('BEGIN');
    const values = [];
    const params = [];
    let idx = 1;
for (const r of data) {

  if (
    !r.course_instance_id || isNaN(Number(r.course_instance_id)) ||
    !r.student_id || isNaN(Number(r.student_id)) ||
    !r.clo_id || isNaN(Number(r.clo_id))
  ) {
    console.error('INVALID ROW:', r);
    throw new Error('invalid data row');
  }

  const percent = Number(r.percent || 0);

  if (isNaN(percent)) {
    console.error('INVALID PERCENT:', r);
    throw new Error('invalid percent');
  }

  values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);

  params.push(
    Number(r.course_instance_id),
    Number(r.student_id),
    Number(r.course_id),
    Number(r.clo_id),
    percent,
    !!r.is_pass
  );
}
    await client.query(`
      INSERT INTO clo_results
      (course_instance_id, student_id, course_id, clo_id, percent, is_pass)
      VALUES ${values.join(', ')}
      ON CONFLICT (course_instance_id, student_id, clo_id)
      DO UPDATE SET
        percent = EXCLUDED.percent,
        is_pass = EXCLUDED.is_pass
    `, params);
    await client.query('COMMIT');
    console.log("✅ RESPONSE SENT");
    return res.json({ ok: true });  
  } catch (err) {
  await client.query('ROLLBACK');

  console.error("🔥 REAL ERROR:", err);
  console.error("🔥 MESSAGE:", err.message);
  console.error("🔥 DETAIL:", err.detail);
  console.error("🔥 STACK:", err.stack);

  res.status(400).json({
    error: 'save failed',
    detail: err.message
  });
}
 finally {
    client.release();
  }
});

// GET course-results //
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

// printแผนการสอน //
const { generatePlanPDF } = require('../services/pdf/plan');
const { generateTQF3 } = require('../services/pdf/tqf3');
const { generateTQF5 } = require('../services/pdf/tqf5');
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

router.get('/print-tqf3/:id', async (req, res) => {
  const data = await getCourseData(req.params.id);
  await generateTQF3(data, res);
});

router.get('/print-tqf5/:id', async (req, res) => {
  const data = await getCourseData(req.params.id);
  await generateTQF5(data, res);
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
        (course_id, year, semester, owner_id, prerequisite, course_type, guest_teachers, books, grading, note, revision_note)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
        JSON.stringify(safeJSON(oldInstance.grading)),
        oldInstance.note || '',
        oldInstance.revision_note || '' 
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
          INSERT INTO clo_indicators (clo_id, description, target, course_instance_id)
          VALUES ($1,$2,$3, $4)
        `, [newCloId, ind.description, ind.target, course_instance_id]);
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
      clo_ids,
      llos
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
    c.llos,
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