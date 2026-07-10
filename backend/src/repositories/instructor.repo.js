const pool = require('../db');

exports.getCourses = async () => {
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
  return result.rows;
};

exports.getUsers = async () => {
  const result = await pool.query(`
    SELECT id, name_th
    FROM users
    WHERE role = 'instructor'
  `);
  return result.rows;
};

exports.getMe = async (userId) => {
  const result = await pool.query(`
    SELECT id, name_th, can_edit_all_courses
    FROM users
    WHERE id = $1
  `, [userId]);

  return result.rows[0];
};

exports.getStudents = async (courseInstanceId) => {
  const result = await pool.query(`
    SELECT id, student_code, name
    FROM students
    WHERE course_instance_id = $1
    ORDER BY student_code
  `, [courseInstanceId]);

  return result.rows;
};

exports.getDashboard = async (userId, year) => {
  const result = await pool.query(`
    SELECT 
      ci.id,
      c.code_en,
      c.name_th,
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
  return result.rows;
};

exports.getDashboardByTerm = async (year, semester, userId) => {
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
  return result.rows;
};

exports.getDashboardFull = async (year, semester, userId) => {

  // ✅ teaching
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

  // ✅ responsible
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
      AND ci.owner_id = $3
    GROUP BY ci.id, ci.course_id, c.code_en, c.name_th
    ORDER BY c.code_en
  `, [year, semester, userId]);

  return {
    teaching: teaching.rows,
    responsible: responsible.rows
  };
};

// ================= OWNER =================
exports.getOwner = async (course_instance_id) => {
  const result = await pool.query(`
    SELECT owner_id FROM course_instances
    WHERE id = $1
  `, [course_instance_id]);
  return result.rows[0]?.owner_id;
};

// ================= GET CLO =================
exports.getClos = async (course_instance_id) => {
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
  return result.rows;
};

// ================= UPSERT CLO =================
exports.upsertClos = async (course_instance_id, clos) => {
  // ✅ 1. ดึง CLO เดิม
  const existingRes = await pool.query(
    `SELECT id FROM clos WHERE course_instance_id = $1`,
    [course_instance_id]
  );
  const existingIds = existingRes.rows.map(r => r.id);
  // ✅ 2. id ที่ client ส่งมา
  const sentIds = clos
    .filter(c => c.id && typeof c.id === 'number')
    .map(c => c.id);
  // ✅ 3. delete เฉพาะที่หาย
  const idsToDelete = existingIds.filter(id => !sentIds.includes(id));
  if (idsToDelete.length > 0) {
    await pool.query(
      `DELETE FROM clo_subplo_mapping WHERE clo_id = ANY($1::int[])`,
      [idsToDelete]
    );
    await pool.query(
      `DELETE FROM clo_indicators WHERE clo_id = ANY($1::int[])`,
      [idsToDelete]
    );
    await pool.query(
      `DELETE FROM clos WHERE id = ANY($1::int[])`,
      [idsToDelete]
    );
  }
  // ✅ 4. update + insert
  for (const c of clos) {

    // ===== UPDATE =====
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

      // ✅ clear indicators
      await pool.query(
        `DELETE FROM clo_indicators WHERE clo_id = $1`,
        [c.id]
      );
      for (const ind of (c.indicators || [])) {
        await pool.query(`
          INSERT INTO clo_indicators (clo_id, description, target, course_instance_id)
          VALUES ($1,$2,$3, $4)
        `, [
          c.id,
          ind.description,
          ind.target,
          course_instance_id
        ]);
      }
    }

    // ===== INSERT =====
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
      for (const ind of (c.indicators || [])) {
        await pool.query(`
          INSERT INTO clo_indicators (clo_id, description, target, course_instance_id)
          VALUES ($1,$2,$3, $4)
        `, [
          newId,
          ind.description,
          ind.target,
          course_instance_id
        ]);
      }
    }
  }
};

// ================= GET Evaluations =================
exports.getEvaluations = async (course_instance_id) => {
  const result = await pool.query(`
    SELECT *
    FROM course_evaluations
    WHERE course_instance_id = $1
  `, [course_instance_id]);
  return result.rows.map(e => ({
    ...e,
    clo_ids:
      typeof e.clo_ids === 'string'
        ? JSON.parse(e.clo_ids)
        : (e.clo_ids || []),
    content_ids_lecture:
      typeof e.content_ids_lecture === 'string'
        ? JSON.parse(e.content_ids_lecture)
        : (e.content_ids_lecture || []),
    content_ids_lab:
      typeof e.content_ids_lab === 'string'
        ? JSON.parse(e.content_ids_lab)
        : (e.content_ids_lab || []),
    clo_plan_score_map:
      typeof e.clo_plan_score_map === 'string'
        ? JSON.parse(e.clo_plan_score_map)
        : (e.clo_plan_score_map || {}),        
    clo_actual_score_map:
      typeof e.clo_actual_score_map === 'string'
        ? JSON.parse(e.clo_actual_score_map)
        : (e.clo_actual_score_map || {}),
  }));
};

