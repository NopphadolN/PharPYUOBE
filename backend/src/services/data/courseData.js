const pool = require('../../db');

const getCourseData = async (instanceId) => {

  const course = await pool.query(`
    SELECT c.*, ci.*
    FROM courses c
    JOIN course_instances ci ON c.id = ci.course_id
    WHERE ci.id = $1
  `, [instanceId]);

  const courseData = course.rows[0];

  let guestTeachers = courseData.guest_teachers;
if (typeof guestTeachers === 'string') {
  try {
    guestTeachers = JSON.parse(guestTeachers);
  } catch {
    guestTeachers = [];
  }
}

  const clos = await pool.query(`
    SELECT id, code, description
    FROM clos
    WHERE course_instance_id = $1
    ORDER BY code
  `, [instanceId]);

  const instructors = await pool.query(`
    SELECT u.id, u.name_th
    FROM course_instructors ci
    JOIN users u ON ci.user_id = u.id
    WHERE ci.course_instance_id = $1
  `, [instanceId]);
  
  const contentRes = await pool.query(`
  SELECT *
  FROM course_contents
  WHERE course_instance_id = $1
`, [instanceId]);

// ✅ parse clo_ids
const contents = contentRes.rows.map(c => ({
  ...c,
  clo_ids:
    typeof c.clo_ids === 'string'
      ? JSON.parse(c.clo_ids)
      : (c.clo_ids || [])
}));

// ✅ evaluations
const evalRes = await pool.query(`
  SELECT *
  FROM course_evaluations
  WHERE course_instance_id = $1
`, [instanceId]);

// ✅ parse JSON
const evaluations = evalRes.rows.map(e => ({
  ...e,

  content_ids_lecture:
    typeof e.content_ids_lecture === 'string'
      ? JSON.parse(e.content_ids_lecture)
      : (e.content_ids_lecture || []),

  content_ids_lab:
    typeof e.content_ids_lab === 'string'
      ? JSON.parse(e.content_ids_lab)
      : (e.content_ids_lab || [])
}));

// ✅ parse books
let books = courseData.books;
if (typeof books === 'string') {
  try { books = JSON.parse(books); } catch { books = []; }
}
// ✅ parse grading
let grading = courseData.grading;
if (typeof grading === 'string') {
  try { grading = JSON.parse(grading); } catch { grading = []; }
}
const note = courseData.note || '';
const revision_note = courseData.revision_note || '';

const subPlos = await getSubPlos();
const cloMappings = await getCloMappings(instanceId);

const indicatorRes = await pool.query(`
  SELECT *
  FROM clo_indicators
  WHERE course_instance_id = $1
`, [instanceId]);

const profileRes = await pool.query(`
  SELECT office, email, consultation_day, consultation_time
  FROM instructor_profiles
  WHERE user_id = $1
`, [courseData.owner_id]);

return {
  course: courseData,
  clos: clos.rows,
  courseContents: contents,
  courseEvaluations: evaluations,
  cloIndicators: indicatorRes.rows,
  instructors: instructors.rows,
  books,
  grading,
  note,
  revision_note,
  guestTeachers,
  owner_id: courseData.owner_id,
  instructorProfile: profileRes.rows[0] || null, 
  subPlos,
  cloMappings,
  appendPdf: courseData.append_pdf
};

};
// ✅ ดึง SubPLO
const getSubPlos = async () => {
  const res = await pool.query(`
    SELECT id, code, plo_id
    FROM sub_plos
    ORDER BY code
  `);
  return res.rows;
};

// ✅ ดึง mapping
const getCloMappings = async (instanceId) => {
  const res = await pool.query(`
    SELECT m.clo_id, m.sub_plo_id
    FROM clo_subplo_mapping m
    JOIN clos c ON m.clo_id = c.id
    WHERE c.course_instance_id = $1
  `, [instanceId]);
  const map = [];
  res.rows.forEach(r => {
    const found = map.find(m => m.cloId == r.clo_id);
    if (found) {
      found.subPloIds.push(String(r.sub_plo_id));
    } else {
      map.push({
        cloId: r.clo_id,
        subPloIds: [String(r.sub_plo_id)]
      });
    }
  });
  return map;
};

module.exports = { getCourseData };