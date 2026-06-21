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

  return {
  course: courseData,
  clos: clos.rows,
  contents,
  instructors: instructors.rows,
  books,
  grading,
  note,
  evaluations,
  guestTeachers,
  owner_id: courseData.owner_id
  };

};

module.exports = { getCourseData };