// ================= UPSERT Evaluations =================
exports.upsertEvaluations = async (course_instance_id, evaluations) => {
  const existingRes = await pool.query(
    `SELECT id FROM course_evaluations WHERE course_instance_id=$1`,
    [course_instance_id]
  );
  const existingIds = existingRes.rows.map(r => r.id);
  const sentIds = evaluations
    .filter(e => e.id && typeof e.id === 'number')
    .map(e => e.id);
  // ✅ DELETE
  const idsToDelete = existingIds.filter(id => !sentIds.includes(id));
  if (idsToDelete.length > 0) {
    await pool.query(
      `DELETE FROM course_evaluations WHERE id = ANY($1::int[])`,
      [idsToDelete]
    );
  }
  // ✅ UPDATE + INSERT
  for (const e of evaluations) {
    if (e.id && existingIds.includes(e.id)) {
      await pool.query(`
        UPDATE course_evaluations SET
          name=$1,
          type=$2,
          tool=$3,
          week=$4,
          content_ids_lecture=$5,
          content_ids_lab=$6,
          clo_ids=$7,         
          clo_plan_score_map=$8,
          clo_actual_score_map=$9,
          total=$10
        WHERE id=$11
      `, [
        e.name,
        e.type,
        e.tool,
        e.week,
        JSON.stringify(e.content_ids_lecture || []),
        JSON.stringify(e.content_ids_lab || []),
        JSON.stringify(e.clo_ids || []),
        JSON.stringify(e.clo_plan_score_map || {}),
        JSON.stringify(e.clo_actual_score_map || {}),
        e.total,
        e.id
      ]);
    } else {
      await pool.query(`
        INSERT INTO course_evaluations (
          course_instance_id,
          name,
          type,
          tool,
          week,
          content_ids_lecture,
          content_ids_lab,
          clo_ids,
          clo_plan_score_map,
          clo_actual_score_map,
          total
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `, [
        course_instance_id,
        e.name,
        e.type,
        e.tool,
        e.week,
        JSON.stringify(e.content_ids_lecture || []),
        JSON.stringify(e.content_ids_lab || []),
        JSON.stringify(e.clo_ids || []),
        JSON.stringify(e.clo_plan_score_map || {}),
        JSON.stringify(e.clo_actual_score_map || {}),
        e.total
      ]);
    }
  }
};

// ================= saveCloScores =================//
exports.saveCloScores = async (course_instance_id, scores) => {
  const values = [];
  const params = [];
  let idx = 1;
  for (const studentId in scores) {
    for (const cloId in scores[studentId]) {      
    if (!cloId || isNaN(Number(cloId))) {
      console.warn('SKIP INVALID CLO:', cloId);
      continue;
    }
      for (const evalId in scores[studentId][cloId]) {     
      if (!evalId || isNaN(Number(evalId))) {
        console.warn('SKIP INVALID EVAL:', evalId);
        continue;
      }  
        values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
        params.push(
          course_instance_id,
          Number(studentId),
          Number(cloId),   
          Number(evalId),
          scores[studentId][cloId][evalId]
        );
      }
    }
  } 
if (values.length === 0) {
  console.log("⚠️ NO CLO SCORE TO SAVE");
  return Promise.resolve();   
}
  await pool.query(`
    INSERT INTO clo_scores
    (course_instance_id, student_id, clo_id, evaluation_id, score)
    VALUES ${values.join(', ')}

    ON CONFLICT (course_instance_id, student_id, clo_id, evaluation_id)
    DO UPDATE SET score = EXCLUDED.score
  `, params);
};
// ================= getCloScores =================//
exports.getCloScores = async (course_instance_id) => {
  const result = await pool.query(`
    SELECT student_id, clo_id, evaluation_id, score
    FROM clo_scores
    WHERE course_instance_id = $1
  `, [course_instance_id]);
  return result.rows;
};

