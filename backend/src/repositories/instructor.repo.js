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

exports.getUserById = async (userId) => {
  const result = await pool.query(`
    SELECT
      id,
      can_edit_all_courses
    FROM users
    WHERE id = $1
  `, [userId]);
  return result.rows[0];
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
            'id', ci.id,
            'clo_id', ci.clo_id,
            'description', ci.description,
            'target', ci.target,
            'course_instance_id',
            ci.course_instance_id
          )
        ) FILTER (WHERE ci.id IS NOT NULL),
        '[]'
      ) AS indicators
    FROM clos c
    LEFT JOIN clo_indicators ci
      ON ci.clo_id = c.id
    WHERE c.course_instance_id = $1
    GROUP BY c.id
  `, [course_instance_id]);

for (const clo of result.rows) {
  // SubPLO
  const subploRes = await pool.query(`
      SELECT sub_plo_id
      FROM clo_subplo_mapping
      WHERE clo_id = $1
    `,[clo.id]);
  clo.subPloIds = subploRes.rows.map(r => r.sub_plo_id);

  // KSEC
  const ksecRes = await pool.query(`
      SELECT ksec_id
      FROM clo_ksec_mapping
      WHERE clo_id = $1
    `,[clo.id]);
  clo.ksecIds = ksecRes.rows.map(r => r.ksec_id);

  // Indicator Mapping
for (const indicator of clo.indicators) {
    const mapRes = await pool.query(`
        SELECT plo_indicator_id
        FROM clo_indicator_plo_indicator_mapping
        WHERE clo_indicator_id = $1
      `,[indicator.id]);
    indicator.ploIndicatorIds = mapRes.rows.map(r => r.plo_indicator_id);
  }
}
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
    await pool.query(`
  DELETE FROM clo_indicator_plo_indicator_mapping
  WHERE clo_indicator_id IN (
    SELECT id
    FROM clo_indicators
    WHERE clo_id = ANY($1::int[])
  )
`, [idsToDelete]);
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
if (c.id && existingIds.includes(Number(c.id))) {

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

  const currentIndicators = await pool.query(`
    SELECT id
    FROM clo_indicators
    WHERE clo_id = $1
  `, [c.id]);

  const existingIndicatorIds =
    currentIndicators.rows.map(
      r => Number(r.id)
    );

  const sentIndicatorIds =
    (c.indicators || [])
      .filter(ind => ind.id)
      .map(ind => Number(ind.id));

  const indicatorsToDelete =
    existingIndicatorIds.filter(
      id => !sentIndicatorIds.includes(id)
    );

  if (indicatorsToDelete.length > 0) {
await pool.query(`
  DELETE FROM
  clo_indicator_plo_indicator_mapping
  WHERE clo_indicator_id = ANY($1::int[])
`, [indicatorsToDelete]);
    await pool.query(`
      DELETE FROM clo_indicators
      WHERE id = ANY($1::int[])
    `, [indicatorsToDelete]);
  }

  for (const ind of (c.indicators || [])) {
    if (
      ind.id &&
      existingIndicatorIds.includes(
        Number(ind.id)
        )
      ) {
      await pool.query(`
        UPDATE clo_indicators
        SET
          description = $1,
          target = $2
        WHERE id = $3
      `, [
        ind.description,
        ind.target,
        ind.id
      ]);
      await pool.query(`
        DELETE FROM
        clo_indicator_plo_indicator_mapping
        WHERE clo_indicator_id = $1
        `, [ind.id]);
      for (const ploId of (ind.ploIndicatorIds || [])) 
        {
      await pool.query(`
        INSERT INTO
        clo_indicator_plo_indicator_mapping
        (
          clo_indicator_id,
          plo_indicator_id
        )
        VALUES ($1,$2)
        `, [ind.id, ploId]);
        }
    } else {
      await pool.query(`
        INSERT INTO clo_indicators
        (
          clo_id,
          description,
          target,
          course_instance_id
        )
        VALUES ($1,$2,$3,$4)
      `, [
        c.id,
        ind.description,
        ind.target,
        course_instance_id
      ]);
    }
  }
// save subplo
await pool.query(`
  DELETE FROM clo_subplo_mapping
  WHERE clo_id = $1
`, [c.id]);
for (const subPloId of (c.subPloIds || [])) {
  await pool.query(`
    INSERT INTO clo_subplo_mapping
    (
      clo_id,
      sub_plo_id
    )
    VALUES ($1,$2)
  `, [
    c.id,
    subPloId
  ]);
}
// save ksec
await pool.query(`
  DELETE FROM clo_ksec_mapping
  WHERE clo_id = $1
`, [c.id]);
for (const ksecId of (c.ksecIds || [])) {
  await pool.query(`
    INSERT INTO clo_ksec_mapping
    (
      clo_id,
      ksec_id
    )
    VALUES ($1,$2)
  `, [
    c.id,
    ksecId
  ]);
}
 
}

// ===== INSERT =====
else {
  const insert = await pool.query(`
    INSERT INTO clos
    (
      course_instance_id,
      code,
      description
    )
    VALUES ($1,$2,$3)
    RETURNING id
  `, [
    course_instance_id,
    c.code,
    c.description
  ]);

  const newId = insert.rows[0].id;
  for (const ind of (c.indicators || [])) 
  {
  const indicatorInsert = await pool.query(`
      INSERT INTO clo_indicators
      (
        clo_id,
        description,
        target,
        course_instance_id
      )
      VALUES ($1,$2,$3,$4)
    `, [
      newId,
      ind.description,
      ind.target,
      course_instance_id
    ]);
  const indicatorId = indicatorInsert.rows[0].id;  

  for (const ploId of (ind.ploIndicatorIds || []))  
    await pool.query(`
      INSERT INTO clo_indicator_plo_indicator_mapping
      (
        clo_indicator_id,
        plo_indicator_id
      )
      VALUES ($1,$2)
      `, [indicatorId, ploId]);
  }

}}};

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
          clo_ids=$8,
          activities=$9,
          llos=$10
        WHERE id=$11
      `, [
        c.type,
        c.date || null,
        c.topic || '',
        Number(c.hours || 0),
        c.instructor_id,
        c.guest_teacher_name,
        Number(c.order || 0),
        JSON.stringify(c.clo_ids || []),
        JSON.stringify(c.activities || []),
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
  const base = i * 11;   // ✅ 1 row = 12 columns
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
    $${base + 11} 
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
    JSON.stringify(c.clo_ids || []),
    JSON.stringify(c.activities || []),
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
          clo_ids,
          activities,
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