// ================= Instance =================//
exports.upsertInstance = async (data, userId) => {
  const {
    course_id,
    year,
    semester,
    owner_id,
    prerequisite,
    course_type,
    guestTeachers,

  } = data;
  const existing = await pool.query(`
    SELECT id FROM course_instances
    WHERE course_id=$1 AND year=$2 AND semester=$3
  `, [course_id, year, semester]);
  if (existing.rows.length > 0) {
    const instanceId = existing.rows[0].id;
    await pool.query(`
      UPDATE course_instances SET
        owner_id=$1,
        prerequisite=$2,
        course_type=$3,
        guest_teachers=$4
  
      WHERE id=$5
    `, [
      owner_id,
      prerequisite,
      course_type,
      JSON.stringify(guestTeachers || []),

      instanceId
    ]);
    return instanceId;
  } else {
    const insert = await pool.query(`
      INSERT INTO course_instances
      (course_id, year, semester, owner_id, prerequisite, course_type, guest_teachers)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id
    `, [
      course_id,
      year,
      semester,
      owner_id || userId,
      prerequisite,
      course_type,
      JSON.stringify(guestTeachers || [])
    ]);
    return insert.rows[0].id;
  }
};

// ================= GET Instructors =================
exports.getInstructors = async (course_instance_id) => {
  const res = await pool.query(`
    SELECT u.id, u.name_th
    FROM course_instructors ci
    JOIN users u ON ci.user_id = u.id
    WHERE ci.course_instance_id = $1
    ORDER BY ci.id ASC
  `, [course_instance_id]);
  return res.rows;
};

// ================= SAVE Instructors =================
exports.upsertInstructors = async (course_instance_id, instructors) => {
  // ✅ delete ทั้งหมดก่อน
  await pool.query(`
    DELETE FROM course_instructors
    WHERE course_instance_id = $1
  `, [course_instance_id]);
  // ✅ insert ใหม่
  for (const t of (instructors || [])) {
    if (!t.id || isNaN(Number(t.id))) continue;
    await pool.query(`
      INSERT INTO course_instructors (course_instance_id, user_id)
      VALUES ($1,$2)
    `, [
      course_instance_id,
      Number(t.id)
    ]);
  }
};

// ================= SAVE Content =================
exports.upsertContents = async (course_instance_id, contents) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // =========================
    // ✅ 1. โหลดของเดิม
    // =========================
    const existingRes = await client.query(`
      SELECT id FROM course_contents
      WHERE course_instance_id = $1
    `, [course_instance_id]);

    const existingIds = existingRes.rows.map(r => r.id);

    const sentIds = (contents || [])
      .filter(c => c.id)
      .map(c => Number(c.id));

    // =========================
    // ✅ 2. DELETE
    // =========================
    const idsToDelete = existingIds.filter(id => !sentIds.includes(id));

    if (idsToDelete.length > 0) {
      await client.query(
        `DELETE FROM course_contents WHERE id = ANY($1::int[])`,
        [idsToDelete]
      );
    }
    await client.query(`
        UPDATE course_contents
        SET "order" = NULL
        WHERE course_instance_id = $1
      `, [course_instance_id]);

    // =========================
    // ✅ 3. SPLIT UPDATE / INSERT  🔥
    // =========================
    const updateList = (contents || []).filter(c => c.id);
    const insertList = (contents || []).filter(c => !c.id);

    // =========================
    // ✅ 4. UPDATE
    // =========================
    for (const c of updateList) {
      await client.query(`
        UPDATE course_contents SET
          type=$1,
          date=$2::date,
          topic=$3,
          hours=$4,
          instructor_id=$5,
          guest_teacher_name=$6,
          "order"=$7,
          exam_score=$8,
          work_score=$9,
          clo_ids=$10,
          llos=$11
        WHERE id=$12
      `, [
        c.type,
        c.date || null,
        c.topic || '',
        Number(c.hours || 0),
        c.instructor_id,
        c.guest_teacher_name,
        Number(c.order || 0),
        Number(c.examScore || 0),
        Number(c.workScore || 0),
        JSON.stringify(c.clo_ids || []),
        c.llos || '',
        Number(c.id)
      ]);
    }

    // =========================
    // ✅ 5. INSERT (bulk)
    // =========================
    if (insertList.length > 0) {
const values = [];
const params = [];
insertList.forEach((c, i) => {
  const base = i * 12;   // ✅ 1 row = 12 columns
  values.push(`(
    $${base + 1}, 
    $${base + 2}, 
    $${base + 3}::date, 
    $${base + 4}, 
    $${base + 5},
    $${base + 6}, 
    $${base + 7}, 
    $${base + 8}, 
    $${base + 9}, 
    $${base + 10},
    $${base + 11}, 
    $${base + 12}
  )`);
  params.push(
    course_instance_id,
    c.type,
    c.date || null,
    c.topic || '',
    Number(c.hours || 0),
    c.instructor_id,
    c.guest_teacher_name,
    Number(c.order || 0),
    Number(c.examScore || 0),
    Number(c.workScore || 0),
    JSON.stringify(c.clo_ids || []),
    c.llos || ''
  );
});
      await client.query(`
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
        VALUES ${values.join(', ')}
      `, params);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ CONTENTS ERROR:", err);
    throw err;
  } finally {
    client.release();
  }
};